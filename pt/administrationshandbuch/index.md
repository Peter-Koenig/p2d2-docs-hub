---
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Manual de Administração

Bem-vindo ao Manual de Administração do p2d2. Aqui você encontrará documentação técnica para instalação, configuração e operação da infraestrutura de geodados.

## Público-Alvo

Este manual destina-se a:

  - **Administradores de sistema** que instalam e operam o p2d2
  - **Engenheiros DevOps** que automatizam a implantação
  - **Especialistas em GDI** que configuram a infraestrutura de geodados

## Visão Geral da Arquitetura

O p2d2 é baseado em uma arquitetura de múltiplos níveis:

1.  **Nível de Infraestrutura**: Proxmox VE, OPNsense, PBS
2.  **Infraestrutura de Geodados**: PostgreSQL/PostGIS, GeoServer, MapProxy
3.  **Frontend**: Aplicação AstroJS com OpenLayers
4.  **CI/CD**: Pipeline de implantação baseado no GitLab

## Requisitos do Sistema

### Hardware

  - **Host Proxmox**: Intel 13ª Gen (ou comparável), 14 núcleos, 64 GB RAM
  - **Sistema Total**: \~28 GB RAM para todos os contêineres/VMs + sobrecarga para Proxmox
  - **Armazenamento**: Mín. 200 GB SSD (para contêineres/VMs + espaço de backup)
  - **Rede**: 1 Gbit/s (10 Gbit/s para produção)

### Software

  - **Virtualização**: Proxmox VE 9.x
  - **SO do Contêiner**: Debian 13
  - **SO do Firewall**: FreeBSD 14.x (OPNSense)
  - **Banco de Dados**: PostgreSQL 15+ com PostGIS 3.4+
  - **Servidor Web**: Caddy (Terminação TLS)
  - **Node.js**: 20.x LTS

## Navegação

### Infraestrutura do Servidor

  - [Visão Geral da Arquitetura do Servidor](https://www.google.com/search?q=./server-architektur/) - Arquitetura geral da infraestrutura p2d2
  - [Host Proxmox](https://www.google.com/search?q=./server-architektur/proxmox-host) - Plataforma de virtualização
  - [Firewall OPNsense](https://www.google.com/search?q=./server-architektur/vm-opnsense) - Firewall e Reverse Proxy
  - [Arquitetura de Rede](https://www.google.com/search?q=./server-architektur/netzwerk-architektur) - Segmentação de rede e design de firewall
  - [Estratégia de Backup](https://www.google.com/search?q=./server-architektur/backup-strategie) - Backup de dados e recuperação de desastres

### Infraestrutura de Geodados

  - [Contêiner PostgreSQL/PostGIS](https://www.google.com/search?q=./server-architektur/lxc-postgresql) - Banco de dados geoespacial com extensões espaciais
  - [Contêiner GeoServer](https://www.google.com/search?q=./server-architektur/lxc-geoserver) - Servidor WFS/WMS para serviços de geodados
  - [Contêiner MapProxy](https://www.google.com/search?q=./server-architektur/lxc-mapproxy) - Cache de tiles e proxy para entrega de mapas com performance
  - [VM OSM-Tileserver](https://www.google.com/search?q=./server-architektur/vm-osm-tiler) - Servidor de renderização de tiles OpenStreetMap
  - [Contêiner Ory IAM (Planejado)](https://www.google.com/search?q=./server-architektur/lxc-ory-iam) - Gerenciamento de Identidade e Acesso

### Software & Implantação

  - [Contêiner Frontend](https://www.google.com/search?q=./server-architektur/lxc-frontend) - Frontend web AstroJS + VitePress com CI/CD multi-branch
  - [Arquitetura Frontend](https://www.google.com/search?q=./frontend-architektur) - Aplicação AstroJS
  - [Arquitetura de Software](https://www.google.com/search?q=./software-architektur) - Componentes e módulos
  - [Implantação](https://www.google.com/search?q=./deployment/staging) - Staging e Produção

## Início Rápido

Para uma instalação rápida em um ambiente de teste:

```
# Clonar repositório
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Para uma instalação de produção completa, siga as seções do Manual de Administração.

::: warning Aviso de Segurança
A instalação rápida é adequada apenas para ambientes de teste\! Para sistemas de produção, aspectos de segurança devem ser considerados.
:::

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.