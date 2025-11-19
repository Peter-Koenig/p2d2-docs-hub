---
title: "Responsive Design"
description: "Responsive design strategy, mobile-first patterns, touch optimization and performance in p2d2"
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Responsive Design

## Overview

p2d2 follows a mobile-first approach with progressive enhancement for desktop devices. The application is optimized for screen sizes from 320px (small smartphones) to 2560px+ (4K displays) and provides optimized touch interactions for mobile devices.

## Design Philosophy

### Mobile-First

**Principle:** Design and development start with the smallest screen size.

**Advantages:**
- Performance focus from the beginning
- Progressive enhancement instead of graceful degradation
- Better touch interactions

**Example:**
```astro
<!-- Base: Mobile (< 640px) -->
<div class="flex flex-col gap-2">
  
  <!-- Tablet (≥ 768px) -->
  <div class="md:flex-row md:gap-4">
  
    <!-- Desktop (≥ 1024px) -->
    <div class="lg:gap-6">
```

## Breakpoint System

### Tailwind Breakpoints

| Breakpoint | Min-Width | Target Devices | Usage |
|------------|-----------|----------------|-------|
| `(default)` | 0px | Mobile (Portrait) | Base styles |
| `sm` | 640px | Mobile (Landscape), large phones | Minor adjustments |
| `md` | 768px | Tablets | Layout changes |
| `lg` | 1024px | Desktop, laptops | Multi-column layouts |
| `xl` | 1280px | Large desktop | Extended layouts |
| `2xl` | 1536px | 4K displays | Optional |

### Most Common Breakpoints in p2d2

**Component Analysis:**
- `md` (768px): 85% of responsive changes
- `lg` (1024px): 10% of changes
- `sm`, `xl`, `2xl`: 5% of changes

**Recommendation:** Focus on `md` and `lg`.

## Viewport Configuration

### Meta Tag

```astro
<!-- Layout.astro -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Settings:**
- `width=device-width`: Viewport width = device width
- `initial-scale=1.0`: No initial zoom

**IMPORTANT:** Never use `user-scalable=no` (accessibility violation)!

### iOS Safari Specifics

```astro
<!-- Prevents auto-zoom on input focus -->
<style>
  input, select, textarea {
    font-size: 16px; /* Minimum 16px for iOS */
  }
</style>
```

## Responsive Layout Patterns

### Container System

**Full-Width → Constrained:**
```astro
<div class="w-full md:container md:mx-auto md:px-4">
  <!-- Mobile: Full-Width, Desktop: Max-Width with padding -->
</div>
```

**Max-Width Graduations:**
```astro
<div class="max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto">
```

### Grid Layouts

**Responsive Grid Columns (Most Common Pattern):**
```astro
<!-- Municipalities overview -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
  {kommunen.map(kommune => (
    <KommuneCard data={kommune} />
  ))}
</div>
```

**Implemented Grid Patterns:**
- `grid grid-cols-1 md:grid-cols-3` - Footer, topics
- `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3` - KommunenGrid, KategorienGrid
- `grid grid-cols-1 lg:grid-cols-2` - Contact page, participation page
- `grid grid-cols-1 md:grid-cols-2` - Community page

### Flex Layouts

**Stack → Row:**
```astro
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>
```

**Header Navigation:**
```astro
<nav class="flex items-center justify-between px-6 py-4">
  <div class="flex items-center">
    <!-- Logo and navigation -->
  </div>
</nav>
```

### Map Container

**Responsive Height:**
```astro
<div class="w-full h-[30rem] text-lg text-grey-900 mb-8 text-center relative">
  <main class="w-full h-full">
    <MapCanvas />
  </main>
</div>
```

**MapCanvas Responsive Styling:**
```css
/* Mobile: Small border-radius */
@media (max-width: 768px) {
  #map {
    clip-path: inset(0 round 12px);
  }
}

