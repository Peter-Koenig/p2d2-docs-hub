---
title: Multi-Branch System
description: Branch-basierte Deployment-Strategie für Staging und Production
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Multi-Branch System

> **Status:** 🚧 Dokumentation in Arbeit

## Übersicht

Das Multi-Branch-System von p2d2 ermöglicht eine strukturierte Deployment-Strategie mit separaten Umgebungen für Entwicklung, Staging und Produktion. Jeder Git-Branch wird automatisch auf einer eigenen Subdomain deployed.

## Branch-Struktur

### Haupt-Branches

| Branch | Umgebung | URL | Zweck |
|--------|----------|-----|-------|
| `main` | Production | `p2d2.de` | Live-System für Endnutzer |
| `staging` | Staging | `staging.p2d2.de` | Testing und Qualitätssicherung |
| `develop` | Development | `dev.p2d2.de` | Feature-Entwicklung und Integration |

### Feature-Branches

- **Naming**: `feature/feature-name` oder `fix/bug-description`
- **Deployment**: Automatisch auf Preview-Umgebungen
- **Lifetime**: Temporär, werden nach Merge gelöscht

## Deployment-Architektur

### Server-Infrastruktur
- **Caddy Web Server**: Reverse-Proxy und SSL-Terminierung
- **Systemd Services**: Prozess-Management und Auto-Restart
- **Git Hooks**: Automatische Deployment-Trigger

### Directory-Struktur
```
/var/www/p2d2/
├── main/          # Production Deployment
├── staging/       # Staging Deployment  
├── dev/           # Development Deployment
└── preview/       # Feature-Branch Deployments
```

## Automatisierung

### Webhook-Integration
- **GitLab Webhooks**: Automatische Build-Trigger
- **Status-Updates**: Deployment-Status in Merge Requests
- **Notification**: Teams-Benachrichtigungen bei Fehlern

### CI/CD Pipeline
```yaml
# Beispiel GitLab CI Konfiguration
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - ./scripts/deploy.sh
  only:
    - main
    - staging
    - develop
```

## Deployment-Prozess

### 1. Code-Änderungen
- Entwickler pushen Code zu Feature-Branches
- Code-Review und Testing im Staging
- Merge zu `develop` für Integration

### 2. Staging-Deployment
- Automatisches Deployment nach Push zu `staging`
- Manuelle Testing und Qualitätssicherung
- Performance- und Regression-Tests

### 3. Production-Deployment
- Manueller Merge von `staging` zu `main`
- Automatisches Production-Deployment
- Health-Checks und Monitoring

## Konfigurations-Management

### Environment-spezifische Konfiguration
```typescript
// Beispiel für Umgebungs-Konfiguration
const environments = {
  development: {
    apiUrl: 'https://dev-api.p2d2.de',
    mapServices: 'https://dev-geoservices.example.com'
  },
  staging: {
    apiUrl: 'https://staging-api.p2d2.de', 
    mapServices: 'https://staging-geoservices.example.com'
  },
  production: {
    apiUrl: 'https://api.p2d2.de',
    mapServices: 'https://geoservices.example.com'
  }
};
```

### Build-Time Configuration
- Environment-Variablen während des Build-Prozesses
- Feature-Flags für graduelle Rollouts
- A/B Testing Konfiguration

## Monitoring und Logging

### Health-Checks
- **Endpoint Monitoring**: `/health` Endpoints pro Umgebung
- **Performance-Metriken**: Ladezeiten und Response-Times
- **Error-Tracking**: Sentry Integration für Fehler-Reporting

### Logging-Strategie
- **Structured Logging**: JSON-Formatierte Logs
- **Log-Aggregation**: Zentrale Log-Sammlung
- **Alerting**: Automatische Benachrichtigungen bei Problemen

## Rollback-Strategie

### Automatisches Rollback
- Health-Check Fehler trigger Rollback
- Automatische Re-Deployment der vorherigen Version
- Notification an Entwicklungsteam

### Manuelles Rollback
```bash
# Zur vorherigen Version zurückkehren
git checkout HEAD~1
./scripts/deploy.sh
```

## Best Practices

### Branch-Management
- **Feature-Branches**: Kurzlebig und fokussiert
- **Regular Merges**: Häufige Integration in `develop`
- **Clean History**: Squash-Merges für saubere Historie

### Deployment-Sicherheit
- **Testing**: Umfassende Tests vor Production-Deployment
- **Backup**: Automatische Backups vor großen Änderungen
- **Communication**: Team-Benachrichtigungen bei Deployments

## Troubleshooting

### Häufige Probleme
- **Build-Fehler**: Abhängigkeits-Konflikte oder Compiler-Fehler
- **Deployment-Fehler**: Permission-Probleme oder Netzwerk-Issues
- **Runtime-Fehler**: Konfigurations-Probleme oder Environment-Variablen

### Debugging-Tools
- **Server-Logs**: `journalctl -u p2d2-service`
- **Build-Logs**: GitLab CI Pipeline Logs
- **Network-Monitoring**: Caddy Access Logs

## Nächste Schritte

- [ ] Detaillierte Deployment-Scripts dokumentieren
- [ ] Monitoring-Dashboards einrichten
- [ ] Disaster-Recovery-Prozeduren definieren
- [ ] Performance-Benchmarks etablieren