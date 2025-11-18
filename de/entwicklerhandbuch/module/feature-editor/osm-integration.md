---
title: OSM Integration
description: Integration mit OpenStreetMap - Feature-zu-OSM-Mapping, Tagging und Export
quality:
  completeness: 50
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# OSM Integration

## Übersicht

Die OSM-Integration ermöglicht die Synchronisation von p2d2-Features mit OpenStreetMap. Sie umfasst Datenstrukturen für OSM-Polygone, Overpass-API-Integration und geplante Export-Funktionalität.

## Architektur

### OSM-Datenfluss

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
│                 │    │   🚧 Geplant     │    │   🚧 Geplant    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementierte Komponenten

### OSM-Datenstrukturen

**Datei:** `src/types/admin-polygon.ts`

Die OSM-Integration definiert TypeScript-Interfaces für OSM-spezifische Datenstrukturen.

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

#### Overpass-API-Response

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
    // ... OSM-Element-Eigenschaften
  }>;
}
```

### Content-Collection-Schema

**Datei:** `src/content.config.ts`

Das Kommunen-Schema enthält OSM-spezifische Felder:

```typescript
const kommunen = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    wp_name: z.string().min(3).regex(/^[a-z]{2,3}-/),
    osmAdminLevels: z.array(z.number()).optional(),
    osm_refinement: z.string().optional(),
    // ... weitere Properties
  })
});
```

### OSM-Admin-Level-Verwaltung

**Datei:** `src/utils/kommune-utils.ts`

Utility-Funktionen für OSM-Daten:

```typescript
// Prüft ob eine Kommune valide OSM-Daten hat
export function hasValidOSMData(kommune: KommuneData): boolean {
  return (
    !!kommune.wp_name &&
    !!kommune.osmAdminLevels &&
    kommune.osmAdminLevels.length > 0 &&
    !!kommune.map?.center
  );
}

// Filtert Kommunen die für Sync bereit sind
export async function getKommunenReadyForSync(): Promise<KommuneData[]> {
  const kommunen = await getAllKommunen();
  return kommunen.filter(hasValidOSMData);
}
```

## OSM-Admin-Level

### Unterstützte Admin-Level

| Level | Beschreibung | Beispiel |
|-------|--------------|----------|
| 2 | Nationalstaat | Deutschland |
| 4 | Bundesland | Nordrhein-Westfalen |
| 6 | Regierungsbezirk | Köln |
| 7 | Kreis/Kreisfreie Stadt | Köln (Stadt) |
| 8 | Gemeindeverband | - |
| 9 | Gemeinde | Stadtteil-Bezirke |
| 10 | Stadtteil | Ehrenfeld, Nippes |

### Konfiguration in Markdown

```markdown
---
title: "Köln"
wp_name: "de-Köln"
osmAdminLevels: [6, 7, 8, 9, 10]
osm_refinement: "boundary=administrative"
---
```

## 🚧 Geplante Erweiterungen

### Feature-zu-OSM-Mapping

**Status:** Noch nicht implementiert

**Geplante Mapping-Tabelle:**

| p2d2 Property | OSM Tag | Beschreibung |
|---------------|---------|--------------|
| `type: "playground"` | `leisure=playground` | Spielplatz |
| `type: "cemetery"` | `landuse=cemetery` | Friedhof |
| `name: "..."` | `name=...` | Feature-Name |
| `wp_name: "de-Köln"` | `wikipedia=de:Köln` | Wikipedia-Link |

**Beispiel-Mapping:**

```typescript
// p2d2 Feature → OSM Tags
const p2d2Feature = {
  name: "Spielplatz Musterstraße",
  type: "playground",
  wp_name: "de-Köln"
};

// Wird zu OSM Tags:
const osmTags = {
  "leisure": "playground",
  "name": "Spielplatz Musterstraße",
  "wikipedia": "de:Köln"
};
```

### OSM-XML-Export

**Status:** Noch nicht implementiert

**Geplantes XML-Format:**

```xml
<osm version="0.6" generator="p2d2">
  <node id="-1" lat="50.9413" lon="6.9583" version="1">
    <tag k="leisure" v="playground"/>
    <tag k="name" v="Spielplatz Musterstraße"/>
    <tag k="wikipedia" v="de:Köln"/>
  </node>
  <way id="-2" version="1">
    <nd ref="-1"/>
    <!-- weitere Nodes -->
    <tag k="leisure" v="playground"/>
  </way>
