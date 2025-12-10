---
title: Multi-Repo Deployment
description: Deployment strategy for distributed team development with GitLab, GitHub, and Webhook Server
status: migrated
lastUpdated: 2025-11-17
lang: en
quality:
  completeness: 50
  accuracy: 30
  reviewed: false
  reviewer: 'KI (Gemini)'
  reviewDate: null
---

# p2d2 Multi-Repo Deployment – Complete Documentation

**Valid as of:** November 2025

---

## 1. System Architecture

### 1.1 Overview

```
┌────────── Push ──────────┐    ┌────── Push ───────┐
│  GitLab (opencode.de)    │    │ GitHub (3x Team)  │
│  ├─ main                 │    │ ├─ team-de1       │
│  └─ develop              │    │ ├─ team-de2       │
└────────────┬─────────────┘    │ └─ team-fv        │
             │                  └───────────────────┘
             │                     │
             │       Webhook       │
             ↓                     ↓
┌────────────────────────────────┐
│  Frontend VM (Port 9321)       │
│  Webhook Server                │
│  ├─ Secret Validation          │
│  ├─ Repo Router                │
│  ├─ git clone → staging-Server │
│  └─ Deploy Trigger             │
└───────────────┬────────────────┘
                │
                ↓
┌──────── staging server ──────────┐
│  systemd Services                │
│  ├─ astro-main (Port 3000)       │
│  ├─ astro-develop (Port 3001)    │
│  ├─ astro-feature-team-de1 (3002)│
│  ├─ astro-feature-team-de2 (3003)│
│  └─ astro-feature-team-fv (3004) │
└───────────────┬──────────────────┘
                │
                ↓
┌────────── Presentation ──────────┐
│  Caddy Reverse Proxy (OPNSense)  │
│  ├─ www.data-dna.eu → :3000      │
│  ├─ dev.data-dna.eu → :3001      │
│  ├─ f-de1.data-dna.eu → :3002    │
│  ├─ f-de2.data-dna.eu → :3003    │
│  └─ f-fv.data-dna.eu → :3004     │
└──────────────────────────────────┘
```

### 1.2 Deployment Flows

#### Flow 1: Main/Develop (Your Repo, GitLab)

```
You: git push origin develop
↓
GitLab Webhook → POST http://www.data-dna.eu:9321/webhook
↓
Webhook Server:
├─ Reads x-gitlab-token Header
├─ Validates against SECRET_DEVELOP
├─ Finds: [verdächtiger Link entfernt]
├─ Branch: develop
└─ Calls: deploy-branch.sh develop ... https://gitlab...
↓
Deploy Script:
├─ git clone --branch develop
├─ npm ci + npm run build
├─ sudo systemctl restart astro-develop
└─ Live at dev.data-dna.eu
```

#### Flow 2: Feature Branches (Team Repos, GitHub)

```
Team: git push origin feature/team-de1/my-function
↓
GitHub Webhook → POST http://www.data-dna.eu:9321/webhook
↓
Webhook Server:
├─ Reads x-hub-signature-256 Header
├─ Calculates HMAC-SHA256 with SECRET_TEAM_DE1
├─ Validates Signature
├─ Branch Pattern Match: /^feature/team-de1/.+/ ✓
├─ Finds: https://github.com/team-de1/p2d2-feature.git
└─ Calls: deploy-branch.sh feature/team-de1/my-function ... https://github.com/team-de1/...
↓
Deploy Script:
├─ git clone --branch feature/team-de1/my-function
├─ npm ci + npm run build
├─ sudo systemctl restart astro-feature-team-de1
└─ Live at f-de1.data-dna.eu
```

---

## 2. Webhook Server Configuration

### 2.1 Secrets Management

```
# /home/astro/webhook-server/.env

# GitLab Secrets (your repo)

SECRET_MAIN=your_secret_main_here
SECRET_DEVELOP=your_secret_develop_here

# GitHub Shared Secrets (Team Repos)

SECRET_TEAM_DE1=team_de1_secret_here
SECRET_TEAM_DE2=team_de2_secret_here
SECRET_TEAM_FV=team_fv_secret_here
```

### 2.2 Branch Configuration

