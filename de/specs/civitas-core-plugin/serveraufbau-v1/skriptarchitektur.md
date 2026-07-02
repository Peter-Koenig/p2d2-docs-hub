---
title: Skriptarchitektur
description: Modulaufbau, Konventionen, Idempotenz-Strategie und Konfigurationsstruktur des CIVITAS/CORE-Installationsskripts nach dem create_sdt_02-Muster.
status: draft
lastUpdated: 2026-06-29
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
  completeness: 88
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
│   ├── inventory.yml.tpl             ← cc-cli-Inventory-Vorlage (cc_cli_inventory.yml)
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

Der Entry-Point lädt alle Module in definierter Reihenfolge. Er kennt zwei
Ausführungskontexte, gesteuert durch die Umgebungsvariable `CIVITAS_CONTEXT`:

- **`CIVITAS_CONTEXT=host`** (Default) — Läuft auf dem Proxmox-Host.
  Führt Phase -1 (VM-Provisionierung) aus, kopiert dann alle Skript-Dateien
  per scp in die VM und startet einen SSH-Hop (`run_in_vm()`), der das Skript
  innerhalb der VM mit `CIVITAS_CONTEXT=vm` neu startet.
- **`CIVITAS_CONTEXT=vm`** — Läuft innerhalb der CIVITAS/CORE-VM.
  Führt die Phasen 0–3 (Vorbedingungen, k3s, Add-ons, cc_cli, Verifikation)
  direkt aus, ohne VM-Provisionierung.

### Ausführungskontext

```bash
CIVITAS_CONTEXT="${CIVITAS_CONTEXT:-host}"
```

### SSH-Hop (`run_in_vm()`)

Die Funktion `run_in_vm()` wird auf dem Proxmox-Host nach erfolgreicher
VM-Provisionierung aufgerufen. Sie:

1. Entfernt den alten SSH-Host-Key der VM (wird bei jedem Scratch-Lauf neu erstellt)
2. Kopiert das gesamte Installationsskript, alle Module und Templates per scp
   in die VM unter `${VM_REMOTE_INSTALL_DIR}` (`/root/civitas-install`)
3. Kopiert die Datei `.env.local` (falls vorhanden) per scp in die VM — diese
   enthält alle Secrets (SMTP-Passwort, Admin-Passwort, WireGuard-Schlüssel)
4. Startet `install_civitas_core.sh` in der VM mit `CIVITAS_CONTEXT=vm`
   und sourced dabei `.env.local` vor dem Skriptaufruf

```bash
run_in_vm() {
  ssh-keygen -f "${HOME}/.ssh/known_hosts" -R "${VM_IP_STATIC}" 2>/dev/null || true
  log "Kopiere Skript-Dateien in die VM (${VM_IP_STATIC}) …"
  ssh -o StrictHostKeyChecking=no \
      "root@${VM_IP_STATIC}" \
      "mkdir -p ${VM_REMOTE_INSTALL_DIR}"
  scp -o StrictHostKeyChecking=no -r \
    "${SCRIPT_DIR}/install_civitas_core_V1.sh" \
    "${SCRIPT_DIR}/modules_V1" \
    "${SCRIPT_DIR}/templates_V1" \
    "root@${VM_IP_STATIC}:${VM_REMOTE_INSTALL_DIR}/"

  # .env.local transferieren, falls vorhanden
  if [[ -f "${SCRIPT_DIR}/.env.local" ]]; then
    scp -o StrictHostKeyChecking=no \
      "${SCRIPT_DIR}/.env.local" \
      "root@${VM_IP_STATIC}:${VM_REMOTE_INSTALL_DIR}/.env.local"
  fi

  ssh -o StrictHostKeyChecking=no \
      "root@${VM_IP_STATIC}" \
      "CIVITAS_CONTEXT=vm bash -lc '
        cd ${VM_REMOTE_INSTALL_DIR}
        if [[ -f .env.local ]]; then
          set -a; source .env.local; set +a
        fi
        ./install_civitas_core_V1.sh
      '"
}
```

### Struktur (vereinfacht)

```bash
# Traps setzen (ERR, INT, TERM, EXIT)
# Module laden
source ...
source ...

# Phasen ausführen (Kontext-abhängig)
if [[ "${CIVITAS_CONTEXT}" == "host" ]]; then
  provision_vm          # Phase -1: VM erstellen (auf Proxmox-Host)
  run_in_vm             # SSH-Hop: Skript in VM starten
else
  run_preflight         # Phase 0: Vorbedingungen
  install_k3s           # Phase 1a: k3s installieren
  install_addons        # Phase 1b: Add-ons deployen
  install_civitas       # Phase 2: CIVITAS/CORE-Plattform
  run_verification      # Phase 3: Verifikation
fi
```

### Konventionen

- `set -euo pipefail` ist verbindlich. Kein Modul darf diese Einstellung
  aufheben.
- Jede Phase ist eine Funktion mit klar definiertem Namen und
  Rückgabeverhalten.
- Der Entry-Point enthält keine Geschäftslogik — nur Laden, Kontext-Prüfung
  und Aufrufen.
- **`ROOT_PASSWORD`** muss vor dem Skriptaufruf als Umgebungsvariable gesetzt
  sein. Ohne diesen Wert bricht das Skript bereits beim Laden von `01_config.sh`
  mit einer Fehlermeldung ab.
