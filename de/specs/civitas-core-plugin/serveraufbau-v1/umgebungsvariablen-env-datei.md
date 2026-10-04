---
title: Umgebungsvariablen und .env-Datei
description: Referenz der Konfigurations- und Secrets-Datei des CIVITAS/CORE-Installationsskripts.
status: draft
lastUpdated: 2026-10-04
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-umgebungsvariablen
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-skriptarchitektur
quality:
  completeness: 80
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# Umgebungsvariablen und `.env`-Datei

Referenz der Konfigurations- und Secrets-Datei des Installationsskripts
(`install_civitas_core_V1.sh`, `install_civitas_core_V1s.sh`). Die versionierten
Vorlagen sind `.env.example` (V1) und `.env-v1s.local.example` (V1s).

## Dateiname und Ablageort

Das Skript lädt die Datei im Host-Kontext nicht selbst. Vor dem Skriptaufruf
wird sie manuell gesourct oder die Werte sind als Umgebungsvariablen gesetzt.
`require_env_file()` prüft die Datei vor der VM-Anlage auf Existenz, Lesbarkeit
und fehlende Schreibrechte für group/other. `run_in_vm()` kopiert sie für den
VM-Hop in die VM und sourct sie dort.

| Variante | Dateiname | Ort | Kopie in die VM |
|---|---|---|---|
| V1 | `.env.local` | Host-Home (`${HOME}`, bei root `/root`) | `/root/civitas-install/.env.local` |
| V1s | `.env-v1s.local` (kein Fallback) | Host-Home (`${HOME}`, bei root `/root`) | `/root/civitas-install/.env.local` |

Die Datei liegt bewusst außerhalb von `${SCRIPT_DIR}`: das Installations-Repo
wird per Synchronisation mit `--delete` gespiegelt, Secrets dürfen deshalb nicht
darin liegen.

## Laden

```bash
set -a; source ${HOME}/.env-v1s.local; set +a
./install_civitas_core_V1s.sh
```

Beim VM-Hop (`CIVITAS_CONTEXT=vm`):

```bash
cd ${VM_REMOTE_INSTALL_DIR}
if [[ -f .env.local ]]; then set -a; source .env.local; set +a; fi
./install_civitas_core_V1s.sh
```

Zwei Punkte sind zu beachten:

- Der Installer kopiert nur die Datei aus `${HOME}` in die VM. Die Datei muss
  als `${HOME}/.env-v1s.local` (V1s) bzw. `${HOME}/.env.local` (V1) vorliegen;
  `require_env_file()` bricht ab, wenn sie fehlt oder für group/other schreibbar
  ist.
- Nur die Werte, die in der Datei stehen, werden mitkopiert. Variablen, die nur
  in der Host-Shell exportiert sind, erreichen die VM nicht.

## Struktur der Vorlage

In den Vorlagen stehen aktiv (nicht auskommentiert) nur Pflichtvariablen,
Secrets und der WireGuard-Block mit `CHANGEME`-Platzhaltern. Alle Variablen mit
einem Default in `01_config.sh` sind auskommentiert (`# export NAME="Default"`),
damit die Defaults nur einmal, in `01_config.sh`, leben.

## Netzwerkmodus: `WG_ENABLE`

`WG_ENABLE` steuert, ob WireGuard konfiguriert wird.

| Wert | Bedeutung |
|---|---|
| `true` (Default) | WireGuard aktiv, die `WG_*`-Secrets sind Pflicht |
| `false` | WireGuard aus, die `WG_*`-Variablen werden ignoriert |

Groß-/Kleinschreibung ist egal. Jeder andere Wert bricht ab. Ein leerer Wert
wird wie der Default (`true`) behandelt. Das Ergebnis wird als
`WG_ENABLED=true|false` exportiert.

Bei `WG_ENABLE=false` prüft `03_preflight.sh` das Werkzeug `wg` nicht,
`06_civitas.sh` überspringt `setup_wireguard` und `07b_verify_phase2.sh`
überspringt Tunnel- und OPNsense-Prüfungen.

## Variablenübersicht

