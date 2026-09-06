---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – PostgreSQL-Datenbank"
description: Konkretisierung der PostgreSQL-Bereitstellung des p2d2-AddOns als additiver preparedDatabases-Eintrag im bestehenden Zalando-central-db-Cluster
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# PostgreSQL-Datenbank

Diese Seite konkretisiert Phase 1 der Implementierungs-Roadmap und schließt die Architekturentscheidung „PostgreSQL" ab. Sie legt fest, wie p2d2 seine Datenbank auf einer kompatiblen CIVITAS/CORE-V1-Plattform erhält.

## Zweck

Die Seite dokumentiert die **bereits getroffene** PostgreSQL-Entscheidung: p2d2 bekommt keine eigene `PostgresCluster`-CR, sondern einen **additiven Eintrag** im bestehenden Zalando-`central-db`-Cluster. Sie ist die Grundlage für die spätere Implementierung (Schritt 2).

## Empirischer und quellcode-basierter Befund

- `central-db` ist ein einzelner Zalando-`postgresql`-CR (`acid.zalan.do/v1`), **nicht** Helm-verwaltet.
- Bestehende Komponenten werden über das Zalando-Feature `spec.preparedDatabases` abgebildet (Datenbank + automatische Owner/Reader/Writer-Rollen + Extensions, z. B. `postgis`).
- Die Patch-Semantik ist **additiv** (JSON Merge Patch, RFC 7386): Die CR wird per `kubernetes.core.k8s` mit `state: present` und Standard-`merge_type` angewendet; unbekannte Einträge der Live-CR bleiben erhalten.
- CIVITAS/CORE selbst nutzt bereits ein Erweiterungsmuster, das zusätzliche Datenbanken in denselben `central-db`-CR merged (gesteuert über eine Inventory-Liste analog zu `additionalDatabases`).

Hinweis: Die internen Pfade und Dateinamen werden hier bewusst nur generisch benannt; die konkrete Mechanik stammt aus der lokalen Referenzkopie des CIVITAS/CORE-V1-Installationscodes.

## Entscheidung

p2d2 übernimmt das bestehende `additional_databases`-Muster: ein **eigener Task + ein eigenes Template** (keine Änderung der Core-Dateien), der ausschließlich `preparedDatabases.p2d2` rendert und additiv in denselben `central-db`-CR merged.

## Technisches Vorgehen (Beschreibung, keine fertige Implementierung)

- `preparedDatabases.p2d2` mit:
  - `defaultUsers: true`
  - `extensions: {postgis: public}`
  - `schemas: {public: {defaultRoles: false}}`
- Anwendung per `kubernetes.core.k8s` mit `state: present`, **ohne** `force`/`replace` (Standard-Merge-Verhalten).

## Restrisiko

Die additive Sicherheit gilt **nur**, solange `kubernetes.core.k8s` mit Standard-`merge_type` (kein `force: true`, kein `merge_type: replace`) aufgerufen wird. Vor der Implementierung (Schritt 2) ist dies gegen die konkret installierte `kubernetes.core`-Collection-Version erneut zu prüfen.

## Abgrenzung

Diese Seite legt ausschließlich die **Datenbank-Bereitstellung** fest. Nicht Gegenstand sind Schema-Migration, Tabellen/Anwendungsschema und der detaillierte Rückbau (folgt in Schritt 3). Vermerk für später: Für den p2d2-Rückbau wird ein eigener, gezielter Task benötigt, der ausschließlich den `p2d2`-Eintrag wieder aus `preparedDatabases` entfernt.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Standalone-Prinzip, eigene Bausteine und Architekturentscheidungen
- [Repository-Struktur und Aktivierung](./repo-struktur-und-aktivierung) – geplante Git-Repository-Struktur und V1-Aktivierung

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-06 | Erste Fassung: PostgreSQL-Entscheidung (additiver `preparedDatabases.p2d2`-Eintrag in `central-db`). |
