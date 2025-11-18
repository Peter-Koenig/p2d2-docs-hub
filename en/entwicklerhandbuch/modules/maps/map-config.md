---
title: Map Configuration
description: Central configuration for OpenLayers map instances and layer hierarchy
quality:
  completeness: 95
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Map Configuration

## Overview

The `map-config.ts` module provides centralized configuration for all map components in p2d2. It defines projection settings, initialization parameters, and a consistent Z-Index hierarchy for layer stacking.

## Configuration Objects

### Z-Index Hierarchy

```typescript
Z_INDEX: {
  BASE: 5,        // OSM base layer
  LUFTBILD: 7,    // Cologne aerial imagery 2024
  CEMETERY_BG: 10, // Cemetery background polygon
  GEOTIFF: 12,    // Future: GeoTIFF layer
  ORTHOPHOTO: 13, // Future: Orthophoto layer
  BASEMAP: 15,    // basemap.de Layer
  GRABFLUR: 20,   // Grave area polygons
  GRAVES: 25,     // Future: Individual graves
  LABELS: 30,     // Future: Text labels
  CONTROLS: 40,   // UI elements/overlays
}
```

**Layer Order Meaning:**
- `BASE` (5): OpenStreetMap base layer
- `LUFTBILD` (7): Cologne aerial imagery 2024 WMS service
- `CEMETERY_BG` (10): Background polygons for cemetery areas
- `GEOTIFF` (12): Placeholder for future GeoTIFF layers
- `ORTHOPHOTO` (13): Placeholder for future orthophoto layers
- `BASEMAP` (15): basemap.de WMS service (above aerial imagery)
- `GRABFLUR` (20): Grave area polygons (features)
- `GRAVES` (25): Placeholder for individual grave sites
- `LABELS` (30): Placeholder for text labels
- `CONTROLS` (40): UI elements and overlays (highest level)

### Initialization Parameters

```typescript
PROJECTION: "EPSG:25832" as const,
INITIAL_CENTER: [376000, 5648000] as [number, number], // Cologne area
INITIAL_ZOOM: 12,
```

**Details:**
- `PROJECTION`: `"EPSG:25832"` - ETRS89 / UTM Zone 32N (standard projection)
- `INITIAL_CENTER`: `[376000, 5648000]` - Center on Cologne area in UTM coordinates
- `INITIAL_ZOOM`: `12` - Medium zoom level for good overview

### Control Elements

```typescript
CONTROLS: {
  ZOOM: true,
  ROTATE: false, // Disabled for better performance
  ATTRIBUTION: true,
},
```

**Control Elements:**
- `ZOOM`: Zoom buttons enabled
- `ROTATE`: Rotation control disabled (performance optimization)
- `ATTRIBUTION`: Attribution display enabled

### Fullscreen Mode

```typescript
FULLSCREEN: {
  CLASS_NAME: "custom-fullscreen",
  LABEL: "⛶",
  LABEL_ACTIVE: "✕",
  TIP_LABEL: "Vollbildmodus",
},
```

**Fullscreen Configuration:**
- `CLASS_NAME`: CSS class for custom styling
- `LABEL`: Symbol for inactive state (⛶)
- `LABEL_ACTIVE`: Symbol for active state (✕)
- `TIP_LABEL`: Tooltip text

### View Adjustment

```typescript
FIT_VIEW: {
  DURATION: 500,
  PADDING: [20, 20, 20, 20] as [number, number, number, number],
  MAX_ZOOM: 18,
  CONSTRAIN_RESOLUTION: false,
},
```

**Fit-View Settings:**
- `DURATION`: 500ms - Animation duration for view adjustments
- `PADDING`: `[20, 20, 20, 20]` - Padding in pixels (top, right, bottom, left)
- `MAX_ZOOM`: 18 - Maximum zoom level for automatic adjustments
- `CONSTRAIN_RESOLUTION`: false - No resolution constraints

## Coordinate Systems

### Supported Projections

| EPSG Code | Name | Usage |
|-----------|------|-------|
| EPSG:25832 | ETRS89 / UTM 32N | Standard projection for p2d2 |
| EPSG:3857 | Web Mercator | Alternative for web maps |

**Note:** The system is primarily designed for EPSG:25832 (UTM 32N) but also supports EPSG:3857 for certain WMS services.

## Usage Examples

### Import and Basic Usage

```typescript
import { MAP_CONFIG } from '../config/map-config';

// Map initialization with configuration
const map = new Map({
  view: new View({
    center: MAP_CONFIG.INITIAL_CENTER,
    zoom: MAP_CONFIG.INITIAL_ZOOM,
    projection: MAP_CONFIG.PROJECTION
  })
});
```

### Layer with Correct Z-Index

```typescript
import { MAP_CONFIG } from '../config/map-config';

// Create layer with specific Z-Index
const layer = new TileLayer({
  source: new TileWMS({/* ... */}),
  zIndex: MAP_CONFIG.Z_INDEX.BASEMAP
});
```

### Configure Fullscreen Control

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

## Dependencies

**Exports:**
- `MAP_CONFIG` (default) - Main configuration object

**Used by:**
- `src/utils/layer-manager.ts` - Layer creation and management
- `src/components/FeatureEditor.astro` - Main map component
- `src/utils/crs.ts` - Projection management

## Customization Options

### Define Custom Z-Index Values

```typescript
// Extend in map-config.ts
Z_INDEX: {
  ...MAP_CONFIG.Z_INDEX,
  CUSTOM_LAYER: 35, // Custom layer between features and labels
}
```

### Change Projection

```typescript
// For Web Mercator instead of UTM
PROJECTION: "EPSG:3857" as const,
INITIAL_CENTER: [6.95, 50.94] as [number, number], // Cologne in WGS84
```

### Performance Optimization

The rotation control is disabled by default (`ROTATE: false`) for better performance with complex geometry operations.

## Best Practices

1. **Consistent Z-Index Usage**: Always use `MAP_CONFIG.Z_INDEX` instead of hardcoded values
2. **Projection Consistency**: Maintain EPSG:25832 as standard for German geodata
3. **Layer Order**: Preserve the defined hierarchy for optimal display
4. **Performance**: Keep rotation disabled if not needed