- **Secrets aus `.env.local`:** Liegt die Datei `.env.local` im Skript-Verzeichnis,
  wird sie beim SSH-Hop automatisch in die VM übertragen und dort vor dem
  Skriptstart gesourct. Alternativ können alle Secrets als Umgebungsvariablen
  gesetzt werden.
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
ANSIBLE_VERSION="10.6.0"           # Ansible-Community-Distribution (kompatibel mit cc-cli 1.5.0)
CC_CLI_VERSION="1.5.0"              # cc-cli — aus GitLab Package Registry
CC_CLI_REGISTRY_URL="https://gitlab.com/api/v4/projects/62227605/packages/pypi/simple"
CC_CLI_VENV_PATH="/opt/civitas-core-venv"
CC_CLI_REPO_URL="https://gitlab.com/civitas-connect/civitas-core/civitas-core-v1/civitas-core.git"  # CIVITAS/CORE V1 Repository
CC_CLI_REPO_PATH="/opt/civitas-core-v1"     # Dauerhafter Workspace auf der VM (nicht /tmp)
CC_CLI_SYMLINK_PATH="/opt/civitas-core"     # Symlink auf die aktive Version
CC_CLI_PLAYBOOK_DIR="${CC_V1_REPO_PATH}/core_platform"  # Verzeichnis mit playbook.yml (cc_cli CWD)
CERT_MANAGER_VERSION="v1.16.0"     # Beim Skriptbau aus cert-manager-Release-Doku fixieren
NGINX_INGRESS_VERSION="4.12.0"    # Beim Skriptbau aus ingress-nginx-Helm-Chart-Doku fixieren
GATEWAY_API_VERSION="v1.2.1"      # Kubernetes Gateway API CRDs (standard channel)

# ── Plattform ────────────────────────────────────────────────────────────────
DOMAIN="udp.scanea.eu"             # Basis-Domain (Freigabe: Peter König)
KUBECONFIG_PATH="${HOME}/.kube/config"
export KUBECONFIG="${KUBECONFIG_PATH}"
K3S_DATA_DIR="/var/lib/rancher/k3s"

# Von cc_cli angelegte Namespaces (Muster: {ENVIRONMENT}-{stack})
CC_ENVIRONMENT="${CC_ENVIRONMENT:-cc-prd}"       # Ansible-Environment-Name
K8S_NAMESPACES=(
  "${CC_ENVIRONMENT}-access-stack"
  "${CC_ENVIRONMENT}-context-stack"
  "${CC_ENVIRONMENT}-dashboard-stack"
  "${CC_ENVIRONMENT}-database-stack"
  "${CC_ENVIRONMENT}-operation-stack"
)

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
SMTP_FROM="${SMTP_FROM:-no-reply@scanea.eu}"    # Absenderadresse für E-Mails

# ── Admin (Werte aus Umgebungsvariablen) ────────────────────────────────────
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@scanea.eu}"
ADMIN_PASS="${ADMIN_PASS:?'ADMIN_PASS muss als Umgebungsvariable gesetzt sein'}"
# → master_password + initiales platform_admin-Passwort (identisch, kein separater Wert)
TENANT_ADMIN_PASS="${TENANT_ADMIN_PASS:?'TENANT_ADMIN_PASS muss als Umgebungsvariable gesetzt sein'}"
# → inv_access.tenant.tenant_password (separat von ADMIN_PASS)

# ── Timeouts ─────────────────────────────────────────────────────────────────
TIMEOUT_CC_CLI_EXEC=600            # Sekunden
TIMEOUT_POD_READY=300              # Sekunden für kubectl wait

# ── PBS (Proxmox Backup Server) ─────────────────────────────────────────────
PBS_STORAGE="backup-p2d2-kinglui"              # PBS-Storage für VM-Backups

# ── cc-cli: Inventory-Parameter ──────────────────────────────────────────────
K8S_CONTEXT="${K8S_CONTEXT:-default}"               # kubectl context aus kubeconfig
STORAGECLASS_RWO="${STORAGECLASS_RWO:-local-path}"
STORAGECLASS_RWX="${STORAGECLASS_RWX:-local-path}"
STORAGECLASS_LOC="${STORAGECLASS_LOC:-local-path}"
INGRESS_CLASS="${INGRESS_CLASS:-nginx}"
CERT_MANAGER_ISSUER="${CERT_MANAGER_ISSUER:-civitas-core-ca-issuer}"

# ── Phase 2.0 — Repository ───────────────────────────────────────────────────
CC_V1_REPO_URL="https://gitlab.com/civitas-connect/civitas-core/civitas-core-v1/civitas-core.git"
CC_V1_REPO_PATH="/opt/civitas-core-v1"
CC_V1_REPO_BRANCH="main"

# ── Netzwerk ─────────────────────────────────────────────────────────────────
SOHO_GATEWAY="192.168.12.1"                    # Gateway des SOHO-VLANs

# ── VM-Provisionierung ─────────────────────────────────────────────────────
VM_ID="2010"                                     # Proxmox VM-ID
VM_NAME="civitas-core"                           # Anzeigename in Proxmox
VM_RAM_MB="40960"                                # RAM in MiB (40 GiB)
VM_CORES="12"                                    # vCPUs
VM_DISK_GB="300"                                 # Disk-Größe in GiB
VM_BRIDGE="vmbr0"                                # Bridge-Netzwerk
PROXMOX_STORAGE="local-zfs-civitas"              # Proxmox-Storage für VM-Disk
CLOUD_IMAGE_URL="https://cloud.debian.org/images/cloud/trixie/daily/latest/debian-13-genericcloud-amd64-daily.qcow2"

# ── VM-Netzwerk (statisch) ──────────────────────────────────────────────────
VM_IP_STATIC="192.168.12.139"                    # IPv4-Adresse der VM
VM_IP_PREFIX="24"                                # IPv4-Präfixlänge
VM_GW="192.168.12.1"                             # IPv4-Gateway
VM_IP6_STATIC="fd01:1:1:1::139"                 # IPv6-Adresse der VM
VM_IP6_PREFIX="64"                               # IPv6-Präfixlänge
VM_GW6="fd01:1:1:1:de39:6fff:febe:9962"         # IPv6-Gateway
SSH_PUBKEY_PATH="${HOME}/.ssh/authorized_keys"   # SSH-Public-Key für root-Zugang

# ── Remote-Ausführung in der VM ────────────────────────────────────────────
VM_REMOTE_INSTALL_DIR="/root/civitas-install"    # Zielverzeichnis für scp/SSH in der VM

