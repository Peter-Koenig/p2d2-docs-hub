#!/bin/bash
# migrate-to-i18n.sh - VitePress i18n Migration (Verbesserte Version)

set -e

WORK_DIR=$(pwd)
TMP_DIR="/tmp/vitepress-i18n-migration-$$"

echo "🚀 Starte i18n-Migration..."
echo "📂 Arbeitsverzeichnis: $WORK_DIR"
echo "📁 Temporäres Verzeichnis: $TMP_DIR"

# =============================================================================
# 1. Temporäre Struktur anlegen
# =============================================================================
echo ""
echo "📋 Schritt 1: Temporäre Verzeichnisstruktur anlegen..."

mkdir -p "$TMP_DIR"/{de,en}
mkdir -p "$TMP_DIR"/en/development-strategy/scaling

echo "✅ Verzeichnisstruktur erstellt"

# =============================================================================
# 2. Englische Übersetzungen sichern (aus den geänderten Dateien)
# =============================================================================
echo ""
echo "💾 Schritt 2: Englische Übersetzungen sichern..."

# Mapping: Aktuell geänderte deutsche Dateien → Ziel englische Dateien
declare -A EN_FILES=(
    ["index.md"]="en/index.md"
    ["entwicklungsstrategie/index.md"]="en/development-strategy/index.md"
    ["entwicklungsstrategie/vision.md"]="en/development-strategy/vision.md"
    ["entwicklungsstrategie/opensource-philosophie.md"]="en/development-strategy/opensource-philosophy.md"
    ["entwicklungsstrategie/roadmap.md"]="en/development-strategy/roadmap.md"
    ["entwicklungsstrategie/skalierung/kategorien.md"]="en/development-strategy/scaling/categories.md"
    ["entwicklungsstrategie/skalierung/kommunen.md"]="en/development-strategy/scaling/municipalities.md"
    ["entwicklungsstrategie/skalierung/bundeslaender.md"]="en/development-strategy/scaling/federal-states.md"
    ["entwicklungsstrategie/skalierung/europa-global.md"]="en/development-strategy/scaling/europe-global.md"
)

for DE_SRC in "${!EN_FILES[@]}"; do
    EN_TARGET="${EN_FILES[$DE_SRC]}"
    
    if [ -f "$WORK_DIR/$DE_SRC" ]; then
        EN_DIR=$(dirname "$TMP_DIR/$EN_TARGET")
        mkdir -p "$EN_DIR"
        
        echo "  📄 Sichere Übersetzung: $DE_SRC → $EN_TARGET"
        cp "$WORK_DIR/$DE_SRC" "$TMP_DIR/$EN_TARGET"
    else
        echo "  ⚠️  Datei $DE_SRC nicht gefunden!"
    fi
done

echo "✅ Englische Übersetzungen gesichert (9 Dateien)"

# =============================================================================
# 3. Deutsche Originale wiederherstellen
# =============================================================================
echo ""
echo "🔄 Schritt 3: Deutsche Originale aus Git wiederherstellen..."

git restore \
    index.md \
    entwicklungsstrategie/index.md \
    entwicklungsstrategie/vision.md \
    entwicklungsstrategie/opensource-philosophie.md \
    entwicklungsstrategie/roadmap.md \
    entwicklungsstrategie/skalierung/kategorien.md \
    entwicklungsstrategie/skalierung/kommunen.md \
    entwicklungsstrategie/skalierung/bundeslaender.md \
    entwicklungsstrategie/skalierung/europa-global.md

echo "✅ 9 deutsche Dateien wiederhergestellt"

# =============================================================================
# 4. ALLE deutschen Dateien nach tmp/de/ kopieren
# =============================================================================
echo ""
echo "📦 Schritt 4: Alle deutschen Dateien nach $TMP_DIR/de/ kopieren..."

# index.md
if [ -f "$WORK_DIR/index.md" ]; then
    cp "$WORK_DIR/index.md" "$TMP_DIR/de/index.md"
    echo "  ✓ index.md"
fi

# Benutzerhandbuch komplett
if [ -d "$WORK_DIR/benutzerhandbuch" ]; then
    cp -r "$WORK_DIR/benutzerhandbuch" "$TMP_DIR/de/"
    echo "  ✓ benutzerhandbuch/ ($(find "$WORK_DIR/benutzerhandbuch" -type f | wc -l) Dateien)"
fi

# Administrationshandbuch komplett
if [ -d "$WORK_DIR/administrationshandbuch" ]; then
    cp -r "$WORK_DIR/administrationshandbuch" "$TMP_DIR/de/"
    echo "  ✓ administrationshandbuch/ ($(find "$WORK_DIR/administrationshandbuch" -type f | wc -l) Dateien)"
fi

# Entwicklungsstrategie komplett
if [ -d "$WORK_DIR/entwicklungsstrategie" ]; then
    cp -r "$WORK_DIR/entwicklungsstrategie" "$TMP_DIR/de/"
    echo "  ✓ entwicklungsstrategie/ ($(find "$WORK_DIR/entwicklungsstrategie" -type f | wc -l) Dateien)"
fi

echo "✅ Alle deutschen Dateien kopiert"

# =============================================================================
# 5. .vitepress, package.json und andere Root-Dateien kopieren
# =============================================================================
echo ""
echo "📋 Schritt 5: Konfigurationsdateien kopieren..."

# .vitepress Theme
if [ -d "$WORK_DIR/.vitepress/theme" ]; then
    mkdir -p "$TMP_DIR/.vitepress/theme"
    cp -r "$WORK_DIR/.vitepress/theme"/* "$TMP_DIR/.vitepress/theme/"
    echo "  ✓ .vitepress/theme/"
fi

# package.json
if [ -f "$WORK_DIR/package.json" ]; then
    cp "$WORK_DIR/package.json" "$TMP_DIR/"
    echo "  ✓ package.json"
fi

# .gitignore
if [ -f "$WORK_DIR/.gitignore" ]; then
    cp "$WORK_DIR/.gitignore" "$TMP_DIR/"
    echo "  ✓ .gitignore"
fi

# README.md
if [ -f "$WORK_DIR/README.md" ]; then
    cp "$WORK_DIR/README.md" "$TMP_DIR/"
    echo "  ✓ README.md"
fi

# deploy.sh (falls vorhanden)
if [ -f "$WORK_DIR/deploy.sh" ]; then
    cp "$WORK_DIR/deploy.sh" "$TMP_DIR/"
    echo "  ✓ deploy.sh"
fi

echo "✅ Konfigurationsdateien kopiert"

# =============================================================================
# 6. i18n-Config erstellen
# =============================================================================
echo ""
echo "⚙️  Schritt 6: i18n-Konfiguration erstellen..."

cat > "$TMP_DIR/.vitepress/config.ts" << 'EOFCONFIG'
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
EOFCONFIG

echo "✅ i18n-Config erstellt"

# =============================================================================
# 7. Übersicht ausgeben
# =============================================================================
echo ""
echo "📊 Schritt 7: Übersicht der Migration..."

echo ""
echo "Deutsche Dateien in $TMP_DIR/de/:"
find "$TMP_DIR/de" -type f -name "*.md" | wc -l
echo "Dateien"

echo ""
echo "Englische Dateien in $TMP_DIR/en/:"
find "$TMP_DIR/en" -type f -name "*.md" | wc -l
echo "Dateien"

echo ""
read -p "Migration nach $WORK_DIR übernehmen? [j/N] " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Jj]$ ]]; then
    echo "❌ Migration abgebrochen. Temporäre Dateien bleiben in $TMP_DIR"
    exit 0
fi

# =============================================================================
# 8. Inhalte übernehmen
# =============================================================================
echo ""
echo "📂 Schritt 8: Neue Struktur ins Arbeitsverzeichnis übernehmen..."

# Alte Struktur löschen
rm -rf "$WORK_DIR/benutzerhandbuch"
rm -rf "$WORK_DIR/administrationshandbuch"
rm -rf "$WORK_DIR/entwicklungsstrategie"
rm -f "$WORK_DIR/index.md"

# .vitepress/config.ts ersetzen
rm -f "$WORK_DIR/.vitepress/config.ts"

# Neue Struktur kopieren
cp -r "$TMP_DIR"/* "$WORK_DIR/"
cp -r "$TMP_DIR"/.vitepress "$WORK_DIR/"

echo "✅ Neue Struktur übernommen"

# =============================================================================
# 9. Cleanup
# =============================================================================
echo ""
echo "🗑️  Schritt 9: Temporäres Verzeichnis löschen..."

rm -rf "$TMP_DIR"

echo "✅ Temporäres Verzeichnis gelöscht"

# =============================================================================
# Abschluss
# =============================================================================
echo ""
echo "✨ Migration erfolgreich abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "  1. Build testen:     npm run docs:build"
echo "  2. Dev-Server:       npm run docs:dev"
echo "  3. Git-Status:       git status"
echo "  4. Committen:        git add -A && git commit -m 'feat: i18n support DE/EN'"
echo ""
echo "🌐 Sprachen verfügbar unter:"
echo "  - Deutsch: http://localhost:5173/de/"
echo "  - English: http://localhost:5173/en/"
echo ""
echo "📁 Verzeichnisstruktur:"
echo "  de/ - Alle deutschen Dokumente ($(find "$WORK_DIR/de" -type f -name "*.md" 2>/dev/null | wc -l) Dateien)"
echo "  en/ - Englische Übersetzungen ($(find "$WORK_DIR/en" -type f -name "*.md" 2>/dev/null | wc -l) Dateien)"