### Steuerung / Debug

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `CIVITAS_DEBUG` | nein | `false` | ausführliche Debug-Ausgabe |
| `LE_CERT` | nein | `false` | `true` = Staging + Production, `false` = nur Staging |
| `LE_REQUESTS_BLOCKED` | nein | `false` | `true` = keine neuen Zertifikatsanforderungen |
| `APISIX_DASHBOARD` | nein | `false` | APISIX-Dashboard aktivieren |
| `RUN_TESTS` | nein | `false` | E2E-Tests nach Installation |
| `CERT_BACKUP_FILE` | nein | `le-certs-backup.yaml` | Dateiname (relativ) oder Pfad in der VM |
| `CERT_BACKUP_HOST_FILE` | nein | `${HOME}/le-certs-backup.yaml` | Host-Pfad des Zertifikats-Backups |
| `CERT_BACKUP_MIN_DAYS` | nein | `30` | Mindest-Restlaufzeit in Tagen, damit ein Backup als brauchbar gilt (1-600) |
| `LOG_FILE` | nein | leer | optionaler Pfad für File-Logging |

`CERT_BACKUP_FILE` bestimmt den Dateinamen oder Pfad in der VM. Der Installer
liest ein vorhandenes Backup von `CERT_BACKUP_HOST_FILE` auf dem Host und nutzt
den veralteten Pfad `${SCRIPT_DIR}/le-certs-backup.yaml` als Fallback mit
Warnung. Nach einer Neuausstellung holt er das Backup nach
`CERT_BACKUP_HOST_FILE` zurück. Das Backup ist funktionsfähig.

`NO_NEW_LE_CERT` existiert nicht; der Safety-Schalter heißt
`LE_REQUESTS_BLOCKED`.

### Domain

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `DOMAIN_NAME` | ja | - | Basis-Domain ohne `udp.`-Präfix |

`01_config.sh` bildet daraus `DOMAIN="udp.${DOMAIN_NAME}"`. Ein separates
`export DOMAIN=…` ist wirkungslos.

### Tests (E2E)

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `TEST_ID` | nein | - | E2E-Test-Identifier (erstes Domain-Label, z. B. `udp`) |
| `BASE_DOMAIN` | nein | - | E2E-Test-Basis-Domain (Rest der Domain) |

`TEST_ID` und `BASE_DOMAIN` werden vom Installer nicht gelesen. Eine Verwendung
durch das E2E-Testrepo ist nicht belegt. `TEST_ID.BASE_DOMAIN` entspricht
`DOMAIN`.

### VM-Zugang, SMTP, Admin

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `ROOT_PASSWORD` | nein | leer | wird per `chpasswd` in der VM gesetzt (Konsole), wenn gesetzt |
| `SMTP_HOST` | ja | - | SMTP-Server |
| `SMTP_PORT` | nein | `587` | SMTP-Port |
| `SMTP_USER` | ja | - | SMTP-Benutzer |
| `SMTP_PASS` | ja | - | SMTP-Passwort |
| `ADMIN_EMAIL` | nein | `admin@${DOMAIN_NAME}` | E-Mail des Plattform-Administrators |
| `ADMIN_PASS` | ja | - | master_password und platform_admin-Passwort |
| `TENANT_ADMIN_PASS` | nein | - | wird von keinem Modul gelesen |

Mindestens `VM_SSH_PUBKEY` oder `ROOT_PASSWORD` muss gesetzt sein, sonst
bricht `init_ssh_access` vor jeder VM-Änderung ab. Der Installations-Key zählt
dabei nicht.

### Netzwerkmodus / WireGuard

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `WG_ENABLE` | nein | `true` | `false` deaktiviert WireGuard |
| `WG_VM_PRIVATE_KEY` | bei `WG_ENABLE=true` | - | WireGuard-Private-Key der VM |
| `WG_OPN_PUBLIC_KEY` | bei `WG_ENABLE=true` | - | WireGuard-Public-Key der OPNsense |
| `WG_OPN_ENDPOINT` | bei `WG_ENABLE=true` | - | öffentliche IP:Port der OPNsense |
| `WG_PRESHARED_KEY` | nein | leer | WireGuard-Pre-Shared-Key |
| `WG_LISTEN_PORT` | nein | `51820` | WireGuard-Listen-Port |

### SSH-Zugang zur VM

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `VM_SSH_PUBKEY` | nein | leer | öffentliche Schlüssel für direkten Login, eine Zeile pro Key |
| `VM_REMOVE_INSTALL_KEY` | nein | `false` | `true` = Installations-Key am Ende aus der VM entfernen |
| `INSTALL_KEY_DIR` | nein | `${HOME}/.local/share/civitas-install/<VM_ID>` | Ablage des Installations-Key-Paars |

Details zum Ablauf, zur Validierung und zur Altbestand-Migration in
[ssh-zugang-zur-vm.md](./ssh-zugang-zur-vm.md).

