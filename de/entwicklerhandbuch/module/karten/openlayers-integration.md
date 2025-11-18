---
title: OpenLayers Integration
description: Integration der OpenLayers-Bibliothek mit Projektionsverwaltung, Map-Initialisierung und CRS-Utilities
quality:
  completeness: 95
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# OpenLayers Integration

## Übersicht

Die OpenLayers-Integration in p2d2 umfasst die Map-Initialisierung, Projektionsverwaltung und Koordinatentransformation. Das System verwendet die `crs.ts` Utilities für erweiterte Projektionsunterstützung und die `map-config.ts` für konsistente Konfiguration.

## Projektionsverwaltung (crs.ts)

### Unterstützte Koordinatensysteme

| EPSG-Code | Name | Verwendung |
|-----------|------|------------|
| EPSG:25832 | ETRS89 / UTM 32N | Standard-Projektion für p2d2 |
| EPSG:25833 | ETRS89 / UTM 33N | Alternative UTM-Zone |
| EPSG:3857 | Web Mercator | Web-Karten-Standard |
| EPSG:4326 | WGS84 | Geografische Koordinaten |

### Vordefinierte UTM-Projektionen

```typescript
const predefinedUtmDefs: Record<string, string> = {
  "EPSG:25832":
    "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  "EPSG:25833":
    "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
};
```

## API-Referenz

### `registerUtm(crs: string): boolean`

Registriert eine UTM-Projektion dynamisch in OpenLayers.

**Parameter:**
- `crs` (string): EPSG-Code der UTM-Projektion

**Rückgabe:**
- `boolean`: Erfolg der Registrierung

**Unterstützte UTM-Zonen:**
- EPSG:32601-32660 (UTM Nord)
- EPSG:32701-32760 (UTM Süd)
- EPSG:25801-25860 (ETRS89 UTM)

**Beispiel:**
```typescript
import { registerUtm } from '../utils/crs';

// UTM Zone 32N registrieren
const success = registerUtm('EPSG:25832');
console.log('Registration successful:', success);
```

### `toNewViewPreservingScale(map: Map, targetEpsg: string, animate: boolean = true): boolean`

Wechselt die Map-View zu einer neuen Projektion unter Erhaltung des Maßstabs.

**Parameter:**
- `map` (Map): OpenLayers Map-Instanz
- `targetEpsg` (string): Ziel-Projektion (EPSG-Code)
- `animate` (boolean): Animation aktivieren (Standard: true)

**Rückgabe:**
- `boolean`: Erfolg des View-Wechsels

**Features:**
- Maßstabs-Erhaltung zwischen Projektionen
- Automatische UTM-Registrierung
- Animierte Übergänge
- Fehlerbehandlung mit Rollback

**Beispiel:**
```typescript
import { toNewViewPreservingScale } from '../utils/crs';

// Von UTM zu Web Mercator wechseln
const success = toNewViewPreservingScale(map, 'EPSG:3857', true);
```

### `isUtm(crs: string): boolean`

Prüft, ob ein CRS-Code eine UTM-Projektion ist.

**Parameter:**
- `crs` (string): EPSG-Code

**Rückgabe:**
- `boolean`: true für UTM-Projektionen

**Regex-Muster:**
```typescript
/^EPSG:(326\d{2}|327\d{2}|258\d{2})$/
```

### Validierungsfunktionen

#### `isValidWgs84Coordinate(coord: any): boolean`

Validiert WGS84-Koordinaten [longitude, latitude].

**Kriterien:**
- Array mit 2 numerischen Werten
- Längengrad: -180 bis 180
- Breitengrad: -90 bis 90

#### `isValidWgs84Extent(extent: any): boolean`

Validiert WGS84-Ausschnitte [minLon, minLat, maxLon, maxLat].

**Kriterien:**
- Array mit 4 numerischen Werten
- Korrekte geografische Grenzen
- Logische Extent-Reihenfolge

### Transformationsfunktionen

#### `transformExtentFromWgs84(extent: number[], targetEpsg: string): number[] | null`

Transformiert einen Ausschnitt von WGS84 zur Ziel-Projektion.

**Parameter:**
- `extent` (number[]): WGS84-Ausschnitt [minLon, minLat, maxLon, maxLat]
- `targetEpsg` (string): Ziel-Projektion

**Rückgabe:**
- `number[] | null`: Transformierter Ausschnitt oder null bei Fehler

#### `transformCenterFromWgs84(center: number[], targetEpsg: string): number[] | null`

Transformiert einen Mittelpunkt von WGS84 zur Ziel-Projektion.

**Parameter:**
- `center` (number[]): WGS84-Koordinaten [lon, lat]
- `targetEpsg` (string): Ziel-Projektion

**Rückgabe:**
- `number[] | null`: Transformierte Koordinaten oder null bei Fehler

## Map-Initialisierung

### Basis-Initialisierung

