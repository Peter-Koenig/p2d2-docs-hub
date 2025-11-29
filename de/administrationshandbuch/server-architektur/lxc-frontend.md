---
title: Frontend Container
description: AstroJS + VitePress Web-Frontend mit Multi-Branch CI/CD
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# LXC: Frontend Container

## Container-Informationen

```
Typ: LXC (privileged/unprivileged je nach Setup)
OS: Debian 13 (trixie)
Hostname: frontend (anpassbar)
Status: running

Ressourcen:
  RAM: 4 GB
  Disk: 25 GB (dynamisch erweiterbar)
  CPU Shares: Standard (1024)
```

## Installierte Software

### Node.js Runtime
```
Version: Node.js v20.x LTS
Package Manager: npm (Node Package Manager)
Node Version Manager: Optional (nvm)
```

### Web-Server
```
AstroJS: Modernes Web-Framework
  - Version: 4.x (aktuelle Stable)
  - Build Tool: Vite
  - SSR: Server-Side Rendering
  - Static Generation: Hybrid Mode

VitePress: Dokumentations-System
  - Version: 1.x (aktuelle Stable)
  - Based on: Vite + Vue 3
  - Markdown: Extended Features
```

### CI/CD Komponenten
```
Webhook-Server: Git Automation
  - Port: 9321 (HTTP, internes LAN)
  - Integration: GitHub/GitLab Webhooks
  - Deployment: Multi-Branch System

Systemd Services: AstroJS Instanzen
  - astro-main.service (Produktion)
  - astro-develop.service (Development)
  - astro-feature-*.service (Feature Branches)
```

## Service-Architektur

### Multi-Branch Deployment System

```
Parallele Instanzen:
  - main: Produktions-Frontend (www.data-dna.eu)
  - develop: Entwicklungs-Frontend (dev.data-dna.eu)
  - feature-de1: Feature Branch 1 (f-de1.data-dna.eu)
  - feature-de2: Feature Branch 2 (f-de2.data-dna.eu)
  - feature-fv: Feature Branch 3 (f-fv.data-dna.eu)

Port-Zuordnung:
  - main: Port 3000
  - develop: Port 3001
  - feature-de1: Port 3002
  - feature-de2: Port 3003
  - feature-fv: Port 3004
```

### Systemd-Service Konfiguration

```
# Beispiel: astro-main.service
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

## Netzwerk-Zugang

```
Listening Ports:
  - 3000: Main Frontend (Produktion)
  - 3001: Develop Frontend
  - 3002-3004: Feature Branches
  - 9321: Webhook Server

Zugriff via Reverse Proxy:
  - www.data-dna.eu → Port 3000
  - dev.data-dna.eu → Port 3001
  - f-de1.data-dna.eu → Port 3002
  - f-de2.data-dna.eu → Port 3003
  - f-fv.data-dna.eu → Port 3004
  - doc.data-dna.eu → VitePress Server

Firewall-Regeln:
  - Caddy (OPNSense) → Frontend: ALLOW
  - Webhook Server → GitHub/GitLab: OUTBOUND ALLOW
  - Frontend → GeoServer: ALLOW (WFS-T)
  - Frontend → MapProxy: ALLOW (Tiles)
  - Externer Zugriff: DENY (nur via Caddy)
```

## CI/CD Pipeline

### Webhook-Server Konfiguration

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

### Deployment-Skript

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

## AstroJS-Konfiguration

### Hauptkonfiguration (astro.config.mjs)

```
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  
  // Geo-Konfiguration
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

### Backend-Integration

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

## VitePress-Dokumentation

### Konfiguration

```
# Konfiguration: docs/.vitepress/config.js
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

## Backup-Strategie

### PBS-Snapshot (Container-Level)
- **Zeitplan**: Täglich
- **Retention**: 7 Tage
- **Typ**: LVM-Thin Snapshot

### Code-Backup (Git)
```
# Code ist bereits in Git-Repository gesichert
# Deployment-Skripts und Konfigurationen sichern
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## Monitoring

### Health-Checks
```
# Service-Status prüfen
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# Port-Listening testen
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# Externe Domains testen
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### Log-Analyse
```
# AstroJS Logs
journalctl -u astro-main -f --no-pager
journalctl -u astro-develop -f --no-pager

# Webhook Server Logs
journalctl -u webhook-server -f --no-pager

# Application Logs
tail -f /var/www/astro/main/logs/app.log
```

## Troubleshooting

### Service startet nicht
```
# Systemd-Logs prüfen
journalctl -u astro-main --no-pager -n 100

# Port-Konflikte
netstat -tlnp | grep 3000

# Permission Issues
ls -la /var/www/astro/main/
```

### Deployment-Fehler
```
# Webhook-Logs
journalctl -u webhook-server --no-pager -n 50

# Git-Repository Status
cd /var/www/astro/main && git status

# Build-Fehler
cd /var/www/astro/main && npm run build --verbose
```

### Performance-Probleme
```
# Memory Usage
ps aux | grep node
free -h

# Disk Space
df -h /var/www/astro/

# Network Connectivity
curl -I http://geoserver.lan:8080/geoserver/web
```

## Sicherheits-Konfiguration

### Service-Hardening
```
User Isolation:
  - Dedicated User: astro
  - Group: astro
  - Home Directory: /var/www/astro

File Permissions:
  - Config Files: 640 (root:astro)
  - Log Files: 644 (astro:astro)
  - Build Directory: 755 (astro:astro)
```

### Netzwerk-Sicherheit
```
Firewall-Regeln:
  - Nur Caddy-Proxy hat Zugriff
  - Webhook Server nur für autorisierte IPs
  - Keine direkte WAN-Exposition

Environment Variables:
  - Keine Secrets in Code
  - .env Files für Development
  - Production Secrets via Systemd Environment
```

## Best Practices

✅ **Do**:
- Regelmäßige Node.js Updates (Security-Patches)
- Monitoring aller Service-Ports
- Backup der Konfigurationsdateien
- Separate User-Accounts für Services
- Log-Rotation für Application Logs

❌ **Don't**:
- Frontend direkt im Internet exponieren
- Secrets in Git committen
- Ohne Rate-Limiting laufen lassen
- Unbegrenzte Log-Files erlauben
- Production-Builds auf Development-Server

## Referenzen

- [AstroJS Dokumentation](https://docs.astro.build/)
- [VitePress Dokumentation](https://vitepress.dev/)
- [Systemd Service Configuration](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)