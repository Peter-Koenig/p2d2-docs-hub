#!/bin/bash
# p2d2-docs: Interaktives Kopieren der englischen Entwicklungshandbuch-Dateien
# Von: Inkonsistentes Archiv (/tmp/hb/entw-hb-old/)
# Nach: Konsistente VitePress-Struktur (/rep/projects/websites/p2d2-docs/)

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Pfade
ARCHIVE_BASE="/tmp/hb/entw-hb-old/output"
TARGET_BASE="/rep/projects/websites/p2d2-docs"

# Log-Datei
LOG_FILE="copy-en-handbook.log"
: > "$LOG_FILE"  # Leere Log-Datei

# Statistik
TOTAL=0
COPIED=0
SKIPPED=0
ERRORS=0

echo "========================================================================"
echo "  p2d2-docs: Interaktives Kopieren - Englisches Entwicklungshandbuch"
echo "========================================================================"
echo ""
echo -e "${CYAN}Archiv-Quelle:${NC} $ARCHIVE_BASE"
echo -e "${CYAN}Zielverzeichnis:${NC} $TARGET_BASE"
echo -e "${CYAN}Log-Datei:${NC}     $LOG_FILE"
echo ""
echo -e "${YELLOW}Hinweise:${NC}"
echo "  • Jede Datei wird einzeln angezeigt"
echo "  • ${GREEN}[y]${NC} = Kopieren, ${RED}[n]${NC} = Überspringen, ${YELLOW}[q]${NC} = Abbrechen"
echo "  • Bei Fehlern wird das Script angehalten"
echo ""
read -p "Bereit zum Start? [Enter] " -r
echo ""

# Funktion zum interaktiven Kopieren
copy_interactive() {
    local src_rel="$1"
    local dest_rel="$2"
    local src="$ARCHIVE_BASE/$src_rel"
    local dest="$TARGET_BASE/$dest_rel"

    ((TOTAL++))

    echo "========================================================================"
    echo -e "${BLUE}Datei $TOTAL:${NC}"
    echo ""
    echo -e "${YELLOW}Von:${NC}  $src_rel"
    echo -e "${GREEN}Nach:${NC} $dest_rel"
    echo ""

    # Prüfe ob Quelldatei existiert
    if [ ! -f "$src" ]; then
        echo -e "${RED}✗ FEHLER: Quelldatei nicht gefunden!${NC}"
        echo "FEHLER: $src_rel (nicht gefunden)" >> "$LOG_FILE"
        ((ERRORS++))
        read -p "Weiter? [y/n/q] " -r
        case "$REPLY" in
            q|Q) echo ""; echo "Abgebrochen."; exit 1 ;;
            n|N) return 1 ;;
            *) return 0 ;;
        esac
    fi

    # Zeige Dateigröße
    local size=$(stat -f%z "$src" 2>/dev/null || stat -c%s "$src" 2>/dev/null || echo "?")
    echo -e "${CYAN}Größe:${NC} $size Bytes"

    # Prüfe ob Zieldatei bereits existiert
    if [ -f "$dest" ]; then
        local dest_size=$(stat -f%z "$dest" 2>/dev/null || stat -c%s "$dest" 2>/dev/null || echo "?")
        echo -e "${YELLOW}⚠ Zieldatei existiert bereits (${dest_size} Bytes)${NC}"
    fi

    echo ""
    read -p "Kopieren? [y/n/q] " -r
    echo ""

    case "$REPLY" in
        y|Y|j|J|"")
            # Erstelle Zielverzeichnis
            local dest_dir=$(dirname "$dest")
            mkdir -p "$dest_dir"

            # Kopiere Datei
            if cp "$src" "$dest"; then
                echo -e "${GREEN}✓ Erfolgreich kopiert${NC}"
                echo "OK: $src_rel → $dest_rel" >> "$LOG_FILE"
                ((COPIED++))
            else
                echo -e "${RED}✗ Fehler beim Kopieren${NC}"
                echo "FEHLER: $src_rel → $dest_rel (Kopieren fehlgeschlagen)" >> "$LOG_FILE"
                ((ERRORS++))
                return 1
            fi
            ;;
        q|Q)
            echo -e "${YELLOW}Abgebrochen durch Benutzer${NC}"
            echo "" >> "$LOG_FILE"
            echo "=== ABGEBROCHEN ===" >> "$LOG_FILE"
            exit 0
            ;;
        *)
            echo -e "${YELLOW}Übersprungen${NC}"
            echo "SKIP: $src_rel" >> "$LOG_FILE"
            ((SKIPPED++))
            ;;
    esac

    echo ""
}

echo "========================================================================"
echo "  Start des Kopiervorgangs"
echo "========================================================================"
echo ""

copy_interactive "en/entwicklerhandbuch/index.md" "en/entwicklungshandbuch/index.md"
copy_interactive "en/entwicklerhandbuch/architecture/data-flow.md" "en/entwicklungshandbuch/architektur/datenfluss.md"
copy_interactive "en/entwicklerhandbuch/architecture/project-structure.md" "en/entwicklungshandbuch/architektur/projektstruktur.md"
copy_interactive "en/entwicklerhandbuch/architecture/system-overview.md" "en/entwicklungshandbuch/architektur/systemueberblick.md"
copy_interactive "en/entwicklerhandbuch/architecture/technology-stack.md" "en/entwicklungshandbuch/architektur/technologie-stack.md"
copy_interactive "en/entwicklerhandbuch/module/maps/layer-management.md" "en/entwicklungshandbuch/module/karten/layer-management.md"
copy_interactive "en/entwicklerhandbuch/module/maps/map-config.md" "en/entwicklungshandbuch/module/karten/map-config.md"
copy_interactive "en/entwicklerhandbuch/module/maps/openlayers-integration.md" "en/entwicklungshandbuch/module/karten/openlayers-integration.md"
copy_interactive "en/entwicklerhandbuch/module/maps/wms-wmts-services.md" "en/entwicklungshandbuch/module/karten/wms-wmts-services.md"
copy_interactive "en/entwicklerhandbuch/module/feature-editor/draw-manager.md" "en/entwicklungshandbuch/module/feature-editor/draw-manager.md"
copy_interactive "en/entwicklerhandbuch/module/feature-editor/edit-mode.md" "en/entwicklungshandbuch/module/feature-editor/edit-mode.md"
copy_interactive "en/entwicklerhandbuch/module/feature-editor/editor-overview.md" "en/entwicklungshandbuch/module/feature-editor/editor-overview.md"
copy_interactive "en/entwicklerhandbuch/module/feature-editor/feature-sync.md" "en/entwicklungshandbuch/module/feature-editor/feature-sync.md"
copy_interactive "en/entwicklerhandbuch/module/feature-editor/osm-integration.md" "en/entwicklungshandbuch/module/feature-editor/osm-integration.md"
copy_interactive "en/entwicklerhandbuch/module/municipalities/content-collections.md" "en/entwicklungshandbuch/module/kommunen/content-collections.md"
copy_interactive "en/entwicklerhandbuch/module/municipalities/data-structure.md" "en/entwicklungshandbuch/module/kommunen/datenstruktur.md"
copy_interactive "en/entwicklerhandbuch/module/municipalities/routing.md" "en/entwicklungshandbuch/module/kommunen/routing.md"
copy_interactive "en/entwicklerhandbuch/module/ui-components/astro-components.md" "en/entwicklungshandbuch/module/ui-komponenten/astro-components.md"
copy_interactive "en/entwicklerhandbuch/module/ui-components/responsive-design.md" "en/entwicklungshandbuch/module/ui-komponenten/responsive-design.md"
copy_interactive "en/entwicklerhandbuch/module/ui-components/tailwind-styling.md" "en/entwicklungshandbuch/module/ui-komponenten/tailwind-styling.md"
copy_interactive "en/entwicklerhandbuch/module/utilities/coordinate-utils.md" "en/entwicklungshandbuch/module/utilities/coordinate-utils.md"
copy_interactive "en/entwicklerhandbuch/module/utilities/layer-interaction.md" "en/entwicklungshandbuch/module/utilities/layer-interaction.md"
copy_interactive "en/entwicklerhandbuch/module/utilities/storage-management.md" "en/entwicklungshandbuch/module/utilities/storage-management.md"
copy_interactive "en/entwicklerhandbuch/development-workflow/code-style.md" "en/entwicklungshandbuch/entwicklungsworkflow/code-style.md"
copy_interactive "en/entwicklerhandbuch/development-workflow/debugging.md" "en/entwicklungshandbuch/entwicklungsworkflow/debugging.md"
copy_interactive "en/entwicklerhandbuch/development-workflow/git-workflow.md" "en/entwicklungshandbuch/entwicklungsworkflow/git-workflow.md"
copy_interactive "en/entwicklerhandbuch/development-workflow/local-setup.md" "en/entwicklungshandbuch/entwicklungsworkflow/setup-lokal.md"
copy_interactive "en/entwicklerhandbuch/development-workflow/testing.md" "en/entwicklungshandbuch/entwicklungsworkflow/testing.md"
copy_interactive "en/entwicklerhandbuch/deployment/caddy-proxy.md" "en/entwicklungshandbuch/deployment/caddy-proxy.md"
copy_interactive "en/entwicklerhandbuch/deployment/multi-branch-system.md" "en/entwicklungshandbuch/deployment/multi-branch-system.md"
copy_interactive "en/entwicklerhandbuch/deployment/systemd-services.md" "en/entwicklungshandbuch/deployment/systemd-services.md"
copy_interactive "en/entwicklerhandbuch/deployment/webhook-automation.md" "en/entwicklungshandbuch/deployment/webhook-automation.md"
copy_interactive "en/entwicklerhandbuch/data-management/data-synchronization.md" "en/entwicklungshandbuch/datenverwaltung/daten-synchronisation.md"
copy_interactive "en/entwicklerhandbuch/data-management/geodata-sources.md" "en/entwicklungshandbuch/datenverwaltung/geodaten-quellen.md"
copy_interactive "en/entwicklerhandbuch/data-management/municipalities-collection.md" "en/entwicklungshandbuch/datenverwaltung/kommunen-collection.md"
copy_interactive "en/entwicklerhandbuch/api-reference/astro-endpoints.md" "en/entwicklungshandbuch/api-referenz/astro-endpoints.md"
copy_interactive "en/entwicklerhandbuch/api-reference/config-options.md" "en/entwicklungshandbuch/api-referenz/config-optionen.md"
copy_interactive "en/entwicklerhandbuch/api-reference/typescript-modules.md" "en/entwicklungshandbuch/api-referenz/typescript-modules.md"
copy_interactive "en/entwicklerhandbuch/contrib/code-review-guide.md" "en/entwicklungshandbuch/contrib/code-review-guide.md"
copy_interactive "en/entwicklerhandbuch/contrib/contributing.md" "en/entwicklungshandbuch/contrib/contributing.md"
copy_interactive "en/entwicklerhandbuch/contrib/merge-policy.md" "en/entwicklungshandbuch/contrib/merge-policy.md"

echo "========================================================================"
echo "  Zusammenfassung"
echo "========================================================================"
echo ""
echo -e "${CYAN}Gesamt:${NC}               $TOTAL Dateien"
echo -e "${GREEN}Erfolgreich kopiert:${NC}  $COPIED Dateien"
echo -e "${YELLOW}Übersprungen:${NC}         $SKIPPED Dateien"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Fehler:${NC}               $ERRORS Dateien"
fi
echo ""
echo -e "${CYAN}Log-Datei:${NC} $LOG_FILE"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}⚠ Es sind Fehler aufgetreten!${NC}"
    exit 1
elif [ $COPIED -eq 0 ]; then
    echo -e "${YELLOW}⚠ Keine Dateien wurden kopiert${NC}"
    exit 0
else
    echo -e "${GREEN}✓ Kopiervorgang abgeschlossen${NC}"
    exit 0
fi
