---
title: Backup Strategy
description: Data backup and disaster recovery for the p2d2 server
quality:
  completeness: 95
  accuracy: 95
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-01-27
---

# Backup Strategy

The backup strategy for the p2d2 server follows the **3-2-1 rule** and uses a **tiered backup system** with geographic redundancy.

## Backup architecture

### Components

1. **Proxmox host** (Hetzner server)  
   - Web UI port: **** (2FA enabled)  
   - Executes backup jobs  
   - Access credentials are not documented

2. **Proxmox Backup Server (PBS) – Hetzner**  
   - Web UI port: **** (2FA enabled)  
   - Storage: ZFS, 2× SSD (mirror), ~49 GB  
   - Role: **backup cache** (short retention)  
   - Datastore: `p2d2-pbs-local`  
   - Access credentials are not documented

3. **Proxmox Backup Server (PBS) – Home office**  
   - Network: private network (via WireGuard)  
   - Role: **long-term archive** (long retention)  
   - Connection: WireGuard tunnel from the Proxmox host

### Network connection

```bash
# WireGuard tunnel between Hetzner and home office
Interface: wg-kinglui
Port: 51015
Persistent Keepalive: 25 seconds
```

**Connectivity checks:**

```bash
# On Proxmox host
wg show

# Ping the home office PBS
ping <HOMEOFFICE_PBS_IP>
```

::: tip 3-2-1 rule satisfied
- **3 copies**: production + Hetzner PBS + home office PBS  
- **2 media types**: Hetzner storage + home office storage  
- **1 offsite copy**: home office is geographically separate
:::

## Backup workflow

### 1. Local backups (Hetzner → Hetzner PBS)

Backup jobs run on the Proxmox host and store directly to the local PBS.

**Benefits:**
- High performance (low latency)
- Independent from the WireGuard connection
- Fast snapshots

**Retention on Hetzner PBS:**

```
Keep Last: 2–3 (most recent backups only)
Keep Monthly: 2 (monthly snapshots)
```

::: warning Storage management
The Hetzner PBS has limited space (~49 GB). Short retention ensures enough room for new backups. The long-term archive is in the home office.
:::

**Retention configuration:**

```bash
# Proxmox GUI: Datacenter → Backup → Edit job
# → Retention: Keep Last = 2–3, Keep Monthly = 2
```

### 2. Sync to home office PBS (pull)

The **home office PBS pulls** backups from the Hetzner PBS over WireGuard.

**Sync job configuration:**

```
Direction: Pull (Home office ← Hetzner)
Schedule: Daily (after backup windows)
Remove vanished: Disabled (home office keeps old backups)
```

**Benefits of pull mode:**
- Home office initiates the connection
- Only deduplicated chunks are transferred
- Network efficient due to PBS deduplication
- No outgoing connections required from the Hetzner server

## Backup schedule

### Backup jobs (Proxmox → Hetzner PBS)

| Component          | VM/LXC | Schedule | Backup type                  |
|--------------------|--------|----------|------------------------------|
| OPNsense firewall  | VM     | Daily    | Snapshot                     |
| PostgreSQL/PostGIS | LXC    | Daily    | Snapshot + SQL dump          |
| GeoServer          | LXC    | Daily    | Snapshot                     |
| MapProxy           | LXC    | Daily    | Snapshot                     |
| Frontend (AstroJS) | LXC    | Daily    | Snapshot                     |
| Ory IAM            | LXC    | Daily    | Snapshot                     |

::: warning Backup window
Backups run **outside peak usage hours** (night). Exact times are intentionally not documented for security reasons.
:::

### Maintenance jobs (timeline)

#### Hetzner PBS

```
After each backup: Auto-prune (according to retention)
Daily 07:00: Garbage collection
Weekly (Sunday 03:00): Verify job
```

#### Home office PBS

```
Daily 01:00: Sync job (pull from Hetzner)
Daily 06:00: Prune job
Daily 07:00: Garbage collection
Weekly (Sunday 04:00): Verify job
```

::: tip Avoid overlapping jobs
Verify, GC and sync jobs should **never run concurrently**. Time separation avoids resource conflicts.
:::

## Retention policies

### Hetzner PBS (cache)

```
Keep Last: 2–3
Keep Monthly: 2
```

**Purpose:** Short-term backup cache for fast restores and sync to the home office.

**Typical usage:**
- 6 VMs/LXCs × 2–3 backups = 12–18 snapshots
- ~35–40 GB used out of 49 GB  
- After GC: enough free space for new backups

### Home office PBS (long-term archive)

```
Keep Last: 7
Keep Daily: 7
Keep Weekly: 4
Keep Monthly: 6
```

