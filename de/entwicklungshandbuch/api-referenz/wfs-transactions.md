---
title: WFS Transaction Management
description: Umfassende Dokumentation für WFS-T (Web Feature Service Transaction) Management in p2d2
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# WFS Transaction Management

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

WFS-T (Web Feature Service Transaction) ermöglicht das Schreiben von Geodaten in Geoserver über standardisierte XML-Transaktionen. p2d2 verwendet WFS-T für die automatische Synchronisation von OSM-Polygonen in die zentrale Geodatenbank.

## WFS-T Architektur

### Transaction Workflow

```mermaid
graph TB
    A[Overpass API] --> B[Python Script]
    B --> C[GeoJSON/GML]
    C --> D[WFS-T Client]
    D --> E[Geoserver]
    E --> F[PostGIS Database]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#f1f8e9
```

### Hauptkomponenten

1. **WFS-T Client** (`WFSAuthClient`) - Authentifizierte Transaktionen
2. **XML Builder** - GML 3.2 kompatible Transaktions-XML
3. **Python Bridge** - Overpass-API zu WFS-T Konvertierung
4. **Error Handler** - Robuste Fehlerbehandlung mit Retry-Logic

## Core Implementation

### WFS-T Client Klasse

```typescript
export class WFSAuthClient {
  private config: WFSConfig;
  
  /**
   * Führt WFS-T Transaktion aus
   * @param transactionXml - Vollständige WFS-T XML
   * @returns Response mit Transaktions-Result
   */
  async executeWFSTransaction(transactionXml: string): Promise<Response> {
    const headers = new Headers({
      "Content-Type": "application/xml",
    });

    // Basic Auth für WFS-T
    if (this.config.credentials.username && this.config.credentials.password) {
      const authString = btoa(
        `${this.config.credentials.username}:${this.config.credentials.password}`,
      );
      headers.set("Authorization", `Basic ${authString}`);
    }

    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers,
      body: transactionXml,
      credentials: "include" as RequestCredentials,
    });

    if (!response.ok) {
      throw new Error(
        `WFS-T transaction failed: ${response.status} ${response.statusText}`,
      );
    }

    return response;
  }
}
```

### Transaction XML Builder

```typescript
function buildWFSTInsertXML(records: PolygonRecord[]): string {
  const features = records.map(record => `
    <p2d2:p2d2_containers>
      <p2d2:container_type>${record.container_type}</p2d2:container_type>
      <p2d2:municipality>${escapeXml(record.municipality)}</p2d2:municipality>
      <p2d2:wp_name>${escapeXml(record.wp_name)}</p2d2:wp_name>
      <p2d2:osm_admin_level>${record.osm_admin_level}</p2d2:osm_admin_level>
      <p2d2:osm_id>${record.osm_id}</p2d2:osm_id>
      <p2d2:name>${escapeXml(record.name)}</p2d2:name>
      <p2d2:geometry>
        <gml:Polygon srsName="EPSG:4326">
          <gml:exterior>
            <gml:LinearRing>
              <gml:posList>${convertToGMLPosList(record.geometry)}</gml:posList>
            </gml:LinearRing>
          </gml:exterior>
        </gml:Polygon>
      </p2d2:geometry>
      <p2d2:created_at>${record.created_at}</p2d2:created_at>
      <p2d2:updated_at>${record.updated_at}</p2d2:updated_at>
    </p2d2:p2d2_containers>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs/2.0" 
                 xmlns:fes="http://www.opengis.net/fes/2.0" 
                 xmlns:gml="http://www.opengis.net/gml/3.2" 
                 xmlns:p2d2="urn:data-dna:govdata" 
                 version="2.0.0" service="WFS">
  <wfs:Insert>
    ${features}
  </wfs:Insert>
</wfs:Transaction>`;
}
```

## Verwendung in der Praxis

### Komplette Polygon-Synchronisation

```typescript
import { syncKommunePolygons } from '../utils/polygon-wfst-sync';
import { WFSAuthClient } from '../utils/wfs-auth';

// 1. Polygon-Synchronisation für Kommune
async function syncKommuneData(slug: string) {
  const result = await syncKommunePolygons(slug, ['admin_boundary', 'cemetery']);
  
  console.log('Sync Ergebnis:', {
    success: result.success,
    verarbeiteteLevels: result.processedLevels,
    eingefügtePolygone: result.insertedPolygons,
    fehler: result.errors
  });
  
  return result;
}

// 2. Manuelle WFS-T Transaktion
async function manualWFSTTransaction() {
  const wfsClient = WFSAuthClient.createWFSTClient();
  
  const transactionXml = buildWFSTInsertXML([
    {
      category: 'administrative',
      osm_id: '123456',
      name: 'Köln Stadtmitte',
      geometry: { /* GeoJSON Geometry */ },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      cache_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      container_type: 'administrative',
      municipality: 'Köln',
      wp_name: 'Köln',
      osm_admin_level: 8
    }
  ]);
  
  const response = await wfsClient.executeWFSTransaction(transactionXml);
  
  if (response.ok) {
    console.log('WFS-T Transaktion erfolgreich');
    const result = await response.text();
    console.log('Transaktions-Result:', result);
  }
}
```

### Python Bridge für Overpass-Daten

```python
# Python Script für Overpass zu WFS-T Konvertierung
def convert_overpass_to_wfst(overpass_data, admin_level, kommune_name):
    """Konvertiert Overpass-JSON zu WFS-T kompatiblem GML"""
    
    features = []
    for element in overpass_data.get('elements', []):
        if element['type'] == 'relation' and 'tags' in element:
            feature = {
                'type': 'Feature',
                'properties': {
                    'osm_id': element['id'],
                    'name': element['tags'].get('name', ''),
                    'admin_level': admin_level,
                    'municipality': kommune_name,
                    'container_type': 'administrative'
                },
                'geometry': extract_geometry(element)
            }
            features.append(feature)
    
    return {
        'type': 'FeatureCollection',
        'features': features,
        'wfst_files': generate_gml_files(features)
    }
```

## Error-Handling und Retry-Logic

### Robuste Transaktionsausführung

```typescript
async function resilientWFSTTransaction(
  transactionXml: string,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
  } = {}
): Promise<Response> {
  const { maxRetries = 3, retryDelay = 2000, timeout = 30000 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const wfsClient = WFSAuthClient.createWFSTClient();
      
      // Timeout setzen
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await wfsClient.executeWFSTransaction(transactionXml);
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      } else {
        const errorText = await response.text();
        throw new Error(`WFS-T failed: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.warn(`WFS-T Transaktion fehlgeschlagen (Versuch ${attempt + 1}/${maxRetries + 1})`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`WFS-T Transaktion nach ${maxRetries + 1} Versuchen fehlgeschlagen: ${error.message}`);
      }
      
      // Exponentielles Backoff
      await new Promise(resolve => 
        setTimeout(resolve, retryDelay * Math.pow(2, attempt))
      );
    }
  }
  
  throw new Error('Unreachable code');
}
```

### Transaktions-Validierung

```typescript
function validateTransactionXML(xml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Prüfe erforderliche Namespaces
  const requiredNamespaces = [
    'xmlns:wfs="http://www.opengis.net/wfs/2.0"',
    'xmlns:gml="http://www.opengis.net/gml/3.2"',
    'xmlns:p2d2="urn:data-dna:govdata"'
  ];
  
  requiredNamespaces.forEach(ns => {
    if (!xml.includes(ns)) {
      errors.push(`Fehlender Namespace: ${ns}`);
    }
  });
  
  // Prüfe XML-Struktur
  if (!xml.includes('<wfs:Transaction>')) {
    errors.push('Fehlendes wfs:Transaction Element');
  }
  
  if (!xml.includes('<wfs:Insert>')) {
    errors.push('Fehlendes wfs:Insert Element');
  }
  
  // Prüfe Feature-Struktur
  const featureCount = (xml.match(/<p2d2:p2d2_containers>/g) || []).length;
  if (featureCount === 0) {
    errors.push('Keine Features in Transaktion gefunden');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Performance-Optimierungen

### Batch-Processing für große Datensätze

```typescript
async function processLargeDatasetInBatches(
  records: PolygonRecord[],
  batchSize: number = 100
): Promise<{ success: number; failed: number }> {
  const results = { success: 0, failed: 0 };
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      const transactionXml = buildWFSTInsertXML(batch);
      await resilientWFSTTransaction(transactionXml);
      results.success += batch.length;
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1} erfolgreich verarbeitet`);
      
    } catch (error) {
      results.failed += batch.length;
      console.error(`Batch ${Math.floor(i / batchSize) + 1} fehlgeschlagen:`, error);
      
      // Fallback: Einzelne Features verarbeiten
      await processIndividualFeatures(batch);
    }
    
    // Kurze Pause zwischen Batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

