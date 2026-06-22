---
title: Installationsphasen und Abnahme — CIVITAS/CORE V2
description: Phasendefinition, Abnahmekriterien und Fehlerbehandlung für das CIVITAS/CORE-V2-Installationsskript auf dem Proxmox-Knoten civitas
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-installationsphasen
parent: civitas-core-v2-serveraufbau-index
dependencies:
  - civitas-core-v2-serveraufbau-zielbild
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer:
  reviewDate:
---

# Installationsphasen und Abnahme — CIVITAS/CORE V2

## Ziel

Dieses Dokument legt die Phasenstruktur des CIVITAS/CORE-V2-Installationsskripts
fest und definiert die Abnahmekriterien je Phase. Es dient als verbindliche
Grundlage für den Skriptbau (`skriptarchitektur.md`) und als Checkliste für
die Verifikation nach einem Installationsdurchlauf.

## Rahmenbedingungen

- **Zielplattform**: Dedizierte Proxmox-VM auf dem Knoten `civitas`
  (12 vCPU, 40 GiB RAM, 300 GiB Disk, Debian 13 (Trixie) als Gast-OS)
- **Kubernetes-Distribution**: k3s (Single-Node, SQLite Data Store, ≥ 1.32)
- **Deployment-Werkzeug**: helmfile ≥ 1.1.9 + Helm ≥ 3.18
- **Deployment-Repository**: `https://gitlab.com/civitas-connect/civitas-core/civitas-core-v2/civitas-core-deployment.git`
- **Pflichtkomponenten**: cert-manager + ClusterIssuer, nginx-Ingress, RWO Storage Class
- **Kein öffentlicher Zugang**: VM nur via WireGuard + OPNsense/Caddy erreichbar
- **TLS**: Endet an Caddy auf OPNsense – kein HTTPS in der VM, kein Let's Encrypt in k3s
- **Service Mesh**: Linkerd optional, noch nicht spezifiziert

## Phasenübersicht

| Phase | Name | Ausführungskontext | Inhalt |
|---|---|---|---|
| -1 | VM-Provisionierung | Proxmox-Host | Debian-13-Cloud-Image, statische IP, SSH-Key |
| 0 | Preflight | VM | OS-Prüfung, Tools, Netzwerk, DNS (weich), SMTP |
| 1a | k3s-Cluster | VM | k3s ≥ 1.32 installieren, `--disable traefik` |
| 1b | Add-ons | VM | cert-manager, ClusterIssuer, nginx-Ingress, StorageClass |
| 2a | Deployment-Repo | VM | Repo klonen, Deployment-Verzeichnis anlegen, eigenes Git-Repo |
| 2b | Vorbedingungen Phase 2 | VM | DNS hart prüfen, `keycloak-smtp`-Secret anlegen |
| 2c | helmfile sync | VM | `global.yaml.gotmpl` rendern, `helmfile sync` ausführen |
| 2d | WireGuard | VM | Tunnel nach OPNsense aktivieren |
| 3 | Verifikation | VM | End-to-End-Abnahme, Fehlerreport |

## Phase -1 — VM-Provisionierung

### Zweck

Die CIVITAS/CORE-VM auf dem Proxmox-Knoten `civitas` aus einem
Debian-13-Cloud-Image erzeugen. Identisch zu V1: Dieses Modul wird zwischen
V1 und V2 geteilt.

### Voraussetzungen

