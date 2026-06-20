---
title: Kubernetes-Laufzeit für CIVITAS/CORE
description: Entscheidung für die Kubernetes-Distribution in der CIVITAS/CORE-VM. Begründete Auswahl zwischen k3s, k0s und kubeadm + containerd.
status: draft
lastUpdated: 2026-06-20
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-kubernetes-laufzeit
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-zielbild
  - civitas-core-plugin-serveraufbau-vm-sizing
  - civitas-core-plugin-serveraufbau-netzwerk
quality:
  completeness: 80
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# Kubernetes-Laufzeit für CIVITAS/CORE

## Ziel

Dieses Dokument legt die Kubernetes-Distribution für die CIVITAS/CORE-VM auf dem
Proxmox-Knoten "civitas" fest und begründet die Entscheidung. Es dient als
Grundlage für das Installationsskript (Phase 1: Cluster-Bereitstellung).

## Rahmenbedingungen

- **Single-Node-Betrieb**: Der Cluster läuft auf einer einzelnen VM
  (12 vCPU, 40 GiB RAM, 300 GiB Disk).
- **Kubernetes ≥ 1.32, x86_64**: Von CIVITAS/CORE V2 gefordert.
- **Kein öffentlicher Zugang**: Die VM ist im internen SOHO-VLAN,
  kein öffentlicher DNS.
- **cc_cli als Deployment-Werkzeug**: Die CIVITAS/CORE-Plattform wird via
  `cc_cli` installiert, das einen lauffähigen Cluster mit gültigem kubeconfig
  voraussetzt.
- **Pflichtkomponenten**: cert-manager, Ingress-Controller (nginx oder traefik),
  RWO-fähige Storage Class.

## Entscheidungsdimensionen

Für die Bewertung der drei Kandidaten (k3s, k0s, kubeadm + containerd) werden
fünf Dimensionen herangezogen.

### 1. Single-Node-Fähigkeit

| Kriterium | k3s | k0s | kubeadm |
|---|---|---|---|
| Embedded Data Store | SQLite (Default) oder embedded etcd | embedded etcd | etcd muss separat betrieben werden |
| Control-Plane-Isolation | automatisch (Tolerations gesetzt) | `--single`-Flag | manuell (Taints + Tolerations) |
| Aufwand für Single-Node | trivial | gering | mittel |

Für einen dedizierten Single-Node sind k3s und k0s klar im Vorteil.
k3s verwendet standardmäßig SQLite statt etcd, was RAM spart – bei
einem Node ohne HA kein Verlust.

### 2. Ressourcen-Fußabdruck (Control Plane)

| Komponente | k3s | k0s | kubeadm |
|---|---|---|---|
| etcd | nein (SQLite) | ja (embedded) | ja (separat) |
| RAM Basis (CP) | ~300–500 MiB | ~500–800 MiB | ~1–1,5 GiB |
| Binärgröße | ~70 MiB (all-in-one) | ~100 MiB (all-in-one) | ~300 MiB (Summe kubelet, kubeadm, kubectl, containerd, etcd) |

k3s ist auch hier vorn: kein etcd-Prozess, nur eine Binary. k0s ist
etwas schwerer, aber noch nah dran. kubeadm mit vollständigem
Kubernetes-Stack und separatem etcd verbraucht mehr RAM und
Plattenplatz – bei unserem 300-GiB-Engpass ein Faktor.

### 3. Komplexität des Installationsskripts

| Aspekt | k3s | k0s | kubeadm |
|---|---|---|---|
| Zeilen für Cluster-Setup | 30–50 | 60–100 | 150–250 |
| Externe Abhängigkeiten | curl → Install-Skript | curl → Binary, Konfigurationsdatei | containerd, kubelet, kubeadm, CNI, etcd |
| Helm vorinstalliert? | helm-controller (keine CLI) | nein | nein |
| Ingress vorinstalliert? | traefik (optional, per `--disable`) | nein | nein |
| Storage Class vorinstalliert? | local-path-provisioner | nein | nein |
| Idempotenz einfach? | ja (Prüfe Binary / systemd) | ja (Prüfe Binary / systemd) | aufwändiger (Prüfe APT-Status, Config, CNI) |

