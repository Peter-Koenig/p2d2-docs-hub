---
title: 前端容器
description: 具有多分支 CI/CD 的 AstroJS + VitePress Web 前端
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC：前端容器

## 容器信息

```
类型：LXC（根据设置可能为特权/非特权）
操作系统：Debian 13 (trixie)
主机名：frontend（可自定义）
状态：正在运行

资源：
  内存：4 GB
  磁盘：25 GB（可动态扩展）
  CPU 份额：标准 (1024)
```

## 安装的软件

### Node.js 运行时

```
版本：Node.js v20.x LTS
包管理器：npm (Node Package Manager)
Node 版本管理器：可选 (nvm)
```

### Web 服务器

```
AstroJS：现代 Web 框架
  - 版本：4.x（当前稳定版）
  - 构建工具：Vite
  - SSR：服务器端渲染
  - 静态生成：混合模式

VitePress：文档系统
  - 版本：1.x（当前稳定版）
  - 基于：Vite + Vue 3
  - Markdown：扩展功能
```

### CI/CD 组件

```
Webhook-Server：Git 自动化
  - 端口：9321 (HTTP, 内部 LAN)
  - 集成：GitHub/GitLab Webhooks
  - 部署：多分支系统

Systemd 服务：AstroJS 实例
  - astro-main.service (生产)
  - astro-develop.service (开发)
  - astro-feature-*.service (功能分支)
```

## 服务架构

### 多分支部署系统

```
并行实例：
  - main：生产前端 (www.data-dna.eu)
  - develop：开发前端 (dev.data-dna.eu)
  - feature-de1：功能分支 1 (f-de1.data-dna.eu)
  - feature-de2：功能分支 2 (f-de2.data-dna.eu)
  - feature-fv：功能分支 3 (f-fv.data-dna.eu)

端口映射：
  - main：端口 3000
  - develop：端口 3001
  - feature-de1：端口 3002
  - feature-de2：端口 3003
  - feature-fv：端口 3004
```

### Systemd 服务配置

```
# 示例：astro-main.service
[Unit]
Description=AstroJS Main Frontend
After=network.target

[Service]
Type=simple
User=astro
WorkingDirectory=/var/www/astro/main
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 网络访问

```
监听端口：
  - 3000：主前端（生产）
  - 3001：开发前端
  - 3002-3004：功能分支
  - 9321：Webhook 服务器

通过反向代理访问：
  - www.data-dna.eu → 端口 3000
  - dev.data-dna.eu → 端口 3001
  - f-de1.data-dna.eu → 端口 3002
  - f-de2.data-dna.eu → 端口 3003
  - f-fv.data-dna.eu → 端口 3004
  - doc.data-dna.eu → VitePress 服务器

防火墙规则：
  - Caddy (OPNSense) → 前端：允许
  - Webhook 服务器 → GitHub/GitLab：出站允许
  - 前端 → GeoServer：允许 (WFS-T)
  - 前端 → MapProxy：允许 (瓦片)
  - 外部访问：拒绝 (仅通过 Caddy)
```

## CI/CD 流水线

### Webhook 服务器配置

```
# /etc/webhook-server/config.json
{
  "port": 9321,
  "secret": "<WEBHOOK_SECRET>",
  "deployments": {
    "main": {
      "branch": "main",
      "path": "/var/www/astro/main",
      "port": 3000,
      "domain": "www.data-dna.eu"
    },
    "develop": {
      "branch": "develop",
      "path": "/var/www/astro/develop",
      "port": 3001,
      "domain": "dev.data-dna.eu"
    }
  }
}
```

### 部署脚本

```
#!/bin/bash
# /usr/local/bin/deploy-astro.sh

BRANCH=$1
DEPLOY_PATH="/var/www/astro/$BRANCH"
PORT=$2

echo "Deploying branch $BRANCH to $DEPLOY_PATH on port $PORT"

# Stop existing service
systemctl stop astro-$BRANCH.service

# Git Pull
cd $DEPLOY_PATH
git fetch origin
git reset --hard origin/$BRANCH

# Install Dependencies
npm ci --production

# Build Application
npm run build

# Start Service
systemctl start astro-$BRANCH.service

