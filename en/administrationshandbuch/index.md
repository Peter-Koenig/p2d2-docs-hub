---
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: "(Translation - KI)"
  reviewDate: null
---

# Administration Handbook

Welcome to the p2d2 Administration Handbook. Here you will find technical documentation for the installation, configuration, and operation of the geodata infrastructure.

## Target Audience

This handbook is intended for:

  - **System Administrators** who install and operate p2d2
  - **DevOps Engineers** who automate the deployment
  - **GDI Specialists** who configure the geodata infrastructure

## Architecture Overview

p2d2 is based on a multi-tier architecture:

1.  **Infrastructure Layer**: Proxmox VE, OPNsense, PBS
2.  **Geodata Infrastructure**: PostgreSQL/PostGIS, GeoServer, MapProxy
3.  **Frontend**: AstroJS application with OpenLayers
4.  **CI/CD**: GitLab-based deployment pipeline

## System Requirements

### Hardware

  - **Proxmox Host**: Intel 13th Gen (or comparable), 14 Cores, 64 GB RAM
  - **Total System**: ~28 GB RAM for all containers/VMs + overhead for Proxmox
  - **Storage**: Min. 200 GB SSD (for containers/VMs + backup space)
  - **Network**: 1 Gbit/s (10 Gbit/s for production)

### Software

  - **Virtualization**: Proxmox VE 9.x
  - **Container OS**: Debian 13
  - **Firewall OS**: FreeBSD 14.x (OPNSense)
  - **Database**: PostgreSQL 15+ with PostGIS 3.4+
  - **Web Server**: Caddy (TLS Termination)
  - **Node.js**: 20.x LTS

## Navigation

### Server Infrastructure

  - [Server Architecture Overview](./server-architektur/) - Overall architecture of the p2d2 infrastructure
  - [Proxmox Host](./server-architektur/proxmox-host) - Virtualization platform
  - [OPNsense Firewall](./server-architektur/vm-opnsense) - Firewall and Reverse Proxy
  - [Network Architecture](./server-architektur/netzwerk-architektur) - Network segmentation and firewall design
  - [Backup Strategy](./server-architektur/backup-strategie) - Data backup and disaster recovery

### Geodata Infrastructure

  - [PostgreSQL/PostGIS Container](./server-architektur/lxc-postgresql) - Geospatial database with spatial extensions
  - [GeoServer Container](./server-architektur/lxc-geoserver) - WFS/WMS server for geodata services
  - [MapProxy Container](./server-architektur/lxc-mapproxy) - Tile cache and proxy for performant map delivery
  - [OSM-Tileserver VM](./server-architektur/vm-osm-tiler) - OpenStreetMap tile rendering server
  - [Ory IAM Container (Planned)](./server-architektur/lxc-ory-iam) - Identity and Access Management

### Software & Deployment

  - [Frontend Container](./server-architektur/lxc-frontend) - AstroJS + VitePress web frontend with multi-branch CI/CD
  - [Frontend Architecture](./frontend-architektur) - AstroJS application
  - [Software Architecture](./software-architektur) - Components and modules
  - [Deployment](./deployment/staging) - Staging and Production

## Quick Start

For a quick installation in a test environment:

```
# Clone repository
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# Install dependencies
npm install

# Start development server
npm run dev
```

For a full production installation, follow the sections in the Administration Handbook.

::: warning Security Notice
The quick installation is only suitable for test environments! Security aspects must be considered for production systems.
:::