---
title: Layer Management
description: Management of WMS base layers (aerial imagery, basemap.de) with toggle functions and state persistence
quality:
  completeness: 95
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Layer Management

## Overview

The `layer-manager.ts` module manages the base layers of the p2d2 mapping application. It provides functions for creating WMS layers, toggle logic for visibility, and automatic state persistence in localStorage.

## Managed Layers

### Aerial Imagery (City of Cologne)

**WMS Endpoint:**
```
https://geoportal.stadt-koeln.de/wss/service/luftbilder_2024_wms/guest
```

**Layer Name:** `luftbilder_2024_23`

**Supported Projections:**
- EPSG:3857 (Web Mercator)
- EPSG:25832 (UTM Zone 32N)

**Z-Index:** 7 (from MAP_CONFIG.Z_INDEX.LUFTBILD)

**Features:**
- Initially invisible (`visible: false`)
- Automatic projection detection
- Cross-origin configured for image loading

### basemap.de

**WMS Endpoint:**
```
https://sgx.geodatenzentrum.de/wms_basemapde
```

**Layer Name:** `de_basemapde_web_raster_farbe`

**Supported Projections:**
- EPSG:3857 (Web Mercator)

**Z-Index:** 15 (from MAP_CONFIG.Z_INDEX.BASEMAP)

**Features:**
- Color variant (standard)
- Gray variant available: `de_basemapde_web_raster_grau`
- Transparency enabled for overlays
- Initially invisible (`visible: false`)

## API Reference

### `createLuftbildLayer(projection: string): TileLayer`

Creates WMS layer for Cologne aerial imagery 2024.

**Parameters:**
- `projection` (string): EPSG code (`'EPSG:3857'` or `'EPSG:25832'`)

**Returns:**
- OpenLayers `TileLayer` with TileWMS source

**Implementation:**
```typescript
export function createLuftbildLayer(projection: string): TileLayer {
  const supportedProjections = ["EPSG:3857", "EPSG:25832"];
  const useProjection = supportedProjections.includes(projection)
    ? projection
    : "EPSG:3857";

  const layer = new TileLayer({
    source: new TileWMS({
      url: "https://geoportal.stadt-koeln.de/wss/service/luftbilder_2024_wms/guest",
      params: {
        LAYERS: "luftbilder_2024_23",
        FORMAT: "image/png",
        TILED: true,
      },
      projection: useProjection,
      crossOrigin: "anonymous",
    }),
    zIndex: MAP_CONFIG.Z_INDEX.LUFTBILD,
    visible: false,
  });

  luftbildLayer = layer;
  return layer;
}
```

### `createBasemapLayer(): TileLayer`

Creates WMS layer for basemap.de.

**Parameters:** None

**Returns:**
- OpenLayers `TileLayer` with TileWMS source

**Implementation:**
```typescript
export function createBasemapLayer(): TileLayer {
  const layer = new TileLayer({
    source: new TileWMS({
      url: "https://sgx.geodatenzentrum.de/wms_basemapde",
      params: {
        LAYERS: "de_basemapde_web_raster_farbe",
        FORMAT: "image/png",
        TRANSPARENT: "true",
        TILED: true,
      },
      projection: "EPSG:3857",
      crossOrigin: "anonymous",
    }),
    zIndex: MAP_CONFIG.Z_INDEX.BASEMAP,
    visible: false,
  });

  basemapLayer = layer;
  return layer;
}
```

### `toggleBaseLayer(layerName: string): void`

Toggles visibility of a base layer.

**Parameters:**
- `layerName` (string): `'luftbild'` or `'basemap'`

**Behavior:**
- Independent toggle: Both layers can be active simultaneously
- Persistence in localStorage
- Button highlighting via CSS class `highlighted`
- Console logging for debugging

**localStorage Keys:**
- `luftbildVisible`: `'true'` | `'false'`
- `basemapVisible`: `'true'` | `'false'`

**Implementation:**
```typescript
export function toggleBaseLayer(layerName: string): void {
  if (layerName === "luftbild" && luftbildLayer) {
    // Toggle Luftbild independently
    const newVisibility = !luftbildLayer.getVisible();
    luftbildLayer.setVisible(newVisibility);

    // Update only the Luftbild button
    const luftbildBtn = document.querySelector(
      '[data-layer-toggle="luftbild"]',
    );
    if (luftbildBtn) {
      if (newVisibility) {
        luftbildBtn.classList.add("highlighted");
      } else {
        luftbildBtn.classList.remove("highlighted");
      }
    }
  } else if (layerName === "basemap" && basemapLayer) {
    // Toggle basemap.de independently
    const newVisibility = !basemapLayer.getVisible();
    basemapLayer.setVisible(newVisibility);

    // Update only the basemap button
    const basemapBtn = document.querySelector('[data-layer-toggle="basemap"]');
    if (basemapBtn) {
      if (newVisibility) {
        basemapBtn.classList.add("highlighted");
      } else {
        basemapBtn.classList.remove("highlighted");
      }
    }
  }

  // Persist both states separately in localStorage
  try {
    localStorage.setItem(
      "luftbildVisible",
      String(luftbildLayer ? luftbildLayer.getVisible() : false),
    );
    localStorage.setItem(
      "basemapVisible",
      String(basemapLayer ? basemapLayer.getVisible() : false),
    );
  } catch (error) {
    console.warn("Could not persist layer states", error);
  }

  console.log("Layer toggle:", {
    luftbild: luftbildLayer ? luftbildLayer.getVisible() : false,
    basemap: basemapLayer ? basemapLayer.getVisible() : false,
  });
}
```

