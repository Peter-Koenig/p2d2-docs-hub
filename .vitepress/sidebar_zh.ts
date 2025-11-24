export const sidebar_zh = {
  "/zh/planning/": [
    {
      text: "发布",
      items: [
        {
          text: "路线图",
          collapsed: true,
          items: [{ text: "概述", link: "/zh/planning/" }],
        },
        {
          text: "规划",
          collapsed: true,
          items: [{ text: "v0.2.0 规划", link: "/zh/planning/v0.2.0" }],
        },
        {
          text: "发布",
          collapsed: true,
          items: [
            { text: "概述", link: "/zh/releases/" },
            { text: "v0.1.0", link: "/zh/releases/v0.1.0" },
          ],
        },
        {
          text: "功能待办事项",
          collapsed: true,
          items: [{ text: "概述", link: "/zh/planning/backlog" }],
        },
      ],
    },
  ],
  "/zh/releases/": [
    {
      text: "发布",
      items: [
        {
          text: "路线图",
          collapsed: true,
          items: [{ text: "概述", link: "/zh/planning/" }],
        },
        {
          text: "规划",
          collapsed: true,
          items: [{ text: "v0.2.0 规划", link: "/zh/planning/v0.2.0" }],
        },
        {
          text: "发布",
          collapsed: true,
          items: [
            { text: "概述", link: "/zh/releases/" },
            { text: "v0.1.0", link: "/zh/releases/v0.1.0" },
          ],
        },
        {
          text: "功能待办事项",
          collapsed: true,
          items: [{ text: "概述", link: "/zh/planning/backlog" }],
        },
      ],
    },
  ],
  "/zh/administrationshandbuch/": [
    {
      text: "概述",
      items: [
        {
          text: "管理手册",
          link: "/zh/administrationshandbuch/",
        },
      ],
    },
    {
      text: "服务器架构",
      items: [
        {
          text: "Proxmox VE",
          link: "/zh/administrationshandbuch/server-architektur/proxmox",
        },
        {
          text: "Proxmox 备份服务器",
          link: "/zh/administrationshandbuch/server-architektur/pbs-backup",
        },
        {
          text: "OPNsense",
          link: "/zh/administrationshandbuch/server-architektur/opnsense",
        },
      ],
    },
    {
      text: "地理数据基础设施",
      items: [
        {
          text: "GDI 概述",
          link: "/zh/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/zh/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "GeoServer",
          link: "/zh/administrationshandbuch/geodateninfrastruktur/geoserver",
        },
        {
          text: "MapProxy",
          link: "/zh/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "OSM 瓦片服务器",
          link: "/zh/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
  ],
  "/zh/benutzerhandbuch/": [
    {
      text: "用户手册",
      items: [
        {
          text: "历史背景",
          link: "/zh/benutzerhandbuch/hintergrund",
        },
        {
          text: "目标",
          link: "/zh/benutzerhandbuch/ziele",
        },
        {
          text: "p2d2 循环",
          link: "/zh/benutzerhandbuch/p2d2-zyklus",
        },
        {
          text: "开源 - 开放数据",
          link: "/zh/benutzerhandbuch/opendata-ansaetze",
        },
      ],
    },
    {
      text: "应用程序",
      items: [
        {
          text: "主窗口",
          link: "/zh/benutzerhandbuch/anwendung/hauptfenster",
        },
        {
          text: "要素编辑器",
          link: "/zh/benutzerhandbuch/anwendung/feature-editor",
        },
        {
          text: "编辑",
          link: "/zh/benutzerhandbuch/anwendung/editieren",
        },
        {
          text: "保存",
          link: "/zh/benutzerhandbuch/anwendung/speichern",
        },
        {
          text: "质量保证",
          link: "/zh/benutzerhandbuch/anwendung/qualitaetssicherung",
        },
      ],
    },
  ],
  "/zh/entwicklungshandbuch/": [
    {
      text: "概述",
      items: [
        {
          text: "开发手册",
          link: "/zh/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "架构",
      collapsed: false,
      items: [
        {
          text: "系统概述",
          link: "/zh/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "技术栈",
          link: "/zh/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "项目结构",
          link: "/zh/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "数据流",
          link: "/zh/entwicklungshandbuch/architektur/datenfluss",
        },
      ],
    },
    {
      text: "模块",
      collapsed: false,
      items: [
        {
          text: "地图",
          collapsed: true,
          items: [
            {
              text: "地图配置",
              link: "/zh/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "图层管理",
              link: "/zh/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "OpenLayers 集成",
              link: "/zh/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "WMS/WMTS 服务",
              link: "/zh/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "要素编辑器",
          collapsed: true,
          items: [
            {
              text: "编辑器概述",
              link: "/zh/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "绘图管理器",
              link: "/zh/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "编辑模式",
              link: "/zh/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "要素同步",
              link: "/zh/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "OSM 集成",
              link: "/zh/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "市政",
          collapsed: true,
          items: [
            {
              text: "内容集合",
              link: "/zh/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "数据结构",
              link: "/zh/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "路由",
              link: "/zh/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "UI 组件",
          collapsed: true,
          items: [
            {
              text: "Astro 组件",
              link: "/zh/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "TailwindCSS 样式",
              link: "/zh/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "响应式设计",
              link: "/zh/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "实用工具",
          collapsed: true,
          items: [
            {
              text: "图层交互",
              link: "/zh/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "坐标工具",
              link: "/zh/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "存储管理",
              link: "/zh/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "开发工作流",
      collapsed: true,
      items: [
        {
          text: "本地设置",
          link: "/zh/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Git 工作流",
          link: "/zh/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "代码风格",
          link: "/zh/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "测试",
          link: "/zh/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "调试",
          link: "/zh/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "部署",
      collapsed: true,
      items: [
        {
          text: "多分支系统",
          link: "/zh/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Webhook 自动化",
          link: "/zh/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Systemd 服务",
          link: "/zh/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Caddy 代理",
          link: "/zh/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "数据管理",
      collapsed: true,
      items: [
        {
          text: "市政集合",
          link: "/zh/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "地理数据源",
          link: "/zh/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "数据同步",
          link: "/zh/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "API 参考",
      collapsed: true,
      items: [
        {
          text: "TypeScript 模块",
          link: "/zh/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Astro 端点",
          link: "/zh/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "配置选项",
          link: "/zh/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "贡献",
      collapsed: true,
      items: [
        {
          text: "贡献指南",
          link: "/zh/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "代码审查指南",
          link: "/zh/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "合并策略",
          link: "/zh/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/zh/entwicklungsstrategie/": [
    {
      text: "愿景与哲学",
      items: [
        { text: "概述", link: "/zh/entwicklungsstrategie/" },
        {
          text: "2030 愿景",
          link: "/zh/entwicklungsstrategie/vision",
        },
        {
          text: "开源哲学",
          link: "/zh/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "扩展",
      items: [
        {
          text: "类别",
          link: "/zh/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "市政",
          link: "/zh/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "联邦州",
          link: "/zh/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "欧洲与全球",
          link: "/zh/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "路线图",
      items: [
        {
          text: "路线图",
          link: "/zh/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
