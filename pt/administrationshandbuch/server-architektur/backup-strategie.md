---
title: Estratégia de Backup
description: Backup de dados e recuperação de desastres
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Estratégia de Backup

## Proxmox Backup Server (PBS)

### Configuração de Armazenamento

```
Nome do Armazenamento: p2d2-pbs
Tipo: Proxmox Backup Server (deduplicando)
Conteúdo: Backups (VMs + LXCs)
Status: Ativo, Compartilhado
Deduplicação: Habilitada (baseada em chunks)
Criptografia: Configurável opcionalmente
```

::: tip Vantagens do PBS

  - **Backups Incrementais**: Apenas alterações desde o último backup
  - **Deduplicação**: Dados duplicados armazenados apenas uma vez
  - **Verificação**: Verificação automática da integridade do backup
  - **Restaurações Rápidas**: Acesso direto aos snapshots
    :::

### Agendamento de Backup (Generalizado)

**Tarefas de Backup** (configuradas via Proxmox Web-UI):

| Componente | Agendamento | Retenção | Tipo |
|---|---|---|---|
| OPNSense (Firewall) | Diário | 7 dias | Snapshot |
| PostgreSQL/PostGIS | Diário | 14 dias | Snapshot |
| GeoServer | Semanal | 4 semanas | Snapshot |
| MapProxy | Semanal | 4 semanas | Snapshot |
| OSM-Tiler | Mensal | 3 meses | Snapshot |
| Frontend (AstroJS) | Diário | 7 dias | Snapshot |

::: warning Janela de Backup
Backups devem ocorrer **fora do horário de pico** (tipicamente à noite). Horários de backup **não são documentados especificamente** (boa prática de segurança).
:::

### Tipos de Backup

#### Snapshots de Contêiner (LXC)

```
# Criar backup manual
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# Verificar status do backup
pvesm list p2d2-pbs | grep "ct-<VMID>"

# Restaurar contêiner do backup
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**Vantagens dos Snapshots LVM-Thin**:

  - Consistentes (nível de sistema de arquivos)
  - Rápidos (apenas cópia de metadados)
  - Sem downtime do serviço durante o backup

#### Backups de VM (QEMU/KVM)

```
# Backup de VM (com suspensão para consistência)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# Restaurar VM
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### Política de Retenção

```
Backups Diários: 
  - Retenção: 7 dias
  - Serviços: PostgreSQL, Frontend, Firewall

Backups Semanais:
  - Retenção: 4 semanas
  - Serviços: GeoServer, MapProxy

Backups Mensais:
  - Retenção: 3 meses
  - Serviços: OSM-Tiler (grandes volumes de dados)

Limpeza Automática: Tarefa Prune do PBS (diária)
```

## Backups de Banco de Dados (Adicional ao PBS)

### PostgreSQL pg_dump

```
# SQL-Dump (no contêiner PostgreSQL)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automação via Cron
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# Excluir backups antigos (>30 dias)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**Por que adicional ao PBS?**:

  - ✅ Restauração seletiva de tabelas individuais
  - ✅ Portátil entre versões do PostgreSQL
  - ✅ Tamanho de backup menor (comprimido)
  - ✅ Importação para ambientes de teste sem restauração de contêiner

### Formato Personalizado PostGIS

```
# Formato personalizado (com objetos binários)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# Restauração (seletiva possível)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## Backups de Configuração

### Caddy (OPNSense)

```
# Backup Caddyfile + Configs personalizadas
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/Caddyfile \
  /usr/local/etc/caddy/caddy.d/

# Certificados TLS (automaticamente sauvegardados via backup VM PBS)
```

### Serviços Systemd (Frontend)

```
# Backup de todos os serviços p2d2
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/systemd/system/webhook-server.service
```

## Recuperação de Desastres (Disaster Recovery)

### Falha Total do Host

**Cenário**: Falha de hardware do servidor Proxmox

**Etapas de Recuperação**:

1.  **Configurar novo host Proxmox**

    ```
    # Instalar Proxmox VE a partir da ISO
    # Restaurar configuração de rede (Bridges)
    ```

2.  **Montar Armazenamento PBS**

    ```
    # Na Proxmox Web-UI: Datacenter → Storage → Add → PBS
    # Servidor PBS: <PBS_IP_OR_HOSTNAME>
    # Datastore: p2d2-backups
    ```

3.  **Restaurar Contêineres/VMs**

    ```
    # Via Web-UI: Storage → p2d2-pbs → Content → Restore
    # Ou CLI:
    pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
    qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
    ```

4.  **Verificar Serviços**

    ```
    # PostgreSQL
    pct exec <PG_VMID> -- systemctl status postgresql

    # Integridade do banco de dados
    pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
    ```

### Falha de Contêiner Individual

**Cenário**: Contêiner PostgreSQL corrompido

```
# Parar contêiner
pct stop <PG_VMID>

# Restaurar do backup
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<DATA>.tar.zst --force

# Iniciar contêiner
pct start <PG_VMID>

# Verificar status do serviço
pct exec <PG_VMID> -- systemctl status postgresql
```

### Corrupção de Banco de Dados

**Cenário**: Dados PostgreSQL corrompidos, mas contêiner OK

```
# Dropar banco de dados
sudo -u postgres dropdb data-dna

# Recriar
sudo -u postgres createdb data-dna

# Restaurar SQL-Dump
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# Reativar extensão PostGIS
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## Backups Off-Site

Atualmente, todas as instâncias são sauvegardadas no Proxmox-Backup local. Após o backup, os backups são sincronizados com um PBS remoto localizado na Alemanha.

## Verificação de Backup

Todos os backups são verificados uma vez por semana em ambos os PBS.

### Teste de Restauração Mensual (planejado)

```
# Criar contêiner de teste a partir do backup
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst \
  --hostname postgresql-test \
  --storage local-lvm

# Verificar início do serviço
pct start 999
pct exec 999 -- systemctl status postgresql

# Testar acesso ao banco de dados
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# Limpeza
pct stop 999
pct destroy 999
```

### Verificar Integridade do Banco de Dados

```
-- Funcionalidade PostGIS
SELECT PostGIS_Full_Version();

-- Número de registros (verificação de plausibilidade)
SELECT 
  'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT 
  'geometries' AS table_name, COUNT(*) FROM geometries;

-- Validade da geometria
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## Monitoramento de Backup

### Logs de Tarefas Proxmox

```
# Exibir logs de backup
cat /var/log/vzdump.log | grep "ERROR\|WARN"

# Verificar status do PBS
proxmox-backup-manager tasks list

# Uso de armazenamento
pvesm status p2d2-pbs
```

### Configuração de Alertas

```
# Notificações por e-mail para falhas de backup
# Na Proxmox Web-UI: Datacenter → Notifications

# Script de monitoramento personalizado
#!/bin/bash
# /etc/cron.hourly/backup-check
LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## Melhores Práticas

✅ **Fazer**:

  - Realizar testes de restauração regulares
  - Monitorar logs de backup e analisar erros
  - Adaptar políticas de retenção às necessidades de negócios
  - Documentar alterações de configuração
  - Configurar monitoramento para tarefas de backup

❌ **Não Fazer**:

  - Assumir que backups funcionam sem verificação
  - Fazer backup de dados críticos em apenas uma mídia
  - Ignorar falhas de backup
  - Operar sem um plano de recuperação de desastres
  - Não monitorar a capacidade de backup

## Referências

  - [Documentação Proxmox Backup Server](https://pbs.proxmox.com/docs/)
  - [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
  - [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
  - [Regra de Backup 3-2-1](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.