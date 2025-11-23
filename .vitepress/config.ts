// .vitepress/config.ts
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { sidebar_de } from "./sidebar_de";
import { sidebar_en } from "./sidebar_en";
import { sidebar_pt } from "./sidebar_pt";
import { sidebar_fr } from "./sidebar_fr";
import { sidebar_es } from "./sidebar_es";
import { sidebar_zh } from "./sidebar_zh";
import { sidebar_ru } from "./sidebar_ru";

export default withMermaid(
  defineConfig({
    title: "p2d2 Documentation",
    description: "Public-Public Data-DNA",

    // Optional: Mermaid-Konfiguration
    vite: {
      optimizeDeps: {
        include: ["@braintree/sanitize-url", "mermaid"],
      },
      resolve: {
        alias: {
          dayjs: "dayjs/",
        },
      },
      ssr: {
        noExternal: ["mermaid"],
      },
    },

    mermaid: {
      theme: "default",
      themeVariables: {
        fontSize: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 35,
        barGap: 8,
        topPadding: 75,
      },
    },
    ignoreDeadLinks: true,

    locales: {
      root: {
        label: "Deutsch",
        lang: "de-DE",
        link: "/de/",

        themeConfig: {
          nav: [
            { text: "Start", link: "/de/" },
            { text: "Benutzerhandbuch", link: "/de/benutzerhandbuch/" },
            { text: "Admin Handbuch", link: "/de/administrationshandbuch/" },
            {
              text: "Entwicklungs-Handbuch",
              link: "/de/entwicklungshandbuch/",
            },
            { text: "Release", link: "/de/planning/" },
            { text: "Strategie", link: "/de/entwicklungsstrategie/" },
            { text: "Doku QS", link: "/de/quality-overview" },
          ],

          sidebar: sidebar_de,
        },
      },

      pt: {
        label: "Português (em breve)",
        lang: "pt-BR",
        link: "/pt/",

        themeConfig: {
          nav: [
            { text: "Início", link: "/pt/" },
            { text: "Documentação", link: "https://doc.data-dna.eu" },
            { text: "Manual do Usuário", link: "/pt/benutzerhandbuch/" },
            {
              text: "Manual de Administração",
              link: "/pt/administrationshandbuch/",
            },
            {
              text: "Manual do Desenvolvedor",
              link: "/pt/entwicklungshandbuch/",
            },
            { text: "Lançamento", link: "/pt/planning/" },
            { text: "Estratégia", link: "/pt/entwicklungsstrategie/" },
            { text: "QA da Documentação", link: "/pt/quality-overview" },
          ],

          sidebar: sidebar_pt,
        },
      },

      fr: {
        label: "Français (bientôt)",
        lang: "fr-FR",
        link: "/fr/",

        themeConfig: {
          nav: [
            { text: "Accueil", link: "/fr/" },
            { text: "Documentation", link: "https://doc.data-dna.eu" },
            { text: "Manuel Utilisateur", link: "/fr/benutzerhandbuch/" },
            {
              text: "Manuel d'Administration",
              link: "/fr/administrationshandbuch/",
            },
            {
              text: "Manuel du Développeur",
              link: "/fr/entwicklungshandbuch/",
            },
            { text: "Version", link: "/fr/planning/" },
            { text: "Stratégie", link: "/fr/entwicklungsstrategie/" },
            { text: "QA Documentation", link: "/fr/quality-overview" },
          ],

          sidebar: sidebar_fr,
        },
      },

      es: {
        label: "Español (próximamente)",
        lang: "es-ES",
        link: "/es/",

        themeConfig: {
          nav: [
            { text: "Inicio", link: "/es/" },
            { text: "Documentación", link: "https://doc.data-dna.eu" },
            { text: "Manual de Usuario", link: "/es/benutzerhandbuch/" },
            {
              text: "Manual de Administración",
              link: "/es/administrationshandbuch/",
            },
            {
              text: "Manual del Desarrollador",
              link: "/es/entwicklungshandbuch/",
            },
            { text: "Lanzamiento", link: "/es/planning/" },
            { text: "Estrategia", link: "/es/entwicklungsstrategie/" },
            { text: "QA de Documentación", link: "/es/quality-overview" },
          ],

          sidebar: sidebar_es,
        },
      },

      zh: {
        label: "中文 (即将推出)",
        lang: "zh-CN",
        link: "/zh/",

        themeConfig: {
          nav: [
            { text: "首页", link: "/zh/" },
            { text: "文档", link: "https://doc.data-dna.eu" },
            { text: "用户手册", link: "/zh/benutzerhandbuch/" },
            { text: "管理手册", link: "/zh/administrationshandbuch/" },
            { text: "开发者手册", link: "/zh/entwicklungshandbuch/" },
            { text: "发布", link: "/zh/planning/" },
            { text: "策略", link: "/zh/entwicklungsstrategie/" },
            { text: "文档质量", link: "/zh/quality-overview" },
          ],

          sidebar: sidebar_zh,
        },
      },

      ru: {
        label: "Русский (скоро)",
        lang: "ru-RU",
        link: "/ru/",

        themeConfig: {
          nav: [
            { text: "Главная", link: "/ru/" },
            { text: "Документация", link: "https://doc.data-dna.eu" },
            { text: "Руководство пользователя", link: "/ru/benutzerhandbuch/" },
            {
              text: "Руководство администратора",
              link: "/ru/administrationshandbuch/",
            },
            {
              text: "Руководство разработчика",
              link: "/ru/entwicklungshandbuch/",
            },
            { text: "Релиз", link: "/ru/planning/" },
            { text: "Стратегия", link: "/ru/entwicklungsstrategie/" },
            { text: "QA документации", link: "/ru/quality-overview" },
          ],

          sidebar: sidebar_ru,
        },
      },

      en: {
        label: "English",
        lang: "en-US",
        link: "/en/",

        themeConfig: {
          nav: [
            { text: "Start", link: "/en/" },
            { text: "User Manual", link: "/en/benutzerhandbuch/" },
            { text: "Admin Manual", link: "/en/administrationshandbuch/" },
            { text: "Developer Handbook", link: "/en/entwicklungshandbuch/" },
            { text: "Release", link: "/en/planning/" },
            { text: "Strategy", link: "/en/entwicklungsstrategie/" },
            { text: "Docu QA", link: "/en/quality-overview" },
          ],

          sidebar: sidebar_en,
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

      "entwicklungshandbuch/:path*": "de/entwicklungshandbuch/:path*",
    },

    head: [
      [
        "link",
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/favicon.ico",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/favicon.svg",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
      ],
      [
        "link",
        {
          rel: "icon",
          type: "image/png",
          sizes: "48x48",
          href: "/favicon-48x48.png",
        },
      ],
      [
        "link",
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/favicon-180x180.png",
        },
      ],
      [
        "link",
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ],
      [
        "meta",
        {
          name: "theme-color",
          content: "#000080",
        },
      ],
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
  }),
);
