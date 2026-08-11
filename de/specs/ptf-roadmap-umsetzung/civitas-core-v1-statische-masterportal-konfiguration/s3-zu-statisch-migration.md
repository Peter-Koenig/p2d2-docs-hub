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
2. `portal-config/default/` in `portal-config/<instance_name>/` umbenennen.
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
   setzen.
8. Umgebungsvariablen `PORTAL_BACKEND` (Service-URL des Backend-Pods) und
   `PORTAL_INSTANCE_NAME` (Wert aus Schritt 2) für das Frontend setzen.

**Offene Punkte vor Umsetzung:**

- Exakte Schreibweise/Konvention des `instance_name` (Groß-/Kleinschreibung)
  muss mit dem Portal-Backend-Routing übereinstimmen — noch nicht am
  Quellcode des Submodules `portal-backend` verifiziert.
- Service-Name/-URL des `portal_backend`-Pods im Zielnamespace erst nach
  einem `cc_cli exec`-Lauf bekannt.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben der statischen Masterportal-Konfiguration
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Ausgangslage, Zielarchitektur und offene Entscheidungen
- [Testverfahren mit Proxmox-Backup](./testverfahren-mit-proxmox-backup) – restaurierbare Test-Baseline und Abnahmeprozess
- [V1s-Buildvariante und AddOn-Baseline](./v1s-buildvariante-und-addon-baseline) – getrennte Buildvariante und Kriterien für die restaurierbare AddOn-Test-Baseline
