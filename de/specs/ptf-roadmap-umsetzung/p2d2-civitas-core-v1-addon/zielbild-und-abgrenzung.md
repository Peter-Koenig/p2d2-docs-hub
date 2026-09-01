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

## Architektur-Zuordnung: LXC zu Pod

Die Standalone-Bausteine werden wie folgt in den CIVITAS/CORE-V1s-Cluster überführt:

| p2d2-Standalone-Baustein | Ziel in CIVITAS/CORE V1s | Mechanismus |
|---|---|---|
| PostgreSQL/PostGIS (LXC) | Eigener `PostgresCluster`-CR im bestehenden postgres-operator | kein neuer Operator, neue CR analog zu `central-db` |
| GeoServer (LXC) | Neuer Workspace und Datastore im bestehenden GeoServer-Pod | Muster aus `geoserver_setup_workspaces_and_datastore.yml` wiederverwendbar |
| MapProxy (LXC) | Neuer eigener Pod, eigenes Image | kein Vorbild im Cluster, Standard-Containerisierung |
| Frontend/AstroJS (LXC) | Neuer eigener Pod, eigenes Image | analog zum service-portal-Pattern |
| Eigene Masterportal-Instanz und eigenes portal-backend | Zweiter Helm-Release, Build-Mechanismus aus V1s wiederverwendet | `06c_image_build.sh`-Pattern direkt anwendbar |

AstroJS bleibt die äußere Hülle für Landingpages, Onboarding und Beteiligung. Masterportal bleibt der eingebettete generische Kartenviewer, zeigt aber auf die eigene p2d2-Instanz statt auf die Standalone-LXC. Der Feature-Editor bleibt eigenständiger AstroJS/OpenLayers-Code und schreibt direkt per WFS-T gegen den neuen p2d2-GeoServer-Workspace. Diese Aufteilung hält das Architekturprinzip ein: p2d2 bleibt fachlich eigenständig und hängt nicht von CIVITAS-spezifischen APIs oder Prozessen ab.

## Schutz bestehender CIVITAS-Ressourcen

Bestehende CIVITAS-Masterportal-Instanzen, GeoServer-Workspaces, Daten, Rollen, Routen und Images dürfen durch das AddOn **nicht implizit verändert oder ersetzt werden**. Installieren, Aktualisieren, Verifizieren und Rückbauen müssen später AddOn-spezifisch, idempotent und nachvollziehbar erfolgen und ausschließlich p2d2-eigene Ressourcen betreffen.

## Abgrenzung zu CIVITAS/CORE V2

CIVITAS/CORE V2 ist ausdrücklich **nicht Gegenstand dieses Dokuments**. V2 ist architektonisch eigenständig, verwendet voraussichtlich Helm-Charts statt der V1-/Ansible-/`cc_cli`-Struktur und wird erst nach V1-Erfahrungen und einer eigenen Architekturentscheidung behandelt. Es wird keine gemeinsame technische Implementierungsbasis zwischen V1 und V2 vorweggenommen.

## Beziehung zur V1s-AddOn-Baseline

Das AddOn soll zunächst auf einer abgenommenen, restaurierbaren [V1s-AddOn-Baseline](../civitas-core-v1-statische-masterportal-konfiguration/v1s-buildvariante-und-addon-baseline) entwickelt und getestet werden. Nach einem Restore dieser Baseline soll kein vollständiger CIVITAS/CORE-Build erforderlich sein; es werden nur AddOn-Artefakte und AddOn-Konfigurationen erneut ausgerollt.

Die konkrete Konfigurationsauslieferung der p2d2-Masterportal-Instanz bleibt eine offene Architekturentscheidung (siehe [Zielbild und Abgrenzung](../civitas-core-v1-statische-masterportal-konfiguration/zielbild-und-abgrenzung)).

## Implementierungs-Roadmap

Die Roadmap beschreibt die Reihenfolge der Umsetzung, ohne Zeitschätzungen und ohne Versionsnummern.

