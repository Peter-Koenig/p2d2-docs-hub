---
title: Frontend Container
description: AstroJS + VitePress Web-Frontend with Multi-Branch CI/CD
quality:
  completeness: 85
  accuracy: 80
  reviewed: false
  reviewer: (Translation: KI)
  reviewDate: null
---

# LXC: Frontend Container

## Container Information

```
Type: LXC (privileged/unprivileged depending on setup)
OS: Debian 13 (trixie)
Hostname: frontend (customizable)
Status: running

Resources:
  RAM: 4 GB
  Disk: 25 GB (dynamically expandable)
  CPU Shares: Standard (1024)
```

## Installed Software

### Node.js Runtime

```
Version: Node.js v20.x LTS
Package Manager: npm (Node Package Manager)
Node Version Manager: Optional (nvm)
```

### Web Server

```
AstroJS: Modern Web Framework
  - Version: 4.x (current Stable)
  - Build Tool: Vite
  - SSR: Server-Side Rendering
  - Static Generation: Hybrid Mode

VitePress: Documentation System
  - Version: 1.x (current Stable)
  - Based on: Vite + Vue 3
  - Markdown: Extended Features
```

### CI/CD Components

```
Webhook-Server: Git Automation
  - Port: 9321 (HTTP, internal LAN)
  - Integration: GitHub/GitLab Webhooks
  - Deployment: Multi-Branch System

Systemd Services: AstroJS Instances
  - astro-main.service (Production)
  - astro-develop.service (Development)
  - astro-feature-*.service (Feature Branches)
```

## Service Architecture

### Multi-Branch Deployment System

```
Parallel Instances:
  - main: Production Frontend (www.data-dna.eu)
  - develop: Development Frontend (dev.data-dna.eu)
  - feature-de1: Feature Branch 1 (f-de1.data-dna.eu)
  - feature-de2: Feature Branch 2 (f-de2.data-dna.eu)
  - feature-fv: Feature Branch 3 (f-fv.data-dna.eu)

Port-Mapping:
  - main: Port 3000
  - develop: Port 3001
  - feature-de1: Port 3002
  - feature-de2: Port 3003
  - feature-fv: Port 3004
```

### Systemd-Service Configuration

```
# Example: astro-main.service
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

## Network Access

```
Listening Ports:
  - 3000: Main Frontend (Production)
  - 3001: Develop Frontend
  - 3002-3004: Feature Branches
  - 9321: Webhook Server

Access via Reverse Proxy:
  - www.data-dna.eu → Port 3000
  - dev.data-dna.eu → Port 3001
  - f-de1.data-dna.eu → Port 3002
  - f-de2.data-dna.eu → Port 3003
  - f-fv.data-dna.eu → Port 3004
  - doc.data-dna.eu → VitePress Server

Firewall Rules:
  - Caddy (OPNSense) → Frontend: ALLOW
  - Webhook Server → GitHub/GitLab: OUTBOUND ALLOW
  - Frontend → GeoServer: ALLOW (WFS-T)
  - Frontend → MapProxy: ALLOW (Tiles)
  - External Access: DENY (only via Caddy)
```

## CI/CD Pipeline

### Webhook-Server Configuration

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

### Deployment-Script

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

## AstroJS-Configuration

### Main Configuration (astro.config.mjs)

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

## VitePress-Documentation

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

## Backup-Strategy

### PBS-Snapshot (Container-Level)

  - **Schedule**: Daily
  - **Retention**: 7 days
  - **Type**: LVM-Thin Snapshot

### Code-Backup (Git)

```
# Code is already backed up in Git repository
# Back up deployment scripts and configurations
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## Monitoring

### Health-Checks

```
# Check service status
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# Test port listening
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# Test external domains
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### Log-Analysis

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

### Service does not start

```
# Check systemd logs
journalctl -u astro-main --no-pager -n 100

# Port conflicts
netstat -tlnp | grep 3000

# Permission Issues
ls -la /var/www/astro/main/
```

### Deployment-Errors

```
# Webhook-Logs
journalctl -u webhook-server --no-pager -n 50

# Git-Repository Status
cd /var/www/astro/main && git status

# Build-Errors
cd /var/www/astro/main && npm run build --verbose
```

### Performance-Problems

```
# Memory Usage
ps aux | grep node
free -h

# Disk Space
df -h /var/www/astro/

# Network Connectivity
curl -I http://geoserver.lan:8080/geoserver/web
```

## Security-Configuration

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

### Network-Security

```
Firewall Rules:
  - Only Caddy proxy has access
  - Webhook Server only for authorized IPs
  - No direct WAN exposure

Environment Variables:
  - No secrets in code
  - .env files for Development
  - Production secrets via Systemd Environment
```

## Best Practices

✅ **Do**:

  - Regular Node.js updates (Security patches)
  - Monitoring of all service ports
  - Backup of configuration files
  - Separate user accounts for services
  - Log rotation for application logs

❌ **Don't**:

  - Expose frontend directly to the internet
  - Commit secrets to Git
  - Run without rate-limiting
  - Allow unlimited log files
  - Production builds on development server

## References

  - [AstroJS Documentation](https://docs.astro.build/)
  - [VitePress Documentation](https://vitepress.dev/)
  - [Systemd Service Configuration](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
  - [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)