# ROOT_PASSWORD wird aus Umgebungsvariable gelesen — nie hartcoden!
ROOT_PASSWORD="${ROOT_PASSWORD:?'ROOT_PASSWORD muss als Umgebungsvariable gesetzt sein'}"

# ── WireGuard-Secrets (aus Umgebungsvariablen — nie hartcoden) ────────────────
WG_VM_PRIVATE_KEY="${WG_VM_PRIVATE_KEY:?'WG_VM_PRIVATE_KEY muss als Umgebungsvariable gesetzt sein'}"
WG_OPN_PUBLIC_KEY="${WG_OPN_PUBLIC_KEY:?'WG_OPN_PUBLIC_KEY muss als Umgebungsvariable gesetzt sein'}"
WG_PRESHARED_KEY="${WG_PRESHARED_KEY:-}"  # optional
WG_OPN_ENDPOINT="${WG_OPN_ENDPOINT:?'WG_OPN_ENDPOINT muss als Umgebungsvariable gesetzt sein'}"

# ── WireGuard-Netzwerk (Klartext) ────────────────────────────────────────────
WG_INTERFACE="wg0"
WG_VM_IP="10.10.10.5/24"
WG_OPN_IP="10.10.10.1"
WG_LISTEN_PORT="${WG_LISTEN_PORT:-51820}"
WG_ALLOWED_IPS="10.10.10.0/24"
WG_CONF_PATH="/etc/wireguard/${WG_INTERFACE}.conf"
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
| `SMTP_PASS` | SMTP-Passwort für no-reply@scanea.eu | Aus netcup WCP |
| `SMTP_FROM` | SMTP-Absenderadresse | `no-reply@scanea.eu` (Default) |
| `ADMIN_PASS` | Keycloak Initial-Admin-Passwort | Sicheres Zufallspasswort, min. 12 Zeichen |
| `TENANT_ADMIN_PASS` | Tenant-Admin-Passwort (separat von ADMIN_PASS) | Sicheres Zufallspasswort, min. 12 Zeichen |
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

