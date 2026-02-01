---
title: Multi-Repo Deployment
description: Deployment-Strategie für verteilte Team-Entwicklung mit GitLab, GitHub und Webhook-Server
status: migrated
lastUpdated: 2025-11-17
lang: de
quality:
quality:
  completeness: 100
  accuracy: 100
  reviewed: true
  reviewer: Peter König (Gemini-Support)
  reviewDate: 2026-02-01
---

# p2d2 Multi-Repo Deployment – Komplette Dokumentation

---

## 1. System-Architektur

### 1.1 Übersicht

```
┌─── p2d2 - Kolab ──┐   ┌───── p2d2 - Push ─────┐  ┌────p2d2-doc - Push ───┐ 
│ GitHub (Features) │   │  GitLab (opencode.de) │  │  GitLab (opencode.de) │ 
│ ├─ team-de1       │   │  ├─ main              │  │  └─ main              │ 
│ ├─ team-de2       │ → │  ├─ develop           │  │                       │ 
│ ├─ team-fv        │   │  ├─ team-de1          │  │                       │ 
│ └ (ggf. mehr) ..  │   │  ├─ team-de2          │  │                       │ 
│                   │   │  └─ team-fv           │  │                       │ 
└───────────────────┘   └────────────┬──────────┘  └─┬─────────────────────┘
                                     │               │ 
                         Webhook     │               │
                                     ↓               ↓
        ┌──────────────────── Webhook-Server ───────────┐
        │  Frontend VM (Port 9321)                      │
        │  Webhook-Server                               │
        │  ├─ Secret-Validierung                        │
        │  ├─ Repo-Router                               │
        │  ├─ git clone → staging-Server                │
        │  └─ Deploy-Trigger                            │
        └────────────────────────┬──────────────────────┘
                                 │
                                 ↓
        ┌──────────────────── staging server ─────────────────────┐
        │  systemd Services                                       │             
        │  ├─ astro-branch@main.service        (Port 3000, node)  │             
        │  ├─ astro-branch@develop.service     (Port 3001, node)  │             
        │  ├─ astro-branch@feature-de1.service (Port 3002, node)  │             
        │  ├─ astro-branch@feature-de2.service (Port 3003, node)  │             
        │  └─ astro-branch@feature-fv.service  (Port 3004, node)  │             
        │  └─ nginx                            (Port 3020)        │             
        └────────────────────────┬────────────────────────────────┘
                                 │             
                                 ↓             
        ┌─────────────────── Präsentation ──────────────┐
        │  Caddy Reverse Proxy (OPNSense)               │
        │  ├─   www.data-dna.eu   →   :3000             │
        │  ├─   dev.data-dna.eu   →   :3001             │
        │  ├─ f-de1.data-dna.eu   →   :3002             │
        │  ├─ f-de2.data-dna.eu   →   :3003             │
        │  └─   doc.data-dna.eu   →   :3020             │ 
        └───────────────────────────────────────────────┘
```

### 1.2 Deployment-Flows

#### Flow 1: Main/Develop (dein Repo, GitLab)

```
Du: git push origin develop
    ↓
GitLab Webhook → POST http://www.data-dna.eu:9321/webhook
    ↓
Webhook-Server:
├─ Liest x-gitlab-token Header
├─ Validiert gegen SECRET_DEVELOP
├─ Findet: https://gitlab.opencode.de/.../p2d2.git
├─ Branch: develop
└─ Ruft auf: deploy-branch.sh develop ... https://gitlab...
    ↓
Deploy-Script:
├─ git clone --branch develop
├─ npm ci + npm run build
├─ sudo systemctl restart astro-develop
└─ Live unter dev.data-dna.eu
```

#### Flow 2: Feature Branches (Team-Repos, GitHub)

```
Team: git push origin feature/team-de1/meine-funktion
    ↓
GitHub Webhook → POST http://www.data-dna.eu:9321/webhook
    ↓
Webhook-Server:
├─ Liest x-hub-signature-256 Header
├─ Kalkuliert HMAC-SHA256 mit SECRET_TEAM_DE1
├─ Validiert Signature
├─ Branch-Pattern Match: /^feature\/team-de1\/.+/ ✓
├─ Findet: https://github.com/team-de1/p2d2-feature.git
└─ Ruft auf: deploy-branch.sh feature/team-de1/meine-funktion ... https://github.com/team-de1/...
    ↓
Deploy-Script:
├─ git clone --branch feature/team-de1/meine-funktion
├─ npm ci + npm run build
├─ sudo systemctl restart astro-feature-team-de1
└─ Live unter f-de1.data-dna.eu
```

---

## 2. Webhook-Server Konfiguration

### 2.1 Secrets Management

```
# /home/astro/webhook-server/.env

# GitLab Secrets (dein Repo)
SECRET_MAIN=dein_secret_main_hier
SECRET_DEVELOP=dein_secret_develop_hier

# GitHub Shared Secrets (Team-Repos)
SECRET_TEAM_DE1=team_de1_secret_hier
SECRET_TEAM_DE2=team_de2_secret_hier
SECRET_TEAM_FV=team_fv_secret_hier
```

### 2.2 Branch-Konfiguration

```
require('dotenv').config({ path: '/home/astro/webhook-server/.env.production' });
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();

const ALLOWED_BRANCHES_REGEX = /^(main|develop|feature\/team-[^/]+\/main)$/;

// Raw Body für GitHub HMAC speichern
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));

// Branch-zu-Repo-Konfiguration
// Entweder SECRET_TEAM_DE1 , SECRET_TEAM_DE2 , SECRET_TEAM_FV
// oder SECRET_TEAM_HUB
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
    repo: 'https://github.com/Peter-Koenig/p2d2-hub.git',
    secret: process.env.SECRET_TEAM_HUB,
    provider: 'github',
    matchPattern: /^feature\/team-de1\/.+/
  },
  'feature/team-de2': {
    domain: 'f-de2.data-dna.eu',
    deployPath: '/var/www/astro/deployments/feature-de2',
    port: 3003,
    repo: 'https://github.com/Peter-Koenig/p2d2-hub.git',
    secret: process.env.SECRET_TEAM_HUB,
    provider: 'github',
    matchPattern: /^feature\/team-de2\/.+/
  },
  'feature/team-fv': {
    domain: 'f-fv.data-dna.eu',
    deployPath: '/var/www/astro/deployments/feature-fv',
    port: 3004,
    repo: 'https://github.com/Peter-Koenig/p2d2-hub.git',
    secret: process.env.SECRET_TEAM_HUB,
    provider: 'github',
    matchPattern: /^feature\/team-fv\/.+/
  },
  'p2d2-docs-main': {
    domain: 'doc.data-dna.eu',
    deployPath: '/var/www/vitepress',
    deployScript: '/var/www/vitepress/deploy.sh', // Eigenes Deploy-Script
    type: 'vitepress', // Marker für VitePress-Deployment
    repo: 'https://gitlab.opencode.de/OC000028072444/p2d2-docs.git',
    secret: process.env.SECRET_P2D2_DOCS,
    provider: 'gitlab'
  }
};

// Branch-Konfiguration finden
function getBranchConfig(branchName) {
  if (branchConfig[branchName]) {
    return { ...branchConfig[branchName], branch: branchName };
  }
  
  for (const [key, config] of Object.entries(branchConfig)) {
    if (config.matchPattern && config.matchPattern.test(branchName)) {
      return { ...config, branch: branchName };
    }
  }
  
  return null;
}

// GitLab Secret-Validierung (Plaintext)
function validateGitLabSecret(incomingToken, expectedSecret) {
  if (!incomingToken || !expectedSecret) {
    return false;
  }
  return incomingToken === expectedSecret;
}

// GitHub Secret-Validierung (HMAC-SHA256) - KORRIGIERT
function validateGitHubSecret(req, expectedSecret) {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature || !expectedSecret) {
    console.error('[DEBUG] Fehlende Signature oder Secret');
    return false;
  }
  
  // ✅ WICHTIG: rawBody verwenden, nicht req.body!
  if (!req.rawBody) {
    console.error('[DEBUG] rawBody nicht verfügbar');
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', expectedSecret);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
  
  console.log(`[DEBUG] Expected: ${digest}`);
  console.log(`[DEBUG] Received: ${signature}`);
  
  // Timing-safe Vergleich
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(digest, 'utf8')
    );
  } catch (e) {
    console.error(`[DEBUG] timingSafeEqual Error: ${e.message}`);
    return false;
  }
}

app.post('/webhook', (req, res) => {
  const ref = req.body.ref || '';
  const branchName = ref.replace('refs/heads/', '');
  
  if (!ALLOWED_BRANCHES_REGEX.test(branchName)) {
    console.log(`[SKIP] Branch ${branchName} ist kein Target-Branch. Ignoriere Webhook.`);
    return res.status(200).send('Ignoriert: Kein Ziel-Branch.');
  }

  console.log(`[${new Date().toISOString()}] Webhook empfangen für Branch: ${branchName}`);

  // Spezialfall: p2d2-docs
  if (branchName === 'main' && req.body.project && req.body.project.name === 'p2d2-docs') {
    const config = branchConfig['p2d2-docs-main'];
    
    // GitLab Token validieren
    const incomingToken = req.headers['x-gitlab-token'];
    if (!validateGitLabSecret(incomingToken, config.secret)) {
      console.error(`[ERROR] Ungültiger Token für p2d2-docs`);
      return res.status(403).send('Zugriff verweigert: Ungültiger Token.');
    }
    
    console.log(`[OK] Token validiert für p2d2-docs`);
    res.send('Webhook empfangen, Deployment für p2d2-docs wird gestartet.');
    
    // VitePress Deploy-Script direkt aufrufen
    exec('bash /var/www/vitepress/deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error(`[ERROR] Deployment p2d2-docs: ${error.message}`);
        console.error(`[STDERR] ${stderr}`);
        return;
      }
      console.log(`[SUCCESS] Deployment p2d2-docs: ${stdout}`);
    });
    
    return;
  }

  const config = getBranchConfig(branchName);
  
  if (!config) {
    console.log(`[WARN] Kein Deployment konfiguriert für Branch: ${branchName}`);
    res.status(404).send(`Branch ${branchName} wird nicht automatisch deployed.`);
    return;
  }
  
  // Provider-spezifische Validierung
  let isValid = false;
  
  if (config.provider === 'gitlab') {
    const incomingToken = req.headers['x-gitlab-token'];
    isValid = validateGitLabSecret(incomingToken, config.secret);
  } else if (config.provider === 'github') {
    isValid = validateGitHubSecret(req, config.secret);
  }
  
  if (!isValid) {
    console.error(`[ERROR] Ungültiger Token für Branch ${branchName} (Provider: ${config.provider})`);
    res.status(403).send('Zugriff verweigert: Ungültiger Token.');
    return;
  }
  
  console.log(`[OK] Token validiert für ${branchName} (${config.provider})`);
  res.send(`Webhook empfangen, Deployment für ${branchName} wird gestartet.`);
  
  const deployScript = '/var/www/astro/scripts/deploy-branch.sh';
  const deployCmd = `${deployScript} "${config.branch}" "${config.deployPath}" "${config.port}" "${config.repo}"`;
  
  console.log(`[EXEC] ${deployCmd}`);
  
  exec(deployCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[ERROR] Deployment ${branchName}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[STDERR] ${branchName}: ${stderr}`);
      return;
    }
    console.log(`[SUCCESS] Deployment ${branchName}: ${stdout}`);
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('Webhook-Server läuft');
});

const PORT = 9321;
app.listen(PORT, () => {
  console.log(`Webhook-Server läuft auf Port ${PORT}`);
  console.log(`Konfigurierte Branches: ${Object.keys(branchConfig).join(', ')}`);
});
```

---

## 3. Team Onboarding

### 3.1 Schritt 1: Team-Repo erstellen

**Team macht das:**

```
# Option A: Neues Repo
# GitHub.com → New Repository → p2d2-feature
# Clone & Feature-Branch erstellen
git clone https://github.com/team-de1/p2d2-feature.git
cd p2d2-feature
git checkout -b feature/team-de1/setup

# Option B: Fork des Main-Repos
# GitHub.com → fork Peter-Koenig/p2d2-hub
# Clone & Feature-Branch erstellen
git clone https://github.com/team-de1/p2d2-feature.git
cd p2d2-feature
git checkout -b feature/team-de1/meine-funktion
```

### 3.2 Schritt 2: Secret generieren & verteilen

**Du machst das:**

```
# Secret generieren
openssl rand -hex 32
# Ausgabe: a1b2c3d4e5f6g7h8...

# Mit Team teilen (verschlüsselt!)
# Signal, PGP, oder sicherer Kanal

# In .env eintragen
echo "SECRET_TEAM_DE1=a1b2c3d4e5f6g7h8..." >> /home/astro/webhook-server/.env

