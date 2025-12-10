---
title: Kommune Data Management
description: Comprehensive documentation for municipalities data management and processing
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# Kommune Data Management

> **Status:** ✅ Fully documented

## Overview

The Kommune Utilities in p2d2 provide central management for municipality data from Astro Content Collections. These modules enable dynamic loading, filtering, and processing of municipality information with fallback mechanisms for different execution contexts (browser, CLI, tests).

## Main Modules

### 1. Kommune Utilities (`kommune-utils.ts`)

Central management for municipality data with Content Collection integration.

#### Data Structures

```typescript
// Main interface for municipality data
export interface KommuneData {
  slug: string;                    // Unique identifier
  title: string;                   // Display name
  osmAdminLevels?: number[];       // OSM Administrative Levels
  wp_name: string;                 // Wikipedia name for OSM queries
  osm_refinement?: string;         // OSM refinement parameters
  colorStripe: string;            // Color stripe for UI
  map: {
    center: [number, number];      // Map center [lon, lat]
    zoom: number;                  // Default zoom level
    projection: string;            // Map projection
    extent?: [number, number, number, number]; // Bounding box
    extra?: Record<string, any>;   // Additional map configuration
  };
  order?: number;                  // Sort order
  icon?: string;                   // Icon for UI display
}

// Default municipality configuration
export const DEFAULT_KOMMUNE_SLUG = "koeln";
```

#### Core Functions

```typescript
// Load all municipalities (with fallback for CLI/Test)
export async function getAllKommunen(): Promise<KommuneData[]>

// Load specific municipality by slug
export async function getKommuneBySlug(slug: string): Promise<KommuneData | null>

// OSM data validation
export function hasValidOSMData(kommune: KommuneData): boolean

// Prepare municipalities for sync
export async function getKommunenReadyForSync(): Promise<KommuneData[]>
```

### 2. Dynamic Collection Loading

#### Adaptive Loading Logic

```typescript
// Detects at runtime if Astro runtime is available
async function loadCollection() {
  try {
    // Astro Content Collection API
    const { getCollection } = await import("astro:content");
    return getCollection("kommunen");
  } catch {
    // Fallback: Read files directly (CLI/Test context)
    const dir = join(process.cwd(), "src/content/kommunen");
    return readdirSync(dir)
      .filter((f) => [".md", ".mdx"].includes(extname(f)))
      .map((f) => {
        const raw = readFileSync(join(dir, f), "utf-8");
        const { data } = matter(raw);
        return { slug: f.replace(/\.(mdx?)$/, ""), data };
      });
  }
}
```

## Practical Usage

### Basic Integration

```typescript
import { 
  getAllKommunen, 
  getKommuneBySlug, 
  hasValidOSMData,
  DEFAULT_KOMMUNE_SLUG 
} from '../utils/kommune-utils';

// 1. Load all municipalities
const kommunen = await getAllKommunen();
console.log(`Loaded municipalities: ${kommunen.length}`);

// 2. Load specific municipality
const koeln = await getKommuneBySlug('koeln');
if (koeln) {
  console.log(`Cologne center: ${koeln.map.center}`);
}

// 3. Validate OSM data
const validKommunen = kommunen.filter(hasValidOSMData);
console.log(`Municipalities with OSM data: ${validKommunen.length}`);

// 4. Sync-ready municipalities
const syncReady = await getKommunenReadyForSync();
console.log(`Sync-ready municipalities: ${syncReady.length}`);
```

### Advanced Usage

```typescript
// Filter municipalities by region
function getKommunenByRegion(kommunen: KommuneData[], region: string) {
  return kommunen.filter(k => 
    k.slug.toLowerCase().includes(region.toLowerCase())
  );
}

// Municipalities with specific OSM levels
function getKommunenByAdminLevel(kommunen: KommuneData[], level: number) {
  return kommunen.filter(k => 
    k.osmAdminLevels?.includes(level)
  );
}

// Sorted list of municipalities
function getSortedKommunen(kommunen: KommuneData[]) {
  return [...kommunen].sort((a, b) => 
    (a.order ?? 999) - (b.order ?? 999)
  );
}
```

### Integration with Map System