### Cluster / Kubernetes

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `K3S_NODE_NAME` | nein | `hostname` | k3s-Node-Name |
| `CC_ENVIRONMENT` | nein | `cc-prd` | Ansible-Environment-Name (Muster `{CC_ENVIRONMENT}-{stack}`) |
| `K8S_CONTEXT` | nein | `default` | kubectl-Kontext |
| `STORAGECLASS_RWO` | nein | `local-path` | StorageClass ReadWriteOnce |
| `STORAGECLASS_RWX` | nein | `local-path` | StorageClass ReadWriteMany |
| `STORAGECLASS_LOC` | nein | `local-path` | StorageClass lokal |
| `INGRESS_CLASS` | nein | `nginx` | Ingress-Klasse |
| `CERT_MANAGER_ISSUER` | nein | `selfsigned-issuer` | cert-manager-Issuer |
| `CREDENTIALS_OUTPUT_PATH` | nein | `/root/civitas-install/credentials.env` | Zielpfad der Dienst-Passwörter |

### Wiederholungen und Zeitsteuerung

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `CC_API_MAX_RETRIES` | nein | `60` | maximale API-Check-Versuche (1-600) |
| `CC_DEPLOYMENT_MAX_RETRIES` | nein | `30` | maximale Deployment-Check-Versuche (1-600) |
| `CC_EXEC_ATTEMPTS` | nein | `2` | Versuche für `cc_cli exec` bei vorübergehenden Fehlern (1-600) |
| `CC_EXEC_RETRY_DELAY` | nein | `30` | Sekunden zwischen den `cc_cli exec`-Versuchen (1-600) |
| `IDM_TOKEN_RETRIES` | nein | `6` | Versuche für den Keycloak-Master-Token (1-600) |
| `IDM_TOKEN_RETRY_DELAY` | nein | `10` | Sekunden zwischen den Token-Versuchen (1-600) |

Die Zahlenvariablen werden auf 1 bis 600 geprüft.

### Host / VM (Proxmox)

| Variable | Default | Wirkung |
|---|---|---|
| `VM_ID` | `2010` | Proxmox VM-ID |
| `VM_NAME` | `civitas-core` | VM-Anzeigename |
| `VM_RAM_MB` | `40960` | RAM in MiB |
| `VM_CORES` | `12` | vCPUs |
| `VM_DISK_GB` | `300` | Disk-Größe in GiB |
| `VM_BRIDGE` | `vmbr0` | Bridge-Netzwerk |
| `PROXMOX_STORAGE` | `local-zfs-civitas` | Proxmox-Storage für die VM-Disk; unterstützt: `zfspool`, `lvmthin` |
| `VM_IP_STATIC` | `192.168.12.139` | IPv4-Adresse der VM |
| `VM_IP_PREFIX` | `24` | IPv4-Präfixlänge |
| `VM_GW` | `192.168.12.1` | IPv4-Gateway |
| `VM_IP6_STATIC` | leer | IPv6-Adresse der VM; leer = IPv6 aus |
| `VM_IP6_PREFIX` | `64` | IPv6-Präfixlänge |
| `VM_GW6` | leer | IPv6-Gateway (Pflicht, wenn `VM_IP6_STATIC` gesetzt) |
| `PBS_STORAGE` | `backup-p2d2-kinglui` | PBS-Storage; leer = Backup-Prüfung überspringen |
| `CLOUD_IMAGE_URL` | Debian-13-Cloud-Image | Quelle für das Cloud-Image |
| `CLOUD_IMAGE_CACHE` | `/var/lib/vz/template/qcow` | Cache-Verzeichnis für das Cloud-Image |
| `SOHO_GATEWAY` | `${VM_GW}` | Gateway für die Phase-0-Netzprüfung |

Unterscheidung „leer = Default" und „leer = deaktiviert":

- Die meisten Host-/VM-Werte verwenden `${VAR:-default}`. Ein leerer Wert
  erhält den Default, nicht den leeren Wert.
- `PBS_STORAGE` verwendet `${VAR-default}`. Ein leerer Wert bleibt leer und
  deaktiviert die Backup-Prüfung.
- `VM_IP6_STATIC` und `VM_GW6` sind standardmäßig leer. IPv6 ist damit aus.
  Wer IPv6 nutzt, setzt beide Variablen ausdrücklich.

### V1s-spezifisch

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `V1S_IMAGE_TAG` | nein | `v1s-local` | Tag des lokal gebauten Portal-Backend-Images |

