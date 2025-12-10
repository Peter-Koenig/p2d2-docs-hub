---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# CI/CD Pipeline

The CI/CD pipeline automates the build, test, and deployment of p2d2.

## Pipeline Overview

```
┌─────────┐
│  Push   │
│  Code   │
└────┬────┘
     │
┌────▼────────┐
│   Build     │
├─────────────┤
│ - npm ci    │
│ - npm build │
└────┬────────┘
     │
┌────▼────────┐
│   Test      │
├─────────────┤
│ - Lint      │
│ - Unit      │
│ - E2E       │
└────┬────────┘
     │
┌────▼────────┐
│  Deploy     │
├─────────────┤
│ - Staging   │ (auto on develop)
│ - Production│ (manual on main)
└─────────────┘
```

## GitLab CI/CD

### .gitlab-ci.yml

```yaml
stages:
  - build
  - test
  - deploy_staging
  - deploy_production

variables:
  NODE_VERSION: "20"
  POSTGRES_DB: p2d2_test
  POSTGRES_USER: p2d2
  POSTGRES_PASSWORD: test

# Build Stage
build:
  stage: build
  image: node:${NODE_VERSION}
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

# Test Stage
lint:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint

unit_test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:unit
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

e2e_test:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0
  services:
    - postgres:15
    - kartoza/geoserver:2.24.0
  script:
    - npm ci
    - npm run test:e2e
  artifacts:
    when: on_failure
    paths:
      - test-results/
    expire_in: 1 week

# Deploy Staging
deploy_staging:
  stage: deploy_staging
  only:
    - develop
  environment:
    name: staging
    url: https://dev.data-dna.eu
  before_script:
    - 'command -v ssh-agent >/dev/null || ( apt-get update -y && apt-get install openssh-client -y )'
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
  script:
    - rsync -avz --delete dist/ staging:/var/www/p2d2/
    - ssh staging 'systemctl reload nginx'
    - curl -f https://dev.data-dna.eu/api/health || exit 1

# Deploy Production
deploy_production:
  stage: deploy_production
  only:
    - main
  when: manual
  environment:
    name: production
    url: https://www.data-dna.eu
  before_script:
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  script:
    # Deploy to Green server
    - rsync -avz --delete dist/ green:/var/www/p2d2/
    
    # Health Check
    - curl -f http://green:8080/api/health || exit 1
    
    # Switch Load Balancer
    - ssh lb './switch-to-green.sh'
    
    # Post-Deployment Tests
    - curl -f https://www.data-dna.eu/api/health || (ssh lb './switch-to-blue.sh' && exit 1)
    
  after_script:
    - ./scripts/notify-deployment.sh production success
```

## Webhooks

### On Push to main

```bash
# Triggers deployment to ops.data-dna.eu
curl -X POST https://ops.data-dna.eu/webhook/deploy \
  -H "X-GitLab-Token: $WEBHOOK_SECRET" \
  -d '{"ref":"refs/heads/main"}'
```

### Deployment Script on Server

```bash
#!/bin/bash
# /var/www/deploy.sh

cd /var/www/p2d2
git pull origin main
npm ci
npm run build

# Create backup
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

# Nginx reload
systemctl reload nginx

# Health Check
sleep 5
curl -f http://localhost/api/health || (
  echo "Health Check failed! Rolling back..."
  rm -rf dist
  mv dist.backup.* dist
  systemctl reload nginx
  exit 1
)

echo "Deployment successful!"
```

## Branch Strategy

```
main (Production)
  ↑
  └─ release/v1.2.0
       ↑
       └─ develop (Staging)
            ↑
            ├─ feature/team-de1/friedhoefe-import
            ├─ feature/team-de2/qc-workflow
            └─ bugfix/issue-1234
```

### Merge Flow

1.  **Feature Branch** → `develop`: Automatic staging deployment
2.  **develop** → `release/vX.Y.Z`: Create Release Branch
3.  **release** → `main`: Manual production deployment
4.  **main** → Tag: `v1.2.0`

## Secrets Management

### GitLab CI/CD Variables

```
SSH_PRIVATE_KEY        # SSH key for server access
SSH_KNOWN_HOSTS        # Known hosts
WEBHOOK_SECRET         # Webhook authentication
DB_PASSWORD            # Database password
GEOSERVER_ADMIN_PWD    # GeoServer admin password
```

## Monitoring the Pipeline

### Prometheus Metrics

```yaml
# gitlab-exporter
- job_name: 'gitlab-pipelines'
  static_configs:
    - targets: ['gitlab.opencode.de:9168']
```

### Alerts

```yaml
# alerting-rules.yml
- alert: PipelineFailureRate
  expr: |
    rate(gitlab_ci_pipeline_status{status="failed"}[1h]) 
    / rate(gitlab_ci_pipeline_status[1h]) > 0.3
  annotations:
    summary: "High pipeline failure rate"
```

::: tip Pipeline Optimization
Use caching for `node_modules` and artifacts to reduce build times.
:::