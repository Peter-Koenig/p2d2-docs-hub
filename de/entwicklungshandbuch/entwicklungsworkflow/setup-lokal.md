---
title: Lokales Development Setup
description: Einrichtung der lokalen Entwicklungsumgebung für p2d2
quality:
  completeness: 90
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Lokales Development Setup

## Voraussetzungen

### Software

- **Node.js:** >= 18.x (empfohlen: 20.x LTS)
- **npm:** >= 9.x
- **Git:** >= 2.x
- **Editor:** VS Code (empfohlen) mit Astro Extension

### Empfohlene VS Code Extensions

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Repository klonen

### GitLab (Haupt-Repository)

```bash
git clone git@gitlab.opencode.de:OC000028072444/p2d2.git
cd p2d2
```

### GitHub (Hub-Mirror)

```bash
git clone git@github.com:Peter-Koenig/p2d2-hub.git
cd p2d2-hub
```

## Dependencies installieren

```bash
npm install
```

## Development Server starten

### Standard-Methode

```bash
npm run dev
```

Der Server läuft dann auf `http://localhost:4321`

### Mit Cache-Clearing (empfohlen für stabiles Development)

Vermeidet Probleme mit Astro- und Vite-Caches:

```bash
rm -rf .astro/ && \
rm -rf .astro node_modules/.astro && \
rm -rf node_modules/.vite && \
DEBUG=astro:* npm run dev -- --host 0.0.0.0
```

**Vorteile:**
- ✅ Zugriff von mobilen Geräten im LAN (`--host 0.0.0.0`)
- ✅ Minimale Cache-Probleme
- ✅ Debug-Output für Troubleshooting

### LAN-Zugriff

Wenn mit `--host 0.0.0.0` gestartet:

```bash
# Finde deine lokale IP
ip addr show | grep "inet "

# Beispiel-Zugriff von Mobilgerät
http://192.168.1.100:4321
```

## Projekt-Struktur

```
p2d2/
├── src/
│   ├── pages/
│   │   ├── index.astro           # Hauptseite
│   │   ├── [kommune].astro       # Kommune-Detail-Seite
│   │   └── feature-editor/
│   │       └── [featureId].astro # Feature-Editor (40kB, monolithisch)
│   ├── content/
│   │   └── kommunen/             # Kommunen-Daten (MDX)
│   ├── components/
│   │   ├── Map.astro             # OpenLayers Karte
│   │   └── FeatureEditor/        # Editor-Komponenten
│   ├── layouts/
│   │   └── Layout.astro          # Haupt-Layout
│   └── utils/
│       ├── map/                  # Karten-Utilities
│       ├── osm/                  # OSM-Integration
│       └── storage/              # LocalStorage-Utils
├── public/                       # Statische Assets
├── astro.config.mjs              # Astro-Konfiguration
└── package.json
```

## Environment-Variablen

### Development (.env.development)

```bash
# Optional für lokale Tests
# PUBLIC_* Variablen sind im Client verfügbar
PUBLIC_MAP_DEFAULT_CENTER="[7.0, 51.0]"
PUBLIC_MAP_DEFAULT_ZOOM="8"
```

### Production (.env.production)

Wird auf dem Server vom Deploy-Script verwaltet.

## Häufige Aufgaben

### Build testen

```bash
npm run build
```

Output in `dist/` - kann mit statischem Server getestet werden:

```bash
npx serve dist
```

### Type-Checking

```bash
npm run astro check
```

### Code-Formatierung

```bash
npm run format
```

## Troubleshooting

### Problem: Port 4321 bereits belegt

```bash
# Finde Prozess
lsof -i :4321

# Oder anderen Port nutzen
npm run dev -- --port 3333
```

### Problem: Module nicht gefunden

```bash
# Cache leeren und neu installieren
rm -rf node_modules package-lock.json
npm install
```

### Problem: Astro build schlägt fehl

```bash
# Astro-Cache löschen
rm -rf .astro
rm -rf node_modules/.astro
rm -rf node_modules/.vite

npm run build
```

### Problem: Hot Module Replacement (HMR) funktioniert nicht

Neustart mit Cache-Clearing (siehe oben).

## Development-Workflow

### Typischer Ablauf

1. Branch erstellen: `git checkout -b feature/mein-feature`
2. Dev-Server starten mit Cache-Clearing
3. Änderungen vornehmen
4. Testen im Browser + mobile Geräte
5. Commit: `git commit -m "feat: beschreibung"`
6. Push: `git push origin feature/mein-feature`
7. Merge Request auf GitLab erstellen

### Branch-Naming

Siehe [Git Workflow](./git-workflow.md) für Details.

## Kommunen-Daten lokal bearbeiten

Kommunen-Daten liegen in `src/content/kommunen/`:

```bash
# Neue Kommune anlegen
cp src/content/kommunen/_template.mdx src/content/kommunen/meine-kommune.mdx

# Bearbeiten
vim src/content/kommunen/meine-kommune.mdx
```

Daten werden automatisch vom Content-Collection-System geladen.

## OpenLayers Karte debuggen

Browser DevTools öffnen:

```javascript
// Im Browser-Console
window.map  // Zugriff auf OpenLayers-Map-Instanz
window.map.getLayers()  // Layers inspizieren
```

## Siehe auch

- [Git Workflow](./git-workflow.md)
- [Testing](./testing.md)
- [Debugging](./debugging.md)
- [Multi-Branch Deployment](../deployment/multi-branch-system.md)
