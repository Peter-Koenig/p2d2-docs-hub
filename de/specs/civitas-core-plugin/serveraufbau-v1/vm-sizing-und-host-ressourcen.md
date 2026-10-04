---
title: VM-Sizing und Host-Ressourcen für CIVITAS/CORE
description: Gegenüberstellung der offiziellen CIVITAS/CORE-Systemanforderungen mit den Ressourcen der beiden Proxmox-Knoten civitas und Hetzner sowie Ableitung konkreter VM-Parameter.
status: draft
lastUpdated: 2026-10-04
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

CIVITAS/CORE wird auf zwei Proxmox-Knoten betrieben. Im SOHO-Profil läuft die
Plattform auf dem lokalen Knoten `civitas`, der nicht öffentlich erreichbar
ist. Im Hetzner-Profil läuft sie auf einem öffentlich erreichbaren
Hetzner-Server. Belegt ist: Die VM ist installiert,
`https://udp.<basisdomain>/` liefert HTTP 200 mit einem Let's-Encrypt-Zertifikat,
SSH über Port 8022 funktioniert. Die Betriebsarten sind in
[Netzwerk-Topologie](../netzwerk-topologie/index.md) beschrieben.

## Verfügbare Hardware

| Komponente | civitas | Hetzner-Server |
|---|---|---|
| CPU | AMD Ryzen 7 H 255, 8 Kerne / 16 Threads | AMD Ryzen 5 3600, 6 Kerne / 12 Threads |
| RAM physisch | 64 GiB | 64 GB laut Anbieter, 62 GiB sichtbar |
| RAM verfügbar | ~56 GiB (Proxmox-Host belegt ~3,7 GiB) | entfällt |
| Storage raw | 2 × 476 GiB NVMe | 2 × 476,9 GiB NVMe als RAID1 |
| Storage-Pool für die VM | zfspool, rpool (~455 GiB verfügbar) | lvmthin, 390 GiB |
| Swap | keiner konfiguriert | 6 GiB als logisches Volume |

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

Für den Hetzner-Server:

| Ressource | CIVITAS/CORE Sandbox-Minimum | Verfügbar auf Hetzner-Server | Verfügbar für VM | Bewertung |
|---|---|---|---|---|
| vCPU | 8-10 | 12 Threads | 10 (2 Reserve Host) | ausreichend |
| RAM | 32 GiB | 62 GiB sichtbar | 40 GiB (22 GiB Reserve) | ausreichend |
| Storage | 600 GiB | 390 GiB Thin-Pool | 300 GiB (lvmthin) | unter Empfehlung |
| Swap | empfohlen | 6 GiB auf dem Host | vorhanden | erfüllt |

## Empfohlenes VM-Sizing (erste Ausbaustufe)

| Parameter | civitas | Hetzner-Profil | Begründung |
|---|---|---|---|
| vCPU | 12 | 10 | 12 von 16 Threads bzw. 10 von 12 Threads; Reserve für den Host |
| RAM | 40 GiB | 40 GiB | rund 70 % des verfügbaren RAM; Reserve für den Host |
| Disk | 300 GiB (ZFS thin-provisioned) | 300 GiB (LVM-thin, `raw`) | deckt Sandbox-Anforderungen; liegt unter der Empfehlung von 600 GiB |
| Gastbetriebssystem | offen (→ Folgespezifikation Kubernetes-Laufzeit) | offen | Debian 12 oder Ubuntu 24.04 empfohlen |
| Netzwerk | internes VLAN im SOHO-Cluster | `vmbr1` als isoliertes Netz mit NAT durch den Knoten (siehe [Fall 2](../netzwerk-topologie/fall-2-direkt-im-netz.md)) | kein öffentlicher Zugang (civitas) bzw. öffentlich erreichbar (Hetzner) |

Die VM-Parameter (CPU, RAM, Disk, Bridge, Storage) sind per `.env`
überschreibbar (`VM_CORES`, `VM_BRIDGE`, `PROXMOX_STORAGE`, …).
`PROXMOX_STORAGE` unterstützt `zfspool` und `lvmthin`. Andere Typen (auch
Verzeichnis-/NFS-Storage) werden vor jeder Änderung abgelehnt.
Details in `umgebungsvariablen-env-datei.md`.

`VM_CORES` zählt vCPUs (Threads), nicht physische Kerne. Auf einem Host mit
SMT (6 Kerne / 12 Threads) wird im Hetzner-Profil `VM_CORES=10` gesetzt, um
zwei Threads für den Host zu belassen.

## Risiken und Einschränkungen

### civitas

- **Kein Swap:** Kubernetes empfiehlt zwar deaktivierten Swap, der
  Proxmox-Host selbst hat keinen Swap konfiguriert. Bei RAM-Druck des
  Hosts gibt es keinen Puffer - Risiko bei parallelen VMs.
- **Storage knapp:** 300 GiB decken das Sandbox-Minimum, liegen aber
  unter der Empfehlung von 600 GiB. Persistente Volumes, Snapshots und
  Log-Wachstum können schnell zu Engpässen führen.
- **ZFS-Mirror (rpool):** Beide NVMe-Platten sind als ZFS-Mirror
  konfiguriert. Einzelplatten-Ausfall ist tolerierbar.
- **Single-Node, kein HA:** Jeder Ausfall des Knotens ist gleichzeitig
  Ausfall der gesamten Plattform. Kein automatisches Failover möglich.
  Knoten ist in Backup über Proxmox eingebunden und wird täglich gesichert.

### Hetzner-Server

- Es ist ein einzelner Server ohne Failover.
- Die beiden NVMe sind per mdadm als RAID1 gespiegelt. Ein Plattenausfall
  ist damit abgedeckt.
- Der Swap liegt auf dem Host.
- Das Profil setzt `PBS_STORAGE` leer, die Backup-Prüfung wird übersprungen.

## Offene Punkte (→ Folgespezifikationen)

- Gastbetriebssystem und Kubernetes-Distribution (→ kubernetes-laufzeit.md)
- DNS-Setup für idm.&lt;domain&gt; und portal.&lt;domain&gt; (→ netzwerk-dns-tls.md)
- Backup-Strategie für VM und persistente Volumes (→ persistenz-storage-backup.md)
- Swap-Entscheidung auf Proxmox-Host-Ebene