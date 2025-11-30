---
title: Ory IAM Container (Planned)
description: Identity and Access Management for p2d2
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# LXC: Ory IAM (Planned)

::: warning In Planning
This container is **not yet implemented**. This documentation describes the planned architecture based on best practices for IAM integration.
:::

## Container Specification (Planned)

```
Type: LXC (unprivileged with Docker support)
OS: Debian 13 (trixie)
Hostname: ory-iam
Status: planned

Resources:
RAM: 2 GB
Disk: 10 GB
CPU Shares: 1024
```

## Architecture Overview

```
graph LR
subgraph "LXC: Ory IAM"
    Kratos[Ory Kratos<br>Identity Management]
    Hydra[Ory Hydra<br>OAuth2/OIDC Provider]
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

## Components

### Ory Kratos (Identity Management)
```
Function: User registration, login, password reset
Database: Dedicated PostgreSQL database
Auth Methods:
  - Email/Password
  - Social Login (via Hydra)
  - Multi-Factor Authentication (TOTP)
  - WebAuthn/Passkeys

Features:
  - Self-Service Flows (no admin intervention for registration)
  - Account Recovery via Email
  - Email verification
  - Session Management (Cookie-based)
```

### Ory Hydra (OAuth2/OIDC)
```
Function: OAuth2 provider for third-party apps
Database: Separate PostgreSQL database
Protocols:
  - OAuth2 (Authorization Code Flow)
  - OpenID Connect (OIDC)
  - Token Introspection/Revocation

Use Cases:
  - Single Sign-On (SSO) for p2d2 subdomains
  - API access for external clients
  - Mobile app integration
```

## Installation (Docker Compose Approach)

### Prerequisites
```
# Create LXC container (on Proxmox host)
pct create <VMID> <DEBIAN13_TEMPLATE>  
--hostname ory-iam  
--cores 2  
--memory 2048  
--rootfs <STORAGE>:10  
--net0 name=eth0,bridge=vmbr1  
--unprivileged 1  
--features nesting=1  # For Docker support

# Start container and install Docker
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Docker Compose Structure
```
# /opt/ory/docker-compose.yml (simplified)

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
**NEVER** store secrets directly in docker-compose.yml! Use:
- `.env` files (not committed to Git)
- Docker Secrets
- External secret managers (Vault, SOPS)
:::

## Caddy Configuration (OPNSense)

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

# Admin API (internal only)
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

## Integration with p2d2 Frontend

### Session-based Login (Kratos)
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

// Middleware for protected routes
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
// Register OAuth2 Client (one-time, via Admin API)
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

## Database Setup (PostgreSQL Container)

```
-- Ory-Kratos Database
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Ory-Hydra Database
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- Schema migrations are performed automatically by Kratos/Hydra
```

## Monitoring & Health Checks

```
# Check health endpoints
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# View Docker logs
docker-compose -f /opt/ory/docker-compose.yml logs -f

# Container status
docker ps | grep ory
```

## Security Checklist

Before production deployment:
- [ ] Replace `SECRETS_SYSTEM` in Hydra with a strong secret (min. 32 characters)
- [ ] Move PostgreSQL passwords to `.env` file (not in docker-compose.yml)
- [ ] Verify Caddy TLS certificates for all auth domains
- [ ] Make Admin API accessible only via VPN/Management VLAN
- [ ] Enable rate limiting for login endpoints (Brute-force protection)
- [ ] Configure CORS headers correctly (only own domains)
- [ ] Configure and test SMTP server for email dispatch
- [ ] Set up backup job for Ory databases

## Implementation Roadmap

**Phase 1** (Week 1-2): Basic Setup
- Create LXC container and install Docker
- Create PostgreSQL databases
- Kratos Docker Compose Setup
- Test Login/Registration UI

**Phase 2** (Week 3-4): Hydra Integration
- Configure Hydra container
- Register OAuth2 clients for p2d2 frontend
- Test token flows

**Phase 3** (Week 5-6): Frontend Integration
- Implement AstroJS Session Middleware
- Integrate login flows into p2d2 UI
- E2E Tests (Registration → Login → Authorized Request)

**Phase 4** (Week 7): Production Hardening
- SMTP Integration (Email dispatch)
- Configure Rate Limiting
- Set up monitoring
- Finalize documentation

## References

- [Ory Kratos Documentation](https://www.ory.sh/docs/kratos/)
- [Ory Hydra Documentation](https://www.ory.sh/docs/hydra/)
- [OAuth2 Best Practices (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)