**Purpose:** Long-term retention for disaster recovery and historical restores.

## PostgreSQL backup strategy

PostgreSQL requires special attention for data consistency.

### Two-layer backup

1. **Container snapshot** (via Proxmox backup)  
   - Filesystem-consistent  
   - PostgreSQL crash recovery works in 99%+ of cases  
   - Fast and automatic

2. **Logical backup** (pg_dumpall)  
   - SQL dump of all databases  
   - Can be restored across PostgreSQL versions  
   - Additional safety layer

### PostgreSQL dump configuration

**Inside the PostgreSQL LXC container:**

```bash
# As root inside the container
mkdir -p /var/backups/postgresql
chown postgres:postgres /var/backups/postgresql

# Set up a cron job for the postgres user
crontab -e -u postgres

# Daily dump at 03:00 (after Proxmox backups)
0 3 * * * pg_dumpall | gzip > /var/backups/postgresql/postgres-$(date +\%Y\%m\%d).sql.gz

# Delete dumps older than 7 days
0 4 * * * find /var/backups/postgresql -name "postgres-*.sql.gz" -mtime +7 -delete
```

**Dump monitoring:**

```bash
# On the Proxmox host: list dumps inside the container
pct exec <POSTGRES_VMID> -- ls -lh /var/backups/postgresql/

# Check size and age of latest dump
pct exec <POSTGRES_VMID> -- bash -c 'ls -lh /var/backups/postgresql/*.gz | tail -1'
```

::: info Why no pg_backup_start/stop hook?
Modern PostgreSQL versions frequently change the backup API (for example `pg_start_backup` → `pg_backup_start` in v15+). Hook scripts must be maintained whenever PostgreSQL is upgraded. The combination of snapshot + pg_dump is **maintenance-free** and **version agnostic**.
:::

### PostgreSQL recovery scenarios

| Scenario              | Probability | Action                            | Data loss         |
|-----------------------|-------------|-----------------------------------|-------------------|
| Normal                | ~99.5%      | Restore snapshot → crash recovery | 0 seconds         |
| WAL issue             | ~0.4%       | Snapshot restore → WAL recovery   | Seconds to minutes|
| Complete failure      | ~0.1%       | Restore pg_dump                   | Up to 1 day       |

**Detecting crash recovery:**

```bash
# After restore, check PostgreSQL logs
pct exec <POSTGRES_VMID> -- tail -100 /var/log/postgresql/postgresql-*-main.log

# Typical recovery messages:
# LOG:  database system was interrupted; last known up at ...
# LOG:  database system was not properly shut down; automatic recovery in progress
# LOG:  redo starts at ...
# LOG:  database system is ready to accept connections
```

**If snapshot recovery fails:**

```bash
# Inside PostgreSQL container
# 1. Locate latest dump
ls -lh /var/backups/postgresql/

# 2. Re-initialize cluster
pg_dropcluster --stop <VERSION> main
pg_createcluster <VERSION> main

# 3. Restore dump
gunzip -c /var/backups/postgresql/postgres-YYYYMMDD.sql.gz | psql -U postgres

# Data loss: at most one day
```

## Maintenance tasks

### Prune & garbage collection

#### What is prune?

**Prune** removes old backup snapshots according to the retention policy:
- Deletes metadata and snapshot references
- Does **not** free disk space immediately
- Runs automatically after backup jobs (Hetzner)
- Needs a separate job on the home office PBS (because of sync)

#### What is garbage collection (GC)?

**GC** actually frees disk space:
- Deletes chunks not referenced by any snapshot
- **Essential** for reclaiming space after prune
- Runs daily after prune jobs
- Can be CPU and IO intensive (do not run during backups)

::: danger GC is mandatory
Without GC, disk usage will not decrease even if backups are pruned. GC **must** run regularly.
:::

**Workflow:**

```
1. Backup job creates a snapshot
2. Prune marks old snapshots for deletion
3. GC removes unreferenced data chunks
4. Disk space is freed
```

#### Configure GC job

**Hetzner PBS:**

```bash
# GUI: Datastore → Prune & GC → Schedule
Schedule: Daily 07:00
```

**Home office PBS:**

```bash
# GUI: Datastore → Prune & GC → Schedule
Schedule: Daily 07:00
```

#### Run GC manually

```bash
# On PBS
proxmox-backup-manager garbage-collect <datastore-name>

# Or via GUI: Datastore → Content → Garbage Collection → Start GC
```

**Check usage after GC:**

```bash
df -h /path/to/datastore

# Or in GUI: Datastore → Summary → Usage
```

### Verify jobs

**Verify** checks the integrity of stored data:

- Verifies checksums of all chunks
- Ensures data is not corrupted
- Confirms that restores would work
- Logs any issues

