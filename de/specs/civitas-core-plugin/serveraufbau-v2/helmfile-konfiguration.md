---
title: Helmfile-Konfiguration für CIVITAS/CORE V2
description: Konfigurationshierarchie, global.yaml.gotmpl, Caddy-TLS-Anpassungen und Environment-Setup für das helmfile-basierte Deployment
status: draft
lastUpdated: 2026-06-23
lang: de
category: spec
specid: civitas-core-v2-serveraufbau-helmfile-konfiguration
parent: civitas-core-v2-serveraufbau-index
dependencies:
  - civitas-core-v2-serveraufbau-deployment-voraussetzungen
  - civitas-core-v2-serveraufbau-netzwerk
quality:
  completeness: 65
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# Helmfile-Konfiguration

Dieses Dokument spezifiziert die Konfigurationshierarchie des CIVITAS/CORE-V2-Deployments, den Aufbau der `global.yaml.gotmpl` für die p2d2-Instanz und die notwendigen Anpassungen für die bestehende TLS-Infrastruktur (Caddy auf OPNsense).

## Repository-Struktur

Das Deployment-Repository `civitas-core-deployment` hat folgenden Aufbau:

```
civitas-core-deployment/
├── defaults/                         # Upstream-Defaults (nicht verändern)
│   ├── environment/
│   │   ├── global.yaml               # Master-Konfiguration (Domain, Profile, Komponenten)
│   │   └── *.yaml.gotmpl             # Auto-aggregierte Komponenten-Konfigurationen
│   └── deployment/                   # Default-Deployment-Gerüst
├── components/                       # 14 Komponenten-Definitionen
│   ├── prepare/
│   ├── secrets/
│   ├── postgres/
│   ├── etcd/
│   ├── kafka/
│   ├── keycloak/
│   ├── apisix/
│   ├── apicurio/
│   ├── model-atlas/
│   ├── redpanda-connect/
│   ├── portal/
│   ├── config-adapters/
│   ├── opa/
│   └── authz-repo/
├── deployment/                       # Instanz-spezifische Konfiguration (eigenes Git-Repo)
│   ├── helmfile.yaml                 # Haupt-Einstiegspunkt (unverändert)
│   └── environments/
│       └── <env>/
│           └── global.yaml.gotmpl    # Umgebungs-Overrides
├── helmfile-root.yaml.gotmpl
└── helmfile-components.yaml.gotmpl
```

> **Wichtig**: Nur das Verzeichnis `deployment/` wird für die p2d2-Instanz konfiguriert.
> Die Verzeichnisse `defaults/` und `components/` enthalten den Upstream-Stand und
> werden nicht verändert.

## Konfigurationshierarchie

Die Werte werden in folgender Reihenfolge aufgelöst (niedrigste → höchste Priorität):

| Stufe | Quelle | Beschreibung |
|---|---|---|
| 1 | `defaults/environment/global.yaml` | Globale Defaults (Domain, Profile, Komponentenliste) |
| 2 | `defaults/environment/*.yaml.gotmpl` | Aggregierte Komponenten-Konfigurationen (Charts, Images, DBs, Secrets) |
| 3 | `components/<name>/default-environment.yaml.gotmpl` | Per-Komponente Defaults (Namespaces, Feature-Flags) |
| 4 | `components/<name>/values/<part>/base-values.yaml.gotmpl` | Base-Helm-Values |
| 5 | `components/<name>/values/<part>/<profile>-values.yaml.gotmpl` | Profil-spezifische Werte (development/production) |
| 6 | `deployment/environments/<env>/global.yaml.gotmpl` | **Umgebungs-Overrides (höchste Priorität)** |

Die p2d2-Instanz konfiguriert ausschließlich auf **Stufe 6**.

## Deployment-Verzeichnis einrichten

Das Deployment-Verzeichnis wird in Phase 2a aus dem Default-Gerüst erstellt:

```bash
# Nach dem Klonen des Repos:
cp -r defaults/deployment deployment
# Als eigenes Git-Repo initialisieren:
cd deployment
git init
git add -A
git commit -m "Initial deployment scaffolding for p2d2 instance"
```

Das `deployment/`-Verzeichnis ist im `.gitignore` des Haupt-Repos, sodass
es getrennt versioniert werden kann. Das ist für die Nachvollziehbarkeit
der p2d2-Instanz-Konfiguration erforderlich.

Erwartete Verzeichnisstruktur nach dem Einrichten:

```
deployment/
├── helmfile.yaml                     # Haupt-Einstieg (wird nicht verändert)
└── environments/
    └── cc-prd/                       # Environment-Name für die p2d2-Instanz
        └── global.yaml.gotmpl        # Instanz-Konfiguration
```

## Environment anlegen

Ein Environment repräsentiert eine vollständige Installation der Plattform.
Für die p2d2-Instanz wird das Environment `cc-prd` verwendet.

Anlage in `deployment/helmfile.yaml`:

```yaml
environments:
  cc-prd:
    values: []

helmfiles:
  - path: "../helmfile-root.yaml.gotmpl"
    values:
      - environments:
          - cc-prd
```

## global.yaml.gotmpl für die p2d2-Instanz

Die folgende Konfiguration wird in `deployment/environments/cc-prd/global.yaml.gotmpl`
hinterlegt. Sie überschreibt die Default-Werte für die p2d2-Instanz und enthält alle
Caddy-TLS-Anpassungen.

```yaml
global:
  # DNS-Domain für alle Dienste
  domain: udp.data-dna.eu

  # Eindeutiger Identifier (wird als Namespace verwendet)
  instanceSlug: cc-prd

  # Deployment-Profil
  #   development = niedrige Ressourcen, Debug-Logging, Self-Signed
  #   production  = höhere Ressourcen, Multi-Replica, strenge Policies
  profile: production

  # Namespace-Strategie: alle Komponenten in einem Namespace
  createNamespaces: true
  singleNamespace: true

  # Service Mesh (aktuell nicht aktiviert – offener Punkt)
  serviceMesh:
    enable: false
    type: linkerd
    patchNamespaces: false

  # Ingress-Konfiguration (angepasst für Caddy-TLS auf OPNsense)
  ingress:
    enabled: true
    clusterIssuer: 'selfsigned-ca'   # KEIN letsencrypt – TLS endet an Caddy
    ingressClass: 'nginx'

  # StorageClass (local-path von k3s)
  storage:
    storageClass:
      rwo: 'local-path'
      rwx: 'local-path'
      loc: 'local-path'

  # Metriken (vorerst deaktiviert)
  metrics:
    enabled: false

  # E-Mail für initialen Admin-User
  initialUserEmail: admin@data-dna.eu

# Komponentenliste (vollständiger Stack)
components:
  - prepare
  - secrets
  - postgres
  - etcd
  - kafka
  - keycloak
  - apisix
  - apicurio
  - model-atlas
  - redpanda-connect
  - portal
  - config-adapters
  - opa
  - authz-repo
```

### Begründung der Abweichungen vom V2-Default

| Parameter | V2-Default | p2d2-Override | Begründung |
|---|---|---|---|
| `global.ingress.clusterIssuer` | `selfsigned-ca` | `selfsigned-ca` (beibehalten) | TLS endet an Caddy auf OPNsense. Kein Let's Encrypt in der VM nötig. |
| `global.ingress.ingressClass` | `nginx` | `nginx` (beibehalten) | nginx-Ingress-Controller ist in Phase 1b installiert. |
| `global.serviceMesh.enable` | `true` | `false` | Linkerd ist ein offener Punkt – wird vorerst nicht installiert. |
| `global.profile` | `development` | `production` | Die p2d2-Instanz soll produktionsnahe Einstellungen verwenden. |
| `global.storage.storageClass.rwo` | `''` (Cluster-Default) | `local-path` | Explizite Angabe, da k3s local-path als Default bereitstellt. |

