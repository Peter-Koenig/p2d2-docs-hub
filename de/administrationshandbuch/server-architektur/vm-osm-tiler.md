---
title: OSM-Tileserver
description: OpenStreetMap Tile-Rendering Server für p2d2-Infrastruktur
---

# VM: OSM-Tileserver

## VM-Informationen

```
Typ: Virtual Machine (KVM/QEMU)
OS: Debian 13 (trixie)
Hostname: osm-tiler (anpassbar)
Status: running

Ressourcen:
  vCPUs: 4
  RAM: 6 GB
  Disk: 65 GB (dynamisch erweiterbar)
```

## Installierte Software

### Docker Runtime
```
Version: Docker Engine 24.x
Container Runtime: containerd
Compose: Docker Compose 2.x
```

### Tile-Server Stack
```
OpenStreetMap Data: Planet OSM Extract
PostgreSQL Client: Für Geodaten-Zugriff
Tile Server: Docker-basierte Lösung
Rendering: Mapnik + mod_tile
```

## Service-Architektur

### Docker Compose Setup

```
# /opt/osm-tileserver/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: gis
      POSTGRES_USER: renderer
      POSTGRES_PASSWORD: <RENDERER_PASSWORD>
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  render:
    image: overv/openstreetmap-tile-server:2.x
    environment:
      THREADS: 4
      OSM2PGSQL_EXTRA_ARGS: "--flat-nodes /nodes/flat_nodes.bin"
    volumes:
      - tiles-data:/var/lib/mod_tile
      - ./data:/data
    ports:
      - "8080:80"
    depends_on:
      - postgres

volumes:
  postgres-data:
  tiles-data:
```

### Daten-Import

```
# OSM Data Import (einmalig)
docker-compose run --rm render import

# Region-spezifischer Import
wget https://download.geofabrik.de/europe/germany-latest.osm.pbf
docker-compose run --rm render import /data/germany-latest.osm.pbf

# Update-Prozess
docker-compose run --rm render import /data/germany-latest.osm.pbf --append
```

## Netzwerk-Zugang

```
Listening: 
  - TCP Port 8080 (HTTP, internes LAN)
  - TCP Port 5432 (PostgreSQL, internes LAN)

Zugriff via MapProxy:
  - MapProxy → OSM-Tiler: ALLOW (Tile-Requests)
  - Keine direkte WAN-Exposition

Firewall-Regeln:
  - MapProxy → OSM-Tiler: ALLOW (Port 8080)
  - PostgreSQL Client → OSM-Tiler: ALLOW (Port 5432)
  - Externer Zugriff: DENY (nur via MapProxy)
```

## Performance-Optimierung

### Rendering-Konfiguration

```
# renderd.conf (mod_tile)
[renderd]
num_threads=4
tile_dir=/var/lib/mod_tile

[mapnik]
plugins_dir=/usr/lib/mapnik/3.1/input
font_dir=/usr/share/fonts/truetype
font_dir_recurse=true

[default]
URI=/tiles/
XML=/usr/share/openstreetmap-carto/style.xml
HOST=localhost
TILESIZE=256
```

### PostgreSQL-Optimierung

```
# postgresql.conf (im Container)
shared_buffers = 2GB
work_mem = 16MB
maintenance_work_mem = 512MB
effective_cache_size = 4GB
random_page_cost = 1.1
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## Backup-Strategie

### PBS-Snapshot (VM-Level)
- **Zeitplan**: Monatlich
- **Retention**: 3 Monate
- **Typ**: QEMU Snapshot

### Daten-Backup (Optional)

```
# OSM-Daten Backup
docker-compose exec postgres pg_dump -U renderer gis | gzip > /backup/osm-data_$(date +%Y%m%d).sql.gz

