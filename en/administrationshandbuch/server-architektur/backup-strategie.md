---
title: Backup Strategy
description: Data backup and disaster recovery
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# Backup Strategy

## Proxmox Backup Server (PBS)

### Storage Configuration

```
Storage Name: p2d2-pbs
Type: Proxmox Backup Server (deduplicating)
Content: Backups (VMs + LXCs)
Status: Active, Shared
Deduplication: Enabled (chunk-based)
Encryption: Optionally configurable
```

::: tip PBS Advantages
- **Incremental Backups**: Only changes since the last backup
- **Deduplication**: Store multiply existing data only once
- **Verification**: Automatic backup integrity check
- **Fast Restores**: Direct access to snapshots
:::

### Backup Schedule (Generalized)

**Backup Jobs** (configured via Proxmox Web-UI):

| Component | Schedule | Retention | Type |
|------------|----------|-----------|-----|
| OPNSense (Firewall) | Daily | 7 days | Snapshot |
| PostgreSQL/PostGIS | Daily | 14 days | Snapshot |
| GeoServer | Weekly | 4 weeks | Snapshot |
| MapProxy | Weekly | 4 weeks | Snapshot |
| OSM-Tiler | Monthly | 3 months | Snapshot |
| Frontend (AstroJS) | Daily | 7 days | Snapshot |

::: warning Backup Window
Backups should run **outside of peak usage times** (typically at night). Backup times are deliberately **not specifically documented** (Security Best Practice).
:::

### Backup Types

#### Container Snapshots (LXC)
```
# Create manual backup
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# Check backup status
pvesm list p2d2-pbs | grep "ct-<VMID>"

# Restore container from backup
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**Advantages LVM-Thin Snapshots**:
- Consistent (Filesystem-Level)
- Fast (only Metadata-Copy)
- No service downtime during backup

#### VM Backups (QEMU/KVM)
```
# VM Backup (with suspend for consistency)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# Restore VM
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### Retention Policy

```
Daily Backups:
  - Retention: 7 days
  - Services: PostgreSQL, Frontend, Firewall

Weekly Backups:
  - Retention: 4 weeks
  - Services: GeoServer, MapProxy

Monthly Backups:
  - Retention: 3 months
  - Services: OSM-Tiler (large data volumes)

Automatic Pruning: PBS Prune Job (daily)
```

## Database Backups (In addition to PBS)

### PostgreSQL pg_dump

```
# SQL-Dump (on PostgreSQL container)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automation via Cron
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# Delete old backups (>30 days)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**Why in addition to PBS?**:
- ✅ Selective restore of individual tables
- ✅ Portable between PostgreSQL versions
- ✅ Smaller backup size (compressed)
- ✅ Import into test environments without container restore

### PostGIS Custom Format

```
# Custom Format (with binary objects)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# Restore (selective possible)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## Configuration Backups

### Caddy (OPNSense)

```
# Secure Caddyfile + Custom Configs
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz  
/usr/local/etc/caddy/Caddyfile  
/usr/local/etc/caddy/caddy.d/

# TLS Certificates (automatically backed up via PBS VM backup)
```

### Systemd Services (Frontend)

```
# Back up all p2d2 services
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz  
/etc/systemd/system/astro-*.service  
/etc/systemd/system/webhook-server.service
```

## Disaster Recovery

### Complete Host Failure

**Scenario**: Proxmox server hardware failure

**Recovery Steps**:

1.  **Set up new Proxmox Host**
    ```
    # Install Proxmox VE from ISO
    # Restore network configuration (Bridges)
    ```

2.  **Mount PBS Storage**
    ```
    # In Proxmox Web-UI: Datacenter → Storage → Add → PBS
    # PBS Server: <PBS_IP_OR_HOSTNAME>
    # Datastore: p2d2-backups
    ```

3.  **Restore Containers/VMs**
    ```
    # Via Web-UI: Storage → p2d2-pbs → Content → Restore
    # Or CLI:
    pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
    qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
    ```

4.  **Verify Services**
    ```
    # PostgreSQL
    pct exec <PG_VMID> -- systemctl status postgresql
    
    # Database integrity
    pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
    ```

### Individual Container Failure

**Scenario**: PostgreSQL container corrupt

```
# Stop container
pct stop <PG_VMID>

# Restore from backup
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<DATE>.tar.zst --force

# Start container
pct start <PG_VMID>

# Check service status
pct exec <PG_VMID> -- systemctl status postgresql
```

### Database Corruption

**Scenario**: PostgreSQL data corrupt, but container is OK

```
# Drop database
sudo -u postgres dropdb data-dna

# Recreate
sudo -u postgres createdb data-dna

# Restore SQL dump
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# Re-enable PostGIS extension
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## Off-Site Backups

Currently, all instances are backed up to the local Proxmox Backup Server. After backup, the backups are synchronized with a remote PBS located in Germany.

## Backup Verification

All backups are verified weekly on both PBS servers.

### Monthly Restore Test (planned)

```
# Create test container from backup
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst  
--hostname postgresql-test  
--storage local-lvm

# Check service start
pct start 999
pct exec 999 -- systemctl status postgresql

# Test database access
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# Cleanup
pct stop 999
pct destroy 999
```

### Database Integrity Check

```
-- PostGIS functionality
SELECT PostGIS_Full_Version();

-- Number of records (Plausibility check)
SELECT
'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT
'geometries' AS table_name, COUNT(*) FROM geometries;

-- Geometry validity
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## Backup Monitoring

### Proxmox Task Logs

```
# View backup logs
cat /var/log/vzdump.log | grep "ERROR|WARN"

# Check PBS status
proxmox-backup-manager tasks list

# Storage Usage
pvesm status p2d2-pbs
```

### Alerting Configuration

```
# Email notifications for backup failures
# In Proxmox Web-UI: Datacenter → Notifications

# Custom monitoring script
#!/bin/bash

# /etc/cron.hourly/backup-check

LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## Best Practices

✅ **Do**:
- Perform regular restore tests
- Monitor backup logs and analyze errors
- Adjust retention policies to business requirements
- Document configuration changes
- Set up monitoring for backup jobs

❌ **Don't**:
- Assume backups are working without verification
- Back up critical data to only one medium
- Ignore backup errors
- Operate without a disaster recovery plan
- Not monitor backup capacity

## References

- [Proxmox Backup Server Documentation](https://pbs.proxmox.com/docs/)
- [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
- [3-2-1 Backup Rule](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)