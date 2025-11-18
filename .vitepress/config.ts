// .vitepress/config.ts
import { defineConfig } from "vitepress";

export default defineConfig({
  ignoreDeadLinks: true,
  title: "p2d2 Documentation",
  description: "Public-Public Data-DNA",

  locales: {
    root: {
      label: "Deutsch",
      lang: "de-DE",
      link: "/de/",

      themeConfig: {
        nav: [
          { text: "Start", link: "/de/" },
          { text: "Benutzerhandbuch", link: "/de/benutzerhandbuch/" },
          { text: "Administration", link: "/de/administrationshandbuch/" },
          { text: "Entwicklerhandbuch", link: "/de/entwicklerhandbuch/" },
          { text: "Strategie", link: "/de/entwicklungsstrategie/" },
          { text: "Qualität", link: "/de/quality-overview" },
        ],

        sidebar: {
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
                { text: "Contributing", link: "/de/entwicklung/contributing" },
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
                { text: "Roadmap", link: "/de/entwicklungsstrategie/roadmap" },
              ],
            },
          ],
          "/de/entwicklerhandbuch/": [
            {
              text: "Übersicht",
              items: [
                { text: "Entwicklerhandbuch", link: "/de/entwicklerhandbuch/" },
              ],
            },
            {
              text: "Architektur",
              collapsed: false,
              items: [
                {
                  text: "Systemüberblick",
                  link: "/de/entwicklerhandbuch/architektur/systemueberblick",
                },
                {
                  text: "Technologie-Stack",
                  link: "/de/entwicklerhandbuch/architektur/technologie-stack",
                },
                {
                  text: "Projektstruktur",
                  link: "/de/entwicklerhandbuch/architektur/projektstruktur",
                },
                {
                  text: "Datenfluss",
                  link: "/de/entwicklerhandbuch/architektur/datenfluss",
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
                      link: "/de/entwicklerhandbuch/module/karten/map-config",
                    },
                    {
                      text: "Layer Management",
                      link: "/de/entwicklerhandbuch/module/karten/layer-management",
                    },
                    {
                      text: "OpenLayers Integration",
                      link: "/de/entwicklerhandbuch/module/karten/openlayers-integration",
                    },
                    {
                      text: "WMS/WMTS Services",
                      link: "/de/entwicklerhandbuch/module/karten/wms-wmts-services",
                    },
                  ],
                },
                {
                  text: "Feature Editor",
                  collapsed: true,
                  items: [
                    {
                      text: "Editor Overview",
                      link: "/de/entwicklerhandbuch/module/feature-editor/editor-overview",
                    },
                    {
                      text: "Draw Manager",
                      link: "/de/entwicklerhandbuch/module/feature-editor/draw-manager",
                    },
                    {
                      text: "Edit Mode",
                      link: "/de/entwicklerhandbuch/module/feature-editor/edit-mode",
                    },
                    {
                      text: "Feature Sync",
                      link: "/de/entwicklerhandbuch/module/feature-editor/feature-sync",
                    },
                    {
                      text: "OSM Integration",
                      link: "/de/entwicklerhandbuch/module/feature-editor/osm-integration",
                    },
                  ],
                },
                {
                  text: "Kommunen",
                  collapsed: true,
                  items: [
                    {
                      text: "Content Collections",
                      link: "/de/entwicklerhandbuch/module/kommunen/content-collections",
                    },
                    {
                      text: "Datenstruktur",
                      link: "/de/entwicklerhandbuch/module/kommunen/datenstruktur",
                    },
                    {
                      text: "Routing",
                      link: "/de/entwicklerhandbuch/module/kommunen/routing",
                    },
                  ],
                },
                {
                  text: "UI-Komponenten",
                  collapsed: true,
                  items: [
                    {
                      text: "Astro Components",
                      link: "/de/entwicklerhandbuch/module/ui-komponenten/astro-components",
                    },
                    {
                      text: "TailwindCSS Styling",
                      link: "/de/entwicklerhandbuch/module/ui-komponenten/tailwind-styling",
                    },
                    {
                      text: "Responsive Design",
                      link: "/de/entwicklerhandbuch/module/ui-komponenten/responsive-design",
                    },
                  ],
                },
                {
                  text: "Utilities",
                  collapsed: true,
                  items: [
                    {
                      text: "Layer Interaction",
                      link: "/de/entwicklerhandbuch/module/utilities/layer-interaction",
                    },
                    {
                      text: "Coordinate Utils",
                      link: "/de/entwicklerhandbuch/module/utilities/coordinate-utils",
                    },
                    {
                      text: "Storage Management",
                      link: "/de/entwicklerhandbuch/module/utilities/storage-management",
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
                  link: "/de/entwicklerhandbuch/entwicklungsworkflow/setup-lokal",
                },
                {
                  text: "Git Workflow",
                  link: "/de/entwicklerhandbuch/entwicklungsworkflow/git-workflow",
                },
                {
                  text: "Code Style",
                  link: "/de/entwicklerhandbuch/entwicklungsworkflow/code-style",
                },
                {
                  text: "Testing",
                  link: "/de/entwicklerhandbuch/entwicklungsworkflow/testing",
                },
                {
                  text: "Debugging",
                  link: "/de/entwicklerhandbuch/entwicklungsworkflow/debugging",
                },
              ],
            },
            {
              text: "Deployment",
              collapsed: true,
              items: [
                {
                  text: "Multi-Branch System",
                  link: "/de/entwicklerhandbuch/deployment/multi-branch-system",
                },
                {
                  text: "Webhook Automation",
                  link: "/de/entwicklerhandbuch/deployment/webhook-automation",
                },
                {
                  text: "Systemd Services",
                  link: "/de/entwicklerhandbuch/deployment/systemd-services",
                },
                {
                  text: "Caddy Proxy",
                  link: "/de/entwicklerhandbuch/deployment/caddy-proxy",
                },
              ],
            },
            {
              text: "Datenverwaltung",
              collapsed: true,
              items: [
                {
                  text: "Kommunen Collection",
                  link: "/de/entwicklerhandbuch/datenverwaltung/kommunen-collection",
                },
                {
                  text: "Geodaten-Quellen",
                  link: "/de/entwicklerhandbuch/datenverwaltung/geodaten-quellen",
                },
                {
                  text: "Daten-Synchronisation",
                  link: "/de/entwicklerhandbuch/datenverwaltung/daten-synchronisation",
                },
              ],
            },
            {
              text: "API-Referenz",
              collapsed: true,
              items: [
                {
                  text: "TypeScript Modules",
                  link: "/de/entwicklerhandbuch/api-referenz/typescript-modules",
                },
                {
                  text: "Astro Endpoints",
                  link: "/de/entwicklerhandbuch/api-referenz/astro-endpoints",
                },
                {
                  text: "Config-Optionen",
                  link: "/de/entwicklerhandbuch/api-referenz/config-optionen",
                },
              ],
            },
            {
              text: "Contrib",
              collapsed: true,
              items: [
                {
                  text: "Contributing",
                  link: "/de/entwicklerhandbuch/contrib/contributing",
                },
                {
                  text: "Code Review Guide",
                  link: "/de/entwicklerhandbuch/contrib/code-review-guide",
                },
                {
                  text: "Merge Policy",
                  link: "/de/entwicklerhandbuch/contrib/merge-policy",
                },
              ],
            },
          ],
          "/en/entwicklerhandbuch/": [
            {
              text: "Overview",
              items: [
                { text: "Developer Handbook", link: "/en/entwicklerhandbuch/" },
              ],
            },
            {
              text: "Architecture",
              collapsed: false,
              items: [
                {
                  text: "System Overview",
                  link: "/en/entwicklerhandbuch/architecture/system-overview",
                },
                {
                  text: "Technology Stack",
                  link: "/en/entwicklerhandbuch/architecture/technology-stack",
                },
                {
                  text: "Project Structure",
                  link: "/en/entwicklerhandbuch/architecture/project-structure",
                },
                {
                  text: "Data Flow",
                  link: "/en/entwicklerhandbuch/architecture/data-flow",
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
                      link: "/en/entwicklerhandbuch/modules/maps/map-config",
                    },
                    {
                      text: "Layer Management",
                      link: "/en/entwicklerhandbuch/modules/maps/layer-management",
                    },
                    {
                      text: "OpenLayers Integration",
                      link: "/en/entwicklerhandbuch/modules/maps/openlayers-integration",
                    },
                    {
                      text: "WMS/WMTS Services",
                      link: "/en/entwicklerhandbuch/modules/maps/wms-wmts-services",
                    },
                  ],
                },
                {
                  text: "Feature Editor",
                  collapsed: true,
                  items: [
                    {
                      text: "Editor Overview",
                      link: "/en/entwicklerhandbuch/modules/feature-editor/editor-overview",
                    },
                    {
                      text: "Draw Manager",
                      link: "/en/entwicklerhandbuch/modules/feature-editor/draw-manager",
                    },
                    {
                      text: "Edit Mode",
                      link: "/en/entwicklerhandbuch/modules/feature-editor/edit-mode",
                    },
                    {
                      text: "Feature Sync",
                      link: "/en/entwicklerhandbuch/modules/feature-editor/feature-sync",
                    },
                    {
                      text: "OSM Integration",
                      link: "/en/entwicklerhandbuch/modules/feature-editor/osm-integration",
                    },
                  ],
                },
                {
                  text: "Municipalities",
                  collapsed: true,
                  items: [
                    {
                      text: "Content Collections",
                      link: "/en/entwicklerhandbuch/modules/municipalities/content-collections",
                    },
                    {
                      text: "Data Structure",
                      link: "/en/entwicklerhandbuch/modules/municipalities/data-structure",
                    },
                    {
                      text: "Routing",
                      link: "/en/entwicklerhandbuch/modules/municipalities/routing",
                    },
                  ],
                },
                {
                  text: "UI Components",
                  collapsed: true,
                  items: [
                    {
                      text: "Astro Components",
                      link: "/en/entwicklerhandbuch/modules/ui-components/astro-components",
                    },
                    {
                      text: "TailwindCSS Styling",
                      link: "/en/entwicklerhandbuch/modules/ui-components/tailwind-styling",
                    },
                    {
                      text: "Responsive Design",
                      link: "/en/entwicklerhandbuch/modules/ui-components/responsive-design",
                    },
                  ],
                },
                {
                  text: "Utilities",
                  collapsed: true,
                  items: [
                    {
                      text: "Layer Interaction",
                      link: "/en/entwicklerhandbuch/modules/utilities/layer-interaction",
                    },
                    {
                      text: "Coordinate Utils",
                      link: "/en/entwicklerhandbuch/modules/utilities/coordinate-utils",
                    },
                    {
                      text: "Storage Management",
                      link: "/en/entwicklerhandbuch/modules/utilities/storage-management",
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
                  link: "/en/entwicklerhandbuch/development-workflow/local-setup",
                },
                {
                  text: "Git Workflow",
                  link: "/en/entwicklerhandbuch/development-workflow/git-workflow",
                },
                {
                  text: "Code Style",
                  link: "/en/entwicklerhandbuch/development-workflow/code-style",
                },
                {
                  text: "Testing",
                  link: "/en/entwicklerhandbuch/development-workflow/testing",
                },
                {
                  text: "Debugging",
                  link: "/en/entwicklerhandbuch/development-workflow/debugging",
                },
              ],
            },
            {
              text: "Deployment",
              collapsed: true,
              items: [
                {
                  text: "Multi-Branch System",
                  link: "/en/entwicklerhandbuch/deployment/multi-branch-system",
                },
                {
                  text: "Webhook Automation",
                  link: "/en/entwicklerhandbuch/deployment/webhook-automation",
                },
                {
                  text: "Systemd Services",
                  link: "/en/entwicklerhandbuch/deployment/systemd-services",
                },
                {
                  text: "Caddy Proxy",
                  link: "/en/entwicklerhandbuch/deployment/caddy-proxy",
                },
              ],
            },
            {
              text: "Data Management",
              collapsed: true,
              items: [
                {
                  text: "Municipalities Collection",
                  link: "/en/entwicklerhandbuch/data-management/municipalities-collection",
                },
                {
                  text: "Geodata Sources",
                  link: "/en/entwicklerhandbuch/data-management/geodata-sources",
                },
                {
                  text: "Data Synchronization",
                  link: "/en/entwicklerhandbuch/data-management/data-synchronization",
                },
              ],
            },
            {
              text: "API Reference",
              collapsed: true,
              items: [
                {
                  text: "TypeScript Modules",
                  link: "/en/entwicklerhandbuch/api-reference/typescript-modules",
                },
                {
                  text: "Astro Endpoints",
                  link: "/en/entwicklerhandbuch/api-reference/astro-endpoints",
                },
                {
                  text: "Config Options",
                  link: "/en/entwicklerhandbuch/api-reference/config-options",
                },
              ],
            },
            {
              text: "Contrib",
              collapsed: true,
              items: [
                {
                  text: "Contributing",
                  link: "/en/entwicklerhandbuch/contrib/contributing",
                },
                {
                  text: "Code Review Guide",
                  link: "/en/entwicklerhandbuch/contrib/code-review-guide",
                },
                {
                  text: "Merge Policy",
                  link: "/en/entwicklerhandbuch/contrib/merge-policy",
                },
              ],
            },
          ],
        },
      },
    },

    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",

      themeConfig: {
        nav: [
          { text: "Home", link: "/en/" },
          { text: "User Guide", link: "/en/benutzerhandbuch/" },
          { text: "Administration", link: "/en/administrationshandbuch/" },
          { text: "Developer Handbook", link: "/en/entwicklerhandbuch/" },
          { text: "Strategy", link: "/en/entwicklungsstrategie/" },
          { text: "Quality", link: "/en/quality-overview" },
        ],

        sidebar: {
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
                { text: "Roadmap", link: "/en/entwicklungsstrategie/roadmap" },
              ],
            },
          ],
        },
      },
    },
  },

  // Gemeinsame Konfiguration
  themeConfig: {
    socialLinks: [
      {
        icon: {
          svg: `<svg width="31.129297mm" height="23.621992mm" viewBox="0 0 31.129297 23.621992" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <style>
                .cls-1 { fill: #6382ff; }
                .cls-2 { fill: #1544ff; }
              </style>
            </defs>
            <g transform="matrix(0.26458333,0,0,0.26458333,-14.622986,-14.62618)">
              <path class="cls-1" d="m 102.76,90.71 v 0 c 0,0 -23.09,0 -23.09,0 l -7,13.46 c -1.64,3.16 -4.85,4.96 -8.18,4.96 h 45.35 38.69 l 7,-13.46 c 1.69,-3.26 5.06,-5.07 8.5,-4.95 -0.11,0 -0.21,-0.02 -0.32,-0.02 h -60.94 z"></path>
              <path class="cls-2" d="m 123.22,80.19 5.47,10.52 h 20.77 L 139.57,71.69 C 134.31,61.57 123.95,55.28 112.53,55.28 H 95.82 c -11.41,0 -21.77,6.29 -27.04,16.41 L 56.31,95.67 c -2.35,4.51 -0.59,10.08 3.92,12.42 1.36,0.71 2.81,1.04 4.24,1.04 3.33,0 6.54,-1.81 8.18,-4.96 L 85.12,80.19 c 2.08,-4 6.18,-6.49 10.69,-6.49 h 16.71 c 4.51,0 8.61,2.49 10.69,6.49 z"></path>
              <path class="cls-2" d="m 167.95,91.75 c -4.51,-2.35 -10.08,-0.59 -12.42,3.92 l -12.47,23.98 c -2.08,4 -6.18,6.49 -10.69,6.49 h -16.71 c -4.51,0 -8.61,-2.49 -10.69,-6.49 L 99.5,109.13 H 78.73 l 9.89,19.02 c 5.26,10.12 15.62,16.41 27.04,16.41 h 16.71 c 11.41,0 21.77,-6.29 27.04,-16.41 l 12.47,-23.98 c 2.35,-4.51 0.59,-10.08 -3.92,-12.42 z"></path>
            </g>
          </svg>`,
        },
        link: "https://gitlab.opencode.de/OC000028072444/p2d2",
        ariaLabel: "p2d2 on OpenCode",
      },
    ],
    search: {
      provider: "local",
    },
  },

  rewrites: {
    "entwicklungsstrategie/:path*": "de/entwicklungsstrategie/:path*",
    "benutzerhandbuch/:path*": "de/benutzerhandbuch/:path*",
    "administrationshandbuch/:path*": "de/administrationshandbuch/:path*",
    "entwicklerhandbuch/:path*": "de/entwicklerhandbuch/:path*",
  },

  head: [
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/molstar@latest/build/viewer/molstar.css",
      },
    ],
    [
      "meta",
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, viewport-fit=cover",
      },
    ],
  ],
});
