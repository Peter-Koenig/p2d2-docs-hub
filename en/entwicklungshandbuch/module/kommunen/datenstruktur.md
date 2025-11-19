---
title: Data Structure
description: "Documentation of data structures for municipalities data: TypeScript interfaces, OSM structures, GeoJSON format"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Data Structure

## Overview

This document describes the complete data structure of the municipalities system in p2d2. It includes TypeScript interfaces, OSM data structures, GeoJSON formats, and helper functions for managing municipalities data.

## TypeScript Interfaces

### KommuneData Interface

```typescript
// src/utils/kommune-utils.ts
export interface KommuneData {
  slug: string;
  title: string;
  osmAdminLevels?: number[];
  wp_name: string;
  osm_refinement?: string;
  colorStripe: string;
  map: {
    center: [number, number];
    zoom: number;
    projection: string;
    extent?: [number, number, number, number];
    extra?: Record<string, any>;
  };
  order?: number;
  icon?: string;
}
```

**Field Documentation:**

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `slug` | `string` | Unique municipality identifier | `"koeln"`, `"bonn"` |
| `title` | `string` | Display name of municipality | `"Cologne"`, `"Bonn"` |
| `osmAdminLevels` | `number[]` | OSM Administrative Levels | `[6, 9, 10]` |
| `wp_name` | `string` | Wikipedia article name | `"de-Köln"` |
| `osm_refinement` | `string` | OSM query refinement | `"boundary=administrative"` |
| `colorStripe` | `string` | Color code for UI | `"#FF6900"` |
| `map.center` | `[number, number]` | Map center [lon, lat] | `[6.9603, 50.9375]` |
| `map.zoom` | `number` | Zoom level | `11` |
| `map.projection` | `string` | Coordinate system | `"EPSG:25832"` |
| `map.extent` | `[number, number, number, number]` | Map extent | `[6.8, 50.8, 7.2, 51.1]` |
| `map.extra` | `Record<string, any>` | Additional configuration | `{}` |
| `order` | `number` | Sorting order | `10` |
| `icon` | `string` | Icon identifier | `"city"` |

### OSM Polygon Interfaces

```typescript
// src/types/admin-polygon.ts
export interface OSMPolygonFeature extends GeoJSON.Feature {
  id: number;
  properties: {
    name: string;
    admin_level: number;
    wikipedia?: string;
    wikidata?: string;
    type: string;
    timestamp: string;
    version: number;
    changeset: number;
    user: string;
    uid: number;
  };
  geometry: GeoJSON.Geometry;
}

export interface OSMPolygonCollection extends GeoJSON.FeatureCollection {
  features: OSMPolygonFeature[];
}
```

**OSMPolygonFeature Properties:**

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | `number` | OSM element ID | `123456789` |
| `properties.name` | `string` | Element name | `"Cologne"` |
| `properties.admin_level` | `number` | Admin level | `7` |
| `properties.wikipedia` | `string` | Wikipedia reference | `"de:Köln"` |
| `properties.wikidata` | `string` | Wikidata reference | `"Q365"` |
| `properties.type` | `string` | Element type | `"boundary"` |
| `properties.timestamp` | `string` | Modification timestamp | `"2023-10-15T14:30:00Z"` |
| `properties.version` | `number` | Version number | `5` |
| `properties.changeset` | `number` | Changeset ID | `98765432` |
| `properties.user` | `string` | Contributor name | `"osm_user"` |
| `properties.uid` | `number` | Contributor ID | `12345` |

### Overpass API Response

```typescript
export interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: Array<{
    type: "node" | "way" | "relation";
    id: number;
    tags?: Record<string, string>;
    geometry?: Array<{ lat: number; lon: number }>;
    members?: Array<{
      type: "node" | "way" | "relation";
      ref: number;
      role: string;
      geometry?: Array<{ lat: number; lon: number }>;
    }>;
  }>;
}
```

