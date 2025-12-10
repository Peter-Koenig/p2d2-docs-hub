---
title: GeoServer Container - Wartung & Betrieb
description: Installation, Update und Wartung des GeoServer-Containers
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-12-06
---

# GeoServer Container - Wartung & Betrieb

## Übersicht

Der GeoServer-Container stellt OGC-konforme Geodienste (WMS, WFS, WFS-T) für die p2d2-Plattform bereit. Der Zugriff erfolgt ausschließlich über einen Reverse-Proxy (Caddy auf OPNSense), eine direkte Exposition ins Internet findet nicht statt.

## Container-Konfiguration

```
Typ: LXC Container (Proxmox)
OS: Debian (aktuelle Stable-Version)
Hostname: geoserver
Status: running

Ressourcen:
  RAM: 6 GB
  Disk: 12 GB (dynamisch erweiterbar)
  CPU Shares: Standard (1024)
```

## Software-Stack

### Java Runtime
- **Version**: OpenJDK 17 (LTS)
- **JVM Heap**: 4 GB (Xmx), 2 GB (Xms)
- **Garbage Collector**: G1GC

### Tomcat Servlet Container
- **Version**: Tomcat 9 (aus Debian-Repository)
- **Service**: `tomcat9.service` (systemd)
- **Webroot**: `/var/lib/tomcat9/webapps/geoserver`
- **Ports**: 8080 (HTTP, nur intern)

### GeoServer
- **Installation**: WAR-Deployment in Tomcat
- **Data Directory**: `/opt/geoserver_data` (extern via `GEOSERVER_DATA_DIR`)
- **Context-Path**: `/geoserver`
- **Admin-Interface**: `/geoserver/web`

## Installation

### Initiale Installation

Die Installation erfolgt über ein Shell-Skript, das OpenJDK, Tomcat und die GeoServer-WAR deployed:

```
#!/bin/bash
# ~/install_geoserver.sh

set -e

# Variablen
GEOSERVER_VERSION="2.28.1"  # Anpassen an aktuelle Stable-Version
GEOSERVER_WAR_ZIP="/tmp/geoserver-${GEOSERVER_VERSION}-war.zip"
GEOSERVER_WAR="/tmp/geoserver.war"
TOMCAT_VER="9"
TOMCAT_USER="tomcat"
TOMCAT_GROUP="tomcat"
TOMCAT_HOME="/var/lib/tomcat${TOMCAT_VER}"
TOMCAT_WEBAPPS="${TOMCAT_HOME}/webapps"
GEOSERVER_CONTEXT_PATH="geoserver"

# 1. Benötigte Pakete installieren
apt-get update
apt-get install -y openjdk-17-jre-headless tomcat${TOMCAT_VER} unzip

# 2. GeoServer WAR-Datei extrahieren
unzip -o "$GEOSERVER_WAR_ZIP" -d /tmp/
if [ ! -f "$GEOSERVER_WAR" ]; then
    GEOSERVER_WAR_FOUND=$(find /tmp -maxdepth 2 -name "geoserver*.war" | head -n1)
    if [ -n "$GEOSERVER_WAR_FOUND" ]; then
        mv "$GEOSERVER_WAR_FOUND" "$GEOSERVER_WAR"
    else
        echo "GeoServer WAR-Datei nicht gefunden."
        exit 1
    fi
fi

# 3. Data Directory konfigurieren
mkdir -p /opt/geoserver_data
chown -R $TOMCAT_USER:$TOMCAT_GROUP /opt/geoserver_data

# 4. GEOSERVER_DATA_DIR setzen
cat > /usr/share/tomcat${TOMCAT_VER}/bin/setenv.sh <<'EOF'
#!/bin/bash
export CATALINA_OPTS="${CATALINA_OPTS} -DGEOSERVER_DATA_DIR=/opt/geoserver_data"
export CATALINA_OPTS="${CATALINA_OPTS} -Xmx4g -Xms2g"
export CATALINA_OPTS="${CATALINA_OPTS} -XX:+UseG1GC"
export CATALINA_OPTS="${CATALINA_OPTS} -Djava.awt.headless=true"
EOF
chmod +x /usr/share/tomcat${TOMCAT_VER}/bin/setenv.sh

# 5. GeoServer WAR in Tomcat deployen
systemctl stop tomcat${TOMCAT_VER}
rm -rf "${TOMCAT_WEBAPPS:?}/${GEOSERVER_CONTEXT_PATH}"
rm -f "${TOMCAT_WEBAPPS:?}/${GEOSERVER_CONTEXT_PATH}.war"
cp "$GEOSERVER_WAR" "${TOMCAT_WEBAPPS}/${GEOSERVER_CONTEXT_PATH}.war"
chown $TOMCAT_USER:$TOMCAT_GROUP "${TOMCAT_WEBAPPS}/${GEOSERVER_CONTEXT_PATH}.war"

# 6. Tomcat starten
systemctl daemon-reload
systemctl enable tomcat${TOMCAT_VER}
systemctl start tomcat${TOMCAT_VER}

echo "=== GeoServer Installation abgeschlossen ==="
echo "Interner Zugriff: http://$(hostname -I | awk '{print $1}'):8080/geoserver"
echo "Admin-Login: admin / geoserver (bitte ändern!)"
```

### Data Directory

Das Data Directory liegt **außerhalb** des Webapp-Deployments unter `/opt/geoserver_data`. Dies ermöglicht sichere Updates ohne Datenverlust. Die Konfiguration erfolgt über die Umgebungsvariable `GEOSERVER_DATA_DIR` in `/usr/share/tomcat9/bin/setenv.sh`.

## Update-Prozess

### Security-Updates

Bei Sicherheitsupdates (z.B. CVE-Fixes) wird die GeoServer-WAR ausgetauscht, während das Data Directory unverändert bleibt:

```
#!/bin/bash
# ~/update_geoserver.sh

set -e

# Konfiguration
GEOSERVER_VERSION="2.28.1"  # Neue Version
GEOSERVER_WAR_ZIP="/tmp/geoserver-${GEOSERVER_VERSION}-war.zip"
GEOSERVER_WAR="/tmp/geoserver.war"

TOMCAT_VER="9"
TOMCAT_USER="tomcat"
TOMCAT_GROUP="tomcat"
TOMCAT_HOME="/var/lib/tomcat${TOMCAT_VER}"
TOMCAT_WEBAPPS="${TOMCAT_HOME}/webapps"
GEOSERVER_CONTEXT_PATH="geoserver"

echo "=== GeoServer Update auf Version ${GEOSERVER_VERSION} ==="

# 1. Backup der Konfiguration erstellen
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-data_$(date +%Y%m%d-%H%M).tar.gz" \
  /opt/geoserver_data/

# 2. Tomcat stoppen
systemctl stop tomcat${TOMCAT_VER}

# 3. Alte WAR entfernen
rm -f "${TOMCAT_WEBAPPS:?}/${GEOSERVER_CONTEXT_PATH}.war"
rm -rf "${TOMCAT_WEBAPPS:?}/${GEOSERVER_CONTEXT_PATH}"

# 4. Neue GeoServer-WAR vorbereiten
if [ ! -f "$GEOSERVER_WAR_ZIP" ]; then
    echo "ERROR: ZIP-Datei ${GEOSERVER_WAR_ZIP} nicht gefunden."
    echo "Bitte von https://geoserver.org/download/ herunterladen."
    exit 1
fi

unzip -o "$GEOSERVER_WAR_ZIP" -d /tmp/

if [ ! -f "$GEOSERVER_WAR" ]; then
    GEOSERVER_WAR_FOUND=$(find /tmp -maxdepth 2 -name "geoserver*.war" | head -n1)
    if [ -n "$GEOSERVER_WAR_FOUND" ]; then
        mv "$GEOSERVER_WAR_FOUND" "$GEOSERVER_WAR"
    else
        echo "ERROR: GeoServer WAR-Datei nicht gefunden."
        exit 1
    fi
fi

# 5. Neue WAR deployen
cp "$GEOSERVER_WAR" "${TOMCAT_WEBAPPS}/${GEOSERVER_CONTEXT_PATH}.war"
chown $TOMCAT_USER:$TOMCAT_GROUP "${TOMCAT_WEBAPPS}/${GEOSERVER_CONTEXT_PATH}.war"

# 6. Tomcat starten
systemctl start tomcat${TOMCAT_VER}

echo "=== Update abgeschlossen ==="
echo "Prüfe GeoServer unter: http://$(hostname -I | awk '{print $1}'):8080/geoserver"
echo "Backup wurde erstellt: $BACKUP_DIR/geoserver-data_$(date +%Y%m%d)*.tar.gz"
```

### Update-Kompatibilität

- **Minor-Updates** (z.B. 2.28.0 → 2.28.1): Typischerweise ohne Probleme
- **Major-Updates** (z.B. 2.27.x → 2.28.x): Kompatibel mit Tomcat 9 und Java 17
- **Tomcat 10+**: Noch nicht unterstützt (GeoServer 2.x nutzt javax-Servlet-API)

## Service-Management

### Systemd-Befehle

```
# Service-Status prüfen
systemctl status tomcat9

# Service neu starten
systemctl restart tomcat9

# Logs live anzeigen
journalctl -u tomcat9 -f --no-pager

# Autostart aktivieren
systemctl enable tomcat9
```

### Log-Dateien

```
# Tomcat-Logs
tail -f /var/log/tomcat9/catalina.out

# GeoServer-Logs
tail -f /opt/geoserver_data/logs/geoserver.log

# Performance-Analyse
grep "Request time" /opt/geoserver_data/logs/geoserver.log | tail -20
```

## Netzwerk & Sicherheit

### Zugriffskontrolle

