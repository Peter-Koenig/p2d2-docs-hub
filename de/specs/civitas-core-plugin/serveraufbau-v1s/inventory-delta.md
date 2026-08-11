---
title: Inventory-Delta V1s
description: Änderungen am CIVITAS/CORE-Inventory für die V1s-Buildvariante (statische Masterportal-Konfiguration) gegenüber dem V1-Inventory
status: draft
lastUpdated: 2026-08-11
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
  enable: false   # V1: true → V1s: false
```

Die S3-/RustFS-Anbindung des Portal-Backends wird für die V1s-Instanz deaktiviert. Die Konfiguration wird statisch aus dem Portal-Backend-Image geliefert. Die zugehörigen S3-Felder (`endpoint`, `access_key_id`, `secret_access_key`, `bucket_name`, `region`, `force_path_style`) entfallen.

### `inv_gd.portal_backend.image_repository` / `image_tag`

```yaml
portal_backend:
  image_repository: "<lokales Image>"   # statt Upstream-Registry
  image_tag: "<lokaler Tag>"            # statt z. B. "v1.7.0"
```

Statt des Upstream-Registry-Images (`registry.gitlab.com/civitas-connect/civitas-core/civitas-core-v1/geoportal-components/geoportal_backend`) wird das lokal gebaute V1s-Image referenziert (siehe [Portal-Backend-Image-Build](./portal-backend-image-build.md)).

## Unverändert

### `inv_gd.gd_components[].instance_name`

```yaml
gd_components:
  - instance_name: "Standard"
```

Der Wert bleibt **`Standard`** — es ist keine Änderung erforderlich. Eine Umbenennung auf „Musterstadt" war zwischenzeitlich im Gespräch und wurde verworfen.