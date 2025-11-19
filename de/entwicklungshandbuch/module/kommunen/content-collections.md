---
title: Kommunen Content Collections
description: Astro Content Collections für Kommunen-Daten mit vollständigem Zod-Schema und Frontmatter-Struktur
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Kommunen Content Collections

## Übersicht

Das Kommunen-System nutzt Astro Content Collections, um strukturierte Daten über Städte und Gemeinden zu verwalten. Jede Kommune wird als Markdown-Datei mit Frontmatter gespeichert und durch ein Zod-Schema validiert. Das System ermöglicht die Verwaltung von geografischen Daten, OSM-Integration und dynamische Visualisierung.

## Collection-Definition

### Zod-Schema

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

## Frontmatter-Felder

### Pflichtfelder

#### `title`
- **Typ**: `string`
- **Beschreibung**: Anzeigename der Kommune
- **Beispiel**: `"Köln"`, `"Bonn"`
- **Zweck**: Primärer Anzeigename in der Benutzeroberfläche

#### `wp_name`
- **Typ**: `string`
- **Format**: `{language-code}-{City-Name}`
- **Beispiel**: `"de-Köln"`, `"de-Bonn"`
- **Validierung**: 
  - Mindestens 3 Zeichen
  - Muss mit Sprachcode und Bindestrich beginnen (`/^[a-z]{2,3}-/`)
  - Muss genau einen Bindestrich enthalten
- **Zweck**: Wikipedia-Name für externe Referenzierung und OSM-Abfragen

### Optionale Felder

#### `colorStripe`
- **Typ**: `string`
- **Default**: `"#FF6900"`
- **Format**: Hex-Color `#RRGGBB`
- **Beispiel**: `"#FF6900"`
- **Zweck**: Farbkodierung für visuelle Darstellung in Karten und UI-Elementen

#### `osmAdminLevels`
- **Typ**: `number[]` (optional)
- **Erlaubte Werte**: 2, 4, 6, 7, 8, 9, 10
- **Beispiel**: `[6, 9, 10]`
- **Zweck**: OSM Administrative Levels für Polygon-Abfragen und Geodaten-Synchronisation

#### `osm_refinement`
- **Typ**: `string` (optional)
- **Beispiel**: `"boundary=administrative"`
- **Zweck**: Overpass-API-Query-Verfeinerung für spezifischere OSM-Abfragen

#### `icon`
- **Typ**: `string` (optional)
- **Zweck**: Icon-Identifier für visuelle Darstellung

#### `order`
- **Typ**: `number` (optional)
- **Default**: `0`
- **Zweck**: Sortierreihenfolge in Listen und Grids

#### `map`
- **Typ**: `object` (optional)
- **Felder**:
  - `center`: `[number, number]` - Kartenmittelpunkt in WGS84-Koordinaten [lon, lat]
  - `zoom`: `number` - Initial-Zoom-Stufe
  - `extent`: `[number, number, number, number]` - Kartenausdehnung [minx, miny, maxx, maxy]
  - `projection`: `string` - CRS-Code (z.B. `"EPSG:25832"`, `"EPSG:3857"`)
  - `extra`: `Record<string, any>` - Zusätzliche Kartenkonfiguration

**Beispiel:**
```yaml
map:
  center: [6.9603, 50.9375]
  zoom: 11
  projection: "EPSG:25832"
  extent: [6.8, 50.8, 7.2, 51.1]
```

## OSM Admin Levels

### Level-Hierarchie

| Level | Typ | Beschreibung | Beispiel Deutschland |
|-------|-----|--------------|----------------------|
| 2 | Land | Nationalstaat | Deutschland |
| 4 | Bundesland | Bundesland | Nordrhein-Westfalen |
| 6 | Regierungsbezirk | Regierungsbezirk | Köln |
| 7 | Kreis | Kreisfreie Stadt | Stadt Köln |
| 8 | Gemeindeverband | Gemeindeverband | - |
| 9 | Gemeinde | Gemeinde | - |
| 10 | Stadtteil | Stadtteil/Bezirk | Ehrenfeld, Nippes |

### Typische Kombinationen

**Großstadt (z.B. Köln):**
```yaml
osmAdminLevels: [6, 9, 10]
```

**Kleinstadt:**
```yaml
osmAdminLevels: [7, 9]
```

## TypeScript-Interfaces

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

### OSM-Polygon-Interfaces

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

## Collection-Queries

### Alle Kommunen abrufen

```typescript
import { getCollection } from 'astro:content';

const kommunen = await getCollection('kommunen');
```

**Rückgabe:**
```typescript
Array<{
  id: string;        // z.B. "koeln"
  slug: string;      // z.B. "koeln"
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
  body: string;      // Markdown-Content
}>
```

