---
title: WFS-Layer-Architektur
description: Reaktive WFS-Schicht in p2d2 – State-Abhängigkeiten, CQL-Kontext, Lebenszyklus und Abgrenzung zur Legacy-API
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# WFS-Layer-Architektur

Dieses Kapitel beschreibt die Architektur der WFS-Integration in p2d2 aus Sicht der Frontend-Entwicklung und ergänzt den allgemeinen Systemüberblick und den [Datenfluss](./datenfluss). Es entspricht dem aktuellen Quellcode (`src/utils/wfs-layer-manager.ts`, `src/utils/map-state.ts`, `src/components/MapCanvas.astro`).

## Zielbild

Die WFS-Anbindung folgt einem **State-first**-Ansatz:

- UI-Komponenten setzen nur noch den globalen Karten-State (`mapState`).
- Der `WFSLayerManager` reagiert reaktiv auf State-Änderungen und verwaltet die WFS-Layer.
- Direkte WFS-Aufrufe aus der UI gelten als Legacy und werden nicht mehr für neue Features verwendet.

Damit werden Race-Conditions reduziert, Verantwortlichkeiten klar getrennt und der Code besser wartbar.

## Kernkomponenten

### mapState

`mapState` ist der zentrale, reaktive Zustand für die Karte und verwaltet unter anderem:

- `selectedKommune` – aktuell gewählte Kommune (inkl. `slug`, `wpName`, `osmAdminLevels`, etc.).
- `selectedCategory` – aktuell gewählte Kategorie (z. B. `cemetery`, `administrative`).

Wichtige Eigenschaften:

- Änderungen erfolgen ausschließlich über Setter wie `setSelectedKommune(...)` und `setSelectedCategory(...)`.
- Über `subscribe()` können Komponenten (z. B. der `WFSLayerManager`) den vollständigen State beziehen und auf Änderungen reagieren.
- Der State selbst kennt keine WFS-spezifische Logik; er beschreibt nur die „Absicht“ der UI.

### WFSLayerManager (reaktiv)

Der reaktive `WFSLayerManager` ist für das Laden und Verwalten der WFS-Vektorlayer in der Karte zuständig. Er:

- registriert sich im Konstruktor als Subscriber bei `mapState`,
- beobachtet Änderungen an `selectedKommune` und `selectedCategory`,
- entscheidet anhand der Kombination, ob ein WFS-Layer geladen, aktualisiert oder geleert werden muss.

Zentrale Implementierungsdetails:

- **Signatur**: Aus `(kommune.slug, categorySlug)` wird eine Signatur (`"${kommune.slug}|${categorySlug}"`) gebildet, um doppelte Requests bei unverändertem State zu vermeiden.
- **Request-Locking**: Ein `isRequestPending`-Flag verhindert konkurrierende WFS-Requests bei schnellen UI-Änderungen.
- **CQL-Filter**: Es werden ausschließlich Backend-Feldnamen verwendet, z. B. `wp_name`, `container_type`, `osm_admin_level`.
- **Projektion**: Geladene Features werden von `EPSG:4326` in die aktuelle Kartenprojektion transformiert.
- **Events**: Start, Erfolg und Fehler von WFS-Loads werden über das p2d2-Event-System (`dispatchCrossWindowEvent`) publiziert: `WFS_LOAD_START`, `WFS_LOAD_COMPLETE`, `WFS_LOAD_ERROR`.

Der Manager kapselt damit die komplette GeoServer/WFS-Komplexität und bietet nach außen eine reine State-Reaktion.

## WFS-Zugriff (anonymer Lesezugriff)

Der WFS-Zugriff erfolgt als **anonymer Lesezugriff** – der Client benötigt keine Credentials für das Laden der Vectorlayer. Der Code-Kommentar in `wfs-layer-manager.ts` formuliert das ausdrücklich:

```text
Uses anonymous WFS read access (no credentials required).
```

Konkret nutzt der Manager den `wfsAuthClient` (`src/utils/wfs-auth.ts`) für:

- `buildWFSURL("geo-containers", { CQL_FILTER, srsName })` – URL-Konstruktion,
- `fetchWFS(url)` – HTTP-Abruf der GeoJSON-Daten.

Eine „autorisierte URL“ mit hinterlegten Credentials ist für diesen Lesevorgang nicht erforderlich.

## Datenfluss UI → State → WFS

Der typische Ablauf einer Benutzeraktion sieht wie folgt aus:

1. **UI-Interaktion**
   - Nutzer:in klickt auf eine Kommune im Kommunen-Grid.
   - Nutzer:in wählt eine Kategorie im Kategorien-Grid.

2. **State-Update**
   - Kommunen-Click-Handler ruft `mapState.setSelectedKommune(detail)` auf.
   - Kategorien-Grid ruft `mapState.setSelectedCategory(categorySlug)` auf.
   - Beide Komponenten kümmern sich nur um UI-Highlighting und Navigation, nicht um WFS.

3. **Reaktive Verarbeitung**
   - Der `WFSLayerManager` erhält über `mapState.subscribe()` die neue Kombination aus `selectedKommune` und `selectedCategory`.
   - Wenn beide Werte gesetzt sind, wird eine neue Signatur berechnet und ggf. ein WFS-Request angestoßen.
   - Fehlt eine der Komponenten (nur Kommune oder nur Kategorie), wird der Layer geleert.

4. **WFS-Aufruf**
   - Aus `wpName`, `containerType` (abgeleitet aus der Kategorie) und `osmAdminLevel` (abgeleitet aus Kommune + Container-Typ) wird ein CQL-Filter gebaut.
   - Der Manager nutzt `wfsAuthClient.buildWFSURL()` und `wfsAuthClient.fetchWFS()`, um GeoJSON zu laden.
   - Features werden transformiert, in die VectorSource geschrieben und der Layer sichtbar geschaltet.

5. **Rückkanal / Monitoring**
   - Während des Ladens werden Events wie `WFS_LOAD_START`, `WFS_LOAD_COMPLETE` und `WFS_LOAD_ERROR` publiziert.
   - Andere Komponenten können diese Events für Logging, Monitoring oder UI-Feedback nutzen.

Dieses Pattern ist symmetrisch: Es spielt keine Rolle, ob zuerst die Kommune oder zuerst die Kategorie ausgewählt wird.

## CQL-Kontext

### containerType

Der `containerType` wird aus dem versteckten Element `#category-data` gelesen, das `index.astro` als `data-category-map` (Mapping `slug → { containerType }`) in die Seite einbettet:

- Existiert der Eintrag für die gewählte Kategorie, wird dessen `containerType` verwendet.
- Existiert er nicht, wird ein Fehler geworfen (kein stiller Fallback). Die Fehlermeldung verweist darauf, dass die Kategorie in `src/content/kategorien/` existieren und das Feld `containerType` im Frontmatter gesetzt haben muss.

### osmAdminLevel

Der `osmAdminLevel` wird anhand von Kommune und Container-Typ bestimmt:

- `containerType === "cemetery"` → fest `8`.
- `containerType === "administrative"` → die **nächste Untergliederung** aus `kommune.osmAdminLevels`: bei mehreren Ebenen das zweite Element, bei genau einer Ebene dieses Element, andernfalls Fallback `8`.

## Rolle der UI-Komponenten

Die UI-Komponenten haben eine klar begrenzte Verantwortung:

- **Kommunen-Grid / Kommunen-Handler**
  - Laden Kommunen-Metadaten aus Content Collections.
  - Fokussieren die Karte (Center/Zoom) per Event.
  - Setzen `selectedKommune` im `mapState`.
  - Pflegen CSS-Highlighting der Karten.

- **Kategorien-Grid**
  - Verwalten das UI-Highlighting der Kategorien.
  - Setzen `selectedCategory` im `mapState`.

Wichtig: UI-Komponenten rufen keine WFS-spezifischen Methoden (`displayLayer`, `toggleLayer`, etc.) mehr auf. Sie sind vollständig von der WFS-Implementierung entkoppelt.

## Legacy-API und Migrationspfad

Vor der Einführung des State-first-Ansatzes wurde der WFS-Layer direkt aus UI-Komponenten gesteuert, typischerweise über:

- `window.wfsManager.displayLayer(kommune, categorySlug)`
- `window.wfsManager.toggleLayer(kommune, categorySlug)`
- `window.wfsManager.hideLayer()`

**Status der Legacy-API:**

- Die Methoden `toggleLayer()`, `displayLayer()` und `hideLayer()` sind im `WFSLayerManager` weiterhin vorhanden; der Manager wird in `MapCanvas.astro` global als `window.wfsManager` exponiert.
- Die Grid-Komponenten verwenden diese API nicht mehr; das WFS-Layer-Management läuft ausschließlich über die `mapState`-Subscription.
- Neue Features dürfen die Legacy-API nicht direkt verwenden. Für neue Implementierungen gilt:
  - State-Änderungen ausschließlich über `mapState`.
  - WFS-Layer-Steuerung ausschließlich über den reaktiven `WFSLayerManager`.

**Empfohlener Migrationspfad:**

1. Identifiziere Stellen, die noch `window.wfsManager.displayLayer/toggleLayer/hideLayer` direkt aufrufen.
2. Ersetze diese Aufrufe durch:
   - `mapState.setSelectedKommune(...)`
   - `mapState.setSelectedCategory(...)`
3. Stelle sicher, dass der `WFSLayerManager` initialisiert und an die Karte gebunden ist.
4. Entferne schrittweise Legacy-Aufrufe, sobald sichergestellt ist, dass alle notwendigen State-Wege abgedeckt sind.

## Beziehung zur Geoserver-Integration

Die Geoserver-Integration im API-Referenz-Teil beschreibt WFS/WMS-Endpunkte, URL-Konstruktion und Fehlerbehandlung. Die WFS-Layer-Architektur in diesem Kapitel baut auf diesen Grundlagen auf, verschiebt aber die Verantwortung für WFS-Requests klar in den `WFSLayerManager` und koppelt ihn an den globalen Karten-State.

Weitere Details zur Geoserver-Seite der Integration finden sich unter:

- `api-referenz/geoserver-integration.md`
- [Event Handling & Cross-Window Kommunikation](./eventhandling)
- [Datenfluss](./datenfluss)

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |