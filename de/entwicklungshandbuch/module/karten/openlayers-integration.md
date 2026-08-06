---
title: OpenLayers Integration
description: Hauptkarte, MapCanvas, Controls, CRS und Initialzustand – belegter Ist-Zustand auf Basis des Quellcodes
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# OpenLayers Integration

Dieses Dokument beschreibt die OpenLayers-Integration der p2d2-Hauptkarte auf Basis von `src/components/MapCanvas.astro`. Es dokumentiert ausschließlich den belegten Ist-Zustand. Frühere, nicht durch den Quellcode belegbare API-Beschreibungen (z. B. `UTM32`/`UTM33`-Projektionsdefinitionen, `MAP_INIT`, `createMap()`, ein `LayerManager` oder Tile-Caching) wurden entfernt.

## Karteninitialisierung

Die Hauptkarte wird im Skript von `MapCanvas.astro` direkt mit der OpenLayers-API erzeugt und an das DOM-Element `#map` gebunden:

    const targetProjection = mapState.getConfig().defaultCRS;

    // Nur für UTM-Projektionen: eigene Auflösungsstufen
    let resolutions;
    if (isUtmProjection(targetProjection)) {
        resolutions = calculateUtmResolutions();
    }

    const map = new Map({
        target: "map",
        layers: [new TileLayer({ source: new OSM() })],
        view: new View({
            projection: targetProjection,
            center: [0, 0],
            zoom: 2,
            resolutions: resolutions,
            constrainResolution: false,
        }),
        controls: defaults().extend([new FullScreen()]),
    });

Belegte Eigenschaften:

- **Basiskarte**: `TileLayer` mit `OSM`-Source (OpenStreetMap-Kacheln).
- **View-Projektion**: `mapState.getConfig().defaultCRS` – Default `EPSG:3857` (Web Mercator), gesetzt in `src/utils/map-state.ts`.
- **View-Startwerte**: Center `[0, 0]`, Zoom `2`, `constrainResolution: false`.
- **UTM-Auflösungen**: `resolutions` werden nur gesetzt, wenn `isUtmProjection()` zutrifft; die Berechnung erfolgt über `calculateUtmResolutions()` aus `src/utils/utm-resolutions.ts`.
- **Controls**: OpenLayers-Standard-Controls (`defaults()`) erweitert um `FullScreen`.
- **MAP_READY**: Unmittelbar nach der Initialisierung wird `dispatchCrossWindowEvent(P2D2EventType.MAP_READY, { projection, center, zoom, timestamp })` gesendet.

Nach dem ersten `postrender`-Ereignis werden die Canvas-Elemente der Karte nachgestylt (`borderRadius`, `willChange`). Ein `MutationObserver` auf `#map` (`childList`, `subtree`) stellt sicher, dass später hinzugefügte `CANVAS`-Knoten dasselbe Styling erhalten.

## CRS-Verwaltung

Die Karte unterstützt ein generisches Koordinatensystem (Default `EPSG:3857`) und – sofern pro Kommune hinterlegt – ein lokales UTM-Koordinatensystem.

### mapState

Der Karten-State (`src/utils/map-state.ts`) hält die relevanten CRS-Werte:

- `activeCRS` – aktuell aktive Projektion.
- `localCRS` – optionales, kommunenspezifisches UTM-Koordinatensystem (z. B. `EPSG:25832` für Köln).
- `mapState.getConfig().defaultCRS` – Standard-Projektion der Karte.

### Verwendete CRS-Utilities

Importiert und verwendet werden (aus `src/utils/crs.ts`):

- `registerUtm(crs)` – registriert eine UTM-Projektion bei OpenLayers, damit sie für die View verwendet werden kann.
- `toNewViewPreservingScale(map, targetCRS)` – wechselt die View-Projektion unter Erhalt des Maßstabs.
- `isValidWgs84Coordinate()` / `isValidWgs84Extent()` – validieren WGS84-Koordinaten bzw. -Extents vor der Navigation.

Die interne Implementierung von `crs.ts` wird hier nicht beschrieben; dokumentiert sind nur die im Quellcode verwendeten Importe.

### CRS-Umschaltung (Toggle)

- Der Button `#crs-toggle-button` zeigt den aktuellen Zustand an.
- `updateCRSButton()`: Zeigt `CRS: UTM`, wenn `activeCRS === localCRS`; sonst `CRS: generisch`. Ist kein `localCRS` vorhanden, wird der Button deaktiviert.
- `toggleCRS()`: Wechselt zwischen `localCRS` und `defaultCRS`, aktualisiert `mapState.setActiveCRS()` und wechselt die View per `toNewViewPreservingScale()`.

## Kommune-Fokus-Navigation

Ein Listener auf `P2D2EventType.KOMMUNEN_FOCUS` (`addP2D2EventListener`, `{ passive: true }`) verarbeitet die Auswahl einer Kommune:

1. `mapState.setSelectedKommune(detail)` – speichert die gewählte Kommune.
2. `mapState.setLocalCRS(detail.projection)` – übernimmt die kommunenspezifische Projektion, sofern vorhanden.
3. `registerUtm(localCRS)` – registriert die UTM-Projektion (bei Fehlern wird `localCRS` auf `undefined` zurückgesetzt).
4. `mapState.setActiveCRS(localCRS || defaultCRS)` und `toNewViewPreservingScale(map, targetCRS)` – wechselt die aktive Projektion.
5. Navigation in WGS84-Daten:

    // BBOX bevorzugt, sonst Center
    if (extent valide) {
        const fitExtent = transformExtent(extent, "EPSG:4326", targetCRS);
        map.getView().fit(fitExtent, {
            padding: [20, 20, 20, 20],
            duration: 300,
            constrainResolution: false,
            maxZoom: 19,
            ...(detail.extra?.fitOptions || {}),
        });
    } else if (center valide) {
        const c = transform(center, "EPSG:4326", targetCRS);
        map.getView().animate({
            center: c,
            zoom: zoom ?? map.getView().getZoom() ?? 11,
            duration: 300,
            ...(detail.extra || {}),
        });
    }

Das WFS-Layer-Management wird dabei nicht direkt angestoßen; es erfolgt reaktiv über die `mapState`-Subscription des `WFSLayerManager` (siehe [WFS-Layer-Architektur](../../architektur/wfs-layer-architektur)).

## Initialzustand (DOMContentLoaded)

Beim Laden der Seite wird der gespeicherte Kartenzustand wiederhergestellt:

- `mapState.restoreFromStorage()` liest `selectedCRS`, `selectedCategory` und `selectedMunicipalityDetail` aus dem `localStorage`.
- Existiert ein gespeicherter Zustand mit aktiver UTM-Projektion und gespeicherter Kommune, werden `localCRS` und `selectedKommune` wiederhergestellt; nach 100 ms wird `KOMMUNEN_FOCUS` mit den gespeicherten Details erneut dispatched.
- Existiert kein gespeicherter Zustand, wird auf **Köln** als Initialansicht zentriert:

    const koelnCenter = [6.9603, 50.9375];
    const koelnZoom = 11;
    const koelnProjection = "EPSG:25832";

    registerUtm(koelnProjection);
    toNewViewPreservingScale(map, koelnProjection, false);
    map.getView().setCenter(transform(koelnCenter, "EPSG:4326", koelnProjection));
    map.getView().setZoom(koelnZoom);
    mapState.setActiveCRS(koelnProjection);
    mapState.setLocalCRS(koelnProjection);

- Abschließend wird `mapState.setInitialized(true)` gesetzt.

## Tab-Buttons der Karte

Die Buttons `#tab-kommunen` und `#tab-kategorien` (Overlay auf der Karte) scrollen zum Grid-Container und rufen `window.switchTab("kommunen" | "kategorien")` auf. Ist die globale Funktion nicht verfügbar, wird als Fallback der entsprechende `.tab-button` per DOM-Click ausgelöst.

## Globale Exponierung

Für Debugging und die Anbindung weiterer Module werden folgende Objekte global exponiert:

- `window.map` – die OpenLayers-Karte.
- `window.wfsManager` – die `WFSLayerManager`-Instanz.
- `window.popupHandler` – die `FeaturePopupHandler`-Instanz.
- `window.mapState` – der Karten-State.

## Einordnung der Komponenten

- `OpenLayersMap.astro` ist die Karten-Sektion der Startseite (Header-Links, `MapCanvas`, Scroll-Listener auf `p2d2:kommunen:focus` und `p2d2:category:selected`).
- `MapCanvas.astro` enthält die eigentliche OpenLayers-Initialisierung und verdrahtet `WFSLayerManager` und `FeaturePopupHandler`.
- Die WFS-Schicht ist in [WFS-Layer-Architektur](../../architektur/wfs-layer-architektur) beschrieben, das Event-System in [Event Handling & Cross-Window Kommunikation](../../architektur/eventhandling) und der Datenfluss in [Datenfluss](../../architektur/datenfluss).

## Nicht enthalten

Folgende Inhalte früherer Fassungen sind **nicht** durch den Quellcode belegt und wurden entfernt:

- Vordefinierte `UTM32`/`UTM33`-Projektionsobjekte (`crs.ts` wird nur über die genannten Funktionen genutzt).
- Eine `MAP_INIT`-Konfigurationskonstante oder `createMap()`-Factory.
- Ein `LayerManager` mit `addLayer`/`removeLayer`/`setLayerVisibility`.
- Tile-Caching-Funktionen oder Viewport-optimierte Vector-Sources.

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |