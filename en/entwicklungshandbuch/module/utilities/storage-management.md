---
title: Storage & State Management
description: Comprehensive documentation for persistence, state management, and data management
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# Storage & State Management

> **Status:** ✅ Fully documented

## Overview

The storage and state management in p2d2 provides robust solutions for data persistence, state management, and session management. These utilities ensure consistent data retention across browser sessions and enable complex state interactions between different application components.

## Main Modules

### 1. Map State Manager (`map-state.ts`)

Central state manager for map-related data with event system and persistence.

#### State Structure

```typescript
export interface MapState {
  activeCRS: string;           // Current projection (e.g., "EPSG:3857")
  localCRS: string | undefined; // Local projection for specific municipalities
  selectedCategory: string | null; // Selected category
  selectedKommune: any | null;     // Current municipality
  isInitialized: boolean;          // Initialization status
}

export interface MapConfig {
  defaultCRS: string;    // Default projection
  wmsUrl: string;        // WMS Service URL
  wmsLayer: string;      // WMS Layer Name
}
```

#### State Management Class

```typescript
class MapStateManager {
  private state: MapState;
  private config: MapConfig;
  private listeners: Set<(state: MapState) => void> = new Set();

  // State operations
  getState(): Readonly<MapState>
  updateState(updates: Partial<MapState>): void
  subscribe(listener: (state: MapState) => void): () => void

  // Specific setters
  setActiveCRS(crs: string): void
  setLocalCRS(crs: string | undefined): void
  setSelectedCategory(category: string | null): void
  setSelectedKommune(kommune: any | null): void
  setInitialized(initialized: boolean): void

  // Getters
  getSelectedKommune(): any | null
  getSelectedCategory(): string | null

  // Persistence
  restoreFromStorage(): void
}
```

### 2. Event System (`events.ts`)

Robust event handling with retry mechanism, throttling, and queue management.

#### Event Types and Queue

```typescript
// Standard event types
export const EVENT_KOMMUNEN_FOCUS = "kommunen:focus";

interface QueuedEvent {
  eventName: string;
  detail: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Global event queue
const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;
```

#### Event Dispatching

```typescript
/**
 * Dispatch with throttling and retry mechanism
 */
export function dispatchThrottledEvent(
  eventName: string,
  detail: any = {},
  throttleMs: number = 200
): void

/**
 * Robust Kommunen-Focus-Event-Dispatch
 */
export function dispatchKommunenFocus(detail: KommunenFocusDetail): void

/**
 * Event listener with HMR guard
 */
export function addEventListener(
  eventName: string,
  handler: (event: any) => void,
  options?: AddEventListenerOptions
): void
```

#### Storage Helpers

```typescript
// Local Storage Keys
const STORAGE_KEYS = {
  SELECTED_CRS: "p2d2_selected_crs",
  SELECTED_KOMMUNE: "p2d2_selected_kommune",
};

// Storage operations
export function getSelectedCRS(): string | null
export function setSelectedCRS(crs: string): void
export function getSelectedKommune(): string | null
export function setSelectedKommune(slug: string): void
export function clearSelections(): void
```

### 3. Tab Persistence (`tab-persistence.ts`)

Session management for browser tabs with cross-tab communication.

#### Tab Synchronization

```typescript
/**
 * Manages persistent data across browser tabs
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

  // State operations
  setState(state: any): void
  getState(): any
  clearState(): void

  // Cross-tab communication
  syncAcrossTabs(): void
  onStateChange(callback: (state: any) => void): void
}
```

## Practical Usage

### Complete State Integration

```typescript
import { mapState } from '../utils/map-state';
import { dispatchKommunenFocus, addEventListener } from '../utils/events';
import { TabPersistenceManager } from '../utils/tab-persistence';

// 1. Initialize Map State
mapState.restoreFromStorage();

// 2. Register Event Listeners
addEventListener("kommunen:focus", (event) => {
  const detail = event.detail;
  
  // Update state
  mapState.setSelectedKommune(detail);
  mapState.setLocalCRS(detail.projection);
  
  // Persist
  localStorage.setItem("p2d2_selected_kommune", JSON.stringify(detail));
});

// 3. Initialize Tab Persistence
const tabManager = new TabPersistenceManager();
tabManager.onStateChange((state) => {
  // Synchronize state across tabs
  if (state.selectedKommune) {
    mapState.setSelectedKommune(state.selectedKommune);
  }
});
```

### Tracking State Changes

```typescript
// Subscribe to state changes
const unsubscribe = mapState.subscribe((state) => {
  console.log("Map state changed:", {
    crs: state.activeCRS,
    kommune: state.selectedKommune?.slug,
    category: state.selectedCategory
  });
});

// Unsubscribe later
unsubscribe();
```

### Robust Event Handling

```typescript
// Event with retry mechanism
try {
  dispatchKommunenFocus({
    center: [6.95, 50.94],
    zoom: 12,
    slug: 'koeln',
    projection: 'EPSG:3857'
  });
} catch (error) {
  console.error("Event dispatch failed:", error);
  // Fallback: Direct state change
  mapState.setSelectedKommune({
    slug: 'koeln',
    center: [6.95, 50.94],
    zoom: 12
  });
}
```

## Configuration

### Storage Keys Convention

```typescript
// Standard Storage Keys for p2d2
export const STORAGE_KEYS = {
  // Map-related data
  SELECTED_CRS: "p2d2_selected_crs",
  SELECTED_KOMMUNE: "p2d2_selected_kommune",
  SELECTED_CATEGORY: "p2d2_selected_category",
  
  // Layer states
  LUFTSBILD_VISIBLE: "luftbildVisible",
  BASEMAP_VISIBLE: "basemapVisible",
  
  // UI states
  SIDEBAR_OPEN: "p2d2_sidebar_open",
  THEME: "p2d2_theme"
};
```

### Event Configuration

```typescript
// Event system settings
const EVENT_CONFIG = {
  MAX_RETRIES: 3,           // Maximum retries
  RETRY_DELAY: 250,         // Delay between retries (ms)
  THROTTLE_MS: 200,         // Default throttling time
  QUEUE_PROCESS_INTERVAL: 100 // Queue processing interval
};
```

## Performance Optimizations

### 1. State Immutability

```typescript
// ✅ Correct - Immutable updates
updateState(updates: Partial<MapState>): void {
  const oldState = { ...this.state };
  this.state = { ...this.state, ...updates };
  this.notifyListeners(oldState, this.state);
}

// ❌ Avoid - Direct mutation
this.state.activeCRS = newCRS; // Avoid direct mutation
```

### 2. Selective Re-rendering

```typescript
// React only to relevant changes
const unsubscribe = mapState.subscribe((newState) => {
  // Check if the municipality actually changed
  if (newState.selectedKommune?.slug !== currentKommuneSlug) {
    updateKommuneDisplay(newState.selectedKommune);
  }
});
```

### 3. Memory Management

```typescript
// Proper cleanup of event listeners
class KommuneComponent {
  private eventCleanup: () => void;
  
  constructor() {
    this.eventCleanup = addEventListener("kommunen:focus", this.handleFocus);
  }
  
  destroy() {
    this.eventCleanup(); // Remove listener
  }
}
```

## Error Handling

### Robust Storage Handling

```typescript
// Safe Storage Operations
function safeSetItem(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`Storage quota exceeded for key: ${key}`);
      // Fallback: Delete old data
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
// Fallback for storage errors
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

### 1. State Normalization

```typescript
// ✅ Correct - Normalized state structure
interface NormalizedState {
  kommunen: { [slug: string]: KommuneData };
  categories: { [slug: string]: CategoryData };
  ui: {
    selectedKommuneSlug: string | null;
    selectedCategorySlug: string | null;
    activeCRS: string;
  }
}

// ❌ Avoid - Nested structures
interface NestedState {
  selectedKommune: KommuneData; // Contains all data
  selectedCategory: CategoryData; // Duplicated data
}
```

### 2. Event Design

```typescript
// ✅ Correct - Clear event payloads
interface KommunenFocusEvent {
  type: "KOMMUNEN_FOCUS";
  payload: {
    slug: string;
    center: [number, number];
    zoom: number;
    projection: string;
  };
}

// ❌ Avoid - Vague event data
// "somethingHappened" with unclear structure
```

### 3. Storage Size Management

```typescript
// Automatic cleanup
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
        // Remove corrupt entries
        localStorage.removeItem(key);
      }
    });
}
```

## Dependencies

### External Dependencies

  - **BroadcastChannel API** - Cross-tab communication (if available)
  - **localStorage** - Browser persistence

### Internal Dependencies

  - `../utils/logger` - Consistent logging infrastructure
  - `../config/map-config` - Standard configurations

## Security Aspects

### Data Sanitization

```typescript
// Validate and sanitize input data
function sanitizeStorageData(data: any): any {
  // Remove potentially dangerous properties
  const { __proto__, constructor, prototype, ...safeData } = data;
  return safeData;
}

// When saving
const safeData = sanitizeStorageData(userData);
localStorage.setItem(key, JSON.stringify(safeData));
```

### Size Limits

```typescript
// Check storage size limits
function checkStorageSize(key: string, data: any): boolean {
  const estimatedSize = JSON.stringify(data).length;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB per entry
  
  if (estimatedSize > MAX_SIZE) {
    console.warn(`Storage entry too large: ${key} (${estimatedSize} bytes)`);
    return false;
  }
  return true;
}
```

## These Storage and State Management utilities ensure robust, performant, and secure data management in p2d2, with consistent persistence across browser sessions and efficient state coordination between all application components.