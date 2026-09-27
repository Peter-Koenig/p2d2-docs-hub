---
title: "p2d2-AddOn – MapProxy (03)"
description: Was das p2d2-AddOn-Installationsskript für die MapProxy-Komponente tut – eigener Pod, Image-Build, K8s-Ressourcen, APISIX-Routing /mapserver, Rückbau und bekannte Fallstricke
quality:
  completeness: 70
  accuracy: 85
  reviewed: false
  reviewer:
  reviewDate:
---

# 03 – MapProxy

Modul `addon_20_mapproxy.sh`, Funktionen `install_addon_mapproxy` und `uninstall_addon_mapproxy`.

## Was das Skript tut (Schritt für Schritt)

Das Modul stellt einen **eigenen MapProxy-Pod** im GeoData-Namespace bereit und exponiert ihn über **APISIX** unter dem Pfad `/mapserver`.

1. **Image-Build** (auf dem k3s-Node, `docker build` + `docker save | k3s ctr -n k8s.io images import -`; Image `mapproxy:v1s-2026-09-12`). Im Skript als **TODO** markiert
   (separater Build-Schritt/Job).
2. **K8s-Ressourcen** (`ConfigMap mapproxy-config` mit Key `mapproxy.yaml`, `PVC mapproxy-cache`, `Service mapproxy` `:8080`, `Deployment mapproxy`). Im Skript als **TODO** markiert
   (Manifeste aus `p2d2-civitas-addon/tmp/` nach `overlay_addon_V1s/k8s/` überführen).
3. **APISIX-Routing `/mapserver`** (Admin-API): Upstream `mapserver-upstream` (`mapproxy.<ns>.svc.cluster.local:8080`) + Route `mapserver-route` (uri `/mapserver*`) mit
   `proxy-rewrite` `regex_uri ["^/mapserver(.*)","$1"]`. Im Skript als **TODO** markiert.
4. **Rückbau:** löscht Deployment/Service/ConfigMap/PVC `mapproxy*` und die APISIX-Objekte `mapserver-route` + `mapserver-upstream` per Admin-API (Name-basierte ID-Ermittlung,
   `_mapproxy_apisix_delete_by_name`); Admin-Key aus `APISIX_ADMIN_ROLE_KEY` in `/root/civitas-install/credentials.env`.

> **Entwicklungsstand (rudimentär):** Alle drei Install-Schritte sind im Skript als **TODO**-Platzhalter geführt. Die konkret verifizierte manuelle Umsetzung steht unten
> bzw. in `mapproxy-automatisierungshinweise.md` (ai-runs).

## Ausgangslage (vorausgesetzt)

- k3s-Cluster mit `docker`/`k3s ctr` auf dem Node für den lokalen Image-Build/-Import (Node `civitas-core-v1s`).
- APISIX läuft (Admin-API `https://api-admin.<domain>/apisix/admin`), Admin-Key liegt in `/root/civitas-install/credentials.env` (`APISIX_ADMIN_ROLE_KEY`).
- GeoServer-Komponente (Modul 10) hat das ImageMosaic `friedhofsplaene:friedhoefe_<stadt>` angelegt (MapProxy cacht diese WMS-Layer).

## Zielergebnis

MapProxy-Pod (`mapproxy`, Replicas 1, Image `mapproxy:v1s-2026-09-12`, `IfNotPresent`) mit Cache-PVC (`mapproxy-cache`, 1 Gi, `/cache_data`), öffentlich erreichbar unter
`https://geoportal.<domain>/mapserver/...` über die APISIX-Route `mapserver-route`.

## Manuelle Installation / Troubleshooting

Aus der früheren manuellen Installation (verifiziert):

- **Image aus Quellen** (`p2d2-civitas-addon/tmp/mapproxy-build/`): MapProxy 4.0.2 + Gunicorn 23.0.0 auf `python:3.13-slim`; node-lokaler Import (kein Remote-Registry-Push).
- **Config-Adaption** gegenüber Standalone: GeoServer-WMS-URL auf `http://geoserver-geoserver.cc-prd-geodata-stack.svc.cluster.local/geoserver/wms`, `styles: "friedhofsplan_transparent"`,
  `transparent: true`, Cache-Verzeichnisse auf PVC `/cache_data`.
- **Drei publizierte Layer:** `p2d2_osm` (OSM-Hintergrund), `p2d2_cemeteries_overview` und `p2d2_cemeteries_details` (WMS-Caches auf `friedhofsplaene:friedhoefe_koeln`).
- **APISIX-Routing** (Reihenfolge): 1) Upstream `mapserver-upstream`, 2) Route `mapserver-route` (uri `/mapserver*`), 3) `proxy-rewrite` mit `regex_uri ["^/mapserver(.*)","$1"]`
  (Präfix **vollständig und ohne führenden Slash** strippen).
- **Zugriff:** unauthentifiziert (kein `openid-connect`-Plugin; die WMS-Quelle ist in GeoServer öffentlich lesbar).

## Bekannte Fallstricke

- **Node-lokaler Image-Import:** bei Re-Scheduling auf einen anderen Node ohne das Image greift `IfNotPresent` ins Leere → für Lauf 2 interne Registry (oder Image auf alle Nodes).
  Zudem ist der Import nicht sauber rückbaubar (`k3s ctr -n k8s.io images rm` nur manuell auf dem Node).
- **`proxy-rewrite`-Semantik:** das Standard-Template passt nicht 1:1; der Präfix muss ohne führenden Slash gestrippt werden (`"$1"`, nicht `"/$1"`).
- **OSM-Tile-Quelle (`tile.openstreetmap.org`):** erfordert ausgehenden Internet-Zugriff vom Pod; Nutzungsbedingungen/Offline-Alternative klären.
- **APISIX-Idempotenz:** vor `POST` per `GET` + Name-Match prüfen; APISIX vergibt sonst numerische IDs (beim Löschen daher Name → ID auflösen).
- **`DOMAIN` = `udp.<DOMAIN_NAME>`** (Präfix `udp.` nicht vergessen).
