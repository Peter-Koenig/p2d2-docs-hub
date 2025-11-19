---
title: OSM Integration
description: "Integration with OpenStreetMap - feature-to-OSM mapping, tagging and export"
quality:
  completeness: 50
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# OSM Integration

## Overview

The OSM integration enables synchronization of p2d2 features with OpenStreetMap. It includes data structures for OSM polygons, Overpass-API integration, and planned export functionality.

## Architecture

### OSM Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   p2d2          │◄──►│   OSM-Integration │◄──►│   OpenStreetMap │
│   Features      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GeoJSON       │    │   OSM-XML        │    │   Overpass-API  │
│   Format        │    │   Export         │    │   Queries       │
│                 │    │   🚧 Planned     │    │   🚧 Planned    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implemented Components

### OSM Data Structures

**File:** `src/types/admin-polygon.ts`

The OSM integration defines TypeScript interfaces for OSM-specific data structures.

#### OSMPolygonFeature

```typescript
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
  geometry: GeoJSON.Polygon;
}
```

#### OSMPolygonCollection

```typescript
export interface OSMPolygonCollection extends GeoJSON.FeatureCollection {
  features: OSMPolygonFeature[];
}
```

#### Overpass-API Response

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
    // ... OSM element properties
  }>;
}
```

### Content Collection Schema

**File:** `src/content.config.ts`

The municipality schema contains OSM-specific fields:

```typescript
const kommunen = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    wp_name: z.string().min(3).regex(/^[a-z]{2,3}-/),
    osmAdminLevels: z.array(z.number()).optional(),
    osm_refinement: z.string().optional(),
    // ... additional properties
  })
});
```

### OSM Admin Level Management

**File:** `src/utils/kommune-utils.ts`

Utility functions for OSM data:

```typescript
// Checks if a municipality has valid OSM data
export function hasValidOSMData(kommune: KommuneData): boolean {
  return (
    !!kommune.wp_name &&
    !!kommune.osmAdminLevels &&
    kommune.osmAdminLevels.length > 0 &&
    !!kommune.map?.center
  );
}

// Filters municipalities ready for sync
export async function getKommunenReadyForSync(): Promise<KommuneData[]> {
  const kommunen = await getAllKommunen();
  return kommunen.filter(hasValidOSMData);
}
```

## OSM Admin Levels

### Supported Admin Levels

| Level | Description | Example |
|-------|-------------|---------|
| 2 | Nation state | Germany |
| 4 | Federal state | North Rhine-Westphalia |
| 6 | Government district | Cologne |
| 7 | District/Independent city | Cologne (City) |
| 8 | Municipal association | - |
| 9 | Municipality | City district areas |
| 10 | City district | Ehrenfeld, Nippes |

### Configuration in Markdown

```markdown
---
title: "Cologne"
wp_name: "de-Cologne"
osmAdminLevels: [6, 7, 8, 9, 10]
osm_refinement: "boundary=administrative"
---
```

## 🚧 Planned Extensions

### Feature-to-OSM Mapping

**Status:** Not yet implemented

**Planned Mapping Table:**

| p2d2 Property | OSM Tag | Description |
|---------------|---------|-------------|
| `type: "playground"` | `leisure=playground` | Playground |
| `type: "cemetery"` | `landuse=cemetery` | Cemetery |
| `name: "..."` | `name=...` | Feature name |
| `wp_name: "de-Cologne"` | `wikipedia=de:Cologne` | Wikipedia link |

**Example Mapping:**

```typescript
// p2d2 Feature → OSM Tags
const p2d2Feature = {
  name: "Playground Example Street",
  type: "playground",
  wp_name: "de-Cologne"
};

// Becomes OSM Tags:
const osmTags = {
  "leisure": "playground",
  "name": "Playground Example Street",
  "wikipedia": "de:Cologne"
};
```

### OSM-XML Export

**Status:** Not yet implemented

**Planned XML Format:**

```xml
<osm version="0.6" generator="p2d2">
  <node id="-1" lat="50.9413" lon="6.9583" version="1">
    <tag k="leisure" v="playground"/>
    <tag k="name" v="Playground Example Street"/>
    <tag k="wikipedia" v="de:Cologne"/>
  </node>
  <way id="-2" version="1">
    <nd ref="-1"/>
    <!-- additional nodes -->
    <tag k="leisure" v="playground"/>
  </way>
</osm>
```

### Overpass-API Integration

**Status:** Not yet implemented

**Planned Queries:**

```javascript
// Example query for Cologne
const overpassQuery = `
[out:json][timeout:25];
(
  relation["boundary"="administrative"]["admin_level"="6"]["name"="Cologne"];
  relation["boundary"="administrative"]["admin_level"="7"]["name"="Cologne"];
  relation["boundary"="administrative"]["admin_level"="8"]["name"="Cologne"];
  relation["boundary"="administrative"]["admin_level"="9"]["name"="Cologne"];
  relation["boundary"="administrative"]["admin_level"="10"]["name"="Cologne"];
);
out body;
>;
out skel qt;
`;

