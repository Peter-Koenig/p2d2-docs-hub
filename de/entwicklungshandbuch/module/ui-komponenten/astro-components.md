---
title: "Astro Components"
description: "Dokumentation aller Astro-Komponenten in p2d2: Struktur, Props, Slots, Client-Directives"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Astro Components

## Übersicht

p2d2 nutzt Astro-Komponenten für die UI-Architektur. Astro-Komponenten sind serverseitig gerendert und können optional Client-Side-JavaScript enthalten. Das System besteht aus 21 Hauptkomponenten, die in Layout-, Feature- und UI-Komponenten unterteilt sind.

## Komponenten-Hierarchie

```
BaseLayout.astro (Root-Layout)
├── Header.astro
├── <slot /> (Seiten-Content)
│   ├── HeroSection.astro
│   ├── OpenLayersMap.astro
│   │   └── MapCanvas.astro
│   ├── KommunenGrid.astro
│   ├── KategorienGrid.astro
│   ├── WerteGrid.astro
│   └── [Weitere Seiten-Komponenten]
└── Footer.astro
```

## Kern-Komponenten

### BaseLayout.astro

**Zweck:** Root-Layout für alle Seiten mit HTML-Grundstruktur, Meta-Tags, Favicon-Konfiguration und globalen Styles.

**Props:** Keine Props - dient als Wrapper-Komponente

**Verwendung:**
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <h1>Seiteninhalt</h1>
</BaseLayout>
```

**Features:**
- HTML5-Grundstruktur mit deutschem Language-Tag
- Responsive Viewport-Meta-Tag
- Favicon-Konfiguration für alle Browser (SVG, ICO, PNG)
- Web App Manifest für PWA-Unterstützung
- Theme Color (#000080)
- TailwindCSS-Integration
- Header/Footer-Einbindung

**Code-Ausschnitt:**
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
        <!-- Weitere Favicon-Links -->
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

**Zweck:** Globaler Header mit Logo, Navigation und Dropdown-Menüs.

**Props:** Keine expliziten Props - nutzt Astro.url.pathname für aktive Links

**Features:**
- Responsive Navigation mit Dropdown für "Über p2d2"
- Active-State-Highlighting basierend auf aktueller URL
- Mouseenter/Mouseleave für Dropdown-Interaktion
- Touch/Tab-Fallback mit Click-Handler
- Logo mit p2d2-Branding
- Sticky Positioning mit Backdrop-Blur

**Client-Script:**
```javascript
<script is:inline>
// Fallback für Touch/Tab: Dropdown per Klick öffnen/schließen
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

**Navigation-Struktur:**
```javascript
const nav = [
    {
        name: "Über p2d2",
        key: "about",
        children: [
            { name: "Hintergrund", href: "/ueber/hintergrund" },
            { name: "Ziel", href: "/ueber/ziel" },
            { name: "Umsetzung", href: "/ueber/umsetzung" },
            { name: "Status", href: "/ueber/status" },
        ],
    },
    { name: "Themenbereiche", href: "/themenbereiche", key: "themen" },
    { name: "Community", href: "/community", key: "community" },
    { name: "Mitmachen", href: "/mitmachen", key: "mitmachen" },
    { name: "Kontakt", href: "/kontakt", key: "kontakt" },
];
```

***

### Footer.astro

**Zweck:** Globaler Footer mit dynamischen Links aus Content Collections.

**Props:** Keine Props - lädt Daten aus Content Collections

**Features:**
- Dynamische Links aus Content Collections (socialmedia, intern, resources, repositories, legal)
- Copyright-Text aus Content Collection
- Responsive 3-Spalten-Layout
- Social Media Icons
- Förderpartner-Logo
- Rechtliche Links

**Daten-Loading:**
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

**Zweck:** Container-Komponente für die OpenLayers-Karte mit MapCanvas.

**Props:** Keine Props - dient als Wrapper für MapCanvas

**Verwendung:**
```astro
<OpenLayersMap />
```

**Features:**
- Responsive Container für Karte
- Zentrierte Ausrichtung
- MapCanvas-Integration

**Code:**
```astro
---
import MapCanvas from "./MapCanvas.astro";
---

<div class="w-full mb-section">
    <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
        Kommune / Kategorie auswählen und los gehts!
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

**Zweck:** Haupt-Kartenkomponente mit OpenLayers-Integration und Interaktionslogik.

**Props:** Keine Props - komplexe Client-Side-Implementierung

**Client-Directive:** `client:load`  
**Warum:** Karte muss sofort interaktiv sein für optimale UX

**Features:**
- OpenLayers-Karteninitialisierung
- WFS-Layer-Management
- Popup-Handler für Feature-Informationen
- CRS-Toggle-Button (Koordinatensystem-Wechsel)
- Tab-System für Kommunen/Kategorien
- Responsive Design mit Media Queries
- Performance-Optimierungen (Throttled Logger)

**Wichtige Script-Funktionen:**
- `createThrottledLogger()` - Performance-Optimierung für Logging
- `updateCRSButton()` - UI-Update für Koordinatensystem
- `toggleCRS()` - Wechsel zwischen Koordinatensystemen
- MutationObserver für Canvas-Detection

**Styling:**
- Responsive Breakpoints für Mobile/Desktop
- Custom CSS für OpenLayers-Controls
- Shadow und Border-Effekte
- Hover-Animationen

***

### KommunenGrid.astro

**Zweck:** Grid-Komponente für die Darstellung aller Kommunen mit Click-Handling.

**Props:** Keine Props - lädt Daten aus Content Collection

**Features:**
- Dynamische Kommunen-Daten aus Content Collection
- Sortierung nach Order-Feld
- Client-seitige Click-Handler-Initialisierung
- Validierung von Karten-Daten vor Dispatch
- Responsive Grid-Layout
- Hover-Effekte und Animationen

**Daten-Struktur:**
```typescript
const kommuneDataMap: Record<
    string,
    { wp_name: string; osmAdminLevels: number[] }
> = {};
```

**Client-Integration:**
```astro
<script>
import KommunenClickHandler from "../utils/kommunen-click-handler";

let kommunenHandler: KommunenClickHandler | null = null;
let isHandlerBound = false;

if (typeof window !== "undefined") {
    if (!(window as any).__p2d2KommunenHandlerBound && !isHandlerBound) {
        // Handler-Initialisierung
    }
}
</script>
```

***

### HeroSection.astro

**Zweck:** Hero-Bereich mit Video-Hintergrund und Content-Overlay.

**Props:** Keine Props - statischer Hero-Bereich

**Features:**
- Video-Hintergrund mit WebM/MP4-Fallback
- Content aus Markdown-Datei (`hero.md`)
- MVP-Overlay in den vier Ecken
- Responsive Design
- Konsistente Breite mit Karten-Komponente

**Styling:**
- Custom CSS für Hero-Typography
- Absolute Positionierung für Overlay
- Neon-Effekte für MVP-Text
- Backdrop-Effekte

***

### Modal.astro

**Zweck:** Reusable Modal-Komponente mit HTML5 Dialog-Element.

**Props:**
```typescript
interface Props {
  id: string;           // Eindeutige Modal-ID
  open: string;         // Text für Öffnen-Button
  children: any;        // Modal-Inhalt
}
```

**Slots:**
- `button`: Custom Button-Content (optional)
- `default`: Modal-Inhalt

**Verwendung:**
```astro
<Modal id="info-modal" open="Mehr Informationen">
  <p>Modal-Inhalt hier</p>
</Modal>

<Modal id="custom-modal" open="Öffnen">
  <div slot="button">
    <CustomButton>Custom Öffnen</CustomButton>
  </div>
  <p>Custom Modal-Inhalt</p>
