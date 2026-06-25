---
title: Netzwerk, DNS und TLS für das CIVITAS/CORE-Plugin
description: Spezifikation der Netzwerkanbindung, Namensauflösung und Zertifikatsstrategie für die Plugin-VM
status: draft
lastUpdated: 2026-06-25
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-netzwerk
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 92
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

### WireGuard-Netz (Ist-Stand)

Die CIVITAS/CORE-VM ist über einen WireGuard-Tunnel mit OPNsense verbunden.
Über diesen Tunnel läuft der gesamte externe Traffic für CIVITAS/CORE.

| Komponente | SOHO-LAN (192.168.12.0/24) | WireGuard (10.10.10.0/24) |
|---|---|---|
| OPNsense | `192.168.12.1` | `10.10.10.1` |
| CIVITAS/CORE-VM | `192.168.12.139` | `10.10.10.5` |
| PBS (Backup-Server) | `192.168.12.36` | `10.10.10.4` |

Der Tunnel bleibt unabhängig vom verwendeten Reverse-Proxy (Caddy oder HAProxy)
bestehen — beide Dienste nutzen dieselbe WireGuard-Strecke zur VM.

## Namensauflösung

Die Plugin-VM erhält einen internen DNS-Eintrag im Format:

```
civitas-core-plugin.int.data-dna.eu
```

Die Auflösung erfolgt über den internen DNS-Server (OPNsense oder separater Unbound-Container). Ein öffentlicher DNS-Eintrag ist in dieser Phase nicht vorgesehen.

## Externe Erreichbarkeit

Die CIVITAS/CORE-Plattform ist über zwei Wege extern erreichbar, abhängig von der Domain:

