#!/bin/bash
# p2d2-docs: Interaktives Kopieren der englischen Entwicklungshandbuch-Dateien
# Von: Inkonsistentes Archiv (/tmp/hb/entw-hb-old/)
# Nach: Konsistente VitePress-Struktur (/rep/projects/websites/p2d2-docs/)

set -e

# Pfade
ARCHIVE_BASE="/tmp/src-txt/output"
TARGET_BASE="/rep/projects/websites/p2d2-docs"


cp "$ARCHIVE_BASE/en/entwicklerhandbuch/index.md" "$TARGET_BASE/en/entwicklungshandbuch/index.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/architecture/data-flow.md" "$TARGET_BASE/en/entwicklungshandbuch/architektur/datenfluss.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/architecture/project-structure.md" "$TARGET_BASE/en/entwicklungshandbuch/architektur/projektstruktur.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/architecture/system-overview.md" "$TARGET_BASE/en/entwicklungshandbuch/architektur/systemueberblick.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/architecture/technology-stack.md" "$TARGET_BASE/en/entwicklungshandbuch/architektur/technologie-stack.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/maps/layer-management.md" "$TARGET_BASE/en/entwicklungshandbuch/module/karten/layer-management.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/maps/map-config.md" "$TARGET_BASE/en/entwicklungshandbuch/module/karten/map-config.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/maps/openlayers-integration.md" "$TARGET_BASE/en/entwicklungshandbuch/module/karten/openlayers-integration.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/maps/wms-wmts-services.md" "$TARGET_BASE/en/entwicklungshandbuch/module/karten/wms-wmts-services.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/feature-editor/draw-manager.md" "$TARGET_BASE/en/entwicklungshandbuch/module/feature-editor/draw-manager.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/feature-editor/edit-mode.md" "$TARGET_BASE/en/entwicklungshandbuch/module/feature-editor/edit-mode.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/feature-editor/editor-overview.md" "$TARGET_BASE/en/entwicklungshandbuch/module/feature-editor/editor-overview.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/feature-editor/feature-sync.md" "$TARGET_BASE/en/entwicklungshandbuch/module/feature-editor/feature-sync.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/feature-editor/osm-integration.md" "$TARGET_BASE/en/entwicklungshandbuch/module/feature-editor/osm-integration.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/municipalities/content-collections.md" "$TARGET_BASE/en/entwicklungshandbuch/module/kommunen/content-collections.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/municipalities/data-structure.md" "$TARGET_BASE/en/entwicklungshandbuch/module/kommunen/datenstruktur.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/municipalities/routing.md" "$TARGET_BASE/en/entwicklungshandbuch/module/kommunen/routing.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/ui-components/astro-components.md" "$TARGET_BASE/en/entwicklungshandbuch/module/ui-komponenten/astro-components.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/ui-components/responsive-design.md" "$TARGET_BASE/en/entwicklungshandbuch/module/ui-komponenten/responsive-design.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/ui-components/tailwind-styling.md" "$TARGET_BASE/en/entwicklungshandbuch/module/ui-komponenten/tailwind-styling.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/utilities/coordinate-utils.md" "$TARGET_BASE/en/entwicklungshandbuch/module/utilities/coordinate-utils.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/utilities/layer-interaction.md" "$TARGET_BASE/en/entwicklungshandbuch/module/utilities/layer-interaction.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/module/utilities/storage-management.md" "$TARGET_BASE/en/entwicklungshandbuch/module/utilities/storage-management.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/development-workflow/code-style.md" "$TARGET_BASE/en/entwicklungshandbuch/entwicklungsworkflow/code-style.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/development-workflow/debugging.md" "$TARGET_BASE/en/entwicklungshandbuch/entwicklungsworkflow/debugging.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/development-workflow/git-workflow.md" "$TARGET_BASE/en/entwicklungshandbuch/entwicklungsworkflow/git-workflow.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/development-workflow/local-setup.md" "$TARGET_BASE/en/entwicklungshandbuch/entwicklungsworkflow/setup-lokal.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/development-workflow/testing.md" "$TARGET_BASE/en/entwicklungshandbuch/entwicklungsworkflow/testing.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/deployment/caddy-proxy.md" "$TARGET_BASE/en/entwicklungshandbuch/deployment/caddy-proxy.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/deployment/multi-branch-system.md" "$TARGET_BASE/en/entwicklungshandbuch/deployment/multi-branch-system.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/deployment/systemd-services.md" "$TARGET_BASE/en/entwicklungshandbuch/deployment/systemd-services.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/deployment/webhook-automation.md" "$TARGET_BASE/en/entwicklungshandbuch/deployment/webhook-automation.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/data-management/data-synchronization.md" "$TARGET_BASE/en/entwicklungshandbuch/datenverwaltung/daten-synchronisation.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/data-management/geodata-sources.md" "$TARGET_BASE/en/entwicklungshandbuch/datenverwaltung/geodaten-quellen.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/data-management/municipalities-collection.md" "$TARGET_BASE/en/entwicklungshandbuch/datenverwaltung/kommunen-collection.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/api-reference/astro-endpoints.md" "$TARGET_BASE/en/entwicklungshandbuch/api-referenz/astro-endpoints.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/api-reference/config-options.md" "$TARGET_BASE/en/entwicklungshandbuch/api-referenz/config-optionen.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/api-reference/typescript-modules.md" "$TARGET_BASE/en/entwicklungshandbuch/api-referenz/typescript-modules.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/contrib/code-review-guide.md" "$TARGET_BASE/en/entwicklungshandbuch/contrib/code-review-guide.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/contrib/contributing.md" "$TARGET_BASE/en/entwicklungshandbuch/contrib/contributing.md"
cp "$ARCHIVE_BASE/en/entwicklerhandbuch/contrib/merge-policy.md" "$TARGET_BASE/en/entwicklungshandbuch/contrib/merge-policy.md"

