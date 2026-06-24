---
title: Serveraufbau V2
description: Übersicht über die Spezifikation des Serveraufbaus für CIVITAS/CORE V2 (Beta). Phasenmodell, Komponenten und Abhängigkeiten für die helmfile-basierte Installation.
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-index
parent: civitas-core-plugin-index
dependencies:
  - civitas-core-plugin-serveraufbau-index
quality:
  completeness: 40
  accuracy: 70
  reviewed: false
  reviewer:
  reviewDate:
---

# Serveraufbau V2

Dieser Bereich spezifiziert den Serveraufbau für **CIVITAS/CORE V2 (Beta)** auf dem Proxmox-Knoten `civitas` im SOHO-Cluster. Die Spezifikation ersetzt die V1-Installation (cc\_cli, Ansible) durch ein helmfile-basiertes Deployment.

## Abgrenzung zu V1

| Aspekt | V1 | V2 |
|---|---|---|
| Deployment-Werkzeug | cc\_cli (Python, Ansible) | helmfile + Helm |
| Deployment-Repository | Im CIVITAS/CORE-Monorepo enthalten | Separates Repository: `civitas-core-deployment` |
| Konfiguration | cc\_cli\_inventory.yml (Ansible-Inventory) | `global.yaml.gotmpl` (Go-templated YAML) |
| Komponenten-Orchestrierung | Ansible-Playbooks | Helm-Charts (14 Komponenten) |
| Namespace-Strategie | Ein Namespace (`civitas-core`) | Single-Namespace (via `instanceSlug`) |
| Cluster-Voraussetzungen | k3s Single-Node, SQLite | k3s Single-Node, cert-manager, nginx-Ingress, StorageClass |
| Status | Funktionsfähig bis `cc_cli exec` | Neu zu spezifizieren und zu implementieren |

## Phasenübersicht

Das Installationsskript gliedert sich in drei Hauptphasen plus vorgelagerter VM-Provisionierung:

| Phase | Name | Ausführungskontext | Inhalt |
|---|---|---|---|
| -1 | VM-Provisionierung | Proxmox-Host | Debian-13-Cloud-Image, statische IP, SSH-Key, Cloud-Init |
| 0 | Preflight | VM | OS-Prüfung, Tools, DNS (weich), SMTP, Netzwerk |
| 1a | k3s-Cluster | VM | k3s ≥ 1.32, `--disable traefik`, kubeconfig |
| 1b | Add-ons | VM | cert-manager, selfsigned ClusterIssuer, nginx-Ingress, StorageClass |
| 2a | Deployment-Repo | VM | Repo klonen, Deployment-Verzeichnis anlegen, eigenes Git-Repo |
| 2b | Vorbedingungen Phase 2 | VM | DNS (hart), K8s-Secret `keycloak-smtp` anlegen |
| 2c | helmfile sync | VM | `global.yaml.gotmpl` rendern, `helmfile sync` ausführen |
| 2d | WireGuard | VM | Tunnel nach OPNsense aktivieren |
| 3 | Verifikation | VM | Pods, Ingress, Secrets, Abnahmekriterien |

## Enthaltene Spezifikationen

- [Zielbild](./zielbild.md) — Infrastrukturübersicht, Komponenten, Netzwerkarchitektur
- [Installationsphasen und Abnahme](./installationsphasen-und-abnahme.md) — Vollständiges Phasenmodell mit Abnahmekriterien
- [Deployment-Voraussetzungen](./deployment-voraussetzungen.md) — Cluster-Anforderungen, Tools, DNS, Secrets, Netzwerk
- [Helmfile-Konfiguration](./helmfile-konfiguration.md) — Konfigurationshierarchie, `global.yaml.gotmpl`, Caddy-TLS-Anpassungen
- [Netzwerk, DNS und TLS](./netzwerk-dns-tls.md) — Netzwerkarchitektur, WireGuard, Caddy, keine TLS-Terminierung in der VM
- [Skriptarchitektur](./skriptarchitektur.md) — Modulaufbau, Phasenkontrolle, Idempotenz-Strategie

## Quellen

- Offizielle V2-Dokumentation:
  - Prerequisites: <https://docs.core.civitasconnect.digital/docs_v2/next/Deployment/prerequisites/>
  - Configuration Guide: <https://docs.core.civitasconnect.digital/docs_v2/Deployment/configuration/>
  - Deployment Guide: <https://docs.core.civitasconnect.digital/docs_v2/Deployment/deployment/>
- Deployment-Repository: <https://gitlab.com/civitas-connect/civitas-core/civitas-core-v2/civitas-core-deployment.git>

## Lebenszyklus-Hinweis

CIVITAS/CORE V2 befindet sich zum Zeitpunkt der Spezifikation im Beta-Stadium. Die Spezifikation wir in dem Maße angepasst, in dem V2 als für p2d2 passend angesehen wird.

## Abhängigkeiten

- Die bestehende p2d2-Infrastruktur (Proxmox VE, OPNsense, Netzwerk) wird als gegeben vorausgesetzt.
- Die V1-Spezifikationen unter `serveraufbau-v1/` bleiben parallel gültig, bis die Migration auf V2 abgeschlossen ist.
- Änderungen an der bestehenden Infrastruktur werden in den jeweiligen Einzelseiten dokumentiert.

## Offene Punkte

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Linkerd Service Mesh (optional, aber empfohlen) | **Offen** – in V2-Doku empfohlen, aber nicht zwingend | Nach Implementierung evaluieren |
| Multi-Node-Betrieb | Nicht spezifiziert – Single-Node fokussiert | Produktiv-Phase |
| Multi-Namespace-Deployment | Von V2-Doku angekündigt, aber noch nicht unterstützt | V2-Release |
