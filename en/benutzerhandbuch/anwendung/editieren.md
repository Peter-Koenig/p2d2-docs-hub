---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Editing

This section describes best practices for editing geodata in p2d2.

## Preparation

### Check Data Basis

Before starting to edit:

1. **Background Maps**: Switch to current aerial imagery
2. **Comparison**: Check if existing data is correct
3. **Information Gathering**: Research missing information

### Use Sources

Valid information sources:

- **Aerial Imagery**: For geometries
- **OpenData Portal**: For official data
- **On-site Inspection**: For details like opening hours
- **Websites**: For contact data and descriptions

::: danger No Copyright Infringements
Do **not** use copyrighted sources like Google Maps, commercial maps, or proprietary data!
:::

## Geometry Collection

### Accuracy

- **Minimum Accuracy**: 1 meter
- **Building Boundaries**: As exact as possible to outer walls
- **Paths**: Center line of the path
- **Areas**: Closed polygons without self-intersections

### Topology

- **Adjacent Areas**: Should share common edges (no gaps/overlaps)
- **Multipolygons**: For areas with holes or separate parts

## Attribute Maintenance

### Naming

- **Official Names**: Use official designations
- **No Abbreviations**: Except for established abbreviations
- **Spelling**: Pay attention to capitalization

### Structured Data

- **Opening Hours**: Format "Mon-Fri 09:00-17:00"
- **Phone Numbers**: International format "+49 221 12345"
- **URLs**: Complete URLs including https://

### Completeness

Try to collect as many attributes as possible:

- **Basic Attributes**: Name, category, address
- **Contact**: Phone, email, website
- **Times**: Opening hours
- **Description**: Short explanation (1-2 sentences)

## Change Comments

For each change, you should leave a **comment**:

- **What**: What was changed?
- **Why**: Reason for the change
- **Source**: Where does the information come from?

**Example**: "Geometry corrected based on aerial imagery 2024, opening hours taken from website"

## Conflict Resolution

When encountering conflicts:

1. **Check**: Is the existing or new information correct?
2. **Research**: Consult additional sources
3. **Discuss**: Ask in p2d2 forum or chat
4. **Document**: Record conflict in comment

::: tip Quality Over Speed
Better to collect few features correctly than many features incorrectly!
:::