**Configuration:**

| PBS        | Schedule | Max depth | Reason                         |
|------------|----------|-----------|--------------------------------|
| Hetzner    | Weekly   | Current   | Cache only, resource intensive |
| Home office| Weekly   | All       | Long-term archive              |

**Setup:**

```bash
# GUI: Datastore → Verify Jobs → Add
Schedule: Weekly (Sunday 03:00 for Hetzner, 04:00 for home office)
```

**Check verify logs:**

```bash
# GUI: Datastore → Verify Jobs → Task History

# Or CLI:
journalctl -u proxmox-backup.service | grep -i verify
```

## Restore scenarios

### Restore a single VM/LXC

**Via GUI:**

```
1. Proxmox Web UI → Storage → PBS → Content
2. Select backup
3. Click “Restore” → select target node → Start
```

**Via CLI:**

```bash
# Restore LXC
pct restore <NEW_VMID> <backup-path> --storage <storage>

# Restore VM
qmrestore <backup-path> <NEW_VMID>
```

### Restore individual files

```bash
# On PBS: mount backup
proxmox-backup-client mount <snapshot> /mnt/backup

# Copy files
cp /mnt/backup/path/to/file /destination/

# Unmount
umount /mnt/backup
```

### Disaster recovery (complete server loss)

#### Preparation

Document:

- Hetzner server details (product ID, IP addresses)
- PBS fingerprints (for storage configuration)
- WireGuard setup (keys, endpoints)
- Network configuration (VLANs, IP ranges)

#### Recovery steps

**1. Reinstall Proxmox:**

```bash
# Boot into Hetzner rescue system
# Install Proxmox VE (ISO or Hetzner installimage)
```

**2. Configure network:**

```bash
# /etc/network/interfaces
# Bridges (vmbr0, vmbr1, vmbr2) as in the network architecture

# Restore WireGuard
# /etc/wireguard/wg-kinglui.conf
```

**3. Add PBS storage:**

```bash
# On home office PBS: get fingerprint
proxmox-backup-manager cert info

# On Proxmox host: add storage
pvesm add pbs p2d2-pbs-homeoffice \
  --server <HOMEOFFICE_PBS_IP> \
  --datastore <DATASTORE> \
  --username <USER>@pbs \
  --fingerprint <PBS_FINGERPRINT>

# Check status
pvesm status
```

**4. Restore VMs/LXCs:**

```bash
# List available backups
pvesm list p2d2-pbs-homeoffice

# Restore OPNsense VM first (for network)
qmrestore <backup-id> 120 --storage local-lvm

# Restore LXCs
pct restore 110 <backup-id> --storage local-lvm  # PostgreSQL
pct restore 111 <backup-id> --storage local-lvm  # GeoServer
# etc.
```

**5. Verify networking:**

```bash
# Start VMs/LXCs
qm start 120       # OPNsense
pct start 110      # PostgreSQL

# Test connectivity
ping <INTERNAL_IPS>
```

::: tip Fingerprint issues
If you see `fingerprint not verified, abort!`:

```bash
# On PBS: get current fingerprint
proxmox-backup-manager cert info

# On Proxmox: update storage
pvesm set <STORAGE_NAME> --fingerprint '<NEW_FINGERPRINT>'
```
:::

## Backup types

### LXC container snapshots

**Snapshot mode (default):**
- Fast (seconds)
- Filesystem-consistent
- Recommended for stateless containers (frontend, GeoServer, MapProxy)

**Stop mode:**
- Container is stopped during backup
- Guarantees consistency
- Longer downtime
- Only for critical systems if needed

### VM snapshots

**Snapshot mode:**
- QEMU guest agent creates a consistent snapshot
- VM continues running (short freeze)
- Recommended for OPNsense, OSM tile server

**Stop mode:**
- VM is shut down for backup
- No runtime inconsistencies possible
- Longer downtime

## Monitoring & alerts

### Check backup status

**On Proxmox host:**

```bash
# Last backup status
tail -50 /var/log/vzdump.log

# Active backup tasks
cat /var/log/pve/tasks/active
```

**On PBS:**

```bash
# Datastore status
proxmox-backup-manager status

# Storage usage
df -h /path/to/datastore
```

### Key metrics

| Metric                 | Threshold  | Action                        |
|------------------------|-----------:|--------------------------------|
| Last successful backup | < 48 hours | Manually run backup, check logs|
| PBS storage (Hetzner)  | > 85%      | Reduce retention or run GC     |
| PBS storage (home office) | > 70%  | Extend storage or prune        |
| Verify errors          | > 0        | Re-run backup, check storage   |
| Sync age               | > 24 hours | Check WireGuard, run sync      |

