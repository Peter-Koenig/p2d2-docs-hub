---
title: Netzwerk, DNS und TLS — CIVITAS/CORE V2
description: Netzwerkarchitektur, DNS-Anforderungen und TLS-Strategie für die CIVITAS/CORE-V2-VM im SOHO-Cluster
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-netzwerk
parent: civitas-core-v2-serveraufbau-index
dependencies:
  - civitas-core-v2-serveraufbau-zielbild
quality:
  completeness: 70
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# Netzwerk, DNS und TLS

Dieses Dokument spezifiziert die Netzwerkanbindung, Namensauflösung und TLS-Strategie für die CIVITAS/CORE-V2-VM auf dem Proxmox-Knoten `civitas`.

## Netzwerkarchitektur

Die CIVITAS/CORE-V2-VM ist nicht direkt aus dem Internet erreichbar. Der gesamte externe Traffic läuft über die bestehende OPNsense-Firewall mit Caddy als Reverse-Proxy:

```
                        Internet
                           │
                     ┌─────▼─────┐
                     │  OPNsense │
                     │ + Caddy   │  ← TLS-Terminierung (Let's Encrypt)
                     │  (Port 443)│
                     └─────┬─────┘
                           │ WireGuard-Tunnel (10.10.10.0/24)
                     ┌─────▼─────┐
                     │CIVITAS VM │
                     │10.10.10.5 │  ← Kein direktes HTTPS
                     │           │     nginx-Ingress auf Port 8080 (HTTP)
                     └───────────┘
```

### Netzsegmente

| Segment | Adressbereich | Zweck |
|---|---|---|
| SOHO-LAN (physisch) | `192.168.12.0/24` | VM-Grundnetz, Proxmox-Host, Gateway |
| WireGuard-LAN (logisch) | `10.10.10.0/24` | Abgesicherter Tunnel zwischen OPNsense und VM |

### IP-Adressierung

| Komponente | LAN-IP | WireGuard-IP | Bemerkung |
|---|---|---|---|
| CIVITAS/CORE-VM | `192.168.12.139` (statisch) | `10.10.10.5/24` | Konfiguriert via Cloud-Init |
| OPNsense | `192.168.12.1` | `10.10.10.1` | Gateway + WireGuard-Peer |
| Proxmox-Host | `192.168.12.x` | – | Kein WireGuard |

Die LAN-IP der VM wird statisch über Cloud-Init vergeben (kein DHCP).
Der WireGuard-Tunnel wird erst in Phase 2d aktiviert.

### Firewall-Regeln (OPNsense)

- Eingehender Traffic von OPNsense auf die VM (Port 8080) wird über WireGuard
  weitergeleitet.
- Ausgehender Traffic der VM ins Internet (Updates, Repository-Klon) wird
  direkt über das SOHO-LAN abgewickelt.
- Administrativer Zugriff (SSH) erfolgt ausschließlich über das SOHO-LAN
  (kein SSH über WireGuard).

## Reverse-Proxy-Anbindung (Caddy)

Caddy auf OPNsense terminiert eingehendes TLS (Port 443) für die öffentlichen
Endpunkte und leitet die Anfragen über den WireGuard-Tunnel an die VM weiter.

### Caddy-Konfiguration

Die bestehende Caddy-Konfiguration in
`/usr/local/etc/caddy/caddy.d/civitas.data-dna.eu.conf` bleibt gültig und
wird nicht geändert:

```
idm.udp.data-dna.eu, portal.udp.data-dna.eu {
    reverse_proxy 10.10.10.5:8080
}
```

Caddy holt automatisch Let's-Encrypt-Zertifikate für die öffentlichen
Hostnamen. Die VM selbst nimmt nur HTTP auf Port 8080 entgegen.

## Namensauflösung (DNS)

Folgende DNS-Einträge müssen vor Phase 2b in der Hetzner-WebGUI gesetzt sein
und von der VM aus auflösbar sein:

| Eintrag | Typ | Wert |
|---|---|---|
| `idm.udp.data-dna.eu` | A | Öffentliche IP der OPNsense (Caddy) |
| `portal.udp.data-dna.eu` | A | Öffentliche IP der OPNsense (Caddy) |

Die Auflösung wird zweistufig geprüft:
1. **Phase 0 (weich)**: Warnung, wenn nicht auflösbar – kein Abbruch.
   DNS kann erst nach VM-Erstellung gesetzt werden.
2. **Phase 2b (hart)**: Abbruch, wenn nicht auflösbar. `dig +short` muss
   für beide Einträge eine IP-Adresse liefern.

> **Hinweis**: Die DNS-Einträge zeigen auf die **OPNsense-IP**, nicht auf
> die VM-IP. Caddy leitet intern über WireGuard weiter. Ein direkter Zugriff
> auf die VM ist von außen nicht möglich.

## TLS-Strategie

### Grundsatz: TLS endet an Caddy

Die CIVITAS/CORE-V2-VM betreibt **kein eigenes HTTPS**. Alle öffentlichen
TLS-Verbindungen werden von Caddy auf OPNsense terminiert. Innerhalb der VM
wird ausschließlich HTTP verwendet.

