---
title: cc-cli-Inventar — Ansible-Inventory für CIVITAS/CORE
description: Dokumentation des per Wizard erzeugten cc_cli_inventory.yml, seiner Struktur und der daraus abgeleiteten Template-Vorlage für die automatisierte Installation.
status: draft
lastUpdated: 2026-06-29
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-cc-cli-inventar
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-installationsphasen-und-abnahme
  - civitas-core-plugin-serveraufbau-skriptarchitektur
quality:
  completeness: 87
  accuracy: 95
  reviewed: false
  reviewer:
  reviewDate:
---

# cc-cli-Inventar — Ansible-Inventory für CIVITAS/CORE

## Ziel

Dieses Dokument beschreibt die Struktur des Ansible-Inventorys, das `cc_cli`
für das Deployment der CIVITAS/CORE-Plattform benötigt. Es dient als Referenz
für den Bau des Templates `templates/inventory.yml.tpl` und der
`render_inventory()`-Funktion in `modules/06_civitas.sh`.

## Hintergrund

Das Inventory wird vom `cc_cli wizard` erzeugt. Die Befragung ist interaktiv.
Für die automatisierte Installation stellen wir ein vorbereitetes Template
bereit, dessen Platzhalter durch `render_inventory()` ersetzt werden.

Das Inventory ist kein einfaches YAML, sondern ein **Ansible-Inventory** mit
der Standardstruktur `all → vars → children → controller → hosts → vars`.

### Repository-Integration für `cc_cli exec`

Das Inventory allein genügt nicht für `cc_cli exec`. Die ausführbaren
Ansible-Playbooks liegen nicht im pip-Paket `cc-cli`, sondern im
CIVITAS/CORE-Repository. Die Bereitstellung des Repository-Arbeitskontexts
ist wie folgt entschieden:

| Aspekt | Festlegung |
|---|---|
| Repository-URL | `https://gitlab.com/civitas-connect/civitas-core/civitas-core-v1/civitas-core.git` |
| Repository-Pfad (VM) | `/opt/civitas-core-v1` |
| Symlink (aktive Version) | `/opt/civitas-core → /opt/civitas-core-v1` |
| Inventory-Ablage | `${CC_CLI_REPO_PATH}/cc_cli_inventory.yml` |
| Arbeitsverzeichnis für `cc_cli` | `${CC_CLI_REPO_PATH}` (cd vor validate/exec) |
| Schema-Datei | `./core_platform/inventory_schema.json` im Repository |

