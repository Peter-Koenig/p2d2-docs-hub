---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# GeoServer

GeoServer ist der OGC-konforme Geodienste-Server für p2d2. Er stellt WFS, WFS-T, WMS und WCS bereit.

## Installation

### Via Docker

```
# GeoServer-Container starten
docker run -d \
  --name geoserver \
  -p 8080:8080 \
  -e GEOSERVER_ADMIN_PASSWORD=secure_password \
  -e GEOSERVER_ADMIN_USER=admin \
  -v geoserver-data:/opt/geoserver_data \
  kartoza/geoserver:2.24.0
```

### Native Installation

```
# Java 17 installieren
apt install openjdk-17-jdk

# GeoServer herunterladen
wget https://sourceforge.net/projects/geoserver/files/GeoServer/2.24.0/geoserver-2.24.0-bin.zip

# Entpacken
unzip geoserver-2.24.0-bin.zip -d /opt/

# Starten
/opt/geoserver-2.24.0/bin/startup.sh
```

## Workspaces und Stores

### Workspace erstellen

```
# Via REST-API
curl -u admin:password -X POST \
  -H "Content-Type: application/json" \
  -d '{"workspace":{"name":"p2d2","isolated":false}}' \
  http://localhost:8080/geoserver/rest/workspaces
```

### PostGIS-Store erstellen

```
curl -u admin:password -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "dataStore": {
      "name": "p2d2-postgis",
      "type": "PostGIS",
      "enabled": true,
      "workspace": {"name": "p2d2"},
      "connectionParameters": {
        "host": "localhost",
        "port": "5432",
        "database": "p2d2",
        "schema": "features",
        "user": "p2d2",
        "passwd": "password",
        "dbtype": "postgis"
      }
    }
  }' \
  http://localhost:8080/geoserver/rest/workspaces/p2d2/datastores
```

## Layer publizieren

### Feature Type erstellen

```
curl -u admin:password -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "featureType": {
      "name": "friedhoefe",
      "nativeName": "friedhoefe",
      "title": "Friedhöfe Köln",
      "abstract": "Friedhöfe in Köln",
      "srs": "EPSG:4326",
      "enabled": true,
      "store": {"name": "p2d2:p2d2-postgis"}
    }
  }' \
  http://localhost:8080/geoserver/rest/workspaces/p2d2/datastores/p2d2-postgis/featuretypes
```

### Style (SLD) definieren

```
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0">
  <NamedLayer>
    <Name>friedhoefe</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Rule>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#90EE90</CssParameter>
              <CssParameter name="fill-opacity">0.5</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#006400</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
```

## WFS-T konfigurieren

### Transactional WFS aktivieren

```
<!-- web.xml -->
<context-param>
  <param-name>ENABLE_WFS_TRANSACTIONS</param-name>
  <param-value>true</param-value>
</context-param>
```

### Security für WFS-T

```
<!-- security.xml -->
<security>
  <role id="ROLE_EDITOR">
    <property name="enabled">true</property>
  </role>
  <layer>
    <name>p2d2:friedhoefe</name>
    <access>
      <read>*</read>
      <write>ROLE_EDITOR</write>
    </access>
  </layer>
</security>
```

## Performance-Optimierung

### Connection-Pool

```
<!-- datastore.xml -->
onnectiononParameters>
  <minConnections>10</minConnections>
  <maxConnections>50</maxConnections>
  <connectionTimeout>20</connectionTimeout>
  <validateConnections>true</validateConnections>
</connectionParameters>
```

### Tile-Caching mit GeoWebCache

```
# Layer für Caching konfigurieren
# Web-UI: Tile Caching → Tile Layers → p2d2:friedhoefe

# Gridsets: EPSG:4326, EPSG:3857
# Image Format: image/png
# Metatiling: 4x4
```

### SQL Views für komplexe Queries

```
-- In GeoServer: Data → SQL Views
CREATE OR REPLACE VIEW features.friedhoefe_public AS
SELECT id, name, adresse, geom
FROM features.friedhoefe
WHERE status = 'published';
```

## Monitoring

### Status-API

```
# Server-Status
curl http://localhost:8080/geoserver/rest/about/status

# Layer-Info
curl http://localhost:8080/geoserver/rest/workspaces/p2d2/layers
```

### Logging

```
# log4j.properties
log4j.rootLogger=INFO, geoserverlogfile, stdout

# WFS-T Logging
log4j.logger.org.geoserver.wfs=DEBUG
```

## Backup

```
# GeoServer Data Directory sichern
tar -czf geoserver-data-$(date +%Y%m%d).tar.gz /opt/geoserver_data/

# Via REST-API: Konfiguration exportieren
curl -u admin:password \
  http://localhost:8080/geoserver/rest/workspaces/p2d2.zip \
  -o p2d2-workspace-backup.zip
```

::: tip GeoServer-Cluster
Für Hochverfügbarkeit können mehrere GeoServer-Instanzen mit gemeinsamem PostGIS-Backend betrieben werden.
:::
