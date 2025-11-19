---
title: Feature Editor - Overview
description: Current state and planned refactoring of the feature editor
quality:
  completeness: 75
  accuracy: 90
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature Editor - Overview

## Current State (Status Quo)

### Implementation

The feature editor is currently implemented as a **monolithic file**:

**File:** `src/pages/feature-editor/[featureId].astro`  
**Size:** ~40 kB  
**Status:** ⚠️ **Refactoring required**

### Feature Set (current)

The editor already provides basic functionality:

- ✅ Display features on OpenLayers map
- ✅ Feature selection via `[featureId]` parameter
- ✅ Basic interaction with geometries
- ⚠️ No modular draw/edit system yet

### Architecture Problem

```
src/pages/feature-editor/[featureId].astro (40 kB)
├── Map initialization
├── Feature loading
├── UI components
├── Event handlers
├── Style definitions
└── OpenLayers configuration
```

**Problems:**
- Difficult to maintain
- No reusability
- Testing difficult
- Code duplication

## Planned Refactoring

### Goal

Split into **modular structure** with clear responsibilities.

### Proposed Structure

See [GitLab Issue #9](https://gitlab.opencode.de/OC000028072444/p2d2/-/issues/9)

```
src/
├── pages/
│   └── feature-editor/
│       └── [featureId].astro          # Only routing + integration
│
├── components/
│   └── FeatureEditor/
│       ├── EditorContainer.astro      # Main container
│       ├── EditorToolbar.astro        # Toolbar
│       ├── EditorMap.astro            # Map component
│       ├── EditorSidebar.astro        # Properties panel
│       └── EditorStatusBar.astro      # Status display
│
└── utils/
    └── feature-editor/
        ├── draw/
        │   ├── DrawManager.ts         # Draw mode management
        │   ├── DrawTools.ts           # Drawing tools
        │   └── DrawStyles.ts          # Style definitions
        ├── edit/
        │   ├── EditManager.ts         # Edit mode management
        │   ├── GeometryEditor.ts      # Geometry editing
        │   └── VertexEditor.ts        # Vertex editing
        ├── sync/
        │   ├── FeatureSync.ts         # Synchronization
        │   └── ConflictResolver.ts    # Conflict resolution
        └── core/
            ├── EditorState.ts         # State management
            ├── EditorEvents.ts        # Event system
            └── EditorConfig.ts        # Configuration
```

### Refactoring Phases

#### Phase 1: Component Extraction (planned)
- [ ] Extract map component
- [ ] Extract toolbar
- [ ] Create sidebar panel
- [ ] Extract status bar

#### Phase 2: Utils Modules (planned)
- [ ] Implement DrawManager
- [ ] Implement EditManager
- [ ] Extract feature sync
- [ ] Build event system

#### Phase 3: State Management (planned)
- [ ] Central EditorState
- [ ] Introduce event bus
- [ ] Config system

#### Phase 4: Integration & Tests (planned)
- [ ] Integrate all modules
- [ ] Write unit tests
- [ ] E2E tests for editor workflows

### Discussion

Refactoring details are being discussed in:  
[GitLab Issue #9: Feature Editor Refactoring](https://gitlab.opencode.de/OC000028072444/p2d2/-/issues/9)

**Current discussion status:**
- Module structure proposed
- Event system design open
- State management approach under discussion

## Contributing

### Feedback Wanted

If you have ideas for the refactoring:

1. Comment in [GitLab Issue #9](https://gitlab.opencode.de/OC000028072444/p2d2/-/issues/9)
2. Create a draft merge request with proof-of-concept
3. Discuss in Matrix channel (if available)

### Development

**Currently:** Work directly in `src/pages/feature-editor/[featureId].astro`

**After refactoring:** Use the modular structure

## See Also

- [GitLab Issue #9](https://gitlab.opencode.de/OC000028072444/p2d2/-/issues/9) - Refactoring discussion
- [OSM Integration](./osm-integration.md) - Related feature editor functions
- [Map Config](../karten/map-config.md) - Map configuration

## Note

📢 **This documentation describes the transitional state.**

After refactoring is complete, this page will be updated with:
- DrawManager API
- EditManager API
- Event system documentation
- Example code for editor extensions