```
// /home/astro/webhook-server/index.js (Excerpt)

const branchConfig = {
'main': {
domain: 'www.data-dna.eu',
deployPath: '/var/www/astro/deployments/main',
port: 3000,
repo: 'https://gitlab.opencode.de/OC000028072444/p2d2.git',
secret: process.env.SECRET_MAIN,
provider: 'gitlab'
},

'develop': {
domain: 'dev.data-dna.eu',
deployPath: '/var/www/astro/deployments/develop',
port: 3001,
repo: 'https://gitlab.opencode.de/OC000028072444/p2d2.git',
secret: process.env.SECRET_DEVELOP,
provider: 'gitlab'
},

'feature/team-de1': {
domain: 'f-de1.data-dna.eu',
deployPath: '/var/www/astro/deployments/feature-de1',
port: 3002,
repo: 'https://github.com/team-de1/p2d2-feature.git',
secret: process.env.SECRET_TEAM_DE1,
provider: 'github',
matchPattern: /^feature/team-de1/.+/
},

'feature/team-de2': {
domain: 'f-de2.data-dna.eu',
deployPath: '/var/www/astro/deployments/feature-de2',
port: 3003,
repo: 'https://github.com/team-de2/p2d2-feature.git',
secret: process.env.SECRET_TEAM_DE2,
provider: 'github',
matchPattern: /^feature/team-de2/.+/
},

'feature/team-fv': {
domain: 'f-fv.data-dna.eu',
deployPath: '/var/www/astro/deployments/feature-fv',
port: 3004,
repo: 'https://github.com/team-fv/p2d2-feature.git',
secret: process.env.SECRET_TEAM_FV,
provider: 'github',
matchPattern: /^feature/team-fv/.+/
}
};
```

---

## 3. Team Onboarding

### 3.1 Step 1: Create Team Repo

**Team does this:**

```
# Option A: New Repo

# GitHub.com → New Repository → p2d2-feature

# Clone & create feature branch

git clone https://github.com/team-de1/p2d2-feature.git
cd p2d2-feature
git checkout -b feature/team-de1/setup

# Option B: Fork Main Repo

# GitHub.com → fork Peter-Koenig/p2d2-hub

# Clone & create feature branch

git clone https://github.com/team-de1/p2d2-feature.git
cd p2d2-feature
git checkout -b feature/team-de1/my-function
```

### 3.2 Step 2: Generate & Distribute Secret

**You do this:**

```
# Generate Secret

openssl rand -hex 32

# Output: a1b2c3d4e5f6g7h8...

# Share with team (encrypted!)

# Signal, PGP, or secure channel

# Add to .env

echo "SECRET_TEAM_DE1=a1b2c3d4e5f6g7h8..." >> /home/astro/webhook-server/.env

# Restart Webhook Server

sudo systemctl restart webhook-server
```

### 3.3 Step 3: Configure GitHub Webhook

**Team does this:**

1.  GitHub → Repository → Settings → Webhooks → Add webhook
2.  **Payload URL:** `http://<your-ip>:9321/webhook`
3.  **Content type:** `application/json`
4.  **Secret:** The secret from you
5.  **Which events:** `Just the push event`
6.  **Active:** ✅
7.  **Add webhook**

**Test:**
* Recent Deliveries → Click on entry → "Redeliver"
* Or: Team makes test push to `feature/team-de1/test`

---

## 4. Development Workflow

### 4.1 Develop Feature (Team)

```
# Team develops locally

git checkout feature/team-de1/new-function

# ... change code ...

git add .
git commit -m "Feature: New function"
git push origin feature/team-de1/new-function
```

**What happens automatically:**

```
Push → GitHub Webhook
→ Server validates Secret
→ Deploy-Script triggers
→ f-de1.data-dna.eu updated
→ LIVE in ~2 minutes
```

### 4.2 Test Feature

Team can view their changes live:

```
# Team tests at

https://f-de1.data-dna.eu/

# For changes: Simply new push

git add .
git commit -m "Bugfix: xyz"
git push origin feature/team-de1/new-function

# → Automatically deployed
```

---

## 5. Integration into Main/Develop

### 5.1 Feature Ready → Pull Request

**Team creates Pull Request** (in their repo or to yours):

```
# GitHub: team-de1/p2d2-feature

# PR: feature/team-de1/new-function → develop

# Or: To your Main Repo

# PR: OC000028072444/p2d2

# feature/team-de1/new-function → develop
```

### 5.2 You Review & Merge

```
# You on your repo

git checkout develop
git pull origin develop

# Merge feature branch

git merge feature/team-de1/new-function
git push origin develop
```

**What happens:**

```
Git Push to develop
↓
GitLab Webhook
↓
Server deploys to dev.data-dna.eu
↓
Team + you can test on staging
```

