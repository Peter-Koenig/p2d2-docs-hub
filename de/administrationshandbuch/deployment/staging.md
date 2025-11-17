---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Staging-Umgebung

Die Staging-Umgebung ist eine produktionsnahe Testumgebung für p2d2.

## Zweck

- **Testing**: Neue Features testen
- **Integration**: Zusammenspiel der Komponenten prüfen
- **Performance**: Last-Tests durchführen
- **User-Acceptance**: Von Stakeholdern abgenommen werden

## Infrastruktur

### Server

- **Hostname**: dev.data-dna.eu
- **IP**: 10.0.1.100
- **VM-Ressourcen**: 4 vCPU, 8 GB RAM, 50 GB SSD

### Datenbank

- **PostgreSQL**: Kopie der Production-DB (anonymisiert)
- **Backup**: Täglich, 7 Tage Retention

### GeoServer

- **URL**: https://dev.data-dna.eu/geoserver
- **Workspace**: p2d2-staging

## Deployment-Prozess

### Automatisches Deployment

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

### Manuelles Deployment

```bash
# Build
npm run build

# Deploy
scp -r dist/* user@dev.data-dna.eu:/var/www/p2d2/

# Restart Services
ssh user@dev.data-dna.eu 'systemctl reload nginx'
```

## Daten-Synchronisation

### Von Production zu Staging

```bash
# Datenbank-Dump von Production
ssh production 'pg_dump -U p2d2 p2d2 | gzip > /tmp/prod.sql.gz'

# Transfer zu Staging
scp production:/tmp/prod.sql.gz staging:/tmp/

# In Staging importieren
ssh staging 'gunzip < /tmp/prod.sql.gz | psql -U p2d2 p2d2'

# Anonymisieren
ssh staging 'psql -U p2d2 p2d2 -c "UPDATE users SET email = md5(email) || '\''@example.com'\'';"'
```

## Testing

### Smoke-Tests

```bash
# Health-Check
curl https://dev.data-dna.eu/api/health

# WFS GetCapabilities
curl https://dev.data-dna.eu/geoserver/p2d2-staging/wfs?service=WFS&request=GetCapabilities

# Frontend lädt
curl -I https://dev.data-dna.eu
```

### E2E-Tests

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
# Vorherige Version wiederherstellen
ssh staging 'cp -r /var/www/p2d2.backup /var/www/p2d2 && systemctl reload nginx'
```

::: warning Staging ≠ Production
Staging-Daten sind anonymisiert und dürfen nicht für echte Nutzung verwendet werden!
:::
