---
title: Архитектура Сервера
description: Обзор инфраструктуры геопространственных данных p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Архитектура Сервера

[cite_start]Инфраструктура p2d2 основана на **Proxmox VE 9.x** и использует гибридную архитектуру из **LXC-контейнеров** для микросервисов и **VMs** для сложных сетевых задач и сервера тайлов. [cite: 1070] [cite_start]Виртуализация работает на современном оборудовании Intel (13-е поколение, 14 ядер, 64 ГБ RAM). [cite: 1070]

## Обзор Архитектуры

TODO: Вставить графику

## Обзор Компонентов

| Компонент | Тип | Роль | RAM | Диск | ОС |
|---|---|---|---|---|---|
| **OPNSense** | VM | Файрвол + Reverse Proxy | 4 ГБ | 25 ГБ | [cite_start]FreeBSD 14.x | [cite: 1072]
| **PostgreSQL** | LXC | Геобаза данных + PostGIS | 2 ГБ | 15 ГБ | [cite_start]Debian 13 | [cite: 1073]
| **GeoServer** | LXC | Сервер WFS/WMS | 6 ГБ | 12 ГБ | [cite_start]Debian 13 | [cite: 1074]
| **MapProxy** | LXC | Кэш тайлов + Прокси | 4 ГБ | 38 ГБ | [cite_start]Debian 13 | [cite: 1075]
| **OSM-Tiler** | VM | Рендеринг тайлов | 6 ГБ | 65 ГБ | [cite_start]Debian 13 | [cite: 1075]
| **Frontend** | LXC | AstroJS + VitePress | 4 ГБ | 25 ГБ | [cite_start]Debian 13 | [cite: 1076]
| **Ory IAM** *(план)* | LXC | Управление идентификацией | 2 ГБ | 10 ГБ | [cite_start]Debian 13 | [cite: 1077]

## Принципы Проектирования

### Изоляция Сервисов

[cite_start]Каждый сервис работает в своем собственном LXC-контейнере или VM. [cite: 1078] Это позволяет:

  - [cite_start]Независимые обновления без простоя других сервисов [cite: 1078]
  - [cite_start]Изоляция ресурсов и настройка производительности для каждого сервиса [cite: 1078]
  - [cite_start]Откат отдельных компонентов в случае проблем [cite: 1078]

### Сегментация Сети

  - [cite_start]**Принцип DMZ**: Frontend-контейнер не имеет прямого доступа на запись в базу данных [cite: 1078]
  - [cite_start]**Firewall-First**: Все внешние запросы проходят через OPNSense [cite: 1078]
  - [cite_start]**Внутренняя LAN**: Выделенная частная сеть для взаимодействия между сервисами [cite: 1078]
  - [cite_start]**VLAN Управления**: Отдельная сеть для административного доступа [cite: 1078]

### Функции Безопасности

  - [cite_start]**Файрвол Proxmox**: Включен на уровне хоста [cite: 1078]
  - [cite_start]**OPNSense**: Stateful Packet Inspection, правила NAT [cite: 1078]
  - [cite_start]**Caddy TLS**: Автоматические сертификаты Let's Encrypt [cite: 1078]
  - [cite_start]**Admin VPN-Only**: Административный доступ только через VPN [cite: 1078]

## Стратегия Резервного Копирования

[cite_start]**Proxmox Backup Server (PBS)** создает инкрементальные снимки всех контейнеров и VM: [cite: 1079]

  - [cite_start]**Ежедневные бэкапы**: Критические компоненты (БД, Frontend, Файрвол) [cite: 1079]
  - [cite_start]**Еженедельные бэкапы**: Middleware GDI (GeoServer, MapProxy) [cite: 1079]
  - [cite_start]**Ежемесячные бэкапы**: Сервер тайлов (большие объемы данных) [cite: 1079]
  - [cite_start]**Автоматическое хранение**: Политики PBS для старых бэкапов [cite: 1079]

[cite_start]Подробности: [Стратегия Резервного Копирования](https://www.google.com/search?q=./backup-strategie.md) [cite: 1079]

## Дополнительная Документация

  - [Подробности о Хосте Proxmox](https://www.google.com/search?q=./proxmox-host.md)
  - [Контейнер PostgreSQL/PostGIS](https://www.google.com/search?q=./lxc-postgresql.md)
  - [Контейнер GeoServer](https://www.google.com/search?q=./lxc-geoserver.md)
  - [Контейнер MapProxy](https://www.google.com/search?q=./lxc-mapproxy.md)
  - [Контейнер Frontend](https://www.google.com/search?q=./lxc-frontend.md)
  - [Файрвол OPNSense](https://www.google.com/search?q=./vm-opnsense.md)
  - [Сервер Тайлов OSM](https://www.google.com/search?q=./vm-osm-tiler.md)
  - [Архитектура Сети](https://www.google.com/search?q=./netzwerk-architektur.md)
  - [Планируемая интеграция Ory IAM](https://www.google.com/search?q=./lxc-ory-iam.md)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.