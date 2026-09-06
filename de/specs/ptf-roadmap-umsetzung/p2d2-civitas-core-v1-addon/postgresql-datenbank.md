---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – PostgreSQL-Datenbank"
description: Vollständige Spezifikation der PostgreSQL-Bereitstellung des p2d2-AddOns – additive preparedDatabases-Bereitstellung, fünf Staging-Schemata, Tabellen-/Enum-/Rollenstruktur und Zwei-Phasen-Provisioning im bestehenden Zalando-central-db-Cluster
quality:
  completeness: 60
  accuracy: 60
  reviewed: false
  reviewer:
  reviewDate:
---

# PostgreSQL-Datenbank

Diese Seite konkretisiert Phase 1 der Implementierungs-Roadmap und schließt die Architekturentscheidung „PostgreSQL" ab. Sie spezifiziert vollständig, wie p2d2 seine Datenbank, Schemata, Tabellen und Rollen auf einer kompatiblen CIVITAS/CORE-V1-Plattform erhält.

## Zweck

Die Seite dokumentiert die **getroffene** PostgreSQL-Entscheidung (additiver `preparedDatabases.p2d2`-Eintrag im bestehenden Zalando-`central-db`-Cluster) und legt die **vollständige Zielstruktur** fest: fünf Staging-Schemata, Tabellen/Enums/Sequences/Views/Funktionen, Rollen-/Grant-Matrix sowie den Zwei-Phasen-Provisioning-Ablauf. Sie ist die verbindliche Grundlage für die Implementierung (Ansible-Tasks + SQL-Templates im AddOn-Repo).

## Empirischer und quellcode-basierter Befund

- `central-db` ist ein einzelner Zalando-`postgresql`-CR (`acid.zalan.do/v1`), **nicht** Helm-verwaltet.
- Bestehende Komponenten werden über das Zalando-Feature `spec.preparedDatabases` abgebildet (Datenbank + automatische Owner/Reader/Writer-Rollen + Extensions, z. B. `postgis`).
- Die Patch-Semantik ist **additiv** (JSON Merge Patch, RFC 7386): Die CR wird per `kubernetes.core.k8s` mit `state: present` und Standard-`merge_type` angewendet; unbekannte Einträge der Live-CR bleiben erhalten.
- CIVITAS/CORE selbst nutzt bereits ein Erweiterungsmuster, das zusätzliche Datenbanken in denselben `central-db`-CR merged (gesteuert über eine Inventory-Liste analog zu `additionalDatabases`).
- Die Referenzstruktur wurde aus dem `pg_dump --schema-only`-Stand verifiziert (Schemata `p2d2_de1/de2/develop/fv/main`).

Hinweis: Die internen Pfade und Dateinamen werden hier bewusst nur generisch benannt; die konkrete Mechanik stammt aus der lokalen Referenzkopie des CIVITAS/CORE-V1-Installationscodes.

## Entscheidung

p2d2 übernimmt das bestehende `additional_databases`-Muster: ein **eigener Task + ein eigenes Template** (keine Änderung der Core-Dateien), der ausschließlich `preparedDatabases.p2d2` rendert und additiv in denselben `central-db`-CR merged.

Zusätzlich getroffen:

- Die Objekt-Struktur (Tabellen/Enums/Sequences/Views/Funktionen) wird **1:1** aus dem verifizierten Stand übernommen, inklusive der Funktion `fn_container_mitversionen()` und des Triggers `trg_container_mitversionen` (aus `p2d2_de1` übernommen, da gewollt).
- Der Objekt-**Owner** wird **einheitlich parametrisiert** (`{{ p2d2_admin_role }}`) statt der im Original gemischten `P2D2-Admin`/`P2D2-Admin-Role`.
- **Ausgeschlossen** werden `gt_pk_metadata` (entsteht automatisch durch GeoServer) und Altlasten wie `rheinkassel_gf` sowie die `P2D2-User-DE1 → p2d2_main`-Anomalie.

## Technisches Vorgehen (Beschreibung, keine fertige Implementierung)

- `preparedDatabases.p2d2` mit:
  - `defaultUsers: true`
  - `extensions: {postgis: public}`
  - `schemas: {public: {defaultRoles: false}}`
