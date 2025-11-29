---
title: Server-Architektur
description: Übersicht der p2d2-Geodateninfrastruktur
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# Server-Architektur

Die p2d2-Infrastruktur basiert auf **Proxmox VE 9.x** und nutzt eine hybride Architektur aus **LXC-Containern** für Microservices und **VMs** für komplexe Netzwerk- und Tile-Server-Aufgaben. Die Virtualisierung läuft auf moderner Intel-Hardware (13th Gen, 14 Cores, 64 GB RAM).

## Architektur-Übersicht
TODO: Grafik einfügen

## Komponenten-Übersicht

| Komponente | Typ | Rolle | RAM | Disk | OS |
|------------|-----|-------|-----|------|----|
| **OPNSense** | VM | Firewall + Reverse Proxy | 4 GB | 25 GB | FreeBSD 14.x |
| **PostgreSQL** | LXC | Geodatenbank + PostGIS | 2 GB | 15 GB | Debian 13 |
| **GeoServer** | LXC | WFS/WMS-Server | 6 GB | 12 GB | Debian 13 |
| **MapProxy** | LXC | Tile-Cache + Proxy | 4 GB | 38 GB | Debian 13 |
| **OSM-Tiler** | VM | Tile-Rendering | 6 GB | 65 GB | Debian 13 |
| **Frontend** | LXC | AstroJS + VitePress | 4 GB | 25 GB | Debian 13 |
| **Ory IAM** _(geplant)_ | LXC | Identity Management | 2 GB | 10 GB | Debian 13 |

## Design-Prinzipien

### Service-Isolation
Jeder Dienst läuft in einem eigenen LXC-Container oder einer VM. Dies ermöglicht:
- Unabhängige Updates ohne Downtime anderer Services
- Ressourcen-Isolation und Performance-Tuning pro Service
- Rollback einzelner Komponenten bei Problemen

### Netzwerk-Segmentierung
- **DMZ-Prinzip**: Frontend-Container hat keinen direkten Datenbank-Schreibzugriff
- **Firewall-First**: Alle externen Requests durchlaufen OPNSense
- **Internes LAN**: Dediziertes privates Netzwerk für Service-zu-Service-Kommunikation
- **Management-VLAN**: Separates Netz für Administrative Zugriffe

### Security-Features
- **Proxmox Firewall**: Aktiviert auf Host-Ebene
- **OPNSense**: Stateful Packet Inspection, NAT-Regeln
- **Caddy TLS**: Automatische Let's Encrypt Zertifikate
- **VPN-Only Admin**: Administrativer Zugang nur über VPN

## Backup-Strategie

**Proxmox Backup Server (PBS)** erstellt inkrementelle Snapshots aller Container und VMs:
- **Tägliche Backups**: Kritische Komponenten (DB, Frontend, Firewall)
- **Wöchentliche Backups**: GDI-Middleware (GeoServer, MapProxy)
- **Monatliche Backups**: Tile-Server (große Datenmengen)
- **Automatische Retention**: PBS-Policies für alte Backups

Details: [Backup-Strategie](./backup-strategie.md)

## Weiterführende Dokumentation

- [Proxmox-Host Details](./proxmox-host.md)
- [PostgreSQL/PostGIS Container](./lxc-postgresql.md)
- [GeoServer Container](./lxc-geoserver.md)
- [MapProxy Container](./lxc-mapproxy.md)
- [Frontend Container](./lxc-frontend.md)
- [OPNSense Firewall](./vm-opnsense.md)
- [OSM-Tileserver](./vm-osm-tiler.md)
- [Netzwerk-Architektur](./netzwerk-architektur.md)
- [Geplante Ory IAM-Integration](./lxc-ory-iam.md)
