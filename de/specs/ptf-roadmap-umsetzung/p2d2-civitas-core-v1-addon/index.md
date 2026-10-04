---
title: "p2d2 als CIVITAS/CORE-V1s-AddOn – Skript-Dokumentation"
description: Komponentenweise Dokumentation des p2d2-AddOn-Installationsskripts für CIVITAS/CORE V1s – Architektur, Skript-Ablauf, Voraussetzungen und die fünf Komponenten PostgreSQL, GeoServer, MapProxy, IAM und Frontend
quality:
  completeness: 80
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# p2d2 als CIVITAS/CORE-V1s-AddOn – Skript-Dokumentation

Diese Dokumentation beschreibt den **tatsächlichen Installationsprozess** des p2d2-AddOns auf einer bestehenden CIVITAS/CORE-**V1s**-Plattform. Sie ist an das Skript
`p2d2-civitas-addon-v1s.sh` (Repository `civitas_einrichtung`) gebunden und dokumentiert komponentenweise, was das Skript tut — nicht, was eine Soll-Spezifikation vorsieht.

## Zweck und Abgrenzung

Das AddOn erweitert eine bereits laufende CIVITAS/CORE-V1s-Installation **additiv** um die p2d2-Komponenten. Es ersetzt die Basisplattform nicht und verändert deren Kern
(Masterportal, GeoServer, zentrale PostgreSQL-Instanz) nicht implizit — es ergänzt sie (eigene Schemata, eigene Workspaces, eigener MapProxy-Pod, eigener Frontend-Pod je Stage).
CIVITAS/CORE V2 ist ein eigenständiges, späteres Vorhaben und nicht Gegenstand dieser Dokumentation.

## Architektur im Überblick

Fünf Komponenten, jeweils als eigenes Skript-Modul (`modules_addon_V1s/`):

| # | Modul | Funktion | Komponentenseite |
|---|---|---|---|
| 00 | `addon_00_postgresql.sh` | DB-Schemata + Rollen (central-db) | [01-postgresql](./01-postgresql) |
| 10 | `addon_10_geoserver.sh` | GeoServer-Workspaces, Datastores, GeoTIFF-Mosaic | [02-geoserver](./02-geoserver) |
| 20 | `addon_20_mapproxy.sh` | MapProxy-Pod + APISIX-Routing `/mapserver` | [03-mapproxy](./03-mapproxy) |
| 25 | `addon_25_iam.sh` | Keycloak-OIDC-Client, Rollen, OSM-IdP, Demo-Accounts | [04-iam](./04-iam) |
| 30 | `addon_30_frontend.sh` | Frontend: 5 Stage-Pods (Astro) + Ingress + Image-Build | [05-frontend-pods](./05-frontend-pods) |

Das Frontend läuft in **fünf Stages** (`main`, `dev`, `de1`, `de2`, `fv`), je eine eigenständige Pod-/Ingress-Kombination unter eigener Subdomain.

## Skript-Ablauf

### Installation

```
install_addon_postgresql   (00)
install_addon_geoserver    (10)
install_addon_mapproxy     (20)
install_addon_iam          (25)
install_addon_frontend_build (30, Image-Builds auf dem k3s-Node)
install_addon_frontend     (30, Secrets + Manifeste + Ingress)
```

### Rückbau (spiegelbildlich)

```
uninstall_addon_frontend   (30)
uninstall_addon_iam        (25)
uninstall_addon_mapproxy   (20)
uninstall_addon_geoserver  (10)
uninstall_addon_postgresql (00)
```

### Ausführungskontext

Das Hauptskript kennt zwei Kontexte über die Umgebungsvariable `ADDON_CONTEXT`:

- **`host` (Default):** Auf dem Proxmox-Host/der Workstation wird das Skript samt `modules_addon_V1s/`, `overlay_addon_V1s/`, `supplement/` und `.env.p2d2-addon` per `scp` auf die
  Ziel-VM (`VM_IP_STATIC`, Default `192.168.12.139`) kopiert und dort automatisch per SSH der Lauf angestoßen (vollautonomer Lauf, `run_in_vm_addon`).