### Filtern nach Admin Level

```typescript
const cities = await getCollection('kommunen', (entry) => {
  return entry.data.osmAdminLevels?.includes(7) ?? false;
});
```

### Sortieren nach Order

```typescript
const sorted = kommunen.sort((a, b) => {
  return (a.data.order ?? 0) - (b.data.order ?? 0);
});
```

### Einzelne Kommune

```typescript
import { getEntry } from 'astro:content';

const koeln = await getEntry('kommunen', 'koeln');
```

## Markdown-Dateistruktur

### Dateinamen-Konvention

**Format:** `{slug}.md`  
**Beispiele:**
- `koeln.md`
- `bonn.md`
- `berlin.md`

**Slug-Extraktion:**
```typescript
const slug = filename.replace(/\.md$/, '');
```

### Vollständiges Beispiel

```markdown
---
title: "Köln"
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

Köln ist eine der größten Städte Deutschlands und bekannt für ihren Dom sowie ihre lebendige Kultur- und Wirtschaftsszene. Die Stadt bietet zahlreiche Möglichkeiten für bürgerschaftliches Engagement und innovative Projekte.
```

## Validierung

### Zod-Validierungsregeln

**title:**
```typescript
z.string() // Pflichtfeld
```

**colorStripe:**
```typescript
z.string().default("#FF6900") // Default-Wert falls nicht angegeben
```

**osmAdminLevels:**
```typescript
z.array(z.number()).optional() // Optionales Array von Zahlen
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
z.tuple([z.number(), z.number()]).optional() // Exakt 2 Zahlen
```

### Fehlerbehandlung

**Validation Error:**
```
[KommuneSchema] Invalid frontmatter in koeln.md:
  - wp_name: Must start with language code and hyphen
  - map.center: Expected tuple of length 2
```

## Verwendung in Astro-Komponenten

### Kommunen-Grid-Komponente

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
                {entry.body || `Entdecke Projekte in ${entry.data.title}`}
            </div>
        </button>
    ))}
</div>
```

### Feature-Editor Integration

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

<!-- Verwende targetProjection für Karten-Konfiguration -->
```

## Best Practices

### Datei-Organisation
1. **Naming**: Slug = Dateiname ohne `.md`
2. **Encoding**: Immer UTF-8
3. **Order**: Sinnvolle Sortierung mit `order`-Feld
4. **Konsistenz**: Einheitliche Frontmatter-Struktur

### Frontmatter-Qualität
1. **title**: Offizielle Schreibweise verwenden
2. **wp_name**: Korrekter Wikipedia-Artikelname mit Sprachcode
3. **osmAdminLevels**: Nur relevante Levels angeben
4. **colorStripe**: Konsistente Farbpalette nutzen
5. **map.center**: Präzise Koordinaten (WGS84)

### Validierung
1. Zod-Schema vor Deployment testen
2. Alle Kommunen-Dateien validieren
3. Fehlerhafte Frontmatter-Daten korrigieren
4. TypeScript-Interfaces für Type-Safety nutzen

## Abhängigkeiten

**Astro:**
- `astro:content` - Collection-System
- `defineCollection`, `z` (Zod) - Schema-Definition

**Eigene Module:**
- `src/utils/kommune-utils.ts` - Helper-Funktionen und Interfaces
- `src/types/admin-polygon.ts` - OSM-spezifische TypeScript-Interfaces

**Externe:**
- `zod` - Schema-Validierung
- `gray-matter` - Frontmatter-Parsing (in Utils)

## Erweiterungsmöglichkeiten

### Zusätzliche Felder

```typescript
// Beispiel: Einwohnerzahl und Fläche
schema: z.object({
  // ... bestehende Felder
  population: z.number().optional(),
  area: z.number().optional(), // km²
  website: z.string().url().optional(),
  established: z.number().optional() // Gründungsjahr
})
```

### Mehrsprachigkeit

```typescript
title: z.object({
  de: z.string(),
  en: z.string().optional(),
  fr: z.string().optional()
})
```

### Geodaten-Erweiterung

```typescript
geodata: z.object({
  boundingBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  area: z.number(),
  populationDensity: z.number()
}).optional()
```

## Performance-Optimierungen

1. **Lazy Loading**: Kommunen-Daten nur bei Bedarf laden
2. **Caching**: Collection-Queries cachen
3. **Tree Shaking**: Nur benötigte Felder abrufen
4. **Pagination**: Bei vielen Kommunen Pagination implementieren

Das Content Collections System bietet eine robuste Grundlage für die Verwaltung von Kommunen-Daten mit vollständiger Type-Safety und Validierung.