---
title: PostgreSQL/PostGIS 容器
description: 带有空间扩展的地理数据库服务器
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(翻译: AI)"
  reviewDate: null
---

# LXC：PostgreSQL/PostGIS

## 容器信息

```
类型：LXC（根据设置可能为特权/非特权）
操作系统：Debian 13 (trixie)
主机名：postgresql（可自定义）
状态：正在运行

资源：
  内存：2 GB
  磁盘：15 GB（可动态扩展）
  CPU 份额：标准 (1024)
```

## 安装的软件

### PostgreSQL

```
版本：18.x（Debian 官方仓库）
服务：postgresql.service (systemd)
Socket：UNIX + TCP/IP
访问：内部 LAN（不公开暴露）
```

### PostGIS

```
版本：3.6.x
扩展：在生产数据库中启用
特性： 
  - 空间几何类型 (Point, LineString, Polygon)
  - 空间索引 (GiST, SP-GiST)
  - 坐标转换 (SRID 支持)
  - 拓扑支持
```

## 数据库

| Database | PostGIS | 用途 |
|---|---|---|
| `postgres` | ❌ | 系统数据库 (标准) |
| `data-dna` | ✅ | **p2d2 的生产数据库** |

::: tip 启用 PostGIS 扩展

```
-- 在新数据库中
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- 验证
SELECT PostGIS_Full_Version();
```

:::

## 网络访问

```
监听： 
  - TCP 端口 <STANDARD_PG_PORT> (所有接口)
  - UNIX Socket：/var/run/postgresql/

pg_hba.conf：
  - localhost：Trust (用于维护)
  - 内部 LAN：md5 密码认证
  - WAN：DENY (由防火墙阻止)
```

**连接字符串** (用于同一 LAN 中的应用程序):

```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Systemd 服务

```
# 检查服务状态
systemctl status postgresql

# 重启服务（会有停机时间）
systemctl restart postgresql

# 查看日志
journalctl -u postgresql -f --no-pager

# 启用服务（开机自启）
systemctl enable postgresql
```

## PostGIS 功能

### 空间查询

```
-- 点在多边形内测试
SELECT name FROM kommunen 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- 距离计算 (米)
SELECT ST_Distance(
  ST_Transform(geom1, 3857),
  ST_Transform(geom2, 3857)
);

-- 缓冲区 (几何图形周围 500 米缓冲区)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### 性能优化

```
-- 创建空间索引
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- 更新统计信息
ANALYZE kommunen;

-- Vacuum 清理
VACUUM ANALYZE kommunen;
```

## 备份策略

### PBS 快照 (容器级别)

  - **计划**：每日夜间
  - **保留**：14 天
  - **类型**：LVM-Thin 快照 (一致)

### SQL Dumps (数据库级别)

```
# 手动备份
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# 通过 Cronjob 自动化
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# 删除旧备份 (>30 天)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning 备份互补性
PBS 快照可快速恢复容器。SQL Dumps 允许选择性表还原，并且可在 PostgreSQL 版本之间移植。
:::

## 性能调优

### 推荐的 postgresql.conf 调整

```
# 内存 (适用于 2GB RAM 容器)
shared_buffers = 512MB            # 25% RAM
effective_cache_size = 1536MB     # 75% RAM
work_mem = 16MB                   # 每个查询的内存
maintenance_work_mem = 128MB      # 用于 VACUUM/CREATE INDEX

# PostGIS 优化
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # SSD 优化 (而非 4.0 适用于 HDD)
```

### 查询分析

```
-- 识别慢查询 (扩展 pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 秒
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 监控

```
-- 活动连接
SELECT count(*), state FROM pg_stat_activity 
GROUP BY state;

-- 数据库大小
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- 最大的表
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## 故障排除

### 容器无法启动

```
# 在 Proxmox 主机上
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # 最新启动日志
```

### PostgreSQL 无法启动

```
# 在容器内
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# 测试配置文件
su - postgres -c "postgres -C config_file"
```

### 连接问题

```
# PostgreSQL 是否在监听?
ss -tlnp | grep postgres

# 防火墙规则是否存在?
iptables -L -n | grep <PORT>

# 检查 pg_hba.conf
cat /etc/postgresql/*/main/pg_hba.conf
```

## Ory IAM 扩展 (计划中)

对于计划中的 Ory 集成，需要额外的数据库：

```
-- Ory-Kratos 数据库
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Ory-Hydra 数据库
CREATE USER ory_hydra WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

详情: [Ory IAM 集成](https://www.google.com/search?q=./lxc-ory-iam.md)

## 最佳实践

✅ **应做**:

  - 定期 VACUUM ANALYZE 以提高性能
  - 在几何列上创建空间索引
  - 为高负载使用连接池 (pgBouncer)
  - 使用具有最小权限的单独用户帐户

❌ **不应做**:

  - 以 root 用户身份运行 PostgreSQL
  - 使用默认密码
  - 将数据库直接暴露于 WAN
  - 存储大型几何图形而不进行泛化

## 参考资料

  - [PostgreSQL 18 文档](https://www.postgresql.org/docs/18/)
  - [PostGIS 3.6 手册](https://postgis.net/docs/manual-3.6/)
  - [性能优化指南](https://wiki.postgresql.org/wiki/Performance_Optimization)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。