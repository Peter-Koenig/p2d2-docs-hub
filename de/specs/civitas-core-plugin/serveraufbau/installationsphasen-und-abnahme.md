---
title: Installationsphasen und Abnahme
description: Phasendefinition, Abnahmekriterien und Fehlerbehandlung für das CIVITAS/CORE-Installationsskript auf dem Proxmox-Knoten civitas.
status: draft
lastUpdated: 2026-06-20
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
  completeness: 75
  accuracy: 85
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
  (12 vCPU, 40 GiB RAM, 300 GiB Disk, Debian/Ubuntu Gast-OS)
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
| -1.1 | Cloud-Image herunterladen (`debian-13-genericcloud-amd64-daily.qcow2`) | Datei in `/var/lib/vz/template/iso/` vorhanden |
| -1.2 | VM mit qm create anlegen (12 vCPU, 40 GiB RAM, Bridge vmbr0) | `qm status VM_ID` — VM existiert |
| -1.3 | Disk aus Cloud-Image importieren (300 GiB, ZFS-thin) | `qm config VM_ID` — Disk zugewiesen |
| -1.4 | Cloud-Init konfigurieren (root-Passwort, DHCP) | `qm config VM_ID` — ciuser/cipassword gesetzt |
| -1.5 | VM starten | `qm status VM_ID` → running |
| -1.6 | Warten auf IP (QEMU-Guest-Agent) | `qm guest exec VM_ID -- hostname -I` liefert IP |
| -1.7 | Anleitung für SSH-Zugang ausgeben | — |

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
> und das Installationsskript in die VM übertragen wurde.

### Konfigurationsvariablen Phase -1

Die folgenden Variablen werden im Konfigurationsmodul des Skripts
externalisiert:

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `VM_ID` | Proxmox VM-ID | `100` |
| `VM_NAME` | Anzeigename in Proxmox | `civitas-core` |
| `VM_RAM_MB` | RAM in MiB | `40960` |
| `VM_CORES` | vCPUs | `12` |
| `VM_DISK_GB` | Disk-Größe in GiB | `300` |
| `VM_BRIDGE` | Bridge-Netzwerk | `vmbr0` |
| `PROXMOX_STORAGE` | Proxmox-Storage für VM-Disk | `local-zfs-civitas` |
| `CLOUD_IMAGE_URL` | URL zum Debian-13-Cloud-Image | siehe Quellcode |

> **Hinweis**: `ROOT_PASSWORD` wird ausschließlich als Umgebungsvariable
> übergeben und nie hartcodiert. Das Skript bricht ab, wenn die Variable
> nicht gesetzt ist.

***

## Phase 0 — Vorbedingungen

### Zweck

Sicherstellen, dass alle Voraussetzungen für eine erfolgreiche Installation
erfüllt sind, bevor irreversible Aktionen ausgeführt werden.

### Prüfungen

| Prüfpunkt | Erwarteter Zustand | Befehl / Methode | Fehlerverhalten |
|---|---|---|---|
| Betriebssystem | Debian 12 oder Ubuntu 24.04 LTS, x86_64 | `lsb_release -rs`, `uname -m` | Abbruch |
| vCPU | ≥ 4 (empfohlen: 12) | `nproc` | Abbruch |
| RAM | ≥ 16384 MiB (empfohlen: 40 GiB) | `free -m` (numerischer Vergleich) | Abbruch |
| Disk (freier Platz k3s-Pfad) | ≥ 100 GiB | `df -h /var/lib/rancher/k3s 2>/dev/null \|\| df -h /` | Abbruch |
| Swap | Deaktiviert | `swapon --show` muss leer sein | Abbruch |
| Netzwerk (intern) | VM erreicht SOHO-Gateway | `ping -c2 <gateway>` | Abbruch |
| DNS `idm.<domain>` / `portal.<domain>` | Auflösbar | `dig +short idm.$DOMAIN` | **Warnung** (kein Abbruch, DNS wird manuell vor Phase 2 gesetzt) |
| `curl` vorhanden | Binary verfügbar | `command -v curl` | Abbruch |
| `python3` / `pip3` vorhanden | Binaries verfügbar | `command -v python3 && command -v pip3` | Abbruch |
| SMTP erreichbar | TCP-Verbindung zu `$SMTP_HOST:$SMTP_PORT` | `nc -z -w5 $SMTP_HOST $SMTP_PORT` | Abbruch |
| k3s / kubectl | Noch nicht installiert ODER bereits korrekte Version | Versionsvergleich gegen `$K3S_VERSION` | Abbruch bei falscher Version |

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
| 1.2 | kubeconfig nach `~/.kube/config` kopieren | Datei vorhanden und korrekt (`kubectl cluster-info`) |
| 1.3 | `helm`-CLI installieren (separat — k3s bringt `helm-controller`, nicht die `helm`-CLI) | `command -v helm` + Versionsvergleich gegen `$HELM_VERSION` |
| 1.4 | cert-manager via Helm deployen (Namespace `cert-manager`) | `kubectl get pods -n cert-manager` → alle Running |
| 1.5 | ClusterIssuer konfigurieren (self-signed für Prototyp) | `kubectl get clusterissuer` → READY=True |
| 1.6 | nginx-Ingress via Helm deployen (Namespace `ingress-nginx`) | `kubectl get pods -n ingress-nginx` → controller Running |
| 1.7 | Storage Class prüfen (`local-path-provisioner` durch k3s mitgeliefert, **nicht deaktivieren**) | `kubectl get storageclass` → `local-path` als Default |

> **Wichtig (Reihenfolge)**: cert-manager und ClusterIssuer (Schritte 1.4–1.5)
> werden vor nginx-Ingress (Schritt 1.6) installiert, damit der Ingress-Controller
> bei Bedarf sofort TLS-fähig ist.

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
```

> **Abnahme Phase 1 bestanden**, wenn alle Prüfungen den beschriebenen
> Zustand aufweisen. Das Skript protokolliert die Ergebnisse und bricht
> bei Abweichungen ab.

***

## Phase 2 — CIVITAS/CORE-Plattform

### Zweck

Die CIVITAS/CORE-Plattform über `cc-cli` auf dem in Phase 1 bereitgestellten
Cluster installieren.

### Voraussetzungen

- Phase 1 vollständig abgenommen.
- Gültiger kubeconfig unter `~/.kube/config`.
- DNS-Einträge für `idm.$DOMAIN` und `portal.$DOMAIN` auflösbar
  (hier harte Prüfung — Abbruch bei Fehler).
- SMTP-Zugangsdaten als Umgebungsvariablen gesetzt.

### Schritte

| Schritt | Aktion | Idempotenz-Prüfung |
|---|---|---|
| 2.0 | DNS erneut prüfen (harter Abbruch wenn nicht auflösbar) | `dig +short idm.$DOMAIN` und `dig +short portal.$DOMAIN` — beide müssen eine IP liefern |
| 2.1 | `cc-cli` installieren (gepinnte Version) | `pip show cc-cli \| grep Version` vs. `$CC_CLI_VERSION` |
| 2.2 | Konfigurationsdatei `config.yaml` aus Template erzeugen | Datei vorhanden, Pflichtfelder gesetzt |
| 2.3 | `cc_cli validate` ausführen | Exit-Code 0 |
| 2.4 | `cc_cli exec` ausführen (mit konfiguriertem Timeout `$TIMEOUT_CC_CLI_EXEC`) | Exit-Code 0 |
| 2.5 | Warten bis alle Pods Ready (`kubectl wait`) | Exit-Code 0 |

### Konfigurationsvariablen (Pflichtfelder)

Alle Variablen werden im Konfigurationsmodul des Skripts externalisiert.
Passwörter und Secrets werden ausschließlich als Umgebungsvariablen
übergeben — **nie hartcodiert oder in Git eingecheckt**.

| Variable | Beschreibung | Beispielwert |
|---|---|---|
| `DOMAIN` | Basis-Domain für `idm.` und `portal.` | `civitas.data-dna.eu` |
| `SMTP_HOST` | SMTP-Server (netcup) | `mx2fab.netcup.net` (exakter Hostname aus WCP) |
| `SMTP_PORT` | SMTP-Port | `587` |
| `SMTP_USER` | SMTP-Absender | `noreply@data-dna.eu` |
| `SMTP_PASS` | SMTP-Passwort | Aus Umgebungsvariable `$SMTP_PASS` |
| `CC_CLI_VERSION` | cc-cli-Version (Pinning) | z. B. `2.3.1` — nicht `latest` |
| `TIMEOUT_CC_CLI_EXEC` | Timeout für `cc_cli exec` in Sekunden | `600` |
| `ADMIN_EMAIL` | Initiale Admin-E-Mail | `admin@data-dna.eu` |
| `K8S_NAMESPACE` | Ziel-Namespace | `civitas-core` |

> **Hinweis SMTP**: Für Keycloak (Bestandteil von CIVITAS/CORE V2) ist
> eine erreichbare SMTP-Konfiguration zwingend. Ohne gültige SMTP-Verbindung
> schlägt `cc_cli validate` fehl. Die SMTP-Erreichbarkeit wird bereits in
> Phase 0 geprüft.

> **Hinweis cc-cli-Version**: `CC_CLI_VERSION` ist immer auf eine konkrete
> Versionsnummer zu setzen (z. B. `2.3.1`), niemals auf `latest`. Breaking
> Changes durch neue Releases werden so vermieden. Die zum Zeitpunkt des
> ersten Skriptbaus aktuelle Version wird beim Bau fixiert.

### Abnahmekriterien Phase 2

```bash
# DNS-Auflösung (harte Voraussetzung)
dig +short idm.$DOMAIN
dig +short portal.$DOMAIN
# Erwartung: jeweils eine IP-Adresse

