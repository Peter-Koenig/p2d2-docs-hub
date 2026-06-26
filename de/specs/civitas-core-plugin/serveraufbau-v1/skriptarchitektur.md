---
title: Skriptarchitektur
description: Modulaufbau, Konventionen, Idempotenz-Strategie und Konfigurationsstruktur des CIVITAS/CORE-Installationsskripts nach dem create_sdt_02-Muster.
status: draft
lastUpdated: 2026-06-24
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-skriptarchitektur
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-zielbild
  - civitas-core-plugin-serveraufbau-vm-sizing
  - civitas-core-plugin-serveraufbau-netzwerk
  - civitas-core-plugin-serveraufbau-kubernetes-laufzeit
  - civitas-core-plugin-serveraufbau-installationsphasen-und-abnahme
quality:
  completeness: 80
  accuracy: 95
  reviewed: false
  reviewer:
  reviewDate:
---

# Skriptarchitektur

## Ziel

Dieses Dokument legt den Aufbau des CIVITAS/CORE-Installationsskripts fest:
Dateistruktur, Modulschnitt, Konventionen, Idempotenz-Strategie und
Konfigurationsverantwortung. Es bildet die letzte Spec-Grundlage vor dem
eigentlichen Skriptbau.

Als Vorbild dient das bewährte `create_sdt_02.sh`-Muster aus dem Projekt:
Phasenkontrolle, Trennung von Konfiguration / Bibliothek / Deployment /
Verifikation, zentrale Log-Funktion und Fehlercount am Ende.

***

## Repository und Ablageort

Das Installationsskript wird im Repository `civitas_einrichtung` abgelegt:

```
/srv/p2d2/repos/civitas_einrichtung/
├── install_civitas_core.sh          ← Entry-Point, Phasenmodell, Orchestrierung
├── modules/
│   ├── 00_provision_vm.sh           ← Phase -1: VM-Provisionierung
│   ├── 01_config.sh                 ← Alle Konfigurationsvariablen
│   ├── 02_lib.sh                    ← Hilfsfunktionen (log, check, wait, …)
│   ├── 03_preflight.sh              ← Phase 0: Vorbedingungsprüfungen
│   ├── 04_k3s.sh                    ← Phase 1a: k3s installieren
│   ├── 05_addons.sh                 ← Phase 1b: helm, cert-manager, CA-Issuer (3-stufig), CA-Trust, nginx
│   ├── 06_civitas.sh                ← Phase 2: cc-cli, config.yaml, deploy
│   └── 07_verify.sh                 ← Phase 3: Verifikation, Fehlerreport
├── templates/
│   ├── config.yaml.tpl              ← cc-cli-Konfigurationsvorlage
│   └── wg0.conf.tpl                 ← WireGuard-Konfigurationsvorlage
└── .env.example                     ← Beispiel für Umgebungsvariablen (kein Secret)
```

> **Hinweis**: Secrets (SMTP-Passwort, Admin-Passwort, WireGuard-Schlüssel) werden **nie** in
> Dateien im Repository abgelegt. Sie werden als Umgebungsvariablen vor
> dem Skriptaufruf gesetzt:
> ```bash
> export SMTP_PASS="..."
> export ADMIN_PASS="..."
> export WG_VM_PRIVATE_KEY="..."
> ./install_civitas_core.sh
> ```

***

## Entry-Point: `install_civitas_core.sh`

Der Entry-Point lädt alle Module in definierter Reihenfolge, ruft die
Phasenfunktionen auf und gibt am Ende einen Gesamtstatus aus.

### Struktur

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Module laden
source "${SCRIPT_DIR}/modules/01_config.sh"
source "${SCRIPT_DIR}/modules/02_lib.sh"
source "${SCRIPT_DIR}/modules/00_provision_vm.sh"
source "${SCRIPT_DIR}/modules/03_preflight.sh"
source "${SCRIPT_DIR}/modules/04_k3s.sh"
source "${SCRIPT_DIR}/modules/05_addons.sh"
source "${SCRIPT_DIR}/modules/06_civitas.sh"
source "${SCRIPT_DIR}/modules/07_verify.sh"

# Phasen ausführen
provision_vm        # Phase -1: VM erstellen (auf Proxmox-Host)
run_preflight        # Phase 0
install_k3s          # Phase 1a
install_addons       # Phase 1b
install_civitas      # Phase 2
run_verification     # Phase 3
```

### Konventionen

- `set -euo pipefail` ist verbindlich. Kein Modul darf diese Einstellung
  aufheben.
- Jede Phase ist eine Funktion mit klar definiertem Namen und
  Rückgabeverhalten.
- Der Entry-Point enthält keine Geschäftslogik — nur Laden und Aufrufen.
- **`ROOT_PASSWORD`** muss vor dem Skriptaufruf als Umgebungsvariable gesetzt
  sein. Ohne diesen Wert bricht das Skript bereits beim Laden von `01_config.sh`
  mit einer Fehlermeldung ab.
- **Das Skript wird als `root` ausgeführt** (oder via `sudo`). Der kubeconfig-Pfad
  (`KUBECONFIG_PATH`) bezieht sich auf das Homeverzeichnis des root-Users
  (`/root/.kube/config`). Die Berechtigung der kubeconfig-Datei wird mit
  `install -m 600` gesetzt, sodass nur root lesen darf.

***

## Modul 01 — Konfiguration (`01_config.sh`)

Alle konfigurierbaren Parameter werden hier zentral definiert. Kein anderes
Modul darf Werte hardcoden, die sich zwischen Installationen unterscheiden
könnten.

### Variablen

```bash
# ── Versionspinning ──────────────────────────────────────────────────────────
K3S_VERSION="v1.32.3+k3s1"         # Beim Skriptbau aus k3s-Release-Doku fixieren
HELM_VERSION="v3.17.0"             # Beim Skriptbau aus Helm-Release-Doku fixieren
CC_CLI_VERSION="1.5.0"              # cc-cli — aus GitLab Package Registry
CC_CLI_REGISTRY_URL="https://gitlab.com/api/v4/projects/62227605/packages/pypi/simple"
CC_CLI_VENV_PATH="/opt/civitas-core-venv"
CC_CLI_REPO_URL="https://gitlab.com/civitas-connect/civitas-core/civitas-core-v1/civitas-core.git"  # CIVITAS/CORE V1 Repository
CC_CLI_REPO_PATH="/opt/civitas-core-v1"     # Dauerhafter Workspace auf der VM (nicht /tmp)
CC_CLI_SYMLINK_PATH="/opt/civitas-core"     # Symlink auf die aktive Version
CERT_MANAGER_VERSION="v1.16.0"     # Beim Skriptbau aus cert-manager-Release-Doku fixieren
NGINX_INGRESS_VERSION="4.12.0"    # Beim Skriptbau aus ingress-nginx-Helm-Chart-Doku fixieren

# ── Plattform ────────────────────────────────────────────────────────────────
DOMAIN="civitas.data-dna.eu"       # Offener Punkt: Freigabe durch Peter König
K8S_NAMESPACE="civitas-core"
KUBECONFIG_PATH="${HOME}/.kube/config"
export KUBECONFIG="${KUBECONFIG_PATH}"
K3S_DATA_DIR="/var/lib/rancher/k3s"

# ── k3s-Installationsoptionen ────────────────────────────────────────────────
# Traefik wird deaktiviert (nginx-Ingress wird nachinstalliert).
# local-path-provisioner bleibt aktiv (Default-StorageClass).
# servicelb und metrics-server bleiben aktiv (Standard k3s).
K3S_EXEC_ARGS="--disable traefik"

# ── Add-ons ──────────────────────────────────────────────────────────────────
CERT_MANAGER_NAMESPACE="cert-manager"
INGRESS_NAMESPACE="ingress-nginx"

# ── SMTP (Werte aus Umgebungsvariablen — nie hardcoden) ──────────────────────
SMTP_HOST="${SMTP_HOST:?'SMTP_HOST muss als Umgebungsvariable gesetzt sein'}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:?'SMTP_USER muss als Umgebungsvariable gesetzt sein'}"
SMTP_PASS="${SMTP_PASS:?'SMTP_PASS muss als Umgebungsvariable gesetzt sein'}"

# ── Admin (Wert aus Umgebungsvariable) ───────────────────────────────────────
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@data-dna.eu}"

# ── Timeouts ─────────────────────────────────────────────────────────────────
TIMEOUT_CC_CLI_EXEC=600            # Sekunden
TIMEOUT_POD_READY=300              # Sekunden für kubectl wait

