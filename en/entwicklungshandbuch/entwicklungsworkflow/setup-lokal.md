---
title: Local Development Setup
description: Setting up the local development environment for p2d2
quality:
  completeness: 90
  accuracy: 95
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Local Development Setup

## Prerequisites

### Software

- **Node.js:** >= 18.x (recommended: 20.x LTS)
- **npm:** >= 9.x
- **Git:** >= 2.x
- **Editor:** VS Code (recommended) with Astro extension

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

## Clone Repository

### GitLab (Main Repository)

```bash
git clone git@gitlab.opencode.de:OC000028072444/p2d2.git
cd p2d2
```

### GitHub (Hub Mirror)

```bash
git clone git@github.com:Peter-Koenig/p2d2-hub.git
cd p2d2-hub
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

### Standard Method

```bash
npm run dev
```

Server runs on `http://localhost:4321`

### With Cache Clearing (recommended for stable development)

Avoids issues with Astro and Vite caches:

```bash
rm -rf .astro/ && \
rm -rf .astro node_modules/.astro && \
rm -rf node_modules/.vite && \
DEBUG=astro:* npm run dev -- --host 0.0.0.0
```

**Benefits:**
- ✅ Access from mobile devices on LAN (`--host 0.0.0.0`)
- ✅ Minimal cache issues
- ✅ Debug output for troubleshooting

### LAN Access

When started with `--host 0.0.0.0`:

```bash
# Find your local IP
ip addr show | grep "inet "

# Example access from mobile device
http://192.168.1.100:4321
```

## Project Structure

```
p2d2/
├── src/
│   ├── pages/
│   │   ├── index.astro           # Main page
│   │   ├── [kommune].astro       # Municipality detail page
│   │   └── feature-editor/
│   │       └── [featureId].astro # Feature editor (40kB, monolithic)
│   ├── content/
│   │   └── kommunen/             # Municipality data (MDX)
│   ├── components/
│   │   ├── Map.astro             # OpenLayers map
│   │   └── FeatureEditor/        # Editor components
│   ├── layouts/
│   │   └── Layout.astro          # Main layout
│   └── utils/
│       ├── map/                  # Map utilities
│       ├── osm/                  # OSM integration
│       └── storage/              # LocalStorage utils
├── public/                       # Static assets
├── astro.config.mjs              # Astro configuration
└── package.json
```

## Environment Variables

### Development (.env.development)

```bash
# Optional for local testing
# PUBLIC_* variables are available in client
PUBLIC_MAP_DEFAULT_CENTER="[7.0, 51.0]"
PUBLIC_MAP_DEFAULT_ZOOM="8"
```

### Production (.env.production)

Managed on server by deploy script.

## Common Tasks

### Test Build

```bash
npm run build
```

Output in `dist/` - can be tested with static server:

```bash
npx serve dist
```

### Type Checking

```bash
npm run astro check
```

### Code Formatting

```bash
npm run format
```

## Troubleshooting

### Problem: Port 4321 already in use

```bash
# Find process
lsof -i :4321

# Or use different port
npm run dev -- --port 3333
```

### Problem: Module not found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Astro build fails

```bash
# Delete Astro cache
rm -rf .astro
rm -rf node_modules/.astro
rm -rf node_modules/.vite

npm run build
```

### Problem: Hot Module Replacement (HMR) not working

Restart with cache clearing (see above).

## Development Workflow

### Typical Process

1. Create branch: `git checkout -b feature/my-feature`
2. Start dev server with cache clearing
3. Make changes
4. Test in browser + mobile devices
5. Commit: `git commit -m "feat: description"`
6. Push: `git push origin feature/my-feature`
7. Create merge request on GitLab

### Branch Naming

See [Git Workflow](./git-workflow.md) for details.

## Edit Municipality Data Locally

Municipality data is located in `src/content/kommunen/`:

```bash
# Create new municipality
cp src/content/kommunen/_template.mdx src/content/kommunen/my-municipality.mdx

# Edit
vim src/content/kommunen/my-municipality.mdx
```

Data is automatically loaded by the content collection system.

## Debug OpenLayers Map

Open browser DevTools:

```javascript
// In browser console
window.map  // Access OpenLayers map instance
window.map.getLayers()  // Inspect layers
```

## See Also

- [Git Workflow](./git-workflow.md)
- [Testing](./testing.md)
- [Debugging](./debugging.md)
- [Multi-Branch Deployment](../deployment/multi-branch-system.md)
