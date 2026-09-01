---
title: "CIVITAS/CORE V1: Statische Masterportal-Konfiguration – S3-zu-statisch-Migration"
description: Migrationsvorhaben von der RustFS-/S3-Ablage zur statischen, versionierten und imagebasierten Masterportal-Konfiguration – Ausgangs- und Zielzustand, Migrationsprinzipien, konzeptionelle Abnahme
quality:
  completeness: 55
  accuracy: 55
  reviewed: false
  reviewer:
  reviewDate:
---

# S3-zu-statisch-Migration

Diese Seite beschreibt das **Migrationsvorhaben** von der bestehenden RustFS-/S3-Ablage hin zu einer statischen, versionierten und imagebasierten Masterportal-Konfiguration. Sie dokumentiert ausdrücklich ein geplantes Vorhaben und keine bereits umgesetzte Migration.

Die Migration entwickelt und validiert zunächst die **V1s-Buildvariante** (CIVITAS/CORE V1 mit statischer Masterportal-Konfiguration, siehe [V1s-Buildvariante und AddOn-Baseline](./v1s-buildvariante-und-addon-baseline)). Die bestehende V1-S3-/RustFS-Referenz bleibt bis zum erfolgreichen V1s-Nachweis unverändert erhalten.

## Ausgangszustand

Ausgangspunkt ist eine funktionierende CIVITAS/CORE-V1-Referenzinstallation, deren Masterportal-Konfiguration über RustFS/S3 bereitgestellt wird. Betroffen sind die drei fachlichen Konfigurationsdateien:

- `config.json`
- `services.json`
- `rest-services.json`

Die lokale RustFS-LXC ist in diesem Zustand eine zwingende Voraussetzung für die Auslieferung der Portal-Konfiguration.

## Zielzustand

Im Zielzustand liegen dieselben fachlichen Portal-Konfigurationen in versionierten, statisch auslieferbaren Artefakten beziehungsweise Images vor. Die Auslieferung ist damit unabhängig von der lokalen RustFS-/S3-Ablage möglich und reproduzierbar, versioniert und überprüfbar.

Konzeptionelles Migrationsziel ist der erfolgreiche **V1s-Backup-Breakpoint** vor der AddOn-Entwicklung: Nach bestandener V1s-Plattformabnahme wird eine restaurierbare AddOn-Baseline gesichert, auf der spätere p2d2-AddOn-Experimente ohne erneuten vollständigen CIVITAS/CORE-Build aufsetzen können (siehe [V1s-Buildvariante und AddOn-Baseline](./v1s-buildvariante-und-addon-baseline)).

## Migrationsprinzipien

Die Migration folgt verbindlich diesen Prinzipien:

- **kein stilles Überschreiben funktionierender Bestandsportale** – bestehende Portale bleiben bis zum nachgewiesenen Zielzustand unverändert,
- **Backup vor jeder Änderung** – der Ausgangszustand ist vor jedem Migrationsschritt gesichert,
- **definierte Abbruchbedingungen** – Abbruchkriterien sind vorab festgelegt, bei deren Eintritt die Migration gestoppt wird,
- **nachweisbarer Zielzustand** – der Zielzustand ist überprüfbar und dokumentiert,
- **wiederholbarer Testablauf** – der Migrations- und Abnahmeprozess ist reproduzierbar.

## Konzeptionelle Abnahme

Eine Migration gilt konzeptionell erst dann als erfolgreich, wenn folgende Punkte erfüllt sind:

- das Masterportal lädt seine Konfiguration aus dem neuen statischen Artefakt beziehungsweise Image,
- im `portal-backend` tritt kein `ENOENT` für die erforderlichen Konfigurationsdateien auf,
- die Kernendpunkte der Plattform bleiben erreichbar,
- bestehende Portale wurden nicht unbeabsichtigt verändert.

## Technische Schritte

Grundmechanismus: Nutzung des von Civitas Connect selbst vorgesehenen
"Soft-Fork"-Verfahrens für `geoportal-components` (siehe README des
öffentlichen Upstream-Repos). Kein eigener Build-Mechanismus wird neu
erfunden.

**Betroffene Komponenten:**

