---
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Руководство по Администрированию

Добро пожаловать в Руководство по администрированию p2d2. Здесь вы найдете техническую документацию по установке, настройке и эксплуатации геоданных инфраструктуры.

## Целевая аудитория

Это руководство предназначено для:

  - **Системных администраторов**, которые устанавливают и эксплуатируют p2d2
  - **Инженеров DevOps**, которые автоматизируют развертывание
  - **Специалистов GDI**, которые настраивают инфраструктуру геоданных

## Обзор Архитектуры

p2d2 основан на многоуровневой архитектуре:

1.  **Уровень инфраструктуры**: Proxmox VE, OPNsense, PBS
2.  **Инфраструктура геоданных**: PostgreSQL/PostGIS, GeoServer, MapProxy
3.  **Фронтенд**: Приложение AstroJS с OpenLayers
4.  **CI/CD**: Конвейер развертывания на базе GitLab

## Системные требования

### Аппаратное обеспечение

  - **Хост Proxmox**: Intel 13-го поколения (или аналог), 14 ядер, 64 ГБ RAM
  - **Общая система**: \~28 ГБ RAM для всех контейнеров/ВМ + накладные расходы для Proxmox
  - **Хранилище**: Мин. 200 ГБ SSD (для контейнеров/ВМ + место для бэкапов)
  - **Сеть**: 1 Гбит/с (10 Гбит/с для продакшена)

### Программное обеспечение

  - **Виртуализация**: Proxmox VE 9.x
  - **ОС контейнера**: Debian 13
  - **ОС брандмауэра**: FreeBSD 14.x (OPNSense)
  - **База данных**: PostgreSQL 15+ с PostGIS 3.4+
  - **Веб-сервер**: Caddy (терминация TLS)
  - **Node.js**: 20.x LTS

## Навигация

### Серверная инфраструктура

  - [Обзор архитектуры сервера](https://www.google.com/search?q=./server-architektur/) - Общая архитектура инфраструктуры p2d2
  - [Хост Proxmox](https://www.google.com/search?q=./server-architektur/proxmox-host) - Платформа виртуализации
  - [Брандмауэр OPNSense](https://www.google.com/search?q=./server-architektur/vm-opnsense) - Брандмауэр и обратный прокси
  - [Сетевая архитектура](https://www.google.com/search?q=./server-architektur/netzwerk-architektur) - Сегментация сети и дизайн брандмауэра
  - [Стратегия резервного копирования](https://www.google.com/search?q=./server-architektur/backup-strategie) - Резервное копирование данных и аварийное восстановление

### Инфраструктура геоданных

  - [Контейнер PostgreSQL/PostGIS](https://www.google.com/search?q=./server-architektur/lxc-postgresql) - Геопространственная база данных с пространственными расширениями
  - [Контейнер GeoServer](https://www.google.com/search?q=./server-architektur/lxc-geoserver) - Сервер WFS/WMS для геосервисов
  - [Контейнер MapProxy](https://www.google.com/search?q=./server-architektur/lxc-mapproxy) - Кэш тайлов и прокси для производительной доставки карт
  - [ВМ OSM-Tileserver](https://www.google.com/search?q=./server-architektur/vm-osm-tiler) - Сервер рендеринга тайлов OpenStreetMap
  - [Контейнер Ory IAM (Планируется)](https://www.google.com/search?q=./server-architektur/lxc-ory-iam) - Управление идентификацией и доступом

### ПО и развертывание

  - [Контейнер Фронтенда](https://www.google.com/search?q=./server-architektur/lxc-frontend) - Веб-фронтенд AstroJS + VitePress с CI/CD для нескольких веток
  - [Архитектура Фронтенда](https://www.google.com/search?q=./frontend-architektur) - Приложение AstroJS
  - [Архитектура ПО](https://www.google.com/search?q=./software-architektur) - Компоненты и модули
  - [Развертывание](https://www.google.com/search?q=./deployment/staging) - Staging и Production

## Быстрый старт

Для быстрой установки в тестовой среде:

```
# Клонировать репозиторий
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# Установить зависимости
npm install

# Запустить сервер разработки
npm run dev
```

Для полной установки в производственной среде следуйте разделам Руководства по администрированию.

::: warning Предупреждение о безопасности
Быстрая установка подходит только для тестовых сред \! Для производственных систем необходимо учитывать аспекты безопасности.
:::

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.