## Caddy-TLS-Anpassungen (ssl-redirect)

Da die TLS-Terminierung durch Caddy auf OPNsense erfolgt, muss der
nginx-Ingress-Controller in der VM so konfiguriert sein, dass er **keinen**
automatischen HTTP→HTTPS-Redirect durchführt.

Die Anpassung erfolgt auf zwei Ebenen:

### 1. nginx-Ingress-Controller (Phase 1b)

Bei der Installation des nginx-Ingress-Controllers wird der Service-Port
auf 8080 (HTTP) gesetzt. Die HTTPS-Weiterleitung ist nicht aktiv.

```yaml
controller:
  hostNetwork: true
  kind: DaemonSet
  service:
    ports:
      http: 8080
      https: 8443
  containerPort:
    http: 8080
    https: 8443
```

### 2. Ingress-Ressourcen nach helmfile sync (Phase 2c/2d)

Nach dem `helmfile sync` erzeugt CIVITAS/CORE V2 Ingress-Ressourcen mit
TLS-Blöcken (die auf `clusterIssuer: selfsigned-ca` verweisen). Der
nginx-Ingress würde daher standardmäßig HTTPS erwarten. Damit HTTP ohne
Redirect funktioniert, muss die Annotation gesetzt werden:

```yaml
nginx.ingress.kubernetes.io/ssl-redirect: "false"
```

Diese Annotation kann entweder:
- **Nach dem Deployment** auf alle Ingress-Ressourcen im Namespace angewendet werden
  (analog zum V1-Vorgehen in `patch_ingress_for_external_tls()`)
- **Im Ingress-Controller** global gesetzt werden über `--set controller.config.ssl-redirect=false`

Für die p2d2-Instanz wird die **Annotation pro Ingress** bevorzugt,
da sie überschaubar und nachvollziehbar ist. Ein Skript-Schritt in Phase 2d
setzt die Annotation auf alle Ingress-Ressourcen im Namespace.

## Helmfile-Befehle

### Erstmaliges Deployment

```bash
cd /opt/civitas-core-v2/deployment
helmfile -f helmfile.yaml sync -e cc-prd
```

Dies installiert CRDs, generiert Secrets und deployt alle 14 Komponenten
in der durch `components` definierten Reihenfolge.

### Folgende Deployments

Nach dem initialen Sync (wenn CRDs bereits installiert sind):

```bash
helmfile -f helmfile.yaml apply -e cc-prd
```

### Einzelne Komponente deployen

```bash
helmfile -f helmfile.yaml apply -e cc-prd --selector component=keycloak
```

### Dry-Run / Preview

```bash
helmfile -f helmfile.yaml template -e cc-prd   # Rendern ohne Deployment
helmfile -f helmfile.yaml lint -e cc-prd       # Valideren ohne Deployment
```

## Offene Punkte

| Punkt | Status | Entscheidung bei |
|---|---|---|
| Linkerd Service Mesh (`global.serviceMesh.enable`) | **Offen** – derzeit deaktiviert. Bei Aktivierung muss Linkerd vor Phase 2c im Cluster installiert sein. | Architekturentscheidung |
| `profile: production` vs. `development` | Vorläufig auf `production` gesetzt. `development` reduziert Ressourcen und Logging – für erste Tests evtl. sinnvoller. | Betriebsentscheidung |
| `initialUserEmail` | Auf `admin@data-dna.eu` gesetzt. Muss mit SMTP-Konfiguration korrespondieren. | Bestätigung Peter König |
| ssl-redirect-Strategie (Annotation vs. Controller-Global) | Annotation pro Ingress gewählt. Bei vielen Nachdeployments könnte eine globale Einstellung wartbarer sein. | Implementierungsentscheidung |
```
</｜｜DSML｜｜parameter>