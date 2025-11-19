---
title: "Code Style"
description: "TypeScript-Konfiguration, ESLint/Prettier-Setup, Naming-Konventionen und Best Practices"
quality:
  completeness: 85
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Code Style

## Übersicht

Diese Dokumentation beschreibt die Code-Style-Konventionen und Best Practices für die p2d2-Entwicklung. Der Fokus liegt auf TypeScript, Astro-Komponenten und OpenLayers-Integration.

## TypeScript-Konfiguration

### tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "*": ["node_modules/*"],
      "@/*": ["./src/*"],
      "@utils/*": ["./src/utils/*"]
    },
    "jsx": "preserve"
  }
}
```

**Wichtige Einstellungen:**
- `strict: true` - Strikte TypeScript-Prüfung
- `module: esnext` - ES-Module für moderne Browser
- `paths` - Aliases für bessere Import-Struktur
- `jsx: preserve` - JSX-Support für Astro-Komponenten

### Path Aliases

```typescript
// ❌ Vermeiden
import { registerUtm } from '../../../utils/crs';

// ✅ Empfohlen
import { registerUtm } from '@utils/crs';
import { MapConfig } from '@/types/map';
```

## ESLint & Prettier

**Status:** Aktuell nicht konfiguriert

### Empfohlenes Setup

```bash
# ESLint mit TypeScript und Astro Support
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-astro

# Prettier für Code-Formatierung
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### Beispiel-Konfiguration

**.eslintrc.json:**
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:astro/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error"
  }
}
```

**.prettierrc:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Naming-Konventionen

### Dateien

**Utility-Funktionen:** `kebab-case`
```
src/utils/crs.ts
src/utils/layer-management.ts
src/utils/events.ts
```

**Astro-Komponenten:** `PascalCase`
```
src/components/Map.astro
src/components/KommuneCard.astro
src/layouts/BaseLayout.astro
```

**TypeScript-Typen:** `PascalCase`
```
src/types/map.ts
src/types/kommunen.ts
src/types/api.ts
```

### Variablen und Funktionen

**camelCase für Variablen und Funktionen:**
```typescript
// ✅ Gut
const mapInstance = new Map();
const isValidCoordinate = isValidWgs84Coordinate(coord);
function transformCoordinate(coord: number[], targetEpsg: string) { ... }

// ❌ Vermeiden
const MAP_INSTANCE = new Map();
function Transform_Coordinate(coord: number[]) { ... }
```

**UPPER_CASE für Konstanten:**
```typescript
// ✅ Gut
const MAPCONFIG = {
  center: [6.9578, 50.9375],
  zoom: 10
};

const STORAGE_KEYS = {
  SELECTED_CRS: 'p2d2_selected_crs',
  SELECTED_KOMMUNE: 'p2d2_selected_kommune'
};
```

**PascalCase für Typen und Interfaces:**
```typescript
// ✅ Gut
interface MapConfig {
  center: [number, number];
  zoom: number;
  projection: string;
}

type Coordinate = [number, number];
type Extent = [number, number, number, number];
```

### OpenLayers-spezifische Konventionen

**Layer-Namen:**
```typescript
// ✅ Gut
const luftbildLayer = new TileLayer({ /* ... */ });
const wfsLayer = new VectorLayer({ /* ... */ });
const kommunenLayer = new VectorLayer({ /* ... */ });

// Layer-Styles
const highlightStyle = new Style({ /* ... */ });
const defaultStyle = new Style({ /* ... */ });
```

**Event-Handler:**
```typescript
// ✅ Gut
function handleMapMoveEnd(event: MapEvent) {
  const center = map.getView().getCenter();
  console.log('Map center:', center);
}

function handleFeatureSelect(event: SelectEvent) {
  const feature = event.selected[0];
  // Feature-Verarbeitung
}
```

## Import-Konventionen

### Import-Reihenfolge

```typescript
// 1. External Libraries (alphabetisch)
import Map from 'ol/Map';
import View from 'ol/View';
import proj4 from 'proj4';

