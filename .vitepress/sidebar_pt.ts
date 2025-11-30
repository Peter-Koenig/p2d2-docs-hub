export const sidebar_pt = {
  "/pt/entwicklung/": [
    {
      text: "Desenvolvimento",
      items: [
        {
          text: "Contribuindo",
          link: "/pt/entwicklung/contributing",
        },
        {
          text: "Plugin de Sincronização de Polígonos",
          link: "/pt/entwicklung/polygon-sync",
        },
      ],
    },
  ],
  "/pt/planning/": [
    {
      text: "Lançamento",
      items: [
        {
          text: "Roteiro",
          collapsed: true,
          items: [{ text: "Visão Geral", link: "/pt/planning/" }],
        },
        {
          text: "Planejamento",
          collapsed: true,
          items: [{ text: "Planejamento v0.2.0", link: "/pt/planning/v0.2.0" }],
        },
        {
          text: "Lançamentos",
          collapsed: true,
          items: [
            { text: "Visão Geral", link: "/pt/releases/" },
            { text: "v0.1.0", link: "/pt/releases/v0.1.0" },
          ],
        },
        {
          text: "Backlog de Funcionalidades",
          collapsed: true,
          items: [{ text: "Visão Geral", link: "/pt/planning/backlog" }],
        },
      ],
    },
  ],
  "/pt/releases/": [
    {
      text: "Lançamento",
      items: [
        {
          text: "Roteiro",
          collapsed: true,
          items: [{ text: "Visão Geral", link: "/pt/planning/" }],
        },
        {
          text: "Planejamento",
          collapsed: true,
          items: [{ text: "Planejamento v0.2.0", link: "/pt/planning/v0.2.0" }],
        },
        {
          text: "Lançamentos",
          collapsed: true,
          items: [
            { text: "Visão Geral", link: "/pt/releases/" },
            { text: "v0.1.0", link: "/pt/releases/v0.1.0" },
          ],
        },
        {
          text: "Backlog de Funcionalidades",
          collapsed: true,
          items: [{ text: "Visão Geral", link: "/pt/planning/backlog" }],
        },
      ],
    },
  ],
  "/pt/administrationshandbuch/": [
    {
      text: "Visão Geral",
      items: [
        {
          text: "Manual de Administração",
          link: "/pt/administrationshandbuch/",
        },
      ],
    },
    {
      text: "Arquitetura de Servidor",
      items: [
        {
          text: "Proxmox VE",
          link: "/pt/administrationshandbuch/server-architektur/proxmox",
        },
        {
          text: "Proxmox Backup Server",
          link: "/pt/administrationshandbuch/server-architektur/pbs-backup",
        },
        {
          text: "OPNsense",
          link: "/pt/administrationshandbuch/server-architektur/opnsense",
        },
      ],
    },
    {
      text: "Infraestrutura de Dados Geoespaciais",
      items: [
        {
          text: "Visão Geral GDI",
          link: "/pt/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "Arquitetura GDI",
          link: "/pt/administrationshandbuch/geodateninfrastruktur/gdi-architektur",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/pt/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "GeoServer",
          link: "/pt/administrationshandbuch/geodateninfrastruktur/geoserver",
        },
        {
          text: "MapProxy",
          link: "/pt/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "Servidor de Tiles OSM",
          link: "/pt/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
    {
      text: "Implantação",
      items: [
        {
          text: "Pipeline CI/CD",
          link: "/pt/administrationshandbuch/deployment/cicd-pipeline",
        },
        {
          text: "Ambiente de Staging",
          link: "/pt/administrationshandbuch/deployment/staging",
        },
        {
          text: "Implantação em Produção",
          link: "/pt/administrationshandbuch/deployment/production",
        },
        {
          text: "Implantação Multi-Branch",
          link: "/pt/administrationshandbuch/deployment/multi-branch-deployment",
        },
      ],
    },
    {
      text: "Frontend",
      items: [
        {
          text: "Arquitetura Frontend",
          link: "/pt/administrationshandbuch/frontend-architektur",
        },
      ],
    },
  ],
  "/pt/benutzerhandbuch/": [
    {
      text: "Manual do Usuário",
      items: [
        {
          text: "Contexto Histórico",
          link: "/pt/benutzerhandbuch/hintergrund",
        },
        {
          text: "Objetivos",
          link: "/pt/benutzerhandbuch/ziele",
        },
        {
          text: "O Ciclo p2d2",
          link: "/pt/benutzerhandbuch/p2d2-zyklus",
        },
        {
          text: "Código Aberto - Dados Abertos",
          link: "/pt/benutzerhandbuch/opendata-ansaetze",
        },
      ],
    },
    {
      text: "Aplicação",
      items: [
        {
          text: "Janela Principal",
          link: "/pt/benutzerhandbuch/anwendung/hauptfenster",
        },
        {
          text: "Editor de Recursos",
          link: "/pt/benutzerhandbuch/anwendung/feature-editor",
        },
        {
          text: "Editando",
          link: "/pt/benutzerhandbuch/anwendung/editieren",
        },
        {
          text: "Salvando",
          link: "/pt/benutzerhandbuch/anwendung/speichern",
        },
        {
          text: "Garantia de Qualidade",
          link: "/pt/benutzerhandbuch/anwendung/qualitaetssicherung",
        },
      ],
    },
  ],
  "/pt/entwicklungshandbuch/": [
    {
      text: "Visão Geral",
      items: [
        {
          text: "Manual do Desenvolvedor",
          link: "/pt/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "Arquitetura",
      collapsed: false,
      items: [
        {
          text: "Visão Geral do Sistema",
          link: "/pt/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "Stack de Tecnologia",
          link: "/pt/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "Estrutura do Projeto",
          link: "/pt/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "Fluxo de Dados",
          link: "/pt/entwicklungshandbuch/architektur/datenfluss",
        },
      ],
    },
    {
      text: "Módulos",
      collapsed: false,
      items: [
        {
          text: "Mapas",
          collapsed: true,
          items: [
            {
              text: "Configuração do Mapa",
              link: "/pt/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "Gerenciamento de Camadas",
              link: "/pt/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "Integração OpenLayers",
              link: "/pt/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "Serviços WMS/WMTS",
              link: "/pt/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "Editor de Recursos",
          collapsed: true,
          items: [
            {
              text: "Visão Geral do Editor",
              link: "/pt/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "Gerenciador de Desenho",
              link: "/pt/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "Modo de Edição",
              link: "/pt/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "Sincronização de Recursos",
              link: "/pt/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "Integração OSM",
              link: "/pt/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "Municípios",
          collapsed: true,
          items: [
            {
              text: "Coleções de Conteúdo",
              link: "/pt/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "Estrutura de Dados",
              link: "/pt/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "Roteamento",
              link: "/pt/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "Componentes de UI",
          collapsed: true,
          items: [
            {
              text: "Componentes Astro",
              link: "/pt/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "Estilização TailwindCSS",
              link: "/pt/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "Design Responsivo",
              link: "/pt/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "Utilitários",
          collapsed: true,
          items: [
            {
              text: "Interação de Camadas",
              link: "/pt/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "Utilitários de Coordenadas",
              link: "/pt/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "Gerenciamento de Armazenamento",
              link: "/pt/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "Fluxo de Desenvolvimento",
      collapsed: true,
      items: [
        {
          text: "Configuração Local",
          link: "/pt/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Fluxo de Trabalho Git",
          link: "/pt/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "Estilo de Código",
          link: "/pt/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "Testes",
          link: "/pt/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "Depuração",
          link: "/pt/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "Implantação",
      collapsed: true,
      items: [
        {
          text: "Sistema Multi-Branch",
          link: "/pt/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Automação de Webhook",
          link: "/pt/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Serviços Systemd",
          link: "/pt/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Proxy Caddy",
          link: "/pt/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "Gerenciamento de Dados",
      collapsed: true,
      items: [
        {
          text: "Coleção de Municípios",
          link: "/pt/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "Fontes de Dados Geoespaciais",
          link: "/pt/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "Sincronização de Dados",
          link: "/pt/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "Referência da API",
      collapsed: true,
      items: [
        {
          text: "Visão Geral dos Serviços API",
          link: "/pt/entwicklungshandbuch/api-referenz/",
        },
        {
          text: "Integração GeoServer",
          link: "/pt/entwicklungshandbuch/api-referenz/geoserver-integration",
        },
        {
          text: "API Overpass",
          link: "/pt/entwicklungshandbuch/api-referenz/overpass-api",
        },
        {
          text: "Transações WFS",
          link: "/pt/entwicklungshandbuch/api-referenz/wfs-transactions",
        },
        {
          text: "Módulos TypeScript",
          link: "/pt/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Endpoints Astro",
          link: "/pt/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "Opções de Configuração",
          link: "/pt/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "Contrib",
      collapsed: true,
      items: [
        {
          text: "Contribuindo",
          link: "/pt/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "Guia de Revisão de Código",
          link: "/pt/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "Política de Merge",
          link: "/pt/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/pt/entwicklungsstrategie/": [
    {
      text: "Visão & Filosofia",
      items: [
        { text: "Visão Geral", link: "/pt/entwicklungsstrategie/" },
        {
          text: "Visão 2030",
          link: "/pt/entwicklungsstrategie/vision",
        },
        {
          text: "Filosofia de Código Aberto",
          link: "/pt/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "Escalonamento",
      items: [
        {
          text: "Categorias",
          link: "/pt/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "Municípios",
          link: "/pt/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "Estados Federais",
          link: "/pt/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "Europa & Global",
          link: "/pt/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "Roteiro",
      items: [
        {
          text: "Roteiro",
          link: "/pt/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
