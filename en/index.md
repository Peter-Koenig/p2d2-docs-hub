---
layout: home

hero:
  name: "p2d2"
  text: "Public-Public Data-DNA"
  tagline: Spatial Data Infrastructure for Open Government Data
  actions:
    - theme: brand
      text: User Guide
      link: /en/benutzerhandbuch/
    - theme: alt
      text: Administration
      link: /en/administrationshandbuch/
    - theme: alt
      text: Strategy
      link: /en/entwicklungsstrategie/

features:
  - icon: 📚
    title: User Guide
    details: Learn how to use p2d2, capture geodata, and contribute to quality assurance.
    link: /en/benutzerhandbuch/
  - icon: ⚙️
    title: Administration Handbook
    details: Technical documentation on server architecture, SDI components, and deployment processes.
    link: /en/administrationshandbuch/
  - icon: 🚀
    title: Development Strategy
    details: Vision, scaling plans, and the open-source philosophy behind p2d2.
    link: /en/entwicklungsstrategie/
---

## What is p2d2?

**p2d2** (Public-Public Data-DNA) is a modern Spatial Data Infrastructure (SDI) that links administrative data with citizen data. The project aims to synchronize open administrative data with OpenStreetMap, WikiData, and other public data platforms.

### Core Principles

- **🔓 Open Source**: Fully open source under GPLv3
- **🌐 Standards-compliant**: OGC-compliant SDI following GDI-DE principles
- **👥 Community-driven**: Citizens as active data collectors
- **🔄 Bidirectional**: Synchronization between administration and the public

### Technology Stack

- **Frontend**: AstroJS, OpenLayers, TypeScript
- **Backend**: PostgreSQL/PostGIS, GeoServer, MapProxy
- **Infrastructure**: Proxmox VE, OPNsense, GitLab CI/CD
- **Standards**: WFS, WFS-T, WMS, WMTS, TMS, GeoJSON

### Repositories

- **Origin**: [gitlab.opencode.de/OC000028072444/p2d2](https://gitlab.opencode.de/OC000028072444/p2d2)
- **Mirror**: [gitlab.opencode.de/unbox-cologne/p2d2/p2d2-mirror](https://gitlab.opencode.de/unbox-cologne/p2d2/p2d2-mirror)
- **Hub**: [github.com/Peter-Koenig/p2d2-hub](https://github.com/Peter-Koenig/p2d2-hub)

---

::: tip 📖 Getting Started
Start with the [User Guide](/en/benutzerhandbuch/) to learn the application, or consult the [Administration Guide](/en/administrationshandbuch/) for technical details on installation and configuration.
:::
