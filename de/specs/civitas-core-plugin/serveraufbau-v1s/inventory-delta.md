---
title: Inventory-Delta V1s
description: Änderungen am CIVITAS/CORE-Inventory für die V1s-Buildvariante (statische Masterportal-Konfiguration) gegenüber dem V1-Inventory
status: draft
lastUpdated: 2026-09-01
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-v1s-inventory-delta
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

# Inventory-Delta (V1s)

Diese Seite dokumentiert ausschließlich die Felder, die sich gegenüber dem V1-Inventory ändern. Das V1-Inventory ist unter [cc-cli-Inventar](../serveraufbau-v1/cc-cli-inventar.md) spezifiziert.

## Geänderte Felder

### `inv_gd.portal_backend.s3_backend.enable`

```yaml
s3_backend:
  enable: false                 # V1: true → V1s: false
  endpoint: "unused"            # Schema-Pflichtfeld, funktional ungenutzt
  access_key_id: "unused"       # Schema-Pflichtfeld, funktional ungenutzt
  secret_access_key: "unused"   # Schema-Pflichtfeld, funktional ungenutzt
  bucket_name: "unused"         # Schema-Pflichtfeld, funktional ungenutzt
```

Die S3-/RustFS-Anbindung des Portal-Backends wird für die V1s-Instanz deaktiviert. Die Konfiguration wird statisch aus dem Portal-Backend-Image geliefert. Die Pflichtfelder des `s3_backend`-Objekts (`endpoint`, `access_key_id`, `secret_access_key`, `bucket_name`) bleiben aus Schema-Gründen mit festen Platzhalterwerten (`"unused"`) vorhanden, obwohl sie bei `enable: false` funktional ungenutzt bleiben. Die optionalen Felder `region` und `force_path_style` entfallen.

### `inv_gd.portal_backend.image_repository` / `image_tag`

```yaml
portal_backend:
  image_repository: "<lokales Image>"   # statt Upstream-Registry
  image_tag: "<lokaler Tag>"            # statt z. B. "v1.7.0"
```

Statt des Upstream-Registry-Images (`registry.gitlab.com/civitas-connect/civitas-core/civitas-core-v1/geoportal-components/geoportal_backend`) wird das lokal gebaute V1s-Image referenziert (siehe [Portal-Backend-Image-Build](./portal-backend-image-build.md)).

### `inv_access.apis.import`

```yaml
inv_access:
  apis:
    import: true              # V1s: true; im V1-Template nicht gesetzt
```

V1s setzt `inv_access.apis.import` explizit auf `true`. Das reaktiviert die Apisix-Routen-Erzeugung für die Geodata-Kernkomponenten, insbesondere `portalBackend`. Im V1-Template ist der Block `inv_access.apis` nicht vorhanden. Die `cc_cli validate`-Regel „Prometheus und Loki aktivieren, wenn APIs importiert werden“ wird über den zweiten ODER-Zweig erfüllt, weil das Monitoring aktiv ist.

### `inv_op_stack.monitoring.alertmanager.enable` / `inv_op_stack.monitoring.alloy.enable`

```yaml
monitoring:
  enable: true
  prometheus:
    enable: true
  grafana:
    enable: true
  alertmanager:
    enable: false            # V1: true → V1s: false
  loki:
    enable: true
  alloy:
    enable: false            # V1: true → V1s: false
```

Das Monitoring ist in beiden Varianten aktiv. V1s deaktiviert `alertmanager` und `alloy`, die in V1 jeweils `true` sind. Die übrigen Monitoring-Flags bleiben unverändert (siehe „Unverändert“).

## Unverändert

### `inv_gd.gd_components[].instance_name`

```yaml
gd_components:
  - instance_name: "Standard"
```

Der Wert bleibt **`Standard`** — es ist keine Änderung erforderlich. Eine Umbenennung auf „Musterstadt“ war zwischenzeitlich im Gespräch und wurde verworfen.

### `inv_op_stack.monitoring.enable`, `.prometheus.enable`, `.grafana.enable`, `.loki.enable`

```yaml
monitoring:
  enable: true
  prometheus:
    enable: true
  grafana:
    enable: true
  loki:
    enable: true
```

Diese vier Felder sind in V1 und V1s identisch `true`. `grafana.enable: true` betrifft das Monitoring-Grafana im `inv_op_stack`. Das Dashboard-Grafana unter `inv_da.grafana.enable` ist davon getrennt und bleibt in beiden Varianten `false`.