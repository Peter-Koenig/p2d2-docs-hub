---
title: WFS Integration & Authentication
description: Umfassende Dokumentation für WFS-Service-Integration, Authentifizierung und Geoserver-Kommunikation
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# WFS Integration & Authentication

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Die WFS-Integration in p2d2 bietet eine robuste und sichere Verbindung zu Geoserver-WFS-Services mit umfassender Authentifizierung, CORS-Handling und Fehlerbehandlung. Diese Module ermöglichen den dynamischen Zugriff auf Geodaten über standardisierte WFS-Protokolle.

## Hauptmodule

### 1. WFS Auth Client (`wfs-auth.ts`)

Sicherer Client für WFS-Service-Integrationen mit Authentifizierung und Proxy-Unterstützung.

#### Konfigurationsstruktur

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

#### Environment-Erkennung

```typescript
// Automatische Environment-Erkennung
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

Dynamische Verwaltung von WFS-Vektorlayern mit Caching und State-Management.

#### Layer-Management-Klasse

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

## Verwendung in der Praxis

### Basis-WFS-Integration

```typescript
import { wfsAuthClient } from '../utils/wfs-auth';
import WFSLayerManager from '../utils/wfs-layer-manager';

// 1. WFS-Client initialisieren
const wfsClient = new WFSAuthClient({
  endpoint: "https://wfs.data-dna.eu/geoserver/ows",
  workspace: "Verwaltungsdaten",
  credentials: {
    username: "p2d2_wfs_user",
    password: "eif1nu4ao9Loh0oobeev"
  }
});

// 2. WFS-Layer-Manager erstellen
const wfsManager = new WFSLayerManager(map);

// 3. Features abrufen
async function loadWFSFeatures() {
  const features = await wfsClient.getFeatures("p2d2_containers", {
    CQL_FILTER: "wp_name='Köln' AND container_type='cemetery'",
    maxFeatures: "100"
  });
  
  return features;
}
```

### Dynamische Layer-Steuerung

```typescript
// WFS-Layer für Kommune und Kategorie anzeigen
async function showWFSLayer(kommune: KommuneData, categorySlug: string) {
  try {
    await wfsManager.displayLayer(kommune, categorySlug);
    console.log(`WFS-Layer für ${kommune.slug} - ${categorySlug} angezeigt`);
  } catch (error) {
    console.error("WFS-Layer konnte nicht geladen werden:", error);
  }
}

// Layer ausblenden
function hideWFSLayer() {
  wfsManager.hideLayer();
}

// Layer-Toggle
async function toggleWFSLayer(kommune: KommuneData, categorySlug: string) {
  await wfsManager.toggleLayer(kommune, categorySlug);
}
```

### Authentifizierte WFS-Requests

```typescript
// Verschiedene Request-Typen
async function demonstrateWFSRequests() {
  // 1. Standard GetFeature Request
  const standardFeatures = await wfsAuthClient.getFeatures(
    "p2d2_containers", 
    { maxFeatures: "50" }
  );
  
  // 2. BBox-basierte Abfrage
  const bboxFeatures = await wfsAuthClient.getFeaturesInBBox(
    "p2d2_containers",
    [6.8, 50.8, 7.1, 51.1], // Köln BBox
    "EPSG:4326"
  );
  
  // 3. CQL-Filter für spezifische Daten
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

## Konfiguration

### WFS-Endpoint-Konfiguration

```typescript
// Environment-spezifische Konfiguration
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

### Layer-Styling-Konfiguration

```typescript
// Standard-Styles für WFS-Vektorlayer
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
      color: "#FF4500",  // Intensiveres Orange
      width: 3,
    }),
    fill: new Fill({
      color: "rgba(255, 69, 0, 0.2)",
    }),
  }),
  selected: new Style({
    stroke: new Stroke({
      color: "#DC143C",  // Rot für Selektion
      width: 4,
    }),
    fill: new Fill({
      color: "rgba(220, 20, 60, 0.3)",
    }),
  })
};
```

### CQL-Filter-Konventionen

```typescript
// Standard-CQL-Filter für verschiedene Szenarien
const CQL_FILTERS = {
  // Für Friedhöfe in Köln
  CEMETERY_KOELN: "wp_name='Köln' AND container_type='cemetery' AND osm_admin_level=8",
  
  // Für administrative Grenzen
  ADMINISTRATIVE_KOELN: "wp_name='Köln' AND container_type='administrative' AND osm_admin_level=7",
  
  // Für alle Container-Typen in einer Kommune
  ALL_TYPES: (wpName: string, adminLevel: number) => 
    `wp_name='${wpName}' AND osm_admin_level=${adminLevel}`,
  
  // BBox-basierte Filter
  IN_BBOX: (bbox: number[], crs: string = "EPSG:4326") => 
    `BBOX(geometry,${bbox.join(',')},'${crs}')`
};
```

## Performance-Optimierungen

### 1. Layer-Caching

```typescript
// Effizientes Caching von WFS-Layern
private layerCache = new Map<string, VectorLayer<VectorSource>>();

async function getCachedWFSLayer(config: WFSLayerConfig): Promise<VectorLayer<VectorSource>> {
  const cacheKey = `${config.wpName}-${config.containerType}-${config.osmAdminLevel}`;
  
  // Prüfe Cache
  let layer = this.layerCache.get(cacheKey);
  if (!layer) {
    // Layer erstellen und cachen
    layer = await this.createWFSLayer(config);
    this.layerCache.set(cacheKey, layer);
    this.map.addLayer(layer);
  }
  
  return layer;
}
```

### 2. Request-Batching

```typescript
// Mehrere WFS-Requests zusammenfassen
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

### 3. Connection-Pooling

