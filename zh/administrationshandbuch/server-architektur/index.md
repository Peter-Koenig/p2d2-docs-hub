---
title: 服务器架构
description: p2d2 地理数据基础设施概览
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# 服务器架构

[cite_start]p2d2 基础设施基于 **Proxmox VE 9.x**，并采用 **LXC 容器**（用于微服务）和 **VMs**（用于复杂网络和瓦片服务器任务）的混合架构。 [cite: 1070] [cite_start]虚拟化运行在现代 Intel 硬件（第 13 代，14 核，64 GB RAM）上。 [cite: 1070]

## 架构概览

TODO：插入图表

## 组件概览

| 组件 | 类型 | 角色 | 内存 | 磁盘 | 操作系统 |
|---|---|---|---|---|---|
| **OPNSense** | VM | 防火墙 + 反向代理 | 4 GB | 25 GB | [cite_start]FreeBSD 14.x | [cite: 1072]
| **PostgreSQL** | LXC | 地理数据库 + PostGIS | 2 GB | 15 GB | [cite_start]Debian 13 | [cite: 1073]
| **GeoServer** | LXC | WFS/WMS 服务器 | 6 GB | 12 GB | [cite_start]Debian 13 | [cite: 1074]
| **MapProxy** | LXC | 瓦片缓存 + 代理 | 4 GB | 38 GB | [cite_start]Debian 13 | [cite: 1075]
| **OSM-Tiler** | VM | 瓦片渲染 | 6 GB | 65 GB | [cite_start]Debian 13 | [cite: 1075]
| **Frontend** | LXC | AstroJS + VitePress | 4 GB | 25 GB | [cite_start]Debian 13 | [cite: 1076]
| **Ory IAM** *(计划中)* | LXC | 身份管理 | 2 GB | 10 GB | [cite_start]Debian 13 | [cite: 1077]

## 设计原则

### 服务隔离

[cite_start]每个服务都在其自己的 LXC 容器或 VM 中运行。 [cite: 1078] 这使得：

  - [cite_start]独立更新而无需停止其他服务 [cite: 1078]
  - [cite_start]每个服务的资源隔离和性能调优 [cite: 1078]
  - [cite_start]出现问题时可回滚单个组件 [cite: 1078]

### 网络分段

  - [cite_start]**DMZ 原则**：前端容器没有直接的数据库写访问权限 [cite: 1078]
  - [cite_start]**防火墙优先**：所有外部请求都通过 OPNSense [cite: 1078]
  - [cite_start]**内部 LAN**：用于服务间通信的专用私有网络 [cite: 1078]
  - [cite_start]**管理 VLAN**：用于管理访问的独立网络 [cite: 1078]

### 安全特性

  - [cite_start]**Proxmox 防火墙**：在主机级别启用 [cite: 1078]
  - [cite_start]**OPNSense**：状态数据包检测，NAT 规则 [cite: 1078]
  - [cite_start]**Caddy TLS**：自动 Let's Encrypt 证书 [cite: 1078]
  - [cite_start]**仅 VPN 管理**：管理访问仅通过 VPN [cite: 1078]

## 备份策略

[cite_start]**Proxmox Backup Server (PBS)** 创建所有容器和 VM 的增量快照： [cite: 1079]

  - [cite_start]**每日备份**：关键组件（数据库、前端、防火墙） [cite: 1079]
  - [cite_start]**每周备份**：GDI 中间件 (GeoServer, MapProxy) [cite: 1079]
  - [cite_start]**每月备份**：瓦片服务器（大数据量） [cite: 1079]
  - [cite_start]**自动保留**：用于旧备份的 PBS 策略 [cite: 1079]

[cite_start]详情：[备份策略](https://www.google.com/search?q=./backup-strategie.md) [cite: 1079]

## 进一步文档

  - [Proxmox 主机详情](https://www.google.com/search?q=./proxmox-host.md)
  - [PostgreSQL/PostGIS 容器](https://www.google.com/search?q=./lxc-postgresql.md)
  - [GeoServer 容器](https://www.google.com/search?q=./lxc-geoserver.md)
  - [MapProxy 容器](https://www.google.com/search?q=./lxc-mapproxy.md)
  - [前端容器](https://www.google.com/search?q=./lxc-frontend.md)
  - [OPNSense 防火墙](https://www.google.com/search?q=./vm-opnsense.md)
  - [OSM 瓦片服务器](https://www.google.com/search?q=./vm-osm-tiler.md)
  - [网络架构](https://www.google.com/search?q=./netzwerk-architektur.md)
  - [计划中的 Ory IAM 集成](https://www.google.com/search?q=./lxc-ory-iam.md)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。