Dieses Dokument spezifiziert den **Inhalt** des Inventorys und den
**Dateinamen**. Der **Arbeitskontext** (Repository-Workspace) ist in
`installationsphasen-und-abnahme.md` (Phase 2, Schritte 2.2–2.4) und
`skriptarchitektur.md` (Modul 06, Abschnitt „Repository-Workspace")
spezifiziert.

## Wizard-Fragen und Antworten

| Frage | Antwort |
|---|---|
| Wizard mode | `expert` |
| Deployment target | `remote production deployment` |
| Domain | `udp.data-dna.eu` |
| Environment name | `cc-prd` |
| Kubernetes context | `default` |
| Ingress controller class | `nginx` |
| Storage class (RWO/RWX/LOC) | `local-path` |
| Cert-Manager-Issuer-Name | `selfsigned-issuer` |
| CA certificate path | (leer) |
| Ansible health checks | `No` (deaktiviert — TLS endet an Caddy, Health-Check in der VM nicht sinnvoll) |
| Email server | `mxe92c.netcup.net` |
| Email user | `admin@data-dna.eu` |
| Email password | `(maskiert)` |
| Email from address | `no-reply@data-dna.eu` |
| Passwords selbst setzen? | `No` (Auto-Generierung) |
| Private GitLab-Repositories | `No` |
| Access-Komponenten | `APISIX` |
| Context-Komponenten | `Frost` |
| Dashboard-Komponenten | `Service Portal`, `Superset` |
| Geodata-Komponenten | `GeoServer`, `Masterportal`, `Portal Backend` |
| Operation-Komponenten | `Monitoring`, `PgAdmin`, `Velero Backup` |
| Datacatalog-Komponenten | *(none)* |
| Monitoring-Komponenten | `Prometheus`, `Grafana`, `Alertmanager`, `Loki`, `Promtail` |
| CA cert download from Service Portal? | `No` |

> **Hinweis context**: k3s schreibt `/etc/rancher/k3s/k3s.yaml` mit dem
> Context-Namen `default`, nicht `k3s`. Der Wizard-Output enthält `k3s` als
> Antwort — das ist ein bekannter Fehler in der Wizard-UI. Im generierten
> Inventory und im Template `inventory.yml.tpl` ist `default` verbindlich.
> Im Inventory-Abschnitt `inv_k8s.config.context` steht entsprechend `"default"`.

## Inventory-Struktur

Das Inventory folgt der Ansible-Konvention:

```yaml
all:
  vars:
    DOMAIN: "udp.data-dna.eu"
    ENVIRONMENT: "cc-prd"
    kubeconfig_file: config
  children:
    controller:
      hosts:
        localhost:
          ansible_host: 127.0.0.1
          ansible_connection: local
          ansible_python_interpreter: "{{ ansible_playbook_python }}"
      vars:
        inv_k8s:            # Kubernetes-Konfiguration
          config:
            context: "default"   # war: "k3s" — k3s verwendet intern den Context-Namen "default"
          storage_class:
            rwo: "local-path"
            rwx: "local-path"
            loc: "local-path"
          ingress:
            ca_path: ""
            http: false
          cert_manager:
            issuer_name: "selfsigned-issuer"
          ingress_class: nginx
          gitlab_access:
            user_email: ''
            user: ''
            token: ''

        inv_op_stack:       # Operation Stack (Monitoring, Backup, PGAdmin)
          keel_operator:
            enable: false
            admin: "admin@{{ DOMAIN }}"
            password: "***"
          pgadmin:
            enable: true
            default_email: "admin@{{ DOMAIN }}"
            default_password: "***"
          kyverno_operator:
            enable: false
          monitoring:
            enable: true
            prometheus:
              enable: true
            grafana:
              enable: true
            alertmanager:
              enable: true
            loki:
              enable: true
            alloy:
              enable: true
            promtail:
              enable: true
          velero:
            enable: true
            backup:
              location_name: ""
              access_key: ""
              bucket: ""
              region: ""
              endpoint: ""
              secret: ""
          prometheus:
            enable: false

        inv_access:         # Access Stack (Keycloak, APISIX, Service Portal)
          enable: true
          platform:
            admin_first_name: "Admin"
            admin_surname: "Admin"
            admin_email: "admin@{{ DOMAIN }}"
            master_username: "admin@{{ DOMAIN }}"
            master_password: "***"
            k8s_secret_name: "{{ ENVIRONMENT }}-keycloak-admin"
            hostname: "https://idm.{{ DOMAIN }}"
          keycloak:
            enable: true
            log_level: "INFO"
            replicas: 1
            enable_logical_backup: false
            theme: "keycloak"
            password_policy:
              length: 12
              digits: 1
              lowerCase: 1
              upperCase: 1
              specialChars: 1
              notUsername: true
              forceExpiredPasswordChange: false
              passwordHistory: 5
          apisix:
            enable: true
            dashboard:
              enable: false
              jwt_secret: "***"
              admin:
                username: "admin@{{ DOMAIN }}"
                password: "***"
            api_credentials:
              admin_role: "***"
              viewer_role: "***"
          service_portal:
            enable: true
            certs:
              enable: false
            oidc:
              enable: false

        inv_cm:             # Context Management (Frost)
          frost:
            enable: true
            mqtt:
              enable: false
              session_affinity: "None"
          quantumleap:
            enable: false
          stellio:
            enable: false

        inv_da:             # Dashboards (Superset)
          superset:
            enable: true
            mapbox_api_token: "TODO_PLEASE_SET_A_VALUE"
            db_secret: "***"
            admin_user_name: admin
            admin_user_password: "***"
            redis_auth_password: "***"
          grafana:
            enable: false

        inv_gd:             # Geodata Stack
          enable: true
          gd_components:
            - enable: true
          mapfish:
            enable: false
          geoserver:
            enable: true
            geoserverPassword: "***"
          portal_backend:
            enable: true

        inv_addons:
          import: false
          addons: []

        inv_checks:
          enable: true
          api:
            default_max_retries: 20
          deployment:
            default_max_retries: 30

        inv_email:
          server: mxe92c.netcup.net
          user: admin@data-dna.eu
          password: "***"
          email_from: no-reply@data-dna.eu

        inv_datacatalog:
          piveau:
            enable: false
```

> **Wichtig**: Passwörter wurden vom Wizard auto-generiert (`--set passwords yourself: No`).
> Bei manuellem Setzen wären die Werte in der Inventory-Datei Klartext.
> Der `_patch_ingress_for_external_tls` bleibt erhalten, da das Inventory
> `ingress.http: false` setzt (kein HTTP ohne SSL) – der nginxssl-redirect
> muss dennoch deaktiviert werden, da TLS auf Caddy terminiert wird.

## Abweichungen von der bisherigen Annahme

| Bisherige Annahme (falsch) | Tatsächliche Struktur |
|---|---|
| `domain: ...` (Top-Level) | `all.vars.DOMAIN: "..."` |
| `smtp: { host, port, user, password }` | `all.children.controller.vars.inv_email: { server, user, password, email_from }` |
| `admin: { email }` | `inv_access.platform.admin_email`, `inv_op_stack.pgadmin.default_email` |
| `kubernetes: { namespace, ingressClass }` | `inv_k8s: { config.context, storage_class, ingress, cert_manager, ingress_class }` |
| Einfaches YAML | Ansible-Inventory mit `all → children → controller → vars` |

## Konsequenzen für das Installationsskript

1. **Template-Datei**: `templates/config.yaml.tpl` muss durch
   `templates/inventory.yml.tpl` ersetzt werden (oder umbenannt).
2. **`render_inventory()`** muss alle Platzhalter des Inventars ersetzen,
   insbesondere `{{DOMAIN}}`, `{{ENVIRONMENT}}`, `{{SMTP_HOST}}`,
   `{{SMTP_USER}}`, `{{SMTP_PASS}}`, `{{ADMIN_EMAIL}}`.
3. **Passwörter**: Das Inventory enthält viele Passwort-Felder. Die
   auto-generierten Werte aus dem Wizard sind beim ersten Template-Bau
   zu übernehmen. Bei Bedarf können sie später als Env-Vars externalisiert
   werden.
4. **Komponenten-Auswahl**: Die im Wizard gewählten Komponenten
   (`enable: true/false`) sind als Template-Defaults zu setzen. Eine
   Externalisierung als Env-Vars ist für eine spätere Ausbaustufe
   vorgesehen.
5. **`config.yaml` → `inventory.yml`**: Der Dateiname in
   `render_inventory()` sollte von `civitas_core_config.yaml` auf
   `civitas_core_inventory.yml` geändert werden, da es sich um ein
   Ansible-Inventory handelt.
6. **Schema-Referenz**: Die erste Zeile des Wizard-Outputs enthält einen
   `$schema`-Verweis auf das JSON-Schema des Projekts. Dieser sollte
   im Template erhalten bleiben.
7. **Repository-Arbeitskontext**: Das Inventory wird im Repository-Workspace
   unter `${CC_CLI_REPO_PATH}/cc_cli_inventory.yml` abgelegt. Der Workspace
   wird durch Schritt 2.2 (setup_repo_workspace) bereitgestellt. Das Repository
   liegt unter `/opt/civitas-core-v1`, der Symlink `/opt/civitas-core` zeigt
   auf die aktive Version.
8. **Velero**: Im Template wird `velero.enable: false` als Default gesetzt.
   Das Feld wird nur auf `true` geändert, wenn alle fünf Velero-Felder
   (`access_key`, `bucket`, `region`, `endpoint`, `secret`) als Env-Vars
   gesetzt und nicht leer sind. Die Prüfung erfolgt in `render_inventory()`
   vor dem sed-Schritt. Solange ein Feld fehlt oder den Wert `""` hat,
   bleibt `velero.enable: false` im gerenderten Inventory.
9. **Health-Checks aktiviert**: `inv_checks.enable` ist auf `true`
   gesetzt. Der in `cc_cli exec` integrierte Ansible-Health-Check ruft die
   externen Endpunkte (`https://idm.${DOMAIN}/`) auf. Dank der HAProxy-
   TCP-Passthrough-Architektur terminiert nginx in der VM das TLS selbst
   und routet korrekt zum Ziel-Service (HTTP 200). Der frühere Workaround
   (ssl-redirect=false, tls-Sektion entfernen) entfällt.
   Voraussetzung: Das Root-CA-Cert (Variante C, self-signed-CA) muss im
   certifi-Bundle des venv eingetragen sein (Schritt 1.5d), sonst scheitern
   die HTTPS-Health-Checks mit `CERTIFICATE_VERIFY_FAILED`.
10. **Python-Abhängigkeiten im venv**: Zusätzlich zu `cc-cli` und `ansible`
    werden die Pakete `kubernetes`, `openshift` (für k8s-Ansible-Module) und
    `jmespath` (für `json_query`-Filter in Playbooks) im venv installiert.
11. **Ansible-Collections**: Nach der pip-Installation müssen die benötigten
    Ansible-Collections über `ansible-galaxy collection install` bezogen werden:
    - `kubernetes.core` – Kubernetes-Ansible-Module
    - `community.grafana` – Grafana-Integration
    - `community.mongodb==1.3.2` – MongoDB-Integration
    Ohne diese Collections schlagen Playbooks, die die entsprechenden Module
    verwenden, mit `module not found`-Fehlern fehl.

## Secrets-Management und Admin-Accounts

### Datenbankpasswörter: vollautomatisch via Zalando-Operator

Alle Komponenten (Keycloak, Frost, Stellio, QuantumLeap, Superset, GeoData)
folgen demselben Schema:

1. Zalando Postgres-Operator erstellt einen PostgreSQL-Cluster.
2. Ein Kubernetes-Secret wird automatisch mit `username` und `password` (base64) generiert.
3. Das Ansible-Playbook liest das Secret via `kubernetes.core.k8s_info` und dekodiert es.
4. Die Werte werden per `set_fact` als `COMPONENT_POSTGRES_USERNAME` / `PASSWORD` bereitgestellt.
5. Helm-Values und Deployment-Templates greifen auf diese decodierten Werte zu.

**Kein einziges Datenbankpasswort** wird im Inventory oder in `.env.local`
konfiguriert. Der Zalando-Operator generiert sämtliche DB-Credentials
vollautomatisch. Dies betrifft:

- Keycloak-Datenbank
- Frost-Server-Datenbank
- Superset-Datenbank
- GeoServer-Datenbank
- Grafana-Datenbank
- QuantumLeap-Datenbank (inkl. separatem Superuser-Secret für TimescaleDB)
- Stellio-Datenbank

Diese Passwörter dürfen **nicht** als Umgebungsvariablen externalisiert werden.

### Die drei Admin-Accounts im Inventory

Aus der Analyse der Playbook-Struktur ergeben sich genau drei Accounts,
die im Inventory konfiguriert werden müssen:

| Account | Inventory-Schlüssel | Zweck |
|---|---|---|
| Keycloak Master-Admin | `inv_access.platform.master_username` | Keycloak-Admin-UI + API während des Deployments |
| | `inv_access.platform.master_password` | |
| Platform-Admin (IAM) | `inv_access.platform.admin_email` | Erster Realm-User in Keycloak (Template `platform_admin.json`); |
| | `inv_access.platform.admin_first_name` | wird auch als pgAdmin-Login verwendet |
| | `inv_access.platform.admin_surname` | |
| Tenant-Admin | `inv_access.tenant.tenant_email` | Tenant-Verwaltung im Realm; OIDC-Login |
| | `inv_access.tenant.tenant_username` | |
| | `inv_access.tenant.tenant_password` | |

### Keycloak Master-Admin + Platform-Admin: Ein gemeinsamer Wert

Die Recherche in den Ansible-Playbooks ergibt einen durchgehenden Flow ohne
zweites Inventory-Feld:

```
Inventory                           → K8S-Secret                  → Ansible-Fact
inv_access.platform.master_username  ──b64encode──→ MASTER_USERNAME ──b64decode──→ ADMIN_USERNAME
inv_access.platform.master_password  ──b64encode──→ MASTER_PASSWORD ──b64decode──→ ADMIN_PASSWORD
```

`ADMIN_PASSWORD` erfüllt beide Rollen:

1. **API-Login** bei der Keycloak Admin-REST-API (setup\_keycloak\_tenant.yml, Zeile 21-23)
2. **Initiales Passwort** des platform\_admin-Realm-Users (keycloak\_8\_users.yml, Zeile 163-166)

Es existiert **kein separates Inventory-Feld** `admin_password`. Wird im Inventory
`inv_access.platform.master_password` gesetzt, ist dieser Wert automatisch auch
das initiale Passwort des platform\_admin-Users. Eine abweichende Konfiguration
ist nicht vorgesehen.

### pgAdmin-Login-Mechanismus

Der pgAdmin-Admin-Account wird **nicht** separat konfiguriert. Das Playbook
`tasks/operation/pgadmin.yml` setzt:

```yaml
pgadmin_admin_email: >-
  {{ inv_access.tenant.tenant_email if configure_central_idm | default(false)
     else inv_access.platform.admin_email }}
```

pgAdmin verwendet also denselben Account wie der Platform-Admin
(`inv_access.platform.admin_email`). Ein separater Wert ist nicht erforderlich.

### Keycloak-Master-Secret in Kubernetes

Frost und Superset lesen das Keycloak-Master-Credentials-Secret aus Kubernetes:

```yaml
inv_access.platform.k8s_secret_name: "{{ ENVIRONMENT }}-keycloak-admin"
```

Dieses Secret wird vom Keycloak-Playbook während Phase 2 angelegt und enthält
`MASTER_USERNAME` und `MASTER_PASSWORD` (base64). Voraussetzung: die Felder
`master_username` und `master_password` im Inventory müssen korrekt gesetzt sein.

### Konsequenzen für `.env.local` und `render_inventory()`

Die `.env.local`-Datei benötigt exakt diese Passwort-Variablen (keine weiteren):

```bash
export ADMIN_EMAIL="admin@scanea.eu"
# → inv_access.platform.master_username (auch admin_email im platform_admin-User)
export ADMIN_PASS="..."
# → inv_access.platform.master_password (auch initiales platform_admin-Passwort, identisch!)
export TENANT_ADMIN_PASS="..."
# → inv_access.tenant.tenant_password (separat, nur bei configure_central_idm aktiv)
```

**Passwort-Policy für ADMIN_PASS**: Das Passwort muss die Keycloak-Policy
erfüllen, die im Inventory konfiguriert ist:
- Mindestens 12 Zeichen
- Mindestens 1 Ziffer
- Mindestens 1 Großbuchstabe
- Mindestens 1 Kleinbuchstabe
- Mindestens 1 Sonderzeichen

**Hinweis zu TENANT_ADMIN_PASS**: Der Tenant-Admin wird nur angelegt, wenn
der Keycloak-Flow mit `--tags tenant` läuft (`configure_central_idm: true`).
Die Inventory-Felder (`tenant_email`, `tenant_username`, `tenant_password`)
sollten trotzdem immer gesetzt sein, da das Playbook sie beim Einlesen des
Inventars erwartet.

Alle anderen Passwörter (APISIX, Superset, Grafana, GeoServer, Piveau,
Redis) werden in `render_inventory()` automatisch via `gen_policy_password()`
generiert. Sie sind flüchtig: das Inventory wird nach `cc_cli exec` gelöscht.

**Wichtig:** Es gibt **keinen separaten Platzhalter** für das Passwort des
platform\_admin-Users. `master_password` übernimmt beide Rollen, daher
erscheint `${ADMIN_PASS}` im Inventory-Template nur einmal (an der Stelle
von `master_password`). Die frühere Annahme eines zweiten Platzhalters
`PLACEHOLDER_KC_ADMIN_PASS` war falsch und wurde entfernt.

**Mapping der Platzhalter in `render_inventory()`:**

| Platzhalter | Env-Var / Quelle | Zweck |
|---|---|---|
| `PLACEHOLDER_DOMAIN` | `${DOMAIN}` | Basis-Domain |
| `PLACEHOLDER_ENVIRONMENT` | `${CC_ENVIRONMENT}` | Environment-Name |
| `PLACEHOLDER_ADMIN_EMAIL` | `${ADMIN_EMAIL}` | Platform-Admin-E-Mail (= master_username) |
| `PLACEHOLDER_KC_MASTER_PASS` | `${ADMIN_PASS}` | Keycloak-Master-Password (auch platform\_admin-Passwort) |
| `PLACEHOLDER_TENANT_PASS` | `${TENANT_ADMIN_PASS}` | Tenant-Admin-Passwort (separat) |
| `PLACEHOLDER_SMTP_PORT` | `${SMTP_PORT:-587}` | SMTP-Port (Standard 587) |
| Alle weiteren | `gen_policy_password()` | Auto-generiert, flüchtig |

## Festlegungen

1. Das Installationsskript verwendet ein Template im Ansible-Inventory-Format.
2. Der Dateiname lautet `inventory.yml.tpl` (bzw. im Skript `templates/inventory.yml.tpl`).
3. Die Funktion `render_inventory()` erzeugt die Inventory-Datei unter
   `${CC_CLI_REPO_PATH}/cc_cli_inventory.yml` (im Repository-Workspace,
   nicht in `/tmp`).
4. Alle Secrets werden durch Platzhalter ersetzt, die über Env-Vars befüllt werden.
5. Die Komponenten-Auswahl (enable/disable) wird zunächst als Template-Default
   gesetzt. Eine spätere Externalisierung über Env-Vars ist möglich.
6. Der Dateiname `cc_cli_inventory.yml` ist verbindlich – `cc_cli` sucht
   diese Datei im Arbeitsverzeichnis.
7. Das Inventory ist ohne den Repository-Kontext (Playbooks, Schema)
   nicht ausführbar. Der Kontext wird durch Schritt 2.2 (Repository-Klon
   nach `/opt/civitas-core-v1`) bereitgestellt.