# Namespace vorhanden
kubectl get namespace civitas-core
# Erwartung: Status "Active"

# Pods der Plattform (nach kubectl wait)
kubectl get pods -n civitas-core
# Erwartung: Alle Pods "Running", kein "Error" / "CrashLoopBackOff"

# Ingress-Ressourcen
kubectl get ingress -n civitas-core
# Erwartung: Einträge für idm.$DOMAIN und portal.$DOMAIN

# TLS-Zertifikate
kubectl get certificate -n civitas-core
# Erwartung: READY = True für alle Zertifikate

# Keycloak erreichbar (intern)
curl -sk https://idm.$DOMAIN/health
# Erwartung: HTTP 200 oder Keycloak-Begrüßungsseite

# Portal erreichbar (intern)
curl -sk https://portal.$DOMAIN
# Erwartung: HTTP 200 oder Redirect auf Login
```

> **Abnahme Phase 2 bestanden**, wenn alle Pods laufen, Ingress-Ressourcen
> vorhanden sind, TLS-Zertifikate ausgestellt wurden und beide Endpunkte
> intern per HTTPS erreichbar sind.

***

## Phase 3 — Verifikation und Fehlerreport

### Zweck

Systematische End-to-End-Prüfung nach Abschluss beider Installationsphasen.
Das Skript führt alle Abnahmetests aus Phase 1 und Phase 2 erneut aus und
erzeugt einen zusammenfassenden Bericht.

### Struktur des Verifikationsmoduls

```
verify_phase1()   → Prüft alle Phase-1-Kriterien, zählt Fehler
verify_phase2()   → Prüft alle Phase-2-Kriterien, zählt Fehler
report_result()   → Gibt Zusammenfassung aus (OK / FAILED + Fehlercount)
exit_with_code()  → Exit 0 bei Erfolg, Exit 1 bei ≥ 1 Fehler
```

### Ausgabeformat (Beispiel)

```
[2026-06-20 22:00:00] [PHASE 1] k3s Node Ready              ... OK
[2026-06-20 22:00:01] [PHASE 1] cert-manager Running         ... OK
[2026-06-20 22:00:02] [PHASE 1] nginx-Ingress Running        ... OK
[2026-06-20 22:00:03] [PHASE 1] Storage Class local-path     ... OK
[2026-06-20 22:00:10] [PHASE 2] Namespace civitas-core       ... OK
[2026-06-20 22:00:11] [PHASE 2] Pods Running                 ... OK
[2026-06-20 22:00:12] [PHASE 2] TLS Certificates Ready       ... OK
[2026-06-20 22:00:13] [PHASE 2] idm.civitas.data-dna.eu      ... OK
[2026-06-20 22:00:14] [PHASE 2] portal.civitas.data-dna.eu   ... OK
------------------------------------------------------------
Ergebnis: 9/9 Prüfungen bestanden. Installation erfolgreich.
```

> **Hinweis**: Vor der Endprüfung wartet das Skript, bis alle Pods den
> Ready-Status erreicht haben:
> `kubectl wait --for=condition=Ready pods --all -n civitas-core --timeout=300s`

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

***

## Offene Punkte (vor Skriptbau zu klären)

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Gast-OS: Debian 12 oder Ubuntu 24.04 LTS? | Offen | Peter König |
| Domainname: `civitas.data-dna.eu` oder anderer Vorschlag? | Offen | Peter König |
| TLS-Strategie: self-signed ClusterIssuer oder interne CA? | Offen | netzwerk-dns-tls.md |
| Ziel-Namespace für CIVITAS/CORE | Vorschlag: `civitas-core` | Bestätigung Peter König |
| cc-cli-Version (Pinning) | Beim ersten Skriptbau aus Doku ermitteln | Skriptbau |
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
