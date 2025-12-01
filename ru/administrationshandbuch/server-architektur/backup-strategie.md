---
title: Стратегия резервного копирования
description: Резервное копирование данных и аварийное восстановление
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Стратегия резервного копирования

## Proxmox Backup Server (PBS)

### Конфигурация хранилища

```
Имя хранилища: p2d2-pbs
Тип: Proxmox Backup Server (дедуплицирующий)
Содержимое: Backups (VMs + LXCs)
Статус: Active, Shared
Дедупликация: Enabled (на основе чанков)
Шифрование: Опционально настраиваемое
```

::: tip Преимущества PBS

  - **Инкрементные бэкапы**: Только изменения с последнего бэкапа
  - **Дедупликация**: Повторяющиеся данные хранятся только один раз
  - **Верификация**: Автоматическая проверка целостности бэкапа
  - **Быстрые восстановления**: Прямой доступ к снэпшотам
    :::

### Расписание бэкапов (Обобщенное)

**Задания бэкапа** (настроены через Proxmox Web-UI):

| Компонент | Расписание | Хранение | Тип |
|---|---|---|---|
| OPNSense (Firewall) | Ежедневно | 7 дней | Snapshot |
| PostgreSQL/PostGIS | Ежедневно | 14 дней | Snapshot |
| GeoServer | Еженедельно | 4 недели | Snapshot |
| MapProxy | Еженедельно | 4 недели | Snapshot |
| OSM-Tiler | Ежемесячно | 3 месяца | Snapshot |
| Frontend (AstroJS) | Ежедневно | 7 дней | Snapshot |

::: warning Окно бэкапа
Бэкапы должны выполняться **вне часов пиковой нагрузки** (обычно ночью). Время бэкапов **не документируется специально** (лучшая практика безопасности).
:::

### Типы бэкапов

#### Снэпшоты контейнеров (LXC)

```
# Создать ручной бэкап
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# Проверить статус бэкапа
pvesm list p2d2-pbs | grep "ct-<VMID>"

# Восстановить контейнер из бэкапа
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**Преимущества LVM-Thin Snapshots**:

  - Консистентные (уровень файловой системы)
  - Быстрые (только копия метаданных)
  - Без даунтайма сервиса во время бэкапа

#### Бэкапы VM (QEMU/KVM)

```
# Бэкап VM (с приостановкой для консистентности)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# Восстановить VM
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### Политика хранения

```
Ежедневные бэкапы: 
  - Хранение: 7 дней
  - Сервисы: PostgreSQL, Frontend, Firewall

Еженедельные бэкапы:
  - Хранение: 4 недели
  - Сервисы: GeoServer, MapProxy

Ежемесячные бэкапы:
  - Хранение: 3 месяца
  - Сервисы: OSM-Tiler (большие объемы данных)

Автоматическая очистка: Задание Prune PBS (ежедневно)
```

## Бэкапы базы данных (Дополнительно к PBS)

### PostgreSQL pg_dump

```
# SQL-Дамп (на контейнере PostgreSQL)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Автоматизация через Cron
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# Удалять старые бэкапы (>30 дней)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**Зачем дополнительно к PBS?**:

  - ✅ Выборочное восстановление отдельных таблиц
  - ✅ Портативность между версиями PostgreSQL
  - ✅ Меньший размер бэкапа (сжатый)
  - ✅ Импорт в тестовые среды без восстановления контейнера

### Пользовательский формат PostGIS

```
# Пользовательский формат (с бинарными объектами)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# Восстановление (возможно выборочное)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## Бэкапы конфигурации

### Caddy (OPNSense)

```
# Бэкап Caddyfile + пользовательских конфигов
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/Caddyfile \
  /usr/local/etc/caddy/caddy.d/

# TLS-сертификаты (автоматически бэкапятся через бэкап VM PBS)
```

### Сервисы Systemd (Frontend)

```
# Бэкап всех сервисов p2d2
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/systemd/system/webhook-server.service
```

## Аварийное восстановление (Disaster Recovery)

### Полный отказ хоста

**Сценарий**: Аппаратный отказ сервера Proxmox

**Шаги восстановления**:

1.  **Настроить новый хост Proxmox**

    ```
    # Установить Proxmox VE с ISO
    # Восстановить конфигурацию сети (Bridges)
    ```

2.  **Подключить хранилище PBS**

    ```
    # В Proxmox Web-UI: Datacenter → Storage → Add → PBS
    # Сервер PBS: <PBS_IP_OR_HOSTNAME>
    # Datastore: p2d2-backups
    ```

3.  **Восстановить контейнеры/VMs**

    ```
    # Через Web-UI: Storage → p2d2-pbs → Content → Restore
    # Или CLI:
    pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
    qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
    ```

4.  **Проверить сервисы**

    ```
    # PostgreSQL
    pct exec <PG_VMID> -- systemctl status postgresql

    # Целостность базы данных
    pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
    ```

### Отказ отдельного контейнера

**Сценарий**: Контейнер PostgreSQL поврежден

```
# Остановить контейнер
pct stop <PG_VMID>

# Восстановить из бэкапа
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<ДАТА>.tar.zst --force

# Запустить контейнер
pct start <PG_VMID>

# Проверить статус сервиса
pct exec <PG_VMID> -- systemctl status postgresql
```

### Повреждение базы данных

**Сценарий**: Данные PostgreSQL повреждены, но контейнер в порядке

```
# Удалить базу данных
sudo -u postgres dropdb data-dna

# Создать заново
sudo -u postgres createdb data-dna

# Восстановить SQL-Дамп
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# Повторно активировать расширение PostGIS
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## Бэкапы вне площадки (Off-Site)

В настоящее время все экземпляры бэкапятся в локальный Proxmox-Backup. После бэкапа, они синхронизируются с удаленным PBS, расположенным в Германии.

## Верификация бэкапов

Все бэкапы верифицируются один раз в неделю на обоих PBS.

### Ежемесячный тест восстановления (планируется)

```
# Создать тестовый контейнер из бэкапа
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst \
  --hostname postgresql-test \
  --storage local-lvm

# Проверить запуск сервиса
pct start 999
pct exec 999 -- systemctl status postgresql

# Протестировать доступ к базе данных
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# Очистка
pct stop 999
pct destroy 999
```

### Проверить целостность базы данных

```
-- Функциональность PostGIS
SELECT PostGIS_Full_Version();

-- Количество записей (проверка на правдоподобность)
SELECT 
  'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT 
  'geometries' AS table_name, COUNT(*) FROM geometries;

-- Валидность геометрии
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## Мониторинг бэкапов

### Логи задач Proxmox

```
# Показать логи бэкапов
cat /var/log/vzdump.log | grep "ERROR\|WARN"

# Проверить статус PBS
proxmox-backup-manager tasks list

# Использование хранилища
pvesm status p2d2-pbs
```

### Конфигурация оповещений

```
# Email-уведомления о сбоях бэкапа
# В Proxmox Web-UI: Datacenter → Notifications

# Пользовательский скрипт мониторинга
#!/bin/bash
# /etc/cron.hourly/backup-check
LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## Лучшие практики

✅ **Делать**:

  - Регулярно проводить тесты восстановления
  - Мониторить логи бэкапов и анализировать ошибки
  - Адаптировать политики хранения к бизнес-требованиям
  - Документировать изменения конфигурации
  - Настроить мониторинг для заданий бэкапа

❌ **Не делать**:

  - Считать бэкапы рабочими без верификации
  - Бэкапить критические данные только на один носитель
  - Игнорировать сбои бэкапов
  - Работать без плана аварийного восстановления
  - Не мониторить емкость бэкапов

## Ссылки

  - [Документация Proxmox Backup Server](https://pbs.proxmox.com/docs/)
  - [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
  - [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
  - [Правило бэкапа 3-2-1](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

> **Примечание:** Этот текст был автоматически переведен с помощью ИИ и еще не проверен человеком.