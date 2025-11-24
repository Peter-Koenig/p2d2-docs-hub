export const sidebar_fr = {
  "/fr/planning/": [
    {
      text: "Version",
      items: [
        {
          text: "Feuille de route",
          collapsed: true,
          items: [{ text: "Aperçu", link: "/fr/planning/" }],
        },
        {
          text: "Planification",
          collapsed: true,
          items: [
            { text: "Planification v0.2.0", link: "/fr/planning/v0.2.0" },
          ],
        },
        {
          text: "Versions",
          collapsed: true,
          items: [
            { text: "Aperçu", link: "/fr/releases/" },
            { text: "v0.1.0", link: "/fr/releases/v0.1.0" },
          ],
        },
        {
          text: "Backlog des fonctionnalités",
          collapsed: true,
          items: [{ text: "Aperçu", link: "/fr/planning/backlog" }],
        },
      ],
    },
  ],
  "/fr/releases/": [
    {
      text: "Version",
      items: [
        {
          text: "Feuille de route",
          collapsed: true,
          items: [{ text: "Aperçu", link: "/fr/planning/" }],
        },
        {
          text: "Planification",
          collapsed: true,
          items: [
            { text: "Planification v0.2.0", link: "/fr/planning/v0.2.0" },
          ],
        },
        {
          text: "Versions",
          collapsed: true,
          items: [
            { text: "Aperçu", link: "/fr/releases/" },
            { text: "v0.1.0", link: "/fr/releases/v0.1.0" },
          ],
        },
        {
          text: "Backlog des fonctionnalités",
          collapsed: true,
          items: [{ text: "Aperçu", link: "/fr/planning/backlog" }],
        },
      ],
    },
  ],
  "/fr/administrationshandbuch/": [
    {
      text: "Aperçu",
      items: [
        {
          text: "Manuel d'Administration",
          link: "/fr/administrationshandbuch/",
        },
      ],
    },
    {
      text: "Architecture Serveur",
      items: [
        {
          text: "Proxmox VE",
          link: "/fr/administrationshandbuch/server-architektur/proxmox",
        },
        {
          text: "Proxmox Backup Server",
          link: "/fr/administrationshandbuch/server-architektur/pbs-backup",
        },
        {
          text: "OPNsense",
          link: "/fr/administrationshandbuch/server-architektur/opnsense",
        },
      ],
    },
    {
      text: "Infrastructure de Données Géospatiales",
      items: [
        {
          text: "Aperçu GDI",
          link: "/fr/administrationshandbuch/geodateninfrastruktur/",
        },
        {
          text: "PostgreSQL/PostGIS",
          link: "/fr/administrationshandbuch/geodateninfrastruktur/postgresql-postgis",
        },
        {
          text: "GeoServer",
          link: "/fr/administrationshandbuch/geodateninfrastruktur/geoserver",
        },
        {
          text: "MapProxy",
          link: "/fr/administrationshandbuch/geodateninfrastruktur/mapproxy",
        },
        {
          text: "Serveur de tuiles OSM",
          link: "/fr/administrationshandbuch/geodateninfrastruktur/osm-tileserver",
        },
      ],
    },
  ],
  "/fr/benutzerhandbuch/": [
    {
      text: "Manuel Utilisateur",
      items: [
        {
          text: "Contexte Historique",
          link: "/fr/benutzerhandbuch/hintergrund",
        },
        {
          text: "Objectifs",
          link: "/fr/benutzerhandbuch/ziele",
        },
        {
          text: "Le Cycle p2d2",
          link: "/fr/benutzerhandbuch/p2d2-zyklus",
        },
        {
          text: "Open Source - Open Data",
          link: "/fr/benutzerhandbuch/opendata-ansaetze",
        },
      ],
    },
    {
      text: "Application",
      items: [
        {
          text: "Fenêtre Principale",
          link: "/fr/benutzerhandbuch/anwendung/hauptfenster",
        },
        {
          text: "Éditeur de Fonctionnalités",
          link: "/fr/benutzerhandbuch/anwendung/feature-editor",
        },
        {
          text: "Édition",
          link: "/fr/benutzerhandbuch/anwendung/editieren",
        },
        {
          text: "Sauvegarde",
          link: "/fr/benutzerhandbuch/anwendung/speichern",
        },
        {
          text: "Assurance Qualité",
          link: "/fr/benutzerhandbuch/anwendung/qualitaetssicherung",
        },
      ],
    },
  ],
  "/fr/entwicklungshandbuch/": [
    {
      text: "Aperçu",
      items: [
        {
          text: "Manuel du Développeur",
          link: "/fr/entwicklungshandbuch/",
        },
      ],
    },
    {
      text: "Architecture",
      collapsed: false,
      items: [
        {
          text: "Aperçu du Système",
          link: "/fr/entwicklungshandbuch/architektur/systemueberblick",
        },
        {
          text: "Pile Technologique",
          link: "/fr/entwicklungshandbuch/architektur/technologie-stack",
        },
        {
          text: "Structure du Projet",
          link: "/fr/entwicklungshandbuch/architektur/projektstruktur",
        },
        {
          text: "Flux de Données",
          link: "/fr/entwicklungshandbuch/architektur/datenfluss",
        },
      ],
    },
    {
      text: "Modules",
      collapsed: false,
      items: [
        {
          text: "Cartes",
          collapsed: true,
          items: [
            {
              text: "Configuration de Carte",
              link: "/fr/entwicklungshandbuch/module/karten/map-config",
            },
            {
              text: "Gestion des Couches",
              link: "/fr/entwicklungshandbuch/module/karten/layer-management",
            },
            {
              text: "Intégration OpenLayers",
              link: "/fr/entwicklungshandbuch/module/karten/openlayers-integration",
            },
            {
              text: "Services WMS/WMTS",
              link: "/fr/entwicklungshandbuch/module/karten/wms-wmts-services",
            },
          ],
        },
        {
          text: "Éditeur de Fonctionnalités",
          collapsed: true,
          items: [
            {
              text: "Aperçu de l'Éditeur",
              link: "/fr/entwicklungshandbuch/module/feature-editor/editor-overview",
            },
            {
              text: "Gestionnaire de Dessin",
              link: "/fr/entwicklungshandbuch/module/feature-editor/draw-manager",
            },
            {
              text: "Mode Édition",
              link: "/fr/entwicklungshandbuch/module/feature-editor/edit-mode",
            },
            {
              text: "Synchronisation des Fonctionnalités",
              link: "/fr/entwicklungshandbuch/module/feature-editor/feature-sync",
            },
            {
              text: "Intégration OSM",
              link: "/fr/entwicklungshandbuch/module/feature-editor/osm-integration",
            },
          ],
        },
        {
          text: "Municipalités",
          collapsed: true,
          items: [
            {
              text: "Collections de Contenu",
              link: "/fr/entwicklungshandbuch/module/kommunen/content-collections",
            },
            {
              text: "Structure des Données",
              link: "/fr/entwicklungshandbuch/module/kommunen/datenstruktur",
            },
            {
              text: "Routage",
              link: "/fr/entwicklungshandbuch/module/kommunen/routing",
            },
          ],
        },
        {
          text: "Composants UI",
          collapsed: true,
          items: [
            {
              text: "Composants Astro",
              link: "/fr/entwicklungshandbuch/module/ui-komponenten/astro-components",
            },
            {
              text: "Stylisation TailwindCSS",
              link: "/fr/entwicklungshandbuch/module/ui-komponenten/tailwind-styling",
            },
            {
              text: "Design Responsive",
              link: "/fr/entwicklungshandbuch/module/ui-komponenten/responsive-design",
            },
          ],
        },
        {
          text: "Utilitaires",
          collapsed: true,
          items: [
            {
              text: "Interaction des Couches",
              link: "/fr/entwicklungshandbuch/module/utilities/layer-interaction",
            },
            {
              text: "Utilitaires de Coordonnées",
              link: "/fr/entwicklungshandbuch/module/utilities/coordinate-utils",
            },
            {
              text: "Gestion du Stockage",
              link: "/fr/entwicklungshandbuch/module/utilities/storage-management",
            },
          ],
        },
      ],
    },
    {
      text: "Flux de Développement",
      collapsed: true,
      items: [
        {
          text: "Configuration Locale",
          link: "/fr/entwicklungshandbuch/entwicklungsworkflow/setup-lokal",
        },
        {
          text: "Flux de Travail Git",
          link: "/fr/entwicklungshandbuch/entwicklungsworkflow/git-workflow",
        },
        {
          text: "Style de Code",
          link: "/fr/entwicklungshandbuch/entwicklungsworkflow/code-style",
        },
        {
          text: "Tests",
          link: "/fr/entwicklungshandbuch/entwicklungsworkflow/testing",
        },
        {
          text: "Débogage",
          link: "/fr/entwicklungshandbuch/entwicklungsworkflow/debugging",
        },
      ],
    },
    {
      text: "Déploiement",
      collapsed: true,
      items: [
        {
          text: "Système Multi-Branche",
          link: "/fr/entwicklungshandbuch/deployment/multi-branch-system",
        },
        {
          text: "Automatisation Webhook",
          link: "/fr/entwicklungshandbuch/deployment/webhook-automation",
        },
        {
          text: "Services Systemd",
          link: "/fr/entwicklungshandbuch/deployment/systemd-services",
        },
        {
          text: "Proxy Caddy",
          link: "/fr/entwicklungshandbuch/deployment/caddy-proxy",
        },
      ],
    },
    {
      text: "Gestion des Données",
      collapsed: true,
      items: [
        {
          text: "Collection de Municipalités",
          link: "/fr/entwicklungshandbuch/datenverwaltung/kommunen-collection",
        },
        {
          text: "Sources de Données Géospatiales",
          link: "/fr/entwicklungshandbuch/datenverwaltung/geodaten-quellen",
        },
        {
          text: "Synchronisation des Données",
          link: "/fr/entwicklungshandbuch/datenverwaltung/daten-synchronisation",
        },
      ],
    },
    {
      text: "Référence API",
      collapsed: true,
      items: [
        {
          text: "Modules TypeScript",
          link: "/fr/entwicklungshandbuch/api-referenz/typescript-modules",
        },
        {
          text: "Endpoints Astro",
          link: "/fr/entwicklungshandbuch/api-referenz/astro-endpoints",
        },
        {
          text: "Options de Configuration",
          link: "/fr/entwicklungshandbuch/api-referenz/config-optionen",
        },
      ],
    },
    {
      text: "Contrib",
      collapsed: true,
      items: [
        {
          text: "Contribuer",
          link: "/fr/entwicklungshandbuch/contrib/contributing",
        },
        {
          text: "Guide de Revue de Code",
          link: "/fr/entwicklungshandbuch/contrib/code-review-guide",
        },
        {
          text: "Politique de Fusion",
          link: "/fr/entwicklungshandbuch/contrib/merge-policy",
        },
      ],
    },
  ],
  "/fr/entwicklungsstrategie/": [
    {
      text: "Vision & Philosophie",
      items: [
        { text: "Aperçu", link: "/fr/entwicklungsstrategie/" },
        {
          text: "Vision 2030",
          link: "/fr/entwicklungsstrategie/vision",
        },
        {
          text: "Philosophie Open Source",
          link: "/fr/entwicklungsstrategie/opensource-philosophie",
        },
      ],
    },
    {
      text: "Mise à l'Échelle",
      items: [
        {
          text: "Catégories",
          link: "/fr/entwicklungsstrategie/skalierung/kategorien",
        },
        {
          text: "Municipalités",
          link: "/fr/entwicklungsstrategie/skalierung/kommunen",
        },
        {
          text: "États Fédéraux",
          link: "/fr/entwicklungsstrategie/skalierung/bundeslaender",
        },
        {
          text: "Europe & Global",
          link: "/fr/entwicklungsstrategie/skalierung/europa-global",
        },
      ],
    },
    {
      text: "Feuille de route",
      items: [
        {
          text: "Feuille de route",
          link: "/fr/entwicklungsstrategie/roadmap",
        },
      ],
    },
  ],
};
