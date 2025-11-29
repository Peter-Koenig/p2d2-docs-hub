---
title: Ory IAM Container (Geplant)
description: Identity and Access Management für p2d2
---

# LXC: Ory IAM (Geplant)

::: warning In Planung
Dieser Container ist **noch nicht implementiert**. Die Dokumentation beschreibt die geplante Architektur basierend auf Best Practices für IAM-Integration.
:::

## Container-Spezifikation (Geplant)

```
Typ: LXC (unprivileged mit Docker-Support)
OS: Debian 13 (trixie)
Hostname: ory-iam
Status: planned

Ressourcen:
  RAM: 2 GB
  Disk: 10 GB
  CPU Shares: 1024
```

## Architektur-Übersicht

```
graph LR
    subgraph "LXC: Ory IAM"
        Kratos[Ory Kratos<br/>Identity Management]
        Hydra[Ory Hydra<br/>OAuth2/OIDC Provider]
    end
    
    subgraph "Reverse Proxy (OPNSense)"
        CaddyAuth[auth.domain.eu<br/>→ Kratos UI]
        CaddyAPI[api.auth.domain.eu<br/>→ Kratos API]
        CaddyOAuth[oauth.domain.eu<br/>→ Hydra]
    end
    
    subgraph "PostgreSQL Container"
        DBKratos[(Kratos DB)]
        DBHydra[(Hydra DB)]
    end
    
    subgraph "Frontend Container"
        Astro[AstroJS Apps<br/>Session-based Auth]
    end
    
    CaddyAuth --> Kratos
    CaddyAPI --> Kratos
    CaddyOAuth --> Hydra
    
    Kratos -->|SQL| DBKratos
    Hydra -->|SQL| DBHydra
    Kratos -.->|Login Flow| Hydra
    
    Astro -->|Session Cookies| CaddyAuth
    Astro -->|OAuth2 Tokens| CaddyOAuth
```

## Komponenten

### Ory Kratos (Identity Management)
```
Funktion: User-Registrierung, Login, Passwort-Reset
Datenbank: Dedizierte PostgreSQL-Datenbank
Auth-Methoden:
  - Email/Password
  - Social Login (via Hydra)
  - Multi-Factor Authentication (TOTP)
  - WebAuthn/Passkeys

Features:
  - Self-Service Flows (kein Admin-Eingriff für Registration)
  - Account Recovery via Email
  - Email-Verifizierung
  - Session-Management (Cookie-basiert)
```

### Ory Hydra (OAuth2/OIDC)
```
Funktion: OAuth2-Provider für Third-Party Apps
Datenbank: Separate PostgreSQL-Datenbank
Protokolle:
  - OAuth2 (Authorization Code Flow)
  - OpenID Connect (OIDC)
  - Token Introspection/Revocation

Use Cases:
  - Single Sign-On (SSO) für p2d2-Subdomains
  - API-Zugriff für externe Clients
  - Mobile-App-Integration
```

## Installation (Docker Compose Approach)

### Voraussetzungen
```
# LXC-Container erstellen (auf Proxmox-Host)
pct create <VMID> <DEBIAN13_TEMPLATE> \
  --hostname ory-iam \
  --cores 2 \
  --memory 2048 \
  --rootfs <STORAGE>:10 \
  --net0 name=eth0,bridge=vmbr1 \
  --unprivileged 1 \
  --features nesting=1  # Für Docker-Support

# Container starten und Docker installieren
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Docker Compose Struktur
```
# /opt/ory/docker-compose.yml (vereinfacht)
version: '3.8'

services:
  kratos:
    image: oryd/kratos:latest
    environment:
      - DSN=postgres://<USER>:<PASS>@<DB_HOST>:<PORT>/ory_kratos?sslmode=disable
      - SERVE_PUBLIC_BASE_URL=https://api.auth.domain.eu
      - SELFSERVICE_DEFAULT_BROWSER_RETURN_URL=https://www.domain.eu
    volumes:
      - ./kratos-config:/etc/config/kratos
    command: serve --config /etc/config/kratos/kratos.yml

  hydra:
    image: oryd/hydra:latest
    environment:
      - DSN=postgres://<USER>:<PASS>@<DB_HOST>:<PORT>/ory_hydra?sslmode=disable
      - URLS_SELF_ISSUER=https://oauth.domain.eu
      - URLS_LOGIN=https://auth.domain.eu/login
      - URLS_CONSENT=https://auth.domain.eu/consent
    command: serve all
```

::: danger Secrets Management
**NIEMALS** Secrets direkt im docker-compose.yml speichern! Verwende:
- `.env`-Dateien (nicht in Git committen)
- Docker Secrets
- Externe Secret-Manager (Vault, SOPS)
:::

## Caddy-Konfiguration (OPNSense)

```
# Custom Config: /usr/local/etc/caddy/caddy.d/ory-iam.conf

# Login/Registration UI
auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_UI_PORT>
}

# Kratos Public API
api.auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_API_PORT>
}

# Hydra OAuth2 Endpoints
oauth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<HYDRA_PORT>
}

# Admin API (nur intern)
admin.auth.domain.eu {
    @internal {
        remote_ip <INTERNAL_NETWORK_RANGE>
    }
    handle @internal {
        reverse_proxy <ORY_IAM_CONTAINER>:<ADMIN_PORT>
    }
    respond 403
}
```

## Integration mit p2d2-Frontend

### Session-basierter Login (Kratos)
```
// src/lib/auth.ts (AstroJS)
export async function checkSession(request: Request): Promise<User | null> {
  const kratosPublicUrl = process.env.KRATOS_PUBLIC_URL;
  const cookie = request.headers.get('cookie');
  
  const response = await fetch(`${kratosPublicUrl}/sessions/whoami`, {
    headers: { cookie }
  });
  
  if (response.ok) {
    const session = await response.json();
    return session.identity;
  }
  return null;
}

// Middleware für geschützte Routen
export async function onRequest({ request, redirect }, next) {
  const user = await checkSession(request);
  if (!user) {
    return redirect('/login');
  }
  return next();
}
```

### OAuth2-Flow (Hydra)
```
// OAuth2 Client registrieren (einmalig, via Admin-API)
const client = {
  client_id: "p2d2-frontend",
  client_secret: "<GENERATED_SECRET>",
  redirect_uris: ["https://www.domain.eu/auth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile email"
};

// Authorization Request (User-facing)
const authUrl = `https://oauth.domain.eu/oauth2/auth` +
  `?client_id=${client_id}` +
  `&response_type=code` +
  `&scope=openid%20profile%20email` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&state=${generateState()}`;

// Token Exchange (Backend)
const tokenResponse = await fetch('https://oauth.domain.eu/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirect_uri,
    client_id: client_id,
    client_secret: client_secret
  })
});
```

## Datenbank-Setup (PostgreSQL Container)

```
-- Ory-Kratos Datenbank
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Ory-Hydra Datenbank
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- Schema-Migrationen werden automatisch von Kratos/Hydra durchgeführt
```

## Monitoring & Health Checks

```
# Health-Endpoints prüfen
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# Docker-Logs anzeigen
docker-compose -f /opt/ory/docker-compose.yml logs -f

# Container-Status
docker ps | grep ory
```

## Sicherheits-Checkliste

Vor Production-Deployment:
- [ ] `SECRETS_SYSTEM` in Hydra mit starkem Secret ersetzen (min. 32 Zeichen)
- [ ] PostgreSQL-Passwörter in `.env`-File auslagern (nicht im docker-compose.yml)
- [ ] Caddy TLS-Zertifikate für alle auth-Domains verifizieren
- [ ] Admin-API nur über VPN/Management-VLAN erreichbar machen
- [ ] Rate-Limiting für Login-Endpunkte aktivieren (Brute-Force-Schutz)
- [ ] CORS-Headers korrekt konfigurieren (nur eigene Domains)
- [ ] SMTP-Server für Email-Versand konfigurieren und testen
- [ ] Backup-Job für Ory-Datenbanken einrichten

## Implementierungs-Roadmap

**Phase 1** (Woche 1-2): Basis-Setup
- LXC-Container erstellen und Docker installieren
- PostgreSQL-Datenbanken anlegen
- Kratos Docker Compose Setup
- Login/Registration UI testen

**Phase 2** (Woche 3-4): Hydra-Integration
- Hydra Container konfigurieren
- OAuth2-Clients für p2d2-Frontend registrieren
- Token-Flows testen

**Phase 3** (Woche 5-6): Frontend-Integration
- AstroJS Session-Middleware implementieren
- Login-Flows in p2d2-UI integrieren
- E2E-Tests (Registration → Login → Authorized Request)

**Phase 4** (Woche 7): Production-Hardening
- SMTP-Integration (Email-Versand)
- Rate-Limiting konfigurieren
- Monitoring aufsetzen
- Dokumentation finalisieren

## Referenzen

- [Ory Kratos Dokumentation](https://www.ory.sh/docs/kratos/)
- [Ory Hydra Dokumentation](https://www.ory.sh/docs/hydra/)
- [OAuth2 Best Practices (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)