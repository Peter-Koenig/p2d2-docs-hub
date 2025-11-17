---
title: "Documentation Quality Overview"
description: "Overview of quality metrics for all p2d2 documentation pages"
layout: doc
---

<script setup>
import { data as documents } from './quality-overview.data.ts'
import QualityOverview from '../.vitepress/theme/components/QualityOverview.vue'
</script>

# Documentation Quality Overview

This page provides an overview of the quality metrics for all p2d2 documentation. The Quality Tracking System helps continuously improve documentation quality and provides transparency about the current state.

<QualityOverview :documents="documents" />

## About the Quality System

The p2d2 Quality Tracking System tracks the following metrics:

- **Completeness**: How complete is the documentation? Does it cover all relevant topics?
- **Accuracy**: How correct and up-to-date is the information?
- **Review Status**: Has the documentation been reviewed by an expert?

### Quality Levels

| Level | Score | Description |
|-------|-------|-------------|
| ✅ Excellent | 80-100% | Complete, reviewed, and current documentation |
| 🔵 Good | 60-79% | Good coverage, minor gaps possible |
| 🟡 Fair | 40-59% | Basic documentation present, room for improvement |
| 🔴 Needs Improvement | 0-39% | Incomplete or outdated documentation |

## Quality Status in Documents

In each documentation page, the current quality status is automatically displayed when quality metrics are present in the frontmatter.

The status shows:
- **Completeness**: How complete the documentation is
- **Accuracy**: How current and correct the information is  
- **Review Status**: Whether the documentation has been reviewed

### Example

A document with these metrics:
- Completeness: 85%
- Accuracy: 90%
- Review Status: Reviewed

would be rated as "Excellent (88%)".

## How to Use the Quality System

### For Documentation Authors

1. **Create new documents**: Add the quality frontmatter to every new Markdown file
2. **Update metrics**: Adjust values when you improve the documentation
3. **Request review**: Set `reviewed: true` and add reviewer name and date

### For Reviewers

1. **Review documents**: Read the documentation for completeness, correctness, and currency
2. **Assess metrics**: Provide realistic quality metric assessments
3. **Document review**: Add yourself as reviewer and set the review date

## More Information

For more details about the quality system, see [QUALITY_SYSTEM.md](/QUALITY_SYSTEM.html).
