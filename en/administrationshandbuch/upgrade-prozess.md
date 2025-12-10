---
title: Upgrade Process
description: Workflow for dependency updates and version upgrades in the multi-team setup
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

# Dependency Update Workflow – p2d2 Project

## Overview

This process describes the procedure for updating dependencies (e.g., AstroJS) in the p2d2 project with distributed teams and a multi-repo setup.

## Roles

- **Tech Lead (TL)**: Responsible for updates and coordination
- **Team Members**: Test updates in their feature branches

## Workflow

### Phase 1: Update by Tech Lead

1.  **Create Feature Branch**
    ```
    git checkout develop
    git pull hub develop
    git checkout -b feature/dependency-update-YYYY-MM-DD
    ```

2.  **Update Dependencies**
    ```
    # Option A: Automatic (recommended for Astro)
    npx @astrojs/upgrade
    
    # Option B: Manual
    npm update
    # or specific:
    npm install astro@latest
    ```

3.  **Installation and Test**
    ```
    npm install
    rm -rf .astro/ node_modules/.astro node_modules/.vite
    DEBUG=astro:* npm run dev -- --host 0.0.0.0
    ```

4.  **Commit and Merge**
    ```
    git add package.json package-lock.json
    git commit -m "chore: Update dependencies (Astro X.Y.Z)"
    git checkout develop
    git merge feature/dependency-update-YYYY-MM-DD
    git push all develop
    ```

### Phase 2: Deployment to Dev Environment

5.  **Automatic Deployment**
    * CI/CD automatically deploys `develop` to `dev.data-dna.eu`
    
6.  **Test on Dev Environment**
    * TL tests all main functions on dev.data-dna.eu
    * In case of problems: Bugfix in `develop` or rollback

### Phase 3: Team Testing

7.  **Team Notification**
    * TL informs teams via Issue/Mail/Chat:
        ```
        Update available in develop:
        - Astro X.Y.Z
        - [other updates]
        
        Please pull, run npm install and test.
        Feedback by [Date] in Issue #XYZ
        ```

8.  **Team Members Execute Locally**
    ```
    git checkout develop
    git pull hub develop
    npm install
    rm -rf .astro/ node_modules/.astro node_modules/.vite
    DEBUG=astro:* npm run dev -- --host 0.0.0.0
    ```

9.  **Feedback Collection**
    * Teams report issues or give OK
    * TL fixes critical issues in `develop`

### Phase 4: Production Release

10. **Merge to Main**
    ```
    git checkout main
    git pull hub main
    git merge develop
    git push all main
    ```

11. **Deployment to Production**
    * CI/CD automatically deploys to `www.data-dna.eu`
    * TL performs smoke tests

12. **Documentation**
    * Document update in CHANGELOG.md
    * Create release notes (optional)

## Important Notes

### For Tech Lead

- **ALWAYS commit package-lock.json** (guarantees identical versions)
- Mark breaking changes in the commit message
- For major updates: extensive tests and documentation
- `git push all` pushes to all remotes (hub, mirror, origin)

### For Team Members

- **After every pull with package.json changes**: run `npm install`
- For build issues: clear cache (`.astro/`, `node_modules/.astro`, `node_modules/.vite`)
- Do not perform updates in feature branches (avoid merge conflicts)

## Automation (Optional)

GitHub Action for automatic dependency checks:

```yaml
name: Check Dependencies
on:
  schedule:
    - cron: '0 9 * * 1'  # Mondays 9:00 AM
  workflow_dispatch:

jobs:
  check-updates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm outdated || true
      - run: npx @astrojs/upgrade --check
```

## Troubleshooting

### "Module not found" errors after pull
```
rm -rf node_modules package-lock.json
npm install
```

### Outdated remote branches
```
git fetch --prune
git remote prune origin
```

### Cache issues
```
rm -rf .astro/ node_modules/.astro node_modules/.vite
npm run dev
```

> **Note:** This text was translated automatically with AI assistance and has not yet been reviewed by a human.