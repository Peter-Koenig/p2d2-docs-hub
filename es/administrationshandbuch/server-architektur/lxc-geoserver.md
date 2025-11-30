---
title: Contenedor GeoServer
description: Servidor WFS/WMS para servicios de geodatos
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC: GeoServer

## Información del Contenedor

```
Tipo: LXC (privilegiado/no privilegiado según configuración)
SO: Debian 13 (trixie)
Hostname: geoserver (personalizable)
Estado: en ejecución

Recursos:
  RAM: 6 GB
  Disco: 12 GB (ampliable dinámicamente)
  CPU Shares: Estándar (1024)
```

## Software Instalado

### Java Runtime

```
Versión: OpenJDK 17 (LTS)
Opciones JVM: Optimizadas para carga de trabajo de GeoServer
Memoria: 4 GB Heap (Xmx), 512 MB PermGen
```

### Contenedor de Servlets Tomcat

```
Versión: 9.x (Repositorio Oficial de Debian)
Servicio: tomcat9.service (systemd)
Webroot: /var/lib/tomcat9/webapps/geoserver
Puerto: 8080 (HTTP), 8443 (HTTPS opcional)
```

### GeoServer

```
Versión: 2.x (Estable actual)
Instalación: Archivo WAR en Tomcat
Context-Path: /geoserver
Interfaz de Admin: /geoserver/web
```

## Configuración del Servicio

### Servicio Systemd

```
# Comprobar estado del servicio
systemctl status tomcat9

# Reiniciar servicio (con tiempo de inactividad)
systemctl restart tomcat9

# Ver logs
journalctl -u tomcat9 -f --no-pager

# Habilitar servicio (autoarranque)
systemctl enable tomcat9
```

### Configuración de Tomcat

```
# Configuración del servidor
/etc/tomcat9/server.xml
  - Puerto Conector: 8080
  - Conector AJP: Deshabilitado (Seguridad)
  - SSL/TLS: Opcional (vía proxy Caddy)

# Configuración de la aplicación
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## Características de GeoServer

### Protocolos Soportados

```
WMS (Web Map Service): Renderizado de mapas
  - Versión: 1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service): Datos vectoriales
  - Versión: 1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactional): Acceso de escritura
  - Operaciones Insert, Update, Delete
  - Para persistencia de datos del frontend p2d2

WMTS (Web Map Tile Service): Opcional
```

### Configuración de Fuentes de Datos

#### Conexión PostgreSQL/PostGIS

```
Parámetros de Conexión:
  - Host: postgresql.lan (DNS interno)
  - Base de Datos: data-dna
  - Esquema: public
  - Usuario: geoserver (usuario dedicado)

Almacén PostGIS:
  - Límites Estimados: Auto-calcular
  - Exponer Claves Primarias: Habilitado
  - Declaraciones Preparadas: Habilitado (Rendimiento)
```

#### Publicación de Capas

```
Capas Publicadas:
  - kommunen (geometrías Polygon)
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - Capas personalizadas según importación de datos

Estilo (SLD):
  - Estilos estándar para diferentes tipos de geometría
  - SLD personalizado para representaciones especiales
  - Clasificación basada en reglas
```

## Acceso a Red

```
Escuchando: 
  - Puerto TCP 8080 (HTTP, LAN interna)
  - Sin exposición directa a WAN

Acceso vía Reverse Proxy:
  - ows.data-dna.eu → Endpoints WMS/WFS
  - wfs.data-dna.eu → Endpoints WFS-T (Frontend)

Reglas de Firewall:
  - Caddy (OPNSense) → GeoServer: PERMITIR
  - Frontend → GeoServer: PERMITIR (WFS-T)
  - MapProxy → GeoServer: PERMITIR (WMS)
  - Acceso Externo: DENEGAR (solo vía Caddy)
```

## Optimización de Rendimiento

### Opciones JVM (setenv.sh)

```
# /usr/share/tomcat9/bin/setenv.sh
export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### Configuración de GeoServer

```
# /var/lib/geoserver/data/global.xml

<global>
  <settings>
    <proxyBaseUrl>https://ows.data-dna.eu/geoserver</proxyBaseUrl>
    <useHeadersProxyURL>false</useHeadersProxyURL>
    <verbose>false</verbose>
    <verboseExceptions>false</verboseExceptions>
    <maxFeatures>10000</maxFeatures>
    <numDecimals>8</numDecimals>
  </settings>
</global>
```

### Configuración GWC (GeoWebCache)

```
Configuración de Caché:
  - Cuota de Disco: 2 GB (limitada por disco de contenedor)
  - Capas de Teselas: Automático para capas WMS
  - Subconjuntos de Rejilla: WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - Meta-Tiling: 4x4 (Rendimiento vs Calidad)
```

