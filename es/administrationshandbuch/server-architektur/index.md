---
title: Arquitectura del Servidor
description: Resumen de la infraestructura de datos geoespaciales p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Arquitectura del Servidor

La infraestructura p2d2 se basa en **Proxmox VE 9.x** y utiliza una arquitectura híbrida de **contenedores LXC** para microservicios y **VMs** para tareas complejas de red y servidor de teselas. La virtualización se ejecuta en hardware Intel moderno (13ª Gen, 14 núcleos, 64 GB RAM).

## Resumen de Arquitectura

TODO: Insertar gráfico

## Resumen de Componentes

| Componente | Tipo | Rol | RAM | Disco | SO |
|---|---|---|---|---|---|
| **OPNSense** | VM | Firewall + Reverse Proxy | 4 GB | 25 GB | FreeBSD 14.x |
| **PostgreSQL** | LXC | Geodatabase + PostGIS | 2 GB | 15 GB | Debian 13 |
| **GeoServer** | LXC | Servidor WFS/WMS | 6 GB | 12 GB | Debian 13 |
| **MapProxy** | LXC | Caché de Teselas + Proxy | 4 GB | 38 GB | Debian 13 |
| **OSM-Tiler** | VM | Renderizado de Teselas | 6 GB | 65 GB | Debian 13 |
| **Frontend** | LXC | AstroJS + VitePress | 4 GB | 25 GB | Debian 13 |
| **Ory IAM** *(planeado)* | LXC | Gestión de Identidad | 2 GB | 10 GB | Debian 13 |

## Principios de Diseño

### Aislamiento de Servicios

Cada servicio se ejecuta en su propio contenedor LXC o VM. Esto permite:

  - Actualizaciones independientes sin tiempo de inactividad de otros servicios
  - Aislamiento de recursos y ajuste de rendimiento por servicio
  - Rollback de componentes individuales en caso de problemas

### Segmentación de Red

  - **Principio DMZ**: El contenedor frontend no tiene acceso directo de escritura a la base de datos
  - **Firewall-First**: Todas las solicitudes externas pasan por OPNSense
  - **LAN Interna**: Red privada dedicada para comunicación servicio-a-servicio
  - **VLAN de Gestión**: Red separada para accesos administrativos

### Características de Seguridad

  - **Firewall Proxmox**: Habilitado a nivel de host
  - **OPNSense**: Inspección de paquetes con estado, reglas NAT
  - **Caddy TLS**: Certificados Let's Encrypt automáticos
  - **Admin VPN-Only**: Acceso administrativo solo vía VPN

## Estrategia de Backup

**Proxmox Backup Server (PBS)** crea snapshots incrementales de todos los contenedores y VMs:

  - **Backups Diarios**: Componentes críticos (BD, Frontend, Firewall)
  - **Backups Semanales**: Middleware GDI (GeoServer, MapProxy)
  - **Backups Mensuales**: Servidor de teselas (grandes volúmenes de datos)
  - **Retención Automática**: Políticas PBS para backups antiguos

Detalles: [Estrategia de Backup](https://www.google.com/search?q=./backup-strategie.md)

## Documentación Adicional

  - [Detalles Host Proxmox](https://www.google.com/search?q=./proxmox-host.md)
  - [Contenedor PostgreSQL/PostGIS](https://www.google.com/search?q=./lxc-postgresql.md)
  - [Contenedor GeoServer](https://www.google.com/search?q=./lxc-geoserver.md)
  - [Contenedor MapProxy](https://www.google.com/search?q=./lxc-mapproxy.md)
  - [Contenedor Frontend](https://www.google.com/search?q=./lxc-frontend.md)
  - [Firewall OPNSense](https://www.google.com/search?q=./vm-opnsense.md)
  - [Servidor de Teselas OSM](https://www.google.com/search?q=./vm-osm-tiler.md)
  - [Arquitectura de Red](https://www.google.com/search?q=./netzwerk-architektur.md)
  - [Integración Ory IAM (planeada)](https://www.google.com/search?q=./lxc-ory-iam.md)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.