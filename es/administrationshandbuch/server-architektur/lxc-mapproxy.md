---
title: Contenedor MapProxy
description: Caché de teselas y proxy para entrega de mapas de alto rendimiento
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung: KI)"
  reviewDate: null
---

# LXC: MapProxy

## Información del Contenedor

```
Tipo: LXC (privilegiado/no privilegiado según configuración)
SO: Debian 13 (trixie)
Hostname: mapproxy (personalizable)
Estado: en ejecución

Recursos:
  RAM: 4 GB
  Disco: 38 GB (ampliable dinámicamente)
  CPU Shares: Estándar (1024)
```

## Software Instalado

### Python Runtime

```
Versión: Python 3.13.x (Repositorio Oficial de Debian)
Entorno Virtual: /opt/mapproxy/venv
Gestor de Paquetes: pip (Python Package Index)
```

### MapProxy

```
Versión: 4.x (Estable actual)
Instalación: Paquete Python vía pip
Servicio: mapproxy.service (systemd)
Servidor WSGI: Gunicorn
Workers: 4 (configurable)
```

### Gunicorn (Servidor WSGI)

```
Versión: 21.x (Servidor HTTP WSGI Python)
Binding: UNIX Socket + TCP (para desarrollo)
Process Manager: Modelo de worker Pre-fork
```

## Configuración del Servicio

### Servicio Systemd

```
# Comprobar estado del servicio
systemctl status mapproxy

# Reiniciar servicio (con tiempo de inactividad)
systemctl restart mapproxy

# Ver logs
journalctl -u mapproxy -f --no-pager

# Habilitar servicio (autoarranque)
systemctl enable mapproxy
```

### Configuración MapProxy

#### Configuración Principal (mapproxy.yaml)

```
# /etc/mapproxy/mapproxy.yaml
services:
  demo:
  wms:
    srs: ['EPSG:3857', 'EPSG:4326']
    image_formats: ['image/png', 'image/jpeg']
    max_output_pixels: [3000, 3000]
  kml:
    srs: 'EPSG:4326'
  tms:
    origin: 'nw'
  wmts:
    restful: true
    restful_template: '/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.{Format}'
    kvp: true

layers:
  - name: osm
    title: OpenStreetMap Tiles
    sources: [osm_cache]

  - name: geoserver_base
    title: GeoServer Base Layers
    sources: [geoserver_cache]

caches:
  osm_cache:
    grids: [webmercator]
    sources: [osm_tiles]
    cache:
      type: file
      directory: /cache/osm
      directory_layout: tms

  geoserver_cache:
    grids: [webmercator]
    sources: [geoserver_wms]
    cache:
      type: file
      directory: /cache/geoserver
      directory_layout: tms

sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator

  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

grids:
  webmercator:
    base: GLOBAL_WEBMERCATOR
    srs: 'EPSG:3857'
    origin: 'nw'

globals:
  cache:
    base_dir: '/cache'
    lock_dir: '/cache/locks'
  image:
    resampling_method: bilinear
```

## Acceso a Red

```
Escuchando: 
  - UNIX Socket: /run/mapproxy/mapproxy.sock
  - Puerto TCP 8080 (HTTP, LAN interna, Desarrollo)

Acceso vía Reverse Proxy:
  - tiles.data-dna.eu → Endpoints de teselas
  - proxy.data-dna.eu → Endpoints WMS

Reglas de Firewall:
  - Caddy (OPNSense) → MapProxy: PERMITIR
  - Frontend → MapProxy: PERMITIR (Solicitudes de teselas)
  - MapProxy → GeoServer: PERMITIR (Proxy WMS)
  - MapProxy → OSM-Tiler: PERMITIR (Renderizado de teselas)
  - Acceso Externo: DENEGAR (solo vía Caddy)
```

## Optimización de Rendimiento

### Configuración Gunicorn

```
# /etc/mapproxy/gunicorn.conf.py
bind = "unix:/run/mapproxy/mapproxy.sock"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/mapproxy/access.log"
errorlog = "/var/log/mapproxy/error.log"
loglevel = "info"
```

### Optimización de Caché

```
Almacenamiento de Caché:
  - Teselas OSM: ~20 GB (niveles de zoom preconfigurados)
  - Caché GeoServer: ~10 GB (crecimiento dinámico)
  - Espacio Temp: ~8 GB (para operaciones de renderizado)

Limpieza de Caché:
  - Limpieza automática de teselas antiguas
  - Política LRU (Least Recently Used)
  - Invalidación manual de caché en cambios de capa
```

## Estrategia de Backup

### Snapshot PBS (Nivel Contenedor)

  - **Programación**: Semanal
  - **Retención**: 4 semanas
  - **Tipo**: Snapshot LVM-Thin

### Backup de Configuración

```
# Backup manual de configuración
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Automatización vía Cronjob
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz" \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Eliminar backups antiguos (>90 días)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning Datos de Caché
Los datos de caché de MapProxy **no** se respaldan. Estos pueden regenerarse si es necesario. Solo la configuración es crítica.
:::

## Monitorización

### Comprobaciones de Salud

```
# Estado del servicio
curl -I http://localhost:8080/demo

# Probar solicitud de tesela
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# Capacidades WMS
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### Métricas de Rendimiento

```
# Uso de caché
du -sh /cache/osm/
du -sh /cache/geoserver/

# Estado worker Gunicorn
systemctl status mapproxy | grep "active (running)"

# Análisis de logs
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## Solución de Problemas

### MapProxy no arranca

```
# Comprobar logs systemd
journalctl -u mapproxy --no-pager -n 100

# Validación de configuración
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# Problemas de permisos
ls -la /run/mapproxy/
ls -la /cache/
```

### Errores de Renderizado de Teselas

```
# Conexión OSM-Tiler
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# Conexión GeoServer
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# Permisos directorio caché
ls -la /cache/osm/0/0/
```

### Problemas de Rendimiento

```
# Comprobar procesos worker
ps aux | grep gunicorn

# Uso de memoria
free -h

# Espacio en disco
df -h /cache
```

## Configuración de Seguridad

### Endurecimiento del Servicio

```
Aislamiento de Usuario:
  - Usuario Dedicado: mapproxy
  - Grupo: mapproxy
  - Directorio Home: /opt/mapproxy

Permisos de Archivos:
  - Archivos de Config: 640 (root:mapproxy)
  - Directorio Caché: 755 (mapproxy:mapproxy)
  - Archivos de Log: 644 (mapproxy:mapproxy)
```

### Seguridad de Red

```
Reglas de Firewall:
  - Solo servicios autorizados tienen acceso
  - Sin exposición directa a WAN
  - Reverse Proxy con limitación de tasa

TLS/SSL:
  - Vía proxy Caddy (Let's Encrypt)
  - Cabecera HSTS habilitada
  - Suites de Cifrado Modernas
```

## Integración con Arquitectura p2d2

### Integración Frontend

```
// Frontend AstroJS → Teselas MapProxy
const tileUrl = `https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png`;

// Integración Leaflet
const map = L.map('map').setView([51.0, 7.0], 10);
L.tileLayer(tileUrl, {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);
```

### Proxy GeoServer

```
# Proxy WMS para capa GeoServer
const wmsUrl = `https://proxy.data-dna.eu/service?` +
  `service=WMS&version=1.3.0&request=GetMap&` +
  `layers=geoserver_base&styles=&format=image/png&` +
  `transparent=true&width=256&height=256&` +
  `crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### Integración OSM-Tiler

```
# Solicitudes de teselas directas a OSM-Tiler
sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator
    transparent: true
    coverage:
      bbox: [-180, -85, 180, 85]
      srs: 'EPSG:4326'
```

## Características Avanzadas

### Seeding (Pre-renderizado)

```
# Seeding manual para áreas específicas
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 0-10 \
  --bbox 5.8,50.2,9.0,52.5

# Seeding automático vía Cron
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 11-14 \
  --bbox 6.0,50.5,7.5,51.5
```

### Gestión de Caché

```
# Estadísticas de caché
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  cache-stats osm_cache

# Limpieza de caché
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache osm_cache --max-age 30

# Invalidación de caché
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache geoserver_cache --all
```

## Buenas Prácticas

✅ **Hacer**:

  - Actualizaciones regulares de MapProxy (Parches de seguridad)
  - Monitorización de utilización de caché
  - Ajustar workers Gunicorn a núcleos CPU disponibles
  - Directorio caché en partición/volumen separado
  - Rotación de logs para logs de acceso/error

❌ **No Hacer**:

  - Exponer MapProxy directamente a Internet
  - Permitir almacenamiento caché ilimitado
  - Ejecutar sin limitación de tasa
  - Cambiar configuración sin backup
  - Retener datos caché antiguos indefinidamente

## Referencias

  - [Documentación MapProxy](https://mapproxy.org/docs/)
  - [Configuración Gunicorn](https://docs.gunicorn.org/en/stable/configure.html)
  - [Especificación Tile Map Service](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
  - [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.