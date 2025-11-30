---
title: Ory IAM 容器（计划中）
description: p2d2 的身份和访问管理
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC：Ory IAM（计划中）

::: warning 规划中
此容器**尚未实施**。该文档描述了基于 IAM 集成最佳实践的计划架构。
:::

## 容器规格（计划中）

```
类型：LXC（非特权，支持 Docker）
操作系统：Debian 13 (trixie)
主机名：ory-iam
状态：计划中

资源：
  内存：2 GB
  磁盘：10 GB
  CPU 份额：1024
```

## 架构概览

```
graph LR
    subgraph "LXC: Ory IAM"
        Kratos[Ory Kratos<br/>身份管理]
        Hydra[Ory Hydra<br/>OAuth2/OIDC 提供商]
    end
    
    subgraph "反向代理 (OPNSense)"
        CaddyAuth[auth.domain.eu<br/>→ Kratos UI]
        CaddyAPI[api.auth.domain.eu<br/>→ Kratos API]
        CaddyOAuth[oauth.domain.eu<br/>→ Hydra]
    end
    
    subgraph "PostgreSQL 容器"
        DBKratos[(Kratos 数据库)]
        DBHydra[(Hydra 数据库)]
    end
    
    subgraph "前端容器"
        Astro[AstroJS 应用<br/>基于会话的认证]
    end
    
    CaddyAuth --> Kratos
    CaddyAPI --> Kratos
    CaddyOAuth --> Hydra
    
    Kratos -->|SQL| DBKratos
    Hydra -->|SQL| DBHydra
    Kratos -.->|登录流程| Hydra
    
    Astro -->|会话 Cookies| CaddyAuth
    Astro -->|OAuth2 令牌| CaddyOAuth
```

## 组件

### Ory Kratos (身份管理)

```
功能：用户注册、登录、密码重置
数据库：专用的 PostgreSQL 数据库
认证方法：
  - 电子邮件/密码
  - 社交登录 (通过 Hydra)
  - 多因素认证 (TOTP)
  - WebAuthn/Passkeys

特性：
  - 自助服务流程 (无需管理员干预注册)
  - 通过电子邮件恢复帐户
  - 电子邮件验证
  - 会话管理 (基于 Cookie)
```

### Ory Hydra (OAuth2/OIDC)

```
功能：第三方应用的 OAuth2 提供商
数据库：单独的 PostgreSQL 数据库
协议：
  - OAuth2 (授权码流程)
  - OpenID Connect (OIDC)
  - 令牌内省/撤销

用例：
  - p2d2 子域的单点登录 (SSO)
  - 外部客户端的 API 访问
  - 移动应用集成
```

## 安装 (Docker Compose 方法)

### 先决条件

```
# 创建 LXC 容器 (在 Proxmox 主机上)
pct create <VMID> <DEBIAN13_TEMPLATE> \
  --hostname ory-iam \
  --cores 2 \
  --memory 2048 \
  --rootfs <STORAGE>:10 \
  --net0 name=eth0,bridge=vmbr1 \
  --unprivileged 1 \
  --features nesting=1  # 用于 Docker 支持

# 启动容器并安装 Docker
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Docker Compose 结构

```
# /opt/ory/docker-compose.yml (简化版)
version: '3.8'

services:
  kratos:
    image: oryd/kratos:latest
    environment:
      - DSN=postgres://<USER>:<PASS>@<DB_HOST>:<PORT>/ory_kratos?sslmode=disable
      - SERVE_PUBLIC_BASE_URL=https://api.auth.domain.eu
      - SELFSERVICE_DEFAULT_BROWSER_RETURN_URL=https://www.domain.eu
    volumes:
      - ./kratos-config:/etc/config/kratos
    command: serve --config /etc/config/kratos/kratos.yml

  hydra:
    image: oryd/hydra:latest
    environment:
      - DSN=postgres://<USER>:<PASS>@<DB_HOST>:<PORT>/ory_hydra?sslmode=disable
      - URLS_SELF_ISSUER=https://oauth.domain.eu
      - URLS_LOGIN=https://auth.domain.eu/login
      - URLS_CONSENT=https://auth.domain.eu/consent
    command: serve all
```

::: danger 密钥管理
**切勿**将密钥直接存储在 docker-compose.yml 中！使用：

  - `.env` 文件 (不要提交到 Git)
  - Docker Secrets
  - 外部密钥管理器 (Vault, SOPS)
    :::

## Caddy 配置 (OPNSense)

```
# 自定义配置: /usr/local/etc/caddy/caddy.d/ory-iam.conf

