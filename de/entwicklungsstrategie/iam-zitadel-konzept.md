---
quality:
  completeness: 50
  accuracy: 50
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-12-09
---

# Konzept: Föderiertes IAM für das p2d2-Netzwerk

## Status
📋 **Konzeptionell** – Technisch fundiert auf Zitadel v4-Features, Implementierung ausstehend

## Zusammenfassung

Dieses Dokument beschreibt ein föderiertes Identity and Access Management (IAM) für ein dezentrales p2d2-Netzwerk. Analog zum Fediverse-Modell (Mastodon, etc.) ist jede p2d2-Instanz souverän und selbstständig, kann aber über OIDC-Federation Identitäten anderer Instanzen akzeptieren. Dies ermöglicht:

- **Datenhoheit**: Jede Kommune/Organisation kontrolliert ihre User-Daten
- **Cross-Instance-Beiträge**: User können instanzübergreifend Geodaten beitragen
- **OSM-Integration**: OpenStreetMap bleibt autoritativ für Export-Berechtigungen
- **Skalierbarkeit**: Neue Instanzen können ohne zentrale Koordination starten

## Motivation

### Warum födiertes IAM?

p2d2 verfolgt das Ziel, Geodaten dezentral zu erfassen und an OpenStreetMap zu übertragen. Im internationalen Kontext ergeben sich mehrere Anforderungen:

1. **Datenschutz und Souveränität**: Kommunen und Behörden wollen User-Daten auf eigener Infrastruktur halten (DSGVO, nationale Datenschutzgesetze)
2. **Keine zentrale Abhängigkeit**: Kein Single Point of Failure oder Kontrolle durch einzelne Organisation
3. **Zusammenarbeit über Grenzen**: User aus Stadt A sollen in Stadt B beitragen können
4. **OSM als finale Datensenke**: PostgreSQL/PostGIS ist lokale Staging-Area, keine zentrale DB nötig

### Warum Zitadel?

- **OIDC-Federation** ist native unterstützt
- **Multi-Tenancy** für mehrere Organisationen pro Instanz
- **External Identity Providers** pro Organisation konfigurierbar
- **Actions/Hooks** für Custom Logic (OSM-Integration)
- **Self-Hosting** mit PostgreSQL (passt zu PostGIS-Infrastruktur)

## Architektur

### Überblick

```
┌─────────────────────────────────────────────────────────┐
│ p2d2-Köln (data-koeln.openstreetmap.de)                 │
│  ├─ Zitadel-Köln (auth.data-koeln.openstreetmap.de)     │
│  ├─ PostgreSQL/PostGIS (lokale Staging-DB)              │
│  ├─ Astro-Frontend (UI)                                 │
│  └─ Trusted IdPs: [Paris, Warschau, München, ...]       │
└─────────────────────────────────────────────────────────┘
                    ↕ OIDC Federation
┌─────────────────────────────────────────────────────────┐
│ p2d2-Paris (data-paris.openstreetmap.fr)                │
│  ├─ Zitadel-Paris (auth.data-paris.openstreetmap.fr)    │
│  ├─ PostgreSQL/PostGIS (lokale Staging-DB)              │
│  ├─ Astro-Frontend (UI)                                 │
│  └─ Trusted IdPs: [Köln, Warschau, München, ...]        │
└─────────────────────────────────────────────────────────┘
                    ↕ OIDC Federation
┌─────────────────────────────────────────────────────────┐
│ p2d2-Warschau (data-warszawa.openstreetmap.pl)          │
│  ├─ Zitadel-Warschau (auth.data-warszawa...)            │
│  ├─ PostgreSQL/PostGIS (lokale Staging-DB)              │
│  ├─ Astro-Frontend (UI)                                 │
│  └─ Trusted IdPs: [Köln, Paris, München, ...]           │
└─────────────────────────────────────────────────────────┘
                    ↓ Export (alle Instanzen)
              ┌──────────────────────┐
              │   OpenStreetMap      │
              │  (zentrale Geodaten) │
              └──────────────────────┘
```

### Komponenten pro Instanz

#### Zitadel IAM
- **Zweck**: Identity Management, Authentication, Federation
- **Deployment**: Docker-Compose oder LXC
- **Datenbank**: PostgreSQL (kann shared mit PostGIS sein, separate DB)
- **Ports**: 8080 (hinter Reverse Proxy)

#### PostgreSQL/PostGIS
- **Zweck**: Staging für Geodaten, lokale User-Metadaten
- **Schema**: 
  - `p2d2` (Geodaten, Changesets)
  - `zitadel` (IAM-Daten)

#### Astro-Frontend
- **Zweck**: UI für Datenerfassung, Kartendarstellung
- **Auth**: OIDC-Client, nutzt Zitadel als IdP
- **APIs**: OpenLayers für Karte, Zitadel-APIs für User-Management

### Datenflüsse

#### Flow 1: User registriert sich auf Home-Instanz

```
sequenceDiagram
    participant U as User
    participant PK as p2d2-Köln Frontend
    participant ZK as Zitadel-Köln
    participant DB as PostgreSQL

    U->>PK: Registrierung (Email, Passwort)
    PK->>ZK: Create User via API
    ZK->>DB: INSERT INTO zitadel.users
    ZK->>U: Email-Verification
    U->>ZK: Verify Email
    ZK->>PK: Redirect mit ID-Token
    PK->>U: Dashboard anzeigen
```

#### Flow 2: User aus Köln arbeitet in Paris (Federation)

```
sequenceDiagram
    participant U as User (Köln-Account)
    participant PP as p2d2-Paris Frontend
    participant ZP as Zitadel-Paris
    participant ZK as Zitadel-Köln
    participant OSM as OpenStreetMap

    U->>PP: Login
    PP->>ZP: Initiate Auth
    ZP->>U: Login-Screen (zeigt externe IdPs)
    U->>ZP: "Login with p2d2-Köln"
    ZP->>ZK: OIDC Authorization Request
    ZK->>U: Login (Köln-Credentials)
    U->>ZK: Username/Password
    ZK->>ZP: ID-Token + Access-Token
    ZP->>ZP: Create Shadow User
    ZP->>PP: Redirect mit Session
    PP->>U: Dashboard (Geodaten Paris)
    
    Note over U,PP: User bearbeitet Daten
    
    U->>PP: Export nach OSM
    PP->>ZP: Check permissions (osm_linked claim)
    ZP->>OSM: OAuth (User's OSM-Account)
    OSM->>PP: Authorized
    PP->>OSM: Changeset Upload
```

#### Flow 3: OSM-Account-Linking

```
sequenceDiagram
    participant U as User
    participant PK as p2d2-Köln Frontend
    participant ZK as Zitadel-Köln
    participant OSM as OpenStreetMap OAuth

    U->>PK: "Link OSM Account"
    PK->>OSM: OAuth Authorization Request
    OSM->>U: Login/Consent
    U->>OSM: Grant Access
    OSM->>PK: OAuth Code
    PK->>OSM: Exchange Code for Token
    OSM->>PK: Access Token + User Info
    PK->>ZK: Update User Metadata
    ZK->>ZK: Store osm_user_id, osm_token
    ZK->>PK: Success
    PK->>U: "OSM Account linked"
```

## Technische Implementation

### 1. Zitadel-Deployment pro Instanz

#### Docker-Compose Setup

```
# /opt/p2d2/docker-compose.yml
services:
  zitadel:
    image: 'ghcr.io/zitadel/zitadel:v4.latest'
    command: 'start-from-init --masterkeyFromEnv --tlsMode external'
    environment:
      - 'ZITADEL_DATABASE_POSTGRES_HOST=db'
      - 'ZITADEL_DATABASE_POSTGRES_PORT=5432'
      - 'ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel'
      - 'ZITADEL_DATABASE_POSTGRES_USER_USERNAME=zitadel'
      - 'ZITADEL_DATABASE_POSTGRES_USER_PASSWORD=${DB_PASSWORD}'
      - 'ZITADEL_DATABASE_POSTGRES_USER_SSL_MODE=disable'
      - 'ZITADEL_DATABASE_POSTGRES_ADMIN_USERNAME=postgres'
      - 'ZITADEL_DATABASE_POSTGRES_ADMIN_PASSWORD=${DB_ADMIN_PASSWORD}'
      - 'ZITADEL_DATABASE_POSTGRES_ADMIN_SSL_MODE=disable'
      - 'ZITADEL_EXTERNALSECURE=true'
      - 'ZITADEL_EXTERNALPORT=443'
      - 'ZITADEL_EXTERNALDOMAIN=auth.data-koeln.openstreetmap.de'
      - 'ZITADEL_MASTERKEY=${MASTERKEY}'
    ports:
      - '8080:8080'
    depends_on:
      db:
        condition: service_healthy
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_ADMIN_PASSWORD}
      - POSTGRES_DB=zitadel
    volumes:
      - zitadel-db:/var/lib/postgresql/data
      - ./init-postgis.sql:/docker-entrypoint-initdb.d/10-postgis.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: always

volumes:
  zitadel-db:
```

#### PostGIS-Integration (Optional)

Wenn Zitadel und PostGIS die gleiche PostgreSQL-Instanz nutzen sollen:

```
-- init-postgis.sql
-- Separate Datenbanken für Zitadel und p2d2
CREATE DATABASE p2d2;
\c p2d2
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Zitadel-DB wird automatisch vom Container erstellt
```

### 2. External Identity Provider konfigurieren

#### In Zitadel-UI (pro Instanz)

**Settings → Identity Providers → Add Provider → Generic OIDC**

```
Name: p2d2-Paris
Issuer: https://auth.data-paris.openstreetmap.fr
Client ID: p2d2-koeln-federation
Client Secret: [wird von Paris bereitgestellt]
Scopes: openid email profile
Authorization Endpoint: [auto via Discovery]
Token Endpoint: [auto via Discovery]
User Info Endpoint: [auto via Discovery]

Options:
☑ Create users automatically
☐ Link users automatically (Sicherheitsrisiko)
☑ Account creation allowed
☑ Account linking allowed (manual)

Attribute Mapping:
- ID: sub
- Email: email
- Name: name
- Preferred Username: preferred_username
```

#### Via Zitadel Management API

```
# Client für Federation in Paris registrieren
curl -X POST https://auth.data-paris.openstreetmap.fr/management/v1/projects/${PROJECT_ID}/apps/oidc \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "p2d2-koeln-federation",
    "redirectUris": [
      "https://auth.data-koeln.openstreetmap.de/oauth/v2/callback"
    ],
    "responseTypes": ["CODE"],
    "grantTypes": ["AUTHORIZATION_CODE", "REFRESH_TOKEN"],
    "appType": "WEB",
    "authMethodType": "POST"
  }'

# Response enthält Client ID und Secret für Köln
```

### 3. OIDC Discovery implementieren

Jede Zitadel-Instanz exponiert automatisch OIDC Discovery:

```
# Testen der Discovery
curl https://auth.data-koeln.openstreetmap.de/.well-known/openid-configuration
```

**Beispiel-Response:**
```
{
  "issuer": "https://auth.data-koeln.openstreetmap.de",
  "authorization_endpoint": "https://auth.data-koeln.openstreetmap.de/oauth/v2/authorize",
  "token_endpoint": "https://auth.data-koeln.openstreetmap.de/oauth/v2/token",
  "userinfo_endpoint": "https://auth.data-koeln.openstreetmap.de/oidc/v1/userinfo",
  "jwks_uri": "https://auth.data-koeln.openstreetmap.de/oauth/v2/keys",
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "response_types_supported": ["code", "id_token", "token"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"]
}
```

### 4. Astro-Frontend Integration

#### OIDC-Client konfigurieren

```
// src/lib/auth/config.ts
import { OIDCClient } from '@zitadel/client';

export const authConfig = {
  issuer: import.meta.env.PUBLIC_ZITADEL_ISSUER,
  clientId: import.meta.env.PUBLIC_ZITADEL_CLIENT_ID,
  redirectUri: `${import.meta.env.PUBLIC_BASE_URL}/auth/callback`,
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  responseType: 'code',
  codeChallengeMethod: 'S256' // PKCE
};

export const oidcClient = new OIDCClient(authConfig);
```

#### Login-Flow

```
// src/pages/login.astro
***
import { oidcClient } from '../lib/auth/config';

// Generate PKCE challenge
const codeVerifier = generateRandomString(64);
const codeChallenge = await sha256(codeVerifier);

// Store in session
Astro.cookies.set('code_verifier', codeVerifier, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 600 // 10 minutes
});

// Build authorization URL
const authUrl = oidcClient.createAuthorizationUrl({
  codeChallenge,
  codeChallengeMethod: 'S256',
  state: generateRandomString(32)
});

// Redirect
return Astro.redirect(authUrl);
***
```

#### Callback-Handler

```
// src/pages/auth/callback.astro
***
import { oidcClient } from '../../lib/auth/config';

const code = Astro.url.searchParams.get('code');
const state = Astro.url.searchParams.get('state');
const codeVerifier = Astro.cookies.get('code_verifier')?.value;

if (!code || !codeVerifier) {
  return new Response('Invalid request', { status: 400 });
}

// Exchange code for tokens
const tokens = await oidcClient.exchangeCodeForTokens({
  code,
  codeVerifier,
  redirectUri: authConfig.redirectUri
});

// Decode ID token
const idToken = decodeJWT(tokens.idToken);

// Store session
Astro.cookies.set('session', tokens.accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: tokens.expiresIn
});

// Redirect to dashboard
return Astro.redirect('/dashboard');
***
```

### 5. OSM-Account-Linking

#### OAuth mit OpenStreetMap

```
// src/lib/osm/oauth.ts
export const osmOAuthConfig = {
  authorizationEndpoint: 'https://www.openstreetmap.org/oauth2/authorize',
  tokenEndpoint: 'https://www.openstreetmap.org/oauth2/token',
  clientId: import.meta.env.OSM_CLIENT_ID,
  clientSecret: import.meta.env.OSM_CLIENT_SECRET,
  redirectUri: `${import.meta.env.PUBLIC_BASE_URL}/osm/callback`,
  scopes: ['read_prefs', 'write_api']
};

export async function initiateOSMLink(userId: string): Promise<string> {
  const state = generateRandomString(32);
  
  // Store state with user ID
  await redis.set(`osm_link:${state}`, userId, 'EX', 600);
  
  const authUrl = new URL(osmOAuthConfig.authorizationEndpoint);
  authUrl.searchParams.set('client_id', osmOAuthConfig.clientId);
  authUrl.searchParams.set('redirect_uri', osmOAuthConfig.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', osmOAuthConfig.scopes.join(' '));
  authUrl.searchParams.set('state', state);
  
  return authUrl.toString();
}
```

#### OSM-Callback-Handler

```
// src/pages/osm/callback.astro
***
import { osmOAuthConfig } from '../../lib/osm/oauth';
import { updateUserMetadata } from '../../lib/zitadel/api';

const code = Astro.url.searchParams.get('code');
const state = Astro.url.searchParams.get('state');

// Verify state
const userId = await redis.get(`osm_link:${state}`);
if (!userId) {
  return new Response('Invalid state', { status: 400 });
}

// Exchange code for token
const tokenResponse = await fetch(osmOAuthConfig.tokenEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: osmOAuthConfig.redirectUri,
    client_id: osmOAuthConfig.clientId,
    client_secret: osmOAuthConfig.clientSecret
  })
});

const tokens = await tokenResponse.json();

// Get OSM user info
const userResponse = await fetch('https://api.openstreetmap.org/api/0.6/user/details.json', {
  headers: { 'Authorization': `Bearer ${tokens.access_token}` }
});

const osmUser = await userResponse.json();

// Store in Zitadel user metadata
await updateUserMetadata(userId, {
  osm_user_id: osmUser.user.id.toString(),
  osm_display_name: osmUser.user.display_name,
  osm_token_encrypted: encrypt(tokens.access_token),
  osm_linked_at: new Date().toISOString()
});

return Astro.redirect('/dashboard?osm_linked=true');
***
```

### 6. Zitadel Actions für Token-Enrichment

#### Action: Add OSM Claims to Token

**Zitadel Console → Actions → Add Action**

```
// Action: EnrichTokenWithOSM
function enrichTokenWithOSM(ctx, api) {
  // Prüfe ob User OSM-Account gelinkt hat
  if (ctx.user.metadata && ctx.user.metadata.osm_user_id) {
    // Füge Claims zum ID-Token hinzu
    api.v1.claims.setClaim('osm_linked', true);
    api.v1.claims.setClaim('osm_user_id', ctx.user.metadata.osm_user_id);
    api.v1.claims.setClaim('osm_display_name', ctx.user.metadata.osm_display_name);
    
    // Optional: Home-Instance für Federation
    api.v1.claims.setClaim('home_instance', ctx.instanceDomain);
  } else {
    api.v1.claims.setClaim('osm_linked', false);
  }
}
```

**Trigger:** Pre-Token-Creation

#### Action: Audit Federation Logins

```
// Action: AuditFederationLogin
function auditFederationLogin(ctx, api) {
  if (ctx.user.externalIdp) {
    // Log föderierten Login
    api.v1.log({
      level: 'info',
      message: 'Federation login',
      userId: ctx.user.id,
      idp: ctx.user.externalIdp.idpId,
      externalUserId: ctx.user.externalIdp.userId,
      timestamp: new Date().toISOString()
    });
    
    // Optional: Metric für Monitoring
    api.v1.metadata.increment('federation_logins_total', {
      idp: ctx.user.externalIdp.idpId
    });
  }
}
```

**Trigger:** Post-Authentication

### 7. Export-Autorisierung

#### Middleware für OSM-Export-Endpunkte

```
// src/middleware/requireOSMLink.ts
import { defineMiddleware } from 'astro:middleware';
import { verifyToken } from '../lib/auth/verify';

export const requireOSMLink = defineMiddleware(async (context, next) => {
  const token = context.cookies.get('session')?.value;
  
  if (!token) {
    return context.redirect('/login');
  }
  
  const payload = await verifyToken(token);
  
  // Prüfe OSM-Link-Claim
  if (!payload.osm_linked) {
    return new Response(JSON.stringify({
      error: 'OSM account not linked',
      message: 'You must link your OpenStreetMap account before exporting data'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Füge OSM-User-ID zum Context hinzu
  context.locals.osmUserId = payload.osm_user_id;
  context.locals.osmDisplayName = payload.osm_display_name;
  
  return next();
});
```

#### Export-Endpoint

```
// src/pages/api/export/osm.ts
import type { APIRoute } from 'astro';
import { requireOSMLink } from '../../../middleware/requireOSMLink';
import { createOSMChangeset } from '../../../lib/osm/changeset';

export const POST: APIRoute = async (context) => {
  // Middleware applied via config
  const { changesetData } = await context.request.json();
  
  // Hole verschlüsselten OSM-Token aus User-Metadata
  const userMetadata = await fetchUserMetadata(context.locals.userId);
  const osmToken = decrypt(userMetadata.osm_token_encrypted);
  
  // Erstelle Changeset in OSM
  const changesetId = await createOSMChangeset({
    token: osmToken,
    comment: changesetData.comment,
    source: 'p2d2',
    changes: changesetData.features
  });
  
  return new Response(JSON.stringify({
    success: true,
    changesetId,
    url: `https://www.openstreetmap.org/changeset/${changesetId}`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

// Apply middleware
export const middleware = [requireOSMLink];
```

## Trust-Management

### Problem: Wie etablieren Instanzen Vertrauen?

Wenn eine neue p2d2-Instanz (z.B. p2d2-München) startet, müssen andere Instanzen entscheiden: "Vertrauen wir München?"

### Lösung: p2d2-Registry (Optional)

Ein einfacher Registry-Service als JSON-Datei in Git:

```
// https://github.com/p2d2-network/registry/blob/main/instances.json
{
  "instances": [
    {
      "id": "koeln",
      "name": "Stadt Köln",
      "domain": "data-koeln.openstreetmap.de",
      "issuer": "https://auth.data-koeln.openstreetmap.de",
      "admin_contact": "admin@stadt-koeln.de",
      "region": "DE-NW",
      "verified": true,
      "verified_by": "p2d2-core-team",
      "verified_at": "2025-12-01T00:00:00Z",
      "public_key_fingerprint": "SHA256:abc123..."
    },
    {
      "id": "paris",
      "name": "Ville de Paris",
      "domain": "data-paris.openstreetmap.fr",
      "issuer": "https://auth.data-paris.openstreetmap.fr",
      "admin_contact": "admin@paris.fr",
      "region": "FR-IDF",
      "verified": true,
      "verified_by": "p2d2-core-team",
      "verified_at": "2025-12-05T00:00:00Z",
      "public_key_fingerprint": "SHA256:def456..."
    }
  ],
  "schema_version": "1.0",
  "last_updated": "2025-12-09T19:00:00Z"
}
```

### Auto-Discovery via Registry

```
// src/lib/federation/registry.ts
const REGISTRY_URL = 'https://raw.githubusercontent.com/p2d2-network/registry/main/instances.json';

export async function fetchTrustedInstances(): Promise<Instance[]> {
  const response = await fetch(REGISTRY_URL);
  const registry = await response.json();
  
  return registry.instances.filter(i => i.verified);
}

