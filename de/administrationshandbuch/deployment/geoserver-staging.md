---
title: GeoServer-Staging für p2d2 einrichten
quality:
  completeness: 20
  accuracy: 20
  reviewed: false
  reviewer:
  reviewDate:
---

# GeoServer-Staging für p2d2

Diese Seite beschreibt, wie der GeoServer in das p2d2‑Staging-Konzept eingebunden wird: von Workspaces und Datastores über Layer/FeatureTypes und WFS‑T‑User bis zu automatisierten Lese-/Schreibtests.

Die Beschreibung orientiert sich an folgenden Shell‑Skripten:

- `p2d2_geoserver_staging_setup.sh` (Workspaces, Datastores, Basis‑ACL)
- `p2d2_geoserver_layer_staging.sh` (FeatureTypes, WFS‑Services je Workspace)
- `p2d2_geoserver_wfst_staging_users.sh` (WFS‑T‑User, Rollen, ACL‑Anpassungen)
- `p2d2-geoserver-wfs-usertest.sh` (End‑to‑End‑Lese-/Schreibtests)

## 1. Voraussetzungen

Bevor GeoServer gestaged wird, müssen die Datenbank‑Objekte vorhanden sein:

- PostgreSQL‑Schemata für die Stages: `p2d2`, `p2d2_develop`, `p2d2_de1`, `p2d2_de2`, `p2d2_fv`
- Rollen/DB‑User mit Schema‑Rechten, z.B.:
  - `P2D2-Develop` → Schema `p2d2_develop`
  - `P2D2-DE1` → Schema `p2d2_de1`
  - `P2D2-DE2` → Schema `p2d2_de2`
  - `P2D2-FV` → Schema `p2d2_fv`
- Tabellen in allen relevanten Schemata:
  - `p2d2_containers`
  - `p2d2_graeber`

Die DB‑Passwörter werden **nicht** im Skript hinterlegt, sondern aus `.env` oder einem Vault in die Umgebung geladen.

## 2. Workspaces und Datastores

Skript: `p2d2_geoserver_staging_setup.sh`

Ziel dieses Schritts:

- je Stage einen GeoServer‑Workspace
- je Workspace PostGIS‑Datastores für `p2d2_containers` und `p2d2_graeber`
- erste, grobe Read‑/Write‑ACLs auf Workspace‑Ebene

### 2.1 Konfiguration

Wichtige Variablen im Skript:

```bash
GSURL="http://p2d2-geoserver:8080/geoserver/rest"
GSAUTH="admin:GEOSERVER_ADMIN_PASSWORT"

DB_HOST="192.168.122.110"
DB_PORT="5432"
DB_NAME="data-dna"
NAMESPACE="urn:data-dna:govdata"

PW_DEVELOP="PASSWORT_P2D2_DEVELOP"
PW_DE1="PASSWORT_P2D2_DE1"
PW_DE2="PASSWORT_P2D2_DE2"
PW_FV="PASSWORT_P2D2_FV"
```

Die Passwörter werden vor dem Aufruf sinnvollerweise über die Umgebung gesetzt und im Skript nur referenziert.

### 2.2 Workspaces anlegen

Funktion:

```bash
create_workspace() {
  local WS=$1
  curl -sf -u "$GSAUTH" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"workspace\":{\"name\":\"${WS}\"}}" \
    "$GSURL/workspaces"
}
```

Aufruf im `main()`:

- `Verwaltungsdaten_develop`
- `Verwaltungsdaten_de1`
- `Verwaltungsdaten_de2`
- `Verwaltungsdaten_fv`

Damit sind die Staging‑Workspaces im GeoServer angelegt.

### 2.3 Datastores pro Workspace

Funktion:

```bash
create_datastore() {
  local WS=$1     # Workspace-Name
  local DS=$2     # Datastore-Name
  local SCHEMA=$3 # PostgreSQL-Schema
  local DBUSER=$4 # PostgreSQL-User
  local DBPASS=$5 # Passwort
  local DESC=$6   # Beschreibung

  curl -sf -u "$GSAUTH" -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "dataStore": {
        "name": "'"${DS}"'",
        "description": "'"${DESC}"'",
        "type": "PostGIS",
        "enabled": true,
        "workspace": { "name": "'"${WS}"'" },
        "connectionParameters": { "entry": [
          {"@key": "dbtype",    "$": "postgis"},
          {"@key": "host",      "$": "'"${DB_HOST}"'"},
          {"@key": "port",      "$": "'"${DB_PORT}"'"},
          {"@key": "database",  "$": "'"${DB_NAME}"'"},
          {"@key": "schema",    "$": "'"${SCHEMA}"'"},
          {"@key": "user",      "$": "'"${DBUSER}"'"},
          {"@key": "passwd",    "$": "'"${DBPASS}"'"},
          {"@key": "namespace", "$": "'"${NAMESPACE}"'"},
          ...
        ]}
      }
    }' \
    "$GSURL/workspaces/${WS}/datastores"
}
```

Je Workspace werden angelegt:

- Datastore `p2d2_containers` (Schema‑Bindung auf die jeweilige Stage)
- Datastore `p2d2_graeber`
- in `Verwaltungsdaten_de1` zusätzlich `cologne_cemeteries`

### 2.4 Erste Layer‑ACLs

Funktion:

```bash
set_security_rules() {
  local WS=$1
  curl -sf -u "$GSAUTH" -X POST \
    -H "Content-Type: application/json" \
    -d "{
      \"${WS}.*.r\": \"P2D2_IMPORT_ROLE,WFS-USER,ADMIN\",
      \"${WS}.*.w\": \"P2D2_IMPORT_ROLE,ADMIN\",
      \"${WS}.*.a\": \"ADMIN\",
      \"${WS}.p2d2_containers.r\": \"P2D2_IMPORT_ROLE,WFS-USER,ROLE_ANONYMOUS\",
      \"${WS}.p2d2_containers.w\": \"P2D2_IMPORT_ROLE\",
      \"${WS}.p2d2_graeber.r\": \"P2D2_IMPORT_ROLE,ROLE_AUTHENTICATED,WFS-USER,ROLE_ANONYMOUS\"
    }" \
    "$GSURL/security/acl/layers"
}
```

Diese ACLs sind der Ausgangspunkt; die Workspace‑spezifische WFS‑T‑Feinsteuerung kommt später über ein eigenes Security‑Skript.

## 3. FeatureTypes und WFS‑Dienste pro Workspace

Skript (aus dem Chat extrahiert): `p2d2_geoserver_layer_staging.sh`

Ziel:

- Die Tabellen `p2d2_containers` und `p2d2_graeber` in allen Staging‑Workspaces als Layer (FeatureTypes) veröffentlichen.
- Pro Workspace einen eigenen WFS‑Dienst konfigurieren.

### 3.1 FeatureTypes

Funktion (vereinfacht):

```bash
publish_featuretype() {
  local WS=$1
  local DS=$2
  local FT=$3
  local TITLE=$4
  local DESC=$5
  local SRS=${6:-"EPSG:4326"}

  curl -sf -u "$GSAUTH" -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "featureType": {
        "name": "'"${FT}"'",
        "nativeName": "'"${FT}"'",
        "title": "'"${TITLE}"'",
        "abstract": "'"${DESC}"'",
        "srs": "'"${SRS}"'",
        "enabled": true,
        "advertised": true,
        "nativeBoundingBox": {
          "minx": 5.866, "maxx": 15.042,
          "miny": 47.270, "maxy": 55.058,
          "crs": "EPSG:4326"
        },
        "latLonBoundingBox": {
          "minx": 5.866, "maxx": 15.042,
          "miny": 47.270, "maxy": 55.058,
          "crs": "EPSG:4326"
        }
      }
    }' \
    "$GSURL/workspaces/${WS}/datastores/${DS}/featuretypes"
}
```

Aufrufe:

- pro Workspace:
  - `publish_featuretype WS p2d2_containers p2d2_containers ...`
  - `publish_featuretype WS p2d2_graeber p2d2_graeber ...`

Damit sind die Layer in WMS/WFS sichtbar.

### 3.2 WFS‑Service je Workspace

Versuche im Skript:

- REST‑Endpoint: `/rest/services/wfs/workspaces/{WS}`  
- Ziel: `serviceLevel: COMPLETE` und eigene Titel/Name pro Stage.

Die praktische Erkenntnis aus den Tests: der Workspace‑spezifische WFS‑Endpoint war in der Kombination aus GeoServer‑Version und REST‑API nicht zuverlässig nutzbar (404, 400, NullPointerException bei `getServiceLevel()`), insbesondere beim Versuch, Einträge neu anzulegen.

**Empfehlung für zukünftige Skripte:**

- globalen WFS‑Service (`/rest/services/wfs`) auslesen und als Referenz verwenden
- wenn die REST‑API workspace‑spezifische WFS‑Services sicher unterstützt:
  - POST nur für **neue** Einträge
  - PUT nur für **existierende** Einträge
