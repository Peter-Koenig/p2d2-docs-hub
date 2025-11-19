---
title: Feature Sync
description: "Synchronisation von Features zwischen Karte, Markdown-Dateien und Backend-Systemen"
quality:
  completeness: 70
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature Sync

## Übersicht

Das Feature-Sync-Modul verwaltet die Persistierung und Synchronisation von Geodaten zwischen verschiedenen Systemen. Es umfasst automatische File-Watching, Markdown-zu-GeoJSON-Konvertierung und geplante WFS-T-Synchronisation.

## Architektur

### Sync-Komponenten

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Markdown      │◄──►│  Polygon-Sync    │◄──►│   Backend       │
│   Content       │    │    Plugin        │    │  (WFS-T)        │
│   Collections   │    │                  │    │   🚧 Geplant    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Kommune-      │    │   OpenLayers     │
│   Watcher       │    │   Features       │
│                 │    │   🚧 Geplant     │
└─────────────────┘    └──────────────────┘
```

## Implementierte Komponenten

### Polygon-Sync-Plugin

**Datei:** `src/integrations/polygon-sync-plugin.mjs`

Das Plugin integriert sich in den Astro-Build-Prozess und überwacht automatisch Änderungen an Kommunen-Markdown-Dateien.

#### Konfiguration

```javascript
export function polygonSyncPlugin(options = {}) {
  const {
    watchDir = "src/content/kommunen",
    autoSync = true,
    followSymlinks = true,
    debounceMs = 2000,
    debug = false,
  } = options;
  
  // Plugin-Implementierung...
}
```

#### Astro-Hooks

- **`astro:server:start`**: Startet File-Watcher im Development-Modus
- **`astro:build:done`**: Loggt Build-Abschluss (Production)
- **`astro:server:done`**: Stoppt File-Watcher

### Kommune-Watcher

**Datei:** `src/scripts/kommune-watcher.mjs`

Der Watcher überwacht Markdown-Dateien im `src/content/kommunen`-Verzeichnis und trigger automatische Synchronisation.

#### Initialisierung

```javascript
export class KommuneWatcher {
  constructor(options = {}) {
    this.defaultOptions = {
      debounceMs: 2000,
      verbose: false,
      dryRun: false,
      patterns: ["*.md"],
    };
    this.options = { ...this.defaultOptions, ...options };
  }
}
```

#### File-Watching

- **Patterns:** `["*.md"]` - Überwacht alle Markdown-Dateien
- **Debounce:** 2000ms - Vermeidet häufige Sync-Trigger
- **Events:** `add`, `change`, `unlink` - Datei-Änderungen

#### Event-Verarbeitung

```javascript
handleFileEvent(eventType, filePath) {
  const kommuneSlug = this.extractKommuneSlug(filePath);
  
  if (!kommuneSlug) {
    if (mergedOptions.verbose) {
      console.log(`[kommune-watcher] Ignoring non-kommune file: ${filePath}`);
    }
    return;
  }
  
  this.pendingChanges.add(kommuneSlug);
  
  // Debounce-Mechanismus
  if (this.debounceTimer) {
    clearTimeout(this.debounceTimer);
  }
  
  this.debounceTimer = setTimeout(() => {
    this.processPendingChanges();
  }, mergedOptions.debounceMs);
}
```

## Datenformate

### Markdown-Frontmatter

Kommunen-Daten werden als Markdown-Dateien mit Frontmatter gespeichert:

```markdown
---
title: "Köln"
wp_name: "de-Köln"
osmAdminLevels: [6, 7, 8, 9, 10]
osm_refinement: "boundary=administrative"
colorStripe: "#FF6900"
map:
  center: [376000, 5648000]
  zoom: 12
  projection: "EPSG:25832"
---

# Köln

Beschreibung der Kommune...
```

### GeoJSON-Features

Features werden als GeoJSON in WFS-Services gespeichert (geplant):

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  },
  "properties": {
    "name": "Grabflur 1",
    "container_type": "cemetery",
    "wp_name": "de-Köln",
    "osm_admin_level": 10
  }
}
```

## Sync-Workflow

### 1. File-Änderung erkennen

```javascript
// Kommune-Watcher erkennt Änderung
handleFileEvent('change', 'koeln.md')

// Extrahiert Kommune-Slug
const kommuneSlug = 'koeln'

// Fügt zu pendingChanges hinzu
this.pendingChanges.add('koeln')
```

### 2. Debounced Processing

```javascript
// Nach 2000ms ohne weitere Änderungen
setTimeout(() => {
  this.processPendingChanges();
}, 2000);
```

### 3. Sync ausführen

```javascript
async processPendingChanges() {
  const changes = Array.from(this.pendingChanges);
  
  for (const kommuneSlug of changes) {
    try {
      // Warte auf ContentCollection-Refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Sync-Funktion aufrufen
      const { syncKommunePolygons } = await import(
        "../utils/polygon-wfst-sync.js"
      );
      const result = await syncKommunePolygons(kommuneSlug);
      
      // Ergebnis verarbeiten
      if (result.success) {
        console.log(`Sync completed for ${kommuneSlug}`);
      }
    } catch (error) {
      console.error(`Error processing ${kommuneSlug}: ${error.message}`);
    }
  }
}
```

