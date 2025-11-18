---
title: Map Configuration
description: Zentrale Konfiguration für OpenLayers-Karteninstanzen und Layer-Hierarchie
quality:
  completeness: 95
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Map Configuration

## Übersicht

Das `map-config.ts` Modul stellt eine zentrale Konfiguration für alle Kartenkomponenten in p2d2 bereit. Es definiert Projektionseinstellungen, Initialisierungs-Parameter und eine konsistente Z-Index-Hierarchie für die Layer-Schichtung.

## Konfigurationsobjekte

### Z-Index Hierarchie

```typescript
Z_INDEX: {
  BASE: 5,        // OSM base layer
  LUFTBILD: 7,    // Kölner Luftbild 2024
  CEMETERY_BG: 10, // Cemetery background polygon
  GEOTIFF: 12,    // Future: GeoTIFF layer
  ORTHOPHOTO: 13, // Future: Orthophoto layer
  BASEMAP: 15,    // basemap.de Layer
  GRABFLUR: 20,   // Grabflur polygons
  GRAVES: 25,     // Future: Individual graves
  LABELS: 30,     // Future: Text labels
  CONTROLS: 40,   // UI elements/overlays
}
```

**Bedeutung der Layer-Reihenfolge:**
- `BASE` (5): OpenStreetMap Basis-Layer
- `LUFTBILD` (7): Kölner Luftbilder 2024 WMS-Service
- `CEMETERY_BG` (10): Hintergrund-Polygone für Friedhofsbereiche
- `GEOTIFF` (12): Platzhalter für zukünftige GeoTIFF-Layer
- `ORTHOPHOTO` (13): Platzhalter für zukünftige Orthophoto-Layer
- `BASEMAP` (15): basemap.de WMS-Service (über Luftbildern)
- `GRABFLUR` (20): Grabflur-Polygone (Features)
- `GRAVES` (25): Platzhalter für individuelle Grabstätten
- `LABELS` (30): Platzhalter für Text-Labels
- `CONTROLS` (40): UI-Elemente und Overlays (höchste Ebene)

### Initialisierungsparameter

```typescript
PROJECTION: "EPSG:25832" as const,
INITIAL_CENTER: [376000, 5648000] as [number, number], // Cologne area
INITIAL_ZOOM: 12,
```

**Details:**
- `PROJECTION`: `"EPSG:25832"` - ETRS89 / UTM Zone 32N (Standard-Projektion)
- `INITIAL_CENTER`: `[376000, 5648000]` - Zentrum auf Köln-Bereich in UTM-Koordinaten
- `INITIAL_ZOOM`: `12` - Mittlere Zoom-Stufe für gute Übersicht

### Kontroll-Elemente

```typescript
CONTROLS: {
  ZOOM: true,
  ROTATE: false, // Disabled for better performance
  ATTRIBUTION: true,
},
```

**Steuerungselemente:**
- `ZOOM`: Zoom-Buttons aktiviert
- `ROTATE`: Rotations-Steuerung deaktiviert (Performance-Optimierung)
- `ATTRIBUTION`: Quellenangaben aktiviert

### Vollbild-Modus

```typescript
FULLSCREEN: {
  CLASS_NAME: "custom-fullscreen",
  LABEL: "⛶",
  LABEL_ACTIVE: "✕",
  TIP_LABEL: "Vollbildmodus",
},
```

**Vollbild-Konfiguration:**
- `CLASS_NAME`: CSS-Klasse für benutzerdefiniertes Styling
- `LABEL`: Symbol für inaktiven Zustand (⛶)
- `LABEL_ACTIVE`: Symbol für aktiven Zustand (✕)
- `TIP_LABEL`: Tooltip-Text

### View-Anpassung

```typescript
FIT_VIEW: {
  DURATION: 500,
  PADDING: [20, 20, 20, 20] as [number, number, number, number],
  MAX_ZOOM: 18,
  CONSTRAIN_RESOLUTION: false,
},
```

**Fit-View Einstellungen:**
- `DURATION`: 500ms - Animationsdauer für View-Anpassungen
- `PADDING`: `[20, 20, 20, 20]` - Innenabstand in Pixeln (oben, rechts, unten, links)
- `MAX_ZOOM`: 18 - Maximale Zoom-Stufe bei automatischen Anpassungen
- `CONSTRAIN_RESOLUTION`: false - Keine Einschränkung der Auflösung

## Koordinatensysteme

### Unterstützte Projektionen

| EPSG-Code | Name | Verwendung |
|-----------|------|------------|
| EPSG:25832 | ETRS89 / UTM 32N | Standard-Projektion für p2d2 |
| EPSG:3857 | Web Mercator | Alternative für Web-Karten |

**Hinweis:** Das System ist primär auf EPSG:25832 (UTM 32N) ausgelegt, unterstützt aber auch EPSG:3857 für bestimmte WMS-Dienste.

## Verwendungsbeispiele

### Import und Basis-Nutzung

```typescript
import { MAP_CONFIG } from '../config/map-config';

// Map-Initialisierung mit Konfiguration
const map = new Map({
  view: new View({
    center: MAP_CONFIG.INITIAL_CENTER,
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    projection: MAP_CONFIG.PROJECTION
  })
});
```

### Layer mit korrektem Z-Index

```typescript
import { MAP_CONFIG } from '../config/map-config';

// Layer mit spezifischem Z-Index erstellen
const layer = new TileLayer({
  source: new TileWMS({/* ... */}),
  zIndex: MAP_CONFIG.Z_INDEX.BASEMAP
});
```

### Vollbild-Steuerung konfigurieren

```typescript
import FullScreen from 'ol/control/FullScreen';
import { MAP_CONFIG } from '../config/map-config';

const fullScreenControl = new FullScreen({
  className: MAP_CONFIG.FULLSCREEN.CLASS_NAME,
  label: MAP_CONFIG.FULLSCREEN.LABEL,
  labelActive: MAP_CONFIG.FULLSCREEN.LABEL_ACTIVE,
  tipLabel: MAP_CONFIG.FULLSCREEN.TIP_LABEL
});

map.addControl(fullScreenControl);
```

## Abhängigkeiten

**Exports:**
- `MAP_CONFIG` (default) - Haupt-Konfigurationsobjekt

**Wird verwendet von:**
- `src/utils/layer-manager.ts` - Layer-Erstellung und Management
- `src/components/FeatureEditor.astro` - Haupt-Kartenkomponente
- `src/utils/crs.ts` - Projektions-Management

## Anpassungsmöglichkeiten

### Eigene Z-Index-Werte definieren

```typescript
// In map-config.ts erweitern
Z_INDEX: {
  ...MAP_CONFIG.Z_INDEX,
  CUSTOM_LAYER: 35, // Eigener Layer zwischen Features und Labels
}
```

### Projektion wechseln

```typescript
// Für Web-Mercator statt UTM
PROJECTION: "EPSG:3857" as const,
INITIAL_CENTER: [6.95, 50.94] as [number, number], // Köln in WGS84
```

### Performance-Optimierung

Die Rotation-Steuerung ist standardmäßig deaktiviert (`ROTATE: false`) für bessere Performance bei komplexen Geometrie-Operationen.

## Best Practices

1. **Konsistente Z-Index-Nutzung**: Immer `MAP_CONFIG.Z_INDEX` verwenden statt hartkodierten Werten
2. **Projektions-Konsistenz**: EPSG:25832 als Standard beibehalten für deutsche Geodaten
3. **Layer-Reihenfolge**: Die definierte Hierarchie für optimale Darstellung beibehalten
4. **Performance**: Rotation deaktiviert lassen, falls nicht benötigt