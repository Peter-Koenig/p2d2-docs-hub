---
title: "TailwindCSS Styling"
description: "TailwindCSS-Integration, Custom-Theme, Utility-Klassen und Design-System in p2d2"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# TailwindCSS Styling

## Übersicht

p2d2 nutzt TailwindCSS als Utility-First CSS-Framework. Die Konfiguration ist auf die Projektanforderungen zugeschnitten und erweitert das Standard-Theme um projektspezifische Farben, Schriften und Spacing-Werte. Das Design-System basiert auf einer grünen Farbpalette mit klarer Typography-Hierarchie.

## TailwindCSS-Integration

### Astro-Integration

```javascript
// astro.config.mjs
vite: {
  plugins: [tailwindcss()],
  // ... weitere Konfiguration
}
```

**Verwendete Version:** `@tailwindcss/vite` (via Astro Integration)

### Content-Konfiguration

```javascript
// tailwind.config.mjs
content: [
  "./src/**/*.{astro,js,ts,jsx,tsx,md,mdx}",
  "./src/content/**/*.{md,mdx}",
]
```

**Erfasste Dateien:**
- Astro-Komponenten (`.astro`)
- Markdown-Content (`.md`, `.mdx`)
- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)

## Custom Theme

### Farbpalette

```javascript
// tailwind.config.mjs
theme: {
  extend: {
    colors: {
      primary: {
        50: "#eefff6",
        100: "#d7ffea",
        200: "#b2ffd6",
        300: "#79ffb9",
        400: "#3eff95",
        500: "#16f079",
        600: "#00cc5e",
        700: "#00a04d",
        800: "#007d40",
        900: "#006737",
      },
    }
  }
}
```

**Primary Colors (Grüne Palette):**

| Farbe | Hex-Code | Verwendung | Preview |
|-------|----------|------------|---------|
| Primary 50 | `#eefff6` | Sehr helle Hintergründe | 🟩 |
| Primary 100 | `#d7ffea` | Helle Hintergründe | 🟩 |
| Primary 200 | `#b2ffd6` | Subtile Akzente | 🟩 |
| Primary 300 | `#79ffb9` | Hover-States | 🟩 |
| Primary 400 | `#3eff95` | Sekundäre Aktionen | 🟩 |
| Primary 500 | `#16f079` | Primäre Aktionen | 🟩 |
| Primary 600 | `#00cc5e` | Active-States | 🟩 |
| Primary 700 | `#00a04d` | Text auf hellem Hintergrund | 🟩 |
| Primary 800 | `#007d40` | Überschriften | 🟩 |
| Primary 900 | `#006737` | Dunkle Akzente | 🟩 |

**Brand-Colors für spezifische Bereiche:**

| Bereich | Farbe | Hex-Code | Verwendung |
|---------|-------|----------|------------|
| Kommunen | Orange | `#FF6900` | Kommunen-Tabs, Highlights |
| Kategorien | Grün | `#0FF078` | Kategorien-Tabs, Highlights |

**Verwendungsbeispiel:**
```astro
<!-- Primary Color für Buttons -->
<button class="bg-primary-500 hover:bg-primary-600 text-white">
  Speichern
</button>

<!-- Kommunen-Orange für spezifische Elemente -->
<div class="bg-[#FF6900] text-white">
  Kommunen-Bereich
</div>
```

### Typography

**Schriftfamilien:**
```javascript
fontFamily: {
  poppins: ["Poppins", ...fontFamily.sans],
  inter: ["Inter", ...fontFamily.sans],
  sans: ["Inter", ...fontFamily.sans],
  display: ["Poppins", ...fontFamily.sans],
}
```

| Variable | Schrift | Verwendung |
|----------|---------|------------|
| `font-poppins` | Poppins | Überschriften, Display-Text |
| `font-inter` | Inter | Body-Text, UI-Elemente |
| `font-sans` | Inter | Standard-Sans-Serif |
| `font-display` | Poppins | Besondere Hervorhebungen |

**Custom Schriftgrößen:**
```javascript
fontSize: {
  hero: "3.75rem",     // 60px - Hero-Bereich
  section: "2.25rem",  // 36px - Sektions-Überschriften
  base: "1.125rem",    // 18px - Standard-Text
  list: "1rem",        // 16px - Listen-Text
}
```

**Verwendung:**
```astro
<h1 class="font-poppins text-hero font-bold">Hero Überschrift</h1>
<p class="font-inter text-base leading-relaxed">Body Text</p>
<code class="font-mono text-sm">const map = new Map();</code>
```

### Typography-Plugin-Konfiguration

```javascript
typography: ({ theme }) => ({
  DEFAULT: {
    css: {
      color: theme("colors.gray.800"),
      fontFamily: theme("fontFamily.inter").join(", "),
      fontSize: theme("fontSize.base"),
      lineHeight: "1.75",
      maxWidth: "80ch",
      // Spezifische Styling für alle HTML-Elemente
    }
  }
})
```

