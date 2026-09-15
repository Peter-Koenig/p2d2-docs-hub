---
title: PostgreSQL/PostGIS Container
description: "Zwei PostgreSQL-Cluster (17: Zitadel, 18: p2d2) auf der LXC postgresql"
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-09-15
---

# LXC: PostgreSQL/PostGIS

Auf der LXC `postgresql` laufen zwei unabhängige PostgreSQL-Cluster. Jeder hat eine eigene Version, einen eigenen Port, ein eigenes Datenverzeichnis und eine eigene systemd-Unit.

## Container-Ressourcen

| Ressource | Wert |
|---|---|
| Hostname | `postgresql` |
| Betriebssystem | Debian 13 (trixie) |
| CPU | 3 vCPU |
| RAM | 2 GiB (1,7 GiB verfügbar) |
| Swap | 512 MiB |
| Root-Filesystem | 15 GB, 32 % belegt (4,4 GB) |

## Installierte Software

| Paket | Version |
|---|---|
| `postgresql-17` | 17.11-1.pgdg12+2 |
| `postgresql-18` | 18.6-1.pgdg12+2 |
| `postgresql-17-postgis-3` | 3.6.4+dfsg-2.pgdg12+1 |
| `postgresql-18-postgis-3` | 3.6.4+dfsg-2.pgdg12+1 |

## Cluster-Übersicht

| Cluster | PostgreSQL | Port | systemd-Unit | Zweck |
|---|---|---|---|---|
| 17/main | 17.11 | 5433 | `postgresql@17-main.service` | Zitadel |
| 18/main | 18.6 | 5432 | `postgresql@18-main.service` | p2d2 + Altlasten |

Beide Cluster teilen sich dieselben grundlegenden Einstellungen: `shared_buffers` 128 MB, `max_connections` 100, `max_wal_size` 1 GB, `min_wal_size` 80 MB, `wal_level` `replica`, `ssl` aktiv mit Snakeoil-Zertifikat (`/etc/ssl/certs/ssl-cert-snakeoil.pem`). Sie unterscheiden sich in den Locale-/Timezone-Werten.

## Cluster 17/main (Zitadel)

| Eigenschaft | Wert |
|---|---|
| Datenverzeichnis | `/var/lib/postgresql/17/main` (88 MB belegt) |
| Konfiguration | `/etc/postgresql/17/main/` |
| `timezone` / `log_timezone` | `Europe/Berlin` |
| `lc_messages` / `lc_monetary` / `lc_numeric` / `lc_time` | `en_US.UTF-8` |

Datenbanken:

| Datenbank | Größe | Collation |
|---|---|---|
| `zitadel_adm` | 7486 kB | `de_DE.UTF-8` |
| `zitadel_prod` | 20 MB | `en_US.UTF-8` |

Rollen: `postgres` (Superuser), `zitadel`, `zitadel_app`. Die beiden Zitadel-Rollen sind login-fähig, ohne `rolconnlimit`.

Extension: nur `plpgsql` (in beiden Datenbanken).

Schemata in `zitadel_prod` (Owner `zitadel_app`): `adminapi`, `auth`, `cache`, `eventstore`, `logstore`, `projections`, `queue`, `system` (8 Schemata).

`pg_hba.conf`:

- lokaler Socket: `peer` für `postgres` und `all`
- TCP-Loopback: `scram-sha-256`
- WireGuard-Subnetz `10.10.10.0/24`: `scram-sha-256`
- Server-LAN `192.168.122.0/24`: `scram-sha-256`
- `host data-dna P2D2-RO 10.10.10.7/32 trust`: vorhanden, aber wirkungslos, da es in diesem Cluster keine Datenbank `data-dna` gibt

Backup-Artefakt: `/etc/postgresql/17/main/pg_hba.conf.bak20251020` (root-owned, datiert 20.10.2025).

## Cluster 18/main (p2d2 + Altlasten)

