---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Manuelle Installation: MapProxy"
description: Manuell durchgeführte MapProxy-Installation des p2d2-AddOns – eigener Pod im GeoData-Namespace, Image aus Quellen, Config-Adaption, APISIX-Routing /mapserver, Rückbau und offene Fragen
quality:
  completeness: 80
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# MapProxy

Diese Seite dokumentiert Modul 3 der manuellen p2d2-AddOn-Installation: den MapProxy-Pod als WMS/WMTS/TMS-Cache-Proxy vor dem GeoServer. Der beschriebene Zustand wurde gegen die laufende Umgebung verifiziert (siehe „Status Quo").

## Ausgangslage

- MapProxy wird als **eigener Deployment/Pod** im GeoData-Namespace `cc-prd-geodata-stack` betrieben (geteilter Cluster, additiv zum bestehenden GeoServer/Masterportal/portal-backend).
- Image: eigenes Image **aus den Quellen** `mapproxy:v1s-2026-09-12` (MapProxy 4.0.2 + Gunicorn 23.0.0 auf `python:3.13-slim`), node-lokal importiert (kein Push in eine Remote-Registry).
- Drei publizierte Layer: `p2d2_osm` (OSM-Hintergrund), `p2d2_cemeteries_overview` und `p2d2_cemeteries_details` (beide auf GeoServer-ImageMosaic `friedhofsplaene:friedhoefe_koeln`).
- Exponierung: **kein** eigener K8s-Ingress pro Stack. Host-/Pfad-Routing macht **APISIX** (Admin-API) über den öffentlichen Pfad `/mapserver`.

| Ressource | Name | Detail |
|---|---|---|
| ConfigMap | `mapproxy-config` | Key `mapproxy.yaml` |
| PVC | `mapproxy-cache` | 1 Gi, `local-path`, Mount `/cache_data` |
| Service | `mapproxy` | ClusterIP `:8080`, Selector `app=mapproxy` |
| Deployment | `mapproxy` | Replicas 1, Image `mapproxy:v1s-2026-09-12` (`IfNotPresent`) |

## Voraussetzungen (RBAC-Scope — Verifikation vs. künftige Ausführung)

**Wichtige Einordnung:** Die in dieser Dokumentationsphase genutzte scoped Kubeconfig `/home/pkoenig/.kube/p2d2-addon-installer.kubeconfig` (ServiceAccount `p2d2-addon-installer`) dient **ausschließlich der Verifikation**. Das spätere tatsächliche Installations-/Rückbau-Skript läuft **mit Root-Rechten auf der k3s-VM** (Standard-Kubeconfig `/etc/rancher/k3s/k3s.yaml`, de facto Cluster-Admin) und ist durch die scoped-SA-Rechte **nicht** beschränkt.

Daraus folgt: Einzelne fehlende Rechte der Test-SA (z. B. `secrets delete`) sind **keine Blocker/Lücken**, sondern reine Beobachtungen zur Verifikationsphase. Architektur-Entscheidungen (z. B. node-lokaler Image-Import statt interner Registry) sind davon getrennt zu betrachten.

Für die reine **Verifikation** dieses Moduls benötigt werden: `pods`/`deployments`/`services`/`configmaps`/`persistentvolumeclaims` lesen (`get/list`) – alle vorhanden.

## Manuelle Installation

### Schritt 1 – Image-Build (auf dem k3s-Node)

Der Build läuft **auf dem k3s-Node** (`civitas-core-v1s`), **nicht** auf `sdt`; der Container wird danach direkt in die lokale containerd-Registry des Nodes importiert (Namespace `k8s.io` ist **zwingend**, sonst `ImagePullBackOff`).

```bash
# Quellen: p2d2-civitas-addon/tmp/mapproxy-build/ (Dockerfile, wsgi.py, build-import.sh)
docker build -t mapproxy:v1s-2026-09-12 .
docker image save mapproxy:v1s-2026-09-12 | k3s ctr -n k8s.io images import -
```

Das Deployment referenziert das Image ohne Registry-Präfix (`mapproxy:v1s-2026-09-12`) mit `imagePullPolicy: IfNotPresent`.

### Schritt 2 – K8s-Ressourcen (Deployment/Service/PVC/ConfigMap)

```bash
kubectl apply -f p2d2-civitas-addon/tmp/mapproxy-deployment.yaml
# enthält: ConfigMap mapproxy-config, PVC mapproxy-cache, Service mapproxy, Deployment mapproxy
```

`kubectl apply` ist idempotent (Wiederholung unkritisch).

### Schritt 3 – Config-Adaption (`mapproxy.yaml`)

Quelle: Standalone `/srv/mapproxy/mapproxy.yaml` (Bestandsaufnahme). Anpassungen gegenüber Standalone:

| Aspekt | Standalone | Cluster |
|---|---|---|
| GeoServer-WMS-URL | `http://192.168.122.112:8080/geoserver/wms` | `http://geoserver-geoserver.cc-prd-geodata-stack.svc.cluster.local/geoserver/wms` |
| WMS-Quellen `styles` | — | `"friedhofsplan_transparent"` (GeoServer-Layer-`defaultStyle`) |
| WMS-Quellen `transparent` | — | `true` |
| Cache-Verzeichnisse | `/srv/mapproxy/cache_data/...` | PVC `/cache_data/...` |
| `globals.cache.base_dir` | `/srv/mapproxy/cache_data` | `/cache_data` |

Kern der beiden Cemetery-WMS-Quellen (identisch bis auf Grid/BBOX):

```yaml
sources:
  cemeteries_overview_wms:
    type: wms
    req:
      url: http://geoserver-geoserver.cc-prd-geodata-stack.svc.cluster.local/geoserver/wms
      layers: "friedhofsplaene:friedhoefe_koeln"
      styles: "friedhofsplan_transparent"
      transparent: true
    image:
      mode: RGBA
      transparent: true
```

### Schritt 4 – Style & Transparenz (GeoServer-seitig, siehe Modul 2)

Der Layer `friedhofsplaene:friedhoefe_koeln` trägt den Style `friedhofsplan_transparent` als `defaultStyle` (in Modul 2 nachgetragen). Transparenz kommt über `transparent=true` + diesen Style; `req.styles` wird von MapProxy nicht an GeoServer weitergereicht.

### Schritt 5 – APISIX-Routing (`/mapserver`)

Das Exponieren nach außen erfolgt über die APISIX-Admin-API (Upstream + Route), analog zum Muster `tasks/access/apis/add_api.yaml`. Der Pfad ist **`/mapserver`** (entspricht dem Feld `mapserverURL` in `masterportal_values.yaml`).

**Berechtigungsquelle:** APISIX-Admin-Key `APISIX_ADMIN_ROLE_KEY` aus `/root/civitas-install/credentials.env`; `DOMAIN` muss `udp.<DOMAIN_NAME>` sein (Präfix `udp.` nicht vergessen).

```bash
# 1. Upstream
curl -s -H 'X-API-KEY: <APISIX_ADMIN_ROLE_KEY>' -H 'Content-Type: application/json' \
  -X POST 'https://api-admin.udp.data-dna.eu/apisix/admin/upstreams' \
  -d '{"name":"mapserver-upstream","nodes":{"mapproxy.cc-prd-geodata-stack.svc.cluster.local:8080":1}}'

# 2. Route (uri /mapserver*, Upstream zuweisen)
curl -s -H 'X-API-KEY: <APISIX_ADMIN_ROLE_KEY>' -H 'Content-Type: application/json' \
  -X POST 'https://api-admin.udp.data-dna.eu/apisix/admin/routes' \
  -d '{"name":"mapserver-route","uri":"/mapserver*","upstream_id":"<upstream-id>","methods":["GET","POST","PUT","PATCH","DELETE"]}'

# 3. proxy-rewrite zum Präfix-Strippen (zwingend)
curl -s -H 'X-API-KEY: <APISIX_ADMIN_ROLE_KEY>' -H 'Content-Type: application/json' \
  -X PUT 'https://api-admin.udp.data-dna.eu/apisix/admin/routes/<route-id>' \
  -d '{"plugins":{"proxy-rewrite":{"regex_uri":["^/mapserver(.*)","$1"]}}}'
```

```text
Client → https://geoportal.udp.data-dna.eu/mapserver/...
       → APISIX-Route mapserver-route (uri /mapserver*)
          → proxy-rewrite.regex_uri ["^/mapserver(.*)", "$1"]   (Präfix entfernen)
             → Upstream mapserver-upstream → mapproxy.cc-prd-geodata-stack.svc.cluster.local:8080
```

**Wichtig:** Das Rewrite muss den Präfix **vollständig und ohne führenden Slash** entfernen (`"$1"`, nicht `"/$1"`), da MapProxy selbst nur `/service`, `/wmts/...`, `/tms/...` kennt.

### Wartezyklus / Idempotenz

- `kubectl apply` ist idempotent (Wiederholung unkritisch).
- APISIX-Upstream/Route: vor `POST` per `GET` + Name-Match prüfen, ob das Objekt bereits existiert (analog `add_api.yaml`).
- Node-lokaler Image-Import ist ein Einmal-Schritt; bei Re-Scheduling auf einen anderen Node ohne das Image greift `IfNotPresent` ins Leere.

## Rückbau

Rückbau in umgekehrter Reihenfolge (Route → Upstream → K8s-Ressourcen):

```bash
# APISIX-Route + Upstream (per Admin-API)
curl -s -H 'X-API-KEY: <APISIX_ADMIN_ROLE_KEY>' -X DELETE 'https://api-admin.udp.data-dna.eu/apisix/admin/routes/<route-id>'
curl -s -H 'X-API-KEY: <APISIX_ADMIN_ROLE_KEY>' -X DELETE 'https://api-admin.udp.data-dna.eu/apisix/admin/upstreams/<upstream-id>'

# K8s-Ressourcen
kubectl delete deployment mapproxy -n cc-prd-geodata-stack
kubectl delete service mapproxy -n cc-prd-geodata-stack
kubectl delete pvc mapproxy-cache -n cc-prd-geodata-stack
kubectl delete configmap mapproxy-config -n cc-prd-geodata-stack
```

> **Offener Punkt (Image):** Der node-lokale Image-Import (`docker save | k3s ctr images import`) ist **nicht sauber rückbaubar** — das Image liegt im containerd des Nodes und wird nicht über eine Registry versioniert. Ein „Image entfernen" ist nur manuell per `k3s ctr -n k8s.io images rm` auf dem Node möglich. Dies ist eine Architektur-Entscheidung für Lauf 2 (interne Registry).

## Struktur- / Config-Referenz

Die vollständige `mapproxy.yaml` (ConfigMap `mapproxy-config`) enthält:

- **3 Layer:** `p2d2_osm` (Tile-Source `osm_source` → `tile.openstreetmap.org`), `p2d2_cemeteries_overview`, `p2d2_cemeteries_details` (WMS-Caches auf `friedhofsplaene:friedhoefe_koeln`).
- **3 Caches:** `osm_cache` (Grid `osm_grid_3857`), `cemeteries_overview_cache` (Grid `cemeteries_overview_grid_25832`), `cemeteries_details_cache` (Grid `cemeteries_details_grid_25832`), alle file-basiert auf `/cache_data`.
- **3 Sources:** `osm_source` (tile), `cemeteries_overview_wms`, `cemeteries_details_wms` (wms, mit `styles` + `transparent`).
- **3 Grids:** `osm_grid_3857` (EPSG:3857), `cemeteries_overview_grid_25832`, `cemeteries_details_grid_25832` (EPSG:25832).

## Rollenmodell / Zugriff

- MapProxy ist **unauthentifiziert**: kein `openid-connect`-Plugin auf der APISIX-Route. Der öffentliche Pfad `/mapserver` ist ohne Authentifizierung erreichbar (verifiziert).
- Die WMS-Quelle `friedhofsplaene:friedhoefe_koeln` ist im GeoServer öffentlich lesbar (`ROLE_ANONYMOUS`), daher braucht MapProxy keine GeoServer-Credentials.

## Status Quo (verifiziert)

| Prüfpunkt | Ergebnis |
|---|---|
| Pod | `mapproxy-68574784cd-rlg6n` 1/1 Running |
| Deployment | `mapproxy` 1/1 ready, Image `mapproxy:v1s-2026-09-12` (`IfNotPresent`) |
| Service | `mapproxy` ClusterIP `:8080` |
| PVC | `mapproxy-cache` 1 Gi `local-path` Bound |
| ConfigMap | `mapproxy-config` (Key `mapproxy.yaml`, vollständig adaptiert) |
| Routing | öffentlich `/mapserver` → `GetCapabilities` 200, alle 3 Layer vorhanden |
| GetMap | `p2d2_cemeteries_overview`/`_details` HTTP 200 (PNG) |
| Transparenz | `tRNS`-Chunk bei `TRANSPARENT=true` vorhanden |
| Authentifizierung | unverändert unauthentifiziert (anonym erreichbar) |

## Bekannte offene Fragen / Risiken

- **Node-lokaler Image-Import vs. interne Registry:** bei Re-Scheduling auf einen anderen Node ohne das Image greift `IfNotPresent` ins Leere → für Lauf 2 interne Registry (oder Image auf alle Nodes).
- **OSM-Tile-Quelle (`tile.openstreetmap.org`):** erfordert ausgehenden Internet-Zugriff vom MapProxy-Pod; Nutzungsbedingungen/Offline-Alternative klären.
- **`api_rewrite_path`-Semantik:** das bestehende Route-Template passt nicht 1:1 auf MapProxy (Präfix vollständig ohne führenden Slash strippen) → eigenes Template nötig.
- **Kein `pods/log`** für die Test-SA → Logs nur via `kubectl exec … cat`; für die spätere Root-Ausführung unkritisch.

## Fragmente zum künftigen Installationsskript (Entwurfsfragment)

```text
# Grundidee
K8s-Manifeste (kubectl apply, idempotent) + APISIX-Routing über add_api.yaml-Mechanismus

# Zu adressierende Punkte
1) Image: node-lokaler Build/Import (docker build + save | k3s ctr import) bzw. Lauf 2 interne Registry.
2) ConfigMap mapproxy.yaml mit adaptierten Quellen (interne GeoServer-DNS, styles+transparent, PVC-Cache).
3) APISIX: Upstream + Route per Name-Match (GET vor POST); eigenes Route-Template mit
   regex_uri ["^/mapserver(.*)","$1"] (Präfix vollständig strippen).
4) APISIX-Admin-Key aus credentials.env (APISIX_ADMIN_ROLE_KEY); DOMAIN = udp.<DOMAIN_NAME>.
5) Verifikation als Asserts: GetCapabilities (200 + 3 Layer), GetMap beider Cemetery-Layer
   (200 + PNG), Transparenz-Check (tRNS bei TRANSPARENT=true).
```

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-17 | Erste Fassung Modul 3 (MapProxy): Image-Build, K8s-Ressourcen, Config-Adaption, Style/Transparenz, APISIX-Routing `/mapserver`, Rückbau, RBAC-Framing, offene Fragen, Skript-Fragmente. |
