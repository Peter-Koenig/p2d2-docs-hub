---
title: Installationsphasen und Abnahme
description: Phasendefinition, Abnahmekriterien und Fehlerbehandlung für das CIVITAS/CORE-Installationsskript auf dem Proxmox-Knoten civitas.
status: draft
lastUpdated: 2026-07-15
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-installationsphasen-und-abnahme
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-zielbild
  - civitas-core-plugin-serveraufbau-vm-sizing
  - civitas-core-plugin-serveraufbau-netzwerk
  - civitas-core-plugin-serveraufbau-kubernetes-laufzeit
quality:
  completeness: 95
  accuracy: 93
  reviewed: false
  reviewer:
  reviewDate:
---

# Installationsphasen und Abnahme

## Ziel

Dieses Dokument legt die Phasenstruktur des CIVITAS/CORE-Installationsskripts
fest und definiert die Abnahmekriterien je Phase. Es dient als verbindliche
Grundlage für den Skriptbau (`skriptarchitektur.md`) und als Checkliste für
die manuelle oder automatisierte Verifikation nach einem Installationsdurchlauf.

Die beschriebene Lösung ist als **funktionierender Prototyp** für Entwicklung
und Evaluation konzipiert. Abnahmekriterien sind bewusst auf Nachweisbarkeit
ausgelegt, nicht auf Produktionsreife.

***

## Rahmenbedingungen

- **Zielplattform**: Dedizierte Proxmox-VM auf dem Knoten `civitas`
  (12 vCPU, 40 GiB RAM, 300 GiB Disk, Debian 13 (Trixie) als Gast-OS)
- **Kubernetes-Distribution**: k3s (Single-Node, SQLite Data Store)
- **Deployment-Werkzeug**: `cc-cli` (CIVITAS/CORE CLI)
- **Pflichtkomponenten**: cert-manager, nginx-Ingress, RWO Storage Class
  (local-path-provisioner via k3s)
- **Kein öffentlicher DNS**: Alle Endpunkte (`idm.*`, `portal.*`) sind
  intern im SOHO-VLAN erreichbar; DNS-Einträge werden manuell in der
  Hetzner-WebGUI gesetzt, bevor Phase 2 ausgeführt wird
- **Ausführungskontext**: Das Skript kann auf dem Proxmox-Host oder in der
  Ziel-VM gestartet werden. Auf dem Proxmox-Host wird Phase -1 ausgeführt
  (VM-Provisionierung), danach wird die weitere Ausführung in der VM
  empfohlen. Innerhalb der VM beginnen die Phasen ab Phase 0.

***

## Phasenübersicht

Das Installationsskript gliedert sich in drei Hauptphasen plus einer
vorgelagerten Vorbedingungsprüfung:

| Phase | Name | Inhalt |
|---|---|---|
| -1 | VM-Provisionierung | VM auf Proxmox-Host erstellen (Cloud-Image, Cloud-Init) |
| 0 | Vorbedingungen | Systemprüfung, Konnektivität, Variablen |
| 1 | Kubernetes-Cluster | k3s installieren, Add-ons deployen |
| 2.0 | Repository-Klon | CIVITAS/CORE-Repository nach `/opt/civitas-core-v1` klonen, Symlink setzen |
| 2 | CIVITAS/CORE-Plattform | cc-cli installieren, Plattform deployen |
| 3 | Verifikation | End-to-End-Abnahme, Fehlerreport |

***

## Phase -1 — VM-Provisionierung

### Zweck

Die CIVITAS/CORE-VM auf dem Proxmox-Knoten "civitas" aus einem
Debian-13-Cloud-Image erzeugen. Dieser Schritt läuft nur auf dem
Proxmox-Host und wird übersprungen, wenn die VM bereits existiert
(Idempotenz).

### Voraussetzungen

- Ausführung auf dem Proxmox-Host (qm, pvesh, pvesm verfügbar)
- `ROOT_PASSWORD` als Umgebungsvariable gesetzt
- Internetzugriff für Cloud-Image-Download

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| -1.1 | Cloud-Image herunterladen (24h-Cache mit Altersprüfung) | Datei im Cache (`/var/lib/vz/template/qcow/`) vorhanden und < 24h alt |
| -1.2 | VM mit qm create anlegen (`VM_ID=2010`, 12 vCPU, 40 GiB RAM, Bridge vmbr0, QEMU-GA, serielle Konsole) | `qm status ${VM_ID}` — VM existiert |
| -1.3 | Disk aus Cloud-Image importieren (300 GiB, ZFS-thin) | `qm config ${VM_ID}` — Disk zugewiesen |
| -1.4 | Cloud-Init konfigurieren (root, SSH-Key, statische IPv4/IPv6) | `qm config ${VM_ID}` — ciuser, sshkeys, ipconfig0 gesetzt |
| -1.5 | VM starten | `qm status ${VM_ID}` → running |
| -1.6 | Warten auf SSH-Erreichbarkeit unter der konfigurierten statischen VM-IP | `ssh root@${VM_IP_STATIC} true` erreichbar |
| -1.7 | Anleitung für nächste Schritte ausgeben | — |
| -1.8 | Skript-Dateien, Module und Templates per scp in die VM kopieren (nach `${VM_REMOTE_INSTALL_DIR}`) | Dateien existieren in der VM |
| -1.9 | `.env.local` (falls vorhanden) per scp in die VM kopieren | Datei `.env.local` im Skript-Verzeichnis |
| -1.10 | SSH-Hop: Skript in der VM mit `CIVITAS_CONTEXT=vm` neu starten (Secrets aus `.env.local` werden gesourct) | — |

### Abnahmekriterien Phase -1

```bash
# VM existiert und läuft
qm status VM_ID
# Erwartung: VM-ID im Status "running"

# VM-Konfiguration prüfen
qm config VM_ID | grep -E 'memory|cores|name'
# Erwartung: speicher 40960, cores 12, name civitas-core

# SSH-Zugang funktioniert
ssh -o StrictHostKeyChecking=no root@VM_IP 'hostnamectl'
# Erwartung: Debian GNU/Linux 13 (Trixie)

# Installationsskript in VM verfügbar
ssh root@VM_IP 'ls -la install_civitas_core.sh'
```

> **Abnahme Phase -1 bestanden**, wenn die VM läuft, per SSH erreichbar ist
> und der SSH-Hop (`CIVITAS_CONTEXT=vm`) das Installationsskript erfolgreich
> in der VM gestartet hat.

### Konfigurationsvariablen Phase -1

Die folgenden Variablen werden im Konfigurationsmodul des Skripts
externalisiert:

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `VM_ID` | Proxmox VM-ID | `2010` |
| `VM_NAME` | Anzeigename in Proxmox | `civitas-core` |
| `VM_RAM_MB` | RAM in MiB | `40960` |
| `VM_CORES` | vCPUs | `12` |
| `VM_DISK_GB` | Disk-Größe in GiB | `300` |
| `VM_BRIDGE` | Bridge-Netzwerk | `vmbr0` |
| `PROXMOX_STORAGE` | Proxmox-Storage für VM-Disk | `local-zfs-civitas` |
| `CLOUD_IMAGE_URL` | URL zum Debian-13-Cloud-Image | siehe Quellcode |
| `VM_IP_STATIC` | Statische IPv4-Adresse der VM | `192.168.12.139` |
| `VM_IP_PREFIX` | IPv4-Präfixlänge | `24` |
| `VM_GW` | IPv4-Gateway | `192.168.12.1` |
| `VM_IP6_STATIC` | Statische IPv6-Adresse der VM | `fd01:1:1:1::139` |
| `VM_IP6_PREFIX` | IPv6-Präfixlänge | `64` |
| `VM_GW6` | IPv6-Gateway | `fd01:1:1:1:de39:6fff:febe:9962` |
| `SSH_PUBKEY_PATH` | Pfad zum SSH-Public-Key für root-Zugang | `${HOME}/.ssh/authorized_keys` |
| `VM_REMOTE_INSTALL_DIR` | Zielverzeichnis in der VM für scp/SSH | `/root/civitas-install` |

