export const sidebar_en = {
  "/en/entwicklung/": [
    {
      text: "Development",
      items: [
        {
          text: "Contributing",
          link: "/en/entwicklung/contributing",
        },
        {
          text: "Polygon Sync Plugin",
          link: "/en/entwicklung/polygon-sync",
        },
      ],
    },
  ],
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
          text: "Overview",
          link: "/en/administrationshandbuch/server-architektur/",
        },
        {
          text: "Proxmox Host",
          link: "/en/administrationshandbuch/server-architektur/proxmox-host",
        },
        {
          text: "OPNSense Firewall",
          link: "/en/administrationshandbuch/server-architektur/vm-opnsense",
        },
        {
          text: "PostgreSQL/PostGIS Container",
          link: "/en/administrationshandbuch/server-architektur/lxc-postgresql",
        },
        {
          text: "GeoServer Container",
          link: "/en/administrationshandbuch/server-architektur/lxc-geoserver",
        },
        {
          text: "MapProxy Container",
          link: "/en/administrationshandbuch/server-architektur/lxc-mapproxy",
        },
        {
          text: "Frontend Container",
          link: "/en/administrationshandbuch/server-architektur/lxc-frontend",
        },
        {
          text: "OSM Tileserver",
          link: "/en/administrationshandbuch/server-architektur/vm-osm-tiler",
        },
        {
          text: "Network Architecture",
          link: "/en/administrationshandbuch/server-architektur/netzwerk-architektur",
        },
        {
          text: "Backup Strategy",
          link: "/en/administrationshandbuch/server-architektur/backup-strategie",
        },
        {
          text: "Ory IAM (Planned)",
          link: "/en/administrationshandbuch/server-architektur/lxc-ory-iam",
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
          text: "GDI Architecture",
          link: "/en/administrationshandbuch/geodateninfrastruktur/gdi-architektur",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/en/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
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
    {
      text: "Deployment",
      items: [
        {
          text: "CI/CD Pipeline",
          link: "/en/administrationshandbuch/deployment/cicd-pipeline",
        },
        {
          text: "Staging Environment",
          link: "/en/administrationshandbuch/deployment/staging",
        },
        {
          text: "Production Deployment",
          link: "/en/administrationshandbuch/deployment/production",
        },
      ],
    },
    {
      text: "Frontend",
      items: [
        {
          text: "Frontend Architecture",
          link: "/en/administrationshandbuch/frontend-architektur",
        },
      ],
    },
  ],
  "/en/benutzerhandbuch/": [
    {
      text: "User Manual",
      items: [
        {
          text: "Historical Background",
          link: "/en/benutzerhandbuch/hintergrund",
        },
        {
          text: "Goals",
          link: "/en/benutzerhandbuch/ziele",
        },
        {
          text: "The p2d2 Cycle",
          link: "/en/benutzerhandbuch/p2d2-zyklus",
        },
        {
          text: "Open Source - Open Data",
          link: "/en/benutzerhandbuch/opendata-ansaetze",
        },
      ],
    },
    {
      text: "Application",
      items: [
        {
          text: "Main Window",
          link: "/en/benutzerhandbuch/anwendung/hauptfenster",
        },
        {
          text: "Feature Editor",
          link: "/en/benutzerhandbuch/anwendung/feature-editor",
        },
        {
          text: "Editing",
          link: "/en/benutzerhandbuch/anwendung/editieren",
        },
        {
          text: "Saving",
          link: "/en/benutzerhandbuch/anwendung/speichern",
        },
        {
          text: "Quality Assurance",
          link: "/en/benutzerhandbuch/anwendung/qualitaetssicherung",
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
          text: "API Services Overview",
          link: "/en/entwicklungshandbuch/api-referenz/",
        },
        {
          text: "GeoServer Integration",
          link: "/en/entwicklungshandbuch/api-referenz/geoserver-integration",
        },
        {
          text: "Overpass API",
          link: "/en/entwicklungshandbuch/api-referenz/overpass-api",
        },
        {
          text: "WFS Transactions",
          link: "/en/entwicklungshandbuch/api-referenz/wfs-transactions",
        },
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
