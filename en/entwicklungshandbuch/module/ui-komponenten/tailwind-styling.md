---
title: "TailwindCSS Styling"
description: "TailwindCSS integration, custom theme, utility classes and design system in p2d2"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# TailwindCSS Styling

## Overview

p2d2 uses TailwindCSS as a utility-first CSS framework. The configuration is tailored to project requirements and extends the standard theme with project-specific colors, fonts, and spacing values. The design system is based on a green color palette with clear typography hierarchy.

## TailwindCSS Integration

### Astro Integration

```javascript
// astro.config.mjs
vite: {
  plugins: [tailwindcss()],
  // ... additional configuration
}
```

**Used Version:** `@tailwindcss/vite` (via Astro integration)

### Content Configuration

```javascript
// tailwind.config.mjs
content: [
  "./src/**/*.{astro,js,ts,jsx,tsx,md,mdx}",
  "./src/content/**/*.{md,mdx}",
]
```

**Scanned Files:**
- Astro components (`.astro`)
- Markdown content (`.md`, `.mdx`)
- TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`)

## Custom Theme

### Color Palette

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

**Primary Colors (Green Palette):**

| Color | Hex Code | Usage | Preview |
|-------|----------|-------|---------|
| Primary 50 | `#eefff6` | Very light backgrounds | 🟩 |
| Primary 100 | `#d7ffea` | Light backgrounds | 🟩 |
| Primary 200 | `#b2ffd6` | Subtle accents | 🟩 |
| Primary 300 | `#79ffb9` | Hover states | 🟩 |
| Primary 400 | `#3eff95` | Secondary actions | 🟩 |
| Primary 500 | `#16f079` | Primary actions | 🟩 |
| Primary 600 | `#00cc5e` | Active states | 🟩 |
| Primary 700 | `#00a04d` | Text on light background | 🟩 |
| Primary 800 | `#007d40` | Headings | 🟩 |
| Primary 900 | `#006737` | Dark accents | 🟩 |

**Brand Colors for Specific Areas:**

| Area | Color | Hex Code | Usage |
|------|-------|----------|-------|
| Municipalities | Orange | `#FF6900` | Municipality tabs, highlights |
| Categories | Green | `#0FF078` | Category tabs, highlights |

**Usage Example:**
```astro
<!-- Primary color for buttons -->
<button class="bg-primary-500 hover:bg-primary-600 text-white">
  Save
</button>

<!-- Municipality orange for specific elements -->
<div class="bg-[#FF6900] text-white">
  Municipalities Area
</div>
```

### Typography

**Font Families:**
```javascript
fontFamily: {
  poppins: ["Poppins", ...fontFamily.sans],
  inter: ["Inter", ...fontFamily.sans],
  sans: ["Inter", ...fontFamily.sans],
  display: ["Poppins", ...fontFamily.sans],
}
```

| Variable | Font | Usage |
|----------|------|-------|
| `font-poppins` | Poppins | Headings, display text |
| `font-inter` | Inter | Body text, UI elements |
| `font-sans` | Inter | Standard sans-serif |
| `font-display` | Poppins | Special highlights |

**Custom Font Sizes:**
```javascript
fontSize: {
  hero: "3.75rem",     // 60px - Hero section
  section: "2.25rem",  // 36px - Section headings
  base: "1.125rem",    // 18px - Standard text
  list: "1rem",        // 16px - List text
}
```

**Usage:**
```astro
<h1 class="font-poppins text-hero font-bold">Hero Heading</h1>
<p class="font-inter text-base leading-relaxed">Body Text</p>
<code class="font-mono text-sm">const map = new Map();</code>
```

### Typography Plugin Configuration

```javascript
typography: ({ theme }) => ({
  DEFAULT: {
    css: {
      color: theme("colors.gray.800"),
      fontFamily: theme("fontFamily.inter").join(", "),
      fontSize: theme("fontSize.base"),
      lineHeight: "1.75",
      maxWidth: "80ch",
      // Specific styling for all HTML elements
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

**Custom CSS Variables:**
- `--mb-section`: Responsive margin-bottom for section spacing

### Font Face Definitions

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

**Highlight States:**
```css
/* Button highlighting for active selection - ORANGE for municipalities */
[data-kommune-slug].highlighted {
  box-shadow: 0 0 20px 4px rgba(255, 105, 0, 0.6);
  border-color: #ff6900;
  transform: scale(1.02);
}

