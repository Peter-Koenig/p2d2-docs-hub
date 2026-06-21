---
title: Skriptarchitektur
description: Modulaufbau, Konventionen, Idempotenz-Strategie und Konfigurationsstruktur des CIVITAS/CORE-Installationsskripts nach dem create_sdt_02-Muster.
status: draft
lastUpdated: 2026-06-20
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
  completeness: 85
  accuracy: 90
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
│   ├── 05_addons.sh                 ← Phase 1b: helm, cert-manager, nginx, storage
│   ├── 06_civitas.sh                ← Phase 2: cc-cli, config.yaml, deploy
│   └── 07_verify.sh                 ← Phase 3: Verifikation, Fehlerreport
├── templates/
│   └── config.yaml.tpl              ← cc-cli-Konfigurationsvorlage
└── .env.example                     ← Beispiel für Umgebungsvariablen (kein Secret)
```

> **Hinweis**: Secrets (SMTP-Passwort, Admin-Passwort) werden **nie** in
> Dateien im Repository abgelegt. Sie werden als Umgebungsvariablen vor
> dem Skriptaufruf gesetzt:
> ```bash
> export SMTP_PASS="..."
> export ADMIN_PASS="..."
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
CC_CLI_VERSION="2.3.1"             # Beim Skriptbau aus CIVITAS/CORE-Doku fixieren
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
helm-CLI, cert-manager, ClusterIssuer, nginx-Ingress. Storage Class ist
durch k3s bereits vorhanden.

### Reihenfolge und Idempotenz

```bash
install_addons() {
  log "=== Phase 1b: Add-ons ==="

  install_helm
  install_cert_manager
  # Warten bis cert-manager-Webhook Ready ist, sonst Race-Condition bei CRDs
  kubectl wait pods --all -n "${CERT_MANAGER_NAMESPACE}" \
    --for=condition=Ready --timeout=120s
  configure_cluster_issuer
  install_nginx_ingress
  verify_storage_class
}
```

| Funktion | Idempotenz-Prüfung |
|---|---|
| `install_helm` | `is_installed helm && helm version | grep $HELM_VERSION` |
| `install_cert_manager` | `k8s_ready deployment cert-manager cert-manager` |
| `configure_cluster_issuer` | `kubectl get clusterissuer selfsigned-issuer` |
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

### ClusterIssuer (self-signed, Prototyp)

```yaml
# wird aus templates/ angewendet
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
```

> Für eine spätere Produktionsstrategie (ACME, interne CA) wird dieser
> Issuer ausgetauscht — Festlegung in `netzwerk-dns-tls.md`.

> **nginx-Ingress-Ports**: Der nginx-Ingress-Controller wird mit `hostNetwork=true`
> als DaemonSet installiert und lauscht auf HTTP-Port 8080. HTTPS (Port 8443)
> ist vorhanden, wird aber nicht genutzt (TLS-Terminierung in Caddy auf OPNsense).
> Relevante Helm-Values:
> ```
> controller.hostNetwork=true
> controller.kind=DaemonSet
> controller.service.ports.http=8080
> controller.service.ports.https=8443
> controller.containerPort.http=8080
> controller.containerPort.https=8443
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

  install_cc_cli
  render_config_yaml
  run_cc_cli_validate
  run_cc_cli_exec
  patch_ingress_for_external_tls   # ssl-redirect deaktivieren (TLS via Caddy)
  wait_pods_ready "${K8S_NAMESPACE}"
}
```

### Ingress-Patch für externes TLS

Nach `cc_cli exec` werden alle Ingress-Ressourcen im Namespace `${K8S_NAMESPACE}`
mit der Annotation `nginx.ingress.kubernetes.io/ssl-redirect=false` versehen.
Damit wird die Weiterleitung von HTTP auf HTTPS im nginx-Ingress deaktiviert,
da TLS bereits von Caddy auf OPNsense terminiert wird.

```bash
patch_ingress_for_external_tls() {
  log "Deaktiviere ssl-redirect für alle Ingress-Ressourcen (TLS via Caddy) ..."

  local ingresses
  ingresses=$(kubectl get ingress -n "${K8S_NAMESPACE}" \
    -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || true)

  if [[ -z "${ingresses}" ]]; then
    log_warn "Keine Ingress-Ressourcen in ${K8S_NAMESPACE} gefunden — überspringe Patch"
    return 0
  fi

  for ingress in ${ingresses}; do
    kubectl annotate ingress "${ingress}" \
      -n "${K8S_NAMESPACE}" \
      nginx.ingress.kubernetes.io/ssl-redirect=false \
      --overwrite
    log_ok "Ingress ${ingress} — ssl-redirect=false gesetzt"
  done
}
```