# ── Prüfe Exit-Code mit Abbruch ──────────────────────────────────────────────
assert_success() {
  local message="$1"
  local result="$2"
  if [[ "$result" -ne 0 ]]; then
    log_error "${message} — Abbruch"
    exit 1
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

  wait_for_apt_lock       # Cloud-Init-Apt-Lock abwarten (max. 120s)
  check_os
  check_cpu
  check_ram
  check_disk
  check_swap
  check_network
  check_timezone           # Zeitzone auf Europe/Berlin setzen
  check_dns_warn           # Warnung, kein Abbruch
  check_tools              # curl, python3, pip3, dig, wg, git
  check_smtp
  check_k3s_version        # Idempotenz: bereits korrekte Version → OK
  check_pbs_backup         # PBS-Storage prüfen (Warnung, kein Abbruch)
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

  if [[ "${K3S_ALREADY_INSTALLED:-false}" == "true" ]] || systemd_active k3s; then
    log_ok "k3s bereits aktiv — überspringe Installation"
    return 0
  fi

  log "Installiere k3s ${K3S_VERSION} ..."
  curl -sfL https://get.k3s.io \
    | INSTALL_K3S_VERSION="${K3S_VERSION}" \
      INSTALL_K3S_EXEC="${K3S_EXEC_ARGS}" \
      sh -

  # Warten bis k3s-API antwortet (kubeconfig-Datei vorhanden)
  wait_k3s_api

  # kubeconfig bereitstellen (erst nach API-Start)
  mkdir -p "$(dirname "${KUBECONFIG_PATH}")"
  install -m 600 /etc/rancher/k3s/k3s.yaml "${KUBECONFIG_PATH}"

  # Warten bis Node im API-Server registriert ist
  wait_k3s_node

  # Warten bis Node Ready
  kubectl wait node --all --for=condition=Ready --timeout=120s
  log_ok "k3s installiert und Node Ready"
}
```

Nach der k3s-Installation wird nicht direkt auf Node-Ready gewartet, sondern
zuerst auf die k3s-API und die Node-Registrierung. Zwei Hilfsfunktionen
stellen sicher, dass die Warteschleifen nicht blockieren:

**`wait_k3s_api()`** — Wartet maximal 60s auf die kubeconfig-Datei
`/etc/rancher/k3s/k3s.yaml` (2s-Intervall). Ohne diese Datei kann
`kubectl` keine API-Abfragen stellen.

**`wait_k3s_node()`** — Wartet maximal 60s (3s-Intervall), bis ein Node im
API-Server registriert ist. Dies verhindert Race-Conditions zwischen
k3s-Start und dem anschließenden `kubectl wait node --all`.

***

## Modul 05 — Add-ons (`05_addons.sh`)

Implementiert `install_addons()`. Installiert in dieser Reihenfolge:
helm-CLI, Kubernetes Gateway API CRDs, cert-manager (mit Gateway-API-Support),
Bootstrap-Issuer, Root-CA-Certificate, produktiver
ClusterIssuer, CA-Trust-Integration (System- + certifi-Store) und
nginx-Ingress. Storage Class ist durch k3s bereits vorhanden.

### Reihenfolge und Idempotenz

```bash
install_addons() {
  log "=== Phase 1b: Add-ons ==="

  install_helm
  install_gateway_api_crds          # NEU: Kubernetes Gateway API CRDs
  install_cert_manager              # Helm: --set config.enableGatewayAPI=true
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
| `install_gateway_api_crds` | `kubectl get crd gateways.gateway.networking.k8s.io` |
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

> **cert-manager mit Gateway-API-Support**: Die cert-manager-Helm-Installation
> setzt `--set config.enableGatewayAPI=true`, damit cert-manager Gateway-API-
> Ressourcen verarbeiten kann. Die Gateway-API-CRDs müssen vor cert-manager
> installiert werden, da cert-manager beim Start die CRDs erwartet. Die CRDs
> werden aus dem offiziellen Kubernetes-SIG-Release-Bezug installiert:
> ```bash
> kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/${GATEWAY_API_VERSION}/standard-install.yaml
> ```
>
> > **Hinweis Gateway-Class (`inv_k8s.gateway_class`)**: Die Playbooks von
> > `cc_cli` erzeugen derzeit ausschließlich standard Kubernetes Ingress-Ressourcen,
> > keine Gateway-API-Ressourcen. Das Feld `gateway_class` im Inventory wird daher
> > nicht aktiv ausgewertet und ist im Template auskommentiert (`# gateway_class: ""`).
> > nginx handelt als Ingress-Controller. Sollte eine zukünftige Playbook-Version
> > Gateway-API-Routen nutzen, muss hier der passende Wert (z. B. `traefik` oder
> > `nginx`) gesetzt werden.



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
  clone_civitas_repo          # Schritt 2.0: Repository klonen, Symlink anlegen
  apply_overlay               # Schritt 2.1: Overlay-Dateien aus overlay_V1/
                              #   in das geklonte Repo kopieren (ersetzt
                              #   die früheren sed-basierten Einzelpatches)
  patch_masterportal_release_name  # Schritt 2.1b: | lower für Helm-Release-Namen
                              #   (RFC-1123: Großbuchstaben ungültig)

  install_cc_cli              # Schritt 2.1c: cc-cli + ansible + openshift
                              #   + jmespath im venv. Ansible-Logging aktiviert:
                              #   ANSIBLE_LOG_PATH, ANSIBLE_VERBOSITY=3
  render_inventory            # Schritt 2.2: Inventory aus Template erzeugen
                              #   + http-Sicherheitscheck (Abbruch bei http://)

  # cc_cli exec (single run, alle Komponenten)
  run_cc_cli_validate         # Schritt 2.3
  setup_wireguard             # Schritt 2.4b — vor cc_cli exec
  run_cc_cli_exec             # Schritt 2.4c: single run, alle Komponenten
                              #   Ansible-Log: logs/ansible_run_latest.log

  # Logfile-Prüfung + Pods abwarten
  wait_pods_ready "${K8S_NAMESPACE}"
  log_ok "Phase 2 abgeschlossen"
}
```

### Overlay-Mechanismus (overlay_V1/)

Abweichende Dateien vom Upstream-CIVITAS-Core-Repo werden nicht mehr per sed
auf Textmuster gepatcht (fragil bei Repo-Änderungen), sondern als vollständige
Kopien in `civitas_einrichtung/overlay_V1/` vorgehalten.

**Verzeichnisstruktur:**

```
civitas_einrichtung/
├── overlay_V1/
│   └── templates/
│       └── access/
│           └── keycloak/
│               └── keycloak-values.yaml    # servicePort: http, backend-protocol: HTTP
├── modules_V1/
├── templates_V1/
└── supplement/
```

Der relative Pfad unter `overlay_V1/` entspricht exakt dem Zielpfad im
geklonten Repo unterhalb von `CC_CLI_PLAYBOOK_DIR` (z. B. `core_platform/templates/access/keycloak/keycloak-values.yaml`).

**Funktion `apply_overlay()`:**

- Wird nach `clone_civitas_repo()` ausgeführt.
- Iteriert über alle Dateien in `overlay_V1/` und kopiert sie per `cp` in
  den entsprechenden Zielpfad.
- Vor dem Überschreiben wird ein Backup der Originaldatei nach
  `.overlay_backup/<relpath>.orig` angelegt (nur beim ersten Lauf).
- Fehlt ein Zielverzeichnis, bricht das Skript mit einem Hinweis auf eine
  mögliche Strukturänderung im Upstream-Repo ab.
- Loggt jede kopierte Datei mit `log_ok`.

**Neue Overlays hinzufügen:**

1. Datei mit dem gewünschten Zielpfad unter `overlay_V1/` anlegen.
2. Versionieren, commiten.
3. Beim nächsten Deployment wird die Datei automatisch eingespielt.

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
ansible==10.6.0          # Ansible-Community-Distribution
kubernetes               # Python-Client für k8s-Ansible-Module
openshift                # Python-Client für OpenShift/k8s-API
jmespath                 # JSON-Query-Filter für Ansible-Playbooks
```

`install_cc_cli()` installiert cc-cli, ansible, kubernetes, openshift und jmespath
in einem isolierten venv:

```bash
"${CC_CLI_VENV_PATH}/bin/pip" install \
  --extra-index-url "${CC_CLI_REGISTRY_URL}" \
  "cc-cli==${CC_CLI_VERSION}" \
  "ansible==${ANSIBLE_VERSION}" \
  kubernetes \
  openshift \
  jmespath
```

Anschließend werden die erforderlichen Ansible-Collections installiert:

```bash
"${CC_CLI_VENV_PATH}/bin/ansible-galaxy" collection install \
  kubernetes.core \
  community.grafana \
  "community.mongodb:==1.3.2"
```

### CA-Trust im certifi-Bundle (venv-abhängig)

`setup_ca_trust()` in Phase 1b (Modul 05) schreibt das Root-CA-Zertifikat in
den System-Trust-Store und in das certifi-Bundle des Python-venv. Da das venv
zu diesem Zeitpunkt noch nicht existiert (es wird erst in Phase 2 durch
`install_cc_cli()` erstellt), schlägt der certifi-Eintrag in Phase 1b still
fehl. Dies wird durch die Warnung `certifi cacert.pem nicht gefunden` im Log
angezeigt. Ohne den certifi-Eintrag scheitern die HTTPS-Health-Checks von
`cc_cli validate` und `cc_cli exec` mit `CERTIFICATE_VERIFY_FAILED`.

Die Funktion `update_ca_trust_certifi()` in Modul 06 wiederholt daher den
certifi-Teil nach der Erstellung des venv:

```bash
update_ca_trust_certifi() {
  local ca_cert="/usr/local/share/ca-certificates/civitas-core-ca.crt"

  if [[ ! -f "${ca_cert}" ]]; then
    log_warn "CA-Zertifikat nicht gefunden – certifi-Update übersprungen"
    return 0
  fi

  certifi_bundle=$(find "${CC_CLI_VENV_PATH}" -name "cacert.pem" | head -1)
  if [[ -n "${certifi_bundle}" ]]; then
    if ! grep -q "civitas-core-ca" "${certifi_bundle}"; then
      cat "${ca_cert}" >> "${certifi_bundle}"
    fi
  fi
}
```

**Idempotenz:** Prüft via `grep "civitas-core-ca"` ob der Eintrag bereits
vorhanden ist und überspringt ggf.

Danach werden Symlinks gesetzt, damit `ansible` und `ansible-playbook`
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
  mkdir -p "${CC_CLI_PLAYBOOK_DIR}"
  local out="${CC_CLI_PLAYBOOK_DIR}/cc_cli_inventory.yml"

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

> Die erzeugte Inventory-Datei liegt unter `${CC_CLI_PLAYBOOK_DIR}/cc_cli_inventory.yml`
> und enthält Secrets im Klartext. Sie wird nach `cc_cli exec` gelöscht
> (`trap 'rm -f "${CONFIG_YAML_PATH:-}"' EXIT`).
> Der Repository-Workspace unter `${CC_V1_REPO_PATH}` bleibt erhalten, da nur
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
test -f "${CC_CLI_PLAYBOOK_DIR}/inventory_schema.json"

# playbook.yml im Playbook-Verzeichnis
test -f "${CC_CLI_PLAYBOOK_DIR}/playbook.yml"