Der GeoServer ist **nicht direkt** im Internet erreichbar. Alle externen Anfragen laufen über den Reverse-Proxy:

```
Internet
  ↓
OPNSense (Caddy Reverse Proxy)
  ├─→ ows.data-dna.eu → GeoServer WMS/WFS (lesend)
  └─→ wfs.data-dna.eu → GeoServer WFS-T (schreibend, Frontend)

Interne Services:
  - Frontend (AstroJS) → GeoServer WFS-T
  - MapProxy → GeoServer WMS
  - PostgreSQL ← GeoServer (Datenquelle)
```

### Firewall-Regeln

- **Port 8080**: Nur im internen LAN erreichbar
- **Reverse Proxy**: TLS/HTTPS-Terminierung auf OPNSense
- **Externe Zugriffe**: Nur über Caddy (mit Rate-Limiting)

### GeoServer-Security

```
Admin-Zugang:
  - Standard-Passwort "geoserver" MUSS geändert werden
  - Zugang nur über interne IP oder Reverse-Proxy

Role-Based Access Control:
  - ADMIN: Vollzugriff (Server-Konfiguration)
  - EDITOR: Layer-Management, WFS-T
  - USER: Nur Lese-Zugriff (WMS/WFS)

Layer-Security:
  - Workspace-Isolation aktiviert
  - OGC-Service-Limits (maxFeatures: 10000)
```

## Backup & Restore

### Automatisches Backup

```
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"

# Data Directory sichern
tar -czf "$BACKUP_DIR/geoserver-data_$(date +%Y%m%d).tar.gz" \
  /opt/geoserver_data/

# Alte Backups löschen (>90 Tage)
find "$BACKUP_DIR" -name "geoserver-data_*.tar.gz" -mtime +90 -delete
```

### Proxmox PBS-Snapshots

- **Zeitplan**: Wöchentlich (Container-Level)
- **Retention**: 4 Wochen
- **Typ**: LVM-Thin Snapshot (gesamter Container)

### Restore-Prozess

```
# Data Directory wiederherstellen
systemctl stop tomcat9
tar -xzf /backup/geoserver/geoserver-data_YYYYMMDD.tar.gz -C /
chown -R tomcat:tomcat /opt/geoserver_data
systemctl start tomcat9
```

## Monitoring & Health-Checks

### Service-Status

```
# HTTP-Erreichbarkeit prüfen
curl -I http://localhost:8080/geoserver/web

# WMS-Capabilities abrufen
curl -s "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities" | head -20

# REST-API-Status (benötigt Admin-Login)
curl -u admin:<PASSWORD> http://localhost:8080/geoserver/rest/about/status.json
```

### Performance-Metriken

```
# JVM Memory Usage
curl -u admin:<PASSWORD> http://localhost:8080/geoserver/rest/about/system-status.json | jq '.memory'

# Request-Zeiten aus Logs
grep "ms" /opt/geoserver_data/logs/geoserver.log | tail -10
```

## Troubleshooting

### GeoServer startet nicht

```
# Tomcat-Logs prüfen
journalctl -u tomcat9 --no-pager -n 100

# Data Directory Permissions
ls -la /opt/geoserver_data/
chown -R tomcat:tomcat /opt/geoserver_data

# JVM OutOfMemory
grep "OutOfMemory" /var/log/tomcat9/catalina.out
# → JVM Heap in setenv.sh erhöhen
```

### Connection zu PostgreSQL fehlschlägt

```
# Netzwerk-Test von GeoServer-Container aus
ping postgresql.lan
telnet postgresql.lan 5432

# PostgreSQL-Verbindung testen
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"
```

### Performance-Probleme

1. **JVM Heap erhöhen**: In `/usr/share/tomcat9/bin/setenv.sh` `-Xmx6g` setzen
2. **PostGIS-Indizes prüfen**: Spatial-Indizes auf Geometrie-Spalten
3. **GeoWebCache aktivieren**: Tile-Caching für häufig genutzte Layer

## Best Practices

### Do ✅
- Regelmäßige Security-Updates (GeoServer Release Notes verfolgen)
- Data Directory extern von WAR-Deployment
- Separate PostgreSQL-Benutzer mit minimalen Rechten
- GeoWebCache für statische Layer aktivieren
- Backup vor jedem Update

### Don't ❌
- Standard-Admin-Passwort verwenden
- GeoServer direkt ins Internet exponieren
- Unbegrenzte `maxFeatures` erlauben
- Data Directory innerhalb von `webapps/` belassen
- Updates ohne Backup durchführen

## Weiterführende Dokumentation

- **GIS-Konfiguration**: Siehe [Geodateninfrastruktur → GeoServer](../geodateninfrastruktur/geoserver.md)
- **GeoServer Docs**: https://docs.geoserver.org/stable/en/user/
- **Security Guide**: https://docs.geoserver.org/stable/en/user/security/
- **REST API**: https://docs.geoserver.org/stable/en/user/rest/
