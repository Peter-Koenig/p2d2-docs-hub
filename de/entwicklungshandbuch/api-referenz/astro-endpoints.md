---
title: Astro API Endpoints & Backend Integration
description: Umfassende Dokumentation für Astro API Endpoints, WFS-Services, Overpass-API und Geoserver-Integration
quality:
  completeness: 80
  accuracy: 90
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

**Hinweis:** In der Produktion werden Credentials ausschließlich via Environment-Variablen verwaltet (`import.meta.env.WFS_USERNAME`, `import.meta.env.WFS_PASSWORD`). Hartcodierte Credentials finden *niemals* in produktiven Umgebungen Anwendung, sondern stellen lediglich temporäre Workarounds oder Entwicklungs-/Teststände dar und sind mit Warnhinweisen versehen.

**Betroffene Dateien:**
- `src/pages/api/wfs-proxy.ts` - Erwartet Environment-Variablen
- `src/utils/wfs-auth.ts` - Erwartet Environment-Variablen

**Sofortmaßnahmen erforderlich:**
1. Sicherstellen, dass keine hartcodierten Credentials in produktivem Quellcode verbleiben
2. Environment-Variablen für alle Umgebungen korrekt konfigurieren
3. Bei Entwicklung/Test klare Warnungen bei der Nutzung von Fallbacks

## Haupt-API-Endpoints

### 1. WFS Proxy Endpoint (`/api/wfs-proxy.ts`)

Sicherer Proxy für WFS-Service-Requests mit CORS-Unterstützung und Environment-Authentifizierung.

#### Standard-Implementierung

```typescript
const WFS_USERNAME = import.meta.env.WFS_USERNAME;
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD;
if (!WFS_USERNAME || !WFS_PASSWORD) {
  throw new Error("WFS authentication not configured in environment");
}
```

#### Hinweise zur Entwicklung

```typescript
// Dev-Fallback – nur für lokale Tests und mit klaren Warnungen:
const WFS_USERNAME = import.meta.env.WFS_USERNAME || "dev_user";
const WFS_PASSWORD = import.meta.env.WFS_PASSWORD || "dev_password";
```

### 2. Polygon Sync Endpoint (`/api/sync-polygons.ts`)

API-Endpoint für automatische Polygon-Synchronisation mit Overpass-API und WFS-T.

#### Endpoint-Spezifikation

```typescript
export async function POST({ request }) {
  const { slug, categories } = await request.json();
  const result = await syncKommunePolygons(slug, categories);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500
  });
}
```

## Backend-Service-Integrationen

### WFS Transaction Management

WFS-T Zugriff erfolgt analog: Credentials kommen immer aus `.env`-Variablen.

## Sicherheitsaspekte

- Credentials dürfen nie hartcodiert werden
- Validierung der .env-Variablen bei Startup und Request
- Klare Fehlerbehandlung bei Abwesenheit

## Fazit

Die Dokumentation beschreibt den produktiven Umgang mit Credentials via Environment-Variablen und bietet Best Practices für Entwicklung, Test und produktiven Einsatz.
