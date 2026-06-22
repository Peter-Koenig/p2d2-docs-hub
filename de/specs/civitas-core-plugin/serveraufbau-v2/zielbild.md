---
title: Zielbild und Infrastrukturübersicht — CIVITAS/CORE V2
description: Infrastrukturübersicht, Netzwerkarchitektur und Komponenten des CIVITAS/CORE-V2-Serveraufbaus auf dem Proxmox-Knoten civitas
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-zielbild
parent: civitas-core-v2-serveraufbau-index
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Zielbild und Infrastrukturübersicht

Dieses Dokument beschreibt die Zielarchitektur des CIVITAS/CORE-V2-Serveraufbaus
auf dem Proxmox-Knoten `civitas` im SOHO-Cluster.

## Abgrenzung zu V1

CIVITAS/CORE V2 unterscheidet sich grundlegend von V1:

| Aspekt | CIVITAS/CORE V1 | CIVITAS/CORE V2 |
|---|---|---|
| Deployment-Werkzeug | cc_cli (Python, Ansible) | helmfile + Helm |
| Deployment-Quelle | Monorepo mit Ansible-Playbooks | Separates Deployment-Repository |
| Konfiguration | cc_cli_inventory.yml (Ansible-Inventory) | `global.yaml.gotmpl` + Umgebungs-Overrides |
| Komponenten-Management | Ansible-Rollen | 14 Helm-Charts via helmfile |
| Ingress-Standard | nginx (traefik deaktiviert) | nginx |
| Service Mesh | Keines | Linkerd (optional, offener Punkt) |
| Namespace-Strategie | Ein Namespace (civitas-core) | Single Namespace via `instanceSlug` |

> **Hinweis**: Die V1-Spezifikation bleibt unter `serveraufbau-v1/` erhalten und
> wird bis zur vollständigen Ablösung parallel gepflegt. Ein koordinierter
> Wechsel von V1 auf V2 ist Gegenstand einer separaten Migrationsplanung.

## Infrastrukturübersicht

Die gesamte CIVITAS/CORE-V2-Plattform wird in einer dedizierten virtuellen
Maschine (VM) auf dem Proxmox-Knoten `civitas` betrieben. Die VM ist nicht
direkt aus dem Internet erreichbar, sondern ausschließlich über die bestehende
OPNsense-Firewall mit Caddy als Reverse-Proxy:

```
Internet
    │
    ▼
OPNsense + Caddy (Reverse-Proxy, TLS-Terminierung)
    │
    │ WireGuard-Tunnel (10.10.10.0/24)
    ▼
CIVITAS/CORE-VM (192.168.12.x / 10.10.10.5)
    │
    ├── k3s (Single-Node, SQLite)
    │   ├── nginx-Ingress (Port 8080 HTTP, kein HTTPS)
    │   ├── cert-manager + selfsigned-ca ClusterIssuer
    │   └── Helmfile-Deployment (Namespace: <instanceSlug>)
    │
    └── WireGuard-Client (wg0)
```

### Netzwerk

| Komponente | IP / Adresse | Bemerkung |
|---|---|---|
| CIVITAS/CORE-VM (LAN) | 192.168.12.x (statisch) | SOHO-VLAN, kein direkter Internetzugriff |
| CIVITAS/CORE-VM (WireGuard) | 10.10.10.5/24 | Tunnel zu OPNsense |
| OPNsense (WireGuard) | 10.10.10.1 | Gegenstelle des Tunnels |
| DNS (öffentlich) | `idm.udp.data-dna.eu`, `portal.udp.data-dna.eu` | Zeigen auf OPNsense-IP |
| Caddy (OPNsense) | Port 443 → Weiterleitung an 10.10.10.5:8080 | TLS-Terminierung |

### TLS-Strategie

- **TLS endet an Caddy auf OPNsense**. Die VM selbst hat kein öffentliches
  HTTPS-Zertifikat.
- nginx-Ingress in der VM: `ssl-redirect: false` (kein HTTP→HTTPS-Redirect
  innerhalb der VM).
- cert-manager wird installiert, aber mit **`selfsigned-ca`** als ClusterIssuer
  (für interne Zertifikatszwecke). Kein `letsencrypt`-Issuer in der VM.
- Caddy bezieht sein TLS-Zertifikat per Let's Encrypt (bestehende Infrastruktur).

## Komponenten

CIVITAS/CORE V2 besteht aus 14 Komponenten, die via Helmfile orchestriert werden:

| Komponente | Zweck |
|---|---|
| `prepare` | Cluster-Vorbereitung (CRDs, Namespace-Labels) |
| `secrets` | Secret-Generierung für alle Komponenten |
| `postgres` | PostgreSQL-Datenbank (CloudNativePG-Operator) |
| `etcd` | ETCD-Key-Value-Store |
| `kafka` | Apache Kafka (Strimzi-Operator) |
| `keycloak` | Identity & Access Management |
| `apisix` | API-Gateway |
| `apicurio` | Schema Registry |
| `model-atlas` | EMF-Modellmanagement |
| `redpanda-connect` | Data-Streaming-Pipelines |
| `portal` | Web-UI und Backend-API |
| `config-adapters` | Konfigurationsmanagement |
| `opa` | Open Policy Agent |
| `authz-repo` | Autorisierungs-Repository |

Diese Komponenten werden als Helm-Charts über das zentrale Deployment-Repository
bezogen. Die Konfiguration erfolgt über Umgebungs-spezifische `global.yaml.gotmpl`-Dateien.

## Offene Punkte

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Linkerd Service Mesh | **Offen** – optional, aber empfohlen; Installation und Konfiguration ist noch nicht spezifiziert | Architekturentscheidung |
| Profil (development / production) | **Offen** – beeinflusst Ressourcen, Replicas und Logging-Level | Betriebsentscheidung |
| Multi-Node vs. Single-Node k3s | Vorerst Single-Node (wie V1) | Architekturentscheidung |

## Nichtziele

- Keine Migration bestehender V1-Installationen – V2 wird parallel aufgesetzt.
- Kein Multi-Node-Cluster in dieser Ausbaustufe.
- Kein öffentlicher Zugang zur VM ohne OPNsense/Caddy.
- Keine HTTPS-Terminierung innerhalb der VM.