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
      { icon: "github", link: "https://github.com/Peter-Koenig/p2d2-hub" },
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