### 5.3 Release → Main

```
# After Test/Approval

git checkout main
git pull origin main
git merge develop
git push origin main
```

**What happens:**

```
Git Push to main
↓
GitLab Webhook
↓
Server deploys to www.data-dna.eu
↓
LIVE in Production!
```

---

## 6. Deployment Directory Structure

```
/var/www/astro/
├── deployments/
│   ├── main/
│   │   ├── deploys/
│   │   │   ├── 20251104003111/  ← Latest
│   │   │   ├── 20251104002000/
│   │   │   └── ...
│   │   ├── live → deploys/20251104003111/  ← Active
│   │   └── logs/
│   ├── develop/
│   │   ├── deploys/
│   │   ├── live → ...
│   │   └── logs/
│   ├── feature-de1/
│   │   ├── deploys/
│   │   ├── live → ...
│   │   └── logs/
│   ├── feature-de2/
│   ├── feature-fv/
│   └── scripts/
│       └── deploy-branch.sh
└── shared/
└── src/
└── content/
└── kommunen/  ← External Collection
```

---

## 7. Monitoring & Troubleshooting

### 7.1 Check Logs

```
# Webhook Server

sudo journalctl -u webhook-server -f

# Deployment Service

sudo journalctl -u astro-develop -f

# Build Logs

tail -f /var/www/astro/deployments/develop/logs/npm-build-*.log
```

### 7.2 Common Problems

**Problem: Webhook not triggering**
```
# 1. Webhook-Server running?

sudo systemctl status webhook-server

# 2. Secret correct?

grep SECRET_TEAM_DE1 /home/astro/webhook-server/.env

# 3. Check logs

sudo journalctl -u webhook-server -n 50
```

**Problem: Build fails**
```
# Deploy Logs

tail -100 /var/www/astro/deployments/feature-de1/logs/npm-build-*.log

# Service Logs

sudo journalctl -u astro-feature-team-de1 -n 30
```

**Problem: Service doesn't start**
```
# Directory exists?

ls -la /var/www/astro/deployments/feature-de1/live/

# Port bound?

sudo lsof -i :3002

# Restart service

sudo systemctl restart astro-feature-team-de1
```

---

## 8. Security

### 8.1 Secret Management

- ✅ Each team has its own secret
- ✅ Secrets in `.env` (not in code)
- ✅ File permissions: `600` (astro only)
- ✅ GitHub HMAC-SHA256 Validation
- ✅ GitLab Token Validation
- ⚠️ Rotate secrets regularly

### 8.2 Branch Protection

**Server-side: Branch Pattern Matching**

```
// Team DE1 CANNOT deploy to feature/team-de2
// Server validates pattern: /^feature/team-de1/.+/
// Unknown branches: 404 (ignored)
```

**GitHub: Branch Protection Rules (optional)**

```
Settings → Branches → Add rule
├─ Pattern: main
├─ Require pull request reviews
└─ Require status checks to pass
```

---

## 9. Quick Reference

### Generate Secrets
```
openssl rand -hex 32
```

### Webhook Server Logs
```
sudo journalctl -u webhook-server -f
```

### Restart Service
```
sudo systemctl restart astro-develop
```

### Manual Deployment
```
sudo -u astro /var/www/astro/scripts/deploy-branch.sh  
feature/team-de1/setup  
/var/www/astro/deployments/feature-de1  
3002  
https://github.com/team-de1/p2d2-feature.git
```

### Status of all Services
```
sudo systemctl status astro-*
```

---

## 10. Summary

```
┌─────────────────────────────────────────────┐
│  Workflow Summary                           │
├─────────────────────────────────────────────┤
│                                             │
│  Team develops in their GitHub repo         │
│  └─ feature/team-de1/* │
│                                             │
│  Push triggers Webhook                      │
│  └─ Server validates Secret + Branch        │
│                                             │
│  Deploy script is called                    │
│  └─ Git clone + npm build                   │
│                                             │
│  Service is restarted                       │
│  └─ f-de1.data-dna.eu LIVE                  │
│                                             │
│  Team tests on feature domain               │
│  └─ After approval: PR to develop            │
│                                             │
│  You merge develop → main                   │
│  └─ Automatic deployment to www             │
│                                             │
│  LIVE in Production ✅                    │
│                                             │
└─────────────────────────────────────────────┘
```

> **Note:** This text was translated automatically with AI assistance and has not yet been reviewed by a human.