---
title: Layer Management & Interaction
description: Comprehensive documentation for layer management and interaction handling
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# Layer Management & Interaction

> **Status:** ✅ Fully documented

## Overview

The layer management utilities in p2d2 provide central management for map layers, interaction handling, and state management. These modules form the basis for the dynamic display of geodata and user interactions.

## Main Modules

### 1. Layer Manager (`layer-manager.ts`)

Central management for base map layers (aerial photos, basemap.de) with persistence.

#### Layer Types

```typescript
// Global layer instances
let luftbildLayer: TileLayer | null = null;    // Cologne aerial photo WMS
let basemapLayer: TileLayer | null = null;     // basemap.de WMTS

// Z-Index Hierarchy
export const LAYER_ZINDEX = {
  LUFTBILD: 10,    // Lowest layer
  BASEMAP: 20,     // Middle layer  
  FEATURES: 30,    // Vector features
  LABELS: 40,      // Labels
  CONTROLS: 50     // Topmost layer
};
```

#### Layer Creation

```typescript
/**
 * Creates aerial photo WMS layer for Cologne
 * Service: Stadt Köln Luftbilder 2024
 * URL: https://geoportal.stadt-koeln.de/wss/service/luftbilder_2024_wms/guest
 */
export function createLuftbildLayer(projection: string): TileLayer

/**
 * Creates basemap.de WMS layer  
 * Service: Geodatenzentrum basemap.de
 * URL: https://sgx.geodatenzentrum.de/wms_basemapde
 */
export function createBasemapLayer(): TileLayer
```

#### Layer Toggle Functionality

```typescript
/**
 * Toggles base layers independently
 * Persists both states separately in localStorage
 */
export function toggleBaseLayer(layerName: string): void

// Example
toggleBaseLayer("luftbild");  // Toggle aerial photo on/off
toggleBaseLayer("basemap");   // Toggle basemap.de on/off
```

### 2. WFS Layer Manager (`wfs-layer-manager.ts`)

Dynamic management of WFS vector layers with caching and state management.

#### Main Class

```typescript
export class WFSLayerManager {
  private map: OLMap;
  private activeLayer: VectorLayer<VectorSource> | null = null;
  private currentState: {
    kommune: KommuneData | null;
    categorySlug: string | null;
  };
  private layerCache = new Map<string, VectorLayer<VectorSource>>();
}
```

#### WFS Layer Control

```typescript
// Show/hide layer
async toggleLayer(kommune: KommuneData, categorySlug: string): Promise<void>
async displayLayer(kommune: KommuneData, categorySlug: string): Promise<void>
hideLayer(): void

// Example
const wfsManager = new WFSLayerManager(map);
await wfsManager.displayLayer(kommuneData, "cemeteries");
```

#### Layer Configuration

```typescript
private buildLayerConfig(
  kommune: KommuneData, 
  categorySlug: string
): WFSLayerConfig {
  return {
    wpName: kommune.wp_name,
    containerType: this.getContainerType(categorySlug),
    osmAdminLevel: this.getOsmAdminLevel(kommune, containerType)
  };
}
```

### 3. Kommunen Click Handler (`kommunen-click-handler.ts`)

Touch-optimized handling of click events on municipality cards.

#### Main Functions

```typescript
export default class KommunenClickHandler {
  private processingButtons: Set<HTMLElement> = new Set();
  private boundClickHandler: (event: Event) => void;

  // Event binding
  bind(): void
  unbind(): void

  // State management
  restoreLastSelection(): void
  persistSelection(detail: KommunenDetail): void
}
```

#### Toggle Logic

```typescript
// Intelligent toggle behavior
if (currentKommune?.slug === slug) {
  // Same municipality clicked again → deactivate
  this.hideWFSLayer();
  removeHighlight();
} else {
  // New municipality selected
  this.showWFSLayer();
  applyHighlight();
}
```

#### WFS Layer Automation

```typescript
private handleWFSLayerToggle(detail: KommunenDetail): void {
  const selectedCategory = (window as any).mapState?.getSelectedCategory?.();
  if (selectedCategory) {
    // Automatic layer switch on municipality change
    (window as any).wfsManager.displayLayer(detail, selectedCategory);
  }
}
```

## Practical Usage

### Complete Layer Integration

```typescript
import { createLuftbildLayer, createBasemapLayer, initLayerControls } from '../utils/layer-manager';
import WFSLayerManager from '../utils/wfs-layer-manager';
import KommunenClickHandler from '../utils/kommunen-click-handler';

// 1. Create base layers
const luftbild = createLuftbildLayer("EPSG:3857");
const basemap = createBasemapLayer();

// 2. Initialize WFS manager
const wfsManager = new WFSLayerManager(map);

// 3. Bind click handler
const clickHandler = new KommunenClickHandler();
clickHandler.bind();

// 4. Activate layer controls
initLayerControls();

// 5. Restore last selection
clickHandler.restoreLastSelection();
```

### Event Handling

