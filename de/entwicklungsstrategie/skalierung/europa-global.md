---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Europa & Global

Die Vision von p2d2 ist eine weltweite, föderierte Geodateninfrastruktur für offene Daten.

## Europa

### INSPIRE als Fundament

p2d2 baut auf INSPIRE auf:

- **Interoperabilität**: Harmonisierte Datenmodelle
- **Services**: View, Download, Discovery
- **Metadaten**: ISO 19115/19119

### Pilot-Länder

**Niederlande**
- Starke OpenData-Kultur
- OSM-Community sehr aktiv
- data.overheid.nl als zentrales Portal

**Frankreich**
- data.gouv.fr als OpenData-Portal
- Kooperation mit OpenStreetMap France

**Polen**
- Wachsende OpenData-Bewegung
- EU-Fördergelder verfügbar

## Mehrsprachigkeit

### UI-Übersetzung

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

### Daten-Mehrsprachigkeit

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

## Föderierte Architektur

### Instanzen-Verzeichnis

```
# registry.yml
instances:
  - id: de-nrw-koeln
    url: https://koeln.data-dna.eu
    language: de
    country: DE
    state: NRW
  
  - id: nl-amsterdam
    url: https://amsterdam.data-dna.eu
    language: nl
    country: NL
```

### Cross-Instance-Queries

```
User in Aachen sucht Friedhöfe im Umkreis von 50km
→ Query an de-nrw-aachen
→ Erkennt: 50km reicht bis NL
→ Föderierte Query an nl-maastricht
→ Ergebnisse zusammenführen
```

## Globale Skalierung

### Developing Countries

p2d2 kann besonders in Ländern mit schwacher GDI-Infrastruktur helfen:

- **Niedrige Einstiegshürden**: Nur Browser und Internet nötig
- **Community-getrieben**: Lokales Wissen wird genutzt
- **Open Source**: Keine Lizenzkosten

### Disaster Response

Nach Naturkatastrophen:

- **Schnelle Kartierung**: Beschädigte Infrastruktur erfassen
- **Koordination**: Hilfsorganisationen nutzen gemeinsame Datenbasis
- **HOT**: Integration mit Humanitarian OpenStreetMap Team

## Technische Herausforderungen

### Performance

- **Tile-Caching**: Weltweit verteilte CDNs
- **Database-Sharding**: Geografische Aufteilung
- **API-Rate-Limiting**: Schutz vor Überlastung

### Data-Sovereignty

- **Nationale Hoheit**: Jedes Land kontrolliert seine Daten
- **DSGVO**: Europäische Datenschutzregelungen
- **Lokale Gesetze**: Länderspezifische Anforderungen

## Partnerschaften

### OpenStreetMap Foundation

- **Daten-Austausch**: Bidirektionale Synchronisation
- **Community**: Gemeinsame Events und Mapathons

### WikiData

- **Linked Open Data**: Verknüpfung mit WikiData-Items
- **Mehrsprachigkeit**: Nutzung von WikiData-Labels

### OGC (Open Geospatial Consortium)

- **Standards**: Mitarbeit an OGC-Standards
- **Zertifizierung**: OGC-konforme Implementierung

## Vision: Data-DNA weltweit

```
         ┌─────────────┐
         │  Data-DNA   │
         │   Global    │
         └──────┬──────┘
                │
     ┌──────────┼──────────┐
     │          │          │
┌────▼───┐ ┌────▼───┐ ┌────▼───┐
│ Europa │ │ Afrika │ │  Asien │
└────┬───┘ └────┬───┘ └────┬───┘
     │          │          │
  ┌──┴──┐    ┌──┴──┐    ┌──┴──┐
  │ DE  │    │ KE  │    │ IN  │
  └─────┘    └─────┘    └─────┘
```

**Bis 2030**:
- 10.000+ Kommunen weltweit
- 1.000.000+ Nutzer:innen
- 100.000.000+ Features erfasst

::: tip Think Global, Act Local
Globale Infrastruktur, lokale Daten, Community-getrieben.
:::