- **`vm`:** Die Install-/Uninstall-Phasen werden direkt in der VM ausgeführt.

Aufruf:

```bash
./p2d2-civitas-addon-v1s.sh              # Installation
./p2d2-civitas-addon-v1s.sh --uninstall  # Rückbau
./p2d2-civitas-addon-v1s.sh --help       # Usage
ADDON_CONTEXT=vm ./p2d2-civitas-addon-v1s.sh   # VM-Kontext
```

Jedes Argument außer `--uninstall`, `--help`/`-h` bricht mit Fehlermeldung ab.

## Voraussetzungen (Ausgangslage)

1. **CIVITAS/CORE V1s** ist installiert und läuft (statisches Masterportal, k3s-Cluster, zentrale PostgreSQL-Instanz `central-db` im DB-Namespace, geteilte GeoServer-Instanz,
   Keycloak im Access-Namespace).
2. **Namespace** `cc-prd-geodata-stack` (`ADDON_NS`) existiert; der **Masterportal-Service** ist vorhanden (Fail-Fast-Prüfung `preflight_addon`).
3. **`.env.p2d2-addon`** (im Elternverzeichnis des Skriptverzeichnisses) ist die **einzige Quelle** für mandantenabhängige Werte (Domains, Passwörter, OIDC-/OSM-IdP-Credentials,
   Git-Tokens je Stage). Pflichtvariablen siehe unten.
4. Optional: **`supplement/geotiffs/<stadt>/`** mit GeoTIFFs für die GeoServer-Mosaic-Anlage.

### Pflichtvariablen in `.env.p2d2-addon` (Auszug, `_preflight_env`)

- Basis: `P2D2_BASE_ALTCHA_HMAC_KEY`, `P2D2_BASE_SMTP_PASS`, `P2D2_BASE_OIDC_ISSUER`, `P2D2_DEMO_PASSWORD`, `P2D2_OSM_IDP_CLIENT_ID`, `P2D2_OSM_IDP_CLIENT_SECRET`,
  `P2D2_GITHUB_TOKEN`, `P2D2_GITLAB_TOKEN`.
- Je Stage (`MAIN`, `DEVELOP`, `DE1`, `DE2`, `FV`): `P2D2_<KEY>_DB_PASSWORD`, `P2D2_<KEY>_WFST_PASSWORD`, `P2D2_<KEY>_SESSION_SECRET`.

Die OIDC-Client-Daten (`P2D2_BASE_OIDC_CLIENT_ID`/`_SECRET`) sind bewusst **keine** Pflicht — sie werden vom IAM-Modul erzeugt.

## Zielergebnis

Nach erfolgreicher Installation entstehen im GeoData-Namespace: fünf Frontend-Pods (`p2d2-main`, `p2d2-dev`, `p2d2-f-de1`, `p2d2-f-de2`, `p2d2-f-fv`) mit Ingress und
TLS, ein MapProxy-Pod (`mapproxy`) mit APISIX-Route `/mapserver`, GeoServer-Workspaces je Stage plus GeoTIFF-Mosaic, PostgreSQL-Schemata/Rollen je Stage und eine
Keycloak-OIDC-/OSM-IdP-/Demo-Account-Konfiguration. Der Rückbau entfernt all dies rückstandsfrei (verifiziert).

## Unterseiten

- [01 – PostgreSQL](./01-postgresql)
- [02 – GeoServer](./02-geoserver)
- [03 – MapProxy](./03-mapproxy)
- [04 – IAM (Keycloak)](./04-iam)
- [05 – Frontend-Pods (5 Stages)](./05-frontend-pods)
- [06 – Standalone/Plugin-Parallelbetrieb](./06-standalone-plugin-parallelbetrieb) (Platzhalter)
