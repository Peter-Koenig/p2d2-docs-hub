---
title: "Code Style"
description: "TypeScript configuration, ESLint/Prettier setup, naming conventions and best practices"
quality:
  completeness: 85
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Code Style

## Overview

This documentation describes the code style conventions and best practices for p2d2 development. The focus is on TypeScript, Astro components, and OpenLayers integration.

## TypeScript Configuration

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

**Important Settings:**
- `strict: true` - Strict TypeScript checking
- `module: esnext` - ES modules for modern browsers
- `paths` - Aliases for better import structure
- `jsx: preserve` - JSX support for Astro components

### Path Aliases

```typescript
// ❌ Avoid
import { registerUtm } from '../../../utils/crs';

// ✅ Recommended
import { registerUtm } from '@utils/crs';
import { MapConfig } from '@/types/map';
```

## ESLint & Prettier

**Status:** Currently not configured

### Recommended Setup

```bash
# ESLint with TypeScript and Astro support
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-astro

# Prettier for code formatting
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### Example Configuration

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

## Naming Conventions

### Files

**Utility Functions:** `kebab-case`
```
src/utils/crs.ts
src/utils/layer-management.ts
src/utils/events.ts
```

**Astro Components:** `PascalCase`
```
src/components/Map.astro
src/components/KommuneCard.astro
src/layouts/BaseLayout.astro
```

**TypeScript Types:** `PascalCase`
```
src/types/map.ts
src/types/kommunen.ts
src/types/api.ts
```

### Variables and Functions

**camelCase for variables and functions:**
```typescript
// ✅ Good
const mapInstance = new Map();
const isValidCoordinate = isValidWgs84Coordinate(coord);
function transformCoordinate(coord: number[], targetEpsg: string) { ... }

// ❌ Avoid
const MAP_INSTANCE = new Map();
function Transform_Coordinate(coord: number[]) { ... }
```

**UPPER_CASE for constants:**
```typescript
// ✅ Good
const MAPCONFIG = {
  center: [6.9578, 50.9375],
  zoom: 10
};

const STORAGE_KEYS = {
  SELECTED_CRS: 'p2d2_selected_crs',
  SELECTED_KOMMUNE: 'p2d2_selected_kommune'
};
```

**PascalCase for types and interfaces:**
```typescript
// ✅ Good
interface MapConfig {
  center: [number, number];
  zoom: number;
  projection: string;
}

type Coordinate = [number, number];
type Extent = [number, number, number, number];
```

### OpenLayers-specific Conventions

**Layer Names:**
```typescript
// ✅ Good
const luftbildLayer = new TileLayer({ /* ... */ });
const wfsLayer = new VectorLayer({ /* ... */ });
const kommunenLayer = new VectorLayer({ /* ... */ });

// Layer Styles
const highlightStyle = new Style({ /* ... */ });
const defaultStyle = new Style({ /* ... */ });
```

**Event Handlers:**
```typescript
// ✅ Good
function handleMapMoveEnd(event: MapEvent) {
  const center = map.getView().getCenter();
  console.log('Map center:', center);
}

function handleFeatureSelect(event: SelectEvent) {
  const feature = event.selected[0];
  // Feature processing
}
```

## Import Conventions

### Import Order

```typescript
// 1. External Libraries (alphabetical)
import Map from 'ol/Map';
import View from 'ol/View';
import proj4 from 'proj4';

// 2. TypeScript Types (if separate imports)
import type { MapConfig } from '@/types/map';
import type { Coordinate } from '@/types/geo';

// 3. Internal Utilities (alphabetical)
import { registerUtm } from '@utils/crs';
import { dispatchKommunenFocus } from '@utils/events';
import { createLuftbildLayer } from '@utils/layer-management';

// 4. Local Imports (relative)
import { MAPCONFIG } from '../config/map-config';
import KommuneCard from '../components/KommuneCard.astro';
```

### Type-only Imports

```typescript
// ✅ Good - Type-only import (no runtime dependency)
import type { MapConfig } from '@/types/map';
import type { Feature } from 'ol';

// ❌ Avoid - unnecessary runtime imports
import { MapConfig } from '@/types/map'; // When only type is used
```

## Code Organization

### Utility Functions

**Single responsibility per function:**
```typescript
// ✅ Good - Clear responsibility
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
  // Transformation logic
}
```

**Error handling:**
```typescript
// ✅ Good - Explicit error handling
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

### Astro Components

**Props typing:**
```astro
---
// ✅ Good - Explicit props typing
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

**Conditional rendering:**
```astro
---
// ✅ Good - Clear conditional logic
const hasDescription = kommune.description && kommune.description.length > 0;
const hasPopulation = kommune.population > 0;
---

<div>
  {hasDescription && (
    <p class="description">{kommune.description}</p>
  )}
  
  {hasPopulation ? (
    <span class="population">{kommune.population} inhabitants</span>
  ) : (
    <span class="no-data">No data</span>
  )}
</div>
```

## Comments and Documentation

### JSDoc for Utility Functions

```typescript
/**
 * Validates WGS84 coordinates
 * @param coord - Coordinate to validate as [lng, lat]
 * @returns true if coordinate is valid
 * @example
 * isValidWgs84Coordinate([6.9578, 50.9375]) // true
 * isValidWgs84Coordinate([200, 100]) // false
 */
export function isValidWgs84Coordinate(coord: any): boolean {
  // Implementation
}

/**
 * Transforms coordinates between different CRS
 * @param coord - Source coordinate [x, y]
 * @param sourceEpsg - Source CRS (e.g. 'EPSG:4326')
 * @param targetEpsg - Target CRS (e.g. 'EPSG:25832')
 * @returns Transformed coordinate or null on error
 */
