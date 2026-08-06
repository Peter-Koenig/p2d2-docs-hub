---
title: Event System – API-Referenz
description: API-orientierte Referenz zum typisierten Event-System in src/utils/events.ts
lastUpdated: 2026-08-06
quality:
  completeness: 85
  accuracy: 90
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Event System – API-Referenz

Dieses Dokument ist die API-orientierte Referenz zu `src/utils/events.ts`. Es beschreibt die öffentlichen Exporte, Event-Typen, Dispatcher, Listener, Queue-/Retry-Mechanik und Persistenzfunktionen. Die Architektur und die Abgrenzung der drei Event-Ebenen (lokal, Hauptfenster, Cross-Window) sind im Dokument [Event Handling & Cross-Window Kommunikation](../../architektur/eventhandling) beschrieben.

## Übersicht

`events.ts` ist die Ebene B des p2d2-Event-Systems: die fachlichen Hauptfenster-Events. Das Modul ist vollständig typsicher aufgebaut:

- `P2D2EventType` definiert alle fachlichen Event-Namen (Präfix `p2d2:`).
- `P2D2EventMap` verknüpft jeden Event-Typ mit einem Detail-Interface.
- `dispatchP2D2Event()` dispatcht typisierte Events mit Throttling.
- Eine interne Queue mit Retry-Mechanik macht das Dispatchen robust gegenüber einem noch nicht bereiten Event-System.
- `logToEventConsole()` integriert die EventConsole, sofern sie als `window.__P2D2_EVENT_CONSOLE__` verfügbar ist.
- Kleine Persistenzhelfer verwalten ausgewählte Kommune und CRS in `localStorage`.

Konstanten:

```ts
const THROTTLE_MS = 200;              // Standard-Throttling in ms
const MAX_RETRIES = 3;                // Maximale Wiederholungen der Queue
const RETRY_DELAY = 250;              // definiert, derzeit im sichtbaren Queue-Pfad nicht verwendet
const QUEUE_PROCESS_INTERVAL = 100;   // Intervall der Queue-Verarbeitung in ms
```

## P2D2EventType

Das Enum `P2D2EventType` ist der zentrale Event-Katalog. Alle Werte tragen das Präfix `p2d2:`.

| Enum-Konstante | Event-String | Domäne |
|---|---|---|
| `KOMMUNEN_FOCUS` | `p2d2:kommunen:focus` | Kommune fokussieren (Karte/Zoom) |
| `KOMMUNEN_SELECTED` | `p2d2:kommunen:selected` | Kommune ausgewählt |
| `CATEGORY_SELECTED` | `p2d2:category:selected` | Kategorie ausgewählt |
| `MAP_READY` | `p2d2:map:ready` | Karte initialisiert |
| `MAP_MOVEEND` | `p2d2:map:moveend` | Kartenbewegung abgeschlossen |
| `MAP_ZOOMEND` | `p2d2:map:zoomend` | Zoom abgeschlossen |
| `MAP_CLICK` | `p2d2:map:click` | Klick auf die Karte |
| `LAYER_TOGGLE` | `p2d2:layer:toggle` | Layer umgeschaltet |
| `LAYER_VISIBILITY_CHANGE` | `p2d2:layer:visibility:change` | Layer-Sichtbarkeit geändert |
| `WFS_LOAD_START` | `p2d2:wfs:load:start` | WFS-Ladevorgang gestartet |
| `WFS_LOAD_COMPLETE` | `p2d2:wfs:load:complete` | WFS-Ladevorgang erfolgreich |
| `WFS_LOAD_ERROR` | `p2d2:wfs:load:error` | WFS-Ladevorgang fehlgeschlagen |
| `WFS_FEATURE_CREATED` | `p2d2:wfs:feature:created` | WFS-Feature erstellt |
| `WFS_FEATURE_UPDATED` | `p2d2:wfs:feature:updated` | WFS-Feature aktualisiert |
| `WFS_FEATURE_DELETED` | `p2d2:wfs:feature:deleted` | WFS-Feature gelöscht |
| `EDITOR_READY` | `p2d2:editor:ready` | Editor initialisiert |
| `EDITOR_FEATURE_MODIFIED` | `p2d2:editor:feature:modified` | Feature im Editor modifiziert |
| `EDITOR_TOOL_SWITCH` | `p2d2:editor:tool:switch` | Werkzeug gewechselt |
| `EDITOR_MODE_CHANGE` | `p2d2:editor:mode:change` | Editor-Modus geändert |
| `EDITOR_FEATURE_SELECTED` | `p2d2:editor:feature:selected` | Feature ausgewählt |
| `EDITOR_FEATURE_DESELECTED` | `p2d2:editor:feature:deselected` | Feature abgewählt |
| `EDITOR_SAVE_START` | `p2d2:editor:save:start` | Speichern begonnen |
| `EDITOR_SAVE_COMPLETE` | `p2d2:editor:save:complete` | Speichern erfolgreich |
| `EDITOR_SAVE_ERROR` | `p2d2:editor:save:error` | Speichern fehlgeschlagen |
| `CRS_CHANGE` | `p2d2:crs:change` | Koordinatensystem gewechselt |
| `UI_PANEL_TOGGLE` | `p2d2:ui:panel:toggle` | UI-Panel umgeschaltet |

Zusätzlich wird ein Kompatibilitäts-Alias exportiert:

```ts
export const EVENT_KOMMUNEN_FOCUS = P2D2EventType.KOMMUNEN_FOCUS;
```

## P2D2EventMap

`P2D2EventMap` bildet jeden Event-Typ typsicher auf sein Detail-Interface ab. Sie wird von Dispatcher und Listenern verwendet, damit beim Aufruf bereits zur Compile-Zeit die korrekten Details erzwungen werden.

```ts
export interface P2D2EventMap {
  [P2D2EventType.KOMMUNEN_FOCUS]: KommunenFocusDetail;
  [P2D2EventType.KOMMUNEN_SELECTED]: KommunenSelectedDetail;
  [P2D2EventType.CATEGORY_SELECTED]: CategorySelectedDetail;
  // ... alle übrigen Event-Typen analog
}
```

Belegte Detail-Interfaces (Auszug der gelesenen Felder):

```ts
export interface KommunenFocusDetail {
  center?: [number, number];
  extent?: [number, number, number, number];
  zoom?: number;
  projection?: string;
  extra?: any;
  slug?: string;
  wpName?: string;
  osmAdminLevels?: number[];
}

export interface KommunenSelectedDetail {
  slug: string;
  wpName: string;
  osmAdminLevels?: number[];
  timestamp: number;
}

export interface CategorySelectedDetail {
  categorySlug: string;
  timestamp: number;
}

export interface MapReadyDetail {
  mapId?: string;
  view?: any;
  projection?: string;
  timestamp: number;
  center: number[];
  zoom: number | undefined;
}

export interface WFSLoadStartDetail {
  layerName: string;
  kommuneSlug?: string;
  categorySlug?: string;
  timestamp: number;
}

export interface WFSLoadCompleteDetail {
  layerName: string;
  kommuneSlug?: string;
  categorySlug?: string;
  featureCount: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface WFSLoadErrorDetail {
  layerName: string;
  kommuneSlug?: string;
  categorySlug?: string;
  error: string;
  timestamp: number;
}
```

Weitere Interfaces in `P2D2EventMap`: `LayerToggleDetail`, `MapMoveEndDetail`, `MapZoomEndDetail`, `MapClickDetail`, `LayerVisibilityChangeDetail`, `WFSFeatureCreatedDetail`, `WFSFeatureUpdatedDetail`, `WFSFeatureDeletedDetail`, `EditorReadyDetail`, `EditorFeatureModifiedDetail`, `EditorToolSwitchDetail`, `EditorModeChangeDetail`, `EditorFeatureSelectedDetail`, `EditorFeatureDeselectedDetail`, `EditorSaveStartDetail`, `EditorSaveCompleteDetail`, `EditorSaveErrorDetail`, `CRSChangeDetail`, `UIPanelToggleDetail`.

## dispatchP2D2Event()

Der typsichere Standard-Dispatcher für fachliche Hauptfenster-Events.

```ts
export function dispatchP2D2Event<T extends P2D2EventType>(
  eventType: T,
  detail: P2D2EventMap[T],
  options?: { throttleMs?: number },
): void
```

- Standard-Throttling: `THROTTLE_MS` (200 ms) pro Event-Typ.
- Mit `options.throttleMs: 0` kann das Throttling für einen einzelnen Aufruf deaktiviert werden (verwendet zum Beispiel im `KommunenClickHandler` und im `KategorienGrid`).
- Der Dispatch durchläuft intern `dispatchThrottledEvent()`, das bei Bedarf die Queue- und Retry-Mechanik anstößt.

## addP2D2EventListener()

Typsicherer Listener zum Registrieren eines Event-Handlers.

```ts
export function addP2D2EventListener<T extends P2D2EventType>(
  eventType: T,
  handler: (event: CustomEvent<P2D2EventMap[T]>) => void,
  options?: AddEventListenerOptions,
): void
```

Beispiel aus `MapCanvas.astro`:

```ts
addP2D2EventListener(P2D2EventType.KOMMUNEN_FOCUS, (e) => {
  const d = (e as CustomEvent)?.detail || {};
  // ...
}, { passive: true });
```

## addEventListener()

addEventListener() kapselt die Registrierung von window-Event-Listenern und legt Handler-Referenzen auf window ab. Die Funktion enthält einen Versuch zur HMR-Absicherung. Wegen der dynamischen Schlüsselbildung mit Date.now() ist aus dem aktuellen Code jedoch keine verlässliche Deduplizierung gleichartiger vorheriger Registrierungen ableitbar.

```ts
export function addEventListener(
  eventName: string,
  handler: (event: any) => void,
  options?: AddEventListenerOptions,
): void
```

## logToEventConsole()

Protokolliert ein Event in der EventConsole, sofern diese verfügbar ist.

```ts
export function logToEventConsole(
  eventName: string,
  detail: any,
  meta?: {
    retryCount?: number;
    throttled?: boolean;
    success?: boolean;
    error?: string;
    source?: string;
    windowId?: string;
    crossWindow?: boolean;
    timestamp?: number;
  },
): void
```

Die Funktion prüft das globale Objekt `window.__P2D2_EVENT_CONSOLE__`; nur wenn es existiert, wird `logEvent()` aufgerufen. Sie schlägt bei Fehlern still fehl (Debug-Funktionalität). Die EventConsole protokolliert ausschließlich Vorgänge, die diese Funktion erreichen – sie beobachtet keine beliebigen DOM-Events.

## Event-Queue und Retry

Bei nicht bereitem Event-System (`document.readyState === "loading"` oder `window.dispatchEvent` nicht vorhanden) werden Events in eine interne Queue gelegt und mit Retry verarbeitet:

- `MAX_RETRIES = 3`
- `RETRY_DELAY` ist als Konstante definiert (250 ms), wird im aktuell sichtbaren Queue-/Retry-Pfad jedoch nicht verwendet – es wird keine garantierte Retry-Verzögerung dokumentiert.
- `QUEUE_PROCESS_INTERVAL = 100` ms
- `isEventSystemReady()` prüft die Bereitschaft des Event-Systems.

Die Queue wird über `processEventQueue()` abgearbeitet; ein Flag verhindert rekursive Verarbeitung. Fehlgeschlagene Dispatches werden bis zur `MAX_RETRIES`-Grenze erneut eingereiht.

Die folgenden Funktionen sind **intern** und nicht öffentlicher Teil der API: `throttle()`, `isEventSystemReady()`, `processEventQueue()`, `queueEvent()`, `dispatchThrottledEvent()`, `isValidWgs84Coordinate()`, `isValidWgs84Extent()`.

## Persistenz

`events.ts` stellt kleine Helfer für ausgewählte Einstellungen in `localStorage` bereit:

```ts
const STORAGE_KEYS = {
  SELECTED_CRS: "p2d2_selected_crs",
  SELECTED_KOMMUNE: "p2d2_selected_kommune",
};
```

| Funktion | Beschreibung |
|---|---|
| `getSelectedCRS(): string \| null` | Liest den zuletzt gewählten CRS-Schlüssel. |
| `setSelectedCRS(crs: string): void` | Schreibt den CRS-Schlüssel. |
| `getSelectedKommune(): string \| null` | Liest den zuletzt gewählten Kommunen-Schlüssel. |
| `setSelectedKommune(slug: string): void` | Schreibt den Kommunen-Schlüssel. |
| `clearSelections(): void` | Entfernt beide Schlüssel. |

> Hinweis: Neben `events.ts` verwenden weitere Dateien eigene Persistenzschlüssel (unter anderem `map-state.ts`, `kommunen-click-handler.ts`, `index.astro`). Die Schlüssel sind derzeit nicht einheitlich benannt. Dies wird in der Dokumentation als Ist-Zustand beobachtet, aber nicht behoben.

## Nicht Teil dieser Datei

`events.ts` enthält **kein** Logger-Modul (`logger.ts`), **keine** WFS-Client-Funktionen, **kein** Request-Caching und **keine** Klartext-Zugangsdaten. Frühere Dokumentfassungen haben solche Inhalte dieser Datei zugeschrieben; sie sind nicht durch den Quellcode belegt und wurden entfernt. Die WFS-Integration ist in [WFS-Layer-Architektur](../../architektur/wfs-layer-architektur) dokumentiert, die Cross-Window-Kommunikation in [Event Handling & Cross-Window Kommunikation](../../architektur/eventhandling).

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Dokumentation am aktuellen Quellcode ausgerichtet; frühere, nicht mehr belegbare Aussagen entfernt oder als historisch markiert. |
| 1.1 | 2026-08-06 | RETRY_DELAY-Nutzung und HMR-Deduplizierung von addEventListener präzisiert (externer Review). |