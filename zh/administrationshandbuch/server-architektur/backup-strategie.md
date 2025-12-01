---
title: 备份策略
description: 数据备份和灾难恢复
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# 备份策略

## Proxmox Backup Server (PBS)

### 存储配置

```
存储名称: p2d2-pbs
类型: Proxmox Backup Server (去重)
内容: Backups (VMs + LXCs)
状态: Active, Shared
去重: Enabled (基于块)
加密: 可选配置
```

::: tip PBS 优势

  - **增量备份**: 仅备份自上次备份以来的更改
  - **去重**: 重复数据仅存储一次
  - **验证**: 自动备份完整性检查
  - **快速恢复**: 直接访问快照
    :::

### 备份计划 (通用)

**备份作业** (通过 Proxmox Web-UI 配置):

| 组件 | 计划 | 保留 | 类型 |
|---|---|---|---|
| OPNSense (防火墙) | 每日 | 7 天 | Snapshot |
| PostgreSQL/PostGIS | 每日 | 14 天 | Snapshot |
| GeoServer | 每周 | 4 周 | Snapshot |
| MapProxy | 每周 | 4 周 | Snapshot |
| OSM-Tiler | 每月 | 3 个月 | Snapshot |
| Frontend (AstroJS) | 每日 | 7 天 | Snapshot |

::: warning 备份窗口
备份应在**非高峰时段**运行 (通常在夜间)。备份时间**未具体记录** (安全最佳实践)。
:::

### 备份类型

#### 容器快照 (LXC)

```
# 创建手动备份
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# 检查备份状态
pvesm list p2d2-pbs | grep "ct-<VMID>"

# 从备份还原容器
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**LVM-Thin 快照优势**:

  - 一致性 (文件系统级别)
  - 快速 (仅元数据复制)
  - 备份期间无服务停机

#### VM 备份 (QEMU/KVM)

```
# VM 备份 (带挂起以保证一致性)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# 还原 VM
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### 保留策略

```
每日备份: 
  - 保留: 7 天
  - 服务: PostgreSQL, Frontend, Firewall

每周备份:
  - 保留: 4 周
  - 服务: GeoServer, MapProxy

每月备份:
  - 保留: 3 个月
  - 服务: OSM-Tiler (大数据量)

自动清理: PBS Prune 作业 (每日)
```

## 数据库备份 (PBS 之外的额外备份)

### PostgreSQL pg_dump

```
# SQL-Dump (在 PostgreSQL 容器上)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# 通过 Cron 自动化
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# 删除旧备份 (>30 天)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**为什么需要额外备份?**:

  - ✅ 选择性还原单个表
  - ✅ 可在不同 PostgreSQL 版本间移植
  - ✅ 备份文件更小 (压缩后)
  - ✅ 无需还原容器即可导入测试环境

### PostGIS 自定义格式

```
# 自定义格式 (带二进制对象)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# 还原 (可选择性)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## 配置备份

### Caddy (OPNSense)

```
# 备份 Caddyfile + 自定义配置
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/Caddyfile \
  /usr/local/etc/caddy/caddy.d/

# TLS 证书 (通过 PBS VM 备份自动备份)
```

### Systemd 服务 (Frontend)

```
# 备份所有 p2d2 服务
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/systemd/system/webhook-server.service
```

## 灾难恢复 (Disaster Recovery)

### 主机完全故障

**场景**: Proxmox 服务器硬件故障

**恢复步骤**:

1.  **设置新 Proxmox 主机**

    ```
    # 从 ISO 安装 Proxmox VE
    # 还原网络配置 (Bridges)
    ```

2.  **挂载 PBS 存储**

    ```
    # 在 Proxmox Web-UI: Datacenter → Storage → Add → PBS
    # PBS 服务器: <PBS_IP_OR_HOSTNAME>
    # Datastore: p2d2-backups
    ```

3.  **还原容器/VMs**

    ```
    # 通过 Web-UI: Storage → p2d2-pbs → Content → Restore
    # 或 CLI:
    pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
    qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
    ```

4.  **验证服务**

    ```
    # PostgreSQL
    pct exec <PG_VMID> -- systemctl status postgresql

    # 数据库完整性
    pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
    ```

### 单个容器故障

**场景**: PostgreSQL 容器损坏

```
# 停止容器
pct stop <PG_VMID>

# 从备份还原
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<DATE>.tar.zst --force

# 启动容器
pct start <PG_VMID>

# 检查服务状态
pct exec <PG_VMID> -- systemctl status postgresql
```

### 数据库损坏

**场景**: PostgreSQL 数据损坏, 但容器 OK

```
# 删除数据库
sudo -u postgres dropdb data-dna

# 重建
sudo -u postgres createdb data-dna

# 还原 SQL-Dump
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# 重新启用 PostGIS 扩展
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## 异地备份 (Off-Site)

目前, 所有实例都在本地 Proxmox-Backup 中备份。备份后, 备份将同步到位于德国的远程 PBS。

## 备份验证

所有备份每周在两个 PBS 上验证一次。

### 每月还原测试 (计划中)

```
# 从备份创建测试容器
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst \
  --hostname postgresql-test \
  --storage local-lvm

# 检查服务启动
pct start 999
pct exec 999 -- systemctl status postgresql

# 测试数据库访问
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# 清理
pct stop 999
pct destroy 999
```

### 检查数据库完整性

```
-- PostGIS 功能
SELECT PostGIS_Full_Version();

-- 记录数 (合理性检查)
SELECT 
  'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT 
  'geometries' AS table_name, COUNT(*) FROM geometries;

-- 几何有效性
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## 备份监控

### Proxmox 任务日志

```
# 显示备份日志
cat /var/log/vzdump.log | grep "ERROR\|WARN"

# 检查 PBS 状态
proxmox-backup-manager tasks list

# 存储使用情况
pvesm status p2d2-pbs
```

### 警报配置

```
# 备份失败的电子邮件通知
# 在 Proxmox Web-UI: Datacenter → Notifications

# 自定义监控脚本
#!/bin/bash
# /etc/cron.hourly/backup-check
LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## 最佳实践

✅ **应做**:

  - 定期执行还原测试
  - 监控备份日志并分析错误
  - 根据业务需求调整保留策略
  - 记录配置更改
  - 为备份作业设置监控

❌ **不应做**:

  - 假设备份在没有验证的情况下正常工作
  - 仅在一种介质上备份关键数据
  - 忽略备份失败
  - 没有灾难恢复计划
  - 不监控备份容量

## 参考资料

  - [Proxmox Backup Server 文档](https://pbs.proxmox.com/docs/)
  - [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
  - [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
  - [3-2-1 备份规则](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。