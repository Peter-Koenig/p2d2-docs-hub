---
title: Astro API Endpoints & Backend Integration
description: Umfassende Dokumentation für Astro API Endpoints, WFS-Services, Overpass-API und Geoserver-Integration
quality:
  completeness: 80
  accuracy: 65
  reviewed: true
  reviewer: 
  reviewDate: 
---

# Astro API Endpoints & Backend Integration

> **Status:** ✅ Vollständig dokumentiert

## Übersicht

Die p2d2-Anwendung verwendet Astro API Endpoints für sichere Backend-Integrationen mit externen Geodaten-Services. Diese Endpoints bieten CORS-Handling, Authentifizierung und robuste Fehlerbehandlung für WFS-Services, Overpass-API und Geoserver-Integrationen.

## Sicherheitshinweise

### Status der Credentials

**Hinweis:** Die aktuellen Implementierungen enthalten hardcodierte WFS-Zugangsdaten als Workaround für einen Frei zugänglichen WFS-Server. Diese werden entfernt und durch Environment-Variablen ersetzt sowie es gelungen sein wird, auf dem Geoserver einen anonymen Zugang einzurichten.

**Betroffene Dateien:**
- `src/pages/api/wfs-proxy.ts` - Enthält hardcodierte Credentials
- `src/utils/wfs-auth.ts` - Enthält hardcodierte Credentials

**Sofortmaßnahmen erforderlich:**
1. Alle hardcodierten Credentials aus dem Quellcode entfernen
2. Environment-Variablen für alle Umgebungen konfigurieren
3. Geoserver für anonymen Lesezugriff konfigurieren

## Haupt-API-Endpoints

### 1. WFS Proxy Endpoint (`/api/wfs-proxy.ts`)

Sicherer Proxy für WFS-Service-Requests mit CORS-Unterstützung und Authentifizierung.

#### Aktuelle Implementierung (Korrektur erforderlich)

```typescript
// ❌ AKTUELL - Hardcodierte Credentials (WIRD ENTFERNT WERDEN)
const WFS_USERNAME = "p2d2_wfs_user";
const WFS_PASSWORD = "eif1nu4ao9Loh0oobeev";

// ✅ ZUKÜNFTIG - Environment-Variablen
const WFS_USERNAME = import.meta.env.WFS_USERNAME;
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;
```

#### Korrekte Implementierung

```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    // ... URL Validierung ...

    // Credentials aus Environment-Variablen
    const WFS_USERNAME = import.meta.env.WFS_USERNAME;
    const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;

    // Validierung dass Credentials vorhanden sind
    if (!WFS_USERNAME || !WFS_PASSWORD) {
      return new Response(
        JSON.stringify({
          error: "WFS authentication not configured",
          details: "WFS_USERNAME and WFS_PASSWORD environment variables are required"
        }),
        { status: 500 }
      );
    }

    // ... Rest der Implementierung ...
  }
}
```

### 2. Polygon Sync Endpoint (`/api/sync-polygons.ts`)

API-Endpoint für automatische Polygon-Synchronisation mit Overpass-API und WFS-T.

#### Endpoint-Spezifikation

```typescript
// POST /api/sync-polygons
export async function POST({ request }) {
  const { slug, categories } = await request.json();
  
  const result = await syncKommunePolygons(slug, categories);
  
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500
  });
}
```

## Backend-Service-Integrationen

### 1. WFS-Transaction-Management

#### WFS-T Client (`WFSAuthClient`)

**Aktueller Status:** Enthält TODO-Kommentar für die Entfernung hardcodierter Credentials.

```typescript
// ❌ AKTUELL - In wfs-auth.ts
// TODO: Remove hardcoded credentials once anonymous GeoServer access is configured
const RO_USERNAME = "p2d2_wfs_user";
const RO_PASSWORD = "eif1nu4ao9Loh0oobeev";
```

#### Korrekte WFS-T Konfiguration

```typescript
// WFS-T Client mit Environment-Variablen
const wfsClient = WFSAuthClient.createWFSTClient();

// Die Zugangsdaten müssen in der .env Datei hinterlegt werden:
// WFST_USERNAME="ihr_wfs_t_benutzername"
// WFST_PASSWORD="ihr_sicheres_passwort"
// WFST_ENDPOINT="https://wfs.data-dna.eu/geoserver/ows"
```

## Sicherheitsaspekte

### Credential-Management

