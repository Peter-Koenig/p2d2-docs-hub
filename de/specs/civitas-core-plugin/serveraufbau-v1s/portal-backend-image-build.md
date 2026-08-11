---
title: Portal-Backend-Image-Build für V1s
description: Lokaler Build des geoportal_backend-Images mit statisch eingebauter Masterportal-Konfiguration für die CIVITAS/CORE-V1s-Buildvariante
status: draft
lastUpdated: 2026-08-11
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-v1s-image-build
parent: civitas-core-plugin-serveraufbau-v1s-index
dependencies:
  - civitas-core-plugin-serveraufbau-v1s-index
quality:
  completeness: 30
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Portal-Backend-Image-Build (V1s)

Diese Seite spezifiziert den lokalen Build des Portal-Backend-Images für die V1s-Buildvariante. Das Image enthält die Masterportal-Konfiguration statisch eingebaut und ersetzt damit die S3-/RustFS-Auslieferung für diese Instanz.

Alle hier dokumentierten Fakten wurden am 2026-08-11 am laufenden System per `kubectl` verifiziert. Es handelt sich um keine offenen Annahmen mehr.

## Ausführungsort

Sämtliche Schritte finden **innerhalb der Ziel-VM** statt. Ein Zwischenschritt über den sdt-Server (Remote-Build) ist nicht vorgesehen.

## Soft-Fork und Vorbereitung

1. **Soft-Fork-Klon**: Das Repository `geoportal-components` wird direkt in der Ziel-VM geklont (lokaler Klon, eigener Branch, kein Push ins Original-Repo).
2. **Instanzverzeichnis umbenennen**: `portal-config/default/` wird in `portal-config/Standard/` umbenannt.
   - Die Umbenennung ist **case-sensitiv** und muss exakt dem Wert von `PORTAL_INSTANCE_NAME` entsprechen.
   - Verifizierter Laufwert der Referenzinstallation: `PORTAL_INSTANCE_NAME=Standard`.
3. **Submodule initialisieren**: `git submodule update --init --recursive` stellt das `portal-backend`-Submodul bereit, das der Build benötigt.

## Build-Ablauf

Der Build erfolgt über eine Skriptfunktion `build_geoportal_backend_image()`, die folgende Schritte kapselt:

1. **Docker temporär installieren**: Docker wird nur installiert, wenn es auf der Ziel-VM noch nicht vorhanden ist. Die Funktion merkt sich, ob sie Docker selbst installiert hat.
2. **Image bauen**: `docker build -f Dockerfile_geoportal_backend .` (Build-Kontext = Repo-Root).
3. **In containerd importieren**: `k3s ctr images import` übernimmt das gebaute Image in den containerd-Store des k3s-Clusters. Ein externer Registry-Betrieb ist bei Single-Node-k3s nicht erforderlich.
4. **Docker ggf. wieder deinstallieren**: Hat die Funktion Docker selbst installiert, entfernt sie es nach dem Import wieder; wurde Docker vorgefunden, bleibt es unangetastet.

**Zeitaufwand-Hinweis**: Im LAN steht ein apt-cacher mit 2,5 GBit/s-Anbindung zur Verfügung. Die temporäre Docker-Installation und -Deinstallation ist daher zeitlich unkritisch.

## Backend-Env-Variablen

Das Portal-Backend wird mit folgenden Umgebungsvariablen betrieben. Die Werte entsprechen der verifizierten Referenzinstallation; Platzhalter sind je Zielsystem zu ersetzen.

| Variable | Wert | Anmerkung |
|---|---|---|
| `PORT` | `8101` | Backend-Port, bei Docker nicht ändern |
| `LOG_LEVEL` | `DEBUG` | Log-Level |
| `TEST_MODE` | `FALSE` | Eigenlogin des Backends deaktiviert |
| `KEYCLOAK_HOST` | `https://idm.<domain>` | IDM-Basis-URL |
| `KEYCLOAK_GRANT_TYPE` | `password` | Grant-Type, unverändert lassen |
| `KEYCLOAK_REALM` | `<idm_realm>` | IDM-Realm |
| `KEYCLOAK_CLIENT_ID` | `<client_id>` | IDM-Client (verifiziert: `geostack`) |
| `KEYCLOAK_CLIENT_SECRET` | `<client_secret>` | **vor dem ersten V1s-Testlauf rotieren** (siehe Hinweise) |
| `KEYCLOAK_PUBLIC_KEY` | `<realm_public_key>` | Public Key des IDM-Clients für Token-Signatur |
| `PUBLIC_ROLE` | `ds_open_data` | Rolle für öffentliche Datenspaces |
| `COOKIE_TOKEN_NAME` | `token` | Cookie-Name für das Token |
| `INPUT_FILE_PATH` | `input` | Pfad zu den Eingabedateien, unverändert lassen |
| `SERVICE_INTERNET_INPUT_FILE` | `services` | Eingabedatei → serviert als `services-internet.json` |
| `REST_SERVICES_INTERNET_INPUT_FILE` | `rest-services` | Eingabedatei → serviert als `rest-services-internet.json` |
| `CONFIG_INPUT_FILE` | `config` | Eingabedatei → serviert als `config.json` |
| `INPUT_FILES_EXTENSION` | `.json` | Endung der Eingabedateien |
| `OUTPUT_FILES_EXTENSION` | `.json` | Endung der Ausgabedateien |
| `OUTPUT_FILE_PATH` | `output` | Pfad zu den Ausgabedateien |

**Alle `S3_*`-Variablen entfallen** in der V1s-Buildvariante (`S3_ENABLED`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET_NAME`, `S3_FORCE_PATH_STYLE`). Die Konfiguration wird statisch aus dem Image geliefert, nicht aus dem Objektspeicher.

## Hinweise

- **KEYCLOAK_CLIENT_SECRET rotieren**: Der Wert des Client-Secrets war im Rahmen der Entwicklung kurzzeitig im Klartext sichtbar (siehe Commit-Historie beziehungsweise Chat-Protokoll). Vor dem ersten V1s-Testlauf muss das Secret in der IDM rotiert und die neue Konfiguration eingespielt werden.
- **Sicherheitsbewusste Doku**: Secrets werden bewusst nicht in dieser Spezifikation geführt, sondern ausschließlich zur Laufzeit über die Zielsystem-Konfiguration bereitgestellt.