## Global Styles

### Base Layer

```css
/* src/styles/global.css */
@import "ol/ol.css";
@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --mb-section: 2rem;
}
@media (min-width: 640px) {
  :root {
    --mb-section: 3rem;
  }
}
@media (min-width: 768px) {
  :root {
    --mb-section: 4rem;
  }
}
@media (min-width: 1024px) {
  :root {
    --mb-section: 5.5rem;
  }
}

.mb-section {
  margin-bottom: var(--mb-section, 1rem);
}
```

**Custom CSS-Variablen:**
- `--mb-section`: Responsive Margin-Bottom für Sektionsabstände

### Font-Face-Definitionen

```css
@font-face {
  font-family: "Poppins";
  src: url("/fonts/Poppins-Regular.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Poppins";
  src: url("/fonts/Poppins-Bold.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-VariableFont_opsz,wght.ttf") format("truetype");
  font-weight: 100 900;
  font-display: swap;
}
```

### Components Layer

**Highlight-States:**
```css
/* Button-Highlighting für aktive Auswahl - ORANGE für Kommunen */
[data-kommune-slug].highlighted {
  box-shadow: 0 0 20px 4px rgba(255, 105, 0, 0.6);
  border-color: #ff6900;
  transform: scale(1.02);
}

/* Button-Highlighting für aktive Auswahl - GRÜN für Kategorien */
[data-category-slug].highlighted {
  box-shadow: 0 0 20px 4px rgba(15, 255, 120, 0.6);
  border-color: #0ff078;
  transform: scale(1.02);
}
```

**Tab-Button-Styling:**
```css
.tab-button {
  position: relative;
  z-index: 51;
  min-width: 120px;
  backdrop-filter: blur(8px);
}

/* Orange für Kommunen */
.tab-button[data-tab="kommunen"] {
  background-color: rgba(255, 105, 0, 0.9);
  border-top-color: #ff6900;
}

/* Grün für Kategorien */
.tab-button[data-tab="kategorien"] {
  background-color: rgba(22, 240, 121, 0.9);
  border-top-color: #0ff078;
}
```

## Utility-Klassen-Patterns

### Layout-Patterns

**Container & Zentrierung:**
```astro
<!-- Zentrierter Container mit max-width -->
<div class="max-w-7xl mx-auto px-6 py-12">
  <!-- Content -->
</div>

<!-- Full-width mit Padding -->
<div class="w-full px-4 py-8">
```

**Responsive Grid-System:**
```astro
<!-- Standard: 1 Spalte Mobile, 3 Spalten Desktop -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Footer: 1 Spalte Mobile, 3 Spalten Desktop -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-800">
```

**Flexbox-Patterns:**
```astro
<!-- Header: Horizontal mit Space Between -->
<nav class="flex items-center justify-between px-6 py-4">

<!-- Hero: Vertical Center -->
<div class="flex items-center justify-center text-center">

<!-- Navigation: Horizontal mit Gap -->
<ul class="flex ml-12 gap-6 text-lg font-medium">
```

### Typography-Patterns

**Headings mit Brand-Fonts:**
```astro
<h1 class="font-poppins text-4xl font-bold text-gray-900 mb-4">
<h2 class="font-poppins text-3xl font-semibold text-gray-800 mb-3">
<h3 class="font-poppins text-2xl font-medium text-gray-700 mb-2">
```

**Body-Text:**
```astro
<p class="font-inter text-base text-gray-600 leading-relaxed">
<p class="text-lg text-gray-700 max-w-3xl mx-auto">
```

**Hero-Typography:**
```astro
<h1 class="font-poppins font-bold text-hero tracking-tight">
```

### Card-Patterns

**Standard Card:**
```astro
<div class="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
  <h3 class="font-poppins font-bold text-2xl mb-4">Titel</h3>
  <p class="text-gray-700 leading-relaxed">Beschreibung</p>
</div>
```

**Interactive Card mit Hover:**
```astro
<div class="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-8">
  <!-- Content mit Hover-Effekten -->
</div>
```

**Color-Stripe Card (Kommunen):**
```astro
<div class="relative bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-1.5 z-10" style="background-color: #FF6900"></div>
  <div class="relative z-10 p-6">
    <h3 class="font-poppins font-bold text-xl">Köln</h3>
  </div>
</div>
```

### Button-Patterns

**Primary Button:**
```astro
<button class="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200">
  Aktion
</button>
```

**Tab-Buttons:**
```astro
<button class="tab-button active bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg">
  Kommunen
</button>
```

**Icon-Buttons:**
```astro
<button class="p-2 rounded-full hover:bg-gray-100 transition">
  <svg class="h-6 w-6">...</svg>
</button>
```

### Section-Spacing

