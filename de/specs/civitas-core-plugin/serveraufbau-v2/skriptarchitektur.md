---
title: Skriptarchitektur — CIVITAS/CORE V2
description: Modulaufbau, Konventionen, Idempotenz-Strategie und Konfigurationsstruktur des CIVITAS/CORE-V2-Installationsskripts
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-skriptarchitektur
parent: civitas-core-v2-serveraufbau-index
dependencies:
  - civitas-core-v2-serveraufbau-installationsphasen
  - civitas-core-v2-serveraufbau-zielbild
quality:
  completeness: 55
  accuracy: 70
  reviewed: false
  reviewer:
  reviewDate:
---

# Skriptarchitektur — CIVITAS/CORE V2

## Ziel

Dieses Dokument spezifiziert den Modulaufbau, die Konventionen und die
Idempotenz-Strategie des CIVITAS/CORE-V2-Installationsskripts. Es lehnt sich
strukturell an die V1-Skriptarchitektur an, ersetzt aber den cc_cli-Ablauf
durch helmfile-basierte Phasen.

## Repository und Ablageort

Das Installationsskript liegt im Repository `civitas_einrichtung` unter:

```
civitas_einrichtung/
├── install_civitas_core_v2.sh          # Entry-Point
├── modules/
│   ├── 01_config.sh                    # Konfiguration
│   ├── 02_lib.sh                       # Hilfsfunktionen
│   ├── 03_preflight.sh                 # Phase 0: Vorbedingungen
│   ├── 04_k3s.sh                       # Phase 1a: k3s-Cluster
│   ├── 05_addons.sh                    # Phase 1b: Add-ons (helmfile, cert-manager, nginx)
│   ├── 06_deployment_repo.sh           # Phase 2a: Deployment-Repository
│   ├── 07_prerequisites.sh             # Phase 2b: DNS hart, keycloak-smtp-Secret
│   ├── 08_helmfile.sh                  # Phase 2c: helmfile sync
│   ├── 09_wireguard.sh                 # Phase 2d: WireGuard
│   └── 10_verify.sh                    # Phase 3: Verifikation
└── templates/
    ├── wg0.conf.tpl                    # WireGuard-Konfiguration
    └── global.yaml.gotmpl.tpl          # Template für global.yaml.gotmpl
```

Die Module `01_config.sh` und `02_lib.sh` können zwischen V1 und V2 geteilt
werden, sofern die Variablen und Funktionen kompatibel bleiben. Die Module
`04_k3s.sh`, `05_addons.sh` und `09_wireguard.sh` sind weitgehend identisch
zu V1. Die Module `06_deployment_repo.sh`, `07_prerequisites.sh` und
`08_helmfile.sh` sind V2-spezifisch.

## Entry-Point: `install_civitas_core_v2.sh`

### Struktur

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Module laden
source "${SCRIPT_DIR}/modules/01_config.sh"    # Konfiguration
source "${SCRIPT_DIR}/modules/02_lib.sh"       # Hilfsfunktionen
source "${SCRIPT_DIR}/modules/00_provision_vm.sh"  # Phase -1
source "${SCRIPT_DIR}/modules/03_preflight.sh" # Phase 0
source "${SCRIPT_DIR}/modules/04_k3s.sh"       # Phase 1a
source "${SCRIPT_DIR}/modules/05_addons.sh"    # Phase 1b
source "${SCRIPT_DIR}/modules/06_deployment_repo.sh"  # Phase 2a
source "${SCRIPT_DIR}/modules/07_prerequisites.sh"    # Phase 2b
source "${SCRIPT_DIR}/modules/08_helmfile.sh"         # Phase 2c
source "${SCRIPT_DIR}/modules/09_wireguard.sh"        # Phase 2d
source "${SCRIPT_DIR}/modules/10_verify.sh"           # Phase 3

# Traps
trap 'log_error "Unerwarteter Fehler in Zeile ${LINENO}. Abbruch."; exit 1' ERR
trap 'log_warn "Skript durch Signal unterbrochen."; exit 130' INT TERM
trap 'rm -rf "${CC_V2_REPO_PATH}/deployment/environments/${CC_V2_ENVIRONMENT}/global.yaml.gotmpl"' EXIT

