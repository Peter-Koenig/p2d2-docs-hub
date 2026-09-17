---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Manuelle Installation"
description: Dokumentation der tatsächlich durchgeführten manuellen Installation des p2d2-AddOns auf einer CIVITAS/CORE-V1-Plattform – modulweise (PostgreSQL, GeoServer, MapProxy, Frontend, IAM)
quality:
  completeness: 40
  accuracy: 80
  reviewed: false
  reviewer:
  reviewDate:
---

# Manuelle Installation

Diese Dokumentation hält die **tatsächlich durchgeführte**, manuelle Installation des p2d2-AddOns auf einer kompatiblen CIVITAS/CORE-V1-Plattform fest. Sie ergänzt die [Soll-Spezifikation](../p2d2-civitas-core-v1-addon/) um den verifizierten Ist-Zustand: konkrete, ausgeführte `kubectl`-/`psql`-/REST-Befehle, die tatsächlich erreichte Struktur und die dabei gewonnenen Automatisierungshinweise.

## Zweck

Im Unterschied zur Spezifikation (Soll) dokumentiert dieser Bereich die **manuell umgesetzten** Schritte samt verifiziertem Ist-Zustand. Er ist die Grundlage für die spätere Skript-/Automatisierungs-Überführung (Ansible-Tasks bzw. Helm-`post-install`-Hook-Job).

## Module

- [PostgreSQL](./postgresql) – additiver `preparedDatabases.p2d2`-Eintrag, Struktur-Aufbau (5 Schemata), Datenimport, Rollenmodell (verifiziert)
- [GeoServer](./geoserver) – additive Erweiterung der geteilten Plattforminstanz (Workspaces, Datastores, FeatureTypes, Nutzer/Rollen, ACL, GeoTIFF-Mosaic) (verifiziert)
- [MapProxy](./mapproxy) – eigener Pod im GeoData-Namespace, Image aus Quellen, APISIX-Routing `/mapserver` (verifiziert)

Weitere Module (Frontend, Zitadel/Keycloak-IAM) folgen als eigene Seiten.

## Verwandte Spezifikationen

- [p2d2 als CIVITAS/CORE-V1-AddOn](../p2d2-civitas-core-v1-addon/) – Soll-Spezifikation (Zielbild, Lifecycle, PostgreSQL-Spec)

## Abgrenzung

Diese Dokumentation beschreibt die manuelle Installation als Ist-Zustand; sie ersetzt nicht die Soll-Spezifikation und erhebt keinen Anspruch auf eine lauffähige Automatisierung.
