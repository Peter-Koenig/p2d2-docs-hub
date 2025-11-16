# Europe & Global

The vision of p2d2 is a worldwide, federated Spatial Data Infrastructure for open data.

## Europe

### INSPIRE as Foundation

p2d2 builds on INSPIRE:

- **Interoperability**: Harmonized data models
- **Services**: View, Download, Discovery
- **Metadata**: ISO 19115/19119

### Pilot Countries

**Netherlands**
- Strong OpenData culture
- Very active OSM community
- data.overheid.nl as central portal

**France**
- data.gouv.fr as OpenData portal
- Cooperation with OpenStreetMap France

**Poland**
- Growing OpenData movement
- EU funding available

## Multilingualism

### UI Translation

```
// i18n-Config
const translations = {
  de: {
    'feature.create': 'Feature erstellen',
    'qc.submit': 'Zur QS einreichen'
  },
  en: {
    'feature.create': 'Create feature',
    'qc.submit': 'Submit for QC'
  },
  fr: {
    'feature.create': 'Créer une entité',
    'qc.submit': 'Soumettre au contrôle qualité'
  }
};
```

### Data Multilingualism

```
{
  "type": "Feature",
  "properties": {
    "name": {
      "de": "Kölner Dom",
      "en": "Cologne Cathedral",
      "fr": "Cathédrale de Cologne"
    }
  }
}
```

## Federated Architecture

### Instance Directory

```
# registry.yml
instances:
  - id: de-nrw-cologne
    url: https://cologne.data-dna.eu
    language: de
    country: DE
    state: NRW
  
  - id: nl-amsterdam
    url: https://amsterdam.data-dna.eu
    language: nl
    country: NL
```

### Cross-Instance Queries

```
User in Aachen searches for cemeteries within 50km radius
→ Query to de-nrw-aachen
→ Recognizes: 50km reaches into NL
→ Federated query to nl-maastricht
→ Merge results
```

## Global Scaling

### Developing Countries

p2d2 can particularly help in countries with weak SDI infrastructure:

- **Low entry barriers**: Only browser and internet needed
- **Community-driven**: Local knowledge is utilized
- **Open Source**: No license costs

### Disaster Response

After natural disasters:

- **Rapid mapping**: Record damaged infrastructure
- **Coordination**: Aid organizations use common data basis
- **HOT**: Integration with Humanitarian OpenStreetMap Team

## Technical Challenges

### Performance

- **Tile caching**: Globally distributed CDNs
- **Database sharding**: Geographic distribution
- **API rate limiting**: Protection against overload

### Data Sovereignty

- **National sovereignty**: Each country controls its data
- **GDPR**: European data protection regulations
- **Local laws**: Country-specific requirements

## Partnerships

### OpenStreetMap Foundation

- **Data exchange**: Bidirectional synchronization
- **Community**: Joint events and mapathons

### WikiData

- **Linked Open Data**: Linking with WikiData items
- **Multilingualism**: Use of WikiData labels

### OGC (Open Geospatial Consortium)

- **Standards**: Participation in OGC standards
- **Certification**: OGC-compliant implementation

## Vision: Data-DNA Worldwide

```
         ┌─────────────┐
         │  Data-DNA   │
         │   Global    │
         └──────┬──────┘
                │
     ┌──────────┼──────────┐
     │          │          │
┌────▼───┐ ┌────▼───┐ ┌────▼───┐
│ Europe │ │ Africa │ │  Asia  │
└────┬───┘ └────┬───┘ └────┬───┘
     │          │          │
  ┌──┴──┐    ┌──┴──┐    ┌──┴──┐
  │ DE  │    │ KE  │    │ IN  │
  └─────┘    └─────┘    └─────┘
```

**By 2030**:
- 10,000+ municipalities worldwide
- 1,000,000+ users
- 100,000,000+ features recorded

::: tip Think Global, Act Local
Global infrastructure, local data, community-driven.
:::