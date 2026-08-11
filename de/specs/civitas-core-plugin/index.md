---
title: Serveraufbau V1
description: Spezifikation eines Plugins zur Anbindung der CIVITAS/CORE-Plattform an p2d2
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-index
parent: specs-index
dependencies: []
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Serveraufbau V1

Dieser Bereich spezifiziert ein Plugin, das die Anbindung der CIVITAS/CORE-Plattform an p2d2 ermöglicht. CIVITAS/CORE stellt eine modulare Open-Source-Plattform für kommunale Verwaltungsprozesse bereit. Das Plugin soll Daten und Prozesse zwischen p2d2 und CIVITAS/CORE orchestrieren.

## Gliederung

Die Spezifikation ist in drei übergeordnete Bereiche gegliedert:

1. **Serveraufbau** — Infrastruktur, Virtualisierung, Netzwerk und Laufzeitumgebung für das Plugin
2. **Plattformintegration** — Anbindung an CIVITAS/CORE-APIs, Authentifizierung und Datenmodell (später)
3. **Fachintegration** — Abbildung fachlicher Prozesse und Datenflüsse zwischen den Systemen (später)

Der vorliegende Bereich [Serveraufbau](./serveraufbau-v1/) ist die Grundlage für alle nachfolgenden Spezifikationen. Ohne eine entschiedene Serverarchitektur können Plattform- und Fachintegration nicht spezifiziert werden.

Daneben spezifiziert der Bereich [Serveraufbau V1s](./serveraufbau-v1s/) die Buildvariante CIVITAS/CORE V1 mit statischer Masterportal-Konfiguration. Er leitet sich aus dem V1-Serveraufbau ab und beschreibt ausschließlich die Abweichungen.

## Status

Die Spezifikation befindet sich im Entwurfsstadium. Alle Angaben sind vorläufig und müssen vor der Implementierung durch eine abgestimmte Entscheidung ersetzt werden.
