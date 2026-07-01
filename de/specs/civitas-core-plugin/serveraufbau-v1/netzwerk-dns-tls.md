---
title: Netzwerk, DNS und TLS für das CIVITAS/CORE-Plugin
description: Spezifikation der Netzwerkanbindung, Namensauflösung und Zertifikatsstrategie für die Plugin-VM
status: draft
lastUpdated: 2026-06-29
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-netzwerk
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 93
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

### Erforderliche Subdomains

Die CIVITAS/CORE-Plattform erzeugt eine Reihe von Ingress-Ressourcen, die
über Subdomains erreichbar sein müssen. Je nach aktivierten Komponenten
(Inventory: `enable: true/false`) sind folgende Einträge nötig:

| Subdomain | Komponente | Status |
|---|---|---|
| `udp.scanea.eu` | Service Portal | ✅ Aktiv (`service_portal.enable: true`) |
| `idm.udp.scanea.eu` | Keycloak | ✅ Aktiv (`keycloak.enable: true`) |
| `api.udp.scanea.eu` | APISIX Data Plane | ✅ Aktiv (`apisix.enable: true`) |
| `api-admin.udp.scanea.eu` | APISIX Control Plane | ✅ Aktiv (`apisix.enable: true`) |
| `monitoring.udp.scanea.eu` | Grafana / Prometheus | ✅ Aktiv (`monitoring.enable: true`) |
| `alertmanager.udp.scanea.eu` | Alertmanager | ✅ Aktiv (`alertmanager.enable: true`) |
| `pgadmin.udp.scanea.eu` | pgAdmin | ✅ Aktiv (`pgadmin.enable: true`) |
| `superset.udp.scanea.eu` | Apache Superset | ✅ Aktiv (`superset.enable: true`) |
| `geoportal.udp.scanea.eu` | Masterportal | ✅ Aktiv (`gd_components.enable: true`) |
| `geoserver.udp.scanea.eu` | GeoServer | ✅ Aktiv (`geoserver.enable: true`) |
| `frost.udp.scanea.eu` | Frost-Server (SensorThings) | ✅ Aktiv (`frost.enable: true`) |
| `apim.udp.scanea.eu` | APISIX Dashboard | ⬜ Derzeit deaktiviert (`dashboard.enable: false`) |
| `oauth.udp.scanea.eu` | OAuth-Endpunkt | ⬜ Optional, je nach Keycloak-Konfiguration |
| `mqtt.udp.scanea.eu` | Frost MQTT | ❌ Deaktiviert (`frost.mqtt.enable: false`) |
| `datacatalog.udp.scanea.eu` | Piveau Hub | ❌ Deaktiviert (`piveau.enable: false`) |
| `search.datacatalog.udp.scanea.eu` | Piveau Hub Search | ❌ Deaktiviert (`piveau.enable: false`) |

> **DNS-Auflösung:** Die Subdomains müssen sowohl intern (PiHole/Unbound im
> SOHO-LAN, Auflösung auf `192.168.12.139`) als auch extern (netcup-DNS,
> Auflösung auf die OPNsense-WAN-IP) eingetragen sein. Einträge für
> deaktivierte Komponenten (`❌`) können weggelassen werden. Optionale
> Einträge (`⬜`) sollten vorsorglich gesetzt werden, falls die Komponente
> später aktiviert wird.

## Externe Erreichbarkeit

Der HAProxy auf OPNsense ist der zentrale Einstiegspunkt auf Port 443
und routet eingehende Verbindungen per SNI:

