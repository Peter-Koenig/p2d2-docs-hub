---
title: GeoServer Container
description: "GeoServer-Container der p2d2-Standalone, Ist-Zustand aus der Bestandserfassung vom 2026-09-15"
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-09-15
---

# LXC: GeoServer

Auf der LXC `geoserver-d11` läuft der GeoServer der p2d2-Standalone. Er stellt die OGC-Dienste WMS, WFS und WFS-T über einen Tomcat-9-Servlet-Container bereit. Die Datenquelle ist das PostgreSQL-Cluster 18/main (siehe [PostgreSQL/PostGIS Container](./lxc-postgresql)).

## Container-Ressourcen

| Ressource | Wert |
|---|---|
| Hostname | `geoserver-d11` |
| Betriebssystem | Debian 13 (trixie) |
| CPU | 4 vCPU |
| RAM | 6 GiB (4,3 GiB frei) |
| Swap | 1 GiB |
| Root-Filesystem | 12 GB, 29 % belegt (3,2 GB) |

## Software-Stack

| Komponente | Version |
|---|---|
| GeoServer | 2.27.0 (Build 03-Apr-2025) |
| GeoTools | 33 |
| GeoWebCache | 1.27.0 |
| Java | OpenJDK 17.0.19 |
| `tomcat9` | 9.0.43-2~deb11u12 |
| `tomcat9-common` | 9.0.43-2~deb11u12 |
| `libtomcat9-java` | 9.0.95-1 |
| `openjdk-17-jre-headless` | 17.0.19+10-1~deb12u2 |

## Tomcat und Java

Der Dienst `tomcat9.service` läuft seit 2026-09-15 23:02:24 (PID 151) mit 1,5 GiB RSS (Peak 1,6 GiB).

`/etc/tomcat9/server.xml` definiert drei Connectors:

| Port | Protokoll | Anmerkung |
|---|---|---|
| 8080 | HTTP/1.1 | |
| 8443 | HTTPS | Keystore `/etc/tomcat9/keystore.jks`, Passwort `changeit` im Klartext in der Datei |
| 8009 | AJP/1.3 | nur `::1` |

`/etc/default/tomcat9`:

```
JAVA_OPTS="-Djava.awt.headless=true"
GEOSERVER_DATA_DIR="/opt/geoserver_data"
```

`/usr/share/tomcat9/bin/setenv.sh`:

```
export GEOSERVER_DATA_DIR="/opt/geoserver_data"
export GEOSERVER_CSRF_WHITELIST=wfs.data-dna.eu,geoportal.udp.data-dna.eu,www.data-dna.eu,dev.data-dna.eu,f-fv.data-dna.eu,f-de1.data-dna.eu,f-de2.data-dna.eu
```

Weder `setenv.sh` noch der laufende Java-Prozess enthalten Heap-Flags (`-Xmx`/`-Xms`). Die JVM läuft mit dem Default-Heap.

## Data Directory

Das Data Directory liegt unter `/opt/geoserver_data` (259 MB gesamt):

| Verzeichnis | Größe |
|---|---|
| `data/` | 183 MB |
| `logs/` | 72 MB |
| `coverages/` | 2,5 MB |
| `www/` | 652 KB |
| `workspaces/` | 528 KB |
| `demo/` | 296 KB |
| `security/` | 240 KB |
| `plugIns/` | 208 KB |
| `styles/` | 156 KB |
| `gwc-layers/` | 108 KB |
| übrige | je < 50 KB |

## Logging

Das Logging-Level ist `DEFAULT_LOGGING` (`logging.xml`). Neben dem aktiven `geoserver.log` (12 MB) liegen mehrere rotierte `geoserver-N.log` (je ca. 20 MB). Das aktive Log enthält vollständige WFS-T-Transaktionskörper, darunter Geometrien und Bearbeiter-E-Mail-Adressen im Klartext.

## Workspaces

Sechs Workspaces sind eingerichtet:

| Workspace | Namespace-URI | Datastore | Schema | DB-User |
|---|---|---|---|---|
| `de1` | `urn:data-dna:govdata:de1` | `de1_pg` (PostGIS) | `p2d2_de1` | `P2D2-DE1` |
| `de2` | `urn:data-dna:govdata:de2` | `de2_pg` (PostGIS) | `p2d2_de2` | `P2D2-DE2` |
| `dev` | `urn:data-dna:govdata:dev` | `dev_pg` (PostGIS) | `p2d2_develop` | `P2D2-DEVELOP` |
| `fv` | `urn:data-dna:govdata:fv` | `fv_pg` (PostGIS) | `p2d2_fv` | `P2D2-FV` |
| `main` | `urn:data-dna:govdata:main` | `main_pg` (PostGIS) | `p2d2_main` | `P2D2-MAIN` |
| `friedhofsplaene` | `urn:data-dna:tiffdata` | keiner (Coveragestore) | - | - |

Alle fünf PostGIS-Datastores verbinden auf `192.168.122.110:5432`, Datenbank `data-dna`. Das ist das Cluster 18/main aus der PostgreSQL-Dokumentation. Die Passwörter sind GeoServer-intern verschlüsselt gespeichert (Präfix `crypt1:`), nicht im Klartext.

## FeatureTypes

In allen fünf PostGIS-Workspaces sind dieselben fünf FeatureTypes eingerichtet:

| FeatureType | Native Quelle | Typ |
|---|---|---|
| `geo-containers` | `p2d2_containers` | Tabelle |
| `grabflure` | `v_grabflure_aktuell` | View |
| `grabflure_versionen` | `p2d2_grabflure_versionen` | Tabelle |
| `graeber` | `v_graeber_aktuell` | View |
| `graeber_versionen` | `p2d2_graeber_versionen` | Tabelle |

Attributlisten sind über alle fünf Workspaces identisch. "Pflicht" bedeutet `minOccurs=1` (nicht nillable).

### geo-containers

| Attribut | Typ | Pflicht |
|---|---|---|
| `id` | Integer | ja |
| `category` | String | nein |
| `name` | String | nein |
| `geometry` | MultiPolygon | nein |
| `created_at` | Timestamp | nein |
| `updated_at` | Timestamp | nein |
| `last_updated` | Timestamp | nein |
| `source_wfs` | String | nein |
| `cache_expires` | Timestamp | nein |
| `container_type` | String | nein |
| `municipality` | String | nein |
| `wp_name` | String | nein |
| `osm_admin_level` | Integer | nein |
| `osm_id` | String | nein |
| `alt_name` | String | nein |
| `admin_name` | String | nein |

Das Attribut `name` ist auf die Quellspalte `osm_name` gemappt.

### grabflure

| Attribut | Typ | Pflicht |
|---|---|---|
| `p2d2_uuid` | String | nein |
| `geom` | MultiPolygon | nein |
| `id_intern` | Long | nein |
| `fh_nr` | String | nein |
| `fh_name` | String | nein |
| `flur_nr` | String | nein |
| `wp_name` | String | nein |
| `kommune_id` | Integer | nein |
| `created_at` | Timestamp | nein |
| `updated_at` | Timestamp | nein |
| `version_nr` | Integer | nein |
| `aktuelle_version_id` | UUID | nein |
| `aktuelle_session_id` | Long | nein |
| `version_kommentar` | String | nein |
| `version_erstellt_am` | Timestamp | nein |
| `version_erstellt_von` | String | nein |
| `workflow_status` | String | nein |
| `letzte_session_id` | Long | nein |

### grabflure_versionen

| Attribut | Typ | Pflicht |
|---|---|---|
| `version_id` | UUID | ja |
| `grabflur_id` | UUID | ja |
| `version_nr` | Integer | ja |
| `session_id` | Long | nein |
| `is_session_boundary` | Boolean | ja |
| `created_at` | Timestamp | ja |
| `created_by` | String | ja |
| `edit_comment` | String | nein |
| `geom` | MultiPolygon | nein |
| `id_intern` | Long | nein |
| `id_import` | Long | nein |
| `fh_nr` | String | nein |
| `fh_name` | String | nein |
| `flur_nr` | String | nein |
| `wp_name` | String | nein |
| `kommune_id` | Integer | nein |

### graeber

| Attribut | Typ | Pflicht |
|---|---|---|
| `p2d2_uuid` | String | nein |
| `geom` | Geometry | nein |
| `id_intern` | Integer | nein |
| `probleme` | String | nein |
| `fried_nr` | String | nein |
| `fried_name` | String | nein |
| `grabflur` | String | nein |
| `grabnummer` | String | nein |
| `grabart` | String | nein |
| `grabart_key` | String | nein |
| `anzahl_grabstellen` | Integer | nein |
| `sperrung` | String | nein |
| `gkey` | String | nein |
| `nachname` | String | nein |
| `vorname` | String | nein |
| `geburtsdatum` | Date | nein |
| `sterbedatum` | Date | nein |
| `satzschluessel` | String | nein |
| `grabstaette_status` | String | nein |
| `bestattungsart` | String | nein |
| `kommune_id` | Integer | nein |
| `version_nr` | Integer | nein |
| `osm_id` | Long | nein |
| `osm_version` | Long | nein |
| `osm_changeset_id` | Long | nein |
| `osm_rohdaten` | String | nein |
| `osm_merge_note` | String | nein |
| `osm_edit_comment` | String | nein |
| `aktuelle_session_id` | Long | nein |
| `version_erstellt_am` | Timestamp | nein |
| `version_erstellt_von` | String | nein |
| `workflow_status` | String | nein |
| `letzte_session_id` | Long | nein |

### graeber_versionen

| Attribut | Typ | Pflicht |
|---|---|---|
| `version_id` | UUID | ja |
| `grab_id` | UUID | ja |
| `version_nr` | Integer | ja |
| `session_id` | Long | nein |
| `is_session_boundary` | Boolean | ja |
| `created_at` | Timestamp | ja |
| `created_by` | String | ja |
| `edit_comment` | String | nein |
| `geom` | MultiPolygon | nein |
| `id_intern` | Integer | nein |
| `id_import` | Integer | nein |
| `probleme` | String | nein |
| `fried_nr` | String | nein |
| `fried_name` | String | nein |
| `grabflur` | String | nein |
| `grabnummer` | String | nein |
| `grabart` | String | nein |
| `grabart_key` | String | nein |
| `anzahl_grabstellen` | Integer | nein |
| `sperrung` | String | nein |
| `gkey` | String | nein |
| `nachname` | String | nein |
| `vorname` | String | nein |
| `geburtsdatum` | Date | nein |
| `sterbedatum` | Date | nein |
| `satzschluessel` | String | nein |
| `grabstaette_status` | String | nein |
| `bestattungsart` | String | nein |
| `osm_raw_data` | String | nein |
| `osm_merge_note` | String | nein |
| `osm_id` | Long | nein |
| `osm_changeset_id` | Long | nein |
| `osm_version` | Long | nein |
| `kommune_id` | Integer | nein |

Die OSM-Felder unterscheiden sich zwischen der aktuellen View `graeber` und der Versionstabelle `graeber_versionen`: Die View führt `osm_rohdaten` und `osm_edit_comment`, die Versionstabelle `osm_raw_data` ohne `osm_edit_comment`.

## Coveragestore `friedhofsplaene`

| Eigenschaft | Wert |
|---|---|
| Store | `friedhofsplaene_koeln_mosaic` |
| Typ | ImageMosaic |
| Quelle | `file:data/geotiffs/koeln` |
| Coverage | `friedhoefe_koeln` |

Das Verzeichnis `data/geotiffs/parking-lot` existiert, wird aber von keinem Coveragestore referenziert.

## Layer, Styles und Cache

| Eigenschaft | Wert |
|---|---|
| Layer | 26 (5 FeatureTypes x 5 PostGIS-Workspaces + 1 Coverage-Layer `friedhofsplaene:friedhoefe_koeln`) |
| Styles | 8: `1_cologne_red`, `2_Cologne_reds`, `3_Cologne_pink`, `generic`, `line`, `point`, `polygon`, `raster` |
| Layergroups | keine |
| GeoWebCache | alle 26 Layer gecacht |

