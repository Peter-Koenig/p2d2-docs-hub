---
title: Сетевая архитектура
description: Сегментация сети и дизайн брандмауэра
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Перевод: ИИ)"
  reviewDate: null
---

# Сетевая архитектура

## Топология сети

```
graph TB
    subgraph Internet
        WAN[Internet<br/>Публичные IP]
    end
    
    subgraph "Хост Proxmox"
        subgraph "WAN-Bridge"
            VM_WAN[Интерфейс WAN OPNSense]
        end
        
        subgraph "LAN-Bridge (Внутренняя сеть)"
            VM_LAN[Интерфейс LAN OPNSense<br/>Шлюз + DNS]
            DB[PostgreSQL/PostGIS]
            GeoServer[GeoServer WFS/WMS]
            MapProxy[MapProxy Tiles]
            Frontend[AstroJS Frontend]
            Tiler[VM OSM-Tiler]
            IAM[Ory IAM (планируется)]
        end
        
        subgraph "Management-VLAN"
            AdminAccess[Доступ Admin<br/>Только VPN]
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
    
    AdminAccess -.->|VPN Туннель| VM_LAN
    
    style IAM stroke-dasharray: 5 5
```

## Конфигурация мостов

### WAN-Bridge (выходящий в Интернет)

```
Функция: Подключение к интернет-аплинку
Подключенные интерфейсы: Интерфейс WAN OPNSense
Безопасность: НЕТ прямых контейнеров/VM (только файрвол)
```

**Поток трафика**:

```
Internet → WAN-Bridge → Firewall OPNSense → NAT/Маршрутизация → LAN-Bridge → Сервисы
```

### LAN-Bridge (Внутренняя сеть сервисов)

```
Функция: Приватная сеть для всех сервисов p2d2
Тип: Приватная сеть RFC1918
Шлюз: Интерфейс LAN OPNSense
DNS: Unbound (на OPNSense)

Подключенные хосты:
  - Интерфейс LAN OPNSense (Шлюз, DHCP, DNS)
  - Контейнер PostgreSQL/PostGIS
  - Контейнер GeoServer
  - Контейнер MapProxy
  - Контейнер Frontend
  - VM OSM-Tiler
  - Контейнер Ory IAM (планируется)
```

**Политика файрвола**: Default DENY (Подход белого списка)

Разрешенные соединения:

  - Frontend → База данных (Протокол PostgreSQL)
  - Frontend → GeoServer (Запросы WFS-T)
  - GeoServer → База данных (Доступ PostGIS)
  - MapProxy → GeoServer (Proxy WMS)
  - MapProxy → OSM-Tiler (Запросы тайлов)
  - Ory IAM → База данных (Данные аутентификации)
  - Frontend → Ory IAM (Валидация сессии)

### Management-VLAN

```
Функция: Выделенная сеть для администрирования
Доступ: Только через VPN или физический доступ к консоли
VLAN-ID: Пользовательский (настраиваемый)

Использование:
  - Доступ к Proxmox Web-UI
  - SSH к хосту Proxmox
  - Управление вне полосы
  - Аварийное восстановление
```

::: warning Доступ Admin
Management-VLAN **НИКОГДА** не доступен напрямую из Интернета! Доступ исключительно через VPN (WireGuard).
:::

## Правила файрвола OPNSense

### Философия файрвола

```
Политика по умолчанию: DROP (отбрасывать все пакеты)
Подход: Белый список (только явно разрешенные соединения)
Stateful: Да (отслеживать установленные соединения)
Логирование: Логировать важные события (без полной захвата пакетов)
```

### Категории правил (упрощенно)

#### WAN → LAN (Входящие)

```
1. HTTPS (443) → Caddy Reverse Proxy: РАЗРЕШИТЬ
2. HTTP (80) → Caddy (Реддирект на HTTPS): РАЗРЕШИТЬ
3. SSH (22): ЗАПРЕТИТЬ (только VPN)
4. Все остальные порты: ЗАПРЕТИТЬ
```

#### LAN → Internet (Исходящие)

```
1. HTTP/HTTPS (80/443): РАЗРЕШИТЬ (для обновлений APT, Let's Encrypt)
2. DNS (53): РАЗРЕШИТЬ (Upstream-резолверы)
3. NTP (123): РАЗРЕШИТЬ (Синхронизация времени)
4. SMTP (25/587): РАЗРЕШИТЬ (только для отправки email Ory)
5. Другие: ЗАПРЕТИТЬ (только явно необходимые порты)
```

#### LAN → LAN (Сервис-к-Сервису)

См. **Матрицу сервисов** ниже.

### Матрица сервисов (Внутренняя коммуникация)

| Источник | Назначение | Сервис | Назначение |
|---|---|---|---|
| Frontend | DB | PostgreSQL | Персистенция данных WFS-T |
| Frontend | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | Запросы слоев PostGIS |
| MapProxy | GeoServer | HTTP | Proxy WMS для кэширования |
| MapProxy | OSM-Tiler | HTTP | Запросы рендеринга тайлов |
| Caddy (OPNSense) | Frontend | HTTP | Reverse Proxy к портам AstroJS |
| Caddy (OPNSense) | MapProxy | HTTP | Доставка тайлов |
| **Ory IAM (план)** | **DB** | **PostgreSQL** | **Базы данных Auth** |
| **Frontend** | **Ory IAM** | **HTTP** | **Валидация сессии** |

## Обзор портов

### Внешние порты (Internet → OPNSense)

| Порт | Протокол | Сервис | Публичный |
|---|---|---|---|
| 443 | HTTPS | Caddy (все домены) | ✅ Да |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ Да |
| 22 | SSH | OPNSense | ❌ Нет (только VPN) |
| \<VPN\_PORT\> | UDP | WireGuard | ✅ Да (для клиентов VPN) |

### Внутренние порты (только LAN, не публичные)

| Сервис | Стандартный порт | Протокол | Доступ |
|---|---|---|---|
| PostgreSQL | 5432 | TCP | Внутренняя LAN |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | Внутренняя LAN |
| MapProxy | 8080 | HTTP | Внутренняя LAN |
| AstroJS (main) | 3000 | HTTP | Через Caddy-Proxy |
| AstroJS (develop) | 3001 | HTTP | Через Caddy-Proxy |
| AstroJS (features) | 3002-3004 | HTTP | Через Caddy-Proxy |
| Webhook-Server | 9321 | HTTP | Внутренняя LAN |
| OSM-Tiler | 8080 | HTTP | Внутренняя LAN |
| **Ory Kratos (план)** | **4433/4434** | **HTTP** | **Через Caddy-Proxy** |
| **Ory Hydra (план)** | **4444/4445** | **HTTP** | **Через Caddy-Proxy** |

::: tip Стандартизация портов
Все HTTP-сервисы используют порт 8080 внутренне (GeoServer, MapProxy, OSM-Tiler). Caddy Reverse Proxy мапит их на внешние домены с HTTPS.
:::

## Конфигурация DNS

### Внутренний DNS-сервер (Unbound на OPNSense)

```
DNS-сервер: Интерфейс LAN OPNSense
Upstream Resolver: 
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
DNSSEC: Включен
Query-Logging: Опционально (для траблшутинга)

Локальные DNS-записи (Домен .lan):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (планируется)
```

### Публичный DNS (Внешний домен)

```
Домен: data-dna.eu
Регистратор: <ИМЯ_РЕГИСТРАТОРА>
Nameservers: <EXTERNAL_NS1>, <EXTERNAL_NS2>

A-Записи (все указывают на IP WAN OPNSense):
  - www.data-dna.eu (Основной фронтенд)
  - dev.data-dna.eu (Develop-ветка)
  - f-de1/de2/fv.data-dna.eu (Feature-ветки)
  - doc.data-dna.eu (Документация VitePress)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)
  
  Планируется:
  - auth.data-dna.eu (UI Ory Kratos)
  - api.auth.data-dna.eu (API Ory Kratos)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning Пропагация DNS
Изменения A-записей могут занять до 24 часов для глобальной пропагации (зависит от TTL)! Для критических изменений уменьшите TTL заранее.
:::

## Функции безопасности

### Сегментация сети

  - **Принцип DMZ**: Frontend не имеет прямого доступа на запись в БД (только через WFS-T через GeoServer)
  - **Изоляция сервисов**: Каждый сервис в отдельном контейнере/VM
  - **Минимальные привилегии**: Сервисы могут общаться только с явно необходимыми другими сервисами
  - **Изоляция управления**: Доступ admin полностью отделен от продуктивного трафика

### Усиление защиты файрвола

```
Фильтр пакетов: Stateful Packet Inspection (SPI)
Отслеживание соединений: Отслеживать установленные соединения
Гео-блокировка: Опционально включаемая (напр. только трафик ЕС)
IDS/IPS: Suricata (опционально, учитывать влияние на производительность)
Ограничение скорости: Уровень Caddy (напр. 100 зап/мин на IP)
```

### TLS/SSL

```
Источник сертификата: Let's Encrypt (автоматически через Caddy)
Версии TLS: TLS 1.2 минимум, TLS 1.3 предпочтительно
Наборы шифров: Современные (без устаревших шифров)
HSTS: Включен (Заголовок Strict-Transport-Security)
Certificate Pinning: Опционально для критических доменов
```

## Доступ VPN (WireGuard)

### Конфигурация (упрощенно)

```
# /etc/wireguard/wg0.conf (на OPNSense)
[Interface]
Address = <VPN_INTERNAL_IP>/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = <VPN_PORT>