### `initLayerControls(): void`

Initializes event listeners for layer toggle buttons.

**Function:**
1. Registers click handlers on `[data-layer-toggle]` buttons
2. Restores previous state from localStorage
3. Updates button styling

**HTML Structure:**
```html
<button data-layer-toggle="luftbild">Aerial Imagery</button>
<button data-layer-toggle="basemap">basemap.de</button>
```

**Implementation:**
```typescript
export function initLayerControls(): void {
  // Add event listeners for layer toggle buttons
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest("[data-layer-toggle]");
    if (!button) return;

    const layerName = (button as HTMLElement).dataset.layerToggle;
    if (layerName) {
      toggleBaseLayer(layerName);
    }
  });

  // Restore previous layer states from localStorage
  try {
    const luftbildVisible = localStorage.getItem("luftbildVisible") === "true";
    const basemapVisible = localStorage.getItem("basemapVisible") === "true";

    if (luftbildVisible && luftbildLayer) {
      luftbildLayer.setVisible(true);
      const btn = document.querySelector('[data-layer-toggle="luftbild"]');
      if (btn) btn.classList.add("highlighted");
    }

    if (basemapVisible && basemapLayer) {
      basemapLayer.setVisible(true);
      const btn = document.querySelector('[data-layer-toggle="basemap"]');
      if (btn) btn.classList.add("highlighted");
    }
  } catch (error) {
    console.warn("Could not restore layer states from localStorage", error);
  }
}
```

### Getter Functions

#### `getLuftbildLayer(): TileLayer | null`
Returns the current aerial imagery layer instance.

#### `getBasemapLayer(): TileLayer | null`
Returns the current basemap.de layer instance.

#### `getLayerStates(): { luftbild: boolean; basemap: boolean }`
Returns the current visibility status of both layers (for debugging).

## State Management

### LocalStorage Schema

| Key | Value | Description |
|-----|-------|-------------|
| `luftbildVisible` | `'true'` \| `'false'` | Aerial imagery layer visibility |
| `basemapVisible` | `'true'` \| `'false'` | basemap.de visibility |

### Global Variables

- `luftbildLayer: TileLayer | null` - Reference to aerial imagery layer
- `basemapLayer: TileLayer | null` - Reference to basemap.de layer

## Usage

### Complete Setup

```typescript
import { 
  createLuftbildLayer, 
  createBasemapLayer, 
  initLayerControls 
} from './layer-management';

// Create layers
const luftbild = createLuftbildLayer('EPSG:3857');
const basemap = createBasemapLayer();

// Add to map
map.addLayer(luftbild);
map.addLayer(basemap);

// Initialize controls
initLayerControls();
```

### HTML Integration

```html
<div class="layer-controls">
  <button data-layer-toggle="luftbild" class="layer-btn">Aerial Imagery</button>
  <button data-layer-toggle="basemap" class="layer-btn">basemap.de</button>
</div>
```

### CSS for Button Highlighting

```css
.layer-btn.highlighted {
  background-color: #007bff;
  color: white;
}
```

## Dependencies

**Imports:**
- `ol/layer/Tile` (TileLayer)
- `ol/source/TileWMS`
- `../config/map-config` (MAP_CONFIG)

**Exports:**
- `createLuftbildLayer`
- `createBasemapLayer`
- `toggleBaseLayer`
- `initLayerControls`
- `getLuftbildLayer`
- `getBasemapLayer`
- `getLayerStates`
- `LAYER_ZINDEX` (Re-export from MAP_CONFIG.Z_INDEX)

## Error Handling

- localStorage errors are caught and warned
- Missing layer instances are checked before operations
- Console logging for debugging purposes

## Best Practices

1. **Layer Creation Before Controls**: Always create layers first, then initialize controls
2. **Projection Consistency**: Create aerial imagery layer with correct projection
3. **State Persistence**: localStorage is automatically managed
4. **Button Integration**: HTML buttons require `data-layer-toggle` attribute