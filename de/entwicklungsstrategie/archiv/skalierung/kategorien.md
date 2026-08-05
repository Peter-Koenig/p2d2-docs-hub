---
title: Kategorien-Ausdehnung (Archiv)
status: archived
archived: true
replacedBy: ../../kommunale-einfuehrung-deutschland
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

::: warning Archiviert
Diese Seite gehört zum Archiv des Strategie-Handbuchs und wird nicht mehr als aktuelle Strategie ausgegeben. Aktuelle Inhalte: [Übersicht](../../index).
:::

# Kategorien-Ausdehnung

Die schrittweise Ausdehnung auf weitere Datenkategorien ist zentral für die Skalierung von p2d2.

## Ausgangspunkt: Friedhöfe

**Warum Friedhöfe als Pilotprojekt?**

- **Überschaubare Komplexität**: Klar definierte Geometrien
- **Verwaltungsrelevanz**: Städte müssen Friedhöfe verwalten
- **OSM-Lücke**: Friedhöfe sind in OSM oft unvollständig
- **Geringe Änderungsrate**: Friedhöfe ändern sich selten

**Erfolge**:
- 25 Friedhöfe in Köln erfasst
- Geometrien korrigiert und in OSM übertragen
- Attribute ergänzt (Öffnungszeiten, Kontakt)

## Kategorien-Roadmap

### Phase 1: Grünflächen (2025)

**Blumenbeete**
- Ähnliche Geometrie wie Friedhöfe (Polygone)
- Höhere Änderungsrate (saisonal)
- Verwaltungsrelevanz: Grünflächenämter

**Parks und Grünanlagen**
- Größere Flächen
- Mehr Attribute (Spielplätze, Bänke, Wege)

### Phase 2: Verkehrsinfrastruktur (2026)

**Radwege**
- LineStrings statt Polygone
- Attribute: Breite, Belag, Beleuchtung
- OSM-Kategorie: cycleway

**Parkplätze**
- Points oder Polygone
- Attribute: Anzahl Stellplätze, Parkgebühren
- Dynamische Daten: Belegung (zukünftig)

### Phase 3: Kulturelles Erbe (2026)

**Denkmäler**
- Points mit ausführlichen Beschreibungen
- WikiData-Integration besonders relevant
- Fotos und historische Informationen

**Kulturstätten**
- Theater, Museen, Galerien
- Öffnungszeiten, Veranstaltungen

### Phase 4: Soziale Infrastruktur (2027)

**Spielplätze**
- Polygone mit Ausstattungs-Attributen
- Sicherheitsprüfungen als zeitliche Dimension

**Öffentliche Toiletten**
- Points mit Barrierefreiheits-Info
- Öffnungszeiten

## Kategorien-Anforderungen

### Technisch

| Kategorie | Geometrie | Attribute | Änderungsrate | Komplexität |
|-----------|-----------|-----------|---------------|-------------|
| Friedhöfe | Polygon | Mittel | Niedrig | Niedrig |
| Blumenbeete | Polygon | Niedrig | Hoch | Niedrig |
| Radwege | LineString | Hoch | Mittel | Mittel |
| Denkmäler | Point | Sehr Hoch | Niedrig | Mittel |
| Spielplätze | Polygon | Hoch | Mittel | Hoch |

### Organisatorisch

- **Dateneigner**: Welches Amt ist zuständig?
- **Aktualisierung**: Wie oft ändern sich die Daten?
- **Qualität**: Wie präzise müssen die Daten sein?

## Kategorien-Schema

### Datenmodell-Erweiterung

```
CREATE TABLE features.category_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    geometry_type VARCHAR(20) NOT NULL,
    attribute_schema JSONB NOT NULL,
    osm_tags JSONB,
    wikidata_property VARCHAR(50)
);

-- Beispiel: Friedhof
INSERT INTO features.category_definitions (name, geometry_type, attribute_schema, osm_tags)
VALUES ('friedhof', 'MultiPolygon', 
    '{"name": "string", "adresse": "string", "oeffnungszeiten": "string"}',
    '{"landuse": "cemetery", "religion": "christian"}');
```

### UI-Anpassungen

- **Kategorie-Auswahl** beim Erstellen eines Features
- **Kategorien-spezifische Formulare** für Attribute
- **OSM-Tag-Mapping** pro Kategorie

## Priorisierung

### Kriterien

1. **Verwaltungsrelevanz**: Wie wichtig ist die Kategorie für Behörden?
2. **Community-Interesse**: Wie viele Nutzer:innen interessieren sich?
3. **OSM-Lücke**: Wie unvollständig sind die OSM-Daten?
4. **Technische Machbarkeit**: Wie komplex ist die Umsetzung?

### Priorisierungs-Matrix

```
Hoch  │ Radwege    │ Denkmäler  │
      │            │            │
Verwalt.│ Blumenbeete│ Friedhöfe  │
      │            │ (done)     │
      │            │            │
Niedrig│            │ Toiletten  │
      └────────────┴────────────┘
        Niedrig      Hoch
          OSM-Lücke
```

::: tip Kategorie vorschlagen
Haben Sie eine Idee für eine neue Kategorie? Erstellen Sie ein Issue auf GitHub!
:::
