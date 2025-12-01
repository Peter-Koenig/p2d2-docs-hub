---
title: Estrategia de Backup
description: Copia de seguridad y recuperación ante desastres
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Estrategia de Backup

## Proxmox Backup Server (PBS)

### Configuración de Almacenamiento

```
Nombre de Almacenamiento: p2d2-pbs
Tipo: Proxmox Backup Server (con deduplicación)
Contenido: Backups (VMs + LXCs)
Estado: Active, Shared
Deduplicación: Enabled (basada en chunks)
Cifrado: Configurable opcionalmente
```

::: tip Ventajas de PBS

  - **Backups Incrementales**: Solo cambios desde el último backup
  - **Deduplicación**: Datos duplicados se almacenan solo una vez
  - **Verificación**: Comprobación automática de integridad del backup
  - **Restauraciones Rápidas**: Acceso directo a snapshots
    :::

### Programación de Backup (Generalizada)

**Tareas de Backup** (configuradas vía Proxmox Web-UI):

| Componente | Programación | Retención | Tipo |
|---|---|---|---|
| OPNSense (Firewall) | Diaria | 7 días | Snapshot |
| PostgreSQL/PostGIS | Diaria | 14 días | Snapshot |
| GeoServer | Semanal | 4 semanas | Snapshot |
| MapProxy | Semanal | 4 semanas | Snapshot |
| OSM-Tiler | Mensual | 3 meses | Snapshot |
| Frontend (AstroJS) | Diaria | 7 días | Snapshot |

::: warning Ventana de Backup
Los backups deben ejecutarse **fuera de horas pico** (típicamente de noche). Los momentos de backup **no están documentados específicamente** (buena práctica de seguridad).
:::

### Tipos de Backup

#### Snapshots de Contenedor (LXC)

```
# Crear backup manual
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# Comprobar estado del backup
pvesm list p2d2-pbs | grep "ct-<VMID>"

# Restaurar contenedor desde backup
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**Ventajas de Snapshots LVM-Thin**:

  - Consistentes (nivel sistema de archivos)
  - Rápidos (solo copia de metadatos)
  - Sin downtime de servicio durante backup

#### Backups de VM (QEMU/KVM)

```
# Backup de VM (con suspensión para consistencia)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# Restaurar VM
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### Política de Retención

```
Backups Diarios: 
  - Retención: 7 días
  - Servicios: PostgreSQL, Frontend, Firewall

Backups Semanales:
  - Retención: 4 semanas
  - Servicios: GeoServer, MapProxy

Backups Mensuales:
  - Retención: 3 meses
  - Servicios: OSM-Tiler (grandes volúmenes de datos)

Limpieza Automática: Tarea Prune de PBS (diaria)
```

## Backups de Base de Datos (Adicional a PBS)

### PostgreSQL pg_dump

```
# SQL-Dump (en contenedor PostgreSQL)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automatización vía Cron
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# Eliminar backups antiguos (>30 días)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**¿Por qué adicional a PBS?**:

  - ✅ Restauración selectiva de tablas individuales
  - ✅ Portable entre versiones de PostgreSQL
  - ✅ Tamaño de backup más pequeño (comprimido)
  - ✅ Importación a entornos de prueba sin restaurar contenedor

### Formato Personalizado PostGIS

```
# Formato personalizado (con objetos binarios)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# Restauración (selectiva posible)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## Backups de Configuración

### Caddy (OPNSense)

```
# Respaldar Caddyfile + Configs personalizadas
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/Caddyfile \
  /usr/local/etc/caddy/caddy.d/

# Certificados TLS (respaldados automáticamente vía backup VM de PBS)
```

### Servicios Systemd (Frontend)

```
# Respaldar todos los servicios p2d2
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/systemd/system/webhook-server.service
```

## Recuperación ante Desastres (Disaster Recovery)

### Fallo Completo del Host

**Escenario**: Fallo de hardware del servidor Proxmox

**Pasos de Recuperación**:

1.  **Configurar nuevo host Proxmox**

    ```
    # Instalar Proxmox VE desde ISO
    # Restaurar configuración de red (Puentes)
    ```

2.  **Montar Almacenamiento PBS**

    ```
    # En Proxmox Web-UI: Datacenter → Storage → Add → PBS
    # Servidor PBS: <PBS_IP_OR_HOSTNAME>
    # Datastore: p2d2-backups
    ```

3.  **Restaurar Contenedores/VMs**

    ```
    # Vía Web-UI: Storage → p2d2-pbs → Content → Restore
    # O CLI:
    pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
    qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
    ```

4.  **Verificar Servicios**

    ```
    # PostgreSQL
    pct exec <PG_VMID> -- systemctl status postgresql

    # Integridad de base de datos
    pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
    ```

### Fallo de Contenedor Individual

**Escenario**: Contenedor PostgreSQL corrupto

```
# Detener contenedor
pct stop <PG_VMID>

# Restaurar desde backup
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<FECHA>.tar.zst --force

# Iniciar contenedor
pct start <PG_VMID>

# Comprobar estado del servicio
pct exec <PG_VMID> -- systemctl status postgresql
```

### Corrupción de Base de Datos

**Escenario**: Datos PostgreSQL corruptos, pero contenedor OK

```
# Eliminar base de datos
sudo -u postgres dropdb data-dna

# Recrear
sudo -u postgres createdb data-dna

# Restaurar SQL-Dump
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# Reactivar extensión PostGIS
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## Backups Fuera del Sitio (Off-Site)

Actualmente, todas las instancias se respaldan en el Proxmox-Backup local. Después del respaldo, los backups se sincronizan con un PBS remoto ubicado en Alemania.

## Verificación de Backups

Todos los backups se verifican una vez por semana en ambos PBS.

### Prueba de Restauración Mensual (planeada)

```
# Crear contenedor de prueba desde backup
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst \
  --hostname postgresql-test \
  --storage local-lvm

# Comprobar inicio de servicio
pct start 999
pct exec 999 -- systemctl status postgresql

# Probar acceso a base de datos
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# Limpieza
pct stop 999
pct destroy 999
```

### Comprobar Integridad de Base de Datos

```
-- Funcionalidad PostGIS
SELECT PostGIS_Full_Version();

-- Número de registros (comprobación de plausibilidad)
SELECT 
  'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT 
  'geometries' AS table_name, COUNT(*) FROM geometries;

-- Validez de geometría
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## Monitorización de Backups

### Logs de Tareas Proxmox

```
# Ver logs de backup
cat /var/log/vzdump.log | grep "ERROR\|WARN"

# Comprobar estado de PBS
proxmox-backup-manager tasks list

# Uso de almacenamiento
pvesm status p2d2-pbs
```

### Configuración de Alertas

```
# Notificaciones por email para fallos de backup
# En Proxmox Web-UI: Datacenter → Notifications

# Script de monitorización personalizado
#!/bin/bash
# /etc/cron.hourly/backup-check
LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## Buenas Prácticas

✅ **Hacer**:

  - Realizar pruebas de restauración regulares
  - Monitorizar logs de backup y analizar errores
  - Ajustar políticas de retención a requisitos de negocio
  - Documentar cambios de configuración
  - Configurar monitorización para tareas de backup

❌ **No Hacer**:

  - Asumir que los backups funcionan sin verificación
  - Respaldar datos críticos en un solo medio
  - Ignorar fallos de backup
  - Operar sin plan de recuperación ante desastres
  - No monitorizar capacidad de backup

## Referencias

  - [Documentación Proxmox Backup Server](https://pbs.proxmox.com/docs/)
  - [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
  - [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
  - [Regla de Backup 3-2-1](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.