```typescript
import { getAllKommunen } from '../utils/kommune-utils';
import { dispatchKommunenFocus } from '../utils/events';

// Prepare municipalities for UI components
async function prepareKommunenForUI() {
  const kommunen = await getAllKommunen();
  
  return kommunen.map(kommune => ({
    ...kommune,
    // Add UI-specific properties
    displayName: kommune.title,
    isSelectable: hasValidOSMData(kommune),
    color: kommune.colorStripe || '#FF6900'
  }));
}

// Navigate map to municipality
function navigateToKommune(kommune: KommuneData) {
  if (!hasValidOSMData(kommune)) {
    console.warn(`Municipality ${kommune.slug} has no valid OSM data`);
    return;
  }
  
  dispatchKommunenFocus({
    center: kommune.map.center,
    zoom: kommune.map.zoom,
    projection: kommune.map.projection,
    slug: kommune.slug,
    extra: kommune.map.extra
  });
}
```

## Configuration

### Frontmatter Structure

```yaml
# src/content/kommunen/koeln.md
---
title: "Cologne"
osmAdminLevels: [7, 8, 9, 10]
wp_name: "Köln"
osm_refinement: "admin_level=7"
colorStripe: "#FF6900"
order: 1
icon: "🏙️"

map:
  center: [6.95, 50.94]
  zoom: 11
  projection: "EPSG:3857"
  extent: [6.75, 50.8, 7.15, 51.1]
  extra:
    minZoom: 9
    maxZoom: 18
---
```

### OSM Admin Level Configuration

```typescript
// Standard OSM Admin Levels for German municipalities
const GERMAN_ADMIN_LEVELS = {
  BUNDESLAND: 4,      // Federal State (e.g., North Rhine-Westphalia)
  REGIERUNGSBEZIRK: 5, // Governmental District (e.g., Cologne)
  KREIS: 6,           // District/Independent City
  GEMEINDE: 7,        // Municipality/City
  STADTTEIL: 8,       // City District/Borough
  ORTSTEIL: 9,        // Locality
  STADTVIERTEL: 10    // Neighborhood
};

// Example configurations
const KOMMUNE_CONFIGS = {
  KOELN: {
    levels: [7, 8, 9, 10], // City -> Districts -> Neighborhoods
    refinement: "admin_level=7"
  },
  MUENCHEN: {
    levels: [7, 8, 9],
    refinement: "admin_level=7"
  },
  BERLIN: {
    levels: [4, 7, 8, 9], // State -> Districts -> Localities
    refinement: "admin_level=4"
  }
};
```

## Performance Optimizations

### 1. Caching Strategies

```typescript
// In-memory cache for municipality data
let kommunenCache: KommuneData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedKommunen(): Promise<KommuneData[]> {
  const now = Date.now();
  
  if (kommunenCache && (now - cacheTimestamp) < CACHE_TTL) {
    return kommunenCache;
  }
  
  kommunenCache = await getAllKommunen();
  cacheTimestamp = now;
  return kommunenCache;
}
```

### 2. Lazy Loading

```typescript
// Load municipalities only when needed
class LazyKommuneLoader {
  private kommunen: Promise<KommuneData[]> | null = null;
  
  loadKommunen(): Promise<KommuneData[]> {
    if (!this.kommunen) {
      this.kommunen = getAllKommunen();
    }
    return this.kommunen;
  }
  
  async getKommune(slug: string): Promise<KommuneData | null> {
    const kommunen = await this.loadKommunen();
    return kommunen.find(k => k.slug === slug) || null;
  }
}
```

### 3. Batch Processing

```typescript
// Execute multiple operations simultaneously
async function processMultipleKommunen(slugs: string[]) {
  const kommunen = await getAllKommunen();
  const results = await Promise.allSettled(
    slugs.map(slug => {
      const kommune = kommunen.find(k => k.slug === slug);
      return kommune ? processKommune(kommune) : null;
    })
  );
  
  return results.filter(result => 
    result.status === 'fulfilled' && result.value !== null
  ).map(result => (result as PromiseFulfilledResult<any>).value);
}
```

## Error Handling

### Robust Data Loading

```typescript
import { logger } from '../utils/logger';

async function safeGetAllKommunen(): Promise<KommuneData[]> {
  try {
    return await getAllKommunen();
  } catch (error) {
    logger.error("Error loading municipalities", error);
    
    // Fallback: Default municipalities
    return [{
      slug: DEFAULT_KOMMUNE_SLUG,
      title: "Cologne",
      wp_name: "Köln",
      colorStripe: "#FF6900",
      map: {
        center: [6.95, 50.94],
        zoom: 11,
        projection: "EPSG:3857"
      }
    }];
  }
}
```

### Validation of Kommune Data

```typescript
function validateKommuneData(kommune: any): KommuneData | null {
  if (!kommune?.slug || !kommune?.title || !kommune?.wp_name) {
    logger.warn("Invalid municipality data: Missing required fields", kommune);
    return null;
  }
  
  if (!kommune.map?.center || !Array.isArray(kommune.map.center)) {
    logger.warn("Invalid map configuration", kommune);
    return null;
  }
  
  // Transformation to validated type
  return {
    slug: kommune.slug,
    title: kommune.title,
    osmAdminLevels: kommune.osmAdminLevels || [],
    wp_name: kommune.wp_name,
    osm_refinement: kommune.osm_refinement,
    colorStripe: kommune.colorStripe || "#FF6900",
    map: {
      center: kommune.map.center,
      zoom: kommune.map.zoom || 11,
      projection: kommune.map.projection || "EPSG:3857",
      extent: kommune.map.extent,
      extra: kommune.map.extra
    },
    order: kommune.order,
    icon: kommune.icon
  };
}
```

## Best Practices

### 1. Data Consistency

```typescript
// ✅ Correct - Full validation
async function getValidatedKommune(slug: string): Promise<KommuneData | null> {
  const kommune = await getKommuneBySlug(slug);
  if (!kommune) return null;
  
  if (!hasValidOSMData(kommune)) {
    logger.warn(`Municipality ${slug} has no valid OSM data`);
    return null;
  }
  
  return kommune;
}

// ❌ Avoid - Unchecked data
const kommune = await getKommuneBySlug(slug);
// Direct usage without validation
```

### 2. Error Handling

```typescript
// ✅ Correct - Comprehensive error handling
async function loadKommuneWithFallback(slug: string) {
  try {
    const kommune = await getKommuneBySlug(slug);
    if (!kommune) {
      throw new Error(`Municipality ${slug} not found`);
    }
    return kommune;
  } catch (error) {
    logger.error(`Error loading ${slug}`, error);
    
    // Fallback to default municipality
    return await getKommuneBySlug(DEFAULT_KOMMUNE_SLUG);
  }
}

// ❌ Avoid - Unhandled errors
const kommune = getKommuneBySlug(slug); // No error handling
```

### 3. Performance

```typescript
// ✅ Correct - Efficient data processing
async function getKommunenForMap() {
  const kommunen = await getAllKommunen();
  
  // Select only necessary fields
  return kommunen.map(k => ({
    slug: k.slug,
    title: k.title,
    center: k.map.center,
    zoom: k.map.zoom,
    isSelectable: hasValidOSMData(k)
  }));
}

// ❌ Avoid - Inefficient operations
// Transferring complete data structure even if not needed
```

## Dependencies

### External Libraries

  - **gray-matter** - Frontmatter parsing (fallback mode)
  - **fs/path** - File system operations (Node.js)

### Internal Dependencies

  - `astro:content` - Astro Content Collections (primary mode)
  - `../utils/logger` - Logging infrastructure
  - `../utils/events` - Event system for navigation

## Testing

### Unit Tests

```typescript
// Example for Kommune-Utils tests
describe('Kommune Utilities', () => {
  it('should load all kommunen', async () => {
    const kommunen = await getAllKommunen();
    expect(kommunen).toBeInstanceOf(Array);
    expect(kommunen.length).toBeGreaterThan(0);
  });
  
  it('should validate OSM data correctly', () => {
    const validKommune = { wp_name: 'Köln', osmAdminLevels: [7], map: { center: [0,0] } };
    const invalidKommune = { wp_name: '', osmAdminLevels: [], map: { center: null } };
    
    expect(hasValidOSMData(validKommune)).toBe(true);
    expect(hasValidOSMData(invalidKommune)).toBe(false);
  });
  
  it('should handle missing kommune gracefully', async () => {
    const kommune = await getKommuneBySlug('nonexistent');
    expect(kommune).toBeNull();
  });
});
```

## These Kommune Data Management utilities form the foundation for dynamic management and processing of municipality data in p2d2, with robust fallback mechanisms and comprehensive TypeScript support.