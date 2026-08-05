---
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Federal States

Scaling to the federal state level enables state-wide Spatial Data Infrastructures.

## Pilot: North Rhine-Westphalia

**Why NRW?**
- Cologne and Bonn already active
- Largest federal state (population)
- Strong OpenData initiatives
- open.nrw as existing state portal

**Vision NRW 2027**:
- 50+ municipalities in NRW use p2d2
- State-wide cemetery database
- Integration with GEOportal.NRW

## Schleswig-Holstein

**Why Schleswig-Holstein?**
- Progressive E-Government law
- Strong commitment to Open Source
- Manageable size for pilot project

**Special features**:
- Coast-specific categories (beaches, harbors)
- Tourism focus (landmarks)
- Border region (DK/DE)

## State Spatial Data Infrastructures

### GDI-DE Integration

p2d2 as a component of GDI-DE:

```
┌─────────────────────┐
│      GDI-DE         │
│ (Federal level)     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐    ┌────▼───┐
│GDI-NRW│    │GDI-SH  │
└───┬───┘    └────┬───┘
    │             │
┌───▼────────────▼───┐
│      p2d2          │
│  (Municipal level) │
└────────────────────┘
```

### Metadata Harmonization

- **INSPIRE-compliant metadata**
- **GeoNetwork integration**
- **CSW interface**

## State-specific Adaptations

### Data Models

Each federal state can have its own categories:

- **Bavaria**: Beer gardens, folk festivals
- **Schleswig-Holstein**: Beaches, lighthouses
- **Brandenburg**: Lakes, nature parks

### Legal Requirements

- **Data protection**: State-specific regulations
- **Licensing**: State data licenses
- **Archiving**: State archive laws

## Federation

### State Instances

Each federal state can operate its own p2d2 instance:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ p2d2-NRW │  │ p2d2-SH  │  │ p2d2-BY  │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │             │
      └──────┬──────┴──────┬──────┘
             │             │
        ┌────▼─────────────▼────┐
        │ Federation Protocol  │
        └──────────────────────┘
```

### Cross-State Queries

```
# SPARQL query across all federal states
SELECT ?name ?bundesland WHERE {
  ?friedhof a :Friedhof ;
            :name ?name ;
            :bundesland ?bundesland .
  FILTER (?bundesland IN ("NRW", "SH", "BY"))
}
```

## Funding

### State Funding

- **Digitalization funds**: State funds for IT projects
- **EFRE**: EU regional funds
- **Model projects**: Research funding

### Inter-municipal Cooperation

- **IT special purpose associations**: Shared infrastructure
- **Shared services**: Cost sharing

## Governance

### State Coordination Office

- Contact person for municipalities
- Training and support
- Best practice exchange

### Municipal Working Group

- Representatives of all participating municipalities
- Quarterly meetings
- Decisions on further development

::: tip Federal State interested?
We support states in building their own p2d2 infrastructures!
:::