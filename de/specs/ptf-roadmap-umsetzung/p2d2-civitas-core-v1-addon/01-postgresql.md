---
title: "p2d2-AddOn – PostgreSQL (01)"
description: Vollständige, nachbaubare Dokumentation der p2d2-AddOn-PostgreSQL-Komponente – preparedDatabases.p2d2, Rollenmodell, DDL (Schema/14 Tabellen/2 Views/…), GRANT/Default-Privileges, pg_hba und bekannte Fallstricke
quality:
  completeness: 85
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# 01 – PostgreSQL

Modul `addon_00_postgresql.sh`, Funktionen `install_addon_postgresql` und `uninstall_addon_postgresql`.

## Was das Skript tut (Schritt für Schritt)

Das Modul arbeitet gegen die **zentrale, geteilte PostgreSQL-Instanz** `central-db` (Zalando Postgres Operator) im DB-Namespace (`ADDON_DB_NS`, Default `cc-prd-database-stack`).
Die Datenbank `p2d2` wird als bereits vorhanden vorausgesetzt (siehe „Manuelle Installation" — `preparedDatabases.p2d2`).

1. **Superuser-Credentials lesen** — aus dem Zalando-Secret `postgres.central-db.credentials.postgresql.acid.zalan.do` (Keys `username`/`password`) im DB-Namespace.
2. **Je Stage (`MAIN`, `DEVELOP`, `DE1`, `DE2`, `FV`)** werden per `kubectl exec central-db-0 -- psql` angelegt:
   - eine **Login-Rolle** `P2D2-<STAGE>` und
   - ein **Schema** `p2d2_<stage>` mit `AUTHORIZATION` auf die Rolle.
3. **Rückbau:** in umgekehrter Reihenfolge (`FV → DE2 → DE1 → DEVELOP → MAIN`) werden Schema (`DROP SCHEMA … CASCADE`) und Rolle (`DROP ROLE`) entfernt.

> **Wichtiger Hinweis zur Diskrepanz:** Dieses Modul ist **rudimentär** und legt nur Schema + eine einzelne Login-Rolle je Stage an (DDL/Grants als `TODO`). Das
> **tatsächlich verifizierte** Rollenmodell der manuellen Installation (Abschnitt „Manuelle Installation") ist **feiner**: es nutzt NOLOGIN-Gruppenrollen
> (`P2D2-Admin-Role`, `P2D2-RO-Role`, `P2D2-User-<BRANCH>`), denen die Login-Rollen angehören, und legt die Schemata im Besitz von `P2D2-Admin-Role` an. Das Skript
> (`addon_00_postgresql.sh`) bildet dieses Modell **noch nicht** ab — die Namens-/Struktur-Abweichung ist im Skript als `TODO` vermerkt.

## Ausgangslage (vorausgesetzt)

- `central-db` (Zalando Operator) läuft im DB-Namespace; die Datenbank `p2d2` und das Superuser-Secret sind vorhanden.
- Die Basisplattform stellt `p2d2` als additiven `preparedDatabases`-Eintrag mit `extensions: postgis` bereit (siehe „Manuelle Installation").

## Zielergebnis

Datenbank `p2d2` mit PostGIS, den Zalando-Auto-Rollen, fünf Schemata (`p2d2_main`, `p2d2_develop`, `p2d2_de1`, `p2d2_de2`, `p2d2_fv`), dem App-Rollenmodell und der
vollständigen Objektstruktur (je Schema 14 Tabellen / 7 Sequenzen / 2 Views / 3 Funktionen / 2 Trigger) inkl. Grants und Default-Privileges.

---

## Manuelle Installation / Troubleshooting (verifizierter Ist-Zustand)

### 1. `preparedDatabases.p2d2` (Extension-Setup / PostGIS)

Die Datenbank `p2d2` wird als additiver Eintrag im bestehenden `central-db`-CR (Zalando `postgresql`, `apiVersion: acid.zalan.do/v1`) ergänzt — **rein additiv** per
JSON Merge Patch (RFC 7386), kein `--force`/`replace`:

```bash
kubectl -n cc-prd-database-stack patch postgresql central-db \
  --type merge \
  -p '{"spec":{"preparedDatabases":{"p2d2":{"defaultUsers":true,"extensions":{"postgis":"public"},"schemas":{"public":{"defaultRoles":false}}}}}}'
```

Der Ziel-Block ist 1:1 analog zu den bestehenden Einträgen `frost`/`geodata`:

```yaml
preparedDatabases:
  p2d2:
    defaultUsers: true
    extensions:
      postgis: public
    schemas:
      public:
        defaultRoles: false
```

**Effekt des Operators** (`defaultUsers: true`): Es werden automatisch die Rollen `p2d2_owner[_user]`, `p2d2_reader[_user]`, `p2d2_writer[_user]` sowie die zugehörigen
Credential-Secrets (`p2d2-owner-user.central-db.credentials.postgresql.acid.zalan.do` usw.) angelegt und PostGIS im Schema `public` aktiviert.

### 2. Rollenmodell (SQL, einmalig + je Branch)

**Gemeinsame Rollen (einmalig):**

```sql
CREATE ROLE "P2D2-Admin-Role" NOLOGIN;
CREATE ROLE "P2D2-Admin" LOGIN PASSWORD 'changeme-admin' IN ROLE "P2D2-Admin-Role";
ALTER ROLE "P2D2-Admin" SET search_path = p2d2_main, public;
CREATE ROLE "P2D2-RO-Role" NOLOGIN;
CREATE ROLE "P2D2-RO" LOGIN PASSWORD 'changeme-ro' IN ROLE "P2D2-RO-Role";
```

**Je Branch (`DE1`, `DE2`, `DEVELOP`, `FV`, `MAIN`) — Rollen + Schema:**

```sql
CREATE ROLE "P2D2-User-<BRANCH>" NOLOGIN;
CREATE ROLE "P2D2-<BRANCH>" LOGIN PASSWORD 'changeme-<branch>' IN ROLE "P2D2-User-<BRANCH>";
ALTER ROLE "P2D2-<BRANCH>" SET search_path = p2d2_<branch>, public;
CREATE SCHEMA p2d2_<branch> AUTHORIZATION "P2D2-Admin-Role";
```

| Branch | Login-Rolle | NOLOGIN-Gruppe | Schema | search_path |
|---|---|---|---|---|
| MAIN | `P2D2-MAIN` | `P2D2-User-MAIN` | `p2d2_main` | `p2d2_main, public` |
| DEVELOP | `P2D2-DEVELOP` | `P2D2-User-DEVELOP` | `p2d2_develop` | `p2d2_develop, public` |
| DE1 | `P2D2-DE1` | `P2D2-User-DE1` | `p2d2_de1` | `p2d2_de1, public` |
| DE2 | `P2D2-DE2` | `P2D2-User-DE2` | `p2d2_de2` | `p2d2_de2, public` |
| FV | `P2D2-FV` | `P2D2-User-FV` | `p2d2_fv` | `p2d2_fv, public` |

### 3. DDL je Schema

Die Objektstruktur wird aus dem Template `p2d2-civitas-addon/v1/templates/p2d2-postgresql/schema.sql.j2` je Schema angewendet (Platzhalter `{{ p2d2_instance_schema }}` →
`p2d2_<branch>`, `{{ p2d2_admin_role }}` → `P2D2-Admin-Role`):

```bash
sed -e 's/{{ p2d2_instance_schema }}/p2d2_de1/g' -e 's/{{ p2d2_admin_role }}/P2D2-Admin-Role/g' \
  p2d2-civitas-addon/v1/templates/p2d2-postgresql/schema.sql.j2 \
  | kubectl -n cc-prd-database-stack exec -i central-db-0 -c postgres -- psql -U postgres -d p2d2 -v ON_ERROR_STOP=1
```

Das Template ist **idempotent** (jedes Objekt in `DO $$ … IF NOT EXISTS`-Blöcken) und erzeugt **je Schema**:

- **6 ENUM-Typen:** `wf_event_type`, `wf_feature_state`, `wf_qs_level`, `wf_qs_result`, `wf_session_state`, `wf_snapshot_kind`.
- **14 Tabellen:** `p2d2_containers`, `p2d2_grabflur_mapping`, `p2d2_grabflure`, `p2d2_grabflure_snapshots`, `p2d2_grabflure_versionen`, `p2d2_graeber`,
  `p2d2_graeber_snapshots`, `p2d2_graeber_versionen`, `p2d2_kommunen`, `wf_feature_status`, `wf_protokoll`, `wf_qs_maengel`, `wf_sessions`, `wf_snapshots`.
- **7 Sequenzen:** `p2d2_grabflur_mapping_id_seq`, `p2d2_kommunen_id_seq`, `wf_feature_status_id_seq`, `wf_protokoll_id_seq`, `wf_qs_maengel_id_seq`,
  `wf_sessions_id_seq`, `wf_snapshots_id_seq`.
- **2 Views:** `v_grabflure_aktuell`, `v_graeber_aktuell` (Grundlage der GeoServer-FeatureTypes).
- **3 Funktionen:** `aggregate_session_snapshots(bigint)`, `on_version_delete()`, `fn_container_mitversionen()`.
- **2 Trigger:** `trg_version_delete`, `trg_container_mitversionen` (beide auf `p2d2_grabflure_versionen`).

Auszug wesentlicher Spaltendefinitionen (vollständig in `schema.sql.j2`):

```sql
CREATE TABLE IF NOT EXISTS {{ p2d2_instance_schema }}.p2d2_kommunen (
    id integer NOT NULL,
    wp_name character varying(50) NOT NULL,
    -- …
);

CREATE TABLE IF NOT EXISTS {{ p2d2_instance_schema }}.p2d2_graeber (
    geom public.geometry(MultiPolygon,4326),
    id_intern integer,
    -- …
);

CREATE TABLE IF NOT EXISTS {{ p2d2_instance_schema }}.p2d2_grabflure (
    p2d2_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    geom public.geometry(MultiPolygon,4326),
    -- …
);
```

### 4. Berechtigungen (GRANT + ALTER DEFAULT PRIVILEGES) je Schema

```sql
GRANT USAGE ON SCHEMA p2d2_<branch> TO "P2D2-User-<BRANCH>";
GRANT USAGE ON SCHEMA p2d2_<branch> TO "P2D2-RO-Role";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA p2d2_<branch> TO "P2D2-User-<BRANCH>";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA p2d2_<branch> TO "P2D2-User-<BRANCH>";
GRANT SELECT ON ALL TABLES IN SCHEMA p2d2_<branch> TO "P2D2-RO-Role";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA p2d2_<branch> TO "P2D2-Admin-Role";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA p2d2_<branch> TO "P2D2-Admin-Role";

ALTER DEFAULT PRIVILEGES FOR ROLE "P2D2-Admin-Role" IN SCHEMA p2d2_<branch>
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "P2D2-User-<BRANCH>";
ALTER DEFAULT PRIVILEGES FOR ROLE "P2D2-Admin-Role" IN SCHEMA p2d2_<branch>
  GRANT USAGE, SELECT ON SEQUENCES TO "P2D2-User-<BRANCH>";
ALTER DEFAULT PRIVILEGES FOR ROLE "P2D2-Admin-Role" IN SCHEMA p2d2_<branch>
  GRANT SELECT ON TABLES TO "P2D2-RO-Role";
ALTER DEFAULT PRIVILEGES FOR ROLE "P2D2-Admin-Role" IN SCHEMA p2d2_<branch>
  GRANT ALL PRIVILEGES ON TABLES TO "P2D2-Admin-Role";
ALTER DEFAULT PRIVILEGES FOR ROLE "P2D2-Admin-Role" IN SCHEMA p2d2_<branch>
  GRANT USAGE, SELECT ON SEQUENCES TO "P2D2-Admin-Role";
```

Verifiziertes Endzustand-Grant-Muster (je Schema): `P2D2-Admin-Role` = ALLE Privilegien, `P2D2-User-<BRANCH>` = SELECT/INSERT/UPDATE/DELETE, `P2D2-RO-Role` = SELECT.

### 5. pg_hba.conf

Vollständiger `pg_hba`-Block aus dem laufenden Patroni-CR (`kubectl -n cc-prd-database-stack get postgresql central-db -o jsonpath='{.spec.patroni.pg_hba}'`):

```text
local     all           all                     trust
hostnossl quantumleap   all       all           md5
hostssl   all           +zalandos 127.0.0.1/32  pam
host      all           all       127.0.0.1/32  md5
hostssl   all           +zalandos ::1/128       pam
host      all           all       ::1/128       md5
hostssl   replication   standby   all           md5
local     replication   standby                 md5
hostnossl all           all       10.0.0.0/8    md5
hostnossl all           all       10.0.0.0/8    pam
hostssl   all           +zalandos all           pam
hostssl   all           all       all           md5
```

### 6. Verifikation (Gegentests, reale Ergebnisse)

```sql
-- Struktur je Schema (erwartet: 14 Tabellen / 7 Sequenzen / 2 Views / 3 Funktionen / 2 Trigger)
SELECT schemaname, count(*) FROM pg_tables
WHERE schemaname IN ('p2d2_main','p2d2_develop','p2d2_de1','p2d2_de2','p2d2_fv') GROUP BY schemaname;

-- Schreib-Positivtest (eigenes Schema, ROLLBACK):
BEGIN; SET ROLE "P2D2-DE1";
INSERT INTO p2d2_de1.p2d2_kommunen (wp_name, name) VALUES ('TEST_DE1','Test-Kommune DE1');
ROLLBACK; RESET ROLE;

-- Cross-Schema-Negativtest (muss scheitern — Schema-USAGE verweigert):
SET ROLE "P2D2-DE1"; SELECT * FROM p2d2_main.p2d2_kommunen;  -- ERROR: permission denied for schema p2d2_main

-- RO-Lesetest über alle Schemata:
SET ROLE "P2D2-RO"; SELECT count(*) FROM p2d2_de1.p2d2_kommunen; SELECT count(*) FROM p2d2_main.p2d2_kommunen; RESET ROLE;
```

### 7. Rückbau (symmetrisch, destruktiv)

```bash
# p2d2-Eintrag aus preparedDatabases entfernen (JSON Merge Patch mit null):
kubectl -n cc-prd-database-stack patch postgresql central-db --type merge -p '{"spec":{"preparedDatabases":{"p2d2":null}}}'
```

> **Offene Frage (destruktiv):** Ob der Operator nach dem Entfernen des Eintrags die Datenbank `p2d2` samt Rollen/Secrets tatsächlich löscht, ist aus dem lokalen Code nicht
> belegbar und gegen die installierte Operator-Version zu verifizieren. Das Löschen ist **destruktiv** — vorher `pg_dump` der Datenbank `p2d2`.

### 8. Abgleich Standalone vs. AddOn (Live-Befund, 2026-09-27)

**Befehle (zur Wiederholbarkeit):**

```bash
KUBECONFIG=/home/pkoenig/.kube/p2d2-addon-installer.kubeconfig kubectl -n cc-prd-database-stack exec central-db-0 -c postgres -- psql -U postgres -d p2d2 -tAc "SELECT n.nspname, (SELECT count(*) FROM pg_tables t WHERE t.schemaname=n.nspname), (SELECT count(*) FROM pg_views v WHERE v.schemaname=n.nspname), (SELECT count(*) FROM pg_class c WHERE c.relnamespace=n.oid AND c.relkind='S'), (SELECT count(*) FROM pg_type t WHERE t.typnamespace=n.oid AND t.typtype='e'), (SELECT count(*) FROM pg_proc p WHERE p.pronamespace=n.oid), (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace=n.oid AND NOT t.tgisinternal) FROM pg_namespace n WHERE n.nspname IN ('p2d2_main','p2d2_develop','p2d2_de1','p2d2_de2','p2d2_fv') ORDER BY n.nspname;"
```

**Objekt-Inventar je Schema (tatsächlich):**

| Schema | Tabellen | Views | Sequenzen | ENUM-Typen | Funktionen | Trigger |
|---|---|---|---|---|---|---|
| p2d2_main | 0 | 0 | 0 | 0 | 0 | 0 |
| p2d2_develop | 0 | 0 | 0 | 0 | 0 | 0 |
| p2d2_de1 | 0 | 0 | 0 | 0 | 0 | 0 |
| p2d2_de2 | 0 | 0 | 0 | 0 | 0 | 0 |
| p2d2_fv | 0 | 0 | 0 | 0 | 0 | 0 |

Erwartet (manuell verifiziert, Turn 2): 14 Tabellen / 2 Views / 7 Sequenzen / 6 ENUM-Typen / 3 Funktionen / 2 Trigger je Schema.

**Priorisierter Befund (Schweregrad absteigend):**

1. **Alle fünf Schemata sind leer.** Die DDL aus `schema.sql.j2` wurde nach dem Scratch-Reinstall nie angewendet — `addon_00_postgresql.sh` führt sie als `TODO` und legt nur
   Schema + Rolle an. Die p2d2-App hat damit aktuell **keine** Daten-Tabellen.
2. **Schema-Owner weicht ab.** Tatsächlich `p2d2_main owner=P2D2-MAIN` usw. (Skript: `CREATE SCHEMA … AUTHORIZATION "P2D2-<STAGE>"`), dokumentiert war `P2D2-Admin-Role`.
3. **Keine Berechtigungen.** `information_schema.role_table_grants` = 0 Einträge, `pg_default_acl` leer — `GRANT`/`ALTER DEFAULT PRIVILEGES` wurden nie gesetzt (folgerichtig, da keine Objekte).
4. **Rollen stimmen überein.** 14 App-Rollen (`P2D2-Admin[-Role]`, `P2D2-RO[-Role]`, `P2D2-User-<BRANCH>`/`P2D2-<BRANCH>`) + 6 Zalando-Auto-Rollen (`p2d2_owner[_user]`, `p2d2_reader[_user]`, `p2d2_writer[_user]`), alle `inherit=true` — wie dokumentiert.
5. **Standalone-Abgleich nicht durchgeführt.** Standalone-DB `192.168.122.110` (Datenbank `data-dna`) ist erreichbar, verlangt aber ein Passwort, das nicht vorliegt — der
   1:1-Vergleich gegen die Standalone-Referenz ist damit offen.

## Bekannte Fallstricke

- **Skript vs. manuell:** `addon_00_postgresql.sh` ist nicht idempotent (keine Existenz-Prüfung) und nutzt ein abweichendes, gröberes Rollenmodell als die verifizierte
  manuelle Installation — für einen vollständigen Nachbau ist die manuelle Sequenz (Abschnitt „Manuelle Installation") maßgeblich.
- **Passwort `CHANGEME`/`changeme-*`:** Rollen werden mit Platzhalter-Passwort angelegt; echte Passwort-Rotation ist separat (Phase 2).
- **`INHERIT` vs. `NOINHERIT`:** Die Gruppenrollen wurden gemäß Auftrag ohne `NOINHERIT` angelegt (Mitglieder erben direkt). Die Referenz-DB (`data-dna`) hatte `NOINHERIT` —
  bei Bedarf per `ALTER ROLE … NOINHERIT` nachziehen.
- **`ALTER DEFAULT PRIVILEGES FOR ROLE "P2D2-Admin-Role"`:** bindet die Defaults an den Objekt-Owner (`P2D2-Admin-Role`). Künftige Objekte müssen von dieser Rolle angelegt
  werden, damit die Defaults greifen.
- **`search_path` für `P2D2-RO`** wurde nicht gesetzt (nur `P2D2-Admin`); falls nötig `ALTER ROLE "P2D2-RO" SET search_path = p2d2_main, public;`.
