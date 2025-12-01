---
title: 网络架构
description: 网络分段和防火墙设计
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(翻译: AI)"
  reviewDate: null
---

# 网络架构

## 网络拓扑

```
graph TB
    subgraph Internet
        WAN[Internet<br/>公共 IP]
    end
    
    subgraph "Proxmox 主机"
        subgraph "WAN-Bridge"
            VM_WAN[OPNSense WAN 接口]
        end
        
        subgraph "LAN-Bridge (内部网络)"
            VM_LAN[OPNSense LAN 接口<br/>网关 + DNS]
            DB[PostgreSQL/PostGIS]
            GeoServer[GeoServer WFS/WMS]
            MapProxy[MapProxy 瓦片]
            Frontend[AstroJS 前端]
            Tiler[OSM-Tiler VM]
            IAM[Ory IAM (计划中)]
        end
        
        subgraph "管理 VLAN"
            AdminAccess[管理员访问<br/>仅 VPN]
        end
    end
    
    WAN <-->|NAT| VM_WAN
    VM_WAN <--> VM_LAN
    
    VM_LAN <--> DB
    VM_LAN <--> GeoServer
    VM_LAN <--> MapProxy
    VM_LAN <--> Frontend
    VM_LAN <--> Tiler
    VM_LAN -.-> IAM
    
    AdminAccess -.->|VPN 隧道| VM_LAN
    
    style IAM stroke-dasharray: 5 5
```

## 网桥配置

### WAN-Bridge (面向 Internet)

```
功能: 连接到 Internet 上行链路
连接的接口: OPNSense WAN 接口
安全: 没有直接的容器/VM (只有防火墙)
```

**流量流**:

```
Internet → WAN-Bridge → Firewall OPNSense → NAT/路由 → LAN-Bridge → 服务
```

### LAN-Bridge (内部服务网络)

```
功能: p2d2 所有服务的私有网络
类型: RFC1918 私有网络
网关: OPNSense LAN 接口
DNS: Unbound (在 OPNSense 上)

连接的主机:
  - OPNSense LAN 接口 (网关, DHCP, DNS)
  - PostgreSQL/PostGIS 容器
  - GeoServer 容器
  - MapProxy 容器
  - 前端容器
  - OSM-Tiler VM
  - Ory IAM 容器 (计划中)
```

**防火墙策略**: 默认 DENY (白名单方法)

允许的连接:

  - 前端 → 数据库 (PostgreSQL 协议)
  - 前端 → GeoServer (WFS-T 请求)
  - GeoServer → 数据库 (PostGIS 访问)
  - MapProxy → GeoServer (WMS 代理)
  - MapProxy → OSM-Tiler (瓦片请求)
  - Ory IAM → 数据库 (认证数据)
  - 前端 → Ory IAM (会话验证)

### 管理 VLAN

```
功能: 用于管理的专用网络
访问: 仅通过 VPN 或物理控制台访问
VLAN-ID: 自定义 (可配置)

用途:
  - Proxmox Web-UI 访问
  - SSH 到 Proxmox 主机
  - 带外管理
  - 紧急恢复
```

::: warning 管理员访问
管理 VLAN **绝不**可从 Internet 直接访问！访问权限完全通过 VPN (WireGuard)。
:::

## OPNSense 防火墙规则

### 防火墙理念

```
默认策略: DROP (丢弃所有数据包)
方法: 白名单 (仅显式允许的连接)
状态: 有状态 (跟踪已建立的连接)
日志记录: 记录重要事件 (无完整数据包捕获)
```

### 规则类别 (简化)

#### WAN → LAN (入站)

```
1. HTTPS (443) → Caddy Reverse Proxy: ALLOW
2. HTTP (80) → Caddy (重定向到 HTTPS): ALLOW
3. SSH (22): DENY (仅 VPN)
4. 所有其他端口: DENY
```

#### LAN → Internet (出站)

```
1. HTTP/HTTPS (80/443): ALLOW (用于 APT 更新, Let's Encrypt)
2. DNS (53): ALLOW (上游解析器)
3. NTP (123): ALLOW (时间同步)
4. SMTP (25/587): ALLOW (仅用于 Ory 电子邮件发送)
5. 其他: DENY (仅显式需要的端口)
```

