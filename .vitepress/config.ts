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
          { text: "Strategy", link: "/en/entwicklungsstrategie/" },
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