// 2. TypeScript Types (falls separate Imports)
import type { MapConfig } from '@/types/map';
import type { Coordinate } from '@/types/geo';

// 3. Internal Utilities (alphabetisch)
import { registerUtm } from '@utils/crs';
import { dispatchKommunenFocus } from '@utils/events';
import { createLuftbildLayer } from '@utils/layer-management';

// 4. Local Imports (relative)
import { MAPCONFIG } from '../config/map-config';
import KommuneCard from '../components/KommuneCard.astro';
```

### Type-only Imports

```typescript
// ✅ Gut - Type-only Import (keine Runtime-Abhängigkeit)
import type { MapConfig } from '@/types/map';
import type { Feature } from 'ol';

// ❌ Vermeiden - unnötige Runtime-Imports
import { MapConfig } from '@/types/map'; // Wenn nur Typ verwendet wird
```

## Code-Organisation

### Utility-Funktionen

**Eine Verantwortung pro Funktion:**
```typescript
// ✅ Gut - Klare Verantwortung
export function isValidWgs84Coordinate(coord: any): boolean {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    coord.every(Number.isFinite) &&
    coord[0] >= -180 && coord[0] <= 180 &&
    coord[1] >= -90 && coord[1] <= 90
  );
}

export function transformCoordinate(
  coord: number[], 
  sourceEpsg: string, 
  targetEpsg: string
): number[] | null {
  // Transformationslogik
}
```

**Fehlerbehandlung:**
```typescript
// ✅ Gut - Explizite Fehlerbehandlung
export function registerUtm(crs: string): boolean {
  if (registeredProjections.has(crs)) {
    return true; // Already registered
  }

  if (predefinedUtmDefs[crs]) {
    proj4.defs(crs, predefinedUtmDefs[crs]);
    registeredProjections.add(crs);
    register(proj4);
    return true;
  }

  console.error(`[crs] Unknown UTM projection: ${crs}`);
  return false;
}
```

### Astro-Komponenten

**Props-Typisierung:**
```astro
---
// ✅ Gut - Explizite Props-Typisierung
interface Props {
  kommune: KommuneData;
  showMap?: boolean;
  className?: string;
}

const { kommune, showMap = true, className = '' } = Astro.props;
---

<div class={`kommune-card ${className}`}>
  <h2>{kommune.name}</h2>
  {showMap && <Map.kommune={kommune} />}
</div>
```

**Conditional Rendering:**
```astro
---
// ✅ Gut - Klare Conditional Logic
const hasDescription = kommune.description && kommune.description.length > 0;
const hasPopulation = kommune.population > 0;
---

<div>
  {hasDescription && (
    <p class="description">{kommune.description}</p>
  )}
  
  {hasPopulation ? (
    <span class="population">{kommune.population} Einwohner</span>
  ) : (
    <span class="no-data">Keine Daten</span>
  )}
</div>
```

## Kommentare und Dokumentation

### JSDoc für Utility-Funktionen

```typescript
/**
 * Validiert WGS84-Koordinaten
 * @param coord - Zu validierende Koordinate als [lng, lat]
 * @returns true wenn Koordinate gültig ist
 * @example
 * isValidWgs84Coordinate([6.9578, 50.9375]) // true
 * isValidWgs84Coordinate([200, 100]) // false
 */
export function isValidWgs84Coordinate(coord: any): boolean {
  // Implementierung
}

/**
 * Transformiert Koordinaten zwischen verschiedenen CRS
 * @param coord - Ausgangskoordinate [x, y]
 * @param sourceEpsg - Quell-CRS (z.B. 'EPSG:4326')
 * @param targetEpsg - Ziel-CRS (z.B. 'EPSG:25832')
 * @returns Transformierte Koordinate oder null bei Fehler
 */
