---
layout: home

hero:
  name: "p2d2"
  text: "Public-Public<br />Data-DNA"
  tagline: Daten der Öffentlichkeit mit<br />offenen Verwaltungsdaten verzahnen!
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
    - theme: alt
      text: Entwicklungs-Handbuch
      link: /de/entwicklungshandbuch/

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
  - icon: 💻
    title: Entwicklungs-Handbuch
    details: Technische Dokumentation für Entwickler zur Architektur, Modulen und Entwicklungsworkflows.
    link: /de/entwicklungshandbuch/

title: "Landing Page"

quality:
  completeness: 90
  accuracy: 85
  reviewed: true
  reviewer: "system"
  reviewDate: "2025-11-17"
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

### KI-Hinweis
- Die Arbeit und auch die Erstellung Dokumentation wurde mit KI-Werkzeugen unterstützt
- Insbesondere in der Dokumentation finden sich Stellen, an denen die KI über das Ziel hinaus geschossen ist und phantasiert.
- Um eine Übersicht zu schaffen wurde QS/QM installiert, das es erlaubt, für jede Seite Qualitätsparameter anzugeben, so dass die Zuverlässigkeit der Seite abgeschätzt werden kann. Im Laufe der Zeit sollen alle Seiten durchgesehen und bewertet werden.
- Frühere Markdown-Dokumente aus dem Projektverzeichnis wurden am 17.11.2025 integriert
- Frühere Durchführungsprotokolle, z.B. zur Proxmox-, MapServer- oder Geoserver Einrichtung, müssen noch ausgewertet werden und dann die "blumig-unkonkreten" Beschreibungen vieler Dokumentationsseiten ersetzen.
- Das System wurde am 17.11. in Betrieb genommen

---

::: tip 📖 Erste Schritte
Beginnen Sie mit dem [Benutzerhandbuch](/benutzerhandbuch/), um die Anwendung kennenzulernen, oder konsultieren Sie das [Administrationshandbuch](/administrationshandbuch/) für technische Details zur Installation und Konfiguration.
:::
