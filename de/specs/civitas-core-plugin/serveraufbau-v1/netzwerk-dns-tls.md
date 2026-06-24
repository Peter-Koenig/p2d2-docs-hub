---
title: Netzwerk, DNS und TLS für das CIVITAS/CORE-Plugin
description: Spezifikation der Netzwerkanbindung, Namensauflösung und Zertifikatsstrategie für die Plugin-VM
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-netzwerk
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 85
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# Netzwerk, DNS und TLS

Dieses Dokument spezifiziert die Netzwerkanbindung, Namensauflösung, externe Erreichbarkeit und Zertifikatsstrategie für die CIVITAS/CORE-Plugin-VM.

## Netzsegment

Die Plugin-VM wird in ein bestehendes internes VLAN eingebunden. Die Zuordnung erfolgt nach folgender Priorität:

1. **Dediziertes Service-VLAN** (falls vorhanden und vom bestehenden p2d2-Netz trennbar)
2. **Gleiches VLAN wie die p2d2-Frontend-Komponenten** (bei fehlender Segmentierungsmöglichkeit)

Die IP-Adresse wird statisch aus dem jeweiligen Subnetz vergeben. DHCP ist nicht vorgesehen.

### Firewall-Regeln (OPNsense)

- Eingehender Traffic von p2d2-Komponenten (Frontend, GeoServer) auf den Plugin-Port (z. B. 443) wird freigegeben.
- Ausgehender Traffic der Plugin-VM ins Internet (für Updates, API-Zugriffe auf CIVITAS/CORE) wird über eine definierte Proxy-Regel oder direkt freigegeben.
- Administrativer Zugriff (SSH) erfolgt ausschließlich über das Management-VPN.

## Namensauflösung

Die Plugin-VM erhält einen internen DNS-Eintrag im Format:

```
civitas-core-plugin.int.data-dna.eu
```

Die Auflösung erfolgt über den internen DNS-Server (OPNsense oder separater Unbound-Container). Ein öffentlicher DNS-Eintrag ist in dieser Phase nicht vorgesehen.

## Externe Erreichbarkeit

Sofern das Plugin über eine API extern erreichbar sein muss (z. B. für Webhooks von CIVITAS/CORE), wird ein Reverse-Proxy-Eintrag in OPNsense (HAProxy oder Caddy) konfiguriert:

- Subdomain: `civitas-core-plugin.data-dna.eu`
- Ziel: `https://<interne-ip>:<port>`

Die Entscheidung über externe Erreichbarkeit wird mit der Plattformintegration getroffen.

## Reverse-Proxy-Anbindung

Die Anbindung an den bestehenden Reverse-Proxy erfolgt nach dem gleichen Muster wie die bestehenden p2d2-Dienste:

1. OPNsense terminiert eingehendes TLS (Port 443).
2. Der Request wird als HTTP an die interne IP der Plugin-VM weitergeleitet.
3. Die Plugin-VM antwortet auf dem konfigurierten Port.

Alternativ kann die TLS-Terminierung direkt in der Plugin-VM (z. B. durch den Kubernetes-Ingress-Controller) erfolgen. Dies ist eine offene Entscheidung.

## Zertifikatsstrategie

| Variante | Beschreibung | Status |
|----------|--------------|--------|
| **A** | TLS-Terminierung in OPNsense mit Let's Encrypt (Certbot/ACME) | Bevorzugt, da bestehende Infrastruktur genutzt wird |
| **B** | Eigenständiges Zertifikat in der Plugin-VM, ebenfalls Let's Encrypt | Erforderlich, wenn Ende-zu-Ende-TLS verlangt wird |
| **C** | Self-Signed-Zertifikat für interne Kommunikation | Nur für Test- und Entwicklungsphasen |

## Offene Entscheidungen

- Ist eine externe Erreichbarkeit des Plugins erforderlich?
- Erfolgt die TLS-Terminierung in OPNsense oder in der Plugin-VM?
- Wird ein separater DNS-Eintrag f&uuml;r die interne Kommunikation ben&ouml;tigt?

