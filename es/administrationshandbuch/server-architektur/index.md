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

[cite_start]La infraestructura p2d2 se basa en **Proxmox VE 9.x** y utiliza una arquitectura híbrida de **contenedores LXC** para microservicios y **VMs** para tareas complejas de red y servidor de teselas. [cite: 1070] [cite_start]La virtualización se ejecuta en hardware Intel moderno (13ª Gen, 14 núcleos, 64 GB RAM). [cite: 1070]

## Resumen de Arquitectura

TODO: Insertar gráfico

## Resumen de Componentes

| Componente | Tipo | Rol | RAM | Disco | SO |
|---|---|---|---|---|---|
| **OPNSense** | VM | Firewall + Reverse Proxy | 4 GB | 25 GB | [cite_start]FreeBSD 14.x | [cite: 1072]
| **PostgreSQL** | LXC | Geodatabase + PostGIS | 2 GB | 15 GB | [cite_start]Debian 13 | [cite: 1073]
| **GeoServer** | LXC | Servidor WFS/WMS | 6 GB | 12 GB | [cite_start]Debian 13 | [cite: 1074]
| **MapProxy** | LXC | Caché de Teselas + Proxy | 4 GB | 38 GB | [cite_start]Debian 13 | [cite: 1075]
| **OSM-Tiler** | VM | Renderizado de Teselas | 6 GB | 65 GB | [cite_start]Debian 13 | [cite: 1075]
| **Frontend** | LXC | AstroJS + VitePress | 4 GB | 25 GB | [cite_start]Debian 13 | [cite: 1076]
| **Ory IAM** *(planeado)* | LXC | Gestión de Identidad | 2 GB | 10 GB | [cite_start]Debian 13 | [cite: 1077]

## Principios de Diseño

### Aislamiento de Servicios

[cite_start]Cada servicio se ejecuta en su propio contenedor LXC o VM. [cite: 1078] Esto permite:

  - [cite_start]Actualizaciones independientes sin tiempo de inactividad de otros servicios [cite: 1078]
  - [cite_start]Aislamiento de recursos y ajuste de rendimiento por servicio [cite: 1078]
  - [cite_start]Rollback de componentes individuales en caso de problemas [cite: 1078]

### Segmentación de Red

  - [cite_start]**Principio DMZ**: El contenedor frontend no tiene acceso directo de escritura a la base de datos [cite: 1078]
  - [cite_start]**Firewall-First**: Todas las solicitudes externas pasan por OPNSense [cite: 1078]
  - [cite_start]**LAN Interna**: Red privada dedicada para comunicación servicio-a-servicio [cite: 1078]
  - [cite_start]**VLAN de Gestión**: Red separada para accesos administrativos [cite: 1078]

### Características de Seguridad

  - [cite_start]**Firewall Proxmox**: Habilitado a nivel de host [cite: 1078]
  - [cite_start]**OPNSense**: Inspección de paquetes con estado, reglas NAT [cite: 1078]
  - [cite_start]**Caddy TLS**: Certificados Let's Encrypt automáticos [cite: 1078]
  - [cite_start]**Admin VPN-Only**: Acceso administrativo solo vía VPN [cite: 1078]

## Estrategia de Backup

[cite_start]**Proxmox Backup Server (PBS)** crea snapshots incrementales de todos los contenedores y VMs: [cite: 1079]

  - [cite_start]**Backups Diarios**: Componentes críticos (BD, Frontend, Firewall) [cite: 1079]
  - [cite_start]**Backups Semanales**: Middleware GDI (GeoServer, MapProxy) [cite: 1079]
  - [cite_start]**Backups Mensuales**: Servidor de teselas (grandes volúmenes de datos) [cite: 1079]
  - [cite_start]**Retención Automática**: Políticas PBS para backups antiguos [cite: 1079]

[cite_start]Detalles: [Estrategia de Backup](https://www.google.com/search?q=./backup-strategie.md) [cite: 1079]

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