# Phasen ausführen
provision_vm         # Phase -1: VM erstellen (Proxmox-Host)
run_preflight        # Phase 0:  Vorbedingungen (VM)
install_k3s          # Phase 1a: k3s-Cluster
install_addons       # Phase 1b: helmfile, cert-manager, nginx
setup_deployment_repo # Phase 2a: Deployment-Repo
prepare_prerequisites # Phase 2b: DNS hart, Secrets
run_helmfile_sync    # Phase 2c: helmfile deploy
setup_wireguard     # Phase 2d: WireGuard-Tunnel
run_verification    # Phase 3:  Verifikation
```

### Konventionen

- `set -euo pipefail` und `trap ERR` sind verbindlich.
- Der EXIT-Trap löscht die gerenderte `global.yaml.gotmpl`, aber **nicht**
  den Repository-Workspace und **nicht** die `logs/`-Artefakte von helmfile.
- Bei Fehlschlag bleiben die `logs/`-Artefakte im Deployment-Verzeichnis
  für die Diagnose erhalten.
- Das Skript kann ohne Schaden mehrfach ausgeführt werden (Idempotenz).

## Modul 01 — Konfiguration (`01_config.sh`)

Alle konfigurierbaren Parameter zentral definiert. Kein anderes Modul enthält
hartcodierte Werte.

### Variablen (Auszug V2-spezifisch)

```bash
# ── Versionspinning ──────────────────────────────────────────────────────────
K3S_VERSION="v1.32.3+k3s1"
HELM_VERSION="v3.17.0"
HELMFILE_VERSION="v1.1.12"
CERT_MANAGER_VERSION="v1.16.0"
NGINX_INGRESS_VERSION="4.12.0"

# ── Plattform ────────────────────────────────────────────────────────────────
DOMAIN="udp.data-dna.eu"
CC_V2_ENVIRONMENT="cc-prd"
CC_V2_REPO_URL="https://gitlab.com/civitas-connect/civitas-core/civitas-core-v2/civitas-core-deployment.git"
CC_V2_REPO_PATH="/opt/civitas-core-v2"
CC_V2_DEPLOY_PATH="${CC_V2_REPO_PATH}/deployment"
K8S_NAMESPACE="${CC_V2_ENVIRONMENT}"

# ── Ingress / TLS (Caddy-Terminierung) ───────────────────────────────────────
INGRESS_CLASS="nginx"
CLUSTER_ISSUER="selfsigned-ca"
SSL_REDIRECT="false"

# ── SMTP ────────────────────────────────────────────────────────────────────
SMTP_HOST="${SMTP_HOST:?'SMTP_HOST muss gesetzt sein'}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:?'SMTP_USER muss gesetzt sein'}"
SMTP_PASS="${SMTP_PASS:?'SMTP_PASS muss gesetzt sein'}"
SMTP_FROM="${SMTP_FROM:-no-reply@data-dna.eu}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@data-dna.eu}"

# ── Timeouts ─────────────────────────────────────────────────────────────────
TIMEOUT_HELMFILE_SYNC=900
TIMEOUT_POD_READY=300

# ── Netzwerk ─────────────────────────────────────────────────────────────────
SOHO_GATEWAY="192.168.12.1"

