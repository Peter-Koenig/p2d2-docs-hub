---
title: GeoServer Container
description: WFS/WMS-Server für Geodatendienste
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# LXC: GeoServer

## Container-Informationen

```
Typ: LXC (privileged/unprivileged je nach Setup)
OS: Debian 13 (trixie)
Hostname: geoserver (anpassbar)
Status: running

Ressourcen:
  RAM: 6 GB
  Disk: 12 GB (dynamisch erweiterbar)
  CPU Shares: Standard (1024)
```

## Installierte Software

### Java Runtime
```
Version: OpenJDK 17 (LTS)
JVM Options: Optimiert für GeoServer-Workload
Memory: 4 GB Heap (Xmx), 512 MB PermGen
```

### Tomcat Servlet Container
```
Version: 9.x (Debian Official Repository)
Service: tomcat9.service (systemd)
Webroot: /var/lib/tomcat9/webapps/geoserver
Port: 8080 (HTTP), 8443 (HTTPS optional)
```

### GeoServer
```
Version: 2.x (aktuelle Stable)
Installation: WAR-Datei im Tomcat
Context-Path: /geoserver
Admin-Interface: /geoserver/web
```

## Service-Konfiguration

### Systemd-Service
```
# Service-Status prüfen
systemctl status tomcat9

# Service neu starten (mit Downtime)
systemctl restart tomcat9

# Logs anzeigen
journalctl -u tomcat9 -f --no-pager

# Service enablen (Autostart)
systemctl enable tomcat9
```

### Tomcat-Konfiguration
```
# Server-Konfiguration
/etc/tomcat9/server.xml
  - Connector Port: 8080
  - AJP Connector: Deaktiviert (Sicherheit)
  - SSL/TLS: Optional (via Caddy-Proxy)

# Application-Konfiguration
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## GeoServer-Features

### Unterstützte Protokolle
```
WMS (Web Map Service): Karten-Rendering
  - Version: 1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service): Vektordaten
  - Version: 1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactional): Schreibzugriffe
  - Insert, Update, Delete Operationen
  - Für p2d2-Frontend Daten-Persistierung

WMTS (Web Map Tile Service): Optional
```

### Datenquellen-Konfiguration

#### PostgreSQL/PostGIS Connection
```
Connection Parameters:
  - Host: postgresql.lan (interne DNS)
  - Database: data-dna
  - Schema: public
  - User: geoserver (dedicated user)

PostGIS Store:
  - Estimated Bounds: Auto-calculate
  - Expose Primary Keys: Enabled
  - Prepared Statements: Enabled (Performance)
```

#### Layer-Publishing
```
Veröffentlichte Layer:
  - kommunen (Polygon-Geometrien)
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - Custom Layer je nach Datenimport

Styling (SLD):
  - Standard-Styles für verschiedene Geometrie-Typen
  - Custom SLD für spezielle Darstellungen
  - Rule-basierte Klassifizierung
```

## Netzwerk-Zugang

```
Listening: 
  - TCP Port 8080 (HTTP, internes LAN)
  - Keine direkte WAN-Exposition

Zugriff via Reverse Proxy:
  - ows.data-dna.eu → WMS/WFS Endpoints
  - wfs.data-dna.eu → WFS-T Endpoints (Frontend)

Firewall-Regeln:
  - Caddy (OPNSense) → GeoServer: ALLOW
  - Frontend → GeoServer: ALLOW (WFS-T)
  - MapProxy → GeoServer: ALLOW (WMS)
  - Externer Zugriff: DENY (nur via Caddy)
```

## Performance-Optimierung

### JVM-Optionen (setenv.sh)
```
# /usr/share/tomcat9/bin/setenv.sh
export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### GeoServer-Konfiguration
```
# /var/lib/geoserver/data/global.xml

<global>
  <settings>
    <proxyBaseUrl>https://ows.data-dna.eu/geoserver</proxyBaseUrl>
    <useHeadersProxyURL>false</useHeadersProxyURL>
    <verbose>false</verbose>
    <verboseExceptions>false</verboseExceptions>
    <maxFeatures>10000</maxFeatures>
    <numDecimals>8</numDecimals>
  </settings>
</global>
```

### GWC (GeoWebCache) Konfiguration
```
Cache-Konfiguration:
  - Disk Quota: 2 GB (begrenzt durch Container-Disk)
  - Tile Layers: Automatisch für WMS-Layer
  - Grid Subsets: WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - Meta-Tiling: 4x4 (Performance vs. Quality)
```

## Backup-Strategie

