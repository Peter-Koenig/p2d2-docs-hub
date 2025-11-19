---
title: Astro API Endpoints & Backend Integration
description: Comprehensive documentation for Astro API Endpoints, WFS Services, Overpass API and Geoserver Integration
quality:
  completeness: 80
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Astro API Endpoints & Backend Integration

> **Status:** ✅ Fully documented

## Overview

The p2d2 application uses Astro API Endpoints for secure backend integrations with external geodata services. These endpoints provide CORS handling, authentication, and robust error handling for WFS services, Overpass API, and Geoserver integrations.

## Security Notes

### Credential Status

**Notice:** The current implementations contains hardcoded WFS credentials as a workaround for an anonymous access to the WFS. These will be removed as soon as an anonymously accassible Geoserver is implemented.

**Affected Files:**
- `src/pages/api/wfs-proxy.ts` - Contains hardcoded credentials
- `src/utils/wfs-auth.ts` - Contains hardcoded credentials

**Immediate Actions Required:**
1. Remove all hardcoded credentials from source code
2. Configure environment variables for all environments
3. Configure Geoserver for anonymous read access

## Main API Endpoints

### 1. WFS Proxy Endpoint (`/api/wfs-proxy.ts`)

Secure proxy for WFS service requests with CORS support and authentication.

#### Current Implementation (Requires Correction)

```typescript
// ❌ CURRENT - Hardcoded credentials (WILL BE REMOVED)
const WFS_USERNAME = "p2d2_wfs_user";
const WFS_PASSWORD = "eif1nu4ao9Loh0oobeev";

// ✅ FUTURE - Environment variables
const WFS_USERNAME = import.meta.env.WFS_USERNAME;
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;
```

#### Correct Implementation

```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    // ... URL validation ...

    // Credentials from environment variables
    const WFS_USERNAME = import.meta.env.WFS_USERNAME;
    const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;

    // Validate that credentials are provided
    if (!WFS_USERNAME || !WFS_PASSWORD) {
      return new Response(
        JSON.stringify({
          error: "WFS authentication not configured",
          details: "WFS_USERNAME and WFS_PASSWORD environment variables are required"
        }),
        { status: 500 }
      );
    }

    // ... rest of implementation ...
  }
}
```

### 2. Polygon Sync Endpoint (`/api/sync-polygons.ts`)

API endpoint for automatic polygon synchronization with Overpass API and WFS-T.

#### Endpoint Specification

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

## Backend Service Integrations

### 1. WFS Transaction Management

#### WFS-T Client (`WFSAuthClient`)

**Current Status:** Contains TODO comment for removal of hardcoded credentials.

```typescript
// ❌ CURRENT - In wfs-auth.ts
// TODO: Remove hardcoded credentials once anonymous GeoServer access is configured
const RO_USERNAME = "p2d2_wfs_user";
const RO_PASSWORD = "eif1nu4ao9Loh0oobeev";
```

#### Correct WFS-T Configuration

```typescript
// WFS-T Client with environment variables
const wfsClient = WFSAuthClient.createWFSTClient();

// Credentials must be stored in .env file:
// WFST_USERNAME="your_wfs_t_username"
// WFST_PASSWORD="your_secure_password"
// WFST_ENDPOINT="https://wfs.data-dna.eu/geoserver/ows"
```

## Security Aspects

### Credential Management

#### ❌ Current Problems

1. **Hardcoded Credentials** in `wfs-proxy.ts` and `wfs-auth.ts`
2. **Missing Validation** of environment variables
3. **No Fallback Mechanism** for missing credentials

#### ✅ Correct Implementation

```typescript
// 1. Use environment variables
const WFS_USERNAME = import.meta.env.WFS_USERNAME;
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;

// 2. Implement validation
if (!WFS_USERNAME || !WFS_PASSWORD) {
  throw new Error("WFS credentials not configured in environment");
}

// 3. Host validation
const allowedHosts = ["wfs.data-dna.eu", "ows.data-dna.eu"];
const urlHost = new URL(url).hostname;

if (!allowedHosts.includes(urlHost)) {
  throw new Error("Untrusted WFS endpoint");
}
```

### Environment Configuration

#### Required Environment Variables

```bash
# .env.production or .env.local
# WFS Authentication (MUST be set)
WFS_USERNAME="your_wfs_username"
WFS_PASSWORD="your_secure_password"

# WFS-T Configuration (for write access)
WFST_USERNAME="your_wfs_t_username"
WFST_PASSWORD="your_secure_password"
WFST_ENDPOINT="https://wfs.data-dna.eu/geoserver/ows"

# Debug Mode
DEBUG="false"  # Set to false in production
```

## Urgent Corrections

### Priority 1: Implement Immediately

1. **Remove hardcoded credentials** from:
   - `src/pages/api/wfs-proxy.ts`
   - `src/utils/wfs-auth.ts`

2. **Validate environment variables** in all environments

3. **Improve error handling** for missing credentials

### Priority 2: Implement Short-term

1. **Configure Geoserver** for anonymous read access
2. **Implement monitoring** for credential errors
3. **Update documentation** for deployment

## Error Handling & Retry Logic

### Robust Error Handling

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

## Best Practices for Secure Implementation

### 1. Never Hardcode Credentials

```typescript
// ❌ WRONG
const username = "p2d2_wfs_user";
const password = "eif1nu4ao9Loh0oobeev";

// ✅ CORRECT
const username = import.meta.env.WFS_USERNAME;
const password = import.meta.env.WFS_PASSWORD;

if (!username || !password) {
  throw new Error("Credentials not configured");
}
```

### 2. Environment Validation

```typescript
// Validate at application startup
function validateEnvironment() {
  const requiredVars = ['WFS_USERNAME', 'WFS_PASSWORD'];
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

### 3. Security Monitoring

```typescript
// Logging for credential errors
function logCredentialError(operation: string) {
  logger.error(`Credential error in ${operation}`, {
    timestamp: new Date().toISOString(),
    hasUsername: !!import.meta.env.WFS_USERNAME,
    hasPassword: !!import.meta.env.WFS_PASSWORD,
    environment: import.meta.env.MODE
  });
}
```

## Conclusion

The current implementation contains critical security issues due to hardcoded credentials. These must be urgently removed and replaced with environment variables. The documentation shows the correct implementation and the required steps to fix the security vulnerabilities.

**Next Steps:**
1. Remove hardcoded credentials from source code
2. Configure environment variables for all environments
3. Configure Geoserver for anonymous access
4. Improve error handling and validation
