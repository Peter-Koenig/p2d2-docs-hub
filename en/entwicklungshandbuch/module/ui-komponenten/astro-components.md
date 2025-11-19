---
title: "Astro Components"
description: "Documentation of all Astro components in p2d2: structure, props, slots, client directives"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Astro Components

## Overview

p2d2 uses Astro components for the UI architecture. Astro components are server-side rendered and can optionally contain client-side JavaScript. The system consists of 21 main components, divided into layout, feature, and UI components.

## Component Hierarchy

```
BaseLayout.astro (Root Layout)
├── Header.astro
├── <slot /> (Page Content)
│   ├── HeroSection.astro
│   ├── OpenLayersMap.astro
│   │   └── MapCanvas.astro
│   ├── KommunenGrid.astro
│   ├── KategorienGrid.astro
│   ├── WerteGrid.astro
│   └── [Additional Page Components]
└── Footer.astro
```

## Core Components

### BaseLayout.astro

**Purpose:** Root layout for all pages with HTML structure, meta tags, favicon configuration, and global styles.

**Props:** No props - serves as wrapper component

**Usage:**
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <h1>Page Content</h1>
</BaseLayout>
```

**Features:**
- HTML5 structure with German language tag
- Responsive viewport meta tag
- Favicon configuration for all browsers (SVG, ICO, PNG)
- Web App Manifest for PWA support
- Theme Color (#000080)
- TailwindCSS integration
- Header/Footer integration

**Code Snippet:**
```astro
---
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import "../styles/global.css";
---

<html lang="de">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>P2D2 - Public-Public Data-DNA</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
        <!-- Additional favicon links -->
    </head>
    <body class="bg-white text-gray-900 flex flex-col min-h-screen">
        <Header />
        <main class="flex-1 flex flex-col">
            <slot />
        </main>
        <Footer />
    </body>
</html>
```

***

### Header.astro

**Purpose:** Global header with logo, navigation, and dropdown menus.

**Props:** No explicit props - uses Astro.url.pathname for active links

**Features:**
- Responsive navigation with dropdown for "About p2d2"
- Active state highlighting based on current URL
- Mouseenter/mouseleave for dropdown interaction
- Touch/tab fallback with click handler
- Logo with p2d2 branding
- Sticky positioning with backdrop blur

**Client Script:**
```javascript
<script is:inline>
// Fallback for touch/tab: open/close dropdown via click
document.querySelectorAll("li.relative > button[data-dropdown]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const target = e.target;
        if (!target.closest("[data-dropdown]")) return;
        e.preventDefault();
        const dropdown = btn.parentElement.querySelector("ul");
        if (dropdown) dropdown.classList.toggle("hidden");
    });
});
</script>
```

**Navigation Structure:**
```javascript
const nav = [
    {
        name: "About p2d2",
        key: "about",
        children: [
            { name: "Background", href: "/ueber/hintergrund" },
            { name: "Goal", href: "/ueber/ziel" },
            { name: "Implementation", href: "/ueber/umsetzung" },
            { name: "Status", href: "/ueber/status" },
        ],
    },
    { name: "Topics", href: "/themenbereiche", key: "themen" },
    { name: "Community", href: "/community", key: "community" },
    { name: "Participate", href: "/mitmachen", key: "mitmachen" },
    { name: "Contact", href: "/kontakt", key: "kontakt" },
];
```

***

### Footer.astro

**Purpose:** Global footer with dynamic links from content collections.

**Props:** No props - loads data from content collections

**Features:**
- Dynamic links from content collections (socialmedia, intern, resources, repositories, legal)
- Copyright text from content collection
- Responsive 3-column layout
- Social media icons
- Funding partner logo
- Legal links

**Data Loading:**
```astro
---
import { getCollection, getEntryBySlug } from "astro:content";

const socialmedia = await getCollection("socialmedia");
const intern = await getCollection("intern");
const resources = await getCollection("resources");
const repositories = await getCollection("repositories");
const legal = await getCollection("legal");
const copyrightEntry = await getCollection("copyright");
const copyright = copyrightEntry[0]?.data.text ?? "";
---
```

***

### OpenLayersMap.astro

**Purpose:** Container component for OpenLayers map with MapCanvas.

**Props:** No props - serves as wrapper for MapCanvas

**Usage:**
```astro
<OpenLayersMap />
```

**Features:**
- Responsive container for map
- Centered alignment
- MapCanvas integration

**Code:**
```astro
---
import MapCanvas from "./MapCanvas.astro";
---

