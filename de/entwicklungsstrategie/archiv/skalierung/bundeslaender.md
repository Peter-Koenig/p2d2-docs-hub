---
title: Bundesländer (Archiv)
status: archived
archived: true
replacedBy: ../../index
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

::: warning Archiviert
Diese Seite gehört zum Archiv des Strategie-Handbuchs und ist nicht mehr die aktuelle Strategie. Aktuelle Inhalte: [Übersicht](../../index).
:::

# Bundesländer

Die Skalierung auf Bundesland-Ebene ermöglicht landesweite Geodateninfrastrukturen.

## Pilot: Nordrhein-Westfalen

**Warum NRW?**
- Köln und Bonn bereits aktiv
- Größtes Bundesland (Einwohnerzahl)
- Starke OpenData-Initiativen
- open.nrw als Landes-Portal vorhanden

**Vision NRW 2027**:
- 50+ Kommunen in NRW nutzen p2d2
- Landesweite Friedhofs-Datenbank
- Integration mit GEOportal.NRW

## Schleswig-Holstein

**Warum Schleswig-Holstein?**
- Progressives E-Government-Gesetz
- Starkes Bekenntnis zu Open Source
- Überschaubare Größe für Pilotprojekt

**Besonderheiten**:
- Küsten-spezifische Kategorien (Strände, Häfen)
- Tourismus-Fokus (Sehenswürdigkeiten)
- Grenzregion (DK/DE)

## Landes-Geodateninfrastrukturen

### GDI-DE Integration

p2d2 als Baustein der GDI-DE:

```
┌─────────────────────┐
│      GDI-DE         │
│ (Bundesebene)       │
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
│  (Kommunalebene)   │
└────────────────────┘
```

### Metadaten-Harmonisierung

- **INSPIRE-konforme Metadaten**
- **GeoNetwork-Integration**
- **CSW-Schnittstelle**

## Landes-spezifische Anpassungen

### Datenmodelle

Jedes Bundesland kann eigene Kategorien haben:

- **Bayern**: Biergärten, Volksfeste
- **Schleswig-Holstein**: Strände, Leuchttürme
- **Brandenburg**: Seen, Naturparks

### Rechtliche Anforderungen

- **Datenschutz**: Länderspezifische Regelungen
- **Lizenzierung**: Landesdatenlizenzen
- **Archivierung**: Landesarchivgesetze

## Föderation

### Landes-Instanzen

Jedes Bundesland kann eine eigene p2d2-Instanz betreiben:

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

### Cross-State-Queries

```
# SPARQL-Query über alle Bundesländer
SELECT ?name ?bundesland WHERE {
  ?friedhof a :Friedhof ;
            :name ?name ;
            :bundesland ?bundesland .
  FILTER (?bundesland IN ("NRW", "SH", "BY"))
}
```

## Finanzierung

### Landes-Förderung

- **Digitalisierungsfonds**: Landesgelder für IT-Projekte
- **EFRE**: EU-Regionalfonds
- **Modellprojekte**: Forschungsförderung

### Interkommunale Zusammenarbeit

- **IT-Zweckverbände**: Gemeinsame Infrastruktur
- **Shared Services**: Kostenteilung

## Governance

### Landes-Koordinierungsstelle

- Ansprechpartner für Kommunen
- Schulungen und Support
- Best-Practice-Austausch

### Kommunale Arbeitsgruppe

- Vertreter:innen aller teilnehmenden Kommunen
- Quartalsweise Treffen
- Entscheidungen über Weiterentwicklung

::: tip Bundesland interessiert?
Wir unterstützen Länder beim Aufbau eigener p2d2-Infrastrukturen!
:::
