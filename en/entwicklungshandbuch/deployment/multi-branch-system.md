---
title: Multi-Branch Deployment System
description: Automatic branch-based deployment via webhooks
quality:
  completeness: 85
  accuracy: 90
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Multi-Branch Deployment System

## Overview

The p2d2 project uses an automatic deployment system based on Git webhooks. Each configured branch is automatically deployed to its own subdomain.

## Current Deployment Configuration

### Production Branches

| Branch | Domain | Port | Repository | Status |
|--------|--------|------|------------|--------|
| `main` | `www.data-dna.eu` | 3000 | gitlab.opencode.de/OC000028072444/p2d2 | ✅ Active |
| `develop` | `dev.data-dna.eu` | 3001 | gitlab.opencode.de/OC000028072444/p2d2 | ✅ Active |

### Feature Branches (Team-based)

| Branch Pattern | Domain | Port | Repository | Team |
|----------------|--------|------|------------|------|
| `feature/team-de1/*` | `f-de1.data-dna.eu` | 3002 | github.com/Peter-Koenig/p2d2-hub | DE1 |
| `feature/team-de2/*` | `f-de2.data-dna.eu` | 3003 | github.com/Peter-Koenig/p2d2-hub | DE2 |
| `feature/team-fv/*` | `f-fv.data-dna.eu` | 3004 | github.com/Peter-Koenig/p2d2-hub | FV |

### Documentation

| Branch | Domain | Repository | Type |
|--------|--------|------------|------|
| `main` | `doc.data-dna.eu` | gitlab.opencode.de/OC000028072444/p2d2-docs | VitePress |

## Architecture

### Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Git Push      │────▶│  Webhook Server  │────▶│  Deploy Script  │
│   (GitLab/Hub)  │     │  (Node.js/9321)  │     │  (Bash)         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                │                          ▼
                                │                  ┌─────────────────┐
                                │                  │  systemd Service│
                                │                  │  (Astro SSR)    │
                                │                  └─────────────────┘
                                ▼                          │
                        ┌──────────────────┐              │
                        │  Secret Validate │              │
                        │  GitLab: Token   │              │
                        │  GitHub: HMAC    │              │
                        └──────────────────┘              │
                                                           ▼
                                                   ┌─────────────────┐
                                                   │   nginx Proxy   │
                                                   │   (SSL/Domain)  │
                                                   └─────────────────┘
```

## Webhook Server

**Technology:** Node.js/Express  
**Port:** 9321  
**Configuration:** `/var/www/astro/webhook-server/index.js`

### Branch Configuration

```javascript
const branchConfig = {
  'main': {
    domain: 'www.data-dna.eu',
    deployPath: '/var/www/astro/deployments/main',
    port: 3000,
    repo: 'https://gitlab.opencode.de/OC000028072444/p2d2.git',
    secret: process.env.SECRET_MAIN,
    provider: 'gitlab'
  },
  // ... more branches
};
```

### Security

- **GitLab Webhooks:** Plaintext token validation (`X-GitLab-Token`)
- **GitHub Webhooks:** HMAC-SHA256 signature validation (`X-Hub-Signature-256`)
- Secrets loaded via `.env`

## Deploy Script

**Path:** `/var/www/astro/scripts/deploy-branch.sh`

### Process

1. **Clone:** Repository + branch into timestamped directory
2. **Kommunen Collection:** Symlink to `/var/www/astro/shared/src/content/kommunen`
3. **Environment:** `.env.production` with PORT and HOST
4. **Build:** `npm ci --omit=dev && npm run build`
5. **Service Update:** Stop/start systemd service
6. **Symlink:** `/var/www/astro/deployments/<branch>/live` → new version
7. **Cleanup:** Keep only 5 latest deployments

### Example Invocation

```bash
/var/www/astro/scripts/deploy-branch.sh \
  "main" \
  "/var/www/astro/deployments/main" \
  "3000" \
  "https://gitlab.opencode.de/OC000028072444/p2d2.git"
```

## systemd Services

Each branch runs as a separate systemd service:

```bash
# Service names
astro-main.service       # main branch (port 3000)
astro-develop.service    # develop branch (port 3001)
astro-feature-team-de1.service  # feature branch (port 3002)
```

### Service Management

```bash
# Check status
sudo systemctl status astro-main

# View logs
sudo journalctl -u astro-main -f

# Restart
sudo systemctl restart astro-main
```

## nginx Reverse Proxy

**Configuration:** `/etc/nginx/sites-available/`

### Example: main Branch

```nginx
server {
    listen 443 ssl http2;
    server_name www.data-dna.eu;

    ssl_certificate /etc/letsencrypt/live/data-dna.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/data-dna.eu/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Automation

### Setting Up Webhooks

**GitLab:**
1. Repository → Settings → Webhooks
2. URL: `https://www.data-dna.eu:9321/webhook`
3. Secret Token: From `.env` (SECRET_MAIN, SECRET_DEVELOP)
4. Trigger: Push events
5. Branch: Select corresponding branch

**GitHub:**
1. Repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://www.data-dna.eu:9321/webhook`
3. Content type: `application/json`
4. Secret: From `.env` (SECRET_TEAM_HUB)
5. Events: Just the push event

### Manual Deployment

```bash
# Via webhook server endpoint
curl -X POST https://www.data-dna.eu:9321/webhook \
  -H "X-GitLab-Token: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'

# Or directly via deploy script
sudo -u astro /var/www/astro/scripts/deploy-branch.sh \
  main /var/www/astro/deployments/main 3000
```

## Debugging

### Health Check

```bash
# Webhook server status
curl http://localhost:9321/health
# → "Webhook-Server läuft"
```

### Logs

```bash
# Webhook server logs
pm2 logs webhook-server

# Deployment logs
ls -lh /var/www/astro/deployments/main/logs/

# systemd service logs
sudo journalctl -u astro-main -n 100 --no-pager
```

### Common Issues

**Problem:** Service doesn't start after deployment

```bash
# Check build logs
cat /var/www/astro/deployments/main/logs/npm-build-*.log

# Check systemd errors
sudo systemctl status astro-main -l
```

**Problem:** Webhook not received

```bash
# Check webhook server
pm2 status webhook-server

# Check firewall
sudo ufw status | grep 9321

# Test webhook manually
curl -X POST http://localhost:9321/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'
```

## Planned Improvements

- [ ] Automatic rollback on failed builds
- [ ] Health checks with automatic restart
- [ ] Deployment notifications (Matrix/Email)
- [ ] Branch protection for automatic deployments

## See Also

- [Webhook Automation](./webhook-automation.md)
- [systemd Services](./systemd-services.md)
- [Git Workflow](../entwicklungsworkflow/git-workflow.md)