/* Button highlighting for active selection - GREEN for categories */
[data-category-slug].highlighted {
  box-shadow: 0 0 20px 4px rgba(15, 255, 120, 0.6);
  border-color: #0ff078;
  transform: scale(1.02);
}
```

**Tab Button Styling:**
```css
.tab-button {
  position: relative;
  z-index: 51;
  min-width: 120px;
  backdrop-filter: blur(8px);
}

/* Orange for municipalities */
.tab-button[data-tab="kommunen"] {
  background-color: rgba(255, 105, 0, 0.9);
  border-top-color: #ff6900;
}

/* Green for categories */
.tab-button[data-tab="kategorien"] {
  background-color: rgba(22, 240, 121, 0.9);
  border-top-color: #0ff078;
}
```

## Utility Class Patterns

### Layout Patterns

**Container & Centering:**
```astro
<!-- Centered container with max-width -->
<div class="max-w-7xl mx-auto px-6 py-12">
  <!-- Content -->
</div>

<!-- Full-width with padding -->
<div class="w-full px-4 py-8">
```

**Responsive Grid System:**
```astro
<!-- Standard: 1 column mobile, 3 columns desktop -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Footer: 1 column mobile, 3 columns desktop -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-800">
```

**Flexbox Patterns:**
```astro
<!-- Header: Horizontal with space between -->
<nav class="flex items-center justify-between px-6 py-4">

<!-- Hero: Vertical center -->
<div class="flex items-center justify-center text-center">

<!-- Navigation: Horizontal with gap -->
<ul class="flex ml-12 gap-6 text-lg font-medium">
```

### Typography Patterns

**Headings with Brand Fonts:**
```astro
<h1 class="font-poppins text-4xl font-bold text-gray-900 mb-4">
<h2 class="font-poppins text-3xl font-semibold text-gray-800 mb-3">
<h3 class="font-poppins text-2xl font-medium text-gray-700 mb-2">
```

**Body Text:**
```astro
<p class="font-inter text-base text-gray-600 leading-relaxed">
<p class="text-lg text-gray-700 max-w-3xl mx-auto">
```

**Hero Typography:**
```astro
<h1 class="font-poppins font-bold text-hero tracking-tight">
```

### Card Patterns

**Standard Card:**
```astro
<div class="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
  <h3 class="font-poppins font-bold text-2xl mb-4">Title</h3>
  <p class="text-gray-700 leading-relaxed">Description</p>
</div>
```

**Interactive Card with Hover:**
```astro
<div class="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-8">
  <!-- Content with hover effects -->
</div>
```

**Color Stripe Card (Municipalities):**
```astro
<div class="relative bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
  <div class="absolute top-0 left-0 w-full h-1.5 z-10" style="background-color: #FF6900"></div>
  <div class="relative z-10 p-6">
    <h3 class="font-poppins font-bold text-xl">Cologne</h3>
  </div>
</div>
```

### Button Patterns

**Primary Button:**
```astro
<button class="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200">
  Action
</button>
```

**Tab Buttons:**
```astro
<button class="tab-button active bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg">
  Municipalities
</button>
```

**Icon Buttons:**
```astro
<button class="p-2 rounded-full hover:bg-gray-100 transition">
  <svg class="h-6 w-6">...</svg>
</button>
```

### Section Spacing

**Responsive Margin Bottom:**
```astro
<section class="mb-section">
  <!-- Content with automatic responsive spacing -->
</section>

<!-- Manual override -->
<div class="mb-12 md:mb-16 lg:mb-20">
```

## Responsive Design

### Mobile-First Approach

Standard classes apply to mobile, breakpoint prefixes for larger screens:

```astro
<!-- Grid: 1 column mobile, 2 columns tablet, 3 columns desktop -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

