---
title: VM-Sizing und Host-Ressourcen für das CIVITAS/CORE-Plugin
description: Ressourcenbedarf, Reservierung und Skalierung der Gast-VM für das CIVITAS/CORE-Plugin
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-vm-sizing
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# VM-Sizing und Host-Ressourcen

Dieses Dokument beschreibt die verfügbaren Host-Ressourcen des Proxmox-Servers, leitet den Ressourcenbedarf für die CIVITAS/CORE-Plugin-VM ab und definiert Reserven für den Regelbetrieb.

## Verfügbare Host-Ressourcen

Der Proxmox-Host (Intel 13th Gen, 14 Cores, 64 GB RAM) betreibt derzeit folgende Komponenten:

| Komponente | RAM | vCPUs | Disk |
|------------|-----|-------|------|
| OPNSense (VM) | 4 GB | 2 | 25 GB |
| PostgreSQL (LXC) | 2 GB | 2 | 15 GB |
| GeoServer (LXC) | 6 GB | 4 | 12 GB |
| MapProxy (LXC) | 4 GB | 2 | 38 GB |
| OSM-Tiler (VM) | 6 GB | 4 | 65 GB |
| Frontend (LXC) | 4 GB | 2 | 25 GB |
| Ory IAM (LXC, geplant) | 2 GB | 1 | 10 GB |
| **Summe alloziert** | **28 GB** | **17 vCPUs** | **190 GB** |
| **Host gesamt** | **64 GB** | **14 C/28 T** | **~500 GB SSD** |

## Ressourcenbedarf für die Plugin-VM

### Mindestbedarf (Proof-of-Concept)

- RAM: 4 GB
- vCPUs: 2
- Disk: 20 GB (SSD)

### Startkonfiguration (erster produktiver Einsatz)

- RAM: 8 GB
- vCPUs: 4
- Disk: 40 GB (SSD)

### Skalierungsperspektive

- RAM: bis zu 16 GB
- vCPUs: bis zu 6
- Disk: bis zu 100 GB (SSD)

Die Skalierung erfolgt durch Anpassung der VM-Ressourcen im laufenden Betrieb (hotplug, sofern von der Kubernetes-Distribution unterstützt) oder durch kurze geplante Auszeiten.

## Reserven

Nach Allokation der Startkonfiguration (8 GB RAM, 4 vCPUs, 40 GB Disk) verbleiben auf dem Host:

- **RAM**: 64 GB − 28 GB (bestehend) − 8 GB (Plugin) = **28 GB Reserve**
- **vCPUs**: 28 Threads − 17 alloziert − 4 (Plugin) = **7 Threads Reserve**
- **Disk**: ~500 GB − 190 GB (bestehend) − 40 GB (Plugin) = **~270 GB Reserve**

Die Reserven sind ausreichend für den geplanten Betrieb. Eine Host-Erweiterung ist nicht erforderlich.

## Risiken

- Der OSM-Tiler kann bei hoher Auslastung kurzfristig mehr RAM benötigen. Dies ist durch die vorhandene Reserve abgedeckt.
- Falls CIVITAS/CORE zusätzliche Komponenten (Datenbank, Message-Queue) in der VM erfordert, kann der Speicherbedarf über die Startkonfiguration hinausgehen.
