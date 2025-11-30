---
title: MapProxy Container
description: Tile cache and proxy for performant map delivery
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# LXC: MapProxy

## Container Information

```
Type: LXC (privileged/unprivileged depending on setup)
OS: Debian 13 (trixie)
Hostname: mapproxy (customizable)
Status: running

Resources:
RAM: 4 GB
Disk: 38 GB (dynamically expandable)
CPU Shares: Standard (1024)
```

## Installed Software

### Python Runtime
```
Version: Python 3.13.x (Debian Official Repository)
Virtual Environment: /opt/mapproxy/venv
Package Manager: pip (Python Package Index)
```

### MapProxy
```
Version: 4.x (current Stable)
Installation: Python Package via pip
Service: mapproxy.service (systemd)
WSGI Server: Gunicorn
Workers: 4 (configurable)
```

### Gunicorn (WSGI Server)
```
Version: 21.x (Python WSGI HTTP Server)
Binding: UNIX Socket + TCP (for Development)
Process Manager: Pre-fork Worker Model
```

## Service Configuration

### Systemd Service
```
# Check service status
systemctl status mapproxy

# Restart service (with downtime)
systemctl restart mapproxy

# View logs
journalctl -u mapproxy -f --no-pager

# Enable service (autostart)
systemctl enable mapproxy
```

### MapProxy Configuration

#### Main Configuration (mapproxy.yaml)
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

## Network Access

```
Listening:
- UNIX Socket: /run/mapproxy/mapproxy.sock
- TCP Port 8080 (HTTP, internal LAN, Development)

Access via Reverse Proxy:
- tiles.data-dna.eu → Tile Endpoints
- proxy.data-dna.eu → WMS Endpoints

Firewall Rules:
- Caddy (OPNSense) → MapProxy: ALLOW
- Frontend → MapProxy: ALLOW (Tile Requests)
- MapProxy → GeoServer: ALLOW (WMS Proxy)
- MapProxy → OSM-Tiler: ALLOW (Tile Rendering)
- External Access: DENY (only via Caddy)
```

## Performance Optimization

### Gunicorn Configuration
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

### Cache Optimization
```
Cache Storage:
- OSM Tiles: ~20 GB (pre-configured zoom levels)
- GeoServer Cache: ~10 GB (dynamically growing)
- Temp Space: ~8 GB (for rendering operations)

Cache Cleaning:
- Automatic cleaning of old tiles
- LRU (Least Recently Used) Policy
- Manual cache invalidation on layer changes
```

## Backup Strategy

### PBS Snapshot (Container-Level)
- **Schedule**: Weekly
- **Retention**: 4 weeks
- **Type**: LVM-Thin Snapshot

### Configuration Backup
```
# Manual configuration backup
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz  
/etc/mapproxy/  
/opt/mapproxy/

# Automation via Cronjob
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz"  
/etc/mapproxy/  
/opt/mapproxy/

# Delete old backups (>90 days)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning Cache Data
MapProxy cache data is **not** backed up. It can be re-rendered if needed. Only the configuration is critical.
:::

## Monitoring

### Health Checks
```
# Service Status
curl -I http://localhost:8080/demo

# Test Tile Request
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# WMS Capabilities
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### Performance Metrics
```
# Cache Usage
du -sh /cache/osm/
du -sh /cache/geoserver/

# Gunicorn Worker Status
systemctl status mapproxy | grep "active (running)"

# Log Analysis
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## Troubleshooting

### MapProxy does not start
```
# Check systemd logs
journalctl -u mapproxy --no-pager -n 100

# Configuration validation
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# Permission Issues
ls -la /run/mapproxy/
ls -la /cache/
```

### Tile Rendering Errors
```
# OSM Tiler Connection
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# GeoServer Connection
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# Cache Directory Permissions
ls -la /cache/osm/0/0/
```

### Performance Problems
```
# Check worker processes
ps aux | grep gunicorn

# Memory Usage
free -h

# Disk Space
df -h /cache
```

## Security Configuration

### Service Hardening
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

### Network Security
```
Firewall Rules:
- Only authorized services have access
- No direct WAN exposure
- Reverse Proxy with Rate Limiting

TLS/SSL:
- Via Caddy proxy (Let's Encrypt)
- HSTS Header enabled
- Modern Cipher Suites
```

## Integration with p2d2 Architecture

### Frontend Integration
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

### GeoServer Proxy
```
# WMS Proxy for GeoServer Layer
const wmsUrl = `https://proxy.data-dna.eu/service?` +
`service=WMS&version=1.3.0&request=GetMap&` +
`layers=geoserver_base&styles=&format=image/png&` +
`transparent=true&width=256&height=256&` +
`crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### OSM Tiler Integration
```
# Direct Tile Requests to OSM Tiler
sources:
osm_tiles:
type: tile
url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
grid: webmercator
transparent: false
coverage:
bbox: [5.8, 47.2, 15.0, 55.0]  # Germany BBOX
srs: 'EPSG:4326'

caches:
osm_cache:
grids: [webmercator]
sources: [osm_tiles]
cache:
type: file
directory: /cache/osm
directory_layout: tms
```

## Advanced Features

### Seeding (Pre-rendering)
```
# Manual seeding for specific areas
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml  
-c osm_cache  
--grid webmercator  
--levels 0-10  
--bbox 5.8,50.2,9.0,52.5

# Automatic seeding via Cron
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml  
-c osm_cache  
--grid webmercator  
--levels 11-14  
--bbox 6.0,50.5,7.5,51.5
```

### Cache Management
```
# Cache Statistics
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml  
cache-stats osm_cache

# Cache Cleaning
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml  
clean-cache osm_cache --max-age 30

# Cache Invalidation
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml  
clean-cache geoserver_cache --all
```

## Best Practices

✅ **Do**:
- Regular MapProxy updates (Security Patches)
- Monitor cache utilization
- Adjust Gunicorn workers to available CPU cores
- Place cache directory on a separate partition/volume
- Log rotation for Access/Error logs

❌ **Don't**:
- Expose MapProxy directly to the internet
- Allow unlimited cache storage
- Run without rate limiting
- Change configuration without backup
- Keep old cache data indefinitely

## References

- [MapProxy Documentation](https://mapproxy.org/docs/)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/configure.html)
- [Tile Map Service Specification](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
- [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)