# Inventory liegt im Playbook-Verzeichnis
test -f "${CC_CLI_PLAYBOOK_DIR}/cc_cli_inventory.yml"
```



In der Implementierung sind die Prüfungen in `clone_civitas_repo()` integriert:
Nach dem Klon wird `playbook.yml` unter `${CC_CLI_PLAYBOOK_DIR}` gesucht, und
der Symlink `${CC_CLI_SYMLINK_PATH} → ${CC_V1_REPO_PATH}` wird validiert.
Die `check_repo_prerequisites()`-Funktion selbst ist derzeit nicht als separate
Funktion implementiert; ihre Logik ist in `clone_civitas_repo()` enthalten.

Fehlschläge führen zum sofortigen Abbruch.

#### Arbeitsverzeichnis für cc_cli

- `render_inventory()` schreibt nach `${CC_CLI_PLAYBOOK_DIR}/cc_cli_inventory.yml`
- `cc_cli validate` und `cc_cli exec` laufen mit `cd ${CC_CLI_PLAYBOOK_DIR}`
- Das flüchtige `${CC_CLI_WORKDIR}` (`/tmp/civitas-core-deploy`) entfällt
- `${CC_CLI_PLAYBOOK_DIR}` ist ein Unterverzeichnis des Repository-Workspace:
  `${CC_V1_REPO_PATH}/core_platform`

#### Symlink für aktive Version

Der Symlink `${CC_CLI_SYMLINK_PATH}` zeigt auf das aktuell aktive
CIVITAS/CORE-Repository. Aktuell zeigt er auf `${CC_V1_REPO_PATH}`
(V1). Bei einem zukünftigen Wechsel auf V2 wird der Symlink auf
`/opt/civitas-core-v2` umgebogen.

#### Playbook-URLs patchen (`patch_playbook_urls()`)

Die Ansible-Playbooks von CIVITAS/CORE verwenden für die Keycloak-Admin-API
URLs ohne `/auth`-Prefix, z.B. `{{ hostname }}/admin/realms/...` statt
`{{ hostname }}/auth/admin/realms/...`. Keycloak redirectet diese Aufrufe
auf die korrekte URL mit `/auth`. Ansible's `uri`-Modul folgt Redirects bei
POST standardmäßig **nicht** (`follow_redirects=safe`), sodass alle POST-
Aufrufe zur Rollenzuweisung mit HTTP 404 scheitern.

Die Funktion `patch_playbook_urls()` fügt daher nach `clone_civitas_repo()`
in den betroffenen Playbook-Dateien über `sed` den Parameter
`follow_redirects: yes` ein:

```bash
patch_playbook_urls() {
  local files=(
    "tasks/geodata/configure/integrated_keycloak.yml"
    "tasks/geodata/install/geoserver_setup_role_service.yml"
    "tasks/access/keycloak/idm-config/keycloak_8_users.yml"
    "tasks/access/keycloak/idm-config/keycloak_5_clients.yml"
    "tasks/dashboard/superset.yml"
    "tasks/datacatalog/piveau.yml"
  )

  for f in "${files[@]}"; do
    # Patch 1: POST to role-mappings (Rollenzuweisung)
    sed -i '/role-mappings\/clients/,/status_code:/{
      /status_code:/a\    follow_redirects: yes
    }' "${CC_CLI_PLAYBOOK_DIR}/${f}"

    # Patch 2: POST to /admin/realms/.../users (User-Erzeugung)
    sed -i '/admin\/realms\/.*\/users$/,/status_code:/{
      /status_code:/a\    follow_redirects: yes
    }' "${CC_CLI_PLAYBOOK_DIR}/${f}"

    # Patch 3: POST to /admin/realms/.../clients (Client-Erzeugung)
    sed -i '/admin\/realms\/.*\/clients$/,/status_code:/{
      /status_code:/a\    follow_redirects: yes
    }' "${CC_CLI_PLAYBOOK_DIR}/${f}"
  done
}
```

**Betroffene Dateien:** GeoData (integrated_keycloak.yml, geoserver_setup_role_service.yml),
Keycloak-Tenant (keycloak_8_users.yml, keycloak_5_clients.yml), Superset
(superset.yml) und Piveau (piveau.yml).

**Idempotenz:** Der sed-Patch wird bei jedem Skriptdurchlauf neu angewandt.
Da `follow_redirects: yes` bereits in der Datei steht, fügt sed die Zeile
nicht erneut hinzu (keine Duplikate).

**Wirkung:** Alle `uri`-Tasks mit POST zur Keycloak-Admin-API (Rollenzuweisung,
User-Erzeugung, Client-Erzeugung) folgen jetzt dem Redirect auf
`/auth/admin/realms/...`. Dadurch laufen die Keycloak-Konfigurationen von
GeoData, Superset und dem Keycloak-Tenant vollständig durch.

#### Ingress-Bereinigung (`cleanup_geodata_ingress()`)

Bei Wiederholung von `--tags geodata` kann der nginx-Admission-Webhook die
Ingress-Erstellung mit `"host geoportal.udp.scanea.eu is already defined"`
ablehnen. Die Funktion `cleanup_geodata_ingress()` entfernt daher vor Phase 2b1
das GeoData-Ingress, falls es aus einem vorherigen Lauf noch existiert:

```bash
cleanup_geodata_ingress() {
  local ns="${CC_ENVIRONMENT:-cc-prd}-geodata-stack"
  if kubectl get ingress geodata-ingress -n "${ns}" &>/dev/null; then
    log_warn "Entferne bestehendes GeoData-Ingress …"
    kubectl delete ingress geodata-ingress -n "${ns}"
  fi
}
```

#### Admin-User in cc-prd erzwingen (`ensure_keycloak_admin_user()`)

Die Ansible-Playbooks legen den Admin-User `admin@scanea.eu` im `cc-prd`-Realm
über die URL `{{ hostname }}/admin/realms/.../users` an (ohne `/auth`-Prefix).
Keycloak antwortet auf diesen POST mit einem 302-Redirect zu
`/auth/admin/realms/.../users`, wobei Ansible den POST-Body verliert (302 → GET).
Der User wird daher in Phase 2a (`--tags base`) oft nicht angelegt.

Die Funktion `ensure_keycloak_admin_user()` erzeugt den User daher **nach**
Phase 2a und **vor** Phase 2b1 direkt per `curl` mit dem funktionierenden
`/auth`-Prefix:

```bash
ensure_keycloak_admin_user() {
  # 1. Admin-Token holen
  token=$(curl -s --cacert ... \
    -X POST "https://idm.${DOMAIN}/auth/realms/master/protocol/openid-connect/token" \
    -d "client_id=admin-cli" \
    -d "username=${ADMIN_EMAIL}" \
    -d "password=${ADMIN_PASS}" \
    -d "grant_type=password" | python3 -c '...')

  # 2. User anlegen (201=neu, 409=existiert bereits)
  curl -X POST "https://idm.${DOMAIN}/auth/admin/realms/${CC_ENVIRONMENT}/users" \
    -H "Authorization: Bearer ${token}" \
    -d '{ "username": "${ADMIN_EMAIL}", "enabled": true }'

  # 3. Passwort setzen
  curl -X PUT ".../users/${user_id}/reset-password" \
    -d '{"type":"password","value":"${ADMIN_PASS}","temporary":false}'
}
```

**Idempotenz:** Wenn der User bereits existiert, antwortet Keycloak mit
HTTP 409 (Conflict) – die Funktion bricht dann nicht ab, sondern fährt fort.

**Wirkung:** Der Admin-User `admin@scanea.eu` existiert garantiert im
`cc-prd`-Realm, bevor Phase 2b1 (GeoData) versucht, Rollen zuzuweisen.
Dadurch ist `platform_user_id` nicht leer und die Role-Assignment-URL ist
gültig.

### Bekannte Stolperfallen

| Symptom | Ursache | Fix |
|---|---|---|
| `context "k3s" not found` | `inv_k8s.config.context: "k3s"` im Inventory | Wert auf `"default"` setzen (siehe cc-cli-inventar.md) |
| `HTTP 308` auf allen Endpunkten | `spec.tls` im Ingress vorhanden trotz `ssl-redirect=false` | `patch_ingress_for_external_tls()` entfernt `tls`-Sektion |
| `ModuleNotFoundError: kubernetes` im Ansible-Lauf | `kubernetes`-Pip-Paket fehlt im venv | In `install_cc_cli()` zusammen mit `ansible` installieren |
| Health-Check Timeout für externe URLs | WireGuard nicht aktiv vor `cc_cli exec` | `setup_wireguard` vor `run_cc_cli_exec` aufrufen |
| `Velero: access_key is required` in cc_cli validate | `velero.enable: true` mit leeren Credentials | Template-Default: `velero.enable: false` |
| `kubeconfig not found: ./config` | `kubeconfig_file: config` sucht relativ zum CWD | `cc_cli exec` ausschließlich aus `${CC_CLI_PLAYBOOK_DIR}` aufrufen |

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

  # ── Schritt 1: Cloud-Image lokal cachen (24h-Altersprüfung) ─────────
  local image_name image_path cache_dir
  image_name="$(basename "${CLOUD_IMAGE_URL}")"
  cache_dir="/var/lib/vz/template/qcow"
  image_path="${cache_dir}/${image_name}"
  mkdir -p "${cache_dir}"

  if [[ -f "${image_path}" ]]; then
    local file_age
    file_age=$(( $(date +%s) - $(stat -c %Y "${image_path}" 2>/dev/null || echo 0) ))
    if [[ $file_age -lt 86400 ]]; then
      log_ok "Cloud-Image gecached: ${image_name} (${file_age}s alt, < 24h)"
    else
      log "Cloud-Image aelter als 24h — lade neu herunter ..."
      curl -fsSL --retry 3 --retry-delay 10 \
        "${CLOUD_IMAGE_URL}" -o "${image_path}"
      log_ok "Cloud-Image aktualisiert: ${image_name}"
    fi
  else
    log "Lade Cloud-Image herunter (${CLOUD_IMAGE_URL}) ..."
    curl -fsSL --retry 3 --retry-delay 10 \
      "${CLOUD_IMAGE_URL}" -o "${image_path}"
    log_ok "Cloud-Image heruntergeladen: ${image_name}"
  fi

  # ── Schritt 2: VM mit qm create anlegen ────────────────────────────
  log "Erstelle VM ${VM_ID} (${VM_NAME}) ..."
  qm create "${VM_ID}" \
    --name "${VM_NAME}" \
    --memory "${VM_RAM_MB}" \
    --cores "${VM_CORES}" \
    --cpu host \
    --net0 virtio,bridge="${VM_BRIDGE}" \
    --agent enabled=1 \
    --onboot 1

  # ── Schritt 3: Disk importieren und vergrößern ─────────────────────
  log "Importiere Disk von Cloud-Image nach ${PROXMOX_STORAGE} ..."
  qm importdisk "${VM_ID}" "${image_path}" "${PROXMOX_STORAGE}"

  log "Konfiguriere Hardware (SCSI, Boot-Reihenfolge, Cloud-Init-ISO) ..."
  qm set "${VM_ID}" \
    --scsihw virtio-scsi-pci \
    --scsi0 "${PROXMOX_STORAGE}:vm-${VM_ID}-disk-0" \
    --ide2 "${PROXMOX_STORAGE}:cloudinit" \
    --boot order=scsi0 \
    --serial0 socket \
    --vga serial0

  log "Vergrößere Disk auf ${VM_DISK_GB} GiB ..."
  qm resize "${VM_ID}" scsi0 "${VM_DISK_GB}G"
  log_ok "Disk auf ${VM_DISK_GB} GiB vergrößert"

  # ── Schritt 4: Cloud-Init (SSH-Key + statische IP) ─────────────────
  log "Konfiguriere Cloud-Init (root, SSH-Key, statische IP ${VM_IP_STATIC}) ..."
  qm set "${VM_ID}" \
    --ciuser root \
    --sshkeys "${SSH_PUBKEY_PATH}" \
    --ipconfig0 "ip=${VM_IP_STATIC}/${VM_IP_PREFIX},gw=${VM_GW},ip6=${VM_IP6_STATIC}/${VM_IP6_PREFIX},gw6=${VM_GW6}"

  # ── Schritt 5: VM starten und auf SSH warten ───────────────────────
  log "Starte VM ${VM_ID} ..."
  qm start "${VM_ID}"
  log "Warte auf SSH unter ${VM_IP_STATIC} (max. 120s) ..."

  local attempt=0
  until ssh -o StrictHostKeyChecking=no \
            -o ConnectTimeout=5 \
            -o BatchMode=yes \
            root@"${VM_IP_STATIC}" true 2>/dev/null; do
    sleep 5
    (( attempt++ )) || true
    if [[ $attempt -gt 24 ]]; then
      log_error "VM ${VM_IP_STATIC} nicht per SSH erreichbar nach 120s"
      exit 1
    fi
  done
  log_ok "VM erreichbar unter ${VM_IP_STATIC}"

  log_ok "VM-Provisionierung abgeschlossen"
}
```