export function transformCoordinate(
  coord: number[], 
  sourceEpsg: string, 
  targetEpsg: string
): number[] | null {
  // Implementierung
}
```

### Inline-Kommentare

```typescript
// ✅ Gut - Erklärt "Warum", nicht "Was"
// Proj4 muss registriert werden bevor OpenLayers es verwenden kann
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs');
register(proj4);

// ❌ Schlecht - Offensichtliches kommentieren
// Koordinate validieren
if (isValidWgs84Coordinate(coord)) {
  // Koordinate ist gültig
  return coord;
}
```

## Best Practices

### Error Handling

**Konsistente Fehlermeldungen:**
```typescript
// ✅ Gut - Strukturierte Fehlermeldungen
console.error('[crs] Invalid coordinate for transformation:', coord);
console.warn('[events] Event system not ready, queuing event:', eventName);
console.info('[map] Map initialized with projection:', projection);
```

**Graceful Degradation:**
```typescript
// ✅ Gut - Robust gegen fehlende Umgebungen
export function getSelectedCRS(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.SELECTED_CRS);
}

export function dispatchThrottledEvent(eventName: string, detail: any = {}): void {
  if (typeof window === 'undefined') {
    console.warn(`[events] cannot dispatch ${eventName} - window undefined`);
    return;
  }
  // Event-Dispatch-Logik
}
```

### Performance-Optimierungen

**Event-Throttling:**
```typescript
// ✅ Gut - Vermeidet übermäßige Event-Auslösung
function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    if (currentTime - lastExecTime < delay) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastExecTime = currentTime;
        func(...args);
      }, delay - (currentTime - lastExecTime));
    } else {
      lastExecTime = currentTime;
      func(...args);
    }
  };
}
```

**Memory Management:**
```typescript
// ✅ Gut - Cleanup von Event-Listeners
export function setupMapEvents(map: Map): () => void {
  const moveEndHandler = () => {
    console.log('Map moved');
  };

  map.on('moveend', moveEndHandler);

  // Cleanup-Funktion zurückgeben
  return () => {
    map.un('moveend', moveEndHandler);
  };
}

// Verwendung
const cleanup = setupMapEvents(map);
// Später aufräumen
cleanup();
```

## VS Code Konfiguration

**.vscode/settings.json:**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.astro": "astro"
  }
}
```

**.vscode/extensions.json:**
```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode"
  ]
}
```

## Debugging

### TypeScript Debugging

**Type-Errors identifizieren:**
```typescript
// ✅ Gut - Explizite Typen für bessere Fehlermeldungen
interface Coordinate {
  x: number;
  y: number;
}

function transformCoordinate(coord: Coordinate): Coordinate | null {
  // Statt any[] verwenden wir das explizite Interface
  if (!coord || typeof coord.x !== 'number' || typeof coord.y !== 'number') {
    console.error('[debug] Invalid coordinate:', coord);
    return null;
  }
  // Transformationslogik
}
```

**Runtime-Validierung:**
```typescript
// ✅ Gut - Validierung für unsichere Daten
function isValidWgs84Coordinate(coord: any): coord is [number, number] {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    coord.every(Number.isFinite) &&
    coord[0] >= -180 && coord[0] <= 180 &&
    coord[1] >= -90 && coord[1] <= 90
  );
}

// Verwendung mit Type-Guard
if (isValidWgs84Coordinate(userInput)) {
  // TypeScript weiß jetzt, dass es [number, number] ist
  const transformed = transformCoordinate(userInput);
}
```

### OpenLayers Debugging

**Map-Status überwachen:**
```typescript
// Map-Events für Debugging
map.on('moveend', () => {
  const view = map.getView();
  console.log('[map] Center:', view.getCenter());
  console.log('[map] Zoom:', view.getZoom());
  console.log('[map] Projection:', view.getProjection().getCode());
});

// Layer-Status überwachen
const layers = map.getLayers().getArray();
layers.forEach((layer, index) => {
  console.log(`[map] Layer ${index}:`, layer.get('name'), 'visible:', layer.getVisible());
});
```

