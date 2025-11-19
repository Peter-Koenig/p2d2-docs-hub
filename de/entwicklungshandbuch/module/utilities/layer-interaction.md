---
title: Layer Management & Interaction
description: Umfassende Dokumentation für Layer-Verwaltung und Interaktionsbehandlung
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Layer Management & Interaction

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Die Layer-Management-Utilities in p2d2 bieten eine zentrale Verwaltung für Kartenebenen, Interaktionsbehandlung und Zustandsmanagement. Diese Module bilden die Grundlage für die dynamische Darstellung von Geodaten und Benutzerinteraktionen.

## Hauptmodule

### 1. Layer Manager (`layer-manager.ts`)

Zentrale Verwaltung für Basis-Kartenebenen (Luftbilder, basemap.de) mit Persistenz.

#### Layer-Typen

```typescript
// Globale Layer-Instanzen
let luftbildLayer: TileLayer | null = null;    // Kölner Luftbild WMS
let basemapLayer: TileLayer | null = null;     // basemap.de WMTS

// Z-Index Hierarchie
export const LAYER_ZINDEX = {
  LUFTBILD: 10,    // Unterste Ebene
  BASEMAP: 20,     // Mittlere Ebene  
  FEATURES: 30,    // Vektor-Features
  LABELS: 40,      // Beschriftungen
  CONTROLS: 50     // Oberste Ebene
};
```

#### Layer-Erstellung

```typescript
/**
 * Erstellt Luftbild-WMS-Layer für Köln
 * Service: Stadt Köln Luftbilder 2024
 * URL: https://geoportal.stadt-koeln.de/wss/service/luftbilder_2024_wms/guest
 */
export function createLuftbildLayer(projection: string): TileLayer

/**
 * Erstellt basemap.de WMS-Layer  
 * Service: Geodatenzentrum basemap.de
 * URL: https://sgx.geodatenzentrum.de/wms_basemapde
 */
export function createBasemapLayer(): TileLayer
```

#### Layer-Toggle-Funktionalität

```typescript
/**
 * Schaltet Basis-Layer unabhängig um
 * Persistiert beide States separat in localStorage
 */
export function toggleBaseLayer(layerName: string): void

// Beispiel
toggleBaseLayer("luftbild");  // Luftbild ein-/ausschalten
toggleBaseLayer("basemap");   // basemap.de ein-/ausschalten
```

### 2. WFS Layer Manager (`wfs-layer-manager.ts`)

Dynamische Verwaltung von WFS-Vektorlayern mit Caching und State-Management.

#### Hauptklasse

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

#### WFS-Layer-Steuerung

```typescript
// Layer anzeigen/ausblenden
async toggleLayer(kommune: KommuneData, categorySlug: string): Promise<void>
async displayLayer(kommune: KommuneData, categorySlug: string): Promise<void>
hideLayer(): void

// Beispiel
const wfsManager = new WFSLayerManager(map);
await wfsManager.displayLayer(kommuneData, "friedhoefe");
```

#### Layer-Konfiguration

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

Touch-optimierte Behandlung von Klick-Events auf Kommunen-Karten.

#### Hauptfunktionen

```typescript
export default class KommunenClickHandler {
  private processingButtons: Set<HTMLElement> = new Set();
  private boundClickHandler: (event: Event) => void;

  // Event-Binding
  bind(): void
  unbind(): void

  // State-Management
  restoreLastSelection(): void
  persistSelection(detail: KommunenDetail): void
}
```

#### Toggle-Logik

```typescript
// Intelligentes Toggle-Verhalten
if (currentKommune?.slug === slug) {
  // Gleiche Kommune nochmal geklickt → deaktivieren
  this.hideWFSLayer();
  removeHighlight();
} else {
  // Neue Kommune ausgewählt
  this.showWFSLayer();
  applyHighlight();
}
```

#### WFS-Layer-Automatisierung

```typescript
private handleWFSLayerToggle(detail: KommunenDetail): void {
  const selectedCategory = (window as any).mapState?.getSelectedCategory?.();
  if (selectedCategory) {
    // Automatischer Layer-Wechsel bei Kommune-Änderung
    (window as any).wfsManager.displayLayer(detail, selectedCategory);
  }
}
```

## Verwendung in der Praxis

### Komplette Layer-Integration

```typescript
import { createLuftbildLayer, createBasemapLayer, initLayerControls } from '../utils/layer-manager';
import WFSLayerManager from '../utils/wfs-layer-manager';
import KommunenClickHandler from '../utils/kommunen-click-handler';

// 1. Basis-Layer erstellen
const luftbild = createLuftbildLayer("EPSG:3857");
const basemap = createBasemapLayer();

// 2. WFS-Manager initialisieren
const wfsManager = new WFSLayerManager(map);

// 3. Click-Handler binden
const clickHandler = new KommunenClickHandler();
clickHandler.bind();

// 4. Layer-Controls aktivieren
initLayerControls();

// 5. Letzte Auswahl wiederherstellen
clickHandler.restoreLastSelection();
```

