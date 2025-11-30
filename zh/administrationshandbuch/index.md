## quality: completeness: 80 accuracy: 50 reviewed: false reviewer: 'KI (Gemini)' reviewDate: null

# 管理手册

欢迎阅读 p2d2 管理手册。您将在此处找到有关安装、配置和运行地理数据基础设施的技术文档。

## 目标受众

本手册面向：

  - **系统管理员**：负责安装和运行 p2d2
  - **DevOps 工程师**：负责自动化部署
  - **GDI 专家**：负责配置地理数据基础设施

## 架构概览

p2d2 基于多层架构：

1.  **基础设施层**：Proxmox VE、OPNsense、PBS
2.  **地理数据基础设施**：PostgreSQL/PostGIS、GeoServer、MapProxy
3.  **前端**：AstroJS 应用程序（使用 OpenLayers）
4.  **CI/CD**：基于 GitLab 的部署流水线

## 系统要求

### 硬件

  - **Proxmox 主机**：Intel 第 13 代（或同等产品），14 核，64 GB RAM
  - **整个系统**：约 28 GB RAM 用于所有容器/虚拟机 + Proxmox 的开销
  - **存储**：至少 200 GB SSD（用于容器/虚拟机 + 备份空间）
  - **网络**：1 Gbit/s（生产环境 10 Gbit/s）

### 软件

  - **虚拟化**：Proxmox VE 9.x
  - **容器操作系统**：Debian 13
  - **防火墙操作系统**：FreeBSD 14.x (OPNSense)
  - **数据库**：PostgreSQL 15+ with PostGIS 3.4+
  - **Web 服务器**：Caddy (TLS 终止)
  - **Node.js**：20.x LTS

## 导航

### 服务器基础设施

  - [服务器架构概览](./server-architektur/) - p2d2 基础设施的总体架构
  - [Proxmox 主机](./server-architektur/proxmox-host) - 虚拟化平台
  - [OPNSense 防火墙](./server-architektur/vm-opnsense) - 防火墙和反向代理
  - [网络架构](./server-architektur/netzwerk-architektur) - 网络分段和防火墙设计
  - [备份策略](./server-architektur/backup-strategie) - 数据备份和灾难恢复

### 地理数据基础设施

  - [PostgreSQL/PostGIS 容器](./server-architektur/lxc-postgresql) - 带有空间扩展的地理数据库
  - [GeoServer 容器](./server-architektur/lxc-geoserver) - 用于地理数据服务的 WFS/WMS 服务器
  - [MapProxy 容器](./server-architektur/lxc-mapproxy) - 用于高性能地图传输的瓦片缓存和代理
  - [OSM-Tileserver 虚拟机](./server-architektur/vm-osm-tiler) - OpenStreetMap 瓦片渲染服务器
  - [Ory IAM 容器（计划中）](./server-architektur/lxc-ory-iam) - 身份和访问管理

### 软件与部署

  - [前端容器](./server-architektur/lxc-frontend) - AstroJS + VitePress Web 前端（带多分支 CI/CD）
  - [前端架构](./frontend-architektur) - AstroJS 应用程序
  - [软件架构](./software-architektur) - 组件和模块
  - [部署](./deployment/staging) - 预生产 (Staging) 和生产 (Production)

## 快速入门

在测试环境中进行快速安装：

```
# 克隆仓库
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

如需完整的生产安装，请遵循管理手册中的各个部分。

::: warning 安全提示
快速安装仅适用于测试环境！对于生产系统，必须考虑安全方面的问题。
:::

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。