export async function syncFederationConfig() {
  const trustedInstances = await fetchTrustedInstances();
  
  for (const instance of trustedInstances) {
    // Prüfe ob bereits konfiguriert
    const exists = await checkIdPExists(instance.id);
    if (exists) continue;
    
    // Auto-configure external IdP
    await createExternalIdP({
      name: instance.name,
      issuer: instance.issuer,
      // Client-Credentials müssen bilateral ausgetauscht werden
      clientId: await requestFederationClientId(instance.issuer),
      scopes: ['openid', 'email', 'profile']
    });
  }
}
```

### Bilateraler Client-Austausch

Für sichere Federation müssen Client-Credentials bilateral ausgetauscht werden:

**München kontaktiert Köln:**
```
# München sendet Request an Köln
curl -X POST https://auth.data-koeln.openstreetmap.de/federation/request \
  -H "Content-Type: application/json" \
  -d '{
    "requesting_instance": "data-muenchen.openstreetmap.de",
    "requesting_issuer": "https://auth.data-muenchen.openstreetmap.de",
    "admin_email": "admin@muenchen.de",
    "public_key": "-----BEGIN PUBLIC KEY-----\n...",
    "callback_url": "https://auth.data-muenchen.openstreetmap.de/oauth/v2/callback"
  }'

