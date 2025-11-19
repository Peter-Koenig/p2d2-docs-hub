---
title: OpenLayers Integration
description: Integration of OpenLayers library with projection management, map initialization and CRS utilities
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# OpenLayers Integration

## Overview

The OpenLayers integration in p2d2 includes map initialization, projection management, and coordinate transformation. The system uses `crs.ts` utilities for extended projection support and `map-config.ts` for consistent configuration.

## Projection Management (crs.ts)

### Supported Coordinate Systems

| EPSG Code | Name | Usage |
|-----------|------|-------|
| EPSG:25832 | ETRS89 / UTM 32N | Standard projection for p2d2 |
| EPSG:25833 | ETRS89 / UTM 33N | Alternative UTM zone |
| EPSG:3857 | Web Mercator | Web maps standard |
| EPSG:4326 | WGS84 | Geographic coordinates |

### Predefined UTM Projections

```typescript
const predefinedUtmDefs: Record<string, string> = {
  "EPSG:25832":
    "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  "EPSG:25833":
    "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
};
```

## API Reference

### `registerUtm(crs: string): boolean`

Registers a UTM projection dynamically in OpenLayers.

**Parameters:**
- `crs` (string): EPSG code of UTM projection

**Returns:**
- `boolean`: Registration success

**Supported UTM Zones:**
- EPSG:32601-32660 (UTM North)
- EPSG:32701-32760 (UTM South)
- EPSG:25801-25860 (ETRS89 UTM)

**Example:**
```typescript
import { registerUtm } from '../utils/crs';

// Register UTM Zone 32N
const success = registerUtm('EPSG:25832');
console.log('Registration successful:', success);
```

### `toNewViewPreservingScale(map: Map, targetEpsg: string, animate: boolean = true): boolean`

Switches map view to a new projection while preserving scale.

**Parameters:**
- `map` (Map): OpenLayers Map instance
- `targetEpsg` (string): Target projection (EPSG code)
- `animate` (boolean): Enable animation (default: true)

**Returns:**
- `boolean`: View switch success

**Features:**
- Scale preservation between projections
- Automatic UTM registration
- Animated transitions
- Error handling with rollback

**Example:**
```typescript
import { toNewViewPreservingScale } from '../utils/crs';

// Switch from UTM to Web Mercator
const success = toNewViewPreservingScale(map, 'EPSG:3857', true);
```

### `isUtm(crs: string): boolean`

Checks if a CRS code is a UTM projection.

**Parameters:**
- `crs` (string): EPSG code

**Returns:**
- `boolean`: true for UTM projections

**Regex Pattern:**
```typescript
/^EPSG:(326\d{2}|327\d{2}|258\d{2})$/
```

### Validation Functions

#### `isValidWgs84Coordinate(coord: any): boolean`

Validates WGS84 coordinates [longitude, latitude].

**Criteria:**
- Array with 2 numeric values
- Longitude: -180 to 180
- Latitude: -90 to 90

#### `isValidWgs84Extent(extent: any): boolean`

Validates WGS84 extents [minLon, minLat, maxLon, maxLat].

**Criteria:**
- Array with 4 numeric values
- Correct geographic boundaries
- Logical extent order

### Transformation Functions

#### `transformExtentFromWgs84(extent: number[], targetEpsg: string): number[] | null`

Transforms an extent from WGS84 to target projection.

**Parameters:**
- `extent` (number[]): WGS84 extent [minLon, minLat, maxLon, maxLat]
- `targetEpsg` (string): Target projection

**Returns:**
- `number[] | null`: Transformed extent or null on error

#### `transformCenterFromWgs84(center: number[], targetEpsg: string): number[] | null`

Transforms a center point from WGS84 to target projection.

**Parameters:**
- `center` (number[]): WGS84 coordinates [lon, lat]
- `targetEpsg` (string): Target projection

**Returns:**
- `number[] | null`: Transformed coordinates or null on error

## Map Initialization

