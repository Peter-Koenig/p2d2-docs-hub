---
title: cc-cli-Inventar — Ansible-Inventory für CIVITAS/CORE
description: Dokumentation des per Wizard erzeugten cc_cli_inventory.yml, seiner Struktur und der daraus abgeleiteten Template-Vorlage für die automatisierte Installation.
status: draft
lastUpdated: 2026-06-21
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-cc-cli-inventar
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-installationsphasen-und-abnahme
  - civitas-core-plugin-serveraufbau-skriptarchitektur
quality:
  completeness: 80
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
`_render_config_yaml()`-Funktion in `modules/06_civitas.sh`.

## Hintergrund

Das Inventory wird vom `cc_cli wizard` erzeugt. Die Befragung ist interaktiv.
Für die automatisierte Installation stellen wir ein vorbereitetes Template
bereit, dessen Platzhalter durch `_render_config_yaml()` ersetzt werden.

Das Inventory ist kein einfaches YAML, sondern ein **Ansible-Inventory** mit
der Standardstruktur `all → vars → children → controller → hosts → vars`.

## Wizard-Fragen und Antworten

| Frage | Antwort |
|---|---|
| Wizard mode | `expert` |
| Deployment target | `remote production deployment` |
| Domain | `udp.data-dna.eu` |
| Environment name | `cc-prd` |
| Kubernetes context | `k3s` |
| Ingress controller class | `nginx` |
| Storage class (RWO/RWX/LOC) | `local-path` |
| Cert-Manager-Issuer-Name | `selfsigned-issuer` |
| CA certificate path | (leer) |
| Ansible health checks | `Yes` |
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
            context: "k3s"
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
2. **`_render_config_yaml()`** muss alle Platzhalter des Inventars ersetzen,
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
   `_render_config_yaml()` sollte von `civitas_core_config.yaml` auf
   `civitas_core_inventory.yml` geändert werden, da es sich um ein
   Ansible-Inventory handelt.
6. **Schema-Referenz**: Die erste Zeile des Wizard-Outputs enthält einen
   `$schema`-Verweis auf das JSON-Schema des Projekts. Dieser sollte
   im Template erhalten bleiben.

## Festlegungen

1. Das Installationsskript verwendet ein Template im Ansible-Inventory-Format.
2. Der Dateiname lautet `inventory.yml.tpl` (bzw. im Skript `templates/inventory.yml.tpl`).
3. Die `_render_config_yaml()`-Funktion erzeugt daraus `/tmp/civitas_core_inventory.yml`.
4. Alle Secrets werden durch Platzhalter ersetzt, die über Env-Vars befüllt werden.
5. Die Komponenten-Auswahl (enable/disable) wird zunächst als Template-Default
   gesetzt. Eine spätere Externalisierung über Env-Vars ist möglich.