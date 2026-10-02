---
title: Umgebungsvariablen und .env-Datei
description: Referenz der Konfigurations- und Secrets-Datei des CIVITAS/CORE-Installationsskripts.
status: draft
lastUpdated: 2026-10-01
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-umgebungsvariablen
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-skriptarchitektur
quality:
  completeness: 70
  accuracy: 75
  reviewed: false
  reviewer:
  reviewDate:
---

# Umgebungsvariablen und `.env`-Datei

Referenz der Konfigurations- und Secrets-Datei des Installationsskripts
(`install_civitas_core_V1.sh`, `install_civitas_core_V1s.sh`).

## Dateiname und Ablageort

Das Skript lädt die Datei im Host-Kontext nicht selbst. Vor dem Skriptaufruf
wird sie manuell gesourct oder die Werte sind als Umgebungsvariablen gesetzt.
`run_in_vm()` kopiert die Datei für den VM-Hop in die VM und sourct sie dort.

| Variante | Dateiname | Ort | Kopie in die VM |
|---|---|---|---|
| V1 | `.env.local` | Skript-Verzeichnis (`${SCRIPT_DIR}`) | `/root/civitas-install/.env.local` |
| V1s | `.env-v1s.local` (Fallback `.env.local`) | Skript-Verzeichnis (`${SCRIPT_DIR}`) | `/root/civitas-install/.env.local` |

Der frühere Kopfkommentar der Vorlagen („Kopieren nach `.env.local` … alle mit
`?` markierten Variablen …") ist falsch. Es gibt keine `?`-Markierung. Die
V1s-Datei heißt `.env-v1s.local`, nicht `.env.local`. Die Kennzeichnung erfolgt
über `[Pflicht]`-Kommentare in der Vorlage und die `${VAR:?…}`-Prüfungen in
`01_config.sh`.

## Laden

```bash
set -a; source .env-v1s.local; set +a
./install_civitas_core_V1s.sh
```

Beim VM-Hop (`CIVITAS_CONTEXT=vm`):

```bash
cd ${VM_REMOTE_INSTALL_DIR}
if [[ -f .env.local ]]; then set -a; source .env.local; set +a; fi
./install_civitas_core_V1s.sh
```

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
| `CERT_BACKUP_FILE` | nein | `le-certs-backup.yaml` | Pfad zum LE-Zertifikats-Backup |

`NO_NEW_LE_CERT` wurde aus der Vorlage entfernt, es wird von keinem Modul
gelesen. Der Safety-Schalter heißt `LE_REQUESTS_BLOCKED`.

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

### VM-Zugang, SMTP, Admin

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `ROOT_PASSWORD` | ja | - | root-Passwort der Ziel-VM |
| `SMTP_HOST` | ja | - | SMTP-Server |
| `SMTP_PORT` | nein | `587` | SMTP-Port |
| `SMTP_USER` | ja | - | SMTP-Benutzer |
| `SMTP_PASS` | ja | - | SMTP-Passwort |
| `ADMIN_EMAIL` | nein | `admin@${DOMAIN_NAME}` | E-Mail des Plattform-Administrators |
| `ADMIN_PASS` | ja | - | master_password und platform_admin-Passwort |
| `TENANT_ADMIN_PASS` | nein | - | wird von keinem Modul gelesen |

### Netzwerkmodus / WireGuard

| Variable | Pflicht | Default | Wirkung |
|---|---|---|---|
| `WG_ENABLE` | nein | `true` | `false` deaktiviert WireGuard |
| `WG_VM_PRIVATE_KEY` | bei `WG_ENABLE=true` | - | WireGuard-Private-Key der VM |
| `WG_OPN_PUBLIC_KEY` | bei `WG_ENABLE=true` | - | WireGuard-Public-Key der OPNsense |
| `WG_OPN_ENDPOINT` | bei `WG_ENABLE=true` | - | öffentliche IP:Port der OPNsense |
| `WG_PRESHARED_KEY` | nein | leer | WireGuard-Pre-Shared-Key |

### Host / VM (Proxmox)

Alle Werte sind optional und per `.env` überschreibbar. Die Defaults entsprechen
der bisherigen SOHO-Umgebung.

| Variable | Default | Wirkung |
|---|---|---|
| `VM_ID` | `2010` | Proxmox VM-ID |
| `VM_NAME` | `civitas-core` | VM-Anzeigename |
| `VM_RAM_MB` | `40960` | RAM in MiB |
| `VM_CORES` | `12` | vCPUs |
| `VM_DISK_GB` | `300` | Disk-Größe in GiB |
| `VM_BRIDGE` | `vmbr0` | Bridge-Netzwerk |
| `PROXMOX_STORAGE` | `local-zfs-civitas` | Proxmox-Storage |
| `VM_IP_STATIC` | `192.168.12.139` | IPv4-Adresse der VM |
| `VM_IP_PREFIX` | `24` | IPv4-Präfixlänge |
| `VM_GW` | `192.168.12.1` | IPv4-Gateway |
| `VM_IP6_STATIC` | `fd01:1:1:1::139` | IPv6-Adresse der VM, leer = IPv6 deaktivieren |
| `VM_IP6_PREFIX` | `64` | IPv6-Präfixlänge |
| `VM_GW6` | `fd01:1:1:1:de39:6fff:febe:9962` | IPv6-Gateway |
| `PBS_STORAGE` | `backup-p2d2-kinglui` | PBS-Storage, leer = Backup-Prüfung überspringen |
| `CLOUD_IMAGE_URL` | Debian-13-Cloud-Image | Quelle für das Cloud-Image |
| `SOHO_GATEWAY` | `${VM_GW}` | Gateway für die Phase-0-Netzprüfung |

Für `VM_IP6_STATIC` und `PBS_STORAGE` wird `${VAR-default}` (einfacher
Bindestrich) statt `${VAR:-default}` verwendet. Ein leerer Wert bleibt leer,
nur ein unset Wert erhält den Default.

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
```

## Sicherheitshinweise

Die `.env`-Datei enthält Secrets und wird nicht committet. Die versionierten
Vorlagen `.env.example` (V1) und `.env-v1s.local.example` (V1s) enthalten nur
Platzhalter (`CHANGEME`).
