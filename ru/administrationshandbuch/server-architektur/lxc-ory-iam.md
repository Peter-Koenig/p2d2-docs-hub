---
title: Контейнер Ory IAM (Планируется)
description: Управление идентификацией и доступом для p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC: Ory IAM (Планируется)

::: warning В планах
Этот контейнер **еще не реализован**. Документация описывает планируемую архитектуру на основе лучших практик интеграции IAM.
:::

## Спецификация контейнера (Планируемая)

```
Тип: LXC (непривилегированный с поддержкой Docker)
ОС: Debian 13 (trixie)
Hostname: ory-iam
Статус: планируется

Ресурсы:
  RAM: 2 ГБ
  Диск: 10 ГБ
  CPU Shares: 1024
```

## Обзор архитектуры

```
graph LR
    subgraph "LXC: Ory IAM"
        Kratos[Ory Kratos<br/>Управление идентификацией]
        Hydra[Ory Hydra<br/>Провайдер OAuth2/OIDC]
    end
    
    subgraph "Reverse Proxy (OPNSense)"
        CaddyAuth[auth.domain.eu<br/>→ UI Kratos]
        CaddyAPI[api.auth.domain.eu<br/>→ API Kratos]
        CaddyOAuth[oauth.domain.eu<br/>→ Hydra]
    end
    
    subgraph "Контейнер PostgreSQL"
        DBKratos[(БД Kratos)]
        DBHydra[(БД Hydra)]
    end
    
    subgraph "Контейнер Frontend"
        Astro[Apps AstroJS<br/>Auth на основе сессий]
    end
    
    CaddyAuth --> Kratos
    CaddyAPI --> Kratos
    CaddyOAuth --> Hydra
    
    Kratos -->|SQL| DBKratos
    Hydra -->|SQL| DBHydra
    Kratos -.->|Поток входа| Hydra
    
    Astro -->|Cookies сессии| CaddyAuth
    Astro -->|Токены OAuth2| CaddyOAuth
```

## Компоненты

### Ory Kratos (Управление идентификацией)

```
Функция: Регистрация пользователя, вход, сброс пароля
База данных: Выделенная база данных PostgreSQL
Методы Auth:
  - Email/Пароль
  - Социальный вход (через Hydra)
  - Многофакторная аутентификация (TOTP)
  - WebAuthn/Passkeys

Возможности:
  - Потоки самообслуживания (без вмешательства администратора для регистрации)
  - Восстановление аккаунта через Email
  - Верификация Email
  - Управление сессиями (на основе Cookies)
```

### Ory Hydra (OAuth2/OIDC)

```
Функция: Провайдер OAuth2 для сторонних приложений
База данных: Отдельная база данных PostgreSQL
Протоколы:
  - OAuth2 (Поток кода авторизации)
  - OpenID Connect (OIDC)
  - Интроспекция/Отзыв токенов

Сценарии использования:
  - Single Sign-On (SSO) для поддоменов p2d2
  - Доступ к API для внешних клиентов
  - Интеграция мобильных приложений
```

## Установка (Подход Docker Compose)

### Предварительные требования

```
# Создать LXC-контейнер (на хосте Proxmox)
pct create <VMID> <DEBIAN13_TEMPLATE> \
  --hostname ory-iam \
  --cores 2 \
  --memory 2048 \
  --rootfs <STORAGE>:10 \
  --net0 name=eth0,bridge=vmbr1 \
  --unprivileged 1 \
  --features nesting=1  # Для поддержки Docker

# Запустить контейнер и установить Docker
pct start <VMID>
pct enter <VMID>
apt update && apt install -y docker.io docker-compose
```

### Структура Docker Compose

```
# /opt/ory/docker-compose.yml (упрощенно)
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

::: danger Управление секретами
**НИКОГДА** не храните секреты прямо в docker-compose.yml! Используйте:

  - `.env`-файлы (не коммитить в Git)
  - Docker Secrets
  - Внешние менеджеры секретов (Vault, SOPS)
    :::

## Конфигурация Caddy (OPNSense)

```
# Пользовательская конфиг: /usr/local/etc/caddy/caddy.d/ory-iam.conf

# UI Входа/Регистрации
auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_UI_PORT>
}

# Публичный API Kratos
api.auth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<KRATOS_API_PORT>
}

# Endpoints Hydra OAuth2
oauth.domain.eu {
    reverse_proxy <ORY_IAM_CONTAINER>:<HYDRA_PORT>
}

# Admin API (только внутренний)
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

## Интеграция с Frontend p2d2

### Вход на основе сессий (Kratos)

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

// Middleware для защищенных маршрутов
export async function onRequest({ request, redirect }, next) {
  const user = await checkSession(request);
  if (!user) {
    return redirect('/login');
  }
  return next();
}
```

### Поток OAuth2 (Hydra)

```
// Зарегистрировать OAuth2-клиент (однократно, через Admin API)
const client = {
  client_id: "p2d2-frontend",
  client_secret: "<GENERATED_SECRET>",
  redirect_uris: ["https://www.domain.eu/auth/callback"],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  scope: "openid profile email"
};

// Запрос авторизации (пользовательский)
const authUrl = `https://oauth.domain.eu/oauth2/auth` +
  `?client_id=${client_id}` +
  `&response_type=code` +
  `&scope=openid%20profile%20email` +
  `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
  `&state=${generateState()}`;

// Обмен токена (бэкенд)
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

## Настройка базы данных (Контейнер PostgreSQL)

```
-- База данных Ory-Kratos
CREATE DATABASE ory_kratos;
CREATE USER ory_kratos WITH PASSWORD '<STRONG_RANDOM_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- База данных Ory-Hydra
CREATE DATABASE ory_hydra;
CREATE USER ory_hydra WITH PASSWORD '<ANOTHER_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;

-- Миграции схемы выполняются автоматически Kratos/Hydra
```

## Мониторинг и проверки работоспособности

```
# Проверить endpoints работоспособности
curl https://api.auth.domain.eu/health/ready
curl https://oauth.domain.eu/health/ready

# Посмотреть логи Docker
docker-compose -f /opt/ory/docker-compose.yml logs -f

# Статус контейнера
docker ps | grep ory
```

## Контрольный список безопасности

Перед развертыванием в production:

  - [ ] Заменить `SECRETS_SYSTEM` в Hydra на сильный секрет (мин. 32 символа)
  - [ ] Переместить пароли PostgreSQL в `.env`-файл (не в docker-compose.yml)
  - [ ] Проверить Caddy TLS-сертификаты для всех auth-доменов
  - [ ] Сделать Admin API доступным только через VPN/VLAN управления
  - [ ] Включить Rate-Limiting для endpoints входа (защита от Brute-Force)
  - [ ] Корректно настроить CORS-заголовки (только собственные домены)
  - [ ] Настроить и протестировать SMTP-сервер для отправки email
  - [ ] Настроить задачу бэкапа для баз данных Ory

## Дорожная карта реализации

**Фаза 1** (Неделя 1-2): Базовая настройка

  - Создать LXC-контейнер и установить Docker
  - Создать базы данных PostgreSQL
  - Настройка Kratos Docker Compose
  - Протестировать UI Входа/Регистрации

**Фаза 2** (Неделя 3-4): Интеграция Hydra

  - Настроить контейнер Hydra
  - Зарегистрировать OAuth2-клиенты для p2d2-frontend
  - Протестировать потоки токенов

**Фаза 3** (Неделя 5-6): Интеграция Frontend

  - Реализовать Middleware сессий AstroJS
  - Интегрировать потоки входа в UI p2d2
  - E2E-тесты (Регистрация → Вход → Авторизованный запрос)

**Фаза 4** (Неделя 7): Усиление защиты Production

  - Интеграция SMTP (Отправка email)
  - Настроить Rate-Limiting
  - Настроить мониторинг
  - Финализировать документацию

## Ссылки

  - [Документация Ory Kratos](https://www.ory.sh/docs/kratos/)
  - [Документация Ory Hydra](https://www.ory.sh/docs/hydra/)
  - [Лучшие практики OAuth2 (RFC 8252)](https://datatracker.ietf.org/doc/html/rfc8252)
  - [Шпаргалка по аутентификации OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.