<!-- Flex: Column mobile, row desktop -->
<div class="flex flex-col md:flex-row gap-4">

<!-- Text: Small mobile, large desktop -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">
```

### Breakpoint Strategy

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Mobile Landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large Desktop |
| `2xl` | 1536px | Extra Large |

**Responsive Patterns:**
```astro
<!-- Padding: Small mobile, large desktop -->
<div class="p-4 md:p-6 lg:p-8">

<!-- Visibility: Only on specific screens -->
<div class="hidden md:block">Desktop Only</div>
<div class="block md:hidden">Mobile Only</div>

<!-- Width: Full mobile, half desktop -->
<div class="w-full md:w-1/2">
```

## Design System Components

### Color System

**Primary Palette (Green):**
- `primary-500` (#16f079) - Main actions, buttons
- `primary-700` (#00a04d) - Text on light background
- `primary-50` (#eefff6) - Backgrounds

**Secondary Colors:**
- Orange (`#FF6900`) - Municipalities area
- Green (`#0FF078`) - Categories area
- Gray scale - Text, borders, backgrounds

### Typography System

**Display Typography:**
- Hero: `font-poppins text-hero font-bold`
- Section: `font-poppins text-section font-bold`
- Card Title: `font-poppins text-2xl font-bold`

**Body Typography:**
- Standard: `font-inter text-base leading-relaxed`
- Large: `font-inter text-lg leading-relaxed`
- Small: `font-inter text-sm`

### Spacing System

**Section Spacing:**
- `mb-section` - Responsive margin bottom
- `py-12` - Standard vertical padding
- `px-6` - Standard horizontal padding

**Grid Gaps:**
- `gap-8` - Standard grid gap
- `gap-6` - Tighter gap
- `gap-4` - Very tight gap

## Plugins

### @tailwindcss/typography

**Usage for Markdown Content:**
```astro
<article class="prose lg:prose-xl">
  <!-- Automatically styled markdown content -->
</article>
```

**Custom Typography Configuration:**
- Custom fonts (Poppins for headings, Inter for body)
- Custom colors (Primary palette)
- Custom spacing and line heights
- Styling for code blocks, tables, lists

## Performance Optimizations

### PurgeCSS / Content Scanning

Tailwind automatically removes unused CSS classes based on:

```javascript
content: [
  "./src/**/*.{astro,js,ts,jsx,tsx,md,mdx}",
  "./src/content/**/*.{md,mdx}",
]
```

**Production Build:**
- Only used utilities in final CSS
- Typical size: ~10-50 KB (instead of several MB)
- Automatic tree shaking

### JIT Mode (Just-In-Time)

Modern Tailwind versions use JIT by default:
- On-demand class generation
- Faster build times
- Arbitrary values: `w-[137px]`, `bg-[#1da1f2]`

## Best Practices

### Consistency

1. **Fonts:** Always `font-poppins` for headings, `font-inter` for body
2. **Colors:** Primarily `primary-*` palette for brand elements
3. **Spacing:** Consistent `gap-8` and `mb-section` values
4. **Shadows:** `shadow-lg` for cards, `shadow-2xl` for hover

### Component Extraction

For recurring patterns:

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

For one-off values:
```astro
<div class="w-[137px] top-[117px] bg-[#FF6900]">
  <!-- Specific values when needed -->
</div>
```

**But:** Prefer theme values when possible!

## Debugging

### Tailwind IntelliSense

**VS Code Extension:**
- Autocomplete for classes
- CSS preview on hover
- Syntax highlighting

### Browser DevTools

**Class Inspection:**
```html
<div class="flex items-center gap-4">
  <!-- Shows compiled CSS -->
</div>
```

## Dependencies

**Package:**
```json
{
  "tailwindcss": "^3.x.x",
  "@astrojs/tailwind": "^5.x.x"
}
```

**Plugins:**
```json
{
  "@tailwindcss/typography": "^0.5.x"
}
```

## Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **Astro Tailwind Integration:** https://docs.astro.build/en/guides/integrations-guide/tailwind/
- **Tailwind Playground:** https://play.tailwindcss.com/