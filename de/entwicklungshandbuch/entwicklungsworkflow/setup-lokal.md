---
title: Lokales Setup
description: Einrichtung der lokalen Entwicklungsumgebung für p2d2
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Lokales Setup

> **Status:** 🚧 Dokumentation in Arbeit

## Übersicht

Dieses Dokument beschreibt die Einrichtung einer lokalen Entwicklungsumgebung für die p2d2-Plattform. Die Entwicklungsumgebung ermöglicht das lokale Testen, Debuggen und Entwickeln aller p2d2-Komponenten.

## Voraussetzungen

### Systemanforderungen
- **Node.js**: Version 18 oder höher
- **npm**: Version 8 oder höher
- **Git**: Für Versionskontrolle
- **Text-Editor/IDE**: VS Code, WebStorm oder vergleichbar

### Empfohlene Entwicklungsumgebung
- **Betriebssystem**: Linux, macOS oder Windows mit WSL2
- **Browser**: Chrome, Firefox oder Safari (aktuelle Version)
- **RAM**: Mindestens 8 GB empfohlen
- **Speicherplatz**: 2 GB freier Speicher

## Installation

### 1. Repository klonen
```bash
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Entwicklungsumgebung starten
```bash
npm run dev
```

Die Anwendung ist anschließend unter `http://localhost:4321` erreichbar.

## Projektstruktur verstehen

### Wichtige Verzeichnisse
```
p2d2/
├── src/                    # Quellcode
│   ├── components/         # UI-Komponenten
│   ├── layouts/           # Seitenlayouts
│   ├── pages/             # Routen und Seiten
│   ├── content/           # Content Collections
│   └── utils/             # Hilfsfunktionen
├── public/                # Statische Assets
└── package.json           # Projektkonfiguration
```

### Content Collections
- **Kommunen-Daten**: Strukturierte Informationen in `src/content/kommunen/`
- **Konfigurationen**: Systemeinstellungen und Layer-Definitionen

## Entwicklungswerkzeuge

### Browser-Entwicklertools
- **Console**: Debugging und Logging
- **Network**: Überwachung von HTTP-Requests
- **Elements**: DOM-Inspection
- **Sources**: JavaScript-Debugging

### VS Code Erweiterungen (empfohlen)
- **TypeScript**: Sprachunterstützung
- **Astro**: Framework-Unterstützung
- **Tailwind CSS**: CSS-Framework
- **ESLint**: Code-Linting
- **Prettier**: Code-Formatierung

## Häufige Probleme

### Port-Konflikte
Falls Port 4321 bereits belegt ist:
```bash
npm run dev -- --port 3000
```

### Node.js Version
Bei Inkompatibilitäten mit der Node.js-Version:
```bash
nvm use 18  # Falls nvm installiert ist
```

### Abhängigkeitsprobleme
Bei Problemen mit npm-Paketen:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Testing

### Entwicklungsserver testen
1. Entwicklungsserver starten: `npm run dev`
2. Browser öffnen: `http://localhost:4321`
3. Funktionen testen:
   - Karten-Loading
   - Layer-Switching
   - Feature-Editor
   - Responsive Design

### Build-Prozess testen
```bash
npm run build
npm run preview
```

## Nächste Schritte

- [ ] Detaillierte Debugging-Anleitung
- [ ] Performance-Optimierungen dokumentieren
- [ ] Testing-Strategie erweitern
- [ ] CI/CD-Integration beschreiben