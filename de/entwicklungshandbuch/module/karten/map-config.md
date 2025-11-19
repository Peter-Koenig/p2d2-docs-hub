---
title: Map Configuration
description: Zentrale Konfiguration für OpenLayers-Karteninstanzen und Layer-Hierarchie
quality:
  completeness: 80
  accuracy: 75
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
MAP_INIT: {
  projection: 'EPSG:3857',
  center: fromLonLat([6.9603, 50.9375]), // Köln coordinates
  zoom: 14,
  minZoom: 10,
  maxZoom: 20,
  controls: defaultControls({ zoom: false }).extend([
    new Zoom(),
    new FullScreen(),
  ]),
}
```

**Parameter-Erklärung:**
- `projection`: Web Mercator (EPSG:3857) als Standard-Projektion
- `center`: Zentriert auf Köln-Koordinaten (transformiert von WGS84)
- `zoom`: Standard-Zoom-Level für Friedhofs-Darstellung
- `minZoom/maxZoom`: Begrenzung des Zoom-Bereichs für optimale Performance
- `controls`: Angepasste Steuerungselemente (Zoom + Vollbild)

### Layer-Konfiguration

```typescript
LAYERS: {
  OSM: new TileLayer({
    source: new OSM(),
    zIndex: Z_INDEX.BASE,
    visible: true,
  }),
  
  LUFTBILD: new TileLayer({
    source: new TileWMS({
      url: 'https://geodienste.stadt-koeln.de/wms/geobasis/luftbild_2024',
      params: {
        'LAYERS': 'luftbild_2024_rgb',
        'TILED': true,
      },
      serverType: 'geoserver',
    }),
    zIndex: Z_INDEX.LUFTBILD,
    visible: false,
  }),
  
  BASEMAP: new TileLayer({
    source: new TileWMS({
      url: 'https://sgx.geodatenzentrum.de/wms_basemapde',
      params: {
        'LAYERS': 'de_basemapde_web_raster_farbe',
        'TILED': true,
      },
      serverType: 'geoserver',
    }),
    zIndex: Z_INDEX.BASEMAP,
    visible: false,
  }),
}
```

## Verwendung

### Karten-Initialisierung

```typescript
import { MAP_INIT, LAYERS } from '../utils/map-config';

// Karte erstellen
const map = new Map({
  ...MAP_INIT,
  layers: [
    LAYERS.OSM,
    LAYERS.LUFTBILD,
    LAYERS.BASEMAP,
  ],
  target: 'map-container',
});
```

### Layer-Steuerung

```typescript
// Layer ein-/ausblenden
function toggleLayer(layerName: string, visible: boolean) {
  const layer = LAYERS[layerName];
  if (layer) {
    layer.setVisible(visible);
  }
}

// Z-Index anpassen
function setLayerZIndex(layerName: string, zIndex: number) {
  const layer = LAYERS[layerName];
  if (layer) {
    layer.setZIndex(zIndex);
  }
}
```

## Performance-Optimierungen

### Tile-Caching
- WMS-Layer verwenden `TILED: true` für optimierte Kachel-Ladung
- Browser-Caching für wiederholte Tile-Requests
- Viewport-begrenztes Laden nur sichtbarer Bereiche

### Memory-Management
- Layer werden nur bei Bedarf erstellt
- Unused Layer können zerstört werden
- Event-Listener werden sauber entfernt

## Nächste Schritte

- [ ] Dynamische Layer-Konfiguration für verschiedene Kommunen
- [ ] Vector-Layer für Feature-Daten implementieren
- [ ] Performance-Monitoring für Layer-Loading
- [ ] Mobile-Optimierung für Touch-Interaktionen