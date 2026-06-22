---
title: Zielbild und Abgrenzung des CIVITAS/CORE-Plugin-Serveraufbaus
description: Definition des Zielbilds, Geltungsbereichs, der Nichtziele und offenen Entscheidungen für den Serveraufbau
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-zielbild
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# Zielbild und Abgrenzung

Dieses Dokument definiert das Zielbild für den Serveraufbau des CIVITAS/CORE-Plugins und grenzt den Geltungsbereich gegenüber angrenzenden Themen ab.

## Zielbild

Das CIVITAS/CORE-Plugin wird in einer dedizierten virtuellen Maschine (VM) auf dem bestehenden Proxmox-Host betrieben. Die VM stellt eine Kubernetes-Laufzeitumgebung bereit, auf der CIVITAS/CORE als containerisierte Anwendung läuft. Die Anbindung an p2d2 erfolgt über die bestehende Netzwerkinfrastruktur (OPNsense, interne VLANs).

Die VM wird aus dem vorhandenen Ressourcenpool des Proxmox-Hosts bedient. Eine Erweiterung der Host-Hardware ist nicht vorgesehen, solange die bestehenden Reserven ausreichen.

## Geltungsbereich

- Auswahl und Dimensionierung der Gast-VM (CPU, RAM, Disk)
- Netzwerkanbindung der VM (VLAN, IP, DNS, Firewall-Regeln)
- TLS-Terminierung und Zertifikatsmanagement
- Kubernetes-Distribution und Basis-Plattformkomponenten
- Storage-Konzept (persistente Volumes, Backup, Restore)
- Installationsprozedur und Abnahmekriterien

## Nichtziele

- Die Spezifikation der fachlichen Plugin-Logik (API-Integration, Datenmodell) ist nicht Gegenstand dieses Dokuments.
- Die Konfiguration von CIVITAS/CORE-Fachmodulen wird nicht spezifiziert.
- Ein Produktivbetrieb mit Lasttests und Performance-Benchmarks wird in dieser Phase nicht durchgeführt.
- Eine Migration bestehender p2d2-Komponenten in die Kubernetes-Umgebung ist nicht vorgesehen.

## Offene Entscheidungen

- **Kubernetes-Distribution**: Single-Node (K3s, MicroK8s) vs. Multi-Node (Kubeadm, Rancher). Die Entscheidung wird nach Evaluierung der Ressourcenanforderungen getroffen.
- **TLS-Strategie**: Eigenständiges Zertifikat für die Plugin-VM vs. Terminierung über den bestehenden OPNsense-Reverse-Proxy.
- **Storage-Provider**: Proxmox-gesteuerte Disk vs. NFS-Export vs. Ceph (sofern verfügbar).

## Akzeptanzkriterien

1. Die VM ist aus dem bestehenden Proxmox-Ressourcenpool dimensionierbar, ohne dass Host-Ressourcen anderer Dienste eingeschränkt werden müssen.
2. Die VM ist über das interne Netzwerk von den p2d2-Komponenten aus erreichbar.
3. Die TLS-Kommunikation zwischen p2d2 und dem Plugin ist konfiguriert und getestet.
4. Ein Backup- und Restore-Vorgang für die VM ist dokumentiert und durchgeführt.
