---
title: p2d2 als CIVITAS/CORE-V1-AddOn – Installation, Upgrade und Rückbau
description: Ziel-Lifecycle des p2d2-V1-AddOns – Preflight, Installation, Verifikation, Upgrade und Rückbau – sowie Abgrenzung zu Basisplattform und nachgelagerter Spezifikation
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# Installation, Upgrade und Rückbau

Diese Seite definiert den Ziel-Lifecycle des p2d2-AddOns auf einer kompatiblen CIVITAS/CORE-V1-Plattform. Sie legt die Phasen und Abnahmekriterien fest, beschreibt die Abgrenzung zur Basisplattform und markiert alle konkreten Implementierungsdetails als nachgelagerte Spezifikation.

## Ziel-Lifecycle

Der spätere AddOn-Betrieb folgt verbindlich diesem Lifecycle:

```text
Preflight → Installation → Verifikation → Upgrade → Rückbau
```

Jede Phase ist addon-spezifisch, idempotent und nachvollziehbar auszuführen.

## Preflight

Vor einer Installation stellt der [Preflight](./voraussetzungen-und-kompatibilitaet) fest, ob die vorhandene CIVITAS/CORE-V1-Plattform addon-kompatibel ist und ob die Zielumgebung die Voraussetzungen erfüllt. Ohne bestandenen Preflight wird keine Installation durchgeführt. Der Preflight verändert keine bestehenden Ressourcen.

## Installation

Die Installation ergänzt ausschließlich p2d2-eigene Ressourcen auf der kompatiblen Basisplattform. Dabei gilt:

- Das AddOn **provisioniert keine neue CIVITAS/CORE-Basisplattform**.
- Das AddOn **führt nicht erneut das generische V1-Build-Skript aus**.
- Änderungen erfolgen **nur für p2d2-eigene Ressourcen**; bestehende CIVITAS-Masterportal-Instanzen, GeoServer-Workspaces, Daten, Rollen, Routen und Images werden nicht implizit verändert oder ersetzt.

## Verifikation

Nach der Installation und nach jedem Upgrade wird der Zielzustand geprüft. Die Abnahme muss später mindestens folgende Punkte umfassen:

- Deployment-Status der p2d2-eigenen Bausteine,
- Routing und Erreichbarkeit der AddOn-Ressourcen,
- Login/OIDC und Rollenabbildung,
- Masterportal-Auslieferung der p2d2-Instanz,
- Verfügbarkeit der Geo-Dienste,
- Datenbankerreichbarkeit der p2d2-spezifischen PostgreSQL/PostGIS-Strukturen.

Der Umfang der Verifikation wird in der nachgelagerten Spezifikation präzisiert.

## Upgrade

Upgrades erfolgen später ausschließlich über klar versionierte, gepinnte AddOn-Artefakte. Ein Upgrade ist wie eine Installation zu verifizieren und darf keine nicht dokumentierten Änderungen an bestehenden Ressourcen vornehmen.

## Rückbau

Der Rückbau löscht ausschließlich p2d2-eigene Ressourcen. Bestehende CIVITAS-Ressourcen bleiben unverändert. Der Rückbaupfad wird vor der Installation festgelegt und im Preflight dokumentiert. Er ersetzt keine Backup- oder Wiederherstellungsverfahren der Basisplattform.

## Abgrenzung

Diese Spezifikation legt ausschließlich Phasen, Regeln und Abnahmekriterien fest. **Keine konkreten Befehle, Helm-Charts, Deployments, Container-Images oder Versionsnummern** werden hier definiert. Alle konkreten Implementierungsdetails sind als **nachgelagerte Spezifikation** zu erstellen, nachdem die offenen Architekturentscheidungen (siehe [Zielbild und Abgrenzung](./zielbild-und-abgrenzung)) geklärt sind.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Standalone-Prinzip, eigene Bausteine und offene Architekturentscheidungen
- [Voraussetzungen und Kompatibilität](./voraussetzungen-und-kompatibilitaet) – Kategorien des späteren AddOn-Preflights