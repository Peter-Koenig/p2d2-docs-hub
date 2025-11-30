---
title: Project Structure
description: Directory organization and file structure of p2d2
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# Project Structure

> **Status:** 🚧 Documentation in progress

## Directory Overview

The p2d2 project structure follows a clear, modular layout:

```
p2d2/
├── src/                    # Main source code directory
│   ├── components/         # Reusable UI components
│   ├── layouts/           # Page layouts and templates
│   ├── pages/             # Routes and pages
│   ├── content/           # Content Collections
│   ├── styles/            # Global styles and CSS
│   └── utils/             # Helper functions and utilities
├── public/                # Static assets
├── dist/                  # Build output
└── package.json           # Project configuration
```

## Main Directories

### src/components/

Reusable Astro components for the user interface:

  - **Map Components**: Map rendering and interaction
  - **UI Elements**: Buttons, forms, navigation
  - **Layout Components**: Header, footer, sidebars

### src/layouts/

Page layouts and templates:

  - **Base Layout**: Base layout for all pages
  - **Map Layout**: Special layout for map pages
  - **Admin Layout**: Layout for administration areas

### src/pages/

Astro routes and pages:

  - **Static Pages**: About, Imprint, etc.
  - **Dynamic Routes**: Municipality-specific pages
  - **API Endpoints**: Server-side functions

### src/content/

Content Collections for structured data:

  - **kommunen/**: Data of supported municipalities
  - **config/**: Configuration files
  - **geodata/**: Geodata metadata

### src/utils/

Helper functions and utilities:

  - **map-utils.ts**: Map-related functions
  - **data-utils.ts**: Data processing
  - **storage-utils.ts**: Local storage

## Build Process

### Development

  - **Development Server**: Vite Dev Server
  - **Hot Reload**: Automatic reloading on changes
  - **TypeScript**: Real-time compilation

### Production

  - **Static Generation**: Astro Build for static pages
  - **Optimization**: Code splitting and asset optimization
  - **Deployment**: Automated deployment

## Configuration Files

### package.json

  - Project metadata and dependencies
  - Build scripts and development commands
  - TypeScript configuration

### astro.config.mjs

  - Astro framework configuration
  - Integrations and plugins
  - Build settings

### tailwind.config.js

  - TailwindCSS configuration
  - Design tokens and color palette
  - Responsive breakpoints

## Next Steps

  - [ ] Document detailed component structure
  - [ ] Fully describe Content Collections
  - [ ] Document build process in detail
  - [ ] Add deployment structure