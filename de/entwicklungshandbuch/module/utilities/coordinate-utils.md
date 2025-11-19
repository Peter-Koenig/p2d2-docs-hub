---
title: Coordinate & CRS Utilities
description: Umfassende Dokumentation für Koordinatentransformation und CRS-Management
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Coordinate & CRS Utilities

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Das `crs.ts` Modul bietet umfassende Funktionen für Koordinatentransformation, Projektionsverwaltung und CRS-Wechsel in der p2d2-Anwendung. Es basiert auf `proj4` und `OpenLayers` für präzise geografische Berechnungen.

## Hauptfunktionen

### 1. Projektionsverwaltung

#### Unterstützte Projektionen
```typescript
// Standardprojektionen
export const defaultCRS = "EPSG:3857";  // Web Mercator
export const wgs84 = "EPSG:4326";       // WGS84 Geografisch

// Vordefinierte UTM-Projektionen
const predefinedUtmDefs: Record<string, string> = {
  "EPSG:25832": "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  "EPSG:25833": "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
};
```

#### UTM-Projektionen registrieren
```typescript
/**
 * Registriert eine UTM-Projektion dynamisch
 * @param crs - EPSG-Code (z.B. "EPSG:25832")
 * @returns boolean - Erfolg der Registrierung
 */
export function registerUtm(crs: string): boolean

// Beispiel
registerUtm("EPSG:25832"); // UTM Zone 32 für Deutschland
```

### 2. Validierungsfunktionen

#### Koordinatenvalidierung
```typescript
/**
 * Validiert WGS84-Koordinaten [longitude, latitude]
 * @param coord - Zu validierende Koordinate
 * @returns boolean - Gültigkeit der Koordinate
 */
export function isValidWgs84Coordinate(coord: any): boolean

// Beispiel
isValidWgs84Coordinate([6.95, 50.94]); // ✅ true
isValidWgs84Coordinate([200, 50.94]);  // ❌ false (Länge außerhalb -180..180)
```

#### Extent-Validierung
```typescript
/**
 * Validiert WGS84-Extent [minLon, minLat, maxLon, maxLat]
 * @param extent - Zu validierender Extent
 * @returns boolean - Gültigkeit des Extents
 */
export function isValidWgs84Extent(extent: any): boolean

// Beispiel
isValidWgs84Extent([6.8, 50.8, 7.1, 51.1]); // ✅ true
isValidWgs84Extent([6.8, 50.8, 5.0, 51.1]); // ❌ false (minLon > maxLon)
```

### 3. Transformationsfunktionen

#### Koordinatentransformation
```typescript
/**
 * Transformiert Koordinaten von WGS84 zur Zielprojektion
 * @param center - WGS84-Koordinate [lon, lat]
 * @param targetEpsg - Zielprojektion (z.B. "EPSG:3857")
 * @returns number[] | null - Transformierte Koordinate
 */
export function transformCenterFromWgs84(
  center: number[], 
  targetEpsg: string
): number[] | null

// Beispiel
const webMercatorCoord = transformCenterFromWgs84(
  [6.95, 50.94], 
  "EPSG:3857"
); // → [773592.4, 6574806.8]
```

#### Extent-Transformation
```typescript
/**
 * Transformiert Extent von WGS84 zur Zielprojektion
 * @param extent - WGS84-Extent [minLon, minLat, maxLon, maxLat]
 * @param targetEpsg - Zielprojektion
 * @returns number[] | null - Transformierter Extent
 */
export function transformExtentFromWgs84(
  extent: number[], 
  targetEpsg: string
): number[] | null

// Beispiel
const cologneExtent = [6.8, 50.8, 7.1, 51.1];
const utmExtent = transformExtentFromWgs84(cologneExtent, "EPSG:25832");
```

### 4. Karten-View-Management

#### Projektionswechsel mit Skalenerhalt
```typescript
/**
 * Wechselt zur neuen Projektion unter Erhalt der aktuellen Skala
 * @param map - OpenLayers Map Instanz
 * @param targetEpsg - Zielprojektion
 * @param animate - Animation aktivieren (default: true)
 * @returns boolean - Erfolg des Wechsels
 */
export function toNewViewPreservingScale(
  map: Map, 
  targetEpsg: string, 
  animate: boolean = true
): boolean

// Beispiel
import { Map } from "ol";

const map = new Map({ /* Konfiguration */ });
const success = toNewViewPreservingScale(map, "EPSG:25832", true);
```

## Verwendung in der Praxis

### Komplette CRS-Integration
```typescript
import { 
  registerUtm, 
  transformCenterFromWgs84, 
  toNewViewPreservingScale 
} from '../utils/crs';
import { Map, View } from 'ol';

// 1. Projektion registrieren
registerUtm("EPSG:25832");

// 2. Koordinaten transformieren
const center = [6.95, 50.94]; // Köln in WGS84
const utmCenter = transformCenterFromWgs84(center, "EPSG:25832");

// 3. Karte mit UTM-Projektion initialisieren
const map = new Map({
  view: new View({
    projection: "EPSG:25832",
    center: utmCenter,
    zoom: 12
  })
});

// 4. Projektionswechsel durchführen
toNewViewPreservingScale(map, "EPSG:3857");
```

