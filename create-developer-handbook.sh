#!/bin/bash

# p2d2 Developer Handbook Directory Structure Creation Script
# This script creates the complete bilingual directory structure for the p2d2 developer handbook

echo "Creating p2d2 Developer Handbook directory structure..."

# Entwicklerhandbuch - Deutsch
mkdir -p de/entwicklerhandbuch

# Architektur
mkdir -p de/entwicklerhandbuch/architektur
touch de/entwicklerhandbuch/architektur/systemueberblick.md
touch de/entwicklerhandbuch/architektur/technologie-stack.md
touch de/entwicklerhandbuch/architektur/projektstruktur.md
touch de/entwicklerhandbuch/architektur/datenfluss.md

# Module - Karten
mkdir -p de/entwicklerhandbuch/module/karten
touch de/entwicklerhandbuch/module/karten/map-config.md
touch de/entwicklerhandbuch/module/karten/layer-management.md
touch de/entwicklerhandbuch/module/karten/openlayers-integration.md
touch de/entwicklerhandbuch/module/karten/wms-wmts-services.md

# Module - Feature Editor
mkdir -p de/entwicklerhandbuch/module/feature-editor
touch de/entwicklerhandbuch/module/feature-editor/editor-overview.md
touch de/entwicklerhandbuch/module/feature-editor/draw-manager.md
touch de/entwicklerhandbuch/module/feature-editor/edit-mode.md
touch de/entwicklerhandbuch/module/feature-editor/feature-sync.md
touch de/entwicklerhandbuch/module/feature-editor/osm-integration.md

# Module - Kommunen
mkdir -p de/entwicklerhandbuch/module/kommunen
touch de/entwicklerhandbuch/module/kommunen/content-collections.md
touch de/entwicklerhandbuch/module/kommunen/datenstruktur.md
touch de/entwicklerhandbuch/module/kommunen/routing.md

# Module - UI-Komponenten
mkdir -p de/entwicklerhandbuch/module/ui-komponenten
touch de/entwicklerhandbuch/module/ui-komponenten/astro-components.md
touch de/entwicklerhandbuch/module/ui-komponenten/tailwind-styling.md
touch de/entwicklerhandbuch/module/ui-komponenten/responsive-design.md

# Module - Utilities
mkdir -p de/entwicklerhandbuch/module/utilities
touch de/entwicklerhandbuch/module/utilities/layer-interaction.md
touch de/entwicklerhandbuch/module/utilities/coordinate-utils.md
touch de/entwicklerhandbuch/module/utilities/storage-management.md

# Entwicklungsworkflow
mkdir -p de/entwicklerhandbuch/entwicklungsworkflow
touch de/entwicklerhandbuch/entwicklungsworkflow/setup-lokal.md
touch de/entwicklerhandbuch/entwicklungsworkflow/git-workflow.md
touch de/entwicklerhandbuch/entwicklungsworkflow/code-style.md
touch de/entwicklerhandbuch/entwicklungsworkflow/testing.md
touch de/entwicklerhandbuch/entwicklungsworkflow/debugging.md

# Deployment
mkdir -p de/entwicklerhandbuch/deployment
touch de/entwicklerhandbuch/deployment/multi-branch-system.md
touch de/entwicklerhandbuch/deployment/webhook-automation.md
touch de/entwicklerhandbuch/deployment/systemd-services.md
touch de/entwicklerhandbuch/deployment/caddy-proxy.md

# Datenverwaltung
mkdir -p de/entwicklerhandbuch/datenverwaltung
touch de/entwicklerhandbuch/datenverwaltung/kommunen-collection.md
touch de/entwicklerhandbuch/datenverwaltung/geodaten-quellen.md
touch de/entwicklerhandbuch/datenverwaltung/daten-synchronisation.md

# API-Referenz
mkdir -p de/entwicklerhandbuch/api-referenz
touch de/entwicklerhandbuch/api-referenz/typescript-modules.md
touch de/entwicklerhandbuch/api-referenz/astro-endpoints.md
touch de/entwicklerhandbuch/api-referenz/config-optionen.md

# Contrib
mkdir -p de/entwicklerhandbuch/contrib
touch de/entwicklerhandbuch/contrib/contributing.md
touch de/entwicklerhandbuch/contrib/code-review-guide.md
touch de/entwicklerhandbuch/contrib/merge-policy.md