| Aspekt | Entscheidung | Begründung |
|---|---|---|
| TLS-Terminierung | Caddy auf OPNsense | Bestehende Infrastruktur, zentrales Zertifikatsmanagement |
| Let's Encrypt in der VM | **Nicht installiert** | Nicht nötig – TLS endet vor der VM |
| cert-manager in k3s | Installiert mit `selfsigned-ca` | Für interne Cluster-Zertifikate (Kommunikation zwischen Pods) |
| nginx-Ingress | HTTP auf Port 8080, kein HTTPS | HTTPS wird nicht benötigt, da Caddy bereits terminiert |

### Konsequenzen für die Konfiguration

1. **`global.ingress.clusterIssuer`**: `selfsigned-ca` (nicht `letsencrypt-prod`).
   Die Ingress-Ressourcen erhalten selbstsignierte Zertifikate für interne Zwecke.
   Von außen werden diese nie verwendet, da Caddy terminiert.

2. **`ssl-redirect: false`**: Der nginx-Ingress-Controller wird so konfiguriert,
   dass er **keinen** HTTP→HTTPS-Redirect durchführt. Dies geschieht auf zwei Wegen:
   - Global: `controller.config.ssl-redirect=false` in den Helm-Values
   - Pro Ingress: Annotation `nginx.ingress.kubernetes.io/ssl-redirect=false`
     nach dem `helmfile sync` (analog V1 `patch_ingress_for_external_tls()`)

3. **Caddy-Zertifikate**: Caddy auf OPNsense bezieht automatisch Let's-Encrypt-
   Zertifikate für die öffentlichen Domains. Kein manuelles Zertifikats-
   Management in der VM nötig.

### Prüfung der internen Erreichbarkeit

Da die VM kein HTTPS spricht, werden alle internen Prüfungen (Phase 3) gegen
den nginx-Ingress auf Port 8080 mit HTTP und Host-Header durchgeführt:

```bash
# Keycloak intern prüfen
curl -sf -H "Host: idm.udp.data-dna.eu" http://localhost:8080/health

# Portal intern prüfen
curl -sf -H "Host: portal.udp.data-dna.eu" http://localhost:8080/
```

## WireGuard

Der WireGuard-Tunnel wird in Phase 2d eingerichtet – **nach** erfolgreichem
`helmfile sync`. Bis dahin läuft die VM ohne Tunnel.

### Konfiguration

```ini
[Interface]
Address = 10.10.10.5/24
PrivateKey = <WG_VM_PRIVATE_KEY>
ListenPort = 51820

[Peer]
PublicKey = <WG_OPN_PUBLIC_KEY>
PresharedKey = <WG_PRESHARED_KEY>
Endpoint = <WG_OPN_ENDPOINT>:51820
AllowedIPs = 10.10.10.0/24
```

Die Platzhalter werden aus Umgebungsvariablen befüllt. Die Konfiguration
auf OPNsense-Seite wird als gegeben vorausgesetzt und ist nicht Gegenstand
dieses Skripts.

### Ablauf Phase 2d

1. WireGuard-Konfiguration aus Template rendern (`wg0.conf.tpl` nach
   `/etc/wireguard/wg0.conf`)
2. Tunnel aktivieren: `systemctl enable --now wg-quick@wg0`
3. Konnektivität prüfen: `ping -c2 10.10.10.1`

### Warum erst nach helmfile sync?

Der Tunnel wird erst in Phase 2d aktiviert, weil:

- Während des `helmfile sync` (Phase 2c) müssen Container-Images aus dem
  Internet geladen werden. Der WireGuard-Tunnel ist für diese Verbindung
  nicht optimiert und könnte Engpässe verursachen.
- Das SOHO-LAN bietet während der Installation ausreichend Konnektivität.
- Erst nach erfolgreichem Deployment sollen die Dienste über Caddy erreichbar
  sein – dazu ist der Tunnel erforderlich.

## Offene Punkte

| Punkt | Status | Entscheidung bei |
|---|---|---|
| WireGuard-Endpunkt (`WG_OPN_ENDPOINT`) | **Offen** – öffentliche IP oder DDNS-Hostname der OPNsense | Netzwerkkonfiguration |
| Firewall-Regeln für eingehenden Traffic auf Port 8080 | Als gegeben vorausgesetzt – muss auf OPNsense konfiguriert sein | Netzwerkadministration |
| Caddy-Konfiguration für V2-Endpunkte | Bestehende V1-Konfiguration kann vermutlich übernommen werden | Überprüfung vor Deployment |

## Festlegungen

1. Die CIVITAS/CORE-V2-VM hat keine öffentliche IP und kein direktes HTTPS.
2. TLS endet an Caddy auf OPNsense (Let's Encrypt).
3. In der VM wird ausschließlich HTTP (Port 8080) verwendet.
4. `ssl-redirect: false` ist verbindlich für alle Ingress-Ressourcen.
5. `clusterIssuer: selfsigned-ca` (kein Let's Encrypt in der VM).
6. Der WireGuard-Tunnel wird erst nach erfolgreichem `helmfile sync` aktiviert.
7. Die DNS-Einträge zeigen auf die OPNsense-IP, nicht auf die VM-IP.