## quality: completeness: 50 accuracy: 70 reviewed: false reviewer: 'KI (Gemini)' reviewDate: null

# Frontend Architecture

The p2d2 frontend is based on **AstroJS** with **OpenLayers** for map display and **TypeScript** for type-safe development.

## Tech Stack

### Framework: AstroJS

  - **SSG**: Static Site Generation
  - **Partial Hydration**: JavaScript only where necessary
  - **Framework-agnostic**: Integration of React, Vue, Svelte possible

### Maps: OpenLayers

  - **OGC Standards**: WFS, WMS, WMTS
  - **Vector Tiles**: Efficient rendering
  - **Custom Controls**: Customized UI elements

### State Management

  - **Nanostores**: Lightweight state management
  - **LocalStorage**: Offline capability
  - **IndexedDB**: Local geodata cache

## Directory Structure

```
src/
├── components/
│   ├── Map/
│   │   ├── MapView.astro
│   │   ├── LayerControl.tsx
│   │   ├── FeatureInfo.tsx
│   │   └── EditToolbar.tsx
│   ├── FeatureEditor/
│   │   ├── GeometryEditor.tsx
│   │   ├── AttributeForm.tsx
│   │   └── Validator.ts
│   └── QualityControl/
│       ├── QCQueue.tsx
│       ├── QCReview.tsx
│       └── QCStats.tsx
├── layouts/
│   ├── BaseLayout.astro
│   └── MapLayout.astro
├── pages/
│   ├── index.astro
│   ├── map.astro
│   ├── qc/
│   │   └── [...slug].astro
│   └── api/
│       └── features/
│           └── [id].ts
├── stores/
│   ├── mapStore.ts
│   ├── featureStore.ts
│   └── userStore.ts
├── utils/
│   ├── geoUtils.ts
│   ├── apiClient.ts
│   └── validation.ts
└── styles/
    └── global.css
```

## OpenLayers Integration

### Map Initialization

```
// components/Map/MapView.astro
***
import 'ol/ol.css';
***

<div id="map" class="map-container"></div>

<script>
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    new VectorLayer({
      source: new VectorSource({
        url: '/api/features',
        format: new GeoJSON()
      })
    })
  ],
  view: new View({
    center: fromLonLat([6.95, 50.94]), // Cologne
    zoom: 13
  })
});
</script>
```

### WFS Layer

```
// utils/wfsLayer.ts
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { bbox as bboxStrategy } from 'ol/loadingstrategy';

export function createWFSLayer(layerName: string) {
  return new VectorLayer({
    source: new VectorSource({
      format: new GeoJSON(),
      url: function (extent) {
        return `http://geoserver:8080/geoserver/p2d2/wfs?` +
          `service=WFS&version=2.0.0&request=GetFeature&` +
          `typename=${layerName}&outputFormat=application/json&` +
          `srsname=EPSG:3857&bbox=${extent.join(',')},EPSG:3857`;
      },
      strategy: bboxStrategy
    })
  });
}
```

## State Management

### Feature Store

```
// stores/featureStore.ts
import { atom, map } from 'nanostores';
import type { Feature } from 'geojson';

export const selectedFeature = atom<Feature | null>(null);
export const editMode = atom<boolean>(false);
export const features = map<Record<string, Feature>>({});

export function selectFeature(feature: Feature) {
  selectedFeature.set(feature);
}

export function updateFeature(id: string, feature: Feature) {
  features.setKey(id, feature);
  // Save to IndexedDB
  saveToIndexedDB(id, feature);
}
```

## API Integration

### API Client

```
// utils/apiClient.ts
export class P2D2ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getFeatures(bbox?: number[]): Promise<GeoJSON.FeatureCollection> {
    const params = new URLSearchParams();
    if (bbox) params.set('bbox', bbox.join(','));
    
    const response = await fetch(`${this.baseUrl}/features?${params}`);
    return response.json();
  }

  async updateFeature(id: string, feature: GeoJSON.Feature): Promise<void> {
    await fetch(`${this.baseUrl}/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feature)
    });
  }

  async submitForQC(id: string, comment: string): Promise<void> {
    await fetch(`${this.baseUrl}/qc/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureId: id, comment })
    });
  }
}
```

## Offline Capability

### Service Worker

```
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('p2d2-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/map',
        '/styles/global.css',
        '/js/main.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### IndexedDB for Features

```
// utils/offlineStore.ts
import { openDB } from 'idb';

const dbPromise = openDB('p2d2-offline', 1, {
  upgrade(db) {
    db.createObjectStore('features', { keyPath: 'id' });
    db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
  }
});

export async function saveFeatureOffline(feature: GeoJSON.Feature) {
  const db = await dbPromise;
  await db.put('features', feature);
}

export async function getPendingChanges() {
  const db = await dbPromise;
  return db.getAll('pending');
}
```

## Build and Deployment

### astro.config.mjs

```
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    build: {
      rollupOptions: {
        external: ['ol/ol.css']
      }
    }
  }
});
```

### Build Process

```
# Development
npm run dev

# Production Build
npm run build

# Preview
npm run preview
```

::: tip Performance
Use Astro's Partial Hydration to load JavaScript only for interactive components.
:::