---
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Category Expansion

The step-by-step expansion to additional data categories is central to scaling p2d2.

## Starting Point: Cemeteries

**Why cemeteries as pilot project?**

- **Manageable complexity**: Clearly defined geometries
- **Administrative relevance**: Cities must manage cemeteries
- **OSM gap**: Cemeteries are often incomplete in OSM
- **Low change rate**: Cemeteries rarely change

**Successes**:
- 25 cemeteries in Cologne recorded
- Geometries corrected and transferred to OSM
- Attributes added (opening hours, contact)

## Categories Roadmap

### Phase 1: Green Spaces (2025)

**Flower Beds**
- Similar geometry to cemeteries (polygons)
- Higher change rate (seasonal)
- Administrative relevance: Green space departments

**Parks and Green Areas**
- Larger areas
- More attributes (playgrounds, benches, paths)

### Phase 2: Transportation Infrastructure (2026)

**Cycle Paths**
- LineStrings instead of polygons
- Attributes: Width, surface, lighting
- OSM category: cycleway

**Parking Lots**
- Points or polygons
- Attributes: Number of spaces, parking fees
- Dynamic data: Occupancy (future)

### Phase 3: Cultural Heritage (2026)

**Monuments**
- Points with detailed descriptions
- WikiData integration particularly relevant
- Photos and historical information

**Cultural Sites**
- Theaters, museums, galleries
- Opening hours, events

### Phase 4: Social Infrastructure (2027)

**Playgrounds**
- Polygons with equipment attributes
- Safety inspections as temporal dimension

**Public Toilets**
- Points with accessibility information
- Opening hours

## Category Requirements

### Technical

| Category | Geometry | Attributes | Change Rate | Complexity |
|-----------|-----------|-----------|---------------|-------------|
| Cemeteries | Polygon | Medium | Low | Low |
| Flower Beds | Polygon | Low | High | Low |
| Cycle Paths | LineString | High | Medium | Medium |
| Monuments | Point | Very High | Low | Medium |
| Playgrounds | Polygon | High | Medium | High |

### Organizational

- **Data owner**: Which department is responsible?
- **Update frequency**: How often do the data change?
- **Quality**: How precise must the data be?

## Category Schema

### Data Model Extension

```
CREATE TABLE features.category_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    geometry_type VARCHAR(20) NOT NULL,
    attribute_schema JSONB NOT NULL,
    osm_tags JSONB,
    wikidata_property VARCHAR(50)
);

-- Example: Cemetery
INSERT INTO features.category_definitions (name, geometry_type, attribute_schema, osm_tags)
VALUES ('cemetery', 'MultiPolygon', 
    '{"name": "string", "address": "string", "opening_hours": "string"}',
    '{"landuse": "cemetery", "religion": "christian"}');
```

### UI Adaptations

- **Category selection** when creating a feature
- **Category-specific forms** for attributes
- **OSM tag mapping** per category

## Prioritization

### Criteria

1. **Administrative relevance**: How important is the category for authorities?
2. **Community interest**: How many users are interested?
3. **OSM gap**: How incomplete are the OSM data?
4. **Technical feasibility**: How complex is the implementation?

### Prioritization Matrix

```
High  │ Cycle Paths│ Monuments  │
      │            │            │
Admin.│ Flower Beds│ Cemeteries │
      │            │ (done)     │
      │            │            │
Low   │            │ Toilets    │
      └────────────┴────────────┘
        Low         High
          OSM Gap
```

::: tip Suggest Category
Have an idea for a new category? Create an issue on GitHub!
:::