**Overpass Element Structure:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"node" \| "way" \| "relation"` | OSM element type |
| `id` | `number` | OSM element ID |
| `tags` | `Record<string, string>` | OSM tags (key-value pairs) |
| `geometry` | `Array<{lat, lon}>` | Geographic coordinates (only for nodes) |
| `members` | `Array<Member>` | Relation members (only for relations) |

### Sync Interfaces

```typescript
export interface SyncOptions {
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;
  delayMs?: number;
}

export interface SyncResult {
  success: boolean;
  kommuneSlug: string;
  adminLevel: number;
  polygonsFound: number;
  polygonsInserted: number;
  error?: string;
  durationMs: number;
}

export interface WFSTTransactionResult {
  success: boolean;
  transactionId?: string;
  insertedCount?: number;
  error?: string;
  response?: Response;
}

export interface KommuneSyncStatus {
  slug: string;
  title: string;
  hasOSMData: boolean;
  adminLevels: number[];
  lastSync?: Date;
  polygonCount: number;
  status: "pending" | "synced" | "error" | "not_found";
}
```

## OSM Data Structures

### OSM Element Types

**Node:**
- Single point with coordinates
- Used for POIs (Points of Interest)

**Way:**
- Line string or closed area
- Used for roads, buildings, boundaries

**Relation:**
- Collection of nodes, ways, and other relations
- Used for complex structures like administrative boundaries

### OSM Tags for Administrative Boundaries

**Typical Tags:**
```json
{
  "boundary": "administrative",
  "admin_level": "7",
  "name": "Cologne",
  "wikipedia": "de:Köln",
  "wikidata": "Q365",
  "type": "boundary"
}
```

**Important Boundary Tags:**
- `boundary=administrative` - Administrative boundary
- `admin_level=2-10` - Administrative level
- `name=*` - Official name
- `wikipedia=*` - Wikipedia reference
- `wikidata=*` - Wikidata reference

## GeoJSON Format

### Feature Structure

```json
{
  "type": "Feature",
  "id": 123456789,
  "properties": {
    "name": "Cologne",
    "admin_level": 7,
    "wikipedia": "de:Köln",
    "type": "boundary",
    "timestamp": "2023-10-15T14:30:00Z",
    "version": 5,
    "changeset": 98765432,
    "user": "osm_user",
    "uid": 12345
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [6.9112, 50.8756],
        [6.9115, 50.8758],
        [6.9120, 50.8760],
        [6.9112, 50.8756]
      ]
    ]
  }
}
```

### FeatureCollection Structure

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 123456789,
      "properties": { ... },
      "geometry": { ... }
    },
    {
      "type": "Feature",
      "id": 123456790,
      "properties": { ... },
      "geometry": { ... }
    }
  ]
}
```

## Helper Functions

### Kommune Utils

```typescript
// src/utils/kommune-utils.ts

// Central configuration for default municipality
export const DEFAULT_KOMMUNE_SLUG = "koeln";

// Loads all municipalities from the collection
export async function getAllKommunen(): Promise<KommuneData[]> {
  const col = await loadCollection();
  return col
    .map(
      (k) =>
        ({
          slug: k.slug,
          title: k.data.title,
          osmAdminLevels: k.data.osmAdminLevels,
          wp_name: k.data.wp_name,
          osm_refinement: k.data.osm_refinement,
          colorStripe: k.data.colorStripe || "#FF6900",
          map: {
            center: k.data.map?.center || [0, 0],
            zoom: k.data.map?.zoom || 11,
            projection: k.data.map?.projection || "EPSG:3857",
            extent: k.data.map?.extent,
            extra: k.data.map?.extra,
          },
          order: k.data.order,
          icon: k.data.icon,
        }) as KommuneData,
    )
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

// Gets a specific municipality by slug
export async function getKommuneBySlug(
  slug: string,
): Promise<KommuneData | null> {
  const kommunen = await getAllKommunen();
  return kommunen.find((k) => k.slug === slug) || null;
}

// Checks if a municipality has valid OSM data
export function hasValidOSMData(kommune: KommuneData): boolean {
  return (
    !!kommune.wp_name &&
    !!kommune.osmAdminLevels &&
    kommune.osmAdminLevels.length > 0 &&
    !!kommune.map?.center
  );
}

// Gets municipalities ready for sync
export async function getKommunenReadyForSync(): Promise<KommuneData[]> {
  const kommunen = await getAllKommunen();
  return kommunen.filter(hasValidOSMData);
}
```

