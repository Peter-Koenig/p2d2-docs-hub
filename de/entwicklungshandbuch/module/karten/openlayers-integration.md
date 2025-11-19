---
title: OpenLayers Integration
description: Integration der OpenLayers-Bibliothek mit Projektionsverwaltung, Map-Initialisierung und CRS-Utilities
quality:
  completeness: 80
  accuracy: 75
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
// crs.ts - Projektionsdefinitionen
export const UTM32 = new Projection({
  code: 'EPSG:25832',
  extent: [-2500000, 3500000, 3045984, 9045984],
  units: 'm'
});

export const UTM33 = new Projection({
  code: 'EPSG:25833',
  extent: [-2500000, 3500000, 3045984, 9045984],
  units: 'm'
});

export const WEB_MERCATOR = new Projection({
  code: 'EPSG:3857',
  extent: [-20037508.34, -20037508.34, 20037508.34, 20037508.34],
  units: 'm'
});
```

### Koordinatentransformation

```typescript
// Transformation zwischen Koordinatensystemen
export function transformCoordinate(
  coordinate: Coordinate,
  sourceProjection: string,
  targetProjection: string
): Coordinate {
  return transform(coordinate, sourceProjection, targetProjection);
}

// WGS84 zu UTM32 Transformation
export function wgs84ToUTM32(lon: number, lat: number): Coordinate {
  return transform([lon, lat], 'EPSG:4326', 'EPSG:25832');
}

// UTM32 zu WGS84 Transformation
export function utm32ToWgs84(x: number, y: number): Coordinate {
  return transform([x, y], 'EPSG:25832', 'EPSG:4326');
}
```

## Map-Initialisierung

### Basis-Konfiguration

```typescript
// map-config.ts - Map-Initialisierung
export const MAP_INIT: MapOptions = {
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
      zIndex: Z_INDEX.BASE
    })
  ],
  view: new View({
    projection: 'EPSG:25832',
    center: [691874, 5627920], // Köln in UTM32
    zoom: 14,
    minZoom: 10,
    maxZoom: 20
  }),
  controls: defaultControls({
    attribution: false,
    zoom: false
  }).extend([
    new Zoom(),
    new FullScreen()
  ])
};
```

### Erweiterte Map-Erstellung

```typescript
// Erweiterte Map-Factory
export function createMap(config: Partial<MapOptions> = {}): Map {
  const mapConfig = {
    ...MAP_INIT,
    ...config
  };

  const map = new Map(mapConfig);

  // Event-Handler registrieren
  map.on('click', handleMapClick);
  map.on('moveend', handleMapMove);
  map.on('pointermove', handlePointerMove);

  return map;
}

// Event-Handler für Map-Interaktionen
function handleMapClick(event: MapBrowserEvent<UIEvent>): void {
  const coordinate = event.coordinate;
  const features = map.getFeaturesAtPixel(event.pixel);
  
  if (features.length > 0) {
    // Feature-Selektion verarbeiten
    dispatchEvent(new CustomEvent('feature-select', {
      detail: { features, coordinate }
    }));
  }
}

function handleMapMove(event: MapEvent): void {
  // Viewport-Änderungen verarbeiten
  const view = map.getView();
  const extent = view.calculateExtent(map.getSize());
  
  // Layer-Update basierend auf Viewport
  updateLayersForExtent(extent);
}
```

## Layer-Management

### Dynamische Layer-Erstellung

```typescript
// Layer-Factory für verschiedene Quellen
export function createWMSLayer(
  url: string,
  layers: string,
  zIndex: number,
  visible: boolean = false
): TileLayer {
  return new TileLayer({
    source: new TileWMS({
      url,
      params: { LAYERS: layers, TILED: true },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    }),
    zIndex,
    visible
  });
}

export function createVectorLayer(
  source: VectorSource,
  zIndex: number,
  style?: StyleFunction
): VectorLayer {
  return new VectorLayer({
    source,
    zIndex,
    style: style || defaultVectorStyle
  });
}
```

### Interaktive Layer-Steuerung

```typescript
// Layer-Manager für dynamische Steuerung
export class LayerManager {
  private layers: Map<string, BaseLayer> = new Map();
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  addLayer(name: string, layer: BaseLayer): void {
    this.layers.set(name, layer);
    this.map.addLayer(layer);
  }

  removeLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      this.map.removeLayer(layer);
      this.layers.delete(name);
    }
  }

  setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.setVisible(visible);
    }
  }

  getLayer(name: string): BaseLayer | undefined {
    return this.layers.get(name);
  }

  // Layer-Reihenfolge anpassen
  setLayerZIndex(name: string, zIndex: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.setZIndex(zIndex);
    }
  }
}
```

## Performance-Optimierungen

### Tile-Caching

```typescript
// Optimierte WMS-Quellen mit Caching
export function createCachedWMSSource(
  url: string,
  params: WMSParams
): TileWMS {
  return new TileWMS({
    url,
    params: { ...params, TILED: true },
    serverType: 'geoserver',
    crossOrigin: 'anonymous',
    cacheSize: 256 // Erhöhtes Cache für bessere Performance
  });
}
```

### Viewport-Optimierung

```typescript
// Nur sichtbare Features laden
export function createViewportOptimizedSource(
  source: VectorSource,
  map: Map
): VectorSource {
  const optimizedSource = new VectorSource();

  map.getView().on('change:center', () => {
    const extent = map.getView().calculateExtent(map.getSize());
    const features = source.getFeaturesInExtent(extent);
    optimizedSource.clear();
    optimizedSource.addFeatures(features);
  });

  return optimizedSource;
}
```

## Error-Handling

### Robustheit bei Netzwerk-Fehlern

```typescript
// Fehlerbehandlung für Tile-Loading
export function createRobustTileSource(
  source: TileSource,
  fallbackUrls: string[] = []
): TileSource {
  let currentUrlIndex = 0;

  source.on('tileloaderror', (event) => {
    console.warn('Tile load error:', event);
    
    if (fallbackUrls.length > 0 && currentUrlIndex < fallbackUrls.length) {
      // Zur nächsten URL wechseln
      currentUrlIndex++;
      source.setUrl(fallbackUrls[currentUrlIndex]);
    }
  });

  return source;
}
```

## Nächste Schritte

- [ ] Vector-Tile Unterstützung implementieren
- [ ] 3D-View für Geländedarstellung
- [ ] Offline-Caching für mobile Nutzung
- [ ] Performance-Monitoring für Layer-Loading
- [ ] Touch-Optimierung für mobile Geräte