---
title: Umwidmung der Werte-Reihe
description: Soll-Spezifikation für die inhaltliche Umwidmung der bestehenden Werte-Reihe auf der p2d2-Startseite zu einer Beteiligungs-Übersicht
status: draft
lastUpdated: 2026-08-10
lang: de
category: spec
specid: ptf-roadmap-webauftritt-werte-reihe
parent: ptf-roadmap-umsetzung
dependencies:
  - ./startseite-onboarding-und-navigation
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer:
  reviewDate:
---

# Umwidmung der Werte-Reihe

Diese Spezifikation beschreibt die inhaltliche Umwidmung der bestehenden Werte-Reihe auf der p2d2-Startseite zu einer knappen Beteiligungs-Übersicht. Sie ist die in Abschnitt 9 und 14 der [Startseiten-Spezifikation](./startseite-onboarding-und-navigation) angekündigte Folge-Spezifikation. Der Status `draft` bedeutet nicht, dass die hier festgelegten Anforderungen unverbindlich oder frei interpretierbar sind.

## 1. Zweck

Die bestehende Werte-Reihe auf der Startseite ("Offene Daten", "Gemeinschaft", "Transparenz") gilt als überarbeitungswürdig und wird inhaltlich umgewidmet zu einer knappen Beteiligungs-Übersicht. Diese Spezifikation regelt ausschließlich den Textinhalt der bestehenden Komponente(n); es wird keine neue Komponente angelegt und keine neue Route erstellt.

## 2. Scope und Nicht-Ziele

Im Scope:

```text
- Textinhalt der Werte-Reihe (Überschrift, Einleitung, drei Karten)
- Verlinkung der drei Karten auf bestehende, bereits inhaltlich gefüllte
  Routen: /mitmachen, /fuer-oev, /fuer-osm
```

Nicht im Scope:

```text
- Neue Astro-Komponenten
- Neue Routen oder Unterseiten
- Visuelles Redesign der Karten (Layout, Farben, Icons bleiben wie bestehend,
  sofern nicht technisch zwingend wegen des neuen Textes)
- Inhaltliche Vertiefung auf den Zielseiten selbst (diese sind bereits
  eigenständig gepflegt)
```

## 3. Dateigenaue Implementierungsfläche

Eine spätere Implementierung darf voraussichtlich nur folgende Dateien verändern – abhängig vom tatsächlichen Ist-Zustand des Codes, den die Schreib-KI vor der Umsetzung selbst prüfen muss:

```text
p2d2/src/components/WerteGrid.astro
p2d2/src/components/Werte.astro
p2d2/src/content/werte/*.md
```

Es wird keine neue Datei angelegt und keine bestehende Datei aus dem Werte-Kontext gelöscht, sofern nicht die Anzahl der Karten sich ändert (siehe Abschnitt 4).

## 4. Verbindlicher neuer Inhalt

Überschrift und Einleitung der Werte-Reihe sowie die drei Karten erhalten verbindlich diesen Inhalt:

```text
Überschrift:
Ein Thema. Eine Kommune. Viele Perspektiven.

Einleitung (ein Satz):
p2d2 beginnt dort, wo ein Thema vor Ort wichtig ist – und lädt je nach
Perspektive zu unterschiedlichen Beteiligungswegen ein.

Karte 1:
Titel: Ich kenne Orte und Geschichten
Untertitel: Lokales Wissen sichtbar machen
Ziel: /mitmachen

Karte 2:
Titel: Ich arbeite mit öffentlichen Daten
Untertitel: Ein Fachverfahren als gemeinsames Thema öffnen
Ziel: /fuer-oev

Karte 3:
Titel: Ich mappe mit OpenStreetMap
Untertitel: Daten prüfen, ergänzen und gemeinsam weiterentwickeln
Ziel: /fuer-osm
```

Die Anzahl der Karten ändert sich von drei bestehenden (Offene Daten, Gemeinschaft, Transparenz) zu drei neuen (siehe oben) – die Kartenanzahl bleibt unverändert bei drei.

## 5. Nicht-Ziele bei der Formulierung

```text
- Keine Aussagen über bereits verfügbare Beteiligungsfunktionen, die nicht
  durch den aktuellen Code oder die verlinkten Zielseiten gedeckt sind.
- Kein neuer Fließtext-Absatz zusätzlich zur Einleitung.
- Keine neuen Routen oder Ankerlinks außerhalb von /mitmachen, /fuer-oev,
  /fuer-osm.
```

## 6. Abnahmekriterien

1. Die Werte-Reihe zeigt die neue Überschrift und Einleitung wie in Abschnitt 4 festgelegt.
2. Alle drei Karten verlinken auf die dort festgelegten, bereits existierenden Routen.
3. Die Anzahl der Karten bleibt bei drei.
4. Keine neue Astro-Komponente und keine neue Route wurden angelegt.
5. Die Content Collection "werte" bleibt in Struktur (Schema in `content.config.ts`) unverändert; nur die Textinhalte ändern sich.

## 7. Abhängige Folge-Spezifikationen

```text
Keine.
```

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-10 | Erstanlage: Soll-Spezifikation für die Umwidmung der Werte-Reihe. |