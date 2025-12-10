---
title: Contêiner PostgreSQL/PostGIS
description: Servidor de geodatabase com extensões espaciais
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Tradução: IA)"
  reviewDate: null
---

# LXC: PostgreSQL/PostGIS

## Informações do Contêiner

```
Tipo: LXC (privilegiado/não privilegiado dependendo da configuração)
SO: Debian 13 (trixie)
Hostname: postgresql (personalizável)
Status: em execução

Recursos:
  RAM: 2 GB
  Disco: 15 GB (expansível dinamicamente)
  CPU Shares: Padrão (1024)
```

## Software Instalado

### PostgreSQL

```
Versão: 18.x (Repositório Oficial Debian)
Serviço: postgresql.service (systemd)
Socket: UNIX + TCP/IP
Acesso: LAN interna (não exposto publicamente)
```

### PostGIS

```
Versão: 3.6.x
Extensão: Habilitada no banco de dados de produção
Recursos: 
  - Tipos de geometria espacial (Point, LineString, Polygon)
  - Índices espaciais (GiST, SP-GiST)
  - Transformações de coordenadas (Suporte SRID)
  - Suporte a topologia
```

## Bancos de Dados

| Database | PostGIS | Propósito |
|---|---|---|
| `postgres` | ❌ | Banco de dados sistema (Padrão) |
| `data-dna` | ✅ | **BD de produção para p2d2** |

::: tip Habilitar extensão PostGIS

```
-- Em novo banco de dados
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Verificação
SELECT PostGIS_Full_Version();
```

:::

## Acesso à Rede

```
Escutando: 
  - Porta TCP <STANDARD_PG_PORT> (todas as interfaces)
  - Socket UNIX: /var/run/postgresql/

pg_hba.conf:
  - localhost: Trust (para manutenção)
  - LAN interna: Autenticação por senha md5
  - WAN: NEGAR (bloqueado por firewall)
```

**String de Conexão** (para aplicações na mesma LAN):

```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Serviço Systemd

```
# Verificar status do serviço
systemctl status postgresql

# Reiniciar serviço (com downtime)
systemctl restart postgresql

# Visualizar logs
journalctl -u postgresql -f --no-pager

# Habilitar serviço (autostart)
systemctl enable postgresql
```

## Funções PostGIS

### Consultas Espaciais

```
-- Teste Ponto-em-Polígono
SELECT name FROM kommunen 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- Cálculo de distância (em metros)
SELECT ST_Distance(
  ST_Transform(geom1, 3857),
  ST_Transform(geom2, 3857)
);

-- Buffer (buffer de 500m ao redor da geometria)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### Otimização de Performance

```
-- Criar índice espacial
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- Atualizar estatísticas
ANALYZE kommunen;

-- Vacuum para limpeza
VACUUM ANALYZE kommunen;
```

## Estratégia de Backup

### Snapshot PBS (Nível Contêiner)

  - **Agendamento**: Diário noturno
  - **Retenção**: 14 dias
  - **Tipo**: Snapshot LVM-Thin (consistente)

### Dumps SQL (Nível Banco de Dados)

```
# Backup manual
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automação via Cronjob
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# Excluir backups antigos (>30 dias)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning Complementaridade de Backups
Snapshots PBS são rápidos para restauração de contêiner. Dumps SQL permitem restauração seletiva de tabelas e são portáteis entre versões do PostgreSQL.
:::

## Ajuste de Performance

### Ajustes recomendados do postgresql.conf

```
# Memória (para contêiner de 2GB RAM)
shared_buffers = 512MB            # 25% da RAM
effective_cache_size = 1536MB     # 75% da RAM
work_mem = 16MB                   # Memória por consulta
maintenance_work_mem = 128MB      # Para VACUUM/CREATE INDEX

# Otimizações PostGIS
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # Otimizado SSD (em vez de 4.0 para HDD)
```

### Análise de Consultas

```
-- Identificar consultas lentas (Extensão pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 segundo
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitoramento

```
-- Conexões ativas
SELECT count(*), state FROM pg_stat_activity 
GROUP BY state;

-- Tamanho do banco de dados
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- Maiores tabelas
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Solução de Problemas

### Contêiner não inicia

```
# No host Proxmox
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # Últimos logs de boot
```

### PostgreSQL não inicia

```
# No contêiner
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# Testar arquivo de configuração
su - postgres -c "postgres -C config_file"
```

### Problemas de Conexão

```
# PostgreSQL está escutando?
ss -tlnp | grep postgres

# Regra de firewall existe?
iptables -L -n | grep <PORT>

# Verificar pg_hba.conf
cat /etc/postgresql/*/main/pg_hba.conf
```

## Extensão para Ory IAM (planejada)

Para a integração planejada do Ory, bancos de dados adicionais são necessários:

```
-- Banco de Dados Ory-Kratos
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Banco de Dados Ory-Hydra
CREATE USER ory_hydra WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

Detalhes: [Integração Ory IAM](https://www.google.com/search?q=./lxc-ory-iam.md)

## Melhores Práticas

✅ **Fazer**:

  - VACUUM ANALYZE regulares para performance
  - Índices espaciais em colunas de geometria
  - Connection Pooling (pgBouncer) para alta carga
  - Contas de usuário separadas com privilégios mínimos

❌ **Não Fazer**:

  - Executar PostgreSQL como root
  - Usar senhas padrão
  - Exposição direta do banco de dados à WAN
  - Armazenar geometrias grandes sem generalização

## Referências

  - [Documentação PostgreSQL 18](https://www.postgresql.org/docs/18/)
  - [Manual PostGIS 3.6](https://postgis.net/docs/manual-3.6/)
  - [Guia de Otimização de Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.