export function transformCoordinate(
  coord: number[], 
  sourceEpsg: string, 
  targetEpsg: string
): number[] | null {
  // Implementation
}
```

### Inline Comments

```typescript
// ✅ Good - Explains "why", not "what"
// Proj4 must be registered before OpenLayers can use it
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs');
register(proj4);

// ❌ Bad - Commenting the obvious
// Validate coordinate
if (isValidWgs84Coordinate(coord)) {
  // Coordinate is valid
  return coord;
}
```

## Best Practices

### Error Handling

**Consistent error messages:**
```typescript
// ✅ Good - Structured error messages
console.error('[crs] Invalid coordinate for transformation:', coord);
console.warn('[events] Event system not ready, queuing event:', eventName);
console.info('[map] Map initialized with projection:', projection);
```

**Graceful degradation:**
```typescript
// ✅ Good - Robust against missing environments
export function getSelectedCRS(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.SELECTED_CRS);
}

export function dispatchThrottledEvent(eventName: string, detail: any = {}): void {
  if (typeof window === 'undefined') {
    console.warn(`[events] cannot dispatch ${eventName} - window undefined`);
    return;
  }
  // Event dispatch logic
}
```

### Performance Optimizations

**Event throttling:**
```typescript
// ✅ Good - Avoids excessive event triggering
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

**Memory management:**
```typescript
// ✅ Good - Cleanup of event listeners
export function setupMapEvents(map: Map): () => void {
  const moveEndHandler = () => {
    console.log('Map moved');
  };

  map.on('moveend', moveEndHandler);

  // Return cleanup function
  return () => {
    map.un('moveend', moveEndHandler);
  };
}

// Usage
const cleanup = setupMapEvents(map);
// Clean up later
cleanup();
```

## VS Code Configuration

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

**Identify type errors:**
```typescript
// ✅ Good - Explicit types for better error messages
interface Coordinate {
  x: number;
  y: number;
}

function transformCoordinate(coord: Coordinate): Coordinate | null {
  // Instead of any[] we use the explicit interface
  if (!coord || typeof coord.x !== 'number' || typeof coord.y !== 'number') {
    console.error('[debug] Invalid coordinate:', coord);
    return null;
  }
  // Transformation logic
}
```

**Runtime validation:**
```typescript
// ✅ Good - Validation for unsafe data
function isValidWgs84Coordinate(coord: any): coord is [number, number] {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    coord.every(Number.isFinite) &&
    coord[0] >= -180 && coord[0] <= 180 &&
    coord[1] >= -90 && coord[1] <= 90
  );
}

// Usage with type guard
if (isValidWgs84Coordinate(userInput)) {
  // TypeScript now knows it's [number, number]
  const transformed = transformCoordinate(userInput);
}
```

### OpenLayers Debugging

**Monitor map status:**
```typescript
// Map events for debugging
map.on('moveend', () => {
  const view = map.getView();
  console.log('[map] Center:', view.getCenter());
  console.log('[map] Zoom:', view.getZoom());
  console.log('[map] Projection:', view.getProjection().getCode());
});

// Monitor layer status
const layers = map.getLayers().getArray();
layers.forEach((layer, index) => {
  console.log(`[map] Layer ${index}:`, layer.get('name'), 'visible:', layer.getVisible());
});
```

**Feature debugging:**
```typescript
// Log feature information
map.on('click', (event) => {
  const features = map.getFeaturesAtPixel(event.pixel);
  console.log('[map] Click features:', features?.length || 0);
  
  features?.forEach((feature, index) => {
    console.log(`[map] Feature ${index}:`, feature.getId(), feature.getProperties());
  });
});
```

### Browser DevTools Debugging

**Console logging with context:**
```typescript
// Check development environment
if (import.meta.env.DEV) {
  console.group('[p2d2] Debug Information');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Map initialized:', !!window.map);
  console.log('Projection registered:', registeredProjections);
  console.groupEnd();
}

// Performance measurement
const startTime = performance.now();
// Execute code
const endTime = performance.now();
console.log(`[perf] Operation took ${endTime - startTime}ms`);
```

**Network debugging:**
```typescript
// Monitor WFS requests
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
    // Data processing
  })
  .catch(error => {
    console.error('[wfs] Request failed:', error);
  });
```

### VS Code Debugging

**Set breakpoints:**
```typescript
// Debugger statement for complex logic
function complexTransformation(coord: number[], sourceCrs: string, targetCrs: string) {
  // Set breakpoint here
  debugger;
  
  // Complex transformation logic
  const intermediate = transformToWgs84(coord, sourceCrs);
  const result = transformFromWgs84(intermediate, targetCrs);
  
  return result;
}
```

**Watch expressions:**
```
// In VS Code Watch Panel:
window.map?.getView().getCenter()
window.map?.getView().getZoom()
registeredProjections.size
```

### Common Debugging Scenarios

**Coordinate transformation:**
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

**Layer loading:**
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

## Code Review Checklist

### ✅ Must be fulfilled
- [ ] TypeScript typing correct
- [ ] No `any` types (except in exceptional cases)
- [ ] Import order followed
- [ ] Naming conventions followed
- [ ] Error handling implemented
- [ ] No console logs in production code

### ✅ Should be fulfilled
- [ ] JSDoc for public functions
- [ ] Unit tests for utility functions
- [ ] Performance considerations addressed
- [ ] Browser compatibility checked

### ✅ Can be fulfilled
- [ ] Accessibility (a11y) considered
- [ ] Internationalization (i18