---
title: Host Proxmox
description: Plataforma de virtualización para infraestructura p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Host Proxmox

## Especificaciones de Hardware

```
CPU: Intel Core i5 13ª Generación
  - Núcleos: 14 Núcleos Físicos
  - Hilos: 20 CPUs Lógicas
  - Características: AVX2, AES-NI, Virtualización (VT-x/VT-d)

RAM: 64 GB DDR4
Swap: 6 GB

Tipo de Sistema: Servidor Dedicado (Bare Metal)
```

## Pila de Software

```
Virtualización: Proxmox VE 9.x (Estable actual)
Kernel: Linux 6.x (optimizado PVE)
QEMU/KVM: Versión 9.x
Motor de Contenedores: LXC (Linux Containers)
```

::: tip ¿Por qué Proxmox?

  - **Open Source**: Gratuito, impulsado por la comunidad
  - **Enterprise-Ready**: Listo para producción sin costos de licencia
  - **Híbrido**: Combina VMs (KVM) y contenedores (LXC)
  - **Integración de Backup**: Proxmox Backup Server (PBS) integrado nativamente
    :::

## Arquitectura de Almacenamiento

### Pool LVM-Thin (VMs-Contenedores)

```
Tipo: Volumen LVM-Thin
Uso: Sistemas de archivos raíz para LXC y discos VM
Ventaja: Snapshots, Thin Provisioning, Eficiencia
```

### Almacenamiento Directorio Local

```
Tipo: Directorio
Uso: Plantillas, ISOs, backups temporales
Ruta: /var/lib/vz
```

### Proxmox Backup Server (PBS)

```
Tipo: Almacenamiento de backup con deduplicación
Uso: Backups de producción de todos los VMs/LXCs
Características: Snapshots incrementales, cifrado, verificación
```

::: warning Capacidad de Backup
El almacenamiento PBS debe revisarse regularmente para ver su utilización. Si >80%, recomendación: planificar expansión.
:::

## Configuración de Red

```
Puentes:
  - vmbr0: Puente WAN (conectado a Internet)
  - vmbr1: Puente LAN (Red de servicios interna)
  - vmbr2: VLAN de Gestión (Acceso admin)

VPN: WireGuard para administración remota segura
```

Arquitectura de red detallada: [Documentación de Red](https://www.google.com/search?q=./netzwerk-architektur.md)

## Configuración de Seguridad

### Firewall Proxmox

```
Estado: Habilitado a nivel de host
Política: Default DROP (Enfoque de lista blanca)
Gestión de Reglas: Vía Web UI o pvesh CLI
```

### Control de Acceso

  - **Web UI**: Solo HTTPS, Puerto 8006
  - **SSH**: Solo vía VLAN de Gestión o VPN
  - **API**: Autenticación basada en tokens
  - **Actualizaciones**: Parches de seguridad automáticos (opcional)

## Instancias en Ejecución

### Contenedores LXC (Ligeros)

| Nombre | Estado | Rol | Recursos |
|------|--------|-------|------------|
| postgresql | ✅ en ejecución | Geodatabase | 2 GB RAM, 15 GB Disco |
| geoserver | ✅ en ejecución | Servidor WFS/WMS | 6 GB RAM, 12 GB Disco |
| mapproxy | ✅ en ejecución | Proxy Teselas | 4 GB RAM, 38 GB Disco |
| frontend | ✅ en ejecución | Frontend Web | 4 GB RAM, 25 GB Disco |
| zabbix | ⏸ detenido | Monitorización (opcional) | 2 GB RAM, 10 GB Disco |

### Máquinas Virtuales (VMs Completas)

| Nombre | Estado | Rol | Recursos |
|------|--------|-------|------------|
| OPNSense | ✅ en ejecución | Firewall + Proxy | 4 GB RAM, 25 GB Disco |
| osm-tiler | ✅ en ejecución | Renderizado Teselas | 6 GB RAM, 65 GB Disco |

## Herramientas de Gestión

### Administración CLI

```
# Gestión Contenedores
pct list                    # Listar contenedores
pct start <VMID>           # Iniciar contenedor
pct exec <VMID> -- bash    # Shell en contenedor

# Gestión VMs
qm list                     # Listar VMs
qm start <VMID>             # Iniciar VM
qm snapshot <VMID> <NAME>  # Crear snapshot

# Gestión Backups
pvesm list <STORAGE>       # Listar backups
vzdump <VMID>              # Backup manual
```

### Web UI

  - **URL**: `https://<PROXMOX_HOST>:8006`
  - **Características**:
      - Vista general gráfica de recursos
      - Acceso a consola de VMs/LXCs
      - Programación de tareas de backup
      - Editor de reglas de firewall

## Lista de Mantenimiento

**Semanal**:

  - [ ] Revisar capacidad PBS
  - [ ] Revisar logs de backup por errores

**Mensual**:

  - [ ] Actualizaciones de kernel vía `apt update && apt upgrade`
  - [ ] Revisar actualizaciones de plantillas de contenedores
  - [ ] Realizar prueba de restauración de un backup

**Trimestral**:

  - [ ] Revisar reglas de firewall
  - [ ] Analizar utilización de recursos
  - [ ] Probar plan de recuperación ante desastres

## Referencias

  - [Documentación Proxmox VE](https://pve.proxmox.com/pve-docs/)
  - [LXC vs. KVM: ¿Cuándo usar cuál?](https://pve.proxmox.com/wiki/Linux_Container)
  - [Proxmox Backup Server](https://pbs.proxmox.com/docs/)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.