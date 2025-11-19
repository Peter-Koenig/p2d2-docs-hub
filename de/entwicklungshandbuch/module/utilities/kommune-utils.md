---
title: Kommune Data Management
description: Umfassende Dokumentation für Kommunen-Datenverwaltung und -Verarbeitung
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Kommune Data Management

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Die Kommune-Utilities in p2d2 bieten eine zentrale Verwaltung für Kommunen-Daten aus Astro Content Collections. Diese Module ermöglichen das dynamische Laden, Filtern und Verarbeiten von Kommunen-Informationen mit Fallback-Mechanismen für verschiedene Ausführungskontexte (Browser, CLI, Tests).

## Hauptmodule

### 1. Kommune Utilities (`kommune-utils.ts`)

Zentrale Verwaltung für Kommunen-Daten mit Content Collection-Integration.

#### Datenstrukturen

```typescript
// Haupt-Interface für Kommune-Daten
export interface KommuneData {
  slug: string;                    // Eindeutiger Identifier
  title: string;                   // Anzeigename
  osmAdminLevels?: number[];       // OSM Administrative Ebenen
  wp_name: string;                 // Wikipedia-Name für OSM-Abfragen
  osm_refinement?: string;         // OSM-Verfeinerungs-Parameter
  colorStripe: string;            // Farbstreifen für UI
  map: {
    center: [number, number];      // Karten-Zentrum [lon, lat]
    zoom: number;                  // Standard-Zoom-Level
    projection: string;            // Karten-Projektion
    extent?: [number, number, number, number]; // Begrenzungsrahmen
    extra?: Record<string, any>;   // Zusätzliche Map-Konfiguration
  };
  order?: number;                  // Sortierreihenfolge
  icon?: string;                   // Icon für UI-Darstellung
}

// Standard-Kommune-Konfiguration
export const DEFAULT_KOMMUNE_SLUG = "koeln";
```

#### Core-Funktionen

```typescript
// Alle Kommunen laden (mit Fallback für CLI/Test)
export async function getAllKommunen(): Promise<KommuneData[]>

// Spezifische Kommune nach Slug laden
export async function getKommuneBySlug(slug: string): Promise<KommuneData | null>

// OSM-Daten-Validierung
export function hasValidOSMData(kommune: KommuneData): boolean

// Kommunen für Sync vorbereiten
export async function getKommunenReadyForSync(): Promise<KommuneData[]>
```

### 2. Dynamische Collection-Loading

#### Adaptive Lade-Logik

```typescript
// Erkennt zur Laufzeit, ob Astro-Runtime verfügbar ist
async function loadCollection() {
  try {
    // Astro Content Collection API
    const { getCollection } = await import("astro:content");
    return getCollection("kommunen");
  } catch {
    // Fallback: Dateien direkt lesen (CLI/Test-Kontext)
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

## Verwendung in der Praxis

### Basis-Integration

```typescript
import { 
  getAllKommunen, 
  getKommuneBySlug, 
  hasValidOSMData,
  DEFAULT_KOMMUNE_SLUG 
} from '../utils/kommune-utils';

// 1. Alle Kommunen laden
const kommunen = await getAllKommunen();
console.log(`Geladene Kommunen: ${kommunen.length}`);

// 2. Spezifische Kommune laden
const koeln = await getKommuneBySlug('koeln');
if (koeln) {
  console.log(`Köln Zentrum: ${koeln.map.center}`);
}

// 3. OSM-Daten validieren
const validKommunen = kommunen.filter(hasValidOSMData);
console.log(`Kommunen mit OSM-Daten: ${validKommunen.length}`);

// 4. Sync-fähige Kommunen
const syncReady = await getKommunenReadyForSync();
console.log(`Sync-bereite Kommunen: ${syncReady.length}`);
```

### Erweiterte Verwendung

```typescript
// Kommunen nach Region filtern
function getKommunenByRegion(kommunen: KommuneData[], region: string) {
  return kommunen.filter(k => 
    k.slug.toLowerCase().includes(region.toLowerCase())
  );
}

// Kommunen mit spezifischen OSM-Levels
function getKommunenByAdminLevel(kommunen: KommuneData[], level: number) {
  return kommunen.filter(k => 
    k.osmAdminLevels?.includes(level)
  );
}

// Sortierte Kommunen-Liste
function getSortedKommunen(kommunen: KommuneData[]) {
  return [...kommunen].sort((a, b) => 
    (a.order ?? 999) - (b.order ?? 999)
  );
}
```

### Integration mit Map-System

```typescript
import { getAllKommunen } from '../utils/kommune-utils';
import { dispatchKommunenFocus } from '../utils/events';

// Kommunen für UI-Komponenten vorbereiten
async function prepareKommunenForUI() {
  const kommunen = await getAllKommunen();
  
  return kommunen.map(kommune => ({
    ...kommune,
    // UI-spezifische Eigenschaften hinzufügen
    displayName: kommune.title,
    isSelectable: hasValidOSMData(kommune),
    color: kommune.colorStripe || '#FF6900'
  }));
}

// Karten-Navigation für Kommune
function navigateToKommune(kommune: KommuneData) {
  if (!hasValidOSMData(kommune)) {
    console.warn(`Kommune ${kommune.slug} hat keine gültigen OSM-Daten`);
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

## Konfiguration

### Frontmatter-Struktur

```yaml
# src/content/kommunen/koeln.md
---
title: "Köln"
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

### OSM Admin Level Konfiguration

```typescript
// Standard OSM Admin Levels für deutsche Kommunen
const GERMAN_ADMIN_LEVELS = {
  BUNDESLAND: 4,      // Bundesland (z.B. Nordrhein-Westfalen)
  REGIERUNGSBEZIRK: 5, // Regierungsbezirk (z.B. Köln)
  KREIS: 6,           // Kreis/Kreisfreie Stadt
  GEMEINDE: 7,        // Gemeinde/Stadt
  STADTTEIL: 8,       // Stadtteil/Bezirk
  ORTSTEIL: 9,        // Ortsteil
  STADTVIERTEL: 10    // Stadtviertel
};

// Beispiel-Konfigurationen
const KOMMUNE_CONFIGS = {
  KOELN: {
    levels: [7, 8, 9, 10], // Stadt -> Bezirke -> Stadtteile -> Viertel
    refinement: "admin_level=7"
  },
  MUENCHEN: {
    levels: [7, 8, 9],
    refinement: "admin_level=7"
  },
  BERLIN: {
    levels: [4, 7, 8, 9], // Bundesland -> Bezirke -> Ortsteile
    refinement: "admin_level=4"
  }
};
```

## Performance-Optimierungen

### 1. Caching-Strategien

```typescript
// In-Memory Cache für Kommunen-Daten
let kommunenCache: KommuneData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 Minuten

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
// Kommunen erst bei Bedarf laden
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

### 3. Batch-Processing

```typescript
// Mehrere Operationen gleichzeitig ausführen
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

## Fehlerbehandlung

### Robuste Datenladung

```typescript
import { logger } from '../utils/logger';

async function safeGetAllKommunen(): Promise<KommuneData[]> {
  try {
    return await getAllKommunen();
  } catch (error) {
    logger.error("Fehler beim Laden der Kommunen", error);
    
    // Fallback: Standard-Kommunen
    return [{
      slug: DEFAULT_KOMMUNE_SLUG,
      title: "Köln",
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

### Validierung von Kommune-Daten

```typescript
function validateKommuneData(kommune: any): KommuneData | null {
  if (!kommune?.slug || !kommune?.title || !kommune?.wp_name) {
    logger.warn("Ungültige Kommune-Daten: Fehlende Pflichtfelder", kommune);
    return null;
  }
  
  if (!kommune.map?.center || !Array.isArray(kommune.map.center)) {
    logger.warn("Ungültige Karten-Konfiguration", kommune);
    return null;
  }
  
  // Transformation zu validiertem Typ
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

### 1. Daten-Konsistenz

```typescript
// ✅ Korrekt - Vollständige Validierung
async function getValidatedKommune(slug: string): Promise<KommuneData | null> {
  const kommune = await getKommuneBySlug(slug);
  if (!kommune) return null;
  
  if (!hasValidOSMData(kommune)) {
    logger.warn(`Kommune ${slug} hat keine gültigen OSM-Daten`);
    return null;
  }
  
  return kommune;
}

// ❌ Vermeiden - Ungeprüfte Daten
const kommune = await getKommuneBySlug(slug);
// Direkte Verwendung ohne Validierung
```

### 2. Error-Handling

```typescript
// ✅ Korrekt - Umfassende Fehlerbehandlung
async function loadKommuneWithFallback(slug: string) {
  try {
    const kommune = await getKommuneBySlug(slug);
    if (!kommune) {
      throw new Error(`Kommune ${slug} nicht gefunden`);
    }
    return kommune;
  } catch (error) {
    logger.error(`Fehler beim Laden von ${slug}`, error);
    
    // Fallback auf Standard-Kommune
    return await getKommuneBySlug(DEFAULT_KOMMUNE_SLUG);
  }
}

// ❌ Vermeiden - Unbehandelte Fehler
const kommune = getKommuneBySlug(slug); // Kein Error-Handling
```

### 3. Performance

```typescript
// ✅ Korrekt - Effiziente Datenverarbeitung
async function getKommunenForMap() {
  const kommunen = await getAllKommunen();
  
  // Nur benötigte Felder selektieren
  return kommunen.map(k => ({
    slug: k.slug,
    title: k.title,
    center: k.map.center,
    zoom: k.map.zoom,
    isSelectable: hasValidOSMData(k)
  }));
}

// ❌ Vermeiden - Ineffiziente Operationen
// Komplette Datenstruktur übertragen, auch wenn nicht benötigt
```

## Abhängigkeiten

### Externe Libraries
- **gray-matter** - Frontmatter-Parsing (Fallback-Modus)
- **fs/path** - Dateisystem-Operationen (Node.js)

### Interne Abhängigkeiten
- `astro:content` - Astro Content Collections (Primär-Modus)
- `../utils/logger` - Logging-Infrastruktur
- `../utils/events` - Event-System für Navigation

## Testing

### Unit Tests

```typescript
// Beispiel für Kommune-Utils Tests
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

Diese Kommune-Data-Management-Utilities bilden das Fundament für die dynamische Verwaltung und Verarbeitung von Kommunen-Daten in p2d2, mit robusten Fallback-Mechanismen und umfassender TypeScript-Unterstützung.