// Bounding box query for features
const bboxQuery = `
[out:json][timeout:25];
(
  way["leisure"="playground"]({{bbox}});
  way["landuse"="cemetery"]({{bbox}});
);
out body;
>;
out skel qt;
`;
```

### OSM Authentication

**Status:** Not yet implemented

**Planned Methods:**

- OAuth 1.0a for OSM API
- API tokens for Overpass API
- Credential management with environment variables

## Data Validation

### OSM Tag Validation

**Planned Rules:**

```typescript
interface OSMTagValidation {
  required: string[];
  optional: string[];
  constraints: {
    [key: string]: RegExp | Function;
  };
}

const tagSchemas: { [type: string]: OSMTagValidation } = {
  playground: {
    required: ['leisure'],
    optional: ['name', 'wikipedia', 'operator'],
    constraints: {
      leisure: /^playground$/,
      name: (value: string) => value.length > 0 && value.length < 255
    }
  },
  cemetery: {
    required: ['landuse'],
    optional: ['name', 'religion', 'denomination'],
    constraints: {
      landuse: /^cemetery$/,
      religion: /^(christian|jewish|muslim|none)$/
    }
  }
};
```

### Geometry Validation

**Planned Checks:**

- Avoid self-intersecting polygons
- Minimum/maximum size for features
- Coordinates in valid range
- Topological correctness

## Coordinate Systems

### Transformations

**Current:**
- p2d2: EPSG:25832 (UTM 32N)
- OSM: EPSG:4326 (WGS84)

**Planned Transformation:**

```typescript
import { transform } from 'ol/proj';

function toOSMCoordinates(feature: Feature): Feature {
  const geometry = feature.getGeometry();
  if (geometry) {
    const transformed = geometry.clone();
    transformed.transform('EPSG:25832', 'EPSG:4326');
    feature.setGeometry(transformed);
  }
  return feature;
}
```

## Usage (Planned)

### OSM Export Workflow

```typescript
// 1. Load feature from p2d2
const feature = getFeatureFromP2D2('playground-123');

// 2. Map to OSM tags
const osmTags = mapToOSMTags(feature);

// 3. Transform coordinates
const osmFeature = toOSMCoordinates(feature);

// 4. Generate OSM XML
const osmXML = generateOSMXML(osmFeature, osmTags);

// 5. Upload to OSM
const result = await uploadToOSM(osmXML);
```

### Overpass Import Workflow

```typescript
// 1. Overpass query for area
const query = buildOverpassQuery(bbox, featureTypes);

// 2. Fetch data from Overpass API
const osmData = await fetchOverpassData(query);

// 3. Convert to p2d2 features
const p2d2Features = convertFromOSM(osmData);

// 4. Save to p2d2
await saveToP2D2(p2d2Features);
```

## Dependencies

### Current Dependencies

- **TypeScript Interfaces:** OSM data structures
- **Content Collections:** OSM metadata in markdown
- **GeoJSON:** Geometry format

### Planned Dependencies

- **OSM API Client:** For uploads to OSM
- **Overpass API Client:** For data import
- **OAuth Library:** For authentication
- **XML Parser:** For OSM XML processing

## Best Practices

### OSM Compliance

- **Tagging:** Follow established OSM tagging conventions
- **Geometry:** Use simple, non-self-intersecting polygons
- **Metadata:** Add meaningful descriptions and sources
- **License:** Ensure data is licensed under ODbL

### Performance

- **Batch Processing:** Process multiple features together
- **Caching:** Cache Overpass API responses
- **Rate Limiting:** Respect OSM API limits
- **Incremental Updates:** Load only changed data

### Error Handling

- **Network Issues:** Retry logic with exponential backoff
- **API Limits:** Automatic pauses for rate limiting
- **Validation Errors:** Detailed error messages
- **Conflict Resolution:** Merge strategies for conflicts

## Quality Assurance

### Data Quality

- **Validation:** Automatic checking before OSM upload
- **Consistency:** Consistent tagging across all features
- **Completeness:** Complete metadata for all features
- **Accuracy:** Correct geometries and positions

### Testing

- **Unit Tests:** For mapping functions
- **Integration Tests:** For API integrations
- **E2E Tests:** For complete export/import workflows
- **Mock Server:** For OSM API and Overpass API

### Monitoring

- **Sync Status:** Monitoring of synchronization status
- **Error Rates:** Monitoring of error rates
- **Performance:** Latency metrics for API calls
- **Data Quality:** Metrics for data consistency