> **Hinweis**: `ROOT_PASSWORD` wird ausschließlich als Umgebungsvariable
> übergeben und nie hartcodiert. Das Skript bricht ab, wenn die Variable
> nicht gesetzt ist.
>
> **Secrets aus `.env.local`:** Liegt die Datei `.env.local` im Skript-Verzeichnis,
> wird sie beim SSH-Hop (Schritt -1.9) automatisch in die VM übertragen und
> dort vor dem Skriptstart gesourct. Ohne `.env.local` müssen alle Secrets
> separat als Umgebungsvariablen gesetzt werden.

***

## Phase 0 — Vorbedingungen

### Zweck

Sicherstellen, dass alle Voraussetzungen für eine erfolgreiche Installation
erfüllt sind, bevor irreversible Aktionen ausgeführt werden.

### Prüfungen

| Prüfpunkt | Erwarteter Zustand | Befehl / Methode | Fehlerverhalten |
|---|---|---|---|
| apt-Lock (cloud-init) | Kein laufender apt-Prozess (lock frei) | `fuser /var/lib/apt/lists/lock /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend` >/dev/null 2>&1; Warte max. 120s | Abbruch |
| Betriebssystem | Debian 13 (Trixie), x86_64 | `/etc/os-release` (ID=debian, VERSION_ID=13) | Abbruch |
| vCPU | ≥ 4 (empfohlen: 12) | `nproc` | Abbruch |
| RAM | ≥ 16384 MiB (empfohlen: 40 GiB) | `free -m` (numerischer Vergleich) | Abbruch |
| Disk (freier Platz k3s-Pfad) | ≥ 100 GiB | `df -h /var/lib/rancher/k3s 2>/dev/null \|\| df -h /` | Abbruch |
| Swap | Deaktiviert | `swapon --show` muss leer sein | Abbruch |
| Netzwerk (intern) | VM erreicht SOHO-Gateway | `ping -c2 <gateway>` | Abbruch |
| DNS `idm.<domain>` / `portal.<domain>` | Auflösbar | `dig +short idm.$DOMAIN` | **Warnung** (kein Abbruch, DNS wird manuell vor Phase 2 gesetzt) |
| Zeitzone | `Europe/Berlin` gesetzt | `timedatectl show --property=Timezone --value` – wird automatisch gesetzt falls abweichend | Wird korrigiert (kein Abbruch) |
| inotify-Limits (fsnotify) | `fs.inotify.max_user_watches` ≥ 524288, `fs.inotify.max_user_instances` ≥ 1024 | `/etc/sysctl.d/99-inotify.conf` – Kernel-Limits werden automatisch gesetzt falls unterschritten | Abbruch wenn aktiver Wert nach Setzen nicht dem Zielwert entspricht |
| `curl` vorhanden | Binary verfügbar | `command -v curl` | Abbruch |
| `python3` / `pip3` vorhanden | Binaries verfügbar | `command -v python3 && command -v pip3` | Abbruch |
| `wg` (wireguard-tools) | Binary verfügbar | `command -v wg` | Abbruch (wird automatisch installiert) |
| SMTP erreichbar | TCP-Verbindung zu `$SMTP_HOST:$SMTP_PORT` | `nc -z -w5 $SMTP_HOST $SMTP_PORT` | Abbruch |
| `k3s / kubectl` | Noch nicht installiert ODER bereits korrekte Version | Versionsvergleich gegen `$K3S_VERSION` | Abbruch bei falscher Version |
| Pflicht-Env-Vars | Alle mandatory Secrets gesetzt | Prüfung in `01_config.sh` via `${VAR:?}` | Abbruch |
| PBS-Storage | PBS `$PBS_STORAGE` im Proxmox-Host konfiguriert | `pvesm status \| grep $PBS_STORAGE` (nur auf Proxmox-Host) | **Warnung** (kein Abbruch – Backup auf Host-Ebene prüfen) |

> **Hinweis DNS**: Die DNS-Prüfung in Phase 0 gibt eine Warnung aus,
> bricht aber nicht ab. Hintergrund: Die DNS-Einträge für `idm.<domain>`
> und `portal.<domain>` können erst nach Vergabe der VM-IP in der
> Hetzner-WebGUI gesetzt werden. Phase 2 prüft DNS erneut — dort ist
> Auflösbarkeit eine harte Voraussetzung (Abbruch bei Fehler).

### Abnahmekriterium Phase 0

> Alle Pflichtprüfungen bestanden, oder bereits laufende Komponenten
> entsprechen der konfigurierten Zielversion (Idempotenz).
> DNS-Warnung ist zulässig. Das Skript bricht bei jeder anderen
> fehlgeschlagenen Pflichtprüfung mit klarer Fehlermeldung und
> Exit-Code ≠ 0 ab.

***

## Phase 1 — Kubernetes-Cluster

### Zweck

Einen lauffähigen, einsatzbereiten k3s-Single-Node-Cluster bereitstellen,
inklusive aller für CIVITAS/CORE erforderlichen Add-ons.

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 1.1 | k3s installieren — **`--disable traefik`** muss beim Start gesetzt werden, nicht nachträglich: `curl -sfL https://get.k3s.io \| INSTALL_K3S_VERSION="$K3S_VERSION" INSTALL_K3S_EXEC="--disable traefik" sh -` | `systemctl is-active k3s` + Versionsvergleich gegen `$K3S_VERSION` |
| 1.1a | Warten auf k3s-API: kubeconfig-Datei `/etc/rancher/k3s/k3s.yaml` vorhanden (max. 60s, 2s-Intervall) | `test -f /etc/rancher/k3s/k3s.yaml` |
| 1.1b | Warten auf Node-Registrierung: `kubectl get nodes` liefert Eintrag (max. 60s, 3s-Intervall) | `kubectl get nodes --no-headers` – mind. ein Node vorhanden |
| 1.2 | kubeconfig nach `~/.kube/config` kopieren | Datei vorhanden und korrekt (`kubectl cluster-info`) |
| 1.3 | `helm`-CLI installieren (separat — k3s bringt `helm-controller`, nicht die `helm`-CLI) | `command -v helm` + Versionsvergleich gegen `$HELM_VERSION` |
| 1.3a | Kubernetes Gateway API CRDs installieren (Voraussetzung für cert-manager Gateway-Support) | `kubectl get crd gateways.gateway.networking.k8s.io` |
| 1.4 | cert-manager via Helm deployen (Namespace `cert-manager`, mit `--set config.enableGatewayAPI=true`) | `kubectl get pods -n cert-manager` → alle Running |
| 1.5a | Bootstrap-ClusterIssuer anlegen (Namespace cert-manager) | `kubectl get clusterissuer civitas-bootstrap-selfsigned` |
| 1.5b | Root-CA-Certificate anlegen (Namespace cert-manager) | `kubectl get certificate civitas-core-ca -n cert-manager` → READY=True |
| 1.5c | Produktiver ClusterIssuer `selfsigned-issuer` mit CA-Referenz | `kubectl get clusterissuer selfsigned-issuer` → READY=True |
| 1.5d | CA-Trust: cert in System-Store + certifi im venv | `curl -sf https://idm.${DOMAIN}/` ohne `--insecure` |
| 1.6 | nginx-Ingress via Helm deployen (Namespace `ingress-nginx`) | `kubectl get pods -n ingress-nginx` → controller Running |
| 1.7 | Storage Class prüfen (`local-path-provisioner` durch k3s mitgeliefert, **nicht deaktivieren**) | `kubectl get storageclass` → `local-path` als Default |
| 1.8 | Gateway-Ressource `civitas-gateway` im Namespace `ingress-nginx` anlegen (Listener HTTP Port 80, GatewayClass `nginx`) | `kubectl get gateway civitas-gateway -n ingress-nginx` → READY=True |

> **Wichtig (Reihenfolge)**: Die Gateway-API-CRDs (Schritt 1.3a) werden vor
> cert-manager (Schritt 1.4) installiert, da cert-manager die CRDs beim Start
> erwartet. cert-manager und ClusterIssuer (Schritte 1.4–1.5d) werden vor
> nginx-Ingress (Schritt 1.6) installiert, damit der Ingress-Controller bei
> Bedarf sofort TLS-fähig ist. Die Gateway-Ressource (Schritt 1.8) wird nach
> nginx-Ingress installiert, da der nginx-Ingress-Controller die GatewayClass
> `nginx` erst nach der Installation registriert.