### config.yaml aus Template
```

### config.yaml aus Template

Die `config.yaml` für cc-cli wird aus `templates/config.yaml.tpl` erzeugt.
Alle Platzhalter werden durch die Variablen aus `01_config.sh` ersetzt:

```bash
render_config_yaml() {
  local tpl="${SCRIPT_DIR}/templates/config.yaml.tpl"
  local out="/tmp/civitas_core_config.yaml"

  sed \
    -e "s|{{DOMAIN}}|${DOMAIN}|g" \
    -e "s|{{SMTP_HOST}}|${SMTP_HOST}|g" \
    -e "s|{{SMTP_PORT}}|${SMTP_PORT}|g" \
    -e "s|{{SMTP_USER}}|${SMTP_USER}|g" \
    -e "s|{{SMTP_PASS}}|${SMTP_PASS}|g" \
    -e "s|{{ADMIN_EMAIL}}|${ADMIN_EMAIL}|g" \
    -e "s|{{K8S_NAMESPACE}}|${K8S_NAMESPACE}|g" \
    "$tpl" > "$out"

  CONFIG_YAML_PATH="$out"
  log_ok "config.yaml erzeugt: ${out}"
}
```

> Die erzeugte `config.yaml` liegt unter `/tmp/` und enthält das
> SMTP-Passwort im Klartext. Sie wird nach `cc_cli exec` gelöscht
> (`trap "rm -f ${CONFIG_YAML_PATH}" EXIT`).

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

  # Cloud-Image herunterladen (curl, idempotent via Prüfung auf Vorhandensein)
  download_cloud_image

  # VM mit qm create anlegen (12 vCPU, 40 GiB RAM, 300 GiB Disk)
  create_vm

  # Disk via qm importdisk einspielen und auf Zielgröße resizen
  import_and_resize_disk

  # Cloud-Init: root-Passwort, DHCP-Netzwerk
  configure_cloud_init

  # VM starten und auf IP warten
  qm start "${VM_ID}"
  wait_for_vm_ip "${VM_ID}"
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
- Bei erneuten Skriptdurchläufen wird die VM-IP neu ermittelt.

### Secrets

- `ROOT_PASSWORD` wird aus der Umgebungsvariablen gelesen (in `01_config.sh`
  mit `:?`-Expansion geprüft). Keine Hartcodierung, kein Eintrag in Git.

***

## Modul 07 — Verifikation (`07_verify.sh`)

Implementiert `run_verification()`. Führt alle Abnahmeprüfungen aus Phase 1
und Phase 2 erneut aus und gibt einen zusammenfassenden Bericht aus.

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
| Gast-OS: Debian 12 oder Ubuntu 24.04 LTS? | Offen | Peter König |
| Domainname: `civitas.data-dna.eu`? | Offen | Peter König |
| `SOHO_GATEWAY`-Adresse | Offen | lokale Netzwerkkonfiguration |
| Konkrete Versionsnummern (k3s, helm, cert-manager, cc-cli) | Beim Skriptbau ermitteln | Skriptbau |
| TLS-Strategie: self-signed oder CA? | Offen | netzwerk-dns-tls.md |
| `servicelb` und `metrics-server`: deaktivieren? | Vorschlag: aktiv lassen | Skriptbau |

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
6. Die `config.yaml` für cc-cli wird aus einem Template erzeugt und nach
   der Ausführung gelöscht.
7. Das Verifikationsmodul führt alle Abnahmetests erneut aus und gibt
   einen eindeutigen Exit-Code zurück (0 = Erfolg, 1 = Fehler).
8. Alle Versionen werden beim Skriptbau gepinnt. Automatische Upgrades
   sind nicht vorgesehen.
9. Das Skript bildet die **erste Ausbaustufe** ab: reproduzierbarer,
   testbarer Prototyp. Produktionsanpassungen (HA, DMZ, externes etcd,
   Backup) bleiben einer späteren Spezifikation vorbehalten.
