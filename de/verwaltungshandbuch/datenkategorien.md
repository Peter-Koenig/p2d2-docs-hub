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
