---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
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

- **CPU**: Mind. 4 Cores (8 empfohlen)
- **RAM**: Mind. 16 GB (32 GB empfohlen)
- **Storage**: Mind. 100 GB SSD (500 GB empfohlen)
- **Netzwerk**: 1 Gbit/s (10 Gbit/s für Produktion)

### Software

- **Betriebssystem**: Debian 12 oder Ubuntu 22.04 LTS
- **Virtualisierung**: Proxmox VE 8.x
- **Datenbank**: PostgreSQL 15+ mit PostGIS 3.4+
- **Webserver**: Nginx 1.24+
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