| Phase | Inhalt | Erklärung |
|---|---|---|
| 0 | Fünf offene Architekturentscheidungen final klären | Voraussetzung für alle weiteren Schritte |
| 1 | Eigener `PostgresCluster`-CR für p2d2, Schema-Migration | Isolierte Datenbasis im bestehenden postgres-operator |
| 2 | Neuer GeoServer-Workspace und Datastore im bestehenden GeoServer | p2d2-Daten getrennt von bestehenden Workspaces |
| 3 | MapProxy containerisieren, Deployment und Ingress-Route | Eigener MapProxy-Pod mit Image und Route |
| 4 | Eigene Masterportal-Instanz und eigenes portal-backend, V1s-Image-Build-Pattern wiederverwenden | Zweiter Helm-Release nach dem V1s-Muster |
| 5 | Keycloak-Client und Rollen/Gruppen für p2d2 | Neuer Client im `cc-prd`-Realm, Rollen analog zur Zitadel-Pflege |
| 6 | AstroJS-Frontend containerisieren, Deployment und Ingress, Auth-Flow auf Keycloak/OIDC umstellen | Eigenes Frontend-Image, OIDC-Anbindung |
| 7 | Verifikation nach dem bestehenden Lifecycle, Rückbau-Pfad testen | Abnahme und Rückbau nach dem dokumentierten Lifecycle |

## Offene Architekturentscheidungen

Die folgenden Punkte bleiben offen. Jede Empfehlung ist eine Empfehlung, keine Entscheidung.

- **PostgreSQL:** eigenes PostgreSQL-Cluster vs. eigene Datenbank vs. eigenes Schema. Empfehlung: eigener `PostgresCluster`-CR im bestehenden postgres-operator. Das isoliert p2d2-Daten vom bestehenden `central-db` und nutzt den vorhandenen Operator ohne neuen Dienst.
- **GeoServer:** geteilter GeoServer mit eigenem Workspace vs. eigenes GeoServer-Deployment. Empfehlung: geteilter GeoServer mit eigenem Workspace und Datastore. Der Ressourcen-Fußabdruck bleibt klein, das Muster aus `geoserver_setup_workspaces_and_datastore.yml` ist vorhanden, und das AddOn-Prinzip bleibt gewahrt: keine neue Basisplattform.
- **Routing:** Hostname- vs. Pfadrouting. Empfehlung: keine. Die bestehende APISIX-Konfiguration muss erst geprüft werden. Der Punkt bleibt offen.
- **portal-backend-Topologie:** gemeinsame oder getrennte Topologie. Empfehlung: getrennte Topologie mit eigenem portal-backend für die eigene Masterportal-Instanz. Das ist konsistent mit dem dokumentierten Zielbild einer eigenen Masterportal-Instanz.
- **IAM-/Rollenabbildung:** präzise Abbildung. Empfehlung: neuer Keycloak-Client im bestehenden `cc-prd`-Realm. Rollen und Gruppen analog zu den heute in Zitadel gepflegten p2d2-Rollen (`editor`, `qs1_reviewer`, `qs2_reviewer`, `export_admin`).

Diese Entscheidungen werden erst auf Basis der tatsächlichen V1-Basisplattform und der Preflight-Ergebnisse getroffen und in einer nachgelagerten Spezifikation festgehalten.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Voraussetzungen und Kompatibilität](./voraussetzungen-und-kompatibilitaet) – Kategorien des späteren AddOn-Preflights
- [Installation, Upgrade und Rückbau](./installation-upgrade-und-rueckbau) – Ziel-Lifecycle und Abnahmekriterien
- [V1s-Buildvariante und AddOn-Baseline](../civitas-core-v1-statische-masterportal-konfiguration/v1s-buildvariante-und-addon-baseline) – getrennte V1s-Buildvariante und restaurierbare AddOn-Test-Baseline