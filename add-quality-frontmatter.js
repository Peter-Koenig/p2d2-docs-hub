import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Quality frontmatter schema
const QUALITY_FRONTMATTER = {
  quality: {
    completeness: 50, // Initial for migrated docs
    accuracy: 70, // Initial estimation
    reviewed: false,
    reviewer: null,
    reviewDate: null,
  },
};

// Directories to process
const DIRECTORIES = ["de", "en"];

// Function to parse and update frontmatter
function updateFrontmatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check if file already has frontmatter
    if (!content.startsWith("---")) {
      console.log(
        `⚠️  No frontmatter found in ${filePath}, adding new frontmatter`,
      );

      const newContent = `---
${formatYaml(QUALITY_FRONTMATTER)}
---

${content}`;

      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`✅ Added quality frontmatter to ${filePath}`);
      return;
    }

    // Extract existing frontmatter
    const frontmatterEnd = content.indexOf("---", 3);
    if (frontmatterEnd === -1) {
      console.log(`❌ Invalid frontmatter in ${filePath}, skipping`);
      return;
    }

    const frontmatterContent = content.substring(3, frontmatterEnd).trim();
    const bodyContent = content.substring(frontmatterEnd + 3).trim();

    try {
      // Parse existing frontmatter
      const existingFrontmatter = parseYaml(frontmatterContent);

      // Check if quality section already exists
      if (existingFrontmatter.quality) {
        console.log(
          `ℹ️  Quality frontmatter already exists in ${filePath}, skipping`,
        );
        return;
      }

      // Merge quality section
      const updatedFrontmatter = {
        ...existingFrontmatter,
        ...QUALITY_FRONTMATTER,
      };

      // Write updated content
      const newContent = `---
${formatYaml(updatedFrontmatter)}
---

${bodyContent}`;

      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`✅ Updated quality frontmatter in ${filePath}`);
    } catch (parseError) {
      console.log(
        `❌ Error parsing frontmatter in ${filePath}: ${parseError.message}`,
      );
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

// Simple YAML parser for frontmatter
function parseYaml(yamlString) {
  const lines = yamlString.split("\n");
  const result = {};
  let currentKey = null;
  let currentValue = "";

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }

    // Check for key-value pair
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex !== -1) {
      // Save previous key-value pair
      if (currentKey) {
        result[currentKey] = parseValue(currentValue.trim());
      }

      // Start new key-value pair
      currentKey = trimmedLine.substring(0, colonIndex).trim();
      currentValue = trimmedLine.substring(colonIndex + 1).trim();
    } else if (currentKey) {
      // Continue multi-line value
      currentValue += "\n" + trimmedLine;
    }
  }

  // Save the last key-value pair
  if (currentKey) {
    result[currentKey] = parseValue(currentValue.trim());
  }

  return result;
}

// Parse YAML values (basic types)
function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;

  // Check for number
  if (!isNaN(value) && value.trim() !== "") {
    return Number(value);
  }

  // Remove quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.substring(1, value.length - 1);
  }

  return value;
}

// Format object as YAML
function formatYaml(obj, indent = 0) {
  const lines = [];
  const spaces = " ".repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${spaces}${key}: null`);
    } else if (typeof value === "boolean") {
      lines.push(`${spaces}${key}: ${value}`);
    } else if (typeof value === "number") {
      lines.push(`${spaces}${key}: ${value}`);
    } else if (typeof value === "string") {
      // Check if string needs quotes
      if (value.includes(":") || value.includes("\n") || value.includes('"')) {
        lines.push(`${spaces}${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${spaces}${key}: ${value}`);
      }
    } else if (Array.isArray(value)) {
      lines.push(`${spaces}${key}:`);
      value.forEach((item) => {
        lines.push(`${spaces}  - ${item}`);
      });
    } else if (typeof value === "object") {
      lines.push(`${spaces}${key}:`);
      lines.push(formatYaml(value, indent + 2));
    }
  }

  return lines.join("\n");
}

// Find all markdown files recursively
function findMarkdownFiles(dir) {
  const files = [];

  function walkDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else if (item.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  walkDirectory(dir);
  return files;
}

// Main function
function main() {
  console.log("🚀 Starting quality frontmatter migration...\n");

  let totalProcessed = 0;
  let totalUpdated = 0;

  for (const dir of DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory ${dir} not found, skipping`);
      continue;
    }

    console.log(`📁 Processing ${dir}/ directory...`);
    const files = findMarkdownFiles(dir);

    for (const file of files) {
      updateFrontmatter(file);
      totalProcessed++;
    }

    console.log(`✅ Processed ${files.length} files in ${dir}/\n`);
  }

  console.log("🎉 Migration completed!");
  console.log(`📊 Total files processed: ${totalProcessed}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateFrontmatter, findMarkdownFiles, QUALITY_FRONTMATTER };
