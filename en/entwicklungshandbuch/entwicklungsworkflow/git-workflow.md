---
title: "Git Workflow"
description: "Git branching strategy, commit conventions and practical development workflow"
quality:
  completeness: 90
  accuracy: 75
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Git Workflow

## Overview

The p2d2 Git workflow is based on a multi-branch system with feature branches per team. This documentation focuses on the practical development workflow.

**Related Documentation:**
- Multi-Branch Deployment: `/en/entwicklerhandbuch/deployment/multi-branch-system`
- Multi-Repo Setup: `/en/administrationshandbuch/multi-repo-deployment`

## Branch Strategy

### Main Branches

| Branch | Purpose | Auto-Deploy | URL |
|--------|---------|-------------|-----|
| `main` | Production | Yes | www.data-dna.eu |
| `develop` | Integration | Yes | dev.data-dna.eu |
| `release` | Staging | Yes | release.data-dna.eu |

**Merge Flow:**
```
feature/* → develop → main → release
```

### Feature Branches

**Naming Convention:**
```
feature/<team>/<feature-name>

Examples:
feature/team-de1/utm-projection
feature/team-de2/feature-editor
feature/team-fv/kommunen-import
```

**Team Namespaces:**
- `team-de1` - Team Germany 1
- `team-de2` - Team Germany 2
- `team-fv` - Team FV

**Lifecycle:**
1. Create from `develop`
2. Development
3. Push to `origin`
4. Merge Request → `develop`
5. After merge: Delete branch

## Practical Workflow

### 1. Start New Feature

```bash
# Get latest develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/team-de1/new-map-projection

# First changes
echo "// New projection" > src/utils/new-crs.ts
git add src/utils/new-crs.ts
git commit -m "feat(crs): Added new projection support"

# Push to origin
git push origin feature/team-de1/new-map-projection
```

### 2. During Development

```bash
# Commit changes (frequently!)
git add .
git commit -m "fix(crs): Corrected proj4 definition"

# Update push
git push origin feature/team-de1/new-map-projection

# Integrate develop updates
git checkout develop
git pull origin develop
git checkout feature/team-de1/new-map-projection
git merge develop
# Resolve conflicts if necessary
git push origin feature/team-de1/new-map-projection
```

### 3. Create Merge Request

**GitLab:**
1. Go to: https://gitlab.opencode.de/OC000028072444/p2d2/-/merge_requests/new
2. Source: `feature/team-de1/new-map-projection`
3. Target: `develop`
4. Title: `feat(crs): New projection support`
5. Description:
   ```markdown
   ## Changes
   - Added new UTM zones
   - Extended proj4 definitions
   - Tests for new projections

   ## Testing
   - [ ] Local tests passed
   - [ ] Manual testing performed

   Closes #42
   ```
6. Assignees: Select reviewer
7. "Submit merge request"

**Code Review:**
- Reviewer checks code
- Implement feedback
- After approval: Merge

### 4. After Merge

```bash
# Delete feature branch locally
git checkout develop
git branch -d feature/team-de1/new-map-projection

# Delete remote branch
git push origin --delete feature/team-de1/new-map-projection

# Update develop
git pull origin develop
```

## Commit Conventions

### Conventional Commits

**Format:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New Features | `feat(map): Added UTM projection` |
| `fix` | Bugfixes | `fix(crs): Corrected coordinate transform` |
| `docs` | Documentation | `docs(readme): Extended installation` |
| `style` | Formatting | `style(map): Formatted code` |
| `refactor` | Restructuring | `refactor(utils): Reorganized CRS modules` |
| `test` | Tests | `test(crs): Added unit tests` |
| `chore` | Build/Tools | `chore(deps): Updated dependencies` |
| `perf` | Performance | `perf(map): Optimized layer rendering` |

### Scopes

| Scope | Area |
|-------|------|
| `map` | Map modules |
| `crs` | Coordinate systems |
| `wfs` | WFS integration |
| `ui` | UI components |
| `config` | Configuration |
| `docs` | Documentation |

### Examples

**Feature:**
```
feat(map): OpenLayers map with UTM support

- Implemented registerUtm() function
- toNewViewPreservingScale() for projection switching
- Added tests for CRS transformation

Closes #42
```

**Bugfix:**
```
fix(wfs): Corrected WFS proxy CORS headers

WFS requests failed due to missing CORS headers.

Fixes #58
```

**Breaking Change:**
```
feat(crs)!: Restructured CRS API

BREAKING CHANGE: registerUtm() now returns boolean instead of void.

Migration:
- Old: registerUtm('EPSG:25832');
- New: const success = registerUtm('EPSG:25832');
```

## Multi-Repo Synchronization

**Remotes:**
```bash
origin  → gitlab.opencode.de/OC000028072444/p2d2.git
mirror  → gitlab.opencode.de/unbox-cologne/p2d2/p2d2-mirror.git
hub     → github.com/Peter-Koenig/p2d2-hub.git
```

**Automatic Synchronization:**
- Done via webhooks
- Details: `/en/administrationhandbook/multi-repo-deployment`

**Developer Perspective:**
- Push only to `origin`
- Synchronization to `mirror` and `hub` happens automatically
- No manual multi-remote pushing needed

## Debugging

### Common Git Problems

**Branch is behind develop:**
```bash
git checkout feature/team-de1/my-feature
git fetch origin
git merge origin/develop
```

**Wrong branch pushed:**
```bash
# Delete remote branch
git push origin --delete feature/wrong-branch

# Correct locally
git branch -m feature/wrong-branch feature/team-de1/correct-branch
git push origin feature/team-de1/correct-branch
```

**Fix commit message:**
```bash
git commit --amend -m "feat(crs): Correct commit message"
git push origin feature/team-de1/my-feature --force-with-lease
```

**Resolve merge conflicts:**
```bash
# Show conflicts
git status

# Resolve conflicts in editor
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> develop

# After resolution
git add <resolved-file>
git commit -m "merge: Resolved conflicts with develop"
```

### Git Aliases (recommended)

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

### Git-Ignore Configuration

The `.gitignore` file ignores the following files:
- Build output (`dist/`)
- Dependencies (`node_modules/`)
- Environment variables (`.env*`)
- IDE configurations (`.vscode/`, `.idea/`)
- System-specific files (`.DS_Store`)

**Important:** Environment variables are ignored and must be configured separately.

## Best Practices

### Commit Frequency

✅ **Good:**
- Small, atomic commits
- One feature = One commit (or multiple logical commits)
- Commit messages describe "What" and "Why"

❌ **Avoid:**
- Large commits with many changes
- "WIP" commits in main/develop
- Non-descriptive messages ("Fix", "Update")

### Branch Hygiene

✅ **Good:**
- Short-lived feature branches (max. 1-2 weeks)
- Regularly merge `develop`
- Delete after merge

❌ **Avoid:**
- Long-lived feature branches
- Direct commits on `main`/`develop`
- Unused remote branches

### Conflict Resolution

```bash
# During merge conflict
git status  # Shows conflicted files

# Resolve conflicts in editor
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> develop

# After resolution
git add <resolved-file>
git commit -m "merge: Resolved conflicts with develop"
```
