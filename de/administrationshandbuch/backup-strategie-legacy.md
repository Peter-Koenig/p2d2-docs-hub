---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Backup-Strategie

Eine umfassende Backup-Strategie sichert p2d2 gegen Datenverlust ab.

## 3-2-1-Regel

- **3** Kopien der Daten
- **2** verschiedene Medien
- **1** Kopie offsite

## Backup-Komponenten

### PostgreSQL-Datenbank

**Methode**: pg_dump + WAL-Archivierung

```bash
# Tägliches Full-Backup
0 2 * * * /usr/local/bin/backup-postgres.sh

# /usr/local/bin/backup-postgres.sh
#!/bin/bash
BACKUP_DIR=/backup/postgresql
DATE=$(date +\%Y\%m\%d_\%H\%M\%S)

pg_dump -U p2d2 -F c -b -v -f $BACKUP_DIR/p2d2_$DATE.backup p2d2

# Alte Backups löschen (> 30 Tage)
find $BACKUP_DIR -name "p2d2_*.backup" -mtime +30 -delete

# Zu Offsite-Backup kopieren
rsync -avz $BACKUP_DIR/p2d2_$DATE.backup offsite:/backup/p2d2/
```

### GeoServer-Konfiguration

```bash
# Wöchentliches Backup
0 3 * * 0 tar -czf /backup/geoserver/geoserver-data-$(date +\%Y\%m\%d).tar.gz /opt/geoserver_data
```

### Frontend-Code

**Methode**: Git-Repository

- **Origin**: gitlab.opencode.de
- **Mirror**: GitLab unbox-cologne
- **Hub**: GitHub

### Proxmox-VMs

**Methode**: Proxmox Backup Server

```bash
# Tägliches VM-Backup
pvesh create /cluster/backup \
  --storage pbs-p2d2 \
  --vmid 100,101,102 \
  --dow mon,tue,wed,thu,fri,sat,sun \
  --starttime 01:00 \
  --mode snapshot \
  --compress zstd
```

## Retention-Policy

| Typ | Häufigkeit | Retention |
|-----|------------|-----------|
| Datenbank Full | Täglich | 30 Tage |
| Datenbank WAL | Kontinuierlich | 7 Tage |
| GeoServer-Config | Wöchentlich | 12 Wochen |
| VM-Snapshots | Täglich | 7 Tage |
| Offsite-Backup | Wöchentlich | 12 Monate |

## Restore-Tests

### Monatlicher Restore-Test

```bash
#!/bin/bash
# /usr/local/bin/test-restore.sh

# Test-Datenbank erstellen
createdb p2d2_restore_test

# Letztes Backup einspielen
LATEST_BACKUP=$(ls -t /backup/postgresql/p2d2_*.backup | head -1)
pg_restore -U p2d2 -d p2d2_restore_test $LATEST_BACKUP

# Verify
psql -U p2d2 p2d2_restore_test -c "SELECT COUNT(*) FROM features.friedhoefe;"

# Cleanup
dropdb p2d2_restore_test

echo "Restore-Test erfolgreich: $(date)" >> /var/log/restore-tests.log
```

## Disaster-Recovery

### RTO/RPO

- **RTO** (Recovery Time Objective): 4 Stunden
- **RPO** (Recovery Point Objective): 24 Stunden

### Recovery-Prozedur

1. **Proxmox-VM wiederherstellen** (von PBS)
2. **PostgreSQL wiederherstellen** (letztes Backup)
3. **GeoServer-Config wiederherstellen**
4. **Frontend deployen** (von Git)
5. **Services starten**
6. **Health-Checks durchführen**

### Disaster-Recovery-Dokumentation

```markdown
# DR-Runbook

## Schritt 1: VMs wiederherstellen
- PBS öffnen: https://pbs.example.com
- Backup auswählen: p2d2-gis-db, geoserver, frontend
- Restore auf Proxmox

## Schritt 2: Datenbank
ssh gis-db
sudo -u postgres createdb p2d2
sudo -u postgres pg_restore -d p2d2 /backup/latest.backup

## Schritt 3: GeoServer
ssh geoserver
tar -xzf /backup/geoserver-data-latest.tar.gz -C /opt/

## Schritt 4: Services
systemctl start postgresql
systemctl start geoserver
systemctl start nginx

## Schritt 5: Verification
curl https://www.data-dna.eu/api/health
```

## Backup-Monitoring

### Nagios-Check

```bash
#!/bin/bash
# /usr/lib/nagios/plugins/check_p2d2_backup

BACKUP_DIR=/backup/postgresql
LATEST=$(ls -t $BACKUP_DIR/p2d2_*.backup 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "CRITICAL: Kein Backup gefunden"
  exit 2
fi

AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST")) / 3600 ))

if [ $AGE -gt 48 ]; then
  echo "CRITICAL: Backup ist $AGE Stunden alt"
  exit 2
elif [ $AGE -gt 30 ]; then
  echo "WARNING: Backup ist $AGE Stunden alt"
  exit 1
else
  echo "OK: Backup ist $AGE Stunden alt"
  exit 0
fi
```

::: danger Restore-Tests
Backups ohne Restore-Tests sind wertlos! Führen Sie regelmäßig Restore-Tests durch.
:::
