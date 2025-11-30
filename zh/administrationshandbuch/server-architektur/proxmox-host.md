---
title: Proxmox 主机
description: p2d2 基础设施的虚拟化平台
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# Proxmox 主机

## 硬件规格

```
CPU：Intel Core i5 第 13 代
  - 核心：14 个物理核心
  - 线程：20 个逻辑 CPU
  - 特性：AVX2, AES-NI, 虚拟化 (VT-x/VT-d)

内存：64 GB DDR4
交换空间：6 GB

系统类型：专用服务器 (Bare Metal)
```

## 软件栈

```
虚拟化：Proxmox VE 9.x (当前稳定版)
内核：Linux 6.x (PVE 优化)
QEMU/KVM：版本 9.x
容器引擎：LXC (Linux Containers)
```

::: tip 为什么选择 Proxmox？

  - **开源**：免费，社区驱动
  - **企业级**：无需许可费用即可用于生产
  - **混合**：结合 VMs (KVM) 和容器 (LXC)
  - **备份集成**：原生集成 Proxmox Backup Server (PBS)
    :::

## 存储架构

### LVM-Thin 池 (VMs-容器)

```
类型：LVM-Thin 卷
用途：LXC 和 VM 磁盘的根文件系统
优势：快照, 精简配置, 高效
```

### 本地目录存储

```
类型：目录
用途：模板, ISOs, 临时备份
路径：/var/lib/vz
```

### Proxmox Backup Server (PBS)

```
类型：去重备份存储
用途：所有 VMs/LXCs 的生产备份
特性：增量快照, 加密, 验证
```

::: warning 备份容量
应定期检查 PBS 存储利用率。如果 >80%，建议：规划扩展。
:::

## 网络配置

```
网桥：
  - vmbr0：WAN 网桥 (面向 Internet)
  - vmbr1：LAN 网桥 (内部服务网络)
  - vmbr2：管理 VLAN (管理员访问)

VPN：WireGuard 用于安全远程管理
```

详细网络架构：[网络文档](https://www.google.com/search?q=./netzwerk-architektur.md)

## 安全配置

### Proxmox 防火墙

```
状态：在主机级别启用
策略：默认 DROP (白名单方法)
规则管理：通过 Web UI 或 pvesh CLI
```

### 访问控制

  - **Web UI**：仅 HTTPS, 端口 8006
  - **SSH**：仅通过管理 VLAN 或 VPN
  - **API**：基于令牌的身份验证
  - **更新**：自动安全补丁 (可选)

## 运行中的实例

### LXC 容器 (轻量级)

| 名称 | 状态 | 角色 | 资源 |
|------|--------|-------|------------|
| postgresql | ✅ 运行中 | 地理数据库 | 2 GB RAM, 15 GB 磁盘 |
| geoserver | ✅ 运行中 | WFS/WMS 服务器 | 6 GB RAM, 12 GB 磁盘 |
| mapproxy | ✅ 运行中 | 瓦片代理 | 4 GB RAM, 38 GB 磁盘 |
| frontend | ✅ 运行中 | Web 前端 | 4 GB RAM, 25 GB 磁盘 |
| zabbix | ⏸ 已停止 | 监控 (可选) | 2 GB RAM, 10 GB 磁盘 |

### 虚拟机 (完整 VMs)

| 名称 | 状态 | 角色 | 资源 |
|------|--------|-------|------------|
| OPNSense | ✅ 运行中 | 防火墙 + 代理 | 4 GB RAM, 25 GB 磁盘 |
| osm-tiler | ✅ 运行中 | 瓦片渲染 | 6 GB RAM, 65 GB 磁盘 |

## 管理工具

### CLI 管理

```
# 容器管理
pct list                    # 列出容器
pct start <VMID>           # 启动容器
pct exec <VMID> -- bash    # 进入容器 Shell

# VM 管理
qm list                     # 列出 VMs
qm start <VMID>             # 启动 VM
qm snapshot <VMID> <NAME>  # 创建快照

# 备份管理
pvesm list <STORAGE>       # 列出备份
vzdump <VMID>              # 手动备份
```

### Web UI

  - **URL**：`https://<PROXMOX_HOST>:8006`
  - **特性**：
      - 图形化资源概览
      - VMs/LXCs 的控制台访问
      - 备份作业调度
      - 防火墙规则编辑器

## 维护清单

**每周**：

  - [ ] 检查 PBS 容量
  - [ ] 检查备份日志是否有错误

**每月**：

  - [ ] 通过 `apt update && apt upgrade` 更新内核
  - [ ] 检查容器模板更新
  - [ ] 执行一次备份恢复测试

**每季度**：

  - [ ] 审查防火墙规则
  - [ ] 分析资源利用率
  - [ ] 测试灾难恢复计划

## 参考资料

  - [Proxmox VE 文档](https://pve.proxmox.com/pve-docs/)
  - [LXC vs. KVM：何时使用哪个？](https://pve.proxmox.com/wiki/Linux_Container)
  - [Proxmox Backup Server](https://pbs.proxmox.com/docs/)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。