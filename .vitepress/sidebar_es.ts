export const sidebar_es = {
  "/es/entwicklung/": [
    {
      text: "Desarrollo",
      items: [
        {
          text: "Contribuir",
          link: "/es/entwicklung/contributing",
        },
        {
          text: "Plugin de Sincronización de Polígonos",
          link: "/es/entwicklung/polygon-sync",
        },
      ],
    },
  ],
  "/es/planning/": [
    {
      text: "Lanzamiento",
      items: [
        {
          text: "Hoja de Ruta",
          collapsed: true,
          items: [{ text: "Resumen", link: "/es/planning/" }],
        },
        {
          text: "Planificación",
          collapsed: true,
          items: [
            { text: "Planificación v0.2.0", link: "/es/planning/v0.2.0" },
          ],
        },
        {
          text: "Lanzamientos",
          collapsed: true,
          items: [
            { text: "Resumen", link: "/es/releases/" },
            { text: "v0.1.0", link: "/es/releases/v0.1.0" },
          ],
        },
        {
          text: "Backlog de Funcionalidades",
          collapsed: true,
          items: [{ text: "Resumen", link: "/es/planning/backlog" }],
        },
      ],
    },
  ],
  "/es/releases/": [
    {
      text: "Lanzamiento",
      items: [
        {
          text: "Hoja de Ruta",
          collapsed: true,
          items: [{ text: "Resumen", link: "/es/planning/" }],
        },
        {
          text: "Planificación",
          collapsed: true,
          items: [
            { text: "Planificación v0.2.0", link: "/es/planning/v0.2.0" },
          ],
        },
        {
          text: "Lanzamientos",
          collapsed: true,
          items: [
            { text: "Resumen", link: "/es/releases/" },
            { text: "v0.1.0", link: "/es/releases/v0.1.0" },
          ],
        },
        {
          text: "Backlog de Funcionalidades",
          collapsed: true,
          items: [{ text: "Resumen", link: "/es/planning/backlog" }],
        },
      ],
    },
  ],
  "/es/administrationshandbuch/": [
    {
      text: "Resumen",
      items: [
        {
          text: "Manual de Administración",
          link: "/es/administrationshandbuch/",
        },
      ],
    },
    {
      text: "Arquitectura del Servidor",
      items: [
        {
          text: "Resumen",
          link: "/es/administrationshandbuch/server-architektur/",
        },
        {
          text: "Host Proxmox",
          link: "/es/administrationshandbuch/server-architektur/proxmox-host",
        },
        {
          text: "Firewall OPNsense",
          link: "/es/administrationshandbuch/server-architektur/vm-opnsense",
        },
        {
          text: "Contenedor PostgreSQL/PostGIS",
          link: "/es/administrationshandbuch/server-architektur/lxc-postgresql",
        },
        {
          text: "Contenedor GeoServer",
          link: "/es/administrationshandbuch/server-architektur/lxc-geoserver",
        },
        {
          text: "Contenedor MapProxy",
          link: "/es/administrationshandbuch/server-architektur/lxc-mapproxy",
        },
        {
          text: "Contenedor Frontend",
          link: "/es/administrationshandbuch/server-architektur/lxc-frontend",
        },
        {
          text: "Servidor de Tiles OSM",
          link: "/es/administrationshandbuch/server-architektur/vm-osm-tiler",
        },
        {
          text: "Arquitectura de Red",
          link: "/es/administrationshandbuch/server-architektur/netzwerk-architektur",
        },
        {
          text: "Estrategia de Backup",
          link: "/es/administrationshandbuch/server-architektur/backup-strategie",
        },
        {
          text: "Ory IAM (Planeado)",
          link: "/es/administrationshandbuch/server-architektur/lxc-ory-iam",
        },
      ],
    },
    {
      text: "Infraestructura de Datos Geoespaciales",
      items: [
        {
          text: "Resumen GDI",
          link: "/es/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "Arquitectura GDI",
          link: "/es/administrationshandbuch/geodateninfrastruktur/gdi-architektur",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/es/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "MapProxy",
          link: "/es/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "Servidor de Tiles OSM",
          link: "/es/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
    {
      text: "Despliegue",
      items: [
        {
          text: "Pipeline CI/CD",
          link: "/es/administrationshandbuch/deployment/cicd-pipeline",
        },
        {
          text: "Entorno de Staging",
          link: "/es/administrationshandbuch/deployment/staging",
        },
        {
          text: "Despliegue en Producción",
          link: "/es/administrationshandbuch/deployment/production",
        },
        {
          text: "Despliegue Multi-Rama",
          link: "/es/administrationshandbuch/deployment/multi-branch-deployment",
        },
      ],
    },
    {
      text: "Frontend",
      items: [
        {
          text: "Arquitectura Frontend",
          link: "/es/administrationshandbuch/frontend-architektur",
        },
      ],
    },
  ],
  "/es/benutzerhandbuch/": [
    {
      text: "Manual de Usuario",
      items: [
        {
          text: "Contexto Histórico",
          link: "/es/benutzerhandbuch/hintergrund",
        },
        {
          text: "Objetivos",
          link: "/es/benutzerhandbuch/ziele",
        },
        {
          text: "El Ciclo p2d2",
          link: "/es/benutzerhandbuch/p2d2-zyklus",
        },
        {
          text: "Código Abierto - Datos Abiertos",
          link: "/es/benutzerhandbuch/opendata-ansaetze",
        },
      ],
    },
    {
      text: "Aplicación",
      items: [
        {
          text: "Ventana Principal",
          link: "/es/benutzerhandbuch/anwendung/hauptfenster",
        },
        {
          text: "Editor de Características",
          link: "/es/benutzerhandbuch/anwendung/feature-editor",
        },
        {
          text: "Editando",
          link: "/es/benutzerhandbuch/anwendung/editieren",
        },
        {
          text: "Guardando",
          link: "/es/benutzerhandbuch/anwendung/speichern",
        },
        {
          text: "Garantía de Calidad",
          link: "/es/benutzerhandbuch/anwendung/qualitaetssicherung",
        },
      ],
    },
  ],
  "/es/entwicklungshandbuch/": [
    {
      text: "Resumen",
      items: [
        {
          text: "Manual del Desarrollador",
          link: "/es/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "Arquitectura",
      collapsed: false,
      items: [
        {
          text: "Resumen del Sistema",
          link: "/es/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "Pila Tecnológica",
          link: "/es/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "Estructura del Proyecto",
          link: "/es/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "Flujo de Datos",
          link: "/es/entwicklungshandbuch/architektur/datenfluss",
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
              text: "Configuración del Mapa",
              link: "/es/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "Gestión de Capas",
              link: "/es/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "Integración OpenLayers",
              link: "/es/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "Servicios WMS/WMTS",
              link: "/es/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "Editor de Características",
          collapsed: true,
          items: [
            {
              text: "Resumen del Editor",
              link: "/es/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "Gestor de Dibujo",
              link: "/es/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "Modo de Edición",
              link: "/es/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "Sincronización de Características",
              link: "/es/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "Integración OSM",
              link: "/es/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "Municipios",
          collapsed: true,
          items: [
            {
              text: "Colecciones de Contenido",
              link: "/es/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "Estructura de Datos",
              link: "/es/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "Enrutamiento",
              link: "/es/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "Componentes de UI",
          collapsed: true,
          items: [
            {
              text: "Componentes Astro",
              link: "/es/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "Estilización TailwindCSS",
              link: "/es/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "Diseño Responsivo",
              link: "/es/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "Utilidades",
          collapsed: true,
          items: [
            {
              text: "Interacción de Capas",
              link: "/es/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "Utilidades de Coordenadas",
              link: "/es/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "Gestión de Almacenamiento",
              link: "/es/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "Flujo de Desarrollo",
      collapsed: true,
      items: [
        {
          text: "Configuración Local",
          link: "/es/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Flujo de Trabajo Git",
          link: "/es/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "Estilo de Código",
          link: "/es/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "Pruebas",
          link: "/es/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "Depuración",
          link: "/es/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "Despliegue",
      collapsed: true,
      items: [
        {
          text: "Sistema Multi-Rama",
          link: "/es/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Automatización de Webhook",
          link: "/es/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Servicios Systemd",
          link: "/es/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Proxy Caddy",
          link: "/es/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "Gestión de Datos",
      collapsed: true,
      items: [
        {
          text: "Colección de Municipios",
          link: "/es/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "Fuentes de Datos Geoespaciales",
          link: "/es/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "Sincronización de Datos",
          link: "/es/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "Referencia de API",
      collapsed: true,
      items: [
        {
          text: "Resumen de Servicios API",
          link: "/es/entwicklungshandbuch/api-referenz/",
        },
        {
          text: "Integración GeoServer",
          link: "/es/entwicklungshandbuch/api-referenz/geoserver-integration",
        },
        {
          text: "API Overpass",
          link: "/es/entwicklungshandbuch/api-referenz/overpass-api",
        },
        {
          text: "Transacciones WFS",
          link: "/es/entwicklungshandbuch/api-referenz/wfs-transactions",
        },
        {
          text: "Módulos TypeScript",
          link: "/es/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Endpoints Astro",
          link: "/es/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "Opciones de Configuración",
          link: "/es/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "Contrib",
      collapsed: true,
      items: [
        {
          text: "Contribuyendo",
          link: "/es/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "Guía de Revisión de Código",
          link: "/es/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "Política de Fusión",
          link: "/es/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/es/entwicklungsstrategie/": [
    {
      text: "Visión & Filosofía",
      items: [
        { text: "Resumen", link: "/es/entwicklungsstrategie/" },
        {
          text: "Visión 2030",
          link: "/es/entwicklungsstrategie/vision",
        },
        {
          text: "Filosofía de Código Abierto",
          link: "/es/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "Escalado",
      items: [
        {
          text: "Categorías",
          link: "/es/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "Municipios",
          link: "/es/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "Estados Federales",
          link: "/es/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "Europa & Global",
          link: "/es/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "Hoja de Ruta",
      items: [
        {
          text: "Hoja de Ruta",
          link: "/es/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
