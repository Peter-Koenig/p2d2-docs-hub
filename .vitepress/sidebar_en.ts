export const sidebar_en = {
  "/en/planning/": [
    {
      text: "Release",
      items: [
        {
          text: "Roadmap",
          collapsed: true,
          items: [{ text: "Overview", link: "/en/planning/" }],
        },
        {
          text: "Planning",
          collapsed: true,
          items: [{ text: "v0.2.0 Planning", link: "/en/planning/v0.2.0" }],
        },
        {
          text: "Releases",
          collapsed: true,
          items: [
            { text: "Overview", link: "/en/releases/" },
            { text: "v0.1.0", link: "/en/releases/v0.1.0" },
          ],
        },
        {
          text: "Feature Backlog",
          collapsed: true,
          items: [{ text: "Overview", link: "/en/planning/backlog" }],
        },
      ],
    },
  ],
  "/en/releases/": [
    {
      text: "Release",
      items: [
        {
          text: "Roadmap",
          collapsed: true,
          items: [{ text: "Overview", link: "/en/planning/" }],
        },
        {
          text: "Planning",
          collapsed: true,
          items: [{ text: "v0.2.0 Planning", link: "/en/planning/v0.2.0" }],
        },
        {
          text: "Releases",
          collapsed: true,
          items: [
            { text: "Overview", link: "/en/releases/" },
            { text: "v0.1.0", link: "/en/releases/v0.1.0" },
          ],
        },
        {
          text: "Feature Backlog",
          collapsed: true,
          items: [{ text: "Overview", link: "/en/planning/backlog" }],
        },
      ],
    },
  ],
  "/en/administrationshandbuch/": [
    {
      text: "Overview",
      items: [
        {
          text: "Administration Handbook",
          link: "/en/administrationshandbuch/",
        },
      ],
    },
    {
      text: "Server Architecture",
      items: [
        {
          text: "Proxmox VE",
          link: "/en/administrationshandbuch/server-architektur/proxmox",
        },
        {
          text: "Proxmox Backup Server",
          link: "/en/administrationshandbuch/server-architektur/pbs-backup",
        },
        {
          text: "OPNsense",
          link: "/en/administrationshandbuch/server-architektur/opnsense",
        },
      ],
    },
    {
      text: "Geospatial Data Infrastructure",
      items: [
        {
          text: "GDI Overview",
          link: "/en/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/en/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "GeoServer",
          link: "/en/administrationshandbuch/geodateninfrastruktur/geoserver",
        },
        {
          text: "MapProxy",
          link: "/en/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "OSM Tileserver",
          link: "/en/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
  ],
  "/en/benutzerhandbuch/": [
    {
      text: "User Guide",
      items: [
        {
          text: "Main Window",
          link: "/en/benutzerhandbuch/hauptfenster",
        },
        {
          text: "Feature Editor",
          link: "/en/benutzerhandbuch/feature-editor",
        },
      ],
    },
  ],
  "/en/entwicklungshandbuch/": [
    {
      text: "Overview",
      items: [
        {
          text: "Development Handbook",
          link: "/en/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "Architecture",
      collapsed: false,
      items: [
        {
          text: "System Overview",
          link: "/en/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "Technology Stack",
          link: "/en/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "Project Structure",
          link: "/en/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "Data Flow",
          link: "/en/entwicklungshandbuch/architektur/datenfluss",
        },
      ],
    },
    {
      text: "Modules",
      collapsed: false,
      items: [
        {
          text: "Maps",
          collapsed: true,
          items: [
            {
              text: "Map Config",
              link: "/en/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "Layer Management",
              link: "/en/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "OpenLayers Integration",
              link: "/en/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "WMS/WMTS Services",
              link: "/en/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "Feature Editor",
          collapsed: true,
          items: [
            {
              text: "Editor Overview",
              link: "/en/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "Draw Manager",
              link: "/en/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "Edit Mode",
              link: "/en/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "Feature Sync",
              link: "/en/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "OSM Integration",
              link: "/en/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "Municipalities",
          collapsed: true,
          items: [
            {
              text: "Content Collections",
              link: "/en/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "Data Structure",
              link: "/en/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "Routing",
              link: "/en/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "UI Components",
          collapsed: true,
          items: [
            {
              text: "Astro Components",
              link: "/en/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "TailwindCSS Styling",
              link: "/en/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "Responsive Design",
              link: "/en/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "Utilities",
          collapsed: true,
          items: [
            {
              text: "Layer Interaction",
              link: "/en/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "Coordinate Utils",
              link: "/en/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "Storage Management",
              link: "/en/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "Development Workflow",
      collapsed: true,
      items: [
        {
          text: "Local Setup",
          link: "/en/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Git Workflow",
          link: "/en/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "Code Style",
          link: "/en/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "Testing",
          link: "/en/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "Debugging",
          link: "/en/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "Deployment",
      collapsed: true,
      items: [
        {
          text: "Multi-Branch System",
          link: "/en/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Webhook Automation",
          link: "/en/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Systemd Services",
          link: "/en/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Caddy Proxy",
          link: "/en/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "Data Management",
      collapsed: true,
      items: [
        {
          text: "Municipalities Collection",
          link: "/en/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "Geodata Sources",
          link: "/en/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "Data Synchronization",
          link: "/en/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "API Reference",
      collapsed: true,
      items: [
        {
          text: "TypeScript Modules",
          link: "/en/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Astro Endpoints",
          link: "/en/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "Config Options",
          link: "/en/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "Contrib",
      collapsed: true,
      items: [
        {
          text: "Contributing",
          link: "/en/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "Code Review Guide",
          link: "/en/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "Merge Policy",
          link: "/en/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/en/entwicklungsstrategie/": [
    {
      text: "Vision & Philosophy",
      items: [
        { text: "Overview", link: "/en/entwicklungsstrategie/" },
        {
          text: "Vision 2030",
          link: "/en/entwicklungsstrategie/vision",
        },
        {
          text: "Open Source Philosophy",
          link: "/en/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "Scaling",
      items: [
        {
          text: "Categories",
          link: "/en/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "Municipalities",
          link: "/en/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "Federal States",
          link: "/en/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "Europe & Global",
          link: "/en/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "Roadmap",
      items: [
        {
          text: "Roadmap",
          link: "/en/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
