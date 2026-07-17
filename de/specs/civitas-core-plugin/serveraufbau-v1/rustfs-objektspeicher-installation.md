---
title: RustFS-Objektspeicher-Installation
description: Installation und Betrieb von RustFS als eigenständige LXC
  außerhalb des k3s-Cluster-Lebenszyklus, inklusive Beispieldaten für
  portal-backend.
status: draft
lastUpdated: 2026-07-17
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-rustfs-objektspeicher-installation
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-vm-sizing-und-host-ressourcen
  - civitas-core-plugin-serveraufbau-portal-backend-objektspeicher
quality:
  completeness: 60
  accuracy: 85
  reviewed: false
  reviewer:
  reviewDate:
---

# RustFS-Objektspeicher-Installation

## Ziel

RustFS als S3-kompatiblen Objektspeicher für portal-backend bereitstellen.
Der Speicher wird auf einer eigenständigen LXC außerhalb des
k3s-Cluster-Lebenszyklus betrieben, sodass ein VM- oder Cluster-Neuaufbau
die Konfigurationsdaten nicht zerstört.

Die LXC wird manuell auf dem Proxmox-Knoten "civitas" provisioniert. Eine
spätere Automatisierung als Skriptmodul ist vorgesehen (siehe Offene Punkte).

---

## Architekturentscheidung: eigene LXC statt In-Cluster-Deployment

| Kriterium | Eigene LXC | In-Cluster (k3s) |
|---|---|---|
| Persistenz bei VM-Neuaufbau | ✅ Daten bleiben erhalten | ❌ `local-path`-Storage geht verloren |
| Unabhängigkeit vom Cluster | ✅ Kein k3s nötig | ❌ Cluster muss laufen |
| Wartungsaufwand | Gering (ein systemd-Dienst) | Mittel (Helm-Chart, Operator) |
| S3-Kompatibilität | ✅ RustFS | ✅ MinIO (aber archiviert) |

**Begründung:** MinIO (`minio/minio`) wurde im April 2026 archiviert.
RustFS wird als S3-kompatibler Ersatz auf einer separaten LXC
(IP `192.168.12.140`) betrieben, entkoppelt vom k3s-Cluster-Lebenszyklus.
Die LXC ist damit unabhängig von VM-Neuaufbauten der CIVITAS/CORE-VM.

---

## LXC-Sizing und Pakete

| Parameter | Wert |
|---|---|
| vCPU | 2 |
| RAM | 2 GiB |
| Disk | 20 GiB (SSD, thin-provisioned) |
| OS | Debian 13 (Trixie) — minimale LXC ohne Desktop |
| IP (statisch) | `192.168.12.140/24` |
| Gateway | `192.168.12.1` |
| S3-API-Port | `9000` |
| Konsole (Web-UI) | `9001` |

**Erforderliche Pakete:**

```bash
apt-get update
apt-get install -y unzip curl
```

> **Hinweis:** `systemd` ist bei Debian-LXC standardmäßig vorhanden und wird
> für den RustFS-Daemon benötigt.

**Installation:**

```bash
curl -fsSL https://rustfs.com/install.sh | sh
```

Das offizielle Quick-Start-Skript `install_rustfs.sh` lädt die aktuelle
RustFS-Version herunter, entpackt sie und installiert den systemd-Dienst.

**Port-Freigabe (OPNsense):**

- Keine externe Freigabe nötig — die LXC ist nur im SOHO-VLAN
  (`192.168.12.0/24`) erreichbar.
- Der Zugriff erfolgt ausschließlich aus der CIVITAS/CORE-VM
  (`192.168.12.139`) und ggf. vom Proxmox-Host aus für
  Wartungsarbeiten.

---

## Zugangsdaten-Verwaltung

Die folgenden Umgebungsvariablen sind nach der Installation zwingend zu
setzen. Sie werden in einer Datei `credentials.env` ausserhalb des
`CC_CLI_PLAYBOOK_DIR` abgelegt, mit `chmod 600` — analog zum bestehenden
Muster in `01_config.sh`:

```bash
# credentials.env — RustFS-Zugangsdaten (NIE in Git einchecken!)
RUSTFS_ENDPOINT="http://192.168.12.140:9000"
RUSTFS_ACCESS_KEY="<generierter Access Key>"
RUSTFS_SECRET_KEY="<generiertes Secret Key>"
```

> **Idempotenz:** Bei erneuter Auswertung wird geprüft, ob die Datei
> bereits existiert und gültige Werte enthält. Ist sie fehlerhaft
> oder fehlt, wird sie neu erstellt.

