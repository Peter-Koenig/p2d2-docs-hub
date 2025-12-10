---
title: Контейнер PostgreSQL/PostGIS
description: Сервер геобазы данных с пространственными расширениями
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Перевод: ИИ)"
  reviewDate: null
---

# LXC: PostgreSQL/PostGIS

## Информация о контейнере

```
Тип: LXC (привилегированный/непривилегированный в зависимости от настройки)
ОС: Debian 13 (trixie)
Hostname: postgresql (настраиваемый)
Статус: запущен

Ресурсы:
  RAM: 2 ГБ
  Диск: 15 ГБ (динамически расширяемый)
  CPU Shares: Стандартные (1024)
```

## Установленное ПО

### PostgreSQL

```
Версия: 18.x (Официальный репозиторий Debian)
Сервис: postgresql.service (systemd)
Socket: UNIX + TCP/IP
Доступ: Внутренняя LAN (не выставлен наружу)
```

### PostGIS

```
Версия: 3.6.x
Расширение: Включено в производственной базе данных
Возможности: 
  - Типы пространственной геометрии (Point, LineString, Polygon)
  - Пространственные индексы (GiST, SP-GiST)
  - Трансформации координат (Поддержка SRID)
  - Поддержка топологии
```

## Базы данных

| Database | PostGIS | Назначение |
|---|---|---|
| `postgres` | ❌ | Системная база данных (Стандарт) |
| `data-dna` | ✅ | **Производственная БД для p2d2** |

::: tip Включить расширение PostGIS

```
-- В новой базе данных
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Верификация
SELECT PostGIS_Full_Version();
```

:::

## Сетевой доступ

```
Прослушивание: 
  - TCP Порт <STANDARD_PG_PORT> (все интерфейсы)
  - UNIX Socket: /var/run/postgresql/

pg_hba.conf:
  - localhost: Trust (для обслуживания)
  - Внутренняя LAN: Аутентификация по паролю md5
  - WAN: DENY (заблокировано файрволом)
```

**Строка подключения** (для приложений в той же LAN):

```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Сервис Systemd

```
# Проверить статус сервиса
systemctl status postgresql

# Перезапустить сервис (с простоем)
systemctl restart postgresql

# Посмотреть логи
journalctl -u postgresql -f --no-pager

# Включить сервис (автозапуск)
systemctl enable postgresql
```

## Функции PostGIS

### Пространственные запросы

```
-- Тест Point-in-Polygon
SELECT name FROM kommunen 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- Расчет расстояния (в метрах)
SELECT ST_Distance(
  ST_Transform(geom1, 3857),
  ST_Transform(geom2, 3857)
);

-- Буфер (буфер 500м вокруг геометрии)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### Оптимизация производительности

```
-- Создать пространственный индекс
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- Обновить статистику
ANALYZE kommunen;

-- Vacuum для очистки
VACUUM ANALYZE kommunen;
```

## Стратегия резервного копирования

### Снимок PBS (Уровень контейнера)

  - **Расписание**: Ежедневно ночью
  - **Хранение**: 14 дней
  - **Тип**: LVM-Thin Snapshot (консистентный)

### SQL-Дампы (Уровень базы данных)

```
# Ручной бэкап
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Автоматизация через Cronjob
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# Удалять старые бэкапы (>30 дней)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning Комплементарность бэкапов
Снэпшоты PBS быстры для восстановления контейнера. SQL-дампы позволяют выборочно восстанавливать таблицы и портативны между версиями PostgreSQL.
:::

## Настройка производительности

### Рекомендуемые изменения postgresql.conf

```
# Память (для контейнера 2GB RAM)
shared_buffers = 512MB            # 25% RAM
effective_cache_size = 1536MB     # 75% RAM
work_mem = 16MB                   # Память на запрос
maintenance_work_mem = 128MB      # Для VACUUM/CREATE INDEX

# Оптимизации PostGIS
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # Оптимизировано для SSD (вместо 4.0 для HDD)
```

### Анализ запросов

```
-- Идентифицировать медленные запросы (Расширение pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 секунды
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Мониторинг

```
-- Активные подключения
SELECT count(*), state FROM pg_stat_activity 
GROUP BY state;

-- Размер базы данных
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- Самые большие таблицы
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Устранение неполадок

### Контейнер не запускается

```
# На хосте Proxmox
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # Последние логи загрузки
```

### PostgreSQL не запускается

```
# В контейнере
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# Протестировать конфигурационный файл
su - postgres -c "postgres -C config_file"
```

### Проблемы с подключением

```
# Слушает ли PostgreSQL?
ss -tlnp | grep postgres

# Существует ли правило firewall?
iptables -L -n | grep <PORT>

# Проверить pg_hba.conf
cat /etc/postgresql/*/main/pg_hba.conf
```

## Расширение для Ory IAM (планируется)

Для планируемой интеграции Ory потребуются дополнительные базы данных:

```
-- База данных Ory-Kratos
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- База данных Ory-Hydra
CREATE USER ory_hydra WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

Подробности: [Интеграция Ory IAM](https://www.google.com/search?q=./lxc-ory-iam.md)

## Лучшие практики

✅ **Делать**:

  - Регулярные VACUUM ANALYZE для производительности
  - Пространственные индексы на колонках геометрии
  - Connection Pooling (pgBouncer) для высокой нагрузки
  - Раздельные учетные записи пользователей с минимальными привилегиями

❌ **Не делать**:

  - Запускать PostgreSQL от root
  - Использовать стандартные пароли
  - Прямой доступ к базе данных из WAN
  - Хранить большие геометрии без генерализации

## Ссылки

  - [Документация PostgreSQL 18](https://www.postgresql.org/docs/18/)
  - [Мануал PostGIS 3.6](https://postgis.net/docs/manual-3.6/)
  - [Гайд по оптимизации производительности](https://wiki.postgresql.org/wiki/Performance_Optimization)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.