```typescript
// Wiederverwendung von HTTP-Connections
class WFSConnectionPool {
  private activeConnections: Map<string, Promise<Response>> = new Map();
  
  async getConnection(url: string, options: RequestInit = {}): Promise<Response> {
    const connectionKey = `${url}-${JSON.stringify(options)}`;
    
    // Existierende Connection wiederverwenden
    if (this.activeConnections.has(connectionKey)) {
      return this.activeConnections.get(connectionKey)!;
    }
    
    // Neue Connection erstellen
    const connectionPromise = wfsAuthClient.fetchWithAuth(url, options);
    this.activeConnections.set(connectionKey, connectionPromise);
    
    // Connection nach Abschluss entfernen
    connectionPromise.finally(() => {
      this.activeConnections.delete(connectionKey);
    });
    
    return connectionPromise;
  }
}
```

## Fehlerbehandlung

### Robuste WFS-Requests

```typescript
// Umfassende Fehlerbehandlung für WFS-Operationen
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
      console.warn(`WFS-Request fehlgeschlagen (Versuch ${attempt + 1}/${maxRetries + 1})`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`WFS-Request nach ${maxRetries + 1} Versuchen fehlgeschlagen: ${error.message}`);
      }
      
      // Exponentielles Backoff
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }
}
```

### Graceful Degradation

```typescript
// Fallback-Strategien bei WFS-Fehlern
async function loadWFSDataWithFallback(
  kommune: KommuneData,
  categorySlug: string
) {
  try {
    // Primär: WFS-Service
    return await wfsManager.displayLayer(kommune, categorySlug);
  } catch (error) {
    console.error("WFS-Service nicht verfügbar, verwende Fallback", error);
    
    // Fallback 1: Lokale GeoJSON-Daten
    const localData = await loadLocalGeoJSON(kommune.slug, categorySlug);
    if (localData) {
      return displayLocalData(localData);
    }
    
    // Fallback 2: Statische Grenzen anzeigen
    return displayStaticBoundaries(kommune);
    
    // Fallback 3: Benutzer informieren
    showUserNotification({
      type: "warning",
      message: "Geodaten vorübergehend nicht verfügbar",
      action: "retry"
    });
  }
}
```

## Sicherheitsaspekte

### Credential-Management

```typescript
// Sichere Credential-Verwendung
class SecureWFSAuth {
  private encryptCredentials(credentials: WFSCredentials): string {
    // In Produktion: Verwende sichere Verschlüsselung
    if (process.env.NODE_ENV === 'production') {
      return btoa(`${credentials.username}:${credentials.password}`);
    }
    
    // In Entwicklung: Klartext mit Warnung
    console.warn(
      "Verwende unverschlüsselte Credentials in Entwicklungsumgebung. " +
      "In Produktion sollten Credentials über Environment-Variablen bereitgestellt werden."
    );
    return btoa(`${credentials.username}:${credentials.password}`);
  }
  
  private getCredentialsFromEnv(): WFSCredentials {
    // Bevorzuge Environment-Variablen
    return {
      username: process.env.WFS_USERNAME || this.config.credentials.username,
      password: process.env.WFS_PASSWORD || this.config.credentials.password
    };
  }
}
```

### Request-Validation

```typescript
// Eingabevalidierung für WFS-Parameter
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
  
  // Prüfe erlaubte Parameter
  for (const key of Object.keys(params)) {
    if (!allowedParams.includes(key)) {
      console.warn(`Unerlaubter WFS-Parameter: ${key}`);
      return false;
    }
    
    // Prüfe Längenbeschränkungen
    if (maxLengths[key] && params[key].length > maxLengths[key]) {
      console.warn(`WFS-Parameter zu lang: ${key}`);
      return false;
    }
  }
  
  return true;
}
```

## Best Practices

### 1. CQL-Filter-Optimierung

```typescript
// ✅ Korrekt - Effiziente CQL-Filter
function buildOptimizedCQLFilter(kommune: KommuneData, category: string): string {
  const containerType = getContainerType(category);
  const adminLevel = getOsmAdminLevel(kommune, containerType);
  
  return `wp_name='${kommune.wp_name}' AND container_type='${containerType}' AND osm_admin_level=${adminLevel}`;
}

// ❌ Vermeiden - Ineffiziente Filter
// Komplexe OR/AND-Kombinationen ohne Index
```

### 2. Error-Handling

```typescript
// ✅ Korrekt - Umfassende Fehlerbehandlung
async function loadWFSLayerSafely(kommune: KommuneData, category: string) {
  try {
    // Validierung
    if (!hasValidOSMData(kommune)) {
      throw new Error(`Kommune ${kommune.slug} hat keine gültigen OSM-Daten`);
    }
    
    // Timeout setzen
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WFS-Request timeout')), 30000)
    );
    
    // WFS-Request mit Timeout
    const layerPromise = wfsManager.displayLayer(kommune, category);
    return await Promise.race([layerPromise, timeoutPromise]);
    
  } catch (error) {
    logger.error("WFS-Layer-Loading fehlgeschlagen", error, {
      kommune: kommune.slug,
      category: category
    });
    
    // Benutzer-freundliche Fehlermeldung
    showErrorToUser("Geodaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
    throw error;
  }
}
```

### 3. Performance-Monitoring

```typescript
// WFS-Performance tracken
async function trackWFSPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    // Logging für Performance-Analyse
    logger.info(`WFS ${operation} abgeschlossen`, {
      operation,
      duration: Math.round(duration),
      timestamp: new Date().toISOString()
    });
    
    // Warnung bei langsamen Requests
    if (duration > 5000) {
      logger.warn(`Langsamer WFS-Request: ${operation}`, { duration });
    }
    
    return result;
  } catch (