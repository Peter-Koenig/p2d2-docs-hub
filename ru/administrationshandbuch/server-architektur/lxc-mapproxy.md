---
title: Контейнер MapProxy
description: Кэш тайлов и прокси для производительной доставки карт
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung: KI)"
  reviewDate: null
---

# LXC: MapProxy

## Информация о контейнере

```
Тип: LXC (привилегированный/непривилегированный в зависимости от настройки)
ОС: Debian 13 (trixie)
Hostname: mapproxy (настраиваемый)
Статус: запущен

Ресурсы:
  RAM: 4 ГБ
  Диск: 38 ГБ (динамически расширяемый)
  CPU Shares: Стандартные (1024)
```

## Установленное ПО

### Среда выполнения Python

```
Версия: Python 3.13.x (Официальный репозиторий Debian)
Виртуальное окружение: /opt/mapproxy/venv
Менеджер пакетов: pip (Python Package Index)
```

### MapProxy

```
Версия: 4.x (текущая стабильная)
Установка: Пакет Python через pip
Сервис: mapproxy.service (systemd)
Сервер WSGI: Gunicorn
Workers: 4 (настраиваемый)
```

### Gunicorn (Сервер WSGI)

```
Версия: 21.x (Сервер HTTP WSGI Python)
Binding: UNIX Socket + TCP (для разработки)
Process Manager: Модель worker Pre-fork
```

## Конфигурация сервиса

### Сервис Systemd

```
# Проверить статус сервиса
systemctl status mapproxy

# Перезапустить сервис (с простоем)
systemctl restart mapproxy

# Посмотреть логи
journalctl -u mapproxy -f --no-pager

# Включить сервис (автозапуск)
systemctl enable mapproxy
```

### Конфигурация MapProxy

#### Основная конфигурация (mapproxy.yaml)

```
# /etc/mapproxy/mapproxy.yaml
services:
  demo:
  wms:
    srs: ['EPSG:3857', 'EPSG:4326']
    image_formats: ['image/png', 'image/jpeg']
    max_output_pixels: [3000, 3000]
  kml:
    srs: 'EPSG:4326'
  tms:
    origin: 'nw'
  wmts:
    restful: true
    restful_template: '/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.{Format}'
    kvp: true

layers:
  - name: osm
    title: OpenStreetMap Tiles
    sources: [osm_cache]

  - name: geoserver_base
    title: GeoServer Base Layers
    sources: [geoserver_cache]

caches:
  osm_cache:
    grids: [webmercator]
    sources: [osm_tiles]
    cache:
      type: file
      directory: /cache/osm
      directory_layout: tms

  geoserver_cache:
    grids: [webmercator]
    sources: [geoserver_wms]
    cache:
      type: file
      directory: /cache/geoserver
      directory_layout: tms

sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator

  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

grids:
  webmercator:
    base: GLOBAL_WEBMERCATOR
    srs: 'EPSG:3857'
    origin: 'nw'

globals:
  cache:
    base_dir: '/cache'
    lock_dir: '/cache/locks'
  image:
    resampling_method: bilinear
```

## Сетевой доступ

```
Прослушивание: 
  - UNIX Socket: /run/mapproxy/mapproxy.sock
  - TCP Порт 8080 (HTTP, внутренняя LAN, Разработка)

Доступ через Reverse Proxy:
  - tiles.data-dna.eu → Endpoints тайлов
  - proxy.data-dna.eu → Endpoints WMS

Правила Firewall:
  - Caddy (OPNSense) → MapProxy: РАЗРЕШИТЬ
  - Frontend → MapProxy: РАЗРЕШИТЬ (Запросы тайлов)
  - MapProxy → GeoServer: РАЗРЕШИТЬ (Proxy WMS)
  - MapProxy → OSM-Tiler: РАЗРЕШИТЬ (Рендеринг тайлов)
  - Внешний доступ: ЗАПРЕТИТЬ (только через Caddy)
```

## Оптимизация производительности

### Конфигурация Gunicorn

```
# /etc/mapproxy/gunicorn.conf.py
bind = "unix:/run/mapproxy/mapproxy.sock"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/mapproxy/access.log"
errorlog = "/var/log/mapproxy/error.log"
loglevel = "info"
```

### Оптимизация кэша

```
Хранилище кэша:
  - OSM Tiles: ~20 ГБ (преконфигурированные уровни масштабирования)
  - GeoServer Cache: ~10 ГБ (динамически растет)
  - Temp Space: ~8 ГБ (для операций рендеринга)

Очистка кэша:
  - Автоматическая очистка старых тайлов
  - Политика LRU (Least Recently Used)
  - Ручная инвалидация кэша при изменениях слоя
```

