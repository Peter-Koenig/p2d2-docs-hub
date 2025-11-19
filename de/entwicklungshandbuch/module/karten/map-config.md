---
title: Map Config
description: Konfiguration der Karten-Einstellungen und Layer-Definitionen
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Map Config

> **Status:** 🚧 Dokumentation in Arbeit

## Übersicht

Die Map-Konfiguration definiert das Verhalten und Erscheinungsbild der Karten in p2d2. Sie umfasst Layer-Definitionen, Projektionseinstellungen, Zoom-Level und Interaktionsoptionen.

## Konfigurationsstruktur

### Basis-Konfiguration
- **Projektion**: Standardmäßig EPSG:3857 (Web Mercator)
- **Zoom-Level**: Bereich und Standard-Zoom
- **Center-Koordinaten**: Standard-Kartenmittelpunkt
- **Extent**: Begrenzter Kartenbereich (optional)

### Layer-Konfiguration
- **Hintergrund-Layer**: Basiskarten (OSM, etc.)
- **Overlay-Layer**: Thematische Daten-Layer
- **Layer-Reihenfolge**: Z-Index und Darstellungspriorität
- **Layer-Styling**: Symbologie und Farbgebung

## Beispiel-Konfiguration

```typescript
// Beispiel für eine grundlegende Karten-Konfiguration
const mapConfig = {
  projection: 'EPSG:3857',
  center: [1234567, 6543210],
  zoom: 10,
  minZoom: 5,
  maxZoom: 18,
  layers: [
    {
      type: 'tile',
      source: 'osm',
      visible: true,
      title: 'OpenStreetMap'
    },
    {
      type: 'wms',
      url: 'https://geodienste.example.com/wms',
      layers: 'themenlayer',
      visible: true,
      title: 'Thematische Daten'
    }
  ]
};
```

## Wichtige Einstellungen

### Projektion
- **EPSG:3857**: Standard für Web-Karten (Web Mercator)
- **EPSG:4326**: Geographische Koordinaten (WGS84)
- **Projektions-Transformation**: Automatische Koordinaten-Umrechnung

### Zoom-Verhalten
- **Zoom-Level**: Diskrete Zoom-Stufen
- **Zoom-Animation**: Smooth Zoom-Übergänge
- **Zoom-Einschränkungen**: Min/Max-Zoom für bestimmte Layer

### Interaktions-Optionen
- **Mouse-Wheel Zoom**: Mausrad-Zoom aktivieren/deaktivieren
- **Keyboard Navigation**: Tastatur-Steuerung
- **Touch-Gesten**: Mobile Interaktionen

## Layer-Typen

### Tile-Layer
- **OSM**: OpenStreetMap als Hintergrund
- **WMTS**: Kachel-basierte Geodienste
- **Custom Tiles**: Eigene Kachel-Quellen

### WMS-Layer
- **Dynamische Raster-Daten**: On-demand gerenderte Karten
- **GetMap Requests**: Standardisierte WMS-Abfragen
- **Layer-Styling**: SLD-basierte Darstellung

### Vector-Layer
- **GeoJSON**: Vektor-Geometrien
- **Feature-Overlays**: Interaktive Vektor-Daten
- **Client-seitiges Rendering**: Performance-optimiert

## Performance-Optimierung

### Caching-Strategien
- **Tile-Cache**: Browser-Caching für Kacheln
- **Layer-Cache**: Zwischenspeicherung von Layer-Daten
- **Preloading**: Vorausschauendes Laden von Daten

### Lazy-Loading
- **Layer-Lazy-Loading**: Layer erst bei Bedarf laden
- **Feature-Lazy-Loading**: Vektor-Features on-demand
- **Viewport-Optimierung**: Nur sichtbare Daten laden

## Nächste Schritte

- [ ] Detaillierte Konfigurationsoptionen dokumentieren
- [ ] Layer-Typen vollständig beschreiben
- [ ] Performance-Optimierungen ergänzen
- [ ] Beispiel-Konfigurationen erweitern