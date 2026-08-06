---
title: Startseite und Onboarding
description: Heutige Startseitenstruktur von p2d2 sowie die als geplant markierte Onboarding-Spezifikation
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Startseite und Onboarding

Dieses Dokument beschreibt die heutige technische Struktur der öffentlichen p2d2-Startseite auf Basis des aktuellen Quellcodes sowie – ausdrücklich als **geplant** markiert – die spätere Onboarding-Änderung. Es dient als technische Hintergrundreferenz für eine separate Soll-Spezifikation zur Überarbeitung der Startseite.

## Teil 1: Ist-Zustand

### 1.1 Komponentenreihenfolge

Die Startseite (`src/pages/index.astro`) nutzt `BaseLayout` und rendert die Komponenten in dieser Reihenfolge:

````text
BaseLayout
→ Standard-Header aus BaseLayout
→ Inhalt aus index.astro
   → HeroSection
   → OpenLayersMap
      → MapCanvas
   → KommunenGrid / KategorienGrid (mit Tab-Umschaltung)
   → WerteGrid
→ Standard-Footer aus BaseLayout
````

Der benannte Slot `header` wird auf der öffentlichen Startseite nicht überschrieben. Editor-Seiten können ihn hingegen mit einem eigenen Editor-Header überschreiben.

`index.astro` übernimmt außerdem folgende Aufgaben:

- Es lädt die Kategorien über `getAllKategorien()` und erzeugt ein verstecktes Element `#category-data` mit `data-category-map` (`slug → { containerType }`). Dieses Element wird vom `WFSLayerManager` für die CQL-Konstruktion gelesen.
- Es implementiert die Tab-Umschaltung zwischen Kommunen- und Kategorien-Grid (`switchTab`, Klassenwechsel, Swipe-Gesten auf dem Grid-Container) und stellt den zuletzt gewählten Tab über `tab-persistence` wieder her.
- Bei `?debug=events` initialisiert es die `EventConsole` sowie `initializeCrossWindowBridge()`.

### 1.2 Karte

Die Karte wird in `MapCanvas.astro` als OpenLayers-Karte erzeugt:

- Basiskarte: `TileLayer` mit OSM-Source.
- View-Projektion aus `mapState.getConfig().defaultCRS` (Default `EPSG:3857`).
- Controls: OpenLayers-Standard-Controls erweitert um `FullScreen`.
- Unmittelbar nach Initialisierung wird `MAP_READY` über die Cross-Window-Bridge gesendet.
- Ein CRS-Toggle-Button (`#crs-toggle-button`) wechselt zwischen generischem und lokalem UTM-Koordinatensystem (`updateCRSButton`, `toggleCRS`); ohne lokales CRS ist der Button deaktiviert.
- Initialzustand: Wiederherstellung aus `localStorage` (`mapState.restoreFromStorage`) oder – ohne gespeicherten Zustand – Zentrierung auf Köln (Center `[6.9603, 50.9375]`, Zoom 11, `EPSG:25832`).

`OpenLayersMap.astro` ist die Karten-Sektion der Startseite: Sie enthält die Links „Kommune“/„Kategorie“ (die zum Grid-Container scrollen und die Tabs umschalten), bindet `MapCanvas` ein und registriert Scroll-Listener auf `p2d2:kommunen:focus` sowie `p2d2:category:selected`.

### 1.3 Grids

- **KommunenGrid** (`KommunenGrid.astro`): Lädt die Collection `kommunen`, sortiert nach `order`, bettet pro Karte die Kartendaten als `data-detail` sowie `wpName`/`osmAdminLevels` als `data-kommune-map` ein. Klicks verarbeitet der `KommunenClickHandler` (`src/utils/kommunen-click-handler.ts`), der `KOMMUNEN_FOCUS` dispatched und die Auswahl in `mapState` setzt.
- **KategorienGrid** (`KategorienGrid.astro`): Lädt die Collection `kategorien`, sortiert nach `order`, begrenzt auf 12 Einträge. Der Klick-Handler auf `[data-category-slug]` setzt `mapState.setSelectedCategory()` und dispatched `CATEGORY_SELECTED`; ein direkter `scrollToSelectionHeader()`-Fallback scrollt zur Kartenansicht.
- **WerteGrid** (`WerteGrid.astro`): Lädt die Collection `werte`, sortiert nach `order`, begrenzt auf 12 Einträge, und rendert pro Eintrag eine Werte-Karte.

### 1.4 Header

`Header.astro` erzeugt die öffentliche Navigation und ergänzt rollenabhängig Verwaltung und OSM:

- Öffentliche Punkte: „Über p2d2“ (Dropdown mit Hintergrund, Ziel, Umsetzung, CIVITAS/CORE, Status, Zukunft, Tests), Themenbereiche, Community, Mitmachen, Kontakt.
- Rollenabhängig (aus `getUserSession(Astro.locals)`): bei Rolle `verwaltung` der Punkt „Verwaltung“ (`/verwaltung`), bei Rolle `osm` der Punkt „OSM“ (`/osm`).
- Nicht angemeldet: Link „Anmelden“ auf `/api/auth/login`.
- Angemeldet: User-Dropdown mit Initialen und „Abmelden“ auf `/api/auth/logout`.
- Ein `<script is:inline>` steuert Mobile-Menü und Dropdowns.

### 1.5 Footer

`Footer.astro` lädt die Collections `socialmedia`, `intern`, `repositories` und `copyright` und rendert:

- Logo, Kurztext und Social-Media-Icons,
- interne Links („Über uns“) sowie Dokumentations-Links (`doc.data-dna.eu/de/` und `/en/`),
- Repository-Links und Förderpartner-Bilder („Unterstützt durch“, `/ueber/partner`),
- Copyright-Text und Legal-Links (`/legal/impressum`, `/legal/datenschutz`, `/legal/lizenzen`).

### 1.6 Bestehende Auswahl- und Editorpfade

````text
KommunenGrid
→ KommunenClickHandler
→ dispatchP2D2Event(KOMMUNEN_FOCUS, detail, { throttleMs: 0 })
→ MapCanvas-Listener
→ mapState.setSelectedKommune(detail)
→ CRS-, Center- oder BBOX-Navigation

KategorienGrid
→ mapState.setSelectedCategory(categorySlug)
→ dispatchP2D2Event(CATEGORY_SELECTED, detail, { throttleMs: 0 })
→ Scrollen zur Kartenansicht

mapState-Änderung
→ WFSLayerManager-Subscription
→ WFS-Layer laden oder leeren
→ WFS_LOAD_START / WFS_LOAD_COMPLETE / WFS_LOAD_ERROR

OpenLayers-Klick auf ein passendes Feature
→ FeaturePopupHandler
→ WFS-Prüfung auf Grabflur-Daten
→ Informationsdialog oder window.open() für den Feature-Editor
→ registerEditorWindow()
→ Cross-Window-Kommunikation zwischen Haupt- und Editorfenster
````

- Der generische **Feature-Editor** wird unter `/feature-editor/[featureId]` geöffnet; die URL-Parameter (`wp_name`, `container_type`, `name`, `extent`, `projection`) werden validiert. `EditorApp` orchestriert Karte, Layer, Daten, Interaktion und UI.
- Der **Grabflur-Editor** (`/verwaltung/grabflur-editor`) ist eine getrennte, rollenbeschränkte Anwendung (Rolle `verwaltung`). Kommune und räumlicher Kontext werden aus der authentifizierten Session und deren Metadaten bestimmt (`session.memberships`, `session.preferences.homeKommuneSlug`).

## Teil 2: Geplante, aber noch nicht implementierte Änderung

**Status: geplant – nicht implementiert.**

Die Überarbeitung der öffentlichen Startseite wird in einer separaten Soll-Spezifikation unter `de/specs/ptf-roadmap-umsetzung/` beschrieben. Dieser Pfad ist der geplante Ablageort und existiert zum Zeitpunkt dieser Dokumentation noch nicht. Die nachfolgenden Aussagen sind Rahmenbedingungen für diese spätere Spezifikation – **keine** Beschreibung bereits umgesetzter Funktionen.

### 2.1 Rahmenbedingungen

- Die Startseite soll p2d2 und den „digitalen Zwilling von unten“ verständlicher und einladender vermitteln.
- Die Hauptkarte bleibt zentral.
- Ein späteres lokales Karten-Onboarding soll direkte Karteninteraktion (z. B. Zoomen und Ziehen) zunächst abfangen, aber das Scrollen der Seite weiterhin zulassen.
- Dieses Onboarding darf **keine neuen fachlichen Events** und **keine Cross-Window-Kommunikation** erzeugen.
- Die Grids bleiben Auswahlmechanismen für Kommune und Kategorie.
- Die späteren Änderungen dürfen die Editor-, WFS-, Rollen- und Workflowlogik **nicht verändern**.

### 2.2 Abgrenzung

Die Soll-Spezifikation wird keine bestehenden Eventnamen, Rollen, APIs, Datenmodelle oder Workflows umbenennen. Es werden keine neuen Komponentennamen, keine neue Event- und keine neue State-Architektur eingeführt. Die vorliegende Seite dokumentiert ausschließlich den heutigen technischen Ist-Zustand; die spätere Überarbeitung wird erst nach ihrer Umsetzung in den entsprechenden Handbüchern nachgezogen.

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |
| 1.1 | 2026-08-06 | Komponentenreihenfolge der Startseite präzisiert (Standard-Header/Footer aus BaseLayout, slot header ungenutzt; externer Review). |