### Function Documentation

**`getAllKommunen()`**
- **Purpose**: Loads all municipalities from the content collection
- **Return**: `Promise<KommuneData[]>`
- **Sorting**: By `order` field (default: 999)
- **Fallbacks**: Default values for missing map configuration

**`getKommuneBySlug(slug: string)`**
- **Parameter**: `slug` - Unique municipality identifier
- **Return**: `Promise<KommuneData | null>`
- **Usage**: For detail views of individual municipalities

**`hasValidOSMData(kommune: KommuneData)`**
- **Parameter**: `kommune` - Municipality data object
- **Return**: `boolean`
- **Checks**: 
  - `wp_name` present
  - `osmAdminLevels` not empty
  - `map.center` present

**`getKommunenReadyForSync()`**
- **Purpose**: Filters municipalities suitable for OSM sync
- **Return**: `Promise<KommuneData[]>`
- **Usage**: Before synchronization with OSM data

## Data Flow Diagram

### Simplified Representation

```
Content Collection → KommuneData → OSM Query → GeoJSON → WFS Service
     (Markdown)     (Interface)   (Overpass)    (Format)   (Geoserver)
```

### Detailed Process

1. **Data Source**: Markdown files in `src/content/kommunen/`
2. **Validation**: Zod schema in `content.config.ts`
3. **Transformation**: `getAllKommunen()` creates `KommuneData[]`
4. **OSM Query**: Uses `wp_name` and `osmAdminLevels` for Overpass query
5. **GeoJSON Conversion**: OSM data transformed to GeoJSON
6. **WFS Transaction**: GeoJSON sent to Geoserver

## Example Data

### Complete Municipality Data

```typescript
const koelnData: KommuneData = {
  slug: "koeln",
  title: "Cologne",
  osmAdminLevels: [6, 9, 10],
  wp_name: "de-Köln",
  osm_refinement: "boundary=administrative",
  colorStripe: "#FF6900",
  map: {
    center: [6.9603, 50.9375],
    zoom: 11,
    projection: "EPSG:25832",
    extent: [6.8, 50.8, 7.2, 51.1]
  },
  order: 10
};
```

### OSM Overpass Query

```xml
[out:json][timeout:25];
(
  relation["boundary"="administrative"]["admin_level"=7]["wikipedia"="de:Köln"];
);
out body;
>;
out skel qt;
```

### GeoJSON Feature

```json
{
  "type": "Feature",
  "id": 123456789,
  "properties": {
    "name": "Cologne",
    "admin_level": 7,
    "wikipedia": "de:Köln",
    "type": "boundary"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[...]]
  }
}
```

## Best Practices

### Data Consistency

1. **Consistent Naming**: Use consistent slugs and titles
2. **Coordinate System**: Always WGS84 for `map.center`
3. **Color Coding**: Use the standard color palette
4. **OSM Levels**: Only specify relevant administrative levels

### Performance Optimizations

1. **Lazy Loading**: Load municipality data only when needed
2. **Caching**: Cache collection queries
3. **Validation**: Validate frontmatter before build-time
4. **Tree Shaking**: Only retrieve required fields

### Extensibility

The data structures are modular and can be easily extended:

```typescript
// Example extension
interface ExtendedKommuneData extends KommuneData {
  population?: number;
  area?: number;
  website?: string;
  contact?: {
    email: string;
    phone: string;
  };
}
```

The well-defined data structures form the foundation for a robust and extensible municipalities management system in p2d2.
