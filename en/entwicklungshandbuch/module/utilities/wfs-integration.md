---
title: WFS Integration & Authentication
description: Comprehensive documentation for WFS service integration, authentication, and Geoserver communication
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: "(Translation: AI)"
  reviewDate: null
---

# WFS Integration & Authentication

> **Status:** ✅ Fully documented

## Overview

The WFS integration in p2d2 provides a robust and secure connection to Geoserver WFS services with comprehensive authentication, CORS handling, and error handling. These modules enable dynamic access to geodata via standardized WFS protocols.

## Main Modules

### 1. WFS Auth Client (`wfs-auth.ts`)

Secure client for WFS service integrations with authentication and proxy support.

#### Configuration Structure

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

#### Environment Detection

```typescript
// Automatic environment detection
function detectEnvironment(): EnvironmentInfo {
  return {
    isDev: (process.env.NODE_ENV === "development") || 
           (window.location.hostname.includes("local")),
    nodeEnv: process.env.NODE_ENV,
    hostname: window.location.hostname
  };
}
```

### 2. WFS Layer Manager (`wfs-layer-manager.ts`)

Dynamic management of WFS vector layers with caching and state management.

#### Layer Management Class

```typescript
export class WFSLayerManager {
  private map: OLMap;
  private activeLayer: VectorLayer<VectorSource> | null = null;
  private currentState: {
    kommune: KommuneData | null;
    categorySlug: string | null;
  };
  private layerCache = new Map<string, VectorLayer<VectorSource>>();
}
```

## Practical Usage

### Basic WFS Integration

```typescript
import { wfsAuthClient } from '../utils/wfs-auth';
import WFSLayerManager from '../utils/wfs-layer-manager';

// 1. Initialize WFS client
const wfsClient = new WFSAuthClient({
  endpoint: "https://wfs.data-dna.eu/geoserver/ows",
  workspace: "Verwaltungsdaten",
  credentials: {
    username: "p2d2_wfs_user",
    password: "eif1nu4ao9Loh0oobeev"
  }
});

// 2. Create WFS layer manager
const wfsManager = new WFSLayerManager(map);

// 3. Get features
async function loadWFSFeatures() {
  const features = await wfsClient.getFeatures("p2d2_containers", {
    CQL_FILTER: "wp_name='Köln' AND container_type='cemetery'",
    maxFeatures: "100"
  });
  
  return features;
}
```

### Dynamic Layer Control

```typescript
// Show WFS layer for municipality and category
async function showWFSLayer(kommune: KommuneData, categorySlug: string) {
  try {
    await wfsManager.displayLayer(kommune, categorySlug);
    console.log(`WFS layer for ${kommune.slug} - ${categorySlug} displayed`);
  } catch (error) {
    console.error("WFS layer could not be loaded:", error);
  }
}

// Hide layer
function hideWFSLayer() {
  wfsManager.hideLayer();
}

// Toggle layer
async function toggleWFSLayer(kommune: KommuneData, categorySlug: string) {
  await wfsManager.toggleLayer(kommune, categorySlug);
}
```

### Authenticated WFS Requests

```typescript
// Different request types
async function demonstrateWFSRequests() {
  // 1. Standard GetFeature Request
  const standardFeatures = await wfsAuthClient.getFeatures(
    "p2d2_containers", 
    { maxFeatures: "50" }
  );
  
  // 2. BBox-based query
  const bboxFeatures = await wfsAuthClient.getFeaturesInBBox(
    "p2d2_containers",
    [6.8, 50.8, 7.1, 51.1], // Cologne BBox
    "EPSG:4326"
  );
  
  // 3. CQL filter for specific data
  const filteredFeatures = await wfsAuthClient.getFeatures(
    "p2d2_containers",
    {
       CQL_FILTER: "wp_name='Köln' AND container_type='administrative'",
      propertyName: "wp_name,container_type,geometry"
    }
  );
  
  return {
    standard: standardFeatures,
    bbox: bboxFeatures,
    filtered: filteredFeatures
  };
}
```

## Configuration

### WFS Endpoint Configuration

```typescript
// Environment-specific configuration
const WFS_CONFIGS = {
  development: {
    endpoint: "https://wfs.data-dna.eu/geoserver/ows",
    workspace: "Verwaltungsdaten",
    namespace: "urn:data-dna:govdata",
    credentials: {
      username: "p2d2_wfs_user",
      password: "eif1nu4ao9Loh0oobeev"
    }
  },
  production: {
    endpoint: "https://wfs.data-dna.eu/geoserver/Verwaltungsdaten/ows",
    workspace: "Verwaltungsdaten",
    namespace: "urn:data-dna:govdata", 
    credentials: {
      username: "p2d2_wfs_user",
      password: "eif1nu4ao9Loh0oobeev"
    }
  },
  staging: {
    endpoint: "https://wfs-staging.data-dna.eu/geoserver/ows",
    workspace: "Verwaltungsdaten",
    namespace: "urn:data-dna:govdata",
    credentials: {
      username: "p2d2_wfs_user_staging",
      password: "staging_password"
    }
  }
};
```

### Layer Styling Configuration

```typescript
// Standard styles for WFS vector layers
const WFS_LAYER_STYLES = {
  default: new Style({
    stroke: new Stroke({
      color: "#FF6900",  // p2d2 Orange
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(255, 105, 0, 0.1)",
    }),
  }),
  highlighted: new Style({
    stroke: new Stroke({
      color: "#FF4500",  // More intense orange
      width: 3,
    }),
    fill: new Fill({
      color: "rgba(255, 69, 0, 0.2)",
    }),
  }),
  selected: new Style({
    stroke: new Stroke({
      color: "#DC143C",  // Red for selection
      width: 4,
    }),
    fill: new Fill({
      color: "rgba(220, 20, 60, 0.3)",
    }),
  })
};
```

### CQL Filter Conventions

```typescript
// Standard CQL filters for various scenarios
const CQL_FILTERS = {
  // For cemeteries in Cologne
  CEMETERY_KOELN: "wp_name='Köln' AND container_type='cemetery' AND osm_admin_level=8",
  
  // For administrative boundaries
  ADMINISTRATIVE_KOELN: "wp_name='Köln' AND container_type='administrative' AND osm_admin_level=7",
  
  // For all container types in a municipality
  ALL_TYPES: (wpName: string, adminLevel: number) => 
    `wp_name='${wpName}' AND osm_admin_level=${adminLevel}`,
  
  // BBox-based filters
  IN_BBOX: (bbox: number[], crs: string = "EPSG:4326") => 
    `BBOX(geometry,${bbox.join(',')},'${crs}')`
};
```

## Performance Optimizations

### 1. Layer Caching

```typescript
// Efficient caching of WFS layers
private layerCache = new Map<string, VectorLayer<VectorSource>>();

async function getCachedWFSLayer(config: WFSLayerConfig): Promise<VectorLayer<VectorSource>> {
  const cacheKey = `${config.wpName}-${config.containerType}-${config.osmAdminLevel}`;
  
  // Check cache
  let layer = this.layerCache.get(cacheKey);
  if (!layer) {
    // Create and cache layer
    layer = await this.createWFSLayer(config);
    this.layerCache.set(cacheKey, layer);
    this.map.addLayer(layer);
  }
  
  return layer;
}
```

### 2. Request Batching

```typescript
// Combine multiple WFS requests
async function batchWFSRequests(requests: Array<{
  typeName: string;
  params: Record<string, string>;
}>) {
  const results = await Promise.allSettled(
    requests.map(req => wfsAuthClient.getFeatures(req.typeName, req.params))
  );
  
  return results.map((result, index) => ({
    request: requests[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
}
```

### 3. Connection Pooling

```typescript
// Reuse HTTP connections
class WFSConnectionPool {
  private activeConnections: Map<string, Promise<Response>> = new Map();
  
  async getConnection(url: string, options: RequestInit = {}): Promise<Response> {
    const connectionKey = `${url}-${JSON.stringify(options)}`;
    
    // Reuse existing connection
    if (this.activeConnections.has(connectionKey)) {
      return this.activeConnections.get(connectionKey)!;
    }
    
    // Create new connection
    const connectionPromise = wfsAuthClient.fetchWithAuth(url, options);
    this.activeConnections.set(connectionKey, connectionPromise);
    
    // Remove connection after completion
    connectionPromise.finally(() => {
      this.activeConnections.delete(connectionKey);
    });
    
    return connectionPromise;
  }
}
```

## Error Handling

### Robust WFS Requests

```typescript
// Comprehensive error handling for WFS operations
async function resilientWFSRequest(
  typeName: string,
  params: Record<string, string>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  } = {}
): Promise<any> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000
  } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const result = await wfsAuthClient.getFeatures(typeName, {
        ...params,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return result;
      
    } catch (error) {
      console.warn(`WFS request failed (Attempt ${attempt + 1}/${maxRetries + 1})`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`WFS request failed after ${maxRetries + 1} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }
}
```

### Graceful Degradation

```typescript
// Fallback strategies for WFS errors
async function loadWFSDataWithFallback(
  kommune: KommuneData,
  categorySlug: string
) {
  try {
    // Primary: WFS service
    return await wfsManager.displayLayer(kommune, categorySlug);
  } catch (error) {
    console.error("WFS service unavailable, using fallback", error);
    
    // Fallback 1: Local GeoJSON data
    const localData = await loadLocalGeoJSON(kommune.slug, categorySlug);
    if (localData) {
      return displayLocalData(localData);
    }
    
    // Fallback 2: Show static boundaries
    return displayStaticBoundaries(kommune);
    
    // Fallback 3: Inform user
    showUserNotification({
      type: "warning",
      message: "Geodata temporarily unavailable",
      action: "retry"
    });
  }
}
```

## Security Aspects

### Credential Management

```typescript
// Secure credential usage
class SecureWFSAuth {
  private encryptCredentials(credentials: WFSCredentials): string {
    // In production: Use secure encryption
    if (process.env.NODE_ENV === 'production') {
      return btoa(`${credentials.username}:${credentials.password}`);
    }
    
    // In development: Plaintext with warning
    console.warn(
      "Using unencrypted credentials in development environment. " +
      "In production, credentials should be provided via environment variables."
    );
    return btoa(`${credentials.username}:${credentials.password}`);
  }
  
  private getCredentialsFromEnv(): WFSCredentials {
    // Prefer environment variables
    return {
      username: process.env.WFS_USERNAME || this.config.credentials.username,
      password: process.env.WFS_PASSWORD || this.config.credentials.password
    };
  }
}
```

### Request Validation

```typescript
// Input validation for WFS parameters
function validateWFSParams(params: Record<string, string>): boolean {
  const allowedParams = [
    "bbox", "maxFeatures", "CQL_FILTER", "propertyName", 
    "sortBy", "srsName", "outputFormat"
  ];
  
  const maxLengths = {
    CQL_FILTER: 1000,
    propertyName: 500,
    bbox: 100
  };
  
  // Check allowed parameters
  for (const key of Object.keys(params)) {
    if (!allowedParams.includes(key)) {
      console.warn(`Disallowed WFS parameter: ${key}`);
      return false;
    }
    
    // Check length restrictions
    if (maxLengths[key] && params[key].length > maxLengths[key]) {
      console.warn(`WFS parameter too long: ${key}`);
      return false;
    }
  }
  
  return true;
}
```

## Best Practices

### 1. CQL Filter Optimization

```typescript
// ✅ Correct - Efficient CQL filters
function buildOptimizedCQLFilter(kommune: KommuneData, category: string): string {
  const containerType = getContainerType(category);
  const adminLevel = getOsmAdminLevel(kommune, containerType);
  
  return `wp_name='${kommune.wp_name}' AND container_type='${containerType}' AND osm_admin_level=${adminLevel}`;
}

// ❌ Avoid - Inefficient filters
// Complex OR/AND combinations without index
```

### 2. Error Handling

```typescript
// ✅ Correct - Comprehensive error handling
async function loadWFSLayerSafely(kommune: KommuneData, category: string) {
  try {
    // Validation
    if (!hasValidOSMData(kommune)) {
      throw new Error(`Municipality ${kommune.slug} has no valid OSM data`);
    }
    
    // Set timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WFS request timeout')), 30000)
    );
    
    // WFS request with timeout
    const layerPromise = wfsManager.displayLayer(kommune, category);
    return await Promise.race([layerPromise, timeoutPromise]);
    
  } catch (error) {
    logger.error("WFS layer loading failed", error, {
      kommune: kommune.slug,
      category: category
    });
    
    // User-friendly error message
    showErrorToUser("Geodata could not be loaded. Please try again later.");
    throw error;
  }
}
```

### 3. Performance Monitoring

```typescript
// Track WFS performance
async function trackWFSPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    // Logging for performance analysis
    logger.info(`WFS ${operation} completed`, {
      operation,
      duration: Math.round(duration),
      timestamp: new Date().toISOString()
    });
    
    // Warning for slow requests
    if (duration > 5000) {
      logger.warn(`Slow WFS request: ${operation}`, { duration });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error(`WFS ${operation} failed`, error, {
      operation,
      duration: Math.round(duration)
    });
    throw error;
  }
}
```

## Dependencies

### External Libraries

- **OpenLayers** - Map and layer management
- **proj4** - Coordinate transformations

### Internal Dependencies

- `../utils/logger` - Logging infrastructure
- `../utils/events` - Event system
- `../utils/kommune-utils` - Municipality data management

## These WFS Integration utilities provide secure, performant, and reliable access to geodata services in p2d2, with comprehensive error handling and optimized performance for large datasets.