---
title: Arquitetura do Servidor
description: Visão geral da infraestrutura de dados geoespaciais p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Arquitetura do Servidor

[cite_start]A infraestrutura p2d2 é baseada no **Proxmox VE 9.x** e utiliza uma arquitetura híbrida de **contêineres LXC** para microsserviços e **VMs** para tarefas complexas de rede e servidor de tiles. [cite: 1070] [cite_start]A virtualização é executada em hardware Intel moderno (13ª Geração, 14 Núcleos, 64 GB RAM). [cite: 1070]

## Visão Geral da Arquitetura

TODO: Inserir gráfico

## Visão Geral dos Componentes

| Componente | Tipo | Papel | RAM | Disco | SO |
|---|---|---|---|---|---|
| **OPNSense** | VM | Firewall + Reverse Proxy | 4 GB | 25 GB | [cite_start]FreeBSD 14.x | [cite: 1072]
| **PostgreSQL** | LXC | Geodatabase + PostGIS | 2 GB | 15 GB | [cite_start]Debian 13 | [cite: 1073]
| **GeoServer** | LXC | Servidor WFS/WMS | 6 GB | 12 GB | [cite_start]Debian 13 | [cite: 1074]
| **MapProxy** | LXC | Cache de Tiles + Proxy | 4 GB | 38 GB | [cite_start]Debian 13 | [cite: 1075]
| **OSM-Tiler** | VM | Renderização de Tiles | 6 GB | 65 GB | [cite_start]Debian 13 | [cite: 1075]
| **Frontend** | LXC | AstroJS + VitePress | 4 GB | 25 GB | [cite_start]Debian 13 | [cite: 1076]
| **Ory IAM** *(planejado)* | LXC | Gerenciamento de Identidade | 2 GB | 10 GB | [cite_start]Debian 13 | [cite: 1077]

## Princípios de Design

### Isolamento de Serviços

[cite_start]Cada serviço é executado em seu próprio contêiner LXC ou VM. [cite: 1078] Isso permite:

  - [cite_start]Atualizações independentes sem tempo de inatividade de outros serviços [cite: 1078]
  - [cite_start]Isolamento de recursos e ajuste de performance por serviço [cite: 1078]
  - [cite_start]Rollback de componentes individuais em caso de problemas [cite: 1078]

### Segmentação de Rede

  - [cite_start]**Princípio DMZ**: Contêiner frontend não tem acesso direto de escrita ao banco de dados [cite: 1078]
  - [cite_start]**Firewall-First**: Todas as requisições externas passam pelo OPNSense [cite: 1078]
  - [cite_start]**LAN Interna**: Rede privada dedicada para comunicação serviço-a-serviço [cite: 1078]
  - [cite_start]**VLAN de Gerenciamento**: Rede separada para acessos administrativos [cite: 1078]

### Recursos de Segurança

  - [cite_start]**Firewall Proxmox**: Habilitado no nível do host [cite: 1078]
  - [cite_start]**OPNSense**: Inspeção de Pacotes Stateful, regras NAT [cite: 1078]
  - [cite_start]**Caddy TLS**: Certificados Let's Encrypt automáticos [cite: 1078]
  - [cite_start]**Admin VPN-Only**: Acesso administrativo somente via VPN [cite: 1078]

## Estratégia de Backup

[cite_start]**Proxmox Backup Server (PBS)** cria snapshots incrementais de todos os contêineres e VMs: [cite: 1079]

  - [cite_start]**Backups Diários**: Componentes críticos (BD, Frontend, Firewall) [cite: 1079]
  - [cite_start]**Backups Semanais**: Middleware GDI (GeoServer, MapProxy) [cite: 1079]
  - [cite_start]**Backups Mensais**: Servidor de tiles (grandes volumes de dados) [cite: 1079]
  - [cite_start]**Retenção Automática**: Políticas PBS para backups antigos [cite: 1079]

[cite_start]Detalhes: [Estratégia de Backup](https://www.google.com/search?q=./backup-strategie.md) [cite: 1079]

## Documentação Adicional

  - [Detalhes Host Proxmox](https://www.google.com/search?q=./proxmox-host.md)
  - [Contêiner PostgreSQL/PostGIS](https://www.google.com/search?q=./lxc-postgresql.md)
  - [Contêiner GeoServer](https://www.google.com/search?q=./lxc-geoserver.md)
  - [Contêiner MapProxy](https://www.google.com/search?q=./lxc-mapproxy.md)
  - [Contêiner Frontend](https://www.google.com/search?q=./lxc-frontend.md)
  - [Firewall OPNSense](https://www.google.com/search?q=./vm-opnsense.md)
  - [Servidor de Tiles OSM](https://www.google.com/search?q=./vm-osm-tiler.md)
  - [Arquitetura de Rede](https://www.google.com/search?q=./netzwerk-architektur.md)
  - [Integração Ory IAM (planejada)](https://www.google.com/search?q=./lxc-ory-iam.md)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.