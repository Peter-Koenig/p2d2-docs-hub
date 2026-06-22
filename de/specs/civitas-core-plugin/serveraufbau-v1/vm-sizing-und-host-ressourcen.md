---
title: VM-Sizing und Host-Ressourcen für CIVITAS/CORE
description: Gegenüberstellung der offiziellen CIVITAS/CORE-Systemanforderungen mit den verfügbaren Ressourcen des Proxmox-Knotens civitas sowie Ableitung konkreter VM-Parameter.
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-vm-sizing
parent: civitas-core-plugin-serveraufbau
dependencies:
  - civitas-core-plugin-serveraufbau-zielbild
quality:
  completeness: 70
  accuracy: 75
  reviewed: false
  reviewer:
  reviewDate:
---

# VM-Sizing und Host-Ressourcen für CIVITAS/CORE

## Zielplattform

CIVITAS/CORE wird auf einem dedizierten lokalen Proxmox-Knoten ("civitas")
betrieben. Der Knoten steht exklusiv für diesen Zweck zur Verfügung und ist
nicht öffentlich erreichbar.

## Verfügbare Hardware (Proxmox-Knoten "civitas")

| Komponente | Wert |
|---|---|
| CPU | AMD Ryzen 7 H 255, 8 Kerne / 16 Threads  |
| RAM physisch | 64 GiB |
| RAM verfügbar | ~56 GiB (Proxmox-Host belegt ~3,7 GiB) |
| Storage raw | 2 × 476 GiB NVMe |
| ZFS-Pool rpool | ~455 GiB verfügbar  |
| Swap | keiner konfiguriert |

## Systemanforderungen CIVITAS/CORE

### V2 (aktuell)
Quelle: https://docs.core.civitasconnect.digital/docs_v2/next/Deployment/prerequisites/

| Anforderung | Minimum | Empfohlen |
|---|---|---|
| Kubernetes | ≥ 1.32, x86_64 | — |
| vCPU | 4 | 8+ |
| RAM | 16 GiB | 32+ GiB |
| Storage Class | RWO (ReadWriteOnce) | — |
| Ingress Controller | nginx oder traefik | — |
| cert-manager | mit Cluster Issuer | — |
| DNS | idm.&lt;domain&gt;, portal.&lt;domain&gt; | — |
| SMTP | zwingend für Keycloak | — |

### V1.5 (Sizing-Referenz für Einzel-Node-Betrieb)
Quelle: https://docs.core.civitasconnect.digital/docs/1.5.0/Deployment/Deployment-Requirements/

| Szenario | vCPU | RAM | Storage |
|---|---|---|---|
| Sandbox (1 Node) | 8–10 | 32 GiB | 600 GiB SSD |
| Minimum (3 Nodes) | 8–10 je Node | 32 GiB je Node | 300 GiB je Node |
| Standard (3 Nodes) | 12 je Node | 64 GiB je Node | 300 GiB je Node |

Für den vorliegenden Einzel-Node-Betrieb gilt das Sandbox-Szenario als
maßgebliche Referenz.

## Ressourcenzuordnung nach Komponente

Die folgenden Angaben orientieren sich an den tatsächlichen
Laufzeitanforderungen der CIVITAS/CORE-Komponenten laut Deployment-Doku:

| Komponente | Ressourcenbedarf | Begründung |
|---|---|---|
| Keycloak (idm) | 2–4 GiB RAM, 1–2 vCPU | Identity-Management, SMTP-Anbindung, Startup-intensiv |
| CIVITAS Portal | 2–4 GiB RAM, 1–2 vCPU | Frontend-Serving, Ingress-Endpunkt |
| Kubernetes Control Plane (k3s/k0s) | 1–2 GiB RAM, 1 vCPU | Overhead für Single-Node-Cluster |
| Datenbank-Backend (PostgreSQL o.ä.) | 4–8 GiB RAM, 2 vCPU | Persistenz, je nach Datenlast |
| Weiterer Plattform-Overhead | 4–8 GiB RAM, 2 vCPU | Operator, Cert-Manager, Ingress, Monitoring |
| Reserve / Burst | 4 GiB RAM, 2 vCPU | Peaks, Updates, Neustarts |
| **Summe VM** | **~20–30 GiB RAM, 10–12 vCPU** | Arbeitswert für initiales Sizing |

## Abgleich: Anforderungen vs. verfügbare Ressourcen

| Ressource | CIVITAS/CORE Sandbox-Minimum | Verfügbar auf civitas | Verfügbar für VM | Bewertung |
|---|---|---|---|---|
| vCPU | 8–10 | 16 Threads | 12 (4 Reserve Host) | ausreichend |
| RAM | 32 GiB | 56 GiB verfügbar | 40 GiB (16 GiB Reserve) | ausreichend |
| Storage | 600 GiB | 455 GiB frei in rpool | 300 GiB ZFS-Volume | knapp – Begründung unten |
| Swap | empfohlen | nicht konfiguriert | — | Risiko |

## Empfohlenes VM-Sizing (erste Ausbaustufe)

| Parameter | Wert | Begründung |
|---|---|---|
| vCPU | 12 | 75 % der verfügbaren Threads; 4 verbleiben für Proxmox-Host |
| RAM | 40 GiB | entspricht ~70 % des verfügbaren RAM; 16 GiB Reserve für Host |
| Disk | 300 GiB (ZFS thin-provisioned) | deckt Sandbox-Anforderungen; rpool-Reserve bleibt erhalten |
| Gastbetriebssystem | offen (→ Folgespezifikation Kubernetes-Laufzeit) | Debian 12 oder Ubuntu 24.04 empfohlen |
| Netzwerk | internes VLAN im SOHO-Cluster | kein öffentlicher Zugang |

## Risiken und Einschränkungen

- **Kein Swap:** Kubernetes empfiehlt zwar deaktivierten Swap, der
  Proxmox-Host selbst hat keinen Swap konfiguriert. Bei RAM-Druck des
  Hosts gibt es keinen Puffer — Risiko bei parallelen VMs.
- **Storage knapp:** 300 GiB decken das Sandbox-Minimum, liegen aber
  unter der Empfehlung von 600 GiB. Persistente Volumes, Snapshots und
  Log-Wachstum können schnell zu Engpässen führen.
- **ZFS-Mirror (rpool):** Beide NVMe-Platten sind als ZFS-Mirror
  konfiguriert. Einzelplatten-Ausfall ist tolerierbar.
- **Single-Node, kein HA:** Jeder Ausfall des Knotens ist gleichzeitig
  Ausfall der gesamten Plattform. Kein automatisches Failover möglich.
  Knoten ist in Backup über Proxmox eingebunden und wird täglich gesichert 

## Offene Punkte (→ Folgespezifikationen)

- Gastbetriebssystem und Kubernetes-Distribution (→ kubernetes-laufzeit.md)
- DNS-Setup für idm.&lt;domain&gt; und portal.&lt;domain&gt; (→ netzwerk-dns-tls.md)
- Backup-Strategie für VM und persistente Volumes (→ persistenz-storage-backup.md)
- Swap-Entscheidung auf Proxmox-Host-Ebene