| Komponente | Änderung |
|---|---|
| `geoportal` (Masterportal-Frontend) | keine — Original-Image unverändert nutzbar, da `nginx/default.conf` die Config-Endpunkte laufzeit-parametrisiert über `PORTAL_BACKEND`/`PORTAL_INSTANCE_NAME` proxied |
| `geoportal_backend` (Portal-Backend) | Eigenes Image aus Soft-Fork; `Dockerfile_geoportal_backend` kopiert `portal-config/<instance>/` bereits zur Build-Zeit ins Image |

**Migrationsschritte:**

1. Soft-Fork von `geoportal-components` anlegen (lokaler Klon, eigener
   Branch, kein Push ins Original-Repo).
2. `portal-config/default/` in `portal-config/<instance_name>/` umbenennen
   (bei statischem Betrieb Pflicht und case-sensitiv: das Backend nutzt
   das URL-Pfadsegment `/{instance}/…` als Instanzordner; verifiziert im
   laufenden Betrieb: `PORTAL_INSTANCE_NAME=Standard` bei `input/default/`
   im S3-Betrieb).
3. Fachliche Konfigurationsdateien (`config.json`, `services.json`,
   `rest-services.json`) in diesem Verzeichnis ablegen.
4. Submodule `portal-backend` initialisieren
   (`git submodule update --init --recursive`).
5. Image bauen: `docker build -f Dockerfile_geoportal_backend .`
   (Build-Kontext = Repo-Root, wie in der Upstream-`.gitlab-ci.yml`
   definiert).
6. Image lokal in den containerd-Store des Ziel-Clusters importieren
   (kein externer Image-Registry-Betrieb notwendig bei Single-Node-k3s).
7. Inventory anpassen: `s3_backend.enable: false`, `image_repository`/
   `image_tag` des `portal_backend`-Eintrags auf das neue lokale Image
   setzen (verifizierter Ausgangszustand: Produktion läuft mit
   `S3_ENABLED=true` gegen RustFS/S3 — genau die Ablage, die die Migration
   überflüssig macht).
