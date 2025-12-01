---
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Manual de Administración

Bienvenido al Manual de Administración de p2d2. Aquí encontrará documentación técnica para la instalación, configuración y operación de la infraestructura de geodatos.

## Público Objetivo

Este manual está dirigido a:

  - **Administradores de sistemas** que instalan y operan p2d2
  - **Ingenieros DevOps** que automatizan la implementación
  - **Especialistas en GDI** que configuran la infraestructura de geodatos

## Resumen de Arquitectura

p2d2 se basa en una arquitectura de múltiples niveles:

1.  **Nivel de Infraestructura**: Proxmox VE, OPNsense, PBS
2.  **Infraestructura de Geodatos**: PostgreSQL/PostGIS, GeoServer, MapProxy
3.  **Frontend**: Aplicación AstroJS con OpenLayers
4.  **CI/CD**: Pipeline de implementación basado en GitLab

## Requisitos del Sistema

### Hardware

  - **Host Proxmox**: Intel 13th Gen (o comparable), 14 núcleos, 64 GB RAM
  - **Sistema Total**: ~28 GB RAM para todos los contenedores/VMs + sobrecarga para Proxmox
  - **Almacenamiento**: Mín. 200 GB SSD (para contenedores/VMs + espacio de backup)
  - **Red**: 1 Gbit/s (10 Gbit/s para producción)

### Software

  - **Virtualización**: Proxmox VE 9.x
  - **SO Contenedor**: Debian 13
  - **SO Firewall**: FreeBSD 14.x (OPNSense)
  - **Base de Datos**: PostgreSQL 15+ con PostGIS 3.4+
  - **Servidor Web**: Caddy (Terminación TLS)
  - **Node.js**: 20.x LTS

## Navegación

### Infraestructura de Servidor

  - [Resumen de Arquitectura de Servidor](./server-architektur/) - Arquitectura general de la infraestructura p2d2
  - [Host Proxmox](./server-architektur/proxmox-host) - Plataforma de virtualización
  - [Firewall OPNSense](./server-architektur/vm-opnsense) - Firewall y Reverse Proxy
  - [Arquitectura de Red](./server-architektur/netzwerk-architektur) - Segmentación de red y diseño de firewall
  - [Estrategia de Backup](./server-architektur/backup-strategie) - Copia de seguridad y recuperación ante desastres

### Infraestructura de Geodatos

  - [Contenedor PostgreSQL/PostGIS](./server-architektur/lxc-postgresql) - Base de datos geoespacial con extensiones espaciales
  - [Contenedor GeoServer](./server-architektur/lxc-geoserver) - Servidor WFS/WMS para servicios de geodatos
  - [Contenedor MapProxy](./server-architektur/lxc-mapproxy) - Caché de teselas y proxy para entrega de mapas de alto rendimiento
  - [VM OSM-Tileserver](./server-architektur/vm-osm-tiler) - Servidor de renderizado de teselas OpenStreetMap
  - [Contenedor Ory IAM (Planeado)](./server-architektur/lxc-ory-iam) - Gestión de Identidad y Acceso

### Software e Implementación

  - [Contenedor Frontend](./server-architektur/lxc-frontend) - Frontend web AstroJS + VitePress con CI/CD multi-branch
  - [Arquitectura Frontend](./frontend-architektur) - Aplicación AstroJS
  - [Arquitectura de Software](./software-architektur) - Componentes y módulos
  - [Implementación](./deployment/staging) - Staging y Producción

## Inicio Rápido

Para una instalación rápida en un entorno de prueba:

```
# Clonar repositorio
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Para una instalación de producción completa, siga las secciones del Manual de Administración.

::: warning Advertencia de Seguridad
¡La instalación rápida solo es adecuada para entornos de prueba! Para sistemas de producción, se deben considerar los aspectos de seguridad.
:::

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.