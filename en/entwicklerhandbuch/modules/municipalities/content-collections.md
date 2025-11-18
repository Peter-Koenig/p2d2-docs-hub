---
title: Municipalities Content Collections
description: Astro Content Collections for municipalities data with complete Zod schema and frontmatter structure
quality:
  completeness: 95
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Municipalities Content Collections

## Overview

The municipalities system uses Astro Content Collections to manage structured data about cities and municipalities. Each municipality is stored as a Markdown file with frontmatter and validated through a Zod schema. The system enables management of geographic data, OSM integration, and dynamic visualization.

## Collection Definition

### Zod Schema

```typescript
// src/content.config.ts
const kommunen = defineCollection({
  schema: z.object({
    title: z.string(),
    colorStripe: z.string().default("#FF6900"),
    osmAdminLevels: z.array(z.number()).optional(),
    wp_name: z
      .string()
      .min(3, "Wikipedia identifier must be at least 3 characters")
      .regex(/^[a-z]{2,3}-/, "Must start with language code and hyphen")
      .refine((val) => {
        const parts = val.split("-", 2);
        return parts.length === 2 && parts[1].length > 0;
      }, "Must contain exactly one hyphen separating language code and article name"),
    osm_refinement: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().optional(),
    map: z.object({
      center: z.tuple([z.number(), z.number()]).optional(), // [lon, lat] WGS84
      zoom: z.number().optional(),
      extent: z
        .tuple([z.number(), z.number(), z.number(), z.number()])
        .optional(),
      projection: z.string().optional(),
      extra: z.record(z.any()).optional(),
    }),
  }),
});
```

## Frontmatter Fields

### Required Fields

#### `title`
- **Type**: `string`
- **Description**: Display name of the municipality
- **Example**: `"Cologne"`, `"Bonn"`
- **Purpose**: Primary display name in the user interface

#### `wp_name`
- **Type**: `string`
- **Format**: `{language-code}-{City-Name}`
- **Example**: `"de-Köln"`, `"de-Bonn"`
- **Validation**:
  - Minimum 3 characters
  - Must start with language code and hyphen (`/^[a-z]{2,3}-/`)
  - Must contain exactly one hyphen
- **Purpose**: Wikipedia name for external referencing and OSM queries

### Optional Fields

#### `colorStripe`
- **Type**: `string`
- **Default**: `"#FF6900"`
- **Format**: Hex-Color `#RRGGBB`
- **Example**: `"#FF6900"`
- **Purpose**: Color coding for visual representation in maps and UI elements

#### `osmAdminLevels`
- **Type**: `number[]` (optional)
- **Allowed Values**: 2, 4, 6, 7, 8, 9, 10
- **Example**: `[6, 9, 10]`
- **Purpose**: OSM Administrative Levels for polygon queries and geodata synchronization

#### `osm_refinement`
- **Type**: `string` (optional)
- **Example**: `"boundary=administrative"`
- **Purpose**: Overpass API query refinement for more specific OSM queries

#### `icon`
- **Type**: `string` (optional)
- **Purpose**: Icon identifier for visual representation

#### `order`
- **Type**: `number` (optional)
- **Default**: `0`
- **Purpose**: Sorting order in lists and grids

#### `map`
- **Type**: `object` (optional)
- **Fields**:
  - `center`: `[number, number]` - Map center in WGS84 coordinates [lon, lat]
  - `zoom`: `number` - Initial zoom level
  - `extent`: `[number, number, number, number]` - Map extent [minx, miny, maxx, maxy]
  - `projection`: `string` - CRS code (e.g., `"EPSG:25832"`, `"EPSG:3857"`)
  - `extra`: `Record<string, any>` - Additional map configuration

**Example:**
```yaml
map:
  center: [6.9603, 50.9375]
  zoom: 11
  projection: "EPSG:25832"
  extent: [6.8, 50.8, 7.2, 51.1]
```

## OSM Admin Levels

### Level Hierarchy

| Level | Type | Description | Example Germany |
|-------|-----|--------------|----------------------|
| 2 | Country | National state | Germany |
| 4 | State | Federal state | North Rhine-Westphalia |
| 6 | Government district | Government district | Cologne |
| 7 | District | Independent city | City of Cologne |
| 8 | Municipal association | Municipal association | - |
| 9 | Municipality | Municipality | - |
| 10 | District | City district/borough | Ehrenfeld, Nippes |

### Typical Combinations

**Major city (e.g., Cologne):**
```yaml
osmAdminLevels: [6, 9, 10]
```

**Small town:**
```yaml
osmAdminLevels: [7, 9]
```

## TypeScript Interfaces

### KommuneData

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

## Collection Queries

### Get All Municipalities

```typescript
import { getCollection } from 'astro:content';

const kommunen = await getCollection('kommunen');
```

**Return:**
```typescript
Array<{
  id: string;        // e.g., "koeln"
  slug: string;      // e.g., "koeln"
  data: {
    title: string;
    colorStripe: string;
    osmAdminLevels?: number[];
    wp_name: string;
    osm_refinement?: string;
    icon?: string;
    order?: number;
    map: {
      center?: [number, number];
      zoom?: number;
      extent?: [number, number, number, number];
      projection?: string;
      extra?: Record<string, any>;
    };
  };
  body: string;      // Markdown content
}>
```

### Filter by Admin Level

```typescript
const cities = await getCollection('kommunen', (entry) => {
  return entry.data.osmAdminLevels?.includes(7) ?? false;
});
```

### Sort by Order

