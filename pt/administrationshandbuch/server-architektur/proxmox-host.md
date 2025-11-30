---
title: Host Proxmox
description: Plataforma de virtualização para infraestrutura p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# Host Proxmox

## Especificações de Hardware

```
CPU: Intel Core i5 13ª Geração
  - Núcleos: 14 Núcleos Físicos
  - Threads: 20 CPUs Lógicas
  - Recursos: AVX2, AES-NI, Virtualização (VT-x/VT-d)

RAM: 64 GB DDR4
Swap: 6 GB

Tipo de Sistema: Servidor Dedicado (Bare Metal)
```

## Pilha de Software

```
Virtualização: Proxmox VE 9.x (Estável atual)
Kernel: Linux 6.x (otimizado PVE)
QEMU/KVM: Versão 9.x
Motor de Contêiner: LXC (Linux Containers)
```

::: tip Por que Proxmox?

  - **Open Source**: Gratuito, impulsionado pela comunidade
  - **Pronto para Empresas**: Pronto para produção sem custos de licença
  - **Híbrido**: Combina VMs (KVM) e contêineres (LXC)
  - **Integração de Backup**: Proxmox Backup Server (PBS) nativamente integrado
    :::

## Arquitetura de Armazenamento

### Pool LVM-Thin (VMs-Contêineres)

```
Tipo: Volume LVM-Thin
Uso: Sistemas de arquivos raiz para LXC e discos VM
Vantagem: Snapshots, Thin Provisioning, Eficiência
```

### Armazenamento de Diretório Local

```
Tipo: Diretório
Uso: Templates, ISOs, backups temporários
Caminho: /var/lib/vz
```

### Proxmox Backup Server (PBS)

```
Tipo: Armazenamento de backup com desduplicação
Uso: Backups de produção de todos os VMs/LXCs
Recursos: Snapshots incrementais, criptografia, verificação
```

::: warning Capacidade de Backup
O armazenamento PBS deve ser verificado regularmente quanto à utilização. Se >80%, recomendação: planejar expansão.
:::

## Configuração de Rede

```
Pontes:
  - vmbr0: Ponte WAN (voltada para Internet)
  - vmbr1: Ponte LAN (Rede de serviço interna)
  - vmbr2: VLAN de Gerenciamento (Acesso admin)

VPN: WireGuard para administração remota segura
```

Arquitetura de rede detalhada: [Documentação de Rede](https://www.google.com/search?q=./netzwerk-architektur.md)

## Configuração de Segurança

### Firewall Proxmox

```
Status: Habilitado no nível do host
Política: Default DROP (Abordagem de lista branca)
Gerenciamento de Regras: Via Web UI ou pvesh CLI
```

### Controle de Acesso

  - **Web UI**: Somente HTTPS, Porta 8006
  - **SSH**: Somente via VLAN de Gerenciamento ou VPN
  - **API**: Autenticação baseada em token
  - **Atualizações**: Patches de segurança automáticos (opcional)

## Instâncias em Execução

### Contêineres LXC (Leves)

| Nome | Status | Papel | Recursos |
|------|--------|-------|------------|
| postgresql | ✅ em execução | Geodatabase | 2 GB RAM, 15 GB Disco |
| geoserver | ✅ em execução | Servidor WFS/WMS | 6 GB RAM, 12 GB Disco |
| mapproxy | ✅ em execução | Proxy Tiles | 4 GB RAM, 38 GB Disco |
| frontend | ✅ em execução | Frontend Web | 4 GB RAM, 25 GB Disco |
| zabbix | ⏸ parado | Monitoramento (opcional) | 2 GB RAM, 10 GB Disco |

### Máquinas Virtuais (VMs Completas)

| Nome | Status | Papel | Recursos |
|------|--------|-------|------------|
| OPNSense | ✅ em execução | Firewall + Proxy | 4 GB RAM, 25 GB Disco |
| osm-tiler | ✅ em execução | Renderização Tiles | 6 GB RAM, 65 GB Disco |

## Ferramentas de Gerenciamento

### Administração CLI

```
# Gerenciamento Contêiner
pct list                    # Listar contêineres
pct start <VMID>           # Iniciar contêiner
pct exec <VMID> -- bash    # Shell no contêiner

# Gerenciamento VM
qm list                     # Listar VMs
qm start <VMID>             # Iniciar VM
qm snapshot <VMID> <NAME>  # Criar snapshot

# Gerenciamento Backup
pvesm list <STORAGE>       # Listar backups
vzdump <VMID>              # Backup manual
```

### Web UI

  - **URL**: `https://<PROXMOX_HOST>:8006`
  - **Recursos**:
      - Visão geral gráfica de recursos
      - Acesso ao console de VMs/LXCs
      - Agendamento de tarefas de backup
      - Editor de regras de firewall

## Lista de Verificação de Manutenção

**Semanal**:

  - [ ] Verificar capacidade PBS
  - [ ] Verificar logs de backup por erros

**Mensal**:

  - [ ] Atualizações de kernel via `apt update && apt upgrade`
  - [ ] Verificar atualizações de templates de contêiner
  - [ ] Realizar teste de restauração de um backup

**Trimestral**:

  - [ ] Revisar regras de firewall
  - [ ] Analisar utilização de recursos
  - [ ] Testar plano de recuperação de desastres

## Referências

  - [Documentação Proxmox VE](https://pve.proxmox.com/pve-docs/)
  - [LXC vs. KVM: Quando usar qual?](https://pve.proxmox.com/wiki/Linux_Container)
  - [Proxmox Backup Server](https://pbs.proxmox.com/docs/)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.