# ── WireGuard ────────────────────────────────────────────────────────────────
WG_INTERFACE="wg0"
WG_VM_IP="10.10.10.5/24"
WG_OPN_IP="10.10.10.1"
```

### Pflicht-Umgebungsvariablen (Env-Vars)

| Variable | Beschreibung | Prüfung |
|---|---|---|
| `ROOT_PASSWORD` | root-Passwort der VM | `${VAR:?}` in config |
| `SMTP_HOST` | SMTP-Server-Hostname | `${VAR:?}` in config |
| `SMTP_USER` | SMTP-Benutzer | `${VAR:?}` in config |
| `SMTP_PASS` | SMTP-Passwort | `${VAR:?}` in config |
| `WG_VM_PRIVATE_KEY` | WireGuard-Private-Key der VM | `${VAR:?}` in config |
| `WG_OPN_PUBLIC_KEY` | WireGuard-Public-Key der OPNsense | `${VAR:?}` in config |
| `WG_OPN_ENDPOINT` | WireGuard-Endpoint der OPNsense | `${VAR:?}` in config |

## Modul 02 — Bibliothek (`02_lib.sh`)

Kann zwischen V1 und V2 geteilt werden. Enthält:

- **Logging**: `log()`, `log_ok()`, `log_warn()`, `log_error()`
- **Idempotenz**: `is_installed()`, `systemd_active()`, `k8s_ready()`
- **Netzwerk**: `tcp_reachable()`, `dns_resolves()`
- **Kubernetes**: `wait_pods_ready()`
- **Verifikation**: `check()`, `assert_success()`, `VERIFY_ERRORS`
- **Passwort-Generierung**: `gen_policy_password()`

## Modul 03 — Preflight (`03_preflight.sh`)

Phase 0. Führt alle Systemprüfungen vor der Installation durch. Erweitert
die V1-Prüfungen um V2-spezifische Tools:

- OS: Debian 13 (Trixie), x86_64
- CPU ≥ 4, RAM ≥ 16 GiB, Disk ≥ 100 GiB
- Swap deaktiviert
- Netzwerk: Gateway erreichbar
- DNS: Warnung (weich)
- SMTP: TCP-Erreichbarkeit
- Tools: `kubectl ≥ 1.32`, `helm ≥ 3.18`, `helmfile ≥ 1.1.9`, `git`
- k3s-Version (Idempotenz)
- PBS-Backup prüfen

Fehlende Tools werden automatisch installiert.

### Idempotenz-Regel

Jede Funktion prüft den Zielzustand vor der Aktion. Wenn `kubectl`, `helm`
oder `helmfile` bereits in der korrekten Version installiert sind, wird die
Installation übersprungen. Bei falscher Version erfolgt Abbruch.

## Modul 04 — k3s (`04_k3s.sh`)

Phase 1a. Identisch zu V1.

```bash
install_k3s() {
  k3s ≥ 1.32 installieren (--disable traefik)
  kubeconfig nach ~/.kube/config kopieren
  Auf Node Ready warten
}
```

## Modul 05 — Add-ons (`05_addons.sh`)

Phase 1b. Wie V1, ergänzt um helmfile und helm-diff.

```bash
install_addons() {
  install_helm          # Helm ≥ 3.18
  install_helmfile      # helmfile ≥ 1.1.9
  install_helm_diff     # helm-diff-Plugin
  install_cert_manager  # cert-manager
  configure_cluster_issuer  # selfsigned-ca
  install_nginx_ingress # nginx-Ingress (DaemonSet, Port 8080)
  verify_storage_class  # local-path
}
```

### helmfile-Installation

```bash
install_helmfile() {
  local url="https://github.com/helmfile/helmfile/releases/download/${HELMFILE_VERSION}/helmfile_${HELMFILE_VERSION#v}_linux_amd64.tar.gz"
  curl -fsSL "$url" | tar -xz -C /usr/local/bin/ helmfile
  chmod +x /usr/local/bin/helmfile
}
```

## Modul 06 — Deployment-Repository (`06_deployment_repo.sh`)

Phase 2a. V2-spezifisch.

```bash
setup_deployment_repo() {
  # Repository klonen
  git clone "$CC_V2_REPO_URL" "$CC_V2_REPO_PATH"

  # Symlink anlegen
  ln -sf "$CC_V2_REPO_PATH" /opt/civitas-core

  # Deployment-Verzeichnis erstellen
  cd "$CC_V2_REPO_PATH"
  cp -r defaults/deployment deployment

  # Als eigenes Git-Repo initialisieren
  cd deployment
  git init
  git add -A
  git commit -m "Initial deployment for ${CC_V2_ENVIRONMENT}"

  # Environment-Verzeichnis anlegen
  mkdir -p "environments/${CC_V2_ENVIRONMENT}"
}
```

### Idempotenz

- Existiert `$CC_V2_REPO_PATH/.git` → überspringen (Repo bereits vorhanden)
- Existiert nur das Verzeichnis, aber kein `.git` → Fehler (Abbruch)
- Existiert `$CC_V2_REPO_PATH/deployment/.git` → überspringen

## Modul 07 — Prerequisites (`07_prerequisites.sh`)

Phase 2b. V2-spezifisch.

```bash
prepare_prerequisites() {
  # DNS hart prüfen (Abbruch bei Fehler)
  check_dns_hard

  # Namespace anlegen
  kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

  # keycloak-smtp-Secret anlegen
  kubectl create secret generic keycloak-smtp \
    --namespace "$K8S_NAMESPACE" \
    --from-literal=host="$SMTP_HOST" \
    --from-literal=port="$SMTP_PORT" \
    --from-literal=from="$SMTP_FROM" \
    --from-literal=user="$SMTP_USER" \
    --from-literal=password="$SMTP_PASS" \
    --dry-run=client -o yaml | kubectl apply -f -
}
```

### Idempotenz

- Secret `keycloak-smtp` wird mit `kubectl apply` erstellt – idempotent.
- Namespace wird mit `kubectl apply` erstellt – idempotent.

## Modul 08 — Helmfile (`08_helmfile.sh`)

Phase 2c. V2-spezifisch. Kernstück des V2-Deployments.

```bash
run_helmfile_sync() {
  # Environment in helmfile.yaml registrieren (einmalig)
  register_environment_in_helmfile

  # global.yaml.gotmpl rendern
  render_global_yaml

  # helmfile sync ausführen
  cd "$CC_V2_DEPLOY_PATH"
  helmfile -f helmfile.yaml sync -e "$CC_V2_ENVIRONMENT"
}
```

### `global.yaml.gotmpl` aus Template

Die `global.yaml.gotmpl` wird aus `templates/global.yaml.gotmpl.tpl` erzeugt.
Platzhalter werden durch die Variablen aus `01_config.sh` ersetzt:

```bash
render_global_yaml() {
  local tpl="${SCRIPT_DIR}/templates/global.yaml.gotmpl.tpl"
  local out="${CC_V2_DEPLOY_PATH}/environments/${CC_V2_ENVIRONMENT}/global.yaml.gotmpl"

  sed \
    -e "s|PLACEHOLDER_DOMAIN|${DOMAIN}|g" \
    -e "s|PLACEHOLDER_ENVIRONMENT|${CC_V2_ENVIRONMENT}|g" \
    -e "s|PLACEHOLDER_INSTANCE_SLUG|${CC_V2_ENVIRONMENT}|g" \
    -e "s|PLACEHOLDER_INGRESS_CLASS|${INGRESS_CLASS}|g" \
    -e "s|PLACEHOLDER_CLUSTER_ISSUER|${CLUSTER_ISSUER}|g" \
    -e "s|PLACEHOLDER_STORAGECLASS_RWO|local-path|g" \
    -e "s|PLACEHOLDER_STORAGECLASS_RWX|local-path|g" \
    -e "s|PLACEHOLDER_STORAGECLASS_LOC|local-path|g" \
    -e "s|PLACEHOLDER_SSL_REDIRECT|${SSL_REDIRECT}|g" \
    -e "s|PLACEHOLDER_SERVICE_MESH_ENABLE|false|g" \
    -e "s|PLACEHOLDER_METRICS_ENABLED|false|g" \
    -e "s|PLACEHOLDER_ADMIN_EMAIL|${ADMIN_EMAIL}|g" \
    -e "s|PLACEHOLDER_PROFILE|production|g" \
    "$tpl" > "$out"

  CONFIG_YAML_PATH="$out"
  log_ok "global.yaml.gotmpl erzeugt: ${out}"
}
```

### ssl-redirect-Patch

Nach `helmfile sync` werden alle Ingress-Ressourcen im Namespace mit der
Annotation `nginx.ingress.kubernetes.io/ssl-redirect=false` versehen:

```bash
patch_ingress_for_external_tls() {
  local ingresses
  ingresses=$(kubectl get ingress -n "$K8S_NAMESPACE" \
    -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || true)

  for ingress in $ingresses; do
    kubectl annotate ingress "$ingress" \
      -n "$K8S_NAMESPACE" \
      nginx.ingress.kubernetes.io/ssl-redirect=false \
      --overwrite
  done
}
```

### Idempotenz

- `helmfile sync` ist selbst idempotent (erkennt bereits installierte Charts).
- Bei erneuten Läufen wird `helmfile apply` statt `sync` empfohlen (schneller).
- Das Environment wird nur einmal in `helmfile.yaml` registriert.

## Modul 09 — WireGuard (`09_wireguard.sh`)

Phase 2d. Identisch zu V1. Wird erst nach erfolgreichem `helmfile sync`
ausgeführt, da der Tunnel erst aktiv sein darf, wenn die Plattform läuft.

```bash
setup_wireguard() {
  # Config aus Template rendern
  # systemctl enable --now wg-quick@wg0
  # Ping auf 10.10.10.1
}
```

## Modul 10 — Verifikation (`10_verify.sh`)

Phase 3. Erweitert die V1-Verifikation um V2-spezifische Prüfungen.

```bash
run_verification() {
  VERIFY_ERRORS=0
  verify_phase1     # k3s, cert-manager, nginx, StorageClass
  verify_phase2     # Deployment-Repo, Pods, Ingress, WireGuard
  report_result
}
```

### Prüfungen Phase 2

```bash
# Deployment-Repository
test -d "${CC_V2_REPO_PATH}/.git"