k3s installiert sich mit einem Befehl und bringt helm-controller, Ingress
(optional) und eine Storage Class mit. helm-controller deployed Helm-Charts
via Kubernetes-Manifeste, stellt aber keine helm-CLI bereit. Für cc_cli
und manuelle Helm-Befehle muss helm separat installiert werden – das ist
trivial und in zwei Zeilen erledigt. Insgesamt reduziert sich die Zahl der
Skriptmodule dennoch, weil keine Helm-Integration von Hand aufgesetzt
werden muss. k0s erfordert das Handling einer
Konfigurationsdatei und die Nachinstallation von Helm, Ingress und
Storage. kubeadm erfordert eine komplette, eigenhändige Orchestrierung
des Cluster-Baus inklusive CNI-Auswahl und etcd.

### 4. Wartbarkeit und Upgrade-Pfad

| Aspekt | k3s | k0s | kubeadm |
|---|---|---|---|
| Upgrade-Mechanismus | curl-Install-Skript (Rancher) | `k0s upgrade` / Binary-Austausch | `kubeadm upgrade plan` + `apply` |
| Patch-Rhythmus | regelmäßig (Rancher) | regelmäßig | upstream |
| Wartungsaufwand p.a. | gering | gering | mittel |

Das k3s-Upgrade-Skript von Rancher handhabt auch Versionssprünge.
k0s erfordert etwas mehr manuelle Kontrolle. kubeadm ist am
aufwändigsten: etcd, CNI und Add-ons müssen separat geupgraded werden.

### 5. Kompatibilität mit CIVITAS/CORE

cc_cli deployt die CIVITAS/CORE-Plattform auf einen beliebigen
Kubernetes-Cluster mit gültigem kubeconfig. Alle drei Kandidaten sind
kompatibel. k3s deaktiviert einige Alpha-Features – bisher kein
bekanntes Problem mit CIVITAS/CORE. k0s ist upstream-näher.
kubeadm bildet den reinsten Upstream-Pfad ab.

## Bewertungsmatrix

| Kriterium | k3s | k0s | kubeadm + containerd |
|---|---|---|---|
| Kompatibilität CIVITAS/CORE V2 (≥ 1.32) | ++ | ++ | +++ |
| Installationsaufwand VM | +++ | ++ | – |
| Single-Node-Tauglichkeit | +++ | +++ | + |
| Ressourcen-Overhead (RAM) | +++ (300–500 MiB) | ++ (500–800 MiB) | – (1–1,5 GiB) |
| Pflichtkomponenten (cert-manager, Ingress, Storage) | ++ (helm-controller + local-path; helm-CLI nötig) | + (alles nachinstalliert) | + (alles nachinstalliert) |
| Wartbarkeit / Upgrade | ++ | ++ | + |
| Skript-Komplexität | +++ (~30–50 Zeilen) | ++ (~60–100 Zeilen) | – (~150–250 Zeilen) |
| **Summe** | **16 von 18** | **13 von 18** | **8 von 18** |

## Begründung

Die CIVITAS/CORE-VM ist als dedizierte Entwicklungs- und Evaluationsumgebung
konzipiert. Für diesen Zweck ist eine Distribution sinnvoll, die
standardkonform bleibt, aber minimalen Installations- und Betriebsaufwand
erzeugt.

**k3s** erfüllt diesen Zielkonflikt am besten:

- Die SQLite-Datenbank erspart den etcd-Ressourcenverbrauch – bei einem
  Single-Node ohne HA kein Verlust.
- helm-controller, Ingress (traefik) und eine RWO-fähige Storage Class
  (local-path-provisioner) sind bereits enthalten. Die helm-CLI muss
  separat installiert werden – das ist trivial und in zwei Zeilen
  erledigt. Insgesamt reduziert sich die Zahl der Skriptmodule um drei
  Komponenten.
- Das Installationsskript für den Cluster wird auf etwa 30–50 Zeilen
  geschätzt – der niedrigste Wert aller Kandidaten.
- k3s ist eine vollständige, standardkonforme Kubernetes-Distribution.
  Spätere Migration auf eine andere Distribution ist nicht ausgeschlossen.

**k0s** ist eine plausible Alternative, bringt aber keinen klaren Vorteil,
der die zusätzliche Skriptkomplexität rechtfertigt. Embedded etcd statt
SQLite wäre bei einem späteren Multi-Node-Ausbau von Vorteil – dafür
müsste der Betriebsmodus aber bereits heute feststehen. Solange
Entwicklung und Evaluation im Vordergrund stehen, überwiegen die Nachteile
(Konfigurationsdatei, Nachinstallation von Helm/Ingress/Storage).