<div class="w-full mb-section">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
        Select municipality/category and get started!
    </h2>
    <div class="w-full h-[30rem] text-lg text-grey-900 mb-8 text-center relative">
        <main class="w-full h-full">
            <MapCanvas />
        </main>
    </div>
</div>
```

***

### MapCanvas.astro

**Purpose:** Main map component with OpenLayers integration and interaction logic.

**Props:** No props - complex client-side implementation

**Client Directive:** `client:load`  
**Why:** Map must be immediately interactive for optimal UX

**Features:**
- OpenLayers map initialization
- WFS layer management
- Popup handler for feature information
- CRS toggle button (coordinate system switch)
- Tab system for municipalities/categories
- Responsive design with media queries
- Performance optimizations (throttled logger)

**Important Script Functions:**
- `createThrottledLogger()` - Performance optimization for logging
- `updateCRSButton()` - UI update for coordinate system
- `toggleCRS()` - Switch between coordinate systems
- MutationObserver for canvas detection

**Styling:**
- Responsive breakpoints for mobile/desktop
- Custom CSS for OpenLayers controls
- Shadow and border effects
- Hover animations

***

### KommunenGrid.astro

**Purpose:** Grid component for displaying all municipalities with click handling.

**Props:** No props - loads data from content collection

**Features:**
- Dynamic municipality data from content collection
- Sorting by order field
- Client-side click handler initialization
- Map data validation before dispatch
- Responsive grid layout
- Hover effects and animations

**Data Structure:**
```typescript
const kommuneDataMap: Record<
    string,
    { wp_name: string; osmAdminLevels: number[] }
> = {};
```

**Client Integration:**
```astro
<script>
import KommunenClickHandler from "../utils/kommunen-click-handler";

let kommunenHandler: KommunenClickHandler | null = null;
let isHandlerBound = false;

if (typeof window !== "undefined") {
    if (!(window as any).__p2d2KommunenHandlerBound && !isHandlerBound) {
        // Handler initialization
    }
}
</script>
```

***

### HeroSection.astro

**Purpose:** Hero section with video background and content overlay.

**Props:** No props - static hero section

**Features:**
- Video background with WebM/MP4 fallback
- Content from markdown file (`hero.md`)
- MVP overlay in four corners
- Responsive design
- Consistent width with map component

**Styling:**
- Custom CSS for hero typography
- Absolute positioning for overlay
- Neon effects for MVP text
- Backdrop effects

***

### Modal.astro

**Purpose:** Reusable modal component with HTML5 dialog element.

**Props:**
```typescript
interface Props {
  id: string;           // Unique modal ID
  open: string;         // Text for open button
  children: any;        // Modal content
}
```

**Slots:**
- `button`: Custom button content (optional)
- `default`: Modal content

**Usage:**
```astro
<Modal id="info-modal" open="More Information">
  <p>Modal content here</p>
</Modal>

<Modal id="custom-modal" open="Open">
  <div slot="button">
    <CustomButton>Custom Open</CustomButton>
  </div>
  <p>Custom modal content</p>
</Modal>
```

**Features:**
- HTML5 `<dialog>` element
- Native browser modal functionality
- Custom styling with shadow and border radius
- Accessibility friendly
- Close button with form method

***

## Additional Important Components

### KategorienGrid.astro
- Grid for topic categories
- Sorting by order field
- Responsive layout

### WerteGrid.astro  
- Display of p2d2 values
- Icon support
- Sorting by order field

### Feature Editor Components
- Special components for feature editor functionality
- Client-side interactions
- OpenLayers integration

### UI Components
- `ThemenbereichCard.astro` - Card component for topics
- `TestimonialCard.astro` - Testimonial display
- `CommunitySection.astro` - Community section
- `CallToAction.astro` - Call-to-action section

## Component Catalog

| Component | Path | Props | Slots | Client | Purpose |
|-----------|------|-------|-------|--------|---------|
| BaseLayout | layouts/BaseLayout.astro | - | default | - | Root Layout |
| Header | components/Header.astro | - | - | inline | Global Header |
| Footer | components/Footer.astro | - | - | - | Global Footer |
| OpenLayersMap | components/OpenLayersMap.astro | - | - | - | Map Container |
| MapCanvas | components/MapCanvas.astro | - | - | client:load | Main Map |
| KommunenGrid | components/KommunenGrid.astro | - | - | load | Municipalities Grid |
| KategorienGrid | components/KategorienGrid.astro | - | - | - | Categories Grid |
| WerteGrid | components/WerteGrid.astro | - | - | - | Values Grid |
| HeroSection | components/HeroSection.astro | - | - | - | Hero Section |
| Modal | components/Modal.astro | id, open, children | button, default | - | Dialog Modal |
| ThemenbereichCard | components/ThemenbereichCard.astro | - | - | - | Topic Card |
| CommunitySection | components/CommunitySection.astro | - | - | - | Community Section |
| MissionStatement | components/MissionStatement.astro | - | - | - | Mission Statement |
| CallToAction | components/CallToAction.astro | - | - | - | CTA Section |

## Props System

### Explicit Props (Modal.astro)

```typescript
---
const { id, open, children } = Astro.props;
---
```

### Implicit Props (URL-based)

```typescript
---
const currentPath = Astro.url.pathname;
---
```

### Content Collection Props

```typescript
---
const kommunen = await getCollection("kommunen");
const sorted = kommunen.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
---
```

## Slots System

### Default Slot (BaseLayout.astro)

```astro
<BaseLayout>
  <div>Page content in default slot</div>
</BaseLayout>
```

### Named Slots (Modal.astro)

```astro
<Modal id="custom" open="Open">
  <div slot="button">
    Custom Button
  </div>
  <div>Modal Content (Default Slot)</div>
</Modal>
```

## Client Directives

### Hydration Strategies

| Directive | Usage | Reasoning |
|-----------|-------|-----------|
| `client:load` | MapCanvas.astro | Map must be immediately interactive |
| Inline Script | Header.astro | Simple dropdown interaction |
| No Directive | Static components | SSR only, no interaction needed |

### Performance Optimization

- **SSR-First:** All components server-side rendered
- **Selective Hydration:** Only MapCanvas requires client JavaScript
- **Inline Scripts:** For simple interactions without bundle

## Styling Architecture

### TailwindCSS Primary

```astro
<header class="w-full bg-green-50/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
```

### Scoped Styles (HeroSection.astro)

```astro
<style>
:global(.hero-section h1) {
    font-family: "Poppins", sans-serif;
    font-weight: 800;
    font-size: 3.75rem;
}
</style>
```

### Responsive Design

```astro
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
```

## Script Blocks

### Standard Script (MapCanvas.astro)

```astro
<script>
// Bundled by Vite
import Map from 'ol/Map';
import View from 'ol/View';
// Complex map logic
</script>
```

### Inline Script (Header.astro)

```astro
<script is:inline>
// Directly in HTML - simple interaction
document.querySelectorAll("button[data-dropdown]").forEach(btn => {
    btn.addEventListener("click", handleClick);
});
</script>
```

## Best Practices

### Data Loading Pattern

```astro
---
// Server-side data fetching
const data = await getCollection("collection");
const sorted = data.sort((a, b) => a.data.order - b.data.order);
---

<!-- Client-side data usage -->
<div data-map={JSON.stringify(sorted)}>
```

### Component Composition

```astro
<OpenLayersMap>
  <MapCanvas client:load />
</OpenLayersMap>
```

### Performance

- Minimal client JavaScript usage
- Lazy loading where possible
- SSR for static content
- Selective hydration for interactive parts

## Usage Example

### Complete Homepage

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HeroSection from '../components/HeroSection.astro';
import OpenLayersMap from '../components/OpenLayersMap.astro';
import KommunenGrid from '../components/KommunenGrid.astro';
---

<BaseLayout>
  <HeroSection />
  
  <OpenLayersMap />
  
  <KommunenGrid />
</BaseLayout>
```

## Dependencies

**Astro:**
- `astro` - Framework
- `@astrojs/tailwind` - TailwindCSS integration
- `astro:content` - Content collections

**UI Libraries:**
- TailwindCSS - Utility-first CSS
- OpenLayers - Map rendering
- Poppins Font - Typography

**Own Modules:**
- `src/utils/kommunen-click-handler.ts` - Grid interaction
- `src/content/` - Content collections