# Köln Admin approved Request (manuell oder automatisch bei verified instances)
# Response:
{
  "client_id": "muenchen-federation-abc123",
  "client_secret": "secret-xyz789",
  "approved_by": "admin@stadt-koeln.de",
  "approved_at": "2025-12-09T20:00:00Z"
}
```

## DSGVO und Datenschutz

### Welche Daten werden bei Federation übertragen?

**Minimal (empfohlen):**
- `sub` (User-ID der Home-Instanz)
- `email` (für Account-Matching)
- `email_verified`
- `name` (optional)

**Nicht übertragen:**
- Passwort-Hashes (verbleiben auf Home-Instanz)
- Vollständige Profile
- Geodaten-Beiträge

### Shadow-User und Datenminimierung

Wenn User aus Köln sich in Paris anmeldet:

```
-- Paris erstellt nur minimal Shadow-User
INSERT INTO zitadel.users (
  id,
  email,
  email_verified,
  external_idp_id,
  external_user_id,
  home_instance
) VALUES (
  'shadow-123',
  'user@example.com',
  true,
  'p2d2-koeln',
  'koeln-user-456',
  'data-koeln.openstreetmap.de'
);
```

**Keine lokale Speicherung von:**
- Name (optional, kann bei jedem Login via Token abgerufen werden)
- Profilbild
- Weitere persönliche Daten

### Datenlöschung

User kann bei Home-Instanz Account löschen:
1. Köln löscht Account
2. Köln sendet Revocation an alle konfigurierten Instanzen (via Webhook/Event)
3. Paris/Warschau/etc. löschen Shadow-User

```
// Event-Handler für Account-Deletion
async function handleAccountDeletion(event: UserDeletedEvent) {
  const federatedInstances = await getFederatedInstances();
  
  for (const instance of federatedInstances) {
    await fetch(`${instance.issuer}/federation/user-deleted`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${instance.federationToken}`
      },
      body: JSON.stringify({
        external_user_id: event.userId,
        home_instance: ctx.instanceDomain,
        deleted_at: new Date().toISOString()
      })
    });
  }
}
```

## Sicherheit

### Token-Validierung

Jede Instanz muss Tokens von externen IdPs validieren:

```
// src/lib/auth/verify.ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export async function verifyToken(token: string, issuer: string) {
  // Cache JWKS per Issuer
  if (!jwksCache.has(issuer)) {
    const jwksUrl = `${issuer}/oauth/v2/keys`;
    jwksCache.set(issuer, createRemoteJWKSet(new URL(jwksUrl)));
  }
  
  const JWKS = jwksCache.get(issuer)!;
  
  const { payload } = await jwtVerify(token, JWKS, {
    issuer,
    audience: authConfig.clientId
  });
  
  return payload;
}
```

### Rate-Limiting für Federation

Schutz vor Missbrauch durch fremde Instanzen:

```
// src/middleware/federationRateLimit.ts
import { rateLimit } from '@/lib/rateLimit';

export const federationRateLimit = defineMiddleware(async (context, next) => {
  const token = context.request.headers.get('authorization');
  const payload = await verifyToken(token);
  
  // Rate-Limit pro externe Instanz
  const homeInstance = payload.home_instance;
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per instance
    keyGenerator: () => `federation:${homeInstance}`
  });
  
  const allowed = await limiter.check();
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  return next();
});
```

### Audit-Logging

Alle Federation-Events sollten geloggt werden:

```
// Event-Types
enum FederationEvent {
  EXTERNAL_LOGIN = 'external_login',
  SHADOW_USER_CREATED = 'shadow_user_created',
  EXPORT_BY_EXTERNAL_USER = 'export_by_external_user',
  TRUST_ESTABLISHED = 'trust_established',
  TRUST_REVOKED = 'trust_revoked'
}

// Log-Schema
interface FederationLog {
  event: FederationEvent;
  timestamp: string;
  local_user_id?: string;
  external_user_id: string;
  home_instance: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
}

// Logger
async function logFederationEvent(log: FederationLog) {
  await db.insert('federation_logs', log);
  
  // Optional: Streame zu zentralem Monitoring
  await monitoring.send({
    type: 'federation_event',
    ...log
  });
}
```

## Monitoring und Observability

### Metriken

```
// Prometheus-Metriken für Federation
const federationMetrics = {
  logins_total: new Counter({
    name: 'p2d2_federation_logins_total',
    help: 'Total federation logins',
    labelNames: ['home_instance', 'status']
  }),
  
  shadow_users_total: new Gauge({
    name: 'p2d2_federation_shadow_users_total',
    help: 'Current number of shadow users',
    labelNames: ['home_instance']
  }),
  
  token_validation_duration: new Histogram({
    name: 'p2d2_federation_token_validation_duration_seconds',
    help: 'Token validation duration',
    labelNames: ['issuer']
  }),
  
  exports_by_external_users: new Counter({
    name: 'p2d2_exports_by_external_users_total',
    help: 'OSM exports by federated users',
    labelNames: ['home_instance']
  })
};
```

### Health-Check für Federation

```
// src/pages/api/health/federation.ts
export const GET: APIRoute = async () => {
  const trustedInstances = await fetchTrustedInstances();
  const health = [];
  
  for (const instance of trustedInstances) {
    try {
      // Teste OIDC Discovery
      const discovery = await fetch(
        `${instance.issuer}/.well-known/openid-configuration`,
        { timeout: 5000 }
      );
      
      health.push({
        instance: instance.id,
        status: discovery.ok ? 'healthy' : 'unhealthy',
        latency_ms: discovery.headers.get('x-response-time')
      });
    } catch (error) {
      health.push({
        instance: instance.id,
        status: 'unreachable',
        error: error.message
      });
    }
  }
  
  return new Response(JSON.stringify({ instances: health }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

## Implementierungs-Roadmap

### Phase 1: Single-Instance (Aktuell/Q4 2025)

**Ziel:** Basis-IAM für erste p2d2-Instanz

- [x] Zitadel-Deployment in Proxmox LXC
- [ ] PostgreSQL-Integration (shared mit PostGIS)
- [ ] Astro-Frontend OIDC-Integration
- [ ] OSM-OAuth-Linking
- [ ] Export-Autorisierung basierend auf OSM-Link

**Deliverables:**
- `ops.data-dna.eu` mit funktionierendem IAM
- User können sich registrieren, OSM-Account linken, exportieren

### Phase 2: Federation-Prototyp (Q1 2026)

**Ziel:** Proof-of-Concept für Federation zwischen zwei Instanzen

- [ ] Zweite Test-Instanz deployen (`dev.data-dna.eu`)
- [ ] Bilaterales Trust-Setup (ops ↔ dev)
- [ ] OIDC-Federation konfigurieren
- [ ] Shadow-User-Handling
- [ ] Cross-Instance-Login testen

**Deliverables:**
- User mit ops-Account kann auf dev zugreifen
- Dokumentation des Federation-Setups

### Phase 3: Multi-Tenancy (Q2 2026)

**Ziel:** Mehrere Organisationen pro Instanz

- [ ] Zitadel Organizations für Kommunen
- [ ] Org-spezifische externe IdPs (Keycloak-Integration)
- [ ] Delegiertes Admin-Management pro Org

**Deliverables:**
- `ops.data-dna.eu` hostet mehrere Kommunen
- Jede Kommune kann eigene IdPs anbinden

### Phase 4: Production-Ready Federation (Q3 2026)

**Ziel:** Skalierbare Federation für beliebig viele Instanzen

- [ ] p2d2-Registry aufsetzen
- [ ] Auto-Discovery-Mechanismus
- [ ] Monitoring und Alerting
- [ ] Audit-Logging
- [ ] DSGVO-Compliance-Dokumentation
- [ ] Runbook für neue Instanzen

**Deliverables:**
- Neue Instanzen können ohne manuelle Konfiguration joinen
- Produktions-Ready für internationale Deployments

## Offene Fragen

### 1. Trust-Registry: Governance-Modell

**Frage:** Wer darf neue Instanzen in die Registry aufnehmen?

**Optionen:**
- **Option A:** Core-Team kuratiert (Qualitätskontrolle, aber Bottleneck)
- **Option B:** Community-Voting (demokratisch, aber komplex)
- **Option C:** Self-Service mit Review (schnell, aber Spam-Risiko)

**Empfehlung:** Start mit Option A, später Option C mit automatischer Verifikation (DNS-Challenge, Email-Verifikation)

### 2. Revocation: Wie werden kompromittierte Instanzen ausgeschlossen?

**Frage:** Was passiert, wenn eine Instanz gehackt wird oder böswillig agiert?

**Lösung:**
- Revocation-List in Registry
- Webhook-basierte Notification an alle Instanzen
- Automatisches Deaktivieren des External IdP

```
// registry/revocations.json
{
  "revocations": [
    {
      "instance_id": "malicious-instance",
      "revoked_at": "2025-11-15T00:00:00Z",
      "reason": "Security incident",
      "revoked_by": "p2d2-security-team"
    }
  ]
}
```

### 3. Konfliktlösung bei Email-Kollisionen

**Frage:** Was passiert, wenn User A in Köln und User B in Paris die gleiche Email haben?

**Aktueller Ansatz:**
- Shadow-User nutzt `(email, home_instance)` als Composite-Key
- `user@example.com@koeln` ≠ `user@example.com@paris`

**Alternatives Konzept:** Email-Ownership-Verification
- User muss Email verifizieren
- Nur eine Instanz kann Email "besitzen"
- Andere Instanzen müssen alternative Identifier nutzen

### 4. Performance bei vielen föderierten Instanzen

**Frage:** Skaliert das Modell bei 100+ Instanzen?

**Potential Bottlenecks:**
- JWKS-Fetching für jede Instanz (Caching hilft)
- Discovery-Requests (kann gecached werden, TTL: 24h)
- Shadow-User-Datenbank wächst linear

**Optimierungen:**
- Lazy-Loading: Nur konfigurieren, wenn tatsächlich genutzt
- JWKS-Cache mit TTL
- Periodisches Cleanup inaktiver Shadow-User

### 5. Migration bestehender User

**Frage:** Was passiert bei Migration von Single-Instance zu Federation?

**Szenario:** Köln startet standalone, später kommt Federation hinzu

**Lösung:**
- Bestehende User bleiben "native" (home_instance = NULL)
- Neue föderierte User haben home_instance gesetzt
- Keine Breaking Changes für existierende User

## Referenzen

### Technische Standards
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

### Zitadel-Dokumentation
- [Zitadel Identity Providers](https://zitadel.com/docs/guides/integrate/identity-providers/introduction)
- [Zitadel Identity Brokering](https://zitadel.com/docs/concepts/features/identity-brokering)
- [Zitadel OIDC Integration](https://zitadel.com/docs/guides/integrate/login/oidc)
- [Zitadel Actions](https://zitadel.com/docs/apis/actions/introduction)

### OpenStreetMap
- [OSM OAuth 2.0](https://wiki.openstreetmap.org/wiki/OAuth)
- [OSM API Documentation](https://wiki.openstreetmap.org/wiki/API_v0.6)

### Best Practices
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

## Änderungshistorie

| Version | Datum | Autor | Änderung |
|---------|-------|-------|----------|
| 0.1 | 2025-12-09 | Perplexity AI | Initial draft nach Spezifikation |
| 0.2 | 2025-12-09 | Peter König | Durchsicht Draft, QS-Header gesetzt|

## Nächste Schritte

1. **Review dieses Konzepts** durch Team und Community
2. **Phase 1 umsetzen**: Single-Instance-Deployment
3. **Feedback sammeln** von frühen Usern
4. **Phase 2 starten**: Federation-Prototyp mit zweiter Instanz
5. **Dokumentation erweitern**: Admin-Guide, User-Guide, API-Docs

---

**Fragen, Feedback, Diskussion:**
- GitHub Discussions: `github.com/Peter-Koenig/p2d2-docs-hub/discussions`
- Matrix-Channel: `#p2d2:matrix.org` (geplant)