## Security

### Rollen (9)

`ADMIN`, `GROUP_ADMIN`, `P2D2_IMPORT_ROLE`, `P2D2_WFST_DE1`, `P2D2_WFST_DE2`, `P2D2_WFST_DEVELOP`, `P2D2_WFST_FV`, `P2D2_WFST_MAIN`, `WFS-USER`

### Nutzer (8)

`admin`, `p2d2_wfs_user`, `p2d2_wfst_de1`, `p2d2_wfst_de2`, `p2d2_wfst_develop`, `p2d2_wfst_fv`, `p2d2_wfst_main`, `p2d2_wfst_user`

`p2d2_wfst_user` ist der frühere WFS-T-Nutzer vor der Einführung der Branch-spezifischen `p2d2_wfst_<branch>`-Nutzer und wurde von `p2d2_wfst_main` abgelöst. Auf der Standalone existiert er weiterhin.

### Layer-ACL

`security/layers.properties` arbeitet mit `mode=HIDE` (nicht lesbare Layer erscheinen als nicht vorhanden).

Fallback-Regeln:

- `*.*.r=*` (Lesen öffentlich, sofern nicht spezifischer eingeschränkt)
- `*.*.w=GROUP_ADMIN,ADMIN` (Schreiben standardmäßig nur Admin)

Branch-spezifische Schreibrechte liegen je `P2D2_WFST_<BRANCH>`-Rolle auf den jeweiligen `*_versionen`-Layern (beispielsweise `de1.grabflure_versionen.w=P2D2_WFST_DE1,ADMIN`). Schreibrechte auf die `geo-containers`-Layer liegen ausschließlich bei `P2D2_IMPORT_ROLE`.

Eine Ausnahme beim Lesen: `fv.graeber` ist auf `P2D2_IMPORT_ROLE`, `ROLE_AUTHENTICATED`, `WFS-USER` und `ADMIN` eingeschränkt (ohne `ROLE_ANONYMOUS`), alle übrigen Layer sind öffentlich lesbar.

## `global.xml` (serverweite Einstellungen)

| Einstellung | Wert |
|---|---|
| `proxyBaseUrl` | `https://wfs.data-dna.eu/geoserver` |
| JAI `tileThreads` | 7 |
| JAI `memoryCapacity` | 0.5 |
| CoverageAccess `corePoolSize` | 5 |
| CoverageAccess `maxPoolSize` | 10 |

Die Kontaktdaten (`contact*`) sind das unveränderte GeoServer-Beispiel und damit nicht konfiguriert. Die JAI-/Coverage-Werte liegen nahe den Defaults.

## Netzwerkzugang

Der GeoServer ist intern unter `http://192.168.122.112:8080/geoserver` erreichbar. Nach außen läuft er über `https://wfs.data-dna.eu/geoserver` (`proxyBaseUrl`). Die CSRF-Whitelist in `setenv.sh` nennt zusätzlich `geoportal.udp.data-dna.eu` (CIVITAS/CORE-Domain) und die Standalone-Domains `www.data-dna.eu`, `dev.data-dna.eu`, `f-fv.data-dna.eu`, `f-de1.data-dna.eu`, `f-de2.data-dna.eu`.

## Service-Management

```bash
systemctl status tomcat9
systemctl restart tomcat9
journalctl -u tomcat9 -f --no-pager
tail -f /opt/geoserver_data/logs/geoserver.log
```

## Weiterführende Dokumentation

- [GeoServer in der Geodateninfrastruktur](../geodateninfrastruktur/geoserver.md)
- [GeoServer Docs](https://docs.geoserver.org/stable/en/user/)
- [GeoServer Security Guide](https://docs.geoserver.org/stable/en/user/security/)
- [GeoServer REST API](https://docs.geoserver.org/stable/en/user/rest/)
