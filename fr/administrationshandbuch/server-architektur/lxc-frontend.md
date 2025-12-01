---
title: Conteneur Frontend
description: Frontend web AstroJS + VitePress avec CI/CD multi-branches
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# LXC : Conteneur Frontend

## Informations sur le Conteneur

```
Type : LXC (privilégié/non privilégié selon la configuration)
OS : Debian 13 (trixie)
Hostname : frontend (personnalisable)
Statut : en cours d'exécution

Ressources :
  RAM : 4 Go
  Disque : 25 Go (extensible dynamiquement)
  Parts CPU : Standard (1024)
```

## Logiciels Installés

### Runtime Node.js

```
Version : Node.js v20.x LTS
Gestionnaire de paquets : npm (Node Package Manager)
Gestionnaire de version Node : Optionnel (nvm)
```

### Serveur Web

```
AstroJS : Framework Web moderne
  - Version : 4.x (Stable actuelle)
  - Outil de build : Vite
  - SSR : Rendu côté serveur
  - Génération statique : Mode hybride

VitePress : Système de documentation
  - Version : 1.x (Stable actuelle)
  - Basé sur : Vite + Vue 3
  - Markdown : Fonctionnalités étendues
```

### Composants CI/CD

```
Webhook-Server : Automatisation Git
  - Port : 9321 (HTTP, LAN interne)
  - Intégration : Webhooks GitHub/GitLab
  - Déploiement : Système multi-branches

Services Systemd : Instances AstroJS
  - astro-main.service (Production)
  - astro-develop.service (Développement)
  - astro-feature-*.service (Branches de fonctionnalités)
```

## Architecture des Services

### Système de Déploiement Multi-Branches

```
Instances parallèles :
  - main : Frontend de production (www.data-dna.eu)
  - develop : Frontend de développement (dev.data-dna.eu)
  - feature-de1 : Branche de fonctionnalité 1 (f-de1.data-dna.eu)
  - feature-de2 : Branche de fonctionnalité 2 (f-de2.data-dna.eu)
  - feature-fv : Branche de fonctionnalité 3 (f-fv.data-dna.eu)

Attribution des ports :
  - main : Port 3000
  - develop : Port 3001
  - feature-de1 : Port 3002
  - feature-de2 : Port 3003
  - feature-fv : Port 3004
```

### Configuration du Service Systemd

```
# Exemple : astro-main.service
[Unit]
Description=AstroJS Main Frontend
After=network.target

[Service]
Type=simple
User=astro
WorkingDirectory=/var/www/astro/main
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Accès Réseau

```
Ports d'écoute :
  - 3000 : Frontend principal (Production)
  - 3001 : Frontend de développement
  - 3002-3004 : Branches de fonctionnalités
  - 9321 : Serveur Webhook

Accès via Reverse Proxy :
  - www.data-dna.eu → Port 3000
  - dev.data-dna.eu → Port 3001
  - f-de1.data-dna.eu → Port 3002
  - f-de2.data-dna.eu → Port 3003
  - f-fv.data-dna.eu → Port 3004
  - doc.data-dna.eu → Serveur VitePress

Règles de pare-feu :
  - Caddy (OPNSense) → Frontend : AUTORISER
  - Serveur Webhook → GitHub/GitLab : SORTANT AUTORISER
  - Frontend → GeoServer : AUTORISER (WFS-T)
  - Frontend → MapProxy : AUTORISER (Tuiles)
  - Accès externe : REJETER (uniquement via Caddy)
```

## Pipeline CI/CD

### Configuration du Serveur Webhook

```
# /etc/webhook-server/config.json
{
  "port": 9321,
  "secret": "<WEBHOOK_SECRET>",
  "deployments": {
    "main": {
      "branch": "main",
      "path": "/var/www/astro/main",
      "port": 3000,
      "domain": "www.data-dna.eu"
    },
    "develop": {
      "branch": "develop",
      "path": "/var/www/astro/develop",
      "port": 3001,
      "domain": "dev.data-dna.eu"
    }
  }
}
```

### Script de Déploiement

```
#!/bin/bash
# /usr/local/bin/deploy-astro.sh

BRANCH=$1
DEPLOY_PATH="/var/www/astro/$BRANCH"
PORT=$2

echo "Deploying branch $BRANCH to $DEPLOY_PATH on port $PORT"

# Stop existing service
systemctl stop astro-$BRANCH.service

# Git Pull
cd $DEPLOY_PATH
git fetch origin
git reset --hard origin/$BRANCH

# Install Dependencies
npm ci --production

# Build Application
npm run build

# Start Service
systemctl start astro-$BRANCH.service

echo "Deployment completed for $BRANCH"
```

## Configuration AstroJS

### Configuration Principale (astro.config.mjs)

```
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  
  // Geo-Configuration
  vite: {
    define: {
      // Environment Variables
      __GEO_SERVER_URL__: JSON.stringify('https://ows.data-dna.eu'),
      __TILE_SERVER_URL__: JSON.stringify('https://tiles.data-dna.eu'),
      __WFS_T_URL__: JSON.stringify('https://wfs.data-dna.eu')
    }
  }
});
```

### Intégration Backend

```
// src/lib/geoserver.js
export async function wfsTransaction(feature) {
  const response = await fetch('https://wfs.data-dna.eu/geoserver/wfs', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: generateWFSInsert(feature)
  });
  
  return await response.text();
}

// src/lib/mapproxy.js
export function getTileUrl(layer, z, x, y) {
  return `https://tiles.data-dna.eu/tms/1.0.0/${layer}/${z}/${x}/${y}.png`;
}
```

## Documentation VitePress

### Configuration

```
# Configuration: docs/.vitepress/config.js
export default {
  title: 'p2d2 Dokumentation',
  description: 'Dokumentation für die p2d2 Geodateninfrastruktur',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Administrationshandbuch', link: '/de/administrationshandbuch/' }
    ],
    
    sidebar: {
      '/de/administrationshandbuch/': [
        {
          text: 'Server-Architektur',
          items: [
            { text: 'Übersicht', link: '/de/administrationshandbuch/server-architektur/' },
            { text: 'Proxmox Host', link: '/de/administrationshandbuch/server-architektur/proxmox-host' }
          ]
        }
      ]
    }
  }
}
```

## Stratégie de Sauvegarde

### Snapshot PBS (Niveau Conteneur)

  - **Planification**: Quotidienne
  - **Rétention**: 7 jours
  - **Type**: Snapshot LVM-Thin

### Sauvegarde du Code (Git)

```
# Le code est déjà sauvegardé dans le dépôt Git
# Sauvegarder les scripts de déploiement et les configurations
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## Monitoring

### Bilans de Santé

```
# Vérifier l'état du service
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# Tester l'écoute des ports
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# Tester les domaines externes
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### Analyse des Logs

```
# Logs AstroJS
journalctl -u astro-main -f --no-pager
journalctl -u astro-develop -f --no-pager

# Logs Serveur Webhook
journalctl -u webhook-server -f --no-pager

# Logs Application
tail -f /var/www/astro/main/logs/app.log
```

## Dépannage

### Le service ne démarre pas

```
# Vérifier les logs systemd
journalctl -u astro-main --no-pager -n 100

# Conflits de ports
netstat -tlnp | grep 3000

# Problèmes de permissions
ls -la /var/www/astro/main/
```

### Erreurs de Déploiement

```
# Logs Webhook
journalctl -u webhook-server --no-pager -n 50

# Statut du dépôt Git
cd /var/www/astro/main && git status

# Erreurs de build
cd /var/www/astro/main && npm run build --verbose
```

### Problèmes de Performance

```
# Utilisation mémoire
ps aux | grep node
free -h

# Espace disque
df -h /var/www/astro/

# Connectivité réseau
curl -I http://geoserver.lan:8080/geoserver/web
```

## Configuration de Sécurité

### Durcissement du Service

```
Isolation utilisateur :
  - Utilisateur dédié : astro
  - Groupe : astro
  - Répertoire personnel : /var/www/astro

Permissions des fichiers :
  - Fichiers de configuration : 640 (root:astro)
  - Fichiers de log : 644 (astro:astro)
  - Répertoire de build : 755 (astro:astro)
```

### Sécurité Réseau

```
Règles de pare-feu :
  - Seul le proxy Caddy a accès
  - Serveur Webhook uniquement pour les IP autorisées
  - Pas d'exposition directe au WAN

Variables d'environnement :
  - Pas de secrets dans le code
  - Fichiers .env pour le développement
  - Secrets de production via l'environnement Systemd
```

## Bonnes Pratiques

✅ **À faire**:

  - Mises à jour régulières de Node.js (correctifs de sécurité)
  - Surveillance de tous les ports de service
  - Sauvegarde des fichiers de configuration
  - Comptes utilisateur séparés pour les services
  - Rotation des logs pour les logs d'application

❌ **À ne pas faire**:

  - Exposer le frontend directement à Internet
  - Commiter des secrets dans Git
  - Exécuter sans limitation de débit
  - Autoriser des fichiers de log illimités
  - Builds de production sur serveur de développement

## Références

  - [Documentation AstroJS](https://docs.astro.build/)
  - [Documentation VitePress](https://vitepress.dev/)
  - [Configuration Service Systemd](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
  - [Bonnes Pratiques Node.js en Production](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.