## quality: completeness: 50 accuracy: 70 reviewed: false reviewer: 'KI (Gemini)' reviewDate: null

# PostgreSQL/PostGIS

PostgreSQL with the PostGIS extension is the central geodatabase for p2d2.

## Installation

### PostgreSQL 15

```
# On Debian/Ubuntu
apt install postgresql-15 postgresql-client-15

# Start service
systemctl enable postgresql
systemctl start postgresql
```

### PostGIS 3.4

```
# Install PostGIS package
apt install postgresql-15-postgis-3

# Enable in database
sudo -u postgres psql -d p2d2 -c "CREATE EXTENSION postgis;"
sudo -u postgres psql -d p2d2 -c "CREATE EXTENSION postgis_topology;"
```

## Database Setup

### Create Database and User

```
-- As postgres user
CREATE USER p2d2 WITH PASSWORD 'secure_password';
CREATE DATABASE p2d2 OWNER p2d2;

-- In p2d2 database
\c p2d2
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
CREATE EXTENSION fuzzystrmatch;
CREATE EXTENSION postgis_tiger_geocoder;
```

### Create Schema

```
-- Main schema for features
CREATE SCHEMA features;
GRANT ALL ON SCHEMA features TO p2d2;

-- Schema for metadata
CREATE SCHEMA metadata;
GRANT ALL ON SCHEMA metadata TO p2d2;

-- Schema for versioning
CREATE SCHEMA history;
GRANT ALL ON SCHEMA history TO p2d2;
```

## Create Tables

### Feature Table

```
CREATE TABLE features.friedhoefe (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    kategorie VARCHAR(50),
    adresse TEXT,
    telefon VARCHAR(50),
    email VARCHAR(100),
    webseite VARCHAR(255),
    oeffnungszeiten TEXT,
    beschreibung TEXT,
    geom GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft',
    qc_status VARCHAR(20),
    qc_by VARCHAR(100),
    qc_at TIMESTAMP
);

-- Spatial index
CREATE INDEX idx_friedhoefe_geom ON features.friedhoefe USING GIST(geom);

-- Attribute indices
CREATE INDEX idx_friedhoefe_name ON features.friedhoefe(name);
CREATE INDEX idx_friedhoefe_status ON features.friedhoefe(status);
```

### Versioning Table

```
CREATE TABLE history.friedhoefe_history (
    history_id SERIAL PRIMARY KEY,
    feature_id INTEGER,
    operation VARCHAR(10),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Trigger for Versioning

```
-- Trigger function
CREATE OR REPLACE FUNCTION history.log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO history.friedhoefe_history (feature_id, operation, old_data, new_data, changed_by)
        VALUES (OLD.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO history.friedhoefe_history (feature_id, operation, old_data, changed_by)
        VALUES (OLD.id, 'DELETE', row_to_json(OLD), OLD.updated_by);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO history.friedhoefe_history (feature_id, operation, new_data, changed_by)
        VALUES (NEW.id, 'INSERT', row_to_json(NEW), NEW.created_by);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER friedhoefe_audit
    AFTER INSERT OR UPDATE OR DELETE ON features.friedhoefe
    FOR EACH ROW EXECUTE FUNCTION history.log_changes();
```

## Performance Tuning

### postgresql.conf

```
# Shared Buffers (25% of RAM)
shared_buffers = 8GB

# Effective Cache (50-75% of RAM)
effective_cache_size = 24GB

# Work Memory
work_mem = 256MB

# Maintenance Work Memory
maintenance_work_mem = 2GB

# Max Parallel Workers
max_parallel_workers_per_gather = 4
max_parallel_workers = 8

# Random Page Cost (SSD)
random_page_cost = 1.1

# Logging
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

### Connection Pooling with PgBouncer

```
# Install PgBouncer
apt install pgbouncer

# /etc/pgbouncer/pgbouncer.ini
[databases]
p2d2 = host=localhost port=5432 dbname=p2d2

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 100
```

## Backup Strategy

### Logical Backup (pg_dump)

```
# Full dump
pg_dump -U p2d2 -F c -b -v -f p2d2_$(date +%Y%m%d).backup p2d2

# Schema only
pg_dump -U p2d2 -s -f p2d2_schema.sql p2d2

# Data only of one table
pg_dump -U p2d2 -t features.friedhoefe -f friedhoefe_data.sql p2d2
```

### Physical Backup (pg_basebackup)

```
# Base backup for PITR
pg_basebackup -U replication -D /backup/pg_base -Fp -Xs -P

# Enable WAL archiving
# postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backup/wal/%f && cp %p /backup/wal/%f'
```

### Automatic Backup

```
# /usr/local/bin/backup-p2d2.sh
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -U p2d2 -F c -f $BACKUP_DIR/p2d2_$DATE.backup p2d2

# Delete old backups (older than 30 days)
find $BACKUP_DIR -name "p2d2_*.backup" -mtime +30 -delete

# Cronjob: daily at 2 AM
# 0 2 * * * /usr/local/bin/backup-p2d2.sh
```

## Monitoring

### pg_stat_statements

```
-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- Slowest queries
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Prometheus Exporter

```
# Install postgres_exporter
docker run -d \
  --name postgres-exporter \
  -p 9187:9187 \
  -e DATA_SOURCE_NAME="postgresql://p2d2:password@localhost:5432/p2d2?sslmode=disable" \
  prometheuscommunity/postgres-exporter
```

## Maintenance

### VACUUM and ANALYZE

```
# Automatic VACUUM
# postgresql.conf:
autovacuum = on
autovacuum_naptime = 1min

# Manual VACUUM
VACUUM ANALYZE features.friedhoefe;

# VACUUM FULL (locks table!)
VACUUM FULL features.friedhoefe;
```

### Reindex

```
-- Rebuild index
REINDEX INDEX idx_friedhoefe_geom;

-- All indices of a table
REINDEX TABLE features.friedhoefe;
```

::: warning VACUUM FULL
`VACUUM FULL` locks the table exclusively and can take a long time! Only perform during maintenance windows.
:::