### Basic Initialization

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
  controls: [] // Added separately
});
```

### Complete Initialization with Layers

```typescript
import { createLuftbildLayer, createBasemapLayer, initLayerControls } from '../utils/layer-manager';
import FullScreen from 'ol/control/FullScreen';
import Zoom from 'ol/control/Zoom';

// Create map
const map = new Map({
  target: 'map',
  view: new View({
    center: MAP_CONFIG.INITIAL_CENTER,
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    projection: MAP_CONFIG.PROJECTION
  })
});

// Add layers
const luftbild = createLuftbildLayer(MAP_CONFIG.PROJECTION);
const basemap = createBasemapLayer();
map.addLayer(luftbild);
map.addLayer(basemap);

// Add controls
map.addControl(new Zoom());
map.addControl(new FullScreen({
  className: MAP_CONFIG.FULLSCREEN.CLASS_NAME,
  label: MAP_CONFIG.FULLSCREEN.LABEL,
  labelActive: MAP_CONFIG.FULLSCREEN.LABEL_ACTIVE,
  tipLabel: MAP_CONFIG.FULLSCREEN.TIP_LABEL
}));

// Initialize layer controls
initLayerControls();
```

## Projection Switch Workflow

### 1. Preparation

```typescript
// Check if target projection is supported
import { isUtm, registerUtm } from '../utils/crs';

const targetEpsg = 'EPSG:25832';

if (isUtm(targetEpsg)) {
  // Register UTM projection
  const registered = registerUtm(targetEpsg);
  if (!registered) {
    console.error('Failed to register UTM projection');
    return;
  }
}
```

### 2. Execute View Switch

```typescript
import { toNewViewPreservingScale } from '../utils/crs';

// Switch view with scale preservation
const success = toNewViewPreservingScale(map, targetEpsg, true);

if (success) {
  console.log(`Successfully switched to ${targetEpsg}`);
} else {
  console.error('Failed to switch projection');
  // Automatic rollback performed internally
}
```

### 3. Adjust Layers

```typescript
// Layers may need to be recreated for new projection
if (success) {
  // Remove old layers
  map.getLayers().clear();
  
  // Create new layers with correct projection
  const newLuftbild = createLuftbildLayer(targetEpsg);
  const newBasemap = createBasemapLayer(); // basemap.de uses EPSG:3857
  
  map.addLayer(newLuftbild);
  map.addLayer(newBasemap);
}
```

## Error Handling

### Common Error Scenarios

1. **Unregistered Projection:**
   ```typescript
   // Error: "proj4 not defined for EPSG:25832"
   // Solution: Call registerUtm()
   ```

2. **Invalid Coordinates:**
   ```typescript
   // Error in transformation functions
   // Solution: Check with isValidWgs84Coordinate()
   ```

3. **View Switch Failed:**
   ```typescript
   // Automatic rollback to previous view
   // Error logging in console
   ```

### Debugging

```typescript
import { getLayerStates } from '../utils/layer-manager';

// Check layer status
console.log('Layer states:', getLayerStates());

// Current view information
const view = map.getView();
console.log('Current view:', {
  projection: view.getProjection()?.getCode(),
  center: view.getCenter(),
  zoom: view.getZoom(),
  resolution: view.getResolution()
});
```

## Dependencies

**OpenLayers Imports:**
- `ol/Map`
- `ol/View`
- `ol/proj/proj4` (register)
- `ol/proj` (getPointResolution, transform, transformExtent)

**External Dependencies:**
- `proj4` - Projection library

**Internal Dependencies:**
- `../config/map-config` - Map configuration
- `../utils/layer-manager` - Layer management

## Best Practices

1. **Projection Consistency:** Always use EPSG:25832 as standard
2. **UTM Registration:** Check and register before view switch
3. **Validation:** Validate coordinates before transformation
4. **Error Handling:** Wrap all transformations with try-catch
5. **Performance:** Disable animation for frequent switches

## Performance Optimizations

- **Rotation Disabled:** Better performance for geometry operations
- **Lazy Registration:** UTM projections registered on demand
- **Caching:** Registered projections are cached
- **Selective Animation:** Animation only for user interactions