- Ausführung auf dem Proxmox-Host (qm, pvesh, pvesm verfügbar)
- `ROOT_PASSWORD` als Umgebungsvariable gesetzt
- Internetzugriff für Cloud-Image-Download

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| -1.1 | Cloud-Image herunterladen (`debian-13-genericcloud-amd64-daily.qcow2`) | Datei `/tmp/${image_name}` vorhanden |
| -1.2 | VM mit qm create anlegen (`VM_ID=2010`, 12 vCPU, 40 GiB RAM, Bridge vmbr0) | `qm status ${VM_ID}` – VM existiert |
| -1.3 | Disk aus Cloud-Image importieren (300 GiB, ZFS-thin) | `qm config ${VM_ID}` – Disk zugewiesen |
| -1.4 | Cloud-Init konfigurieren (root, SSH-Key, statische IPv4/IPv6) | `qm config ${VM_ID}` – ciuser, sshkeys, ipconfig0 gesetzt |
| -1.5 | VM starten | `qm status ${VM_ID}` → running |
| -1.6 | Warten auf SSH-Erreichbarkeit unter der konfigurierten statischen VM-IP | `ssh root@${VM_IP_STATIC} true` erreichbar |

### Abnahmekriterien Phase -1

```bash
# VM läuft
qm status ${VM_ID}
# Erwartung: running

# SSH-Zugang
ssh -o StrictHostKeyChecking=no root@${VM_IP_STATIC} 'hostnamectl'
# Erwartung: Debian GNU/Linux 13 (Trixie)
```

## Phase 0 — Preflight

### Zweck

Sicherstellen, dass alle Voraussetzungen für eine erfolgreiche Installation
erfüllt sind.

### Prüfungen

| Prüfpunkt | Erwarteter Zustand | Fehlerverhalten |
|---|---|---|
| Betriebssystem | Debian 13 (Trixie), x86_64 | Abbruch |
| vCPU | ≥ 4 | Abbruch |
| RAM | ≥ 16384 MiB frei | Abbruch |
| Swap | Deaktiviert | Abbruch |
| Gateway erreichbar | Ping auf SOHO-Gateway | Abbruch |
| DNS `idm.<domain>`, `portal.<domain>` | Auflösbar | **Warnung** (Abbruch erst in Phase 2b) |
| SMTP erreichbar | TCP-Verbindung zu `${SMTP_HOST}:${SMTP_PORT}` | Abbruch |
| Werkzeuge | kubectl ≥ 1.32, helm ≥ 3.18, helmfile ≥ 1.1.9, git | Abbruch (werden automatisch installiert) |
| k3s / kubectl | Noch nicht installiert ODER bereits korrekte Version | Abbruch bei falscher Version |

### Abnahmekriterium Phase 0

Alle Pflichtprüfungen bestanden oder bereits korrekte Komponenten vorhanden.
DNS-Warnung ist zulässig. Das Skript bricht bei jeder fehlgeschlagenen
Pflichtprüfung mit Exit-Code ≠ 0 ab.

## Phase 1a — k3s-Cluster

### Zweck

k3s ≥ 1.32 als Single-Node-Cluster installieren.

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 1a.1 | k3s ≥ 1.32 installieren (`--disable traefik`) | `k3s --version` enthält Zielversion |
| 1a.2 | kubeconfig nach `~/.kube/config` kopieren | Datei vorhanden |
| 1a.3 | Warten bis Node Ready | `kubectl wait node --all --for=condition=Ready` |

### Konfigurationsvariablen

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `K3S_VERSION` | k3s-Release | `v1.32.3+k3s1` |
| `K3S_EXEC_ARGS` | k3s-Start-Argumente | `--disable traefik` |
| `KUBECONFIG_PATH` | Zielpfad für kubeconfig | `${HOME}/.kube/config` |

### Abnahmekriterien Phase 1a

```bash
kubectl get nodes -o wide
# Erwartung: 1 Node, Status Ready, Kubelet-Version ≥ 1.32

kubectl get pods -n kube-system
# Erwartung: CoreDNS, Metrics-Server (o.ä.) laufen
```

## Phase 1b — Add-ons

### Zweck

