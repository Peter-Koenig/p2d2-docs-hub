---
title: "p2d2-AddOn – GeoServer (02)"
description: Was das p2d2-AddOn-Installationsskript für die GeoServer-Komponente tut – Workspaces, PostGIS-Datastores, GeoTIFF-Mosaic, Rückbau, manuelle Installation und bekannte Fallstricke
quality:
  completeness: 75
  accuracy: 90
  reviewed: false
  reviewer:
  reviewDate:
---

# 02 – GeoServer

Modul `addon_10_geoserver.sh`, Funktionen `install_addon_geoserver`, `install_addon_geoserver_mosaic` und `uninstall_addon_geoserver`.

## Was das Skript tut (Schritt für Schritt)

Das Modul erweitert die **geteilte GeoServer-Instanz** (Helm-Release `geoserver-geoserver`) additiv über die GeoServer-REST-API (`https://geoportal.<domain>/geoserver/rest`).

1. **Admin-Credentials lesen** — aus dem Secret `geoserver-geoserver` (Keys `geoserver-user`/`geoserver-password`) im GeoData-Namespace.
2. **Je Stage (`MAIN`, `DEVELOP`, `DE1`, `DE2`, `FV`)** werden über REST angelegt:
   - ein **Namespace/Workspace** (`main`, `dev`, `de1`, `de2`, `fv`; URI `urn:data-dna:govdata:<ws>`) und
   - ein **PostGIS-Datastore** `<ws>_pg` (Host `central-db.cc-prd-database-stack.svc.cluster.local:5432`, Database `p2d2`, Schema `p2d2_<stage>`, User `P2D2-<STAGE>`).
   - FeatureTypes, Nutzer/Rollen und ACL-Regeln sind im Skript als **TODO** markiert (Sequenz aus den Automatisierungshinweisen nachziehen).
3. **GeoTIFF-Mosaic** (`install_addon_geoserver_mosaic`): legt im Workspace `friedhofsplaene` (URI `urn:data-dna:tiffdata`) **je Stadt-Unterordner** `supplement/geotiffs/<stadt>/` ein
   ImageMosaic an — Coveragestore `friedhofsplaene_<stadt>_mosaic`, Coverage `friedhoefe_<stadt>` (`nativeCoverageName` = Ordnername), plus ImageMosaic-Kernparameter
   (`MergeBehavior FLAT`, `SUGGESTED_TILE_SIZE 512,512`, `FootprintBehavior Transparent`, `USE_JAI_IMAGEREAD true`, `RescalePixels true`) und offene Lese-ACL
   (`ROLE_ANONYMOUS,ROLE_AUTHENTICATED,ADMIN`). Die GeoTIFFs werden per `kubectl cp` direkt ins Pod-Data-Dir `/opt/geoserver/data_dir/data/geotiffs/<stadt>/` verteilt (am Ingress vorbei).
   Fehlt der `geotiffs`-Ordner oder enthält er keine TIFFs, wird das Mosaic **übersprungen** (kein Fehler).
4. **Rückbau:** entfernt die Workspaces (`friedhofsplaene`, `fv`, `de2`, `de1`, `dev`, `main`) per `DELETE …/workspaces/<ws>?recurse=true`, danach die physischen Raster-Dateien
   **unterhalb** von `data/geotiffs/` (das Verzeichnis selbst bleibt) und schließlich alle `p2d2-geoserver-*`-Secrets aus der früheren manuellen Einrichtung.

> **Entwicklungsstand (rudimentär):** Die REST-Sequenz ist abgebildet, aber **nicht idempotent** (409-/201-Toleranz nur teilweise). FeatureTypes/Nutzer/Rollen/ACL sind TODO.

## Ausgangslage (vorausgesetzt)

- Geteilte GeoServer-Instanz (Helm-Release `geoserver-geoserver`) läuft im GeoData-Namespace, Admin-Secret `geoserver-geoserver` ist vorhanden.
- PostgreSQL-Komponente (Modul 00) hat Schemata und Rollen je Stage bereits angelegt (Datastore verweist darauf).
- Optional: `supplement/geotiffs/<stadt>/` mit GeoTIFFs für die Mosaic-Anlage.

## Zielergebnis

Fünf Vektor-Workspaces (`main`, `dev`, `de1`, `de2`, `fv`) mit je einem PostGIS-Datastore, plus — sofern GeoTIFFs vorhanden — das kommunen-übergreifende ImageMosaic
`friedhofsplaene` mit je einem Coveragestore/Coverage pro Stadt.

## Manuelle Installation / Troubleshooting

Aus der früheren manuellen Installation (verifiziert, sechs Schritte):

1. **Workspaces/Namespaces** (5) anlegen.
2. **PostGIS-Datastores** (5) anlegen (Host/Schema/User je Stage, `dbtype=postgis`, `Expose primary keys=true`).
3. **FeatureTypes** anlegen (25 = 5 je Workspace; Views `graeber`/`grabflure` mit `nativeName` `v_graeber_aktuell`/…).
4. **Nutzer + Rollen** anlegen und zuordnen.
5. **ACL-Layer-Regeln** + Service-Regel setzen.
6. **Secrets** für die GeoServer-Nutzer anlegen.

**GeoTIFF-Mosaic (Friedhofspläne Köln):** ImageMosaic im Workspace `friedhofsplaene`, Coveragestore `friedhofsplaene_koeln_mosaic`, Coverage `friedhoefe_koeln`; Style
`friedhofsplan_transparent` als `defaultStyle` (Transparenz). Die REST-Referenz und die konkreten Aufrufe stehen in `geoserver-automatisierungshinweise.md` (ai-runs).

## Bekannte Fallstricke

- **Idempotenz:** `POST` ohne vorherige Existenz-Prüfung; 409/201 wird derzeit nur per `log_warn` „toleriert", nicht sauber behandelt.
- **`kubectl cp` legt das Zielverzeichnis nicht an** → vorher `mkdir -p` im Pod (Turn 73).
- **Coveragestore-Body braucht explizit `workspace`** (`coverageStore.workspace.name`), sonst „Store must be part of a workspace" (Turn 74).
- **Mosaic-Kernparameter heißen `metadata`** (nicht `parameters`).
- **Rückbau-Löschung** entfernt nur den Katalogeintrag, nicht die per `kubectl cp` verteilten Raster-Dateien → zusätzlich `rm -rf …/geotiffs/*` (Verzeichnis `geotiffs/` bleibt, es gehört zum GeoServer).
- **HTTP-Status separat auswerten** (`curl -w "%{http_code}"`), da 404 bei `curl` sonst fälschlich als Erfolg bzw. als roher Tomcat-HTML-Body ins Log läuft (Turn 72).
- **Ordner-Hierarchie `geotiffs/<stadt>/`** wird 1:1 abgebildet (je Stadt ein Unterordner → je Stadt ein Mosaic) — kein „magischer" Datenzugang (Turn 68/69).