### SSH-Hop und Remote-Ausführung (`run_in_vm()`)

Nach erfolgreicher VM-Provisionierung wechselt der Entry-Point in den
SSH-Hop-Modus. Das Skript kopiert alle Installationsdateien per scp in
die VM und startet die Installation dort neu:

```bash
run_in_vm() {
  # Alten SSH-Host-Key entfernen (VM wird bei jedem Scratch-Lauf neu erstellt)
  ssh-keygen -f "${HOME}/.ssh/known_hosts" -R "${VM_IP_STATIC}" 2>/dev/null || true
  log "Kopiere Skript-Dateien in die VM (${VM_IP_STATIC}) …"

  # Zielverzeichnis in der VM anlegen
  ssh -o StrictHostKeyChecking=no "root@${VM_IP_STATIC}" \
    "mkdir -p ${VM_REMOTE_INSTALL_DIR}"

  # Skript-Dateien, Module und Templates kopieren
  scp -o StrictHostKeyChecking=no -r \
    "${SCRIPT_DIR}/install_civitas_core_V1.sh" \
    "${SCRIPT_DIR}/modules_V1" \
    "${SCRIPT_DIR}/templates_V1" \
    "root@${VM_IP_STATIC}:${VM_REMOTE_INSTALL_DIR}/"

  # Secrets aus .env.local übertragen, falls vorhanden
  if [[ -f "${SCRIPT_DIR}/.env.local" ]]; then
    scp -o StrictHostKeyChecking=no \
      "${SCRIPT_DIR}/.env.local" \
      "root@${VM_IP_STATIC}:${VM_REMOTE_INSTALL_DIR}/.env.local"
  fi

  # Skript in der VM starten (CIVITAS_CONTEXT=vm)
  ssh -o StrictHostKeyChecking=no "root@${VM_IP_STATIC}" \
    "CIVITAS_CONTEXT=vm bash -lc '
      cd ${VM_REMOTE_INSTALL_DIR}
      if [[ -f .env.local ]]; then
        set -a; source .env.local; set +a
      fi
      ./install_civitas_core_V1.sh
    '"
}
```

**Wichtig:** Der SSH-Hop entfernt den alten Host-Key der VM, da die VM
bei jedem Scratch-Lauf neu erstellt wird (neuer SSH-Host-Key). Die Option
`StrictHostKeyChecking=no` verhindert eine interaktive Abfrage während
der Automatisierung.

### Secrets aus `.env.local`

Secrets (SMTP-Passwort, Admin-Passwort, WireGuard-Schlüssel, Root-Passwort)
können in einer Datei `.env.local` im Skript-Verzeichnis abgelegt werden:

```bash
# .env.local — Beispiel (NIE in Git einchecken!)
ROOT_PASSWORD="sicheres_passwort_123"
SMTP_HOST="mx92c.netcup.net"
SMTP_USER="admin@scanea.eu"
SMTP_PASS="smtp_secret_456"
ADMIN_PASS="admin_secret_789"
TENANT_ADMIN_PASS="tenant_secret_abc"
WG_VM_PRIVATE_KEY="base64_private_key..."
WG_OPN_PUBLIC_KEY="base64_public_key..."
WG_OPN_ENDPOINT="1.2.3.4:51820"
```

