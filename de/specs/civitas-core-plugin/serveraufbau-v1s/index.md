---
title: Serveraufbau V1s
description: Übersicht über die Spezifikation des Serveraufbaus für die CIVITAS/CORE-V1s-Buildvariante (V1 mit statischer statt S3-basierter Masterportal-Konfiguration)
status: draft
lastUpdated: 2026-08-11
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-v1s-index
parent: civitas-core-plugin-index
dependencies:
  - civitas-core-plugin-serveraufbau-index
quality:
  completeness: 30
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Serveraufbau V1s

Dieser Bereich spezifiziert den Serveraufbau für die **V1s-Buildvariante**: CIVITAS/CORE V1 mit **statischer statt S3-basierter Masterportal-Konfiguration**. Die Masterportal-Konfiguration wird dabei nicht mehr zur Laufzeit aus RustFS/S3 geladen, sondern als versioniertes Artefakt direkt in das Portal-Backend-Image gebaut.

Grundlage ist das Vorhaben [CIVITAS/CORE V1: Statische Masterportal-Konfiguration](../../ptf-roadmap-umsetzung/civitas-core-v1-statische-masterportal-konfiguration/). Die vorliegende Spezifikation leitet sich weitgehend aus dem bestehenden [Serveraufbau V1](../serveraufbau-v1/) ab und beschreibt ausschließlich die Abweichungen.

## Unverändert gegenüber V1

Die folgenden Bereiche des V1-Serveraufbaus gelten für V1s unverändert:

| Bereich | Verweis | Hinweis |
|---|---|---|
| VM-Sizing und Host-Ressourcen | [VM-Sizing und Host-Ressourcen](../serveraufbau-v1/vm-sizing-und-host-ressourcen.md) | keine Änderung für V1s |
| Netzwerk, DNS und TLS | [Netzwerk, DNS und TLS](../serveraufbau-v1/netzwerk-dns-tls.md) | keine Änderung für V1s |
| Kubernetes-Laufzeit (k3s) | [Kubernetes-Laufzeit](../serveraufbau-v1/kubernetes-laufzeit.md) | keine Änderung für V1s |
| IDM-Provisionierung und Login | [IDM-Provisionierung und Login](../serveraufbau-v1/idm-provisionierung-und-login.md) | keine Änderung für V1s |
| E2E-Testumgebung | [E2E-Testumgebung](../serveraufbau-v1/e2e-testumgebung.md) | keine Änderung für V1s |

## Geändert gegenüber V1

Gegenüber dem V1-Serveraufbau ändern sich zwei Aspekte, die in eigenen Unterseiten spezifiziert sind:

- [Portal-Backend-Image-Build](./portal-backend-image-build.md) — lokaler Soft-Fork-Build des `geoportal_backend`-Images mit statisch eingebauter Masterportal-Konfiguration
- [Inventory-Delta](./inventory-delta.md) — die gegenüber dem V1-Inventory geänderten Felder

## Weitere Abweichungen gegenüber V1

Über die beiden oben genannten Aspekte hinaus unterscheidet sich V1s in drei Punkten, die im erfolgreichen Testlauf vom 2026-08-31 sichtbar wurden:

- **Monitoring:** Monitoring ist in beiden Varianten aktiv. In V1s installiert `05_addons.sh` zusätzlich die Prometheus-Operator-CRDs vorab (`install_prometheus_operator_crds()`, Version v0.89.0). Grund: Das Live-Playbook führt das Monitoring-Play nicht zuverlässig vor der APISIX-Installation aus. APISIX rendert `metrics.serviceMonitor.enabled: true` bedingungslos und benötigt daher die `ServiceMonitor`-CRD bereits vor dem APISIX-Helm-Install.
- **`inv_access.apis.import`:** V1s setzt den Wert explizit auf `true`. Das ist nötig für die Apisix-Routen der Geodata-Kernkomponenten, insbesondere `portalBackend`. Die `cc_cli validate`-Regel „Prometheus und Loki aktivieren, wenn APIs importiert werden“ wird über den zweiten ODER-Zweig erfüllt, weil das Monitoring aktiv ist.
- **Containerd-Namespace:** Der lokale Image-Import nutzt `k3s ctr -n k8s.io images import -`. Ohne `-n k8s.io` läge das Image im Containerd-Namespace `default` und wäre für kubelet unsichtbar. Der Punkt ist V1s-spezifisch, weil V1 keinen lokalen Image-Build kennt.

Der lokale Image-Build selbst ist in [Portal-Backend-Image-Build](./portal-backend-image-build.md) beschrieben und hier nicht erneut ausgeführt.

## Explizit nicht Gegenstand

- **Frontend-Image-Rebuild**: Das Masterportal-Frontend bleibt das unveränderte Original-Upstream-Image (`geoportal`). Seine Konfiguration wird weiterhin zur Laufzeit über Umgebungsvariablen parametrisiert; ein Rebuild ist für V1s nicht erforderlich.
- **RustFS-Deinstallation**: RustFS/S3 bleibt als Dienst der Plattform bestehen. Für die V1s-Instanz wird die S3-Anbindung lediglich deaktiviert; eine Deinstallation des Dienstes ist ausdrücklich nicht Gegenstand dieser Spezifikation.