/* Desktop: Large border-radius */
@media (min-width: 768px) {
  #map {
    clip-path: inset(0 round 24px);
  }
}
```

## Touch Optimization

### Touch Target Sizes

**Minimum 44x44px (Apple HIG / WCAG):**
```astro
<!-- Municipality card buttons -->
<button 
  type="button"
  class="kommunen-card relative bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group text-left w-full h-full flex flex-col"
  aria-label="Select municipality Cologne"
>
  <!-- Sufficiently large touch targets -->
</button>
```

### OpenLayers Touch Interactions

**Standard Touch Gestures:**
- **Single-Tap:** Feature selection
- **Double-Tap:** Zoom in
- **Pinch:** Zoom
- **Drag:** Pan

**Implemented Touch Features:**
- Pinch-to-zoom enabled
- Touch-drag-pan enabled
- Double-tap-zoom enabled

### Municipality Card Touch Handling

**Click Handler with Touch Optimization:**
```typescript
// KommunenClickHandler - Touch-friendly event processing
private handleClick(event: Event): void {
  const target = event.target as HTMLElement;
  
  // Don't block native links!
  if (target.closest("a[href]")) return;
  
  const button = target.closest("button.kommunen-card") as HTMLElement;
  if (!button) return;
  
  // Double-click protection
  if (this.processingButtons.has(button)) {
    return;
  }
  
  this.processingButtons.add(button);
  
  // Touch-friendly processing
  try {
    const slug = button.getAttribute("data-slug");
    if (!slug) return;
    
    // Map navigation and WFS layer management
    this.dispatchKommunenFocus(detail);
    this.handleWFSLayerToggle(detail);
    
  } finally {
    setTimeout(() => {
      this.processingButtons.delete(button);
    }, 500); // Touch debouncing
  }
}
```

### Hover Fallbacks for Touch

**Problem:** Touch devices don't have `:hover`

**Solution: Active-State + Transition:**
```astro
<button class="kommunen-card transition-all duration-300 hover:-translate-y-2 active:scale-95">
  <!-- active: works on touch -->
</button>
```

## Typography Scaling

### Responsive Font Sizes

**Headings:**
```astro
<h1 class="font-poppins text-2xl md:text-3xl lg:text-4xl font-bold">
  Large heading
</h1>

<h2 class="font-poppins text-xl md:text-2xl lg:text-3xl font-semibold">
  Medium heading
</h2>
```

**Body Text:**
```astro
<p class="font-inter text-base md:text-lg leading-relaxed">
  Body text with larger font on desktop
</p>
```

**Hero Typography:**
```astro
<h1 class="font-poppins font-bold text-hero tracking-tight">
  <!-- Custom hero size: 3.75rem (60px) -->
</h1>
```

### Line Length (Measure)

```astro
<!-- Optimal line length: 45-75 characters -->
<article class="max-w-prose mx-auto">
  <p>Text with optimal line length for readability</p>
</article>
```

## Visibility & Display

### Conditional Rendering

```astro
<!-- Desktop-Only -->
<div class="hidden lg:block">
  Only visible on large screens
</div>

<!-- Mobile-Only -->
<div class="block lg:hidden">
  Only visible on mobile devices
</div>

<!-- Tablet & Desktop -->
<div class="hidden md:block">
  Visible from tablet up
</div>
```

### Tab System Responsive

**Map Tabs on Mobile:**
```astro
<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-3">
  <button class="tab-button active bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg">
    Municipalities
  </button>
  <button class="tab-button bg-green-500 text-white font-semibold px-6 py-3 rounded-lg">
    Categories
  </button>
</div>
```

**Mobile Tab Button Adjustments:**
```css
@media (max-width: 640px) {
  .tab-button {
    min-width: 100px;
    padding-left: 4px;
    padding-right: 4px;
    font-size: 0.875rem;
  }
}
```

## Performance Optimization

### Lazy Loading

**Components:**
```astro
<MapCanvas client:load />  <!-- Load map immediately -->
```

**Images:**
```astro
<img src="/image.jpg" loading="lazy" alt="Description">
```

### Responsive Section Spacing

**CSS Variable for responsive margins:**
```css
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