**Responsive Margin-Bottom:**
```astro
<section class="mb-section">
  <!-- Content mit automatischem responsive Abstand -->
</section>

<!-- Manuelle Überschreibung -->
<div class="mb-12 md:mb-16 lg:mb-20">
```

## Responsive Design

### Mobile-First-Approach

Standard-Klassen gelten für mobile, Breakpoint-Prefixes für größere Screens:

```astro
<!-- Grid: 1 Spalte Mobile, 2 Spalten Tablet, 3 Spalten Desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

<!-- Flex: Column Mobile, Row Desktop -->
<div class="flex flex-col md:flex-row gap-4">

<!-- Text: Klein Mobile, Groß Desktop -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">
```

### Breakpoint-Strategy

| Breakpoint | Min-Width | Verwendung |
|------------|-----------|------------|
| `sm` | 640px | Mobile Landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large Desktop |
| `2xl` | 1536px | Extra Large |

**Responsive Patterns:**
```astro
<!-- Padding: Klein Mobile, Groß Desktop -->
<div class="p-4 md:p-6 lg:p-8">

<!-- Sichtbarkeit: Nur auf bestimmten Screens -->
<div class="hidden md:block">Nur Desktop</div>
<div class="block md:hidden">Nur Mobile</div>

<!-- Width: Full Mobile, Half Desktop -->
<div class="w-full md:w-1/2">
```

## Design-System-Komponenten

### Color-System

**Primäre Palette (Grün):**
- `primary-500` (#16f079) - Hauptaktionen, Buttons
- `primary-700` (#00a04d) - Text auf hellem Hintergrund
- `primary-50` (#eefff6) - Hintergründe

**Sekundäre Farben:**
- Orange (`#FF6900`) - Kommunen-Bereich
- Grün (`#0FF078`) - Kategorien-Bereich
- Grau-Skala - Text, Borders, Hintergründe

### Typography-System

**Display-Typography:**
- Hero: `font-poppins text-hero font-bold`
- Section: `font-poppins text-section font-bold`
- Card-Title: `font-poppins text-2xl font-bold`

**Body-Typography:**
- Standard: `font-inter text-base leading-relaxed`
- Large: `font-inter text-lg leading-relaxed`
- Small: `font-inter text-sm`

### Spacing-System

**Section-Spacing:**
- `mb-section` - Responsive Margin-Bottom
- `py-12` - Standard Vertical Padding
- `px-6` - Standard Horizontal Padding

**Grid-Gaps:**
- `gap-8` - Standard Grid-Gap
- `gap-6` - Engerer Gap
- `gap-4` - Sehr enger Gap

## Plugins

### @tailwindcss/typography

**Verwendung für Markdown-Content:**
```astro
<article class="prose lg:prose-xl">
  <!-- Automatisch gestylter Markdown-Content -->
</article>
```

**Custom Typography-Konfiguration:**
- Custom Fonts (Poppins für Headings, Inter für Body)
- Custom Colors (Primary Palette)
- Custom Spacing und Line-Heights
- Styling für Code-Blöcke, Tabellen, Listen

## Performance-Optimierungen

### PurgeCSS / Content-Scanning

Tailwind entfernt automatisch ungenutzte CSS-Klassen basierend auf:

```javascript
content: [
  "./src/**/*.{astro,js,ts,jsx,tsx,md,mdx}",
  "./src/content/**/*.{md,mdx}",
]
```

**Production-Build:**
- Nur verwendete Utilities im finalen CSS
- Typische Größe: ~10-50 KB (statt mehrere MB)
- Automatische Tree-Shaking

### JIT-Mode (Just-In-Time)

Moderne Tailwind-Versionen nutzen JIT standardmäßig:
- On-Demand-Generierung von Klassen
- Schnellere Build-Zeiten
- Arbitrary Values: `w-[137px]`, `bg-[#1da1f2]`

## Best Practices

### Konsistenz

1. **Fonts:** Immer `font-poppins` für Überschriften, `font-inter` für Body
2. **Colors:** Primär `primary-*` Palette für Brand-Elemente
3. **Spacing:** Konsistente `gap-8` und `mb-section` Werte
4. **Shadows:** `shadow-lg` für Cards, `shadow-2xl` für Hover

### Komponenten-Extraktion

Für wiederkehrende Patterns:

**CSS Components:**
```css
@layer components {
  .tab-button {
    @apply px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200;
  }
}
```

**Astro Components:**
```astro
<Button variant="primary">Text</Button>
```

### Arbitrary Values

Für einmalige Werte:
```astro
<div class="w-[137px] top-[117px] bg-[#FF6900]">
  <!-- Spezifische Werte wenn nötig -->
</div>
```

**Aber:** Bevorzuge Theme-Values wenn möglich!

## Debugging

### Tailwind IntelliSense

**VS Code Extension:**
- Autocomplete für Klassen
- CSS-Preview on H