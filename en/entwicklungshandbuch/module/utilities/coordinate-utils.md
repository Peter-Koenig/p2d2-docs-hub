---
title: Coordinate & CRS Utilities
description: Comprehensive documentation for coordinate transformation and CRS management
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# Coordinate & CRS Utilities

> **Status:** ✅ Fully documented

## Overview

The `crs.ts` module provides comprehensive functions for coordinate transformation, projection management, and CRS switching in the p2d2 application. It is based on `proj4` and `OpenLayers` for precise geographical calculations.

## Main Functions

### 1. Projection Management

#### Supported Projections

```typescript
// Standard projections
export const defaultCRS = "EPSG:3857";  // Web Mercator
export const wgs84 = "EPSG:4326";       // WGS84 Geographic

// Predefined UTM projections
const predefinedUtmDefs: Record<string, string> = {
  "EPSG:25832": "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
  "EPSG:25833": "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
};
```

#### Register UTM Projections

```typescript
/**
 * Registers a UTM projection dynamically
 * @param crs - EPSG code (e.g., "EPSG:25832")
 * @returns boolean - Success of registration
 */
export function registerUtm(crs: string): boolean

// Example
registerUtm("EPSG:25832"); // UTM Zone 32 for Germany
```

### 2. Validation Functions

#### Coordinate Validation

```typescript
/**
 * Validates WGS84 coordinates [longitude, latitude]
 * @param coord - Coordinate to validate
 * @returns boolean - Validity of the coordinate
 */
export function isValidWgs84Coordinate(coord: any): boolean

// Example
isValidWgs84Coordinate([6.95, 50.94]); // ✅ true
isValidWgs84Coordinate([200, 50.94]);  // ❌ false (Longitude out of -180..180 range)
```

#### Extent Validation

```typescript
/**
 * Validates WGS84 extent [minLon, minLat, maxLon, maxLat]
 * @param extent - Extent to validate
 * @returns boolean - Validity of the extent
 */
export function isValidWgs84Extent(extent: any): boolean

// Example
isValidWgs84Extent([6.8, 50.8, 7.1, 51.1]); // ✅ true
isValidWgs84Extent([6.8, 50.8, 5.0, 51.1]); // ❌ false (minLon > maxLon)
```

### 3. Transformation Functions

#### Coordinate Transformation

```typescript
/**
 * Transforms coordinates from WGS84 to the target projection
 * @param center - WGS84 coordinate [lon, lat]
 * @param targetEpsg - Target projection (e.g., "EPSG:3857")
 * @returns number[] | null - Transformed coordinate
 */
export function transformCenterFromWgs84(
  center: number[], 
  targetEpsg: string
): number[] | null

// Example
const webMercatorCoord = transformCenterFromWgs84(
  [6.95, 50.94], 
  "EPSG:3857"
); // → [773592.4, 6574806.8]
```

#### Extent Transformation

```typescript
/**
 * Transforms extent from WGS84 to the target projection
 * @param extent - WGS84 extent [minLon, minLat, maxLon, maxLat]
 * @param targetEpsg - Target projection
 * @returns number[] | null - Transformed extent
 */
export function transformExtentFromWgs84(
  extent: number[], 
  targetEpsg: string
): number[] | null

// Example
const cologneExtent = [6.8, 50.8, 7.1, 51.1];
const utmExtent = transformExtentFromWgs84(cologneExtent, "EPSG:25832");
```

### 4. Map View Management

#### Projection Change Preserving Scale

```typescript
/**
 * Switches to the new projection while preserving the current scale
 * @param map - OpenLayers Map instance
 * @param targetEpsg - Target projection
 * @param animate - Enable animation (default: true)
 * @returns boolean - Success of the switch
 */
export function toNewViewPreservingScale(
  map: Map, 
  targetEpsg: string, 
  animate: boolean = true
): boolean

// Example
import { Map } from "ol";

const map = new Map({ /* Configuration */ });
const success = toNewViewPreservingScale(map, "EPSG:25832", true);
```

## Practical Usage

### Complete CRS Integration

```typescript
import { 
  registerUtm, 
  transformCenterFromWgs84, 
  toNewViewPreservingScale 
} from '../utils/crs';
import { Map, View } from 'ol';

// 1. Register projection
registerUtm("EPSG:25832");

// 2. Transform coordinates
const center = [6.95, 50.94]; // Cologne in WGS84
const utmCenter = transformCenterFromWgs84(center, "EPSG:25832");

// 3. Initialize map with UTM projection
const map = new Map({
  view: new View({
    projection: "EPSG:25832",
    center: utmCenter,
    zoom: 12
  })
});

// 4. Perform projection switch
toNewViewPreservingScale(map, "EPSG:3857");
```

