---
title: Contenedor Frontend
description: Frontend web AstroJS + VitePress con CI/CD multi-branch
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC: Contenedor Frontend

## Información del Contenedor

```
Tipo: LXC (privilegiado/no privilegiado según configuración)
SO: Debian 13 (trixie)
Hostname: frontend (personalizable)
Estado: en ejecución

Recursos:
  RAM: 4 GB
  Disco: 25 GB (ampliable dinámicamente)
  CPU Shares: Estándar (1024)
```

## Software Instalado

### Runtime Node.js

```
Versión: Node.js v20.x LTS
Gestor de Paquetes: npm (Node Package Manager)
Gestor de Versiones de Node: Opcional (nvm)
```

### Servidor Web

```
AstroJS: Framework Web Moderno
  - Versión: 4.x (Estable actual)
  - Herramienta de Build: Vite
  - SSR: Server-Side Rendering
  - Generación Estática: Modo Híbrido

VitePress: Sistema de Documentación
  - Versión: 1.x (Estable actual)
  - Basado en: Vite + Vue 3
  - Markdown: Características Extendidas
```

### Componentes CI/CD

```
Webhook-Server: Automatización Git
  - Puerto: 9321 (HTTP, LAN interna)
  - Integración: Webhooks GitHub/GitLab
  - Despliegue: Sistema Multi-Branch

Servicios Systemd: Instancias AstroJS
  - astro-main.service (Producción)
  - astro-develop.service (Desarrollo)
  - astro-feature-*.service (Ramas de Funcionalidad)
```

## Arquitectura de Servicios

### Sistema de Despliegue Multi-Branch

```
Instancias Paralelas:
  - main: Frontend de Producción (www.data-dna.eu)
  - develop: Frontend de Desarrollo (dev.data-dna.eu)
  - feature-de1: Rama de Funcionalidad 1 (f-de1.data-dna.eu)
  - feature-de2: Rama de Funcionalidad 2 (f-de2.data-dna.eu)
  - feature-fv: Rama de Funcionalidad 3 (f-fv.data-dna.eu)

Asignación de Puertos:
  - main: Puerto 3000
  - develop: Puerto 3001
  - feature-de1: Puerto 3002
  - feature-de2: Puerto 3003
  - feature-fv: Puerto 3004
```

### Configuración de Servicio Systemd

```
# Ejemplo: astro-main.service
[Unit]
Description=AstroJS Main Frontend
After=network.target

[Service]
Type=simple
User=astro
WorkingDirectory=/var/www/astro/main
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Acceso a Red

```
Puertos de Escucha:
  - 3000: Frontend Principal (Producción)
  - 3001: Frontend de Desarrollo
  - 3002-3004: Ramas de Funcionalidad
  - 9321: Servidor Webhook

Acceso vía Reverse Proxy:
  - www.data-dna.eu → Puerto 3000
  - dev.data-dna.eu → Puerto 3001
  - f-de1.data-dna.eu → Puerto 3002
  - f-de2.data-dna.eu → Puerto 3003
  - f-fv.data-dna.eu → Puerto 3004
  - doc.data-dna.eu → Servidor VitePress

Reglas de Firewall:
  - Caddy (OPNSense) → Frontend: PERMITIR
  - Servidor Webhook → GitHub/GitLab: SALIENTE PERMITIR
  - Frontend → GeoServer: PERMITIR (WFS-T)
  - Frontend → MapProxy: PERMITIR (Teselas)
  - Acceso Externo: DENEGAR (solo vía Caddy)
```

## Pipeline CI/CD

### Configuración del Servidor Webhook

```
# /etc/webhook-server/config.json
{
  "port": 9321,
  "secret": "<WEBHOOK_SECRET>",
  "deployments": {
    "main": {
      "branch": "main",
      "path": "/var/www/astro/main",
      "port": 3000,
      "domain": "www.data-dna.eu"
    },
    "develop": {
      "branch": "develop",
      "path": "/var/www/astro/develop",
      "port": 3001,
      "domain": "dev.data-dna.eu"
    }
  }
}
```

### Script de Despliegue

```
#!/bin/bash
# /usr/local/bin/deploy-astro.sh

BRANCH=$1
DEPLOY_PATH="/var/www/astro/$BRANCH"
PORT=$2

echo "Deploying branch $BRANCH to $DEPLOY_PATH on port $PORT"

# Stop existing service
systemctl stop astro-$BRANCH.service

# Git Pull
cd $DEPLOY_PATH
git fetch origin
git reset --hard origin/$BRANCH

# Install Dependencies
npm ci --production

# Build Application
npm run build

# Start Service
systemctl start astro-$BRANCH.service

