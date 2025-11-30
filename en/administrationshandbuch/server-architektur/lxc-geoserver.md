---
title: GeoServer Container
description: WFS/WMS server for geodata services
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# LXC: GeoServer

## Container Information

```
Type: LXC (privileged/unprivileged depending on setup)
OS: Debian 13 (trixie)
Hostname: geoserver (customizable)
Status: running

Resources:
RAM: 6 GB
Disk: 12 GB (dynamically expandable)
CPU Shares: Standard (1024)
```

## Installed Software

### Java Runtime
```
Version: OpenJDK 17 (LTS)
JVM Options: Optimized for GeoServer workload
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
Version: 2.x (current Stable)
Installation: WAR file in Tomcat
Context-Path: /geoserver
Admin Interface: /geoserver/web
```

## Service Configuration

### Systemd Service
```
# Check service status
systemctl status tomcat9

# Restart service (with downtime)
systemctl restart tomcat9

# View logs
journalctl -u tomcat9 -f --no-pager

# Enable service (autostart)
systemctl enable tomcat9
```

### Tomcat Configuration
```
# Server configuration
/etc/tomcat9/server.xml
  - Connector Port: 8080
  - AJP Connector: Disabled (Security)
  - SSL/TLS: Optional (via Caddy proxy)

# Application configuration
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## GeoServer Features

### Supported Protocols
```
WMS (Web Map Service): Map rendering
  - Version: 1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service): Vector data
  - Version: 1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactional): Write access
  - Insert, Update, Delete operations
  - For p2d2 frontend data persistence

WMTS (Web Map Tile Service): Optional
```

### Data Source Configuration

#### PostgreSQL/PostGIS Connection
```
Connection Parameters:
  - Host: postgresql.lan (internal DNS)
  - Database: data-dna
  - Schema: public
  - User: geoserver (dedicated user)

PostGIS Store:
  - Estimated Bounds: Auto-calculate
  - Expose Primary Keys: Enabled
  - Prepared Statements: Enabled (Performance)
```

#### Layer Publishing
```
Published Layers:
  - kommunen (Polygon geometries)
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - Custom layers depending on data import

Styling (SLD):
  - Standard styles for different geometry types
  - Custom SLD for special representations
  - Rule-based classification
```

## Network Access

```
Listening:
  - TCP Port 8080 (HTTP, internal LAN)
  - No direct WAN exposure

Access via Reverse Proxy:
  - ows.data-dna.eu → WMS/WFS Endpoints
  - wfs.data-dna.eu → WFS-T Endpoints (Frontend)

Firewall Rules:
  - Caddy (OPNSense) → GeoServer: ALLOW
  - Frontend → GeoServer: ALLOW (WFS-T)
  - MapProxy → GeoServer: ALLOW (WMS)
  - External Access: DENY (only via Caddy)
```

## Performance Optimization

### JVM Options (setenv.sh)
```
# /usr/share/tomcat9/bin/setenv.sh

export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### GeoServer Configuration
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

### GWC (GeoWebCache) Configuration

```
Cache Configuration:
  - Disk Quota: 2 GB (limited by container disk)
  - Tile Layers: Automatic for WMS layers
  - Grid Subsets: WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - Meta-Tiling: 4x4 (Performance vs. Quality)
```

## Backup Strategy

### PBS Snapshot (Container-Level)
- **Schedule**: Weekly
- **Retention**: 4 weeks
- **Type**: LVM-Thin Snapshot

### GeoServer Configuration Backup

```
# Manual configuration backup
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz   
/var/lib/geoserver/data/

# Automation via Cronjob
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz"   
/var/lib/geoserver/data/

# Delete old backups (>90 days)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip Configuration Portability
GeoServer configuration backups are version-specific. For major updates, export/import configuration via GeoServer UI.
:::

## Monitoring

### Health Checks

```
# Service status
curl -I http://localhost:8080/geoserver/web

# WMS Capabilities
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# Layer list
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### Log Analysis

```
# Tomcat logs
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# GeoServer logs
tail -f /var/lib/geoserver/data/logs/geoserver.log

# Performance metrics
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## Troubleshooting

### GeoServer does not start

```
# Check Tomcat logs
journalctl -u tomcat9 --no-pager -n 100

# GeoServer Data Directory permissions
ls -la /var/lib/geoserver/data/

# JVM Memory Issues
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### WMS/WFS Error Messages

```
# Layer not available
  - Check Data Store Connection
  - Test PostgreSQL connection
  - Check Layer Permissions in GeoServer

# Performance problems
  - Increase JVM Heap Size
  - Check PostGIS indices
  - Enable GWC Caching
```

### Connection to PostgreSQL

```
# Test from GeoServer container
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# Network Connectivity
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## Security Configuration

### GeoServer Security

```
Admin user:
  - Username: admin (change in production)
  - Password: <STRONG_PASSWORD> (not default)

Role-Based Access:
  - ADMIN_ROLE: Full access
  - GROUP_ADMIN: Layer management
  - WMS_USER: Read-only access
  - WFS_USER: Feature access

Data Security:
  - Layer-level permissions
  - Workspace isolation
  - OGC Service limits
```

### Network Security

```
Firewall Rules:
  - Only Caddy proxy has access (Reverse Proxy)
  - No direct WAN exposure
  - Internal communication only with authorized services

TLS/SSL:
  - Via Caddy proxy (Let's Encrypt)
  - HSTS Header enabled
  - Modern Cipher Suites
```

## Integration with p2d2 Architecture

### Frontend Integration (WFS-T)

```
// AstroJS Frontend → GeoServer WFS-T
const wfsTransaction = `  <wfs:Transaction service="WFS" version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2"> <wfs:Insert> <feature:gebaeude xmlns:feature="http://www.data-dna.eu/features"> <feature:geom> <gml:Point srsName="EPSG:4326"> <gml:pos>7.0 51.0</gml:pos> </gml:Point> </feature:geom> </feature:gebaeude> </wfs:Insert> </wfs:Transaction> `;

// HTTP POST to GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
method: 'POST',
headers: { 'Content-Type': 'text/xml' },
body: wfsTransaction
});
```

### MapProxy Integration (WMS)

```
# MapProxy Configuration
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
- Regular GeoServer updates (Security Patches)
- Separate users for different access levels
- GWC Caching for frequently requested layers
- Monitor JVM performance (Heap Usage)
- Backup GeoServer configuration

❌ **Don't**:
- Use default passwords
- Expose GeoServer directly to the internet
- Allow unlimited MaxFeatures
- Run without resource limits
- Change configuration without backup

## References

- [GeoServer Documentation](https://docs.geoserver.org/)
- [GeoServer Security](https://docs.geoserver.org/stable/en/user/security/)
- [WFS-T Specification](https://www.ogc.org/standards/wfs)
- [Tomcat 9 Administration](https://tomcat.apache.org/tomcat-9.0-doc/)