[Peer]
# Admin-Клиент 1
PublicKey = <CLIENT_1_PUBLIC_KEY>
AllowedIPs = <CLIENT_1_VPN_IP>/32
PersistentKeepalive = 25

[Peer]
# Admin-Клиент 2
PublicKey = <CLIENT_2_PUBLIC_KEY>
AllowedIPs = <CLIENT_2_VPN_IP>/32
PersistentKeepalive = 25
```

**Сценарии использования**:

  - Доступ SSH к хосту Proxmox
  - Прямой доступ к Web-UI OPNSense
  - Администрирование базы данных (Клиенты PostgreSQL)
  - Аварийное восстановление

::: danger Управление ключами VPN
Приватные ключи WireGuard **высокочувствительны**! Никогда не коммитить в Git или отправлять по незашифрованной email!
:::

## Устранение неполадок

### Тестирование сетевой доступности

```
# С хоста Proxmox
ping <DB_CONTAINER_IP>  # Контейнер PostgreSQL
ping <FRONTEND_CONTAINER_IP>  # Контейнер Frontend

# С контейнера Frontend (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# Проверить разрешение DNS
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### Дебаггинг файрвола (OPNSense)

```
# На OPNSense (через SSH по VPN)
pfctl -sr | grep <SERVICE_NAME>  # Показать активные правила
pfctl -ss | grep <PORT>  # Активные состояния/соединения

# Захват трафика в реальном времени
tcpdump -i <INTERFACE> port <PORT> -n

# Логи файрвола (заблокированные пакеты)
grep "block" /var/log/filter.log | tail -50
```

### Дебаггинг маршрутизации Caddy

```
# На OPNSense
curl -I https://www.data-dna.eu  # Внешний запрос
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # Прямой тест бэкенда

# Логи Caddy
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## Планируемые расширения

### Интеграция Ory IAM

**Новые правила файрвола**:

  - Frontend → Ory IAM (Валидация сессии)
  - Ory IAM → База данных (Данные Auth)
  - Caddy → Ory IAM (Reverse Proxy для auth-доменов)

**Новые домены Caddy**:

  - `auth.data-dna.eu` → UI Ory Kratos
  - `api.auth.data-dna.eu` → API Ory Kratos
  - `oauth.data-dna.eu` → Ory Hydra OAuth2

### Стек мониторинга (Опционально)

  - **Prometheus**: Сбор метрик со всех контейнеров
  - **Grafana**: Визуализация (Дашборды)
  - **Alertmanager**: Уведомления Email/Telegram при проблемах
  - **Node Exporter**: Системные метрики (CPU, RAM, Диск)

## Лучшие практики

✅ **Делать**:

  - Регулярно пересматривать правила файрвола (ежеквартально)
  - Использовать VPN для всего админ-доступа
  - Раздельные учетные записи пользователей для сервисов (без общих credentials)
  - Поддерживать сегментацию сети (не "Плоская Сеть")
  - Рассмотреть DNS-over-HTTPS (DoH) для upstream-резолверов

❌ **Не делать**:

  - Прямой доступ к базе данных из Интернета
  - Использовать стандартные пароли для OPNSense/Proxmox
  - Запускать все сервисы в одном контейнере
  - Игнорировать логи файрвола (регулярно проверять на аномалии)
  - Смешивать VLAN управления с продуктивной сетью

## Ссылки

  - [Документация OPNSense](https://docs.opnsense.org/)
  - [Гайд Firewall pfSense](https://docs.netgate.com/pfsense/) (совместим с OPNSense)
  - [VPN WireGuard](https://www.wireguard.com/quickstart/)
  - [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
  - [Приватные сети RFC1918](https://datatracker.ietf.org/doc/html/rfc1918)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.