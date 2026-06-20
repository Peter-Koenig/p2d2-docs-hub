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
                    items: [
                        { text: "v0.2.0 Planung", link: "/de/planning/v0.2.0" },
                    ],
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
                    items: [
                        { text: "Übersicht", link: "/de/planning/backlog" },
                    ],
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
                    items: [
                        { text: "v0.2.0 Planung", link: "/de/planning/v0.2.0" },
                    ],
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
                    items: [
                        { text: "Übersicht", link: "/de/planning/backlog" },
                    ],
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
                    text: "Übersicht",
                    link: "/de/administrationshandbuch/server-architektur/",
                },
                {
                    text: "Proxmox Host",
                    link: "/de/administrationshandbuch/server-architektur/proxmox-host",
                },
                {
                    text: "OPNSense Firewall",
                    link: "/de/administrationshandbuch/server-architektur/vm-opnsense",
                },
                {
                    text: "PostgreSQL/PostGIS Container",
                    link: "/de/administrationshandbuch/server-architektur/lxc-postgresql",
                },
                {
                    text: "GeoServer Container",
                    link: "/de/administrationshandbuch/server-architektur/lxc-geoserver",
                },
                {
                    text: "MapProxy Container",
                    link: "/de/administrationshandbuch/server-architektur/lxc-mapproxy",
                },
                {
                    text: "Frontend Container",
                    link: "/de/administrationshandbuch/server-architektur/lxc-frontend",
                },
                {
                    text: "OSM-Tileserver VM",
                    link: "/de/administrationshandbuch/server-architektur/vm-osm-tiler",
                },
                {
                    text: "Ory IAM Container (Geplant)",
                    link: "/de/administrationshandbuch/server-architektur/lxc-ory-iam",
                },
                {
                    text: "Netzwerk-Architektur",
                    link: "/de/administrationshandbuch/server-architektur/netzwerk-architektur",
                },
                {
                    text: "Backup-Strategie",
                    link: "/de/administrationshandbuch/server-architektur/backup-strategie",
                },
                {
                    text: "Zitadel Build Container",
                    link: "/de/administrationshandbuch/server-architektur/zitadel-buildserver",
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
                    text: "GeoServer-Staging",
                    link: "/de/administrationshandbuch/deployment/geoserver-staging",
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
                    text: "Backup-Strategie (Legacy)",
                    link: "/de/administrationshandbuch/backup-strategie",
                },
            ],
        },
    ],
    "/de/benutzerhandbuch/": [
        {
            text: "Benutzungshandbuch",
            items: [
                {
                    text: "Hintergrund",
                    link: "/de/benutzerhandbuch/hintergrund",
                },
                {
                    text: "Ziele",
                    link: "/de/benutzerhandbuch/ziele",
                },
                {
                    text: "p2d2 - Zyklus",
                    link: "/de/benutzerhandbuch/p2d2-zyklus",
                },
                {
                    text: "Open Source - Open Data",
                    link: "/de/benutzerhandbuch/opensource-opendata",
                },
            ],
        },
        {
            text: "Anwendung",
            items: [
                {
                    text: "Hauptfenster",
                    link: "/de/benutzerhandbuch/anwendung/hauptfenster",
                },
                {
                    text: "Feature Editor",
                    link: "/de/benutzerhandbuch/anwendung/feature-editor",
                },
                {
                    text: "Editieren",
                    link: "/de/benutzerhandbuch/anwendung/editieren",
                },
                {
                    text: "Speichern",
                    link: "/de/benutzerhandbuch/anwendung/speichern",
                },
                {
                    text: "Qualitätssicherung",
                    link: "/de/benutzerhandbuch/anwendung/qualitaetssicherung",
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
                {
                    text: "Event Handling & Cross-Window Kommunikation",
                    link: "/de/entwicklungshandbuch/architektur/eventhandling",
                },
                {
                    text: "WFS-Layer-Architektur",
                    link: "/de/entwicklungshandbuch/architektur/wfs-layer-architektur",
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
                        {
                            text: "Event System & API Integration",
                            link: "/de/entwicklungshandbuch/module/utilities/event-system",
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
                {
                    text: "Geoserver Integration",
                    link: "/de/entwicklungshandbuch/api-referenz/geoserver-integration",
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
                {
                    text: "IAM - Zitadel (Konzept)",
                    link: "/de/entwicklungsstrategie/iam-zitadel-konzept",
                },
            ],
        },
    ],
    "/de/verwaltungshandbuch/": [
        {
            text: "Übersicht",
            items: [
                {
                    text: "Verwaltungshandbuch",
                    link: "/de/verwaltungshandbuch/",
                },
            ],
        },
        {
            text: "Kapitel",
            items: [
                {
                    text: "Einführung",
                    link: "/de/verwaltungshandbuch/einfuehrung",
                },
                {
                    text: "Datenkategorien",
                    link: "/de/verwaltungshandbuch/datenkategorien",
                },
                {
                    text: "Datenaustauschprozesse",
                    link: "/de/verwaltungshandbuch/datenaustauschprozesse",
                },
                {
                    text: "Qualitätssicherung",
                    link: "/de/verwaltungshandbuch/qualitaetssicherung",
                },
                {
                    text: "Rechtliche Grundlagen",
                    link: "/de/verwaltungshandbuch/rechtliche-grundlagen",
                },
                {
                    text: "Best Practices",
                    link: "/de/verwaltungshandbuch/best-practices",
                },
                {
                    text: "Fallbeispiele",
                    link: "/de/verwaltungshandbuch/fallbeispiele",
                },
            ],
        },
    ],
    "/de/specs/": [
        {
            text: "Spezifikationshandbuch",
            items: [
                { text: "Übersicht", link: "/de/specs/" },
                {
                    text: "CIVITAS/CORE-Plugin",
                    collapsed: false,
                    items: [
                        {
                            text: "Übersicht",
                            link: "/de/specs/civitas-core-plugin/",
                        },
                        {
                            text: "Serveraufbau",
                            collapsed: false,
                            items: [
                                {
                                    text: "Übersicht",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/",
                                },
                                {
                                    text: "Zielbild und Abgrenzung",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/zielbild-und-abgrenzung",
                                },
                                {
                                    text: "VM-Sizing und Host-Ressourcen",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/vm-sizing-und-host-ressourcen",
                                },
                                {
                                    text: "Netzwerk, DNS und TLS",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/netzwerk-dns-tls",
                                },
                                {
                                    text: "Kubernetes-Laufzeit",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/kubernetes-laufzeit",
                                },
                                {
                                    text: "Installationsphasen und Abnahme",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/installationsphasen-und-abnahme",
                                },
                                {
                                    text: "Skriptarchitektur",
                                    link: "/de/specs/civitas-core-plugin/serveraufbau/skriptarchitektur",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