| Domain | Proxy | TLS-Terminierung | Ziel in der VM |
|---|---|---|---|
| `*.data-dna.eu` (bestehend) | Caddy (OPNsense) | In OPNsense (Let's Encrypt) | `10.10.10.5:80` (HTTP) |
| `*.udp.projekte-koenig.eu` (NEU) | HAProxy (OPNsense) TCP-Passthrough | In der VM (cert-manager) | `10.10.10.5:443` (HTTPS) |

Der HAProxy TCP-Passthrough leitet den TLS-Handshake 1:1 an den nginx-Ingress
in der VM weiter. Die VM (cert-manager) stellt eigene Let's-Encrypt-Zertifikate
für `*.udp.projekte-koenig.eu` aus.

## Reverse-Proxy-Anbindung

Es existieren zwei parallele Proxy-Muster:

### Muster A: Caddy (HTTP-Proxy, bestehend, für `*.data-dna.eu`)

1. Caddy terminiert eingehendes TLS (Port 443) auf OPNsense.
2. Der Request wird als HTTP an `10.10.10.5:80` weitergeleitet (via WireGuard).
3. nginx in der VM empfängt HTTP und routet per Ingress-Regel.
4. `ssl-redirect=false` im nginx-ConfigMap verhindert 308-Weiterleitung.

### Muster B: HAProxy TCP-Passthrough (NEU, für `*.udp.projekte-koenig.eu`)

1. HAProxy auf OPNsense empfängt TLS auf Port 443 (SNI-basiertes Routing).
2. Der TCP-Strom wird 1:1 an `10.10.10.5:443` weitergeleitet (via WireGuard).
3. nginx in der VM terminiert TLS (Zertifikat von cert-manager).
4. Kein 308, da nginx die TLS-Verbindung vollständig selbst handhabt.

## Zertifikatsstrategie

| Variante | Beschreibung | Status |
|----------|--------------|--------|
| **A** | TLS-Terminierung in OPNsense mit Let's Encrypt (Caddy) | Bestehend für `*.data-dna.eu` |
| **B** | Eigenständiges Zertifikat in der Plugin-VM, ebenfalls Let's Encrypt | Erforderlich für `*.udp.projekte-koenig.eu` |
| **C** | Self-Signed-Zertifikat für interne Kommunikation | Nur für Test- und Entwicklungsphasen |
| **D** | HAProxy TCP-Passthrough ohne TLS-Terminierung; Zertifikatsausstellung durch cert-manager in der VM (DNS-01) | **NEU** – geplant für `*.udp.projekte-koenig.eu` |

In der geplanten Migration werden die CIVITAS/CORE-Endpunkte von Variante A
(Caddy) auf Variante D (HAProxy TCP-Passthrough) umgestellt. Die bestehenden
`*.data-dna.eu`-Dienste bleiben unverändert unter Variante A.

## Offene Entscheidungen

- ~~Ist eine externe Erreichbarkeit des Plugins erforderlich?~~ → **Ja, über zwei parallele Domains**
- ~~Erfolgt die TLS-Terminierung in OPNsense oder in der Plugin-VM?~~ → **Beides: data-dna.eu über Caddy, projekte-koenig.eu über cert-manager in der VM**
- ~~Wird ein separater DNS-Eintrag für die interne Kommunikation benötigt?~~ → **Nein, WireGuard-Tunnel ersetzt internes DNS**
- **Migrationstermin**: Wann erfolgt der Wechsel der CIVITAS/CORE-Endpunkte von `udp.data-dna.eu` auf `udp.projekte-koenig.eu` mit HAProxy? → Offen
- **cert-manager Let's-Encrypt-Issuer**: DNS-01-Provider konfigurieren (für `*.udp.projekte-koenig.eu`) → Vor der Migration einzurichten

## Getroffene Entscheidungen

Die folgenden Entscheidungen sind gefallen und verbindlich:

- **TLS-Terminierung (bestehend)**: Variante A f&uuml;r `*.data-dna.eu`. Caddy auf OPNsense terminiert TLS f&uuml;r `idm.udp.data-dna.eu` und `portal.udp.data-dna.eu`. Die VM betreibt f&uuml;r diese Domains kein TLS.
- **TLS-Terminierung (NEU)**: Variante D f&uuml;r `*.udp.projekte-koenig.eu`. HAProxy TCP-Passthrough, TLS wird von nginx in der VM terminiert. cert-manager stellt Let's-Encrypt-Zertifikate per DNS-01 aus.
- **HTTP-Port (bestehend)**: Der nginx-Ingress-Controller lauscht auf Port 80 (HTTP). Caddy leitet auf `10.10.10.5:80` weiter.
- **HTTPS-Port (NEU)**: Der nginx-Ingress-Controller lauscht auf Port 443 (HTTPS) f&uuml;r den HAProxy-TCP-Passthrough. nginx terminiert TLS mit cert-manager-Zertifikaten.
- **Kein interner TLS**: Ingress-Ressourcen in Namespaces erhalten keinen `ssl-redirect`. Der globale `ssl-redirect` im nginx-ConfigMap ist auf `false` gesetzt (bis zur Migration auf HAProxy).
- **Caddy-Konfiguration (bestehend)**: Die Konfiguration in `/usr/local/etc/caddy/caddy.d/civitas.data-dna.eu.conf` ist verbindlich f&uuml;r `*.data-dna.eu`:
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

- **Hetzner DNS (bestehend)**: Vor Phase 2 müssen folgende A-Records in der Hetzner-WebGUI
  manuell angelegt sein (das Skript legt keine DNS-Records an):
  - `udp.data-dna.eu` → OPNsense WAN-IP
  - `idm.udp.data-dna.eu` → OPNsense WAN-IP
  DNS-Records werden nicht automatisiert. Die Prüfung in Phase 0 (Warnung)
  und Phase 2 (harter Abbruch) prüft Auflösbarkeit, nicht die Herkunft des Records.
- **Neue Domain (geplant)**: F&uuml;r die geplante Migration werden A-Records f&uuml;r
  `udp.projekte-koenig.eu` und `idm.udp.projekte-koenig.eu` ben&ouml;tigt,
  ebenfalls zeigend auf die OPNsense WAN-IP (dort &uuml;bernimmt HAProxy das
  SNI-basierte Routing).

## Problem: Caddy-TLS-Terminierung blockiert Ingress-Zertifikate

### Ursache

Die aktuelle Architektur terminiert TLS auf OPNsense (Caddy) und leitet
Nur-HTTP an den nginx-Ingress in der VM weiter. Dadurch entsteht eine
Reihe von Folgeproblemen:

**1. nginx sieht nie HTTPS.**  
Der nginx-Ingress-Controller empfängt ausschließlich HTTP auf Port 80.
Selbst wenn cert-manager ein gültiges Let's-Encrypt-Zertifikat f&uuml;r
einen Ingress-Hostnamen ausstellt, kann nginx es nicht pr&auml;sentieren
— der externe Traffic kommt bereits als HTTP an. Die Ingress-Ressource
hat zwar eine `tls`-Sektion, aber der TLS-Handshake findet nie statt.

**2. nginx erzwingt 308-Redirect.**  
Da die Ingress-Ressource eine `tls`-Sektion enth&auml;lt, erwartet nginx
eigentlich HTTPS. Trifft die Anfrage als HTTP ein (weil Caddy TLS bereits
terminiert hat), sendet nginx einen HTTP-308-Redirect auf `https://...`
zur&uuml;ck. Caddy empf&auml;ngt den 308 und kann ihn nicht sinnvoll
verarbeiten, da der Backend-Proxy nur HTTP spricht — es entsteht eine
Endlosschleife. Der Workaround (`ssl-redirect=false` im nginx-ConfigMap)
unterdr&uuml;ckt den Redirect, heilt aber nicht die Ursache.

**3. cc_cli-Health-Checks scheitern.**  
Die von cc_cli deployten Komponenten (Keycloak, Portal) pr&uuml;fen ihre
Erreichbarkeit &uuml;ber die produktive URL (`https://idm.udp.data-dna.eu/`).
Der Request geht durch Caddy (TLS → HTTP) zu nginx. nginx routet zur
Keycloak-Service, Keycloak antwortet mit 302 (Redirect auf `/admin/`).
Der erwartete Statuscode 200 wird nie erreicht, der Deployment-Wait
l&auml;uft ins Leere und muss durch Timeout abgebrochen werden.

**4. Kein g&uuml;ltiges TLS-Zertifikat in der VM.**  
Da der externe Traffic nie als HTTPS ankommt, kann cert-manager kein
Let's-Encrypt-Zertifikat per HTTP-01-Challenge ausstellen. Es bleiben
nur selfsigned-Zertifikate, die von Browsern und externen Diensten
nicht akzeptiert werden.

### L&ouml;sung: HAProxy TCP-Passthrough

Der HAProxy TCP-Passthrough leitet den TLS-Handshake 1:1 an den
nginx-Ingress weiter. nginx f&uuml;hrt den TLS-Handshake selbst durch
und kann das von cert-manager ausgestellte Let's-Encrypt-Zertifikat
pr&auml;sentieren:

- Der 308-Redirect entf&auml;llt, da nginx das TLS-Terminierung selbst
  vornimmt und die Anfrage korrekt als HTTPS behandelt.
- cc_cli-Health-Checks erhalten HTTP-200 (statt 302/308), da der Pfad
  &uuml;ber nginx direkt zur Ziel-Komponente f&uuml;hrt.
- cert-manager kann Let's-Encrypt-Zertifikate per DNS-01-Challenge
  ausstellen (kein HTTP-01 n&ouml;tig, da der Ingress hinter HAProxy
  nicht direkt aus dem Internet erreichbar sein muss).
- Der ConfigMap-Patch `ssl-redirect=false` kann entfallen, da nginx
  HTTPS korrekt handhabt.

Die Migration auf HAProxy-TCP-Passthrough betrifft ausschlie&szlig;lich
die CIVITAS/CORE-Domains (`*.udp.projekte-koenig.eu`). Die bestehenden
`*.data-dna.eu`-Dienste bleiben unver&auml;ndert unter Caddy.

## Geplante Migration: HAProxy + Caddy-Nebeneinander

Die Migration f&uuml;hrt die HAProxy-TCP-L&ouml;sung f&uuml;r die
CIVITAS/CORE-Endpunkte ein. Caddy bleibt parallel f&uuml;r alle
bestehenden `*.data-dna.eu`-Dienste erhalten.

### Zielbild

Nach der Migration existieren zwei parallele Proxy-Pfade:

```text
Port 443 ──→ OPNsense
                │
                ├── SNI: *.data-dna.eu
                │     → Caddy (TLS-Ende) → HTTP → VM:80 → nginx
                │
                └── SNI: *.udp.projekte-koenig.eu
                      → HAProxy (TCP-Passthrough) → VM:443 → nginx (TLS-Ende)
```

- **Caddy** bleibt f&uuml;r alle bestehenden `*.data-dna.eu`-Dienste zust&auml;ndig
  (p2d2-Frontend, GeoServer, etc.). Keine &Auml;nderung.
- **HAProxy** &uuml;bernimmt per SNI-Routing nur die `*.udp.projekte-koenig.eu`-Domains.
  TCP-Passthrough ohne TLS-Eingriff. Die Zertifikate stellt cert-manager in der VM aus.

### Vorteile der Migration

| Aspekt | Vorher (Caddy-only) | Nachher (Caddy + HAProxy) |
|---|---|---|
| TLS f&uuml;r CIVITAS/CORE | Caddy on OPNsense, nur selfsigned in der VM | cert-manager mit Let's Encrypt in der VM |
| cc_cli-Health-Check | 308 (ssl-redirect) oder 404/302 durch Caddy-Umweg | L&auml;uft sauber durch nginx (TLS direkt) |
| `ssl-redirect` | ConfigMap-Patch n&ouml;tig | Entf&auml;llt (HTTPS kommt direkt an) |
| Komplexit&auml;t | Ein Proxy f&uuml;r alle Domains | Zwei Proxys, aber klare Trennung |
| Domain | `udp.data-dna.eu` | `udp.projekte-koenig.eu` (neu) |

### Voraussetzungen f&uuml;r die Migration

1. DNS-Eintr&auml;ge f&uuml;r `*.udp.projekte-koenig.eu` auf OPNsense WAN-IP setzen
2. HAProxy auf OPNsense konfigurieren (SNI-Rule f&uuml;r die neue Domain, TCP-Passthrough zu `10.10.10.5:443`)
3. cert-manager-ClusterIssuer f&uuml;r Let's Encrypt (DNS-01) einrichten
4. `ssl-redirect` im nginx-ConfigMap wieder auf `true` setzen (optional, f&uuml;r die neue Domain)
5. cc_cli-Inventory: `inv_checks.enable` wieder auf `true` setzen (Health-Checks funktionieren jetzt)
6. `DOMAIN` und Inventory-Vorlage auf `udp.projekte-koenig.eu` umstellen

### Risiken der Migration

- HAProxy und Caddy m&uuml;ssen auf demselben Port 43 koexistieren — das SNI-Routing
  muss vor der Umstellung getestet werden.
- cert-manager DNS-01-Provider muss konfiguriert und getestet sein
  (Hetzner DNS-API oder &auml;quivalent).
- Bestehende `data-dna.eu`-Dienste d&uuml;rfen nicht beeintr&auml;chtigt werden.
- Ein Rollback auf Caddy-only ist jederzeit m&ouml;glich (DNS zur&uuml;cksetzen).

***

## Risiken

- Bei fehlender Netzsegmentierung kann die Plugin-VM potenziell auf alle internen Dienste zugreifen. Dies erfordert eine nachgelagerte Firewall-Regelung innerhalb des VLANs.
- Eine spätere Änderung der IP-Adresse oder des Netzsegments zieht Anpassungen in OPNsense, DNS und ggf. im Kubernetes-Cluster nach sich.
