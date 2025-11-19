---
layout: home

hero:
  name: "p2d2"
  text: "Public-Public<br />Data-DNA"
  tagline: Interweaving public data with<br />open government data!
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
    - theme: alt
      text: Development Handbook
      link: /en/entwicklungshandbuch/

features:
  - icon: 📚
    title: User Guide
    details: Learn how to use p2d2, capture geodata, and contribute to quality assurance.
    link: /en/benutzerhandbuch/
  - icon: ⚙️
    title: Administration Handbook
    details: Technical documentation on server architecture, GDI components, and deployment processes.
    link: /en/administrationshandbuch/
  - icon: 🚀
    title: Development Strategy
    details: Vision, scaling plans, and the open source philosophy behind p2d2.
    link: /en/entwicklungsstrategie/
  - icon: 💻
    title: Development Handbook
    details: Technical documentation for developers on architecture, modules, and development workflows.
    link: /en/entwicklungshandbuch/

title: "Landing Page"

quality:
  completeness: 90
  accuracy: 85
  reviewed: true
  reviewer: "system"
  reviewDate: "2025-11-17"
---

## What is p2d2?

**p2d2** (Public-Public Data-DNA) is a modern geospatial data infrastructure that interconnects administrative data with citizen data. The project aims to synchronize open administrative data with OpenStreetMap, WikiData, and other public data platforms.

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

### AI Notice
- This work and documentation were created with AI tool support
- Especially in the documentation, there are sections where the AI overshot its mark and hallucinated content
- To provide an overview, a QS/QM (Quality Assurance/Quality Management) system was installed that allows quality parameters to be specified for each page, so that the reliability of the page can be estimated. Over time, all pages should be reviewed and evaluated
- Earlier Markdown documents from the project directory were integrated on November 17, 2025
- Earlier implementation protocols, e.g. for Proxmox, MapServer or Geoserver setup, still need to be evaluated and then replace the "flowery-vague" descriptions of many documentation pages
- The system went into operation on November 17, 2025


---

::: tip 📖 Getting Started
Start with the [User Guide](/benutzerhandbuch/) to learn the application, or consult the [Administration Guide](/administrationshandbuch/) for technical details on installation and configuration.
:::
