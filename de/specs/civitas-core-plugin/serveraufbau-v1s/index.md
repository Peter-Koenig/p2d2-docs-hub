---
title: Serveraufbau V1s
description: Übersicht über die Spezifikation des Serveraufbaus für die CIVITAS/CORE-V1s-Buildvariante (V1 mit statischer statt S3-basierter Masterportal-Konfiguration)
status: draft
lastUpdated: 2026-08-11
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-v1s-index
parent: civitas-core-plugin-index
dependencies:
  - civitas-core-plugin-serveraufbau-index
quality:
  completeness: 30
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Serveraufbau V1s

Dieser Bereich spezifiziert den Serveraufbau für die **V1s-Buildvariante**: CIVITAS/CORE V1 mit **statischer statt S3-basierter Masterportal-Konfiguration**. Die Masterportal-Konfiguration wird dabei nicht mehr zur Laufzeit aus RustFS/S3 geladen, sondern als versioniertes Artefakt direkt in das Portal-Backend-Image gebaut.

Grundlage ist das Vorhaben [CIVITAS/CORE V1: Statische Masterportal-Konfiguration](../../ptf-roadmap-umsetzung/civitas-core-v1-statische-masterportal-konfiguration/). Die vorliegende Spezifikation leitet sich weitgehend aus dem bestehenden [Serveraufbau V1](../serveraufbau-v1/) ab und beschreibt ausschließlich die Abweichungen.

## Unverändert gegenüber V1

Die folgenden Bereiche des V1-Serveraufbaus gelten für V1s unverändert:

| Bereich | Verweis | Hinweis |
|---|---|---|
| VM-Sizing und Host-Ressourcen | [VM-Sizing und Host-Ressourcen](../serveraufbau-v1/vm-sizing-und-host-ressourcen.md) | keine Änderung für V1s |
| Netzwerk, DNS und TLS | [Netzwerk, DNS und TLS](../serveraufbau-v1/netzwerk-dns-tls.md) | keine Änderung für V1s |
| Kubernetes-Laufzeit (k3s) | [Kubernetes-Laufzeit](../serveraufbau-v1/kubernetes-laufzeit.md) | keine Änderung für V1s |
| IDM-Provisionierung und Login | [IDM-Provisionierung und Login](../serveraufbau-v1/idm-provisionierung-und-login.md) | keine Änderung für V1s |
| E2E-Testumgebung | [E2E-Testumgebung](../serveraufbau-v1/e2e-testumgebung.md) | keine Änderung für V1s |

## Geändert gegenüber V1

Gegenüber dem V1-Serveraufbau ändern sich zwei Aspekte, die in eigenen Unterseiten spezifiziert sind:

- [Portal-Backend-Image-Build](./portal-backend-image-build.md) — lokaler Soft-Fork-Build des `geoportal_backend`-Images mit statisch eingebauter Masterportal-Konfiguration
- [Inventory-Delta](./inventory-delta.md) — die gegenüber dem V1-Inventory geänderten Felder

## Explizit nicht Gegenstand

- **Frontend-Image-Rebuild**: Das Masterportal-Frontend bleibt das unveränderte Original-Upstream-Image (`geoportal`). Seine Konfiguration wird weiterhin zur Laufzeit über Umgebungsvariablen parametrisiert; ein Rebuild ist für V1s nicht erforderlich.
- **RustFS-Deinstallation**: RustFS/S3 bleibt als Dienst der Plattform bestehen. Für die V1s-Instanz wird die S3-Anbindung lediglich deaktiviert; eine Deinstallation des Dienstes ist ausdrücklich nicht Gegenstand dieser Spezifikation.