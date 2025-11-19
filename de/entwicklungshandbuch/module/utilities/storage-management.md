---
title: Storage & State Management
description: Umfassende Dokumentation für Persistenz, State-Management und Datenverwaltung
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Storage & State Management

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Das Storage- und State-Management in p2d2 bietet robuste Lösungen für Datenpersistenz, Zustandsverwaltung und Session-Management. Diese Utilities gewährleisten konsistente Datenhaltung über Browser-Sessions hinweg und ermöglichen komplexe State-Interaktionen zwischen verschiedenen Anwendungskomponenten.

## Hauptmodule

### 1. Map State Manager (`map-state.ts`)

Zentraler Zustandsmanager für Karten-bezogene Daten mit Event-System und Persistenz.

#### State-Struktur

```typescript
export interface MapState {
  activeCRS: string;           // Aktuelle Projektion (z.B. "EPSG:3857")
  localCRS: string | undefined; // Lokale Projektion für spezifische Kommunen
  selectedCategory: string | null; // Ausgewählte Kategorie
  selectedKommune: any | null;     // Aktuelle Kommune
  isInitialized: boolean;          // Initialisierungsstatus
}

export interface MapConfig {
  defaultCRS: string;    // Standard-Projektion
  wmsUrl: string;        // WMS Service URL
  wmsLayer: string;      // WMS Layer Name
}
```

#### State-Management-Klasse

```typescript
class MapStateManager {
  private state: MapState;
  private config: MapConfig;
  private listeners: Set<(state: MapState) => void> = new Set();

  // State-Operationen
  getState(): Readonly<MapState>
  updateState(updates: Partial<MapState>): void
  subscribe(listener: (state: MapState) => void): () => void

  // Spezifische Setter
  setActiveCRS(crs: string): void
  setLocalCRS(crs: string | undefined): void
  setSelectedCategory(category: string | null): void
  setSelectedKommune(kommune: any | null): void
  setInitialized(initialized: boolean): void

  // Getter
  getSelectedKommune(): any | null
  getSelectedCategory(): string | null

  // Persistenz
  restoreFromStorage(): void
}
```

### 2. Event System (`events.ts`)

Robustes Event-Handling mit Retry-Mechanismus, Throttling und Queue-Management.

#### Event-Typen und Queue

```typescript
// Standard-Event-Typen
export const EVENT_KOMMUNEN_FOCUS = "kommunen:focus";

interface QueuedEvent {
  eventName: string;
  detail: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Globale Event-Queue
const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;
```

#### Event-Dispatching

```typescript
/**
 * Dispatch mit Throttling und Retry-Mechanismus
 */
export function dispatchThrottledEvent(
  eventName: string,
  detail: any = {},
  throttleMs: number = 200
): void

/**
 * Robuste Kommunen-Focus-Event-Dispatch
 */
export function dispatchKommunenFocus(detail: KommunenFocusDetail): void

/**
 Event-Listener mit HMR-Guard
 */
export function addEventListener(
  eventName: string,
  handler: (event: any) => void,
  options?: AddEventListenerOptions
): void
```

#### Storage-Helper

```typescript
// Local Storage Keys
const STORAGE_KEYS = {
  SELECTED_CRS: "p2d2_selected_crs",
  SELECTED_KOMMUNE: "p2d2_selected_kommune",
};

// Storage-Operationen
export function getSelectedCRS(): string | null
export function setSelectedCRS(crs: string): void
export function getSelectedKommune(): string | null
export function setSelectedKommune(slug: string): void
export function clearSelections(): void
```

### 3. Tab Persistence (`tab-persistence.ts`)

Session-Management für Browser-Tabs mit Cross-Tab-Kommunikation.

#### Tab-Synchronisation

```typescript
/**
 * Verwaltet persistente Daten über Browser-Tabs hinweg
 */
export class TabPersistenceManager {
  private storageKey: string;
  private channel: BroadcastChannel | null;

  constructor(storageKey: string = "p2d2_tab_state") {
    this.storageKey = storageKey;
    this.channel = typeof BroadcastChannel !== 'undefined' 
      ? new BroadcastChannel(storageKey) 
      : null;
  }

  // State-Operationen
  setState(state: any): void
  getState(): any
  clearState(): void

  // Cross-Tab-Kommunikation
  syncAcrossTabs(): void
  onStateChange(callback: (state: any) => void): void
}
```

## Verwendung in der Praxis

### Komplette State-Integration

```typescript
import { mapState } from '../utils/map-state';
import { dispatchKommunenFocus, addEventListener } from '../utils/events';
import { TabPersistenceManager } from '../utils/tab-persistence';

// 1. Map State initialisieren
mapState.restoreFromStorage();

// 2. Event-Listener registrieren
addEventListener("kommunen:focus", (event) => {
  const detail = event.detail;
  
  // State aktualisieren
  mapState.setSelectedKommune(detail);
  mapState.setLocalCRS(detail.projection);
  
  // Persistieren
  localStorage.setItem("p2d2_selected_kommune", JSON.stringify(detail));
});

// 3. Tab-Persistence initialisieren
const tabManager = new TabPersistenceManager();
tabManager.onStateChange((state) => {
  // State über Tabs synchronisieren
  if (state.selectedKommune) {
    mapState.setSelectedKommune(state.selectedKommune);
  }
});
```

### State-Änderungen verfolgen

```typescript
// State-Änderungen abonnieren
const unsubscribe = mapState.subscribe((state) => {
  console.log("Map State geändert:", {
    crs: state.activeCRS,
    kommune: state.selectedKommune?.slug,
    category: state.selectedCategory
  });
});

// Später abmelden
unsubscribe();
```

### Robuste Event-Behandlung

```typescript
// Event mit Retry-Mechanismus
try {
  dispatchKommunenFocus({
    center: [6.95, 50.94],
    zoom: 12,
    slug: 'koeln',
    projection: 'EPSG:3857'
  });
} catch (error) {
  console.error("Event-Dispatch fehlgeschlagen:", error);
  // Fallback: Direkte State-Änderung
  mapState.setSelectedKommune({
    slug: 'koeln',
    center: [6.95, 50.94],
    zoom: 12
  });
}
```

## Konfiguration

### Storage-Keys Konvention

```typescript
// Standard Storage-Keys für p2d2
export const STORAGE_KEYS = {
  // Map-bezogene Daten
  SELECTED_CRS: "p2d2_selected_crs",
  SELECTED_KOMMUNE: "p2d2_selected_kommune",
  SELECTED_CATEGORY: "p2d2_selected_category",
  
  // Layer-Zustände
  LUFTSBILD_VISIBLE: "luftbildVisible",
  BASEMAP_VISIBLE: "basemapVisible",
  
  // UI-Zustände
  SIDEBAR_OPEN: "p2d2_sidebar_open",
  THEME: "p2d2_theme"
};
```

### Event-Konfiguration

```typescript
// Event-System Einstellungen
const EVENT_CONFIG = {
  MAX_RETRIES: 3,           // Maximale Wiederholungsversuche
  RETRY_DELAY: 250,         // Verzögerung zwischen Retries (ms)
  THROTTLE_MS: 200,         // Standard-Throttling-Zeit
  QUEUE_PROCESS_INTERVAL: 100 // Queue-Verarbeitungsintervall
};
```

## Performance-Optimierungen

### 1. State-Immutation

```typescript
// ✅ Korrekt - Immutable Updates
updateState(updates: Partial<MapState>): void {
  const oldState = { ...this.state };
  this.state = { ...this.state, ...updates };
  this.notifyListeners(oldState, this.state);
}

// ❌ Vermeiden - Direkte Mutation
this.state.activeCRS = newCRS; // Direkte Mutation vermeiden
```

### 2. Selective Re-rendering

```typescript
// Nur bei relevanten Änderungen reagieren
const unsubscribe = mapState.subscribe((newState) => {
  // Prüfe ob sich die Kommune wirklich geändert hat
  if (newState.selectedKommune?.slug !== currentKommuneSlug) {
    updateKommuneDisplay(newState.selectedKommune);
  }
});
```

### 3. Memory Management

```typescript
// Proper Cleanup von Event-Listenern
class KommuneComponent {
  private eventCleanup: () => void;
  
  constructor() {
    this.eventCleanup = addEventListener("kommunen:focus", this.handleFocus);
  }
  
  destroy() {
    this.eventCleanup(); // Listener entfernen
  }
}
```

## Fehlerbehandlung

### Robustes Storage-Handling

```typescript
// Safe Storage Operations
function safeSetItem(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`Storage quota exceeded for key: ${key}`);
      // Fallback: Alte Daten löschen
      this.cleanupOldData();
      return false;
    }
    console.error(`Storage error for key: ${key}`, error);
    return false;
  }
}
```

### Graceful Degradation

```typescript
// Fallback bei Storage-Fehlern
function getWithFallback<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Failed to read ${key}, using fallback`, error);
    return fallback;
  }
}
```

## Best Practices

### 1. State-Normalisierung

```typescript
// ✅ Korrekt - Normalisierte State-Struktur
interface NormalizedState {
  kommunen: { [slug: string]: KommuneData };
  categories: { [slug: string]: CategoryData };
  ui: {
    selectedKommuneSlug: string | null;
    selectedCategorySlug: string | null;
    activeCRS: string;
  }
}

// ❌ Vermeiden - Verschachtelte Strukturen
interface NestedState {
  selectedKommune: KommuneData; // Enthält alle Daten
  selectedCategory: CategoryData; // Duplizierte Daten
}
```

### 2. Event-Design

```typescript
// ✅ Korrekt - Klare Event-Payloads
interface KommunenFocusEvent {
  type: "KOMMUNEN_FOCUS";
  payload: {
    slug: string;
    center: [number, number];
    zoom: number;
    projection: string;
  };
}

// ❌ Vermeiden - Vage Event-Daten
// "somethingHappened" mit unklarer Struktur
```

### 3. Storage-Size Management

```typescript
// Automatische Bereinigung
function cleanupOldData(): void {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  Object.keys(localStorage)
    .filter(key => key.startsWith("p2d2_"))
    .forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && data.timestamp < oneWeekAgo) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Fehlerhafte Einträge entfernen
        localStorage.removeItem(key);
      }
    });
}
```

## Abhängigkeiten

### Externe Abhängigkeiten
- **BroadcastChannel API** - Cross-Tab-Kommunikation (falls verfügbar)
- **localStorage** - Browser-Persistenz

### Interne Abhängigkeiten
- `../utils/logger` - Konsistente Logging-Infrastruktur
- `../config/map-config` - Standard-Konfigurationen

## Sicherheitsaspekte

### Data Sanitization

```typescript
// Eingabedaten validieren und bereinigen
function sanitizeStorageData(data: any): any {
  // Entferne potenziell gefährliche Eigenschaften
  const { __proto__, constructor, prototype, ...safeData } = data;
  return safeData;
}

// Beim Speichern
const safeData = sanitizeStorageData(userData);
localStorage.setItem(key, JSON.stringify(safeData));
```

### Size Limits

```typescript
// Prüfe Storage-Größenbeschränkungen
function checkStorageSize(key: string, data: any): boolean {
  const estimatedSize = JSON.stringify(data).length;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB pro Eintrag
  
  if (estimatedSize > MAX_SIZE) {
    console.warn(`Storage entry too large: ${key} (${estimatedSize} bytes)`);
    return false;
  }
  return true;
}
```

Diese Storage- und State-Management-Utilities gewährleisten eine robuste, performante und sichere Datenverwaltung in p2d2, mit konsistenter Persistenz über Browser-Sessions hinweg und effizienter State-Koordination zwischen allen Anwendungskomponenten.