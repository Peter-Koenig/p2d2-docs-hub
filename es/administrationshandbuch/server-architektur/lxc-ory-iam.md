---
title: Contenedor Ory IAM (Planeado)
description: Gestión de Identidad y Acceso para p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# LXC: Ory IAM (Planeado)

::: warning En Planificación
Este contenedor **aún no está implementado**. La documentación describe la arquitectura planificada basada en las mejores prácticas para la integración de IAM.
:::

## Especificación del Contenedor (Planeada)

```
Tipo: LXC (no privilegiado con soporte Docker)
SO: Debian 13 (trixie)
Hostname: ory-iam
Estado: planeado

Recursos:
  RAM: 2 GB
  Disco: 10 GB
  CPU Shares: 1024
```

## Resumen de Arquitectura

```
graph LR
    subgraph "LXC: Ory IAM"
        Kratos[Ory Kratos<br/>Gestión de Identidad]
        Hydra[Ory Hydra<br/>Proveedor OAuth2/OIDC]
    end
    
    subgraph "Reverse Proxy (OPNSense)"
        CaddyAuth[auth.domain.eu<br/>→ UI Kratos]
        CaddyAPI[api.auth.domain.eu<br/>→ API Kratos]
        CaddyOAuth[oauth.domain.eu<br/>→ Hydra]
    end
    
    subgraph "Contenedor PostgreSQL"
        DBKratos[(BD Kratos)]
        DBHydra[(BD Hydra)]
    end
    
    subgraph "Contenedor Frontend"
        Astro[Apps AstroJS<br/>Auth basada en Sesión]
    end
    
    CaddyAuth --> Kratos
    CaddyAPI --> Kratos
    CaddyOAuth --> Hydra
    
    Kratos -->|SQL| DBKratos
    Hydra -->|SQL| DBHydra
    Kratos -.->|Flujo de Login| Hydra
    
    Astro -->|Cookies Sesión| CaddyAuth
    Astro -->|Tokens OAuth2| CaddyOAuth
```

## Componentes

### Ory Kratos (Gestión de Identidad)

```
Función: Registro de usuario, login, reseteo de contraseña
Base de Datos: Base de datos PostgreSQL dedicada
Métodos de Auth:
  - Email/Contraseña
  - Login Social (vía Hydra)
  - Autenticación Multi-Factor (TOTP)
  - WebAuthn/Passkeys

Características:
  - Flujos de Auto-Servicio (sin intervención admin para registro)
  - Recuperación de Cuenta vía Email
  - Verificación de Email
  - Gestión de Sesión (basada en Cookies)
```

### Ory Hydra (OAuth2/OIDC)

```
Función: Proveedor OAuth2 para Apps de Terceros
Base de Datos: Base de datos PostgreSQL separada
Protocolos:
  - OAuth2 (Flujo de Código de Autorización)
  - OpenID Connect (OIDC)
  - Introspección/Revocación de Tokens

Casos de Uso:
  - Single Sign-On (SSO) para subdominios p2d2
  - Acceso API para clientes externos
  - Integración app móvil
```

## Instalación (Enfoque Docker Compose)

### Prerrequisitos

```
# Crear contenedor LXC (en host Proxmox)
pct create <VMID> <DEBIAN13_TEMPLATE> \
  --hostname ory-iam \
  --cores 2 \
  --memory 2048 \
  --rootfs <STORAGE>:10 \
  --net0 name=eth0,bridge=vmbr1 \
  --unprivileged 1 \
  --features nesting=1  # Para soporte Docker

# Iniciar contenedor e instalar Docker
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Estructura Docker Compose

```
# /opt/ory/docker-compose.yml (simplificado)
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

::: danger Gestión de Secretos
¡**NUNCA** almacene secretos directamente en docker-compose.yml! Use:

  - Archivos `.env` (no commitear a Git)
  - Docker Secrets
  - Gestores de Secretos Externos (Vault, SOPS)
    :::

## Configuración Caddy (OPNSense)

```
# Config Personalizada: /usr/local/etc/caddy/caddy.d/ory-iam.conf

# UI Login/Registro
auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_UI_PORT>
}

# API Pública Kratos
api.auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_API_PORT>
}

# Endpoints Hydra OAuth2
oauth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<HYDRA_PORT>
}

# API Admin (solo interna)
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

## Integración con Frontend p2d2

### Login Basado en Sesión (Kratos)

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

// Middleware para rutas protegidas
export async function onRequest({ request, redirect }, next) {
  const user = await checkSession(request);
  if (!user) {
    return redirect('/login');
  }
  return next();
}
```

### Flujo OAuth2 (Hydra)

```
// Registrar Cliente OAuth2 (una sola vez, vía API Admin)
const client = {
  client_id: "p2d2-frontend",
  client_secret: "<GENERATED_SECRET>",
  redirect_uris: ["https://www.domain.eu/auth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile email"
};

// Solicitud de Autorización (cara al usuario)
const authUrl = `https://oauth.domain.eu/oauth2/auth` +
  `?client_id=${client_id}` +
  `&response_type=code` +
  `&scope=openid%20profile%20email` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&state=${generateState()}`;

// Intercambio de Token (backend)
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

## Configuración Base de Datos (Contenedor PostgreSQL)

```
-- Base de Datos Ory-Kratos
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Base de Datos Ory-Hydra
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- Las migraciones de esquema son realizadas automáticamente por Kratos/Hydra
```

## Monitorización & Comprobaciones de Salud

```
# Comprobar endpoints de salud
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# Ver logs de Docker
docker-compose -f /opt/ory/docker-compose.yml logs -f

# Estado contenedor
docker ps | grep ory
```

## Lista de Verificación de Seguridad

Antes de despliegue a producción:

  - [ ] Reemplazar `SECRETS_SYSTEM` en Hydra con secreto fuerte (min. 32 caracteres)
  - [ ] Mover contraseñas PostgreSQL a archivo `.env` (no en docker-compose.yml)
  - [ ] Verificar certificados Caddy TLS para todos los dominios auth
  - [ ] Hacer API Admin accesible solo vía VPN/VLAN de Gestión
  - [ ] Habilitar Limitación de Tasa para endpoints de login (protección Brute-Force)
  - [ ] Configurar cabeceras CORS correctamente (solo dominios propios)
  - [ ] Configurar y probar servidor SMTP para envío de emails
  - [ ] Configurar tarea de backup para bases de datos Ory

## Hoja de Ruta de Implementación

**Fase 1** (Semana 1-2): Configuración Básica

  - Crear contenedor LXC e instalar Docker
  - Crear bases de datos PostgreSQL
  - Configuración Docker Compose Kratos
  - Probar UI Login/Registro

**Fase 2** (Semana 3-4): Integración Hydra

  - Configurar Contenedor Hydra
  - Registrar clientes OAuth2 para frontend p2d2
  - Probar flujos de token

**Fase 3** (Semana 5-6): Integración Frontend

  - Implementar Middleware de Sesión AstroJS
  - Integrar flujos de login en UI p2d2
  - Pruebas E2E (Registro → Login → Solicitud Autorizada)

**Fase 4** (Semana 7): Endurecimiento Producción

  - Integración SMTP (Envío de email)
  - Configurar Limitación de Tasa
  - Configurar Monitorización
  - Finalizar Documentación

## Referencias

  - [Documentación Ory Kratos](https://www.ory.sh/docs/kratos/)
  - [Documentación Ory Hydra](https://www.ory.sh/docs/hydra/)
  - [Buenas Prácticas OAuth2 (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
  - [Hoja de Trucos Autenticación OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.