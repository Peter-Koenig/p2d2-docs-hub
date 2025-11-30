---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: "(Übersetzung: KI)"
  reviewDate: null
---

# Production Deployment

Production deployment occurs after successful quality assurance in staging.

## Infrastructure

### Server

  - **Hostname**: www.data-dna.eu (planned), currently ops.data-dna.eu
  - **IP**: Public IP
  - **VM Resources**: 8 vCPU, 16 GB RAM, 200 GB SSD

### Load Balancer

  - **OPNSense**: HAProxy for load balancing
  - **SSL**: Let's Encrypt certificate
  - **DDoS Protection**: Rate limiting

## Deployment Strategy

### Blue-Green Deployment

```
┌─────────┐
│  User   │
└────┬────┘
     │
┌────▼─────┐
│  LB      │
└────┬─────┘
     │
     ├─────────┬─────────┐
     │         │         │
┌────▼───┐ ┌───▼───┐ ┌───▼───┐
│ Blue   │ │ Green │ │ Canary│
│ (old)  │ │ (new) │ │ (new) │
└────────┘ └───────┘ └───────┘
```

### Deployment Steps

1.  **Build**: CI/CD creates production build
2.  **Upload**: Build to Green server
3.  **Health Check**: Test Green server
4.  **Switch**: Switch load balancer to Green
5.  **Monitor**: Monitor error rate
6.  **Rollback**: If problems, switch back to Blue

## CI/CD Pipeline

```yaml
# .gitlab-ci.yml
deploy_production:
  stage: deploy_production
  only:
    - main
  when: manual
  script:
    # Build
    - npm ci
    - npm run build
    - npm run test:e2e
    
    # Deploy to Green
    - rsync -avz --delete dist/ green:/var/www/p2d2/
    
    # Health Check
    - curl -f http://green:8080/api/health || exit 1
    
    # Switch Load Balancer
    - ssh lb 'haproxy-switch.sh green'
    
    # Monitor
    - ./scripts/monitor-deployment.sh
  environment:
    name: production
    url: https://www.data-dna.eu
```

## Database Migrations

```bash
# Migration script
#!/bin/bash
# scripts/migrate-production.sh

# Backup before migration
pg_dump -U p2d2 p2d2 | gzip > /backup/pre-migration-$(date +%Y%m%d).sql.gz

# Run migrations
psql -U p2d2 p2d2 < migrations/v1.2.0.sql

# Verify
psql -U p2d2 p2d2 -c "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;"
```

## Monitoring after Deployment

### Error Rate

```bash
# Prometheus query
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
```

### Response Time

```bash
# Alerting rule
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
```

## Rollback Process

### Quick Rollback

```bash
# Switch load balancer back to Blue
ssh lb 'haproxy-switch.sh blue'
```

### Database Rollback

```bash
# Only for schema changes
gunzip < /backup/pre-migration-20240115.sql.gz | psql -U p2d2 p2d2
```

## Maintenance Window

### Planned Maintenance

```bash
# Enable maintenance mode
ssh production 'touch /var/www/p2d2/.maintenance'

# Perform maintenance
# ...

# Disable maintenance mode
ssh production 'rm /var/www/p2d2/.maintenance'
```

### Nginx Maintenance Page

```nginx
# /etc/nginx/sites-available/p2d2
server {
    listen 443 ssl http2;
    server_name www.data-dna.eu;
    
    location / {
        if (-f /var/www/p2d2/.maintenance) {
            return 503;
        }
        # Normal config
    }
    
    error_page 503 @maintenance;
    location @maintenance {
        root /var/www/maintenance;
        rewrite ^(.*)$ /maintenance.html break;
    }
}
```

## Post-Deployment Checklist

  - [ ] Health checks successful
  - [ ] Error rate < 1%
  - [ ] Response time < 2s (p99)
  - [ ] WFS/WMS services accessible
  - [ ] Frontend loads
  - [ ] Login works
  - [ ] Feature creation works
  - [ ] Monitoring alerts silent

::: danger Production
Production deployments should only occur after successful acceptance in staging and outside of peak usage times!
:::