#### LAN → LAN (服务到服务)

参见下面的**服务矩阵**。

### 服务矩阵 (内部通信)

| 源 | 目标 | 服务 | 用途 |
|---|---|---|---|
| 前端 | DB | PostgreSQL | WFS-T 数据持久化 |
| 前端 | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | PostGIS 图层查询 |
| MapProxy | GeoServer | HTTP | WMS 代理缓存 |
| MapProxy | OSM-Tiler | HTTP | 瓦片渲染请求 |
| Caddy (OPNSense) | 前端 | HTTP | 反向代理到 AstroJS 端口 |
| Caddy (OPNSense) | MapProxy | HTTP | 瓦片交付 |
| **Ory IAM (计划中)** | **DB** | **PostgreSQL** | **Auth 数据库** |
| **前端** | **Ory IAM** | **HTTP** | **会话验证** |

## 端口概览

### 外部端口 (Internet → OPNSense)

| 端口 | 协议 | 服务 | 公开 |
|---|---|---|---|
| 443 | HTTPS | Caddy (所有域) | ✅ 是 |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ 是 |
| 22 | SSH | OPNSense | ❌ 否 (仅 VPN) |
| \<VPN\_PORT\> | UDP | WireGuard | ✅ 是 (用于 VPN 客户端) |

### 内部端口 (仅 LAN, 非公开)

| 服务 | 标准端口 | 协议 | 访问 |
|---|---|---|---|
| PostgreSQL | 5432 | TCP | 内部 LAN |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | 内部 LAN |
| MapProxy | 8080 | HTTP | 内部 LAN |
| AstroJS (main) | 3000 | HTTP | 通过 Caddy-Proxy |
| AstroJS (develop) | 3001 | HTTP | 通过 Caddy-Proxy |
| AstroJS (features) | 3002-3004 | HTTP | 通过 Caddy-Proxy |
| Webhook-Server | 9321 | HTTP | 内部 LAN |
| OSM-Tiler | 8080 | HTTP | 内部 LAN |
| **Ory Kratos (计划中)** | **4433/4434** | **HTTP** | **通过 Caddy-Proxy** |
| **Ory Hydra (计划中)** | **4444/4445** | **HTTP** | **通过 Caddy-Proxy** |

::: tip 端口标准化
所有 HTTP 服务内部使用端口 8080 (GeoServer, MapProxy, OSM-Tiler)。Caddy 反向代理将这些映射到带 HTTPS 的外部域。
:::

## DNS 配置

### 内部 DNS 服务器 (Unbound on OPNSense)

```
DNS 服务器: OPNSense LAN 接口
上游解析器: 
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
DNSSEC: Enabled
查询日志: Opcional (用于故障排除)

本地 DNS 记录 (.lan 域):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (计划中)
```

### 公共 DNS (外部域)

```
域: data-dna.eu
注册商: <REGISTRAR_NAME>
域名服务器: <EXTERNAL_NS1>, <EXTERNAL_NS2>

A 记录 (全部指向 OPNSense WAN IP):
  - www.data-dna.eu (主前端)
  - dev.data-dna.eu (Develop 分支)
  - f-de1/de2/fv.data-dna.eu (功能分支)
  - doc.data-dna.eu (VitePress 文档)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)
  
  计划中:
  - auth.data-dna.eu (Ory Kratos UI)
  - api.auth.data-dna.eu (Ory Kratos API)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning DNS 传播
A 记录的更改可能需要长达 24 小时才能全球传播 (取决于 TTL)！对于关键更改，请提前降低 TTL。
:::

## 安全特性

### 网络分段

  - **DMZ 原则**: 前端没有直接数据库写访问权限 (仅通过 GeoServer 上的 WFS-T)
  - **服务隔离**: 每个服务都在单独的容器/VM 中
  - **最小权限**: 服务只能与显式需要的其他服务通信
  - **管理隔离**: 管理员访问与生产流量完全分离

### 防火墙加固

```
数据包过滤器: 状态数据包检测 (SPI)
连接跟踪: 跟踪已建立的连接
地理封锁: 可选启用 (例如仅限欧盟流量)
IDS/IPS: Suricata (可选, 注意性能影响)
速率限制: Caddy 级别 (例如 100 req/min per IP)
```

### TLS/SSL

```
证书来源: Let's Encrypt (通过 Caddy 自动)
TLS 版本: TLS 1.2 最低, TLS 1.3 优先
密码套件: 现代 (无过时密码)
HSTS: 启用 (Strict-Transport-Security 标头)
证书固定: 可选用于关键域
```

## VPN 访问 (WireGuard)

### 配置 (简化)

```
# /etc/wireguard/wg0.conf (在 OPNSense 上)
[Interface]
Address = <VPN_INTERNAL_IP>/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = <VPN_PORT>