echo "Deployment completed for $BRANCH"
```

## AstroJS 配置

### 主配置 (astro.config.mjs)

```
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  
  // Geo-Configuration
  vite: {
    define: {
      // Environment Variables
      __GEO_SERVER_URL__: JSON.stringify('https://ows.data-dna.eu'),
      __TILE_SERVER_URL__: JSON.stringify('https://tiles.data-dna.eu'),
      __WFS_T_URL__: JSON.stringify('https://wfs.data-dna.eu')
    }
  }
});
```

### 后端集成

```
// src/lib/geoserver.js
export async function wfsTransaction(feature) {
  const response = await fetch('https://wfs.data-dna.eu/geoserver/wfs', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: generateWFSInsert(feature)
  });
  
  return await response.text();
}

// src/lib/mapproxy.js
export function getTileUrl(layer, z, x, y) {
  return `https://tiles.data-dna.eu/tms/1.0.0/${layer}/${z}/${x}/${y}.png`;
}
```

## VitePress 文档

### 配置

```
# Configuration: docs/.vitepress/config.js
export default {
  title: 'p2d2 Dokumentation',
  description: 'Dokumentation für die p2d2 Geodateninfrastruktur',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Administrationshandbuch', link: '/de/administrationshandbuch/' }
    ],
    
    sidebar: {
      '/de/administrationshandbuch/': [
        {
          text: 'Server-Architektur',
          items: [
            { text: 'Übersicht', link: '/de/administrationshandbuch/server-architektur/' },
            { text: 'Proxmox Host', link: '/de/administrationshandbuch/server-architektur/proxmox-host' }
          ]
        }
      ]
    }
  }
}
```

## 备份策略

### PBS 快照 (容器级别)

  - **计划**：每日
  - **保留**：7 天
  - **类型**：LVM-Thin 快照

### 代码备份 (Git)

```
# 代码已在 Git 仓库中备份
# 备份部署脚本和配置
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## 监控

### 健康检查

```
# 检查服务状态
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# 测试端口监听
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# 测试外部域
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### 日志分析

```
# AstroJS 日志
journalctl -u astro-main -f --no-pager
journalctl -u astro-develop -f --no-pager

# Webhook 服务器日志
journalctl -u webhook-server -f --no-pager

# 应用程序日志
tail -f /var/www/astro/main/logs/app.log
```

## 故障排除

### 服务无法启动

```
# 检查 systemd 日志
journalctl -u astro-main --no-pager -n 100

# 端口冲突
netstat -tlnp | grep 3000

# 权限问题
ls -la /var/www/astro/main/
```

### 部署错误

```
# Webhook 日志
journalctl -u webhook-server --no-pager -n 50

# Git 仓库状态
cd /var/www/astro/main && git status

# 构建错误
cd /var/www/astro/main && npm run build --verbose
```

### 性能问题

```
# 内存使用
ps aux | grep node
free -h

# 磁盘空间
df -h /var/www/astro/

# 网络连接
curl -I http://geoserver.lan:8080/geoserver/web
```

## 安全配置

### 服务加固

```
用户隔离：
  - 专用用户：astro
  - 组：astro
  - 主目录：/var/www/astro

文件权限：
  - 配置文件：640 (root:astro)
  - 日志文件：644 (astro:astro)
  - 构建目录：755 (astro:astro)
```

### 网络安全

```
防火墙规则：
  - 只有 Caddy 代理有权访问
  - Webhook 服务器仅限授权 IP
  - 无直接 WAN 暴露

环境变量：
  - 代码中无密钥
  - .env 文件用于开发
  - 生产密钥通过 Systemd 环境
```

## 最佳实践

✅ **应做**：

  - 定期更新 Node.js（安全补丁）
  - 监控所有服务端口
  - 备份配置文件
  - 为服务使用单独的用户帐户
  - 为应用程序日志设置日志轮换

❌ **不应做**：

  - 将前端直接暴露在互联网上
  - 将密钥提交到 Git
  - 在没有速率限制的情况下运行
  - 允许无限的日志文件
  - 在开发服务器上进行生产构建

## 参考资料

  - [AstroJS 文档](https://docs.astro.build/)
  - [VitePress 文档](https://vitepress.dev/)
  - [Systemd 服务配置](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
  - [Node.js 生产最佳实践](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

> **注意：** 本文是在人工智能辅助下自动翻译的，尚未经过人工审校。