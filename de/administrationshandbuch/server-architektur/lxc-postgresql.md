---
title: PostgreSQL/PostGIS Container
description: Geodatenbank-Server mit räumlichen Erweiterungen
---

# LXC: PostgreSQL/PostGIS

## Container-Informationen

```
Typ: LXC (privileged/unprivileged je nach Setup)
OS: Debian 13 (trixie)
Hostname: postgresql (anpassbar)
Status: running

Ressourcen:
  RAM: 2 GB
  Disk: 15 GB (dynamisch erweiterbar)
  CPU Shares: Standard (1024)
```

## Installierte Software

### PostgreSQL
```
Version: 18.x (Debian Official Repository)
Service: postgresql.service (systemd)
Socket: UNIX + TCP/IP
Zugriff: Internes LAN (nicht öffentlich exponiert)
```

### PostGIS
```
Version: 3.6.x
Extension: Aktiviert in Produktions-Datenbank
Features: 
  - Räumliche Geometrie-Typen (Point, LineString, Polygon)
  - Räumliche Indizes (GiST, SP-GiST)
  - Koordinatentransformationen (SRID-Support)
  - Topologie-Support
```

## Datenbanken

| Database | PostGIS | Zweck |
|----------|---------|-------|
| `postgres` | ❌ | System-Datenbank (Standard) |
| `data-dna` | ✅ | **Produktions-DB für p2d2** |

::: tip PostGIS-Extension aktivieren
```
-- In neuer Datenbank
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Verifizierung
SELECT PostGIS_Full_Version();
```
:::

## Netzwerk-Zugang

```
Listening: 
  - TCP Port <STANDARD_PG_PORT> (alle Interfaces)
  - UNIX Socket: /var/run/postgresql/

pg_hba.conf:
  - localhost: Trust (für maintenance)
  - Internes LAN: md5 Password Authentication
  - WAN: DENY (über Firewall blockiert)
```

**Connection String** (für Anwendungen im gleichen LAN):
```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Systemd-Service

```
# Service-Status prüfen
systemctl status postgresql

# Service neu starten (mit Downtime)
systemctl restart postgresql

# Logs anzeigen
journalctl -u postgresql -f --no-pager

# Service enablen (Autostart)
systemctl enable postgresql
```

## PostGIS-Funktionen

### Spatial Queries
```
-- Punkt-in-Polygon-Test
SELECT name FROM kommunen 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- Distanz-Berechnung (in Metern)
SELECT ST_Distance(
  ST_Transform(geom1, 3857),
  ST_Transform(geom2, 3857)
);

-- Buffer (500m Puffer um Geometrie)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### Performance-Optimierung
```
-- Räumlichen Index erstellen
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- Statistiken aktualisieren
ANALYZE kommunen;

-- Vacuum für Cleanup
VACUUM ANALYZE kommunen;
```

## Backup-Strategie

### PBS-Snapshot (Container-Level)
- **Zeitplan**: Täglich nachts
- **Retention**: 14 Tage
- **Typ**: LVM-Thin Snapshot (konsistent)

### SQL-Dumps (Datenbank-Level)
```
# Manuelles Backup
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automatisierung via Cronjob
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# Alte Backups löschen (>30 Tage)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning Backup-Komplementarität
PBS-Snapshots sind schnell für Container-Restore. SQL-Dumps erlauben selektive Tabellenwiederherstellung und sind portabel zwischen PostgreSQL-Versionen.
:::

## Performance-Tuning

### Empfohlene postgresql.conf Anpassungen
```
# Memory (für 2GB RAM Container)
shared_buffers = 512MB            # 25% von RAM
effective_cache_size = 1536MB     # 75% von RAM
work_mem = 16MB                   # Per-Query Memory
maintenance_work_mem = 128MB      # Für VACUUM/CREATE INDEX

# PostGIS-Optimierungen
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # SSD-optimiert (statt 4.0 für HDD)
```

### Query-Analyse
```
-- Slow Queries identifizieren (Extension pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 Sekunde
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitoring

```
-- Aktive Verbindungen
SELECT count(*), state FROM pg_stat_activity 
GROUP BY state;

-- Datenbank-Größe
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- Größte Tabellen
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Troubleshooting

### Container startet nicht
```
# Auf Proxmox-Host
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # Letzte Boot-Logs
```

### PostgreSQL startet nicht
```
# Im Container
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# Konfigurationsdatei testen
su - postgres -c "postgres -C config_file"
```

### Verbindungsprobleme
```
# Lauscht PostgreSQL?
ss -tlnp | grep postgres

# Firewall-Regel vorhanden?
iptables -L -n | grep <PORT>

# pg_hba.conf prüfen
cat /etc/postgresql/*/main/pg_hba.conf
```

## Erweiterung für Ory IAM (geplant)

Für die geplante Ory-Integration werden zusätzliche Datenbanken benötigt:

```
-- Ory-Kratos Datenbank
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Ory-Hydra Datenbank
CREATE USER ory_hydra WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

Details: [Ory IAM-Integration](./lxc-ory-iam.md)

## Best Practices

✅ **Do**:
- Regelmäßige VACUUM ANALYZE für Performance
- Räumliche Indizes auf Geometrie-Spalten
- Connection Pooling (pgBouncer) für hohe Last
- Separate User-Accounts mit minimalen Privilegien

❌ **Don't**:
- PostgreSQL als Root-User laufen lassen
- Standard-Passwörter verwenden
- Direkte WAN-Exposition der Datenbank
- Große Geometrien ohne Generalisierung speichern

## Referenzen

- [PostgreSQL 18 Dokumentation](https://www.postgresql.org/docs/18/)
- [PostGIS 3.6 Manual](https://postgis.net/docs/manual-3.6/)
- [Performance-Tuning Guide](https://wiki.postgresql.org/wiki/Performance_Optimization)