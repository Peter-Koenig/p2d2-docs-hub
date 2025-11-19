---
title: Projektstruktur
description: Verzeichnisorganisation und Dateistruktur von p2d2
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Projektstruktur

> **Status:** 🚧 Dokumentation in Arbeit

## Verzeichnis-Übersicht

Die p2d2-Projektstruktur folgt einem klaren, modularen Aufbau:

```
p2d2/
├── src/                    # Quellcode-Hauptverzeichnis
│   ├── components/         # Wiederverwendbare UI-Komponenten
│   ├── layouts/           # Seitenlayouts und Templates
│   ├── pages/             # Routen und Seiten
│   ├── content/           # Content Collections
│   ├── styles/            # Globale Styles und CSS
│   └── utils/             # Hilfsfunktionen und Utilities
├── public/                # Statische Assets
├── dist/                  # Build-Ausgabe
└── package.json           # Projekt-Konfiguration
```

## Hauptverzeichnisse

### src/components/
Wiederverwendbare Astro-Komponenten für die Benutzeroberfläche:
- **Map-Komponenten**: Karten-Rendering und Interaktion
- **UI-Elemente**: Buttons, Formulare, Navigation
- **Layout-Komponenten**: Header, Footer, Sidebars

### src/layouts/
Seitenlayouts und Templates:
- **Base-Layout**: Grundlayout für alle Seiten
- **Map-Layout**: Spezielles Layout für Karten-Seiten
- **Admin-Layout**: Layout für Administrations-Bereiche

### src/pages/
Astro-Routen und Seiten:
- **Statische Seiten**: Über uns, Impressum, etc.
- **Dynamische Routen**: Kommunen-spezifische Seiten
- **API-Endpoints**: Server-seitige Funktionen

### src/content/
Content Collections für strukturierte Daten:
- **kommunen/**: Daten der unterstützten Kommunen
- **config/**: Konfigurationsdateien
- **geodata/**: Geodaten-Metadaten

### src/utils/
Hilfsfunktionen und Utilities:
- **map-utils.ts**: Karten-bezogene Funktionen
- **data-utils.ts**: Datenverarbeitung
- **storage-utils.ts**: Lokale Speicherung

## Build-Prozess

### Development
- **Development-Server**: Vite Dev Server
- **Hot-Reload**: Automatisches Neuladen bei Änderungen
- **TypeScript**: Echtzeit-Kompilierung

### Production
- **Static Generation**: Astro Build für statische Seiten
- **Optimization**: Code-Splitting und Asset-Optimierung
- **Deployment**: Automatisierte Bereitstellung

## Konfigurationsdateien

### package.json
- Projekt-Metadaten und Abhängigkeiten
- Build-Scripts und Development-Commands
- TypeScript-Konfiguration

### astro.config.mjs
- Astro Framework-Konfiguration
- Integrationen und Plugins
- Build-Einstellungen

### tailwind.config.js
- TailwindCSS-Konfiguration
- Design-Tokens und Farbpalette
- Responsive Breakpoints

## Nächste Schritte

- [ ] Detaillierte Komponenten-Struktur dokumentieren
- [ ] Content Collections vollständig beschreiben
- [ ] Build-Prozess im Detail dokumentieren
- [ ] Deployment-Struktur hinzufügen