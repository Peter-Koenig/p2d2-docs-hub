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

# p2d2 - Public-Public Data-DNA

**p2d2** kann als eine Middleware zwischen den Daten der Bevölkerung und den offenen Daten ihrer Verwaltungen verstanden werden. Die Anwendung ermöglicht die Verzahnung, Qualitätssicherung und gemeinsame Nutzung von Daten aus beiden Sphären – Bürgerdaten und Verwaltungsdaten. Bildlich lassen sich die Beiden Sphären wie die beiden Stränge eines DNA-Moleküls verstehen. Der Basenpaarung mim Bild der DNA entspricht dann die Synchronität der einzelnen Datenobjekte.

Das Projekt beginnt mit Geodaten, da diese durch ihre Komplexität und Visualisierbarkeit einen niedrigschwelligen Einstieg in das Thema ermöglichen. Die zugrunde liegende Architektur ist jedoch bewusst nicht auf Geodaten beschränkt: Die Data-DNA-Metapher umfasst die Gesamtheit der Daten von Bürgerinnen und Bürgern einerseits und die Daten ihrer öffentlichen Verwaltungen andererseits.

p2d2 synchronisiert offene Verwaltungsdaten mit öffentlichen Datenplattformen wie OpenStreetMap, WikiData und anderen Community-getriebenen Datenquellen. Um die räumlichen Daten zu Verwalten, ist eine eine quelloffne und OGC-konforme Geodateninfrastruktur (GDI) Bestandteil des Projektes.

- [Webseite: https://www.data-dna.eu](https://www.data-dna.eu)
- [Entwicklungsseite zum testen: https://dev.data-dna.eu](https://dev.data-dna.eu)
- [Dokumentations-Webseite: https://doc.data-dna.eu](https://doc.data-dna.eu)

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