# Webhook-Server neu starten
sudo systemctl restart webhook-server
```

### 3.3 Schritt 3: GitHub Webhook konfigurieren

**Team macht das:**

1. GitHub → Repository → Settings → Webhooks → Add webhook
2. **Payload URL:** `http://<deine-ip>:9321/webhook`
3. **Content type:** `application/json`
4. **Secret:** Den Secret von dir
5. **Which events:** `Just the push event`
6. **Active:** ✅
7. **Add webhook**

**Test:**
- Recent Deliveries → Klick auf Eintrag → "Redeliver"
- Oder: Team macht Test-Push zu `feature/team-de1/test`

---

## 4. Development Workflow

### 4.1 Feature entwickeln (Team)

```
# Team entwickelt lokal
git checkout feature/team-de1/neue-funktion
# ... Code ändern ...
git add .
git commit -m "Feature: Neue Funktion"
git push origin feature/team-de1/neue-funktion
# ... Code optimieren ...
git checkout feature/team-de1/main
git merge feature/team-de1/neue-funktion
git push origin
```

**Was passiert automatisch:**

```
Push → GitHub Webhook
     → Server validiert Secret
     → Deploy-Script triggert
     → f-de1.data-dna.eu updated
     → LIVE in ~2 Minuten
```

### 4.2 Feature testen

Team kann ihre Änderungen live anschauen

```
# Team testet unter
https://f-de1.data-dna.eu/

# TL;DR: Einfach neuen Push in main

1. git checkout -b feature/team-de1/feature-xyz
2. git add .
3. git commit -m "Bugfix: xyz"
4. testen
5. git checkout feature/team-de1/main 
7. git merge feature/team-de1/feature-xyz
8. git push origin

# → Automatisch deployed
```

---

## 5. Integration in Main/Develop

### 5.1 Feature Ready → Pull Request

**Team erstellt Pull Request** (in ihrem Repo oder zu deinem):

```
# GitHub: team-de1/p2d2-feature
# PR: feature/team-de1/neue-funktion → develop

# Oder: Zu deinem Main-Repo
# PR: OC000028072444/p2d2
# feature/team-de1/neue-funktion → develop
```

### 5.2 Du reviewst & merged

```
# Du auf deinem Repo
git checkout develop
git pull origin develop

# Feature-Branch mergen
git merge feature/team-de1/neue-funktion
git push origin develop
```

**Was passiert:**

```
Git Push zu develop
     ↓
GitLab Webhook
     ↓
Server deployed zu dev.data-dna.eu
     ↓
Team + du können testen auf Staging
```

### 5.3 Release → Main

```
# Nach Test/Approval
git checkout main
git pull origin main
git merge develop
git push origin main
```

**Was passiert:**

```
Git Push zu main
     ↓
GitLab Webhook
     ↓
Server deployed zu www.data-dna.eu
     ↓
LIVE in Produktion!
```

---

## 6. Deployment-Verzeichnisstruktur

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
            └── kommunen/  ← Externe Collection
```

---

## 7. Doku der Überarbeitung (1.2.2026)

### 7.1. Der Gatekeeper: Webhook-Server (Port 9321)

Der Webhook-Server (`/home/astro/webhook-server/index.js`) fungiert als zentraler Router. Er validiert eingehende Anfragen und ordnet sie den Ziel-Instanzen zu.

### 7.1.1 Branch-Filterung & Security

Es wird ein striktes Filtering angewendet, um unnötige Build-Last zu vermeiden. Nur Pushes auf definierte Ziel-Branches lösen eine Aktion aus.

**Konfigurations-Auszug:**
*Link:* [webhook-server/index.js](https://www.google.com/search?q=https://gitlab.opencode.de/OC000028072444/p2d2/-/blob/main/webhook-server/index.js)

```javascript
const ALLOWED_BRANCHES_REGEX = /^(main|develop|feature\/team-[^/]+\/main|p2d2-docs-main)$/;