cert-manager, selfsigned ClusterIssuer, nginx-Ingress und StorageClass
bereitstellen.

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 1b.1 | helm-CLI ≥ 3.18 installieren | `helm version` |
| 1b.2 | helmfile ≥ 1.1.9 installieren | `helmfile version` |
| 1b.3 | helm-diff-Plugin installieren | `helm plugin list` |
| 1b.4 | cert-manager installieren | `kubectl get deployment cert-manager -n cert-manager` |
| 1b.5 | selfsigned ClusterIssuer konfigurieren | `kubectl get clusterissuer selfsigned-ca` |
| 1b.6 | nginx-Ingress (DaemonSet, Port 8080) installieren | `kubectl get deployment ingress-nginx-controller -n ingress-nginx` |
| 1b.7 | StorageClass local-path prüfen | `kubectl get storageclass local-path` |

### Abnahmekriterien Phase 1b

```bash
kubectl get clusterissuer selfsigned-ca
# Erwartung: READY = True

kubectl get pods -n ingress-nginx
# Erwartung: ingress-nginx-controller Running

kubectl get storageclass local-path
# Erwartung: (default) vorhanden
```

## Phase 2a — Deployment-Repository

### Zweck

Das CIVITAS/CORE-V2-Deployment-Repository auf der Ziel-VM bereitstellen und
das deployment-spezifische Verzeichnis initialisieren.

### Voraussetzungen

- git installiert (Phase 0)
- Internetzugriff für Repository-Klon

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2a.1 | Repository klonen nach `/opt/civitas-core-v2` | `.git`-Verzeichnis vorhanden |
| 2a.2 | Symlink `/opt/civitas-core` → `/opt/civitas-core-v2` anlegen | Symlink existiert und zeigt auf korrektes Ziel |
| 2a.3 | Deployment-Verzeichnis anlegen: `cp -r defaults/deployment deployment` | `deployment/environments/` existiert |
| 2a.4 | Symlink `/opt/civitas-core/deployment` als separates Git-Repo initialisieren | `.git` im Deployment-Verzeichnis vorhanden |

### Konfigurationsvariablen

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `CC_V2_REPO_URL` | URL des V2-Deployment-Repositorys | `https://gitlab.com/civitas-connect/civitas-core/civitas-core-v2/civitas-core-deployment.git` |
| `CC_V2_REPO_PATH` | Lokaler Pfad des Repositorys | `/opt/civitas-core-v2` |
| `CC_V2_DEPLOY_PATH` | Pfad zum Deployment-Verzeichnis | `/opt/civitas-core-v2/deployment` |
| `CC_V2_ENVIRONMENT` | Environment-Name für helmfile | `cc-prd` |

### Abnahmekriterien Phase 2a

```bash
test -d /opt/civitas-core-v2/.git
# Erwartung: Exit-Code 0

test -L /opt/civitas-core && test "$(readlink /opt/civitas-core)" = "/opt/civitas-core-v2"
# Erwartung: Symlink korrekt

test -f /opt/civitas-core-v2/deployment/helmfile.yaml
# Erwartung: Exit-Code 0

test -d /opt/civitas-core-v2/deployment/.git
# Erwartung: Exit-Code 0 (separates Repo)
```

## Phase 2b — Vorbedingungen Phase 2

### Zweck

Harte DNS-Prüfung und Anlegen des `keycloak-smtp`-Secrets vor dem
helmfile-Deployment.

### Voraussetzungen

- k3s-Cluster mit kubectl-Zugriff läuft (Phase 1a/b abgeschlossen)
- SMTP-Zugangsdaten als Umgebungsvariablen gesetzt

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2b.1 | DNS hart prüfen: `idm.<domain>`, `portal.<domain>` | `dig +short` liefert IP – sonst Abbruch |
| 2b.2 | Namespace anlegen (entsprechend `instanceSlug`) | `kubectl get namespace` |
| 2b.3 | `keycloak-smtp`-Secret im Namespace anlegen | `kubectl get secret keycloak-smtp -n <namespace>` |
| 2b.4 | `initialUserEmail` als ConfigMap oder direkt setzen | Prüfung vorhanden |

### Abnahmekriterien Phase 2b

```bash
dig +short idm.${DOMAIN}
dig +short portal.${DOMAIN}
# Erwartung: jeweils eine IP-Adresse

kubectl get secret keycloak-smtp -n ${CC_V2_ENVIRONMENT}
# Erwartung: Secret existiert, keys host, port, from, user, password
```