- wenn das nicht zuverlässig ist:
  - bewusst dokumentierter Fallback über `wfs.xml` im GeoServer‑Datadir (Basis‑Workspace → Staging‑Workspaces kopieren, `serviceLevel` etc. übernehmen)
  - nie „im Vorbeigehen“ im CI, sondern mit explizitem Hinweis in der Doku

In der konkreten p2d2‑Instanz haben wir am Ende den Fokus auf globalen WFS‑Service + korrekte Workspaces/Layer gelegt; der NullPointerException‑Bug war auf unvollständige WFS‑Workspace‑Konfiguration zurückzuführen und wurde mit einem vollständigen `wfs`‑Body (inkl. `serviceLevel`) behoben.

## 4. WFS‑T‑User, Rollen und ACLs

Skript: `p2d2_geoserver_wfst_staging_users.sh` (aus `geoserver_wfs_03.md`)

Ziel:

- pro Stage einen eigenen WFS‑T‑User und eine eigene Rolle
- Workspace‑spezifische Schreibrechte nur für den eigenen Stage‑Workspace
- die bestehende Produktionsrolle `P2D2_IMPORT_ROLE` und `p2d2_wfst_user` unangetastet lassen

### 4.1 Rollen und User

Typisches Muster:

```bash
# Rollen anlegen
createrole() {
  local ROLE=$1
  curl -sf -u "$GSAUTH" -X POST \
    -H "Content-Type: application/json" \
    "$GSURL/security/roles/role/${ROLE}"
}

# User anlegen
createuser() {
  local USERNAME=$1
  local PASSWORD=$2
  curl -sf -u "$GSAUTH" -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "user": {
        "userName": "'"${USERNAME}"'",
        "password": "'"${PASSWORD}"'",
        "enabled": true
      }
    }' \
    "$GSURL/security/usergroup/users"
}

# Rolle zuweisen
assignrole() {
  local USERNAME=$1
  local ROLE=$2
  curl -sf -u "$GSAUTH" -X POST \
    "$GSURL/security/roles/role/${ROLE}/user/${USERNAME}"
}
```

Konkrete Kombos:

- `P2D2_WFST_DEVELOP` → `p2d2_wfst_develop`
- `P2D2_WFST_DE1` → `p2d2_wfst_de1`
- `P2D2_WFST_DE2` → `p2d2_wfst_de2`
- `P2D2_WFST_FV` → `p2d2_wfst_fv`

Passwörter kommen aus:

```bash
PW_DEVELOP="${WFST_PW_DEVELOP:?Bitte WFST_PW_DEVELOP setzen}"
PW_DE1="${WFST_PW_DE1:?Bitte WFST_PW_DE1 setzen}"
PW_DE2="${WFST_PW_DE2:?Bitte WFST_PW_DE2 setzen}"
PW_FV="${WFST_PW_FV:?Bitte WFST_PW_FV setzen}"
```

### 4.2 ACL‑Regeln pro Workspace

Die ACL‑Anpassung erweitert die bestehenden `P2D2_IMPORT_ROLE`‑Regeln um die neuen Rollen. Wichtig war hier die Unterscheidung:

- POST: nur für **neue** Keys
- PUT: nur für **existierende** Keys

Beispiel PUT‑Body (Update existierender `*.w`‑Regeln):

```bash
{
  "Verwaltungsdaten_de1.*.w":       "P2D2_IMPORT_ROLE,P2D2_WFST_DE1,ADMIN",
  "Verwaltungsdaten_de2.*.w":       "P2D2_IMPORT_ROLE,P2D2_WFST_DE2,ADMIN",
  "Verwaltungsdaten_develop.*.w":   "P2D2_IMPORT_ROLE,P2D2_WFST_DEVELOP,ADMIN",
  "Verwaltungsdaten_fv.*.w":        "P2D2_IMPORT_ROLE,P2D2_WFST_FV,ADMIN"
}
```

und POST‑Bodies nur für noch nicht existierende, feingranulare Regeln wie:

```bash
{
  "Verwaltungsdaten_de1.p2d2_graeber.w":    "P2D2_IMPORT_ROLE,P2D2_WFST_DE1",
  "Verwaltungsdaten_de2.p2d2_graeber.w":    "P2D2_IMPORT_ROLE,P2D2_WFST_DE2",
  "Verwaltungsdaten_develop.p2d2_graeber.w":"P2D2_IMPORT_ROLE,P2D2_WFST_DEVELOP",
  "Verwaltungsdaten_fv.p2d2_graeber.w":     "P2D2_IMPORT_ROLE,P2D2_WFST_FV"
}
```

Konfliktbilder:

