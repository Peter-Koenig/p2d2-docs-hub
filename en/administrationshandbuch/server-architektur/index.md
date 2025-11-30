---
title: Server Architecture
description: Overview of the p2d2 geodata infrastructure
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# Server Architecture

The p2d2 infrastructure is based on **Proxmox VE 9.x** and uses a hybrid architecture of **LXC containers** for microservices and **VMs** for complex network and tile server tasks. The virtualization runs on modern Intel hardware (13th Gen, 14 Cores, 64 GB RAM).

## Architecture Overview
TODO: Insert graphic

## Component Overview

| Component | Type | Role | RAM | Disk | OS |
|------------|-----|-------|-----|------|----|
| **OPNSense** | VM | Firewall + Reverse Proxy | 4 GB | 25 GB | FreeBSD 14.x |
| **PostgreSQL** | LXC | Geodatabase + PostGIS | 2 GB | 15 GB | Debian 13 |
| **GeoServer** | LXC | WFS/WMS Server | 6 GB | 12 GB | Debian 13 |
| **MapProxy** | LXC | Tile Cache + Proxy | 4 GB | 38 GB | Debian 13 |
| **OSM-Tiler** | VM | Tile Rendering | 6 GB | 65 GB | Debian 13 |
| **Frontend** | LXC | AstroJS + VitePress | 4 GB | 25 GB | Debian 13 |
| **Ory IAM** _(planned)_ | LXC | Identity Management | 2 GB | 10 GB | Debian 13 |

## Design Principles

### Service Isolation
Each service runs in its own LXC container or VM. This allows for:
- Independent updates without downtime for other services
- Resource isolation and performance tuning per service
- Rollback of individual components in case of problems

### Network Segmentation
- **DMZ Principle**: Frontend container has no direct database write access
- **Firewall-First**: All external requests go through OPNSense
- **Internal LAN**: Dedicated private network for service-to-service communication
- **Management VLAN**: Separate network for administrative access

### Security Features
- **Proxmox Firewall**: Enabled at the host level
- **OPNSense**: Stateful Packet Inspection, NAT rules
- **Caddy TLS**: Automatic Let's Encrypt certificates
- **VPN-Only Admin**: Administrative access only via VPN

## Backup Strategy

**Proxmox Backup Server (PBS)** creates incremental snapshots of all containers and VMs:
- **Daily Backups**: Critical components (DB, Frontend, Firewall)
- **Weekly Backups**: GDI middleware (GeoServer, MapProxy)
- **Monthly Backups**: Tile server (large data volumes)
- **Automatic Retention**: PBS policies for old backups

Details: [Backup Strategy](./backup-strategie.md)

## Further Documentation

- [Proxmox Host Details](./proxmox-host.md)
- [PostgreSQL/PostGIS Container](./lxc-postgresql.md)
- [GeoServer Container](./lxc-geoserver.md)
- [MapProxy Container](./lxc-mapproxy.md)
- [Frontend Container](./lxc-frontend.md)
- [OPNSense Firewall](./vm-opnsense.md)
- [OSM Tileserver](./vm-osm-tiler.md)
- [Network Architecture](./netzwerk-architektur.md)
- [Planned Ory IAM Integration](./lxc-ory-iam.md)