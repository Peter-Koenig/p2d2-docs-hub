---
title: Projektstruktur
description: Verzeichnisorganisation und Dateistruktur von p2d2 – belegter Ist-Zustand auf Basis des Quellcodes
lastUpdated: 2026-08-06
quality:
  completeness: 80
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Projektstruktur

Dieses Dokument beschreibt die aktuelle Verzeichnisorganisation von p2d2 auf Basis des Quellcodes. Es nennt nur Dateien und Verzeichnisse, die durch gelesene Quelldateien oder belegte Importe nachweisbar sind. Frühere, nicht belegbare Strukturbeschreibungen (z. B. `map-utils.ts`, `data-utils.ts`, `storage-utils.ts`, ein eigenes Map- oder Admin-Layout) wurden entfernt.

## Quellcode-Baum (Ist-Zustand)

```text
p2d2/
├── src/
│   ├── components/                 # UI- und Karten-Komponenten
│   │   ├── Header.astro            # Hauptnavigation, Login/Logout, rollenabhängige Menüs
│   │   ├── Footer.astro            # Fußzeile mit Collections (socialmedia, intern, repositories, copyright)
│   │   ├── HeroSection.astro       # Hero-Bereich mit Video-Hintergrund und Inhalt aus hero.md
│   │   ├── OpenLayersMap.astro     # Karten-Sektion: Header-Links, MapCanvas, Scroll-Listener
│   │   ├── MapCanvas.astro         # OpenLayers-Hauptkarte, CRS-Umschaltung, WFS/Popup-Integration
│   │   ├── Kategorien.astro        # Einzelne Kategorie-Karte (Foto, Gradient, data-category-slug)
│   │   ├── KategorienGrid.astro    # Raster der Themenkategorien mit Klick-Auswahl
│   │   ├── KommunenGrid.astro      # Raster der Kommunen mit data-kommune-map und Click-Handler
│   │   ├── WerteGrid.astro         # Werte-Raster der Startseite
│   │   ├── Werte.astro             # Einzelne Werte-Karte (Import aus WerteGrid)
│   │   ├── EventConsole.ts         # Debug-Overlay zur Live-Beobachtung protokollierter Events
│   │   ├── feature-editor/         # Generischer Feature-Editor
│   │   │   ├── EditorState.ts      # Reaktiver Editor-State, Dirty-Tracking, Multi-Selection
│   │   │   ├── EditorApp.ts        # Editor-Orchestrierung (Map, Layer, Daten, Interaktion, UI)
│   │   │   ├── FeatureEditorHeader.astro    # Editor-Header (Import aus [featureId].astro)
│   │   │   ├── NavigationControls.astro     # Navigations-Controls (Import)
│   │   │   ├── LayerControls.astro          # Layer-Steuerung (Import)
│   │   │   ├── Toolbar.astro                # Werkzeugleiste (Import)
│   │   │   ├── MapManager.ts                # Karten-Manager (Import aus EditorApp)
│   │   │   ├── EditorLayerManager.ts        # Layer-Manager (Import)
│   │   │   ├── EditorDataManager.ts         # Daten-Manager (Import)
│   │   │   ├── EditorInteractionManager.ts  # Interaktions-Manager (Import)
│   │   │   ├── EditorUIManager.ts           # UI-Manager (Import)
│   │   │   └── grabflur/                    # Grabflur-Editor (rollenbeschränkt)
│   │   │       ├── GrabflurEditorApp.ts     # Grabflur-Editor-Orchestrierung
│   │   │       ├── GrabflurSessionManager.ts# Session-State-Maschine (openSession/commitAndClose/abortSession)
│   │   │       ├── GrabflurMapManager.ts    # Karten-Manager (Import)
│   │   │       ├── GrabflurLayerManager.ts  # Layer-Manager (Import)
│   │   │       ├── GrabflurDataManager.ts   # Daten-Manager (Import)
│   │   │       ├── GrabflurInteractionManager.ts # Interaktions-Manager (Import)
│   │   │       └── GrabflurUIManager.ts     # UI-Manager (Import)
│   │   └── ...
│   ├── layouts/
│   │   └── BaseLayout.astro        # Grundlayout mit Props (title, description, showFooter) und Slots (header, default)
│   ├── pages/
│   │   ├── index.astro             # Startseite: Karte, Grids mit Tab-Umschaltung, WerteGrid, EventConsole-Init
│   │   ├── feature-editor/
│   │   │   └── [featureId].astro   # Generischer Feature-Editor (URL-Parameter wp_name, container_type, name, extent, projection)
│   │   └── verwaltung/
│   │       └── grabflur-editor.astro # Grabflur-Editor (Rolle verwaltung, Session-Metadaten für Kommune)
│   ├── utils/
│   │   ├── events.ts               # Typisiertes Event-System (P2D2EventType, P2D2EventMap, dispatchP2D2Event, Queue/Retry, Persistenz)
│   │   ├── cross-window-events.ts  # Cross-Window-Bridge (postMessage, Same-Origin, Editor-Fenster-Registry)
│   │   ├── map-state.ts            # Globaler Karten-State (selectedKommune, selectedCategory, CRS, subscribe)
│   │   ├── kommunen-click-handler.ts # Klick-Handler für Kommunen-Karten (KOMMUNEN_FOCUS, Persistenz)
│   │   ├── wfs-layer-manager.ts    # Reaktive WFS-Schicht (mapState-Subscription, CQL, Signatur, Request-Lock)
│   │   ├── feature-popup-handler.ts# Klick auf Friedhof, Grabflur-Prüfung, Editor-Öffnung oder Info-Popup
│   │   ├── kategorie-utils.ts      # getAllKategorien (Import aus index.astro)
│   │   ├── kommune-utils.ts        # KommuneData, getKommuneBySlug (Import aus grabflur-editor.astro)
│   │   ├── tab-persistence.ts      # getPersistedTab/setPersistedTab (Import aus index.astro)
│   │   ├── crs.ts                  # registerUtm, toNewViewPreservingScale, Koordinatenprüfungen (Import aus MapCanvas)
│   │   ├── utm-resolutions.ts      # calculateUtmResolutions, isUtmProjection (Import aus MapCanvas)
│   │   ├── wfs-auth.ts             # wfsAuthClient (buildWFSURL, fetchWFS, testConnection – Import aus MapCanvas/WFSLayerManager)
│   │   └── ...
│   ├── lib/
│   │   └── auth/
│   │       └── session.ts          # getUserSession (Import aus Header, index.astro, grabflur-editor.astro)
│   ├── content/                    # Astro Content Collections und Markdown-Inhalte
│   │   ├── hero.md                 # Hero-Inhalt (Claim) für HeroSection
│   │   ├── kategorien/             # Collection "kategorien"
│   │   ├── kommunen/               # Collection "kommunen"
│   │   ├── werte/                  # Collection "werte"
│   │   ├── socialmedia/            # Collection "socialmedia"
│   │   ├── intern/                 # Collection "intern"
│   │   ├── resources/              # Collection "resources"
│   │   ├── repositories/           # Collection "repositories"
│   │   └── copyright/              # Collection "copyright"
│   ├── styles/
│   │   ├── global.css              # Globale Styles (Import aus BaseLayout)
│   │   ├── feature-popup.css       # Popup-Styles (Import aus MapCanvas und Feature-Editor)
│   │   └── feature-editor.css      # Editor-Styles (Import aus Feature- und Grabflur-Editor)
│   └── content.config.ts           # Collection-Definitionen (Zod-Schemata für alle Collections)
├── public/                         # Statische Assets (Bilder, Videos, Favicons – im Code referenziert)
├── package.json                    # Projekt-Konfiguration und Skripte
├── astro.config.mjs                # Astro-Konfiguration
└── tailwind.config.js              # TailwindCSS-Konfiguration
```

