---
title: Datenfluss
description: Ist-Datenfluss in p2d2 – Content Collections, Auswahlkette, Karten-, WFS- und Editorpfade
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Datenfluss

Dieses Dokument beschreibt den aktuellen Datenfluss in p2d2 auf Basis des Quellcodes. Es ergänzt den [Systemüberblick](./systemueberblick), die [Event Handling & Cross-Window Kommunikation](./eventhandling) und die [WFS-Layer-Architektur](./wfs-layer-architektur).

## 1. Statische Datenquellen: Astro Content Collections

Die statischen Inhalte der Anwendung werden über Astro Content Collections verwaltet. Die Collection-Definitionen stehen in `src/content.config.ts`:

- `kategorien` – Themenkategorien (Titel, Icon, Reihenfolge, Beschreibung, optional `containerType`, `image_version`)
- `kommunen` – teilnehmende Kommunen (Titel, `colorStripe`, `osmAdminLevels`, `wp_name`, optional `osm_refinement`, `icon`, `order`, `image_version`, `map`)
- `werte` – Werte-Raster der Startseite (Titel, Icon, Reihenfolge)
- `socialmedia`, `intern`, `resources`, `repositories`, `copyright` – Fußzeilen-Inhalte

Die Komponenten laden ihre Daten serverseitig mit `getCollection()`:

- `src/components/KommunenGrid.astro` lädt `kommunen` und sortiert nach `order`.
- `src/components/KategorienGrid.astro` lädt `kategorien` und sortiert nach `order`.
- `src/components/WerteGrid.astro` lädt `werte` und sortiert nach `order`.
- `src/components/Footer.astro` lädt `socialmedia`, `intern`, `repositories` und `copyright`.
- `src/pages/index.astro` lädt `kategorien` über `getAllKategorien()` und erzeugt daraus das versteckte `data-category-map`-Attribut für den WFSLayerManager.

## 2. Karten- und Auswahlkette

### Kommunenauswahl

```text
KommunenGrid (Karte im Grid, data-slug / data-detail / data-kommune-map)
→ KommunenClickHandler (bind auf .grid.grid-cols-1)
→ dispatchP2D2Event(P2D2EventType.KOMMUNEN_FOCUS, detail, { throttleMs: 0 })
→ MapCanvas-Listener (addP2D2EventListener)
→ mapState.setSelectedKommune(detail)
→ CRS-, Center- oder BBOX-Navigation
```

Im Detail:

1. `KommunenGrid.astro` rendert die Kommunen-Karten und bettet die Kartendaten (`center`, `extent`, `zoom`, `projection`, `extra`, `slug`) als `data-detail`-Attribut sowie `wpName`/`osmAdminLevels` als `data-kommune-map` ein.
2. `KommunenClickHandler` (`src/utils/kommunen-click-handler.ts`) lauscht auf Klicks im Grid-Container. Er validiert `center`/`extent` (WGS84-Bereiche), kombiniert die Kartendaten mit den Kommunen-Metadaten und dispatcht `KOMMUNEN_FOCUS` mit deaktiviertem Throttling.
3. Der Listener in `MapCanvas.astro` setzt `selectedKommune` und `localCRS` im `mapState`, registriert bei Bedarf die UTM-Projektion (`registerUtm`), wechselt die aktive Projektion (`toNewViewPreservingScale`) und navigiert entweder per `transform` (Center) oder `transformExtent` + `fit` (BBOX).
4. Beim erneuten Klick auf dieselbe Kommune wird die Auswahl deaktiviert (`setSelectedKommune(null)`); das WFS-Layer-Management erfolgt reaktiv über `mapState`.

### Kategorienauswahl

```text
KategorienGrid (data-category-slug)
→ Klick-Handler auf [data-category-slug]
→ mapState.setSelectedCategory(categorySlug)
→ dispatchP2D2Event(P2D2EventType.CATEGORY_SELECTED, detail, { throttleMs: 0 })
→ Scrollen zur Kartenansicht
```

Im Detail:

1. `KategorienGrid.astro` registriert einen dokumentweiten Klick-Handler, der den Button über `[data-category-slug]` findet.
2. Bei Auswahl wird `mapState.setSelectedCategory(categorySlug)` gesetzt; bei erneutem Klick auf dieselbe Kategorie wird die Auswahl entfernt.
3. Das Event `CATEGORY_SELECTED` löst in `OpenLayersMap.astro` das Scrollen zur Kartenansicht aus (zusätzlich existiert ein direkter `scrollToSelectionHeader()`-Fallback).
4. Der WFS-Layer reagiert nicht auf dieses Event, sondern ausschließlich auf die `mapState`-Änderung.

## 3. WFS-Pfad (reaktiv)

Der WFS-Layer wird nicht direkt aus der UI gesteuert, sondern reaktiv über `mapState`:

```text
mapState-Änderung (selectedKommune + selectedCategory)
→ WFSLayerManager-Subscription (mapState.subscribe)
→ updateLayerBasedOnState
   - Signatur "kommune.slug|categorySlug" gegen doppelte Requests
   - isRequestPending gegen parallele Requests
→ CQL-Filter: wp_name='…' AND container_type='…' AND osm_admin_level=…
→ wfsAuthClient.buildWFSURL("geo-containers", { CQL_FILTER, srsName })
→ fetchWFS → GeoJSON → VectorSource
→ dispatchCrossWindowEvent(WFS_LOAD_START | WFS_LOAD_COMPLETE | WFS_LOAD_ERROR)
```

Wichtige Details:

- Fehlt `selectedKommune` oder `selectedCategory`, wird der Layer geleert.
- `containerType` wird aus dem versteckten `data-category-map`-Element in `index.astro` gelesen (Fallback: Fehler).
- `osmAdminLevel` wird aus `osmAdminLevels` der Kommune abgeleitet; für `cemetery` gilt fest Level 8, für `administrative` die nächste Untergliederung.
- Geladene Features werden von `EPSG:4326` in die aktuelle Kartenprojektion transformiert.
- Der WFS-Zugriff ist anonymer Lesezugriff (keine Credentials im Client erforderlich; `buildWFSURL`/`fetchWFS`).

## 4. Editorpfad

### Vom Kartenklick zum Editor

```text
OpenLayers-Klick auf ein passendes Feature
→ FeaturePopupHandler (initializeClickHandler)
   - findCemeteryFeatureAtPixel
   - isCemeteryFeature: properties.container_type === aktiver ContainerType
→ loadGrabflurData (WFS-Abfrage auf Grabflur-Daten)
→ Wenn Grabfluren existieren: openFeatureEditor
   - window.open("/feature-editor/<name>?wp_name=…&container_type=…&name=…&extent=…&osm_admin_level=…&projection=…")
   - registerEditorWindow(editorWindow)
→ Sonst: showInfoPopup (Informationsdialog)
```

Der generische Feature-Editor (`src/pages/feature-editor/[featureId].astro`) validiert die URL-Parameter `wp_name`, `container_type`, `name`, `extent`, `projection` und initialisiert `EditorApp`. `EditorState` liest die Konfiguration aus den `data-`-Attributen des Karten-Containers und verwaltet den reaktiven Editor-State; `EditorApp` orchestriert Karte, Layer, Daten, Interaktion und UI. Änderungen am Editor-State werden über `dispatchCrossWindowEvent` (z. B. `EDITOR_READY`, `EDITOR_FEATURE_SELECTED`, `EDITOR_TOOL_SWITCH`, `EDITOR_MODE_CHANGE`) veröffentlicht.

### Grabflur-Editor (rollenbeschränkt)

Der Grabflur-Editor (`src/pages/verwaltung/grabflur-editor.astro`) ist eine getrennte Anwendung:

- Zugriff nur für authentifizierte Nutzer mit Rolle `verwaltung` (`getUserSession`).
- Kommune und räumlicher Kontext werden aus der Session bestimmt: `session.memberships` (Typ `kommune`) bzw. `session.preferences.homeKommuneSlug`.
- Die Daten (`wp_name`, `extent`, `center`, `projection`, `zoom`) werden aus der Kommunen-Collection geladen und als `data-`-Attribute an den Karten-Container übergeben.
- `GrabflurEditorApp` orchestriert die Sub-Manager (Karte, Layer, Daten, Session, Interaktion, UI) und lädt Friedhofsdaten über WFS.
- `GrabflurSessionManager` verwaltet den Session-Lifecycle (`openSession`, `commitAndClose`, `abortSession`) über die API-Endpunkte `/api/workflow/session` und `/api/workflow/session/:id/commit`.

## 5. Persistenz

Ausgewählte Zustände werden im `localStorage` gespeichert. Die Schlüssel sind derzeit **nicht einheitlich** benannt – das ist eine dokumentierte Beobachtung des Ist-Zustands, kein Fehler dieser Aufgabe:

| Datei | Schlüssel |
|---|---|
| `src/utils/events.ts` | `p2d2_selected_crs`, `p2d2_selected_kommune` |
| `src/utils/map-state.ts` | `selectedCRS`, `selectedCategory`, `selectedMunicipalityDetail` |
| `src/utils/kommunen-click-handler.ts` | `p2d2_selected_kommune_slug`, `p2d2_selected_kommune_detail` |
| `src/pages/index.astro` | `selectedCategory` (Tab-Wiederherstellung) |

Die Persistenz wird durch diese Dokumentation nicht vereinheitlicht; sie wird nur als bestehender Zustand festgehalten.

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |