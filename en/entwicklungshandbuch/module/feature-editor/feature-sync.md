---
title: Feature Sync
description: "Synchronization of features between map, markdown files and backend systems"
quality:
  completeness: 70
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature Sync

## Overview

The Feature Sync module manages the persistence and synchronization of geodata between different systems. It includes automatic file watching, markdown-to-GeoJSON conversion, and planned WFS-T synchronization.

## Architecture

### Sync Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Markdown      │◄──►│  Polygon-Sync    │◄──►│   Backend       │
│   Content       │    │    Plugin        │    │  (WFS-T)        │
│   Collections   │    │                  │    │   🚧 Planned    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Kommune-      │    │   OpenLayers     │
│   Watcher       │    │   Features       │
│                 │    │   🚧 Planned     │
└─────────────────┘    └──────────────────┘
```

## Implemented Components

### Polygon-Sync-Plugin

**File:** `src/integrations/polygon-sync-plugin.mjs`

The plugin integrates into the Astro build process and automatically monitors changes to municipality markdown files.

#### Configuration

```javascript
export function polygonSyncPlugin(options = {}) {
  const {
    watchDir = "src/content/kommunen",
    autoSync = true,
    followSymlinks = true,
    debounceMs = 2000,
    debug = false,
  } = options;
  
  // Plugin implementation...
}
```

#### Astro Hooks

- **`astro:server:start`**: Starts file watcher in development mode
- **`astro:build:done`**: Logs build completion (production)
- **`astro:server:done`**: Stops file watcher

### Kommune-Watcher

**File:** `src/scripts/kommune-watcher.mjs`

The watcher monitors markdown files in the `src/content/kommunen` directory and triggers automatic synchronization.

#### Initialization

```javascript
export class KommuneWatcher {
  constructor(options = {}) {
    this.defaultOptions = {
      debounceMs: 2000,
      verbose: false,
      dryRun: false,
      patterns: ["*.md"],
    };
    this.options = { ...this.defaultOptions, ...options };
  }
}
```

#### File Watching

- **Patterns:** `["*.md"]` - Monitors all markdown files
- **Debounce:** 2000ms - Avoids frequent sync triggers
- **Events:** `add`, `change`, `unlink` - File changes

#### Event Processing

```javascript
handleFileEvent(eventType, filePath) {
  const kommuneSlug = this.extractKommuneSlug(filePath);
  
  if (!kommuneSlug) {
    if (mergedOptions.verbose) {
      console.log(`[kommune-watcher] Ignoring non-kommune file: ${filePath}`);
    }
    return;
  }
  
  this.pendingChanges.add(kommuneSlug);
  
  // Debounce mechanism
  if (this.debounceTimer) {
    clearTimeout(this.debounceTimer);
  }
  
  this.debounceTimer = setTimeout(() => {
    this.processPendingChanges();
  }, mergedOptions.debounceMs);
}
```

## Data Formats

### Markdown Frontmatter

Municipality data is stored as markdown files with frontmatter:

```markdown
---
title: "Cologne"
wp_name: "de-Cologne"
osmAdminLevels: [6, 7, 8, 9, 10]
osm_refinement: "boundary=administrative"
colorStripe: "#FF6900"
map:
  center: [376000, 5648000]
  zoom: 12
  projection: "EPSG:25832"
---

# Cologne

Description of the municipality...
```

### GeoJSON Features

Features are stored as GeoJSON in WFS services (planned):

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  },
  "properties": {
    "name": "Grave Area 1",
    "container_type": "cemetery",
    "wp_name": "de-Cologne",
    "osm_admin_level": 10
  }
}
```

## Sync Workflow

### 1. Detect File Changes

```javascript
// Kommune-Watcher detects change
handleFileEvent('change', 'cologne.md')

// Extracts municipality slug
const kommuneSlug = 'cologne'

// Adds to pendingChanges
this.pendingChanges.add('cologne')
```

### 2. Debounced Processing

```javascript
// After 2000ms without further changes
setTimeout(() => {
  this.processPendingChanges();
}, 2000);
```

### 3. Execute Sync