| Eigenschaft | Wert |
|---|---|
| Datenverzeichnis | `/var/lib/postgresql/18/main` (290 MB belegt) |
| Konfiguration | `/etc/postgresql/18/main/` |
| `timezone` / `log_timezone` | `Etc/UTC` |
| `lc_messages` / `lc_monetary` / `lc_numeric` / `lc_time` | `C` |

Hinweis zur Textdatei `postgresql.conf`: Sie enthält zwei Blöcke für `data_directory`, `hba_file`, `ident_file`, `cluster_name`, `port`, `timezone` und weitere. Der erste Block referenziert textlich `17/main`-Pfade und `C`/`Etc/UTC`-Werte, der zweite überschreibt mit `18/main`. PostgreSQL wertet die letzte Direktive, die effektiven Werte sind korrekt (Port 5432, `18/main`). Es handelt sich um eine folgenlose Eigenart der Textdatei, vermutlich eine Kopie der Cluster-17-Konfiguration als Ausgangsbasis, die nicht vollständig ersetzt wurde.

Datenbanken:

| Datenbank | Größe | Collation | Anmerkung |
|---|---|---|---|
| `data-dna` | 168 MB | `de_DE.UTF-8` | Produktions-DB für p2d2, PostGIS |
| `opencloud` | 7806 kB | - | keine p2d2-Relevanz |
| `zitadel_prod` | 10078 kB | `de_DE.UTF-8` | Altlast (siehe Zitadel-Historie) |

### Rollen (21)

p2d2-Rollenhierarchie (alle ohne `rolconnlimit`, also unbegrenzt):

- `P2D2-Admin` (login, CREATEROLE, CREATEDB)
- `P2D2-Admin-Role` (nologin)
- `P2D2-DE1`, `P2D2-DE2`, `P2D2-DEVELOP`, `P2D2-FV`, `P2D2-MAIN` (login)
- `P2D2-RO` (login, read-only)
- `P2D2-RO-Role` (nologin)
- `P2D2-User-DE1`, `P2D2-User-DE2`, `P2D2-User-DEVELOP`, `P2D2-User-FV`, `P2D2-User-MAIN` (nologin)
- `P2D2-User-Role` (nologin)

OpenCloud-Rollen: `OC-Admin` (login), `OC-Admin-Role` (nologin).

Zitadel-Altlast-Rollen mit Verbindungslimit: `zitadel_admin` (5), `zitadel_app` (20), `zitadel_ro` (5).

### p2d2-Schemata in `data-dna`

Alle fünf Schemata gehören `P2D2-Admin-Role`:

`p2d2_de1`, `p2d2_de2`, `p2d2_develop`, `p2d2_fv`, `p2d2_main`.

Objektzählung je Schema:

| Schema | Tabellen | Views | Sequences | Enum-Typen | Funktionen |
|---|---|---|---|---|---|
| `p2d2_de1` | 16 | 2 | 8 | 6 | 3 |
| `p2d2_de2` | 15 | 2 | 7 | 6 | 2 |
| `p2d2_develop` | 15 | 2 | 7 | 6 | 2 |
| `p2d2_fv` | 15 | 2 | 7 | 6 | 2 |
| `p2d2_main` | 15 | 2 | 7 | 6 | 2 |

`p2d2_de1` hat eine Tabelle mehr (`rheinkassel_gf`, 14 Zeilen, Altdaten) und eine Funktion mehr (`fn_container_mitversionen()`). `rheinkassel_gf` und `fn_container_mitversionen()` existieren nur in `p2d2_de1`.

Enum-Typen (identisch in allen fünf Schemata):

| Enum | Werte |
|---|---|
| `wf_event_type` | 14: session_start, session_pause, session_resume, session_end, session_expire, session_abort, feature_edit, feature_save, snapshot_create, qs1_pass, qs1_fail, qs2_pass, qs2_fail, export_osm |
| `wf_feature_state` | 8: unbearbeitet, in_bearbeitung, qs1_ausstehend, qs1_abgelehnt, qs2_ausstehend, qs2_abgelehnt, exportbereit, exportiert |
| `wf_qs_level` | 2: qs1, qs2 |
| `wf_qs_result` | 3: pass, fail, warning |
| `wf_session_state` | 5: active, paused, completed, expired, aborted |
| `wf_snapshot_kind` | 6: auto, manual, session_boundary, pre_qs, post_qs, export |

