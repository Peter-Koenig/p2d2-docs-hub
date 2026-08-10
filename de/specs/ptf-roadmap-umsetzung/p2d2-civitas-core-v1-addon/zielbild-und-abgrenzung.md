---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Zielbild und Abgrenzung"
description: Standalone-Prinzip, eigene Deployment-Bausteine, konfigurative Erweiterungen, Schutz bestehender CIVITAS-Ressourcen und offene Architekturentscheidungen des p2d2-V1-AddOns
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# Zielbild und Abgrenzung

Diese Seite beschreibt das Zielbild des p2d2-AddOns für CIVITAS/CORE V1 sowie dessen Abgrenzung zur Standalone-Variante, zur Basisplattform und zu CIVITAS/CORE V2.

## Standalone-Prinzip

p2d2 bleibt fachlich eigenständig und **Standalone-fähig**: Die bestehende, unabhängig betreibbare p2d2-Anwendung wird durch das AddOn nicht ersetzt oder eingeschränkt. Die AddOn-Variante ist eine **zusätzliche Betriebsoption** für Umgebungen, in denen eine kompatible CIVITAS/CORE-V1-Plattform bereits vorhanden ist.

## Eigene Bausteine und Erweiterungen

Im Rahmen des AddOns erhält p2d2 eigene, klar von der Basisplattform getrennte Ressourcen:

- eine **eigene Masterportal-Instanz** für p2d2,
- eigene Deployment-Bausteine für das **p2d2-Frontend** und **MapProxy**,
- p2d2-spezifische Konfigurationserweiterungen für **GeoServer**, **PostgreSQL/PostGIS**, **Keycloak/OIDC** sowie **Gateway/Ingress**.

Die konkrete Ausgestaltung dieser Bausteine ist nicht Gegenstand dieser Seite; sie wird in nachgelagerten Spezifikationen bestimmt.

## Schutz bestehender CIVITAS-Ressourcen

Bestehende CIVITAS-Masterportal-Instanzen, GeoServer-Workspaces, Daten, Rollen, Routen und Images dürfen durch das AddOn **nicht implizit verändert oder ersetzt werden**. Installieren, Aktualisieren, Verifizieren und Rückbauen müssen später AddOn-spezifisch, idempotent und nachvollziehbar erfolgen und ausschließlich p2d2-eigene Ressourcen betreffen.

## Abgrenzung zu CIVITAS/CORE V2

CIVITAS/CORE V2 ist ausdrücklich **nicht Gegenstand dieses Dokuments**. V2 ist architektonisch eigenständig, verwendet voraussichtlich Helm-Charts statt der V1-/Ansible-/`cc_cli`-Struktur und wird erst nach V1-Erfahrungen und einer eigenen Architekturentscheidung behandelt. Es wird keine gemeinsame technische Implementierungsbasis zwischen V1 und V2 vorweggenommen.

## Beziehung zur V1s-AddOn-Baseline

Das AddOn soll zunächst auf einer abgenommenen, restaurierbaren [V1s-AddOn-Baseline](../civitas-core-v1-statische-masterportal-konfiguration/v1s-buildvariante-und-addon-baseline) entwickelt und getestet werden. Nach einem Restore dieser Baseline soll kein vollständiger CIVITAS/CORE-Build erforderlich sein; es werden nur AddOn-Artefakte und AddOn-Konfigurationen erneut ausgerollt.

Die konkrete Konfigurationsauslieferung der p2d2-Masterportal-Instanz bleibt eine offene Architekturentscheidung (siehe [Zielbild und Abgrenzung](../civitas-core-v1-statische-masterportal-konfiguration/zielbild-und-abgrenzung)).

## Offene Architekturentscheidungen

Die folgenden Punkte sind noch nicht entschieden und werden als offene Architekturentscheidungen geführt:

- eigenes PostgreSQL-Cluster vs. eigene Datenbank vs. eigenes Schema,
- geteilter GeoServer mit eigenem Workspace vs. eigener GeoServer-Deployment,
- Hostname- vs. Pfadrouting,
- gemeinsame oder getrennte `portal-backend`-Topologie,
- präzise IAM-/Rollenabbildung.

Diese Entscheidungen werden erst auf Basis der tatsächlichen V1-Basisplattform und der Preflight-Ergebnisse getroffen und in einer nachgelagerten Spezifikation festgehalten.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Voraussetzungen und Kompatibilität](./voraussetzungen-und-kompatibilitaet) – Kategorien des späteren AddOn-Preflights
- [Installation, Upgrade und Rückbau](./installation-upgrade-und-rueckbau) – Ziel-Lifecycle und Abnahmekriterien
- [V1s-Buildvariante und AddOn-Baseline](../civitas-core-v1-statische-masterportal-konfiguration/v1s-buildvariante-und-addon-baseline) – getrennte V1s-Buildvariante und restaurierbare AddOn-Test-Baseline