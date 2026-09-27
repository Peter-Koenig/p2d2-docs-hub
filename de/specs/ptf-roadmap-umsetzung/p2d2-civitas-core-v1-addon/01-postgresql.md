---
title: "p2d2-AddOn – PostgreSQL (01)"
description: Was das p2d2-AddOn-Installationsskript für die PostgreSQL-Komponente tut – Rollen und Schemata je Stage im central-db, Ausgangslage, Zielergebnis, manuelle Installation und bekannte Fallstricke
quality:
  completeness: 70
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# 01 – PostgreSQL

Modul `addon_00_postgresql.sh`, Funktionen `install_addon_postgresql` und `uninstall_addon_postgresql`.

## Was das Skript tut (Schritt für Schritt)

Das Modul arbeitet gegen die **zentrale, geteilte PostgreSQL-Instanz** `central-db` (Zalando Postgres Operator) im DB-Namespace (`ADDON_DB_NS`, Default `cc-prd-database-stack`).
Die Datenbank `p2d2` wird als bereits vorhanden vorausgesetzt (additiver `preparedDatabases.p2d2`-Eintrag der Basisplattform, siehe „Manuelle Installation").

1. **Superuser-Credentials lesen** — aus dem Zalando-Secret `postgres.central-db.credentials.postgresql.acid.zalan.do` (Keys `username`/`password`) im DB-Namespace.
2. **Je Stage (`MAIN`, `DEVELOP`, `DE1`, `DE2`, `FV`)** werden per `kubectl exec central-db-0 -- psql` angelegt:
   - eine **Login-Rolle** `P2D2-<STAGE>` (z. B. `P2D2-MAIN`, `P2D2-DE1`) und
   - ein **Schema** `p2d2_<stage>` (z. B. `p2d2_main`, `p2d2_de1`) mit `AUTHORIZATION` auf die Rolle.

   Mapping im Skript:

   | Stage | Rolle | Schema |
   |---|---|---|
   | MAIN | `P2D2-MAIN` | `p2d2_main` |
   | DEVELOP | `P2D2-DEVELOP` | `p2d2_develop` |
   | DE1 | `P2D2-DE1` | `p2d2_de1` |
   | DE2 | `P2D2-DE2` | `p2d2_de2` |
   | FV | `P2D2-FV` | `p2d2_fv` |

3. **Rückbau:** in umgekehrter Reihenfolge (`FV → DE2 → DE1 → DEVELOP → MAIN`) werden Schema (`DROP SCHEMA … CASCADE`) und Rolle (`DROP ROLE`) entfernt. Der Superuser selbst wird nie angefasst.

> **Entwicklungsstand (rudimentär):** Die Sequenz ist im Skript abgebildet, aber **nicht idempotent** (keine Existenz-Prüfung pro Objekt; Fehler werden per `log_warn` toleriert).
> DDL (`schema.sql.j2`), Grants je Rollentyp (`owner`/`ro`/`admin`) und `ALTER DEFAULT PRIVILEGES` sind als **TODO** markiert und noch nicht implementiert. Das Passwort der Rollen
> ist noch Platzhalter `CHANGEME` (Passwort-Rotation = spätere Phase).

## Ausgangslage (vorausgesetzt)

- `central-db` (Zalando Operator) läuft im DB-Namespace, Datenbank `p2d2` und das Superuser-Secret sind vorhanden.
- Die Basisplattform stellt `p2d2` als additiven `preparedDatabases.p2d2`-Eintrag mit `extensions: postgis` bereit (siehe „Manuelle Installation").

## Zielergebnis

Fünf Schemata (`p2d2_main`, `p2d2_develop`, `p2d2_de1`, `p2d2_de2`, `p2d2_fv`) und fünf Login-Rollen (`P2D2-MAIN`, `P2D2-DEVELOP`, `P2D2-DE1`, `P2D2-DE2`, `P2D2-FV`) in der
Datenbank `p2d2`. Die App-Rollen werden vom Frontend (`DB_USER` je Stage) und vom GeoServer (PostGIS-Datastore) genutzt.

## Manuelle Installation / Troubleshooting

Aus der früheren manuellen Installation (verifiziert):

- **Ausgangslage:** `central-db` enthält bereits die Databases `frost` und `geodata` (Basis). `p2d2` wird als dritter, additiver `preparedDatabases`-Eintrag ergänzt:
  ```yaml
  preparedDatabases:
    p2d2:
      defaultUsers: true
      extensions:
        postgis: public
      schemas:
        public:
          defaultRoles: []
  ```
- **Struktur-Aufbau je Schema:** Für jedes der fünf Schemata wurden die p2d2-Objektstrukturen (Tabellen/Views, u. a. die `v_graeber_aktuell`-/`v_grabflure_*`-Sichten als
  GeoServer-FeatureType-Grundlage) per `psql` angelegt.
- **Datenimport:** per `COPY` aus der Quelldatenbank; verifizierte Zeilenzahlen Quelle == Ziel für alle fünf Schemata.
- **Rollenmodell:** App-Laufzeit-Rollen `P2D2-*` (owner), daneben auto-erzeugte Zalando-Rollen `p2d2_*` (durch `defaultUsers: true`). Passwort-/Secret-Handling der
  App-Rollen war ein offener Punkt (im Skript weiterhin `CHANGEME`).

## Bekannte Fallstricke

- **Nicht idempotent:** `CREATE ROLE`/`CREATE SCHEMA` ohne Existenz-Prüfung → bei Wiederholung Fehler (derzeit nur `log_warn`).
- **Passwort `CHANGEME`:** Rollen werden mit Platzhalter-Passwort angelegt; erst die spätere Passwort-Rotation ersetzt das.
- **DDL/Grants fehlen:** Die eigentliche Objektstruktur wird vom Skript noch nicht angelegt (nur Schema+Rolle) — für vollständige Datenbestände ist der manuelle Struktur-Aufbau nötig.