## Getroffene Entscheidungen

Die folgenden Entscheidungen sind gefallen und verbindlich:

- **TLS-Terminierung**: Variante A ist gew&auml;hlt. Caddy auf OPNsense terminiert TLS f&uuml;r `idm.udp.data-dna.eu` und `portal.udp.data-dna.eu`. Die VM betreibt kein TLS.
- **HTTP-Port**: Der nginx-Ingress-Controller lauscht auf Port 80 (HTTP). Caddy leitet auf `10.10.10.5:80` weiter.
- **Kein interner TLS**: Ingress-Ressourcen im `civitas-core`-Namespace erhalten keinen TLS-Block. `ssl-redirect` ist global auf `false` gesetzt.
- **Caddy-Konfiguration**: Die Konfiguration in `/usr/local/etc/caddy/caddy.d/civitas.data-dna.eu.conf` ist verbindlich:
  ```
  idm.udp.data-dna.eu {
      reverse_proxy 10.10.10.5:80 {
          header_up X-Forwarded-Proto https
      }
  }

  portal.udp.data-dna.eu {
      reverse_proxy 10.10.10.5:80 {
          header_up X-Forwarded-Proto https
      }
  }

  udp.data-dna.eu {
      reverse_proxy 10.10.10.5:80 {
          header_up X-Forwarded-Proto https
      }
  }
  ```
  Diese Konfiguration wird nicht durch das Skript verändert, sondern ist manuell auf OPNsense einzurichten oder zu pflegen.
- **WireGuard-Konfiguration**: Das Skript schreibt `/etc/wireguard/wg0.conf`
  aus `templates/wg0.conf.tpl` (Phase 2, nach `cc_cli exec`). Die Schlüssel
  `WG_VM_PRIVATE_KEY`, `WG_OPN_PUBLIC_KEY` und `WG_PRESHARED_KEY` werden
  ausschließlich als Env-Vars übergeben. Nach dem Schreiben der Config
  wird der Tunnel mit `systemctl enable --now wg-quick@wg0` aktiviert und
  die Konnektivität zu OPNsense (ping `10.10.10.1`) geprüft.

- **Domain (Ist-Stand)**: Der deployete Basisdomainname lautet `udp.data-dna.eu`.
  Die Variablen `DOMAIN` in `01_config.sh` und alle `PLACEHOLDER_DOMAIN`-Stellen
  im Inventory-Template werden auf `udp.data-dna.eu` gesetzt.
  Die Endpunkte sind damit `idm.udp.data-dna.eu` (Keycloak) und
  `udp.data-dna.eu` (Service Portal, kein Subdomain-Präfix).

- **Caddy `X-Forwarded-Proto`**: Jeder `reverse_proxy`-Block in der
  Caddy-Konfiguration enthält `header_up X-Forwarded-Proto https`.
  Ohne diesen Header lehnt Keycloak HTTPS-Redirects ab (Infinite-Redirect-Loop).
  Betrifft alle Caddy-Blöcke für Hosts unter `udp.data-dna.eu`.

- **Hetzner DNS**: Vor Phase 2 müssen folgende A-Records in der Hetzner-WebGUI
  manuell angelegt sein (das Skript legt keine DNS-Records an):
  - `udp.data-dna.eu` → OPNsense WAN-IP
  - `idm.udp.data-dna.eu` → OPNsense WAN-IP
  DNS-Records werden nicht automatisiert. Die Prüfung in Phase 0 (Warnung)
  und Phase 2 (harter Abbruch) prüft Auflösbarkeit, nicht die Herkunft des Records.

## Risiken

- Bei fehlender Netzsegmentierung kann die Plugin-VM potenziell auf alle internen Dienste zugreifen. Dies erfordert eine nachgelagerte Firewall-Regelung innerhalb des VLANs.
- Eine spätere Änderung der IP-Adresse oder des Netzsegments zieht Anpassungen in OPNsense, DNS und ggf. im Kubernetes-Cluster nach sich.
