---
quality:
  completeness: 15
  accuracy: 20
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Datenkategorien

Dieses Kapitel beschreibt die Datenkategorien, die p2d2 zwischen Verwaltungssystemen und öffentlichen Plattformen wie OpenStreetMap (OSM) und WikiData synchronisiert. Jede Kategorie ist für bestimmte Verwaltungsbereiche relevant und folgt einem definierten Schema für Geometrien, Attribute und Qualitätsstandards.

## Übersicht

p2d2 unterstützt derzeit folgende Hauptkategorien, wobei der Fokus auf Geodaten mit klaren Verwaltungsbezügen liegt:
| Kategorie | Geometrie‑Typ | Haupt‑Attribute | Zuständigkeit (Verwaltung) | OSM‑Tags | WikiData‑Properties |
|-----------|---------------|-----------------|----------------------------|----------|---------------------|
| Friedhöfe | Polygon | Grabflure und Gräber | Friedhofsamt, Grünflächenamt | `landuse=cemetery` | `P1435` (Heritage designation) |
| Blumenbeete | Polygon | Name, Pflanzenart, Pflegeintervall | Grünflächenamt | `landuse=flowerbed` | `P366` (has use) |
| Gleisanlagen | Polygon |   | Grünflächenamt |   |   |
| Tribünen | Polygon |   | Grünflächenamt |   |   |
| Brücken | Polygon |   | Grünflächenamt |   |   |
| Stege | Polygon |   | Grünflächenamt |   |   |
| Spielsandkisten | Polygon |   | Grünflächenamt |   |   |
| extensive Dachbegrünung | Polygon |   | Grünflächenamt |   |   |
| intensive Dachbegrünung | Polygon |   | Grünflächenamt |   |   |
| Tore für Zäune | Punkt |   | Grünflächenamt |   |   |
| Leuchten | Punkt |   | Grünflächenamt |   |   |
| Mastleuchten | Punkt |   | Grünflächenamt |   |   |
| Pollerleuchten | Punkt |   | Grünflächenamt |   |   |
| Bodenstrahler | Punkt |   | Grünflächenamt |   |   |
| Flutlichtanlagen | Punkt |   | Grünflächenamt |   |   |
| Möbel | Punkt |   | Grünflächenamt |   |   |
| Fahrradständer | Punkt |   | Grünflächenamt |   |   |
| Schilder, Leitpfosten | Punkt |   | Grünflächenamt |   |   |
| Abfallbehälter | Punkt |   | Grünflächenamt |   |   |
| Poller | Punkt |   | Grünflächenamt |   |   |
| Spielgeräte | Punkt |   | Grünflächenamt |   |   |
| Sportgeräte | Punkt |   | Grünflächenamt |   |   |
| Bäume | Punkt |   | Grünflächenamt |   |   |
| Straßenbäume | Punkt |   | Grünflächenamt |   |   |
| Anlagenbäume | Punkt |   | Grünflächenamt |   |   |
| Solitärsträucher | Punkt |   | Grünflächenamt |   |   |
| Strauch-Formgehölze | Punkt |   | Grünflächenamt |   |   |
| Kunstobjekte | Punkt |   | Grünflächenamt |   |   |
| Sonstige Kunstwerke | Punkt |   | Grünflächenamt |   |   |

*Hinweis: Diese Liste wird kontinuierlich erweitert. Weitere Kategorien sind in Planung.*

## Detaillierte Kategoriebeschreibungen

### 1. Friedhöfe

**Beschreibung:** Flächen für Bestattungen mit verwaltungstechnisch klar definierten Grenzen und Eigenschaften.

**Verwaltungsrelevanz:**
- Friedhofsverwaltung (Belegungsplanung, Grabstellenverwaltung)
- Grünflächenunterhaltung (Wege, Bepflanzung)
- Historische Dokumentation (Grabdenkmäler)

**Synchronisierte Attribute:**
- Geometrie: Polygongrenzen des Friedhofs
- Name: Offizieller Friedhofsname
- Adresse: Straße, Hausnummer, PLZ, Ort
- Öffnungszeiten: Tägliche Zugangszeiten
- Religion: Konfessionelle Ausrichtung (optional)
- Kontakt: Verwaltungsanschrift, Telefon

**Qualitätsanforderungen:**
- Geometrie muss parcelgenau sein (Grundstücksgrenzen)
- Attribute müssen amtlich bestätigt sein
- Änderungen nur nach behördlicher Freigabe

### 2. Blumenbeete und Ziergrünflächen

**Beschreibung:** Öffentlich zugängliche bepflanzte Flächen im Stadtraum.

**Verwaltungsrelevanz:**
- Pflegeplanung und -dokumentation
- Saatgut- und Materialbestellung
- Bürgeranfragen zu Bepflanzung

**Synchronisierte Attribute:**
- Geometrie: Bepflanzte Fläche
- Pflanzenart: Dominante Arten (Seasonal)
- Pflanzjahr / -saison
- Pflegeintervall: Wartungsturnus
- Zuständigkeit: Betriebshof / Gärtnerei

### 3. Radwege

**Beschreibung:** Radverkehrsanlagen im öffentlichen Straßenraum.

**Verwaltungsrelevanz:**
- Verkehrssicherheit und -planung
- Winterdienst-Routing
- Infrastruktur-Monitoring

**Synchronisierte Attribute:**
- Geometrie: Linienverlauf
- Breite: in Metern
- Belag: Asphalt, Pflaster, etc.
- Beleuchtung: vorhanden / nicht vorhanden
- Schutzstreifen: ja / nein
- Baujahr / Sanierungsdatum

### 4. Spielplätze

**Beschreibung:** Öffentliche Spiel- und Bewegungsflächen für Kinder.

**Verwaltungsrelevanz:**
- Sicherheitskontrollen (DIN EN 1176)
- Instandhaltungsplanung
- Spielwert-Bewertung

**Synchronisierte Attribute:**
- Geometrie: Eingegrenzte Spielfläche
- Altersgruppe: 0–3, 3–6, 6–12, 12+ Jahre
- Ausstattung: Schaukel, Rutsche, Sandkasten, etc.
- Letzte Sicherheitsprüfung: Datum
- Barrierefreiheit: ja / eingeschränkt / nein

### 5. Denkmäler

**Beschreibung:** Bauliche oder künstlerische Objekte mit denkmalpflegerischer Bedeutung.

**Verwaltungsrelevanz:**
- Denkmalkatasterführung
- Sanierungs- und Restaurierungsplanung
- Touristische Information

**Synchronisierte Attribute:**
- Geometrie: Punkt (zentrale Lage)
- Name: Bezeichnung des Denkmals
- Denkmalnummer: Amtliche ID
- Baujahr / Entstehungszeitraum
- Denkmaltyp: Baudenkmal, Bodendenkmal, etc.
- Beschreibung: Historischer Kontext

### 6. Öffentliche Toiletten

**Beschreibung:** WC-Anlagen im öffentlichen Raum.

**Verwaltungsrelevanz:**
- Reinigungs- und Wartungsplanung
- Barrierefreiheits-Monitoring
- Gebührenerhebung (falls zutreffend)

**Synchronisierte Attribute:**
- Geometrie: Standortpunkt
- Barrierefreiheit: voll / teilweise / keine
- Öffnungszeiten: Tages-/Jahreszeitenabhängig
- Gebühren: Kosten pro Nutzung
- Betreiber: Stadt, Private, etc.

### 7. Parkplätze (öffentlich)

**Beschreibung:** Stellflächen für Kraftfahrzeuge im öffentlichen Straßenraum.

**Verwaltungsrelevanz:**
- Parkraummanagement
- Gebührenkontrolle
- Verkehrsfluss-Optimierung

**Synchronisierte Attribute:**
- Geometrie: Stellplatzfläche oder -punkt
- Stellplatzanzahl: Anzahl der Plätze
- Gebühren: Gebührenzone / kostenpflichtig
- Parkdauer: Maximale Parkdauer
- Besonderheiten: Anwohnerparken, Ladestation

## Zuständigkeiten in der Verwaltung

Jede Kategorie ist in der Regel einem oder mehreren Fachämtern zugeordnet:

| Fachamt | Verantwortliche Kategorien | Typische Aufgaben |
|---------|----------------------------|-------------------|
| **Grünflächenamt** | Friedhöfe, Blumenbeete, Spielplätze (Flächen) | Unterhalt, Pflege, Sicherheit |
| **Tiefbauamt / Verkehrsplanung** | Radwege, Parkplätze | Planung, Bau, Instandhaltung |
| **Denkmalschutzbehörde** | Denkmäler | Erfassung, Schutz, Sanierung |
| **Ordnungsamt** | Öffentliche Toiletten, Parkplätze (Kontrolle) | Überwachung, Gebühren |
| **Jugendamt** | Spielplätze | Konzeption, Spielwert |
| **Kulturamt** | Denkmäler (touristische Aspekte) | Vermittlung, Events |

## Synchronisationsprozess

Der Datenaustausch für jede Kategorie folgt einem standardisierten Workflow:

1. **Datenbereitstellung** durch die zuständige Fachverwaltung
2. **Qualitätsprüfung** durch p2d2 (Geometrie, Attribute, Konsistenz)
3. **Community-Review** durch Bürger:innen und Expert:innen
4. **Freigabe** durch die Fachverwaltung
5. **Export** zu OpenStreetMap und/oder WikiData
6. **Rückmeldung** von Community-Änderungen an die Verwaltung

**Zeitliche Aspekte:**
- **Echtzeit-Sync:** Bei kritischen Sicherheitsdaten (Spielplätze)
- **Täglich / Wöchentlich:** Bei dynamischen Daten (Baustellen, Veranstaltungen)
- **Monatlich / Quartalsweise:** Bei stabilen Daten (Friedhöfe, Denkmäler)
- **Bei Bedarf:** Bei manuell ausgelösten Updates

## Qualitätsanforderungen

Für jede Kategorie gelten spezifische Qualitätskriterien:

### Geometrische Genauigkeit
- **Friedhöfe, Spielplätze:** Parzellengenau (±0,5 m)
- **Radwege:** Straßenmitten-genau (±1,0 m)
- **Denkmäler, Toiletten:** Standort-genau (±5,0 m)

### Attributive Vollständigkeit
- Pflichtattribute müssen zu ≥95% befüllt sein
- Standardisierte Wertebereiche (Dropdowns, wo möglich)
- Amtliche Bezeichnungen verwenden

### Aktualität
- Maximaler Alter der Daten: je nach Kategorie 1–12 Monate
- Änderungsprotokoll für alle Modifikationen
- Versionierung der Datensätze

## Nächste Schritte

- **Kategorie evaluieren:** Prüfen Sie, welche Kategorien für Ihre Kommune relevant sind
- **Datenbestand analysieren:** Welche Daten liegen bereits vor? Wo sind Lücken?
- **Pilotprojekt starten:** Beginnen Sie mit einer überschaubaren Kategorie
- **Prozesse anpassen:** Integrieren Sie p2d2 in Ihre Arbeitsabläufe

::: tip Neue Kategorie vorschlagen
Möchten Sie eine weitere Datenkategorie für die Synchronisation vorschlagen? Kontaktieren Sie das p2d2-Team oder erstellen Sie einen Vorschlag im Issue-Tracker des Projekts.
:::