Tabellengrößen (Zeilen, Stand 2026-09-15):

| Tabelle | Zeilen | Anmerkung |
|---|---|---|
| `p2d2_graeber` | 47.122 | identisch in allen fünf Schemata |
| `p2d2_containers` | 1.772 | identisch in allen fünf Schemata |
| `p2d2_grabflure` | 356 | identisch in allen fünf Schemata |
| `wf_feature_status` | 342 | nur in `p2d2_de1` befüllt |
| `wf_sessions` | 41 | nur in `p2d2_de1` befüllt |
| `wf_snapshots` | 20 | nur in `p2d2_de1` befüllt |

Die Workflow-/Versionstabellen sind nur in `p2d2_de1` befüllt. Die Schemata `p2d2_de2`, `p2d2_develop`, `p2d2_fv` und `p2d2_main` enthalten identische Stammdaten (`p2d2_graeber`, `p2d2_containers`, `p2d2_grabflure`, `p2d2_kommunen`), aber keine Workflow-Daten.

### Schemata in `zitadel_prod` (Altlast)

Owner `zitadel_admin`, sieben Schemata: `adminapi`, `auth`, `eventstore`, `logstore`, `projections`, `system`, `zitadel`. Im Vergleich zur produktiven Instanz in Cluster 17 fehlen hier `cache` und `queue`.

### `pg_hba.conf`

- lokaler Socket: `peer`
- TCP-Loopback: `scram-sha-256`
- Server-LAN `192.168.12.0/24` und `192.168.122.0/24`: `md5`
- WireGuard-Subnetz `10.10.10.0/24`: `md5`
- `host data-dna P2D2-RO 10.10.10.7/32 trust`: wirksam, da `data-dna` existiert

In diesem Cluster gibt es kein `pg_hba.conf.bak*`. Die Authentifizierung über `md5` ist schwächer als `scram-sha-256` in Cluster 17, das ist eine reine Feststellung.

## PostGIS

In `data-dna` ist die Extension `postgis` in Version 3.6.1 installiert. Die Paketversion ist 3.6.4. Die Extension-Version hinkt nach, da nach der letzten Paketaktualisierung kein `ALTER EXTENSION postgis UPDATE` ausgeführt wurde.

## Zitadel-Historie

Zitadel benötigt zwingend PostgreSQL 17. Es gab mehrere Anläufe, darunter der Versuch, Zitadel selbst zu bauen, der nicht funktionierte. Letztlich kam das Hersteller-Image zum Einsatz. Daraufhin wurde die dedizierte PostgreSQL-17-Instanz (Cluster 17/main) separat aufgesetzt.

Die in Cluster 18 verbliebenen Zitadel-Reste (Datenbank `zitadel_prod`, Rollen `zitadel_admin`, `zitadel_app`, `zitadel_ro`) stammen aus einem frühen, abgebrochenen Anlauf und wurden nicht aufgeräumt.

## Netzwerkzugang

Der Container ist nicht öffentlich exponiert. Zugriff erfolgt über das interne LAN und WireGuard.

Verbindungsdaten für Anwendungen:

| Zweck | Host | Port | Datenbank | Rolle |
|---|---|---|---|---|
| p2d2 (Cluster 18) | `192.168.122.110` | 5432 | `data-dna` | `P2D2-*` |
| Zitadel (Cluster 17) | `192.168.122.110` | 5433 | `zitadel_prod` / `zitadel_adm` | `zitadel` / `zitadel_app` |

Read-only-Zugriff auf `data-dna` ist als `P2D2-RO` möglich.

## Systemd

| Unit | Cluster |
|---|---|
| `postgresql@17-main.service` | 17/main |
| `postgresql@18-main.service` | 18/main |

```bash
systemctl status postgresql@18-main
systemctl restart postgresql@18-main
journalctl -u postgresql@18-main -f --no-pager
```
