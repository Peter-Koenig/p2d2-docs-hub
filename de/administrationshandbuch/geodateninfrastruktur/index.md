# Geodateninfrastruktur (GDI)

Die Geodateninfrastruktur von p2d2 folgt den Prinzipien der **GDI-DE** (Geodateninfrastruktur Deutschland) und setzt auf offene Standards des **Open Geospatial Consortium (OGC)**.

## Definition

Nach dem Geodatenzugangsgesetz (GeoZG) ist eine Geodateninfrastruktur:

> Eine Infrastruktur bestehend aus Geodaten, Metadaten und Geodatendiensten, Netzdiensten und -technologien, Vereinbarungen über gemeinsame Nutzung, über Zugang und Verwendung sowie Koordinierungs- und Überwachungsmechanismen, -prozesse und -verfahren.

## Architektur-Komponenten

### Datenebene

- **PostgreSQL/PostGIS**: Räumliche Datenbank
- **File Storage**: GeoTIFF, Shapefiles, GeoJSON

### Service-Ebene

- **GeoServer**: WFS, WFS-T, WMS, WCS
- **MapProxy**: WMTS, TMS, Tile-Caching

### Präsentationsebene

- **p2d2-Frontend**: AstroJS + OpenLayers
- **QGIS**: Desktop-GIS für Experten

## OGC-Standards

### Web Feature Service (WFS)

- **WFS 2.0**: Vektor-Geodaten abrufen
- **WFS-T**: Transaktionen (Insert, Update, Delete)
- **Filter Encoding**: Komplexe Abfragen

### Web Map Service (WMS)

- **WMS 1.3.0**: Kartendarstellung
- **GetCapabilities**: Service-Metadaten
- **GetMap**: Kartenbilder

### Web Map Tile Service (WMTS)

- **WMTS 1.0.0**: Vorgenerierte Kacheln
- **TileMatrixSet**: Kachel-Schema
- **REST/KVP**: Zugriff über REST oder Key-Value-Pairs

## INSPIRE-Konformität

p2d2 ist vorbereitet für INSPIRE-Konformität:

- **Metadaten**: ISO 19115/19119
- **Datenmodelle**: INSPIRE Data Specifications
- **Services**: View/Download/Discovery Services

## Koordinatenreferenzsysteme

### Unterstützte CRS

- **EPSG:4326**: WGS 84 (Lat/Lon)
- **EPSG:3857**: Web Mercator (OSM)
- **EPSG:25832**: ETRS89 / UTM Zone 32N (Deutschland)
- **EPSG:31466-31469**: Gauß-Krüger (Legacy)

### Transformation

PostGIS-Funktionen für Koordinatentransformation:

```
-- WGS84 → UTM32
SELECT ST_Transform(geom, 25832) FROM features;

-- Web Mercator → WGS84
SELECT ST_Transform(geom, 4326) FROM features;
```

## Performance-Optimierung

### Räumliche Indizes

```
-- GiST-Index für Geometrien
CREATE INDEX idx_features_geom ON features USING GIST(geom);

-- Analyse für Query-Planer
ANALYZE features;
```

### Tile-Caching

- **MapProxy**: Vorberechnete Kacheln
- **Cache-Strategie**: Seeding für häufig genutzte Bereiche
- **Cache-Invalidierung**: Bei Datenänderungen

### Connection-Pooling

- **PgBouncer**: Zwischen GeoServer und PostgreSQL
- **Pool-Größe**: ~100 Connections
- **Transaction Pooling**: Für WFS-T

## Metadaten-Management

### GeoNetwork

```
# GeoNetwork als Metadaten-Katalog
docker run -d \
  --name geonetwork \
  -p 8082:8080 \
  -e POSTGRES_DB=geonetwork \
  -e POSTGRES_USER=geonetwork \
  -e POSTGRES_PASSWORD=<password> \
  geonetwork:4.2
```

### CSW (Catalogue Service for the Web)

- **CSW 2.0.2**: Metadaten-Suche
- **Dublin Core**: Basis-Metadaten
- **ISO 19115**: Geographische Metadaten

## Monitoring

### Service-Health-Checks

```
# WFS GetCapabilities
curl -s "http://geoserver:8080/geoserver/wfs?service=WFS&version=2.0.0&request=GetCapabilities"

# WMS GetCapabilities
curl -s "http://geoserver:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# WMTS GetCapabilities
curl -s "http://mapproxy:8081/wmts/1.0.0/WMTSCapabilities.xml"
```

### Performance-Metriken

- **Response-Time**: <500ms für GetMap
- **Throughput**: >100 req/s
- **Tile-Cache-Hit-Rate**: >90%

## Best Practices

- **Layer-Gruppen**: Verwandte Layer gruppieren
- **Styles**: SLD für konsistente Darstellung
- **Caching**: Aggressive Caching für statische Daten
- **Security**: Zugriffskontrolle per Workspace
- **Monitoring**: Prometheus + Grafana

::: tip INSPIRE-Validator
Nutzen Sie den INSPIRE-Validator für Konformitätsprüfungen: https://inspire.ec.europa.eu/validator/
:::