## Phase 2c — helmfile sync

### Zweck

Die CIVITAS/CORE-V2-Plattform via helmfile deployen.

### Voraussetzungen

- Deployment-Repository unter `/opt/civitas-core-v2` bereit
- Environment-Verzeichnis unter `deployment/environments/<env>/` angelegt
- `helmfile.yaml` um das Environment ergänzt (einmalig)

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2c.1 | Environment-Verzeichnis anlegen (falls nicht vorhanden) | Verzeichnis existiert |
| 2c.2 | `global.yaml.gotmpl` aus Template rendern | Datei gültig (yaml + gotmpl) |
| 2c.3 | Environment in `deployment/helmfile.yaml` registrieren (einmalig) | Eintrag in `environments` + `helmfiles` vorhanden |
| 2c.4 | `helmfile sync -e <env>` ausführen (Timeout: 900s) | Exit-Code 0 |
| 2c.5 | SSL-Redirect für nginx-Ingress deaktivieren | Annotation `nginx.ingress.kubernetes.io/ssl-redirect=false` |
| 2c.6 | ClusterIssuer von `selfsigned-ca` (nicht `letsencrypt`) prüfen | Issuer READY = True |

### Konfigurationsvariablen

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `CC_V2_ENVIRONMENT` | Environment-Name | `cc-prd` |
| `DOMAIN` | Basis-Domain für alle Dienste | `udp.data-dna.eu` |
| `INGRESS_CLASS` | Ingress-Controller-Klasse | `nginx` |
| `CLUSTER_ISSUER` | cert-manager ClusterIssuer | `selfsigned-ca` |
| `SSL_REDIRECT` | HTTP→HTTPS-Redirect deaktivieren | `false` |
| `TIMEOUT_HELMFILE_SYNC` | Timeout für helmfile sync | `900` |

### Abnahmekriterien Phase 2c

```bash
# Namespace und Pods
kubectl get pods -n ${CC_V2_ENVIRONMENT}
# Erwartung: Alle Pods Running, kein Error/CrashLoopBackOff

# Ingress-Ressourcen
kubectl get ingress -n ${CC_V2_ENVIRONMENT}
# Erwartung: Einträge für idm.<domain> und portal.<domain>

# ClusterIssuer
kubectl get clusterissuer selfsigned-ca
# Erwartung: READY = True

# SSL-Redirect deaktiviert
kubectl get ingress -n ${CC_V2_ENVIRONMENT} -o jsonpath='{.items[*].metadata.annotations.nginx\.ingress\.kubernetes\.io/ssl-redirect}'
# Erwartung: "false"

# Keycloak intern erreichbar
curl -sf -H "Host: idm.${DOMAIN}" http://localhost:8080/health
# Erwartung: HTTP 200

# Portal intern erreichbar
curl -sf -H "Host: portal.${DOMAIN}" http://localhost:8080/
# Erwartung: HTTP 200 oder Redirect auf Login
```

## Phase 2d — WireGuard

### Zweck

WireGuard-Tunnel zur OPNsense aktivieren, damit Caddy Traffic an die VM
weiterleiten kann.

### Voraussetzungen

- WireGuard-Konfiguration auf OPNsense-Seite eingerichtet
- WireGuard-Secrets als Umgebungsvariablen gesetzt

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2d.1 | WireGuard-Konfiguration aus Template rendern | Config-Datei vorhanden |
| 2d.2 | Tunnel aktivieren: `systemctl enable --now wg-quick@wg0` | `systemctl is-active wg-quick@wg0` |
| 2d.3 | Konnektivität zu OPNsense prüfen: Ping auf `10.10.10.1` | 0% packet loss |

### Abnahmekriterien Phase 2d

```bash
systemctl is-active wg-quick@wg0
# Erwartung: active

ping -c2 10.10.10.1
# Erwartung: 0% packet loss
```

## Phase 3 — Verifikation und Fehlerreport

