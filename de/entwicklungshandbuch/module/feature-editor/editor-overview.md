---
title: Feature Editor Overview
description: Übersicht über das Feature-Editor-Modul - Zeichnen, Bearbeiten und Synchronisieren von Geodaten
quality:
  completeness: 60
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature Editor Overview

## Übersicht

Der Feature Editor ist das zentrale Modul für die Erstellung und Bearbeitung von Geodaten in p2d2. Er ermöglicht das interaktive Zeichnen neuer Features, die Bearbeitung existierender Geometrien und die Synchronisation mit verschiedenen Backend-Systemen.

## Architektur-Übersicht

```
┌─────────────────────────────────────┐
│      Feature-Editor UI              │
│  (Buttons, Panels, Toolbars)        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼─────┐  ┌─────▼────────┐
│Draw Manager│  │  Edit Mode   │
│  🚧 TODO   │  │  🚧 TODO     │
└──────┬─────┘  └─────┬────────┘
       │              │
       └──────┬───────┘
              │
      ┌───────▼────────┐
      │ Feature Sync   │
      │  ✅ Teilweise  │
      └───────┬────────┘
              │
      ┌───────▼────────┐
      │OSM Integration │
      │  ✅ Grundlagen │
      └────────────────┘
```

## Modul-Übersicht

| Modul | Status | Zweck | Hauptfunktionen |
|-------|--------|-------|-----------------|
| **Draw Manager** | 🚧 Nicht implementiert | Neue Features zeichnen | Polygon-, Point-, LineString-Zeichnung |
| **Edit Mode** | 🚧 Nicht implementiert | Features bearbeiten | Vertex-Editing, Move, Resize, Delete |
| **Feature Sync** | ✅ Teilweise implementiert | Persistierung und Synchronisation | Polygon-Sync-Plugin, File-Watcher |
| **OSM Integration** | ✅ Grundlagen vorhanden | OpenStreetMap-Integration | OSM-Interfaces, Overpass-API-Strukturen |

## Implementierungsstatus

### ✅ Implementierte Komponenten

#### Polygon-Sync-Plugin
- **Datei**: `src/integrations/polygon-sync-plugin.mjs`
- **Funktion**: Automatische Synchronisation von Markdown-Dateien
- **Features**:
  - File-Watcher für `src/content/kommunen`
  - Debounced Processing (2000ms)
  - Development/Production-Modus

#### Kommune-Watcher
- **Datei**: `src/scripts/kommune-watcher.mjs`
- **Funktion**: Überwacht Änderungen an Kommunen-Markdown-Dateien
- **Features**:
  - Chokidar-basierter File-Watcher
  - Debounce-Mechanismus
  - Manuelle Sync-Trigger

#### OSM-Grundstrukturen
- **Dateien**: `src/types/admin-polygon.ts`, `src/content.config.ts`
- **Funktion**: Datenstrukturen für OSM-Integration
- **Features**:
  - OSM-Polygon-Interfaces
  - Overpass-API-Response-Typen
  - OSM-Admin-Level-Verwaltung

### 🚧 Noch nicht implementiert

#### Draw Manager
- OpenLayers Draw-Interaktion
- UI-Buttons für verschiedene Geometrie-Typen
- Draw-Style-Konfiguration
- Event-Handler für drawstart/drawend

#### Edit Mode
- OpenLayers Modify-Interaktion
- Select-Interaktion für Feature-Auswahl
- Snap-Interaktion für präzises Editieren
- Vertex-Editing (Move, Delete, Add)

#### Vollständige Feature-Sync
- WFS-T (Transactional Web Feature Service)
- Bidirektionale Synchronisation
- Konflikt-Resolution
- Undo/Redo-Funktionalität

#### Vollständige OSM-Integration
- Feature-zu-OSM-Tag-Mapping
- OSM-XML-Export
- Overpass-API-Queries
- OSM-Authentifizierung

## Datenfluss

### Aktueller Workflow (teilweise implementiert)

1. **Content-Änderung**: Markdown-Datei in `src/content/kommunen` wird geändert
2. **File-Watcher**: Kommune-Watcher erkennt Änderung
3. **Debounce**: 2000ms Wartezeit für stabile Änderungen
4. **Sync-Trigger**: Polygon-Sync-Plugin wird aktiviert
5. **Processing**: Kommunen-Daten werden verarbeitet

### Geplanter Workflow (vollständig)

1. **Draw/Edit**: User zeichnet/bearbeitet Feature auf Karte
2. **Feature-Erstellung**: Draw/Edit erstellt OpenLayers-Feature
3. **Property-Setzung**: Feature erhält Metadaten und OSM-Tags
4. **Persistierung**: Feature wird in Markdown gespeichert
5. **Sync**: Polygon-Sync-Plugin synchronisiert mit Backend
6. **OSM-Export**: Feature wird für OSM vorbereitet

## Technische Grundlagen

### OpenLayers-Integration

Der Feature Editor baut auf der bestehenden OpenLayers-Integration auf:

- **Map-Konfiguration**: `src/config/map-config.ts`
- **Projektionsverwaltung**: `src/utils/crs.ts`
- **Layer-Management**: `src/utils/layer-manager.ts`

### Content-Collections

Kommunen-Daten werden über Astro Content Collections verwaltet:

```typescript
// src/content.config.ts
const kommunen = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    wp_name: z.string(),
    osmAdminLevels: z.array(z.number()).optional(),
    // ... weitere Properties
  })
});
```

### OSM-Datenstrukturen

```typescript
// src/types/admin-polygon.ts
export interface OSMPolygonFeature extends GeoJSON.Feature {
  id: number;
  properties: {
    name: string;
    admin_level: number;
    wikipedia?: string;
    // ... OSM-spezifische Properties
  };
}
```

## Verwendungsbeispiel (geplant)

```typescript
// Feature erstellen, editieren, speichern, exportieren
// 1. Draw Manager aktivieren
activateDrawMode('polygon');

// 2. Feature zeichnen (User-Interaktion)
// 3. Feature erhält automatisch Properties
feature.setProperties({
  name: 'Spielplatz Musterstraße',
  type: 'playground',
  osm_tags: { leisure: 'playground' }
});

// 4. Automatische Persistierung zu Markdown
// 5. Sync zu Backend-Systemen
// 6. OSM-Export vorbereiten
```

## Abhängigkeiten

### Interne Abhängigkeiten

- **Map-Konfiguration**: `src/config/map-config.ts`
- **Projektions-Utils**: `src/utils/crs.ts`
- **Layer-Management**: `src/utils/layer-manager.ts`
- **Content-Collections**: `src/content.config.ts`
- **Event-System**: `src/utils/events.ts`

### Externe Abhängigkeiten

- **OpenLayers**: `ol/interaction/Draw`, `ol/interaction/Modify`, `ol/interaction/Select`
- **Chokidar**: File-Watching für Sync-Plugin
- **proj4**: Projektionstransformationen

##