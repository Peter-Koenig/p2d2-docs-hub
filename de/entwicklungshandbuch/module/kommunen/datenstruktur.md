---
title: Datenstruktur
description: "Dokumentation der Datenstrukturen für Kommunen-Daten: TypeScript-Interfaces, OSM-Strukturen, GeoJSON-Format"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Datenstruktur

## Übersicht

Dieses Dokument beschreibt die vollständige Datenstruktur des Kommunen-Systems in p2d2. Es umfasst TypeScript-Interfaces, OSM-Datenstrukturen, GeoJSON-Formate und Helper-Funktionen für die Verwaltung von Kommunen-Daten.

## TypeScript-Interfaces

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

**Feld-Dokumentation:**

| Feld | Typ | Beschreibung | Beispiel |
|------|-----|--------------|----------|
| `slug` | `string` | Eindeutiger Identifier der Kommune | `"koeln"`, `"bonn"` |
| `title` | `string` | Anzeigename der Kommune | `"Köln"`, `"Bonn"` |
| `osmAdminLevels` | `number[]` | OSM Administrative Levels | `[6, 9, 10]` |
| `wp_name` | `string` | Wikipedia-Artikelname | `"de-Köln"` |
| `osm_refinement` | `string` | OSM-Query-Verfeinerung | `"boundary=administrative"` |
| `colorStripe` | `string` | Farbcode für UI | `"#FF6900"` |
| `map.center` | `[number, number]` | Kartenmittelpunkt [lon, lat] | `[6.9603, 50.9375]` |
| `map.zoom` | `number` | Zoom-Stufe | `11` |
| `map.projection` | `string` | Koordinatensystem | `"EPSG:25832"` |
| `map.extent` | `[number, number, number, number]` | Kartenausdehnung | `[6.8, 50.8, 7.2, 51.1]` |
| `map.extra` | `Record<string, any>` | Zusätzliche Konfiguration | `{}` |
| `order` | `number` | Sortierreihenfolge | `10` |
| `icon` | `string` | Icon-Identifier | `"city"` |

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
```

**OSMPolygonFeature Properties:**

| Property | Typ | Beschreibung | Beispiel |
|----------|-----|--------------|----------|
| `id` | `number` | OSM-Element-ID | `123456789` |
| `properties.name` | `string` | Element-Name | `"Köln"` |
| `properties.admin_level` | `number` | Admin-Level | `7` |
| `properties.wikipedia` | `string` | Wikipedia-Referenz | `"de:Köln"` |
| `properties.wikidata` | `string` | Wikidata-Referenz | `"Q365"` |
| `properties.type` | `string` | Element-Typ | `"boundary"` |
| `properties.timestamp` | `string` | Änderungszeitpunkt | `"2023-10-15T14:30:00Z"` |
| `properties.version` | `number` | Versionsnummer | `5` |
| `properties.changeset` | `number` | Changeset-ID | `98765432` |
| `properties.user` | `string` | Bearbeiter-Name | `"osm_user"` |
| `properties.uid` | `number` | Bearbeiter-ID | `12345` |

### Overpass-API-Response

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

**Overpass-Element-Struktur:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `type` | `"node" \| "way" \| "relation"` | OSM-Element-Typ |
| `id` | `number` | OSM-Element-ID |
| `tags` | `Record<string, string>` | OSM-Tags (Key-Value-Paare) |
| `geometry` | `Array<{lat, lon}>` | Geokoordinaten (nur für Nodes) |
| `members` | `Array<Member>` | Relation-Mitglieder (nur für Relations) |

### Sync-Interfaces

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

## OSM-Datenstrukturen

### OSM-Element-Typen

**Node:**
- Einzelner Punkt mit Koordinaten
- Verwendet für POIs (Points of Interest)

**Way:**
- Linienzug oder geschlossene Fläche
- Verwendet für Straßen, Gebäude, Grenzen

**Relation:**
- Sammlung von Nodes, Ways und anderen Relations
- Verwendet für komplexe Strukturen wie administrative Grenzen

### OSM-Tags für Administrative Grenzen

**Typische Tags:**
```json
{
  "boundary": "administrative",
  "admin_level": "7",
  "name": "Köln",
  "wikipedia": "de:Köln",
  "wikidata": "Q365",
  "type": "boundary"
}
```

**Wichtige Boundary-Tags:**
- `boundary=administrative` - Administrative Grenze
- `admin_level=2-10` - Administrative Ebene
- `name=*` - Offizieller Name
- `wikipedia=*` - Wikipedia-Referenz
- `wikidata=*` - Wikidata-Referenz

## GeoJSON-Format

### Feature-Struktur

```json
{
  "type": "Feature",
  "id": 123456789,
  "properties": {
    "name": "Köln",
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

### FeatureCollection-Struktur

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

## Helper-Funktionen

### Kommune-Utils

```typescript
// src/utils/kommune-utils.ts

// Zentrale Konfiguration für Standard-Kommune
export const DEFAULT_KOMMUNE_SLUG = "koeln";

// Lädt alle Kommunen aus der Collection
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

// Holt eine spezifische Kommune per Slug
export async function getKommuneBySlug(
  slug: string,
): Promise<KommuneData | null> {
  const kommunen = await getAllKommunen();
  return kommunen.find((k) => k.slug === slug) || null;
}

// Prüft ob eine Kommune valide OSM-Daten hat
export function hasValidOSMData(kommune: KommuneData): boolean {
  return (
    !!kommune.wp_name &&
    !!kommune.osmAdminLevels &&
    kommune.osmAdminLevels.length > 0 &&
    !!kommune.map?.center
  );
}

// Holt Kommunen die für Sync bereit sind
export async function getKommunenReadyForSync(): Promise<KommuneData[]> {
  const kommunen = await getAllKommunen();
  return kommunen.filter(hasValidOSMData);
}
```

### Funktionen-Dokumentation

**`getAllKommunen()`**
- **Zweck**: Lädt alle Kommunen aus der Content Collection
- **Rückgabe**: `Promise<KommuneData[]>`
- **Sortierung**: Nach `order`-Feld (default: 999)
- **Fallbacks**: Standardwerte für fehlende Map-Konfiguration

**`getKommuneBySlug(slug: string)`**
- **Parameter**: `slug` - Eindeutiger Kommune-Identifier
- **Rückgabe**: `Promise<KommuneData | null>`
- **Verwendung**: Für Detailansichten einzelner Kommunen

**`hasValidOSMData(kommune: KommuneData)`**
- **Parameter**: `kommune` - Kommune-Datenobjekt
- **Rückgabe**: `boolean`
- **Prüfungen**: 
  - `wp_name` vorhanden
  - `osmAdminLevels` nicht leer
  - `map.center` vorhanden

**`getKommunenReadyForSync()`**
- **Zweck**: Filtert Kommunen die für OSM-Sync geeignet sind
- **Rückgabe**: `Promise<KommuneData[]>`
- **Verwendung**: Vor Synchronisation mit OSM-Daten

## Datenfluss-Diagramm

### Vereinfachte Darstellung

```
Content Collection → KommuneData → OSM-Abfrage → GeoJSON → WFS-Service
     (Markdown)     (Interface)   (Overpass)    (Format)   (Geoserver)
```

### Detaillierter Ablauf

1. **Datenquelle**: Markdown-Dateien in `src/content/kommunen/`
2. **Validierung**: Zod-Schema in `content.config.ts`
3. **Transformation**: `getAllKommunen()` erstellt `KommuneData[]`
4. **OSM-Abfrage**: Nutzt `wp_name` und `osmAdminLevels` für Overpass-Query
5. **GeoJSON-Konvertierung**: OSM-Daten werden in GeoJSON transformiert
6. **WFS-Transaction**: GeoJSON wird an Geoserver gesendet

## Beispieldaten

### Komplette Kommune-Daten

```typescript
const koelnData: KommuneData = {
  slug: "koeln",
  title: "Köln",
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

### OSM-Overpass-Query

```xml
[out:json][timeout:25];
(
  relation["boundary"="administrative"]["admin_level"=7]["wikipedia"="de:Köln"];
);
out body;
>;
out skel qt;
```

### GeoJSON-Feature

```json
{
  "type": "Feature",
  "id": 123456789,
  "properties": {
    "name": "Köln",
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

### Datenkonsistenz

1. **Einheitliche Benennung**: Verwende konsistente Slugs und Titel
2. **Koordinatensystem**: Immer WGS84 für `map.center`
3. **Farbkodierung**: Verwende die Standard-Farbpalette
4. **OSM-Levels**: Nur relevante administrative Ebenen angeben

### Performance-Optimierungen

1. **Lazy Loading**: Kommunen-Daten nur bei Bedarf laden
2. **Caching**: Collection-Queries cachen
3. **Validierung**: Frontmatter vor Build-Time validieren
4. **Tree Shaking**: Nur benötigte Felder abrufen

### Erweiterbarkeit

Die Datenstrukturen sind modular aufgebaut und können leicht erweitert werden:

```typescript
// Beispiel-Erweiterung
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

Die gut definierten Datenstrukturen bilden die Grundlage für eine robuste und erweiterbare Kommunen-Verwaltung in p2d2.
