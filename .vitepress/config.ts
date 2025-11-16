import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'p2d2 Documentation',
  description: 'Public-Public Data-DNA - Spatial Data Infrastructure',
  
  locales: {
    root: {
      label: 'Deutsch',
      lang: 'de-DE',
      link: '/de/',
      
      themeConfig: {
        nav: [
          { text: 'Start', link: '/de/' },
          { text: 'Benutzerhandbuch', link: '/de/benutzerhandbuch/' },
          { text: 'Administration', link: '/de/administrationshandbuch/' },
          { text: 'Strategie', link: '/de/entwicklungsstrategie/' }
        ],
        
        sidebar: {
          '/de/benutzerhandbuch/': [
            {
              text: 'Einführung',
              items: [
                { text: 'Übersicht', link: '/de/benutzerhandbuch/' },
                { text: 'Historischer Hintergrund', link: '/de/benutzerhandbuch/hintergrund' },
                { text: 'OpenData-Ansätze', link: '/de/benutzerhandbuch/opendata-ansaetze' },
                { text: 'Der p2d2-Zyklus', link: '/de/benutzerhandbuch/p2d2-zyklus' }
              ]
            },
            {
              text: 'Die Anwendung',
              items: [
                { text: 'Hauptfenster', link: '/de/benutzerhandbuch/anwendung/hauptfenster' },
                { text: 'Feature-Editor', link: '/de/benutzerhandbuch/anwendung/feature-editor' },
                { text: 'Editieren', link: '/de/benutzerhandbuch/anwendung/editieren' },
                { text: 'Speichern', link: '/de/benutzerhandbuch/anwendung/speichern' },
                { text: 'Qualitätssicherung', link: '/de/benutzerhandbuch/anwendung/qualitaetssicherung' }
              ]
            }
          ],
          
          '/de/administrationshandbuch/': [
            {
              text: 'Server-Infrastruktur',
              items: [
                { text: 'Übersicht', link: '/de/administrationshandbuch/' },
                { text: 'Proxmox VE', link: '/de/administrationshandbuch/server-architektur/proxmox' },
                { text: 'Proxmox Backup Server', link: '/de/administrationshandbuch/server-architektur/pbs-backup' },
                { text: 'OPNsense Firewall', link: '/de/administrationshandbuch/server-architektur/opnsense' }
              ]
            },
            {
              text: 'Geodateninfrastruktur',
              items: [
                { text: 'Übersicht GDI', link: '/de/administrationshandbuch/geodateninfrastruktur/' },
                { text: 'PostgreSQL/PostGIS', link: '/de/administrationshandbuch/geodateninfrastruktur/postgresql-postgis' },
                { text: 'GeoServer', link: '/de/administrationshandbuch/geodateninfrastruktur/geoserver' },
                { text: 'MapProxy', link: '/de/administrationshandbuch/geodateninfrastruktur/mapproxy' },
                { text: 'OSM-Tileserver', link: '/de/administrationshandbuch/geodateninfrastruktur/osm-tileserver' }
              ]
            },
            {
              text: 'Software & Deployment',
              items: [
                { text: 'Frontend-Architektur', link: '/de/administrationshandbuch/frontend-architektur' },
                { text: 'Software-Architektur', link: '/de/administrationshandbuch/software-architektur' },
                { text: 'Staging', link: '/de/administrationshandbuch/deployment/staging' },
                { text: 'Production', link: '/de/administrationshandbuch/deployment/production' },
                { text: 'CI/CD Pipeline', link: '/de/administrationshandbuch/deployment/cicd-pipeline' },
                { text: 'Backup-Strategie', link: '/de/administrationshandbuch/backup-strategie' }
              ]
            }
          ],
          
          '/de/entwicklungsstrategie/': [
            {
              text: 'Vision & Philosophie',
              items: [
                { text: 'Übersicht', link: '/de/entwicklungsstrategie/' },
                { text: 'Vision 2030', link: '/de/entwicklungsstrategie/vision' },
                { text: 'OpenSource-Philosophie', link: '/de/entwicklungsstrategie/opensource-philosophie' }
              ]
            },
            {
              text: 'Skalierung',
              items: [
                { text: 'Kategorien-Ausdehnung', link: '/de/entwicklungsstrategie/skalierung/kategorien' },
                { text: 'Kommunale Ebene', link: '/de/entwicklungsstrategie/skalierung/kommunen' },
                { text: 'Bundesländer', link: '/de/entwicklungsstrategie/skalierung/bundeslaender' },
                { text: 'Europa & Global', link: '/de/entwicklungsstrategie/skalierung/europa-global' }
              ]
            },
            {
              text: 'Roadmap',
              items: [
                { text: 'Entwicklungs-Roadmap', link: '/de/entwicklungsstrategie/roadmap' }
              ]
            }
          ]
        },
        
        docFooter: {
          prev: 'Vorherige Seite',
          next: 'Nächste Seite'
        },
        
        outline: {
          label: 'Auf dieser Seite'
        }
      }
    },
    
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Strategy', link: '/en/development-strategy/' }
        ],
        
        sidebar: {
          '/en/development-strategy/': [
            {
              text: 'Vision & Philosophy',
              items: [
                { text: 'Overview', link: '/en/development-strategy/' },
                { text: 'Vision 2030', link: '/en/development-strategy/vision' },
                { text: 'Open Source Philosophy', link: '/en/development-strategy/opensource-philosophy' }
              ]
            },
            {
              text: 'Scaling',
              items: [
                { text: 'Categories', link: '/en/development-strategy/scaling/categories' },
                { text: 'Municipalities', link: '/en/development-strategy/scaling/municipalities' },
                { text: 'Federal States', link: '/en/development-strategy/scaling/federal-states' },
                { text: 'Europe & Global', link: '/en/development-strategy/scaling/europa-global' }
              ]
            },
            {
              text: 'Roadmap',
              items: [
                { text: 'Development Roadmap', link: '/en/development-strategy/roadmap' }
              ]
            }
          ]
        },
        
        docFooter: {
          prev: 'Previous page',
          next: 'Next page'
        },
        
        outline: {
          label: 'On this page'
        }
      }
    }
  },
  
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Peter-Koenig/p2d2-hub' }
    ],
    
    footer: {
      message: 'Released under GPLv3 (Code) & ODbL (Data)',
      copyright: 'Copyright © 2025 p2d2 Project'
    },
    
    search: {
      provider: 'local'
    }
  }
})
