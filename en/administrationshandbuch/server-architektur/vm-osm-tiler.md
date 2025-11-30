---
title: OSM Tileserver
description: OpenStreetMap Tile Rendering Server for p2d2 infrastructure
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# VM: OSM Tileserver

## VM Information

```
Type: Virtual Machine (KVM/QEMU)
OS: Debian 13 (trixie)
Hostname: osm-tiler (customizable)
Status: running

Resources:
vCPUs: 4
RAM: 6 GB
Disk: 65 GB (dynamically expandable)
```

## Installed Software

### Docker Runtime
```
Version: Docker Engine 24.x
Container Runtime: containerd
Compose: Docker Compose 2.x
```

### Tile Server Stack
```
OpenStreetMap Data: Planet OSM Extract
PostgreSQL Client: For geodata access
Tile Server: Docker-based solution
Rendering: Mapnik + mod_tile
```

## Service Architecture

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

### Data Import

```
# OSM Data Import (one-time)
docker-compose run --rm render import

# Region-specific Import
wget https://download.geofabrik.de/europe/germany-latest.osm.pbf
docker-compose run --rm render import /data/germany-latest.osm.pbf

# Update process
docker-compose run --rm render import /data/germany-latest.osm.pbf --append
```

## Network Access

```
Listening:
- TCP Port 8080 (HTTP, internal LAN)
- TCP Port 5432 (PostgreSQL, internal LAN)

Access via MapProxy:
- MapProxy → OSM-Tiler: ALLOW (Tile Requests)
- No direct WAN exposure

Firewall Rules:
- MapProxy → OSM-Tiler: ALLOW (Port 8080)
- PostgreSQL Client → OSM-Tiler: ALLOW (Port 5432)
- External Access: DENY (only via MapProxy)
```

## Performance Optimization

### Rendering Configuration

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

### PostgreSQL Optimization

```
# postgresql.conf (in container)

shared_buffers = 2GB
work_mem = 16MB
maintenance_work_mem = 512MB
effective_cache_size = 4GB
random_page_cost = 1.1
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## Backup Strategy

### PBS Snapshot (VM-Level)
- **Schedule**: Monthly
- **Retention**: 3 months
- **Type**: QEMU Snapshot

### Data Backup (Optional)

```
# OSM Data Backup
docker-compose exec postgres pg_dump -U renderer gis | gzip > /backup/osm-data_$(date +%Y%m%d).sql.gz

# Tile Cache Backup (only for critical changes)
tar -czf /backup/tile-cache_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/osm-tileserver_tiles-data/
```

::: warning Large Data Volumes
OSM tile data is very large (~60 GB). Backups should only be performed for critical changes. Normally, tiles can be re-rendered on demand.
:::

## Monitoring

### Health Checks

```
# Service Status
docker-compose ps

# Test Tile Rendering
curl -I "http://localhost:8080/tiles/0/0/0.png"

# PostgreSQL Connection
docker-compose exec postgres psql -U renderer -d gis -c "SELECT version();"

# Disk Usage
df -h /var/lib/docker/volumes/
```

### Performance Metrics

```
# Rendering Statistics
docker-compose logs render | grep "Rendering"

# PostgreSQL Performance
docker-compose exec postgres psql -U renderer -d gis -c "
SELECT schemaname, tablename,
pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Cache Hit Rate
find /var/lib/docker/volumes/osm-tileserver_tiles-data/ -name "*.png" | wc -l
```

## Troubleshooting

### Rendering Problems

```
# Check Docker logs
docker-compose logs render
docker-compose logs postgres

# Test Mapnik configuration
docker-compose exec render renderd -f -c /usr/local/etc/renderd.conf

# Database connection
docker-compose exec render psql -h postgres -U renderer -d gis
```

### Performance Problems

```
# Memory Usage
docker stats

# Disk I/O
iostat -x 1

# Network Connectivity
ping mapproxy.lan
telnet mapproxy.lan 8080
```

### Data Update Problems

```
# Update OSM data
wget -O /data/germany-update.osm.pbf https://download.geofabrik.de/europe/germany-updates/$(date +%Y-%m-%d).osm.pbf
docker-compose run --rm render import /data/germany-update.osm.pbf --append

# On errors: Full re-import
docker-compose down
docker volume rm osm-tileserver_postgres-data
docker-compose up -d
docker-compose run --rm render import /data/germany-latest.osm.pbf
```

## Security Configuration

### Docker Hardening

```
Container Isolation:
- Read-only Root Filesystem (where possible)
- Non-root User for services
- Resource Limits (CPU, Memory)
- Network Segmentation

Volume Security:
- Named Volumes for persistent data
- No Host-Path Mounts (where possible)
- Backup strategy for critical data
```

### Network Security

```
Firewall Rules:
- Only authorized services have access
- No direct WAN exposure
- Internal communication only with MapProxy

Service Hardening:
- PostgreSQL only on the internal network
- No admin interfaces exposed
- Regular security updates
```

## Integration with p2d2 Architecture

### MapProxy Configuration

```
# In MapProxy mapproxy.yaml

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

### Frontend Integration

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
- Regular Docker Image Updates
- Monitor disk utilization
- Set resource limits for containers
- Back up PostgreSQL data for critical changes
- Use region-specific OSM data (not the entire planet)

❌ **Don't**:
- Expose OSM Tiler directly to the internet
- Allow unlimited resources
- Run without monitoring
- Import large OSM datasets without testing
- Make production changes without backup

## References

- [OpenStreetMap Tile Server](https://github.com/Overv/openstreetmap-tile-server)
- [Docker Documentation](https://docs.docker.com/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Mapnik Rendering Engine](https://mapnik.org/)