</Modal>
```

**Features:**
- HTML5 `<dialog>` Element
- Native Browser-Modal-Funktionalität
- Custom Styling mit Shadow und Border-Radius
- Accessibility-freundlich
- Schließen-Button mit Form-Method

***

## Weitere wichtige Komponenten

### KategorienGrid.astro
- Grid für Themenkategorien
- Sortierung nach Order-Feld
- Responsive Layout

### WerteGrid.astro  
- Darstellung der p2d2-Werte
- Icon-Unterstützung
- Sortierung nach Order-Feld

### Feature-Editor Komponenten
- Spezielle Komponenten für Feature-Editor-Funktionalität
- Client-seitige Interaktionen
- OpenLayers-Integration

### UI-Komponenten
- `ThemenbereichCard.astro` - Karten-Komponente für Themen
- `TestimonialCard.astro` - Testimonial-Darstellung
- `CommunitySection.astro` - Community-Bereich
- `CallToAction.astro` - Call-to-Action-Bereich

## Komponenten-Katalog

| Komponente | Pfad | Props | Slots | Client | Zweck |
|------------|------|-------|-------|--------|-------|
| BaseLayout | layouts/BaseLayout.astro | - | default | - | Root-Layout |
| Header | components/Header.astro | - | - | inline | Globaler Header |
| Footer | components/Footer.astro | - | - | - | Globaler Footer |
| OpenLayersMap | components/OpenLayersMap.astro | - | - | - | Karten-Container |
| MapCanvas | components/MapCanvas.astro | - | - | client:load | Haupt-Karte |
| KommunenGrid | components/KommunenGrid.astro | - | - | load | Kommunen-Grid |
| KategorienGrid | components/KategorienGrid.astro | - | - | - | Kategorien-Grid |
| WerteGrid | components/WerteGrid.astro | - | - | - | Werte-Grid |
| HeroSection | components/HeroSection.astro | - | - | - | Hero-Bereich |
| Modal | components/Modal.astro | id, open, children | button, default | - | Dialog-Modal |
| ThemenbereichCard | components/ThemenbereichCard.astro | - | - | - | Themen-Karte |
| CommunitySection | components/CommunitySection.astro | - | - | - | Community-Bereich |
| MissionStatement | components/MissionStatement.astro | - | - | - | Mission-Statement |
| CallToAction | components/CallToAction.astro | - | - | - | CTA-Bereich |

## Props-System

### Explizite Props (Modal.astro)

```typescript
---
const { id, open, children } = Astro.props;
---
```

### Implizite Props (URL-basiert)

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

## Slots-System

### Default Slot (BaseLayout.astro)

```astro
<BaseLayout>
  <div>Seiteninhalt im Default-Slot</div>
</BaseLayout>
```

### Named Slots (Modal.astro)

```astro
<Modal id="custom" open="Öffnen">
  <div slot="button">
    Custom Button
  </div>
  <div>Modal Content (Default Slot)</div>
</Modal>
```

## Client-Directives

### Hydration-Strategien

| Directive | Verwendung | Begründung |
|-----------|------------|------------|
| `client:load` | MapCanvas.astro | Karte muss sofort interaktiv sein |
| Inline Script | Header.astro | Einfache Dropdown-Interaktion |
| Keine Directive | Statische Komponenten | Nur SSR, keine Interaktion nötig |

### Performance-Optimierung

- **SSR-First:** Alle Komponenten serverseitig rendern
- **Selective Hydration:** Nur MapCanvas benötigt Client-JavaScript
- **Inline Scripts:** Für einfache Interaktionen ohne Bundle

## Styling-Architektur

### TailwindCSS-Primary

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

## Script-Blöcke

### Standard Script (MapCanvas.astro)

```astro
<script>
// Wird von Vite gebundelt
import Map from 'ol/Map';
import View from 'ol/View';
// Komplexe Karten-Logik
</script>
```

### Inline Script (Header.astro)

```astro
<script is:inline>
// Direkt in HTML - einfache Interaktion
document.querySelectorAll("button[data-dropdown]").forEach(btn => {
    btn.addEventListener("click", handleClick);
});
</script>
```

## Best Practices

### Daten-Loading Pattern

```astro
---
// Serverseitiges Data-Fetching
const data = await getCollection("collection");
const sorted = data.sort((a, b) => a.data.order - b.data.order);
---

<!-- Client-seitige Daten-Nutzung -->
<div data-map={JSON.stringify(sorted)}>
```

### Component Composition

```astro
<OpenLayersMap>
  <MapCanvas client:load />
</OpenLayersMap>
```

### Performance

- Minimale Client-JavaScript-Nutzung
- Lazy Loading wo möglich
- SSR für statische Inhalte
- Selective Hydration für interaktive Teile

## Verwendungsbeispiel

### Komplette Startseite

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

## Abhängigkeiten

**Astro:**
- `astro` - Framework
- `@astrojs/tailwind` - TailwindCSS-Integration
- `astro:content` - Content Collections

**UI-Libraries:**
- TailwindCSS - Utility-First CSS
- OpenLayers - Karten-Rendering
- Poppins Font - Typography

**Eigene Module:**
- `src/utils/kommunen-click-handler.ts` - Grid-Interaktion
- `src/content/` - Content Collections