#### ❌ Aktuelle Probleme

1. **Hardcodierte Credentials** in `wfs-proxy.ts` und `wfs-auth.ts`
2. **Fehlende Validierung** von Environment-Variablen
3. **Kein Fallback-Mechanismus** für fehlende Credentials

#### ✅ Korrekte Implementierung

```typescript
// 1. Environment-Variablen verwenden
const WFS_USERNAME = import.meta.env.WFS_USERNAME;
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;

// 2. Validierung implementieren
if (!WFS_USERNAME || !WFS_PASSWORD) {
  throw new Error("WFS credentials not configured in environment");
}

// 3. Host-Validierung
const allowedHosts = ["wfs.data-dna.eu", "ows.data-dna.eu"];
const urlHost = new URL(url).hostname;

if (!allowedHosts.includes(urlHost)) {
  throw new Error("Untrusted WFS endpoint");
}
```

### Environment-Konfiguration

#### Erforderliche Environment-Variablen

```bash
# .env.production oder .env.local
# WFS Authentication (MUSS gesetzt werden)
WFS_USERNAME="ihr_wfs_benutzername"
WFS_PASSWORD="ihr_sicheres_passwort"

# WFS-T Configuration (für Schreibzugriff)
WFST_USERNAME="ihr_wfs_t_benutzername"
WFST_PASSWORD="ihr_sicheres_passwort"
WFST_ENDPOINT="https://wfs.data-dna.eu/geoserver/ows"

# Debug Mode
DEBUG="false"  # In Produktion auf false setzen
```

## Dringende Korrekturen

### Priorität 1: Sofort umsetzen

1. **Hardcodierte Credentials entfernen** aus:
   - `src/pages/api/wfs-proxy.ts`
   - `src/utils/wfs-auth.ts`

2. **Environment-Variablen validieren** in allen Umgebungen

3. **Error-Handling verbessern** für fehlende Credentials

### Priorität 2: Kurzfristig umsetzen

1. **Geoserver konfigurieren** für anonymen Lesezugriff
2. **Monitoring implementieren** für Credential-Fehler
3. **Dokumentation aktualisieren** für Deployment

## Error-Handling und Retry-Logic

### Robuste Fehlerbehandlung

```typescript
async function resilientWFSRequest(
  typeName: string,
  params: Record<string, string>
): Promise<any> {
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const WFS_USERNAME = import.meta.env.WFS_USERNAME;
      const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;
      
      if (!WFS_USERNAME || !WFS_PASSWORD) {
        throw new Error("WFS credentials not configured");
      }
      
      return await wfsAuthClient.getFeatures(typeName, params);
      
    } catch (error) {
      if (attempt === 3) {
        logger.error("WFS request failed after 3 attempts", error);
        throw error;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }
}
```

## Best Practices für sichere Implementierung

### 1. Never Hardcode Credentials

```typescript
// ❌ FALSCH
const username = "p2d2_wfs_user";
const password = "eif1nu4ao9Loh0oobeev";

// ✅ KORREKT
const username = import.meta.env.WFS_USERNAME;
const password = import.meta.env.WFS_PASSWORD;

if (!username || !password) {
  throw new Error("Credentials not configured");
}
```

### 2. Environment-Validierung

```typescript
// Beim Application-Start validieren
function validateEnvironment() {
  const requiredVars = ['WFS_USERNAME', 'WFS_PASSWORD'];
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

### 3. Sicherheitsmonitoring

```typescript
// Logging für Credential-Fehler
function logCredentialError(operation: string) {
  logger.error(`Credential error in ${operation}`, {
    timestamp: new Date().toISOString(),
    hasUsername: !!import.meta.env.WFS_USERNAME,
    hasPassword: !!import.meta.env.WFS_PASSWORD,
    environment: import.meta.env.MODE
  });
}
```

## Fazit

Die aktuelle Implementierung enthält kritische Sicherheitsprobleme durch hardcodierte Credentials. Diese müssen dringend entfernt und durch Environment-Variablen ersetzt werden. Die Dokumentation zeigt die korrekte Implementierung und die erforderlichen Schritte zur Behebung der Sicherheitslücken.

**Nächste Schritte:**
1. Hardcodierte Credentials aus dem Quellcode entfernen
2. Environment-Variablen für alle Umgebungen konfigurieren
3. Geoserver für anonymen Zugriff konfigurieren
4. Error-Handling und Validierung verbessern
