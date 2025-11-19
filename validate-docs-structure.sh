#!/bin/bash

# validate-docs-structure.sh
# Validates that all Sidebar links in .vitepress/config.ts point to existing files

SOURCE_BASE="/rep/projects/websites/p2d2-docs"
CONFIG_FILE="$SOURCE_BASE/.vitepress/config.ts"
ERRORS=0

echo "🔍 Validating VitePress documentation structure..."
echo "Config file: $CONFIG_FILE"
echo ""

# Function to check if a file exists
check_file_exists() {
    local link_path="$1"
    local language="$2"

    # Convert sidebar link to file path
    local file_path="$SOURCE_BASE/$language${link_path#/de}"
    if [[ "$link_path" == */ ]]; then
        file_path="${file_path}index.md"
    else
        file_path="${file_path}.md"
    fi

    if [[ -f "$file_path" ]]; then
        echo "✅ OK: $language${link_path#/de} (File: $(basename "$file_path"))"
        return 0
    else
        echo "❌ MISSING: $language${link_path#/de} (File: $(basename "$file_path"))"
        return 1
    fi
}

# Extract all sidebar links from config.ts for German
echo "📖 Checking German documentation links..."
GERMAN_LINKS=$(grep -o 'link: "/de/entwicklungshandbuch/[^"]*"' "$CONFIG_FILE" | sed 's/link: "//' | sed 's/"//' | sort -u)

for link in $GERMAN_LINKS; do
    if ! check_file_exists "$link" "de"; then
        ((ERRORS++))
    fi
done

echo ""

# Extract all sidebar links from config.ts for English
echo "📖 Checking English documentation links..."
ENGLISH_LINKS=$(grep -o 'link: "/en/entwicklungshandbuch/[^"]*"' "$CONFIG_FILE" | sed 's/link: "//' | sed 's/"//' | sort -u)

for link in $ENGLISH_LINKS; do
    if ! check_file_exists "$link" "en"; then
        ((ERRORS++))
    fi
done

echo ""
echo "📊 Validation Summary:"
echo "======================"
echo "German links checked: $(echo "$GERMAN_LINKS" | wc -l)"
echo "English links checked: $(echo "$ENGLISH_LINKS" | wc -l)"
echo "Total errors: $ERRORS"

if [[ $ERRORS -eq 0 ]]; then
    echo "🎉 All sidebar links are valid!"
    exit 0
else
    echo "💥 Found $ERRORS missing files!"
    exit $ERRORS
fi
