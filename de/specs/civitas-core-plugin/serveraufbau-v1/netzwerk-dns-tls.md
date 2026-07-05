---
title: Netzwerk, DNS und TLS für das CIVITAS/CORE-Plugin
description: Spezifikation der Netzwerkanbindung, Namensauflösung und Zertifikatsstrategie für die Plugin-VM
status: draft
lastUpdated: 2026-07-04
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-netzwerk
parent: civitas-core-plugin-serveraufbau-index
dependencies: []
quality:
  completeness: 98
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
| `udp.data-dna.eu` | Service Portal | ✅ Aktiv (`service_portal.enable: true`) |
| `idm.udp.data-dna.eu` | Keycloak | ✅ Aktiv (`keycloak.enable: true`) |
| `api.udp.data-dna.eu` | APISIX Data Plane | ✅ Aktiv (`apisix.enable: true`) |
| `api-admin.udp.data-dna.eu` | APISIX Control Plane | ✅ Aktiv (`apisix.enable: true`) |
| `monitoring.udp.data-dna.eu` | Grafana / Prometheus | ✅ Aktiv (`monitoring.enable: true`) |
| `alertmanager.udp.data-dna.eu` | Alertmanager | ✅ Aktiv (`alertmanager.enable: true`) |
| `pgadmin.udp.data-dna.eu` | pgAdmin | ✅ Aktiv (`pgadmin.enable: true`) |
| `superset.udp.data-dna.eu` | Apache Superset | ✅ Aktiv (`superset.enable: true`) |
| `geoportal.udp.data-dna.eu` | Masterportal | ✅ Aktiv (`gd_components.enable: true`) |
| `geoserver.udp.data-dna.eu` | GeoServer | ✅ Aktiv (`geoserver.enable: true`) |
| `frost.udp.data-dna.eu` | Frost-Server (SensorThings) | ✅ Aktiv (`frost.enable: true`) |
| `apim.udp.data-dna.eu` | APISIX Dashboard | ⬜ Derzeit deaktiviert (`dashboard.enable: false`) |
| `oauth.udp.data-dna.eu` | OAuth-Endpunkt | ⬜ Optional, je nach Keycloak-Konfiguration |
| `mqtt.udp.data-dna.eu` | Frost MQTT | ❌ Deaktiviert (`frost.mqtt.enable: false`) |
| `datacatalog.udp.data-dna.eu` | Piveau Hub | ❌ Deaktiviert (`piveau.enable: false`) |
| `search.datacatalog.udp.data-dna.eu` | Piveau Hub Search | ❌ Deaktiviert (`piveau.enable: false`) |

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
| `*.udp.data-dna.eu` (CIVITAS/CORE) | HAProxy TCP-Passthrough (OPNsense) | In der VM (nginx, cert-manager) | `10.10.10.5:443` (HTTPS) |
| `*.data-dna.eu` (bestehende Dienste) | HAProxy → Caddy (OPNsense) | Caddy (Let's Encrypt) | Caddy auf Port 8443/8080 |

Der HAProxy TCP-Passthrough leitet den TLS-Handshake 1:1 an den nginx-Ingress
in der VM weiter. nginx terminiert TLS mit Zertifikaten von cert-manager
(Variante E: Gateway API HTTP-01). Caddy ist hinter HAProxy auf Port 8443
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

### Muster B: HAProxy TCP-Passthrough (für `*.udp.data-dna.eu`)

1. HAProxy auf OPNsense empfängt TLS auf Port 443 (SNI-basiertes Routing).
2. Bei SNI `*.udp.data-dna.eu` wird der TCP-Strom 1:1 an `10.10.10.5:443`
   weitergeleitet (via WireGuard).
3. nginx in der VM terminiert TLS mit Zertifikaten von cert-manager
   (Variante E: Gateway API HTTP-01).
4. Der 308-Redirect entfällt, da nginx die TLS-Verbindung vollständig
   selbst handhabt. `ssl-redirect=true` (Default) ist korrekt.

## Zertifikatsstrategie

| Variante | Beschreibung | Status |
|----------|--------------|--------|
| **A** | TLS-Terminierung in OPNsense mit Let's Encrypt (Caddy) | Bestehend für `*.data-dna.eu` |
| **B** | Eigenständiges Zertifikat in der Plugin-VM, ebenfalls Let's Encrypt | Erforderlich für `*.udp.data-dna.eu` |
| **C** | Self-Signed-Zertifikat für interne Kommunikation | Nur für Test- und Entwicklungsphasen |
| **D** | HAProxy TCP-Passthrough ohne TLS-Terminierung; Zertifikatsausstellung durch cert-manager in der VM (DNS-01) | ❌ Verworfen – ersetzt durch Variante E (ingress-nginx HTTP-01) |
| **E** | Let's Encrypt mit ingress-nginx HTTP-01; cert-manager (ingress-shim) erzeugt automatisch Certificate-Objekte je Ingress | **✅ Verifiziert** – Ablauf siehe Schritte 1–4 |

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

### Variante E — Let's Encrypt mit ingress-nginx HTTP-01 (verifiziert)

**Ziel:** Ausstellung öffentlich vertrauenswürdiger TLS-Zertifikate für
`*.udp.data-dna.eu` durch Let's Encrypt, ohne Port 80/443 auf der OPNsense
für jeden Dienst einzeln öffnen zu müssen.

**Technische Umsetzung:**

cert-manager nutzt den `http01.ingress`-Solver, um ACME HTTP-01-Challenges
zu lösen. cert-manager erzeugt für die Challenge eine temporäre Ingress-Ressource
mit dem Annotation-basierten Ingress-Controller-Selektor
(`kubernetes.io/ingress.class: nginx`). Der nginx-Ingress-Controller
verarbeitet diese Ingress-Ressource und leitet die Challenge-Anfrage an das
temporäre ACME-Pod weiter.

Der `ingress-shim`-Controller (Teil von cert-manager, standardmäßig aktiv)
überwacht alle Ingress-Ressourcen auf die Annotation
`cert-manager.io/cluster-issuer`. Ist diese Annotation gesetzt und ein
`tls`-Block vorhanden, erzeugt er automatisch ein `Certificate`-Objekt und
hält es synchron. Ein manuelles Anlegen einzelner Certificate-Objekte pro
Subdomain ist nicht erforderlich – die Steuerung erfolgt ausschließlich über
die Annotation auf der Ingress-Ressource.

**Voraussetzungen:**

1. **cert-manager** muss installiert sein (Default-Installation aktiviert
   den `ingress-shim`-Controller automatisch). Die Option
   `config.enableGatewayAPI` ist nicht erforderlich.
2. Der **HAProxy** auf der OPNsense muss Port-80-Traffic für
   `*.udp.data-dna.eu` per TCP-Passthrough an `10.10.10.5:80` weiterleiten.
3. Die **Let's-Encrypt-ClusterIssuer** (Staging + Production) müssen als
   `ClusterIssuer`-Ressource mit `http01.ingress.ingressClassName: nginx`
   existieren.
4. Jede zu schützende **Ingress-Ressource** muss einen `tls`-Block mit
   `secretName` und den entsprechenden Hosts enthalten, damit der
   `ingress-shim` das Certificate-Objekt automatisch erzeugen kann.

**Ablauf (HTTP-01-Challenge):**

```
Let's Encrypt → http://<domain>/.well-known/acme-challenge/<token>
             → DNS → 157.180.12.169:80 (OPNsense)
             → HAProxy TCP-Passthrough
             → WireGuard → 10.10.10.5:80 (VM)
             → nginx-Ingress (hostNetwork)
             → Ingress (von cert-manager erzeugt, http01.ingress)
             → ACME-Responder-Pod
```

**Status:** Die LE-ClusterIssuer (Staging + Production) sind nicht
automatisch im Playbook aktiviert (`create_letsencrypt_issuer: false`).
Die Ausstellung erfolgt bei Bedarf über die Skriptfunktion
`switch_certificate_issuer()` (siehe unten) oder manuell über die
Ingress-Annotation `cert-manager.io/cluster-issuer`. Die `templates_V1/cert_manager/`
enthalten Referenz-YAMLs für die ClusterIssuer-Ressourcen.

**Abnahmekriterium:**
```bash
curl -sf --max-time 10 \
  "http://idm.udp.data-dna.eu/.well-known/acme-challenge/health-check" \
  -o /dev/null && echo "Port 80 erreichbar"
```

### Staging-vor-Produktion-Pflicht

**Hintergrund:** Let's Encrypt unterteilt die Ausstellung in zwei Umgebungen:
- **Staging** (`https://acme-staging-v02.api.letsencrypt.org/directory`):  
  Zertifikate sind nicht browservertrauenswürdig, aber unterliegen **keinen**
  nennenswerten Rate-Limits. Ideal für Tests.
- **Produktion** (`https://acme-v02.api.letsencrypt.org/directory`):  
  Strenge Limits: 5 Duplikate pro Woche, 50 Zertifikate pro Domain pro Woche.
  Ein fehlerhafter produktiver Request verbraucht sofort kontingentiertes
  Volumen.

**Regel:** Für jeden neuen Hostnamen MUSS vor dem produktiven Request ein
Staging-Zertifikat erfolgreich ausgestellt und verifiziert werden.

**Ablauf (mit ingress-shim):**

1. Die Ingress-Ressource des Zielhostnamens mit
   `cert-manager.io/cluster-issuer=letsencrypt-staging` annotieren:
   ```bash
   kubectl annotate ingress <name> -n <namespace> \
     cert-manager.io/cluster-issuer=letsencrypt-staging --overwrite
   ```
   Der `ingress-shim`-Controller erzeugt daraufhin automatisch das
   zugehörige Certificate-Objekt.
2. Warten auf READY=True des automatisch erzeugten Zertifikats:
   ```bash
   kubectl wait certificate/<name>-tls -n <namespace> --for=condition=Ready --timeout=180s
   ```
3. Staging-Aussteller im Zertifikat verifizieren:
   ```bash
   kubectl get secret <name>-tls -n <namespace> \
     -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -issuer
   ```
   Erwartung: Aussteller enthält `(STAGING)`.
4. Nach erfolgreicher Verifikation die Annotation auf
   `cert-manager.io/cluster-issuer=letsencrypt-prod` umsetzen:
   ```bash
   kubectl annotate ingress <name> -n <namespace> \
     cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite
   ```
   Der `ingress-shim` aktualisiert das Certificate-Objekt automatisch.
5. Produktives Zertifikat verifizieren (Aussteller enthält keinen
   `(STAGING)`-Zusatz mehr).

**Idempotenz-Marker:** Nach erfolgreicher Staging-Verifikation wird die Ingress-Ressource des Hostnamens mit `civitas.io/staging-verified: "true"` annotiert (Befehl: `kubectl annotate ingress <name> -n <namespace> civitas.io/staging-verified=true`). Die Annotation auf Certificate-Objekten ist nicht geeignet, da diese durch den `ingress-shim` bei jeder Aktualisierung der Ingress-Annotation neu erzeugt werden können.

**Ausnahme:** Bereits produktiv genutzte Hostnamen (mit gültigem
Produktionszertifikat) sind von der Staging-Pflicht befreit – hier wird nur
der Erneuerungs-Flow von cert-manager durchlaufen.

### Skriptfunktion `switch_certificate_issuer()`

Die Funktion steuert den Wechsel des Ausstellers für alle Ingress-Ressourcen
im Cluster über die Annotation `cert-manager.io/cluster-issuer`. Sie ersetzt
die manuelle Einzelschritt-Durchführung aus dem verifizierten Ablauf.

**Ablauf der Funktion:**

1. **Ermittlung:** Alle Ingress-Ressourcen clusterweit per
   `kubectl get ingress --all-namespaces` abrufen.
2. **Staging-Phase:** Auf ALLE Ingresses die Annotation
   `cert-manager.io/cluster-issuer=letsencrypt-staging` setzen.
   Der `ingress-shim` erzeugt für jede Ingress mit `tls`-Block automatisch
   ein Certificate-Objekt.
3. **Staging-Verifikation:** Für jeden Ingress das erzeugte Zertifikat prüfen.
   Aussteller muss `(STAGING)` enthalten. Fehlgeschlagene Hosts werden
   gesammelt, die Funktion bricht nicht ab.
4. **Produktion-Phase:** NUR wenn alle Hosts die Staging-Verifikation
   bestanden haben: Annotation auf
   `cert-manager.io/cluster-issuer=letsencrypt-prod` setzen.
5. **Produktion-Verifikation:** Erneute Prüfung aller Zertifikate.
   Aussteller darf keinen `(STAGING)`-Zusatz mehr enthalten.
6. **Report:** Liste der erfolgreichen und fehlgeschlagenen Hosts ausgeben.
   Bei Fehlschlag einzelner Hosts kein Abbruch des Gesamtdurchlaufs.

**Rate-Limit-Hinweis:** Let's Encrypt erlaubt 50 Zertifikate pro registrierter
Domain pro Woche. Bei ca. 10 Hosts ist das unkritisch. Die Funktion loggt
dennoch einen Hinweis vor der Produktion-Phase.

**Idempotenz:** Vor dem Setzen der Annotation wird geprüft, ob die
Ingress-Ressource bereits die gewünschte Annotation trägt (Abgleich
`cert-manager.io/cluster-issuer`). Ist sie bereits korrekt eingestellt,
wird die Ingress übersprungen.

> **Hinweis:** Dieser Ablauf dient der isolierten Erstverifikation eines einzelnen Issuers/Hosts. Für die produktive Umstellung aller Hosts wird ausschließlich `switch_certificate_issuer()` bzw. die Ingress-Annotation (`cert-manager.io/cluster-issuer`) verwendet, nicht die manuelle Certificate-Objekt-Erstellung.

### Verifizierter Ablauf (Staging → Produktion)

Der folgende Ablauf wurde am 2026-07-04 live gegen den Cluster getestet
und ist produktiv im Einsatz.

**SCHRITT 1: Richtigen Ingress identifizieren**

```bash
kubectl get ingress --all-namespaces
```

Daraus den Ziel-Host und Ziel-Namespace ablesen (z. B. `idm.udp.data-dna.eu`
in Namespace `cc-prd-access-stack`, Ingress-Name `idmkeycloak`).

**SCHRITT 2: ClusterIssuer und Test-Certificate anlegen**

```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@data-dna.eu
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
    - http01:
        ingress:
          ingressClassName: nginx
EOF

kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: test-le-staging
  namespace: cc-prd-access-stack
spec:
  secretName: test-le-staging-tls
  issuerRef:
    name: letsencrypt-staging
    kind: ClusterIssuer
  dnsNames:
  - idm.udp.data-dna.eu
EOF
```

**SCHRITT 3: Staging-Ergebnis prüfen**

```bash
kubectl describe certificate test-le-staging -n cc-prd-access-stack
kubectl describe challenge -n cc-prd-access-stack

kubectl get secret test-le-staging-tls -n cc-prd-access-stack \
  -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -issuer -subject
```

**Erwartung:** `issuer` enthält `(STAGING)`. Wenn ja, mit Schritt 4
fortfahren. Wenn nein, Challenge-Status prüfen und Fehler beheben, bevor
weitergemacht wird.

**CLEANUP (nach erfolgreicher Staging-Verifikation):**
Das Test-Certificate-Objekt und das zugehörige Secret werden gelöscht,
damit keine verwaisten Ressourcen zurückbleiben:

```bash
kubectl delete certificate test-le-staging -n cc-prd-access-stack
kubectl delete secret test-le-staging-tls -n cc-prd-access-stack
```

**SCHRITT 4: Produktives Zertifikat holen**

Analog zu Schritt 2, aber:
- `ClusterIssuer`-Name: `letsencrypt-prod`
- `server`: `https://acme-v02.api.letsencrypt.org/directory`
- `privateKeySecretRef.name`: `letsencrypt-prod-key`
- Certificate-Objekt zeigt auf `issuerRef.name: letsencrypt-prod`
- `dnsNames`: der tatsächliche Produktions-Host (nicht mehr `test-le-...`,
  sondern das echte Certificate-Objekt bzw. die Ingress-Annotation
  `cert-manager.io/cluster-issuer=letsencrypt-prod` auf der Ziel-Ingress
  aus Schritt 1 setzen)

**Wichtiger Hinweis:** Certificate-Objekte, die über eine Ingress-Annotation
vom `ingress-shim`-Controller automatisch erzeugt werden (erkennbar an
`Owner Reference: Kind Ingress`), dürfen NICHT per `kubectl patch certificate`
direkt verändert werden – der Controller setzt das sofort zurück. Die Steuerung
erfolgt über:

```bash
kubectl annotate ingress <name> -n <namespace> \
  cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite
```

## Offene Entscheidungen

- ~~Ist eine externe Erreichbarkeit des Plugins erforderlich?~~ → **Ja, über zwei parallele Proxy-Pfade**
- ~~Erfolgt die TLS-Terminierung in OPNsense oder in der Plugin-VM?~~ → **Beides: data-dna.eu über Caddy, udp.data-dna.eu über nginx/cert-manager in der VM**
- ~~Wird ein separater DNS-Eintrag für die interne Kommunikation benötigt?~~ → **Nein, WireGuard-Tunnel ersetzt internes DNS**
- ~~**Migrationstermin**~~ → **HAProxy ist seit dem zweiten Installationsdurchlauf aktiv. Die CIVITAS/CORE-Endpunkte laufen unter `udp.data-dna.eu` über den HAProxy-TCP-Passthrough.**
- ~~**cert-manager Let's-Encrypt-Issuer**~~ → **✅ Verifiziert – Ablauf (Staging → Produktion) siehe Variante E, Schritte 1–4. Staging-Zertifikat am 2026-07-04 erfolgreich getestet. Produktive Ausstellung über `cert-manager.io/cluster-issuer=letsencrypt-prod`-Annotation auf dem Ziel-Ingress.**

## Getroffene Entscheidungen

Die folgenden Entscheidungen sind gefallen und verbindlich:

- **HAProxy als zentraler Einstiegspunkt (Port 443)**: Der HAProxy auf OPNsense
  empfangt eingehenden TLS-Traffic auf Port 443 und routet per SNI:
  - `*.udp.data-dna.eu` → TCP-Passthrough an `10.10.10.5:443` (nginx in der VM
    terminiert TLS mit cert-manager-Zertifikaten)
  - Alle anderen Domains (`*.data-dna.eu`) → Weiterleitung an Caddy
    (Port 8443 HTTPS / 8080 HTTP)
- **Caddy-Ports**: Caddy lauscht nicht mehr auf Port 443, sondern auf
  Port 8443 (HTTPS) und Port 8080 (HTTP f&uuml;r Let's-Encrypt-HTTP-01-Challenges).
  Die Weiterleitung erfolgt durch HAProxy.
- **TLS in der VM (CIVITAS/CORE)**: F&uuml;r `*.udp.data-dna.eu` terminiert nginx
  in der VM das TLS selbstst&auml;ndig mit Zertifikaten von cert-manager
  (Variante E: Gateway API HTTP-01). Der HAProxy leitet den TCP-Strom
  1:1 durch (Layer 4, kein TLS-Eingriff).
- **Caddy-TLS (bestehende Dienste)**: F&uuml;r `*.data-dna.eu` terminiert Caddy
  weiterhin TLS mit Let's-Encrypt-Zertifikaten. Die ACME-HTTP-01-Challenge
  l&auml;uft &uuml;ber HAProxy (Port 8080 → Caddy Port 8080).
- **ssl-redirect**: Der globale `ssl-redirect` im nginx-ConfigMap steht auf
  `true` (Helm-Default). Da nginx TLS selbst terminiert, ist der HTTP-zu-HTTPS-
  Redirect korrekt und erw&uuml;nscht. Der fr&uuml;here Workaround (`ssl-redirect=false`)
  entf&auml;llt mit der HAProxy-Architektur.
- **Ingress-tls-Sektion**: Ingress-Ressourcen unter `*.udp.data-dna.eu` behalten
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
- **Domain (Ist-Stand)**: Der deployete Basisdomainname lautet `udp.data-dna.eu`.
  Die Variablen `DOMAIN` in `01_config.sh` und alle `PLACEHOLDER_DOMAIN`-Stellen
  im Inventory-Template sind auf `udp.data-dna.eu` gesetzt.
  Die CIVITAS/CORE-Endpunkte sind damit `idm.udp.data-dna.eu` (Keycloak) und
  `udp.data-dna.eu` (Service Portal).
- **Hetzner DNS**: Vor Phase 2 m&uuml;ssen folgende A-Records in der Hetzner-WebGUI
  manuell angelegt sein (das Skript legt keine DNS-Records an):
  - `udp.data-dna.eu` → OPNsense WAN-IP
  - `idm.udp.data-dna.eu` → OPNsense WAN-IP
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
- cert-manager stellt Zertifikate per Gateway API HTTP-01 (Variante E) aus.
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
                └── SNI: *.udp.data-dna.eu (CIVITAS/CORE)
                      → HAProxy (TCP-Passthrough) → VM:443 → nginx (TLS-Ende)
```

- **Caddy** (auf Port 8443/8080) ist für alle bestehenden `*.data-dna.eu`-Dienste
  zuständig (p2d2-Frontend, GeoServer, etc.). Der ACME-HTTP-01-Pfad für
  Let's-Encrypt-Erneuerung läuft über HAProxy (Port 8080 → Caddy Port 8080).
- **HAProxy** übernimmt per SNI-Routing die `*.udp.data-dna.eu`-Domains
  (CIVITAS/CORE) als TCP-Passthrough ohne TLS-Eingriff. Die Zertifikate
  stellt cert-manager in der VM aus.

### Status der umgesetzten Schritte

| Schritt | Status |
|---|---|
| HAProxy auf OPNsense konfigurieren (SNI-Rule, TCP-Passthrough zu `10.10.10.5:443`) | ✅ Umgesetzt |
| Caddy-Ports auf 8443/8080 umgestellt | ✅ Umgesetzt |
| ACME-HTTP-01-Route über HAProxy (8080 → Caddy 8080) | ✅ Umgesetzt |
| DNS-Einträge für `*.udp.data-dna.eu` auf OPNsense WAN-IP | ✅ Umgesetzt |
| `ssl-redirect=true` im nginx-ConfigMap (Default) | ✅ Umgesetzt |
| `inv_checks.enable: true` im Inventory | ⬜ Noch im Template zu setzen |
| Let's-Encrypt-Produktions-Issuer (letsencrypt-prod) | ✅ Geklärt – Ablauf siehe Variante E, Schritte 1–4 |

### Nächste Schritte

1. `inv_checks.enable: true` im Inventory-Template setzen (nach erfolgreichem Testlauf)
2. Let's-Encrypt-Produktions-Issuer (letsencrypt-prod) gemäß Variante E (Gateway API HTTP-01) aktivieren, nachdem die Staging-vor-Produktion-Pflicht für den jeweiligen Hostnamen erfüllt ist

***

## Risiken

- Bei fehlender Netzsegmentierung kann die Plugin-VM potenziell auf alle internen Dienste zugreifen. Dies erfordert eine nachgelagerte Firewall-Regelung innerhalb des VLANs.
- Eine spätere Änderung der IP-Adresse oder des Netzsegments zieht Anpassungen in OPNsense, DNS und ggf. im Kubernetes-Cluster nach sich.
