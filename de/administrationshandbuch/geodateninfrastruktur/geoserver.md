---
quality:
  completeness: 70
  accuracy: 70
  reviewed: false
  reviewer: anonymous
  reviewDate: 2025-01-01
---

# GeoServer

GeoServer ist der OGC-konforme Geodienste-Server für p2d2. Er stellt WFS, WFS-T, WMS und WCS bereit.

## Konkrete Installation

### Native Installation per Script

```bash
#!/bin/bash

set -e

# Variablen
GEOSERVER_WAR_ZIP="/tmp/geoserver-2.27.0-war.zip"
GEOSERVER_WAR="/tmp/geoserver.war"
TOMCAT_VER="9"
TOMCAT_USER="tomcat"
TOMCAT_GROUP="tomcat"
TOMCAT_HOME="/var/lib/tomcat${TOMCAT_VER}"
TOMCAT_WEBAPPS="${TOMCAT_HOME}/webapps"
KEYSTORE_PATH="/etc/ssl/private/geoserver-keystore.jks"
KEYSTORE_PASS="changeit"
GEOSERVER_CONTEXT_PATH="geoserver"

# 1. Benötigte Pakete installieren
apt-get update
apt-get install -y openjdk-17-jre-headless tomcat${TOMCAT_VER} unzip

# 2. GeoServer WAR-Datei extrahieren
unzip -o "$GEOSERVER_WAR_ZIP" -d /tmp/
# Die ZIP enthält meist direkt die .war-Datei, ggf. anpassen:
if [ ! -f "$GEOSERVER_WAR" ]; then
    GEOSERVER_WAR_FOUND=$(find /tmp -name "*.war" | head -n1)
    if [ -n "$GEOSERVER_WAR_FOUND" ]; then
        mv "$GEOSERVER_WAR_FOUND" "$GEOSERVER_WAR"
    else
        echo "GeoServer WAR-Datei nicht gefunden."
        exit 1
    fi
fi

# 3. GeoServer WAR in Tomcat deployen
systemctl stop tomcat${TOMCAT_VER}
rm -rf "${TOMCAT_WEBAPPS:?}/${GEOSERVER_CONTEXT_PATH}"
rm -f "${TOMCAT_WEBAPPS:?}/${GEOSERVER_CONTEXT_PATH}.war"
cp "$GEOSERVER_WAR" "${TOMCAT_WEBAPPS}/${GEOSERVER_CONTEXT_PATH}.war"
chown $TOMCAT_USER:$TOMCAT_GROUP "${TOMCAT_WEBAPPS}/${GEOSERVER_CONTEXT_PATH}.war"

# 4. Self-Signed Keystore für HTTPS erzeugen
if [ ! -f "$KEYSTORE_PATH" ]; then
    mkdir -p "$(dirname $KEYSTORE_PATH)"
    keytool -genkeypair \
        -alias tomcat \
        -keyalg RSA \
        -keysize 4096 \
        -validity 365 \
        -keystore "$KEYSTORE_PATH" \
        -storepass "$KEYSTORE_PASS" \
        -keypass "$KEYSTORE_PASS" \
        -dname "CN=$(hostname), OU=GeoServer, O=MyOrg, L=MyCity, S=MyState, C=DE"
    chown $TOMCAT_USER:$TOMCAT_GROUP "$KEYSTORE_PATH"
    chmod 640 "$KEYSTORE_PATH"
fi

# 5. Tomcat für HTTPS konfigurieren
TOMCAT_SERVER_XML="/etc/tomcat${TOMCAT_VER}/server.xml"
if ! grep -q 'port="8443"' "$TOMCAT_SERVER_XML"; then
    # Füge Connector hinzu, falls noch nicht vorhanden
    sed -i '/<\/Service>/i \
<Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol" \
           maxThreads="150" SSLEnabled="true" scheme="https" secure="true" \
           clientAuth="false" sslProtocol="TLS" \
           keystoreFile="'"$KEYSTORE_PATH"'" keystorePass="'"$KEYSTORE_PASS"'" />' \
           "$TOMCAT_SERVER_XML"
fi

# 6. Tomcat neu starten
systemctl daemon-reload
systemctl restart tomcat${TOMCAT_VER}

echo "GeoServer ist bereit:"
echo "  HTTP:  http://$(hostname -I | awk '{print $1}'):8080/geoserver"
echo "  HTTPS: https://$(hostname -I | awk '{print $1}'):8443/geoserver"
echo "Login: admin / geoserver"
```

## Konkrete Konfiguration ..
.. folgt. Wurde über GUI erledigt und muss nun ausgelesen und nachgetragen werden.

---

# Allgemneine Befehle 
Ist KI-generierter Inhalt und nicht falsch. Vielleicht hilfreich als Vorlage und zum lernen. Daher wurde es (noch) nicht gelöscht.

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
