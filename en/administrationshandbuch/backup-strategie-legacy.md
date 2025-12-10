---
quality:
  completeness: 50
  accuracy: 30
  reviewed: false
  reviewer: 'KI (Gemini)'
  reviewDate: null
---

# Backup Strategy (Legacy)

A comprehensive backup strategy protects p2d2 against data loss.

## 3-2-1 Rule

- **3** copies of the data
- **2** different media
- **1** copy offsite

## Backup Components

### PostgreSQL Database

**Method**: `pg_dump` + WAL Archiving

```bash
# Daily Full-Backup
0 2 * * * /usr/local/bin/backup-postgres.sh

# /usr/local/bin/backup-postgres.sh
#!/bin/bash
BACKUP_DIR=/backup/postgresql
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U p2d2 -F c -b -v -f $BACKUP_DIR/p2d2_$DATE.backup p2d2

# Delete old backups (> 30 days)
find $BACKUP_DIR -name "p2d2_*.backup" -mtime +30 -delete

# Copy to Offsite-Backup
rsync -avz $BACKUP_DIR/p2d2_$DATE.backup offsite:/backup/p2d2/
```

### GeoServer Configuration

```bash
# Weekly Backup
0 3 * * 0 tar -czf /backup/geoserver/geoserver-data-$(date +%Y%m%d).tar.gz /opt/geoserver_data
```

### Frontend Code

**Method**: Git Repository

  - **Origin**: gitlab.opencode.de
  - **Mirror**: GitLab unbox-cologne
  - **Hub**: GitHub

### Proxmox VMs

**Method**: Proxmox Backup Server

```bash
# Daily VM Backup
pvesh create /cluster/backup \
  --storage pbs-p2d2 \
  --vmid 100,101,102 \
  --dow mon,tue,wed,thu,fri,sat,sun \
  --starttime 01:00 \
  --mode snapshot \
  --compress zstd
```

## Retention Policy

| Type | Frequency | Retention |
|---|---|---|
| Database Full | Daily | 30 Days |
| Database WAL | Continuous | 7 Days |
| GeoServer Config | Weekly | 12 Weeks |
| VM Snapshots | Daily | 7 Days |
| Offsite Backup | Weekly | 12 Months |

## Restore Tests

### Monthly Restore Test

```bash
#!/bin/bash
# /usr/local/bin/test-restore.sh

# Create test database
createdb p2d2_restore_test

# Import last backup
LATEST_BACKUP=$(ls -t /backup/postgresql/p2d2_*.backup | head -1)
pg_restore -U p2d2 -d p2d2_restore_test $LATEST_BACKUP

# Verify
psql -U p2d2 p2d2_restore_test -c "SELECT COUNT(*) FROM features.friedhoefe;"

# Cleanup
dropdb p2d2_restore_test

echo "Restore test successful: $(date)" >> /var/log/restore-tests.log
```

## Disaster Recovery

### RTO/RPO

  - **RTO** (Recovery Time Objective): 4 hours
  - **RPO** (Recovery Point Objective): 24 hours

### Recovery Procedure

1.  **Restore Proxmox VM** (from PBS)
2.  **Restore PostgreSQL** (last backup)
3.  **Restore GeoServer Config**
4.  **Deploy Frontend** (from Git)
5.  **Start Services**
6.  **Perform Health Checks**

### Disaster Recovery Documentation

```markdown
# DR-Runbook

## Step 1: Restore VMs
- Open PBS: [https://pbs.example.com](https://pbs.example.com)
- Select Backup: p2d2-gis-db, geoserver, frontend
- Restore to Proxmox

## Step 2: Database
ssh gis-db
sudo -u postgres createdb p2d2
sudo -u postgres pg_restore -d p2d2 /backup/latest.backup

## Step 3: GeoServer
ssh geoserver
tar -xzf /backup/geoserver-data-latest.tar.gz -C /opt/

## Step 4: Services
systemctl start postgresql
systemctl start geoserver
systemctl start nginx

## Step 5: Verification
curl [https://www.data-dna.eu/api/health](https://www.data-dna.eu/api/health)
```

## Backup Monitoring

### Nagios Check

```bash
#!/bin/bash
# /usr/lib/nagios/plugins/check_p2d2_backup

BACKUP_DIR=/backup/postgresql
LATEST=$(ls -t $BACKUP_DIR/p2d2_*.backup 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "CRITICAL: No backup found"
  exit 2
fi

AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST")) / 3600 ))

if [ $AGE -gt 48 ]; then
  echo "CRITICAL: Backup is $AGE hours old"
  exit 2
elif [ $AGE -gt 30 ]; then
  echo "WARNING: Backup is $AGE hours old"
  exit 1
else
  echo "OK: Backup is $AGE hours old"
  exit 0
fi
```

::: danger Restore Tests
Backups without restore tests are worthless! Perform regular restore tests.
:::

> **Note:** This text was translated automatically with AI assistance and has not yet been reviewed by a human.