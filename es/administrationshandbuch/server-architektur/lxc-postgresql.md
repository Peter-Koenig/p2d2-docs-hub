---
title: Contenedor PostgreSQL/PostGIS
description: Servidor de geodatabase con extensiones espaciales
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Traducción: IA)"
  reviewDate: null
---

# LXC: PostgreSQL/PostGIS

## Información del Contenedor

```
Tipo: LXC (privilegiado/no privilegiado según configuración)
SO: Debian 13 (trixie)
Hostname: postgresql (personalizable)
Estado: en ejecución

Recursos:
  RAM: 2 GB
  Disco: 15 GB (ampliable dinámicamente)
  CPU Shares: Estándar (1024)
```

## Software Instalado

### PostgreSQL

```
Versión: 18.x (Repositorio Oficial de Debian)
Servicio: postgresql.service (systemd)
Socket: UNIX + TCP/IP
Acceso: LAN interna (no expuesto públicamente)
```

### PostGIS

```
Versión: 3.6.x
Extensión: Habilitada en base de datos de producción
Características: 
  - Tipos de geometría espacial (Point, LineString, Polygon)
  - Índices espaciales (GiST, SP-GiST)
  - Transformaciones de coordenadas (Soporte SRID)
  - Soporte de topología
```

## Bases de Datos

| Database | PostGIS | Propósito |
|---|---|---|
| `postgres` | ❌ | Base de datos sistema (Estándar) |
| `data-dna` | ✅ | **BD de producción para p2d2** |

::: tip Habilitar extensión PostGIS

```
-- En nueva base de datos
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Verificación
SELECT PostGIS_Full_Version();
```

:::

## Acceso a Red

```
Escuchando: 
  - Puerto TCP <STANDARD_PG_PORT> (todas las interfaces)
  - Socket UNIX: /var/run/postgresql/

pg_hba.conf:
  - localhost: Trust (para mantenimiento)
  - LAN interna: Autenticación por contraseña md5
  - WAN: DENEGAR (bloqueado por firewall)
```

**Cadena de Conexión** (para aplicaciones en la misma LAN):

```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Servicio Systemd

```
# Comprobar estado del servicio
systemctl status postgresql

# Reiniciar servicio (con tiempo de inactividad)
systemctl restart postgresql

# Ver logs
journalctl -u postgresql -f --no-pager

# Habilitar servicio (autoarranque)
systemctl enable postgresql
```

## Funciones PostGIS

### Consultas Espaciales

```
-- Prueba Point-in-Polygon
SELECT name FROM kommunen 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- Cálculo de distancia (en metros)
SELECT ST_Distance(
  ST_Transform(geom1, 3857),
  ST_Transform(geom2, 3857)
);

-- Buffer (buffer de 500m alrededor de geometría)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### Optimización de Rendimiento

```
-- Crear índice espacial
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- Actualizar estadísticas
ANALYZE kommunen;

-- Vacuum para limpieza
VACUUM ANALYZE kommunen;
```

## Estrategia de Backup

### Snapshot PBS (Nivel Contenedor)

  - **Programación**: Diaria nocturna
  - **Retención**: 14 días
  - **Tipo**: Snapshot LVM-Thin (consistente)

### Dumps SQL (Nivel Base de Datos)

```
# Backup manual
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automatización vía Cronjob
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# Eliminar backups antiguos (>30 días)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning Complementariedad de Backups
Los snapshots PBS son rápidos para restauración de contenedores. Los dumps SQL permiten restauración selectiva de tablas y son portables entre versiones de PostgreSQL.
:::

## Ajuste de Rendimiento

### Ajustes recomendados de postgresql.conf

```
# Memoria (para contenedor de 2GB RAM)
shared_buffers = 512MB            # 25% de RAM
effective_cache_size = 1536MB     # 75% de RAM
work_mem = 16MB                   # Memoria por consulta
maintenance_work_mem = 128MB      # Para VACUUM/CREATE INDEX

# Optimizaciones PostGIS
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # Optimizado SSD (en lugar de 4.0 para HDD)
```

### Análisis de Consultas

```
-- Identificar consultas lentas (Extensión pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 segundo
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitorización

```
-- Conexiones activas
SELECT count(*), state FROM pg_stat_activity 
GROUP BY state;

-- Tamaño de base de datos
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- Tablas más grandes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Solución de Problemas

### Contenedor no arranca

```
# En host Proxmox
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # Últimos logs de arranque
```

### PostgreSQL no arranca

```
# En contenedor
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# Probar archivo de configuración
su - postgres -c "postgres -C config_file"
```

### Problemas de Conexión

```
# ¿Está PostgreSQL escuchando?
ss -tlnp | grep postgres

# ¿Existe regla de firewall?
iptables -L -n | grep <PORT>

# Comprobar pg_hba.conf
cat /etc/postgresql/*/main/pg_hba.conf
```

## Extensión para Ory IAM (planeada)

Para la integración planeada de Ory, se necesitan bases de datos adicionales:

```
-- Base de Datos Ory-Kratos
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Base de Datos Ory-Hydra
CREATE USER ory_hydra WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

Detalles: [Integración Ory IAM](https://www.google.com/search?q=./lxc-ory-iam.md)

## Buenas Prácticas

✅ **Hacer**:

  - VACUUM ANALYZE regulares para rendimiento
  - Índices espaciales en columnas de geometría
  - Connection Pooling (pgBouncer) para alta carga
  - Cuentas de usuario separadas con privilegios mínimos

❌ **No Hacer**:

  - Ejecutar PostgreSQL como root
  - Usar contraseñas por defecto
  - Exposición directa de base de datos a WAN
  - Almacenar geometrías grandes sin generalización

## Referencias

  - [Documentación PostgreSQL 18](https://www.postgresql.org/docs/18/)
  - [Manual PostGIS 3.6](https://postgis.net/docs/manual-3.6/)
  - [Guía de Optimización de Rendimiento](https://wiki.postgresql.org/wiki/Performance_Optimization)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.