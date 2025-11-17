---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# MapProxy

MapProxy ist der Tile-Cache und Proxy für p2d2. Er cached WMS-Kacheln und stellt sie als WMTS/TMS bereit.

## Installation

```
# Via pip
pip3 install MapProxy

# Oder via apt (Debian/Ubuntu)
apt install mapproxy
```

## Konfiguration

### mapproxy.yaml

```
services:
  demo:
  tms:
    use_grid_names: true
  kml:
    use_grid_names: true
  wmts:
  wms:
    md:
      title: p2d2 MapProxy
      abstract: Tile Cache für p2d2

layers:
  - name: friedhoefe
    title: Friedhöfe Köln
    sources: [friedhoefe_cache]

  - name: osm
    title: OpenStreetMap
    sources: [osm_cache]

caches:
  friedhoefe_cache:
    grids: [webmercator, GLOBAL_GEODETIC]
    sources: [friedhoefe_wms]
    cache:
      type: file
      directory: /var/cache/mapproxy/friedhoefe
      directory_layout: tms

  osm_cache:
    grids: [webmercator]
    sources: [osm_tiles]
    cache:
      type: file
      directory: /var/cache/mapproxy/osm

sources:
  friedhoefe_wms:
    type: wms
    req:
      url: http://geoserver:8080/geoserver/p2d2/wms
      layers: p2d2:friedhoefe
      transparent: true

  osm_tiles:
    type: tile
    url: https://tile.openstreetmap.org/%(z)s/%(x)s/%(y)s.png
    grid: webmercator

grids:
  webmercator:
    base: GLOBAL_WEBMERCATOR
    srs: 'EPSG:3857'
    origin: nw

  GLOBAL_GEODETIC:
    base: GLOBAL_GEODETIC
    srs: 'EPSG:4326'

globals:
  cache:
    base_dir: /var/cache/mapproxy
    lock_dir: /var/lock/mapproxy
    tile_lock_dir: /var/lock/mapproxy/tile_locks
  
  image:
    resampling_method: bilinear
    paletted: false
```

## Seeding

### seed.yaml

```
seeds:
  friedhoefe_seed:
    caches: [friedhoefe_cache]
    grids: [webmercator]
    coverages: [koeln]
    levels:
      from: 0
      to: 16

coverages:
  koeln:
    bbox: [6.8, 50.8, 7.2, 51.1]
    srs: 'EPSG:4326'
```

### Seeding starten

```
# Komplett seeden
mapproxy-seed -f mapproxy.yaml -s seed.yaml

# Nur bestimmte Level
mapproxy-seed -f mapproxy.yaml -s seed.yaml --seed friedhoefe_seed -l 10,11,12

# Cleanup alter Tiles
mapproxy-seed -f mapproxy.yaml -s seed.yaml --cleanup friedhoefe_seed --cleanup-before 2024-01-01
```

## Performance

### Multi-Threading

```
# seed.yaml
concurrency: 4
```

### Metatiling

```
# mapproxy.yaml
caches:
  friedhoefe_cache:
    meta_size: 
    meta_buffer: 10
```

## Cache-Invalidierung

### Bei Datenänderung

```
# Über PostgreSQL-Trigger
CREATE OR REPLACE FUNCTION invalidate_cache()
RETURNS TRIGGER AS $$
DECLARE
  bbox TEXT;
BEGIN
  -- Bounding Box des geänderten Features
  bbox := ST_Extent(NEW.geom);
  
  -- MapProxy-Seed aufrufen (via Webhook/Script)
  PERFORM pg_notify('cache_invalidate', json_build_object(
    'layer', 'friedhoefe',
    'bbox', bbox
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Manuell

```
# Gesamten Cache löschen
rm -rf /var/cache/mapproxy/friedhoefe

# Oder via Seeding mit cleanup
mapproxy-seed -f mapproxy.yaml -s seed.yaml --cleanup-before now
```

## Deployment

### Systemd-Service

```
# /etc/systemd/system/mapproxy.service
[Unit]
Description=MapProxy Tile Cache
After=network.target

[Service]
Type=simple
User=mapproxy
WorkingDirectory=/etc/mapproxy
ExecStart=/usr/local/bin/mapproxy-serve /etc/mapproxy/mapproxy.yaml \
          -b 0.0.0.0:8081
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx-Reverse-Proxy

```
# /etc/nginx/sites-available/mapproxy
upstream mapproxy {
    server localhost:8081;
}

server {
    listen 80;
    server_name tiles.p2d2.example.com;

    location / {
        proxy_pass http://mapproxy;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Cache-Headers
        add_header X-Cache-Status $upstream_cache_status;
        proxy_cache tiles;
        proxy_cache_valid 200 7d;
    }
}
```

::: tip Cache-Strategie
Seeden Sie nur stark frequentierte Zoom-Level (10-16). Höhere Level werden on-demand generiert.
:::
