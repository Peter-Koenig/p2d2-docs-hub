# OSM-Tileserver

Ein eigener OpenStreetMap-Tileserver für p2d2 ermöglicht unabhängige Hintergrundkarten und reduziert die Last auf öffentlichen Tile-Servern.

## Installation

### Via Docker

```
# openstreetmap-tile-server (von overv)
docker run -d \
  --name osm-tileserver \
  -p 8082:80 \
  -v osm-data:/data/database/ \
  -e DOWNLOAD_PBF=https://download.geofabrik.de/europe/germany/nordrhein-westfalen-latest.osm.pbf \
  -e DOWNLOAD_POLY=https://download.geofabrik.de/europe/germany/nordrhein-westfalen.poly \
  overv/openstreetmap-tile-server:latest
```

### Native Installation

```
# Dependencies
apt install postgresql postgis osm2pgsql apache2 \
  renderd mapnik-utils python3-mapnik

# OSM-Daten importieren
osm2pgsql -d gis --create --slim -G \
  --hstore --style /usr/share/osm2pgsql/default.style \
  -C 4096 nordrhein-westfalen-latest.osm.pbf
```

## Rendering-Styles

### Standard-Style (Carto)

```
# Carto-Style klonen
git clone https://github.com/gravitystorm/openstreetmap-carto.git
cd openstreetmap-carto

# Dependencies installieren
npm install -g carto

# Mapnik-XML generieren
carto project.mml > style.xml
```

### p2d2-Custom-Style

```
<!-- Beispiel: Friedhöfe hervorheben -->
<Style name="friedhoefe">
  <Rule>
    <Filter>[landuse] = 'cemetery'</Filter>
    <PolygonSymbolizer fill="#aacbaf" fill-opacity="0.8"/>
    <LineSymbolizer stroke="#7fa587" stroke-width="1.5"/>
  </Rule>
</Style>
```

## Kachel-Generierung

### Renderd-Konfiguration

```
# /etc/renderd.conf
[renderd]
num_threads=4
tile_dir=/var/lib/mod_tile
stats_file=/var/run/renderd/renderd.stats

[mapnik]
plugins_dir=/usr/lib/mapnik/3.1/input
font_dir=/usr/share/fonts
font_dir_recurse=true

[default]
URI=/osm/
TILEDIR=/var/lib/mod_tile
XML=/path/to/style.xml
HOST=localhost
TILESIZE=256
MAXZOOM=20
```

### Pre-Rendering

```
# render_list für bestimmtes Gebiet
render_list -a -z 0 -Z 12 \
  --min-lon=6.8 --max-lon=7.2 \
  --min-lat=50.8 --max-lat=51.1 \
  --num-threads=4
```

## Updates

### OSM-Daten aktualisieren

```
# osmosis für Updates
apt install osmosis

# Replikation konfigurieren
# state.txt mit Timestamp
echo "2024-01-15T00:00:00Z" > /var/lib/mod_tile/replication/state.txt

# Tägliches Update
osmosis --read-replication-interval \
  workingDirectory=/var/lib/mod_tile/replication \
  --simplify-change --write-xml-change changes.osc

# In Datenbank importieren
osm2pgsql -d gis --append --slim changes.osc
```

### Automatisches Update

```
# /usr/local/bin/update-osm.sh
#!/bin/bash
osmosis --read-replication-interval \
  workingDirectory=/var/lib/mod_tile/replication \
  --simplify-change --write-xml-change /tmp/changes.osc

if [ -f /tmp/changes.osc ]; then
  osm2pgsql -d gis --append --slim /tmp/changes.osc
  rm /tmp/changes.osc
  
  # Dirty-Tiles markieren
  touch /var/lib/mod_tile/.planet-update-complete
fi

# Cronjob: Täglich um 3 Uhr
# 0 3 * * * /usr/local/bin/update-osm.sh
```

## Performance

### Datenbank-Tuning

```
-- Indizes für OSM-Daten
CREATE INDEX idx_planet_osm_point_geom ON planet_osm_point USING GIST(way);
CREATE INDEX idx_planet_osm_line_geom ON planet_osm_line USING GIST(way);
CREATE INDEX idx_planet_osm_polygon_geom ON planet_osm_polygon USING GIST(way);

-- ANALYZE
ANALYZE planet_osm_point;
ANALYZE planet_osm_line;
ANALYZE planet_osm_polygon;
```

### Tile-Caching

```
# Nginx als Caching-Proxy
proxy_cache_path /var/cache/nginx/osm levels=1:2 \
  keys_zone=osm:100m max_size=50g inactive=30d;

location /osm/ {
    proxy_pass http://localhost:8082/;
    proxy_cache osm;
    proxy_cache_valid 200 30d;
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Monitoring

```
# Renderd-Stats
watch -n 1 cat /var/run/renderd/renderd.stats

# Tile-Queue
renderd-cli stats
```

::: warning Ressourcen
Ein vollständiger OSM-Tileserver für Deutschland benötigt >500 GB Speicher und erhebliche CPU-Ressourcen!
:::