# Tile-Cache Backup (nur bei kritischen Änderungen)
tar -czf /backup/tile-cache_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/osm-tileserver_tiles-data/
```

::: warning Große Datenmengen
OSM-Tile-Daten sind sehr groß (~60 GB). Backups sollten nur bei kritischen Änderungen durchgeführt werden. Normalerweise können Tiles bei Bedarf neu gerendert werden.
:::

## Monitoring

### Health-Checks

```
# Service-Status
docker-compose ps

# Tile-Rendering testen
curl -I "http://localhost:8080/tiles/0/0/0.png"

# PostgreSQL Connection
docker-compose exec postgres psql -U renderer -d gis -c "SELECT version();"

# Disk Usage
df -h /var/lib/docker/volumes/
```

### Performance-Metriken

```
# Rendering-Statistiken
docker-compose logs render | grep "Rendering"

# PostgreSQL Performance
docker-compose exec postgres psql -U renderer -d gis -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Cache-Hit-Rate
find /var/lib/docker/volumes/osm-tileserver_tiles-data/ -name "*.png" | wc -l
```

## Troubleshooting

### Rendering-Probleme

```
# Docker-Logs prüfen
docker-compose logs render
docker-compose logs postgres

# Mapnik-Konfiguration testen
docker-compose exec render renderd -f -c /usr/local/etc/renderd.conf

# Datenbank-Verbindung
docker-compose exec render psql -h postgres -U renderer -d gis
```

### Performance-Probleme

```
# Memory Usage
docker stats

# Disk I/O
iostat -x 1

# Network Connectivity
ping mapproxy.lan
telnet mapproxy.lan 8080
```

### Daten-Update-Probleme

```
# OSM-Daten aktualisieren
wget -O /data/germany-update.osm.pbf https://download.geofabrik.de/europe/germany-updates/$(date +%Y-%m-%d).osm.pbf
docker-compose run --rm render import /data/germany-update.osm.pbf --append

# Bei Fehlern: Vollständiger Re-Import
docker-compose down
docker volume rm osm-tileserver_postgres-data
docker-compose up -d
docker-compose run --rm render import /data/germany-latest.osm.pbf
```

## Sicherheits-Konfiguration

### Docker-Hardening

```
Container Isolation:
  - Read-only Root Filesystem (wo möglich)
  - Non-root User für Services
  - Resource Limits (CPU, Memory)
  - Network Segmentation

Volume Security:
  - Named Volumes für persistente Daten
  - Keine Host-Path Mounts (wo möglich)
  - Backup-Strategie für kritische Daten
```

### Netzwerk-Sicherheit

```
Firewall-Regeln:
  - Nur autorisierte Services haben Zugriff
  - Keine direkte WAN-Exposition
  - Interne Kommunikation nur mit MapProxy

Service-Hardening:
  - PostgreSQL nur im internen Netzwerk
  - Keine Admin-Interfaces exponiert
  - Regelmäßige Security-Updates
```

## Integration mit p2d2-Architektur

### MapProxy-Konfiguration

```
# In MapProxy mapproxy.yaml
sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator
    transparent: false
    coverage:
      bbox: [5.8, 47.2, 15.0, 55.0]  # Deutschland BBOX
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

### Frontend-Integration

```
// AstroJS Frontend → MapProxy → OSM-Tiler
const baseLayer = L.tileLayer(
  'https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
    minZoom: 0
  }
);
```

## Best Practices

✅ **Do**:
- Regelmäßige Docker Image Updates
- Monitoring der Disk-Auslastung
- Resource Limits für Container setzen
- Backup der PostgreSQL-Daten bei kritischen Änderungen
- Region-spezifische OSM-Daten verwenden (nicht gesamter Planet)

❌ **Don't**:
- OSM-Tiler direkt im Internet exponieren
- Unbegrenzte Ressourcen erlauben
- Ohne Monitoring laufen lassen
- Große OSM-Daten-Imports ohne Testing
- Production-Änderungen ohne Backup

## Referenzen

- [OpenStreetMap Tile Server](https://github.com/Overv/openstreetmap-tile-server)
- [Docker Documentation](https://docs.docker.com/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Mapnik Rendering Engine](https://mapnik.org/)