### PBS-Snapshot (Container-Level)
- **Zeitplan**: Wöchentlich
- **Retention**: 4 Wochen
- **Typ**: LVM-Thin Snapshot

### GeoServer-Konfiguration Backup
```
# Manuelles Backup der Konfiguration
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz \
  /var/lib/geoserver/data/

# Automatisierung via Cronjob
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz" \
  /var/lib/geoserver/data/

# Alte Backups löschen (>90 Tage)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip Konfigurations-Portabilität
GeoServer-Konfigurations-Backups sind version-spezifisch. Bei Major-Updates Konfiguration exportieren/importieren via GeoServer-UI.
:::

## Monitoring

### Health-Checks
```
# Service-Status
curl -I http://localhost:8080/geoserver/web

# WMS-Capabilities
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# Layer-Liste
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### Log-Analyse
```
# Tomcat-Logs
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# GeoServer-Logs
tail -f /var/lib/geoserver/data/logs/geoserver.log

# Performance-Metriken
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## Troubleshooting

### GeoServer startet nicht
```
# Tomcat-Logs prüfen
journalctl -u tomcat9 --no-pager -n 100

# GeoServer Data Directory permissions
ls -la /var/lib/geoserver/data/

# JVM Memory Issues
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### WMS/WFS-Fehlermeldungen
```
# Layer nicht verfügbar
- Data Store Connection prüfen
- PostgreSQL-Verbindung testen
- Layer-Permissions in GeoServer

# Performance-Probleme
- JVM Heap Size erhöhen
- PostGIS-Indizes prüfen
- GWC-Caching aktivieren
```

### Connection zu PostgreSQL
```
# Von GeoServer-Container aus testen
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# Network Connectivity
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## Sicherheits-Konfiguration

### GeoServer-Security
```
Admin-Benutzer: 
  - Username: admin (ändern bei Production)
  - Password: <STRONG_PASSWORD> (nicht Standard)

Role-Based Access:
  - ADMIN_ROLE: Vollzugriff
  - GROUP_ADMIN: Layer-Management
  - WMS_USER: Nur Lese-Zugriff
  - WFS_USER: Feature-Zugriff

Data Security:
  - Layer-Level Permissions
  - Workspace Isolation
  - OGC Service Limits
```

### Netzwerk-Sicherheit
```
Firewall-Regeln:
  - Nur Caddy-Proxy hat Zugriff (Reverse Proxy)
  - Keine direkte WAN-Exposition
  - Interne Kommunikation nur mit autorisierten Services

TLS/SSL:
  - Via Caddy-Proxy (Let's Encrypt)
  - HSTS Header aktiviert
  - Modern Cipher Suites
```

## Integration mit p2d2-Architektur

### Frontend-Integration (WFS-T)
```
// AstroJS Frontend → GeoServer WFS-T
const wfsTransaction = `
<wfs:Transaction service="WFS" version="2.0.0"
  xmlns:wfs="http://www.opengis.net/wfs/2.0"
  xmlns:gml="http://www.opengis.net/gml/3.2">
  <wfs:Insert>
    <feature:gebaeude xmlns:feature="http://www.data-dna.eu/features">
      <feature:geom>
        <gml:Point srsName="EPSG:4326">
          <gml:pos>7.0 51.0</gml:pos>
        </gml:Point>
      </feature:geom>
    </feature:gebaeude>
  </wfs:Insert>
</wfs:Transaction>`;

// HTTP POST zu GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: wfsTransaction
});
```

### MapProxy-Integration (WMS)
```
# MapProxy Konfiguration
sources:
  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

caches:
  geoserver_cache:
    sources: [geoserver_wms]
    grids: [webmercator]
    cache:
      type: file
      directory: /cache/geoserver
```

## Best Practices

✅ **Do**:
- Regelmäßige GeoServer-Updates (Security-Patches)
- Separate Benutzer für verschiedene Zugriffsebenen
- GWC-Caching für häufig angefragte Layer
- Monitoring der JVM-Performance (Heap Usage)
- Backup der GeoServer-Konfiguration

❌ **Don't**:
- Standard-Passwörter verwenden
- GeoServer direkt im Internet exponieren
- Unbegrenzte MaxFeatures erlauben
- Ohne Resource-Limits laufen lassen
- Konfiguration ohne Backup ändern

## Referenzen

- [GeoServer Dokumentation](https://docs.geoserver.org/)
- [GeoServer Security](https://docs.geoserver.org/stable/en/user/security/)
- [WFS-T Specification](https://www.ogc.org/standards/wfs)
- [Tomcat 9 Administration](https://tomcat.apache.org/tomcat-9.0-doc/)