### Email notifications

```bash
# Proxmox: Datacenter → Notifications
# Configure mail for failed backups, verify errors, low disk space
```

On PBS:

```bash
# GUI: Configuration → Notifications → Add
# Events: Backup failed, Verify failed, Low disk space
```

## Security

### PBS access

- **2FA enabled** on both PBS instances (Hetzner + home office)  
- **Credentials are not documented**  
- **Separate users** for backup jobs (not `root@pam`)  
- PBS fingerprints exchanged via secure channels

### WireGuard security

- Never commit private keys to Git  
- Regular key rotation (recommended: yearly)  
- Firewall rules: only PBS port via WireGuard  
- Monitor handshake times (`wg show`)

### Encryption

PBS supports **client-side encryption**:

```bash
# Generate encryption key
proxmox-backup-client key create --kdf scrypt /root/backup-encryption.key

# Store key securely (offline, encrypted)

# Enable in backup job
# GUI: Datacenter → Backup → Edit → Encryption Key
```

**Trade-offs:**
- **Pros:** Protection if PBS is compromised, better compliance  
- **Cons:** Key management overhead, slower restores, key loss = data loss  
- **Recommendation for p2d2:** Not required (geographically separated sites, 2FA)

## Troubleshooting

### Backups failing

```bash
# 1. Check logs
tail -100 /var/log/vzdump.log

# 2. Fingerprint verification
pvesm status | grep pbs

# 3. PBS reachability
ping <PBS_IP>
curl -k https://<PBS_IP>:****

# 4. Disk space
# PBS GUI: Datastore → Summary → Usage
```

### Sync job not running

```bash
# 1. Check WireGuard on Proxmox host
wg show
ping <HOMEOFFICE_PBS_IP>

# 2. Check WireGuard service
systemctl status wg-quick@wg-kinglui

# 3. Check firewall rules
# Ensure PBS port is allowed over WireGuard

# 4. Check PBS credentials on home office PBS
# GUI: Sync Jobs → Edit → Test connection
```

### Disk space not freed

```bash
# 1. Check prune history
# GUI: PBS → Datastore → Prune & GC → Task history

# 2. Run GC manually
proxmox-backup-manager garbage-collect <DATASTORE>

# 3. Verify GC schedule
# GUI: Datastore → Prune & GC → Schedule GC

# 4. Check logs
journalctl -u proxmox-backup.service -f
```

Typical causes:
- Prune runs, but GC is not configured  
- GC runs, but many chunks are still shared (deduplication)  
- Retention changed, but old snapshots not yet pruned

### PostgreSQL container fails after restore

```bash
# 1. Check PostgreSQL logs
pct exec <VMID> -- tail -100 /var/log/postgresql/*.log

# Example error: "could not locate a valid checkpoint"
# → crash recovery failed

# 2. Use pg_dump for recovery
pct exec <VMID> -- bash
cd /var/backups/postgresql
ls -lh  # find latest dump

# 3. Reinitialize cluster
pg_dropcluster --stop <VERSION> main
pg_createcluster <VERSION> main

# 4. Restore dump
gunzip -c postgres-YYYYMMDD.sql.gz | psql -U postgres
```

### WireGuard instability

```bash
# On Proxmox host
wg show

# If "latest handshake" > 2 minutes:
ping <HOMEOFFICE_ENDPOINT_IP>

# If using DNS: try IP instead of hostname in WireGuard config

# Restart WireGuard
systemctl restart wg-quick@wg-kinglui

# Check firewall
iptables -L -n | grep <WG_PORT>
```

## Best practices

1. **Test restores regularly** (quarterly)  
   - Restore into test VMs/LXCs  
   - Test PostgreSQL dump restores  
   - Document recovery times  

2. **Monitor verify jobs**  
   - Treat verify errors as critical  
   - Recreate affected backups  

3. **Back up before changes**  
   - Before updates  
   - Before major configuration changes  
   - Trigger manual backup outside schedule  

4. **Keep documentation current**  
   - After config changes  
   - After hardware changes  
   - When PBS fingerprints change  

5. **Do not forget GC**  
   - Ensure automatic GC jobs exist  
   - Run GC manually after retention changes  
   - Monitor datastore usage  

6. **Monitor WireGuard health**  
   - Handshake age, packet counters  
   - Critical for offsite backups  

7. **Check PostgreSQL dumps**  
   - Verify that new dumps are created daily  
   - Occasionally test a full restore in a dev environment  

## Further reading

- Proxmox Backup Server documentation  
- Proxmox VE Backup and Restore  
- WireGuard documentation  
- PostgreSQL Backup and Recovery  
- 3-2-1 backup strategy
```