### RustFS / S3 (nur V1)

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `RUSTFS_ENDPOINT` | nein | leer | S3-Endpoint; leer = s3_backend deaktiviert |
| `RUSTFS_ACCESS_KEY` | nein | leer | S3-Access-Key |
| `RUSTFS_SECRET_KEY` | nein | leer | S3-Secret-Key |
| `RUSTFS_BUCKET_NAME` | nein | `portal-config` | S3-Bucket-Name |
| `RUSTFS_REGION` | nein | `eu-north-1` | S3-Region |
| `RUSTFS_FORCE_PATH_STYLE` | nein | `true` | S3 Force-Path-Style |
| `MC_VERSION` | nein | fest | mc-Client-Version |
| `MC_ALIAS_NAME` | nein | `civitas-rustfs` | mc-Alias für den Endpoint |
| `MC_BUCKET_NAME` | nein | `portal-config` | mc-Bucket-Name |

V1s benötigt diese Variablen nicht (statische Masterportal-Konfiguration).

## CHANGEME-Warnung

`warn_changeme_values` läuft zweimal pro Lauf: als „Start" direkt nach der
Startmeldung und als „Ende" unmittelbar vor der Schlussmeldung (Host- und
VM-Zweig). Sie warnt nur und bricht nie ab. Bricht das Skript vorher ab,
erscheint kein „Ende"-Hinweis.

Geprüft werden alle Shell-Variablen, deren Wert `CHANGEME` enthält. `WG_*`
werden bei `WG_ENABLED!=true` übersprungen. `NAME=Wert` wird nur ausgegeben,
wenn der Wert aus `A-Za-z0-9._@:/-` besteht, höchstens 64 Zeichen lang ist und
`CHANGEME` als eigenständiges Token enthält. Sonst erscheint nur der Name mit
„(enthält CHANGEME)".

## Umgebungen

Die beiden Profile unterscheiden sich in Netzwerkmodus, Storage und VM-Größe.

| Profil | `WG_ENABLE` | `PROXMOX_STORAGE` | `VM_BRIDGE` | `VM_CORES` | `PBS_STORAGE` |
|---|---|---|---|---|---|
| A (SOHO) | `true` | `local-zfs-civitas` | `vmbr0` | `12` | gesetzt |
| B (Hetzner) | `false` | `local-lvm` | `vmbr1` | `10` | leer |

Die Betriebsarten sind in
[Netzwerk-Topologie](../netzwerk-topologie/index.md) beschrieben.

## Beispielprofile

### SOHO mit HAProxy/WireGuard (`WG_ENABLE=true`)

```bash
export WG_ENABLE="true"
export PROXMOX_STORAGE="local-zfs-civitas"
export VM_BRIDGE="vmbr0"
export VM_CORES="12"
export WG_VM_PRIVATE_KEY="…"
export WG_OPN_PUBLIC_KEY="…"
export WG_OPN_ENDPOINT="…:51820"
export VM_IP6_STATIC="fd01:1:1:1::139"
export VM_GW6="fd01:1:1:1:de39:6fff:febe:9962"
```

### Hetzner NAT ohne WireGuard (`WG_ENABLE=false`)

```bash
export WG_ENABLE="false"
export PROXMOX_STORAGE="local-lvm"
export VM_BRIDGE="vmbr1"
export VM_CORES="10"
export VM_GW="192.168.12.1"
export VM_IP6_STATIC="fd01:1:1:1::139"
export VM_GW6="fd01:1:1:1::1"
export PBS_STORAGE=""
export DOMAIN_NAME="projekte-koenig.eu"
export CC_API_MAX_RETRIES="60"
export VM_SSH_PUBKEY="<public-key>"
```

Das Hetzner-Profil setzt `VM_SSH_PUBKEY` für den direkten Login.

## Bekannte Einschränkungen

- `ROOT_PASSWORD` ist optional. Gesetzt wird es nach dem SSH-Zugang per
  `chpasswd` in der VM angewendet. Beobachtet: Der SSH-Dienst der VM bot beim
  Test von außen nur `publickey` an.
- `ENVIRONMENT` in `01_config.sh` (hart `cc-prd`) ist ein ungenutzter
  Duplikat-Name zu `CC_ENVIRONMENT`.
- `TEST_ID`/`BASE_DOMAIN` werden vom Installer nicht gelesen.
- Der CHANGEME-„Ende"-Hinweis fehlt, wenn das Skript vorher abbricht.

## Sicherheitshinweise

Die `.env`-Datei enthält Secrets und wird nicht committet. Die versionierten
Vorlagen enthalten nur Platzhalter (`CHANGEME`).