> **Wichtig (local-path-provisioner)**: Der `local-path-provisioner` ist
> Bestandteil von k3s und stellt die Default-StorageClass bereit. Er darf
> **nicht** über `--disable local-storage` deaktiviert werden. Deaktiviert
> werden ausschließlich: `traefik` (durch nginx ersetzt), optional `servicelb`
> und `metrics-server` nach Absprache.

### Konfigurationsvariablen Phase 1

Die folgenden Variablen werden im Konfigurationsmodul des Skripts
externalisiert und gelten phasenübergreifend:

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `K3S_VERSION` | k3s-Release-Version (Pinning) | `v1.32.3+k3s1` |
| `HELM_VERSION` | Helm-CLI-Version | `v3.17.0` |
| `GATEWAY_API_VERSION` | Kubernetes Gateway API CRDs (standard channel) | `v1.2.1` |

> Die Versionen werden beim ersten Skriptbau aus der aktuellen
> Release-Dokumentation von k3s und Helm ermittelt und im
> Konfigurationsmodul fixiert.

### Abnahmekriterien Phase 1

Nach Abschluss von Phase 1 müssen alle folgenden Prüfungen positiv sein:

```bash
# Cluster-Status
kubectl get nodes
# Erwartung: 1 Node, Status "Ready"

# System-Pods
kubectl get pods -A
# Erwartung: Alle Pods "Running" oder "Completed",
#            kein "Error" / "CrashLoopBackOff"

# cert-manager
kubectl get pods -n cert-manager
# Erwartung: cert-manager, cert-manager-cainjector,
#            cert-manager-webhook jeweils "Running"

# Gateway API CRDs
kubectl get crd gateways.gateway.networking.k8s.io
# Erwartung: CRD vorhanden (kein "NotFound")

# ClusterIssuer
kubectl get clusterissuer
# Erwartung: Issuer vorhanden, READY = True

# nginx-Ingress
kubectl get pods -n ingress-nginx
# Erwartung: ingress-nginx-controller "Running"

# Storage Class
kubectl get storageclass
# Erwartung: "local-path" vorhanden, als Default markiert
#   (Annotation: storageclass.kubernetes.io/is-default-class=true)

# CA-Issuer-DN nicht leer
openssl x509 -in /usr/local/share/ca-certificates/civitas-core-ca.crt \
  -noout -issuer | grep "CN=civitas-core-ca"

# CA-ClusterIssuer READY
kubectl get clusterissuer selfsigned-issuer \
  -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' | grep True
```

> **Abnahme Phase 1 bestanden**, wenn alle Prüfungen den beschriebenen
> Zustand aufweisen. Das Skript protokolliert die Ergebnisse und bricht
> bei Abweichungen ab. Die neu hinzugekommene Gateway-API-CRD-Prüfung
> (`gateways.gateway.networking.k8s.io`) ist für den Betrieb von cert-manager
> mit Gateway-API-Support und für die korrekte Verarbeitung von Gateway-Routen
> durch cc_cli erforderlich.


***

## Phase 2.0 — Repository-Klon

### Zweck

Das CIVITAS/CORE-Repository mit den Ansible-Playbooks auf die
Ziel-VM klonen. `cc_cli exec` sucht `playbook.yml` relativ zum CWD — das
Repository muss daher vor dem Aufruf bereitstehen.

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2.0.1 | Repository klonen nach `/opt/civitas-core-v1` | `.git`-Verzeichnis vorhanden → `git pull` statt `clone` |
| 2.0.2 | Symlink `/opt/civitas-core → /opt/civitas-core-v1` setzen | `readlink /opt/civitas-core` liefert `/opt/civitas-core-v1` |

### Konfigurationsvariablen

| Variable | Beschreibung | Wert |
|---|---|---|
| `CC_V1_REPO_URL` | Repository-URL | `https://gitlab.com/civitas-connect/civitas-core/civitas-core-v1/civitas-core.git` |
| `CC_V1_REPO_PATH` | Lokaler Pfad | `/opt/civitas-core-v1` |
| `CC_V1_REPO_BRANCH` | Branch | `main` |

### Abnahmekriterien Phase 2.0

```bash
# Repository vorhanden
test -d /opt/civitas-core-v1/.git
# Playbook auffindbar
test -f /opt/civitas-core-v1/playbook.yml
# Symlink korrekt
test "$(readlink /opt/civitas-core)" = "/opt/civitas-core-v1"
```

***

## Phase 2 — CIVITAS/CORE-Plattform

### Zweck

Die CIVITAS/CORE-Plattform über `cc-cli` auf dem in Phase 1 bereitgestellten
Cluster installieren. Der Aufruf von `cc_cli validate` und `cc_cli exec`
erfolgt aus dem in Phase 2.0 geklonten Repository-Verzeichnis
`/opt/civitas-core-v1`.

### Voraussetzungen

- Phase 1 vollständig abgenommen.
- Phase 2.0 vollständig abgenommen (Repository vorhanden).
- Gültiger kubeconfig unter `~/.kube/config`.
- DNS-Einträge für `idm.$DOMAIN` und `portal.$DOMAIN` auflösbar
  (hier harte Prüfung — Abbruch bei Fehler).
- SMTP-Zugangsdaten als Umgebungsvariablen gesetzt.

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2.0 | DNS erneut prüfen (harter Abbruch wenn nicht auflösbar) | `dig +short idm.$DOMAIN` und `dig +short portal.$DOMAIN` — beide müssen eine IP liefern |
| 2.0b | Repository klonen nach `/opt/civitas-core-v1` | `.git`-Verzeichnis vorhanden, `playbook.yml` gefunden |
| 2.1 | Overlay-Dateien einspielen: `apply_overlay()` kopiert Dateien aus `overlay_V1/` in das geklonte Repo (z. B. Keycloak-Values mit `servicePort: http`). Originaldateien werden nach `.overlay_backup/` gesichert. | Log pro kopierter Datei; Abbruch wenn Zielverzeichnis fehlt |
| 2.1b | Masterportal-Release-Namen patchen: `patch_masterportal_release_name()` fügt `| lower` zu `gd_instance.instance_name` im Helm-Release-Namen hinzu (RFC-1123: Großbuchstaben in Release-Namen ungültig) | `grep -q "instance_name | lower"` in der Task-Datei |
| 2.1c | `cc-cli` installieren (gepinnte Version `1.5.0`) + `ansible`, `kubernetes`, `openshift`, `jmespath` im venv. Ansible-Logging wird aktiviert: `ANSIBLE_LOG_PATH`, `ANSIBLE_VERBOSITY=3` | `pip show cc-cli \| grep Version` vs. `$CC_CLI_VERSION` |
| 2.1d | CA-Trust im certifi-Bundle aktualisieren (venv existiert jetzt) | `grep "civitas-core-ca" "${certifi_bundle}"` |
| 2.2 | Inventory `cc_cli_inventory.yml` aus Template erzeugen + http-Sicherheitscheck: Abbruch wenn `hostname: "http://` im gerenderten Inventory | Datei vorhanden, Platzhalter geprüft, kein `http://` im hostname |
| 2.3 | `cc_cli validate` ausführen | Exit-Code 0 |
| 2.4b | WireGuard konfigurieren und Tunnel aktivieren (vor cc_cli exec) | `systemctl is-active wg-quick@wg0` |
| 2.4c | **cc_cli exec** (single run, alle Komponenten). Ansible-Log unter `logs/ansible_run_latest.log` | Exit-Code 0 (404 wird toleriert) |
| 2.4d | Logfile-Prüfung + Warten auf Pods | `test -f logs/ansible_run_latest.log`; `kubectl wait pods --all -n cc-prd-access-stack` |
| 2.4e | **Staging-Vorabprüfung für Produktionszertifikate:** Vor dem ersten produktiven Let's-Encrypt-Zertifikat für einen Hostnamen MUSS zuerst ein Staging-Zertifikat per Annotation `cert-manager.io/cluster-issuer=letsencrypt-staging` auf der Ingress-Ressource ausgelöst werden. Die Staging-Pflicht gilt ausschließlich für NEU anzufordernde Zertifikate. Bereits vorhandene, gültige Zertifikate (aus laufendem Cluster oder Datei-Backup) sind von der Staging-Pflicht ausgenommen. Nach erfolgreicher Verifikation wird die Ingress mit `civitas.io/staging-verified: "true"` annotiert. | `kubectl get ingress <name> -n cc-prd-access-stack -o jsonpath='{.metadata.annotations.civitas\.io/staging-verified}' \| grep -q "true"` ODER Hostname ist bereits im Produktivbetrieb (gültiges Produktionszertifikat vorhanden) ODER ein gültiges Zertifikat für den Hostnamen liegt in einem Datei-Backup (le-certs-backup.yaml) vor UND wurde erfolgreich restauriert (notBefore-Zeitstempel vor/nach Restore identisch) |
| 2.4f | **`switch_certificate_issuer()`:** Automatisierter Wechsel des Ausstellers für alle Ingress-Ressourcen. Setzt staging auf ALLE Ingresses, wartet auf READY, prüft Aussteller auf `(STAGING)`, setzt dann production auf ALLE Ingresses, prüft erneut. Report mit Erfolg/Fehler pro Host, kein Abbruch bei Einzelfehlern. | `kubectl get ingress --all-namespaces -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.annotations.cert-manager\.io/cluster-issuer}{"\n"}{end}'` – alle Einträge müssen `letsencrypt-prod` lauten |


