---
title: MapProxy Container
description: Tile-Cache und Proxy für performante Kartenauslieferung
---

# LXC: MapProxy

## Container-Informationen

```
Typ: LXC (privileged/unprivileged je nach Setup)
OS: Debian 13 (trixie)
Hostname: mapproxy (anpassbar)
Status: running

Ressourcen:
  RAM: 4 GB
  Disk: 38 GB (dynamisch erweiterbar)
  CPU Shares: Standard (1024)
```

## Installierte Software

### Python Runtime
```
Version: Python 3.13.x (Debian Official Repository)
Virtual Environment: /opt/mapproxy/venv
Package Manager: pip (Python Package Index)
```

### MapProxy
```
Version: 4.x (aktuelle Stable)
Installation: Python Package via pip
Service: mapproxy.service (systemd)
WSGI Server: Gunicorn
Workers: 4 (konfigurierbar)
```

### Gunicorn (WSGI Server)
```
Version: 21.x (Python WSGI HTTP Server)
Binding: UNIX Socket + TCP (für Development)
Process Manager: Pre-fork Worker Model
```

## Service-Konfiguration

### Systemd-Service
```
# Service-Status prüfen
systemctl status mapproxy

# Service neu starten (mit Downtime)
systemctl restart mapproxy

# Logs anzeigen
journalctl -u mapproxy -f --no-pager

# Service enablen (Autostart)
systemctl enable mapproxy
```

### MapProxy Konfiguration

#### Hauptkonfiguration (mapproxy.yaml)
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

## Netzwerk-Zugang

```
Listening: 
  - UNIX Socket: /run/mapproxy/mapproxy.sock
  - TCP Port 8080 (HTTP, internes LAN, Development)

Zugriff via Reverse Proxy:
  - tiles.data-dna.eu → Tile-Endpoints
  - proxy.data-dna.eu → WMS-Endpoints

Firewall-Regeln:
  - Caddy (OPNSense) → MapProxy: ALLOW
  - Frontend → MapProxy: ALLOW (Tile-Requests)
  - MapProxy → GeoServer: ALLOW (WMS-Proxy)
  - MapProxy → OSM-Tiler: ALLOW (Tile-Rendering)
  - Externer Zugriff: DENY (nur via Caddy)
```

## Performance-Optimierung

### Gunicorn-Konfiguration
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

### Cache-Optimierung
```
Cache-Speicher:
  - OSM Tiles: ~20 GB (vorkonfigurierte Zoom-Levels)
  - GeoServer Cache: ~10 GB (dynamisch wachsend)
  - Temp Space: ~8 GB (für Rendering-Operationen)

Cache-Cleaning:
  - Automatische Bereinigung alter Tiles
  - LRU (Least Recently Used) Policy
  - Manuelle Cache-Invalidierung bei Layer-Änderungen
```

## Backup-Strategie

### PBS-Snapshot (Container-Level)
- **Zeitplan**: Wöchentlich
- **Retention**: 4 Wochen
- **Typ**: LVM-Thin Snapshot

### Konfigurations-Backup
```
# Manuelles Backup der Konfiguration
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Automatisierung via Cronjob
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz" \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Alte Backups löschen (>90 Tage)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning Cache-Daten
MapProxy-Cache-Daten werden **nicht** gesichert. Diese können bei Bedarf neu gerendert werden. Kritisch ist nur die Konfiguration.
:::

## Monitoring

### Health-Checks
```
# Service-Status
curl -I http://localhost:8080/demo

# Tile-Request testen
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# WMS-Capabilities
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### Performance-Metriken
```
# Cache-Usage
du -sh /cache/osm/
du -sh /cache/geoserver/

# Gunicorn Worker Status
systemctl status mapproxy | grep "active (running)"

# Log-Analyse
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## Troubleshooting

### MapProxy startet nicht
```
# Systemd-Logs prüfen
journalctl -u mapproxy --no-pager -n 100

# Konfigurations-Validierung
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# Permission Issues
ls -la /run/mapproxy/
ls -la /cache/
```

### Tile-Rendering-Fehler
```
# OSM-Tiler Connection
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# GeoServer Connection
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# Cache-Directory Permissions
ls -la /cache/osm/0/0/
```

### Performance-Probleme
```
# Worker-Prozesse prüfen
ps aux | grep gunicorn

# Memory Usage
free -h

# Disk Space
df -h /cache
```

## Sicherheits-Konfiguration

### Service-Hardening
```
User Isolation:
  - Dedicated User: mapproxy
  - Group: mapproxy
  - Home Directory: /opt/mapproxy

File Permissions:
  - Config Files: 640 (root:mapproxy)
  - Cache Directory: 755 (mapproxy:mapproxy)
  - Log Files: 644 (mapproxy:mapproxy)
```

### Netzwerk-Sicherheit
```
Firewall-Regeln:
  - Nur autorisierte Services haben Zugriff
  - Keine direkte WAN-Exposition
  - Reverse Proxy mit Rate-Limiting

TLS/SSL:
  - Via Caddy-Proxy (Let's Encrypt)
  - HSTS Header aktiviert
  - Modern Cipher Suites
```

## Integration mit p2d2-Architektur

### Frontend-Integration
```
// AstroJS Frontend → MapProxy Tiles
const tileUrl = `https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png`;

// Leaflet Integration
const map = L.map('map').setView([51.0, 7.0], 10);
L.tileLayer(tileUrl, {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);
```

### GeoServer-Proxy
```
# WMS-Proxy für GeoServer Layer
const wmsUrl = `https://proxy.data-dna.eu/service?` +
  `service=WMS&version=1.3.0&request=GetMap&` +
  `layers=geoserver_base&styles=&format=image/png&` +
  `transparent=true&width=256&height=256&` +
  `crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### OSM-Tiler Integration
```
# Direkte Tile-Requests an OSM-Tiler
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

## Erweiterte Features

### Seeding (Vorab-Rendering)
```
# Manuelles Seeding für bestimmte Bereiche
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 0-10 \
  --bbox 5.8,50.2,9.0,52.5

# Automatisches Seeding via Cron
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 11-14 \
  --bbox 6.0,50.5,7.5,51.5
```

### Cache-Management
```
# Cache-Statistics
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  cache-stats osm_cache

# Cache-Cleaning
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache osm_cache --max-age 30

# Cache-Invalidierung
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache geoserver_cache --all
```

## Best Practices

✅ **Do**:
- Regelmäßige MapProxy-Updates (Security-Patches)
- Monitoring der Cache-Auslastung
- Gunicorn Worker an verfügbare CPU-Cores anpassen
- Cache-Directory auf separater Partition/Volume
- Log-Rotation für Access/Error Logs

❌ **Don't**:
- MapProxy direkt im Internet exponieren
- Unbegrenzten Cache-Speicher erlauben
- Ohne Rate-Limiting laufen lassen
- Konfiguration ohne Backup ändern
- Alte Cache-Daten unbegrenzt behalten

## Referenzen

- [MapProxy Dokumentation](https://mapproxy.org/docs/)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/configure.html)
- [Tile Map Service Specification](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
- [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)