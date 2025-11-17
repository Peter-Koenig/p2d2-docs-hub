---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Hauptfenster

Das Hauptfenster von p2d2 ist die zentrale Arbeitsoberfläche. Es basiert auf **OpenLayers** und bietet eine interaktive Kartenansicht mit verschiedenen Werkzeugen.

## Aufbau

### Kartenbereich

Der Kartenbereich nimmt den größten Teil des Fensters ein:

- **Hintergrundkarten**: OSM, Luftbilder, topographische Karten
- **Datenebenen**: Friedhöfe, Blumenbeete, weitere Kategorien
- **Steuerung**: Zoom, Pan, Rotation

### Werkzeugleiste

Die Werkzeugleiste (links oder oben) bietet Zugriff auf:

- **Auswahl-Tool**: Features selektieren
- **Editier-Tool**: Geometrien bearbeiten
- **Hinzufügen-Tool**: Neue Features erstellen
- **Löschen-Tool**: Features entfernen
- **Mess-Tool**: Entfernungen und Flächen messen

### Seitenleiste

Die Seitenleiste (rechts) zeigt:

- **Feature-Eigenschaften**: Attribute des ausgewählten Features
- **Layer-Control**: Ein-/Ausblenden von Ebenen
- **Legende**: Symbolerklärung
- **Suche**: Volltextsuche in Features

### Statusleiste

Die Statusleiste (unten) zeigt:

- **Koordinaten**: Mausposition in verschiedenen Koordinatensystemen
- **Maßstab**: Aktueller Kartenmaßstab
- **Bearbeitungsstatus**: Anzahl ungespeicherter Änderungen

## Navigation

### Zoomen

- **Mausrad**: Zoom in/out
- **Zoom-Buttons**: +/- in der Werkzeugleiste
- **Doppelklick**: Zoom auf angeklickten Punkt
- **Shift + Ziehen**: Zoom auf Rechteck

### Verschieben

- **Maus ziehen**: Karte verschieben
- **Pfeiltasten**: Karte in Schrittengröße verschieben

### Hintergrundkarte wechseln

- **Layer-Control**: Hintergrundkarte auswählen
- Verfügbare Karten:
  - OSM Standard
  - OSM Humanitarian
  - Luftbilder (WMS)
  - Topographische Karte 1:25.000

## Features auswählen

- **Klick auf Feature**: Feature wird selektiert
- **Eigenschaften** werden in Seitenleiste angezeigt
- **Mehrfachauswahl**: Strg + Klick

## Suche

Die Suche ermöglicht:

- **Volltextsuche** in Feature-Attributen
- **Räumliche Suche**: Features in aktuellem Kartenausschnitt
- **Filterung** nach Kategorie oder Status

::: tip Navigation
Verwenden Sie die **Leertaste** als Schnelltaste, um temporär in den Pan-Modus zu wechseln.
:::
