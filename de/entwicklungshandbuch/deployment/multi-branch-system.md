---
title: Multi-Branch Deployment System
description: Automatisches Branch-basiertes Deployment über Webhooks
quality:
  completeness: 85
  accuracy: 90
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Multi-Branch Deployment System

## Übersicht

Das p2d2-Projekt nutzt ein automatisches Deployment-System, das auf Git-Webhooks basiert. Jeder konfigurierte Branch wird automatisch auf eine eigene Subdomain deployed.

## Aktuelle Deployment-Konfiguration

### Produktive Branches

| Branch | Domain | Port | Repository | Status |
|--------|--------|------|------------|--------|
| `main` | `www.data-dna.eu` | 3000 | gitlab.opencode.de/OC000028072444/p2d2 | ✅ Aktiv |
| `develop` | `dev.data-dna.eu` | 3001 | gitlab.opencode.de/OC000028072444/p2d2 | ✅ Aktiv |

### Feature-Branches (Team-basiert)

| Branch-Pattern | Domain | Port | Repository | Team |
|----------------|--------|------|------------|------|
| `feature/team-de1/*` | `f-de1.data-dna.eu` | 3002 | github.com/Peter-Koenig/p2d2-hub | DE1 |
| `feature/team-de2/*` | `f-de2.data-dna.eu` | 3003 | github.com/Peter-Koenig/p2d2-hub | DE2 |
| `feature/team-fv/*` | `f-fv.data-dna.eu` | 3004 | github.com/Peter-Koenig/p2d2-hub | FV |

### Dokumentation

| Branch | Domain | Repository | Typ |
|--------|--------|------------|-----|
| `main` | `doc.data-dna.eu` | gitlab.opencode.de/OC000028072444/p2d2-docs | VitePress |

## Architektur

### Komponenten

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
                        │  Secret-Validate │              │
                        │  GitLab: Token   │              │
                        │  GitHub: HMAC    │              │
                        └──────────────────┘              │
                                                           ▼
                                                   ┌─────────────────┐
                                                   │   nginx Proxy   │
                                                   │   (SSL/Domain)  │
                                                   └─────────────────┘
```

## Webhook-Server

**Technologie:** Node.js/Express  
**Port:** 9321  
**Konfiguration:** `/var/www/astro/webhook-server/index.js`

### Branch-Konfiguration

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
  // ... weitere Branches
};
```

### Sicherheit

- **GitLab Webhooks:** Plaintext Token-Validierung (`X-GitLab-Token`)
- **GitHub Webhooks:** HMAC-SHA256 Signature-Validierung (`X-Hub-Signature-256`)
- Secrets werden über `.env` geladen

## Deploy-Script

**Pfad:** `/var/www/astro/scripts/deploy-branch.sh`

### Ablauf

1. **Clone:** Repository + Branch in timestamped Directory
2. **Kommunen-Collection:** Symlink zu `/var/www/astro/shared/src/content/kommunen`
3. **Environment:** `.env.production` mit PORT und HOST
4. **Build:** `npm ci --omit=dev && npm run build`
5. **Service-Update:** systemd Service stoppen/starten
6. **Symlink:** `/var/www/astro/deployments/<branch>/live` → neue Version
7. **Cleanup:** Behalte nur 5 letzte Deployments

### Beispiel-Aufruf

```bash
/var/www/astro/scripts/deploy-branch.sh \
  "main" \
  "/var/www/astro/deployments/main" \
  "3000" \
  "https://gitlab.opencode.de/OC000028072444/p2d2.git"
```

## systemd Services

Jeder Branch läuft als eigenständiger systemd-Service:

```bash
# Service-Namen
astro-main.service       # main Branch (Port 3000)
astro-develop.service    # develop Branch (Port 3001)
astro-feature-team-de1.service  # Feature-Branch (Port 3002)
```

### Service-Management

```bash
# Status prüfen
sudo systemctl status astro-main

# Logs anzeigen
sudo journalctl -u astro-main -f

# Neu starten
sudo systemctl restart astro-main
```

## nginx Reverse Proxy

**Konfiguration:** `/etc/nginx/sites-available/`

### Beispiel: main Branch

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

## Automatisierung

### Webhook einrichten

**GitLab:**
1. Repository → Settings → Webhooks
2. URL: `https://www.data-dna.eu:9321/webhook`
3. Secret Token: Aus `.env` (SECRET_MAIN, SECRET_DEVELOP)
4. Trigger: Push events
5. Branch: Entsprechenden Branch auswählen

**GitHub:**
1. Repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://www.data-dna.eu:9321/webhook`
3. Content type: `application/json`
4. Secret: Aus `.env` (SECRET_TEAM_HUB)
5. Events: Just the push event

### Manuelles Deployment

```bash
# Via Webhook-Server-Endpunkt
curl -X POST https://www.data-dna.eu:9321/webhook \
  -H "X-GitLab-Token: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'

# Oder direkt Deploy-Script
sudo -u astro /var/www/astro/scripts/deploy-branch.sh \
  main /var/www/astro/deployments/main 3000
```

## Debugging

### Health-Check

```bash
# Webhook-Server Status
curl http://localhost:9321/health
# → "Webhook-Server läuft"
```

### Logs

```bash
# Webhook-Server Logs
pm2 logs webhook-server

# Deployment Logs
ls -lh /var/www/astro/deployments/main/logs/

# systemd Service Logs
sudo journalctl -u astro-main -n 100 --no-pager
```

### Häufige Probleme

**Problem:** Service startet nicht nach Deployment

```bash
# Prüfe Build-Logs
cat /var/www/astro/deployments/main/logs/npm-build-*.log

# Prüfe systemd-Fehler
sudo systemctl status astro-main -l
```

**Problem:** Webhook wird nicht empfangen

```bash
# Prüfe Webhook-Server
pm2 status webhook-server

# Prüfe Firewall
sudo ufw status | grep 9321

# Teste Webhook manuell
curl -X POST http://localhost:9321/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'
```

## Geplante Verbesserungen

- [ ] Automatische Rollback-Funktion bei fehlgeschlagenem Build
- [ ] Health-Checks mit automatischem Restart
- [ ] Deployment-Notifications (Matrix/Email)
- [ ] Branch-Protection für automatische Deployments

## Siehe auch

- [Webhook Automation](./webhook-automation.md)
- [systemd Services](./systemd-services.md)
- [Git Workflow](../entwicklungsworkflow/git-workflow.md)
