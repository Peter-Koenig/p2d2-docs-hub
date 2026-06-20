---
title: Spezifikationshandbuch
description: Zweck, Abgrenzung und Navigation des Specs-Handbuchs für p2d2
status: draft
lastUpdated: 2026-06-20
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

- [CIVITAS/CORE-Plugin](./civitas-core-plugin/) — Spezifikation eines Plugins zur Anbindung der CIVITAS/CORE-Plattform

## Navigationsübersicht

- [CIVITAS/CORE-Plugin — Übersicht](./civitas-core-plugin/)
- [CIVITAS/CORE-Plugin — Serveraufbau](./civitas-core-plugin/serveraufbau/)
  - [Zielbild und Abgrenzung](./civitas-core-plugin/serveraufbau/zielbild-und-abgrenzung.md)
  - [VM-Sizing und Host-Ressourcen](./civitas-core-plugin/serveraufbau/vm-sizing-und-host-ressourcen.md)
  - [Netzwerk, DNS und TLS](./civitas-core-plugin/serveraufbau/netzwerk-dns-tls.md)
  - [Kubernetes und Laufzeitarchitektur](./civitas-core-plugin/serveraufbau/kubernetes-und-laufzeitarchitektur.md)
  - [Persistenz, Storage, Backup und Restore](./civitas-core-plugin/serveraufbau/persistenz-storage-backup-restore.md)
  - [Installationsphasen und Abnahmekriterien](./civitas-core-plugin/serveraufbau/installationsphasen-und-abnahmekriterien.md)

## Änderungsnachverfolgung

Änderungen an Spezifikationen werden über das Git-Repository versioniert. Jede Spezifikationsseite trägt einen eigenen `lastUpdated`-Eintrag im Frontmatter. Nach erfolgreicher Abnahme wird der Status auf `reviewed` gesetzt.
