// .vitepress/config.ts
import { defineConfig } from 'vitepress'
  ignoreDeadLinks: true,

export default defineConfig({
  title: 'p2d2 Documentation',
  description: 'Public-Public Data-DNA',
  
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
                { text: 'Kategorien', link: '/de/entwicklungsstrategie/skalierung/kategorien' },
                { text: 'Kommunen', link: '/de/entwicklungsstrategie/skalierung/kommunen' },
                { text: 'Bundesländer', link: '/de/entwicklungsstrategie/skalierung/bundeslaender' },
                { text: 'Europa & Global', link: '/de/entwicklungsstrategie/skalierung/europa-global' }
              ]
            },
            {
              text: 'Roadmap',
              items: [
                { text: 'Roadmap', link: '/de/entwicklungsstrategie/roadmap' }
              ]
            }
          ]
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
          { text: 'User Guide', link: '/en/benutzerhandbuch/' },
          { text: 'Administration', link: '/en/administrationshandbuch/' },
          { text: 'Strategy', link: '/en/entwicklungsstrategie/' }  // ← Gleiche URL!
        ],
        
        sidebar: {
          '/en/entwicklungsstrategie/': [  // ← Gleicher Pfad!
            {
              text: 'Vision & Philosophy',
              items: [
                { text: 'Overview', link: '/en/entwicklungsstrategie/' },
                { text: 'Vision 2030', link: '/en/entwicklungsstrategie/vision' },
                { text: 'Open Source Philosophy', link: '/en/entwicklungsstrategie/opensource-philosophie' }
              ]
            },
            {
              text: 'Scaling',
              items: [
                { text: 'Categories', link: '/en/entwicklungsstrategie/skalierung/kategorien' },
                { text: 'Municipalities', link: '/en/entwicklungsstrategie/skalierung/kommunen' },
                { text: 'Federal States', link: '/en/entwicklungsstrategie/skalierung/bundeslaender' },
                { text: 'Europe & Global', link: '/en/entwicklungsstrategie/skalierung/europa-global' }
              ]
            },
            {
              text: 'Roadmap',
              items: [
                { text: 'Roadmap', link: '/en/entwicklungsstrategie/roadmap' }
              ]
            }
          ]
        }
      }
    }
  },
  
  // Gemeinsame Konfiguration
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Peter-Koenig/p2d2-hub' }
    ],
    
    search: {
      provider: 'local'
    }
  },
    rewrites: {
    'entwicklungsstrategie/:path*': 'de/entwicklungsstrategie/:path*',
    'benutzerhandbuch/:path*': 'de/benutzerhandbuch/:path*',
    'administrationshandbuch/:path*': 'de/administrationshandbuch/:path*'
  }
})


