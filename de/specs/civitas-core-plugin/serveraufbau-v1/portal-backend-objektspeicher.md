---
title: Portal Backend Objektspeicher-Integration (RustFS)
description: S3-kompatible Backend-Anbindung fuer portal-backend ueber RustFS, inklusive Inventory-Erweiterung und Playbook-Verifikation.
status: draft
lastUpdated: 2026-07-17
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-portal-backend-objektspeicher
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-cc-cli-inventar
  - civitas-core-plugin-serveraufbau-installationsphasen-und-abnahme
quality:
  completeness: 80
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# Portal Backend Objektspeicher-Integration (RustFS)

## Ziel

Dieses Dokument spezifiziert die S3-kompatible Backend-Anbindung fuer
portal-backend ueber RustFS, inklusive Inventory-Erweiterung und
Playbook-Verifikation.

## Ausgangslage / Problem

Der Container portal-backend erwartete beim Start Dateien unter
/usr/src/app/input/Standard/*.json, die im Deployment nicht bereitgestellt
wurden. Symptom im Log:

```
[ERROR] Error: Could not read /usr/src/app/input/Standard/services.json
ENOENT: no such file or directory
```

## Komponentenwahl: RustFS statt Minio

Minio (`minio/minio`) wurde im April 2026 archiviert. RustFS wird als
S3-kompatibler Ersatz auf einer separaten LXC (IP 192.168.12.140)
betrieben, entkoppelt vom k3s-Cluster-Lebenszyklus.

## Inventory-Struktur: inv_gd.portal_backend.s3_backend

Der Block `inv_gd.portal_backend` wird um einen `s3_backend`-Unterblock
erweitert, analog zum Velero-Muster (`inv_op_stack.velero.backup`):

| Feld | Beschreibung | Beispielwert |
|---|---|---|
| enable | Aktiviert S3-Anbindung | true |
| endpoint | RustFS-Endpunkt | http://192.168.12.140:9000 |
| access_key_id | RustFS Access Key | Platzhalter, aus Env-Var |
| secret_access_key | RustFS Secret Key | Platzhalter, aus Env-Var |
| bucket_name | Bucket-Name | portal-config |
| region | S3-Region (frei waehlbar) | eu-north-1 |
| force_path_style | Path-Style statt Virtual-Hosted-Style | true |

Die zugehoerigen Container-Umgebungsvariablen (S3_ENABLED, S3_ENDPOINT,
S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, S3_BUCKET_NAME,
S3_FORCE_PATH_STYLE) werden im Deployment-Template
`tasks/geodata/install/portal_backend.yml` per Jinja2-Ausdruck aus diesem
Inventory-Pfad befuellt, mit `is defined`-Fallback auf leeren String.

## Bucket-Struktur

```
portal-config/
  Standard/
    config.json
    services.json
    rest-services.json
```

Der Prefix `Standard/` entspricht `gd_instance.instance_name` aus dem
Geodata-Inventory-Block.

## Persistierung in Template und Skript

1. `inventory.yml.tpl`: `s3_backend`-Block mit `PLACEHOLDER_RUSTFS_*`-Tokens
   ergaenzen.
2. `06_civitas.sh`, `render_inventory()`: sed-Ersetzungen fuer
   `PLACEHOLDER_RUSTFS_ENDPOINT`, `PLACEHOLDER_RUSTFS_ACCESS_KEY`,
   `PLACEHOLDER_RUSTFS_SECRET_KEY` ergaenzen.
3. Konfigurationsvariablen: `RUSTFS_ENDPOINT`, `RUSTFS_ACCESS_KEY`,
   `RUSTFS_SECRET_KEY` in `01_config.sh` als optionale Env-Vars mit Leerstring-Default aufnehmen (Velero-Analogie, siehe Abschnitt „Noch zu implementieren").

## Noch zu implementieren

Die folgenden vier Änderungen sind spezifiziert, aber noch nicht im
Code umgesetzt. Diese Tabelle ist der verbindliche Implementierungsplan
für den nächsten Coding-Schritt.

| # | Datei | Funktion/Stelle | Änderung |
|---|---|---|---|
| 1 | `tasks/geodata/install/portal_backend.yml` | Jinja2-Bedingung `if inv_gd.portal_backend.s3_backend.enable is defined` | Aktuell dauerhaft im else-Zweig (leere Strings), da s3_backend im Inventory nicht befüllt wird. Muss die neuen Inventory-Felder (`s3_backend.enable`, `endpoint`, `access_key_id`, `secret_access_key`, `bucket_name`, `region`, `force_path_style`) korrekt in die S3\_\*-Env-Vars des Deployments mappen. |
| 2 | `06_civitas.sh`, `render_inventory()` | sed-Ersetzungskette | Fehlende Zeilen für `PLACEHOLDER_S3_ENABLE`, `PLACEHOLDER_S3_ENDPOINT`, `PLACEHOLDER_S3_ACCESS_KEY`, `PLACEHOLDER_S3_SECRET_KEY`, `PLACEHOLDER_S3_BUCKET_NAME`, `PLACEHOLDER_S3_REGION`, `PLACEHOLDER_S3_FORCE_PATH_STYLE` ergänzen, analog zum bestehenden Muster für `PLACEHOLDER_GEOSERVER_PASSWORD`. |
| 3 | `01_config.sh` | Pflicht-Env-Var-Block | `RUSTFS_ENDPOINT`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY` als **optionale** Variablen mit Leerstring-Default ergänzen (analog zum Velero-Muster, siehe `cc-cli-inventar.md`). Wechsel von `:?` auf `:-` gemäß Ansatz A — siehe Begründung unten. |
| 4 | `06_civitas.sh`, `render_inventory()` | Bedingte Aktivierung | `s3_backend.enable` bleibt `false`, solange nicht alle drei Pflichtfelder (Endpoint, Access-Key, Secret-Key) als nicht-leere Env-Vars vorliegen — angelehnt an das Velero-Muster aus `cc-cli-inventar.md`. Anders als bei Velero haben RUSTFS_BUCKET_NAME und RUSTFS_REGION Komfort-Defaults (`portal-config`, `eu-north-1`) und sind daher nicht Teil der Aktivierungsprüfung. Prüfung erfolgt vor der sed-Ersetzung aus Punkt 2. |

### Begründung: Velero-Analogie aus cc-cli-inventar.md

Die Aktivierungslogik folgt exakt dem Velero-Muster aus dem Abschnitt
„Konsequenzen für das Installationsskript" der `cc-cli-inventar.md`:

> Im Template wird `velero.enable: false` als Default gesetzt. Das Feld
> wird nur auf `true` geändert, wenn alle fünf Velero-Felder als Env-Vars
> gesetzt und nicht leer sind.

Analog dazu werden `RUSTFS_ENDPOINT`, `RUSTFS_ACCESS_KEY`,
`RUSTFS_SECRET_KEY` nicht mit `:?` (Pflicht, Abbruch bei Fehlen),
sondern mit `:-` (optional, Leerstring-Default) deklariert. Damit kann
die 3-Felder-Prüfung in `render_inventory()` eigenständig über
`s3_backend.enable` entscheiden — angelehnt an das Velero-Muster.
Anders als bei Velero haben `RUSTFS_BUCKET_NAME` und `RUSTFS_REGION`
Komfort-Defaults (`portal-config`, `eu-north-1`) und sind daher
nicht Teil der Aktivierungsprüfung.

> **Warnung: Bekanntes Architekturproblem**
> `portal_backend.enable: true` (Default) in Kombination mit
> `s3_backend.enable: false` (weil RustFS-Felder nicht gesetzt) führt
> weiterhin zum ENOENT-Fehler beim Start des portal-backend-Containers.
> Dies ist ein separates, bekanntes Problem der aktuellen
> portal-backend-Architektur (erwartet zwingend S3-Konfiguration)
> und kein Fehler der Aktivierungslogik. Workaround: entweder
> `portal_backend.enable: false` setzen (Geo-Komponente deaktivieren)
> oder die drei Pflichtfelder (Endpoint, Access-Key, Secret-Key) setzen — Bucket-Name und Region nur anpassen, falls sie von den Defaults portal-config/eu-north-1 abweichen sollen

### Konkrete sed-Zeilen für Punkt 2

```bash
-e "s|PLACEHOLDER_S3_ENABLE|${RUSTFS_S3_ENABLE:-false}|g" \
-e "s|PLACEHOLDER_S3_ENDPOINT|${RUSTFS_ENDPOINT}|g" \
-e "s|PLACEHOLDER_S3_ACCESS_KEY|${RUSTFS_ACCESS_KEY}|g" \
-e "s|PLACEHOLDER_S3_SECRET_KEY|${RUSTFS_SECRET_KEY}|g" \
-e "s|PLACEHOLDER_S3_BUCKET_NAME|${RUSTFS_BUCKET_NAME:-portal-config}|g" \
-e "s|PLACEHOLDER_S3_REGION|${RUSTFS_REGION:-eu-north-1}|g" \
-e "s|PLACEHOLDER_S3_FORCE_PATH_STYLE|${RUSTFS_FORCE_PATH_STYLE:-true}|g" \
```

> **Hinweis Idempotenz:** `PLACEHOLDER_S3_ENABLE` hat den Default
> `${RUSTFS_S3_ENABLE:-false}` (nicht `true`). Die Aktivierung erfolgt
> ausschließlich durch die 3-Felder-Prüfung in Punkt 4, die den Wert
> auf `true` setzt, wenn alle drei Pflichtfelder belegt sind.
> `RUSTFS_BUCKET_NAME` und `RUSTFS_REGION` haben Komfort-Defaults und
> sind nicht Teil der Aktivierungsprüfung. Der Leerstring-Default
> der Einzelfelder (`:-`) verhindert ungewollte `PLACEHOLDER_`-Tokens
> im gerenderten Inventory.

### Reihenfolge der Umsetzung

1. **Punkt 3** (Config-Variablen in `01_config.sh`) — muss zuerst, da
   Punkt 4 auf den dort deklarierten Variablen aufbaut.
2. **Punkt 4** (Bedingungsprüfung in `render_inventory()`) — setzt
   `RUSTFS_S3_ENABLE` basierend auf der 3-Felder-Prüfung.
3. **Punkt 2** (sed-Ersetzung in `render_inventory()`) — letzter Schritt
   im Skript, setzt sowohl die Variablen aus Punkt 3 als auch die
   Aktivierungslogik aus Punkt 4 voraus.
4. **Punkt 1** (Playbook-Mapping `portal_backend.yml`) — unabhängig von den
   anderen Punkten, kann parallel zu Punkt 3 umgesetzt werden.

## Playbook-Ausfuehrung: kein granularer Tag

Es existiert kein eigenstaendiger `portal_backend`-Tag. Die Task-Datei
`tasks/geodata/install/portal_backend.yml` wird ausschliesslich ueber den
uebergeordneten Tag `geodata` eingebunden (`ansible-playbook --tags geodata`),
gemeinsam mit GeoServer und Masterportal.

**Wichtiger Hinweis:** Ein manueller Lauf mit `--tags geodata` reconciled
zusatzlich den Ingress-Task und alle Keycloak-Konfigurationsschritte. Fuer
einen isolierten Test nur des Portal-Backend-Deployments empfiehlt sich
`--start-at-task='Portal Backend: Create the deployment for portal backend'`.

## Verifikation

```bash
kubectl rollout status deployment/portal-backend -n cc-prd-geodata-stack
kubectl logs -n cc-prd-geodata-stack deployment/portal-backend --tail=30
kubectl get deployment portal-backend -n cc-prd-geodata-stack -o yaml | grep -A2 "S3_ENABLED|S3_ENDPOINT"
```

Erwartung: `[INFO] listening on 8101` ohne vorangehende ENOENT-Fehler;
`S3_ENABLED: "true"` im Deployment-Manifest.

## Bekannte Nebenwirkung (nicht Teil dieser Spec)

Ein `--tags geodata`-Lauf reconciled auch TLS-Ingress-Annotationen. Das
zugehoerige Verhalten (Issuer-Wechsel, Staging/Prod-State-Machine) ist in
`06a_network_certs.sh` (Funktionen `resolve_target_state`,
`apply_target_state`) verbindlich geregelt und wird in einer eigenen Spec
dokumentiert, nicht hier.

## Offene Punkte

| Punkt | Status |
|---|---|
| RustFS-Installation in Setup-Skript automatisieren (statt manuell) | Offen |
| `s3_backend`-Platzhalter in `inventory.yml.tpl` persistiert | Implementierungsplan spezifiziert (siehe Abschnitt „Noch zu implementieren"), Umsetzung im Code ausstehend |
| E2E-Test fuer Portal-Backend-Startverhalten ohne S3-Fehler | Offen |