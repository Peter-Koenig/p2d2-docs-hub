#!/bin/bash
# fix-i18n-urls.sh - Konsistente URL-Struktur

# cd /var/www/vitepress

# Englische Verzeichnisse umbenennen (deutsche Namen behalten)
mv en/development-strategy en/entwicklungsstrategie
mv en/entwicklungsstrategie/scaling en/entwicklungsstrategie/skalierung

# Dateien umbenennen (deutsche Namen)
cd en/entwicklungsstrategie
mv opensource-philosophy.md opensource-philosophie.md

cd skalierung
mv categories.md kategorien.md
mv municipalities.md kommunen.md
mv federal-states.md bundeslaender.md

cd /var/www/vitepress

echo "✅ URLs konsistent gemacht"

