---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature Editor

The Feature Editor enables editing of geometries and attributes of a selected feature.

## Opening the Editor

1. **Select Feature**: Click on a feature in the map
2. **Open Editor**: Click "Edit" button in the sidebar
3. **Editor Mode**: Feature becomes editable

## Editing Geometry

### Moving Points

- **Click vertices** and drag
- **New Vertices**: Click on line segment
- **Delete Vertices**: Ctrl + Click on vertex

### Moving Geometry

- **Entire Feature**: Alt + Drag

### Rotating Geometry

- **Rotation**: Hold R key + Move mouse

### Scaling Geometry

- **Scaling**: Hold S key + Move mouse

## Editing Attributes

The attribute table shows all feature properties:

- **Name**: Text field
- **Category**: Dropdown
- **Opening Hours**: Structured input field
- **Website**: URL field with validation
- **Description**: Multi-line text field

### Required Fields

Required fields are marked with *****:

- Name
- Category
- Geometry

### Validation

When saving, data is validated:

- **URL Format**: For website fields
- **Email Format**: For email addresses
- **Coordinate Format**: For position data

## Geometry Types

p2d2 supports various geometry types:

- **Point**: Single point (e.g., entrance)
- **LineString**: Line (e.g., path)
- **Polygon**: Area (e.g., cemetery)
- **MultiPolygon**: Multiple areas (e.g., cemetery with exclaves)

## Undo / Redo

- **Ctrl + Z**: Undo
- **Ctrl + Y**: Redo
- **History**: All changes are logged

## Cancel

- **Esc Key**: Exit edit mode without saving
- **Cancel Button**: Discard all changes

::: warning Attention
Unsaved changes are lost when closing the editor!
:::