</osm>
```

### Overpass-API-Integration

**Status:** Noch nicht implementiert

**Geplante Queries:**

```javascript
// Beispiel-Query für Köln
const overpassQuery = `
[out:json][timeout:25];
(
  relation["boundary"="administrative"]["admin_level"="6"]["name"="Köln"];
  relation["boundary"="administrative"]["admin_level"="7"]["name"="Köln"];
  relation["boundary"="administrative"]["admin_level"="8"]["name"="Köln"];
  relation["boundary"="administrative"]["admin_level"="9"]["name"="Köln"];
  relation["boundary"="administrative"]["admin_level"="10"]["name"="Köln"];
);
out body;
>;
out skel qt;
`;

// Bounding-Box Query für Features
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

### OSM-Authentifizierung

**Status:** Noch nicht implementiert

**Geplante Methoden:**

- OAuth 1.0a für OSM-API
- API-Token für Overpass-API
- Credential-Management mit Environment Variables

## Datenvalidierung

### OSM-Tag-Validierung

**Geplante Regeln:**

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

### Geometrie-Validierung

**Geplante Checks:**

- Selbstschneidende Polygone vermeiden
- Mindest-/Maximalgröße für Features
- Koordinaten in gültigem Bereich
- Topologische Korrektheit

## Koordinatensysteme

### Transformationen

**Aktuell:**
- p2d2: EPSG:25832 (UTM 32N)
- OSM: EPSG:4326 (WGS84)

**Geplante Transformation:**

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

## Verwendung (geplant)

### OSM-Export Workflow

```typescript
// 1. Feature aus p2d2 laden
const feature = getFeatureFromP2D2('playground-123');

// 2. Zu OSM-Tags mappen
const osmTags = mapToOSMTags(feature);

// 3. Koordinaten transformieren
const osmFeature = toOSMCoordinates(feature);

// 4. OSM-XML generieren
const osmXML = generateOSMXML(osmFeature, osmTags);

// 5. Zu OSM hochladen
const result = await uploadToOSM(osmXML);
```

### Overpass-Import Workflow

```typescript
// 1. Overpass-Query für Bereich
const query = buildOverpassQuery(bbox, featureTypes);

// 2. Daten von Overpass-API abrufen
const osmData = await fetchOverpassData(query);

// 3. Zu p2d2-Features konvertieren
const p2d2Features = convertFromOSM(osmData);

// 4. In p2d2 speichern
await saveToP2D2(p2d2Features);
```

## Abhängigkeiten

### Aktuelle Abhängigkeiten

- **TypeScript Interfaces:** OSM-Datenstrukturen
- **Content Collections:** OSM-Metadaten in Markdown
- **GeoJSON:** Geometrie-Format

### Geplante Abhängigkeiten

- **OSM-API-Client:** Für Uploads zu OSM
- **Overpass-API-Client:** Für Daten-Import
- **OAuth-Library:** Für Authentifizierung
- **XML-Parser:** Für OSM-XML-Verarbeitung

## Best Practices

### OSM-Konformität

- **Tagging:** Folge etablierten OSM-Tagging-Konventionen
- **Geometrie:** Verwende einfache, nicht-selbstschneidende Polygone
- **Metadaten:** Füge sinnvolle Beschreibungen und Quellen hinzu
- **Lizenz:** Stelle sicher dass Daten unter ODbL lizenziert sind

### Performance

- **Batch-Processing:** Verarbeite mehrere Features zusammen
- **Caching:** Cache Overpass-API-Responses
- **Rate Limiting:** Respektiere OSM-API-Limits
- **Inkrementelle Updates:** Lade nur geänderte Daten

### Error-Handling

- **Network Issues:** Retry-Logik mit exponentiellem Backoff
- **API-Limits:** Automatische Pausen bei Rate Limiting
- **Validation Errors:** Detaillierte Fehlermeldungen
- **Conflict Resolution:** Merge-Strategien für Konflikte

## Qualitätssicherung

### Data Quality

- **Validation:** Automatische Prüfung vor OSM-Upload
- **Consistency:** Konsistente Tagging über alle Features
- **Completeness:** Vollständige Metadaten für alle Features
- **Accuracy:** Korrekte Geometrien und Positionen

### Testing

- **Unit Tests:** Für Mapping-Funktionen
- **Integration Tests:** Für API-Integrationen
- **E2E Tests:** Für komplette Export/Import-Workflows
- **Mock-Server:** Für OSM-API und Overpass-API

### Monitoring

- **Sync-Status:** Überwachung der Synchronisations-Status
- **Error-Rates:** Monitoring von Fehlerquoten
- **Performance:** Latenz-Metriken für API-Calls
- **Data Quality:** Metriken für Daten-Konsistenz