const branchConfig = {
  'main': {
    domain: 'www.data-dna.eu',
    deployPath: '/var/www/astro/deployments/main',
    port: 3000,
    repo: '[https://gitlab.opencode.de/OC000028072444/p2d2.git](https://gitlab.opencode.de/OC000028072444/p2d2.git)',
    secret: process.env.SECRET_MAIN,
    provider: 'gitlab'
  },
  'feature/team-de1': {
    domain: 'f-de1.data-dna.eu',
    deployPath: '/var/www/astro/deployments/feature-de1',
    port: 3002,
    repo: '[https://github.com/Peter-Koenig/p2d2-hub.git](https://github.com/Peter-Koenig/p2d2-hub.git)',
    secret: process.env.SECRET_TEAM_HUB,
    provider: 'github',
    matchPattern: /^feature\/team-de1\/.+/
  }
};

```

---

### 7.2. Die Orchestrierung: `deploy-branch.sh`

Dieses Skript verwaltet den Lebenszyklus eines Deployments. Es sorgt für atomare Updates, indem es Symlinks nutzt, anstatt Dateien im laufenden Betrieb zu überschreiben.

#### 7.2.1 Deployment-Schritte

1. **Clone:** Frischer Checkout des Ziel-Branches in ein Zeitstempel-Verzeichnis.
2. **Data-Link:** Einbindung der geteilten Geodaten-Collection (`shared/src/content/kommunen`).
3. **Environment Injection:** Sourcing der globalen `.env.production` und Ergänzung der instanzspezifischen Ports.
4. **Build:** Node-Build via `npm ci` und `npm run build`.
5. **Systemd-Hook:** Dynamische Generierung des Service-Namens und Restart via Template.

**Skript-Auszug:**
*Link:* [deploy-branch.sh](https://www.google.com/search?q=https://gitlab.opencode.de/OC000028072444/p2d2/-/blob/main/scripts/deploy-branch.sh)

```bash
# Pfad-Berechnung für Service-Mapping
# feature/team-de1/main -> feature-de1
CLEAN_NAME=$(echo "$BRANCH_NAME" | sed -e 's/\//-/g' -e 's/-team-/-/g' -e 's/-main$//g')
SERVICE_NAME="astro-branch@$CLEAN_NAME"

# Environment Setup
cp "$ENV_FILE" "$NEW_DEPLOY_DIR/.env.production"
echo "PORT=$PORT" >> "$NEW_DEPLOY_DIR/.env.production"
echo "HOST=0.0.0.0" >> "$NEW_DEPLOY_DIR/.env.production"

# Restart Logic
sudo systemctl daemon-reload
sudo systemctl restart "$SERVICE_NAME"

```

---

### 7.3. Der Maschinenraum: Systemd-Templates

Um die Wartbarkeit zu erhöhen, wird ein **Template-Service** genutzt. Dies vermeidet redundante Konfigurationsdateien für jeden Branch.

#### 7.3.1 Template: `astro-branch@.service`

Das `@`-Zeichen erlaubt es, beliebig viele Instanzen (main, develop, etc.) über eine einzige Vorlage zu starten.

```ini
[Unit]
Description=p2d2 Astro Instance (Branch: %i)
After=network.target

[Service]
Type=simple
User=astro
WorkingDirectory=/var/www/astro/deployments/%i/live
ExecStart=/home/astro/astro-app/start-astro.sh
Restart=on-failure
Environment=NODE_ENV=production
# IPv4-Priorisierung für SMTP in restriktiven LXC Umgebungen
Environment=NODE_OPTIONS="--dns-result-order=ipv4first"

```

#### 7.3.2 Start-Wrapper: `start-astro.sh`

Der Wrapper stellt sicher, dass die Anwendung im korrekten Verzeichnis startet und die Umgebungsvariablen (Secrets) für Astro 5 geladen sind.

```bash
#!/bin/bash
LIVE_DIR=$(pwd)
# Lade Secrets für Astro 5 Validierung
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
fi
exec node dist/server/entry.mjs

