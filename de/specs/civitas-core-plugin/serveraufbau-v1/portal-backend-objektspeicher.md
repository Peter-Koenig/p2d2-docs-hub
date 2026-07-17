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
  completeness: 70
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
   `RUSTFS_SECRET_KEY` in `01_config.sh` als Pflicht-Env-Vars aufnehmen.

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
| `s3_backend`-Platzhalter in `inventory.yml.tpl` persistiert | Offen, verifiziert nur manuell in `cc_cli_inventory.yml` |
| E2E-Test fuer Portal-Backend-Startverhalten ohne S3-Fehler | Offen |