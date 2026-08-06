---
title: Kommunen Content Collections
description: Kategorien- und Kommunen-Collections, Frontmatter-Felder und HTML-Datenübergabe – belegter Ist-Zustand auf Basis des Quellcodes
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Kommunen Content Collections

Dieses Dokument beschreibt die Astro Content Collections von p2d2 auf Basis von `src/content.config.ts` sowie ihre Verwendung in den Komponenten. Es dokumentiert ausschließlich den belegten Ist-Zustand. Frühere, nicht durch den Quellcode belegbare Inhalte (z. B. OSM-Polygon-Interfaces, Erweiterungsvorschläge für zusätzliche Felder) wurden entfernt.

## Collection-Definitionen (`src/content.config.ts`)

Alle Collections werden in `src/content.config.ts` mit `defineCollection` und Zod-Schemata definiert und unter `collections` exportiert:

```ts
export const collections = {
  socialmedia,
  intern,
  resources,
  repositories,
  copyright,
  kategorien,
  werte,
  kommunen,
};
```

### Collection `kategorien`

```ts
const kategorien = defineCollection({
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    order: z.number(),
    description: z.string(),
    containerType: z.string().optional(),
    image_version: z.string().default("001"),
  }),
});
```

| Feld | Typ | Default | Beschreibung |
|---|---|---|---|
| `title` | `string` | – | Anzeigename der Kategorie |
| `icon` | `string` | – | Icon-Identifier |
| `order` | `number` | – | Sortierreihenfolge |
| `description` | `string` | – | Kurzbeschreibung |
| `containerType` | `string` (optional) | – | GeoServer-Container-Typ (z. B. `cemetery`, `administrative`) für die WFS-Schicht |
| `image_version` | `string` | `"001"` | Bildversion für das Kategorie-Foto |

### Collection `kommunen`

```ts
const kommunen = defineCollection({
  schema: z.object({
    title: z.string(),
    colorStripe: z.string().default("#FF6900"),
    osmAdminLevels: z.array(z.number()).optional(),
    wp_name: z
      .string()
      .min(3, "Wikipedia identifier must be at least 3 characters")
      .regex(/^[a-z]{2,3}-/, "Must start with language code and hyphen")
      .refine((val: string) => {
        const parts = val.split("-", 2);
        return parts.length === 2 && parts[1].length > 0;
      }, "Must contain exactly one hyphen separating language code and article name"),
    osm_refinement: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().optional(),
    image_version: z.string().default("001"),
    map: z.object({
      center: z.tuple([z.number(), z.number()]).optional(),
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

| Feld | Typ | Default | Beschreibung |
|---|---|---|---|
| `title` | `string` | – | Anzeigename der Kommune |
| `colorStripe` | `string` | `"#FF6900"` | Farbstreifen für die Kommune-Karte |
| `osmAdminLevels` | `number[]` (optional) | – | OSM-Verwaltungsebenen der Kommune, verwendet für die `osmAdminLevel`-Ableitung in der WFS-Schicht |
| `wp_name` | `string` | – | Wikipedia-Identifier (Sprachcode + Name), validiert (siehe unten) |
| `osm_refinement` | `string` (optional) | – | Overpass-/OSM-Abfrage-Verfeinerung |
| `icon` | `string` (optional) | – | Icon-Identifier |
| `order` | `number` (optional) | – | Sortierreihenfolge |
| `image_version` | `string` | `"001"` | Bildversion für das Kommune-Foto |
| `map` | `object` (optional) | – | Kartendaten, siehe unten |

Felder des `map`-Objekts:

| Feld | Typ | Beschreibung |
|---|---|---|
| `center` | `[number, number]` (optional) | Kartenmittelpunkt in WGS84 `[lon, lat]` |
| `zoom` | `number` (optional) | Initiale Zoom-Stufe |
| `extent` | `[number, number, number, number]` (optional) | Kartenausdehnung `[minx, miny, maxx, maxy]` |
| `projection` | `string` (optional) | CRS-Code (z. B. `EPSG:25832`, `EPSG:3857`) |
| `extra` | `Record<string, any>` (optional) | Zusätzliche Kartenkonfiguration |

### Weitere Collections

| Collection | Felder | Verwendung |
|---|---|---|
| `werte` | `title`, `icon`, `order` | Werte-Raster der Startseite |
| `socialmedia` | `name`, `url` (URL), `icon` | Social-Media-Icons im Footer |
| `intern` | `name`, `url` | Interne Links im Footer („Über uns") |
| `resources` | `name`, `url` | Ressourcen-Links im Footer |
| `repositories` | `name`, `url` (URL) | Repository-Links im Footer |
| `copyright` | `text` | Copyright-Text im Footer |

## Validierung von `wp_name`

Das Feld `wp_name` wird in drei Schritten validiert:

1. **Mindestlänge**: mindestens 3 Zeichen.
2. **Sprachcode-Präfix**: muss mit `^[a-z]{2,3}-` beginnen (z. B. `de-`).
3. **Genau ein Bindestrich**: `split("-", 2)` muss genau zwei Teile ergeben, und der zweite Teil (der Artikelname) darf nicht leer sein.

Ein gültiger Wert folgt also dem Muster `{sprachcode}-{Artikelname}`, z. B. `de-Koeln`.

## Verwendung in den Komponenten

### `KommunenGrid.astro` – Kommunen-Raster

- Lädt `kommunen` über `getCollection("kommunen")` und sortiert nach `order`.
- Erzeugt eine clientseitig verfügbare Kommunen-Datenstruktur:

```ts
const kommuneDataMap: Record<
  string,
  { wpName: string; osmAdminLevels: number[] }
> = {};
kommunen.forEach((kommune) => {
  kommuneDataMap[kommune.slug] = {
    wpName: kommune.data.wp_name,
    osmAdminLevels: kommune.data.osmAdminLevels || [],
  };
});
```

- Übergibt die Daten als `data-kommune-map={JSON.stringify(kommuneDataMap)}` an das Grid-Element.
- Pro Kommune-Karte werden die Kartendaten (`center`, `extent`, `zoom`, `projection`, `extra`, `slug`) als `data-detail`-Attribut eingebettet; Klicks verarbeitet der `KommunenClickHandler` (`src/utils/kommunen-click-handler.ts`).
- Beobachtung (Ist-Zustand): Im TypeScript-Mapping wird der Collection-Wert `wp_name` als `wpName` geführt; der `KommunenClickHandler` enthält dazu den Vermerk „KORRIGIERT: wpName statt wp_name".

### `KategorienGrid.astro` – Kategorien-Raster

- Lädt `kategorien` über `getCollection("kategorien")` und sortiert nach `order`.
- Rendert die Kategorie-Karten über `Kategorien.astro`; jede Karte trägt `data-category-slug={slug}`.
- Der Klick-Handler (dokumentweiter `click`-Listener auf `[data-category-slug]`) setzt `mapState.setSelectedCategory(categorySlug)` und dispatched `CATEGORY_SELECTED` (Details siehe [Event Handling & Cross-Window Kommunikation](../../architektur/eventhandling)).

### `Kategorien.astro` – einzelne Kategorie-Karte

- Erwartet die Props `title`, `icon`, `description`, `id`, `slug`, `imageVersion`.
- Das Foto wird als `/images/kategorien/{slug}_{imageVersion}.jpg` referenziert.

### `src/pages/index.astro` – `data-category-map`

- Lädt `kategorien` über `getAllKategorien()` (aus `src/utils/kategorie-utils.ts`).
- Erzeugt ein Mapping `slug → { containerType }` und bettet es als JSON in das versteckte Element `#category-data` ein:

```astro
<div
    id="category-data"
    data-category-map={JSON.stringify(categoryMap)}
    style="display: none;"
    aria-hidden="true"
>
</div>
```

- Der `WFSLayerManager` liest den `containerType` aus diesem Element für die CQL-Konstruktion (siehe [WFS-Layer-Architektur](../../architektur/wfs-layer-architektur)).

### `WerteGrid.astro` – Werte-Raster

- Lädt `werte` über `getCollection("werte")`, sortiert nach `order` und zeigt die ersten 12 Einträge an.

## Frontmatter-Beispiel (`kommunen`)

Ein Frontmatter-Eintrag einer Kommune nutzt die belegten Felder, beispielsweise:

```yaml
---
title: "Köln"
colorStripe: "#FF6900"
osmAdminLevels: [6, 9, 10]
wp_name: "de-Koeln"
map:
  center: [6.9603, 50.9375]
  zoom: 11
  projection: "EPSG:25832"
order: 10
---

Kurzbeschreibung der Kommune als Markdown-Body.
```

> Hinweis: Das Beispiel zeigt die belegten Felder und ihre Struktur. Welche Werte im Einzelnen für eine Kommune gepflegt sind, ergibt sich aus den Collections-Dateien unter `src/content/kommunen/`.

## Bedeutung von `osmAdminLevels` im WFS-Kontext

`osmAdminLevels` fließt in die WFS-Schicht ein: Der `WFSLayerManager` leitet daraus den `osmAdminLevel` für den CQL-Filter ab.

- Für `containerType === "cemetery"` gilt fest Level `8`.
- Für `containerType === "administrative"` wird die **nächste Untergliederung** verwendet: bei mehreren Ebenen das zweite Element, bei genau einer Ebene dieses Element, andernfalls Fallback `8`.

Details siehe [WFS-Layer-Architektur](../../architektur/wfs-layer-architektur).

## Nicht enthalten

Folgende Inhalte früherer Fassungen sind **nicht** durch den Quellcode belegt und wurden entfernt:

- TypeScript-Interfaces zu OSM-Polygonen (`admin-polygon.ts`) und Overpass-Antworten.
- Vorschläge für zusätzliche Frontmatter-Felder (z. B. `population`, `area`, `website`) oder Mehrsprachigkeits-Schemata.
- Eine OSM-Level-Hierarchie-Tabelle mit festen Level-Bedeutungen (die Bedeutung von `osmAdminLevels` wird nur im WFS-Kontext dokumentiert).

## Verwandte Dokumente

- [WFS-Layer-Architektur](../../architektur/wfs-layer-architektur) – `containerType` und `osmAdminLevel` in der WFS-Schicht
- [Datenfluss](../../architektur/datenfluss) – Auswahl- und WFS-Pfade
- [Event Handling & Cross-Window Kommunikation](../../architektur/eventhandling) – `CATEGORY_SELECTED`, `KOMMUNEN_FOCUS` und Cross-Window-Events

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |