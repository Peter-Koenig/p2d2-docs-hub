---
title: PostgreSQL/PostGIS Container
description: Geodatabase server with spatial extensions
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# LXC: PostgreSQL/PostGIS

## Container Information

```
Type: LXC (privileged/unprivileged depending on setup)
OS: Debian 13 (trixie)
Hostname: postgresql (customizable)
Status: running

Resources:
RAM: 2 GB
Disk: 15 GB (dynamically expandable)
CPU Shares: Standard (1024)
```

## Installed Software

### PostgreSQL
```
Version: 18.x (Debian Official Repository)
Service: postgresql.service (systemd)
Socket: UNIX + TCP/IP
Access: Internal LAN (not publicly exposed)
```

### PostGIS
```
Version: 3.6.x
Extension: Enabled in production database
Features:
  - Spatial geometry types (Point, LineString, Polygon)
  - Spatial indices (GiST, SP-GiST)
  - Coordinate transformations (SRID support)
  - Topology support
```

## Databases

| Database | PostGIS | Purpose |
|----------|---------|-------|
| `postgres` | ❌ | System database (default) |
| `data-dna` | ✅ | **Production DB for p2d2** |

::: tip Enable PostGIS Extension
```
-- In new database
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Verification
SELECT PostGIS_Full_Version();
```
:::

## Network Access

```
Listening:
  - TCP Port <STANDARD_PG_PORT> (all interfaces)
  - UNIX Socket: /var/run/postgresql/

pg_hba.conf:
  - localhost: Trust (for maintenance)
  - Internal LAN: md5 Password Authentication
  - WAN: DENY (blocked by firewall)
```

**Connection String** (for applications in the same LAN):
```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Systemd Service

```
# Check service status
systemctl status postgresql

# Restart service (with downtime)
systemctl restart postgresql

# View logs
journalctl -u postgresql -f --no-pager

# Enable service (autostart)
systemctl enable postgresql
```

## PostGIS Functions

### Spatial Queries
```
-- Point-in-Polygon test
SELECT name FROM kommunen
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- Distance calculation (in meters)
SELECT ST_Distance(
ST_Transform(geom1, 3857),
ST_Transform(geom2, 3857)
);

-- Buffer (500m buffer around geometry)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### Performance Optimization
```
-- Create spatial index
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- Update statistics
ANALYZE kommunen;

-- Vacuum for cleanup
VACUUM ANALYZE kommunen;
```

## Backup Strategy

### PBS Snapshot (Container-Level)
- **Schedule**: Daily (nightly)
- **Retention**: 14 days
- **Type**: LVM-Thin Snapshot (consistent)

### SQL Dumps (Database-Level)
```
# Manual backup
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automation via Cronjob
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# Delete old backups (>30 days)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning Backup Complementarity
PBS snapshots are fast for container restore. SQL dumps allow selective table recovery and are portable between PostgreSQL versions.
:::

## Performance Tuning

### Recommended postgresql.conf Adjustments
```
# Memory (for 2GB RAM Container)
shared_buffers = 512MB             # 25% of RAM
effective_cache_size = 1536MB     # 75% of RAM
work_mem = 16MB                   # Per-query memory
maintenance_work_mem = 128MB      # For VACUUM/CREATE INDEX

# PostGIS Optimizations
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # SSD-optimized (instead of 4.0 for HDD)
```

### Query Analysis
```
-- Identify slow queries (Extension pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 second
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitoring

```
-- Active connections
SELECT count(*), state FROM pg_stat_activity
GROUP BY state;

-- Database size
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- Largest tables
SELECT schemaname, tablename,
pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Troubleshooting

### Container does not start
```
# On Proxmox Host
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # Last boot logs
```

### PostgreSQL does not start
```
# In Container
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# Test configuration file
su - postgres -c "postgres -C config_file"
```

### Connection Problems
```
# Is PostgreSQL listening?
ss -tlnp | grep postgres

# Firewall rule present?
iptables -L -n | grep <PORT>

# Check pg_hba.conf
cat /etc/postgresql/*/main/pg_hba.conf
```

## Extension for Ory IAM (planned)

For the planned Ory integration, additional databases are required:

```
-- Ory Kratos Database
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Ory Hydra Database
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

Details: [Ory IAM Integration](./lxc-ory-iam.md)

## Best Practices

✅ **Do**:
- Regular VACUUM ANALYZE for performance
- Spatial indices on geometry columns
- Connection Pooling (pgBouncer) for high load
- Separate user accounts with minimal privileges

❌ **Don't**:
- Run PostgreSQL as root user
- Use default passwords
- Expose the database directly to the WAN
- Store large geometries without generalization

## References

- [PostgreSQL 18 Documentation](https://www.postgresql.org/docs/18/)
- [PostGIS 3.6 Manual](https://postgis.net/docs/manual-3.6/)
- [Performance Tuning Guide](https://wiki.postgresql.org/wiki/Performance_Optimization)