async function processIndividualFeatures(records: PolygonRecord[]) {
  for (const record of records) {
    try {
      const transactionXml = buildWFSTInsertXML([record]);
      await resilientWFSTTransaction(transactionXml);
    } catch (error) {
      console.error(`Feature ${record.osm_id} konnte nicht verarbeitet werden:`, error);
    }
  }
}
```

### Memory-Management für große GML-Dateien

```typescript
async function processLargeGMLFile(
  gmlFilePath: string,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<void> {
  const fileStream = createReadStream(gmlFilePath, { 
    encoding: 'utf8',
    highWaterMark: chunkSize 
  });
  
  let currentChunk = '';
  let featureCount = 0;
  
  for await (const chunk of fileStream) {
    currentChunk += chunk;
    
    // Extrahiere vollständige Features aus dem Chunk
    const features = extractCompleteFeatures(currentChunk);
    
    if (features.length > 0) {
      await processFeatures(features);
      featureCount += features.length;
      
      // Entferne verarbeitete Features aus currentChunk
      currentChunk = removeProcessedFeatures(currentChunk, features);
    }
  }
  
  console.log(`Verarbeitete ${featureCount} Features aus GML-Datei`);
}
```

## Sicherheitsaspekte

### XML-Injection Prevention

```typescript
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function sanitizeTransactionInput(input: any): any {
  // Entferne potenziell gefährliche Eigenschaften
  const { __proto__, constructor, prototype, ...safeInput } = input;
  
  // Validierung aller String-Felder
  if (safeInput.name && typeof safeInput.name === 'string') {
    safeInput.name = safeInput.name.substring(0, 255); // Längenbeschränkung
  }
  
  if (safeInput.municipality && typeof safeInput.municipality === 'string') {
    safeInput.municipality = safeInput.municipality.substring(0, 100);
  }
  
  return safeInput;
}
```

### Credential-Sicherheit

```typescript
class SecureWFSTClient extends WFSAuthClient {
  private encryptedCredentials: string;
  
  constructor(config: Partial<WFSConfig> = {}) {
    super(config);
    this.encryptedCredentials = this.encryptCredentials(config.credentials);
  }
  
  private encryptCredentials(credentials: WFSCredentials): string {
    // In Produktion: Verwende sichere Verschlüsselung
    if (process.env.NODE_ENV === 'production') {
      // Implementierung für sichere Credential-Speicherung
      return Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    }
    
    // In Entwicklung: Klartext mit Warnung
    console.warn(
      'Verwende unverschlüsselte Credentials in Entwicklungsumgebung. ' +
      'In Produktion sollten Credentials über Environment-Variablen bereitgestellt werden.'
    );
    return btoa(`${credentials.username}:${credentials.password}`);
  }
}
```

## Monitoring und Debugging

### Transaktions-Logging

```typescript
interface TransactionLog {
  id: string;
  timestamp: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  featureCount: number;
  success: boolean;
  duration: number;
  error?: string;
  xmlSize: number;
}

class TransactionLogger {
  private logs: TransactionLog[] = [];
  private maxLogSize = 1000;
  
  logTransaction(transaction: Omit<TransactionLog, 'id' | 'timestamp'>) {
    const logEntry: TransactionLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...transaction
    };
    
    this.logs.unshift(logEntry);
    
    // Begrenze Log-Größe
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(0, this.maxLogSize);
    }
    
    // Debug-Ausgabe
    if (process.env.DEBUG) {
      console.debug('WFS-T Transaction logged:', logEntry);
    }
  }
  
  getRecentLogs(limit: number = 50): TransactionLog[] {
    return this.logs.slice(0, limit);
  }
  
  getSuccessRate(): number {
    const successful = this.logs.filter(log => log.success).length;
    return this.logs.length > 0 ? (successful / this.logs.length) * 100 : 0;
  }
}
```

### Performance-Metriken

```typescript
interface PerformanceMetrics {
  averageTransactionTime: number;
  successRate: number;
  featuresPerSecond: number;
  errorDistribution: Record<string, number>;
}

function calculatePerformanceMetrics(logs: TransactionLog[]): PerformanceMetrics {
  const successfulLogs = logs.filter(log => log.success);
  const failedLogs = logs.filter(log => !log.success);
  
  const totalDuration = successfulLogs.reduce((sum, log) => sum + log.duration, 0);
  const totalFeatures = successfulLogs.reduce((sum, log) => sum + log.featureCount, 0);
  
  const errorDistribution: Record<string, number> = {};
  failedLogs.forEach(log => {
    const errorType = log.error?.split(':')[0] || 'Unknown';
    errorDistribution[errorType] = (errorDistribution[errorType] || 0) + 1;
  });
  
  return {
    averageTransactionTime: successfulLogs.length > 0 ? totalDuration / successfulLogs.length : 0,
    successRate: (successfulLog