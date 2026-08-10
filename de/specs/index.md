---
title: Spezifikationshandbuch
description: Zweck, Abgrenzung und Navigation des Specs-Handbuchs für p2d2
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: specs-index
parent: ""
dependencies: []
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Spezifikationshandbuch

Das Spezifikationshandbuch (Specs) dokumentiert die technischen Anforderungen, Architekturentscheidungen und Abnahmekriterien für geplante Erweiterungen und Komponenten des p2d2-Systems. Es dient als verbindliche Grundlage für Implementierung, Test und Abnahme.

## Abgrenzung zu anderen Handbüchern

| Handbuch | Zweck |
|----------|-------|
| **Benutzerhandbuch** | Beschreibt die Bedienung der Anwendung aus Anwendersicht |
| **Administrationshandbuch** | Dokumentiert den Betrieb der bestehenden Infrastruktur |
| **Entwicklungshandbuch** | Erläutert Architektur und Workflows für Entwickler |
| **Spezifikationshandbuch (dieses)** | Definiert Anforderungen und Spezifikationen für noch nicht implementierte Komponenten |

Während Administrations- und Entwicklungshandbuch den Ist-Zustand beschreiben, hält das Specs-Handbuch den Soll-Zustand künftiger Erweiterungen fest.

## Aktuelle Bereiche

- [Serveraufbau V1](./civitas-core-plugin/) — Spezifikation des Serveraufbaus für die CIVITAS/CORE-Plattform

## PTF-Roadmap-Umsetzung

- [Startseite, Karten-Onboarding und Navigation](./ptf-roadmap-umsetzung/webauftritt-startseite/startseite-onboarding-und-navigation.md) — Soll-Spezifikation für eine verständlichere öffentliche p2d2-Startseite (erste operative Maßnahme der PTF-Roadmap)
- [Umwidmung der Werte-Reihe](./ptf-roadmap-umsetzung/webauftritt-startseite/werte-reihe-umwidmung.md) — Soll-Spezifikation für die inhaltliche Umwidmung der Werte-Reihe zu einer Beteiligungs-Übersicht
- [CIVITAS/CORE V1: Statische Masterportal-Konfiguration](./ptf-roadmap-umsetzung/civitas-core-v1-statische-masterportal-konfiguration/) — Soll-Spezifikation für die statische, versionierte und imagebasierte Auslieferung der Masterportal-Konfiguration
- [p2d2 als CIVITAS/CORE-V1-AddOn](./ptf-roadmap-umsetzung/p2d2-civitas-core-v1-addon/) — Soll-Spezifikation für p2d2 als optionales AddOn auf einer kompatiblen CIVITAS/CORE-V1-Plattform

## Navigationsübersicht

- [Serveraufbau V1 — Übersicht](./civitas-core-plugin/)
- [Serveraufbau V1 — Komponenten](./civitas-core-plugin/serveraufbau-v1/)
  - [Zielbild und Abgrenzung](./civitas-core-plugin/serveraufbau-v1/zielbild-und-abgrenzung.md)
  - [VM-Sizing und Host-Ressourcen](./civitas-core-plugin/serveraufbau-v1/vm-sizing-und-host-ressourcen.md)
  - [Netzwerk, DNS und TLS](./civitas-core-plugin/serveraufbau-v1/netzwerk-dns-tls.md)
  - [Kubernetes und Laufzeitarchitektur](./civitas-core-plugin/serveraufbau-v1/kubernetes-und-laufzeitarchitektur.md)
  - [Persistenz, Storage, Backup und Restore](./civitas-core-plugin/serveraufbau-v1/persistenz-storage-backup-restore.md)
  - [Installationsphasen und Abnahmekriterien](./civitas-core-plugin/serveraufbau-v1/installationsphasen-und-abnahmekriterien.md)

## Änderungsnachverfolgung

Änderungen an Spezifikationen werden über das Git-Repository versioniert. Jede Spezifikationsseite trägt einen eigenen `lastUpdated`-Eintrag im Frontmatter. Nach erfolgreicher Abnahme wird der Status auf `reviewed` gesetzt.
