---
title: "p2d2 als CIVITAS/CORE-V1-AddOn"
description: Soll-Spezifikation für p2d2 als optionales AddOn auf einer kompatiblen CIVITAS/CORE-V1-Plattform – Zielbild, Voraussetzungen, Lifecycle und Abgrenzung
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# p2d2 als CIVITAS/CORE-V1-AddOn

Diese Spezifikation beschreibt p2d2 als optionales AddOn für eine kompatible bestehende CIVITAS/CORE-V1-Plattform. Sie ist Teil der PTF-Roadmap-Umsetzung und baut auf der statischen Masterportal-Konfiguration auf.

## Zweck

p2d2 soll als AddOn eine kompatible CIVITAS/CORE-V1-Plattform ergänzen, ohne die Basisplattform neu zu provisionieren oder zu ersetzen. p2d2 bleibt dabei fachlich eigenständig und Standalone-fähig; die AddOn-Variante ist eine zusätzliche Betriebsoption.

## Unterseiten

- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Standalone-Prinzip, eigene Bausteine, offene Architekturentscheidungen
- [Voraussetzungen und Kompatibilität](./voraussetzungen-und-kompatibilitaet) – Kategorien des späteren AddOn-Preflights
- [Installation, Upgrade und Rückbau](./installation-upgrade-und-rueckbau) – Ziel-Lifecycle und Abnahmekriterien

## Verwandte Spezifikationen

- [CIVITAS/CORE V1: Statische Masterportal-Konfiguration](../civitas-core-v1-statische-masterportal-konfiguration/) – konfigurative Grundlage der Masterportal-Auslieferung
- [Serveraufbau CIVITAS/CORE V1](../../civitas-core-plugin/serveraufbau-v1/) – generische Installations- und Plattformspezifikation

## Abgrenzung

Das AddOn ergänzt eine kompatible bestehende CIVITAS/CORE-V1-Plattform; es ersetzt sie nicht. Bestehende CIVITAS-Masterportal-Instanzen, GeoServer-Workspaces, Daten, Rollen, Routen und Images werden nicht implizit verändert. CIVITAS/CORE V2 ist ein eigenständiges, späteres Vorhaben und nicht Gegenstand dieser Spezifikation.