### Zweck

Systematische End-to-End-Prüfung nach Abschluss aller Phasen. Das Skript
führt alle Abnahmetests erneut aus und erzeugt einen zusammenfassenden
Bericht.

### Prüfungen

```bash
# Phase 1a: k3s-Node Ready
kubectl get nodes -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'
# Erwartung: True

# Phase 1b: cert-manager, nginx-Ingress, ClusterIssuer
kubectl get deployment cert-manager -n cert-manager -o jsonpath='{.status.readyReplicas}'
# Erwartung: ≥ 1
kubectl get clusterissuer selfsigned-ca
# Erwartung: READY = True
kubectl get deployment ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.readyReplicas}'
# Erwartung: ≥ 1

# Phase 2a: Deployment-Repository vorhanden
test -d /opt/civitas-core-v2/.git
# Erwartung: Exit-Code 0

# Phase 2c: CIVITAS/CORE-Pods laufen
kubectl get pods -n ${CC_V2_ENVIRONMENT} --field-selector=status.phase!=Running,status.phase!=Succeeded
# Erwartung: 0 Pods

# Phase 2d: WireGuard aktiv
systemctl is-active wg-quick@wg0
# Erwartung: active

# Konnektivität OPNsense
ping -c2 10.10.10.1
# Erwartung: 0% packet loss
```

### Fehlerreport

```bash
if [[ "${VERIFY_ERRORS}" -eq 0 ]]; then
  log_ok "Alle Prüfungen bestanden. Installation erfolgreich."
  exit 0
else
  log_error "${VERIFY_ERRORS} Prüfung(en) fehlgeschlagen."
  exit 1
fi
```

## Fehlerbehandlung

| Fehlerklasse | Verhalten |
|---|---|
| Pflichtprüfung nicht erfüllt (Phase 0) | Sofortiger Abbruch |
| DNS-Warnung (Phase 0) | Warnung, Ausführung fortgesetzt |
| DNS-Fehler (Phase 2b) | Abbruch – Eintrag in Hetzner-WebGUI setzen |
| Repository-Klon fehlgeschlagen (Phase 2a) | Abbruch – URL/Netzwerk prüfen |
| helmfile sync fehlgeschlagen (Phase 2c) | Abbruch, Logs in `/opt/civitas-core-v2/logs/` sichern |
| Timeout helmfile sync | Abbruch – `$TIMEOUT_HELMFILE_SYNC` prüfen |
| WireGuard-Fehler (Phase 2d) | Abbruch – Konfiguration auf OPNsense-Seite prüfen |
| Verifikationsfehler (Phase 3) | Keine Systemänderung, Fehlerbericht + Exit 1 |
| Bereits installierte Komponente (Idempotenz) | Kein Fehler, „bereits vorhanden – überspringe" |

## Offene Punkte

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Linkerd Service Mesh | **Offen** – Installation und Konfiguration nicht spezifiziert | Architekturentscheidung |
| `global.yaml.gotmpl`-Template (Details) | In `helmfile-konfiguration.md` spezifiziert | – |
| Environment-Registrierung in `helmfile.yaml` | Automatisierung noch offen – ggf. manueller Schritt | Skriptbau |

## Festlegungen

1. Die VM-Provisionierung (Phase -1) ist identisch zu V1 und kann zwischen
   beiden Versionen geteilt werden.
2. Add-ons (Phase 1b) sind weitgehend identisch zu V1, ergänzt um helmfile
   und helm-diff-Plugin.
3. Phase 2a–2c sind V2-spezifisch und ersetzen den V1-cc_cli-Ablauf.
4. TLS endet an Caddy – kein HTTPS in der VM, `ssl-redirect: false`.
5. Der ClusterIssuer heißt `selfsigned-ca` (nicht `letsencrypt-prod`).
6. `helmfile sync` hat ein separates, langes Timeout (900s).
7. WireGuard wird erst nach erfolgreichem `helmfile sync` aktiviert (Phase 2d).