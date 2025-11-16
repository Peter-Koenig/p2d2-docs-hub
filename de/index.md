---
layout: home

hero:
  name: "p2d2"
  text: "Public-Public Data-DNA"
  tagline: Geodateninfrastruktur für offene Verwaltungsdaten
  actions:
    - theme: brand
      text: Benutzerhandbuch
      link: /de/benutzerhandbuch/
    - theme: alt
      text: Administration
      link: /de/administrationshandbuch/
    - theme: alt
      text: Strategie
      link: /de/entwicklungsstrategie/

features:
  - icon: 📚
    title: Benutzerhandbuch
    details: Erfahren Sie, wie Sie p2d2 nutzen, Geodaten erfassen und zur Qualitätssicherung beitragen.
    link: /de/benutzerhandbuch/
  - icon: ⚙️
    title: Administrationshandbuch
    details: Technische Dokumentation zur Server-Architektur, GDI-Komponenten und Deployment-Prozessen.
    link: /de/administrationshandbuch/
  - icon: 🚀
    title: Entwicklungsstrategie
    details: Vision, Skalierungspläne und die OpenSource-Philosophie hinter p2d2.
    link: /de/entwicklungsstrategie/
---

## Was ist p2d2?

**p2d2** (Public-Public Data-DNA) ist eine moderne Geodateninfrastruktur, die Verwaltungsdaten mit Bürgerdaten verzahnt. Das Projekt verfolgt das Ziel, offene Verwaltungsdaten mit OpenStreetMap, WikiData und anderen öffentlichen Datenplattformen zu synchronisieren.

### Kernprinzipien

- **🔓 Open Source**: Vollständig quelloffen unter GPLv3
- **🌐 Standardkonform**: OGC-konforme GDI nach GDI-DE-Prinzipien
- **👥 Community-getrieben**: Bürger:innen als aktive Datenerfasser
- **🔄 Bidirektional**: Synchronisation zwischen Verwaltung und Öffentlichkeit

### Technologie-Stack

- **Frontend**: AstroJS, OpenLayers, TypeScript
- **Backend**: PostgreSQL/PostGIS, GeoServer, MapProxy
- **Infrastruktur**: Proxmox VE, OPNsense, GitLab CI/CD
- **Standards**: WFS, WFS-T, WMS, WMTS, TMS, GeoJSON

### Repositories

- **Origin**: [gitlab.opencode.de/OC000028072444/p2d2](https://gitlab.opencode.de/OC000028072444/p2d2)
- **Mirror**: [gitlab.opencode.de/unbox-cologne/p2d2/p2d2-mirror](https://gitlab.opencode.de/unbox-cologne/p2d2/p2d2-mirror)
- **Hub**: [github.com/Peter-Koenig/p2d2-hub](https://github.com/Peter-Koenig/p2d2-hub)

---

::: tip 📖 Erste Schritte
Beginnen Sie mit dem [Benutzerhandbuch](/de/benutzerhandbuch/), um die Anwendung kennenzulernen, oder konsultieren Sie das [Administrationshandbuch](/de/administrationshandbuch/) für technische Details zur Installation und Konfiguration.
:::
