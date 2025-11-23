export const sidebar_de = {
  "/de/planning/": [
    {
      text: "Release",
      items: [
        {
          text: "Roadmap",
          collapsed: true,
          items: [{ text: "Übersicht", link: "/de/planning/" }],
        },
        {
          text: "Planung",
          collapsed: true,
          items: [{ text: "v0.2.0 Planung", link: "/de/planning/v0.2.0" }],
        },
        {
          text: "Releases",
          collapsed: true,
          items: [
            { text: "Übersicht", link: "/de/releases/" },
            { text: "v0.1.0", link: "/de/releases/v0.1.0" },
          ],
        },
        {
          text: "Feature Backlog",
          collapsed: true,
          items: [{ text: "Übersicht", link: "/de/planning/backlog" }],
        },
      ],
    },
  ],
  "/de/releases/": [
    {
      text: "Release",
      items: [
        {
          text: "Roadmap",
          collapsed: true,
          items: [{ text: "Übersicht", link: "/de/planning/" }],
        },
        {
          text: "Planung",
          collapsed: true,
          items: [{ text: "v0.2.0 Planung", link: "/de/planning/v0.2.0" }],
        },
        {
          text: "Releases",
          collapsed: true,
          items: [
            { text: "Übersicht", link: "/de/releases/" },
            { text: "v0.1.0", link: "/de/releases/v0.1.0" },
          ],
        },
        {
          text: "Feature Backlog",
          collapsed: true,
          items: [{ text: "Übersicht", link: "/de/planning/backlog" }],
        },
      ],
    },
  ],
  "/de/administrationshandbuch/": [
    {
      text: "Übersicht",
      items: [
        {
          text: "Administrationshandbuch",
          link: "/de/administrationshandbuch/",
        },
      ],
    },
    {
      text: "Server-Architektur",
      items: [
        {
          text: "Proxmox VE",
          link: "/de/administrationshandbuch/server-architektur/proxmox",
        },
        {
          text: "Proxmox Backup Server",
          link: "/de/administrationshandbuch/server-architektur/pbs-backup",
        },
        {
          text: "OPNsense",
          link: "/de/administrationshandbuch/server-architektur/opnsense",
        },
      ],
    },
    {
      text: "Geodateninfrastruktur",
      items: [
        {
          text: "Übersicht GDI",
          link: "/de/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "GDI-Architektur",
          link: "/de/administrationshandbuch/geodateninfrastruktur/gdi-architektur",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/de/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "GeoServer",
          link: "/de/administrationshandbuch/geodateninfrastruktur/geoserver",
        },
        {
          text: "MapProxy",
          link: "/de/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "OSM-Tileserver",
          link: "/de/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
    {
      text: "Software-Architektur",
      items: [
        {
          text: "Software-Architektur",
          link: "/de/administrationshandbuch/software-architektur",
        },
        {
          text: "Frontend-Architektur",
          link: "/de/administrationshandbuch/frontend-architektur",
        },
      ],
    },
    {
      text: "Deployment",
      items: [
        {
          text: "CI/CD Pipeline",
          link: "/de/administrationshandbuch/deployment/cicd-pipeline",
        },
        {
          text: "Staging",
          link: "/de/administrationshandbuch/deployment/staging",
        },
        {
          text: "Production",
          link: "/de/administrationshandbuch/deployment/production",
        },
        {
          text: "Multi-Branch Deployment",
          link: "/de/administrationshandbuch/deployment/multi-branch-deployment",
        },
        {
          text: "Multi-Repo Setup",
          link: "/de/administrationshandbuch/multi-repo-deployment",
        },
        {
          text: "Upgrade-Prozess",
          link: "/de/administrationshandbuch/upgrade-prozess",
        },
      ],
    },
    {
      text: "Sicherheit & Backup",
      items: [
        {
          text: "Backup-Strategie",
          link: "/de/administrationshandbuch/backup-strategie",
        },
      ],
    },
  ],
  "/de/entwicklung/": [
    {
      text: "Entwicklung",
      items: [
        {
          text: "Contributing",
          link: "/de/entwicklung/contributing",
        },
        {
          text: "Polygon Sync Plugin",
          link: "/de/entwicklung/polygon-sync",
        },
      ],
    },
  ],
  "/de/quality-overview": [
    {
      text: "Qualitätsübersicht",
      items: [
        {
          text: "Dokumentations-Qualität",
          link: "/de/quality-overview",
        },
      ],
    },
  ],
  "/de/entwicklungshandbuch/": [
    {
      text: "Übersicht",
      items: [
        {
          text: "Entwicklungs-Handbuch",
          link: "/de/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "Architektur",
      collapsed: false,
      items: [
        {
          text: "Systemüberblick",
          link: "/de/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "Technologie-Stack",
          link: "/de/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "Projektstruktur",
          link: "/de/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "Datenfluss",
          link: "/de/entwicklungshandbuch/architektur/datenfluss",
        },
      ],
    },
    {
      text: "Module",
      collapsed: false,
      items: [
        {
          text: "Karten",
          collapsed: true,
          items: [
            {
              text: "Map Config",
              link: "/de/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "Layer Management",
              link: "/de/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "OpenLayers Integration",
              link: "/de/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "WMS/WMTS Services",
              link: "/de/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "Feature Editor",
          collapsed: true,
          items: [
            {
              text: "Editor Overview",
              link: "/de/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "Draw Manager",
              link: "/de/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "Edit Mode",
              link: "/de/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "Feature Sync",
              link: "/de/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "OSM Integration",
              link: "/de/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "Kommunen",
          collapsed: true,
          items: [
            {
              text: "Content Collections",
              link: "/de/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "Datenstruktur",
              link: "/de/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "Routing",
              link: "/de/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "UI-Komponenten",
          collapsed: true,
          items: [
            {
              text: "Astro Components",
              link: "/de/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "TailwindCSS Styling",
              link: "/de/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "Responsive Design",
              link: "/de/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "Utilities",
          collapsed: true,
          items: [
            {
              text: "Layer Interaction",
              link: "/de/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "Coordinate Utils",
              link: "/de/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "Storage Management",
              link: "/de/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "Entwicklungsworkflow",
      collapsed: true,
      items: [
        {
          text: "Lokales Setup",
          link: "/de/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Git Workflow",
          link: "/de/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "Code Style",
          link: "/de/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "Testing",
          link: "/de/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "Debugging",
          link: "/de/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "Deployment",
      collapsed: true,
      items: [
        {
          text: "Multi-Branch System",
          link: "/de/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Webhook Automation",
          link: "/de/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Systemd Services",
          link: "/de/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Caddy Proxy",
          link: "/de/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "Datenverwaltung",
      collapsed: true,
      items: [
        {
          text: "Kommunen Collection",
          link: "/de/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "Geodaten-Quellen",
          link: "/de/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "Daten-Synchronisation",
          link: "/de/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "API-Referenz",
      collapsed: true,
      items: [
        {
          text: "TypeScript Modules",
          link: "/de/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Astro Endpoints",
          link: "/de/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "Config-Optionen",
          link: "/de/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "Contrib",
      collapsed: true,
      items: [
        {
          text: "Contributing",
          link: "/de/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "Code Review Guide",
          link: "/de/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "Merge Policy",
          link: "/de/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/de/entwicklungsstrategie/": [
    {
      text: "Vision & Philosophie",
      items: [
        { text: "Übersicht", link: "/de/entwicklungsstrategie/" },
        {
          text: "Vision 2030",
          link: "/de/entwicklungsstrategie/vision",
        },
        {
          text: "OpenSource-Philosophie",
          link: "/de/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "Skalierung",
      items: [
        {
          text: "Kategorien",
          link: "/de/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "Kommunen",
          link: "/de/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "Bundesländer",
          link: "/de/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "Europa & Global",
          link: "/de/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "Roadmap",
      items: [
        {
          text: "Roadmap",
          link: "/de/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