## Zuständigkeiten der relevanten Komponenten

### Startseite (`src/pages/index.astro`)

- Lädt `kategorien` und erzeugt das versteckte Element `#category-data` mit `data-category-map` für den WFSLayerManager.
- Bindet `HeroSection`, `OpenLayersMap`, `KommunenGrid`/`KategorienGrid` (mit Tab-Umschaltung und Swipe-Unterstützung) sowie `WerteGrid` ein.
- Stellt die Tab-Auswahl wieder her (`tab-persistence`) und initialisiert die EventConsole bei `?debug=events`.

### Karten-Komponenten

- **`OpenLayersMap.astro`**: Karten-Sektion mit „Kommune / Kategorie auswählen“-Links und Scroll-Listenern auf `p2d2:kommunen:focus` und `p2d2:category:selected`.
- **`MapCanvas.astro`**: Initialisiert die OpenLayers-Karte (Basiskarte OSM, View-Projektion aus `mapState.getConfig().defaultCRS`, optionale UTM-Auflösungen, FullScreen-Control), instanziiert `WFSLayerManager` und `FeaturePopupHandler`, realisiert CRS-Umschaltung und die Wiederherstellung des gespeicherten Kartenzustands.

### Auswahl-Grids

- **`KommunenGrid.astro`**: Rendert Kommunen-Karten, bettet Kartendaten als `data-detail` und Kommunen-Metadaten als `data-kommune-map` ein, initialisiert den `KommunenClickHandler`.
- **`KategorienGrid.astro`**: Rendert Kategorie-Karten; der Klick-Handler setzt `mapState.setSelectedCategory` und dispatcht `CATEGORY_SELECTED`.

### Event-System und Debugging

- **`src/utils/events.ts`**: Fachebene des Event-Systems (typisierte Events, Dispatcher, Listener, Queue/Retry, Persistenzhelfer).
- **`src/utils/cross-window-events.ts`**: Cross-Window-Ebene (lokale und fensterübergreifende Events, Same-Origin-Prüfung, Editor-Fenster-Registry).
- **`src/components/EventConsole.ts`**: Debug-Overlay, protokolliert ausschließlich Events, die `logToEventConsole()` erreichen.

### Editor-Pfade

- **Feature-Editor** (`src/pages/feature-editor/[featureId].astro`): Validierte URL-Parameter, `EditorApp` orchestriert State, Karte, Layer, Daten, Interaktion und UI; `EditorState` verwaltet den reaktiven Editor-State inklusive Dirty-Tracking.
- **Grabflur-Editor** (`src/pages/verwaltung/grabflur-editor.astro`): Rollenbeschränkt (`verwaltung`), bestimmt Kommune und räumlichen Kontext aus der Session; `GrabflurEditorApp` orchestriert die Sub-Manager, `GrabflurSessionManager` steuert den Session-Lifecycle über die Workflow-API.

## Nicht enthalten

Folgende Strukturen aus früheren Fassungen sind **nicht** durch den Quellcode belegt und wurden entfernt:

- `src/utils/map-utils.ts`, `src/utils/data-utils.ts`, `src/utils/storage-utils.ts` in dieser Form
- `src/layouts/MapLayout.astro`, `src/layouts/AdminLayout.astro`
- Eigene `src/content/config/`- oder `src/content/geodata/`-Unterverzeichnisse (die Content-Struktur ist über `content.config.ts` definiert)

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |