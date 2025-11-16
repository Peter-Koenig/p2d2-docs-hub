# Administration Handbook

::: tip Work in Progress
This technical documentation is under active development. New content will be added continuously.
:::

## Overview

Welcome to the **p2d2 Administration Handbook**. This guide provides comprehensive documentation for system administrators, DevOps engineers, and technical staff responsible for deploying and maintaining the p2d2 infrastructure.

## What You'll Find Here

This handbook covers:

- **Server Infrastructure**: Proxmox virtualization, backup strategies, and network architecture
- **Spatial Data Infrastructure (SDI)**: PostgreSQL/PostGIS, GeoServer, MapProxy, and OSM tile server
- **Frontend Architecture**: Astro.js application structure and VitePress documentation
- **Deployment Processes**: CI/CD pipelines, staging environments, and production deployment
- **Monitoring & Maintenance**: Backup strategies, system health, and troubleshooting

## Infrastructure Components

### Server Architecture

- **[Proxmox VE](server-architektur/proxmox)**: Virtualization platform for LXC containers
- **[Proxmox Backup Server](server-architektur/pbs-backup)**: Backup solution for disaster recovery
- **[OPNsense Firewall](server-architektur/opnsense)**: Network security and reverse proxy (Caddy)

### Spatial Data Infrastructure

- **[PostgreSQL/PostGIS](geodateninfrastruktur/postgresql-postgis)**: Spatial database backend
- **[GeoServer](geodateninfrastruktur/geoserver)**: OGC-compliant web map server
- **[MapProxy](geodateninfrastruktur/mapproxy)**: Tile cache and WMS/WMTS proxy
- **[OSM Tile Server](geodateninfrastruktur/osm-tileserver)**: OpenStreetMap basemap rendering

### Application Stack

- **[Frontend Architecture](frontend-architektur)**: Astro.js-based web application
- **[Software Architecture](software-architektur)**: Overall system design and component interaction

### Deployment

- **[Staging Environment](deployment/staging)**: Development and testing setup (`dev.data-dna.eu`)
- **[Production Deployment](deployment/production)**: Live system configuration (`www.data-dna.eu`)
- **[CI/CD Pipeline](deployment/cicd-pipeline)**: Automated build and deployment workflows
- **[Backup Strategy](backup-strategie)**: Data protection and disaster recovery

## Quick Start for Administrators

1. **Understand the Infrastructure**: Review [Proxmox VE](server-architektur/proxmox) setup
2. **Database Setup**: Configure [PostgreSQL/PostGIS](geodateninfrastruktur/postgresql-postgis)
3. **Deploy Services**: Set up [GeoServer](geodateninfrastruktur/geoserver) and supporting components
4. **Configure Networking**: Implement [OPNsense](server-architektur/opnsense) firewall rules
5. **Implement CI/CD**: Establish [deployment pipeline](deployment/cicd-pipeline)

## System Requirements

### Minimum Hardware

- **CPU**: 8 cores (or vCPUs)
- **RAM**: 32 GB
- **Storage**: 500 GB SSD (production data + backups)
- **Network**: 1 Gbps connection

### Software Stack

- **Virtualization**: Proxmox VE 8.x
- **Operating System**: Debian 12 (Bookworm) or Ubuntu 22.04 LTS
- **Database**: PostgreSQL 15+ with PostGIS 3.x
- **Web Server**: Nginx 1.22+
- **Runtime**: Node.js 20 LTS

## Development Philosophy

The p2d2 infrastructure follows these principles:

- **Open Source First**: All components are based on FOSS technologies
- **Scalability**: Designed to grow from municipal to national level
- **Automation**: CI/CD pipelines minimize manual intervention
- **Resilience**: Backup strategies and failover mechanisms
- **Standards Compliance**: OGC, INSPIRE, and GDI-DE specifications

## Target Audience

This handbook is designed for:

- **System Administrators**: Responsible for server infrastructure
- **DevOps Engineers**: Managing deployment and CI/CD
- **GIS Specialists**: Configuring spatial data services
- **Network Engineers**: Implementing security and routing
- **Technical Project Managers**: Overseeing infrastructure decisions

## Support & Community

For technical assistance:

- **Issue Tracking**: GitLab repository issue tracker
- **Documentation**: [Development Strategy](../entwicklungsstrategie/) for project context
- **User Guide**: [User Guide](../benutzerhandbuch/) for end-user perspective
- **Community**: Join discussions on GitLab

---

**Ready to deploy?** Start with the [Proxmox VE setup](server-architektur/proxmox) or review the [frontend architecture](frontend-architektur).