## Estrategia de Backup

### Snapshot PBS (Nivel Contenedor)

  - **Programación**: Semanal
  - **Retención**: 4 semanas
  - **Tipo**: Snapshot LVM-Thin

### Backup de Configuración de GeoServer

```
# Backup manual de configuración
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz \
  /var/lib/geoserver/data/

# Automatización vía Cronjob
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz" \
  /var/lib/geoserver/data/

# Eliminar backups antiguos (>90 días)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip Portabilidad de Configuración
Los backups de configuración de GeoServer son específicos de la versión. Para actualizaciones mayores, exportar/importar configuración vía UI de GeoServer.
:::

## Monitorización

### Comprobaciones de Salud

```
# Estado del servicio
curl -I http://localhost:8080/geoserver/web

# Capacidades WMS
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# Lista de capas
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### Análisis de Logs

```
# Logs de Tomcat
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# Logs de GeoServer
tail -f /var/lib/geoserver/data/logs/geoserver.log

# Métricas de rendimiento
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## Solución de Problemas

### GeoServer no arranca

```
# Comprobar logs de Tomcat
journalctl -u tomcat9 --no-pager -n 100

# Permisos de Directorio de Datos de GeoServer
ls -la /var/lib/geoserver/data/

# Problemas de Memoria JVM
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### Mensajes de Error WMS/WFS

```
# Capa no disponible
- Comprobar Conexión de Almacén de Datos
- Probar conexión PostgreSQL
- Permisos de capa en GeoServer

# Problemas de rendimiento
- Aumentar Tamaño de Heap JVM
- Comprobar índices PostGIS
- Habilitar caché GWC
```

### Conexión a PostgreSQL

```
# Probar desde contenedor GeoServer
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# Conectividad de Red
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## Configuración de Seguridad

### Seguridad de GeoServer

```
Usuario Admin: 
  - Nombre de Usuario: admin (cambiar en producción)
  - Contraseña: <STRONG_PASSWORD> (no por defecto)

Acceso Basado en Roles:
  - ADMIN_ROLE: Acceso total
  - GROUP_ADMIN: Gestión de capas
  - WMS_USER: Acceso de solo lectura
  - WFS_USER: Acceso a features

Seguridad de Datos:
  - Permisos a Nivel de Capa
  - Aislamiento de Espacio de Trabajo
  - Límites de Servicio OGC
```

### Seguridad de Red

```
Reglas de Firewall:
  - Solo proxy Caddy tiene acceso (Reverse Proxy)
  - Sin exposición directa a WAN
  - Comunicación interna solo con servicios autorizados

TLS/SSL:
  - Vía proxy Caddy (Let's Encrypt)
  - Cabecera HSTS habilitada
  - Suites de Cifrado Modernas
```

## Integración con Arquitectura p2d2

### Integración Frontend (WFS-T)

```
// Frontend AstroJS → GeoServer WFS-T
const wfsTransaction = `
<wfs:Transaction service="WFS" version="2.0.0"
  xmlns:wfs="http://www.opengis.net/wfs/2.0"
  xmlns:gml="http://www.opengis.net/gml/3.2">
  <wfs:Insert>
    <feature:gebaeude xmlns:feature="http://www.data-dna.eu/features">
      <feature:geom>
        <gml:Point srsName="EPSG:4326">
           <gml:pos>7.0 51.0</gml:pos>
        </gml:Point>
      </feature:geom>
    </feature:gebaeude>
  </wfs:Insert>
</wfs:Transaction>`;

// HTTP POST a GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: wfsTransaction
});
```

### Integración MapProxy (WMS)

```
# Configuración MapProxy
sources:
  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

caches:
  geoserver_cache:
    sources: [geoserver_wms]
    grids: [webmercator]
    cache:
      type: file
      directory: /cache/geoserver
```

## Buenas Prácticas

✅ **Hacer**:

  - Actualizaciones regulares de GeoServer (Parches de seguridad)
  - Usuarios separados para diferentes niveles de acceso
  - Caché GWC para capas frecuentemente solicitadas
  - Monitorización de rendimiento JVM (Uso de Heap)
  - Backup de configuración de GeoServer

❌ **No Hacer**:

  - Usar contraseñas por defecto
  - Exponer GeoServer directamente a internet
  - Permitir MaxFeatures ilimitados
  - Ejecutar sin límites de recursos
  - Cambiar configuración sin backup

## Referencias

  - [Documentación de GeoServer](https://docs.geoserver.org/)
  - [Seguridad de GeoServer](https://docs.geoserver.org/stable/en/user/security/)
  - [Especificación WFS-T](https://www.ogc.org/standards/wfs)
  - [Administración de Tomcat 9](https://tomcat.apache.org/tomcat-9.0-doc/)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.