### Error Handling

```typescript
import { logger } from '../utils/logger';

try {
  const result = transformCenterFromWgs84([6.95, 50.94], "EPSG:25832");
  if (!result) {
    throw new Error("Coordinate transformation failed");
  }
  // Successful transformation
  console.log("Transformed coordinate:", result);
} catch (error) {
  logger.error("CRS Error:", error);
  // Fallback: Use Web Mercator
  const fallback = transformCenterFromWgs84([6.95, 50.94], "EPSG:3857");
}
```

## Configuration

### UTM Zones for Germany

```typescript
// Important UTM zones for German municipalities
const germanUtmZones = {
  "EPSG:25832": "UTM Zone 32N (West and Central Germany)",
  "EPSG:25833": "UTM Zone 33N (East Germany)",
  "EPSG:31466": "Gauss-Krüger Zone 2",
  "EPSG:31467": "Gauss-Krüger Zone 3"
};

// Automatic registration
Object.keys(germanUtmZones).forEach(zone => {
  registerUtm(zone);
});
```

### Projection Detection

```typescript
/**
 * Checks if CRS is a UTM projection
 * @param crs - EPSG code
 * @returns boolean - True for UTM projections
 */
export function isUtm(crs: string): boolean

// Example
isUtm("EPSG:25832"); // ✅ true
isUtm("EPSG:3857");  // ❌ false
```

## Performance Optimizations

### 1. Caching of Projections

```typescript
// Projections are registered only once
const registeredProjections = new Set<string>();

function registerUtm(crs: string): boolean {
  if (registeredProjections.has(crs)) {
    return true; // Already registered
  }
  // ... Registration logic
  registeredProjections.add(crs);
}
```

### 2. Efficient Transformations

```typescript
// Batch transformation for multiple coordinates
function transformMultipleCoordinates(
  coordinates: number[][], 
  targetEpsg: string
): (number[] | null)[] {
  return coordinates.map(coord => 
    transformCenterFromWgs84(coord, targetEpsg)
  );
}
```

## Error Handling and Debugging

### Common Error Scenarios

```typescript
// 1. Invalid coordinates
const invalidCoord = [200, 100]; // Outside valid range
const result = transformCenterFromWgs84(invalidCoord, "EPSG:3857");
// → null (with warning in console)

// 2. Unregistered projection
const unknownCrs = "EPSG:99999";
const success = registerUtm(unknownCrs);
// → false (Projection cannot be registered)

// 3. Network error with proj4
// → Fallback to Web Mercator
```

### Debugging Aids

```typescript
// Extended logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('[CRS-Debug]', {
    currentProjection: view.getProjection()?.getCode(),
    targetProjection: targetEpsg,
    transformationResult: result
  });
}
```

## Dependencies

### External Libraries

  - **proj4** - Coordinate transformations
  - **OpenLayers** - Map and projection integration

### Internal Dependencies

  - `../utils/logger` - Consistent logging infrastructure
  - `../config/map-config` - Standard configurations

## Best Practices

### 1. Projection Choice

```typescript
// ✅ Correct - Region-specific projections
const regionalCrs = getRegionalCrs(kommune.slug); // EPSG:25832 for Cologne

// ❌ Avoid - Always Web Mercator
const alwaysWebMercator = "EPSG:3857"; // Not optimal for all regions
```

### 2. Error Handling

```typescript
// ✅ Correct - Explicit validation
if (!isValidWgs84Coordinate(center)) {
  throw new Error("Invalid coordinates for transformation");
}

// ❌ Avoid - Implicit assumptions
const result = transformCenterFromWgs84(center, targetEpsg); // No validation
```

### 3. Performance

```typescript
// ✅ Correct - Use caching
const cachedTransformation = transformCenterFromWgs84(center, "EPSG:25832");

// ❌ Avoid - Repeated transformations
for (let i = 0; i < 1000; i++) {
  transformCenterFromWgs84(center, "EPSG:25832"); // Inefficient
}
```

## These utilities form the basis for precise geographical calculations in p2d2 and ensure consistent coordinate transformations across all modules.