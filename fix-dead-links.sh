i#!/bin/bash
# fix-dead-links.sh - Erstellt Platzhalter für ALLE fehlenden Seiten (verbessert)

set -e

VITEPRESS_ROOT="/rep/projects/websites/p2d2-docs"
cd "$VITEPRESS_ROOT"

echo "🔍 Suche nach Dead Links durch VitePress Build..."
echo ""

# Backup der Config
cp .vitepress/config.ts .vitepress/config.ts.backup

# ignoreDeadLinks deaktivieren
sed -i 's/ignoreDeadLinks: true/ignoreDeadLinks: false/' .vitepress/config.ts

# Build ausführen und Dead Links mit Kontext extrahieren
echo "📋 Führe Test-Build aus..."
BUILD_LOG=$(npm run docs:build 2>&1 || true)

# Config wiederherstellen
mv .vitepress/config.ts.backup .vitepress/config.ts

# Extrahiere Dead Links MIT Quelldatei
DEAD_LINKS=$(echo "$BUILD_LOG" | grep "Found dead link" | sed -n 's/.*Found dead link \(.*\) in file \(.*\)/\1|\2/p')

if [ -z "$DEAD_LINKS" ]; then
    echo "✅ Keine Dead Links gefunden!"
    exit 0
fi

echo ""
echo "📋 Gefundene Dead Links:"
echo "$DEAD_LINKS" | cut -d'|' -f1 | sort -u
echo ""

# Zähler
CREATED_COUNT=0
SKIPPED_COUNT=0

# Verarbeite jeden Dead Link
while IFS='|' read -r LINK SOURCE_FILE; do
    # Ignoriere externe Links
    if [[ "$LINK" =~ ^http ]]; then
        continue
    fi
    
    # Bestimme Verzeichnis der Quelldatei
    SOURCE_DIR=$(dirname "$SOURCE_FILE")
    
    # Bereinige Link
    CLEAN_LINK="$LINK"
    
    # Wenn Link mit ./ beginnt, ist er relativ zur Quelldatei
    if [[ "$CLEAN_LINK" =~ ^\./ ]]; then
        CLEAN_LINK="${CLEAN_LINK#./}"
        TARGET_FILE="${SOURCE_DIR}/${CLEAN_LINK}.md"
    # Wenn Link mit / beginnt, ist er absolut (aber ohne de/en)
    elif [[ "$CLEAN_LINK" =~ ^/ ]]; then
        CLEAN_LINK="${CLEAN_LINK#/}"
        # Bestimme Sprache aus Quelldatei
        if [[ "$SOURCE_FILE" =~ ^de/ ]]; then
            TARGET_FILE="de/${CLEAN_LINK}.md"
        elif [[ "$SOURCE_FILE" =~ ^en/ ]]; then
            TARGET_FILE="en/${CLEAN_LINK}.md"
        else
            echo "  ⚠️  Kann Sprache nicht bestimmen: $SOURCE_FILE"
            continue
        fi
    else
        # Relativ ohne ./
        TARGET_FILE="${SOURCE_DIR}/${CLEAN_LINK}.md"
    fi
    
    # Bereinige Pfad (entferne ..)
    TARGET_FILE=$(echo "$TARGET_FILE" | sed 's|/\./|/|g')
    
    # Prüfe ob Datei existiert
    if [ -f "$TARGET_FILE" ]; then
        ((SKIPPED_COUNT++))
        continue
    fi
    
    # Erstelle Verzeichnis
    TARGET_DIR=$(dirname "$TARGET_FILE")
    mkdir -p "$TARGET_DIR"
    
    # Bestimme Sprache und Texte
    if [[ $TARGET_FILE == de/* ]]; then
        LANG="de"
        WARNING_TITLE="Seite im Aufbau"
        WARNING_TEXT="Diese Seite befindet sich noch im Aufbau. Die Dokumentation wird schrittweise ergänzt."
        STATUS_TEXT="**Status:** In Vorbereitung"
    elif [[ $TARGET_FILE == en/* ]]; then
        LANG="en"
        WARNING_TITLE="Page Under Construction"
        WARNING_TEXT="This page is currently under construction. Documentation will be added progressively."
        STATUS_TEXT="**Status:** In preparation"
    else
        echo "  ⚠️  Unbekannte Sprache: $TARGET_FILE"
        continue
    fi
    
    # Generiere Titel
    FILENAME=$(basename "$TARGET_FILE" .md)
    case "$FILENAME" in
        "index")
            DIRNAME=$(basename "$TARGET_DIR")
            TITLE=$(echo "$DIRNAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')
            ;;
        *)
            TITLE=$(echo "$FILENAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')
            ;;
    esac
    
    # Erstelle Platzhalter
    cat > "$TARGET_FILE" << EOFPAGE
# $TITLE

::: warning $WARNING_TITLE
$WARNING_TEXT
:::

$STATUS_TEXT
EOFPAGE
    
    echo "  ✅ Erstellt: $TARGET_FILE"
    ((CREATED_COUNT++))
    
done <<< "$DEAD_LINKS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Zusammenfassung:"
echo "  ✅ Erstellt: $CREATED_COUNT Dateien"
echo "  ℹ️  Übersprungen: $SKIPPED_COUNT (existieren bereits)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $CREATED_COUNT -gt 0 ]; then
    echo ""
    echo "🧪 Teste Build erneut..."
    
    if npm run docs:build 2>&1 | grep -q "dead link"; then
        echo "⚠️  Es gibt noch weitere Dead Links - Script nochmal ausführen!"
        exit 1
    else
        echo "🎉 Erfolg! Keine Dead Links mehr!"
    fi
fi

