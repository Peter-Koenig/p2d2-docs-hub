---
title: Контейнер GeoServer
description: Сервер WFS/WMS для геосервисов
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC: GeoServer

## Информация о контейнере

```
Тип: LXC (привилегированный/непривилегированный в зависимости от настройки)
ОС: Debian 13 (trixie)
Hostname: geoserver (настраиваемый)
Статус: запущен

Ресурсы:
  RAM: 6 ГБ
  Диск: 12 ГБ (динамически расширяемый)
  CPU Shares: Стандартные (1024)
```

## Установленное ПО

### Среда выполнения Java

```
Версия: OpenJDK 17 (LTS)
Опции JVM: Оптимизированы для нагрузки GeoServer
Память: 4 ГБ Heap (Xmx), 512 МБ PermGen
```

### Контейнер сервлетов Tomcat

```
Версия: 9.x (Официальный репозиторий Debian)
Сервис: tomcat9.service (systemd)
Webroot: /var/lib/tomcat9/webapps/geoserver
Порт: 8080 (HTTP), 8443 (HTTPS опционально)
```

### GeoServer

```
Версия: 2.x (текущая стабильная)
Установка: WAR-файл в Tomcat
Context-Path: /geoserver
Admin-Interface: /geoserver/web
```

## Конфигурация сервиса

### Сервис Systemd

```
# Проверить статус сервиса
systemctl status tomcat9

# Перезапустить сервис (с простоем)
systemctl restart tomcat9

# Посмотреть логи
journalctl -u tomcat9 -f --no-pager

# Включить сервис (автозапуск)
systemctl enable tomcat9
```

### Конфигурация Tomcat

```
# Конфигурация сервера
/etc/tomcat9/server.xml
  - Порт коннектора: 8080
  - Коннектор AJP: Отключен (Безопасность)
  - SSL/TLS: Опционально (через Caddy-proxy)

# Конфигурация приложения
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## Функции GeoServer

### Поддерживаемые протоколы

```
WMS (Web Map Service): Рендеринг карт
  - Версия: 1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service): Векторные данные
  - Версия: 1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactional): Доступ на запись
  - Операции Insert, Update, Delete
  - Для персистенции данных фронтенда p2d2

WMTS (Web Map Tile Service): Опционально
```

### Конфигурация источника данных

#### Подключение PostgreSQL/PostGIS

```
Параметры подключения:
  - Хост: postgresql.lan (внутренний DNS)
  - База данных: data-dna
  - Схема: public
  - Пользователь: geoserver (выделенный пользователь)

Хранилище PostGIS:
  - Расчетные границы: Авто-расчет
  - Предоставлять первичные ключи: Включено
  - Подготовленные операторы: Включено (Производительность)
```

#### Публикация слоев

```
Опубликованные слои:
  - kommunen (геометрии Polygon)
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - Пользовательские слои в зависимости от импорта данных

Стилизация (SLD):
  - Стандартные стили для разных типов геометрии
  - Пользовательские SLD для специальных представлений
  - Классификация на основе правил
```

## Сетевой доступ

```
Прослушивание: 
  - TCP Порт 8080 (HTTP, внутренняя LAN)
  - Нет прямого доступа из WAN

Доступ через Reverse Proxy:
  - ows.data-dna.eu → Endpoints WMS/WFS
  - wfs.data-dna.eu → Endpoints WFS-T (Frontend)

Правила Firewall:
  - Caddy (OPNSense) → GeoServer: РАЗРЕШИТЬ
  - Frontend → GeoServer: РАЗРЕШИТЬ (WFS-T)
  - MapProxy → GeoServer: РАЗРЕШИТЬ (WMS)
  - Внешний доступ: ЗАПРЕТИТЬ (только через Caddy)
```

## Оптимизация производительности

### Опции JVM (setenv.sh)

```
# /usr/share/tomcat9/bin/setenv.sh
export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### Конфигурация GeoServer

```
# /var/lib/geoserver/data/global.xml

<global>
  <settings>
    <proxyBaseUrl>https://ows.data-dna.eu/geoserver</proxyBaseUrl>
    <useHeadersProxyURL>false</useHeadersProxyURL>
    <verbose>false</verbose>
    <verboseExceptions>false</verboseExceptions>
    <maxFeatures>10000</maxFeatures>
    <numDecimals>8</numDecimals>
  </settings>
</global>
```

### Конфигурация GWC (GeoWebCache)

```
Конфигурация кэша:
  - Квота диска: 2 ГБ (ограничено диском контейнера)
  - Слои тайлов: Автоматически для WMS-слоев
  - Наборы сеток: WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - Meta-Tiling: 4x4 (Производительность vs Качество)
```

## Стратегия резервного копирования