Die Werte werden in `render_inventory()` (Modul 06) in das cc-cli-Inventory
übernommen (siehe `portal-backend-objektspeicher.md`).

---

## mc-Client-Anbindung

Nach der RustFS-Installation wird der `mc`-Client (MinIO Client) für
die Bucket-Verwaltung genutzt:

```bash
# mc installieren
curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc \
  -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Alias setzen
mc alias set civitas-rustfs \
  http://192.168.12.140:9000 \
  "$RUSTFS_ACCESS_KEY" \
  "$RUSTFS_SECRET_KEY"

# Bucket anlegen
mc mb civitas-rustfs/portal-config
```

**Bucket-Struktur:**

```
portal-config/
  Standard/
    config.json
    services.json
    rest-services.json
```

Der Prefix `Standard/` entspricht `gd_instance.instance_name` aus dem
Geodata-Inventory-Block.

---

## Beispieldaten: Glascontainer-Testlayer

Die nachfolgenden JSON-Dateien definieren einen Testlayer
"Glascontainer" mit WMS-Quelle aus dem `ds_open_data`-Namespace.
Der Platzhalter `GEOSERVER_URL` wird zur Laufzeit durch den jeweiligen
GeoServer-Endpunkt ersetzt (Test/Staging/Produktion).

### `Standard/services.json`

```json
[
  {
    "name": "Glascontainer",
    "type": "WMS",
    "url": "GEOSERVER_URL/ds_open_data/wms",
    "layer": "ds_open_data:glascontainer",
    "layerName": "Glascontainer",
    "version": "1.3.0",
    "featureRequests": true,
    "featureCount": 100,
    "format": "image/png",
    "transparent": true,
    "tiled": true,
    "info_format": "text/plain"
  }
]
```

### `Standard/config.json`

```json
{
  "configuration": {
    "subjectlayer": {
      "elements": [
        {
          "name": "Information",
          "elements": [
            {
              "name": "Glascontainer",
              "layerIds": [
                "Glascontainer"
              ],
              "visibility": true,
              "isNeverVisibleInTree": false,
              "isSelected": true,
              "cacheLayerAsImage": false
            }
          ]
        }
      ]
    },
    "namedStores": {},
    "layerIds": [
      {
        "layerId": "Glascontainer",
        "layerName": "ds_open_data:glascontainer",
        "layerSource": "Glascontainer"
      }
    ],
    "mapView": {
      "startCenter": [
        635000,
        5500000
      ],
      "startResolution": 1000,
      "epsg": "EPSG:25832",
      "extent": [
        280000,
        5200000,
        920000,
        6100000
      ]
    }
  }
}
```

### `Standard/rest-services.json`

```json
[
  {
    "id": "mapfish_internet",
    "name": "mapfish_internet",
    "type": "Print",
    "url": "GEOSERVER_URL/mapfish/pdf/Standard.json",
    "params": {
      "FORMAT": "pdf"
    }
  }
]
```

> **Hinweis:** Die Beispieldaten sind für einen Testlayer "Glascontainer"
> ausgelegt. Bei produktiver Nutzung müssen sie durch die tatsächlichen
> Layer des jeweiligen GeoServer-Datenspeichers ersetzt werden.

---

## Persistierung

Die Anbindung an das cc_cli-Inventory (S3_ENABLED, S3_ENDPOINT,
S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, S3_BUCKET_NAME,
S3_FORCE_PATH_STYLE) ist spezifiziert in:

> [`portal-backend-objektspeicher.md`](./portal-backend-objektspeicher.md)

Dieses Dokument deckt ausschließlich die **Objektspeicher-Installation**
und die **Testdaten-Erstellung** ab, nicht die Playbook-Integration oder
Inventory-Template-Änderungen.

---

## Offene Punkte

| Punkt | Status |
|---|---|
| LXC-Provisionierung als eigenes Skriptmodul (`00b_provision_rustfs_lxc.sh`) | ⬜ Noch nicht umgesetzt — bisher nur manuelle Erstellung |
| Backup-Strategie über Proxmox Backup Server für diese LXC | ⬜ Noch nicht in Betrieb genommen |
| Bezugsquelle `https://rustfs.com/install.sh` | ⬜ Noch nicht auf Langzeit-Verfügbarkeit geprüft |
| Automatisierte Befüllung mit Beispieldaten nach LXC-Neuaufbau | ⬜ Noch nicht spezifiziert |