echo "Deployment completed for $BRANCH"
```

## Configuración AstroJS

### Configuración Principal (astro.config.mjs)

```
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  
  // Geo-Configuration
  vite: {
    define: {
      // Environment Variables
      __GEO_SERVER_URL__: JSON.stringify('https://ows.data-dna.eu'),
      __TILE_SERVER_URL__: JSON.stringify('https://tiles.data-dna.eu'),
      __WFS_T_URL__: JSON.stringify('https://wfs.data-dna.eu')
    }
  }
});
```

### Integración Backend

```
// src/lib/geoserver.js
export async function wfsTransaction(feature) {
  const response = await fetch('https://wfs.data-dna.eu/geoserver/wfs', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: generateWFSInsert(feature)
  });
  
  return await response.text();
}

// src/lib/mapproxy.js
export function getTileUrl(layer, z, x, y) {
  return `https://tiles.data-dna.eu/tms/1.0.0/${layer}/${z}/${x}/${y}.png`;
}
```

## Documentación VitePress

### Configuración

```
# Configuration: docs/.vitepress/config.js
export default {
  title: 'p2d2 Dokumentation',
  description: 'Dokumentation für die p2d2 Geodateninfrastruktur',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Administrationshandbuch', link: '/de/administrationshandbuch/' }
    ],
    
    sidebar: {
      '/de/administrationshandbuch/': [
        {
          text: 'Server-Architektur',
          items: [
            { text: 'Übersicht', link: '/de/administrationshandbuch/server-architektur/' },
            { text: 'Proxmox Host', link: '/de/administrationshandbuch/server-architektur/proxmox-host' }
          ]
        }
      ]
    }
  }
}
```

## Estrategia de Backup

### Snapshot PBS (Nivel Contenedor)

  - **Programación**: Diaria
  - **Retención**: 7 días
  - **Tipo**: Snapshot LVM-Thin

### Backup de Código (Git)

```
# El código ya está respaldado en el repositorio Git
# Respaldar scripts de despliegue y configuraciones
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## Monitorización

### Comprobaciones de Salud

```
# Comprobar estado del servicio
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# Probar escucha de puertos
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# Probar dominios externos
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### Análisis de Logs

```
# Logs AstroJS
journalctl -u astro-main -f --no-pager
journalctl -u astro-develop -f --no-pager

# Logs Servidor Webhook
journalctl -u webhook-server -f --no-pager

# Logs Aplicación
tail -f /var/www/astro/main/logs/app.log
```

## Solución de Problemas

### Servicio no arranca

```
# Comprobar logs systemd
journalctl -u astro-main --no-pager -n 100

# Conflictos de puerto
netstat -tlnp | grep 3000

# Problemas de permisos
ls -la /var/www/astro/main/
```

### Errores de Despliegue

```
# Logs Webhook
journalctl -u webhook-server --no-pager -n 50

# Estado Repositorio Git
cd /var/www/astro/main && git status

# Errores de Build
cd /var/www/astro/main && npm run build --verbose
```

### Problemas de Rendimiento

```
# Uso de Memoria
ps aux | grep node
free -h

# Espacio en Disco
df -h /var/www/astro/

# Conectividad de Red
curl -I http://geoserver.lan:8080/geoserver/web
```

## Configuración de Seguridad

### Endurecimiento del Servicio

```
Aislamiento de Usuario:
  - Usuario Dedicado: astro
  - Grupo: astro
  - Directorio Home: /var/www/astro

Permisos de Archivos:
  - Archivos de Config: 640 (root:astro)
  - Archivos de Log: 644 (astro:astro)
  - Directorio de Build: 755 (astro:astro)
```

### Seguridad de Red

```
Reglas de Firewall:
  - Solo proxy Caddy tiene acceso
  - Servidor Webhook solo para IPs autorizadas
  - Sin exposición directa a WAN

Variables de Entorno:
  - Sin secretos en el código
  - Archivos .env para Desarrollo
  - Secretos de Producción vía Entorno Systemd
```

## Buenas Prácticas

✅ **Hacer**:

  - Actualizaciones regulares de Node.js (Parches de seguridad)
  - Monitorización de todos los puertos de servicio
  - Backup de archivos de configuración
  - Cuentas de usuario separadas para servicios
  - Rotación de logs para logs de aplicación

❌ **No Hacer**:

  - Exponer frontend directamente a Internet
  - Commitear secretos en Git
  - Ejecutar sin limitación de tasa
  - Permitir archivos de log ilimitados
  - Builds de producción en servidor de desarrollo

## Referencias

  - [Documentación AstroJS](https://docs.astro.build/)
  - [Documentación VitePress](https://vitepress.dev/)
  - [Configuración Servicio Systemd](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
  - [Buenas Prácticas Node.js en Producción](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.