```typescript
// Subscribe to Kommunen-Focus event
window.addEventListener("kommunen:focus", (event) => {
  const detail = event.detail;
  
  // Navigate map
  map.getView().setCenter(detail.center);
  map.getView().setZoom(detail.zoom);
  
  // Show WFS layer automatically
  const selectedCategory = mapState.getSelectedCategory();
  if (selectedCategory) {
    wfsManager.displayLayer(detail, selectedCategory);
  }
});
```

## Configuration

### WFS Layer Styling

```typescript
// Default style for WFS vector layers
const defaultStyle = new Style({
  stroke: new Stroke({
    color: "#FF6900",  // p2d2 Orange
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(255, 105, 0, 0.1)",  // Transparent fill
  }),
});
```

### OSM Admin Level Logic

```typescript
private getOsmAdminLevel(kommune: KommuneData, containerType: string): number {
  if (containerType === "cemetery") return 8;  // Cemeteries always Level 8
  
  if (containerType === "administrative") {
    const levels = kommune.osmAdminLevels || [];
    // Take the NEXT level after the municipality boundary
    return levels.length > 1 ? levels[1] : levels[0] || 8;
  }
  
  return 8; // Fallback
}
```

## Performance Optimizations

### 1. Layer Caching

```typescript
// WFS layers are cached for repeated use
private layerCache = new Map<string, VectorLayer<VectorSource>>();

async function getCachedWFSLayer(config: WFSLayerConfig): Promise<VectorLayer<VectorSource>> {
  const cacheKey = `${config.wpName}-${config.containerType}-${config.osmAdminLevel}`;
  
  // Check cache
  let layer = this.layerCache.get(cacheKey);
  if (!layer) {
    // Create and cache layer
    layer = await this.createWFSLayer(config);
    this.layerCache.set(cacheKey, layer);
    this.map.addLayer(layer);
  }
  
  return layer;
}
```

### 2. Event Throttling

```typescript
// Prevents too frequent events
private processingButtons: Set<HTMLElement> = new Set();

if (this.processingButtons.has(button)) {
  console.log("Click already being processed, ignoring");
  return;
}
this.processingButtons.add(button);
```

### 3. State Persistence

```typescript
// Automatic saving of selection
private persistSelection(detail: KommunenDetail): void {
  localStorage.setItem("p2d2_selected_kommune_slug", detail.slug || "");
  localStorage.setItem("p2d2_selected_kommune_detail", JSON.stringify(detail));
}
```

## Error Handling

### Robust Event Dispatching

```typescript
private dispatchKommunenFocus(detail: KommunenDetail): void {
  try {
    if (typeof (window as any).dispatchKommunenFocus === "function") {
      (window as any).dispatchKommunenFocus(detail);
    } else {
      window.dispatchEvent(new CustomEvent("kommunen:focus", { detail }));
    }
  } catch (error) {
    // Retry mechanism
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("kommunen:focus", { detail }));
    }, 100);
  }
}
```

### Validation of Geodata

```typescript
private isValidCoordinate(coord: any): coord is [number, number] {
  return (
    Array.isArray(coord) &&
    coord.length === 2 &&
    coord.every(Number.isFinite) &&
    coord[0] >= -180 && coord[0] <= 180 &&
    coord[1] >= -90 && coord[1] <= 90
  );
}
```

## Best Practices

### 1. Layer Hierarchy

```typescript
// ✅ Correct - Clear Z-Index structure
const layers = [
  luftbildLayer,     // Z-Index: 10
  basemapLayer,      // Z-Index: 20  
  wfsVectorLayer,    // Z-Index: 30
  labelLayer         // Z-Index: 40
];

// ❌ Avoid - Undefined order
map.addLayer(anyLayer); // No explicit Z-Index
```

### 2. Memory Management

```typescript
// ✅ Correct - Proper Cleanup
class MyComponent {
  private clickHandler: KommunenClickHandler;
  
  constructor() {
    this.clickHandler = new KommunenClickHandler();
    this.clickHandler.bind();
  }
  
  destroy() {
    this.clickHandler.unbind();
  }
}

// ❌ Avoid - Memory Leaks
// Event listeners are never removed
```

### 3. Error Handling

```typescript
// ✅ Correct - Robust implementation
try {
  await wfsManager.displayLayer(kommune, category);
} catch (error) {
  logger.error("WFS layer could not be loaded", error);
  showUserNotification("Data temporarily unavailable");
}

// ❌ Avoid - Unhandled errors
wfsManager.displayLayer(kommune, category); // No error handling
```

## Dependencies

### External Libraries

  - **OpenLayers** - Map and layer management
  - **proj4** - Coordinate transformations

### Internal Dependencies

  - `../utils/events` - Event system
  - `../utils/logger` - Logging infrastructure
  - `../utils/wfs-auth` - WFS authentication
  - `../utils/map-state` - State management

## These layer management utilities ensure consistent and performant display of geodata in p2d2, with robust error handling and optimized user interaction.