---
title: Conteneur Ory IAM (Prévu)
description: Gestion des Identités et des Accès pour p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC : Ory IAM (Prévu)

::: warning En Planification
Ce conteneur n'est **pas encore implémenté**. La documentation décrit l'architecture prévue basée sur les meilleures pratiques pour l'intégration IAM.
:::

## Spécification du Conteneur (Prévue)

```
Type : LXC (non privilégié avec support Docker)
OS : Debian 13 (trixie)
Hostname : ory-iam
Statut : planifié

Ressources :
  RAM : 2 Go
  Disque : 10 Go
  Parts CPU : 1024
```

## Aperçu de l'Architecture

```
graph LR
    subgraph "LXC: Ory IAM"
        Kratos[Ory Kratos<br/>Gestion des Identités]
        Hydra[Ory Hydra<br/>Fournisseur OAuth2/OIDC]
    end
    
    subgraph "Reverse Proxy (OPNSense)"
        CaddyAuth[auth.domain.eu<br/>→ UI Kratos]
        CaddyAPI[api.auth.domain.eu<br/>→ API Kratos]
        CaddyOAuth[oauth.domain.eu<br/>→ Hydra]
    end
    
    subgraph "Conteneur PostgreSQL"
        DBKratos[(BD Kratos)]
        DBHydra[(BD Hydra)]
    end
    
    subgraph "Conteneur Frontend"
        Astro[Apps AstroJS<br/>Auth basée sur Session]
    end
    
    CaddyAuth --> Kratos
    CaddyAPI --> Kratos
    CaddyOAuth --> Hydra
    
    Kratos -->|SQL| DBKratos
    Hydra -->|SQL| DBHydra
    Kratos -.->|Flux de Login| Hydra
    
    Astro -->|Cookies Session| CaddyAuth
    Astro -->|Jetons OAuth2| CaddyOAuth
```

## Composants

### Ory Kratos (Gestion des Identités)

```
Fonction : Inscription utilisateur, connexion, réinitialisation de mot de passe
Base de données : Base de données PostgreSQL dédiée
Méthodes d'authentification :
  - Email/Mot de passe
  - Connexion sociale (via Hydra)
  - Authentification Multi-Facteurs (TOTP)
  - WebAuthn/Passkeys

Fonctionnalités :
  - Flux en libre-service (aucune intervention admin pour l'inscription)
  - Récupération de compte via Email
  - Vérification d'Email
  - Gestion de session (basée sur les cookies)
```

### Ory Hydra (OAuth2/OIDC)

```
Fonction : Fournisseur OAuth2 pour applications tierces
Base de données : Base de données PostgreSQL séparée
Protocoles :
  - OAuth2 (Flux de code d'autorisation)
  - OpenID Connect (OIDC)
  - Introspection/Révocation de jetons

Cas d'utilisation :
  - Single Sign-On (SSO) pour les sous-domaines p2d2
  - Accès API pour clients externes
  - Intégration d'application mobile
```

## Installation (Approche Docker Compose)

### Prérequis

```
# Créer conteneur LXC (sur l'hôte Proxmox)
pct create <VMID> <DEBIAN13_TEMPLATE> \
  --hostname ory-iam \
  --cores 2 \
  --memory 2048 \
  --rootfs <STORAGE>:10 \
  --net0 name=eth0,bridge=vmbr1 \
  --unprivileged 1 \
  --features nesting=1  # Pour support Docker

# Démarrer conteneur et installer Docker
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Structure Docker Compose

```
# /opt/ory/docker-compose.yml (simplifié)
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

::: danger Gestion des Secrets
**NE JAMAIS** stocker de secrets directement dans docker-compose.yml ! Utilisez :

  - Fichiers `.env` (ne pas commiter dans Git)
  - Secrets Docker
  - Gestionnaires de secrets externes (Vault, SOPS)
    :::

## Configuration Caddy (OPNSense)

```
# Config Personnalisée : /usr/local/etc/caddy/caddy.d/ory-iam.conf

# UI Connexion/Inscription
auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_UI_PORT>
}

# API Publique Kratos
api.auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_API_PORT>
}

# Endpoints Hydra OAuth2
oauth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<HYDRA_PORT>
}

# API Admin (interne uniquement)
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

## Intégration avec Frontend p2d2

### Connexion Basée sur Session (Kratos)

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

// Middleware pour routes protégées
export async function onRequest({ request, redirect }, next) {
  const user = await checkSession(request);
  if (!user) {
    return redirect('/login');
  }
  return next();
}
```

### Flux OAuth2 (Hydra)

```
// Enregistrer Client OAuth2 (une seule fois, via API Admin)
const client = {
  client_id: "p2d2-frontend",
  client_secret: "<GENERATED_SECRET>",
  redirect_uris: ["https://www.domain.eu/auth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile email"
};

// Requête d'Autorisation (côté utilisateur)
const authUrl = `https://oauth.domain.eu/oauth2/auth` +
  `?client_id=${client_id}` +
  `&response_type=code` +
  `&scope=openid%20profile%20email` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&state=${generateState()}`;

// Échange de Jeton (backend)
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

## Configuration Base de Données (Conteneur PostgreSQL)

```
-- Base de données Ory-Kratos
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Base de données Ory-Hydra
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- Les migrations de schéma sont effectuées automatiquement par Kratos/Hydra
```

## Surveillance & Bilans de Santé

```
# Vérifier endpoints de santé
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# Afficher logs Docker
docker-compose -f /opt/ory/docker-compose.yml logs -f

# Statut conteneur
docker ps | grep ory
```

## Liste de Contrôle de Sécurité

Avant déploiement en production :

  - [ ] Remplacer `SECRETS_SYSTEM` dans Hydra par un secret fort (min. 32 caractères)
  - [ ] Déplacer mots de passe PostgreSQL vers fichier `.env` (pas dans docker-compose.yml)
  - [ ] Vérifier certificats Caddy TLS pour tous les domaines d'authentification
  - [ ] Rendre API Admin accessible uniquement via VPN/VLAN de Gestion
  - [ ] Activer Limitation de Débit pour endpoints de connexion (protection Brute-Force)
  - [ ] Configurer en-têtes CORS correctement (seulement propres domaines)
  - [ ] Configurer et tester serveur SMTP pour envoi d'emails
  - [ ] Mettre en place tâche de sauvegarde pour bases de données Ory

## Feuille de Route d'Implémentation

**Phase 1** (Semaine 1-2) : Configuration de Base

  - Créer conteneur LXC et installer Docker
  - Créer bases de données PostgreSQL
  - Configuration Docker Compose Kratos
  - Tester UI Connexion/Inscription

**Phase 2** (Semaine 3-4) : Intégration Hydra

  - Configurer conteneur Hydra
  - Enregistrer clients OAuth2 pour frontend p2d2
  - Tester flux de jetons

**Phase 3** (Semaine 5-6) : Intégration Frontend

  - Implémenter Middleware de Session AstroJS
  - Intégrer flux de connexion dans UI p2d2
  - Tests E2E (Inscription → Connexion → Requête Autorisée)

**Phase 4** (Semaine 7) : Durcissement Production

  - Intégration SMTP (Envoi d'email)
  - Configurer Limitation de Débit
  - Mettre en place Surveillance
  - Finaliser Documentation

## Références

  - [Documentation Ory Kratos](https://www.ory.sh/docs/kratos/)
  - [Documentation Ory Hydra](https://www.ory.sh/docs/hydra/)
  - [Bonnes Pratiques OAuth2 (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
  - [Fiche de Triche Authentification OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.