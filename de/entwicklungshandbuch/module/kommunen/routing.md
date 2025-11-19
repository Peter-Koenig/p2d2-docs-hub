---
title: Routing
description: "Dokumentation des Routing-Systems für Kommunen-Seiten: Dynamic Routes, getStaticPaths, URL-Struktur"
quality:
  completeness: 70
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Routing

## Übersicht

Das Kommunen-System in p2d2 verwendet ein hybrides Routing-Konzept, das sowohl clientseitige Navigation als auch serverseitige Integration in bestehende Seitenstrukturen kombiniert. Der Fokus liegt auf der Integration in die Hauptseite und dem Feature-Editor, anstatt auf dedizierten Kommunen-Seiten.

## Aktuelle Routing-Architektur

### Hauptseite-Integration

Die Kommunen werden primär auf der Startseite (`/`) über das `KommunenGrid`-Komponenten-System dargestellt:

```
src/pages/index.astro → /
  └── KommunenGrid-Komponente
      └── Clientseitige Interaktion
```

### Feature-Editor-Integration

Der Feature-Editor nutzt Kommunen-Daten für projektspezifische Konfiguration:

```
src/pages/feature-editor/[featureId].astro → /feature-editor/{featureId}
  └── Kommunen-Daten für Karten-Projektion
```

## URL-Struktur

### Aktuelle URLs

| URL | Zweck | Implementierung |
|-----|-------|-----------------|
| `/` | Startseite mit Kommunen-Grid | `index.astro` |
| `/feature-editor/{featureId}` | Feature-Editor mit Kommune-Kontext | `[featureId].astro` |

### Geplante URLs (Potenzielle Erweiterung)

| URL | Zweck | Status |
|-----|-------|--------|
| `/kommunen/` | Übersicht aller Kommunen | 🚧 Geplant |
| `/kommunen/{slug}` | Detailseite einer Kommune | 🚧 Geplant |
| `/kommunen/{slug}/karte` | Kommune-spezifische Karte | 🚧 Geplant |

## Dynamic Routes

### Feature-Editor Route

```astro
---
// src/pages/feature-editor/[featureId].astro
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  // Hier könnten Kommunen-basierte Routes generiert werden
  return [
    { params: { featureId: "example-1" } },
    { params: { featureId: "example-2" } }
  ];
}

// Kommunen-Daten werden für Karten-Konfiguration genutzt
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
```

## Clientseitige Navigation

### KommunenGrid-Interaktion

Die `KommunenGrid`-Komponente implementiert clientseitige Navigation durch Event-Handling:

```typescript
// Vereinfachte Darstellung des Click-Handlers
class KommunenClickHandler {
  bind() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const kommuneCard = target.closest('.kommunen-card');
      
      if (kommuneCard) {
        const slug = kommuneCard.getAttribute('data-slug');
        const detail = kommuneCard.getAttribute('data-detail');
        
        this.handleKommuneClick(slug, JSON.parse(detail || '{}'));
      }
    });
  }

  private handleKommuneClick(slug: string, detail: any) {
    // Aktuelle Implementierung: Karten-Navigation
    // Zukünftig: Navigation zu Kommune-Detailseite
    this.navigateToKommune(slug, detail);
  }
}
```

### Tab-System auf Startseite

Die Startseite implementiert ein Tab-System für die Navigation zwischen Kommunen und Kategorien:

```javascript
// Tab-Umschaltung auf der Startseite
function switchTab(tabName: "kommunen" | "kategorien") {
  const kommunenGrid = document.getElementById("kommunen-grid");
  const kategorienGrid = document.getElementById("kategorien-grid");
  
  if (tabName === "kommunen") {
    kommunenGrid?.classList.remove("opacity-0", "absolute");
    kategorienGrid?.classList.add("opacity-0", "absolute");
  } else {
    kommunenGrid?.classList.add("opacity-0", "absolute");
    kategorienGrid?.classList.remove("opacity-0", "absolute");
  }
  
  // Persistierung des Tab-Zustands
  setPersistedTab(tabName);
}
```

## Datenfluss für Routing

### Serverseitige Datenvorbereitung

```astro
---
// Beispiel für zukünftige Kommune-Detailseite
import { getCollection, getEntry } from 'astro:content';

export async function getStaticPaths() {
  const kommunen = await getCollection('kommunen');
  
  return kommunen.map(kommune => ({
    params: { 
      slug: kommune.slug 
    },
    props: { 
      kommune 
    }
  }));
}

const { slug } = Astro.params;
const { kommune } = Astro.props;
---
```

### Props-Übergabe

```typescript
// Typisierung für Route-Props
interface KommunePageProps {
  kommune: {
    id: string;
    slug: string;
    data: {
      title: string;
      wp_name: string;
      osmAdminLevels?: number[];
      map: {
        center: [number, number];
        zoom: number;
        projection: string;
      };
    };
    body: string;
  };
}
```

## Navigation zwischen Kommunen

### Link-Generierung

```typescript
// Generierung von Links zu Kommunen-Seiten
function generateKommuneLinks(kommunen: KommuneData[]) {
  return kommunen.map(kommune => ({
    href: `/kommunen/${kommune.slug}`,
    label: kommune.title,
    description: `Details zu ${kommune.title}`
  }));
}
```

### Breadcrumb-Navigation

```typescript
// Breadcrumb-Struktur für Kommune-Seiten
const breadcrumbs = [
  { href: '/', label: 'Startseite' },
  { href: '/kommunen', label: 'Kommunen' },
  { href: `/kommunen/${slug}`, label: title, current: true }
];
```

## 404-Handling

### Fehlende Kommunen

```astro
---
// Beispiel für 404-Handling in Kommune-Routes
import { getEntry } from 'astro:content';

const { slug } = Astro.params;
const kommune = await getEntry('kommunen', slug);

if (!kommune) {
  return Astro.redirect('/404');
}
---
```

### Fallback-Routes

```typescript
// Fallback für ungültige Slugs
export async function getStaticPaths() {
  const kommunen = await getCollection('kommunen');
  
  const paths = kommunen.map(kommune => ({
    params: { slug: kommune.slug }
  }));
  
  // Fallback für nicht-prerenderte Routes
  return {
    paths,
    fallback: 'blocking'
  };
}
```

## URL-Parameter und Query-Strings

### Dynamische Parameter

```typescript
// Extraktion von URL-Parametern
const { slug } = Astro.params;
const urlSearchParams = new URL(Astro.request.url).searchParams;
const adminLevel = urlSearchParams.get('adminLevel');
const view = urlSearchParams.get('view') || 'map';
```

### Query-String-Behandlung

```typescript
// Generierung von URLs mit Query-Parametern
function generateKommuneUrl(slug: string, options: {
  adminLevel?: number;
  view?: string;
  highlight?: string;
}) {
  const params = new URLSearchParams();
  
  if (options.adminLevel) params.set('adminLevel', options.adminLevel.toString());
  if (options.view) params.set('view', options.view);
  if (options.highlight) params.set('highlight', options.highlight);
  
  return `/kommunen/${slug}?${params.toString()}`;
}
```

## State-Management über URLs

### Karten-Zustand

```typescript
// Persistierung von Karten-Zustand in URL
interface MapState {
  center: [number, number];
  zoom: number;
  layers: string[];
}

function serializeMapState(state: MapState): string {
  return btoa(JSON.stringify(state));
}

function deserializeMapState(encoded: string): MapState {
  return JSON.parse(atob(encoded));
}
```

### Filter-Zustand

```typescript
// URL-basierte Filter
interface KommuneFilters {
  adminLevels: number[];
  hasOSMData: boolean;
  searchTerm: string;
}

function applyFiltersFromUrl(filters: KommuneFilters) {
  const url = new URL(window.location.href);
  url.searchParams.set('adminLevels', filters.adminLevels.join(','));
  url.searchParams.set('hasOSMData', filters.hasOSMData.toString());
  if (filters.searchTerm) {
    url.searchParams.set('search', filters.searchTerm);
  }
  
  window.history.pushState({}, '', url.toString());
}
```

## Performance-Optimierungen

### Lazy Loading

```typescript
// Dynamisches Laden von Kommune-Komponenten
const KommuneDetail = await import('../components/KommuneDetail.astro');
const KommuneMap = await import('../components/KommuneMap.astro');
```

### Prefetching

```typescript
// Prefetching von Kommune-Daten
function prefetchKommuneData(slug: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = `/kommunen/${slug}`;
  link.as = 'document';
  document.head.appendChild(link);
}
```

## Best Practices

### URL-Design

1. **Slug-Konsistenz**: Verwende konsistente Slugs basierend auf Dateinamen
2. **SEO-freundlich**: Beschreibende URLs für bessere Suchmaschinen-Optimierung
3. **Canonical URLs**: Vermeide Duplicate Content durch korrekte Canonical Tags

### Navigation

1. **Breadcrumbs**: Implementiere Breadcrumb-Navigation für bessere UX
2. **Deep Linking**: Ermögliche direkte Links zu spezifischen Ansichten
3. **History Management**: Korrektes Browser-History-Management

### Error Handling

1. **404-Seiten**: Benutzerfreundliche 404-Seiten für nicht-existierende Kommunen
2. **Error Boundaries**: Graceful Degradation bei Fehlern
3. **Loading States**: Angemessene Lade-Indikatoren

## Erweiterungsmöglichkeiten

### Internationalisierung

```typescript
// Mehrsprachige Routes
export async function getStaticPaths() {
  const kommunen = await getCollection('kommunen');
  
  return kommunen.flatMap(kommune => [
    { params: { slug: kommune.slug }, props: { locale: 'de' } },
    { params: { slug: kommune.slug }, props: { locale: 'en' } }
  ]);
}
```

### API-Routes

```typescript
// RESTful API für Kommunen-Daten
// /api/kommunen/[slug].ts
export async function GET({ params }: { params: { slug: string } }) {
  const kommune = await getEntry('kommunen', params.slug);
  
  if (!kommune) {
    return new Response(null, { status: 404 });
  }
  
  return new Response(JSON.stringify(kommune), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

Das aktuelle Routing-System bietet eine solide Grundlage für die Kommunen-Integration und kann bei Bedarf um dedizierte Kommune-Seiten erweitert werden.
