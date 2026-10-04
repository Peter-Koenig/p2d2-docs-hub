---
title: Netzwerk-Topologie
description: Vergleich der beiden Betriebsarten des CIVITAS/CORE-Plugins (hinter HAProxy und direkt im Netz) und ihrer Paketwege.
status: draft
lastUpdated: 2026-10-04
lang: de
category: spec
specid: civitas-core-plugin-netzwerk-topologie-index
parent: civitas-core-plugin-index
dependencies:
  - civitas-core-plugin-serveraufbau-netzwerk
quality:
  completeness: 70
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# Netzwerk-Topologie

Die Plattform wird in zwei Betriebsarten betrieben. Fall 1 läuft hinter einem
HAProxy in einer OPNsense-VM, Fall 2 direkt auf einem öffentlich erreichbaren
Hetzner-Server. Beide Fälle führen eingehenden HTTPS-Verkehr zum ingress-nginx
in der CIVITAS/CORE-VM.

## Vergleich

| Aspekt | Fall 1: hinter HAProxy | Fall 2: direkt im Netz |
|---|---|---|
| Öffentliche Adresse liegt auf | `<edge-ip>` (OPNsense-VM auf dem Edge-Server) | `<oeffentliche-ip>` (`<wan-nic>` des Hetzner-Servers) |
| Rolle des Proxmox-Knotens | Bridge-Host, leitet nicht weiter | Router und NAT-Gerät |
| VM-Netz | internes Netz mit `<gateway-ip>` als Gateway | isoliertes Netz `<vm-netz>` auf Bridge `vmbr1` |
| Weg des Datenstroms | Client, HAProxy, WireGuard-Tunnel, VM | Client, DNAT auf dem Knoten, VM |
| Ort der TLS-Terminierung | ingress-nginx in der VM | ingress-nginx in der VM |
| WireGuard | aktiv, Tunnel zwischen OPNsense und VM | nicht vorhanden |
| Weiterleitung von 80, 443 und 8022 | HAProxy leitet 80 und 443 per TCP-Passthrough weiter | DNAT-Regeln auf dem Knoten für 80, 443 und 8022 |
| DNS | `udp.<basisdomain>` und `*.udp.<basisdomain>` auf `<edge-ip>` | `udp.<basisdomain>` und `*.udp.<basisdomain>` auf `<oeffentliche-ip>` |
| `WG_ENABLE` | `true` | `false` |

## Weiterführende Seiten

- [Fall 1: hinter HAProxy](./fall-1-hinter-haproxy.md)
- [Fall 2: direkt im Netz](./fall-2-direkt-im-netz.md)
- [Netzwerk, DNS und TLS](../serveraufbau-v1/netzwerk-dns-tls.md)
