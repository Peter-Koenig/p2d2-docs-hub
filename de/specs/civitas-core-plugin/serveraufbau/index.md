---
title: Serveraufbau für das CIVITAS/CORE-Plugin
description: Übersicht über die Spezifikation des Serveraufbaus für das CIVITAS/CORE-Plugin
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-index
parent: civitas-core-plugin-index
dependencies: []
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Serveraufbau für das CIVITAS/CORE-Plugin

Dieser Bereich spezifiziert den Serveraufbau, der für den Betrieb des CIVITAS/CORE-Plugins erforderlich ist. Die hier dokumentierten Anforderungen und Entscheidungen bilden die Grundlage für die spätere Erstellung von Installationsskripten und Infrastructure-as-Code-Vorlagen.

## Vorgesehene Unterseiten

- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung.md) — Geltungsbereich, Nichtziele, offene Entscheidungen
- [VM-Sizing und Host-Ressourcen](./vm-sizing-und-host-ressourcen.md) — Ressourcenbedarf und Reservierung
- [Netzwerk, DNS und TLS](./netzwerk-dns-tls.md) — Netzsegment, Namensauflösung, Zertifikate
- [Kubernetes-Laufzeit](./kubernetes-laufzeit.md) — Container-Orchestrierung und Plattformkomponenten
- [Installationsphasen und Abnahme](./installationsphasen-und-abnahme.md) — Phasenmodell und Abnahmekriterien
- [Skriptarchitektur](./skriptarchitektur.md) — Modulaufbau, Konventionen und Idempotenz-Strategie
- [cc-cli-Inventar](./cc-cli-inventar.md) — Ansible-Inventory für CIVITAS/CORE-Deployment
- [Persistenz, Storage, Backup und Restore](./persistenz-storage-backup-restore.md) — Speicherkonzept und Wiederherstellung

## Abhängigkeiten

Die Spezifikationen dieses Bereichs setzen die existierende p2d2-Infrastruktur (Proxmox VE, OPNsense, Netzwerk) als gegeben voraus. Änderungen an der bestehenden Infrastruktur werden in den jeweiligen Einzelseiten dokumentiert.