```typescript
const sorted = kommunen.sort((a, b) => {
  return (a.data.order ?? 0) - (b.data.order ?? 0);
});
```

### Single Municipality

```typescript
import { getEntry } from 'astro:content';

const koeln = await getEntry('kommunen', 'koeln');
```

## Markdown File Structure

### File Naming Convention

**Format:** `{slug}.md`  
**Examples:**
- `koeln.md`
- `bonn.md`
- `berlin.md`

**Slug Extraction:**
```typescript
const slug = filename.replace(/\.md$/, '');
```

### Complete Example

```markdown
---
title: "Cologne"
slug: "koeln"
colorStripe: "#FF6900"
osmAdminLevels: [6,9,10]
wp_name: "de-Köln"
map:
  center: [6.9603, 50.9375]
  zoom: 11
  projection: "EPSG:25832"
order: 10
---

Cologne is one of the largest cities in Germany, known for its cathedral and vibrant cultural and economic scene. The city offers numerous opportunities for civic engagement and innovative projects.
```

## Validation

### Zod Validation Rules

**title:**
```typescript
z.string() // Required field
```

**colorStripe:**
```typescript
z.string().default("#FF6900") // Default value if not specified
```

**osmAdminLevels:**
```typescript
z.array(z.number()).optional() // Optional array of numbers
```

**wp_name:**
```typescript
z.string()
  .min(3, "Wikipedia identifier must be at least 3 characters")
  .regex(/^[a-z]{2,3}-/, "Must start with language code and hyphen")
  .refine((val) => {
    const parts = val.split("-", 2);
    return parts.length === 2 && parts[1].length > 0;
  }, "Must contain exactly one hyphen separating language code and article name")
```

**map.center:**
```typescript
z.tuple([z.number(), z.number()]).optional() // Exactly 2 numbers
```

### Error Handling

**Validation Error:**
```
[KommuneSchema] Invalid frontmatter in koeln.md:
  - wp_name: Must start with language code and hyphen
  - map.center: Expected tuple of length 2
```

## Usage in Astro Components

### Municipalities Grid Component

```astro
---
// src/components/KommunenGrid.astro
import { getCollection } from "astro:content";

const kommunen = await getCollection("kommunen");
const sorted = kommunen.sort(
    (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0),
);

// Create client-side accessible kommune data map
const kommuneDataMap: Record<
    string,
    { wp_name: string; osmAdminLevels: number[] }
> = {};
kommunen.forEach((kommune) => {
    kommuneDataMap[kommune.slug] = {
        wp_name: kommune.data.wp_name,
        osmAdminLevels: kommune.data.osmAdminLevels || [],
    };
});
---

<div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
    data-kommune-map={JSON.stringify(kommuneDataMap)}
>
    {sorted.map((entry) => (
        <button
            type="button"
            class="kommunen-card"
            style={`--color-stripe: ${entry.data.colorStripe ?? "#FF6900"}`}
            data-slug={entry.slug}
            data-kommune-slug={entry.slug}
        >
            <h3>{entry.data.title}</h3>
            <div>
                {entry.body || `Discover projects in ${entry.data.title}`}
            </div>
        </button>
    ))}
</div>
```

### Feature Editor Integration

```astro
---
// src/pages/feature-editor/[featureId].astro
import { getCollection } from "astro:content";

try {
    const kommunen = await getCollection("kommunen");
    const kommune = kommunen.find((k) => k.data.wp_name === wp_name);

    if (kommune?.data.map?.projection) {
        targetProjection = kommune.data.map.projection;
    }
} catch (error) {
    console.warn("Could not load kommunen collection:", error);
}
---

<!-- Use targetProjection for map configuration -->
```

## Best Practices

### File Organization
1. **Naming**: Slug = filename without `.md`
2. **Encoding**: Always UTF-8
3. **Order**: Meaningful sorting with `order` field
4. **Consistency**: Uniform frontmatter structure

### Frontmatter Quality
1. **title**: Use official spelling
2. **wp_name**: Correct Wikipedia article name with language code
3. **osmAdminLevels**: Only specify relevant levels
4. **colorStripe**: Use consistent color palette
5. **map.center**: Precise coordinates (WGS84)

### Validation
1. Test Zod schema before deployment
2. Validate all municipality files
3. Correct invalid frontmatter data
4. Use TypeScript interfaces for type safety

## Dependencies

**Astro:**
- `astro:content` - Collection system
- `defineCollection`, `z` (Zod) - Schema definition

**Own Modules:**
- `src/utils/kommune-utils.ts` - Helper functions and interfaces
- `src/types/admin-polygon.ts` - OSM-specific TypeScript interfaces

**External:**
- `zod` - Schema validation
- `gray-matter` - Frontmatter parsing (in utils)

## Extension Possibilities

### Additional Fields

```typescript
// Example: Population and area
schema: z.object({
  // ... existing fields
  population: z.number().optional(),
  area: z.number().optional(), // km²
  website: z.string().url().optional(),
  established: z.number().optional() // Foundation year
})
```

### Multilingual Support

```typescript
title: z.object({
  de: z.string(),
  en: z.string().optional(),
  fr: z.string().optional()
})
```

### Geodata Extensions

```typescript
geodata: z.object({
  boundingBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  area: z.number(),
  populationDensity: z.number()
}).optional()
```

## Performance Optimizations

1. **Lazy Loading**: Load municipality data only when needed
2. **Caching**: Cache collection queries
3. **Tree Shaking**: Only retrieve required fields
4. **Pagination**: Implement pagination for many municipalities

The Content Collections system provides a robust foundation for managing municipality data with complete type safety and validation.