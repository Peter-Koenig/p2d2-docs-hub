---
title: "Astro Components"
description: "Dokumentation der belegten Astro-Komponenten in p2d2: Layout, Header, Footer, Hero, Karten- und Grid-Komponenten"
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Astro Components

Dieses Dokument beschreibt die Astro-Komponenten der p2d2-Startseite und des Editors auf Basis des aktuellen Quellcodes. Es dokumentiert ausschließlich den belegten Ist-Zustand. Frühere, nicht durch den Quellcode belegbare Komponentenbeschreibungen (z. B. `Modal.astro`, `ThemenbereichCard.astro`, `CommunitySection.astro`, `CallToAction.astro`, `MissionStatement.astro`) wurden entfernt.

## Aufbau der Startseite

Die Startseite (`src/pages/index.astro`) nutzt `BaseLayout` und die folgenden Komponenten in dieser Reihenfolge:

```text
BaseLayout
→ Header (über slot "header")
→ index.astro
   → HeroSection
   → OpenLayersMap
      → MapCanvas
   → KommunenGrid / KategorienGrid (mit Tab-Umschaltung)
   → WerteGrid
→ Footer
```

## BaseLayout.astro

**Zweck:** Zentrales Seitenlayout mit HTML-Grundstruktur, Header- und Footer-Einbindung.

**Props:**

| Prop | Typ | Default | Beschreibung |
|---|---|---|---|
| `title` | `string` | – (Pflicht) | Seitentitel im `<title>`-Tag |
| `description` | `string` | – | Optionale Beschreibung (im Code definiert, wird an die Head-Sektion übergeben) |
| `showFooter` | `boolean` | `true` | Steuert, ob der Footer gerendert wird |

**Slots:**

- `header` (named): Überschreibt den Standard-Header. Wird z. B. vom Feature-Editor genutzt (`<FeatureEditorHeader slot="header">`).
- `default`: Seiteninhalt innerhalb des `<main>`-Elements.

**Eigenschaften:**

- `<html lang="de">`, responsive Viewport-Meta-Tag.
- Favicon-Konfiguration für viele Formate (SVG, ICO, 16/32/48/64/128 px, Apple-Touch-Icon) sowie Web-App-Manifest.
- `theme-color: #000080`.
- `body` mit `text-gray-900 flex flex-col min-h-screen`.
- `<main class="flex-1 flex flex-col">` enthält den Default-Slot.
- `{showFooter && <Footer />}` bindet den Footer nur bei Bedarf ein.

## Header.astro

**Zweck:** Globale Hauptnavigation mit Logo, Desktop- und Mobile-Menü, Login/Logout und rollenabhängigen Menüpunkten.

**Rollenabhängige Sichtbarkeit** (aus `src/lib/auth/session`, `getUserSession(Astro.locals)`):

- `canShowVerwaltung`: `isAuthenticated && roles.includes("verwaltung")` → Menüpunkt „Verwaltung" (`/verwaltung`).
- `canShowOsm`: `isAuthenticated && roles.includes("osm")` → Menüpunkt „OSM" (`/osm`).

**Navigationsstruktur (`nav`-Array):**

- „Über p2d2" (Dropdown mit children): Hintergrund `/ueber/hintergrund`, Ziel `/ueber/ziel`, Umsetzung `/ueber/umsetzung`, CIVITAS/CORE `/ueber/civitas-core`, Status `/ueber/status`, Zukunft `/ueber/zukunft`, Tests `/ueber/testen`.
- Themenbereiche `/themenbereiche`
- Community `/community`
- Mitmachen `/mitmachen`
- Kontakt `/kontakt`
- Bedingt: Verwaltung `/verwaltung`, OSM `/osm`

**Aktive Zustände:** `currentPath = Astro.url.pathname`; `isActive()` prüft bei `/` exakt und sonst per `startsWith`.

**User-Bereich:**

- Nicht angemeldet: Link „Anmelden" auf `/api/auth/login`.
- Angemeldet: Dropdown mit Initialen (aus `displayName ?? userName`, erste zwei Buchstaben) und „Abmelden" auf `/api/auth/logout`.

