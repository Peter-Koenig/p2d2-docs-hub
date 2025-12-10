---
quality:
  completeness: 50
  accuracy: 30
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# p2d2: Multi-Branch Deployment – Technical Documentation

> [English version below](#english-version) | [Deutsche Version](#german-version)

<a name="german-version"></a>

## German Version

## Production Model: Multi-Branch with Automatic Webhooks

**Valid from November 2025**

### 1. Architecture Overview

#### 1.1 Multi-Branch System

The p2d2 project uses a multi-branch deployment system with 5 simultaneously active environments:

| Branch                     | Domain                 | Port | Service                    | Memory   | Purpose             |
|----------------------------|------------------------|------|----------------------------|----------|---------------------|
| `main`                     | www.data-dna.eu        | 3000 | `astro-main`               | 10.2M    | Production          |
| `develop`                  | dev.data-dna.eu        | 3001 | `astro-develop`            | 9.3M     | Test/Integration    |
| `feature/team-de1/setup`   | f-de1.data-dna.eu      | 3002 | `astro-feature-team-de1`   | 22.0M    | Team DE1            |
| `feature/team-de2/setup`   | f-de2.data-dna.eu      | 3003 | `astro-feature-team-de2`   | 24.8M    | Team DE2            |
| `feature/team-fv/setup`    | f-fv.data-dna.eu       | 3004 | `astro-feature-team-fv`    | 24.6M    | Team FV             |

**RAM:** ~91MB of 64GB available

#### 1.2 Infrastructure Stack

```
Repository Push
↓
Webhook Server (Port 9321)
↓
deploy-branch.sh
↓
Git Clone → Branch → Kommunen-Collection Symlink → npm ci → build
↓
Service Stop/Start → Cleanup (old deployments)
↓
Services: astro-*
├─ astro-main (Port 3000)
├─ astro-develop (Port 3001)
├─ astro-feature-team-de1 (Port 3002)
├─ astro-feature-team-de2 (Port 3003)
└─ astro-feature-team-fv (Port 3004)
↓
Reverse Proxy (OPNSense)
├─ www.data-dna.eu → localhost:3000
├─ dev.data-dna.eu → localhost:3001
├─ f-de1.data-dna.eu → localhost:3002
├─ f-de2.data-dna.eu → localhost:3003
└─ f-fv.data-dna.eu → localhost:3004
↓
Let's Encrypt (via Caddy)
```

### 2. Components

#### 2.1 Webhook Server

**`/home/astro/webhook-server/index.js`**

  - Port: `9321`
  - Function: Receives GitLab push events and triggers deployments
  - Configuration: Branch → Deploy-Path + Port Mapping
  - Logs: `journalctl -u webhook-server -f`

```javascript
branchConfig: {
  main: { deployPath: "/var/www/astro/deployments/main", port: 3000 },
  develop: { deployPath: "/var/www/astro/deployments/develop", port: 3001 },
  // ... etc
}
```

#### 2.2 Deploy Script

**`/var/www/astro/scripts/deploy-branch.sh`**

1.  Create directory
2.  Git Clone (Branch)
3.  Link Kommunen Collection as Symlink (`/var/www/astro/shared/src/content/kommunen`)
4.  Link `.env.production` + Override `PORT`
5.  `npm ci --omit=dev` + `npm run build`
6.  Service Stop/Restart
7.  Switch Live Symlink
8.  Clean up old deployments (keep only 5 newest)

```
sudo -u astro /var/www/astro/scripts/deploy-branch.sh main /var/www/astro/deployments/main 3000
sudo -u astro /var/www/astro/scripts/deploy-branch.sh develop /var/www/astro/deployments/develop 3001
sudo -u astro /var/www/astro/scripts/deploy-branch.sh feature/team-de1/setup /var/www/astro/deployments/feature-de1 3002
```

#### 2.3 Systemd Services

**`/etc/systemd/system/astro-*.service`**

```ini
# astro-main.service
[Unit]
Description=Astro p2d2 - main branch
After=network.target

[Service]
Type=simple
User=astro
WorkingDirectory=/var/www/astro/deployments/main/live
Environment="PORT=3000"
ExecStart=/usr/bin/node /var/www/astro/deployments/main/live/dist/server/entry.mjs
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 2.4 Caddy Reverse Proxy (OPNSense)

In OPNSense: **Services → Caddy → Reverse Proxy**

| Domain | Handler | Upstream |
| :-- | :-- | :-- |
| [https://www.data-dna.eu](https://www.data-dna.eu) | Reverse Proxy | [http://192.168.xxx.yyy:3000](http://192.168.xxx.yyy:3000) |
| [https://dev.data-dna.eu](https://dev.data-dna.eu) | Reverse Proxy | [http://192.168.xxx.yyy:3001](http://192.168.xxx.yyy:3001) |
| [https://f-de1.data-dna.eu](https://f-de1.data-dna.eu) | Reverse Proxy | [http://192.168.xxx.yyy:3002](http://192.168.xxx.yyy:3002) |
| [https://f-de2.data-dna.eu](https://f-de2.data-dna.eu) | Reverse Proxy | [http://192.168.xxx.yyy:3003](http://192.168.xxx.yyy:3003) |
| [https://f-fv.data-dna.eu](https://f-fv.data-dna.eu) | Reverse Proxy | [http://192.168.xxx.yyy:3004](http://192.168.xxx.yyy:3004) |
| [https://opn.data-dna.eu](https://opn.data-dna.eu) | redir | [https://www.data-dna.eu](https://www.data-dna.eu){uri} (301) |

### 3. External Resources

#### 3.1 Kommunen Collection

**Source:** `/var/www/astro/shared/src/content/kommunen`
Every deployment links here:

```
# Symlink
/var/www/astro/deployments/main/live/src/content/kommunen → /var/www/astro/shared/src/content/kommunen
/var/www/astro/deployments/develop/live/src/content/kommunen → /var/www/astro/shared/src/content/kommunen
# ... etc
```

Content updates possible without deployment!

### 4. Deployment Directory Structure

```
/var/www/astro
├── deployments
│   ├── main
│   │   ├── deploys
│   │   │   ├── 20251104003111   ← Latest (Clone + Build)
│   │   │   ├── 20251104002000
│   │   │   └── ...
│   │   └── live → deploys/20251104003111   ← Active
│   ├── develop
│   │   ├── deploys
│   │   └── live → ...
│   ├── feature-de1
│   ├── feature-de2
│   └── feature-fv
├── logs
│   └── Build Logs
└── shared
    └── src
        └── content
            └── kommunen   ← External Collection
```

### 5. Workflow: Push → Deployment

1.  **Developer pushes to GitLab Branch**:

```bash
git push origin develop
```

2.  **GitLab triggers Webhook**:

```
POST http://192.168.xxx.yyy:9321/webhook
Header: x-gitlab-token: SECRET
Payload: { ref: "refs/heads/develop", ... }
```

3.  **Webhook Server**:
      - Extracts Branch Name (`develop`)
      - Looks up `branchConfig` (finds `astro-develop` service)
      - Triggers: `deploy-branch.sh develop /var/www/astro/deployments/develop 3001`
4.  **Deploy Script**:
      - Creates directory: `20251104HHMMSS`
      - Clones `develop` branch
      - Links Kommunen Collection
      - Builds Astro App
      - Stops `astro-develop` service
      - Switches Symlink
      - Starts `astro-develop` service
5.  **Service starts new build**:
      - Node.js loads new version
      - App runs on Port 3001
6.  **Caddy routes traffic**:
      - `dev.data-dna.eu` → `localhost:3001`
      - New version live!

### 6. Security & Access Control

#### 6.1 Webhook Token

Token in `.env.production`:

```bash
# /home/astro/.env.production
grep SECRET_TOKEN
```

  - Must be identical between GitLab and server
  - Should be rotated regularly

#### 6.2 Sudo Permissions

Configuration: `/etc/sudoers.d/astro-systemctl`

```
# ALLOW: systemctl start/stop/restart astro-*
ALL=(ALL) NOPASSWD: /usr/bin/systemctl start astro-*
ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop astro-*
ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart astro-*
```

#### 6.3 SSL/TLS

  - Automatic via Let's Encrypt through Caddy
  - Wildcard certificate for `*.data-dna.eu` is automatically renewed

### 7. Monitoring & Troubleshooting

#### 7.1 Service Status

```bash
# All services
systemctl status astro-*

# Individual
systemctl status astro-main
systemctl status astro-develop
```

#### 7.2 Logs

```bash
# Service logs
journalctl -u astro-main -f  # main branch
journalctl -u astro-develop -f  # develop branch
journalctl -u webhook-server -f  # Webhook

# Build logs
/var/www/astro/deployments/develop/logs/npm-build-*.log
/var/www/astro/deployments/develop/logs/clone-*.log
```

#### 7.3 Check Build Status

```bash
# Last build
ls -lt /var/www/astro/deployments/develop/deploys | head -1

# Check symlink
ls -la /var/www/astro/deployments/develop/live

# App responding?
curl -I http://localhost:3001
```

#### 7.4 Common Problems

**Service goes down after deployment:**

```bash
# Check logs
journalctl -u astro-main -n 50

# Working directory exists?
ls -la /var/www/astro/deployments/main/live/dist/server

# Port can be bound?
lsof -i :3000
```

**Webhook not triggering:**

```bash
# Webhook server running?
systemctl status webhook-server

# Port responding?
curl http://localhost:9321

# Token correct?
/home/astro/.env.production | grep SECRET_TOKEN
```

### 8. Storage Management

  - VM Disk: 25GB
  - Per Deployment: ~500MB
  - Retention: 5 newest per branch
  - Calculated: 5 branches × 5 deployments × 500MB = 12.5GB → OK with reserve

**Manual Cleanup:**

```bash
# Old deployments for develop
cd /var/www/astro/deployments/develop/deploys
ls -dt */ | tail -n +4 | xargs rm -rf

# For all branches
for branch in main develop feature-de1 feature-de2 feature-fv; do
  cd /var/www/astro/deployments/$branch/deploys
  ls -dt */ | tail -n +4 | xargs rm -rf 2>/dev/null
done

# Check disk space
df -h
```

### 9. Maintenance & Updates

#### 9.1 Regular Tasks

  - Archive logs (weekly)
  - Clean up old deployments
  - Rotate webhook token (quarterly)
  - Check certificates

#### 9.2 In Case of Problems

1.  Check logs
2.  Restart service
3.  Test manual deployment
4.  Check system resources (RAM, disk)

### 10. References

  - AstroJS: [https://docs.astro.build/en/guides/deploy](https://docs.astro.build/en/guides/deploy)
  - Caddy: [https://caddyserver.com/docs/quick-start](https://caddyserver.com/docs/quick-start)
  - GitLab Webhooks: [https://docs.gitlab.com/user/project/integrations/webhooks](https://docs.gitlab.com/user/project/integrations/webhooks)
  - systemd: [https://www.freedesktop.org/software/systemd/man/systemd.service.html](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

<a name="english-version"></a>

## English Version

## Production Model: Multi-Branch with Automatic Webhooks

**Valid as of November 2025**

### 1. Architecture Overview

#### 1.1 Multi-Branch System

The p2d2 project uses a multi-branch deployment system with 5 simultaneously active environments:

| Branch | Domain | Port | Service | Memory | Purpose |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `main` | www.data-dna.eu | 3000 | `astro-main` | 10.2M | Production |
| `develop` | dev.data-dna.eu | 3001 | `astro-develop` | 9.3M | Test/Integration |
| `feature/team-de1/setup` | f-de1.data-dna.eu | 3002 | `astro-feature-team-de1` | 22.0M | Team DE1 |
| `feature/team-de2/setup` | f-de2.data-dna.eu | 3003 | `astro-feature-team-de2` | 24.8M | Team DE2 |
| `feature/team-fv/setup` | f-fv.data-dna.eu | 3004 | `astro-feature-team-fv` | 24.6M | Team FV |

**RAM:** ~91MB of 64GB available

#### 1.2 Infrastructure Stack

```
Repository Push
    ↓
Webhook Server (Port 9321)
    ↓
deploy-branch.sh
    ↓
Git Clone → Branch → Kommunen Collection Symlink → npm ci → build
    ↓
Service Stop/Start → Cleanup (old deployments)
    ↓
Services: astro-*
├─ astro-main (Port 3000)
├─ astro-develop (Port 3001)
├─ astro-feature-team-de1 (Port 3002)
├─ astro-feature-team-de2 (Port 3003)
└─ astro-feature-team-fv (Port 3004)
    ↓
Reverse Proxy (OPNSense)
├─ www.data-dna.eu → localhost:3000
├─ dev.data-dna.eu → localhost:3001
├─ f-de1.data-dna.eu → localhost:3002
├─ f-de2.data-dna.eu → localhost:3003
└─ f-fv.data-dna.eu → localhost:3004
    ↓
Let's Encrypt (via Caddy)
```

### 2. Components

#### 2.1 Webhook Server

**`/home/astro/webhook-server/index.js`**

  - Port: `9321`
  - Function: Receives GitLab push events and triggers deployments
  - Configuration: Branch → Deploy-Path + Port Mapping
  - Logs: `journalctl -u webhook-server -f`

```
branchConfig: {
  main: { deployPath: "/var/www/astro/deployments/main", port: 3000 },
  develop: { deployPath: "/var/www/astro/deployments/develop", port: 3001 },
  // ... etc
}
```

#### 2.2 Deploy Script

**`/var/www/astro/scripts/deploy-branch.sh`**

1.  Create directory
2.  Git Clone (Branch)
3.  Link Kommunen Collection as symlink (`/var/www/astro/shared/src/content/kommunen`)
4.  Link `.env.production` + override `PORT`
5.  `npm ci --omit=dev` + `npm run build`
6.  Service Stop/Restart
7.  Switch live symlink
8.  Clean up old deployments (keep only 5 newest)

```bash
sudo -u astro /var/www/astro/scripts/deploy-branch.sh main /var/www/astro/deployments/main 3000
sudo -u astro /var/www/astro/scripts/deploy-branch.sh develop /var/www/astro/deployments/develop 3001
sudo -u astro /var/www/astro/scripts/deploy-branch.sh feature/team-de1/setup /var/www/astro/deployments/feature-de1 3002
```

#### 2.3 Systemd Services

**`/etc/systemd/system/astro-*.service`**

```
# astro-main.service
[Unit]
Description=Astro p2d2 - main branch
After=network.target

[Service]
Type=simple
User=astro
WorkingDirectory=/var/www/astro/deployments/main/live
Environment="PORT=3000"
ExecStart=/usr/bin/node /var/www/astro/deployments/main/live/dist/server/entry.mjs
Restart=on-failure
RestartSec=10

[Install]
Wanted