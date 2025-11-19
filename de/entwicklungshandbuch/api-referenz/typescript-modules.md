---
title: TypeScript Modules
description: TypeScript-Module, Interfaces und Typ-Definitionen in p2d2
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# TypeScript Modules

> **Status:** 🚧 Dokumentation in Arbeit

## Übersicht

Die p2d2-Plattform nutzt TypeScript für typsichere Entwicklung und bessere Code-Qualität. Dieses Dokument beschreibt die wichtigsten TypeScript-Module, Interfaces und Typ-Definitionen, die im Projekt verwendet werden.

## Module-Struktur

### Core-Module

#### Map-Module
- **Map Config**: Karten-Konfiguration und Layer-Definitionen
- **Layer Management**: Layer-Operationen und -Verwaltung
- **Coordinate Systems**: Koordinatentransformationen und Projektionen

#### Feature-Module
- **Geometry Types**: Geometrie-Datentypen (Point, LineString, Polygon)
- **Editor Functions**: Feature-Editor-Funktionalitäten
- **Validation**: Datenvalidierung und -transformation

#### UI-Module
- **Component Props**: TypeScript-Interfaces für UI-Komponenten
- **State Management**: Zustandsverwaltung und -typen
- **Event Handlers**: Event-Typen und Handler-Definitionen

## Wichtige Interfaces

### Map-Konfiguration
```typescript
interface MapConfig {
  projection: string;
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  layers: LayerConfig[];
}

interface LayerConfig {
  type: 'tile' | 'wms' | 'vector';
  source: string;
  visible: boolean;
  title: string;
  opacity?: number;
  zIndex?: number;
}
```

### Geometrie-Typen
```typescript
interface Coordinate {
  x: number;
  y: number;
}

interface Geometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  coordinates: Coordinate[] | Coordinate[][];
}

interface Feature {
  id: string;
  geometry: Geometry;
  properties: Record<string, any>;
}
```

### UI-Komponenten
```typescript
interface MapComponentProps {
  config: MapConfig;
  onFeatureSelect?: (feature: Feature) => void;
  onMapLoad?: (map: MapInstance) => void;
}

interface LayerListProps {
  layers: LayerConfig[];
  onLayerToggle: (layerId: string, visible: boolean) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
}
```

## Utility-Typen

### Generic Types
```typescript
type Optional<T> = T | undefined;
type Nullable<T> = T | null;
type Maybe<T> = T | null | undefined;

// React-like Ref type
type Ref<T> = { current: T | null };
```

### Event-Typen
```typescript
interface MapEvent {
  type: 'click' | 'move' | 'zoom' | 'layerchange';
  coordinate: Coordinate;
  features?: Feature[];
  layer?: LayerConfig;
}

interface UIEvent {
  type: 'button-click' | 'input-change' | 'form-submit';
  target: string;
  value?: any;
}
```

## Enums und Constants

### Projektions-Enums
```typescript
enum Projection {
  WEB_MERCATOR = 'EPSG:3857',
  WGS84 = 'EPSG:4326',
  UTM32 = 'EPSG:25832'
}

enum GeometryType {
  POINT = 'Point',
  LINESTRING = 'LineString', 
  POLYGON = 'Polygon',
  MULTIPOLYGON = 'MultiPolygon'
}
```

### Layer-Typen
```typescript
enum LayerType {
  TILE = 'tile',
  WMS = 'wms',
  VECTOR = 'vector',
  WMTS = 'wmts'
}

enum SourceType {
  OSM = 'osm',
  WMS = 'wms',
  GEOJSON = 'geojson',
  CUSTOM = 'custom'
}
```

## Funktionen und Methoden

### Map-Operationen
```typescript
// Koordinatentransformation
function transformCoordinate(
  coordinate: Coordinate, 
  fromProjection: string, 
  toProjection: string
): Coordinate;

// Layer-Management
function addLayer(map: MapInstance, config: LayerConfig): LayerInstance;
function removeLayer(map: MapInstance, layerId: string): boolean;
function setLayerVisibility(layer: LayerInstance, visible: boolean): void;
```

### Feature-Operationen
```typescript
// Geometrie-Validierung
function validateGeometry(geometry: Geometry): boolean;
function calculateArea(geometry: Geometry): number;
function calculateLength(geometry: Geometry): number;

// Feature-Erstellung
function createFeature(geometry: Geometry, properties: Record<string, any>): Feature;
function updateFeatureProperties(feature: Feature, updates: Record<string, any>): Feature;
```

## Import/Export Patterns

### Module-Exports
```typescript
// Haupt-Exporte eines Moduls
export { MapConfig, LayerConfig };
export type { Coordinate, Geometry, Feature };
export { Projection, GeometryType, LayerType };

// Standard-Export für Haupt-Klassen
export default class MapManager {
  // ... Implementation
}
```

### Barrel-Exports
```typescript
// index.ts in einem Modul-Verzeichnis
export * from './types';
export * from './utils';
export * from './config';
```

## Best Practices

### Type-Safety
- **Strict Mode**: TypeScript strict Compiler-Optionen aktivieren
- **Interface Segregation**: Spezifische statt generische Interfaces
- **Type Guards**: Runtime-Type-Checks für unsichere Daten

### Code-Organisation
- **Separation of Concerns**: Typ-Definitionen von Implementierung trennen
- **Barrel Files**: Geordnete Export-Strukturen
- **Documentation**: JSDoc-Kommentare für öffentliche APIs

### Performance
- **Type-Only Imports**: `import type` für reine Typ-Imports
- **Conditional Types**: Vermeidung von übermäßig komplexen Typen
- **Generic Constraints**: Einschränkungen für generische Typ-Parameter

## Nächste Schritte

- [ ] Detaillierte API-Referenz für alle Module
- [ ] Code-Beispiele für häufige Use-Cases
- [ ] Migration-Guide für JavaScript zu TypeScript
- [ ] Testing-Strategien für TypeScript-Code