**kubeadm + containerd** bildet den upstream-nächsten Pfad ab, erzeugt
aber ein Vielfaches an Skriptaufwand (~150–250 Zeilen). Für einen
dedizierten Single-Node-Prototypen ist das überdimensioniert. Die
zusätzliche Flexibilität wird in dieser Umgebung nicht benötigt.

## Ressourcentechnische Einordnung

Die VM-Sizing-Vorgaben (12 vCPU, 40 GiB RAM, 300 GiB Disk) sind für k3s
mehr als ausreichend. k3s benötigt auf einem Single-Node ~300–500 MiB RAM
für die Control Plane – der Rest steht für CIVITAS/CORE-Komponenten zur
Verfügung. Mit 40 GiB bleibt auch bei Lastspitzen genug Reserve für die
Plattform-Komponenten (Keycloak, Portal, Datenbank).

Der Storage-Engpass (300 GiB vs. 600 GiB empfohlen) wird durch k3s nicht
verschärft: local-path-provisioner nutzt den Host-Pfad der VM. Der
Verzicht auf etcd spart zusätzlich ca. 1–2 GiB Plattenplatz für das
Data Store-WAL.

## Konsequenz für das Installationsskript

Das Installationsskript gliedert sich in zwei Phasen. Die Aufwände
unterscheiden sich je nach Distribution nur in Phase 1:

### Phase 1: Kubernetes-Cluster bereitstellen

| Distro | Geschätzte Zeilen | Besondere Risiken |
|---|---|---|
| k3s | 30–50 | keine |
| k0s | 60–100 | YAML-Konfiguration muss präzise sein |
| kubeadm | 150–250 | APT-Pinning, containerd-Version, CNI-Auswahl |

### Phase 2: Plattform via cc_cli (distributionsunabhängig)

| Schritt | Geschätzte Zeilen |
|---|---|
| `pip install cc-cli` | 5–10 |
| Konfiguration als YAML bereitstellen | 15–20 |
| `cc_cli validate` + `cc_cli exec` | 10–15 |
| Verifikation | 10–15 |
| **Summe Phase 2** | **40–60** |

### Gesamtschätzung (k3s)

- Phase 1: ~40 Zeilen
- Phase 2: ~50 Zeilen
- Overhead (Logging, Idempotenz, Fehlerbehandlung, Konfigurationsmodul): ~100 Zeilen
- **Gesamt: ~190–250 Zeilen**

### Konkrete Vorgaben für das Skript

1. **k3s-Version** als Konfigurationsvariable, nicht hartcodiert.
2. **Installationsmodus**: Online via curl (Default) oder Offline mit
   vorgehaltener Binary – als konfigurierbare Option.
3. **Deaktivierte Komponenten**: traefik (per `--disable traefik`, da
   nginx als Ingress-Controller gewählt ist), local-path-provisioner,
   servicelb, metrics-server.
4. **Nachinstallierte Komponenten**: cert-manager und Ingress-Controller
   (nginx) via Helm (helm-CLI vorher installieren).
5. **kubeconfig**: Automatisch nach `~/.kube/config` kopieren für cc_cli.
6. **Idempotenz**: Jede Funktion prüft den Zielzustand, bevor sie
   ausgeführt wird.
7. **Verifikation**: Nach Phase 1 Prüfung des Cluster-Status
   (`kubectl get nodes`), nach Phase 2 Prüfung der CIVITAS/CORE-Pods.

## Festlegungen

1. Die CIVITAS/CORE-VM verwendet **k3s** als Kubernetes-Distribution.
2. Der Betrieb ist zunächst Single-Node mit **SQLite** als Data Store.
3. Als Ingress-Controller wird **nginx** eingesetzt. traefik wird daher
   beim k3s-Start mit `--disable traefik` deaktiviert. cert-manager und
   nginx-Ingress werden via Helm als Pflichtkomponenten nachinstalliert.
4. Die Storage-Class wird durch k3s' **local-path-provisioner**
   bereitgestellt.
5. k0s und kubeadm + containerd sind dokumentiert, aber nicht als
   Zielimplementierung gewählt.
6. Das Installationsskript bildet die **erste Ausbaustufe** ab:
   funktionierender Prototyp für Entwicklung und Evaluation.
7. Upgrade und Migration auf eine andere Distribution oder Multi-Node
   bleiben explizit offen für eine spätere Spezifikation. Hinweis:
   Eine Migration von SQLite auf embedded etcd (für k3s Multi-Node)
   erfordert ein nicht-triviales Datenbankmigrationsverfahren und
   ist nicht durch einfaches Flag-Umschalten zu erreichen.