> **Hinweis Arbeitsverzeichnis:** `cc_cli exec` wird aus `/opt/civitas-core-v1`
> heraus aufgerufen (`cd /opt/civitas-core-v1 && cc_cli exec ...`).
> `cc_cli` sucht `playbook.yml` relativ zum CWD. Ein Aufruf aus einem anderen
> Verzeichnis führt zu `Could not find any playbook to execute.`

> **Hinweis cc_cli-exec (single run):** cc_cli exec wird in einem einzigen
> Durchlauf ohne Tag-Filterung ausgeführt. Der Ansible-Playbook-Lauf installiert
> alle Komponenten, die im Inventory auf `enable: true` gesetzt sind. Ein
> Fehler in einer Komponente führt standardmäßig zum Abbruch des gesamten
> Durchlaufs. Daher werden bekannte Idempotenz-Fehler (z. B. HTTP 404 beim
> Löschen einer bereits entfernten Keycloak-Ressource) im Log toleriert, sodass
> nachfolgende Komponenten nicht blockiert werden.
>
> **Ansible-Logging:** Vor dem Start von cc_cli exec werden folgende
> Umgebungsvariablen gesetzt:
> - `ANSIBLE_LOG_PATH` – Pfad zum Logfile (`logs/ansible_run_latest.log`)
> - `ANSIBLE_VERBOSITY=3` – Detailgrad der Ansible-Ausgabe (Modul-Argumente,
>   Return-Werte, SSH-Verbindungsdetails)
>
> Das Logfile wird bei jedem Lauf überschrieben und nach dem Skriptdurchlauf
> auf Existenz geprüft. Bei Fehlern bleibt das Log erhalten (kein Cleanup
> durch Traps, da alle Traps deaktiviert sind).
>
> **Bekanntes Problem:** Die Keycloak-Tenant-Konfiguration enthält einen Task
> "Delete piveau-hub-repo default resource", der bei Erstinstallation
> erwartungsgemäß HTTP 204 zurückgibt, bei Wiederholung jedoch HTTP 404
> (Ressource bereits gelöscht). Dieser 404-Fehler wird vom Skript toleriert
> (kein Abbruch), sodass nachfolgende Komponenten nicht betroffen sind.

> **Hinweis cc_cli-Installation**: Die Installation erfolgt in einem isolierten
> Python-venv unter `${CC_CLI_VENV_PATH}`. Zusätzlich zu `cc-cli` werden die
> Pakete `ansible`, `kubernetes`, `openshift` (für k8s-Ansible-Module) und
> `jmespath` (für `json_query`-Filter in Playbooks) installiert. Nach der
> pip-Installation werden die benötigten Ansible-Collections über
> `ansible-galaxy collection install` bezogen. Ohne diese Collections schlagen
> Playbooks, die `kubernetes.core`, `community.grafana` oder `community.mongodb`
> verwenden, fehl.

> **Hinweis: certifi-CA-Bundle**
> Das Python-venv unter `${CC_CLI_VENV_PATH}` enthält `certifi` mit einem
> eigenen CA-Bundle. Dieser enthält per Default keine selbst-signierten CAs.
> Das Root-CA-Cert muss vor `cc_cli validate` / `cc_cli exec` in das
> certifi-Bundle eingetragen sein. Schritt 1.5d (Phase 1b) kann dies noch
> nicht leisten, da das venv zu dem Zeitpunkt noch nicht existiert. Daher
> wiederholt Schritt 2.1c (`update_ca_trust_certifi()`) den certifi-Eintrag
> unmittelbar nach der venv-Erstellung.
> Das Skript ruft `${CC_CLI_VENV_PATH}/bin/cc_cli` direkt auf — das venv
> muss nicht per `source activate` aktiviert werden. Das certifi-Bundle
> jedoch muss das CA-Cert enthalten.

> **Hinweis TLS (HAProxy-Architektur)**: Der HAProxy auf OPNsense leitet
> TLS-Verbindungen f&uuml;r `*.udp.data-dna.eu` per TCP-Passthrough (Layer&thinsp;4)
> direkt an `10.10.10.5:443` weiter. nginx in der VM terminiert TLS
> selbstst&auml;ndig mit Zertifikaten von cert-manager. Der globale
> `ssl-redirect=true` (Helm-Default) ist korrekt und erw&uuml;nscht.
> Anders als in der fr&uuml;heren Caddy-Architektur wird kein Ingress-Patch
> mehr ben&ouml;tigt &ndash; die `tls`-Sektion in Ingress-Ressourcen bleibt erhalten
> und wird von nginx zur TLS-Terminierung verwendet.
>
> **Ansible-Health-Checks**: Die integrierten Health-Checks von cc_cli
> (`inv_checks`) sind im Inventory-Template auf `enable: true` gesetzt.
> Die Checks rufen die externen URLs (`https://idm.udp.data-dna.eu/`) auf.
> Der Pfad f&uuml;hrt vom venv in der VM &uuml;ber WireGuard &rarr; OPNsense &rarr; HAProxy
> &rarr; TCP-Passthrough zur&uuml;ck zur VM:443 &rarr; nginx (TLS-Ende) &rarr; Service.
> nginx antwortet mit HTTP&thinsp;200, da TLS korrekt terminiert wird.
>
> **Hinweis: Namespace-Konvention**: `cc_cli exec` legt keine Namespaces mit
> festen Namen an, sondern leitet diese aus dem Inventory-Feld
> `all.vars.ENVIRONMENT` (z. B. `cc-prd`) ab. Pro Stack-Komponente entsteht
> ein Namespace nach dem Muster `{ENVIRONMENT}-{stack}`:
>
| Namespace | Stack | Enth&auml;lt typischerweise |
|---|---|---|
| `cc-prd-access-stack` | Access | Keycloak, APISIX, Service Portal |
| `cc-prd-context-stack` | Context | Frost-Server (SensorThings), QuantumLeap, Stellio |
| `cc-prd-dashboard-stack` | Dashboard | Apache Superset, Grafana |
| `cc-prd-database-stack` | Database | PostgreSQL, ggf. weitere Datenbanken |
| `cc-prd-operation-stack` | Operation | Prometheus, Grafana, Loki, PGAdmin, Velero |
>
> Das Installationsskript definiert in `01_config.sh` das Array
> `K8S_NAMESPACES`, das aus `CC_ENVIRONMENT` abgeleitet wird:
> ```bash
> CC_ENVIRONMENT="${CC_ENVIRONMENT:-cc-prd}"
> K8S_NAMESPACES=(
>   "${CC_ENVIRONMENT}-access-stack"
>   "${CC_ENVIRONMENT}-context-stack"
>   "${CC_ENVIRONMENT}-dashboard-stack"
>   "${CC_ENVIRONMENT}-database-stack"
>   "${CC_ENVIRONMENT}-operation-stack"
> )
> ```
> Der fr&uuml;here Einzel-Namespace `K8S_NAMESPACE` (z. B. `civitas-core`)
> existiert nicht mehr &ndash; alle Pr&uuml;fungen in Phase 2 und Phase 3
> iterieren &uuml;ber das `K8S_NAMESPACES`-Array.



