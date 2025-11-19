---
title: Feature Editor Overview
description: Overview of the Feature Editor module - drawing, editing and synchronizing geodata
quality:
  completeness: 60
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature Editor Overview

## Overview

The Feature Editor is the central module for creating and editing geodata in p2d2. It enables interactive drawing of new features, editing of existing geometries, and synchronization with various backend systems.

## Architecture Overview

```
┌─────────────────────────────────────┐
│      Feature-Editor UI              │
│  (Buttons, Panels, Toolbars)        │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼─────┐  ┌─────▼────────┐
│Draw Manager│  │  Edit Mode   │
│  🚧 TODO   │  │  🚧 TODO     │
└──────┬─────┘  └─────┬────────┘
       │              │
       └──────┬───────┘
              │
      ┌───────▼────────┐
      │ Feature Sync   │
      │  ✅ Partial    │
      └───────┬────────┘
              │
      ┌───────▼────────┐
      │OSM Integration │
      │  ✅ Basics     │
      └────────────────┘
```

## Module Overview

| Module | Status | Purpose | Main Functions |
|--------|--------|---------|----------------|
| **Draw Manager** | 🚧 Not implemented | Drawing new features | Polygon, Point, LineString drawing |
| **Edit Mode** | 🚧 Not implemented | Editing features | Vertex editing, Move, Resize, Delete |
| **Feature Sync** | ✅ Partially implemented | Persistence and synchronization | Polygon-Sync-Plugin, File-Watcher |
| **OSM Integration** | ✅ Basics available | OpenStreetMap integration | OSM interfaces, Overpass-API structures |

## Implementation Status

### ✅ Implemented Components

#### Polygon-Sync-Plugin
- **File**: `src/integrations/polygon-sync-plugin.mjs`
- **Function**: Automatic synchronization of markdown files
- **Features**:
  - File-Watcher for `src/content/kommunen`
  - Debounced processing (2000ms)
  - Development/Production mode

#### Kommune-Watcher
- **File**: `src/scripts/kommune-watcher.mjs`
- **Function**: Monitors changes to municipality markdown files
- **Features**:
  - Chokidar-based file watcher
  - Debounce mechanism
  - Manual sync triggers

#### OSM Basic Structures
- **Files**: `src/types/admin-polygon.ts`, `src/content.config.ts`
- **Function**: Data structures for OSM integration
- **Features**:
  - OSM polygon interfaces
  - Overpass-API response types
  - OSM admin level management

### 🚧 Not Yet Implemented

#### Draw Manager
- OpenLayers Draw interaction
- UI buttons for different geometry types
- Draw style configuration
- Event handlers for drawstart/drawend

#### Edit Mode
- OpenLayers Modify interaction
- Select interaction for feature selection
- Snap interaction for precise editing
- Vertex editing (Move, Delete, Add)

#### Complete Feature Sync
- WFS-T (Transactional Web Feature Service)
- Bidirectional synchronization
- Conflict resolution
- Undo/Redo functionality

#### Complete OSM Integration
- Feature-to-OSM tag mapping
- OSM-XML export
- Overpass-API queries
- OSM authentication

## Data Flow

### Current Workflow (Partially Implemented)

1. **Content Change**: Markdown file in `src/content/kommunen` is modified
2. **File-Watcher**: Kommune-Watcher detects change
3. **Debounce**: 2000ms wait time for stable changes
4. **Sync Trigger**: Polygon-Sync-Plugin is activated
5. **Processing**: Municipality data is processed

### Planned Workflow (Complete)

1. **Draw/Edit**: User draws/edits feature on map
2. **Feature Creation**: Draw/Edit creates OpenLayers feature
3. **Property Setting**: Feature receives metadata and OSM tags
4. **Persistence**: Feature is saved to markdown
5. **Sync**: Polygon-Sync-Plugin synchronizes with backend
6. **OSM Export**: Feature is prepared for OSM

## Technical Foundations

### OpenLayers Integration

The Feature Editor builds on the existing OpenLayers integration:

- **Map Configuration**: `src/config/map-config.ts`
- **Projection Management**: `src/utils/crs.ts`
- **Layer Management**: `src/utils/layer-manager.ts`

### Content Collections

Municipality data is managed via Astro Content Collections:

```typescript
// src/content.config.ts
const kommunen = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    wp_name: z.string(),
    osmAdminLevels: z.array(z.number()).optional(),
    // ... additional properties
  })
});
```

### OSM Data Structures

```typescript
// src/types/admin-polygon.ts
export interface OSMPolygonFeature extends GeoJSON.Feature {
  id: number;
  properties: {
    name: string;
    admin_level: number;
    wikipedia?: string;
    // ... OSM-specific properties
  };
}
```

## Usage Example (Planned)

```typescript
// Create, edit, save, export feature
// 1. Activate Draw Manager
activateDrawMode('polygon');

// 2. Draw feature (user interaction)
// 3. Feature automatically receives properties
feature.setProperties({
  name: 'Playground Example Street',
  type: 'playground',
  osm_tags: { leisure: 'playground' }
});

// 4. Automatic persistence to markdown
// 5. Sync to backend systems
// 6. Prepare OSM export
```

## Dependencies

### Internal Dependencies

- **Map Configuration**: `src/config/map-config.ts`
- **Projection Utils**: `src/utils/crs.ts`
- **Layer Management**: `src/utils/layer-manager.ts`
- **Content Collections**: `src/content.config.ts`
- **Event System**: `src/utils/events.ts`

### External Dependencies

- **OpenLayers**: `ol/interaction/Draw`, `ol/interaction/Modify`, `ol/interaction/Select`
- **Chokidar**: File watching for sync plugin
- **proj4**: Projection transformations

## Next Development Steps

### Phase 1: Draw Manager (High Priority)
1. Implement OpenLayers Draw interaction
2. Create UI buttons for geometry types
3. Configure draw styles
4. Event handlers for feature creation

### Phase 2: Edit Mode (High Priority)
1. Modify interaction for editing
2. Select interaction for feature selection
3. Snap interaction for precision
4. Implement vertex editing

### Phase 3: Complete Sync (Medium Priority)
1. Implement WFS-T synchronization
2. Bidirectional sync logic
3. Conflict resolution
4. Undo/Redo functionality

### Phase 4: OSM Integration (Low Priority)
1. Feature-to-OSM tag mapping
2. OSM-XML export
3. Overpass-API integration
4. OSM authentication

## Best Practices

### Code Organization
- Feature Editor components in `src/components/feature-editor/`
- Editor logic in `src/utils/feature-editor/`
- Sync functionality in `src/integrations/` and `src/scripts/`

### Error Handling
- Wrap all sync operations with try-catch
- User feedback for errors
- Fallback mechanisms for offline operation

### Performance
- Debounce for frequent operations
- Lazy loading of heavy components
- Memory management for many features

## Quality Assurance

### Testing Strategy
- Unit tests for utility functions
- Integration tests for sync processes
- E2E tests for user interactions

### Documentation
- Document each module separately
- Code examples from real code
- Complete API reference

### Code Review
- Review all Feature Editor changes
- Ensure OSM compliance
- Performance checks for geometry operations