## 🚧 Geplante Erweiterungen

### WFS-T Synchronisation

**Status:** Noch nicht implementiert

**Geplante Funktionen:**
- Transactional Web Feature Service
- Insert/Update/Delete-Operationen
- Konflikt-Resolution
- Rollback-Mechanismen

### Bidirektionale Sync

**Status:** Noch nicht implementiert

**Geplante Funktionen:**
- Pull: Änderungen vom Server laden
- Push: Lokale Änderungen hochladen
- Merge-Strategien bei Konflikten
- Offline-First-Ansatz

### Echtzeit-Synchronisation

**Status:** Noch nicht implementiert

**Geplante Funktionen:**
- WebSocket-basierte Updates
- Collaborative Editing
- Live-Konflikt-Erkennung
- Operationen-Transformation

## Konfiguration

### Environment Variables

```bash
# Für zukünftige WFS-T-Integration
WFST_USERNAME=username
WFST_PASSWORD=password
WFST_ENDPOINT=https://geoserver.example.com/wfs
```

### Plugin-Optionen

```javascript
// In astro.config.mjs
integrations: [
  polygonSyncPlugin({
    watchDir: "src/content/kommunen",
    autoSync: true,
    debounceMs: 2000,
    debug: process.env.NODE_ENV === 'development'
  })
]
```

## Fehlerbehandlung

### File-Watching-Fehler

```javascript
watcher.on("error", (error) => {
  console.error(`[kommune-watcher] Error: ${error.message}`);
});
```

### Sync-Fehler

```javascript
try {
  const result = await syncKommunePolygons(kommuneSlug);
  
  if (!result.success) {
    console.error(`Sync failed: ${result.errors.join(", ")}`);
  }
} catch (error) {
  console.error(`Processing error: ${error.message}`);
}
```

### Fallback-Strategien

- **Network Issues:** Lokale Persistierung, späterer Retry
- **Authentication:** Read-only Fallback
- **Data Corruption:** Backup-Wiederherstellung

## Performance-Optimierungen

### Debounce-Mechanismus

- **2000ms Delay:** Vermeidet häufige Sync-Operationen
- **Batch-Processing:** Mehrere Änderungen zusammen verarbeiten
- **Memory-Management:** pendingChanges-Set für Duplikat-Vermeidung

### Lazy Loading

```javascript
// Dynamischer Import der Sync-Funktion
const { syncKommunePolygons } = await import(
  "../utils/polygon-wfst-sync.js"
);
```

### Caching

- **File-Stat-Cache:** Vermeidet redundante Datei-Operationen
- **Content-Cache:** Zwischenspeicherung von geparsten Daten
- **Network-Cache:** HTTP-Caching für WFS-Requests

## Verwendung

### Development-Modus

```bash
# Startet Development-Server mit aktivem File-Watching
npm run dev

# Log-Ausgabe:
# [polygon-sync-plugin] Polygon sync plugin: Watching src/content/kommunen for changes
# [kommune-watcher] change: koeln (koeln.md)
# [kommune-watcher] Processing 1 pending changes: koeln
```

### Production-Build

```bash
# Build mit Sync-Logging
npm run build

# Log-Ausgabe:
# [polygon-sync-plugin] Build completed - manual sync may be required
```

### Manuelle Sync-Trigger

```javascript
// In der Konsole
const watcher = new KommuneWatcher();
await watcher.triggerManualSync('koeln');
```

## Abhängigkeiten

### Interne Abhängigkeiten

- **Content Collections:** `src/content.config.ts`
- **Kommune-Utils:** `src/utils/kommune-utils.ts`
- **Event-System:** `src/utils/events.ts`

### Externe Abhängigkeiten

- **Chokidar:** `^3.5.3` - File-Watching
- **Astro Hooks:** Build-Prozess-Integration

### Geplante Abhängigkeiten

- **WFS-T Client:** Für Backend-Synchronisation
- **WebSocket Client:** Für Echtzeit-Updates
- **Conflict Resolution:** Für bidirektionale Sync

## Best Practices

### File-Naming

- **Kommune-Slugs:** `koeln.md`, `bonn.md`, `duesseldorf.md`
- **Konsistente Encoding:** UTF-8 für alle Dateien
- **Validierung:** Slug-Extraktion mit Regex-Validation

### Error-Recovery

- **Graceful Degradation:** Fallback bei Sync-Fehlern
- **Retry-Logik:** Automatische Wiederholung bei Netzwerk-Fehlern
- **Backup-System:** Regelmäßige Sicherungen

### Monitoring

- **Logging:** Detaillierte Sync-Protokolle
- **Metrics:** Performance-Metriken sammeln
- **Alerts:** Benachrichtigungen bei kritischen Fehlern