**Client-Script:** `<script is:inline>` für Mobile-Menü (Hamburger, Overlay, Sidebar) und User-Dropdowns (`openMobileMenu`/`closeMobileMenu`).

## Footer.astro

**Zweck:** Globaler Footer mit dynamischen Inhalten aus Content Collections.

**Geladene Collections:** `socialmedia`, `intern`, `repositories`, `copyright`.

**Aufbau:**

- Linke Spalte: Logo, Kurztext, Social-Media-Icons (`/images/icons/{icon}.svg`).
- Mittlere Spalte: „Über uns" mit `intern`-Links und Dokumentations-Links (`https://doc.data-dna.eu/de/` und `/en/`).
- Rechte Spalte: „Ressourcen" mit `repositories`-Links und Förderpartner-Bildern („Unterstützt durch", `/ueber/partner`).
- Untere Leiste: Copyright-Text (aus Collection `copyright`) sowie Legal-Links `/legal/impressum`, `/legal/datenschutz`, `/legal/lizenzen`.

## HeroSection.astro

**Zweck:** Hero-Bereich der Startseite mit Video-Hintergrund und Content-Overlay.

**Eigenschaften:**

- Video (autoplay, loop, muted, playsinline) mit `poster="/images/hero-fallback.jpg"` und den Quellen `/videos/hero-bg.webm` und `/videos/hero-bg.mp4`.
- Inhalt stammt aus `src/content/hero.md` (`import { Content as HeroContent } from "../content/hero.md"`).
- Entwurf-Overlay: In den vier Ecken wird „v0.5" eingeblendet (`.entwurf-ecke`-Elemente), als sichtbarer Hinweis auf den Prototyp-Status.
- Responsive Höhen (`h-[20rem]` mobil, `md:h-[30rem]`).

## OpenLayersMap.astro

**Zweck:** Karten-Sektion der Startseite mit Auswahl-Links und Einbindung von `MapCanvas`.

**Eigenschaften:**

- Überschrift `#kommune-kategorie-header` mit Links „Kommune" (orange, auf `#kommunen-grid`) und „Kategorie" (grün, auf `#kategorien-grid`).
- `<main>`-Container mit `MapCanvas`.
- `<script is:inline>`:
  - `handleKommuneClick()` / `handleKategorieClick()`: scrollen zum Grid-Container und rufen `window.switchTab("kommunen" | "kategorien")` auf (Fallback: `.tab-button[data-tab="..."]` per DOM-Click).
  - `scrollToSelectionHeader()`: scrollt zur Karte (`#map`) bzw. zum Auswahl-Header, berücksichtigt die feste Header-Höhe; wird global als `window.scrollToSelectionHeader` exponiert.
  - Listener auf `p2d2:kommunen:focus` und `p2d2:category:selected` lösen das Scrollen nach 300 ms aus.

## MapCanvas.astro

**Zweck:** Hauptkarte mit OpenLayers und Interaktionslogik (CRS, WFS, Popup, Tabs).

**Wichtig:** `MapCanvas.astro` verwendet **normale Astro-`<script>`-Blöcke** und **keine** `client:load`-Directive. Die frühere Dokumentation, die eine Client-Directive behauptete, ist damit korrigiert.

**Eigenschaften:**

- Karteninitialisierung im Skript: `new Map({ target: "map", layers: [TileLayer mit OSM], view: View mit mapState.getConfig().defaultCRS, FullScreen-Control })`.
- Nach dem ersten `postrender`: Canvas-Styling und `MutationObserver` für spätere Canvas-Knoten.
- CRS-Umschaltung über `#crs-toggle-button` (`updateCRSButton()`, `toggleCRS()`); der Button ist ohne `localCRS` deaktiviert.
- Tab-Buttons `#tab-kommunen` und `#tab-kategorien` als Overlay auf der Karte (scrollen zum Grid und rufen `switchTab` auf).
- Initialzustand: Wiederherstellung aus `localStorage` (`mapState.restoreFromStorage`) oder Köln-Fallback (Center `[6.9603, 50.9375]`, Zoom 11, `EPSG:25832`).
- Instanziiert `WFSLayerManager` und `FeaturePopupHandler`.
- Exponiert global: `window.map`, `window.wfsManager`, `window.popupHandler`, `window.mapState`.

## Kategorien.astro

**Zweck:** Einzelne Kategorie-Karte im Kategorien-Raster.

**Props:** `title`, `icon`, `description`, `id`, `slug`, `imageVersion` (Default `"001"`).

**Eigenschaften:**

- `<button class="kategorie-card" data-category-slug={slug}>` mit Foto, Gradient und grünem Farbstreifen.
- Bildpfad: `/images/kategorien/{slug}_{imageVersion}.jpg`.

## KategorienGrid.astro

**Zweck:** Raster der Themenkategorien mit Klick-Auswahl.

**Eigenschaften:**

- Lädt `kategorien` über `getCollection("kategorien")`, sortiert nach `order`, begrenzt auf 12 Einträge.
- Das Grid-Element trägt die `id="kategorien-grid"`.
- Klick-Script: dokumentweiter Listener auf `[data-category-slug]`; setzt `mapState.setSelectedCategory(categorySlug)` (Toggle bei erneutem Klick), dispatched `P2D2EventType.CATEGORY_SELECTED` mit `{ throttleMs: 0 }` und ruft als Fallback `window.scrollToSelectionHeader()` nach 350 ms auf.

## KommunenGrid.astro

**Zweck:** Raster der teilnehmenden Kommunen.

**Eigenschaften:**

- Lädt `kommunen` über `getCollection("kommunen")`, sortiert nach `order`.
- Baut `kommuneDataMap` (`slug → { wpName, osmAdminLevels }`) und übergibt sie als `data-kommune-map` an das Grid-Element.
- Pro Karte: `data-slug`, `data-kommune-slug`, `data-detail` (JSON mit `center`, `extent`, `zoom`, `projection`, `extra`, `slug`) und Farbstreifen über `--color-stripe`.
- Bildpfad: `/images/kommunen/{slug}_{imageVersion}.jpg`.
- Klick-Verarbeitung: `KommunenClickHandler` (`src/utils/kommunen-click-handler.ts`); Initialisierung mit Guard (`window.__p2d2KommunenHandlerBound`) und HMR-Cleanup über `import.meta.hot.dispose`.

## WerteGrid.astro

**Zweck:** Werte-Raster der Startseite.

**Eigenschaften:**

- Lädt `werte` über `getCollection("werte")`, sortiert nach `order`, begrenzt auf 12 Einträge.
- Rendert pro Eintrag die Komponente `Werte.astro` mit `title`, `icon` und `description` (Markdown-Body).

## Dokumentierte technische Beobachtungen

Folgende Punkte werden als bestätigter Ist-Zustand festgehalten und in dieser Aufgabe nicht behoben:

- Die ID `kategorien-grid` kommt aktuell sowohl in `src/pages/index.astro` (Tab-Container) als auch in `src/components/KategorienGrid.astro` (Grid-Element) vor. Das ist eine doppelte DOM-ID.
- Persistenzschlüssel für Kommune und Kategorie sind in mehreren Dateien nicht einheitlich benannt (z. B. `selectedMunicipalityDetail`, `p2d2_selected_kommune_slug`, `selectedCategory`). Siehe dazu [Datenfluss](../../architektur/datenfluss), Abschnitt Persistenz.

## Nicht enthalten

Folgende Komponenten wurden in früheren Fassungen beschrieben, sind aber durch die gelesenen Quelldateien nicht belegt und daher entfernt:

- `Modal.astro`
- `ThemenbereichCard.astro`
- `CommunitySection.astro` (nur als auskommentierter Import in `index.astro` vorhanden)
- `CallToAction.astro`
- `MissionStatement.astro` (nur als auskommentierter Import in `index.astro` vorhanden)

## Verwandte Dokumente

- [Projektstruktur](../../architektur/projektstruktur) – Quellcode-Baum und Zuständigkeiten
- [OpenLayers Integration](../karten/openlayers-integration) – MapCanvas und Karteninitialisierung
- [Kommunen Content Collections](../kommunen/content-collections) – Collections und HTML-Datenübergabe
- [Event Handling & Cross-Window Kommunikation](../../architektur/eventhandling) – Events der Grids und der Karte

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |