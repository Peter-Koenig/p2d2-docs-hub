---
title: Routing
description: "Documentation of the routing system for municipalities pages: Dynamic Routes, getStaticPaths, URL structure"
quality:
  completeness: 85
  accuracy: 90
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Routing

## Overview

The municipalities system in p2d2 uses a hybrid routing concept that combines client-side navigation with server-side integration into existing page structures. The focus is on integration into the main page and the feature editor, rather than dedicated municipality pages.

## Current Routing Architecture

### Main Page Integration

Municipalities are primarily displayed on the homepage (`/`) through the `KommunenGrid` component system:

```
src/pages/index.astro → /
  └── KommunenGrid component
      └── Client-side interaction
```

### Feature Editor Integration

The feature editor uses municipality data for project-specific configuration:

```
src/pages/feature-editor/[featureId].astro → /feature-editor/{featureId}
  └── Municipality data for map projection
```

## URL Structure

### Current URLs

| URL | Purpose | Implementation |
|-----|---------|----------------|
| `/` | Homepage with municipalities grid | `index.astro` |
| `/feature-editor/{featureId}` | Feature editor with municipality context | `[featureId].astro` |

### Planned URLs (Potential Extension)

| URL | Purpose | Status |
|-----|---------|--------|
| `/municipalities/` | Overview of all municipalities | 🚧 Planned |
| `/municipalities/{slug}` | Detail page of a municipality | 🚧 Planned |
| `/municipalities/{slug}/map` | Municipality-specific map | 🚧 Planned |

## Dynamic Routes

### Feature Editor Route

```astro
---
// src/pages/feature-editor/[featureId].astro
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  // Municipality-based routes could be generated here
  return [
    { params: { featureId: "example-1" } },
    { params: { featureId: "example-2" } }
  ];
}

// Municipality data is used for map configuration
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

## Client-Side Navigation

### KommunenGrid Interaction

The `KommunenGrid` component implements client-side navigation through event handling:

```typescript
// Simplified representation of click handler
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
    // Current implementation: Map navigation
    // Future: Navigation to municipality detail page
    this.navigateToKommune(slug, detail);
  }
}
```

### Tab System on Homepage

The homepage implements a tab system for navigation between municipalities and categories:

```javascript
// Tab switching on homepage
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
  
  // Persist tab state
  setPersistedTab(tabName);
}
```

## Data Flow for Routing

### Server-Side Data Preparation

```astro
---
// Example for future municipality detail page
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

### Props Passing

```typescript
// Typing for route props
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

## Navigation Between Municipalities

### Link Generation

```typescript
// Generation of links to municipality pages
function generateKommuneLinks(kommunen: KommuneData[]) {
  return kommunen.map(kommune => ({
    href: `/municipalities/${kommune.slug}`,
    label: kommune.title,
    description: `Details about ${kommune.title}`
  }));
}
```

### Breadcrumb Navigation

```typescript
// Breadcrumb structure for municipality pages
const breadcrumbs = [
  { href: '/', label: 'Home' },
  { href: '/municipalities', label: 'Municipalities' },
  { href: `/municipalities/${slug}`, label: title, current: true }
];
```

## 404 Handling

### Missing Municipalities

```astro
---
// Example for 404 handling in municipality routes
import { getEntry } from 'astro:content';

const { slug } = Astro.params;
const kommune = await getEntry('kommunen', slug);

if (!kommune) {
  return Astro.redirect('/404');
}
---
```

### Fallback Routes

```typescript
// Fallback for invalid slugs
export async function getStaticPaths() {
  const kommunen = await getCollection('kommunen');
  
  const paths = kommunen.map(kommune => ({
    params: { slug: kommune.slug }
  }));
  
  // Fallback for non-prerendered routes
  return {
    paths,
    fallback: 'blocking'
  };
}
```

## URL Parameters and Query Strings

### Dynamic Parameters

```typescript
// Extraction of URL parameters
const { slug } = Astro.params;
const urlSearchParams = new URL(Astro.request.url).searchParams;
const adminLevel = urlSearchParams.get('adminLevel');
const view = urlSearchParams.get('view') || 'map';
```

### Query String Handling

```typescript
// Generation of URLs with query parameters
function generateKommuneUrl(slug: string, options: {
  adminLevel?: number;
  view?: string;
  highlight?: string;
}) {
  const params = new URLSearchParams();
  
  if (options.adminLevel) params.set('adminLevel', options.adminLevel.toString());
  if (options.view) params.set('view', options.view);
  if (options.highlight) params.set('highlight', options.highlight);
  
  return `/municipalities/${slug}?${params.toString()}`;
}
```

## State Management via URLs

### Map State

```typescript
// Persistence of map state in URL
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

### Filter State

```typescript
// URL-based filters
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

## Performance Optimizations

### Lazy Loading

```typescript
// Dynamic loading of municipality components
const KommuneDetail = await import('../components/KommuneDetail.astro');
const KommuneMap = await import('../components/KommuneMap.astro');
```

### Prefetching

```typescript
// Prefetching of municipality data
function prefetchKommuneData(slug: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = `/municipalities/${slug}`;
  link.as = 'document';
  document.head.appendChild(link);
}
```

## Best Practices

### URL Design

1. **Slug Consistency**: Use consistent slugs based on filenames
2. **SEO-Friendly**: Descriptive URLs for better search engine optimization
3. **Canonical URLs**: Avoid duplicate content through correct canonical tags

### Navigation

1. **Breadcrumbs**: Implement breadcrumb navigation for better UX
2. **Deep Linking**: Enable direct links to specific views
3. **History Management**: Proper browser history management

### Error Handling

1. **404 Pages**: User-friendly 404 pages for non-existent municipalities
2. **Error Boundaries**: Graceful degradation for errors
3. **Loading States**: Appropriate loading indicators

## Extension Possibilities

### Internationalization

```typescript
// Multilingual routes
export async function getStaticPaths() {
  const kommunen = await getCollection('kommunen');
  
  return kommunen.flatMap(kommune => [
    { params: { slug: kommune.slug }, props: { locale: 'de' } },
    { params: { slug: kommune.slug }, props: { locale: 'en' } }
  ]);
}
```

### API Routes

```typescript
// RESTful API for municipality data
// /api/municipalities/[slug].ts
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

The current routing system provides a solid foundation for municipality integration and can be extended with dedicated municipality pages as needed.
