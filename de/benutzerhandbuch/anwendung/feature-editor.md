---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Feature-Editor

Der Feature-Editor ermöglicht die Bearbeitung von Geometrien und Attributen eines ausgewählten Features.

## Öffnen des Editors

1. **Feature auswählen**: Klick auf ein Feature in der Karte
2. **Editor öffnen**: Button "Bearbeiten" in der Seitenleiste
3. **Editor-Modus**: Feature wird editierbar

## Geometrie bearbeiten

### Punkte verschieben

- **Vertices anklicken** und ziehen
- **Neue Vertices**: Klick auf Liniensegment
- **Vertices löschen**: Strg + Klick auf Vertex

### Geometrie verschieben

- **Ganzes Feature**: Alt + Ziehen

### Geometrie drehen

- **Rotation**: R-Taste gedrückt halten + Maus bewegen

### Geometrie skalieren

- **Skalierung**: S-Taste gedrückt halten + Maus bewegen

## Attribute bearbeiten

Die Attribut-Tabelle zeigt alle Feature-Eigenschaften:

- **Name**: Textfeld
- **Kategorie**: Dropdown
- **Öffnungszeiten**: Strukturiertes Eingabefeld
- **Webseite**: URL-Feld mit Validierung
- **Beschreibung**: Mehrzeiliges Textfeld

### Pflichtfelder

Pflichtfelder sind mit ***** markiert:

- Name
- Kategorie
- Geometrie

### Validierung

Beim Speichern werden die Daten validiert:

- **URL-Format**: Bei Webseiten-Feldern
- **E-Mail-Format**: Bei E-Mail-Adressen
- **Koordinatenformat**: Bei Positionsangaben

## Geometrie-Typen

p2d2 unterstützt verschiedene Geometrie-Typen:

- **Point**: Einzelner Punkt (z.B. Eingang)
- **LineString**: Linie (z.B. Weg)
- **Polygon**: Fläche (z.B. Friedhof)
- **MultiPolygon**: Mehrere Flächen (z.B. Friedhof mit Exklaven)

## Rückgängig / Wiederherstellen

- **Strg + Z**: Rückgängig
- **Strg + Y**: Wiederherstellen
- **History**: Alle Änderungen werden protokolliert

## Abbrechen

- **Esc-Taste**: Bearbeitungsmodus verlassen ohne Speichern
- **Abbrechen-Button**: Alle Änderungen verwerfen

::: warning Achtung
Nicht gespeicherte Änderungen gehen beim Schließen des Editors verloren!
:::
