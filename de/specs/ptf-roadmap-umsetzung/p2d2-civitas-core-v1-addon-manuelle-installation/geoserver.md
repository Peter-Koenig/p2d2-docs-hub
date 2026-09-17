---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Manuelle Installation: GeoServer"
description: Manuell durchgeführte GeoServer-Installation des p2d2-AddOns – additive Erweiterung der geteilten Plattforminstanz (Workspaces, Datastores, FeatureTypes, Nutzer/Rollen, ACL, GeoTIFF-Mosaic), Rückbau und offene Fragen
quality:
  completeness: 80
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# GeoServer

Diese Seite dokumentiert Modul 2 der manuellen p2d2-AddOn-Installation: die additive Erweiterung der geteilten GeoServer-Plattforminstanz. Der beschriebene Zustand wurde gegen die laufende Umgebung verifiziert (siehe „Status Quo").

## Ausgangslage

- Der GeoServer ist **eine geteilte Plattforminstanz** (Helm-Release `geoserver-geoserver`, GeoServer 2.28.5) im Namespace `cc-prd-geodata-stack`, exponiert über APISIX unter `/geoserver/`.
- Es wird **nichts neu installiert**, sondern additiv erweitert: Workspaces → Datastores → FeatureTypes → Nutzer/Rollen → ACL-Regeln → Secrets → Verifikation.
- Bestehender Nicht-p2d2-Workspace `ds_open_data` sowie globale ACL (`*.*.r=*`, `*.*.w=GROUP_ADMIN,ADMIN`) bleiben **unangetastet**.

| Parameter | Wert |
|---|---|
| REST-Basis-URL | `https://geoportal.udp.data-dna.eu/geoserver/rest` |
| Admin-Secret | `geoserver-geoserver` (Keys `geoserver-user`=`admin`, `geoserver-password`) |
| GeoServer-Version | 2.28.5 |

> **Achtung:** `https://geoserver.<DOMAIN>/…` existiert zwar, liefert aber ein **selbstsigniertes Zertifikat**. Es wird ausschließlich `https://geoportal.<DOMAIN>/geoserver` (APISIX-Einstieg) verwendet.

## Voraussetzungen (RBAC-Scope)

Alle `kubectl`-Zugriffe laufen über die scoped Kubeconfig `/home/pkoenig/.kube/p2d2-addon-installer.kubeconfig` mit dem ServiceAccount `p2d2-addon-installer` im Namespace `cc-prd-geodata-stack`:

| Ressource | Verb |
|---|---|
| `secrets` | `get`, `list`, `create`, `update`, `patch` |
| `pods/exec` | `create` |
| `pods`, `services`, `configmaps`, `persistentvolumeclaims`, `deployments.apps`, `replicasets.apps` | `get`, `list`, `watch`, `create`, `update`, `patch`, `delete` |
| `events` | `get`, `list`, `watch` |

**Einordnung:** Für dieses Modul ist der Umfang **ausreichend**. Konkret benötigt werden: `secrets get` (Admin-Credentials + Nutzer-Secrets lesen), `secrets create` (6 Nutzer-Secrets anlegen) und `pods/exec` (nur für den GeoTIFF-Mosaic-Baustein: `kubectl cp` der Raster-Granules). Die übrigen Rechte (`configmaps`, `deployments`, `services`, `persistentvolumeclaims`) gehen **über** den GeoServer-Bedarf hinaus und wurden für den späteren MapProxy-Baustein ergänzt. Ein `delete`-Recht auf `secrets` fehlt – für den Rückbau der Nutzer-Secrets wäre es nötig; dies ist als offener Punkt vermerkt (siehe „Offene Fragen").

## Manuelle Installation

### Kollisionscheck (vor jedem Schreibzugriff)

```bash
curl -s -u 'admin:<pw>' 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces.json'
```

Vor dem Anlegen existierte nur `ds_open_data` (Nicht-p2d2) – kein Konflikt.

### Schritt 1 – Workspaces + Namespaces (5)

`POST /rest/namespaces` erzeugt Workspace **und** Namespace gemeinsam (ein separater Workspace-POST ist überflüssig und liefert 409).

```bash
for ws in main dev de1 de2 fv; do
  curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' \
    -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/namespaces' \
    -d "{\"namespace\":{\"prefix\":\"${ws}\",\"uri\":\"urn:data-dna:govdata:${ws}\"}}"
done
```

### Schritt 2 – PostGIS-Datastores (5)

Mapping Workspace → Datastore → DB-Schema → DB-Rolle:

| Workspace | Datastore | DB-Schema | DB-Rolle |
|---|---|---|---|
| `main` | `main_pg` | `p2d2_main` | `P2D2-MAIN` |
| `dev` | `dev_pg` | `p2d2_develop` | `P2D2-DEVELOP` |
| `de1` | `de1_pg` | `p2d2_de1` | `P2D2-DE1` |
| `de2` | `de2_pg` | `p2d2_de2` | `P2D2-DE2` |
| `fv` | `fv_pg` | `p2d2_fv` | `P2D2-FV` |

```bash
curl -s -u 'admin:<pw>' -H 'Content-Type: text/xml' \
  -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/main/datastores' \
  -d '<dataStore><name>main_pg</name><connectionParameters>
      <entry key="host">central-db.cc-prd-database-stack.svc.cluster.local</entry>
      <entry key="port">5432</entry>
      <entry key="database">p2d2</entry>
      <entry key="schema">p2d2_main</entry>
      <entry key="user">P2D2-MAIN</entry>
      <entry key="passwd">changeme-main</entry>
      <entry key="dbtype">postgis</entry>
      <entry key="Expose primary keys">true</entry>
      <entry key="namespace">urn:data-dna:govdata:main</entry>
      </connectionParameters></dataStore>'
```

`dbtype=postgis` ist zwingend; `Expose primary keys=true` für WFS-T gegen die UUID-PKs.

### Schritt 3 – FeatureTypes (25 = 5 je Workspace)

Je Workspace fünf FeatureTypes; Views werden über `nativeName` publiziert:

| publizierter Name | Quelle (`nativeName`) | Typ |
|---|---|---|
| `geo-containers` | `p2d2_containers` | Tabelle (Attribut-Override) |
| `graeber` | `v_graeber_aktuell` | View (read-only) |
| `grabflure` | `v_grabflure_aktuell` | View (read-only) |
| `graeber_versionen` | `p2d2_graeber_versionen` | Tabelle (WFS-T-Ziel) |
| `grabflure_versionen` | `p2d2_grabflure_versionen` | Tabelle (WFS-T-Ziel) |

```bash
curl -s -u 'admin:<pw>' -H 'Content-Type: text/xml' \
  -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/main/datastores/main_pg/featuretypes' \
  -d '<featureType><name>graeber</name><nativeName>v_graeber_aktuell</nativeName><srs>EPSG:4326</srs></featureType>'
```

**Technische Schuld (bewusst übernommen):** Der Layer `geo-containers` exponiert die DB-Spalte `osm_name` als Attribut `name` (CQL-Quelle `osm_name`) und referenziert die Spalte `id` als gequotetes Literal `"id"`. Der Attribut-Override wird beim FeatureType-Anlegen mitgesetzt (ersetzt die komplette Attributliste → alle 16 Attribute mitsenden).

### Schritt 4 – Nutzer + Rollen + Zuordnung

- Nutzer (6): `p2d2_wfst_main`, `p2d2_wfst_develop`, `p2d2_wfst_de1`, `p2d2_wfst_de2`, `p2d2_wfst_fv`, `p2d2_wfs_user` (RO).
- Rollen (7): `P2D2_IMPORT_ROLE`, `P2D2_WFST_DE1/DE2/DEVELOP/FV/MAIN`, `WFS-USER`.
- Zuordnung: `p2d2_wfst_<branch>` → `P2D2_WFST_<BRANCH>`; `p2d2_wfst_main` → `P2D2_IMPORT_ROLE` + `P2D2_WFST_MAIN`; `p2d2_wfs_user` → `WFS-USER`.

Nutzer (**nur XML** – JSON liefert HTTP 500):

```bash
curl -s -u 'admin:<pw>' -H 'Content-Type: text/xml' \
  -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/usergroup/users' \
  -d '<user><userName>p2d2_wfst_main</userName><password>…</password><enabled>true</enabled></user>'
```

Rolle (**Einzel-Pfad**, kein Body; Collection-`POST /security/roles` → 405):

```bash
curl -s -u 'admin:<pw>' -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/roles/role/P2D2_WFST_MAIN'
```

Zuordnung:

```bash
curl -s -u 'admin:<pw>' -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/roles/role/P2D2_WFST_MAIN/user/p2d2_wfst_main'
```

### Schritt 5 – ACL-Layer-Regeln + Service-Regel

**Explizite Layer-Regeln (keine `*.w`-Wildcard):** je Workspace 5 Read + 5 Write; die Read-Regeln enthalten `WFS-USER` explizit.

```bash
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' \
  -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/acl/layers' \
  -d '{"main.geo-containers.r":"P2D2_IMPORT_ROLE,ROLE_AUTHENTICATED,WFS-USER,ADMIN,ROLE_ANONYMOUS",
       "main.geo-containers.w":"P2D2_IMPORT_ROLE",
       "main.graeber.r":"P2D2_IMPORT_ROLE,ROLE_AUTHENTICATED,WFS-USER,ADMIN,ROLE_ANONYMOUS",
       "main.graeber.w":"P2D2_WFST_MAIN,ADMIN"}'
```

**Service-Regel** (`wfs.Transaction`):

```bash
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' \
  -X POST 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/acl/services' \
  -d '{"wfs.Transaction":"P2D2_IMPORT_ROLE,P2D2_WFST_DEVELOP,P2D2_WFST_MAIN,P2D2_WFST_DE2,P2D2_WFST_FV,P2D2_WFST_DE1"}'
```

### Schritt 6 – Secrets für die GeoServer-Nutzer (6)

Passwörter zufällig generiert, als k8s-Secrets (Key `password`) in `cc-prd-geodata-stack`:

```bash
kubectl --kubeconfig /home/pkoenig/.kube/p2d2-addon-installer.kubeconfig \
  -n cc-prd-geodata-stack create secret generic p2d2-geoserver-wfst-main \
  --from-literal=password='<generiert>'
```

Secret-Namen: `p2d2-geoserver-wfst-main`, `-develop`, `-de1`, `-de2`, `-fv`, `p2d2-geoserver-wfs-user`.

### Wartezyklus / Idempotenz

Die GeoServer-REST-API ist **nicht durchgängig idempotent**. Für ein künftiges Skript gelten folgende Muster:

| Ressource | Idempotenz-Strategie |
|---|---|
| Namespace/Workspace | `POST /namespaces`, 409/201 tolerieren (oder `GET` vorher) |
| Datastore | `POST`, 409/201 tolerieren |
| FeatureType | `POST`, 409/201 tolerieren; Attribut-Override per `PUT` (ersetzend, idempotent) |
| Nutzer | `POST /security/usergroup/users`, JSON vermeiden (500); Existenz per `GET` prüfen |
| Rolle | `POST /security/roles/role/<name>`, 409/201 tolerieren |
| Rollen-Zuordnung | `POST …/role/<r>/user/<u>` ist idempotent (200) |
| **ACL-Layer** | **„add-only"** – `POST` scheitert mit 409, sobald eine Regel existiert → `GET` vorher, Differenz bilden, nur fehlende Regeln POSTen |
| ACL-Service | `GET` → Merge → `POST` (doppelt → 409) |
| Secrets | `kubectl create secret … --dry-run=client -o yaml \| kubectl apply` |

## Rückbau

Rückbau in **umgekehrter Abhängigkeits-Reihenfolge** (ACL → Zuordnung → Nutzer/Rollen → FeatureTypes → Datastores → Workspaces → Secrets → Dateien):

```bash
# ACL-Layer-Regeln (Einzelregel-DELETE; vorher GET für die Regelnamen)
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/acl/layers/main.geo-containers.r'
# Service-Regel
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/acl/services/wfs.Transaction'
# Rollen-Zuordnung
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/roles/role/P2D2_WFST_MAIN/user/p2d2_wfst_main'
# Nutzer
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/usergroup/users/p2d2_wfst_main'
# Rollen
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/security/roles/role/P2D2_WFST_MAIN'
# FeatureTypes
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/main/datastores/main_pg/featuretypes/graeber'
# Datastores
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/main/datastores/main_pg'
# Workspaces
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/main'
# GeoTIFF-Mosaic (Coverage → Coveragestore → Workspace → Style)
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/coveragestores/friedhofsplaene_koeln_mosaic/coverages/friedhoefe_koeln'
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/coveragestores/friedhofsplaene_koeln_mosaic'
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/styles/friedhofsplan_transparent'
curl -s -u 'admin:<pw>' -X DELETE 'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene'
# Secrets
kubectl --kubeconfig /home/pkoenig/.kube/p2d2-addon-installer.kubeconfig -n cc-prd-geodata-stack delete secret p2d2-geoserver-wfst-main
# Raster-Granules im Pod-PVC
kubectl --kubeconfig /home/pkoenig/.kube/p2d2-addon-installer.kubeconfig -n cc-prd-geodata-stack \
  exec geoserver-geoserver-<pod> -- rm -rf /opt/geoserver/data_dir/data/geotiffs/koeln
```

> **Offener Punkt (RBAC-Lücke für den Rückbau):** Der ServiceAccount besitzt **kein** `delete`-Recht auf `secrets`. Für den Rückbau der 6 Nutzer-Secrets müsste dieses Recht ergänzt werden; im Ist-Bestand wurde kein Secret-Rückbau durchgeführt.

## Struktur-Aufbau / REST-Referenz

Zusammenfassung der erprobten Endpunkte (Detail-Fallstricke siehe Lauf `2026-09-11-p2d2-addon-geoserver-manuelle-einrichtung`):

| # | Zweck | Methode + Endpunkt | Content-Type | Fallstrick |
|---|---|---|---|---|
| 1 | Workspace+Namespace | `POST /rest/namespaces` | JSON | erzeugt Workspace mit; separater Workspace-POST → 409 |
| 2 | Datastore | `POST /rest/workspaces/<ws>/datastores` | `text/xml` | `dbtype=postgis` zwingend |
| 3 | FeatureType | `POST …/datastores/<ds>/featuretypes` | `text/xml` | View = `nativeName`; leerer Body ≠ Fehler |
| 4 | Nutzer | `POST /rest/security/usergroup/users` | `text/xml` | JSON → HTTP 500 |
| 5 | Rolle | `POST /rest/security/roles/role/<name>` | — | Collection-POST → 405 |
| 6 | Rollen-Zuordnung | `POST …/roles/role/<r>/user/<u>` | — | idempotent (200) |
| 7 | ACL-Layer | `POST /rest/security/acl/layers` | JSON | „add-only" → 409 bei existierender Regel |
| 8 | ACL-Service | `POST /rest/security/acl/services` | JSON | doppelt → 409 |
| 9 | Einzelregel löschen | `DELETE /rest/security/acl/layers/<rule>` | — | für Idempotenz vor Schritt 7 nutzbar |

## GeoTIFF-Mosaic-Baustein (Friedhofspläne Köln)

Additiver Rasterlayer `friedhoefe_koeln` im Workspace `friedhofsplaene` (ImageMosaic, EPSG:25832, 1 Band grayscale).

### Dateiverteilung

Die 3 TIFFs (1,9/53/111 MB) + 8 Sidecar-Dateien (~163 MB) werden **per `kubectl cp`** ins Pod-PVC `/opt/geoserver/data_dir/data/geotiffs/koeln/` verteilt – **nicht** über die GeoServer-Resource-REST-API, da der nginx/APISIX-Ingress den Request-Body auf ~1 MB begrenzt (TIFFs → HTTP 413).

### REST-Aufrufe (Mosaic)

```bash
# Workspace + Namespace
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X POST \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/namespaces' \
  -d '{"namespace":{"prefix":"friedhofsplaene","uri":"urn:data-dna:tiffdata"}}'
# Coveragestore (legt KEINE Coverage an)
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X POST \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/coveragestores' \
  -d '{"coverageStore":{"name":"friedhofsplaene_koeln_mosaic","type":"ImageMosaic","url":"file:data/geotiffs/koeln"}}'
# Coverage (explizit)
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X POST \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/coveragestores/friedhofsplaene_koeln_mosaic/coverages' \
  -d '{"coverage":{"name":"friedhoefe_koeln","nativeCoverageName":"koeln","title":"Kölner Friedhöfe","srs":"EPSG:25832","projectionPolicy":"REPROJECT_TO_DECLARED"}}'
# Kernparameter (Feld heisst metadata, NICHT parameters)
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X PUT \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/coveragestores/friedhofsplaene_koeln_mosaic' \
  -d '{"coverageStore":{"metadata":{"MergeBehavior":"FLAT","SUGGESTED_TILE_SIZE":"512,512","FootprintBehavior":"Transparent","ExcessGranuleRemoval":"NONE","USE_JAI_IMAGEREAD":"true","RescalePixels":"true","AllowMultithreading":"false"}}}'
# ACL (offen lesen)
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X POST \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/security/acl/layers' \
  -d '{"friedhofsplaene.friedhoefe_koeln.r":"ROLE_ANONYMOUS,ROLE_AUTHENTICATED,ADMIN"}'
```

### Style `friedhofsplan_transparent` (Nachtrag)

Workspace-gebundener Style, der den Alphakanal freigibt (`opacity=0` auf Weiß):

```bash
# Style-Ressource anlegen
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X POST \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/styles?name=friedhofsplan_transparent' \
  -d '{"style":{"name":"friedhofsplan_transparent","filename":"friedhofsplan_transparent.sld"}}'
# SLD hochladen
curl -s -u 'admin:<pw>' -H 'Content-Type: application/vnd.ogc.sld+xml' -X PUT \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/workspaces/friedhofsplaene/styles/friedhofsplan_transparent' \
  --data-binary @friedhofsplan_transparent.sld
# Als Layer-defaultStyle setzen
curl -s -u 'admin:<pw>' -H 'Content-Type: application/json' -X PUT \
  'https://geoportal.udp.data-dna.eu/geoserver/rest/layers/friedhofsplaene:friedhoefe_koeln' \
  -d '{"layer":{"defaultStyle":{"name":"friedhofsplan_transparent"}}}'
```

> GeoServer 2.28.x akzeptiert **keine** 8-stelligen RGBA-Hex-Farben (`#FFFFFF00`); Transparenz wird über das separate `opacity`-Attribut im SLD erreicht.

## Rollenmodell / Passwörter

### Nutzer und Rollen

| Nutzer | Rolle(n) | Zweck |
|---|---|---|
| `p2d2_wfst_main` | `P2D2_IMPORT_ROLE` + `P2D2_WFST_MAIN` | WFS-T + Import |
| `p2d2_wfst_develop` | `P2D2_WFST_DEVELOP` | WFS-T |
| `p2d2_wfst_de1` | `P2D2_WFST_DE1` | WFS-T |
| `p2d2_wfst_de2` | `P2D2_WFST_DE2` | WFS-T |
| `p2d2_wfst_fv` | `P2D2_WFST_FV` | WFS-T |
| `p2d2_wfs_user` | `WFS-USER` | read-only |

Die WFS-T-Nutzer schreiben ausschließlich in die `*_versionen`-Tabellen ihres eigenen Workspace (Cross-Branch-Schreibzugriff wird abgelehnt). `graeber`/`grabflure` (Views) sind read-only.

### Passwort-/Secret-Status

- **GeoServer-Nutzer-Passwörter** liegen als k8s-Secrets in `cc-prd-geodata-stack` (Key `password`), zufällig generiert – nicht als `changeme-*`.
- **Datastore-DB-Passwörter** sind weiterhin die `changeme-*`-Platzhalter der DB-Rollen aus dem PostgreSQL-Lauf (`changeme-main`, `changeme-develop`, `changeme-de1`, `changeme-de2`, `changeme-fv`). Die **echte Passwort-Rotation** (DB-Rollen) ist ein separater, noch offener Schritt (Phase 2).

## Status Quo (verifiziert)

| Prüfpunkt | Ergebnis |
|---|---|
| Workspaces | `main`, `dev`, `de1`, `de2`, `fv`, `friedhofsplaene` (+ `ds_open_data` unverändert) |
| Datastores | `main_pg`, `dev_pg`, `de1_pg`, `de2_pg`, `fv_pg` |
| FeatureTypes | 5 je Workspace (25), Namen exakt wie dokumentiert |
| Nutzer | 6 p2d2-Nutzer (`p2d2_wfs_user`, `p2d2_wfst_de1/de2/develop/fv/main`) |
| Rollen | 7 p2d2-Rollen (`P2D2_IMPORT_ROLE`, `P2D2_WFST_*` ×5, `WFS-USER`) |
| ACL-Layer-Regeln | 51 nicht-globale Regeln (50 Vektor + 1 Mosaic-Read) |
| Service-Regel | `wfs.Transaction` → 6 Rollen |
| Coveragestore | `friedhofsplaene_koeln_mosaic` |
| Style | `friedhofsplan_transparent` vorhanden + `defaultStyle` des Layers |
| Mosaic-`GetCapabilities`/`GetMap` | HTTP 200, Layer abrufbar (GetMap: PNG) |

## Bekannte offene Fragen / Risiken

- **Negativtest-Status (200 „read-only" vs. 403):** GeoServer meldet Layer-Schreibverweigerung als WFS-Exception „`… is read-only`" (HTTP 200), nicht als HTTP 403. Die Ablehnung ist wirksam; falls zwingend 403 gewünscht, ist das auf APISIX-/Proxy-Ebene zu lösen, nicht ACL-seitig.
- **DB-Rollen-Passwörter (`changeme-*`):** Datastore-Verbindung nutzt die Platzhalter aus dem PostgreSQL-Lauf; Rotation ist Phase 2.
- **`geoserver.<DOMAIN>`:** selbstsigniertes Zertifikat – ausschließlich `geoportal.<DOMAIN>/geoserver` verwenden.
- **Ingress-Body-Limit (~1 MB):** große Raster-Granules nur per `kubectl cp`, nicht über die REST-API.
- **RBAC ohne `secrets delete`:** für einen vollständigen Rückbau (Secret-Löschung) fehlt das `delete`-Recht auf `secrets`; im Ist-Bestand nicht benötigt.

## Fragmente zum künftigen Installationsskript (Entwurfsfragment)

```text
# Grundidee
portable JSON/XML-Payloads + dünner Orchestrierungs-Layer
  (Secret lesen → Payload rendern → REST-Call → verifizieren)

# Zu adressierende Punkte
1) Idempotenz: ACL "add-only" → GET-vorher-Diff; 409/201-Toleranz als Muster.
2) Content-Type-Disziplin: Nutzer nur XML, Datastore/FeatureType XML, ACL/Namespace JSON.
3) Raster-Dateien: nie über REST (Ingress-Limit) → kubectl cp oder PVC-Mount/Job.
4) ImageMosaic-Parameter: Feld "metadata" (nicht "parameters"); Coverage explizit anlegen.
5) Secrets: Passwörter generieren + als k8s-Secrets ablegen; DB-Passwörter aus Phase-2-Rotation.
6) Verifikation als Asserts: Read 200, Positiv-Write (totalInserted=1 mit echtem grab_id),
   Negativ-Write (Ablehnung "read-only" ODER 403), GetCapabilities/GetMap.
```

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-17 | Erste Fassung Modul 2 (GeoServer): Workspaces/Datastores/FeatureTypes, Nutzer/Rollen, ACL, GeoTIFF-Mosaic, Style, Rückbau, RBAC-Scope, offene Fragen, Skript-Fragmente. |