# ── Netzwerk ─────────────────────────────────────────────────────────────────
SOHO_GATEWAY="${SOHO_GATEWAY:-192.168.1.1}"   # Anpassen an lokale Topologie
```

> **Versionspinning-Regel**: Alle `*_VERSION`-Variablen werden beim ersten
> Skriptbau auf konkrete Werte gesetzt und danach nur durch bewusste
> Wartungsaktionen aktualisiert. Niemals `latest` verwenden.

***

## Pflicht-Umgebungsvariablen (Env-Vars)

Alle nachfolgenden Variablen müssen vor dem Skriptaufruf als
Umgebungsvariablen gesetzt sein. Sie werden in `01_config.sh` mit
`${VAR:?Fehlermeldung}` geprüft. Das Skript bricht beim Laden von
`01_config.sh` sofort ab, wenn eine Variable fehlt oder leer ist.

| Variable | Beschreibung | Beispielwert / Hinweis |
|---|---|---|
| `ROOT_PASSWORD` | root-Passwort der VM | Sicheres Zufallspasswort |
| `SMTP_PASS` | SMTP-Passwort für no-reply@data-dna.eu | Aus netcup WCP |
| `ADMIN_PASS` | Keycloak Initial-Admin-Passwort | Sicheres Zufallspasswort, min. 12 Zeichen |
| `WG_VM_PRIVATE_KEY` | WireGuard PrivateKey der VM (`wg genkey`) | Base64-String, 44 Zeichen |
| `WG_OPN_PUBLIC_KEY` | WireGuard PublicKey von OPNsense (`wg pubkey`) | Base64-String, 44 Zeichen |
| `WG_PRESHARED_KEY` | WireGuard PreSharedKey (`wg genpsk`) | **Optional** — leer lassen wenn nicht verwendet |
| `WG_OPN_ENDPOINT` | Öffentliche IP:Port der OPNsense-WireGuard-Instanz | z. B. `1.2.3.4:51820` |

> **Hinweis zu `WG_PRESHARED_KEY`**: Diese Variable ist optional und wird mit
> `${WG_PRESHARED_KEY:-}` ohne Abbruch gelesen. Ist sie leer, wird die
> Zeile `PreSharedKey` in der erzeugten `wg0.conf` entfernt, da WireGuard
> bei leerem Schlüssel einen Fehler wirft.

***

## Modul 02 — Bibliothek (`02_lib.sh`)

Enthält alle wiederverwendbaren Hilfsfunktionen. Keine Installationslogik,
keine Seiteneffekte beim Laden.

### Pflichtfunktionen

```bash
# Zeitgestempeltes Logging
log()        { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
log_ok()     { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ $*"; }
log_warn()   { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠ $*" >&2; }
log_error()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ $*" >&2; }

# Idempotenz-Hilfsfunktionen
is_installed()   { command -v "$1" &>/dev/null; }
systemd_active() { systemctl is-active --quiet "$1"; }
k8s_ready()      { kubectl get "$1" "$2" -n "${3:-default}" &>/dev/null; }

# Netzwerk-Prüfungen
tcp_reachable()  { timeout 5 bash -c "echo >/dev/tcp/${1}/${2}" &>/dev/null; }
dns_resolves()   { dig +short "$1" | grep -q '.'; }

# Warteschleife für Kubernetes-Pods
wait_pods_ready() {
  local namespace="$1"
  local timeout="${2:-$TIMEOUT_POD_READY}"
  kubectl wait --for=condition=Ready pods --all \
    -n "$namespace" --timeout="${timeout}s"
}

# Fehlercount-Mechanismus für Phase 3
VERIFY_ERRORS=0
check() {
  local description="$1"
  local result="$2"   # 0 = OK, ≠ 0 = FAILED
  if [[ "$result" -eq 0 ]]; then
    log_ok "[VERIFY] ${description} ... OK"
  else
    log_error "[VERIFY] ${description} ... FAILED"
    (( VERIFY_ERRORS++ )) || true
  fi
}
```

### Passwort-Generierung nach Policy

```bash
# Erzeugt ein policy-konformes Passwort:
#   - mind. 12 Zeichen (konfigurierbar via $1)
#   - mind. 1 Ziffer
#   - mind. 1 Großbuchstabe
#   - mind. 1 Kleinbuchstabe
#   - mind. 1 Sonderzeichen aus: !@#$%^&*()-_
#   - KEINE base64-Sonderzeichen (+, /, =)
gen_policy_password() {
  local length="${1:-24}"
  local charset='A-Za-z0-9!@#$%^&*()\-_'
  local pw
  while true; do
    pw="$(tr -dc "${charset}" < /dev/urandom | head -c "${length}" || true)"
    if echo "${pw}" | grep -qP '(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*()\-_])'; then
      echo "${pw}"
      return 0
    fi
  done
}
```

> **Verwendung**: Wird in `render_inventory()` (Modul 06) für alle automatisch
> generierten Komponenten-Passwörter verwendet (PGAdmin, APISIX, Superset,
> Grafana, GeoServer, Piveau). Das von außen gesetzte `ADMIN_PASS` (Keycloak)
> muss die Policy ebenfalls erfüllen – wird in `render_inventory()` geprüft.

***

## Modul 03 — Vorbedingungen (`03_preflight.sh`)

Implementiert `run_preflight()` gemäß den Prüfungen aus
`installationsphasen-und-abnahme.md`, Phase 0.

### Struktur

```bash
run_preflight() {
  log "=== Phase 0: Vorbedingungen ==="

  check_os
  check_cpu
  check_ram
  check_disk
  check_swap
  check_network
  check_dns_warn          # Warnung, kein Abbruch
  check_tools             # curl, python3, pip3
  check_smtp
  check_k3s_version       # Idempotenz: bereits korrekte Version → OK
}
```

### Idempotenz-Regel für Phase 0

Ist k3s bereits installiert und die Version stimmt mit `$K3S_VERSION` überein,
gibt `check_k3s_version()` OK zurück und setzt ein Flag
`K3S_ALREADY_INSTALLED=true`, das die Installationsfunktion in Modul 04
überspringt. Stimmt die Version nicht überein, bricht das Skript mit einem
Fehler ab — automatische Upgrades sind nicht vorgesehen.

***

## Modul 04 — k3s (`04_k3s.sh`)

Implementiert `install_k3s()`. Installiert k3s in der konfigurierten Version
mit den festgelegten Startparametern.

### Ablauf

```bash
install_k3s() {
  log "=== Phase 1a: k3s ==="

  if systemd_active k3s; then
    log_ok "k3s bereits aktiv — überspringe Installation"
    return 0
  fi

  log "Installiere k3s ${K3S_VERSION} ..."
  curl -sfL https://get.k3s.io \
    | INSTALL_K3S_VERSION="${K3S_VERSION}" \
      INSTALL_K3S_EXEC="${K3S_EXEC_ARGS}" \
      sh -

  # kubeconfig bereitstellen
  mkdir -p "$(dirname "${KUBECONFIG_PATH}")"
  install -m 600 /etc/rancher/k3s/k3s.yaml "${KUBECONFIG_PATH}"

  # Warten bis Node Ready
  kubectl wait node --all --for=condition=Ready --timeout=120s
  log_ok "k3s installiert und Node Ready"
}
```

***

## Modul 05 — Add-ons (`05_addons.sh`)

Implementiert `install_addons()`. Installiert in dieser Reihenfolge:
helm-CLI, cert-manager, Bootstrap-Issuer, Root-CA-Certificate, produktiver
ClusterIssuer, CA-Trust-Integration (System- + certifi-Store) und
nginx-Ingress. Storage Class ist durch k3s bereits vorhanden.

### Reihenfolge und Idempotenz

```bash
install_addons() {
  log "=== Phase 1b: Add-ons ==="

  install_helm
  install_cert_manager
  # Warten bis cert-manager-Webhook Ready ist, sonst Race-Condition bei CRDs
  kubectl wait pods --all -n "${CERT_MANAGER_NAMESPACE}" \
    --for=condition=Ready --timeout=120s
  configure_bootstrap_issuer            # Stufe 1: selfsigned Bootstrap
  create_root_ca_certificate            # Stufe 2: Root-CA mit commonName
  configure_production_issuer           # Stufe 3: produktiver ClusterIssuer mit CA-Ref
  configure_ca_trust                    # System-Store + certifi
  install_nginx_ingress
  verify_storage_class
}
```

| Funktion | Idempotenz-Prüfung |
|---|---|
| `install_helm` | `is_installed helm && helm version | grep $HELM_VERSION` |
| `install_cert_manager` | `k8s_ready deployment cert-manager cert-manager` |
| `configure_bootstrap_issuer` | `kubectl get clusterissuer civitas-bootstrap-selfsigned` |
| `create_root_ca_certificate` | `kubectl get certificate civitas-core-ca -n cert-manager` → READY=True |
| `configure_production_issuer` | `kubectl get clusterissuer selfsigned-issuer` → READY=True |
| `configure_ca_trust` | `openssl x509 -in /usr/local/share/ca-certificates/civitas-core-ca.crt -noout -issuer \| grep -q "CN=civitas-core-ca"` |
| `install_nginx_ingress` | `k8s_ready deployment ingress-nginx-controller ingress-nginx` |
| `verify_storage_class` | `kubectl get storageclass local-path` |

> **helm-CLI**: Die `helm`-CLI wird separat installiert. Das `get-helm-3`-Skript
> unterstützt kein Version-Pinning, daher wird das Binary direkt von GitHub
> Releases bezogen:
> ```bash
> curl -LO "https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz"
> tar -zxvf "helm-${HELM_VERSION}-linux-amd64.tar.gz"
> install linux-amd64/helm /usr/local/bin/helm
> rm -rf linux-amd64 "helm-${HELM_VERSION}-linux-amd64.tar.gz"
> ```
> k3s bringt nur den `helm-controller` für deklarative Helm-Deployments
> via Kubernetes-Ressourcen, nicht die interaktive CLI.
> 
> **Helm-Idempotenz**: Alle Helm-Installationen verwenden `helm upgrade --install`
> statt `helm install`. `helm upgrade --install` legt das Chart beim ersten Aufruf
> an und aktualisiert es bei erneuten Aufrufen – damit ist die Idempotenz auf
> Helm-Ebene sichergestellt, ohne dass eine separate Prüfung nötig ist.

### CA-Issuer (3-stufig, self-signed-CA für Entwicklung/Evaluation)

Java-basierte Komponenten (Frost-Server, Apache Tomcat) lehnen Zertifikate
mit leerem Issuer-DN ab (`CertificateParsingException: Empty issuer DN not
allowed in X509Certificates`). Ein reiner `selfSigned: {}`-Issuer stellt
solche leeren Zertifikate aus. Daher wird ein zweistufiges CA-Setup
verwendet:

| Stufe | Funktion | Ressource | Beschreibung |
|---|---|---|---|
| 1 | `configure_bootstrap_issuer()` | `ClusterIssuer civitas-bootstrap-selfsigned` | `spec: selfSigned: {}` — nur zur Ausstellung des Root-CA-Zertifikats |
| 2 | `create_root_ca_certificate()` | `Certificate civitas-core-ca` (namespace `cert-manager`) | `commonName: "civitas-core-ca"`, `subject.organizations: ["civitas-core"]` |
| 3 | `configure_production_issuer()` | `ClusterIssuer selfsigned-issuer` | `spec: ca: secretName: civitas-core-ca-secret` |

Der Name `selfsigned-issuer` bleibt erhalten, da das cc-cli-Inventory
diesen Namen im Feld `cert_manager.issuer_name` erwartet.

```yaml
# Stufe 1: Bootstrap-Issuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: civitas-bootstrap-selfsigned
spec:
  selfSigned: {}
---
# Stufe 2: Root-CA-Zertifikat
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: civitas-core-ca
  namespace: cert-manager
spec:
  commonName: "civitas-core-ca"
  organization:
    - "civitas-core"
  isCA: true
  duration: 87600h  # 10 Jahre
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: civitas-bootstrap-selfsigned
    kind: ClusterIssuer
---
# Stufe 3: Produktiver ClusterIssuer mit CA-Referenz
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  ca:
    secretName: civitas-core-ca-secret
```

### CA-Trust-Integration (`configure_ca_trust()`)

Das Root-CA-Zertifikat muss nach der Ausstellung in zwei Stores
eingetragen werden, damit TLS-Verbindungen innerhalb der VM ohne
`--insecure` oder `CERTIFICATE_VERIFY_FAILED` funktionieren:

1. **System-Store** (`update-ca-certificates`):
   ```bash
   kubectl get secret civitas-core-ca-secret -n cert-manager \
     -o jsonpath='{.data.ca\.crt}' | base64 -d \
     > /usr/local/share/ca-certificates/civitas-core-ca.crt
   update-ca-certificates
   ```

2. **Python-venv certifi** (für Ansible im venv):
   ```bash
   kubectl get secret civitas-core-ca-secret -n cert-manager \
     -o jsonpath='{.data.ca\.crt}' | base64 -d \
     >> ${CC_CLI_VENV_PATH}/lib/python*/site-packages/certifi/cacert.pem
   ```

Grund: Ansible im venv nutzt certifi als CA-Bundle, nicht den System-Store.
Ohne diesen Schritt scheitert `cc_cli exec` mit `CERTIFICATE_VERIFY_FAILED`.

> **Hinweis**: Bei einem erneuten Skriptdurchlauf (Idempotenz) prüft
> `configure_ca_trust()`, ob das CA-Cert bereits im System-Store vorhanden
> ist (via `openssl x509 -in ... -noout -issuer | grep "CN=civitas-core-ca"`).
> Ist es vorhanden, wird der Schritt übersprungen. Der certifi-Eintrag wird
> ebenfalls nur bei Bedarf ergänzt (Prüfung via `grep "civitas-core-ca"`).

> **nginx-Ingress-Ports**: Der nginx-Ingress-Controller wird mit `hostNetwork=true`
> als DaemonSet installiert und lauscht auf HTTP-Port 80 und HTTPS-Port 443. Port 443
> wird für den HAProxy-TCP-Passthrough genutzt: nginx terminiert TLS mit
> cert-manager-Zertifikaten (siehe netzwerk-dns-tls.md, Variante D).
> Der Kubernetes-Service ist deaktiviert (`service.enabled=false`), da mit
> `hostNetwork=true` der Controller direkt auf dem Host-Netzwerk bindet.
> Konfiguration im Values-File:
> ```yaml
> controller:
>   hostNetwork: true
>   kind: DaemonSet
>   service:
>     enabled: false
> ```

***

## Modul 06 — CIVITAS/CORE (`06_civitas.sh`)

Implementiert `install_civitas()`. Phase 2 ist vollständig
distributionsunabhängig.

### Ablauf

```bash
install_civitas() {
  log "=== Phase 2: CIVITAS/CORE ==="

  check_dns_hard              # Harte Prüfung — Abbruch bei Fehler

  install_cc_cli              # Schritt 2.1
  setup_repo_workspace        # Schritt 2.2: Repository klonen, Symlink anlegen
  render_inventory            # Schritt 2.3: Inventory in Repo-Verzeichnis rendern
  check_repo_prerequisites    # Schritt 2.4: Schema + Playbook-Struktur prüfen
  run_cc_cli_validate         # Schritt 2.5: aus ${CC_CLI_REPO_PATH}
  setup_wireguard             # vor cc_cli exec — Health-Check braucht Route
  run_cc_cli_exec             # Schritt 2.6: aus ${CC_CLI_REPO_PATH}
  wait_pods_ready "${K8S_NAMESPACE}"  # Schritt 2.9
}
```

### TLS-Terminierung in der VM (HAProxy-TCP-Passthrough)

Die TLS-Terminierung erfolgt in der VM durch nginx, nicht mehr durch Caddy
auf OPNsense. Der HAProxy auf OPNsense leitet den TLS-Handshake per
TCP-Passthrough (Layer 4) 1:1 an `10.10.10.5:443` weiter. nginx terminiert
TLS mit Zertifikaten von cert-manager.

Daraus ergeben sich folgende Konsequenzen für das Skript:

1. **Kein Ingress-Patch erforderlich.** Die `tls`-Sektion in Ingress-Ressourcen
   bleibt erhalten – nginx benötigt sie zur TLS-Terminierung. Die Annotation
   `ssl-redirect=true` (Helm-Default) ist korrekt.
2. **`configure_nginx_ssl_redirect_off()` entfällt.** Der globale `ssl-redirect`
   im nginx-ConfigMap bleibt auf `true`. Anders als in der Caddy-Architektur
   kommt HTTPS direkt an nginx an – ein Redirect von HTTP auf HTTPS ist
   erwünscht.
3. **`inv_checks.enable: true`** im Inventory-Template. Die Ansible-Health-Checks
   durchlaufen den Pfad VM → WireGuard → OPNsense → HAProxy → TCP-Passthrough
   → VM:443 → nginx (TLS) → Service und erhalten HTTP 200.
4. **CA-Trust erforderlich.** Da cert-manager self-signed-CA-Zertifikate
   ausstellt (Variante C), muss das Root-CA-Cert im certifi-Bundle des
   venv eingetragen sein (Schritt 1.5d). Andernfalls scheitern die
   HTTPS-Health-Checks mit `CERTIFICATE_VERIFY_FAILED`.

> **Hinweis WireGuard-Reihenfolge**: `setup_wireguard` wird vor
> `run_cc_cli_exec` aufgerufen. Die Ansible-Health-Checks am Ende des
> Playbooks rufen die externen Endpunkte (`https://idm.${DOMAIN}/`) auf.
> Ohne WireGuard-Tunnel hat die VM keine Route zu OPNsense und die
> Health-Checks scheitern mit Timeout.

### cc-cli-Installation aus GitLab Package Registry

cc-cli wird nicht von PyPI, sondern aus der GitLab Package Registry des
CIVITAS/CORE-Projekts installiert. Die `requirements.txt` im Repository
zeigt die Quelle:

```
--index-url https://gitlab.com/api/v4/projects/62227605/packages/pypi/simple
cc-cli==1.5.0
```

Quelle: https://gitlab.opencode.de/civitas-connect/civitas-core/-/blob/main/requirements.txt

Debian 13 (Trixie) aktiviert PEP 668 (`externally-managed-environment`),
daher erfolgt die Installation in einem isolierten Virtual Environment
unter `${CC_CLI_VENV_PATH}`. Alle cc_cli-Aufrufe in Phase 2 nutzen
den venv-Pfad.

**Pflichtpakete im venv** (`${CC_CLI_VENV_PATH}`):

```
cc-cli==1.5.0            # via GitLab Package Registry
ansible==10.6.0          # Ansible-Core + Collection-Paket
kubernetes               # Python-Client für k8s-Ansible-Module
```

`install_cc_cli()` installiert alle drei Pakete in einem einzigen pip-Aufruf:

```bash
"${CC_CLI_VENV_PATH}/bin/pip" install \
  --index-url "${CC_CLI_REGISTRY_URL}" \
  "cc-cli==${CC_CLI_VERSION}" \
  "ansible==10.6.0" \
  kubernetes
```

Anschließend werden Symlinks gesetzt, damit `ansible` und `ansible-playbook`
im PATH liegen (cc_cli ruft sie ohne venv-Prefix auf):

```bash
ln -sf "${CC_CLI_VENV_PATH}/bin/ansible"          /usr/local/bin/ansible
ln -sf "${CC_CLI_VENV_PATH}/bin/ansible-playbook" /usr/local/bin/ansible-playbook
ln -sf "${CC_CLI_VENV_PATH}/bin/ansible-galaxy"   /usr/local/bin/ansible-galaxy
```

Idempotenz: Symlinks werden mit `-sf` gesetzt (überschreiben bestehende Links).

### Inventory aus Template


Das Inventory `cc_cli_inventory.yml` wird aus `templates/inventory.yml.tpl` erzeugt.
Alle Platzhalter werden durch die Variablen aus `01_config.sh` ersetzt:

```bash
render_inventory() {
  log "Erzeuge Inventory aus Template …"

  local tpl="${SCRIPT_DIR}/templates_V1/inventory.yml.tpl"
  mkdir -p "${CC_CLI_REPO_PATH}"
  local out="${CC_CLI_REPO_PATH}/cc_cli_inventory.yml"

  if [[ ! -f "${tpl}" ]]; then
    log_error "Template nicht gefunden: ${tpl}"
    exit 1
  fi

  # Passwort-Generierung (ADMIN_PASS aus Env, restliche auto-generiert)
  # ...

  sed \
    -e "s|PLACEHOLDER_DOMAIN|${DOMAIN}|g" \
    -e "s|PLACEHOLDER_ENVIRONMENT|${CC_ENVIRONMENT:-cc-prd}|g" \
    -e "s|PLACEHOLDER_ADMINEMAIL|${ADMIN_EMAIL}|g" \
    -e "s|PLACEHOLDER_SMTP_HOST|${SMTP_HOST}|g" \
    -e "s|PLACEHOLDER_SMTP_USER|${SMTP_USER}|g" \
    -e "s|PLACEHOLDER_SMTP_PASS|${SMTP_PASS}|g" \
    -e "s|PLACEHOLDER_KEYCLOAK_ADMIN_PASSWORD|${pw_keycloak}|g" \
    # ... ca. 20 weitere Platzhalter für Secrets und Komponenten ...
    "${tpl}" > "${out}"

  CONFIG_YAML_PATH="${out}"
  export CONFIG_YAML_PATH
  log_ok "Inventory erzeugt: ${out}"
  log_warn "Inventory enthält Secrets im Klartext"
}
```

> Die erzeugte Inventory-Datei liegt unter `${CC_CLI_REPO_PATH}/cc_cli_inventory.yml`
> und enthält Secrets im Klartext. Sie wird nach `cc_cli exec` gelöscht
> (`trap 'rm -f "${CONFIG_YAML_PATH:-}"' EXIT`).
> Der Repository-Workspace under `${CC_CLI_REPO_PATH}` bleibt erhalten, da nur
> das Inventory gelöscht wird.

### Repository-Workspace

Dieser Abschnitt spezifiziert die Funktionen zur Bereitstellung des
CIVITAS/CORE-Repositorys als Playbook-Kontext für `cc_cli exec`.

#### Verantwortlichkeiten der Funktion `setup_repo_workspace()`

| Verantwortung | Beschreibung |
|---|---|
| Repository-Pfad sicherstellen | Zielverzeichnis `${CC_CLI_REPO_PATH}` anlegen, falls nicht vorhanden |
| Repository klonen | `git clone ${CC_CLI_REPO_URL} ${CC_CLI_REPO_PATH}` bei Erstinstallation |
| Repository aktualisieren | `git fetch` + `git checkout` / `git reset --hard` bei erneuten Läufen |
| Symlink anlegen | `ln -sf ${CC_CLI_REPO_PATH} ${CC_CLI_SYMLINK_PATH}` |

Die Idempotenz-Prüfung erfolgt auf Verzeichnisebene:
- Existiert `${CC_CLI_REPO_PATH}/.git` → aktualisieren
- Existiert nicht → klonen

#### Verantwortlichkeiten der Funktion `check_repo_prerequisites()`

Prüft vor `cc_cli validate`, dass der Repository-Kontext vollständig ist:

```bash
# Schema-Datei vorhanden (Referenz für validate)
test -f "${CC_CLI_REPO_PATH}/core_platform/inventory_schema.json"

# Erwartete Ansible-Verzeichnisstruktur
test -d "${CC_CLI_REPO_PATH}/ansible"

# Inventory liegt im Workspace
test -f "${CC_CLI_REPO_PATH}/cc_cli_inventory.yml"
```

Fehlschläge führen zum sofortigen Abbruch.

#### Arbeitsverzeichnis für cc_cli

- `render_inventory()` schreibt nach `${CC_CLI_REPO_PATH}/cc_cli_inventory.yml`
- `cc_cli validate` und `cc_cli exec` laufen mit `cd ${CC_CLI_REPO_PATH}`
- Das flüchtige `${CC_CLI_WORKDIR}` (`/tmp/civitas-core-deploy`) entfällt

#### Symlink für aktive Version

Der Symlink `/opt/civitas-core` zeigt auf das aktuell aktive
CIVITAS/CORE-Repository. Aktuell zeigt er auf `/opt/civitas-core-v1`
(V1). Bei einem zukünftigen Wechsel auf V2 wird der Symlink auf
`/opt/civitas-core-v2` umgebogen.

### Bekannte Stolperfallen

| Symptom | Ursache | Fix |
|---|---|---|
| `context "k3s" not found` | `inv_k8s.config.context: "k3s"` im Inventory | Wert auf `"default"` setzen (siehe cc-cli-inventar.md) |
| `HTTP 308` auf allen Endpunkten | `spec.tls` im Ingress vorhanden trotz `ssl-redirect=false` | `patch_ingress_for_external_tls()` entfernt `tls`-Sektion |
| `ModuleNotFoundError: kubernetes` im Ansible-Lauf | `kubernetes`-Pip-Paket fehlt im venv | In `install_cc_cli()` zusammen mit `ansible` installieren |
| Health-Check Timeout für externe URLs | WireGuard nicht aktiv vor `cc_cli exec` | `setup_wireguard` vor `run_cc_cli_exec` aufrufen |
| `Velero: access_key is required` in cc_cli validate | `velero.enable: true` mit leeren Credentials | Template-Default: `velero.enable: false` |
| `kubeconfig not found: ./config` | `kubeconfig_file: config` sucht relativ zum CWD | `cc_cli exec` ausschließlich aus `${CC_CLI_REPO_PATH}` aufrufen — ist bereits so spezifiziert |

***

## Modul 00 — VM-Provisionierung (`00_provision_vm.sh`)

Implementiert `provision_vm()`. Läuft auf dem Proxmox-Host und erstellt die
CIVITAS/CORE-VM aus einem Debian-13-Cloud-Image. Idempotenz: Wenn die VM
bereits existiert, wird die Provisionierung übersprungen.

### Ablauf

```bash
provision_vm() {
  log "=== Phase -1: VM provisionieren ==="

  if ! is_installed qm; then
    log_warn "Nicht auf Proxmox-Host — überspringe"
    return 0
  fi

  if qm status "${VM_ID}" &>/dev/null; then
    log_ok "VM ${VM_ID} existiert bereits — überspringe"
    return 0
  fi

  # Cloud-Image nach /tmp/${image_name} herunterladen (curl)
  download_cloud_image

  # VM mit qm create anlegen (12 vCPU, 40 GiB RAM, 300 GiB Disk)
  create_vm

  # Disk via qm importdisk einspielen und auf Zielgröße resizen
  import_and_resize_disk

  # Cloud-Init: root, SSH-Key, statische IPv4/IPv6
  configure_cloud_init

  # VM starten und auf SSH-Erreichbarkeit warten
  qm start "${VM_ID}"
  wait_for_ssh "${VM_IP_STATIC}"
}
```

### Konfigurationsvariablen (zusätzlich in `01_config.sh`)

| Variable | Beschreibung | Default |
|---|---|---|
| `VM_ID` | Proxmox VM-ID | `100` |
| `VM_NAME` | Anzeigename in Proxmox | `civitas-core` |
| `VM_RAM_MB` | RAM in MiB | `40960` |
| `VM_CORES` | vCPUs | `12` |
| `VM_DISK_GB` | Disk-Größe in GiB | `300` |
| `VM_BRIDGE` | Bridge-Interface | `vmbr0` |
| `PROXMOX_STORAGE` | Proxmox-Storage für VM-Disk | `local-zfs-civitas` |
| `CLOUD_IMAGE_URL` | URL zum Debian-13-Cloud-Image | `https://cloud.debian.org/…` |

### Idempotenz

- Cloud-Image wird nur einmal heruntergeladen (Prüfung: Datei existiert).
- VM wird nur erstellt, wenn `qm status $VM_ID` fehlschlägt.
- Bei erneuten Skriptdurchläufen wird die SSH-Erreichbarkeit unter der konfigurierten statischen IP geprüft.

### Secrets

- `ROOT_PASSWORD` wird aus der Umgebungsvariablen gelesen (in `01_config.sh`
  mit `:?`-Expansion geprüft). Keine Hartcodierung, kein Eintrag in Git.

***

## Modul 07 — Verifikation (`07_verify.sh`)

Implementiert `run_verification()`. Führt alle Abnahmeprüfungen aus Phase 1
und Phase 2 erneut aus und gibt einen zusammenfassenden Bericht aus.

Phase 2 arbeitet nicht mehr mit einem einzelnen Namespace (`K8S_NAMESPACE`),
sondern iteriert &uuml;ber das Array `K8S_NAMESPACES`, das aus `CC_ENVIRONMENT`
abgeleitet wird. F&uuml;r jeden Namespace werden gepr&uuml;ft:

- **Namespace existiert** im Cluster
- **Pods** im Namespace sind alle Running oder Completed (kein CrashLoopBackOff)
- **Ingress-Ressourcen** sind vorhanden (erwartet z. B. im access-stack)
- **TLS-Zertifikate** sind ausgestellt und READY (erwartet z. B. im access-stack)

Zus&auml;tzlich laufen Domain-Level-Pr&uuml;fungen (Keycloak, Portal via HTTPS)
und Infrastruktur-Pr&uuml;fungen (WireGuard-Tunnel, OPNsense-Konnektivit&auml;t)
einmalig, nicht pro Namespace.

### Ablauf

```bash
run_verification() {
  log "=== Phase 3: Verifikation ==="
  VERIFY_ERRORS=0

  verify_phase1
  verify_phase2
  report_result
}

report_result() {
  echo "------------------------------------------------------------"
  if [[ "$VERIFY_ERRORS" -eq 0 ]]; then
    log_ok "Alle Prüfungen bestanden. Installation erfolgreich."
    exit 0
  else
    log_error "${VERIFY_ERRORS} Prüfung(en) fehlgeschlagen."
    exit 1
  fi
}
```

***

## Idempotenz-Strategie

Jede Installationsfunktion folgt dem Muster:

```
PRÜFE ob Zielzustand bereits erreicht
  → JA:  log_ok "bereits vorhanden, überspringe"; return 0
  → NEIN: Aktion ausführen; Zielzustand erneut prüfen
```

Das Skript kann ohne Schaden mehrfach ausgeführt werden. Es verändert
keinen Zustand, der bereits korrekt ist. Fehlschläge bei bereits
installierten Komponenten entstehen nur, wenn die Version nicht zur
Konfiguration passt — das wird als Fehler (nicht als Warnung) behandelt.

***

## Fehler- und Signalbehandlung

```bash
# Am Anfang des Entry-Points
trap 'log_error "Unerwarteter Fehler in Zeile ${LINENO}. Abbruch."; exit 1' ERR
trap 'log_warn "Skript durch Signal unterbrochen."; exit 130' INT TERM
```

Zusätzlich bereinigt ein `EXIT`-Trap temporäre Dateien:

```bash
trap 'rm -f "${CONFIG_YAML_PATH:-}"' EXIT
```

***

## Logging

Alle Ausgaben gehen auf stdout. Fehler und Warnungen zusätzlich auf stderr.
Ein optionales Log-File kann über eine Umgebungsvariable aktiviert werden:

```bash
LOG_FILE="${LOG_FILE:-}"   # Leer = kein File-Logging

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg"
  [[ -n "$LOG_FILE" ]] && echo "$msg" >> "$LOG_FILE"
}
```

Aufruf mit File-Logging:
```bash
LOG_FILE=/var/log/civitas_install.log ./install_civitas_core.sh
```

***

## Umgebungsvariablen — Übersicht

| Variable | Pflicht | Default | Beschreibung |
|---|---|---|---|
| `SMTP_HOST` | ja | — | Aus Umgebung; fehlt → sofortiger Abbruch |
| `SMTP_USER` | ja | — | Aus Umgebung; fehlt → sofortiger Abbruch |
| `SMTP_PASS` | ja | — | Aus Umgebung; fehlt → sofortiger Abbruch |
| `SMTP_PORT` | nein | `587` | SMTP-Port |
| `ADMIN_EMAIL` | nein | `admin@data-dna.eu` | Initiale Admin-E-Mail |
| `SOHO_GATEWAY` | nein | `192.168.1.1` | Für Netzwerk-Erreichbarkeitsprüfung |
| `LOG_FILE` | nein | leer | Pfad für optionales File-Logging |

Alle anderen Parameter (Versionen, Domain, Namespaces) sind in
`01_config.sh` fest konfiguriert und werden nicht aus der Umgebung gelesen.

***

## Namenskonventionen

| Bereich | Konvention | Beispiel |
|---|---|---|
| Skript-Dateien | `NN_name.sh` (zweistellig, Unterstrich) | `04_k3s.sh` |
| Funktionsnamen | `snake_case` | `install_cert_manager()` |
| Konfigurationsvariablen | `UPPER_SNAKE_CASE` | `K3S_VERSION` |
| Lokale Variablen in Funktionen | `lower_snake_case` | `local tpl=...` |
| Template-Platzhalter | `{{UPPER_CASE}}` | `{{DOMAIN}}` |

Commits folgen dem Conventional-Commits-Format auf Englisch:
`feat`, `fix`, `chore`, `refactor`, `test`.

***

## Offene Punkte (für Skriptbau zu klären)

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Gast-OS | **Entschieden: Debian 13 (Trixie)** – Cloud-Image und OS-Check im Code | durch Code festgelegt |
| Domainname: `civitas.data-dna.eu`? | Offen | Peter König |
| `SOHO_GATEWAY`-Adresse | **Im Code gesetzt** auf `192.168.12.1` (01_config.sh, verwendet in 03_preflight.sh) | durch Code festgelegt |
| Konkrete Versionsnummern (k3s, helm, cert-manager, cc-cli) | **Gepinnt im Code** (01_config.sh) | durch Code festgelegt |
| TLS-Strategie: self-signed oder CA? | Offen | netzwerk-dns-tls.md |
| `servicelb` und `metrics-server`: deaktivieren? | Vorschlag: aktiv lassen | Skriptbau |
| Repository-Kontext für `cc_cli exec` (Playbook-Bereitstellung) | **Nächster Ausbauschritt** – derzeit nicht implementiert | Nach aktueller Spezifikation |

***

## Festlegungen

-1. Die VM-Provisionierung (Phase -1) erstellt die CIVITAS/CORE-VM auf dem
   Proxmox-Host aus einem Debian-13-Cloud-Image. Die Konfiguration der
   netzseitigen Erreichbarkeit (z. B. WireGuard-Tunnel, Reverse Proxy) ist
   organisationsspezifisch und nicht Gegenstand dieses Skripts. Das Paket
   `wireguard-tools` wird jedoch in Phase 0 automatisch installiert, sodass
   der WireGuard-Tunnel nach Bedarf konfiguriert werden kann.

0. Vor Phase 0 kann auf dem Proxmox-Host eine **Phase -1 (VM-Provisionierung)**
   ausgeführt werden. Diese erstellt die CIVITAS/CORE-VM aus dem Debian-13-
   Cloud-Image und ist idempotent (bestehende VM wird übersprungen).

1. Das Skript besteht aus einem Entry-Point (`install_civitas_core.sh`)
   und sieben Modulen in `modules/`.
2. Alle Konfiguration ist in `01_config.sh` zentralisiert. Kein anderes
   Modul enthält hardcodierte Werte.
3. Secrets werden ausschließlich als Umgebungsvariablen übergeben und
   niemals in Dateien im Repository abgelegt.
4. Jede Installationsfunktion ist idempotent: Sie prüft den Zielzustand
   vor der Aktion und überspringt bereits korrekte Zustände.
5. `set -euo pipefail` und `trap ERR` sind verbindlich für den gesamten
   Ausführungskontext.
6. Die Inventory-Datei `cc_cli_inventory.yml` wird aus `templates/inventory.yml.tpl` erzeugt und nach
   der Ausführung gelöscht (Trap löscht `${CONFIG_YAML_PATH}` im Playbook-Verzeichnis).
7. Das Verifikationsmodul führt alle Abnahmetests erneut aus und gibt
   einen eindeutigen Exit-Code zurück (0 = Erfolg, 1 = Fehler).
8. Alle Versionen werden beim Skriptbau gepinnt. Automatische Upgrades
   sind nicht vorgesehen.
9. Das Skript bildet die **erste Ausbaustufe** ab: reproduzierbarer,
    testbarer Prototyp. Produktionsanpassungen (HA, DMZ, externes etcd,
    Backup) bleiben einer späteren Spezifikation vorbehalten.
