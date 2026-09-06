---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Repository-Struktur und Aktivierung"
description: Geplante Git-Repository-Struktur des p2d2-AddOns (v1 aktiv, v2 als Platzhalter) und Aktivierung für CIVITAS/CORE V1 per Symlink in den addons-Ordner
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# Repository-Struktur und Aktivierung

Diese Seite legt die geplante Git-Repository-Struktur für das p2d2-AddOn auf CIVITAS/CORE fest (Arbeitsname `p2d2-civitas-addon`) und beschreibt, wie das AddOn für CIVITAS/CORE V1 aktiviert wird.

## Zweck

Das AddOn soll in **einem** Repository die CIVITAS/CORE-V1-Variante (jetzt aktiv) und die CIVITAS/CORE-V2-Variante (Platzhalter) als gleichrangige Unterordner `v1/` und `v2/` zusammenführen.

Das Repository (Arbeitsname `p2d2-civitas-addon`) ist bereits als leeres Skelett mit den Branchen `main` und `develop` angelegt. Die nachfolgend beschriebene Zielstruktur ist die geplante Struktur und wird vor Beginn einer Implementierung erstellt. Eine Implementierung nach dieser Spezifikation beginnt erst, nachdem diese Zielstruktur angelegt ist.

## Repository-Layout

```text
p2d2-civitas-addon/
├─ README.md                 # erklaert Parallelitaet V1 (aktiv) / V2 (Platzhalter)
├─ LICENSE
├─ v1/
│  ├─ tasks/
│  │  └─ p2d2.yml            # Haupt-Include, ruft Teilmodule je Baustein
│  ├─ vars/
│  │  ├─ default.yml
│  │  └─ software_references.yml
│  ├─ default_inventory.yml
│  ├─ tasks.yml              # Entry-Point, wird in inv_addons.addons referenziert
│  ├─ LICENSE                # von V1 als Root-Pflichtdatei verlangt
│  └─ README.md              # von V1 als Root-Pflichtdatei verlangt
└─ v2/                       # Platzhalter, keine Implementierung vor Klaerung der V2-Aktivierung
   ├─ civitas-component.yaml
   ├─ charts.yaml
   ├─ images.yaml
   ├─ default-environment.yaml.gotmpl
   ├─ helmfile.yaml.gotmpl
   ├─ values/
   ├─ databases.yaml
   └─ secrets.yaml
```

## Warum `v1/LICENSE` und `v1/README.md` zusätzlich nötig sind

CIVITAS/CORE V1 erwartet ein AddOn-Repository, dessen **Root** die Dateien `tasks.yml`, `default_inventory.yml`, `vars/`, `tasks/`, `LICENSE` und `README.md` enthält (siehe `docs/Development/06-Addons.md`). Da die V1-Aktivierung per Symlink auf den **Unterordner `v1/`** erfolgt (siehe unten), wird `v1/` zum effektiven AddOn-Root. Deshalb müssen `LICENSE` und `README.md` zusätzlich zu den Top-Level-Dateien auch in `v1/` liegen, damit der eingebundene Ordner wie ein vollständiges, eigenständiges V1-AddOn-Repository aussieht.

**Empfehlung zur Ausgestaltung (keine Implementierung):**

- `v1/README.md` sollte eine kurze, eigenständige Datei sein, die das V1-AddOn beschreibt und auf das Top-Level-`README.md` (V1/V2-Parallelität) verweist. Ein Symlink `v1/README.md -> ../README.md` ist möglich, bricht aber, sobald der `v1/`-Ordner statt per Symlink per **Kopie** in den `addons`-Ordner übernommen wird, und würde V1-/V2-übergreifende Inhalte in das V1-AddOn-Root mischen.
- `v1/LICENSE` sollte eine echte Kopie der Lizenz sein (kein Symlink), damit das V1-AddOn-Root in jedem Aktivierungsweg (Symlink oder Kopie) eine gültige Lizenz enthält.

## Aktivierungsmechanismus für CIVITAS/CORE V1

Die Aktivierung erfolgt **nicht** per Git-Submodul auf den Repository-Root, sondern per **Symlink auf den `v1/`-Unterordner**. Das ist durch die offizielle CIVITAS/CORE-V1-Dokumentation gedeckt:

> „To activate addons, clone the addon repository into the `addons` folder. Alternatively, you may copy or link the files into the addons folder." — `docs/Deployment/05-Customize-Inventory.md`

```bash
git clone <p2d2-civitas-addon-repo> /opt/p2d2-civitas-addon
ln -s /opt/p2d2-civitas-addon/v1 /opt/civitas-core-v1/core_platform/addons/p2d2
```

Der Symlink erzeugt `core_platform/addons/p2d2`, das auf `v1/` zeigt. Anschließend wird das AddOn im Inventory aktiviert:

```yaml
inv_addons:
  import: true
  addons:
    - "addons/p2d2/tasks.yml"
```

Der Eintrag `addons/p2d2/tasks.yml` verweist damit über den Symlink auf `v1/tasks.yml`, den V1-Entry-Point des AddOns.

## Status des V2-Platzhalters

`v2/` enthält ausschließlich die oben gezeigte Platzhalter-Struktur und **keine** Implementierung.

Für CIVITAS/CORE V2 ist in `docs_v2/Deployment/12-addons.md` derzeit nur der Aktivierungsweg per Git-Submodul nach `deployment/addons/` belegt. **Offen ist, ob für V2 ebenfalls die Copy-/Link-Alternative zulässig ist.** Diese Frage ist vor einer V2-Implementierung zu klären und ist kein Blocker für die V1-Umsetzung.

## Abgrenzung

Diese Spezifikation legt ausschließlich die Repository-Struktur und den V1-Aktivierungsmechanismus fest. **Keine konkreten Ansible-Tasks, Helm-Charts, Container-Images oder Versionsnummern** werden hier definiert. Alle konkreten Implementierungsdetails sind als nachgelagerte Spezifikation zu erstellen, nachdem die offenen Architekturentscheidungen (siehe [Zielbild und Abgrenzung](./zielbild-und-abgrenzung)) geklärt sind.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Standalone-Prinzip, eigene Bausteine und offene Architekturentscheidungen
- [Voraussetzungen und Kompatibilität](./voraussetzungen-und-kompatibilitaet) – Kategorien des späteren AddOn-Preflights
- [Installation, Upgrade und Rückbau](./installation-upgrade-und-rueckbau) – Ziel-Lifecycle und Abnahmekriterien

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-06 | Erste Fassung: geplante Repository-Struktur und V1-Aktivierung dokumentiert. |
