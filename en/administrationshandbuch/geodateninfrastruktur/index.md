## quality: completeness: 50 accuracy: 70 reviewed: false reviewer: 'KI (Gemini)' reviewDate: null

# Spatial Data Infrastructure (SDI)

The Spatial Data Infrastructure of p2d2 follows the principles of **GDI-DE** (Spatial Data Infrastructure Germany) and relies on open standards from the **Open Geospatial Consortium (OGC)**.

## Definition

According to the Geodata Access Act (GeoZG), a spatial data infrastructure is:

> An infrastructure consisting of geodata, metadata, and geodata services, network services and technologies, agreements on shared use, access, and use, as well as coordination and monitoring mechanisms, processes, and procedures.

## Architecture Components

### Data Layer

  - **PostgreSQL/PostGIS**: Spatial database
  - **File Storage**: GeoTIFF, Shapefiles, GeoJSON

### Service Layer

  - **GeoServer**: WFS, WFS-T, WMS, WCS
  - **MapProxy**: WMTS, TMS, Tile Caching

### Presentation Layer

  - **p2d2 Frontend**: AstroJS + OpenLayers
  - **QGIS**: Desktop GIS for experts

## OGC Standards

### Web Feature Service (WFS)

  - **WFS 2.0**: Retrieve vector geodata
  - **WFS-T**: Transactions (Insert, Update, Delete)
  - **Filter Encoding**: Complex queries

### Web Map Service (WMS)

  - **WMS 1.3.0**: Map display
  - **GetCapabilities**: Service metadata
  - **GetMap**: Map images

### Web Map Tile Service (WMTS)

  - **WMTS 1.0.0**: Pre-generated tiles
  - **TileMatrixSet**: Tile schema
  - **REST/KVP**: Access via REST or Key-Value-Pairs

## INSPIRE Compliance

p2d2 is prepared for INSPIRE compliance:

  - **Metadata**: ISO 19115/19119
  - **Data Models**: INSPIRE Data Specifications
  - **Services**: View/Download/Discovery Services

## Coordinate Reference Systems

### Supported CRS

  - **EPSG:4326**: WGS 84 (Lat/Lon)
  - **EPSG:3857**: Web Mercator (OSM)
  - **EPSG:25832**: ETRS89 / UTM Zone 32N (Germany)
  - **EPSG:31466-31469**: Gauss-Krüger (Legacy)

### Transformation

PostGIS functions for coordinate transformation:

```
-- WGS84 → UTM32
SELECT ST_Transform(geom, 25832) FROM features;

-- Web Mercator → WGS84
SELECT ST_Transform(geom, 4326) FROM features;
```

## Performance Optimization

### Spatial Indices

```
-- GiST index for geometries
CREATE INDEX idx_features_geom ON features USING GIST(geom);

-- Analyze for query planner
ANALYZE features;
```

### Tile Caching

  - **MapProxy**: Pre-rendered tiles
  - **Cache Strategy**: Seeding for frequently used areas
  - **Cache Invalidation**: On data changes

### Connection Pooling

  - **PgBouncer**: Between GeoServer and PostgreSQL
  - **Pool Size**: ~100 connections
  - **Transaction Pooling**: For WFS-T

## Metadata Management

### GeoNetwork

```
# GeoNetwork as metadata catalog
docker run -d \
  --name geonetwork \
  -p 8082:8080 \
  -e POSTGRES_DB=geonetwork \
  -e POSTGRES_USER=geonetwork \
  -e POSTGRES_PASSWORD=<password> \
  geonetwork:4.2
```

### CSW (Catalogue Service for the Web)

  - **CSW 2.0.2**: Metadata search
  - **Dublin Core**: Basic metadata
  - **ISO 19115**: Geographic metadata

## Monitoring

### Service Health Checks

```
# WFS GetCapabilities
curl -s "http://geoserver:8080/geoserver/wfs?service=WFS&version=2.0.0&request=GetCapabilities"

# WMS GetCapabilities
curl -s "http://geoserver:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# WMTS GetCapabilities
curl -s "http://mapproxy:8081/wmts/1.0.0/WMTSCapabilities.xml"
```

### Performance Metrics

  - **Response Time**: <500ms for GetMap
  - **Throughput**: >100 req/s
  - **Tile Cache Hit Rate**: >90%

## Best Practices

  - **Layer Groups**: Group related layers
  - **Styles**: SLD for consistent presentation
  - **Caching**: Aggressive caching for static data
  - **Security**: Access control per workspace
  - **Monitoring**: Prometheus + Grafana

## ::: tip INSPIRE Validator Use the INSPIRE Validator for compliance checks: [https://inspire.ec.europa.eu/validator/](https://inspire.ec.europa.eu/validator/) :::