# Pods der Plattform
kubectl get pods -n "$K8S_NAMESPACE" --field-selector=status.phase!=Running,status.phase!=Succeeded

# Ingress-Ressourcen
kubectl get ingress -n "$K8S_NAMESPACE"

# SSL-Redirect deaktiviert
kubectl get ingress -n "$K8S_NAMESPACE" \
  -o jsonpath='{.items[*].metadata.annotations.nginx\.ingress\.kubernetes\.io/ssl-redirect}'
# Erwartung: "false"

# ClusterIssuer
kubectl get clusterissuer selfsigned-ca
# Erwartung: READY = True

# WireGuard
systemctl is-active wg-quick@wg0
ping -c2 10.10.10.1
```

## Idempotenz-Strategie

Jede Installationsfunktion folgt dem Muster:

```
PRÜFE ob Zielzustand bereits erreicht
  → JA:  log_ok "bereits vorhanden – überspringe"; return 0
  → NEIN: Aktion ausführen; Zielzustand erneut prüfen
```

Das Skript kann ohne Schaden mehrfach ausgeführt werden. Es verändert
keinen Zustand, der bereits korrekt ist. Besondere Idempotenz-Fälle:

| Modul | Idempotenz-Prüfung | Verhalten bei Wiederholung |
|---|---|---|
| k3s | `systemctl is-active k3s` | Überspringen, wenn aktiv und korrekte Version |
| Add-ons | `helm list -n <ns>` | Überspringen, wenn Chart bereits deployt |
| Deployment-Repo | `.git`-Verzeichnis vorhanden | Überspringen, wenn bereits geklont |
| Secrets | `kubectl get secret` | `kubectl apply` – aktualisiert bei Bedarf |
| helmfile | `helmfile sync` ist selbst idempotent | Erneute Ausführung aktualisiert nur geänderte Charts |
| WireGuard | `systemctl is-active wg-quick@wg0` | Überspringen, wenn Tunnel aktiv |

## Fehler- und Signalbehandlung

```bash
trap 'log_error "Unerwarteter Fehler in Zeile ${LINENO}. Abbruch."; exit 1' ERR
trap 'log_warn "Skript durch Signal unterbrochen."; exit 130' INT TERM
trap 'rm -f "${CONFIG_YAML_PATH:-}"' EXIT
```

Der EXIT-Trap löscht die gerenderte `global.yaml.gotmpl`, aber **nicht**
den Repository-Workspace und **nicht** die `logs/`-Artefakte von helmfile.

## Logging

```bash
log()       { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
log_ok()    { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ $*"; }
log_warn()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠ $*" >&2; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✗ $*" >&2; }
```

## Offene Punkte (vor Skriptbau zu klären)

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Branch/Tag des Deployment-Repositorys | **Offen** – muss kompatibel zu helmfile 1.1.9+ | Vor Implementierung |
| Linkerd Service Mesh | **Offen** – Auswirkungen auf Skript-Phasen und Add-ons | Architekturentscheidung |
| `profile: production` vs. `development` | **Offen** – beeinflusst Resourcen und Laufzeitverhalten | Betriebsentscheidung |
| Environment-Registrierung in `helmfile.yaml` | **Offen** – manuell oder automatisiert? | Implementierungsentscheidung |

## Festlegungen

1. Das Skript gliedert sich in 4 Hauptphasen (-1 bis 3) mit 9 Modulen.
2. Alle Konfiguration ist in `01_config.sh` zentralisiert.
3. Secrets werden ausschließlich als Umgebungsvariablen übergeben.
4. Jede Installationsfunktion ist idempotent.
5. `set -euo pipefail` und `trap ERR` sind verbindlich.
6. Die `global.yaml.gotmpl` wird aus einem Template erzeugt und nach
   der Ausführung gelöscht.
7. WireGuard wird erst nach erfolgreichem `helmfile sync` aktiviert.
8. Das Deployment-Repository liegt unter `/opt/civitas-core-v2` mit
   Symlink `/opt/civitas-core`.
9. Das `deployment/`-Verzeichnis ist ein separates Git-Repo für die
   Instanz-Konfiguration.
10. Alle Versionen werden beim Skriptbau gepinnt.
11. Das Skript bildet die **erste Ausbaustufe** ab: reproduzierbarer,
    testbarer Prototyp. Produktionsanpassungen bleiben späteren
    Spezifikationen vorbehalten.