### Error Handling
```typescript
import { logger } from '../utils/logger';

try {
  const result = transformCenterFromWgs84([6.95, 50.94], "EPSG:25832");
  if (!result) {
    throw new Error("Koordinatentransformation fehlgeschlagen");
  }
  // Erfolgreiche Transformation
  console.log("Transformierte Koordinate:", result);
} catch (error) {
  logger.error("CRS-Fehler:", error);
  // Fallback: Web Mercator verwenden
  const fallback = transformCenterFromWgs84([6.95, 50.94], "EPSG:3857");
}
```

## Konfiguration

### UTM-Zonen für Deutschland
```typescript
// Wichtige UTM-Zonen für deutsche Kommunen
const germanUtmZones = {
  "EPSG:25832": "UTM Zone 32N (West- und Mitteldeutschland)",
  "EPSG:25833": "UTM Zone 33N (Ostdeutschland)",
  "EPSG:31466": "Gauß-Krüger Zone 2",
  "EPSG:31467": "Gauß-Krüger Zone 3"
};

// Automatische Registrierung
Object.keys(germanUtmZones).forEach(zone => {
  registerUtm(zone);
});
```

### Projektionserkennung
```typescript
/**
 * Prüft ob CRS eine UTM-Projektion ist
 * @param crs - EPSG-Code
 * @returns boolean - True für UTM-Projektionen
 */
export function isUtm(crs: string): boolean

// Beispiel
isUtm("EPSG:25832"); // ✅ true
isUtm("EPSG:3857");  // ❌ false
```

## Performance-Optimierungen

### 1. Caching von Projektionen
```typescript
// Projektionen werden nur einmal registriert
const registeredProjections = new Set<string>();

function registerUtm(crs: string): boolean {
  if (registeredProjections.has(crs)) {
    return true; // Bereits registriert
  }
  // ... Registrierungslogik
  registeredProjections.add(crs);
}
```

### 2. Effiziente Transformationen
```typescript
// Batch-Transformation für mehrere Koordinaten
function transformMultipleCoordinates(
  coordinates: number[][], 
  targetEpsg: string
): (number[] | null)[] {
  return coordinates.map(coord => 
    transformCenterFromWgs84(coord, targetEpsg)
  );
}
```

## Fehlerbehandlung und Debugging

### Häufige Fehlerszenarien
```typescript
// 1. Ungültige Koordinaten
const invalidCoord = [200, 100]; // Außerhalb gültiger Bereiche
const result = transformCenterFromWgs84(invalidCoord, "EPSG:3857");
// → null (mit Warnung in Konsole)

// 2. Nicht registrierte Projektion
const unknownCrs = "EPSG:99999";
const success = registerUtm(unknownCrs);
// → false (Projektion kann nicht registriert werden)

// 3. Netzwerkfehler bei proj4
// → Fallback auf Web Mercator
```

### Debugging-Hilfen
```typescript
// Erweiterte Logging für Entwicklung
if (process.env.NODE_ENV === 'development') {
  console.log('[CRS-Debug]', {
    currentProjection: view.getProjection()?.getCode(),
    targetProjection: targetEpsg,
    transformationResult: result
  });
}
```

## Abhängigkeiten

### Externe Libraries
- **proj4** - Koordinatentransformationen
- **OpenLayers** - Karten- und Projektionsintegration

### Interne Abhängigkeiten
- `../utils/logger` - Konsistente Logging-Infrastruktur
- `../config/map-config` - Standard-Konfigurationen

## Best Practices

### 1. Projektionswahl
```typescript
// ✅ Korrekt - Region-spezifische Projektionen
const regionalCrs = getRegionalCrs(kommune.slug); // EPSG:25832 für Köln

// ❌ Vermeiden - Immer Web Mercator
const alwaysWebMercator = "EPSG:3857"; // Nicht für alle Regionen optimal
```

### 2. Fehlerbehandlung
```typescript
// ✅ Korrekt - Explizite Validierung
if (!isValidWgs84Coordinate(center)) {
  throw new Error("Ungültige Koordinaten für Transformation");
}

// ❌ Vermeiden - Implizite Annahmen
const result = transformCenterFromWgs84(center, targetEpsg); // Keine Validierung
```

### 3. Performance
```typescript
// ✅ Korrekt - Caching nutzen
const cachedTransformation = transformCenterFromWgs84(center, "EPSG:25832");

// ❌ Vermeiden - Wiederholte Transformationen
for (let i = 0; i < 1000; i++) {
  transformCenterFromWgs84(center, "EPSG:25832"); // Ineffizient
}
```

Diese Utilities bilden die Grundlage für präzise geografische Berechnungen in p2d2 und gewährleisten konsistente Koordinatentransformationen über alle Module hinweg.