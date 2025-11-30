---
quality:
  completeness: 85
  accuracy: 85
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# Administrationshandbuch

Willkommen im Administrationshandbuch von p2d2. Hier finden Sie technische Dokumentation zur Installation, Konfiguration und zum Betrieb der Geodateninfrastruktur.

## Zielgruppe

Dieses Handbuch richtet sich an:

- **Systemadministrator:innen**, die p2d2 installieren und betreiben
- **DevOps-Engineer:innen**, die das Deployment automatisieren
- **GDI-Spezialist:innen**, die die Geodateninfrastruktur konfigurieren

## Architektur-Übersicht

p2d2 basiert auf einer mehrstufigen Architektur:

1. **Infrastruktur-Ebene**: Proxmox VE, OPNsense, PBS
2. **Geodateninfrastruktur**: PostgreSQL/PostGIS, GeoServer, MapProxy
3. **Frontend**: AstroJS-Anwendung mit OpenLayers
4. **CI/CD**: GitLab-basierte Deployment-Pipeline

## Systemanforderungen

### Hardware

- **Proxmox Host**: Intel 13th Gen (oder vergleichbar), 14 Cores, 64 GB RAM
- **Gesamtsystem**: ~28 GB RAM für alle Container/VMs + Overhead für Proxmox
- **Storage**: Mind. 200 GB SSD (für Container/VMs + Backup-Space)
- **Netzwerk**: 1 Gbit/s (10 Gbit/s für Produktion)

### Software

- **Virtualisierung**: Proxmox VE 9.x
- **Container OS**: Debian 13
- **Firewall OS**: FreeBSD 14.x (OPNSense)
- **Datenbank**: PostgreSQL 15+ mit PostGIS 3.4+
- **Webserver**: Caddy (TLS-Termination)
- **Node.js**: 20.x LTS

## Navigation

### Server-Infrastruktur

- [Server-Architektur Übersicht](./server-architektur/) - Gesamtarchitektur der p2d2-Infrastruktur
- [Proxmox Host](./server-architektur/proxmox-host) - Virtualisierungsplattform
- [OPNSense Firewall](./server-architektur/vm-opnsense) - Firewall und Reverse Proxy
- [Netzwerk-Architektur](./server-architektur/netzwerk-architektur) - Netzwerk-Segmentierung und Firewall-Design
- [Backup-Strategie](./server-architektur/backup-strategie) - Datensicherung und Disaster Recovery

### Geodateninfrastruktur

- [PostgreSQL/PostGIS Container](./server-architektur/lxc-postgresql) - Geodatenbank mit räumlichen Erweiterungen
- [GeoServer Container](./server-architektur/lxc-geoserver) - WFS/WMS-Server für Geodatendienste
- [MapProxy Container](./server-architektur/lxc-mapproxy) - Tile-Cache und Proxy für performante Kartenauslieferung
- [OSM-Tileserver VM](./server-architektur/vm-osm-tiler) - OpenStreetMap Tile-Rendering Server
- [Ory IAM Container (Geplant)](./server-architektur/lxc-ory-iam) - Identity and Access Management

### Software & Deployment

- [Frontend Container](./server-architektur/lxc-frontend) - AstroJS + VitePress Web-Frontend mit Multi-Branch CI/CD
- [Frontend-Architektur](./frontend-architektur) - AstroJS-Anwendung
- [Software-Architektur](./software-architektur) - Komponenten und Module
- [Deployment](./deployment/staging) - Staging und Production

## Schnellstart

Für eine Schnellinstallation in einer Testumgebung:

```
# Repository klonen
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Für eine vollständige Produktionsinstallation folgen Sie den Abschnitten im Administrationshandbuch.

::: warning Sicherheitshinweis
Die Schnellinstallation ist nur für Testumgebungen geeignet! Für Produktionssysteme müssen Sicherheitsaspekte berücksichtigt werden.
:::