[Peer]
# Admin-Client 1
PublicKey = <CLIENT_1_PUBLIC_KEY>
AllowedIPs = <CLIENT_1_VPN_IP>/32
PersistentKeepalive = 25

[Peer]
# Admin-Client 2
PublicKey = <CLIENT_2_PUBLIC_KEY>
AllowedIPs = <CLIENT_2_VPN_IP>/32
PersistentKeepalive = 25
```

**用例**:

  - SSH 访问 Proxmox 主机
  - 直接访问 OPNSense Web-UI
  - 数据库管理 (PostgreSQL 客户端)
  - 紧急恢复

::: danger VPN 密钥管理
WireGuard 私钥**高度敏感**！切勿提交到 Git 或通过未加密的电子邮件发送！
:::

## 故障排除

### 测试网络连接

```
# 从 Proxmox 主机
ping <DB_CONTAINER_IP>  # PostgreSQL 容器
ping <FRONTEND_CONTAINER_IP>  # 前端容器

# 从前端容器 (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# 检查 DNS 解析
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### 防火墙调试 (OPNSense)

```
# 在 OPNSense 上 (通过 VPN SSH)
pfctl -sr | grep <SERVICE_NAME>  # 显示活动规则
pfctl -ss | grep <PORT>  # 活动状态/连接

# 实时捕获流量
tcpdump -i <INTERFACE> port <PORT> -n

# 防火墙日志 (被阻止的数据包)
grep "block" /var/log/filter.log | tail -50
```

### Caddy 路由调试

```
# 在 OPNSense 上
curl -I https://www.data-dna.eu  # 外部请求
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # 直接后端测试

# Caddy 日志
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## 计划的扩展

### Ory IAM 集成

**新防火墙规则**:

  - 前端 → Ory IAM (会话验证)
  - Ory IAM → 数据库 (Auth 数据)
  - Caddy → Ory IAM (auth 域的反向代理)

**新 Caddy 域**:

  - `auth.data-dna.eu` → Ory Kratos UI
  - `api.auth.data-dna.eu` → Ory Kratos API
  - `oauth.data-dna.eu` → Ory Hydra OAuth2

### 监控栈 (可选)

  - **Prometheus**: 从所有容器收集指标
  - **Grafana**: 可视化 (仪表板)
  - **Alertmanager**: 出现问题时发送 Email/Telegram 通知
  - **Node Exporter**: 系统指标 (CPU, RAM, 磁盘)

## 最佳实践

✅ **应做**:

  - 定期审查防火墙规则 (每季度)
  - 为所有管理员访问使用 VPN
  - 为服务使用单独的用户帐户 (无共享凭证)
  - 保持网络分段 (非 "扁平网络")
  - 考虑为上游解析器使用 DNS-over-HTTPS (DoH)

❌ **不应做**:

  - 将数据库直接暴露于 Internet
  - 为 OPNSense/Proxmox 使用默认密码
  - 在同一容器中运行所有服务
  - 忽略防火墙日志 (定期检查异常)
  - 将管理 VLAN 与生产网络混合

## 参考资料

  - [OPNSense 文档](https://docs.opnsense.org/)
  - [pfSense 防火墙指南](https://docs.netgate.com/pfsense/) (与 OPNSense 兼容)
  - [VPN WireGuard](https://www.wireguard.com/quickstart/)
  - [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
  - [RFC1918 私有网络](https://datatracker.ietf.org/doc/html/rfc1918)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。