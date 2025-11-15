# Production-Deployment

Das Production-Deployment erfolgt nach erfolgreicher Qualitätssicherung im Staging.

## Infrastruktur

### Server

- **Hostname**: www.data-dna.eu (geplant), aktuell ops.data-dna.eu
- **IP**: Öffentliche IP
- **VM-Ressourcen**: 8 vCPU, 16 GB RAM, 200 GB SSD

### Load Balancer

- **OPNsense**: HAProxy für Load-Balancing
- **SSL**: Let's Encrypt-Zertifikat
- **DDoS-Protection**: Rate-Limiting

## Deployment-Strategie

### Blue-Green-Deployment

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

### Deployment-Schritte

1. **Build**: CI/CD erstellt Production-Build
2. **Upload**: Build auf Green-Server
3. **Health-Check**: Green-Server testen
4. **Switch**: Load-Balancer auf Green umstellen
5. **Monitor**: Fehlerrate überwachen
6. **Rollback**: Bei Problemen zurück zu Blue

## CI/CD-Pipeline

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
    
    # Deploy zu Green
    - rsync -avz --delete dist/ green:/var/www/p2d2/
    
    # Health-Check
    - curl -f http://green:8080/api/health || exit 1
    
    # Switch Load Balancer
    - ssh lb 'haproxy-switch.sh green'
    
    # Monitor
    - ./scripts/monitor-deployment.sh
  environment:
    name: production
    url: https://www.data-dna.eu
```

## Datenbank-Migrationen

```bash
# Migration-Script
#!/bin/bash
# scripts/migrate-production.sh

# Backup vor Migration
pg_dump -U p2d2 p2d2 | gzip > /backup/pre-migration-$(date +%Y%m%d).sql.gz

# Migrationen ausführen
psql -U p2d2 p2d2 < migrations/v1.2.0.sql

# Verify
psql -U p2d2 p2d2 -c "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;"
```

## Monitoring nach Deployment

### Error-Rate

```bash
# Prometheus-Query
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
```

### Response-Time

```bash
# Alerting-Rule
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
```

## Rollback-Prozess

### Schneller Rollback

```bash
# Load-Balancer zurück auf Blue
ssh lb 'haproxy-switch.sh blue'
```

### Datenbank-Rollback

```bash
# Nur bei Schema-Änderungen
gunzip < /backup/pre-migration-20240115.sql.gz | psql -U p2d2 p2d2
```

## Wartungsfenster

### Geplante Wartung

```bash
# Maintenance-Mode aktivieren
ssh production 'touch /var/www/p2d2/.maintenance'

# Wartung durchführen
# ...

# Maintenance-Mode deaktivieren
ssh production 'rm /var/www/p2d2/.maintenance'
```

### Nginx-Maintenance-Page

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

## Post-Deployment-Checklist

- [ ] Health-Checks erfolgreich
- [ ] Error-Rate < 1%
- [ ] Response-Time < 2s (p99)
- [ ] WFS/WMS-Services erreichbar
- [ ] Frontend lädt
- [ ] Login funktioniert
- [ ] Feature-Erstellung funktioniert
- [ ] Monitoring-Alerts still

::: danger Production
Production-Deployments sollten nur nach erfolgreicher Abnahme im Staging und außerhalb der Hauptnutzungszeiten erfolgen!
:::
