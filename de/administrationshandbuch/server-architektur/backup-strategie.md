---
title: Backup-Strategie
description: Datensicherung und Disaster Recovery
---

# Backup-Strategie

## Proxmox Backup Server (PBS)

### Storage-Konfiguration

```
Storage-Name: p2d2-pbs
Typ: Proxmox Backup Server (deduplizierend)
Content: Backups (VMs + LXCs)
Status: Active, Shared
Deduplikation: Enabled (chunk-basiert)
Verschlüsselung: Optional konfigurierbar
```

::: tip PBS-Vorteile
- **Inkrementelle Backups**: Nur Änderungen seit letztem Backup
- **Deduplikation**: Mehrfach vorhandene Daten nur einmal speichern
- **Verifizierung**: Automatische Backup-Integritätsprüfung
- **Schnelle Restores**: Direkter Zugriff auf Snapshots
:::

### Backup-Schedule (Generalisiert)

**Backup-Jobs** (konfiguriert via Proxmox Web-UI):

| Komponente | Zeitplan | Retention | Typ |
|------------|----------|-----------|-----|
| OPNSense (Firewall) | Täglich | 7 Tage | Snapshot |
| PostgreSQL/PostGIS | Täglich | 14 Tage | Snapshot |
| GeoServer | Wöchentlich | 4 Wochen | Snapshot |
| MapProxy | Wöchentlich | 4 Wochen | Snapshot |
| OSM-Tiler | Monatlich | 3 Monate | Snapshot |
| Frontend (AstroJS) | Täglich | 7 Tage | Snapshot |

::: warning Backup-Fenster
Backups sollten **außerhalb der Hauptnutzungszeiten** laufen (typischerweise nachts). Backup-Zeitpunkte sind bewusst **nicht spezifisch dokumentiert** (Security-Best-Practice).
:::

### Backup-Typen

#### Container-Snapshots (LXC)
```
# Manuelles Backup erstellen
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# Backup-Status prüfen
pvesm list p2d2-pbs | grep "ct-<VMID>"

# Container aus Backup wiederherstellen
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**Vorteile LVM-Thin Snapshots**:
- Konsistent (Filesystem-Level)
- Schnell (nur Metadata-Copy)
- Kein Service-Downtime während Backup

#### VM-Backups (QEMU/KVM)
```
# VM-Backup (mit Suspend für Konsistenz)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# VM wiederherstellen
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### Retention-Policy

```
Tägliche Backups: 
  - Retention: 7 Tage
  - Services: PostgreSQL, Frontend, Firewall

Wöchentliche Backups:
  - Retention: 4 Wochen
  - Services: GeoServer, MapProxy

Monatliche Backups:
  - Retention: 3 Monate
  - Services: OSM-Tiler (große Datenmengen)

Automatische Bereinigung: PBS Prune-Job (täglich)
```

## Datenbank-Backups (Zusätzlich zu PBS)

### PostgreSQL pg_dump

```
# SQL-Dump (auf PostgreSQL-Container)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automatisierung via Cron
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# Alte Backups löschen (>30 Tage)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**Warum zusätzlich zu PBS?**:
- ✅ Selektive Wiederherstellung einzelner Tabellen
- ✅ Portabel zwischen PostgreSQL-Versionen
- ✅ Kleinere Backup-Größe (komprimiert)
- ✅ Import in Test-Umgebungen ohne Container-Restore

### PostGIS-Custom Format

```
# Custom Format (mit Binary Objects)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# Restore (selektiv möglich)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## Konfigurations-Backups

### Caddy (OPNSense)

```
# Caddyfile + Custom Configs sichern
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/Caddyfile \
  /usr/local/etc/caddy/caddy.d/

# TLS-Zertifikate (automatisch via PBS-VM-Backup gesichert)
```

### Systemd-Services (Frontend)

```
# Alle p2d2-Services sichern
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/systemd/system/webhook-server.service
```

## Disaster Recovery

### Vollständiger Host-Ausfall

**Szenario**: Proxmox-Server Hardware-Defekt

**Recovery-Steps**:

1. **Neuer Proxmox-Host aufsetzen**
   ```
   # Proxmox VE von ISO installieren
   # Netzwerk-Konfiguration (Bridges) wiederherstellen
   ```

2. **PBS-Storage mounten**
   ```
   # In Proxmox Web-UI: Datacenter → Storage → Add → PBS
   # PBS-Server: <PBS_IP_OR_HOSTNAME>
   # Datastore: p2d2-backups
   ```

3. **Container/VMs wiederherstellen**
   ```
   # Via Web-UI: Storage → p2d2-pbs → Content → Restore
   # Oder CLI:
   pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
   qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
   ```

4. **Services verifizieren**
   ```
   # PostgreSQL
   pct exec <PG_VMID> -- systemctl status postgresql
   
   # Datenbank-Integrität
   pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
   ```

### Einzelner Container-Ausfall

**Szenario**: PostgreSQL-Container korrupt

```
# Container stoppen
pct stop <PG_VMID>

# Aus Backup wiederherstellen
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<DATUM>.tar.zst --force

# Container starten
pct start <PG_VMID>

# Service-Status prüfen
pct exec <PG_VMID> -- systemctl status postgresql
```

### Datenbank-Korruption

**Szenario**: PostgreSQL-Daten korrupt, aber Container OK

```
# Datenbankbenk droppen
sudo -u postgres dropdb data-dna

# Neu erstellen
sudo -u postgres createdb data-dna

# SQL-Dump wiederherstellen
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# PostGIS-Extension erneut aktivieren
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## Off-Site Backups

Derzeit werden alle Instanzen im lokalen Proxmox-Backup- gesichert. Nach der Sicherung werden die Backups mit einem Remote-PBS mit Standort in Deutschland synchronisiert. 


## Backup-Verifizierung

Alle Backups werden einmal wöchentlich sowohl auf beiden PBS verifiziert.

### Monatlicher Restore-Test (geplant)

```
# Test-Container aus Backup erstellen
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst \
  --hostname postgresql-test \
  --storage local-lvm

# Service-Start prüfen
pct start 999
pct exec 999 -- systemctl status postgresql

# Datenbank-Zugriff testen
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# Cleanup
pct stop 999
pct destroy 999
```

### Datenbank-Integrität prüfen

```
-- PostGIS-Funktionalität
SELECT PostGIS_Full_Version();

-- Anzahl Datensätze (Plausibilitätscheck)
SELECT 
  'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT 
  'geometries' AS table_name, COUNT(*) FROM geometries;

-- Geometrie-Validität
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## Backup-Monitoring

### Proxmox-Task-Logs

```
# Backup-Logs anzeigen
cat /var/log/vzdump.log | grep "ERROR\|WARN"

# PBS-Status prüfen
proxmox-backup-manager tasks list

# Storage-Usage
pvesm status p2d2-pbs
```

### Alerting-Konfiguration

```
# Email-Benachrichtigungen für Backup-Fehler
# In Proxmox Web-UI: Datacenter → Notifications

# Custom Monitoring-Skript
#!/bin/bash
# /etc/cron.hourly/backup-check
LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## Best Practices

✅ **Do**:
- Regelmäßige Restore-Tests durchführen
- Backup-Logs überwachen und Fehler analysieren
- Retention-Policies an Geschäftsanforderungen anpassen
- Konfigurationsänderungen dokumentieren
- Monitoring für Backup-Jobs einrichten

❌ **Don't**:
- Backups ohne Verifizierung als funktionierend annehmen
- Kritische Daten nur auf einem Medium sichern
- Backup-Fehler ignorieren
- Ohne Disaster-Recovery-Plan arbeiten
- Backup-Kapazität nicht überwachen

## Referenzen

- [Proxmox Backup Server Dokumentation](https://pbs.proxmox.com/docs/)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
- [3-2-1 Backup Rule](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)
