---
title: Contêiner Ory IAM (Planejado)
description: Gerenciamento de Identidade e Acesso para p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# LXC: Ory IAM (Planejado)

::: warning Em Planejamento
Este contêiner **ainda não está implementado**. A documentação descreve a arquitetura planejada com base nas melhores práticas para integração IAM.
:::

## Especificação do Contêiner (Planejada)

```
Tipo: LXC (não privilegiado com suporte Docker)
SO: Debian 13 (trixie)
Hostname: ory-iam
Status: planejado

Recursos:
  RAM: 2 GB
  Disco: 10 GB
  CPU Shares: 1024
```

## Visão Geral da Arquitetura

```
graph LR
    subgraph "LXC: Ory IAM"
        Kratos[Ory Kratos<br/>Gerenciamento de Identidade]
        Hydra[Ory Hydra<br/>Provedor OAuth2/OIDC]
    end
    
    subgraph "Reverse Proxy (OPNSense)"
        CaddyAuth[auth.domain.eu<br/>→ UI Kratos]
        CaddyAPI[api.auth.domain.eu<br/>→ API Kratos]
        CaddyOAuth[oauth.domain.eu<br/>→ Hydra]
    end
    
    subgraph "Contêiner PostgreSQL"
        DBKratos[(BD Kratos)]
        DBHydra[(BD Hydra)]
    end
    
    subgraph "Contêiner Frontend"
        Astro[Apps AstroJS<br/>Auth baseada em Sessão]
    end
    
    CaddyAuth --> Kratos
    CaddyAPI --> Kratos
    CaddyOAuth --> Hydra
    
    Kratos -->|SQL| DBKratos
    Hydra -->|SQL| DBHydra
    Kratos -.->|Fluxo de Login| Hydra
    
    Astro -->|Cookies Sessão| CaddyAuth
    Astro -->|Tokens OAuth2| CaddyOAuth
```

## Componentes

### Ory Kratos (Gerenciamento de Identidade)

```
Função: Registro de usuário, login, redefinição de senha
Banco de Dados: Banco de dados PostgreSQL dedicado
Métodos de Auth:
  - Email/Senha
  - Login Social (via Hydra)
  - Autenticação Multi-Fator (TOTP)
  - WebAuthn/Passkeys

Recursos:
  - Fluxos de Autoatendimento (sem intervenção admin para registro)
  - Recuperação de Conta via Email
  - Verificação de Email
  - Gerenciamento de Sessão (baseado em Cookies)
```

### Ory Hydra (OAuth2/OIDC)

```
Função: Provedor OAuth2 para Apps de Terceiros
Banco de Dados: Banco de dados PostgreSQL separado
Protocolos:
  - OAuth2 (Fluxo de Código de Autorização)
  - OpenID Connect (OIDC)
  - Introspecção/Revogação de Tokens

Casos de Uso:
  - Single Sign-On (SSO) para subdomínios p2d2
  - Acesso API para clientes externos
  - Integração app móvel
```

## Instalação (Abordagem Docker Compose)

### Pré-requisitos

```
# Criar contêiner LXC (no host Proxmox)
pct create <VMID> <DEBIAN13_TEMPLATE> \
  --hostname ory-iam \
  --cores 2 \
  --memory 2048 \
  --rootfs <STORAGE>:10 \
  --net0 name=eth0,bridge=vmbr1 \
  --unprivileged 1 \
  --features nesting=1  # Para suporte Docker

# Iniciar contêiner e instalar Docker
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Estrutura Docker Compose

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

::: danger Gerenciamento de Segredos
**NUNCA** armazene segredos diretamente no docker-compose.yml! Use:

  - Arquivos `.env` (não commitar no Git)
  - Docker Secrets
  - Gerenciadores de Segredos Externos (Vault, SOPS)
    :::

## Configuração Caddy (OPNSense)

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

# API Admin (somente interna)
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

## Integração com Frontend p2d2

### Login Baseado em Sessão (Kratos)

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

// Middleware para rotas protegidas
export async function onRequest({ request, redirect }, next) {
  const user = await checkSession(request);
  if (!user) {
    return redirect('/login');
  }
  return next();
}
```

### Fluxo OAuth2 (Hydra)

```
// Registrar Cliente OAuth2 (uma única vez, via API Admin)
const client = {
  client_id: "p2d2-frontend",
  client_secret: "<GENERATED_SECRET>",
  redirect_uris: ["https://www.domain.eu/auth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile email"
};

// Solicitação de Autorização (voltada ao usuário)
const authUrl = `https://oauth.domain.eu/oauth2/auth` +
  `?client_id=${client_id}` +
  `&response_type=code` +
  `&scope=openid%20profile%20email` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&state=${generateState()}`;

// Troca de Token (backend)
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

## Configuração Banco de Dados (Contêiner PostgreSQL)

```
-- Banco de Dados Ory-Kratos
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Banco de Dados Ory-Hydra
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- Migrações de esquema são realizadas automaticamente por Kratos/Hydra
```

## Monitoramento & Verificações de Saúde

```
# Verificar endpoints de saúde
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# Ver logs do Docker
docker-compose -f /opt/ory/docker-compose.yml logs -f

# Status contêiner
docker ps | grep ory
```

## Lista de Verificação de Segurança

Antes da implantação em produção:

  - [ ] Substituir `SECRETS_SYSTEM` no Hydra por um segredo forte (min. 32 caracteres)
  - [ ] Mover senhas PostgreSQL para arquivo `.env` (não no docker-compose.yml)
  - [ ] Verificar certificados Caddy TLS para todos os domínios auth
  - [ ] Tornar API Admin acessível apenas via VPN/VLAN de Gerenciamento
  - [ ] Habilitar Limitação de Taxa para endpoints de login (proteção Brute-Force)
  - [ ] Configurar cabeçalhos CORS corretamente (somente domínios próprios)
  - [ ] Configurar e testar servidor SMTP para envio de emails
  - [ ] Configurar tarefa de backup para bancos de dados Ory

## Roteiro de Implementação

**Fase 1** (Semana 1-2): Configuração Básica

  - Criar contêiner LXC e instalar Docker
  - Criar bancos de dados PostgreSQL
  - Configuração Docker Compose Kratos
  - Testar UI Login/Registro

**Fase 2** (Semana 3-4): Integração Hydra

  - Configurar Contêiner Hydra
  - Registrar clientes OAuth2 para frontend p2d2
  - Testar fluxos de token

**Fase 3** (Semana 5-6): Integração Frontend

  - Implementar Middleware de Sessão AstroJS
  - Integrar fluxos de login na UI p2d2
  - Testes E2E (Registro → Login → Requisição Autorizada)

**Fase 4** (Semana 7): Endurecimento Produção

  - Integração SMTP (Envio de email)
  - Configurar Limitação de Taxa
  - Configurar Monitoramento
  - Finalizar Documentação

## Referências

  - [Documentação Ory Kratos](https://www.ory.sh/docs/kratos/)
  - [Documentação Ory Hydra](https://www.ory.sh/docs/hydra/)
  - [Melhores Práticas OAuth2 (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
  - [Folha de Dicas Autenticação OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.