```

---

### 7.4. Sonderfall: VitePress Dokumentation

Das Deployment der Dokumentation (`doc.data-dna.eu`) folgt einer vereinfachten Logik, da es sich um eine rein statische Seite handelt.

**Workflow:**

1. Webhook empfängt `p2d2-docs-main` Event.
2. Triggert `/var/www/vitepress/deploy.sh`.
3. Skript führt `git pull` und `npm run docs:build` aus.
4. Die resultierenden Dateien im `dist`-Ordner werden direkt vom Reverse Proxy (Caddy/Nginx) serviert.

---

### 7.5. Netzwerkkonfiguration & Ports

#### 7.5.1 Port-Mapping

| Instanz | URL | Port |
| --- | --- | --- |
| `main` | `www.data-dna.eu` | 3000 |
| `develop` | `dev.data-dna.eu` | 3001 |
| `feature-de1` | `f-de1.data-dna.eu` | 3002 |
| `feature-de2` | `f-de2.data-dna.eu` | 3003 |
| `feature-fv` | `f-fv.data-dna.eu` | 3004 |

#### 7.5.2 SMTP-Konfiguration (Production)

Aufgrund von Port-Sperren in der LXC-Infrastruktur für Port 465 nutzt p2d2 auf dem Produktionsserver folgenden Standard:

* **Host:** `mxe***.netcup.net`
* **Port:** `587` (STARTTLS)
* **Secure:** `false`
* **Node-Family:** `4` (Erzwinge IPv4)

Details zur Implementierung: [contact-submit.ts](https://www.google.com/search?q=https://gitlab.opencode.de/OC000028072444/p2d2/-/blob/main/src/pages/api/contact-submit.ts)

---

### 7.6. Monitoring & Troubleshooting

### Log-Analyse

```bash
# Logs der Haupt-Instanz
journalctl -u astro-branch@main -f

# Logs des Webhook-Gatekeepers
journalctl -u webhook.service -f
```

## 8. Sicherheit

### 8.1 Secret-Verwaltung

- ✅ Jedem Team eigener Secret
- ✅ Secrets in `.env` (nicht im Code)
- ✅ Datei-Berechtigungen: `600` (nur astro)
- ✅ GitHub HMAC-SHA256 Validierung
- ✅ GitLab Token Validierung
- ⚠️ Secrets regelmäßig rotieren

### 8.2 Branch-Schutz

**Server-seitig: Branch-Pattern-Matching**

```
// Team DE1 kann NICHT zu feature/team-de2 deployen
// Server validiert Pattern: /^feature\/team-de1\/.+/
// Unbekannte Branches: 404 (ignoriert)
```

**GitHub: Branch-Protection-Rules (optional)**

```
Settings → Branches → Add rule
├─ Pattern: main
├─ Require pull request reviews
└─ Require status checks to pass
```

---

## 9. Quick Reference

### Secrets generieren
```
openssl rand -hex 32
```

### Webhook-Server Logs
```
sudo journalctl -u webhook-server -f
```

### Service neu starten
```
sudo systemctl restart astro-develop
```

### Deployment manuell
```
sudo -u astro /var/www/astro/scripts/deploy-branch.sh \
  feature/team-de1/setup \
  /var/www/astro/deployments/feature-de1 \
  3002 \
  https://github.com/team-de1/p2d2-feature.git
```

### Status aller Services
```
sudo systemctl status astro-*
```

---

## 10. Zusammenfassung

```
┌─────────────────────────────────────────────┐
│  Workflow Summary                           │
├─────────────────────────────────────────────┤
│                                             │
│  Team entwickelt in ihrem GitHub-Repo       │
│  └─ feature/team-de1/*                      │
│                                             │
│  Push triggert Webhook                      │
│  └─ Server validiert Secret + Branch        │
│                                             │
│  Deploy-Script wird aufgerufen              │
│  └─ Git clone + npm build                   │
│                                             │
│  Service wird neu gestartet                 │
│  └─ f-de1.data-dna.eu LIVE                  │
│                                             │
│  Team testet auf Feature-Domain             │
│  └─ Nach Approval: PR zu develop            │
│                                             │
│  Du mergst develop → main                   │
│  └─ Automatisches Deployment zu www         │
│                                             │
│  LIVE in Produktion ✅                      │
│                                             │
└─────────────────────────────────────────────┘
```
