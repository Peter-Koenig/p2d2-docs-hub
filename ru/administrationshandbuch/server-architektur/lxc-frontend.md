---
title: Контейнер Фронтенда
description: Веб-фронтенд AstroJS + VitePress с CI/CD для нескольких веток
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC: Контейнер Фронтенда

## Информация о контейнере

```
Тип: LXC (привилегированный/непривилегированный в зависимости от настройки)
ОС: Debian 13 (trixie)
Hostname: frontend (настраиваемый)
Статус: запущен

Ресурсы:
  RAM: 4 ГБ
  Диск: 25 ГБ (динамически расширяемый)
  CPU Shares: Стандартные (1024)
```

## Установленное ПО

### Среда выполнения Node.js

```
Версия: Node.js v20.x LTS
Менеджер пакетов: npm (Node Package Manager)
Менеджер версий Node: Опционально (nvm)
```

### Веб-сервер

```
AstroJS: Современный веб-фреймворк
  - Версия: 4.x (текущая стабильная)
  - Инструмент сборки: Vite
  - SSR: Server-Side Rendering
  - Статическая генерация: Гибридный режим

VitePress: Система документации
  - Версия: 1.x (текущая стабильная)
  - Основан на: Vite + Vue 3
  - Markdown: Расширенные возможности
```

### Компоненты CI/CD

```
Webhook-Server: Автоматизация Git
  - Порт: 9321 (HTTP, внутренняя LAN)
  - Интеграция: Webhooks GitHub/GitLab
  - Развертывание: Система Multi-Branch

Сервисы Systemd: Экземпляры AstroJS
  - astro-main.service (Production)
  - astro-develop.service (Development)
  - astro-feature-*.service (Feature Branches)
```

## Архитектура сервисов

### Система развертывания Multi-Branch

```
Параллельные экземпляры:
  - main: Фронтенд Production (www.data-dna.eu)
  - develop: Фронтенд Development (dev.data-dna.eu)
  - feature-de1: Feature Branch 1 (f-de1.data-dna.eu)
  - feature-de2: Feature Branch 2 (f-de2.data-dna.eu)
  - feature-fv: Feature Branch 3 (f-fv.data-dna.eu)

Распределение портов:
  - main: Порт 3000
  - develop: Порт 3001
  - feature-de1: Порт 3002
  - feature-de2: Порт 3003
  - feature-fv: Порт 3004
```

### Конфигурация сервиса Systemd

```
# Пример: astro-main.service
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

## Сетевой доступ

```
Прослушиваемые порты:
  - 3000: Главный фронтенд (Production)
  - 3001: Фронтенд Develop
  - 3002-3004: Feature Branches
  - 9321: Сервер Webhook

Доступ через Reverse Proxy:
  - www.data-dna.eu → Порт 3000
  - dev.data-dna.eu → Порт 3001
  - f-de1.data-dna.eu → Порт 3002
  - f-de2.data-dna.eu → Порт 3003
  - f-fv.data-dna.eu → Порт 3004
  - doc.data-dna.eu → Сервер VitePress

Правила Firewall:
  - Caddy (OPNSense) → Frontend: РАЗРЕШИТЬ
  - Сервер Webhook → GitHub/GitLab: ИСХОДЯЩИЙ РАЗРЕШИТЬ
  - Frontend → GeoServer: РАЗРЕШИТЬ (WFS-T)
  - Frontend → MapProxy: РАЗРЕШИТЬ (Тайлы)
  - Внешний доступ: ЗАПРЕТИТЬ (только через Caddy)
```

## Конвейер CI/CD

### Конфигурация сервера Webhook

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

### Скрипт развертывания

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

## Конфигурация AstroJS

### Основная конфигурация (astro.config.mjs)

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

### Интеграция с бэкендом

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

## Документация VitePress

### Конфигурация

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

## Стратегия резервного копирования

### Снимок PBS (Уровень контейнера)

  - **Расписание**: Ежедневно
  - **Хранение**: 7 дней
  - **Тип**: LVM-Thin Snapshot

### Резервное копирование кода (Git)

```
# Код уже сохранен в Git-репозитории
# Резервное копирование скриптов развертывания и конфигураций
tar -czf /backup/frontend-config_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/webhook-server/ \
  /usr/local/bin/deploy-*.sh
```

## Мониторинг

### Проверки работоспособности

```
# Проверить статус сервиса
systemctl status astro-main
systemctl status astro-develop
systemctl status webhook-server

# Протестировать прослушивание портов
curl -I http://localhost:3000
curl -I http://localhost:3001
curl -I http://localhost:9321/health

# Протестировать внешние домены
curl -I https://www.data-dna.eu
curl -I https://dev.data-dna.eu
```

### Анализ логов

```
# Логи AstroJS
journalctl -u astro-main -f --no-pager
journalctl -u astro-develop -f --no-pager

# Логи Webhook Server
journalctl -u webhook-server -f --no-pager

# Логи приложения
tail -f /var/www/astro/main/logs/app.log
```

## Устранение неполадок

### Сервис не запускается

```
# Проверить логи systemd
journalctl -u astro-main --no-pager -n 100

# Конфликты портов
netstat -tlnp | grep 3000

# Проблемы с правами доступа
ls -la /var/www/astro/main/
```

### Ошибки развертывания

```
# Логи Webhook
journalctl -u webhook-server --no-pager -n 50

# Статус Git-репозитория
cd /var/www/astro/main && git status

# Ошибки сборки
cd /var/www/astro/main && npm run build --verbose
```

### Проблемы с производительностью

```
# Использование памяти
ps aux | grep node
free -h

# Место на диске
df -h /var/www/astro/

# Сетевая доступность
curl -I http://geoserver.lan:8080/geoserver/web
```

## Конфигурация безопасности

### Усиление защиты сервиса

```
Изоляция пользователя:
  - Выделенный пользователь: astro
  - Группа: astro
  - Домашний каталог: /var/www/astro

Права доступа к файлам:
  - Файлы конфигурации: 640 (root:astro)
  - Файлы логов: 644 (astro:astro)
  - Каталог сборки: 755 (astro:astro)
```

### Сетевая безопасность

```
Правила Firewall:
  - Только Caddy-proxy имеет доступ
  - Сервер Webhook только для авторизованных IP
  - Нет прямого доступа из WAN

Переменные окружения:
  - Нет секретов в коде
  - Файлы .env для Development
  - Секреты Production через окружение Systemd
```

## Лучшие практики

✅ **Делать**:

  - Регулярные обновления Node.js (патчи безопасности)
  - Мониторинг всех портов сервисов
  - Резервное копирование файлов конфигурации
  - Раздельные учетные записи пользователей для сервисов
  - Ротация логов для логов приложения

❌ **Не делать**:

  - Предоставлять прямой доступ к фронтенду из интернета
  - Коммитить секреты в Git
  - Запускать без ограничения скорости запросов
  - Разрешать неограниченные файлы логов
  - Сборки Production на сервере Development

## Ссылки

  - [Документация AstroJS](https://docs.astro.build/)
  - [Документация VitePress](https://vitepress.dev/)
  - [Конфигурация сервиса Systemd](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
  - [Лучшие практики Node.js в Production](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.