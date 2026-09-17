---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Manuelle Installation: PostgreSQL"
description: Manuell durchgeführte PostgreSQL-Installation des p2d2-AddOns – additiver preparedDatabases.p2d2-Eintrag, Struktur-Aufbau in fünf Schemata, COPY-Datenimport, Rollenmodell und offene Fragen
quality:
  completeness: 80
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# PostgreSQL

Diese Seite dokumentiert Modul 1 der manuellen p2d2-AddOn-Installation: die Bereitstellung der p2d2-Datenbank im bestehenden Zalando-`central-db`-Cluster. Der beschriebene Zustand wurde gegen die laufende Umgebung verifiziert (siehe „Status Quo").

## Ausgangslage

- `central-db` ist ein einzelner Zalando-`postgresql`-CR (`acid.zalan.do/v1`, Name `central-db`) im Namespace `cc-prd-database-stack`, **nicht** Helm-verwaltet. Betrieben wird **PostgreSQL 16.3**.
- Neue Datenbanken werden über das Zalando-Feature `spec.preparedDatabases` abgebildet: Datenbank + automatische Owner-/Reader-/Writer-Rollen + Extensions.
- Die bestehenden Einträge `frost` und `geodata` haben exakt die Zielstruktur für `p2d2`:

```yaml
frost:
  defaultUsers: true
  schemas:
    public:
      defaultRoles: false
  extensions:
    postgis: public
geodata:
  defaultUsers: true
  schemas:
    public:
      defaultRoles: false
  extensions:
    postgis: public
```

Der `p2d2`-Eintrag ist damit **1:1 analog** zu `frost`/`geodata` – keine abweichenden Felder oder Annahmen nötig.

## Manuelle Installation (additiv)

Der `p2d2`-Eintrag wird als **JSON Merge Patch (RFC 7386)** additiv in den bestehenden CR gemergt. Es wird ausschließlich der Teilbaum `spec.preparedDatabases.p2d2` berührt – **kein** `--force`/`--force-conflicts`, **kein** `replace`, keine Änderung an `teamId`, `numberOfInstances`, `volume`, `resources` oder `patroni`.

```bash
kubectl --kubeconfig /home/pkoenig/.kube/p2d2-addon-installer.kubeconfig \
  -n cc-prd-database-stack patch postgresql central-db --type merge \
  -p '{"spec":{"preparedDatabases":{"p2d2":{"defaultUsers":true,"extensions":{"postgis":"public"},"schemas":{"public":{"defaultRoles":false}}}}}}'
```

Zielstruktur des neuen Eintrags:

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

### Verifikation des Patch

```bash
kubectl --kubeconfig /home/pkoenig/.kube/p2d2-addon-installer.kubeconfig \
  -n cc-prd-database-stack get postgresql central-db \
  -o jsonpath='{.spec.preparedDatabases}' | python3 -m json.tool
```

Erwartung: alle bestehenden Einträge (`keycloak`, `superset`, `superset_upload`, `quantumleap`, `stellio_search`, `stellio_subscription`, `frost`, `geodata`) unverändert, zusätzlich neu `p2d2`.

Der Zalando-Operator erzeugt daraus automatisch die Datenbank `p2d2`, legt PostGIS in `public` an und erstellt die Rollen/Secrets `p2d2_owner_user`, `p2d2_reader_user`, `p2d2_writer_user`.

## Struktur-Aufbau je Schema

Die eigentliche Fachstruktur wird **nachgelagert** per SQL angelegt (nicht über `preparedDatabases`). DDL-Quelle ist ein einzelnes Jinja2-Template:

`p2d2-civitas-addon/v1/templates/p2d2-postgresql/schema.sql.j2` (1661 Zeilen, nur zwei Platzhalter: `{{ p2d2_instance_schema }}` ×461, `{{ p2d2_admin_role }}` ×161).

Es werden **fünf Schemata** angelegt, identisch strukturiert und 1:1 zu den fünf Entwicklungs-Stagings (Branches) – nicht als Kommune-/Themen-Trennung:

- `p2d2_de1`, `p2d2_de2`, `p2d2_develop`, `p2d2_fv`, `p2d2_main`

### Objektstruktur (Momentaufnahme, nicht feste Größe)

| Kategorie | Anzahl je Schema |
|---|---|
| Tabellen | 14 |
| Enum-Typen | 6 |
| Sequences | 7 |
| Views | 2 |
| Funktionen | 3 (`aggregate_session_snapshots`, `on_version_delete`, `fn_container_mitversionen`) |
| Trigger | 2 (`trg_version_delete`, `trg_container_mitversionen`) |

Die 14 Tabellen: `p2d2_kommunen`, `p2d2_containers`, `p2d2_graeber`, `p2d2_grabflure`, `p2d2_graeber_snapshots`, `p2d2_grabflure_snapshots`, `p2d2_graeber_versionen`, `p2d2_grabflure_versionen`, `p2d2_grabflur_mapping`, `wf_sessions`, `wf_snapshots`, `wf_feature_status`, `wf_qs_maengel`, `wf_protokoll`.

Ausgeschlossen sind bewusst `gt_pk_metadata` (erzeugt GeoServer selbst) und die Standalone-Altlasten `rheinkassel_gf`/`rheinkassel_gf_ogc_fid_seq` sowie die `P2D2-User-DE1 → p2d2_main`-Anomalie.

> Die Objektzahlen sind eine **Momentaufnahme** der aktuellen Datenmodell-Version. Bei Themenzuwachs wachsen Tabellen-/Enum-Zahlen mit; sie sind daher nicht als feste Verifikations-Zähler zu verwenden.

## Datenimport-Verfahren

Der Datenimport von der Standalone-Referenz (`data-dna`, PostgreSQL **18.6**) in `central-db` (PostgreSQL **16.3**) erfolgt per `psql`-`COPY`, **nicht** per `pg_dump`/`pg_restore`:

- `pg_dump` scheitert am Versionsmismatch: `pg_dump` 17.11 verweigert Dumps neuerer Server (Quelle 18.6). Auf `sdt` ist kein PG-18-Client installiert.
- `psql` 17.11 verbindet sich problemlos zu beiden Servern; `COPY … TO STDOUT` (Quelle) → `COPY … FROM STDIN` (Ziel) ist versionsagnostisch.

Während des Bulk-Copy werden die Trigger deaktiviert (`SET session_replication_role = replica` … `origin`), damit `trg_container_mitversionen` keine „Mitversionen" erzeugt, die es in der Quelle nicht gibt.

Da die reine Leserolle `P2D2-RO` kein `USAGE` auf Quell-Sequenzen hat, erfolgt der Sequenz-Resync über `max(id)` der Zieltabellen:

```sql
SELECT setval('<schema>.<seq>', (SELECT COALESCE(MAX(id),1) FROM <schema>.<tabelle>));
```

Damit gilt `last_value >= max(id)` für alle Sequenzen (verifiziert).

### Verifizierte Zeilenzahlen (Quelle == Ziel, alle 5 Schemata)

| Tabelle | de1 | de2/develop/fv/main |
|---|---|---|
| `p2d2_kommunen` | 1 | 1 |
| `p2d2_containers` | 1772 | 1772 |
| `p2d2_graeber` | 47122 | 47122 |
| `p2d2_grabflure` | 356 | 356 |
| `p2d2_grabflure_versionen` | 3933 | 0 |
| `wf_sessions` | 38 | 0 |
| `wf_snapshots` | 17 | 0 |
| `wf_feature_status` | 342 | 0 |

Die Workflow-/Versionstabellen sind nur in `p2d2_de1` befüllt; `de2/develop/fv/main` sind „unberührte" Staging-Kopien. Das ist ein Quellbefund und wurde 1:1 reproduziert.

## Rollenmodell

Es existieren zwei getrennte Rollenwelten in der Datenbank `p2d2`.

### App-Laufzeit-Rollen (`P2D2-*`)

| Rolle | Login | Umfang |
|---|---|---|
| `P2D2-Admin` / `P2D2-Admin-Role` | ja / nein | Objekt-Owner, `ALL` auf eigenes Schema |
| `P2D2-<BRANCH>` / `P2D2-User-<BRANCH>` | ja / nein | `SELECT,INSERT,UPDATE,DELETE` nur im eigenen Schema |
| `P2D2-RO` / `P2D2-RO-Role` | ja / nein | `SELECT` auf alle fünf Schemata |

`P2D2-<BRANCH>` ∈ `DE1, DE2, DEVELOP, FV, MAIN`. Diese Rollen sind die **engen App-Laufzeit-Rollen** (u. a. GeoServer-Datastore-Zugriff) und besitzen **keine Cross-Schema-Rechte**: `P2D2-User-<BRANCH>` hat CRUD ausschließlich auf dem jeweils eigenen Schema, `USAGE` ebenfalls nur auf dem eigenen Schema.

### Zalando-Auto-Rollen (`p2d2_*`, durch `defaultUsers: true`)

`p2d2_owner_user` (LOGIN), `p2d2_reader_user` (LOGIN), `p2d2_writer_user` (LOGIN) mit den zugehörigen NOLOGIN-Gruppen `p2d2_owner`, `p2d2_reader`, `p2d2_writer`. Diese sind von den App-Rollen getrennt und dienen dem Operator-verwalteten Zugriff.

### Entwickler-Rolle mit Cross-Schema-Lesezugriff (offener Punkt)

Ein **separater, nur zur Entwicklung genutzter** Lesezugriff über alle fremden Schemata (`GRANT USAGE` auf alle Schemata + `SELECT ON ALL TABLES IN SCHEMA <fremd>`) ist **nicht als eigenständige, klar abgegrenzte Entwickler-Rolle vorhanden**.

Strukturell übernimmt derzeit `P2D2-RO-Role` bereits den Cross-Schema-`SELECT` (USAGE auf allen fünf Schemata, `SELECT` auf allen Tabellen/Views). Diese Rolle ist in der Spezifikation aber als „Staging-Vergleich/Reporting"-Rolle definiert, nicht explizit als Entwickler-Rolle. Ob `P2D2-RO` diese Funktion übernehmen soll oder eine zusätzliche, dedizierte Entwickler-Rolle nötig ist, bleibt ein offener Punkt – es wurde **nichts** eigenständig angelegt.

## Status Quo (verifiziert)

| Prüfpunkt | Ergebnis |
|---|---|
| `preparedDatabases.p2d2` | vorhanden, exakt `{defaultUsers:true, extensions:{postgis:public}, schemas:{public:{defaultRoles:false}}}` |
| PostgreSQL-Version `central-db` | 16.3 |
| Datenbank `p2d2` | vorhanden |
| Schemata | `p2d2_de1`, `p2d2_de2`, `p2d2_develop`, `p2d2_fv`, `p2d2_main` (+ `public`, `metric_helpers`, `user_management`) |
| Tabellen/Sequences/Views je Schema | 14 / 7 / 2 (alle fünf Schemata) |
| Sequenzstände | `last_value >= max(id)` erfüllt |
| Rollen | `P2D2-*` (App) + `p2d2_*_user` (Zalando) vorhanden |

## Bekannte offene Fragen / Risiken

- **O1 — Namespace:** `cc-prd-database-stack` (aus `{{ ENVIRONMENT }}-database-stack`, `ENVIRONMENT=cc-prd`). **Gelöst** – gegen den Cluster bestätigt.
- **O2 — psql-Zugang für die Verifikation:** Pod-Login als `postgres` ist ohne Passwort möglich (`local … trust`). **Gelöst** – verifiziert.
- **O3 — Rückbau-Semantik des Operators (destruktiv):** Ob das Entfernen von `preparedDatabases.p2d2` (via `{"spec":{"preparedDatabases":{"p2d2":null}}}`) die Datenbank `p2d2` und die Rollen/Secrets tatsächlich **löscht**, ist weiterhin nicht aus dem Code belegbar und gegen die installierte Operator-Version zu verifizieren. Der Rückbau ist destruktiv; ein `pg_dump` vor dem Rückbau ist ratsam.
- **O4 — `additionalDatabases`-Inventarform:** Für den manuellen Weg irrelevant, aber für die spätere Automatisierung (Objektliste vs. Namensliste) zu vereinheitlichen.
- **O5 — Merge-Semantik `kubernetes.core.k8s`:** Für den manuellen Weg wird `kubectl patch --type merge` verwendet (per Definition RFC 7386), damit nicht von der Collection-Version abhängig. Für die Ansible-Automatisierung bleibt die Standard-`merge_type`-Annahme erneut zu prüfen.

## Fragmente zum künftigen Installationsskript (Entwurfsfragment)

Die nachfolgenden Punkte sind **keine lauffähige Implementierung**, sondern ein Entwurfsfragment für die spätere Skript-basierte Automatisierung (Ansible-Task oder Helm-`post-install`-Hook-Job).

```text
# Grundidee
portable Fach-Artefakte (schema.sql.j2, COPY-Katalog, Grant-/Assert-SQL)
  + dünner Orchestrierungs-Layer (Secret lesen → Template rendern → ausführen)

# Zu adressierende Punkte
1) Templating-Engine: Platzhalter bewusst primitiv halten (envsubst/sed-tauglich)
   statt Jinja2-spezifischer Filter. Heute nur 2 Tokens → Wechsel trivial.
2) Datenimport-Idempotenz: reines COPY ist Append. Für Wiederholbarkeit
   TRUNCATE/Upsert/Dedupe vor dem Laden definieren.
3) Kataloggetriebene Enumeration statt hartkodierter Listen:
   - Tabellenliste aus pg_class (relkind='r', minus Altlasten) ableiten.
   - Sequenz→Tabellen-Zuordnung über pg_depend (OWNED BY) ableiten.
4) Trennung Struktur-Hook vs. separater Daten-Job (Datenimport ist idempotenz-kritisch).
5) Verifikation als failende SQL-Assertions statt fester Zähler
   (z. B. Quelle↔Ziel-Zeilenzahlen je Tabelle dynamisch vergleichen).
```

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-17 | Erste Fassung Modul 1 (PostgreSQL): additiver `preparedDatabases.p2d2`-Eintrag, Struktur-Aufbau, `COPY`-Datenimport, Rollenmodell, offene Fragen O1–O5, Skript-Fragmente. |
