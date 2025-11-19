---
title: Layer Management
description: "Verwaltung von WMS-Basis-Layern (Luftbild, basemap.de) mit Toggle-Funktionen und State-Persistierung"
quality:
  completeness: 80
  accuracy: 75
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
- EPSG:25832 (UTM Zone 32N)
- EPSG:25833 (UTM Zone 33N)
- EPSG:31466 (Gauss-Krüger Zone 2)
- EPSG:31467 (Gauss-Krüger Zone 3)
- EPSG:31468 (Gauss-Krüger Zone 4)
- EPSG:4647 (ETRS89 / UTM Zone 32N)
- EPSG:5650 (ETRS89 / UTM Zone 32N + DHHN92)

**Z-Index:** 15 (aus MAP_CONFIG.Z_INDEX.BASEMAP)

**Besonderheiten:**
- Standardmäßig unsichtbar (`visible: false`)
- Hohe Verfügbarkeit durch BKG-Infrastruktur
- Optimierte Kachelung für schnelles Laden

## Implementierung

### Layer-Erstellung

```typescript
// Luftbild-Layer erstellen
const luftbildLayer = new TileLayer({
  source: new TileWMS({
    url: 'https://geoportal.stadt-koeln.de/wss/service/luftbilder_2024_wms/guest',
    params: {
      'LAYERS': 'luftbilder_2024_23',
      'TILED': true,
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous',
  }),
  zIndex: MAP_CONFIG.Z_INDEX.LUFTBILD,
  visible: false,
});

// basemap.de Layer erstellen
const basemapLayer = new TileLayer({
  source: new TileWMS({
    url: 'https://sgx.geodatenzentrum.de/wms_basemapde',
    params: {
      'LAYERS': 'de_basemapde_web_raster_farbe',
      'TILED': true,
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous',
  }),
  zIndex: MAP_CONFIG.Z_INDEX.BASEMAP,
  visible: false,
});
```

### Toggle-Funktionalität

```typescript
class LayerManager {
  private layers: Map<string, TileLayer> = new Map();
  private activeLayer: string | null = null;

  // Layer hinzufügen
  addLayer(name: string, layer: TileLayer): void {
    this.layers.set(name, layer);
  }

  // Layer ein-/ausschalten
  toggleLayer(name: string): boolean {
    const layer = this.layers.get(name);
    if (!layer) return false;

    const isVisible = layer.getVisible();
    
    // Aktiven Layer ausschalten
    if (this.activeLayer && this.activeLayer !== name) {
      const activeLayer = this.layers.get(this.activeLayer);
      if (activeLayer) {
        activeLayer.setVisible(false);
      }
    }

    // Neuen Layer umschalten
    layer.setVisible(!isVisible);
    
    if (!isVisible) {
      this.activeLayer = name;
    } else {
      this.activeLayer = null;
    }

    // State persistieren
    this.persistState();
    return !isVisible;
  }

  // Aktuellen Status abfragen
  getActiveLayer(): string | null {
    return this.activeLayer;
  }

  // State in localStorage speichern
  private persistState(): void {
    const state = {
      activeLayer: this.activeLayer,
      layers: Array.from(this.layers.entries()).map(([name, layer]) => ({
        name,
        visible: layer.getVisible(),
      })),
    };
    localStorage.setItem('p2d2-layer-state', JSON.stringify(state));
  }

  // State aus localStorage laden
  loadState(): void {
    const stored = localStorage.getItem('p2d2-layer-state');
    if (stored) {
      const state = JSON.parse(stored);
      this.activeLayer = state.activeLayer;
      
      state.layers.forEach(({ name, visible }: { name: string; visible: boolean }) => {
        const layer = this.layers.get(name);
        if (layer) {
          layer.setVisible(visible);
        }
      });
    }
  }
}
```

## Verwendung

### Initialisierung

```typescript
// Layer-Manager erstellen
const layerManager = new LayerManager();

// Layer hinzufügen
layerManager.addLayer('luftbild', luftbildLayer);
layerManager.addLayer('basemap', basemapLayer);

// State laden
layerManager.loadState();

// Layer zur Karte hinzufügen
map.addLayer(luftbildLayer);
map.addLayer(basemapLayer);
```

### UI-Integration

```typescript
// Toggle-Buttons für Layer-Steuerung
document.getElementById('toggle-luftbild').addEventListener('click', () => {
  const isActive = layerManager.toggleLayer('luftbild');
  updateButtonState('luftbild', isActive);
});

document.getElementById('toggle-basemap').addEventListener('click', () => {
  const isActive = layerManager.toggleLayer('basemap');
  updateButtonState('basemap', isActive);
});

// Button-Status aktualisieren
function updateButtonState(layerName: string, isActive: boolean): void {
  const button = document.getElementById(`toggle-${layerName}`);
  if (button) {
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive.toString());
  }
}
```

## Performance-Optimierungen

### Lazy Loading
- Layer werden erst bei erstmaliger Aktivierung geladen
- Tile-Caching für wiederholte Anfragen
- Viewport-begrenztes Laden

### Memory Management
- Unused Layer können deaktiviert werden
- Event-Listener werden sauber entfernt
- Garbage Collection für nicht mehr benötigte Tiles

### Error Handling
```typescript
// Fehlerbehandlung für WMS-Layer
luftbildLayer.getSource().on('tileloaderror', (event) => {
  console.warn('Luftbild-Tile konnte nicht geladen werden:', event);
  // Fallback-Logik implementieren
});

basemapLayer.getSource().on('tileloaderror', (event) => {
  console.warn('basemap.de-Tile konnte nicht geladen werden:', event);
  // Alternative Datenquelle verwenden
});
```

## Nächste Schritte

- [ ] Vector-Layer für Feature-Daten implementieren
- [ ] Dynamische Layer für verschiedene Kommunen
- [ ] Layer-Gruppen für thematische Zusammenfassung
- [ ] Performance-Monitoring für Layer-Loading
- [ ] Mobile-Optimierung für Touch-Interaktionen