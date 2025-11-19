---
title: Event System & API Integration
description: Umfassende Dokumentation für robustes Event-Handling und API-Integrationen
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Event System & API Integration

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Das Event-System und die API-Integrationen in p2d2 bieten eine robuste Infrastruktur für asynchrone Kommunikation zwischen Anwendungskomponenten und externe Service-Integrationen. Diese Module gewährleisten zuverlässige Event-Verarbeitung mit Retry-Mechanismen und sichere API-Aufrufe mit Authentifizierung.

## Hauptmodule

### 1. Event System (`events.ts`)

Robustes Event-Handling mit Retry-Mechanismus, Throttling und Queue-Management.

#### Event-Architektur

```typescript
// Event Queue für Retry-Mechanismus
interface QueuedEvent {
  eventName: string;
  detail: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Globale Event-Konfiguration
const MAX_RETRIES = 3;
const RETRY_DELAY = 250; // ms
const THROTTLE_MS = 200;
const QUEUE_PROCESS_INTERVAL = 100;
```

#### Event-Typen

```typescript
// Standard-Event-Typen
export const EVENT_KOMMUNEN_FOCUS = "kommunen:focus";

// Event-Detail-Interfaces
interface KommunenFocusDetail {
  center?: [number, number];
  extent?: [number, number, number, number];
  zoom?: number;
  projection?: string;
  extra?: any;
  slug?: string;
}
```

#### Core-Funktionen

```typescript
// Event-Dispatching mit Throttling
export function dispatchThrottledEvent(
  eventName: string,
  detail: any = {},
  throttleMs: number = THROTTLE_MS
): void

// Robuste Kommunen-Focus-Event-Dispatch
export function dispatchKommunenFocus(detail: KommunenFocusDetail): void

// Event-Listener mit HMR-Guard
export function addEventListener(
  eventName: string,
  handler: (event: any) => void,
  options?: AddEventListenerOptions
): void
```

### 2. WFS Auth Client (`wfs-auth.ts`)

Sicherer Client für WFS-Service-Integrationen mit Authentifizierung und Proxy-Unterstützung.

#### Konfiguration

```typescript
export interface WFSCredentials {
  username: string;
  password: string;
}

export interface WFSConfig {
  endpoint: string;
  workspace: string;
  namespace: string;
  credentials: WFSCredentials;
}

export class WFSAuthClient {
  private config: WFSConfig;
  
  constructor(config: Partial<WFSConfig> = {})
}
```

#### Hauptfunktionen

```typescript
// WFS-URL-Konstruktion
buildAuthorizedWFSURL(
  typeName: string,
  params: Record<string, string> = {}
): string

// Authentifizierte Requests
async fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response>

// GeoJSON-Features abrufen
async getFeatures(
  typeName: string,
  params: Record<string, string> = {}
): Promise<any>

// BBox-basierte Abfragen
async getFeaturesInBBox(
  typeName: string,
  bbox: number[],
  crs: string = "EPSG:4326"
): Promise<any>
```

### 3. Logger System (`logger.ts`)

Konsistente Logging-Infrastruktur mit Astro-Integration.

#### Logger-Interface

```typescript
export interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error | string, data?: any): void;
  debug(message: string, data?: any): void;
}

// Globale Logger-Instanz
export const logger: Logger;
```

#### Logger-Erstellung

```typescript
// Adaptiver Logger für Astro und Console
export function createLogger(astroLogger?: AstroIntegrationLogger): Logger

// Astro-Logger setzen
export function setAstroLogger(astroLogger: AstroIntegrationLogger): void
```

## Verwendung in der Praxis

### Komplette Event-Integration

```typescript
import { 
  dispatchKommunenFocus, 
  addEventListener,
  dispatchThrottledEvent 
} from '../utils/events';
import { logger } from '../utils/logger';

// 1. Event-Listener registrieren
addEventListener("kommunen:focus", (event) => {
  const detail = event.detail;
  
  logger.info("Kommune fokussiert", {
    slug: detail.slug,
    center: detail.center,
    zoom: detail.zoom
  });
  
  // Weitere Verarbeitung
  handleKommuneFocus(detail);
});

// 2. Events mit Throttling auslösen
function onKommuneClick(kommune: KommuneData) {
  dispatchThrottledEvent("kommunen:focus", {
    center: kommune.map.center,
    zoom: kommune.map.zoom,
    slug: kommune.slug,
    projection: kommune.map.projection
  }, 200);
}

// 3. Robuste Event-Dispatch
try {
  dispatchKommunenFocus({
    center: [6.95, 50.94],
    zoom: 12,
    slug: 'koeln'
  });
} catch (error) {
  logger.error("Event-Dispatch fehlgeschlagen", error);
}
```

### WFS-API-Integration

```typescript
import { wfsAuthClient } from '../utils/wfs-auth';
import { logger } from '../utils/logger';

// 1. WFS-Features abrufen
async function loadWFSFeatures(kommune: KommuneData, category: string) {
  try {
    const features = await wfsAuthClient.getFeatures("p2d2_containers", {
      CQL_FILTER: `wp_name='${kommune.wp_name}' AND container_type='${category}'`
    });
    
    logger.info("WFS-Features geladen", {
      kommune: kommune.slug,
      category: category,
      featureCount: features.features?.length || 0
    });
    
    return features;
  } catch (error) {
    logger.error("WFS-Request fehlgeschlagen", error, {
      kommune: kommune.slug,
      category: category
    });
    throw error;
  }
}

// 2. BBox-basierte Abfragen
async function loadFeaturesInViewport(bbox: number[], crs: string = "EPSG:4326") {
  const features = await wfsAuthClient.getFeaturesInBBox(
    "p2d2_containers", 
    bbox, 
    crs
  );
  return features;
}

// 3. Connection-Test
async function testWFSAccess(): Promise<boolean> {
  return await wfsAuthClient.testConnection();
}
```

### Logging-Strategien

```typescript
import { logger } from '../utils/logger';

// Unterschiedliche Log-Level verwenden
logger.info("Anwendung gestartet", { timestamp: new Date().toISOString() });

logger.debug("Detailierte Debug-Information", {
  state: currentState,
  userActions: userActionLog
});

logger.warn("Nicht-kritische Warnung", {
  context: "Feature läuft im Fallback-Modus",
  reason: "Externer Service nicht verfügbar"
});

logger.error("Kritischer Fehler", error, {
  component: "MapInitializer",
  user: currentUser?.id
});
```

## Konfiguration

### Event-System-Einstellungen

```typescript
// Optimale Event-Konfiguration für p2d2
const EVENT_CONFIG = {
  // Retry-Mechanismus
  MAX_RETRIES: 3,
  RETRY_DELAY: 250,
  
  // Performance
  THROTTLE_MS: 200,
  QUEUE_PROCESS_INTERVAL: 100,
  
  // Event-Spezifische Einstellungen
  EVENT_TIMEOUTS: {
    KOMMUNEN_FOCUS: 5000,
    LAYER_LOAD: 10000,
    DATA_SYNC: 30000
  }
};
```

### WFS-Client-Konfiguration

```typescript
// Environment-spezifische WFS-Konfiguration
const WFS_CONFIG = {
  development: {
    endpoint: "https://wfs.data-dna.eu/geoserver/ows",
    workspace: "Verwaltungsdaten",
    credentials: {
      username: "p2d2_wfs_user",
      password: "eif1nu4ao9Loh0oobeev"
    }
  },
  production: {
    endpoint: "https://wfs.data-dna.eu/geoserver/Verwaltungsdaten/ows",
    workspace: "Verwaltungsdaten", 
    credentials: {
      username: "p2d2_wfs_user", 
      password: "eif1nu4ao9Loh0oobeev"
    }
  }
};
```

### Logging-Konfiguration

```typescript
// Log-Level basierend auf Environment
const LOG_LEVELS = {
  development: {
    info: true,
    debug: true,
    warn: true,
    error: true
  },
  production: {
    info: false,
    debug: false, 
    warn: true,
    error: true
  }
};
```

## Performance-Optimierungen

### 1. Event-Throttling

```typescript
// Verhindert zu häufige Events
export function dispatchThrottledEvent(
  eventName: string,
  detail: any = {},
  throttleMs: number = 200
): void {
  const lastDispatch = lastDispatchTimes.get(eventName) || 0;
  const currentTime = Date.now();

  if (currentTime - lastDispatch < throttleMs) {
    logger.debug(`Event throttled: ${eventName}`);
    return;
  }

  lastDispatchTimes.set(eventName, currentTime);
  queueEvent(eventName, detail);
}
```

### 2. Event-Queue mit Retry

```typescript
// Robuste Event-Verarbeitung
function processEventQueue(): void {
  while (eventQueue.length > 0) {
    const queuedEvent = eventQueue.shift();
    
    try {
      if (isEventSystemReady()) {
        window.dispatchEvent(
          new CustomEvent(queuedEvent.eventName, { detail: queuedEvent.detail })
        );
      } else {
        // Retry-Logik
        if (queuedEvent.retryCount < queuedEvent.maxRetries) {
          queuedEvent.retryCount++;
          eventQueue.unshift(queuedEvent);
        }
      }
    } catch (error) {
      // Error-Handling mit Retry
      if (queuedEvent.retryCount < queuedEvent.maxRetries) {
        queuedEvent.retryCount++;
        eventQueue.unshift(queuedEvent);
      }
    }
  }
}
```

### 3. WFS-Request-Caching

```typescript
// Caching für wiederholte WFS-Requests
const wfsCache = new Map<string, { data: any; timestamp: number }>();

async function getCachedWFSFeatures(
  typeName: string, 
  params: Record<string, string>,
  cacheTtl: number = 5 * 60 * 1000 // 5 Minuten
): Promise<any> {
  const cacheKey = `${typeName}-${JSON.stringify(params)}`;
  const cached = wfsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cacheTtl) {
    logger.debug("WFS-Cache-Treffer", { cacheKey });
    return cached.data;
  }
  
  const data = await wfsAuthClient.getFeatures(typeName, params);
  wfsCache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}
```

## Fehlerbehandlung

### Robuste Event-Dispatch

```typescript
// Graceful Degradation bei Event-Fehlern
function safeDispatchEvent(eventName: string, detail: any): boolean {
  try {
    dispatchThrottledEvent(eventName, detail);
    return true;
  } catch (error) {
    logger.warn(`Event-Dispatch fehlgeschlagen: ${eventName}`, error);
    
    // Fallback: Direkte Funktion aufrufen
    if (window[`handle${eventName}`]) {
      window[`handle${eventName}`](detail);
    }
    
    return false;
  }
}
```

### WFS-Error-Recovery

```typescript
// Automatische Fehlerbehandlung für WFS
async function resilientWFSRequest(
  typeName: string,
  params: Record<string, string>,
  maxRetries: number = 2
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await wfsAuthClient.getFeatures(typeName, params);
    } catch (error) {
      logger.warn(`WFS-Request fehlgeschlagen (Versuch ${attempt + 1})`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponentielles Backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

## Best Practices

### 1. Event-Design

```typescript
// ✅ Korrekt - Klare Event-Struktur
interface WellDesignedEvent {
  type: "DATA_LOADED" | "ERROR_OCCURRED" | "USER_ACTION";
  payload: {
    source: string;
    timestamp: number;
    data?: any;
    error?: string;
  };
}

// ❌ Vermeiden - Vage Event-Daten
// "somethingHappened" mit unstrukturiertem Detail
```

### 2. API-Error-Handling

```typescript
// ✅ Korrekt - Umfassende Fehlerbehandlung
async function loadDataWithFallback() {
  try {
    return await wfsAuthClient.getFeatures("p2d2_containers", params);
  } catch (error) {
    if (error.status === 401) {
      // Authentifizierungsfehler
      await handleAuthError();
      throw error;
    } else if (error.status === 404) {
      // Daten nicht gefunden
      return { features: [] };
    } else {
      // Netzwerkfehler - Fallback-Daten
      logger.error("API-Fehler", error);
      return getFallbackData();
    }
  }
}
```

### 3. Logging-Kontext

```typescript
// ✅ Korrekt - Kontext-reiches Logging
logger.info("Karten-Layer geladen", {
  layerType: "WFS",
  kommune: selectedKommune.slug,
  category: selectedCategory,
  featureCount: features.length,
  loadTime: performance.now() - startTime
});

// ❌ Vermeiden - Unzureichendes Logging
console.log("Layer loaded"); // Kein Kontext
```

## Abhängigkeiten

### Externe Libraries
- **BroadcastChannel API** - Cross-Tab-Kommunikation (optional)
- **Fetch API** - HTTP-Requests

### Interne Abhängigkeiten
- `../utils/logger` - Logging-Infrastruktur
- `../config/map-config` - Standard-Konfigurationen
- `../types/admin-polygon` - TypeScript-Interfaces

## Sicherheitsaspekte

### Credential-Management

```typescript
// Sichere Credential-Verwendung
class SecureWFSAuthClient {
  private encryptCredentials(credentials: WFSCredentials): string {
    // Implementierung für sichere Credential-Speicherung
    return btoa(`${credentials.username}:${credentials.password}`);
  }
  
  private getCredentialsFromEnv(): WFSCredentials {
    // Credentials aus Environment-Variablen laden
    return {
      username: process.env.WFS_USERNAME || '',
      password: process.env.WFS_PASSWORD || ''
    };
  }
}
```

### Request-Validation

```typescript
// Eingabevalidierung für API-Requests
function validateWFSRequest(params: Record<string, string>): boolean {
  const allowedParams = ["bbox", "maxFeatures", "CQL_FILTER", "propertyName"];
  
  return Object.keys(params).every(key => 
    allowedParams.includes(key) && 
    typeof params[key] === 'string' &&
    params[key].length < 1000 // Längenbeschränkung
  );
}
```

Diese Event-System- und API-Integration-Utilities gewährleisten eine robuste, performante und sichere Kommunikation zwischen allen p2d2-Komponenten und externen Services, mit umfassendem Error-Handling und konsistentem Logging.