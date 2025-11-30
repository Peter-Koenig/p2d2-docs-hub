---
title: Contributing
description: "Guidelines for contributing to the p2d2 project: Git workflow, code standards, review process"
status: migrated
lastUpdated: 2025-11-17
lang: en
quality:
  completeness: 50
  accuracy: 30
  reviewed: false
  reviewer: 'KI (Gemini)'
  reviewDate: null
---

# Contributing to **p2d2**

Thank you for your interest in contributing to **p2d2 – Public-Public Data-DNA** 🚀
This document summarizes the relevant guidelines from the [`.github`](.github) folder.

---

## 🙌 Guiding Principle: Public-Public Data-DNA

We work according to the guiding principle that **public administrations and civil society**
collaborate **at eye level**, exchanging data **openly, linked, and transparently**
between both spheres.
**Your contribution brings this into practice!**

---

## 🚀 Branching and Development Flow

- **Feature Branches:**
  Please create your branches according to the scheme
  `feature/team-<teamname>/<feature-name>`
- **Bugfixes:** `bugfix/<description>`
- **Main Flow:**
```
feature → develop → release → main
```
- **Deployments:**
- `develop` → dev.data-dna.eu (planned)
- `main` → www.data-dna.eu (Production)

👉 See also [MERGE_POLICY.md](.github/MERGE_POLICY.md)

---

## 🔍 Code Reviews

- All changes require a **Pull Request Review**
- Focus on **clarity, robustness, tests, and security**
- At least 1 reviewer necessary, possibly Code Owner Review
- Use **constructive communication** (see [CODE_REVIEW_GUIDE.md](.github/CODE_REVIEW_GUIDE.md))

---

## 🛠️ Style & Quality

- Adhere to project conventions (Astro, Vue, Tailwind, OpenLayers code patterns)
- Meaningful commits (`feat:`, `fix:`, `docs:`, …)
- Write tests & ensure existing tests pass
- Update documentation where changes are visible

Checklists can be found in:
- [DEPLOYMENT_RULES.md](.github/DEPLOYMENT_RULES.md)
- [CODE_REVIEW_GUIDE.md](.github/CODE_REVIEW_GUIDE.md)

---

## 🐛 Issues & Feature Requests

- Check the existing [Issue Tracker](https://gitlab.opencode.de/OC000028072444/p2d2/-/issues) first
- Report **clear steps to reproduce** for bugs
- Discuss feature ideas early with the team

---

## 💡 How You Can Contribute

- Contribute code (features, bugfixes)
- Collect, check, or visualize open data
- Bring in ideas for synchronization between OSM & administration
- Support tests & QA
- Translate or improve documentation

---

## 📖 License & Rights

Contributions are – like the entire project – under the
**GNU GPLv3**.
By contributing, you agree that your changes will be published under the same license.

---

## 🤝 Thank You!

Every contribution – small or large – strengthens the project.
Bring your knowledge and help develop a **public digital common good**. 💚

> **Note:** This text was translated automatically with AI assistance and has not yet been reviewed by a human.