## Стратегия резервного копирования

### Снимок PBS (Уровень контейнера)

  - **Расписание**: Еженедельно
  - **Хранение**: 4 недели
  - **Тип**: LVM-Thin Snapshot

### Резервное копирование конфигурации

```
# Ручное резервное копирование конфигурации
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Автоматизация через Cronjob
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz" \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Удалить старые резервные копии (>90 дней)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning Данные кэша
Данные кэша MapProxy **не** бэкапятся. Они могут быть перерендерены при необходимости. Критична только конфигурация.
:::

## Мониторинг

### Проверки работоспособности

```
# Статус сервиса
curl -I http://localhost:8080/demo

# Протестировать запрос тайла
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# WMS Capabilities
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### Метрики производительности

```
# Использование кэша
du -sh /cache/osm/
du -sh /cache/geoserver/

# Статус worker Gunicorn
systemctl status mapproxy | grep "active (running)"

# Анализ логов
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## Устранение неполадок

### MapProxy не запускается

```
# Проверить логи systemd
journalctl -u mapproxy --no-pager -n 100

# Валидация конфигурации
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# Проблемы с правами доступа
ls -la /run/mapproxy/
ls -la /cache/
```

### Ошибки рендеринга тайлов

```
# Подключение OSM-Tiler
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# Подключение GeoServer
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# Права доступа к каталогу кэша
ls -la /cache/osm/0/0/
```

### Проблемы с производительностью

```
# Проверить процессы worker
ps aux | grep gunicorn

# Использование памяти
free -h

# Место на диске
df -h /cache
```

## Конфигурация безопасности

### Усиление защиты сервиса

```
Изоляция пользователя:
  - Выделенный пользователь: mapproxy
  - Группа: mapproxy
  - Домашний каталог: /opt/mapproxy

Права доступа к файлам:
  - Файлы конфигурации: 640 (root:mapproxy)
  - Каталог кэша: 755 (mapproxy:mapproxy)
  - Файлы логов: 644 (mapproxy:mapproxy)
```

### Сетевая безопасность

```
Правила Firewall:
  - Только авторизованные сервисы имеют доступ
  - Нет прямого доступа из WAN
  - Reverse Proxy с ограничением скорости запросов

TLS/SSL:
  - Через Caddy-proxy (Let's Encrypt)
  - Заголовок HSTS включен
  - Современные наборы шифров
```

## Интеграция с архитектурой p2d2

### Интеграция с Frontend

```
// Frontend AstroJS → Тайлы MapProxy
const tileUrl = `https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png`;

// Интеграция Leaflet
const map = L.map('map').setView([51.0, 7.0], 10);
L.tileLayer(tileUrl, {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);
```

### Proxy GeoServer

```
# Proxy WMS для слоя GeoServer
const wmsUrl = `https://proxy.data-dna.eu/service?` +
  `service=WMS&version=1.3.0&request=GetMap&` +
  `layers=geoserver_base&styles=&format=image/png&` +
  `transparent=true&width=256&height=256&` +
  `crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### Интеграция OSM-Tiler

```
# Прямые запросы тайлов к OSM-Tiler
sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator
    transparent: true
    coverage:
      bbox: [-180, -85, 180, 85]
      srs: 'EPSG:4326'
```

## Расширенные возможности

### Seeding (Пред-рендеринг)

```
# Ручной Seeding для определенных областей
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 0-10 \
  --bbox 5.8,50.2,9.0,52.5

# Автоматический Seeding через Cron
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 11-14 \
  --bbox 6.0,50.5,7.5,51.5
```

### Управление кэшем

```
# Статистика кэша
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  cache-stats osm_cache

# Очистка кэша
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache osm_cache --max-age 30

# Инвалидация кэша
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache geoserver_cache --all
```

## Лучшие практики

✅ **Делать**:

  - Регулярные обновления MapProxy (патчи безопасности)
  - Мониторинг использования кэша
  - Адаптировать workers Gunicorn к доступным ядрам CPU
  - Каталог кэша на отдельном разделе/томе
  - Ротация логов для логов доступа/ошибок

❌ **Не делать**:

  - Предоставлять прямой доступ к MapProxy из интернета
  - Разрешать неограниченное хранилище кэша
  - Запускать без ограничения скорости запросов
  - Изменять конфигурацию без бэкапа
  - Хранить старые данные кэша неограниченно

## Ссылки

  - [Документация MapProxy](https://mapproxy.org/docs/)
  - [Конфигурация Gunicorn](https://docs.gunicorn.org/en/stable/configure.html)
  - [Спецификация Tile Map Service](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
  - [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.