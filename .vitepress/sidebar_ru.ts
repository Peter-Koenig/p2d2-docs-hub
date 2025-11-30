export const sidebar_ru = {
  "/ru/entwicklung/": [
    {
      text: "Разработка",
      items: [
        {
          text: "Вклад",
          link: "/ru/entwicklung/contributing",
        },
        {
          text: "Плагин синхронизации полигонов",
          link: "/ru/entwicklung/polygon-sync",
        },
      ],
    },
  ],
  "/ru/planning/": [
    {
      text: "Релиз",
      items: [
        {
          text: "Дорожная карта",
          collapsed: true,
          items: [{ text: "Обзор", link: "/ru/planning/" }],
        },
        {
          text: "Планирование",
          collapsed: true,
          items: [{ text: "Планирование v0.2.0", link: "/ru/planning/v0.2.0" }],
        },
        {
          text: "Релизы",
          collapsed: true,
          items: [
            { text: "Обзор", link: "/ru/releases/" },
            { text: "v0.1.0", link: "/ru/releases/v0.1.0" },
          ],
        },
        {
          text: "Бэклог функций",
          collapsed: true,
          items: [{ text: "Обзор", link: "/ru/planning/backlog" }],
        },
      ],
    },
  ],
  "/ru/releases/": [
    {
      text: "Релиз",
      items: [
        {
          text: "Дорожная карта",
          collapsed: true,
          items: [{ text: "Обзор", link: "/ru/planning/" }],
        },
        {
          text: "Планирование",
          collapsed: true,
          items: [{ text: "Планирование v0.2.0", link: "/ru/planning/v0.2.0" }],
        },
        {
          text: "Релизы",
          collapsed: true,
          items: [
            { text: "Обзор", link: "/ru/releases/" },
            { text: "v0.1.0", link: "/ru/releases/v0.1.0" },
          ],
        },
        {
          text: "Бэклог функций",
          collapsed: true,
          items: [{ text: "Обзор", link: "/ru/planning/backlog" }],
        },
      ],
    },
  ],
  "/ru/administrationshandbuch/": [
    {
      text: "Обзор",
      items: [
        {
          text: "Руководство администратора",
          link: "/ru/administrationshandbuch/",
        },
      ],
    },
    {
      text: "Архитектура сервера",
      items: [
        {
          text: "Proxmox VE",
          link: "/ru/administrationshandbuch/server-architektur/proxmox",
        },
        {
          text: "Proxmox Backup Server",
          link: "/ru/administrationshandbuch/server-architektur/pbs-backup",
        },
        {
          text: "OPNsense",
          link: "/ru/administrationshandbuch/server-architektur/opnsense",
        },
      ],
    },
    {
      text: "Геопространственная инфраструктура данных",
      items: [
        {
          text: "Обзор GDI",
          link: "/ru/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/ru/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "GeoServer",
          link: "/ru/administrationshandbuch/geodateninfrastruktur/geoserver",
        },
        {
          text: "MapProxy",
          link: "/ru/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "Сервер тайлов OSM",
          link: "/ru/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
  ],
  "/ru/benutzerhandbuch/": [
    {
      text: "Руководство пользователя",
      items: [
        {
          text: "Исторический контекст",
          link: "/ru/benutzerhandbuch/hintergrund",
        },
        {
          text: "Цели",
          link: "/ru/benutzerhandbuch/ziele",
        },
        {
          text: "Цикл p2d2",
          link: "/ru/benutzerhandbuch/p2d2-zyklus",
        },
        {
          text: "Открытый исходный код - Открытые данные",
          link: "/ru/benutzerhandbuch/opendata-ansaetze",
        },
      ],
    },
    {
      text: "Приложение",
      items: [
        {
          text: "Главное окно",
          link: "/ru/benutzerhandbuch/anwendung/hauptfenster",
        },
        {
          text: "Редактор объектов",
          link: "/ru/benutzerhandbuch/anwendung/feature-editor",
        },
        {
          text: "Редактирование",
          link: "/ru/benutzerhandbuch/anwendung/editieren",
        },
        {
          text: "Сохранение",
          link: "/ru/benutzerhandbuch/anwendung/speichern",
        },
        {
          text: "Обеспечение качества",
          link: "/ru/benutzerhandbuch/anwendung/qualitaetssicherung",
        },
      ],
    },
  ],
  "/ru/entwicklungshandbuch/": [
    {
      text: "Обзор",
      items: [
        {
          text: "Руководство разработчика",
          link: "/ru/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "Архитектура",
      collapsed: false,
      items: [
        {
          text: "Обзор системы",
          link: "/ru/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "Технологический стек",
          link: "/ru/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "Структура проекта",
          link: "/ru/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "Поток данных",
          link: "/ru/entwicklungshandbuch/architektur/datenfluss",
        },
      ],
    },
    {
      text: "Модули",
      collapsed: false,
      items: [
        {
          text: "Карты",
          collapsed: true,
          items: [
            {
              text: "Конфигурация карты",
              link: "/ru/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "Управление слоями",
              link: "/ru/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "Интеграция OpenLayers",
              link: "/ru/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "Сервисы WMS/WMTS",
              link: "/ru/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "Редактор объектов",
          collapsed: true,
          items: [
            {
              text: "Обзор редактора",
              link: "/ru/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "Менеджер рисования",
              link: "/ru/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "Режим редактирования",
              link: "/ru/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "Синхронизация объектов",
              link: "/ru/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "Интеграция OSM",
              link: "/ru/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "Муниципалитеты",
          collapsed: true,
          items: [
            {
              text: "Коллекции контента",
              link: "/ru/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "Структура данных",
              link: "/ru/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "Маршрутизация",
              link: "/ru/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "UI компоненты",
          collapsed: true,
          items: [
            {
              text: "Astro компоненты",
              link: "/ru/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "Стилизация TailwindCSS",
              link: "/ru/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "Адаптивный дизайн",
              link: "/ru/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "Утилиты",
          collapsed: true,
          items: [
            {
              text: "Взаимодействие слоев",
              link: "/ru/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "Утилиты координат",
              link: "/ru/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "Управление хранилищем",
              link: "/ru/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "Рабочий процесс разработки",
      collapsed: true,
      items: [
        {
          text: "Локальная настройка",
          link: "/ru/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Git рабочий процесс",
          link: "/ru/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "Стиль кода",
          link: "/ru/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "Тестирование",
          link: "/ru/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "Отладка",
          link: "/ru/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "Развертывание",
      collapsed: true,
      items: [
        {
          text: "Мульти-веточная система",
          link: "/ru/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Автоматизация Webhook",
          link: "/ru/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Systemd сервисы",
          link: "/ru/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Прокси Caddy",
          link: "/ru/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "Управление данными",
      collapsed: true,
      items: [
        {
          text: "Коллекция муниципалитетов",
          link: "/ru/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "Источники геоданных",
          link: "/ru/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "Синхронизация данных",
          link: "/ru/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "Справочник API",
      collapsed: true,
      items: [
        {
          text: "Обзор сервисов API",
          link: "/ru/entwicklungshandbuch/api-referenz/",
        },
        {
          text: "Интеграция GeoServer",
          link: "/ru/entwicklungshandbuch/api-referenz/geoserver-integration",
        },
        {
          text: "API Overpass",
          link: "/ru/entwicklungshandbuch/api-referenz/overpass-api",
        },
        {
          text: "Транзакции WFS",
          link: "/ru/entwicklungshandbuch/api-referenz/wfs-transactions",
        },
        {
          text: "TypeScript модули",
          link: "/ru/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Astro эндпоинты",
          link: "/ru/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "Опции конфигурации",
          link: "/ru/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "Вклад",
      collapsed: true,
      items: [
        {
          text: "Вклад в проект",
          link: "/ru/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "Руководство по ревью кода",
          link: "/ru/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "Политика слияния",
          link: "/ru/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/ru/entwicklungsstrategie/": [
    {
      text: "Видение & Философия",
      items: [
        { text: "Обзор", link: "/ru/entwicklungsstrategie/" },
        {
          text: "Видение 2030",
          link: "/ru/entwicklungsstrategie/vision",
        },
        {
          text: "Философия открытого исходного кода",
          link: "/ru/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "Масштабирование",
      items: [
        {
          text: "Категории",
          link: "/ru/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "Муниципалитеты",
          link: "/ru/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "Федеральные земли",
          link: "/ru/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "Европа & Глобально",
          link: "/ru/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "Дорожная карта",
      items: [
        {
          text: "Дорожная карта",
          link: "/ru/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
