---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Main Window

The main window of p2d2 is the central workspace. It is based on **OpenLayers** and provides an interactive map view with various tools.

## Structure

### Map Area

The map area occupies most of the window:

- **Background Maps**: OSM, aerial imagery, topographic maps
- **Data Layers**: Cemeteries, flower beds, other categories
- **Controls**: Zoom, pan, rotation

### Toolbar

The toolbar (left or top) provides access to:

- **Selection Tool**: Select features
- **Editing Tool**: Edit geometries
- **Add Tool**: Create new features
- **Delete Tool**: Remove features
- **Measurement Tool**: Measure distances and areas

### Sidebar

The sidebar (right) shows:

- **Feature Properties**: Attributes of the selected feature
- **Layer Control**: Show/hide layers
- **Legend**: Symbol explanation
- **Search**: Full-text search in features

### Status Bar

The status bar (bottom) shows:

- **Coordinates**: Mouse position in various coordinate systems
- **Scale**: Current map scale
- **Editing Status**: Number of unsaved changes

## Navigation

### Zooming

- **Mouse Wheel**: Zoom in/out
- **Zoom Buttons**: +/- in the toolbar
- **Double Click**: Zoom to clicked point
- **Shift + Drag**: Zoom to rectangle

### Panning

- **Mouse Drag**: Move map
- **Arrow Keys**: Move map in step sizes

### Changing Background Map

- **Layer Control**: Select background map
- Available maps:
  - OSM Standard
  - OSM Humanitarian
  - Aerial Imagery (WMS)
  - Topographic Map 1:25,000

## Selecting Features

- **Click on Feature**: Feature is selected
- **Properties** are displayed in sidebar
- **Multiple Selection**: Ctrl + Click

## Search

The search enables:

- **Full-text search** in feature attributes
- **Spatial Search**: Features in current map extent
- **Filtering** by category or status

::: tip Navigation
Use the **space bar** as a shortcut to temporarily switch to pan mode.
:::