> **Hinweis Overlay-Mechanismus (overlay_V1/)**: Statt per sed auf Textmuster
> im geklonten Upstream-Repo zu patchen (fragil bei Repo-Änderungen), werden
> abweichende Dateien als vollständige Kopien in `civitas_einrichtung/overlay_V1/`
> vorgehalten. Die Funktion `apply_overlay()` in `06_civitas.sh` kopiert nach
> `clone_civitas_repo()` alle Dateien aus `overlay_V1/` in die entsprechende
> Zielstruktur unterhalb von `CC_CLI_PLAYBOOK_DIR`. Vor dem Überschreiben wird
> ein Backup der Originaldatei nach `.overlay_backup/<relpath>.orig` angelegt
> (nur einmalig, bei erstem Lauf). Fehlt ein Zielverzeichnis, bricht das Skript
> mit einem Hinweis auf eine mögliche Strukturänderung im Upstream-Repo ab.
>
> Derzeit enthaltene Overlays:
> - `overlay_V1/templates/access/keycloak/keycloak-values.yaml` – setzt
>   `ingress.servicePort: http` und `backend-protocol: HTTP` für alle Ingress-
>   und adminIngress-Blöcke (behebt 502 Bad Gateway bei TLS-Upstream).
>
> **Hinweis Masterportal-Release-Name (RFC-1123)**: Der Task `masterportal.yml`
> im Upstream-Repo setzt den Helm-Release-Namen aus `gd_instance.instance_name`
> (z. B. "Standard") zusammen. Helm erlaubt aber nur RFC-1123-konforme Namen
> (Kleinbuchstaben). Die Funktion `patch_masterportal_release_name()` in
> `06_civitas.sh` fügt nach dem Overlay den `| lower`-Filter ein, sodass
> `gd_instance.instance_name | lower` verwendet wird.
>
> **Hinweis http-Sicherheitscheck in render_inventory()**: Nach dem Erzeugen
> des `cc_cli_inventory.yml` prüft das Skript, ob der Wert von
> `inv_access.platform.hostname` fälschlich `http://` enthält. Ist dies der
> Fall (z. B. durch falsche Konfiguration von `inv_k8s.ingress.http: false`),
> bricht das Skript sofort ab. Der Check verhindert den 308-Permanent-Redirect-
> Fehler, bei dem nginx HTTP-Anfragen an die Keycloak-Admin-API per 308 auf
> HTTPS umleitet und Ansible's uri-Modul den Redirect als Fehler wertet.
>
> **Hinweis Ansible-Logging**: Vor dem Start von `run_cc_cli_exec()` werden
> die Umgebungsvariablen `ANSIBLE_LOG_PATH` (gesetzt auf
> `logs/ansible_run_latest.log`), `ANSIBLE_VERBOSITY=3` und `ANSIBLE_DEBUG`
> (entfernt, da es 'debug' is not a valid AnsibleEventType' verursacht)
> gesetzt. Alle Traps (ERR, EXIT, INT, TERM) sind deaktiviert, sodass
> Logfiles und temporäre Dateien bei Fehlern erhalten bleiben.



### Restore aus Datei-Backup (le-certs-backup.yaml)

Zusätzlich zu den beiden bestehenden Fällen (Staging-Annotation, laufender Produktivbetrieb)
existiert ein dritter Fall: Ein gültiges Let's-Encrypt-Produktionszertifikat liegt in einer
Datei (`le-certs-backup.yaml`) vor und wird in den Cluster restauriert. In diesem Moment
existiert im Cluster kein Nachweis mehr, dass das Zertifikat bereits im Produktivbetrieb war
— der Nachweis liegt nur noch in der Backup-Datei selbst vor.

#### Vorbedingung

- Die Datei `le-certs-backup.yaml` muss im Verzeichnis `${VM_REMOTE_INSTALL_DIR}` existieren.
- Die Datei enthält Kubernetes-Secret-Definitionen mit gültigen Let's-Encrypt-Produktionszertifikaten
  (felder: `tls.crt`, `tls.key`, `ca.crt`).

#### Verbindliche Schritt-Reihenfolge

1. **Backup-Secrets einspielen** (`kubectl apply -f le-certs-backup.yaml`).
   Wichtig: Die Felder `resourceVersion`, `uid` und `creationTimestamp` müssen aus dem
   Backup entfernt worden sein, da kubectl apply sonst mit einem Conflict-Fehler abbricht.
   Dies ist bei einem YAML-Export über `kubectl get secret ... -o yaml` standardmäßig
   der Fall und muss vor dem Backup bereinigt werden.

2. **Ingress-Annotation auf den Ziel-Issuer setzen.** Erst nach erfolgreichem Einspielen
   der Secrets wird die Annotation `cert-manager.io/cluster-issuer` auf den Wert
   `letsencrypt-prod` gesetzt (bzw. auf den Wert, der dem wiederhergestellten Zertifikat
   entspricht).

3. **Certificate-Objekte löschen (Delete+Recreate).** Nach dem Setzen der Annotation
   werden die vorhandenen Certificate-Ressourcen gelöscht. ingress-shim erstellt sie
   sofort neu — jetzt mit dem korrekten issuerRef aus der Annotation. cert-manager
   reconcilingt, findet das bereits vorhandene, gültige Secret und markiert das
   Certificate als `Ready` — ohne neue ACME-Anfrage (CertificateRequest/Order/Challenge).
   (Bei NO_NEW_LE_CERT=true wird die Löschung übersprungen; in diesem Fall reicht
   das Annotation-Update durch ingress-shim aus, da der issuerRef im Certificate-Objekt
   bereits zum Secret passt.)

4. **Verifikation des notBefore-Zeitstempels.** Der `notBefore`-Zeitstempel des
   wiederhergestellten Zertifikats muss mit dem Zeitstempel aus der Backup-Datei
   übereinstimmen. Dies beweist, dass keine Neuausstellung stattgefunden hat.

   ```bash
   NOT_BEFORE_BACKUP=$(yq eval 'select(.metadata.name == "idm.'"${DOMAIN}"'-tls") | .data["tls.crt"]' le-certs-backup.yaml | base64 -d | openssl x509 -noout -dates 2>/dev/null | grep notBefore | cut -d= -f2)
   NOT_BEFORE_CLUSTER=$(kubectl get secret idm.${DOMAIN}-tls -n ${CC_ENVIRONMENT}-access-stack \
     -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -dates | grep notBefore | cut -d= -f2)
   if [ "${NOT_BEFORE_BACKUP}" = "${NOT_BEFORE_CLUSTER}" ]; then
     echo "OK: notBefore identisch — keine Neuausstellung"
   else
     echo "FEHLER: notBefore abweichend — Neuausstellung trotz Restore"
   fi
   ```

#### Reihenfolge-Verletzung (Vorsicht)

Wird die Reihenfolge vertauscht (z. B. Annotation vor Backup-Einspielen oder Certificate-Löschung
vor Backup-Einspielen), entsteht ein Zeitfenster, in dem cert-manager das fehlende oder
nicht zum Issuer passende Secret bemerkt und eine reale Let's-Encrypt-Anfrage auslöst,
bevor der Restore greift. Dies verbraucht unnötig Rate-Limit-Kontingent.


### TLS-Zertifikatskette und Issuer-Rollen

Die TLS-Zertifikatskette in der CIVITAS/CORE-VM folgt einem dreistufigen Modell:

| Stufe | Ressource | Rolle |
|---|---|---|
| 1 | `ClusterIssuer` `civitas-bootstrap-selfsigned` (`spec.selfSigned: {}`) | Erzeugt die Root-CA. Dient nur zur Signatur des Root-CA-Zertifikats, nicht für Anwendungszertifikate. |
| 2 | `Certificate` `civitas-core-ca` (Namespace `cert-manager`) | Root-CA mit nicht-leerem Issuer-DN (`CN=civitas-core-ca`, `O=civitas-core`, `C=DE`). Liegt als `Secret` `civitas-core-ca-secret` vor. |
| 3 | `ClusterIssuer` `selfsigned-issuer` (`spec.ca.secretName: civitas-core-ca-secret`) | Produktiver CA-Issuer. Signiert alle Anwendungszertifikate (Keycloak, Portal). |

Zusätzlich wird langfristig ein dedizierter CA-ClusterIssuer mit aussagekräftigem Namen empfohlen:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: civitas-core-ca-issuer
spec:
  ca:
    secretName: civitas-core-ca-secret
```

Dieser Issuer kann im Inventory unter `cert_manager.issuer_name` referenziert werden und macht die Rollentrennung explizit: `selfsigned-issuer` bleibt als Alias erhalten, aber neue Installationen sollten `civitas-core-ca-issuer` verwenden.

**Wichtig:** Ein `Certificate` im Namespace `cc-prd-access-stack` (z. B. für Keycloak) muss in seinem `issuerRef` den CA-Issuer referenzieren, nicht den Bootstrap-Issuer:

```yaml
# Korrekt: Anwendungszertifikat mit CA-Issuer
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: idm.udp.data-dna.eu-tls
  namespace: cc-prd-access-stack
spec:
  secretName: idm.udp.data-dna.eu-tls
  commonName: idm.udp.data-dna.eu
  dnsNames:
    - idm.udp.data-dna.eu
  issuerRef:
    name: civitas-core-ca-issuer   # oder selfsigned-issuer (CA-Typ)
    kind: ClusterIssuer
```

Wird stattdessen fälschlich der Bootstrap-Issuer referenziert, signiert cert-manager das Zertifikat ohne CA-Bezug – der TLS-Handshake scheitert mit `unknown CA`.

### Let's-Encrypt-ClusterIssuer (Gateway API HTTP-01)

Für die Ausstellung öffentlich vertrauenswürdiger TLS-Zertifikate werden
zwei ClusterIssuer vom Typ `ACME` vorgehalten:

| Name | Server | Zweck |
|---|---|---|
| `letsencrypt-staging` | `https://acme-staging-v02.api.letsencrypt.org/directory` | Test (hohe Rate-Limits) |
| `letsencrypt-prod` | `https://acme-v02.api.letsencrypt.org/directory` | Produktion |

Beide Issuer verwenden den `gatewayHTTPRoute`-Solver:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: {{ inv_k8s.cert_manager.le_email }}
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        gatewayHTTPRoute:
          parentRefs:
          - name: civitas-gateway
            namespace: ingress-nginx
            sectionName: http
```

Der `civitas-gateway` muss vor der Issuer-Erstellung existieren
(siehe Phase 1, Schritt 1.8). Der HTTP-01-Listener auf Port 80 wird
vom nginx-Ingress-Controller (GatewayClass `nginx`) verarbeitet.

**Automatische vs. manuelle Erzeugung:**

Das CIVITAS/CORE-Playbook erzeugt die LE-ClusterIssuer automatisch, wenn
im Inventory die folgenden Werte gesetzt sind:

| Variable | Wert |
|---|---|
| `inv_k8s.cert_manager.le_email` | E-Mail-Adresse für ACME-Registrierung (z. B. `admin@data-dna.eu`) |
| `inv_k8s.cert_manager.create_letsencrypt_issuer` | `true` |

In der aktuellen Entwicklungsphase sind diese Werte auf `""` bzw.
`false` gesetzt, um die automatische Erzeugung zu unterdrücken
(der Gateway und der HAProxy-Durchgriff müssen zuerst getestet
werden). Die Issuer können dann manuell aus den Templates in
`templates_V1/cert_manager/` deployt werden:

```bash
kubectl apply -f templates_V1/cert_manager/staging_issuer.yml
kubectl apply -f templates_V1/cert_manager/production_issuer.yml

> **Hinweis Keycloak-Ingress (HTTP-Backend)**: Der Ingress `idmkeycloak` im Namespace `cc-prd-access-stack` wird vom Bitnami-Keycloak-Helm-Chart mit `servicePort: https` gerendert, was nginx veranlasst, den Keycloak-Pod auf Port 8443 (HTTPS) anzusprechen. Da Keycloak mit `KC_HTTP_ENABLED=true` betrieben wird, erwartet es HTTP auf Port 8080 und bricht die TLS-Verbindung mit "prematurely closed connection" ab (502 Bad Gateway). Der Patch in Schritt 2.0c aendert `ingress.servicePort`, `adminIngress.servicePort` und `extraPaths.port.name` von `https` auf `http` sowie `backend-protocol` von `HTTPS` auf `HTTP` in der Datei `templates/access/keycloak/keycloak-values.yaml` des geklonten Repos. Damit spricht nginx den Keycloak-Pod per HTTP auf Port 8080 an, TLS terminiert weiterhin an nginx. Dies entspricht dem CIVITAS-Standard: Edge-TLS, interner Verkehr HTTP.

```

### Konfigurationsvariablen (Pflichtfelder)

Alle Variablen werden im Konfigurationsmodul des Skripts externalisiert.
Passwörter und Secrets werden ausschließlich als Umgebungsvariablen
übergeben — **nie hartcodiert oder in Git eingecheckt**.

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `DOMAIN` | Basis-Domain für `idm.` und `portal.` | `udp.data-dna.eu` |
| `SMTP_HOST` | SMTP-Server (netcup) | `mx92c.netcup.net` (exakter Hostname aus WCP) |
| `SMTP_PORT` | SMTP-Port | `587` |
| `SMTP_USER` | SMTP-Absender | `noreply@data-dna.eu` |
| `SMTP_PASS` | SMTP-Passwort | Aus Umgebungsvariable `$SMTP_PASS` |
| `SMTP_FROM` | SMTP-Absenderadresse für E-Mails | `no-reply@data-dna.eu` |
| `CC_CLI_VERSION` | cc-cli-Version (Pinning) | `1.5.0` — nicht `latest` |
| `CC_V1_REPO_URL` | Repository-URL des CIVITAS/CORE V1-Monorepos | `https://gitlab.com/civitas-connect/civitas-core/civitas-core-v1/civitas-core.git` |
| `CC_V1_REPO_PATH` | Lokaler Pfad des geklonten Repositorys | `/opt/civitas-core-v1` |
| `CC_CLI_PLAYBOOK_DIR` | Verzeichnis mit `playbook.yml` (cc_cli CWD) | `${CC_V1_REPO_PATH}/core_platform` |
| `CC_V1_REPO_BRANCH` | Git-Branch | `main` |
| `TIMEOUT_CC_CLI_EXEC` | Timeout für `cc_cli exec` in Sekunden | `600` |
| `ADMIN_EMAIL` | Platform-Admin-E-Mail (auch Keycloak-master_username) | `admin@data-dna.eu` |
| `ADMIN_PASS` | Keycloak-Master-Password + initiales platform\_admin-Passwort (identisch, kein separater Wert). Muss Keycloak-Policy erfüllen: ≥12 Zeichen, 1 Ziffer, 1 Groß-/Kleinbuchstabe, 1 Sonderzeichen | Aus `.env.local` |
| `TENANT_ADMIN_PASS` | Tenant-Admin-Passwort (separat von ADMIN\_PASS). Nur bei `--tags tenant` aktiv (`configure_central_idm: true`). Trotzdem immer setzen, da das Playbook das Feld erwartet | Aus `.env.local` |
| `CERT_MANAGER_ISSUER` | ClusterIssuer-Name für Anwendungszertifikate | `civitas-core-ca-issuer` (CA-Typ) |


> **Hinweis SMTP**: Für Keycloak (Bestandteil von CIVITAS/CORE V2) ist
> eine erreichbare SMTP-Konfiguration zwingend. Ohne gültige SMTP-Verbindung
> schlägt `cc_cli validate` fehl. Die SMTP-Erreichbarkeit wird bereits in
> Phase 0 geprüft.

> **Hinweis cc-cli-Version**: `CC_CLI_VERSION` ist immer auf eine konkrete
> Versionsnummer zu setzen (derzeit `1.5.0`), niemals `latest`. Breaking
> Changes durch neue Releases werden so vermieden.

### Abnahmekriterien Phase 2

```bash
# DNS-Auflösung (harte Voraussetzung)
dig +short idm.$DOMAIN
dig +short portal.$DOMAIN
# Erwartung: jeweils eine IP-Adresse

# Namespace-Prüfung über das K8S_NAMESPACES-Array
for ns in "${K8S_NAMESPACES[@]}"; do
  kubectl get namespace "$ns"
done
# Erwartung: alle drei Namespaces "Active"

# TLS-Zertifikate pro Namespace prüfen
for ns in "${K8S_NAMESPACES[@]}"; do
  kubectl get certificate -n "$ns"
done
# Erwartung: READY=True für alle Zertifikate, issuerRef zeigt auf CA-Issuer

# IssuerRef-Konsistenz prüfen (Certificates müssen CA-Issuer referenzieren)
for ns in "${K8S_NAMESPACES[@]}"; do
  kubectl get certificate -n "$ns" \
    -o jsonpath='{range .items[*]}{.metadata.name}{" → "}{.spec.issuerRef.name}{"\n"}{end}'
done
# Erwartung: issuerRef.name = selfsigned-issuer oder civitas-core-ca-issuer
#            NICHT: civitas-bootstrap-selfsigned

# TLS-Endpunkt-Prüfung (HTTPS via HAProxy-Passthrough, --cacert prüft CA-Trust)
curl -sf --max-time 10 \
  --cacert /usr/local/share/ca-certificates/civitas-core-ca.crt \
  "https://idm.${DOMAIN}/realms/master"
# Erwartung: HTTP 200 oder Keycloak-Response, KEIN "unknown CA" / "self-signed certificate"

curl -sf --max-time 10 \
  --cacert /usr/local/share/ca-certificates/civitas-core-ca.crt \
  "https://${DOMAIN}/"
# Erwartung: HTTP 200 oder Redirect, KEIN "unknown CA"


# Staging-vor-Produktion-Verifikation (Let's Encrypt)
# Wenn ein Hostname produktiv mit Let's Encrypt betrieben wird, muss
# vor dem produktiven Request ein Staging-Zertifikat erfolgreich
# ausgestellt und verifiziert worden sein. DIES GILT NUR FÜR NEU
# ANZUFORDERNDE ZERTIFIKATE. Bereits vorhandene, gültige Zertifikate
# (im laufenden Cluster oder aus Datei-Backup restauriert) sind von
# der Staging-Pflicht ausgenommen.
STAGING_ANNOTATION=$(kubectl get certificate idm.udp.data-dna.eu-tls -n cc-prd-access-stack -o jsonpath='{.metadata.annotations.civitas\.io/staging-verified}' 2>/dev/null)
if [ "${STAGING_ANNOTATION}" = "true" ]; then
  echo "Staging-Verifikation bestanden (Annotation vorhanden)"
else
  # Prüfe alternativ, ob ein gültiges Zertifikat aus Datei-Backup restauriert wurde
  NOT_BEFORE_CLUSTER=$(kubectl get secret idm.${DOMAIN}-tls -n ${CC_ENVIRONMENT}-access-stack \
    -o jsonpath='{.data.tls\.crt}' 2>/dev/null | base64 -d 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notBefore | cut -d= -f2)
  if [ -n "${NOT_BEFORE_CLUSTER}" ]; then
    # Vergleich mit Backup-Zeitstempel, falls Backup-Datei existiert
    BACKUP_FILE="${VM_REMOTE_INSTALL_DIR}/le-certs-backup.yaml"
    if [ -f "${BACKUP_FILE}" ]; then
      NOT_BEFORE_BACKUP=$(yq eval 'select(.metadata.name == "idm.'"${DOMAIN}"'-tls") | .data["tls.crt"]' "${BACKUP_FILE}" | base64 -d | openssl x509 -noout -dates 2>/dev/null | grep notBefore | cut -d= -f2)
      if [ "${NOT_BEFORE_CLUSTER}" = "${NOT_BEFORE_BACKUP}" ]; then
        echo "Keine Staging-Annotation, aber Zertifikat aus Backup (notBefore identisch)"
        echo "  notBefore=${NOT_BEFORE_CLUSTER}"
        echo "  (Staging-Pflicht entfällt — kein neuer ACME-Request nötig)"
      else
        echo "Staging-Verifikation nicht möglich: notBefore weicht von Backup ab"
        echo "  Cluster=${NOT_BEFORE_CLUSTER}  Backup=${NOT_BEFORE_BACKUP:--}"
        false
      fi
    else
      echo "Keine Staging-Annotation, aber gültiges Zertifikat im Cluster vorhanden"
      echo "  notBefore=${NOT_BEFORE_CLUSTER} (kein Backup-Datei zum Vergleich)"
      echo "  (Staging-Pflicht entfällt — kein neuer ACME-Request nötig)"
    fi
  else
    echo "Keine Staging-Annotation gefunden — Hostnamen ohne Produktivzertifikat"
    echo "muessen zwingend zuerst per letsencrypt-staging getestet werden."
    false
  fi
fi
# Erwartung: Annotation civitas.io/staging-verified="true" auf dem Certificate-Objekt
# (pro Hostname einzeln), ODER Hostname ist bereits im Produktivbetrieb
# (gueltiges Produktionszertifikat vorhanden), ODER Zertifikat wurde erfolgreich
# aus Datei-Backup (le-certs-backup.yaml) restauriert (notBefore-Zeitstempel
# vor/nach Restore identisch)

# WireGuard-Tunnel aktiv
systemctl is-active wg-quick@wg0
# Erwartung: active

# Konnektivität OPNsense
ping -c2 10.10.10.1
# Erwartung: 0% packet loss
```

> **Fehleranalyse bei `unknown CA`:** Tritt dieser Fehler bei `curl --cacert` auf,
> ist das präsentierte Zertifikat nicht von der erwarteten Root-CA signiert.
> Maßnahme: `kubectl describe certificate -n <namespace>` ausführen und den
> `issuerRef` prüfen. Zeigt er auf `civitas-bootstrap-selfsigned` (Stufe 1),
> muss das Certificate gelöscht werden (cert-manager stellt es mit dem
> aktuellen Issuer neu aus). Zeigt er auf `selfsigned-issuer` (Stufe 3),
> prüfen ob dieser Issuer vom Typ `ca:` ist (nicht `selfSigned:`).

> **Abnahme Phase 2 (Zielzustand)**: Phase 2 gilt als bestanden, wenn alle
> Pods laufen, TLS-Zertifikate von der Root-CA signiert sind und beide
> Endpunkte per HTTPS mit `--cacert civitas-core-ca.crt` erreichbar sind.
> **Hinweis:** Phase 2.0 (Repository-Klon) muss vor Phase 2 abgeschlossen sein.
> Ohne das geklonte Repository in `/opt/civitas-core-v1` scheitert Schritt 2.4
> mit `Could not find any playbook to execute.`.

***

## Phase 3 — Verifikation und Fehlerreport

### Zweck

Systematische End-to-End-Prüfung nach Abschluss beider Installationsphasen.
Das Skript führt alle Abnahmetests aus Phase 1 und Phase 2 erneut aus und
erzeugt einen zusammenfassenden Bericht.

### Struktur des Verifikationsmoduls

```
verify_phase1()   → Prüft alle Phase-1-Kriterien, zählt Fehler
verify_phase2()   → Iteriert über K8S_NAMESPACES, prüft pro Namespace:
                     Existenz, Pods, Ingress-Ressourcen, TLS-Zertifikate,
                     IssuerRef-Konsistenz (kein Bootstrap-Issuer)
                   → Domain-Level-Checks: Keycloak, Portal (HTTPS mit --cacert)
                   → Infrastruktur: WireGuard-Tunnel, OPNsense-Konnektivität
report_result()   → Gibt Zusammenfassung aus (OK / FAILED + Fehlercount)
exit_with_code()  → Exit 0 bei Erfolg, Exit 1 bei ≥ 1 Fehler
```

### Ausgabeformat (Beispiel)

```
[2026-06-27 00:00:00] [PHASE 1] k3s Node Ready                     ... OK
[2026-06-27 00:00:00] [PHASE 1] cert-manager Running                ... OK
[2026-06-27 00:00:00] [PHASE 1] nginx-Ingress (DaemonSet) Running   ... OK
[2026-06-27 00:00:00] [PHASE 1] Storage Class local-path (Default)  ... OK
[2026-06-27 00:00:00] [PHASE 1] CA-Issuer-DN korrekt                ... OK
[2026-06-27 00:00:10] [PHASE 2] Namespace cc-prd-access-stack       ... OK
[2026-06-27 00:00:11] [PHASE 2] cc-prd-access-stack: Pods Running   ... OK
[2026-06-27 00:00:12] [PHASE 2] Namespace cc-prd-database-stack     ... OK
[2026-06-27 00:00:13] [PHASE 2] cc-prd-database-stack: Pods Running ... OK
[2026-06-27 00:00:14] [PHASE 2] Namespace cc-prd-operation-stack    ... OK
[2026-06-27 00:00:15] [PHASE 2] cc-prd-operation-stack: Pods Running... OK
[2026-06-27 00:00:16] [PHASE 2] Keycloak https://idm.udp.data-dna.eu  ... OK
[2026-06-27 00:00:17] [PHASE 2] Portal https://udp.data-dna.eu        ... OK
[2026-06-27 00:00:18] [PHASE 2] WireGuard-Tunnel wg0 aktiv          ... OK
------------------------------------------------------------
Ergebnis: 13/13 Prüfungen bestanden. Installation erfolgreich.
```

> **Hinweis**: Vor der Endprüfung wartet das Skript in Phase 2 auf den
> Ready-Status aller Pods in jedem Namespace aus `K8S_NAMESPACES`. Die
> Warteschleife ist als Best-Effort ausgelegt &ndash; auch bei Timeout
> wird Phase 3 (Verify) durchlaufen, um eine detaillierte Diagnose zu
> liefern:
> ```bash
> for ns in "${K8S_NAMESPACES[@]}"; do
>   if ! wait_pods_ready "${ns}"; then
>     log_warn "Nicht alle Pods in ${ns} wurden Ready - Details in Phase 3."
>   fi
> done
> ```
>

### Namespace-Verifikation

Phase 3 prüft, dass alle von cc_cli angelegten Namespaces existieren.
Es wird NICHT ein einzelner, fest benannter Namespace geprüft, sondern
alle Einträge aus dem Array `K8S_NAMESPACES` (definiert in `01_config.sh`,
Muster `${CC_ENVIRONMENT}-{stack}`).

Pseudocode:

```text
for ns in K8S_NAMESPACES:
    exists = kubectl_get_namespace(ns) == 0
    check(f"Namespace {ns} existiert", exists)
```

Die Variable `K8S_NAMESPACE` (Singular) ist obsolet und darf nicht mehr
für Existenzprüfungen verwendet werden.

> **TLS-Endpunkt-Prüfung in Phase 3:** Ein TLS-Endpunkt gilt nur als „OK",
> wenn `curl --cacert /usr/local/share/ca-certificates/civitas-core-ca.crt
> https://<domain>/` ohne `unknown CA` oder `self-signed certificate`
> durchläuft. Schlägt diese Prüfung fehl, ist im entsprechenden Namespace
> der `issuerRef` des Certificate-Objekts zu prüfen:
> ```bash
> kubectl describe certificate -n cc-prd-access-stack idm.udp.data-dna.eu-tls
> ```
> Erwartet wird ein `issuerRef.name`, der auf den CA-ClusterIssuer zeigt
> (`selfsigned-issuer` oder `civitas-core-ca-issuer`), nicht auf den
> Bootstrap-Issuer `civitas-bootstrap-selfsigned`.

***

## Fehlerbehandlung

Das Skript arbeitet mit `set -euo pipefail`. Jede Phase wird durch eine
dedizierte Funktion gekapselt. Fehler werden mit Zeitstempel und Phase
protokolliert.

| Fehlerklasse | Verhalten |
|---|---|
| Pflichtprüfung nicht erfüllt (Phase 0) | Sofortiger Abbruch, keine Änderungen am System |
| DNS-Warnung (Phase 0) | Warnung ausgeben, Ausführung fortsetzen |
| DNS-Fehler (Phase 2, Schritt 2.0) | Abbruch mit Hinweis: DNS-Eintrag in Hetzner-WebGUI setzen |
| Installationsfehler (Phase 1/2) | Abbruch der aktuellen Phase, Fehlermeldung mit Log-Hinweis |
| Timeout `cc_cli exec` | Abbruch mit Hinweis auf `$TIMEOUT_CC_CLI_EXEC` |
| Verifikationsfehler (Phase 3) | Keine Systemänderung, Fehlerbericht + Exit 1 |
| Bereits installierte Komponente (Idempotenz) | Kein Fehler, Meldung „bereits vorhanden, überspringe" |
| HTTP 404 bei Keycloak DELETE (z.B. Default-Resource) | Ressource bereits entfernt = Ziel erreicht. Bekanntes Problem bei Wiederholung nach abgebrochenem Run. Workaround: `kubectl delete namespace cc-prd-access-stack` und neu starten. |

***

## Offene Punkte (vor Skriptbau zu klären)

| Punkt | Status | Entscheidung bei |
|---|---|---|
| ~~Gast-OS~~ | ~~**Entschieden: Debian 13 (Trixie)** – Cloud-Image und OS-Check im Code~~ | ~~durch Code festgelegt~~ |
| ~~Domainname: `civitas.data-dna.eu` oder anderer Vorschlag?~~ | ~~Offen~~ → **Geklärt: `udp.data-dna.eu`** | ~~Peter König~~ → durch Code in `01_config.sh` festgelegt |
| ~~TLS-Strategie: self-signed ClusterIssuer oder interne CA?~~ | ~~Offen~~ → **Geklärt: 3-stufiges CA-Setup (Variante C)** | ~~netzwerk-dns-tls.md~~ → `netzwerk-dns-tls.md` (Variante C) |
| ~~Ziel-Namespace für CIVITAS/CORE~~ | ~~Vorschlag: `civitas-core`~~ | ~~Bestätigung Peter König~~ → **Bestätigt** |
| ~~cc-cli-Version (Pinning)~~ | ~~**Gepinnt auf `1.5.0`** in `01_config.sh`~~ | ~~durch Code festgelegt~~ |

| `servicelb` und `metrics-server`: deaktivieren oder aktiv lassen? | Offen | skriptarchitektur.md |

***

## Festlegungen

0. Vor Phase 0 kann auf dem Proxmox-Host eine **Phase -1 (VM-Provisionierung)**
   ausgeführt werden. Diese erstellt die CIVITAS/CORE-VM aus dem Debian-13-
   Cloud-Image und ist idempotent (bestehende VM wird übersprungen).

1. Das Skript gliedert sich in Phase 0 (Vorbedingungen), Phase 1
   (k3s + Add-ons), Phase 2 (cc-cli + Plattform) und Phase 3
   (Verifikation).
2. Jede Phase hat klar definierte, maschinell prüfbare Abnahmekriterien.
3. Das Skript bricht bei jedem Pflichtfehler ab und gibt einen eindeutigen
   Exit-Code zurück.
4. Alle Phasen sind idempotent: Ein erneuter Aufruf erzeugt keinen
   Fehler bei bereits korrekt installierten Komponenten.
5. Die DNS-Prüfung in Phase 0 ist eine Warnung; in Phase 2 ist sie hart.
6. `--disable traefik` wird beim k3s-Erststart gesetzt; `local-path-provisioner`
   bleibt aktiv und stellt die Default-StorageClass bereit.
7. `helm`-CLI wird separat installiert; k3s bringt nur den `helm-controller`.
8. `CC_CLI_VERSION` wird auf eine konkrete Version gepinnt, niemals `latest`.
9. SMTP-Zugangsdaten werden ausschließlich als Umgebungsvariablen übergeben,
   niemals hartcodiert. SMTP-Erreichbarkeit wird in Phase 0 geprüft.
10. Phase 2 ist distributionsunabhängig; der Aufwand ist für k3s, k0s
    und kubeadm identisch.
11. Die gesamte Lösung bildet die **erste Ausbaustufe** ab: einen
    funktionierenden Prototyp für Entwicklung und Evaluation.
    Produktionsanpassungen (HA, externes etcd, Backup-Integration,
    öffentlicher Zugang / DMZ) bleiben einer späteren Spezifikation
    vorbehalten.
12. Das CIVITAS/CORE-Repository wird in Phase 2.0 nach `/opt/civitas-core-v1`
    geklont. Ein Symlink `/opt/civitas-core → /opt/civitas-core-v1` wird
    gesetzt. `cc_cli exec` wird ausschließlich aus `/opt/civitas-core-v1`
    heraus aufgerufen. Wird das Repository bei einem Folgeaufruf bereits
    vorgefunden, ersetzt `git pull` den `git clone`-Schritt (Idempotenz).