# 登录/注册 UI
auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_UI_PORT>
}

# Kratos 公共 API
api.auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_API_PORT>
}

# Hydra OAuth2 端点
oauth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<HYDRA_PORT>
}

# Admin API (仅内部)
admin.auth.domain.eu {
    @internal {
        remote_ip <INTERNAL_NETWORK_RANGE>
    }
    handle @internal {
        reverse_proxy <ORY_IAM_CONTAINER>:<ADMIN_PORT>
    }
    respond 403
}
```

## 与 p2d2 前端集成

### 基于会话的登录 (Kratos)

```
// src/lib/auth.ts (AstroJS)
export async function checkSession(request: Request): Promise<User | null> {
  const kratosPublicUrl = process.env.KRATOS_PUBLIC_URL;
  const cookie = request.headers.get('cookie');
  
  const response = await fetch(`${kratosPublicUrl}/sessions/whoami`, {
    headers: { cookie }
  });
  
  if (response.ok) {
    const session = await response.json();
    return session.identity;
  }
  return null;
}

// 用于受保护路由的中间件
export async function onRequest({ request, redirect }, next) {
  const user = await checkSession(request);
  if (!user) {
    return redirect('/login');
  }
  return next();
}
```

### OAuth2 流程 (Hydra)

```
// 注册 OAuth2 客户端 (一次性, 通过 Admin API)
const client = {
  client_id: "p2d2-frontend",
  client_secret: "<GENERATED_SECRET>",
  redirect_uris: ["https://www.domain.eu/auth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile email"
};

// 授权请求 (面向用户)
const authUrl = `https://oauth.domain.eu/oauth2/auth` +
  `?client_id=${client_id}` +
  `&response_type=code` +
  `&scope=openid%20profile%20email` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&state=${generateState()}`;

// 令牌交换 (后端)
const tokenResponse = await fetch('https://oauth.domain.eu/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirect_uri,
    client_id: client_id,
    client_secret: client_secret
  })
});
```

## 数据库设置 (PostgreSQL 容器)

```
-- Ory-Kratos 数据库
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Ory-Hydra 数据库
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- 架构迁移由 Kratos/Hydra 自动执行
```

## 监控 & 健康检查

```
# 检查健康端点
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# 查看 Docker 日志
docker-compose -f /opt/ory/docker-compose.yml logs -f

# 容器状态
docker ps | grep ory
```

## 安全清单

生产部署前：

  - [ ] 将 Hydra 中的 `SECRETS_SYSTEM` 替换为强密钥（至少 32 个字符）
  - [ ] 将 PostgreSQL 密码移至 `.env` 文件（不在 docker-compose.yml 中）
  - [ ] 验证所有 auth 域的 Caddy TLS 证书
  - [ ] 使 Admin API 只能通过 VPN/管理 VLAN 访问
  - [ ] 为登录端点启用速率限制（防暴力破解）
  - [ ] 正确配置 CORS 标头（仅限自有域）
  - [ ] 配置并测试用于发送电子邮件的 SMTP 服务器
  - [ ] 为 Ory 数据库设置备份作业

## 实施路线图

**阶段 1** (第 1-2 周): 基本设置

  - 创建 LXC 容器并安装 Docker
  - 创建 PostgreSQL 数据库
  - Kratos Docker Compose 设置
  - 测试登录/注册 UI

**阶段 2** (第 3-4 周): Hydra 集成

  - 配置 Hydra 容器
  - 为 p2d2 前端注册 OAuth2 客户端
  - 测试令牌流程

**阶段 3** (第 5-6 周): 前端集成

  - 实施 AstroJS 会话中间件
  - 将登录流程集成到 p2d2 UI
  - E2E 测试 (注册 → 登录 → 授权请求)

**阶段 4** (第 7 周): 生产加固

  - SMTP 集成 (电子邮件发送)
  - 配置速率限制
  - 设置监控
  - 最终确定文档

## 参考资料

  - [Ory Kratos 文档](https://www.ory.sh/docs/kratos/)
  - [Ory Hydra 文档](https://www.ory.sh/docs/hydra/)
  - [OAuth2 最佳实践 (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
  - [OWASP 身份验证备忘录](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。