```javascript
async processPendingChanges() {
  const changes = Array.from(this.pendingChanges);
  
  for (const kommuneSlug of changes) {
    try {
      // Wait for ContentCollection refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Call sync function
      const { syncKommunePolygons } = await import(
        "../utils/polygon-wfst-sync.js"
      );
      const result = await syncKommunePolygons(kommuneSlug);
      
      // Process result
      if (result.success) {
        console.log(`Sync completed for ${kommuneSlug}`);
      }
    } catch (error) {
      console.error(`Error processing ${kommuneSlug}: ${error.message}`);
    }
  }
}
```

## 🚧 Planned Extensions

### WFS-T Synchronization

**Status:** Not yet implemented

**Planned Features:**
- Transactional Web Feature Service
- Insert/Update/Delete operations
- Conflict resolution
- Rollback mechanisms

### Bidirectional Sync

**Status:** Not yet implemented

**Planned Features:**
- Pull: Load changes from server
- Push: Upload local changes
- Merge strategies for conflicts
- Offline-first approach

### Real-time Synchronization

**Status:** Not yet implemented

**Planned Features:**
- WebSocket-based updates
- Collaborative editing
- Live conflict detection
- Operation transformation

## Configuration

### Environment Variables

```bash
# For future WFS-T integration
WFST_USERNAME=username
WFST_PASSWORD=password
WFST_ENDPOINT=https://geoserver.example.com/wfs
```

### Plugin Options

```javascript
// In astro.config.mjs
integrations: [
  polygonSyncPlugin({
    watchDir: "src/content/kommunen",
    autoSync: true,
    debounceMs: 2000,
    debug: process.env.NODE_ENV === 'development'
  })
]
```

## Error Handling

### File Watching Errors

```javascript
watcher.on("error", (error) => {
  console.error(`[kommune-watcher] Error: ${error.message}`);
});
```

### Sync Errors

```javascript
try {
  const result = await syncKommunePolygons(kommuneSlug);
  
  if (!result.success) {
    console.error(`Sync failed: ${result.errors.join(", ")}`);
  }
} catch (error) {
  console.error(`Processing error: ${error.message}`);
}
```

### Fallback Strategies

- **Network Issues:** Local persistence, later retry
- **Authentication:** Read-only fallback
- **Data Corruption:** Backup restoration

## Performance Optimizations

### Debounce Mechanism

- **2000ms Delay:** Avoids frequent sync operations
- **Batch Processing:** Process multiple changes together
- **Memory Management:** pendingChanges set for duplicate prevention

### Lazy Loading

```javascript
// Dynamic import of sync function
const { syncKommunePolygons } = await import(
  "../utils/polygon-wfst-sync.js"
);
```

### Caching

- **File Stat Cache:** Avoids redundant file operations
- **Content Cache:** Intermediate storage of parsed data
- **Network Cache:** HTTP caching for WFS requests

## Usage

### Development Mode

```bash
# Starts development server with active file watching
npm run dev

# Log output:
# [polygon-sync-plugin] Polygon sync plugin: Watching src/content/kommunen for changes
# [kommune-watcher] change: cologne (cologne.md)
# [kommune-watcher] Processing 1 pending changes: cologne
```

### Production Build

```bash
# Build with sync logging
npm run build

# Log output:
# [polygon-sync-plugin] Build completed - manual sync may be required
```

### Manual Sync Trigger

```javascript
// In console
const watcher = new KommuneWatcher();
await watcher.triggerManualSync('cologne');
```

## Dependencies

### Internal Dependencies

- **Content Collections:** `src/content.config.ts`
- **Kommune Utils:** `src/utils/kommune-utils.ts`
- **Event System:** `src/utils/events.ts`

### External Dependencies

- **Chokidar:** `^3.5.3` - File watching
- **Astro Hooks:** Build process integration

### Planned Dependencies

- **WFS-T Client:** For backend synchronization
- **WebSocket Client:** For real-time updates
- **Conflict Resolution:** For bidirectional sync

## Best Practices

### File Naming

- **Municipality Slugs:** `cologne.md`, `bonn.md`, `duesseldorf.md`
- **Consistent Encoding:** UTF-8 for all files
- **Validation:** Slug extraction with regex validation

### Error Recovery

- **Graceful Degradation:** Fallback on sync errors
- **Retry Logic:** Automatic retry on network errors
- **Backup System:** Regular backups

### Monitoring

- **Logging:** Detailed sync protocols
- **Metrics:** Collect performance metrics
- **Alerts:** Notifications for critical errors