- Anwendung per `kubernetes.core.k8s` mit `state: present`, **ohne** `force`/`replace` (Standard-Merge-Verhalten).
- Die eigentliche Struktur (Schemata, Tabellen, Rollen) wird nachgelagert per SQL/Ansible angelegt (Abschnitt „Provisioning in zwei Phasen").

## Schemata

Fünf Schemata, **identisch strukturiert** und **1:1 zu den fünf Entwicklungs-Stagings (Branches)** — nicht als Kommune-/Themen-Trennung:

- `p2d2_de1`, `p2d2_de2`, `p2d2_develop`, `p2d2_fv`, `p2d2_main`

Parametrisiert als `{{ p2d2_instance_schema }}` (ein Wert je Staging/Branch). Jedes Schema enthält im Original **alle** Kommunen und Kategorien; es gibt keine Single-Tenant- und keine Kommune-Einschränkung auf DB-Ebene.

## Objektstruktur je Schema

### Tabellen (14)

| Tabelle | Zweck |
|---|---|
| `p2d2_kommunen` | Kommunen-Stammdaten |
| `p2d2_containers` | Container-Geometrien (Kommune-/Friedhofsgrenzen), inkl. OSM-/WFS-Cache-Feldern |
| `p2d2_graeber` | aktuelle Graeber-Geometrien (PK `p2d2_uuid`) |
| `p2d2_grabflure` | aktuelle Grabflur-Geometrien (PK `p2d2_uuid`) |
| `p2d2_graeber_snapshots` | Rohdaten-Snapshots je Editier-Session (inkl. `commands` jsonb) |
| `p2d2_grabflure_snapshots` | Rohdaten-Snapshots je Editier-Session (inkl. `commands` jsonb) |
| `p2d2_graeber_versionen` | Versionshistorie Graeber (`session_id`-FK auf `wf_sessions`) |
| `p2d2_grabflure_versionen` | Versionshistorie Grabfluren (`session_id`-FK auf `wf_sessions`) |
| `p2d2_grabflur_mapping` | Zuordnung Grabflur ↔ Grab (`grab_id`-FK auf `p2d2_graeber`) |
| `wf_sessions` | Editier-Session (`state`-Enum, `expires_at`) |
| `wf_snapshots` | Snapshot je Session |
| `wf_feature_status` | Workflow-Status je Feature (QS1/QS2/Export) |
| `wf_qs_maengel` | QS-Mängelmeldungen |
| `wf_protokoll` | Ereignisprotokoll |

### Enum-Typen (6, mit Werten)

| Enum | Werte |
|---|---|
| `wf_event_type` | session_start, session_pause, session_resume, session_end, session_expire, session_abort, feature_edit, feature_save, snapshot_create, qs1_pass, qs1_fail, qs2_pass, qs2_fail, export_osm |
| `wf_feature_state` | unbearbeitet, in_bearbeitung, qs1_ausstehend, qs1_abgelehnt, qs2_ausstehend, qs2_abgelehnt, exportbereit, exportiert |
| `wf_session_state` | active, paused, completed, expired, aborted |
| `wf_snapshot_kind` | auto, manual, session_boundary, pre_qs, post_qs, export |
| `wf_qs_level` | qs1, qs2 |
| `wf_qs_result` | pass, fail, warning |

### Sequences (7)

`p2d2_kommunen_id_seq`, `p2d2_grabflur_mapping_id_seq`, `wf_feature_status_id_seq`, `wf_protokoll_id_seq`, `wf_qs_maengel_id_seq`, `wf_sessions_id_seq`, `wf_snapshots_id_seq`.

### Views (2)

- `v_graeber_aktuell` — kombiniert Basistabelle + neueste Version + Workflow-Status.
- `v_grabflure_aktuell` — kombiniert Basistabelle + neueste Version + Workflow-Status.

Hinweis: Die Views referenzieren `public.geometry` (PostGIS) → die PostGIS-Extension muss in `public` liegen (durch `extensions: {postgis: public}` gegeben).

### Funktionen (2) und Trigger

- `aggregate_session_snapshots`
- `on_version_delete`
- `fn_container_mitversionen()` + Trigger `trg_container_mitversionen` (automatische Container-Versionierung, **übernommen**).

## Rollen und Berechtigungen

Drei Rollentypen, Owner **einheitlich parametrisiert**:

| Rolle | Umfang | Grants |
|---|---|---|
| Owner-Rolle | nur eigenes Schema | `SELECT,INSERT,UPDATE,DELETE` auf `{{ p2d2_instance_schema }}` |
| RO-Rolle | alle fünf Schemata (Staging-Vergleich/Reporting) | `SELECT` auf alle fünf Schemata |
| Admin-Rolle | voller CRUD überall | `ALL` (inkl. `TRUNCATE`,`REFERENCES`,`TRIGGER`) |

Zusätzlich je Rolle `ALTER DEFAULT PRIVILEGES`, damit künftige Objekte automatisch korrekt berechtigt sind. Die RO-Rolle ist **kein** Kommune-Zugriffsmechanismus.

## Provisioning in zwei Phasen

### Phase 1 — Objekt-Anlage (idempotent)

Reihenfolge: Rollen anlegen → Schema anlegen → DDL anwenden → Grants setzen → Seed.

1. Rollen anlegen (Loop über `p2d2_roles`, `postgresql_role`, `no_password_changes: yes`).
2. Schema anlegen (`postgresql_schema`).
3. DDL anwenden (`postgresql_exec` mit Jinja2-SQL-Template).
4. Grants (`postgresql_privs`, typspezifisch) + `ALTER DEFAULT PRIVILEGES`.
5. Seed `p2d2_kommunen` (idempotent; konkrete Werte im Datenimport-Turn, nicht hier).

### Phase 2 — Passwort-Rotation (separat, wiederholbar)

1. Echte Passwörter aus Secret/Environment lesen.
2. `ALTER ROLE … PASSWORD` (bzw. `postgresql_role` mit echtem Passwort).

### Templating-Regeln

- Schema-Präfix überall: `p2d2_develop` → `{{ p2d2_instance_schema }}`.
- **Enum:** idempotent per `DO $$ … IF NOT EXISTS … CREATE TYPE … AS ENUM (…) … $$` (mit den echten Wertelisten oben).
- **Sequence + Tabelle:** explizite `CREATE SEQUENCE IF NOT EXISTS` + `CREATE TABLE IF NOT EXISTS … id integer NOT NULL DEFAULT nextval('{{ p2d2_instance_schema }}.<seq>'::regclass) …` + `ALTER SEQUENCE … OWNED BY …` (keine `IDENTITY`-Spalten — originaltreu).
- **Constraints/Indexe** aus dem Dump übernehmen, Schema-Präfix ersetzen.
- **View/Funktion:** `CREATE OR REPLACE VIEW/FUNCTION`.
- **Ansible-Rollen:** Loop für Rollen-Anlage, typspezifische Grant-Tasks.

## Restrisiko

Die additive Sicherheit gilt **nur**, solange `kubernetes.core.k8s` mit Standard-`merge_type` (kein `force: true`, kein `merge_type: replace`) aufgerufen wird. Vor der Implementierung ist dies gegen die konkret installierte `kubernetes.core`-Collection-Version erneut zu prüfen.

Bekannte Grenze: `CREATE TABLE IF NOT EXISTS` deckt **keine Schema-Evolution** (neue Spalten) ab. Das wird als bekannte Grenze dieses Wurfs akzeptiert und ist als offener Punkt für einen späteren Migrationsmechanismus vorgemerkt.

## Abgrenzung

Diese Seite spezifiziert die **Datenbank-/Struktur-Bereitstellung**. **Nicht** Gegenstand sind:

- der **Datenimport** (14 Kommunen, `p2d2_containers`-Polygone, Köln mit 3 Friedhöfen/Grabfluren/Gräbern) — folgt als separater, eigener Schritt nach Bereinigung der `p2d2_containers`-Dupletten und Debugging der fehlerhaften Graeber-Datensätze, über lesbare `INSERT`-Exporte;
- der detaillierte **Rückbau** (folgt als eigener Schritt; ein gezielter Task, der den `p2d2`-Eintrag wieder aus `preparedDatabases` entfernt, wird als Vermerk festgehalten);
- die konkrete **Ansible-/SQL-Implementierung** (folgt nach Freigabe dieser Spezifikation).

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Standalone-Prinzip, eigene Bausteine und Architekturentscheidungen
- [Repository-Struktur und Aktivierung](./repo-struktur-und-aktivierung) – geplante Git-Repository-Struktur und V1-Aktivierung

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-06 | Erste Fassung: PostgreSQL-Entscheidung (additiver `preparedDatabases.p2d2`-Eintrag in `central-db`). |
| 1.1 | 2026-09-06 | Vollständige Spezifikation ergänzt: fünf Schemata, Tabellen/Enums/Sequences/Views/Funktionen, Rollen-/Grant-Matrix und Zwei-Phasen-Provisioning. |