# Index-Datei
touch de/entwicklerhandbuch/index.md

# === ENGLISCHE VERSION (identische Struktur) ===

# Developer Handbook - English
mkdir -p en/entwicklerhandbuch

# Architecture
mkdir -p en/entwicklerhandbuch/architecture
touch en/entwicklerhandbuch/architecture/system-overview.md
touch en/entwicklerhandbuch/architecture/technology-stack.md
touch en/entwicklerhandbuch/architecture/project-structure.md
touch en/entwicklerhandbuch/architecture/data-flow.md

# Modules - Maps
mkdir -p en/entwicklerhandbuch/modules/maps
touch en/entwicklerhandbuch/modules/maps/map-config.md
touch en/entwicklerhandbuch/modules/maps/layer-management.md
touch en/entwicklerhandbuch/modules/maps/openlayers-integration.md
touch en/entwicklerhandbuch/modules/maps/wms-wmts-services.md

# Modules - Feature Editor
mkdir -p en/entwicklerhandbuch/modules/feature-editor
touch en/entwicklerhandbuch/modules/feature-editor/editor-overview.md
touch en/entwicklerhandbuch/modules/feature-editor/draw-manager.md
touch en/entwicklerhandbuch/modules/feature-editor/edit-mode.md
touch en/entwicklerhandbuch/modules/feature-editor/feature-sync.md
touch en/entwicklerhandbuch/modules/feature-editor/osm-integration.md

# Modules - Municipalities
mkdir -p en/entwicklerhandbuch/modules/municipalities
touch en/entwicklerhandbuch/modules/municipalities/content-collections.md
touch en/entwicklerhandbuch/modules/municipalities/data-structure.md
touch en/entwicklerhandbuch/modules/municipalities/routing.md

# Modules - UI Components
mkdir -p en/entwicklerhandbuch/modules/ui-components
touch en/entwicklerhandbuch/modules/ui-components/astro-components.md
touch en/entwicklerhandbuch/modules/ui-components/tailwind-styling.md
touch en/entwicklerhandbuch/modules/ui-components/responsive-design.md

# Modules - Utilities
mkdir -p en/entwicklerhandbuch/modules/utilities
touch en/entwicklerhandbuch/modules/utilities/layer-interaction.md
touch en/entwicklerhandbuch/modules/utilities/coordinate-utils.md
touch en/entwicklerhandbuch/modules/utilities/storage-management.md

# Development Workflow
mkdir -p en/entwicklerhandbuch/development-workflow
touch en/entwicklerhandbuch/development-workflow/local-setup.md
touch en/entwicklerhandbuch/development-workflow/git-workflow.md
touch en/entwicklerhandbuch/development-workflow/code-style.md
touch en/entwicklerhandbuch/development-workflow/testing.md
touch en/entwicklerhandbuch/development-workflow/debugging.md

# Deployment
mkdir -p en/entwicklerhandbuch/deployment
touch en/entwicklerhandbuch/deployment/multi-branch-system.md
touch en/entwicklerhandbuch/deployment/webhook-automation.md
touch en/entwicklerhandbuch/deployment/systemd-services.md
touch en/entwicklerhandbuch/deployment/caddy-proxy.md

# Data Management
mkdir -p en/entwicklerhandbuch/data-management
touch en/entwicklerhandbuch/data-management/municipalities-collection.md
touch en/entwicklerhandbuch/data-management/geodata-sources.md
touch en/entwicklerhandbuch/data-management/data-synchronization.md

# API Reference
mkdir -p en/entwicklerhandbuch/api-reference
touch en/entwicklerhandbuch/api-reference/typescript-modules.md
touch en/entwicklerhandbuch/api-reference/astro-endpoints.md
touch en/entwicklerhandbuch/api-reference/config-options.md

# Contrib
mkdir -p en/entwicklerhandbuch/contrib
touch en/entwicklerhandbuch/contrib/contributing.md
touch en/entwicklerhandbuch/contrib/code-review-guide.md
touch en/entwicklerhandbuch/contrib/merge-policy.md

# Index file
touch en/entwicklerhandbuch/index.md

echo "Verzeichnisstruktur erfolgreich erstellt!"
echo "Total files created:"
find de/entwicklerhandbuch en/entwicklerhandbuch -name "*.md" | wc -l
echo "Running from: $(pwd)"