```typescript
import Map from 'ol/Map';
import View from 'ol/View';
import { MAP_CONFIG } from '../config/map-config';

const map = new Map({
  target: 'map-container',
  view: new View({
    center: MAP_CONFIG.INITIAL_CENTER,
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    projection: MAP_CONFIG.PROJECTION,
    maxZoom: 21,
    minZoom: 1
  }),
  controls: [] // Werden separat hinzugefügt
});
```

### Komplette Initialisierung mit Layer

```typescript
import { createLuftbildLayer, createBasemapLayer, initLayerControls } from '../utils/layer-manager';
import FullScreen from 'ol/control/FullScreen';
import Zoom from 'ol/control/Zoom';

// Map erstellen
const map = new Map({
  target: 'map',
  view: new View({
    center: MAP_CONFIG.INITIAL_CENTER,
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    projection: MAP_CONFIG.PROJECTION
  })
});

// Layer hinzufügen
const luftbild = createLuftbildLayer(MAP_CONFIG.PROJECTION);
const basemap = createBasemapLayer();
map.addLayer(luftbild);
map.addLayer(basemap);

// Controls hinzufügen
map.addControl(new Zoom());
map.addControl(new FullScreen({
  className: MAP_CONFIG.FULLSCREEN.CLASS_NAME,
  label: MAP_CONFIG.FULLSCREEN.LABEL,
  labelActive: MAP_CONFIG.FULLSCREEN.LABEL_ACTIVE,
  tipLabel: MAP_CONFIG.FULLSCREEN.TIP_LABEL
}));

// Layer-Controls initialisieren
initLayerControls();
```

## Projektions-Wechsel Workflow

### 1. Vorbereitung

```typescript
// Prüfen ob Ziel-Projektion unterstützt wird
import { isUtm, registerUtm } from '../utils/crs';

const targetEpsg = 'EPSG:25832';

if (isUtm(targetEpsg)) {
  // UTM-Projektion registrieren
  const registered = registerUtm(targetEpsg);
  if (!registered) {
    console.error('Failed to register UTM projection');
    return;
  }
}
```

### 2. View-Wechsel durchführen

```typescript
import { toNewViewPreservingScale } from '../utils/crs';

// View mit Maßstabs-Erhaltung wechseln
const success = toNewViewPreservingScale(map, targetEpsg, true);

if (success) {
  console.log(`Successfully switched to ${targetEpsg}`);
} else {
  console.error('Failed to switch projection');
  // Automatischer Rollback erfolgt intern
}
```

### 3. Layer anpassen

```typescript
// Layer müssen ggf. neu erstellt werden für neue Projektion
if (success) {
  // Alte Layer entfernen
  map.getLayers().clear();
  
  // Neue Layer mit korrekter Projektion erstellen
  const newLuftbild = createLuftbildLayer(targetEpsg);
  const newBasemap = createBasemapLayer(); // basemap.de nutzt EPSG:3857
  
  map.addLayer(newLuftbild);
  map.addLayer(newBasemap);
}
```

## Fehlerbehandlung

### Häufige Fehler-Szenarien

1. **Nicht registrierte Projektion:**
   ```typescript
   // Fehler: "proj4 not defined for EPSG:25832"
   // Lösung: registerUtm() aufrufen
   ```

2. **Ungültige Koordinaten:**
   ```typescript
   // Fehler bei Transformations-Funktionen
   // Lösung: isValidWgs84Coordinate() prüfen
   ```

3. **View-Wechsel fehlgeschlagen:**
   ```typescript
   // Automatischer Rollback zur vorherigen View
   // Fehler-Logging in Konsole
   ```

### Debugging

```typescript
import { getLayerStates } from '../utils/layer-manager';

// Layer-Status prüfen
console.log('Layer states:', getLayerStates());

// Aktuelle View-Informationen
const view = map.getView();
console.log('Current view:', {
  projection: view.getProjection()?.getCode(),
  center: view.getCenter(),
  zoom: view.getZoom(),
  resolution: view.getResolution()
});
```

## Abhängigkeiten

**OpenLayers Imports:**
- `ol/Map`
- `ol/View`
- `ol/proj/proj4` (register)
- `ol/proj` (getPointResolution, transform, transformExtent)

**Externe Abhängigkeiten:**
- `proj4` - Projektions-Bibliothek

**Interne Abhängigkeiten:**
- `../config/map-config` - Map-Konfiguration
- `../utils/layer-manager` - Layer-Management

## Best Practices

1. **Projektions-Konsistenz:** Immer EPSG:25832 als Standard verwenden
2. **UTM-Registrierung:** Vor View-Wechsel prüfen und ggf. registrieren
3. **Validierung:** Koordinaten vor Transformation validieren
4. **Fehlerbehandlung:** Alle Transformationen mit try-catch umgeben
5. **Performance:** Animation bei häufigen Wechseln deaktivieren

## Performance-Optimierungen

- **Rotation deaktiviert:** Bessere Performance bei Geometrie-Operationen
- **Lazy Registration:** UTM-Projektionen nur bei Bedarf registrieren
- **Caching:** Registrierte Projektionen werden zwischengespeichert
- **Selective Animation:** Animation nur bei Benutzer-Interaktionen