### Снимок PBS (Уровень контейнера)

  - **Расписание**: Еженедельно
  - **Хранение**: 4 недели
  - **Тип**: LVM-Thin Snapshot

### Резервное копирование конфигурации GeoServer

```
# Ручное резервное копирование конфигурации
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz \
  /var/lib/geoserver/data/

# Автоматизация через Cronjob
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz" \
  /var/lib/geoserver/data/

# Удалить старые резервные копии (>90 дней)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip Портативность конфигурации
Резервные копии конфигурации GeoServer зависят от версии. При крупных обновлениях экспортируйте/импортируйте конфигурацию через UI GeoServer.
:::

## Мониторинг

### Проверки работоспособности

```
# Статус сервиса
curl -I http://localhost:8080/geoserver/web

# WMS Capabilities
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# Список слоев
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### Анализ логов

```
# Логи Tomcat
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# Логи GeoServer
tail -f /var/lib/geoserver/data/logs/geoserver.log

# Метрики производительности
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## Устранение неполадок

### GeoServer не запускается

```
# Проверить логи Tomcat
journalctl -u tomcat9 --no-pager -n 100

# Права доступа к каталогу данных GeoServer
ls -la /var/lib/geoserver/data/

# Проблемы с памятью JVM
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### Сообщения об ошибках WMS/WFS

```
# Слой недоступен
- Проверить подключение к хранилищу данных
- Протестировать подключение к PostgreSQL
- Права доступа к слою в GeoServer

# Проблемы с производительностью
- Увеличить размер кучи JVM
- Проверить индексы PostGIS
- Включить кэширование GWC
```

### Подключение к PostgreSQL

```
# Тест из контейнера GeoServer
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# Сетевая доступность
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## Конфигурация безопасности

### Безопасность GeoServer

```
Пользователь Admin: 
  - Имя пользователя: admin (изменить в production)
  - Пароль: <STRONG_PASSWORD> (не стандартный)

Доступ на основе ролей:
  - ADMIN_ROLE: Полный доступ
  - GROUP_ADMIN: Управление слоями
  - WMS_USER: Доступ только на чтение
  - WFS_USER: Доступ к объектам

Безопасность данных:
  - Разрешения на уровне слоя
  - Изоляция рабочего пространства
  - Ограничения сервиса OGC
```

### Сетевая безопасность

```
Правила Firewall:
  - Только Caddy-proxy имеет доступ (Reverse Proxy)
  - Нет прямого доступа из WAN
  - Внутренняя коммуникация только с авторизованными сервисами

TLS/SSL:
  - Через Caddy-proxy (Let's Encrypt)
  - Заголовок HSTS включен
  - Современные наборы шифров
```

## Интеграция с архитектурой p2d2

### Интеграция с Frontend (WFS-T)

```
// Frontend AstroJS → GeoServer WFS-T
const wfsTransaction = `
<wfs:Transaction service="WFS" version="2.0.0"
  xmlns:wfs="http://www.opengis.net/wfs/2.0"
  xmlns:gml="http://www.opengis.net/gml/3.2">
  <wfs:Insert>
    <feature:gebaeude xmlns:feature="http://www.data-dna.eu/features">
      <feature:geom>
        <gml:Point srsName="EPSG:4326">
           <gml:pos>7.0 51.0</gml:pos>
        </gml:Point>
      </feature:geom>
    </feature:gebaeude>
  </wfs:Insert>
</wfs:Transaction>`;

// HTTP POST в GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: wfsTransaction
});
```

### Интеграция с MapProxy (WMS)

```
# Конфигурация MapProxy
sources:
  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

caches:
  geoserver_cache:
    sources: [geoserver_wms]
    grids: [webmercator]
    cache:
      type: file
      directory: /cache/geoserver
```

## Лучшие практики

✅ **Делать**:

  - Регулярные обновления GeoServer (патчи безопасности)
  - Раздельные пользователи для разных уровней доступа
  - Кэширование GWC для часто запрашиваемых слоев
  - Мониторинг производительности JVM (использование кучи)
  - Резервное копирование конфигурации GeoServer

❌ **Не делать**:

  - Использовать стандартные пароли
  - Предоставлять прямой доступ к GeoServer из интернета
  - Разрешать неограниченное MaxFeatures
  - Запускать без ограничений ресурсов
  - Изменять конфигурацию без резервной копии

## Ссылки

  - [Документация GeoServer](https://docs.geoserver.org/)
  - [Безопасность GeoServer](https://docs.geoserver.org/stable/en/user/security/)
  - [Спецификация WFS-T](https://www.ogc.org/standards/wfs)
  - [Администрирование Tomcat 9](https://tomcat.apache.org/tomcat-9.0-doc/)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.