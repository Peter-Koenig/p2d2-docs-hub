---
title: "Git Workflow"
description: "Git-Branching-Strategie, Commit-Konventionen und praktischer Entwicklungsworkflow"
quality:
  completeness: 90
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Git Workflow

## Übersicht

Der p2d2-Git-Workflow basiert auf einem Multi-Branch-System mit Feature-Branches pro Team. Diese Dokumentation fokussiert auf den praktischen Entwicklungsworkflow.

**Verwandte Dokumentation:**
- Multi-Branch-Deployment: `/de/entwicklerhandbuch/deployment/multi-branch-system`
- Multi-Repo-Setup: `/de/administrationshandbuch/multi-repo-deployment`

## Branch-Strategie

### Haupt-Branches

| Branch | Zweck | Auto-Deploy | URL |
|--------|-------|-------------|-----|
| `main` | Produktion | Ja | www.data-dna.eu |
| `develop` | Integration | Ja | dev.data-dna.eu |
| `release` | Staging | Ja | release.data-dna.eu |

**Merge-Flow:**
```
feature/* → develop → main → release
```

### Feature-Branches

**Naming-Konvention:**
```
feature/<team>/<feature-name>

Beispiele:
feature/team-de1/utm-projection
feature/team-de2/feature-editor
feature/team-fv/kommunen-import
```

**Team-Namespaces:**
- `team-de1` - Team Deutschland 1
- `team-de2` - Team Deutschland 2
- `team-fv` - Team FV

**Lifecycle:**
1. Erstellen von `develop`
2. Entwicklung
3. Push zu `origin`
4. Merge Request → `develop`
5. Nach Merge: Branch löschen

## Praktischer Workflow

### 1. Neues Feature starten

```bash
# Aktuellsten develop-Branch holen
git checkout develop
git pull origin develop

# Feature-Branch erstellen
git checkout -b feature/team-de1/neue-karten-projektion

# Erste Änderungen
echo "// Neue Projektion" > src/utils/new-crs.ts
git add src/utils/new-crs.ts
git commit -m "feat(crs): Neue Projektionsunterstützung hinzugefügt"

# Push zu origin
git push origin feature/team-de1/neue-karten-projektion
```

### 2. Während Entwicklung

```bash
# Änderungen committen (häufig!)
git add .
git commit -m "fix(crs): proj4-Definition korrigiert"

# Push aktualisieren
git push origin feature/team-de1/neue-karten-projektion

# Develop-Updates integrieren
git checkout develop
git pull origin develop
git checkout feature/team-de1/neue-karten-projektion
git merge develop
# Konflikte lösen falls nötig
git push origin feature/team-de1/neue-karten-projektion
```

### 3. Merge Request erstellen

**GitLab:**
1. Gehe zu: https://gitlab.opencode.de/OC000028072444/p2d2/-/merge_requests/new
2. Source: `feature/team-de1/neue-karten-projektion`
3. Target: `develop`
4. Titel: `feat(crs): Neue Projektionsunterstützung`
5. Beschreibung:
   ```markdown
   ## Änderungen
   - Neue UTM-Zonen hinzugefügt
   - proj4-Definitionen erweitert
   - Tests für neue Projektionen

   ## Testing
   - [ ] Lokale Tests bestanden
   - [ ] Manual Testing durchgeführt

   Closes #42
   ```
6. Assignees: Reviewer auswählen
7. "Submit merge request"

**Code-Review:**
- Reviewer prüft Code
- Feedback umsetzen
- Nach Approval: Merge

### 4. Nach Merge

```bash
# Feature-Branch lokal löschen
git checkout develop
git branch -d feature/team-de1/neue-karten-projektion

# Remote-Branch löschen
git push origin --delete feature/team-de1/neue-karten-projektion

# Develop aktualisieren
git pull origin develop
```

## Commit-Konventionen

### Conventional Commits

**Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Zweck | Beispiel |
|------|-------|----------|
| `feat` | Neue Features | `feat(map): UTM-Projektion hinzugefügt` |
| `fix` | Bugfixes | `fix(crs): Koordinaten-Transform korrigiert` |
| `docs` | Dokumentation | `docs(readme): Installation erweitert` |
| `style` | Formatierung | `style(map): Code formatiert` |
| `refactor` | Umstrukturierung | `refactor(utils): CRS-Module reorganisiert` |
| `test` | Tests | `test(crs): Unit-Tests hinzugefügt` |
| `chore` | Build/Tools | `chore(deps): Dependencies aktualisiert` |
| `perf` | Performance | `perf(map): Layer-Rendering optimiert` |

### Scopes

| Scope | Bereich |
|-------|---------|
| `map` | Karten-Module |
| `crs` | Koordinatensysteme |
| `wfs` | WFS-Integration |
| `ui` | UI-Komponenten |
| `config` | Konfiguration |
| `docs` | Dokumentation |

### Beispiele

**Feature:**
```
feat(map): OpenLayers-Karte mit UTM-Unterstützung

- registerUtm() Funktion implementiert
- toNewViewPreservingScale() für Projektionswechsel
- Tests für CRS-Transformation hinzugefügt

Closes #42
```

**Bugfix:**
```
fix(wfs): WFS-Proxy CORS-Header korrigiert

WFS-Requests schlugen fehl wegen fehlenden CORS-Headers.

Fixes #58
```

**Breaking Change:**
```
feat(crs)!: CRS-API umstrukturiert

BREAKING CHANGE: registerUtm() gibt nun boolean statt void zurück.

Migration:
- Alt: registerUtm('EPSG:25832');
- Neu: const success = registerUtm('EPSG:25832');
```

## Multi-Repo-Synchronisation

**Remotes:**
```bash
origin  → gitlab.opencode.de/OC000028072444/p2d2.git
mirror  → gitlab.opencode.de/unbox-cologne/p2d2/p2d2-mirror.git
hub     → github.com/Peter-Koenig/p2d2-hub.git
```

**Automatische Synchronisation:**
- Erfolgt über Webhooks
- Details: `/de/administrationshandbuch/multi-repo-deployment`

**Entwickler-Perspektive:**
- Push nur zu `origin`
- Synchronisation zu `mirror` und `hub` erfolgt automatisch
- Kein manuelles Multi-Remote-Pushen nötig

## Debugging

### Häufige Git-Probleme

**Branch ist hinter develop:**
```bash
git checkout feature/team-de1/mein-feature
git fetch origin
git merge origin/develop
```

**Falscher Branch gepusht:**
```bash
# Remote Branch löschen
git push origin --delete feature/falscher-branch

# Lokal korrigieren
git branch -m feature/falscher-branch feature/team-de1/richtiger-branch
git push origin feature/team-de1/richtiger-branch
```

**Commit-Message korrigieren:**
```bash
git commit --amend -m "feat(crs): Korrekte Commit-Message"
git push origin feature/team-de1/mein-feature --force-with-lease
```

**Merge-Konflikte lösen:**
```bash
# Konflikte anzeigen
git status

# Konflikte in Editor lösen
# <<<<<<< HEAD
# Deine Änderungen
# =======
# Ihre Änderungen
# >>>>>>> develop

# Nach Lösung
git add <resolved-file>
git commit -m "merge: Konflikte mit develop gelöst"
```

### Git Aliases (empfohlen)

```bash
# ~/.gitconfig
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  lg = log --oneline --graph --decorate
  recent = log --oneline -10
  unstage = reset HEAD --
  last = log -1 HEAD
```

### Git-Ignore Konfiguration

Die `.gitignore` Datei ignoriert folgende Dateien:
- Build-Output (`dist/`)
- Dependencies (`node_modules/`)
- Environment-Variablen (`.env*`)
- IDE-Konfigurationen (`.vscode/`, `.idea/`)
- System-spezifische Dateien (`.DS_Store`)

**Wichtig:** Environment-Variablen werden ignoriert und müssen separat konfiguriert werden.

## Best Practices

### Commit-Häufigkeit

✅ **Gut:**
- Kleine, atomare Commits
- Ein Feature = Ein Commit (oder mehrere logische Commits)
- Commit-Messages beschreiben "Was" und "Warum"

❌ **Vermeiden:**
- Große Commits mit vielen Änderungen
- "WIP"-Commits im Main/Develop
- Nicht-deskriptive Messages ("Fix", "Update")

### Branch-Hygiene

✅ **Gut:**
- Feature-Branches kurzlebig (max. 1-2 Wochen)
- Regelmäßig `develop` mergen
- Nach Merge löschen

❌ **Vermeiden:**
- Langlebige Feature-Branches
- Direkte Commits auf `main`/`develop`
- Ungenutzte Remote-Branches

### Konflikt-Resolution

```bash
# Während Merge-Konflikt
git status  # Zeigt konfliktbehaftete Dateien

# Konflikte in Editor lösen
# <<<<<<< HEAD
# Deine Änderungen
# =======
# Ihre Änderungen
# >>>>>>> develop

# Nach Lösung
git add <resolved-file>
git commit -m "merge: Konflikte mit develop gelöst"
```

## Debugging

### Häufige Git-Probleme

**Branch ist hinter develop:**
```bash
git checkout feature/team-de1/mein-feature
git fetch origin
git merge origin/develop
```

**Falscher Branch gepusht:**
```bash
# Remote Branch löschen
git push origin --delete feature/falscher-branch

# Lokal korrigieren
git branch -m feature/falscher-branch feature/team-de1/richtiger-branch
git push origin feature/team-de1/richtiger-branch
```

**Commit-Message korrigieren:**
```bash
git commit --amend -m "feat(crs): Korrekte Commit-Message"
git push origin feature/team-de1/mein-feature --force-with-lease
```

### Git Aliases (empfohlen)

```bash
# ~/.gitconfig
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  lg = log --oneline --graph --decorate
  recent = log --oneline -10
  unstage = reset HEAD --
  last = log -1 HEAD
```

## Git-Ignore Konfiguration

Die `.gitignore` Datei ignoriert folgende Dateien:
- Build-Output (`dist/`)
- Dependencies (`node_modules/`)
- Environment-Variablen (`.env*`)
- IDE-Konfigurationen (`.vscode/`, `.idea/`)
- System-spezifische Dateien (`.DS_Store`)

**Wichtig:** Environment-Variablen werden ignoriert und müssen separat konfiguriert werden.