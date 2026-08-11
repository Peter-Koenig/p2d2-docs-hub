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

## Einordnung in die Phasenfolge

Die Funktion `install_civitas()` in `modules_V1/06_civitas.sh` ruft die Phasen-Schritte in fester Reihenfolge auf. Der Image-Build wird als **neuer Schritt 2.0b** zwischen `clone_civitas_repo()` (Schritt 2.0) und `apply_overlay()` (Schritt 2.1) eingefügt:

| Schritt | Funktion | Position / Status |
|---|---|---|
| 2.0 | `clone_civitas_repo()` | bestehend — CIVITAS/CORE-Monorepo nach `${CC_V1_REPO_PATH}` klonen |
| **2.0b** | **`build_geoportal_backend_image()`** | **neu — Soft-Fork-Klon, Image-Build und containerd-Import** |
| 2.1 | `apply_overlay()` | bestehend — Overlays aus `overlay_V1/` in das geklonte Repo einspielen |
| 2.1b | `patch_masterportal_release_name()` | bestehend |
| 2.1c | `install_cc_cli()` | bestehend |
| 2.2 | `render_inventory()` | bestehend — erzeugt das Inventory, das das lokale V1s-Image referenziert |

Begründung: `build_geoportal_backend_image()` läuft vor `render_inventory()`, sodass das gerenderte Inventory das lokal gebaute Image (`image_repository`/`image_tag`) direkt aufnehmen kann. Die Einordnung als 2.0b hält alle Repository-Vorbereitungsschritte vor der Overlay- und Deployment-Phase zusammen.

## Modul-Zuordnung

| Datei | Typ | Inhalt |
|---|---|---|
| `modules_V1s/06c_image_build.sh` | neu | `build_geoportal_backend_image()` — Soft-Fork-Klon in der VM, Instanzverzeichnis-Umbenennung, Submodule-Init, temporäre Docker-Installation, Image-Build, `k3s ctr images import`, Docker-Deinstallation |
| `modules_V1/02_lib.sh` | bestehend (Abhängigkeit) | `log()`, `log_ok()`, `log_warn()`, `log_error()`, `is_installed()`, `assert_success()` |
| `modules_V1/01_config.sh` | bestehend (Abhängigkeit) | stellt die neuen V1s-Konfigurationsvariablen bereit (siehe „Konfigurationsvariablen") |

Funktionssignatur:

```bash
# modules_V1s/06c_image_build.sh
build_geoportal_backend_image() {
    # Schritte siehe Abschnitt „Build-Ablauf"
}
```

Abhängigkeiten explizit:

- `01_config.sh` muss vor `06c_image_build.sh` gesourct sein (neue Variablen `V1S_FORK_URL`, `V1S_FORK_PATH`, `V1S_INSTANCE_NAME`, `V1S_IMAGE_TAG`).
- `02_lib.sh` muss vor `06c_image_build.sh` gesourct sein (`log_*`, `is_installed`, `assert_success`).
- Aufruf an Position 2.0b in `install_civitas()` (`modules_V1/06_civitas.sh`).

## Konfigurationsvariablen

Die Variablen werden im Konfigurationsmodul `modules_V1/01_config.sh` externalisiert. Secrets und zur Laufzeit gesetzte Flags werden nie in Git versioniert.

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `V1S_FORK_URL` | Repository-URL des Soft-Fork-Klons | `https://gitlab.com/<org>/geoportal-components.git` |
| `V1S_FORK_PATH` | Lokaler Pfad des Soft-Fork-Klons in der VM | `/opt/geoportal-components-v1s` |
| `V1S_FORK_BRANCH` | Branch des Soft-Fork-Klons | `main` |
| `V1S_INSTANCE_NAME` | Instanzname-Konstante (case-sensitiv), muss exakt mit `PORTAL_INSTANCE_NAME` übereinstimmen | `Standard` |
| `V1S_IMAGE_TAG` | Lokaler Image-Tag des gebauten `geoportal_backend`-Images | `v1s-2026-08-11` |
| `V1S_IMAGE_REF` | Vollständige Image-Referenz für Build und Import | `geoportal_backend:${V1S_IMAGE_TAG}` |
| `V1S_DOCKER_INSTALLED_BY_SCRIPT` | Laufzeit-Flag: Docker wurde vom Skript installiert (`true`/`false`) — steuert die Deinstallation | wird zur Laufzeit gesetzt |

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

## Abnahmekriterien

Die Abnahme prüft das gebaute und importierte Image sowie die Auslieferung der statischen Konfiguration. Das Fehlerverhalten ist analog zur V1-Spezifikation festgelegt (Abbruch / Warnung / Auto-Korrektur).

| Prüfpunkt | Erwarteter Zustand | Befehl / Methode | Fehlerverhalten |
|---|---|---|---|
| Lokales Docker-Image | Image mit V1s-Tag vorhanden | `docker images \| grep geoportal_backend` | Abbruch (Build fehlgeschlagen) |
| containerd-Import | Image im k3s-containerd-Store vorhanden | `k3s ctr images list \| grep geoportal_backend` | Abbruch (Import fehlgeschlagen) |
| Portal-Backend-Pod | Pod READY 1/1, STATUS Running | `kubectl get pods -n <namespace> -l app=portal-backend` | Warnung + erneute Prüfung in Phase 3 (analog V1) |
| Config-Endpunkt | HTTP 200, JSON-Response der Instanz | `curl -fsS "https://geoportal.<domain>/portalBackend/Standard/config.json"` | Abbruch (Instanz nicht erreichbar oder falsche Konfiguration) |
| Docker-Idempotenz | Selbst installiertes Docker wird entfernt; vorgefundenes Docker bleibt | internes Flag `V1S_DOCKER_INSTALLED_BY_SCRIPT` | Auto-Korrektur (Idempotenz) |

```bash
# Lokales Image vorhanden
docker images | grep geoportal_backend
# Erwartung: Eintrag mit V1s-Tag (z. B. geoportal_backend:v1s-2026-08-11)

# Image im containerd-Store des k3s-Clusters
k3s ctr images list | grep geoportal_backend
# Erwartung: Eintrag mit V1s-Tag

# Portal-Backend-Pod läuft
kubectl get pods -n <namespace> -l app=portal-backend
# Erwartung: READY 1/1, STATUS Running

# Statische Konfiguration wird ausgeliefert
curl -fsS "https://geoportal.<domain>/portalBackend/Standard/config.json"
# Erwartung: HTTP 200, JSON-Response der Instanz "Standard"
```

## Ausführungsrahmen

Der Build und die Abnahme laufen im Rahmen des [Testverfahrens mit Proxmox-Backup](../../ptf-roadmap-umsetzung/civitas-core-v1-statische-masterportal-konfiguration/testverfahren-mit-proxmox-backup.md): isolierte Testinstanz, Backup vor jeder Änderung, wiederholbarer Abnahmeprozess.