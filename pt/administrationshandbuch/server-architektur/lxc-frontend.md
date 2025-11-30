---
title: Contêiner Frontend
description: Frontend web AstroJS + VitePress com CI/CD multi-branch
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC: Contêiner Frontend

## Informações do Contêiner

```
Tipo: LXC (privilegiado/não privilegiado dependendo da configuração)
SO: Debian 13 (trixie)
Hostname: frontend (personalizável)
Status: em execução

Recursos:
  RAM: 4 GB
  Disco: 25 GB (expansível dinamicamente)
  CPU Shares: Padrão (1024)
```

## Software Instalado

### Runtime Node.js

```
Versão: Node.js v20.x LTS
Gerenciador de Pacotes: npm (Node Package Manager)
Gerenciador de Versão Node: Opcional (nvm)
```

### Servidor Web

```
AstroJS: Framework Web Moderno
  - Versão: 4.x (Estável atual)
  - Ferramenta de Build: Vite
  - SSR: Server-Side Rendering
  - Geração Estática: Modo Híbrido

VitePress: Sistema de Documentação
  - Versão: 1.x (Estável atual)
  - Baseado em: Vite + Vue 3
  - Markdown: Recursos Estendidos
```

### Componentes CI/CD

```
Webhook-Server: Automação Git
  - Porta: 9321 (HTTP, LAN interna)
  - Integração: Webhooks GitHub/GitLab
  - Implantação: Sistema Multi-Branch

Serviços Systemd: Instâncias AstroJS
  - astro-main.service (Produção)
  - astro-develop.service (Desenvolvimento)
  - astro-feature-*.service (Branches de Funcionalidade)
```

## Arquitetura de Serviços

### Sistema de Implantação Multi-Branch

```
Instâncias Paralelas:
  - main: Frontend de Produção (www.data-dna.eu)
  - develop: Frontend de Desenvolvimento (dev.data-dna.eu)
  - feature-de1: Branch de Funcionalidade 1 (f-de1.data-dna.eu)
  - feature-de2: Branch de Funcionalidade 2 (f-de2.data-dna.eu)
  - feature-fv: Branch de Funcionalidade 3 (f-fv.data-dna.eu)

Mapeamento de Portas:
  - main: Porta 3000
  - develop: Porta 3001
  - feature-de1: Porta 3002
  - feature-de2: Porta 3003
  - feature-fv: Porta 3004
```

### Configuração de Serviço Systemd

```
# Exemplo: astro-main.service
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

## Acesso à Rede

```
Portas de Escuta:
  - 3000: Frontend Principal (Produção)
  - 3001: Frontend de Desenvolvimento
  - 3002-3004: Branches de Funcionalidade
  - 9321: Servidor Webhook

Acesso via Reverse Proxy:
  - www.data-dna.eu → Porta 3000
  - dev.data-dna.eu → Porta 3001
  - f-de1.data-dna.eu → Porta 3002
  - f-de2.data-dna.eu → Porta 3003
  - f-fv.data-dna.eu → Porta 3004
  - doc.data-dna.eu → Servidor VitePress

Regras de Firewall:
  - Caddy (OPNSense) → Frontend: PERMITIR
  - Servidor Webhook → GitHub/GitLab: SAÍDA PERMITIR
  - Frontend → GeoServer: PERMITIR (WFS-T)
  - Frontend → MapProxy: PERMITIR (Tiles)
  - Acesso Externo: NEGAR (somente via Caddy)
```

## Pipeline CI/CD

### Configuração do Servidor Webhook

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

### Script de Implantação

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

## Configuração AstroJS

### Configuração Principal (astro.config.mjs)

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

### Integração Backend

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

## Documentação VitePress

### Configuração

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

## Estratégia de Backup

### Snapshot PBS (Nível Contêiner)

  - **Agendamento**: Diário
  - **Retenção**: 7 dias
  - **Tipo**: Snapshot LVM-Thin

### Backup de Código (Git)

```
# Código já está em backup no repositório Git
# Fazer backup de scripts de implantação e configurações
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## Monitoramento

### Verificações de Saúde

```
# Verificar status do serviço
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# Testar escuta de porta
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# Testar domínios externos
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### Análise de Logs

```
# Logs AstroJS
journalctl -u astro-main -f --no-pager
journalctl -u astro-develop -f --no-pager

# Logs Servidor Webhook
journalctl -u webhook-server -f --no-pager

# Logs Aplicação
tail -f /var/www/astro/main/logs/app.log
```

## Solução de Problemas

### Serviço não inicia

```
# Verificar logs systemd
journalctl -u astro-main --no-pager -n 100

# Conflitos de porta
netstat -tlnp | grep 3000

# Problemas de Permissão
ls -la /var/www/astro/main/
```

### Erros de Implantação

```
# Logs Webhook
journalctl -u webhook-server --no-pager -n 50

# Status Repositório Git
cd /var/www/astro/main && git status

# Erros de Build
cd /var/www/astro/main && npm run build --verbose
```

### Problemas de Performance

```
# Uso de Memória
ps aux | grep node
free -h

# Espaço em Disco
df -h /var/www/astro/

# Conectividade de Rede
curl -I http://geoserver.lan:8080/geoserver/web
```

## Configuração de Segurança

### Endurecimento do Serviço

```
Isolamento de Usuário:
  - Usuário Dedicado: astro
  - Grupo: astro
  - Diretório Home: /var/www/astro

Permissões de Arquivo:
  - Arquivos de Config: 640 (root:astro)
  - Arquivos de Log: 644 (astro:astro)
  - Diretório de Build: 755 (astro:astro)
```

### Segurança de Rede

```
Regras de Firewall:
  - Somente proxy Caddy tem acesso
  - Servidor Webhook somente para IPs autorizados
  - Sem exposição direta à WAN

Variáveis de Ambiente:
  - Sem segredos no código
  - Arquivos .env para Desenvolvimento
  - Segredos de Produção via Ambiente Systemd
```

## Melhores Práticas

✅ **Fazer**:

  - Atualizações regulares do Node.js (Patches de segurança)
  - Monitoramento de todas as portas de serviço
  - Backup de arquivos de configuração
  - Contas de usuário separadas para serviços
  - Rotação de logs para logs de aplicação

❌ **Não Fazer**:

  - Expor frontend diretamente à internet
  - Commitar segredos no Git
  - Executar sem limitação de taxa
  - Permitir arquivos de log ilimitados
  - Builds de produção em servidor de desenvolvimento

## Referências

  - [Documentação AstroJS](https://docs.astro.build/)
  - [Documentação VitePress](https://vitepress.dev/)
  - [Configuração Serviço Systemd](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
  - [Melhores Práticas Node.js em Produção](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.