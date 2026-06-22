---
title: Deployment-Voraussetzungen — CIVITAS/CORE V2
description: Cluster-Anforderungen, benötigte Werkzeuge, DNS-Einträge, Secrets und Netzwerk-Vorgaben für die CIVITAS/CORE-V2-Installation
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-deployment-voraussetzungen
parent: civitas-core-v2-serveraufbau-index
dependencies:
  - civitas-core-v2-serveraufbau-zielbild
quality:
  completeness: 60
  accuracy: 70
  reviewed: false
  reviewer:
  reviewDate:
---

# Deployment-Voraussetzungen

Dieses Dokument spezifiziert die Voraussetzungen, die vor Beginn der
CIVITAS/CORE-V2-Installation erfüllt sein müssen. Es gliedert sich in
Cluster-Anforderungen, Werkzeuge, DNS, Secrets und Netzwerk-Vorgaben.

## Cluster-Anforderungen

Der Kubernetes-Cluster (k3s Single-Node auf der CIVITAS-VM) muss folgende
Voraussetzungen erfüllen:

| Anforderung | Spezifikation | Begründung |
|---|---|---|
| Kubernetes-Version | ≥ 1.32, x86_64 | Von CIVITAS/CORE V2 gefordert |
| Ingress Controller | nginx (als DaemonSet) | Notwendig für externe Erreichbarkeit |
| cert-manager | Installiert mit ClusterIssuer (`selfsigned-ca`) | Wird von Komponenten für interne TLS-Zertifikate benötigt |
| Storage Class | RWO-fähig (z. B. `local-path` von k3s) | Für persistente Volumes (PostgreSQL, etc.) |
| Cluster-Admin-Rechte | Vollständig (kubeconfig mit Cluster-Rollen) | Erforderlich für CRD-Installation (CloudNativePG, Strimzi) |

Kubernetes ≥ 1.32 wird durch die Installation von k3s `v1.32.3+k3s1` (oder
neuer) in Phase 1a sichergestellt.

### Linkerd Service Mesh (offener Punkt)

Die V2-Dokumentation empfiehlt Linkerd für mTLS-Kommunikation und
Observability. Linkerd ist **optional**. Die Entscheidung über Installation
und Konfiguration ist noch offen und wird in einem separaten Schritt
getroffen.

## Benötigte Werkzeuge (Phase 0)

Auf der Ziel-VM müssen vor dem Deployment folgende Werkzeuge installiert
sein:

| Tool | Minimale Version | Zweck | Installation |
|---|---|---|---|
| `kubectl` | v1.32+ | Kubernetes-CLI | Via k3s-Installation (wird mitgeliefert) |
| `helm` | 3.18+ | Kubernetes-Package-Manager | Separater Download via curl |
| `helmfile` | 1.1.9+ | Deklarative Helm-Chart-Orchestrierung | Binary-Download via curl |
| `helm-diff`-Plugin | Aktuell | Wird von helmfile benötigt | `helm plugin install` |
| `git` | Beliebig | Deployment-Repository klonen | Via APT |

Diese Werkzeuge werden in Phase 0 (Preflight) auf Vollständigkeit und
Mindestversion geprüft. Fehlende Werkzeuge werden automatisch installiert.
Bei abweichenden Versionen erfolgt ein Abbruch.

## DNS-Einträge

Bevor Phase 2b beginnt, müssen folgende DNS-Einträge gesetzt sein und
auflösbar sein:

| Eintrag | Ziel | Zweck |
|---|---|---|
| `idm.$DOMAIN` | Öffentliche IP der OPNsense (Caddy) | Keycloak-Authentifizierung |
| `portal.$DOMAIN` | Öffentliche IP der OPNsense (Caddy) | Benutzer- und Datenportal |

Die Auflösung muss von der VM aus funktionieren (`dig +short` liefert IP).
Caddy auf OPNsense leitet die Anfragen über den WireGuard-Tunnel an die VM
weiter (Port 8080, HTTP).

> **Hinweis**: Die DNS-Prüfung erfolgt zweistufig:
> 1. Phase 0: **Warnung** (weich) – DNS muss noch nicht gesetzt sein.
> 2. Phase 2b: **Harter Abbruch** – DNS muss auflösbar sein.

## Secrets

Vor Phase 2c (helmfile sync) muss folgendes Secret im Kubernetes-Cluster
existieren. Da CIVITAS/CORE V2 im Single-Namespace-Modus arbeitet, wird
das Secret im Ziel-Namespace angelegt.

### keycloak-smtp

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: keycloak-smtp
  namespace: <instanceSlug>
type: Opaque
stringData:
  host: "<SMTP_HOST>"
  port: "<SMTP_PORT>"
  from: "<SMTP_FROM_ADDRESS>"
  user: "<SMTP_USER>"
  password: "<SMTP_PASS>"
```

Das Secret wird in Phase 2b aus den Umgebungsvariablen des Skripts erzeugt
(`kubectl create secret generic keycloak-smtp ...`). Die Werte stammen aus
den bestehenden SMTP-Env-Vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, `SMTP_FROM`).

> **Hinweis**: Standardmäßig generiert helmfile Secrets für alle Komponenten
> automatisch. Nur `keycloak-smtp` muss zwingend vorab existieren, da das
> System sonst keine E-Mails versenden kann (Passwort-Reset, Einladungen).
> Ohne gültiges SMTP-Secret kann der initiale Admin kein Passwort setzen
> und muss dies manuell über die Keycloak-Admin-Konsole nachholen.

## Deployment-Repository

Das zentrale Deployment-Repository wird in Phase 2a auf die Ziel-VM geklont:

```
https://gitlab.com/civitas-connect/civitas-core/civitas-core-v2/civitas-core-deployment.git
```

- Zielverzeichnis: `/opt/civitas-core-v2`
- Symlink: `/opt/civitas-core → /opt/civitas-core-v2`
- Branch/Tag: Vor Implementierung festzulegen (kompatibel zur gewählten
  helmfile-Version)

Das Repository enthält:
- `defaults/` — Standardkonfiguration (nicht verändern)
- `components/` — 14 Komponenten-Definitionen als Helm-Chart-Wrapper
- `deployment/` — Instanzspezifische Konfiguration (eigenes Git-Repo)

## Netzwerk-Vorgaben

Die VM muss vor Beginn der Installation folgende Netzwerk-Voraussetzungen
erfüllen:

| Vorgabe | Prüfung | Zeitpunkt |
|---|---|---|
| SOHO-Gateway erreichbar | `ping -c2 192.168.12.1` | Phase 0 |
| SMTP-Server erreichbar | `tcp_reachable $SMTP_HOST $SMTP_PORT` | Phase 0 |
| DNS auflösbar (weich) | `dig +short idm.$DOMAIN` (Warnung) | Phase 0 |
| DNS auflösbar (hart) | `dig +short idm.$DOMAIN` + `portal.$DOMAIN` | Phase 2b |
| Deployment-Repository erreichbar | `git ls-remote $REPO_URL` | Phase 2a |

WireGuard ist während der Phasen -1 bis 2c **nicht aktiv**. Der Tunnel wird
erst in Phase 2d nach erfolgreichem `helmfile sync` konfiguriert und
gestartet. Bis dahin erfolgt die Kommunikation über das SOHO-LAN.

## Storage-Vorgaben

Die VM-Disk (300 GiB, ZFS thin-provisioned auf `rpool`) muss ausreichend
Platz für folgende Komponenten bieten:

| Komponente | Geschätzter Bedarf |
|---|---|
| Container-Images und k3s-Daten | 10–20 GiB |
| PostgreSQL-Daten (CloudNativePG) | 20–50 GiB (Start), skalierbar |
| ETCD-Daten | 1–5 GiB |
| Kafka-Daten | 10–30 GiB |
| Logs und Metriken | 5–10 GiB |

Bei 300 GiB Gesamtspeicher ist mit Engpässen zu rechnen, sobald die
Plattform produktiv genutzt wird. Eine Storage-Erweiterung oder
Aufräumstrategie ist vor dem Produktivbetrieb zu spezifizieren.

## Offene Punkte (vor Implementierung zu klären)

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Branch/Tag des Deployment-Repositorys | **Offen** – muss kompatibel zu helmfile 1.1.9+ festgelegt werden | Vor Implementierung |
| Linkerd-Installation (ja/nein) | **Offen** – empfohlen, aber nicht zwingend | Architekturentscheidung |
| Profil: `development` oder `production` | **Offen** – beeinflusst Ressourcen, Replicas, Logging | Betriebsentscheidung |
| `instanceSlug` (Namespace-Name) | **Offen** – z. B. `cc-prd` | Festlegung vor Skriptbau |