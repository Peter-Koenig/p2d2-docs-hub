---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Staging Environment

The staging environment is a production-like test environment for p2d2.

## Purpose

  - **Testing**: Test new features
  - **Integration**: Check interplay of components
  - **Performance**: Conduct load tests
  - **User Acceptance**: Get approval from stakeholders

## Infrastructure

### Server

  - **Hostname**: dev.data-dna.eu
  - **IP**: 10.0.1.100
  - **VM Resources**: 4 vCPU, 8 GB RAM, 50 GB SSD

### Database

  - **PostgreSQL**: Copy of the production DB (anonymized)
  - **Backup**: Daily, 7 days retention

### GeoServer

  - **URL**: [https://dev.data-dna.eu/geoserver](https://dev.data-dna.eu/geoserver)
  - **Workspace**: p2d2-staging

## Deployment Process

### Automatic Deployment

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy_staging

deploy_staging:
  stage: deploy_staging
  only:
    - develop
  script:
    - npm run build
    - rsync -avz --delete dist/ staging:/var/www/p2d2/
    - ssh staging 'systemctl reload nginx'
  environment:
    name: staging
    url: https://dev.data-dna.eu
```

### Manual Deployment

```bash
# Build
npm run build

# Deploy
scp -r dist/* user@dev.data-dna.eu:/var/www/p2d2/

# Restart Services
ssh user@dev.data-dna.eu 'systemctl reload nginx'
```

## Data Synchronization

### From Production to Staging

```bash
# Database dump from Production
ssh production 'pg_dump -U p2d2 p2d2 | gzip > /tmp/prod.sql.gz'

# Transfer to Staging
scp production:/tmp/prod.sql.gz staging:/tmp/

# Import into Staging
ssh staging 'gunzip < /tmp/prod.sql.gz | psql -U p2d2 p2d2'

# Anonymize
ssh staging 'psql -U p2d2 p2d2 -c "UPDATE users SET email = md5(email) || '\''@example.com'\'';"'
```

## Testing

### Smoke Tests

```bash
# Health Check
curl https://dev.data-dna.eu/api/health

# WFS GetCapabilities
curl https://dev.data-dna.eu/geoserver/p2d2-staging/wfs?service=WFS&request=GetCapabilities

# Frontend loads
curl -I https://dev.data-dna.eu
```

### E2E Tests

```typescript
// tests/e2e/staging.spec.ts
import { test, expect } from '@playwright/test';

test('Map loads on staging', async ({ page }) => {
  await page.goto('https://dev.data-dna.eu');
  await expect(page.locator('#map')).toBeVisible();
});

test('Can create feature on staging', async ({ page }) => {
  await page.goto('https://dev.data-dna.eu/map');
  await page.click('[data-testid="add-feature"]');
  // ...
});
```

## Rollback

```bash
# Restore previous version
ssh staging 'cp -r /var/www/p2d2.backup /var/www/p2d2 && systemctl reload nginx'
```

::: warning Staging ≠ Production
Staging data is anonymized and must not be used for real purposes!
:::