### Event-Handling

```typescript
// Kommunen-Focus Event abonnieren
window.addEventListener("kommunen:focus", (event) => {
  const detail = event.detail;
  
  // Karte navigieren
  map.getView().setCenter(detail.center);
  map.getView().setZoom(detail.zoom);
  
  // WFS-Layer automatisch anzeigen
  const selectedCategory = mapState.getSelectedCategory();
  if (selectedCategory) {
    wfsManager.displayLayer(detail, selectedCategory);
  }
});
```

## Konfiguration

### WFS-Layer-Styling

```typescript
// Standard-Style für WFS-Vektorlayer
const defaultStyle = new Style({
  stroke: new Stroke({
    color: "#FF6900",  // p2d2 Orange
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(255, 105, 0, 0.1)",  // Transparente Füllung
  }),
});
```

### OSM Admin Level Logik

```typescript
private getOsmAdminLevel(kommune: KommuneData, containerType: string): number {
  if (containerType === "cemetery") return 8;  // Friedhöfe immer Level 8
  
  if (containerType === "administrative") {
    const levels = kommune.osmAdminLevels || [];
    // Nimm die NÄCHSTE Ebene nach der Kommune-Grenze
    return levels.length > 1 ? levels[1] : levels[0] || 8;
  }
  
  return 8; // Fallback
}
```

## Performance-Optimierungen

### 1. Layer-Caching

```typescript
// WFS-Layer werden gecached für wiederholte Verwendung
private layerCache = new Map<string, VectorLayer<VectorSource>>();

const cacheKey = `${config.wpName}-${config.containerType}-${config.osmAdminLevel}`;
let layer = this.layerCache.get(cacheKey);
if (!layer) {
  layer = await this.createWFSLayer(config);
  this.layerCache.set(cacheKey, layer);
}
```

### 2. Event-Throttling

```typescript
// Verhindert zu häufige Events
private processingButtons: Set<HTMLElement> = new Set();

if (this.processingButtons.has(button)) {
  console.log("Click already being processed, ignoring");
  return;
}
this.processingButtons.add(button);
```

### 3. State-Persistenz

```typescript
// Automatisches Speichern der Auswahl
private persistSelection(detail: KommunenDetail): void {
  localStorage.setItem("p2d2_selected_kommune_slug", detail.slug || "");
  localStorage.setItem("p2d2_selected_kommune_detail", JSON.stringify(detail));
}
```

## Fehlerbehandlung

### Robustes Event-Dispatching

```typescript
private dispatchKommunenFocus(detail: KommunenDetail): void {
  try {
    if (typeof (window as any).dispatchKommunenFocus === "function") {
      (window as any).dispatchKommunenFocus(detail);
    } else {
      window.dispatchEvent(new CustomEvent("kommunen:focus", { detail }));
    }
  } catch (error) {
    // Retry-Mechanismus
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("kommunen:focus", { detail }));
    }, 100);
  }
}
```

### Validierung von Geodaten

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

### 1. Layer-Hierarchie

```typescript
// ✅ Korrekt - Klare Z-Index Struktur
const layers = [
  luftbildLayer,     // Z-Index: 10
  basemapLayer,      // Z-Index: 20  
  wfsVectorLayer,    // Z-Index: 30
  labelLayer         // Z-Index: 40
];

// ❌ Vermeiden - Undefinierte Reihenfolge
map.addLayer(anyLayer); // Kein expliziter Z-Index
```

### 2. Memory Management

```typescript
// ✅ Korrekt - Proper Cleanup
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

// ❌ Vermeiden - Memory Leaks
// Event-Listener werden nie entfernt
```

### 3. Error Handling

```typescript
// ✅ Korrekt - Robuste Implementierung
try {
  await wfsManager.displayLayer(kommune, category);
} catch (error) {
  logger.error("WFS-Layer konnte nicht geladen werden", error);
  showUserNotification("Daten vorübergehend nicht verfügbar");
}

// ❌ Vermeiden - Unbehandelte Fehler
wfsManager.displayLayer(kommune, category); // Kein Error Handling
```

## Abhängigkeiten

### Externe Libraries
- **OpenLayers** - Karten- und Layer-Management
- **proj4** - Koordinatentransformationen

### Interne Abhängigkeiten
- `../utils/events` - Event-System
- `../utils/logger` - Logging-Infrastruktur  
- `../utils/wfs-auth` - WFS-Authentifizierung
- `../utils/map-state` - Zustandsmanagement

Diese Layer-Management-Utilities gewährleisten eine konsistente und performante Darstellung von Geodaten in p2d2, mit robustem Error-Handling und optimierter Benutzerinteraktion.