- `Already existing rules` → POST musste gesplittet werden und die bereits existierenden Keys durften nicht erneut per POST kommen.
- `Unknown rules` → PUT durfte nur Keys enthalten, die GeoServer schon kannte.

Die finale Version des Security‑Skripts spiegelt diese Logik wider.

## 5. End‑to‑End‑Lese-/Schreibtests

Skript: `p2d2-geoserver-wfs-usertest.sh`

Ziel:

- pro User/Workspace:
  - `GetCapabilities`
  - `GetFeature` auf `p2d2_graeber`
  - leere WFS‑T‑Transaction
- einfache Isolationstests (kein Schreibzugriff auf fremde Workspaces)

### 5.1 User‑Konfiguration

```bash
GSBASE="http://192.168.122.112:8080/geoserver"

USERS=(
  "p2d2_wfst_user|WFST_PW_MAIN|Verwaltungsdaten"
  "p2d2_wfst_develop|WFST_PW_DEVELOP|Verwaltungsdaten_develop"
  "p2d2_wfst_de1|WFST_PW_DE1|Verwaltungsdaten_de1"
  "p2d2_wfst_de2|WFST_PW_DE2|Verwaltungsdaten_de2"
  "p2d2_wfst_fv|WFST_PW_FV|Verwaltungsdaten_fv"
)
```

`check_env()` stellt sicher, dass alle `WFST_PW_*`‑Variablen gesetzt sind.

### 5.2 Lese‑Tests

- `GetCapabilities`
- `GetFeature` mit JSON‑Auswertung von `numberReturned` und `numberMatched`

Dadurch lässt sich schnell prüfen, ob:

- der WFS‑Service pro Workspace funktioniert
- die Layer `p2d2_graeber` publiziert und ansprechbar sind
- die ACLs Leserechte korrekt abbilden

### 5.3 Schreib‑Tests

- Leere `Transaction` pro Workspace:
  - Ziel: prüft, ob WFS‑T grundsätzlich aktiviert ist und die ACLs Schreibrechte zulassen
  - Ergebnis im Testskript: 200 + `TransactionResponse`, `totalInserted=0` erwartet im eigenen Workspace

- Isolationstest (Schreibzugriff in fremde Workspaces):
  - aktuell im Skript als leere `Transaction` implementiert
  - leere Transaction wird teilweise mit 200 und `totalInserted=0` beantwortet, was kein echter Schreibvorgang ist
  - für eine robuste Isolation wäre ein Dummy‑Insert mit minimal gültigem Feature‑Payload sinnvoll, der dann entweder an Schema‑ oder ACL‑Prüfung scheitert, aber niemals zu `totalInserted>0` führen darf

### 5.4 Aufruf

Beispiel:

```bash
export WFST_PW_MAIN='…'
export WFST_PW_DEVELOP='…'
export WFST_PW_DE1='…'
export WFST_PW_DE2='…'
export WFST_PW_FV='…'

chmod +x p2d2-geoserver-wfs-usertest.sh
./p2d2-geoserver-wfs-usertest.sh
```

Das Skript gibt pro User/Workspace einen Block mit den HTTP‑Statuscodes und ggf. Fehlermeldungen (`ExceptionText`) aus.

## 6. Empfohlene Reihenfolge in der Praxis

Für zukünftige Iterationen und Team‑Onboarding empfiehlt sich folgende, saubere Reihenfolge:

1. **DB‑Staging bereitstellen**
   - Schemen, Rollen, Tabellen.
2. **Skript A: Workspaces + Datastores**
   - `p2d2_geoserver_staging_setup.sh`
   - nur Workspaces, Datastores und grobe Read‑ACLs.
3. **Skript B: FeatureTypes + WFS‑Dienste**
   - `p2d2_geoserver_layer_staging.sh`
   - FeatureTypes für `p2d2_containers`, `p2d2_graeber`
   - WFS‑Service je Workspace mit konsistentem `serviceLevel`.
4. **Skript C: WFS‑T‑User + ACL‑Feinsteuerung**
   - `p2d2_geoserver_wfst_staging_users.sh`
   - neue Rollen, User, workspace‑spezifische `.w`‑Regeln.
5. **Skript D: Lese-/Schreibtests**
   - `p2d2-geoserver-wfs-usertest.sh`
   - pro User/Workspace Lesen + leere Transaction
   - Isolationstest (optional verschärft mit Dummy‑Insert).

Diese Struktur hält die Verantwortung je Skript klar getrennt und erleichtert sowohl CI/CD‑Automatisierung als auch manuelle Fehleranalyse.
