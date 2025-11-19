#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontmatter-Templates
const germanTemplate = `---
title: [MODUL-TITEL]
description: [KURZE BESCHREIBUNG]
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# [MODUL-TITEL]

> **Status:** 🚧 Dokumentation in Arbeit

## Übersicht

[Platzhalter für Modulbeschreibung]

## Funktionalität

[Platzhalter für technische Details]

## Verwendung

[Platzhalter für Code-Beispiele]

## Konfiguration

[Platzhalter für Konfigurationsoptionen]

## Abhängigkeiten

[Platzhalter für Module/Libraries]
`;

const englishTemplate = `---
title: [MODULE-TITLE]
description: [SHORT DESCRIPTION]
quality:
  completeness: 0
  accuracy: 0
  reviewed: false
  reviewer: null
  reviewDate: null
---

# [MODULE-TITLE]

> **Status:** 🚧 Documentation in progress

## Overview

[Placeholder for module description]

## Functionality

[Placeholder for technical details]

## Usage

[Placeholder for code examples]

## Configuration

[Placeholder for configuration options]

## Dependencies

[Placeholder for modules/libraries]
`;

// Check if file already has quality frontmatter
function hasQualityFrontmatter(content) {
  return (
    content.includes("quality:") &&
    content.includes("completeness:") &&
    content.includes("accuracy:") &&
    content.match(/^---[\s\S]*?---/m)
  );
}

// Process a single markdown file
function processMarkdownFile(filePath, isGerman) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    // Read current content
    const currentContent = fs.readFileSync(filePath, "utf8");

    // Skip if already has quality frontmatter
    if (hasQualityFrontmatter(currentContent)) {
      console.log(`✓ Skipping ${filePath} - already has quality frontmatter`);
      return;
    }

    // Skip if file has substantial content (more than 100 characters)
    if (currentContent.trim().length > 100) {
      console.log(
        `⚠ Skipping ${filePath} - has existing content (${currentContent.trim().length} chars)`,
      );
      return;
    }

    // Extract file info for title
    const fileName = path.basename(filePath, ".md");
    const dirName = path.basename(path.dirname(filePath));

    // Generate title from filename
    const title = fileName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Generate description
    const description = isGerman
      ? `Dokumentation für ${title}`
      : `Documentation for ${title}`;

    // Select template
    const template = isGerman ? germanTemplate : englishTemplate;

    // Process template with correct replacements (including brackets)
    const processedContent = template
      .replace(/\[MODUL-TITEL\]/g, title)
      .replace(/\[MODULE-TITLE\]/g, title)
      .replace(/\[KURZE BESCHREIBUNG\]/g, description)
      .replace(/\[SHORT DESCRIPTION\]/g, description);

    // Write processed content
    fs.writeFileSync(filePath, processedContent, "utf8");
    console.log(`✓ Processed: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

// Recursively find and process markdown files
function processDirectory(dir, isGerman) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        processDirectory(fullPath, isGerman);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        processMarkdownFile(fullPath, isGerman);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

// Main execution
function main() {
  console.log("🚀 Adding frontmatter to p2d2 developer handbook files...\n");

  const baseDir = process.cwd();

  // Process German documentation
  const germanDir = path.join(baseDir, "de", "entwicklungshandbuch");
  if (fs.existsSync(germanDir)) {
    console.log("📁 Processing German documentation...");
    processDirectory(germanDir, true);
  } else {
    console.log("⚠ German directory not found:", germanDir);
  }

  // Process English documentation
  const englishDir = path.join(baseDir, "en", "entwicklungshandbuch");
  if (fs.existsSync(englishDir)) {
    console.log("\n📁 Processing English documentation...");
    processDirectory(englishDir, false);
  } else {
    console.log("⚠ English directory not found:", englishDir);
  }

  console.log("\n✅ Frontmatter processing complete!");
}

main();
