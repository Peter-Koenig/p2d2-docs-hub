import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'p2d2 Dokumentation',
  description: 'Public-Public Data-DNA - Geodateninfrastruktur für offene Verwaltungsdaten',
  lang: 'de-DE',
  base: '/',
  
  themeConfig: {
    nav: [
      { text: 'Start', link: '/' },
      { text: 'Benutzerhandbuch', link: '/benutzerhandbuch/' },
      { text: 'Administration', link: '/administrationshandbuch/' },
      { text: 'Strategie', link: '/entwicklungsstrategie/' }
    ],
    
    sidebar: {
      '/benutzerhandbuch/': [
        {
          text: 'Einführung',
          items: [
            { text: 'Übersicht', link: '/benutzerhandbuch/' },
            { text: 'Historischer Hintergrund', link: '/benutzerhandbuch/hintergrund' },
            { text: 'OpenData-Ansätze', link: '/benutzerhandbuch/opendata-ansaetze' },
            { text: 'Der p2d2-Zyklus', link: '/benutzerhandbuch/p2d2-zyklus' }
          ]
        },
        {
          text: 'Die Anwendung',
          items: [
            { text: 'Hauptfenster', link: '/benutzerhandbuch/anwendung/hauptfenster' },
            { text: 'Feature-Editor', link: '/benutzerhandbuch/anwendung/feature-editor' },
            { text: 'Editieren', link: '/benutzerhandbuch/anwendung/editieren' },
            { text: 'Speichern', link: '/benutzerhandbuch/anwendung/speichern' },
            { text: 'Qualitätssicherung', link: '/benutzerhandbuch/anwendung/qualitaetssicherung' }
          ]
        }
      ],
      
      '/administrationshandbuch/': [
        {
          text: 'Server-Infrastruktur',
          items: [
            { text: 'Übersicht', link: '/administrationshandbuch/' },
            { text: 'Proxmox VE', link: '/administrationshandbuch/server-architektur/proxmox' },
            { text: 'Proxmox Backup Server', link: '/administrationshandbuch/server-architektur/pbs-backup' },
            { text: 'OPNsense Firewall', link: '/administrationshandbuch/server-architektur/opnsense' }
          ]
        },
        {
          text: 'Geodateninfrastruktur',
          items: [
            { text: 'Übersicht GDI', link: '/administrationshandbuch/geodateninfrastruktur/' },
            { text: 'PostgreSQL/PostGIS', link: '/administrationshandbuch/geodateninfrastruktur/postgresql-postgis' },
            { text: 'GeoServer', link: '/administrationshandbuch/geodateninfrastruktur/geoserver' },
            { text: 'MapProxy', link: '/administrationshandbuch/geodateninfrastruktur/mapproxy' },
            { text: 'OSM-Tileserver', link: '/administrationshandbuch/geodateninfrastruktur/osm-tileserver' },
            { text: 'uMap-Server (geplant)', link: '/administrationshandbuch/geodateninfrastruktur/umap-server' }
          ]
        },
        {
          text: 'Software & Deployment',
          items: [
            { text: 'Frontend-Architektur', link: '/administrationshandbuch/frontend-architektur' },
            { text: 'Software-Architektur', link: '/administrationshandbuch/software-architektur' },
            { text: 'Staging-Umgebung', link: '/administrationshandbuch/deployment/staging' },
            { text: 'Production-Deployment', link: '/administrationshandbuch/deployment/production' },
            { text: 'CI/CD Pipeline', link: '/administrationshandbuch/deployment/cicd-pipeline' },
            { text: 'Backup-Strategie', link: '/administrationshandbuch/backup-strategie' }
          ]
        }
      ],
      
      '/entwicklungsstrategie/': [
        {
          text: 'Vision & Philosophie',
          items: [
            { text: 'Übersicht', link: '/entwicklungsstrategie/' },
            { text: 'Vision 2030', link: '/entwicklungsstrategie/vision' },
            { text: 'OpenSource-Philosophie', link: '/entwicklungsstrategie/opensource-philosophie' }
          ]
        },
        {
          text: 'Skalierung',
          items: [
            { text: 'Kategorien-Ausdehnung', link: '/entwicklungsstrategie/skalierung/kategorien' },
            { text: 'Kommunale Ebene', link: '/entwicklungsstrategie/skalierung/kommunen' },
            { text: 'Bundesländer', link: '/entwicklungsstrategie/skalierung/bundeslaender' },
            { text: 'Europa & Global', link: '/entwicklungsstrategie/skalierung/europa-global' }
          ]
        },
        {
          text: 'Roadmap',
          items: [
            { text: 'Entwicklungs-Roadmap', link: '/entwicklungsstrategie/roadmap' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Peter-Koenig/p2d2-hub' }
    ],
    
    footer: {
      message: 'Veröffentlicht unter GPLv3 (Code) & ODbL (Daten)',
      copyright: 'Copyright © 2025 p2d2 Projekt'
    },
    
    search: {
      provider: 'local'
    },
    
    outline: {
      level: [2, 3]
    }
  }
})