**Usage:**
```astro
<section class="mb-section">
  <!-- Automatically responsive spacing -->
</section>
```

### Code Splitting by Breakpoint

```astro
<!-- Mobile-specific JavaScript -->
<script is:inline>
// Touch optimizations only on mobile
if (window.innerWidth < 768) {
  // Mobile-specific initialization
}
</script>
```

## Accessibility (Responsive)

### Focus Visible

```astro
<button class="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
  Keyboard navigation support
</button>
```

### ARIA for Interactive Elements

```astro
<button
  aria-label="Select municipality Cologne"
  data-slug="koeln"
  data-kommune-slug="koeln"
>
  Cologne
</button>
```

## Testing

### Breakpoint Testing

**Browser DevTools:**
1. Chrome DevTools → Device Toolbar (Cmd/Ctrl + Shift + M)
2. Responsive mode
3. Test all breakpoints: 320px, 375px, 640px, 768px, 1024px, 1280px

**Important Test Devices:**
- iPhone SE (320px)
- iPhone 12/13 (390px)
- iPad (768px)
- Desktop (1920px)

### Touch Testing

- iOS Safari (iOS 15+)
- Chrome Mobile (Android)
- Tablet devices

### Performance Testing

```bash
# Lighthouse Mobile Audit
npx lighthouse https://p2d2.example.com --preset=mobile --view
```

## Best Practices

### Mobile-First Workflow

1. **Design mobile first**
2. **Test on real device**
3. **Progressively enhance for desktop**
4. **Avoid desktop-centric thinking**

### Touch-Friendly

1. **44x44px minimum** for touch targets
2. **Enough spacing** between clickable elements
3. **No hover-only interactions**
4. **Touch debouncing** for fast interactions

### Performance

1. **Mobile-first = performance-first**
2. **Lazy load everything possible**
3. **Use client directives wisely**
4. **Optimize responsive images with srcset**

### Consistency

1. **Use consistent breakpoints**
2. **Reuse layout patterns**
3. **Keep documentation current**

## Common Problems & Solutions

### Problem: Layout Shift

**Symptom:** Content jumps during loading

**Solution:**
```astro
<!-- Reserve space for images -->
<img 
  src="/image.jpg" 
  width="800" 
  height="600" 
  class="w-full h-auto"
>
```

### Problem: Horizontal Scroll

**Symptom:** Page scrolls horizontally on mobile

**Solution:**
```astro
<body class="overflow-x-hidden">
```

**Debug:**
```css
* {
  outline: 1px solid red; /* Find oversized elements */
}
```

### Problem: Touch Event Conflicts

**Symptom:** Map interactions block card clicks

**Solution:**
```typescript
// Stop event propagation where needed
event.stopPropagation();
// Or: Passive event listeners
element.addEventListener('click', handler, { passive: true });
```

## Checklist

- [ ] Mobile (320px-640px) tested
- [ ] Tablet (768px-1024px) tested
- [ ] Desktop (1280px+) tested
- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal scrolls
- [ ] Mobile navigation works
- [ ] Map works on touch
- [ ] Performance: Lighthouse Mobile > 90
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Touch debouncing implemented
- [ ] Responsive images optimized

## Implemented Features

### ✅ Responsive Grid System
- KommunenGrid: 1 → 2 → 3 columns
- KategorienGrid: 1 → 2 → 3 columns
- Footer: 1 → 3 columns
- Contact: 1 → 2 columns

### ✅ Touch-Optimized Interactions
- Municipality card click handler
- Map touch gestures (pinch, drag, tap)
- Touch debouncing
- Active-state fallbacks

### ✅ Responsive Typography
- Scaling font sizes
- Optimal line lengths
- Mobile-optimized line heights

### ✅ Performance Optimizations
- Lazy loading
- Responsive section spacing
- Breakpoint-specific code splitting

The responsive design of p2d2 provides a consistent user experience across all device classes with special optimization for touch interactions on mobile devices.