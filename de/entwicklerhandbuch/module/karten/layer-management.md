---
title: Layer Management
description: Verwaltung von WMS-Basis-Layern (Luftbild, basemap.de) mit Toggle-Funktionen und State-Persistierung
quality:
  completeness: 95
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Layer Management

## Übersicht

Das `layer-manager.ts` Modul verwaltet die Basis-Layer der p2d2-Kartenanwendung. Es bietet Funktionen zur Erstellung von WMS-Layern, Toggle-Logik für die Sichtbarkeit und automatische State-Persistierung im localStorage.

## Verwaltete Layer

### Luftbild (Stadt Köln)

**WMS-Endpunkt:**
```
https://geoportal.stadt-koeln.de/wss/service/luftbilder_2024_wms/guest
```

**Layer-Name:** `luftbilder_2024_23`

**Unterstützte Projektionen:**
- EPSG:3857 (Web Mercator)
- EPSG:25832 (UTM Zone 32N)

**Z-Index:** 7 (aus MAP_CONFIG.Z_INDEX.LUFTBILD)

**Besonderheiten:**
- Standardmäßig unsichtbar (`visible: false`)
- Automatische Projektionserkennung
- Cross-Origin für Bildladen konfiguriert

### basemap.de

**WMS-Endpunkt:**
```
https://sgx.geodatenzentrum.de/wms_basemapde
```

**Layer-Name:** `de_basemapde_web_raster_farbe`

**Unterstützte Projektionen:**
- EPSG:3857 (Web Mercator)

**Z-Index:** 15 (aus MAP_CONFIG.Z_INDEX.BASEMAP)

**Besonderheiten:**
- Farbvariante (Standard)
- Grauvariante verfügbar: `de_basemapde_web_raster_grau`
- Transparenz aktiviert für Überlagerungen
- Standardmäßig unsichtbar (`visible: false`)

## API-Referenz

### `createLuftbildLayer(projection: string): TileLayer`

Erstellt WMS-Layer für Kölner Luftbilder 2024.

**Parameter:**
- `projection` (string): EPSG-Code (`'EPSG:3857'` oder `'EPSG:25832'`)

**Rückgabe:**
- OpenLayers `TileLayer` mit TileWMS-Source

**Implementierung:**
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

Erstellt WMS-Layer für basemap.de.

**Parameter:** Keine

**Rückgabe:**
- OpenLayers `TileLayer` mit TileWMS-Source

**Implementierung:**
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

Schaltet Sichtbarkeit eines Basis-Layers um.

**Parameter:**
- `layerName` (string): `'luftbild'` oder `'basemap'`

**Verhalten:**
- Unabhängiges Toggle: Beide Layer können gleichzeitig aktiv sein
- Persistierung in localStorage
- Button-Highlighting via CSS-Klasse `highlighted`
- Konsolen-Logging für Debugging

**localStorage-Keys:**
- `luftbildVisible`: `'true'` | `'false'`
- `basemapVisible`: `'true'` | `'false'`

**Implementierung:**
```typescript
export function toggleBaseLayer(layerName: string): void {
  if (layerName === "luftbild" && luftbildLayer) {
    // Toggle Luftbild unabhängig
    const newVisibility = !luftbildLayer.getVisible();
    luftbildLayer.setVisible(newVisibility);

    // Update nur den Luftbild-Button
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
    // Toggle basemap.de unabhängig
    const newVisibility = !basemapLayer.getVisible();
    basemapLayer.setVisible(newVisibility);

    // Update nur den basemap-Button
    const basemapBtn = document.querySelector('[data-layer-toggle="basemap"]');
    if (basemapBtn) {
      if (newVisibility) {
        basemapBtn.classList.add("highlighted");
      } else {
        basemapBtn.classList.remove("highlighted");
      }
    }
  }

  // Persistiere beide States separat in localStorage
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

Initialisiert Event-Listener für Layer-Toggle-Buttons.

**Funktion:**
1. Registriert Click-Handler auf `[data-layer-toggle]`-Buttons
2. Stellt vorherigen Zustand aus localStorage wieder her
3. Aktualisiert Button-Styling

**HTML-Struktur:**
```html
<button data-layer-toggle="luftbild">Luftbild</button>
<button data-layer-toggle="basemap">basemap.de</button>
```

**Implementierung:**
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

### Getter-Funktionen

#### `getLuftbildLayer(): TileLayer | null`
Gibt die aktuelle Luftbild-Layer-Instanz zurück.

#### `getBasemapLayer(): TileLayer | null`
Gibt die aktuelle basemap.de-Layer-Instanz zurück.

#### `getLayerStates(): { luftbild: boolean; basemap: boolean }`
Gibt den aktuellen Sichtbarkeitsstatus beider Layer zurück (für Debugging).

## State-Management

### LocalStorage-Schema

| Key | Wert | Beschreibung |
|-----|------|--------------|
| `luftbildVisible` | `'true'` \| `'false'` | Sichtbarkeit Luftbild-Layer |
| `basemapVisible` | `'true'` \| `'false'` | Sichtbarkeit basemap.de |

### Globale Variablen

- `luftbildLayer: TileLayer | null` - Referenz auf Luftbild-Layer
- `basemapLayer: TileLayer | null` - Referenz auf basemap.de-Layer

## Verwendung

### Komplettes Setup

```typescript
import { 
  createLuftbildLayer, 
  createBasemapLayer, 
  initLayerControls 
} from './layer-management';

// Layer erstellen
const luftbild = createLuftbildLayer('EPSG:3857');
const basemap = createBasemapLayer();

// Zur Map hinzufügen
map.addLayer(luftbild);
map.addLayer(basemap);

// Controls initialisieren
initLayerControls();
```

### HTML-Integration

```html
<div class="layer-controls">
  <button data-layer-toggle="luftbild" class="layer-btn">Luftbild</button>
  <button data-layer-toggle="basemap" class="layer-btn">basemap.de</button>
</div>
```

### CSS für Button-Highlighting

```css
.layer-btn.highlighted {
  background-color: #007bff;
  color: white;
}
```

## Abhängigkeiten

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
- `LAYER_ZINDEX` (Re-Export von MAP_CONFIG.Z_INDEX)

## Fehlerbehandlung

- localStorage-Fehler werden abgefangen und gewarnt
- Fehlende Layer-Instanzen werden vor Operationen geprüft
- Konsolen-Logging für Debugging-Zwecke

## Best Practices

1. **Layer-Erstellung vor Controls**: Immer zuerst Layer erstellen, dann Controls initialisieren
2. **Projektions-Konsistenz**: Luftbild-Layer mit korrekter Projektion erstellen
3. **State-Persistierung**: localStorage wird automatisch verwaltet
4. **Button-Integration**: HTML-Buttons benötigen `data-layer-toggle` Attribut