**Feature-Debugging:**
```typescript
// Feature-Informationen loggen
map.on('click', (event) => {
  const features = map.getFeaturesAtPixel(event.pixel);
  console.log('[map] Click features:', features?.length || 0);
  
  features?.forEach((feature, index) => {
    console.log(`[map] Feature ${index}:`, feature.getId(), feature.getProperties());
  });
});
```

### Browser DevTools Debugging

**Console-Logging mit Kontext:**
```typescript
// Entwicklungsumgebung prüfen
if (import.meta.env.DEV) {
  console.group('[p2d2] Debug Information');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Map initialized:', !!window.map);
  console.log('Projection registered:', registeredProjections);
  console.groupEnd();
}

// Performance-Messung
const startTime = performance.now();
// Code ausführen
const endTime = performance.now();
console.log(`[perf] Operation took ${endTime - startTime}ms`);
```

**Network-Debugging:**
```typescript
// WFS-Requests überwachen
console.log('[wfs] Request URL:', url);
console.log('[wfs] Request parameters:', params);

fetch(url, params)
  .then(response => {
    console.log('[wfs] Response status:', response.status);
    console.log('[wfs] Response headers:', Object.fromEntries(response.headers));
    return response.text();
  })
  .then(data => {
    console.log('[wfs] Response data length:', data.length);
    // Datenverarbeitung
  })
  .catch(error => {
    console.error('[wfs] Request failed:', error);
  });
```

### VS Code Debugging

**Breakpoints setzen:**
```typescript
// Debugger-Anweisung für komplexe Logik
function complexTransformation(coord: number[], sourceCrs: string, targetCrs: string) {
  // Breakpoint hier setzen
  debugger;
  
  // Komplexe Transformationslogik
  const intermediate = transformToWgs84(coord, sourceCrs);
  const result = transformFromWgs84(intermediate, targetCrs);
  
  return result;
}
```

**Watch Expressions:**
```
// In VS Code Watch Panel:
window.map?.getView().getCenter()
window.map?.getView().getZoom()
registeredProjections.size
```

### Common Debugging Scenarios

**Koordinatentransformation:**
```typescript
function debugCoordinateTransformation(coord: number[], sourceCrs: string, targetCrs: string) {
  console.group('[debug] Coordinate Transformation');
  console.log('Source coordinate:', coord);
  console.log('Source CRS:', sourceCrs);
  console.log('Target CRS:', targetCrs);
  
  try {
    const result = transformCoordinate(coord, sourceCrs, targetCrs);
    console.log('Transformation result:', result);
  } catch (error) {
    console.error('Transformation failed:', error);
  }
  
  console.groupEnd();
  return result;
}
```

**Layer-Loading:**
```typescript
function debugLayerLoading(layerName: string, layer: any) {
  console.group(`[debug] Layer: ${layerName}`);
  console.log('Layer instance:', layer);
  console.log('Visible:', layer.getVisible());
  console.log('Z-Index:', layer.getZIndex());
  console.log('Source:', layer.getSource());
  console.groupEnd();
}
```

## Code-Review Checkliste

### ✅ Muss erfüllt sein
- [ ] TypeScript-Typisierung korrekt
- [ ] Keine `any`-Typen (außer in Ausnahmefällen)
- [ ] Import-Reihenfolge eingehalten
- [ ] Naming-Konventionen befolgt
- [ ] Error-Handling implementiert
- [ ] Keine Console-Logs in Production-Code

### ✅ Sollte erfüllt sein
- [ ] JSDoc für öffentliche Funktionen
- [ ] Unit-Tests für Utility-Funktionen
- [ ] Performance-Considerations berücksichtigt
- [ ] Browser-Kompatibilität geprüft

### ✅ Kann erfüllt sein
- [ ] Accessibility (a11y) berücksichtigt
- [ ] Internationalisierung (i18n) vorbereitet
- [ ] Responsive Design implementiert