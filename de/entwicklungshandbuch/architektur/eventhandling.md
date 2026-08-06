---
title: Event Handling & Cross-Window Kommunikation
description: Kanonische Architektur des Event-Systems mit drei Ebenen, Grenzen, Debugging und Cross-Window-Kommunikation
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Event Handling & Cross-Window Kommunikation

Dieses Dokument beschreibt die kanonische Architektur des Event-Systems in p2d2. Es trennt drei Ebenen klar voneinander und definiert, welche Ebene für welche Art der Kommunikation zuständig ist. Die Beschreibung entspricht dem aktuellen Quellcode (`src/utils/events.ts`, `src/utils/cross-window-events.ts`, `src/components/EventConsole.ts`).

## Die drei Event-Ebenen

### Ebene A: Lokale UI-Interaktion

Lokale Interaktionen innerhalb einer Komponente oder einer Seite nutzen **lokale DOM-Events** und **lokalen Komponenten-State**. Sie benötigen keine fachlichen p2d2-Events.

Beispiele aus dem Code:

- Tab-Umschaltung zwischen Kommunen- und Kategorien-Grid in `src/pages/index.astro` (klickbasierte `switchTab()`-Funktion, Swipe-Gesten auf dem Grid-Container).
- Scroll-Verhalten der Karten-Sektion in `src/components/OpenLayersMap.astro` (Listener auf `p2d2:kommunen:focus` und `p2d2:category:selected` lösen Scrollen aus; `scrollToSelectionHeader` wird global exponiert).
- Lokaler Editor-State in `src/components/feature-editor/EditorState.ts` (Setter mit `notifyListeners()` und reaktivem `ReactiveEditorState`).

Für lokale UI-Interaktion sind direkte DOM-Events ausdrücklich erlaubt und der Standardweg.

### Ebene B: Fachliche Hauptfenster-Events (`src/utils/events.ts`)

Fachliche Ereignisse im Hauptfenster werden über das typisierte Event-System in `src/utils/events.ts` abgewickelt.

Zentrale Bausteine:

- `P2D2EventType` – Enum aller fachlichen Event-Namen (Präfix `p2d2:`).
- `P2D2EventMap` – typsichere Zuordnung von Event-Typ zu Detail-Interface.
- `dispatchP2D2Event(eventType, detail, { throttleMs })` – typsicherer Dispatcher mit Throttling.
- `addP2D2EventListener(eventType, handler, options)` – typsicherer Listener mit HMR-Guard.
- `logToEventConsole(eventName, detail, meta)` – protokolliert Ereignisse in der EventConsole, sofern diese verfügbar ist.

Eingebaute Robustheit:

- **Throttling**: Standard-`THROTTLE_MS = 200 ms`; pro Event-Typ wird der letzte Dispatch-Zeitpunkt gespeichert. Aufrufer können `throttleMs: 0` setzen, um Throttling für einen Aufruf zu deaktivieren (z. B. `kommunen-click-handler` und `KategorienGrid` für `KOMMUNEN_FOCUS`/`CATEGORY_SELECTED`).
- **Queue und Retry**: Ereignisse werden bei nicht bereitem Event-System in eine Warteschlange gelegt und bis zu `MAX_RETRIES = 3` mit `RETRY_DELAY = 250 ms` erneut versucht; die Queue wird im Intervall `QUEUE_PROCESS_INTERVAL = 100 ms` verarbeitet.
- **EventConsole-Integration**: `dispatchP2D2Event` protokolliert über `logToEventConsole()`.

Event-Typen (Auszug der fachlichen Domänen):

- Kommune: `KOMMUNEN_FOCUS`, `KOMMUNEN_SELECTED`
- Kategorie: `CATEGORY_SELECTED`
- Karte: `MAP_READY`, `MAP_MOVEEND`, `MAP_ZOOMEND`, `MAP_CLICK`, `CRS_CHANGE`
- Layer: `LAYER_TOGGLE`, `LAYER_VISIBILITY_CHANGE`
- WFS: `WFS_LOAD_START`, `WFS_LOAD_COMPLETE`, `WFS_LOAD_ERROR`, `WFS_FEATURE_CREATED`, `WFS_FEATURE_UPDATED`, `WFS_FEATURE_DELETED`
- Editor: `EDITOR_READY`, `EDITOR_FEATURE_MODIFIED`, `EDITOR_TOOL_SWITCH`, `EDITOR_MODE_CHANGE`, `EDITOR_FEATURE_SELECTED`, `EDITOR_FEATURE_DESELECTED`, `EDITOR_SAVE_START`, `EDITOR_SAVE_COMPLETE`, `EDITOR_SAVE_ERROR`
- UI: `UI_PANEL_TOGGLE`

Persistenzschlüssel in `events.ts`:

- `p2d2_selected_crs` (getSelectedCRS/setSelectedCRS)
- `p2d2_selected_kommune` (getSelectedKommune/setSelectedKommune)
- `clearSelections()` räumt beide Schlüssel.

### Ebene C: Cross-Window-Ereignisse (`src/utils/cross-window-events.ts`)

Ereignisse, die sowohl lokal als auch fensterübergreifend wirken müssen, laufen über die Cross-Window-Bridge in `src/utils/cross-window-events.ts`.

Zentrale Funktionen:

- `dispatchCrossWindowEvent(eventType, detail, { crossWindow = true })`
  1. Dispatcht das Ereignis lokal als `CustomEvent`.
  2. Protokolliert es in der EventConsole mit `source`, `windowId` und (bei Weiterleitung) `crossWindow`.
  3. Sendet es bei aktiviertem `crossWindow` an verbundene Fenster:
     - Editor-Fenster → Hauptfenster über `window.opener.postMessage(...)`.
     - Hauptfenster → alle registrierten Editor-Fenster über `broadcastToEditorWindows(...)`.
- `initializeCrossWindowBridge()` – muss in jedem Fenster (Haupt- und Editor-Fenster) aufgerufen werden. Sie registriert einen `message`-Listener, prüft die Herkunft (`event.origin === window.location.origin`) und akzeptiert ausschließlich Nachrichten vom Typ `p2d2:cross-window-event`.
- `registerEditorWindow(editorWindow)` – registriert ein geöffnetes Editor-Fenster im Hauptfenster; die Registrierung wird beim Schließen des Fensters automatisch entfernt (Intervall-Check, 1000 ms).
- `getWindowId()` – liefert die eindeutige Fenster-ID; `getWindowType()` unterscheidet `main` und `editor` (`isMainWindow()` prüft `!window.opener`).

Eingesetzt wird Ebene C unter anderem von:

- `WFSLayerManager` für `WFS_LOAD_START`, `WFS_LOAD_COMPLETE`, `WFS_LOAD_ERROR`.
- `EditorState` für `EDITOR_FEATURE_SELECTED`, `EDITOR_FEATURE_DESELECTED`, `EDITOR_TOOL_SWITCH`, `EDITOR_MODE_CHANGE`.
- `MapCanvas` für `MAP_READY`.
- `EditorApp` und `GrabflurEditorApp` für `EDITOR_READY`.

Sicherheitsmodell:

- **Same-Origin-Pflicht**: Nur Nachrichten der eigenen Herkunft (`window.location.origin`) werden verarbeitet.
- **Nachrichtentyp-Prüfung**: Nur `p2d2:cross-window-event`-Nachrichten werden angenommen.
- **Zielsteuerung**: Editor-Fenster senden an `window.opener`; das Hauptfenster sendet ausschließlich an die registrierten Editor-Fenster.

## Verbindliche Grenzen

- `dispatchP2D2Event()` ist der **Standard** für fachliche Hauptfenster-Events.
- `dispatchCrossWindowEvent()` ist für Ereignisse vorgesehen, die **lokale und fensterübergreifende** Kommunikation benötigen.
- **Direkte DOM-Events** sind für lokale UI-Interaktion erlaubt (Ebene A).
- **Direkte `window.dispatchEvent()`-Aufrufe** sind kein allgemeines Muster für neue Funktionen. Sie treten nur in bestehenden, dokumentierten Sonder- oder Fallbackpfaden auf – beispielsweise im `KommunenClickHandler`, wenn der typisierte Dispatcher fehlschlägt:

```ts
// src/utils/kommunen-click-handler.ts – dokumentierter Fallback
try {
  dispatchP2D2Event(P2D2EventType.KOMMUNEN_FOCUS, detail, { throttleMs: 0 });
} catch (error) {
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(P2D2EventType.KOMMUNEN_FOCUS, { detail }),
    );
  }, 100);
}
```

- Die **EventConsole protokolliert nur Vorgänge**, die `logToEventConsole()` erreichen. Sie beobachtet nicht automatisch beliebige DOM-Events.

## Auswahl- und Kartenpfade (Kurzübersicht)

```text
KommunenGrid
→ KommunenClickHandler
→ dispatchP2D2Event(P2D2EventType.KOMMUNEN_FOCUS, detail, { throttleMs: 0 })
→ MapCanvas-Listener (addP2D2EventListener)
→ mapState.setSelectedKommune(detail)
→ CRS-, Center- oder BBOX-Navigation

KategorienGrid
→ mapState.setSelectedCategory(categorySlug)
→ dispatchP2D2Event(P2D2EventType.CATEGORY_SELECTED, detail, { throttleMs: 0 })
→ Scrollen zur Kartenansicht

mapState-Änderung
→ WFSLayerManager-Subscription
→ WFS-Layer laden oder leeren
→ dispatchCrossWindowEvent(WFS_LOAD_START | WFS_LOAD_COMPLETE | WFS_LOAD_ERROR)
```

## Editorpfad (Kurzübersicht)

```text
OpenLayers-Klick auf ein passendes Feature
→ FeaturePopupHandler
→ WFS-Prüfung auf Grabflur-Daten
→ Informationsdialog oder window.open() für den Feature-Editor
→ registerEditorWindow()
→ Cross-Window-Kommunikation zwischen Haupt- und Editorfenster
```

Der generische Feature-Editor und der Grabflur-Editor sind getrennte Anwendungen beziehungsweise Abläufe. Der Grabflur-Editor ist rollenbeschränkt und wird über `/verwaltung/grabflur-editor` aufgerufen; er bestimmt Kommune und räumlichen Kontext aus der authentifizierten Session und deren Metadaten.

## Debugging mit der EventConsole

Die EventConsole (`src/components/EventConsole.ts`) ist ein Overlay zur Live-Beobachtung protokollierter p2d2-Events.

Aktivierung und Bedienung:

- **URL-Parameter**: `?debug=events` aktiviert die Konsole (in Produktion ist sie ohne diesen Parameter deaktiviert; im Dev-Modus ist sie grundsätzlich aktivierbar).
- **Tastenkürzel**: `Ctrl+Shift+E` (Windows/Linux) bzw. `Cmd+Shift+E` (Mac) toggelt die Konsole – das Kürzel ist unabhängig vom Aktivierungszustand registriert.
- **Filter**: Textfeld zur Filterung der Logs.
- **Clear**: leert alle Log-Einträge.
- **Export**: „Copy JSON“-Button exportiert die Logs als JSON.

Eigenschaften:

- `STORAGE_KEY = "p2d2:debug:events"` – speichert `{ visible, timestamp }`; der Zustand wird nur wiederhergestellt, wenn er jünger als 24 Stunden ist.
- `maxLogs = 50` – ältere Einträge werden verworfen.
- Jeder Log-Eintrag enthält Zeitstempel, Event-Typ, Detail und optionale Metadaten (`source`, `windowId`, `crossWindow`, `retryCount`, `throttled`, `success`, `error`).
- Die Konsole wird über `window.__P2D2_EVENT_CONSOLE__` angesprochen; `logToEventConsole()` prüft genau dieses globale Objekt.

## Dokumentierte technische Beobachtungen

- `initializeCrossWindowBridge()` wird in den Editor-Einstiegspunkten mehrfach aufgerufen (unter anderem im Frontmatter und im Skript von `src/pages/feature-editor/[featureId].astro` sowie in `GrabflurEditorApp.init()`). Diese Aufgabe dokumentiert den Ist-Zustand; der Bridge-Code wird nicht verändert.

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |