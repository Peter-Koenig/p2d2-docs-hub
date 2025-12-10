---
title: Event System & API Integration
description: Comprehensive documentation for robust event handling and API integrations
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# Event System & API Integration

> **Status:** ✅ Fully documented

## Overview

The event system and API integrations in p2d2 provide a robust infrastructure for asynchronous communication between application components and external service integrations. These modules ensure reliable event processing with retry mechanisms and secure API calls with authentication.

## Main Modules

### 1. Event System (`events.ts`)

Robust event handling with retry mechanism, throttling, and queue management.

#### Event Architecture

```typescript
// Event Queue for retry mechanism
interface QueuedEvent {
  eventName: string;
  detail: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

// Global Event Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 250; // ms
const THROTTLE_MS = 200;
const QUEUE_PROCESS_INTERVAL = 100;
```

#### Event Types

```typescript
// Standard Event Types
export const EVENT_KOMMUNEN_FOCUS = "kommunen:focus";

// Event Detail Interfaces
interface KommunenFocusDetail {
  center?: [number, number];
  extent?: [number, number, number, number];
  zoom?: number;
  projection?: string;
  extra?: any;
  slug?: string;
}
```

#### Core Functions

```typescript
// Event dispatching with throttling
export function dispatchThrottledEvent(
  eventName: string,
  detail: any = {},
  throttleMs: number = THROTTLE_MS
): void

// Robust Kommunen-Focus-Event-Dispatch
export function dispatchKommunenFocus(detail: KommunenFocusDetail): void

// Event listener with HMR guard
export function addEventListener(
  eventName: string,
  handler: (event: any) => void,
  options?: AddEventListenerOptions
): void
```

### 2. WFS Auth Client (`wfs-auth.ts`)

Secure client for WFS service integrations with authentication and proxy support.

#### Configuration

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

#### Main Functions

```typescript
// WFS-URL construction
buildAuthorizedWFSURL(
  typeName: string,
  params: Record<string, string> = {}
): string

// Authenticated requests
async fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response>

// Get GeoJSON features
async getFeatures(
  typeName: string,
  params: Record<string, string> = {}
): Promise<any>

// BBox-based queries
async getFeaturesInBBox(
  typeName: string,
  bbox: number[],
  crs: string = "EPSG:4326"
): Promise<any>
```

### 3. Logger System (`logger.ts`)

Consistent logging infrastructure with Astro integration.

#### Logger Interface

```typescript
export interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error | string, data?: any): void;
  debug(message: string, data?: any): void;
}

// Global logger instance
export const logger: Logger;
```

#### Logger Creation

```typescript
// Adaptive logger for Astro and Console
export function createLogger(astroLogger?: AstroIntegrationLogger): Logger

// Set Astro logger
export function setAstroLogger(astroLogger: AstroIntegrationLogger): void
```

## Practical Usage

### Complete Event Integration

```typescript
import { 
  dispatchKommunenFocus, 
  addEventListener,
  dispatchThrottledEvent 
} from '../utils/events';
import { logger } from '../utils/logger';

// 1. Register event listener
addEventListener("kommunen:focus", (event) => {
  const detail = event.detail;
  
  logger.info("Municipality focused", {
    slug: detail.slug,
    center: detail.center,
    zoom: detail.zoom
  });
  
  // Further processing
  handleKommuneFocus(detail);
});

// 2. Trigger events with throttling
function onKommuneClick(kommune: KommuneData) {
  dispatchThrottledEvent("kommunen:focus", {
    center: kommune.map.center,
    zoom: kommune.map.zoom,
    slug: kommune.slug,
    projection: kommune.map.projection
  }, 200);
}

// 3. Robust event dispatch
try {
  dispatchKommunenFocus({
    center: [6.95, 50.94],
    zoom: 12,
    slug: 'koeln'
  });
} catch (error) {
  logger.error("Event dispatch failed", error);
}
```

### WFS API Integration

```typescript
import { wfsAuthClient } from '../utils/wfs-auth';
import { logger } from '../utils/logger';

// 1. Get WFS features
async function loadWFSFeatures(kommune: KommuneData, category: string) {
  try {
    const features = await wfsAuthClient.getFeatures("p2d2_containers", {
      CQL_FILTER: `wp_name='${kommune.wp_name}' AND container_type='${category}'`
    });
    
    logger.info("WFS features loaded", {
      kommune: kommune.slug,
      category: category,
      featureCount: features.features?.length || 0
    });
    
    return features;
  } catch (error) {
    logger.error("WFS request failed", error, {
      kommune: kommune.slug,
      category: category
    });
    throw error;
  }
}

// 2. BBox-based queries
async function loadFeaturesInViewport(bbox: number[], crs: string = "EPSG:4326") {
  const features = await wfsAuthClient.getFeaturesInBBox(
    "p2d2_containers", 
    bbox, 
    crs
  );
  return features;
}

// 3. Connection test
async function testWFSAccess(): Promise<boolean> {
  return await wfsAuthClient.testConnection();
}
```

### Logging Strategies

```typescript
import { logger } from '../utils/logger';

// Use different log levels
logger.info("Application started", { timestamp: new Date().toISOString() });

logger.debug("Detailed debug information", {
  state: currentState,
  userActions: userActionLog
});

logger.warn("Non-critical warning", {
  context: "Feature running in fallback mode",
  reason: "External service unavailable"
});

logger.error("Critical error", error, {
  component: "MapInitializer",
  user: currentUser?.id
});
```

## Configuration

### Event System Settings

```typescript
// Optimal event configuration for p2d2
const EVENT_CONFIG = {
  // Retry mechanism
  MAX_RETRIES: 3,
  RETRY_DELAY: 250,
  
  // Performance
  THROTTLE_MS: 200,
  QUEUE_PROCESS_INTERVAL: 100,
  
  // Event-specific settings
  EVENT_TIMEOUTS: {
    KOMMUNEN_FOCUS: 5000,
    LAYER_LOAD: 10000,
    DATA_SYNC: 30000
  }
};
```

### WFS Client Configuration

```typescript
// Environment-specific WFS configuration
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

### Logging Configuration

```typescript
// Log level based on environment
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

## Performance Optimizations

### 1. Event Throttling

```typescript
// Prevents too frequent events
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

### 2. Event Queue with Retry

```typescript
// Robust event processing
function processEventQueue(): void {
  while (eventQueue.length > 0) {
    const queuedEvent = eventQueue.shift();
    
    try {
      if (isEventSystemReady()) {
        window.dispatchEvent(
          new CustomEvent(queuedEvent.eventName, { detail: queuedEvent.detail })
        );
      } else {
        // Retry logic
        if (queuedEvent.retryCount < queuedEvent.maxRetries) {
          queuedEvent.retryCount++;
          eventQueue.unshift(queuedEvent);
        }
      }
    } catch (error) {
      // Error handling with retry
      if (queuedEvent.retryCount < queuedEvent.maxRetries) {
        queuedEvent.retryCount++;
        eventQueue.unshift(queuedEvent);
      }
    }
  }
}
```

### 3. WFS Request Caching

```typescript
// Caching for repeated WFS requests
const wfsCache = new Map<string, { data: any; timestamp: number }>();

async function getCachedWFSFeatures(
  typeName: string, 
  params: Record<string, string>,
  cacheTtl: number = 5 * 60 * 1000 // 5 minutes
): Promise<any> {
  const cacheKey = `${typeName}-${JSON.stringify(params)}`;
  const cached = wfsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cacheTtl) {
    logger.debug("WFS cache hit", { cacheKey });
    return cached.data;
  }
  
  const data = await wfsAuthClient.getFeatures(typeName, params);
  wfsCache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}
```

## Error Handling

### Robust Event Dispatch

```typescript
// Graceful degradation for event errors
function safeDispatchEvent(eventName: string, detail: any): boolean {
  try {
    dispatchThrottledEvent(eventName, detail);
    return true;
  } catch (error) {
    logger.warn(`Event dispatch failed: ${eventName}`, error);
    
    // Fallback: Call function directly
    if (window[`handle${eventName}`]) {
      window[`handle${eventName}`](detail);
    }
    
    return false;
  }
}
```

### WFS Error Recovery

```typescript
// Automatic error handling for WFS
async function resilientWFSRequest(
  typeName: string,
  params: Record<string, string>,
  maxRetries: number = 2
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await wfsAuthClient.getFeatures(typeName, params);
    } catch (error) {
      logger.warn(`WFS request failed (Attempt ${attempt + 1})`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

## Best Practices

### 1. Event Design

```typescript
// ✅ Correct - Clear event structure
interface WellDesignedEvent {
  type: "DATA_LOADED" | "ERROR_OCCURRED" | "USER_ACTION";
  payload: {
    source: string;
    timestamp: number;
    data?: any;
    error?: string;
  };
}

// ❌ Avoid - Vague event data
// "somethingHappened" with unstructured detail
```

### 2. API Error Handling

```typescript
// ✅ Correct - Comprehensive error handling
async function loadDataWithFallback() {
  try {
    return await wfsAuthClient.getFeatures("p2d2_containers", params);
  } catch (error) {
    if (error.status === 401) {
      // Authentication error
      await handleAuthError();
      throw error;
    } else if (error.status === 404) {
      // Data not found
      return { features: [] };
    } else {
      // Network error - fallback data
      logger.error("API error", error);
      return getFallbackData();
    }
  }
}
```

### 3. Logging Context

```typescript
// ✅ Correct - Context-rich logging
logger.info("Map layer loaded", {
  layerType: "WFS",
  kommune: selectedKommune.slug,
  category: selectedCategory,
  featureCount: features.length,
  loadTime: performance.now() - startTime
});

// ❌ Avoid - Insufficient logging
console.log("Layer loaded"); // No context
```

## Dependencies

### External Libraries

  - **BroadcastChannel API** - Cross-tab communication (optional)
  - **Fetch API** - HTTP requests

### Internal Dependencies

  - `../utils/logger` - Logging infrastructure
  - `../config/map-config` - Standard configurations
  - `../types/admin-polygon` - TypeScript interfaces

## Security Aspects

### Credential Management

```typescript
// Secure credential usage
class SecureWFSAuthClient {
  private encryptCredentials(credentials: WFSCredentials): string {
    // In production: Use secure encryption
    return btoa(`${credentials.username}:${credentials.password}`);
  }
  
  private getCredentialsFromEnv(): WFSCredentials {
    // Load credentials from environment variables
    return {
      username: process.env.WFS_USERNAME || '',
      password: process.env.WFS_PASSWORD || ''
    };
  }
}
```

### Request Validation

```typescript
// Input validation for API requests
function validateWFSRequest(params: Record<string, string>): boolean {
  const allowedParams = ["bbox", "maxFeatures", "CQL_FILTER", "propertyName"];
  
  return Object.keys(params).every(key => 
    allowedParams.includes(key) && 
    typeof params[key] === 'string' &&
    params[key].length < 1000 // Length restriction
  );
}
```

## These Event System and API Integration utilities ensure robust, performant, and secure communication between all p2d2 components and external services, with comprehensive error handling and consistent logging.