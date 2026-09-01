---
title: Skriptarchitektur V1s
description: Übersicht über die Installationsmodule und die Aufrufreihenfolge der CIVITAS/CORE-V1s-Buildvariante
status: draft
lastUpdated: 2026-09-01
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-v1s-skriptarchitektur
parent: civitas-core-plugin-serveraufbau-v1s-index
dependencies:
  - civitas-core-plugin-serveraufbau-v1s-index
quality:
  completeness: 60
  accuracy: 70
  reviewed: false
  reviewer:
  reviewDate:
---

# Skriptarchitektur V1s

Diese Seite beschreibt die Installationsmodule der V1s-Buildvariante und ihre Aufrufreihenfolge. Grundlage sind die V1-Module. V1s ergänzt den lokalen Portal-Backend-Image-Build und den Vorab-Install der Prometheus-Operator-CRDs.

## Modulübersicht

Die Module liegen in `civitas_einrichtung/modules_V1s/`:

| Modul | Verantwortlichkeit |
|---|---|
| `00_provision_vm.sh` | VM-Provisionierung auf Proxmox (Phase -1) |
| `01_config.sh` | Zentrale Konfigurationsvariablen |
| `02_lib.sh` | Hilfsfunktionen (Logging, Idempotenz-Prüfungen) |
| `03_preflight.sh` | Vorbedingungen prüfen (Phase 0) |
| `04_k3s.sh` | k3s-Cluster installieren (Phase 1a) |
| `05_addons.sh` | Add-ons: Helm, Gateway-API-CRDs, cert-manager, CA, Prometheus-Operator-CRDs, nginx-Ingress (Phase 1b) |
| `06_civitas.sh` | Orchestrierung: Repository, Overlay, cc_cli-Lifecycle (Phase 2) |
| `06a_network_certs.sh` | WireGuard und Zertifikatsverwaltung |
| `06b_idm_provisioning.sh` | Keycloak-Admin-User und Rollen-Provisionierung |
| `06c_image_build.sh` | Portal-Backend-Image lokal bauen und in containerd importieren (V1s-spezifisch) |
| `07_verify.sh` | Verifikation orchestrieren (Phase 3) |
| `07a_verify_phase1.sh` | Cluster- und Add-on-Prüfungen (k3s-Node, System-Pods, cert-manager, ClusterIssuer, nginx-Ingress, StorageClass) |
| `07b_verify_phase2.sh` | Plattformprüfungen (Namespaces, Pods, Ingress, TLS, Keycloak- und Portal-Erreichbarkeit, WireGuard) |
| `07c_verify_tests.sh` | E2E-Testsuite ausführen (optional, nur bei `RUN_TESTS=true`) |
| `07d_report.sh` | Fehlerreport und Exit-Code |
| `07_login_summary.sh` | Login-Zusammenfassung nach Installation |

## Aufrufreihenfolge

### Phase 1b: Add-ons (`install_addons()` in `05_addons.sh`)

| Schritt | Funktion | Hinweis |
|---|---|---|
| 1 | `install_helm` | Helm-CLI |
| 2 | `install_gateway_api_crds` | Gateway-API-CRDs |
| 3 | `install_cert_manager` | cert-manager |
| 4 | `configure_cluster_issuer` | zweistufiger CA-Issuer |
| 5 | `setup_ca_trust` | CA in System-Store und certifi |
| 6 | `install_cico_utils` | cico-shutdown und cico-uncordon |
| 7 | `install_prometheus_operator_crds` | V1s-neu: Prometheus-Operator-CRDs vorab |
| 8 | `install_nginx_ingress` | nginx-Ingress |
| 9 | `verify_storage_class` | Storage-Class-Prüfung |

### Phase 2: Plattform (`install_civitas()` in `06_civitas.sh`)

| Schritt | Funktion | Hinweis |
|---|---|---|
| 1 | `check_dns_hard` | DNS-Prüfung |
| 2 | `clone_civitas_repo` | Repository klonen |
| 3 | `build_geoportal_backend_image` | V1s-neu (Schritt 2.0b): Image-Build und containerd-Import |
| 4 | `apply_overlay` | Overlays aus `overlay_V1s/` einspielen |
| 5 | `patch_masterportal_release_name` | Release-Name patchen |
| 6 | `install_cc_cli` | cc_cli installieren |
| 7 | `render_inventory` | Inventory erzeugen |
| 8 | `setup_wireguard` | WireGuard einrichten |
| 9 | `patch_playbook_urls` | Playbook-URLs patchen |
| 10 | `cleanup_geodata_ingress` | Geodata-Ingress bereinigen |
| 11 | `run_cc_cli_validate` | cc_cli validate |
| 12 | `run_cc_cli_exec` | cc_cli exec |
| 13 | `wait_pods_ready` | Pods je Namespace abwarten |
| 14 | `resolve_target_state` | Zertifikats-Zielzustand bestimmen |
| 15 | `apply_target_state` | Zertifikate anwenden |
| 16 | `ensure_keycloak_admin_user` | Keycloak-Admin anlegen |
| 17 | `verify_certificates` | Zertifikate verifizieren |
| 18 | `configure_pgadmin_ca_trust` | pgAdmin-CA-Trust |

## Gefundene potenzielle Upstream-Bugs

Während des V1s-Testlaufs am 2026-08-31 wurden zwei Sachverhalte in den CIVITAS/CORE-Upstream-Komponenten sichtbar. Beide sind in V1s umgangen, im Upstream aber noch offen.

1. **ServiceMonitor-CRD-Abhängigkeit im APISIX-Helm-Chart:** Bei aktivem Monitoring rendert das APISIX-Helm-Chart `metrics.serviceMonitor.enabled: true` ohne Bedingung. Läuft der APISIX-Install vor dem Monitoring-Stack, fehlt die `ServiceMonitor`-CRD (`monitoring.coreos.com/v1`) und der Helm-Install schlägt fehl. V1s installiert die Prometheus-Operator-CRDs deshalb vorab in `05_addons.sh` (`install_prometheus_operator_crds()`, v0.89.0).

2. **QuantumLeap-Fixture-KeyError in der E2E-Testsuite:** Die session-scoped `config()`-Fixture in `e2e_tests/fixtures/fixtures_config.py` greift direkt mit `os.environ["QUANTUMLEAP_DB_PASSWORD"]` zu, ohne `.get()`. Fehlt die Variable, bricht die Fixture beim ersten Aufruf mit `KeyError` ab. Dadurch werden alle E2E-Tests in der Setup-Phase als Fehler markiert, nicht nur QuantumLeap-bezogene. V1s setzt in `generate_test_env()` (`07c_verify_tests.sh`) den Wert `QUANTUMLEAP_DB_PASSWORD=unused`. Der saubere Upstream-Fix wäre `os.environ.get("QUANTUMLEAP_DB_PASSWORD", "unused")`.