Die Datei wird:
- Vom Entry-Point auf dem Proxmox-Host erkannt und per scp in die VM übertragen
- In der VM vor dem Skriptstart per `source .env.local` geladen (mit `set -a`,
  damit alle Variablen als Umgebungsvariablen exportiert werden)
- **Nicht** in Git eingecheckt (sollte in `.gitignore` stehen)

Fehlt `.env.local`, müssen alle Secrets als Umgebungsvariablen gesetzt sein.
Das Skript prüft Pflichtvariablen mit `${VAR:?}` und bricht bei Fehlen ab.

### Konfigurationsvariablen (zusätzlich in `01_config.sh`)

| Variable | Beschreibung | Default |
|---|---|---|
| `VM_ID` | Proxmox VM-ID | `2010` |
| `VM_NAME` | Anzeigename in Proxmox | `civitas-core` |
| `VM_RAM_MB` | RAM in MiB | `40960` |
| `VM_CORES` | vCPUs | `12` |
| `VM_DISK_GB` | Disk-Größe in GiB | `300` |
| `VM_BRIDGE` | Bridge-Interface | `vmbr0` |
| `PROXMOX_STORAGE` | Proxmox-Storage für VM-Disk | `local-zfs-civitas` |
| `CLOUD_IMAGE_URL` | URL zum Debian-13-Cloud-Image | `https://cloud.debian.org/…` |
| `VM_IP_STATIC` | Statische IPv4-Adresse der VM | `192.168.12.139` |
| `VM_IP_PREFIX` | IPv4-Präfixlänge | `24` |
| `VM_GW` | IPv4-Gateway | `192.168.12.1` |
| `VM_IP6_STATIC` | Statische IPv6-Adresse der VM | `fd01:1:1:1::139` |
| `VM_IP6_PREFIX` | IPv6-Präfixlänge | `64` |
| `VM_GW6` | IPv6-Gateway | `fd01:1:1:1:de39:6fff:febe:9962` |
| `SSH_PUBKEY_PATH` | Pfad zum SSH-Public-Key für root-Zugang | `${HOME}/.ssh/authorized_keys` |
| `VM_REMOTE_INSTALL_DIR` | Zielverzeichnis in der VM (scp/SSH) | `/root/civitas-install` |

### Idempotenz

- Cloud-Image wird mit 24h-Altersprüfung gecacht (tägliche Erneuerung
  des Cache, wenn älter als 24h).
- VM wird nur erstellt, wenn `qm status $VM_ID` fehlschlägt.
- Bei erneuten Skriptdurchläufen wird die SSH-Erreichbarkeit unter der
  konfigurierten statischen IP geprüft und der SSH-Hop gestartet.

### Secrets

- `ROOT_PASSWORD` wird aus der Umgebungsvariablen gelesen (in `01_config.sh`
  mit `:?`-Expansion geprüft). Keine Hartcodierung, kein Eintrag in Git.
- Alle weiteren Secrets (SMTP, Admin-Passwörter, WireGuard-Schlüssel) werden
  über `.env.local` oder als separate Umgebungsvariablen übergeben.

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
- **Issuer-Konsistenz** – alle `Certificate`-Objekte in Namespaces mit produktiven Domains (z. B. `cc-prd-access-stack`) m&uuml;ssen im `issuerRef` den CA-ClusterIssuer referenzieren (`selfsigned-issuer` oder `civitas-core-ca-issuer`). Der Bootstrap-Issuer (`civitas-bootstrap-selfsigned`) ist dort nicht zul&auml;ssig.

Zus&auml;tzlich laufen Domain-Level-Pr&uuml;fungen (Keycloak, Portal via HTTPS)
und Infrastruktur-Pr&uuml;fungen (WireGuard-Tunnel, OPNsense-Konnektivit&auml;t)
einmalig, nicht pro Namespace.

> **WireGuard-Reconnect vor Prüfung:** Da `cc_cli exec` je nach aktivierten
> Komponenten 2–5 Minuten oder länger läuft, kann der WireGuard-Tunnel durch
> Inaktivität abreißen (insbesondere hinter NAT/FritzBox). Vor der Infrastruktur-
> Prüfung in `verify_phase2()` wird daher der Tunnel-Status geprüft und der
> Tunnel bei Bedarf neu gestartet:
> ```bash
> if ! systemctl is-active --quiet "wg-quick@${WG_INTERFACE}"; then
>   log_warn "WireGuard-Tunnel ${WG_INTERFACE} inaktiv – reaktiviere ..."
>   systemctl restart "wg-quick@${WG_INTERFACE}"
>   sleep 3
> fi
> ```

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
| `SMTP_FROM` | nein | `no-reply@scanea.eu` | SMTP-Absenderadresse |
| `ADMIN_EMAIL` | nein | `admin@scanea.eu` | Initiale Admin-E-Mail |
| `ADMIN_PASS` | **ja** | — | Keycloak Master- + Platform-Admin-Passwort (≥12 Zeichen, Policy-konform) |
| `TENANT_ADMIN_PASS` | **ja** | — | Tenant-Admin-Passwort (separat von ADMIN_PASS) |
| `ROOT_PASSWORD` | **ja** | — | root-Passwort der VM |
| `WG_VM_PRIVATE_KEY` | **ja** | — | WireGuard PrivateKey der VM |
| `WG_OPN_PUBLIC_KEY` | **ja** | — | WireGuard PublicKey von OPNsense |
| `WG_OPN_ENDPOINT` | **ja** | — | Öffentliche IP:Port der OPNsense-WireGuard-Instanz |
| `WG_PRESHARED_KEY` | nein | leer | WireGuard PreSharedKey (optional) |
| `SOHO_GATEWAY` | nein | `192.168.12.1` | Gateway für Netzwerk-Erreichbarkeitsprüfung |
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