8. Umgebungsvariablen für das Frontend setzen: `PORTAL_BACKEND` (verifiziert:
   Ingress-URL `https://geoportal.<domain>/portalBackend`, nicht Pod-DNS),
   `PORTAL_INSTANCE_NAME` (Wert aus Schritt 2, case-sensitiv) sowie
   `MAPSERVER_URL`, `GEOPORTAL_URL`, `PROXY_3D_URL`, `GEOSERVER_URL`,
   `OIDC_*` und `PORTAL_BASE_URL` (vollständige Zuordnung siehe Abschnitt
   „Verifizierte Fakten aus dem laufenden Betrieb").

**Offene Punkte vor Umsetzung:**

- Exakte Schreibweise/Konvention des `instance_name` (Groß-/Kleinschreibung)
  muss mit dem Portal-Backend-Routing übereinstimmen — **beantwortet durch
  Verifikation am laufenden Betrieb**: case-sensitiv, Pflicht bei Option A,
  Laufwert `Standard`; optionale Restverifikation am Quellcode des Submoduls
  `portal-backend` (siehe „Verifizierte Fakten aus dem laufenden Betrieb").
- Service-Name/-URL des `portal_backend`-Pods im Zielnamespace — **beantwortet
  für den Testfall**: `PORTAL_BACKEND` ist die Ingress-URL
  `https://geoportal.<domain>/portalBackend`; der konkrete Pod-Service-Name
  im Zielnamespace ist erst beim V1s-Testlauf (`cc_cli exec`) zu bestätigen.
- Der `-internet`-Suffix ist durch die Backend-Endpunkt-Konvention geklärt
  und damit kein separater offener Punkt mehr.

## Verifizierte Fakten aus dem laufenden Betrieb

Die folgenden Fakten wurden am 2026-08-11 aus der laufenden
CIVITAS/CORE-V1-Referenzinstallation (`udp.data-dna.eu`, Namespace
`cc-prd-geodata-stack`) per `kubectl` extrahiert. Sie ersetzen die zuvor
offenen Annahmen zu `instance_name`, Backend-Endpunkten und Env-Zuordnung.

**Laufende Instanz = Ausgangszustand (S3):**

- Deployment `standard-masterportal` + `portal-backend` im Namespace
  `cc-prd-geodata-stack`; `service-portal` im Namespace `cc-prd-access-stack`.
- Portal-Backend läuft mit `S3_ENABLED=true`,
  `S3_ENDPOINT=http://192.168.12.140:9000` (RustFS/MinIO),
  `S3_BUCKET_NAME=portal-config`, `S3_FORCE_PATH_STYLE=true`.
- Das Image enthält `input/config_old.json` und `input/default/` — nur als
  Fallback für den S3-deaktivierten Betrieb.

**`-internet`-Suffix ist Backend-Endpunkt-Konvention (kein Namens-Mismatch):**

- Env-Variablen des Backends: `SERVICE_INTERNET_INPUT_FILE=services`,
  `REST_SERVICES_INTERNET_INPUT_FILE=rest-services`, `CONFIG_INPUT_FILE=config`.
- Das Backend liest `input/<instance>/services.json` und serviert es als
  `services-internet.json` (analog `rest-services-internet.json`). Darauf
  zeigt der nginx-Proxy des Frontends (`/resources/services-internet.json` →
  `${PORTAL_BACKEND}/${PORTAL_INSTANCE_NAME}/services-internet.json`).

**`instance_name`-Mechanik:**

- Das Frontend ruft `${PORTAL_BACKEND}/${PORTAL_INSTANCE_NAME}/…` auf; das
  Backend verwendet das URL-Pfadsegment als Instanznamen.
- Im S3-Betrieb liegt der Instanzordner im Bucket; im statischen Betrieb
  (Option A) muss er als `input/<instance_name>/` im Image liegen. Daher ist
  die Umbenennung `portal-config/default/` → `portal-config/<instance_name>/`
  Pflicht und case-sensitiv.
- Verifizierter Laufwert: `PORTAL_INSTANCE_NAME=Standard`.

**Env-Zuordnung Frontend 1:1 verifiziert:**

- `PROXY_3D_URL=https://geoportal.udp.data-dna.eu/proxy_3d_content`
- `PORTAL_BACKEND=https://geoportal.udp.data-dna.eu/portalBackend`
- `OIDC_AUTH`/`OIDC_TOKEN` unter `https://idm.udp.data-dna.eu/realms/cc-prd/…`
- `OIDC_CLIENT=geostack_public`, `OIDC_SCOPE=profile email openid`
- `OIDC_REDIRECT=https://geoportal.udp.data-dna.eu/masterportal/`
- `PORTAL_BASE_URL=https://geoportal.udp.data-dna.eu/`
- Frontend-Image: unverändertes Upstream-Image `geoportal:v1.7.0`
  (Platzhalter-Ersetzung zur Laufzeit durch `cmd.sh`).

**Backend-Env verifiziert:**

- `PORT=8101`, `LOG_LEVEL=DEBUG`, `TEST_MODE=FALSE`, `PUBLIC_ROLE=ds_open_data`
- `KEYCLOAK_HOST=https://idm.udp.data-dna.eu`, `KEYCLOAK_REALM=cc-prd`,
  `KEYCLOAK_CLIENT_ID=geostack`, `KEYCLOAK_PUBLIC_KEY=<Realm-Public-Key>`
- `INPUT_FILE_PATH=input`, `OUTPUT_FILE_PATH=output`,
  `INPUT_FILES_EXTENSION=.json`, `OUTPUT_FILES_EXTENSION=.json`

**Upstream-Quelle des `portal-backend`:**

- Die `package.json` im laufenden Pod verweist auf
  `gitlab.com/urban-dataspace-platform/use_cases/geodata/portal-backend`
  (v2.0.0, TypeScript, Start über `build/portal_backend.js`).
- Diese Quelle weicht ab von der URL im `.gitmodules` des
  `geoportal-components`-Repos (`civitas-connect/…/portal-backend.git`) und
  von der in `civitas-docs` genannten Quelle (`berlintxl/futr-hub/…`) — für
  den Soft-Fork ist die `urban-dataspace-platform`-Quelle maßgeblich.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben der statischen Masterportal-Konfiguration
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Ausgangslage, Zielarchitektur und offene Entscheidungen
- [V1s-Buildvariante und AddOn-Baseline](./v1s-buildvariante-und-addon-baseline) – getrennte Buildvariante und Kriterien für die restaurierbare AddOn-Test-Baseline