| Domain | Proxy | TLS-Terminierung | Ziel |
|---|---|---|---|
| `*.udp.scanea.eu` (CIVITAS/CORE) | HAProxy TCP-Passthrough (OPNsense) | In der VM (nginx, cert-manager) | `10.10.10.5:443` (HTTPS) |
| `*.data-dna.eu` (bestehende Dienste) | HAProxy → Caddy (OPNsense) | Caddy (Let's Encrypt) | Caddy auf Port 8443/8080 |

Der HAProxy TCP-Passthrough leitet den TLS-Handshake 1:1 an den nginx-Ingress
in der VM weiter. nginx terminiert TLS mit Zertifikaten von cert-manager
(Let's Encrypt per DNS-01-Challenge). Caddy ist hinter HAProxy auf Port 8443
(HTTPS) und 8080 (HTTP für Let's-Encrypt-HTTP-01-Challenges) erreichbar.

## Reverse-Proxy-Anbindung

Es existieren zwei parallele Proxy-Muster. HAProxy auf OPNsense (Port 443)
ist der zentrale Einstiegspunkt und routet eingehende Verbindungen per SNI.

### Muster A: HAProxy → Caddy (HTTP-Proxy, für `*.data-dna.eu` und ACME)

1. HAProxy auf OPNsense empfängt TLS auf Port 443 (SNI-basiertes Routing).
2. Bei SNI `*.data-dna.eu` wird die Verbindung an Caddy auf Port 8443 (HTTPS)
   weitergeleitet. Caddy terminiert TLS mit Let's-Encrypt-Zertifikaten.
3. Für Let's-Encrypt-HTTP-01-Challenges leitet HAProxy ACME-Traffic
   (`/.well-known/acme-challenge/`) an Caddy auf Port 8080 (HTTP) weiter.
4. Caddy kommuniziert nicht direkt mit der CIVITAS/CORE-VM
   (`10.10.10.5`). Dieses Muster betrifft ausschließlich die bestehenden
   `*.data-dna.eu`-Dienste (p2d2-Frontend, GeoServer, etc.).

### Muster B: HAProxy TCP-Passthrough (für `*.udp.scanea.eu`)

1. HAProxy auf OPNsense empfängt TLS auf Port 443 (SNI-basiertes Routing).
2. Bei SNI `*.udp.scanea.eu` wird der TCP-Strom 1:1 an `10.10.10.5:443`
   weitergeleitet (via WireGuard).
3. nginx in der VM terminiert TLS mit Zertifikaten von cert-manager
   (Let's Encrypt per DNS-01-Challenge).
4. Der 308-Redirect entfällt, da nginx die TLS-Verbindung vollständig
   selbst handhabt. `ssl-redirect=true` (Default) ist korrekt.

## Zertifikatsstrategie

| Variante | Beschreibung | Status |
|----------|--------------|--------|
| **A** | TLS-Terminierung in OPNsense mit Let's Encrypt (Caddy) | Bestehend für `*.data-dna.eu` |
| **B** | Eigenständiges Zertifikat in der Plugin-VM, ebenfalls Let's Encrypt | Erforderlich für `*.udp.projekte-koenig.eu` |
| **C** | Self-Signed-Zertifikat für interne Kommunikation | Nur für Test- und Entwicklungsphasen |
| **D** | HAProxy TCP-Passthrough ohne TLS-Terminierung; Zertifikatsausstellung durch cert-manager in der VM (DNS-01) | **NEU** – geplant für `*.udp.projekte-koenig.eu` |
| **E** | Let's Encrypt mit Gateway API HTTP-01; cert-manager erzeugt HTTPRoutes für ACME-Challenges | **In Vorbereitung** für `*.udp.scanea.eu` |

In der geplanten Migration werden die CIVITAS/CORE-Endpunkte von Variante A
(Caddy) auf Variante D (HAProxy TCP-Passthrough) umgestellt. Die bestehenden
`*.data-dna.eu`-Dienste bleiben unverändert unter Variante A.

### Variante C — Self-Signed-CA (Entwicklung/Evaluation)

**Technische Anforderung: Nicht-leerer Issuer-DN**

Java-basierte Komponenten (Frost-Server, Apache Tomcat) parsen TLS-Zertifikate
via JDK `sun.security.x509.X509CertInfo`. Diese Implementierung lehnt
Zertifikate mit leerem Subject/Issuer-DN mit folgendem Fehler ab:

  `CertificateParsingException: Empty issuer DN not allowed in X509Certificates`

Ein cert-manager `ClusterIssuer` mit `spec: selfSigned: {}` stellt Zertifikate
mit leerem Subject aus. Dies ist von cert-manager so dokumentiert und korrekt,
aber mit Java/Tomcat nicht kompatibel.

**Festlegung:** Auch Variante C erfordert ein zweistufiges CA-Setup:

| Stufe | Ressource | Beschreibung |
|---|---|---|
| 1 | Bootstrap-`ClusterIssuer` | `spec: selfSigned: {}` — nur zur Ausstellung des Root-CA-Zertifikats |
| 2 | Root-CA-`Certificate` (namespace `cert-manager`) | `commonName: "civitas-core-ca"`, `subject.organizations: ["civitas-core"]` |
| 3 | Produktiver `ClusterIssuer` `selfsigned-issuer` | `spec: ca: secretName: civitas-core-ca-secret` (Name bleibt, da cc-cli-Inventory diesen Namen erwartet) |

Abnahmekriterium:
```bash
openssl x509 -in /usr/local/share/ca-certificates/civitas-core-ca.crt \
  -noout -issuer | grep -q "CN=civitas-core-ca"
```

**CA-Trust-Integration:**
Das Root-CA-Cert muss nach Ausstellung in zwei Stores eingetragen werden:
1. System: `update-ca-certificates`
2. Python-venv certifi: `cat ca.crt >> ${VENV}/lib/python*/site-packages/certifi/cacert.pem`

Grund: Ansible im venv nutzt certifi als CA-Bundle, nicht den System-Store.
Ohne diesen Schritt scheitert `cc_cli exec` mit `CERTIFICATE_VERIFY_FAILED`.

### Variante E — Let's Encrypt mit Gateway API HTTP-01 (geplant)

**Ziel:** Ausstellung öffentlich vertrauenswürdiger TLS-Zertifikate für
`*.udp.scanea.eu` durch Let's Encrypt, ohne Port 80/443 auf der OPNsense
für jeden Dienst einzeln öffnen zu müssen.

**Technische Umsetzung:**

cert-manager nutzt den `gatewayHTTPRoute`-Solver, um ACME HTTP-01-Challenges
zu lösen. Statt eines klassischen Ingress erzeugt cert-manager eine
`HTTPRoute`-Ressource, die an den `civitas-gateway` im Namespace
`ingress-nginx` gebunden wird (`parentRefs`). Der nginx-Ingress-Controller
(GatewayClass `nginx`) verarbeitet die HTTPRoute und leitet die
Challenge-Anfrage an das temporäre ACME-Pod weiter.

**Voraussetzungen:**

1. **Gateway API CRDs** müssen installiert sein (Version ≥ v1.2.1).
2. **cert-manager** muss mit `config.enableGatewayAPI: true` betrieben werden.
3. Eine **Gateway-Ressource** `civitas-gateway` muss im Namespace
   `ingress-nginx` existieren, mit einem HTTP-Listener auf Port 80.
4. Der **HAProxy** auf der OPNsense muss Port-80-Traffic für
   `*.udp.scanea.eu` per TCP-Passthrough an `10.10.10.5:80` weiterleiten.
5. Die **Let's-Encrypt-ClusterIssuer** (Staging + Production) müssen
   `gatewayHTTPRoute.parentRefs` enthalten, die auf den `civitas-gateway`
   verweisen.

**Ablauf (HTTP-01-Challenge):**

```
Let's Encrypt → http://<domain>/.well-known/acme-challenge/<token>
             → DNS → 157.180.12.169:80 (OPNsense)
             → HAProxy TCP-Passthrough
             → WireGuard → 10.10.10.5:80 (VM)
             → nginx-Ingress (hostNetwork)
             → HTTPRoute (von cert-manager erzeugt)
             → ACME-Responder-Pod
```

**Status:** Der `civitas-gateway` ist manuell installiert. Die
ClusterIssuer-Templates liegen in `templates_V1/cert_manager/` bereit.
Die automatische Erzeugung der LE-Issuer durch das Playbook ist
derzeit deaktiviert (`create_letsencrypt_issuer: false`), bis der
HAProxy-Port-80-Durchgriff erfolgreich getestet wurde.

**Abnahmekriterium:**
```bash
curl -sf --max-time 10 \
  "http://idm.udp.scanea.eu/.well-known/acme-challenge/health-check" \
  -o /dev/null && echo "Port 80 erreichbar"
```

## Offene Entscheidungen

- ~~Ist eine externe Erreichbarkeit des Plugins erforderlich?~~ → **Ja, über zwei parallele Proxy-Pfade**
- ~~Erfolgt die TLS-Terminierung in OPNsense oder in der Plugin-VM?~~ → **Beides: data-dna.eu über Caddy, udp.scanea.eu über nginx/cert-manager in der VM**
- ~~Wird ein separater DNS-Eintrag für die interne Kommunikation benötigt?~~ → **Nein, WireGuard-Tunnel ersetzt internes DNS**
- ~~**Migrationstermin**~~ → **HAProxy ist seit dem zweiten Installationsdurchlauf aktiv. Die CIVITAS/CORE-Endpunkte laufen unter `udp.scanea.eu` über den HAProxy-TCP-Passthrough.**
- ~~**cert-manager Let's-Encrypt-Issuer**~~ → **Gateway API HTTP-01 wird aktuell vorbereitet (Variante E). Die automatische Erzeugung der LE-ClusterIssuer durch das Playbook ist deaktiviert, bis der HAProxy-Port-80-Durchgriff getestet ist. Die Issuer-Templates liegen in `templates_V1/cert_manager/` bereit.**

## Getroffene Entscheidungen

Die folgenden Entscheidungen sind gefallen und verbindlich:

- **HAProxy als zentraler Einstiegspunkt (Port 443)**: Der HAProxy auf OPNsense
  empfangt eingehenden TLS-Traffic auf Port 443 und routet per SNI:
  - `*.udp.scanea.eu` → TCP-Passthrough an `10.10.10.5:443` (nginx in der VM
    terminiert TLS mit cert-manager-Zertifikaten)
  - Alle anderen Domains (`*.data-dna.eu`) → Weiterleitung an Caddy
    (Port 8443 HTTPS / 8080 HTTP)
- **Caddy-Ports**: Caddy lauscht nicht mehr auf Port 443, sondern auf
  Port 8443 (HTTPS) und Port 8080 (HTTP f&uuml;r Let's-Encrypt-HTTP-01-Challenges).
  Die Weiterleitung erfolgt durch HAProxy.
- **TLS in der VM (CIVITAS/CORE)**: F&uuml;r `*.udp.scanea.eu` terminiert nginx
  in der VM das TLS selbstst&auml;ndig mit Zertifikaten von cert-manager
  (Let's Encrypt per DNS-01-Challenge). Der HAProxy leitet den TCP-Strom
  1:1 durch (Layer 4, kein TLS-Eingriff).
- **Caddy-TLS (bestehende Dienste)**: F&uuml;r `*.data-dna.eu` terminiert Caddy
  weiterhin TLS mit Let's-Encrypt-Zertifikaten. Die ACME-HTTP-01-Challenge
  l&auml;uft &uuml;ber HAProxy (Port 8080 → Caddy Port 8080).
- **ssl-redirect**: Der globale `ssl-redirect` im nginx-ConfigMap steht auf
  `true` (Helm-Default). Da nginx TLS selbst terminiert, ist der HTTP-zu-HTTPS-
  Redirect korrekt und erw&uuml;nscht. Der fr&uuml;here Workaround (`ssl-redirect=false`)
  entf&auml;llt mit der HAProxy-Architektur.
- **Ingress-tls-Sektion**: Ingress-Ressourcen unter `*.udp.scanea.eu` behalten
  ihre `spec.tls`-Sektion. nginx ben&ouml;tigt sie zur TLS-Terminierung. Der
  fr&uuml;here Patch (`patch_ingress_for_external_tls`), der die tls-Sektion
  entfernte, entf&auml;llt mit der HAProxy-Architektur.
- **Caddy-Konfiguration (bestehend)**: Die Konfiguration in
  `/usr/local/etc/caddy/caddy.d/civitas.data-dna.eu.conf` ist weiterhin
  verbindlich f&uuml;r `*.data-dna.eu`. Die Caddy-Bl&ouml;cke f&uuml;r
  CIVITAS/CORE-Hosts (`idm.udp.data-dna.eu`, `portal.udp.data-dna.eu`,
  `udp.data-dna.eu`) wurden entfernt, da diese Domains nicht mehr &uuml;ber
  Caddy, sondern direkt &uuml;ber den HAProxy-TCP-Passthrough an die VM
  geroutet werden. Die Konfiguration wird nicht durch das Skript ver&auml;ndert,
  sondern ist manuell auf OPNsense einzurichten oder zu pflegen.
- **WireGuard-Konfiguration**: Das Skript schreibt `/etc/wireguard/wg0.conf`
  aus `templates/wg0.conf.tpl` (Phase 2). Die Schl&uuml;ssel
  `WG_VM_PRIVATE_KEY`, `WG_OPN_PUBLIC_KEY` und `WG_PRESHARED_KEY` werden
  ausschlie&szlig;lich als Env-Vars &uuml;bergeben. Nach dem Schreiben der Config
  wird der Tunnel mit `systemctl enable --now wg-quick@wg0` aktiviert und
  die Konnektivit&auml;t zu OPNsense (ping `10.10.10.1`) gepr&uuml;ft.
- **Domain (Ist-Stand)**: Der deployete Basisdomainname lautet `udp.scanea.eu`.
  Die Variablen `DOMAIN` in `01_config.sh` und alle `PLACEHOLDER_DOMAIN`-Stellen
  im Inventory-Template sind auf `udp.scanea.eu` gesetzt.
  Die CIVITAS/CORE-Endpunkte sind damit `idm.udp.scanea.eu` (Keycloak) und
  `udp.scanea.eu` (Service Portal).
- **Hetzner DNS**: Vor Phase 2 m&uuml;ssen folgende A-Records in der Hetzner-WebGUI
  manuell angelegt sein (das Skript legt keine DNS-Records an):
  - `udp.scanea.eu` → OPNsense WAN-IP
  - `idm.udp.scanea.eu` → OPNsense WAN-IP
  DNS-Records werden nicht automatisiert. Die Pr&uuml;fung in Phase 0 (Warnung)
  und Phase 2 (harter Abbruch) pr&uuml;ft Aufl&ouml;sbarkeit, nicht die Herkunft des Records.

## Problem: Caddy-TLS-Terminierung blockiert Ingress-Zertifikate (GELÖST)

Dieses Problem trat in der ursprünglichen Architektur (Caddy-only auf Port 443)
auf. Mit der Einführung des HAProxy-TCP-Passthroughs (Variante D) ist es gelöst.
Der Abschnitt bleibt als historische Referenz erhalten.

### Ursache (historisch)

Die ursprüngliche Architektur terminierte TLS auf OPNsense (Caddy) und leitete
Nur-HTTP an den nginx-Ingress in der VM weiter. Dadurch entstand eine
Reihe von Folgeproblemen:

**1. nginx sah nie HTTPS.**  
Der nginx-Ingress-Controller empfing ausschließlich HTTP auf Port 80.
Selbst wenn cert-manager ein gültiges Let's-Encrypt-Zertifikat für
einen Ingress-Hostnamen ausstellte, konnte nginx es nicht präsentieren
— der externe Traffic kam bereits als HTTP an.

**2. nginx erzwang 308-Redirect.**  
Da die Ingress-Ressource eine `tls`-Sektion enthielt, erwartete nginx
eigentlich HTTPS. Trifft die Anfrage als HTTP ein (weil Caddy TLS bereits
terminiert hatte), sendete nginx einen HTTP-308-Redirect auf `https://...`
zurück — es entstand eine Endlosschleife. Workaround: `ssl-redirect=false`.

**3. cc_cli-Health-Checks scheiterten.**  
Die von cc_cli deployten Komponenten prüften ihre Erreichbarkeit über die
produktive URL. Der Request ging durch Caddy (TLS → HTTP) zu nginx, der
mit 302/308 antwortete — der Deployment-Wait lief ins Leere.

**4. Kein gültiges TLS-Zertifikat in der VM.**  
Da der externe Traffic nie als HTTPS ankam, konnte cert-manager kein
Let's-Encrypt-Zertifikat per HTTP-01-Challenge ausstellen. Es blieben
nur selfsigned-Zertifikate.

### Lösung: HAProxy TCP-Passthrough (umgesetzt)

Der HAProxy TCP-Passthrough leitet den TLS-Handshake 1:1 an den
nginx-Ingress weiter. nginx führt den TLS-Handshake selbst durch
und kann das von cert-manager ausgestellte Zertifikat präsentieren:

- Der 308-Redirect entfällt, da nginx die TLS-Verbindung vollständig
  selbst handhabt.
- cc_cli-Health-Checks erhalten HTTP-200, da der Pfad über nginx
  direkt zur Ziel-Komponente führt.
- cert-manager stellt Zertifikate per DNS-01-Challenge aus.
- Der ConfigMap-Patch `ssl-redirect=false` entfällt.
- `inv_checks.enable: true` im Inventory kann gesetzt werden.

## Aktuelle Architektur: HAProxy + Caddy-Nebeneinander (Ist-Stand)

Seit dem zweiten Installationsdurchlauf ist die HAProxy-TCP-Passthrough-Lösung
aktiv. Caddy bleibt parallel für alle bestehenden `*.data-dna.eu`-Dienste
erhalten.

### Zielbild (Ist-Stand)

Es existieren zwei parallele Proxy-Pfade:

```text
Port 443 ──→ HAProxy (OPNsense)
                │
                ├── SNI: *.data-dna.eu (alle bestehenden Dienste)
                │     → Caddy (8443/8080, TLS-Ende) → bestehende Backends
                │
                └── SNI: *.udp.scanea.eu (CIVITAS/CORE)
                      → HAProxy (TCP-Passthrough) → VM:443 → nginx (TLS-Ende)
```

- **Caddy** (auf Port 8443/8080) ist für alle bestehenden `*.data-dna.eu`-Dienste
  zuständig (p2d2-Frontend, GeoServer, etc.). Der ACME-HTTP-01-Pfad für
  Let's-Encrypt-Erneuerung läuft über HAProxy (Port 8080 → Caddy Port 8080).
- **HAProxy** übernimmt per SNI-Routing die `*.udp.scanea.eu`-Domains
  (CIVITAS/CORE) als TCP-Passthrough ohne TLS-Eingriff. Die Zertifikate
  stellt cert-manager in der VM aus.

### Status der umgesetzten Schritte

| Schritt | Status |
|---|---|
| HAProxy auf OPNsense konfigurieren (SNI-Rule, TCP-Passthrough zu `10.10.10.5:443`) | ✅ Umgesetzt |
| Caddy-Ports auf 8443/8080 umgestellt | ✅ Umgesetzt |
| ACME-HTTP-01-Route über HAProxy (8080 → Caddy 8080) | ✅ Umgesetzt |
| DNS-Einträge für `*.udp.scanea.eu` auf OPNsense WAN-IP | ✅ Umgesetzt |
| `ssl-redirect=true` im nginx-ConfigMap (Default) | ✅ Umgesetzt |
| `inv_checks.enable: true` im Inventory | ⬜ Noch im Template zu setzen |
| Let's-Encrypt-ClusterIssuer mit DNS-01 | ⬜ Noch einzurichten (derzeit self-signed-CA, Variante C) |

### Nächste Schritte

1. `inv_checks.enable: true` im Inventory-Template setzen (nach erfolgreichem Testlauf)
2. Let's-Encrypt-ClusterIssuer mit DNS-01-Provider für produktive Zertifikate einrichten

***

## Risiken

- Bei fehlender Netzsegmentierung kann die Plugin-VM potenziell auf alle internen Dienste zugreifen. Dies erfordert eine nachgelagerte Firewall-Regelung innerhalb des VLANs.
- Eine spätere Änderung der IP-Adresse oder des Netzsegments zieht Anpassungen in OPNsense, DNS und ggf. im Kubernetes-Cluster nach sich.
