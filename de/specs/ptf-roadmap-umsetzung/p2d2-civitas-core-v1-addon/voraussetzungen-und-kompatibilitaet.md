---
title: "p2d2 als CIVITAS/CORE-V1-AddOn – Voraussetzungen und Kompatibilität"
description: Kategorien des späteren AddOn-Preflights für eine kompatible CIVITAS/CORE-V1-Plattform – Voraussetzungen, Kompatibilitätsfälle und Abgrenzung
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# Voraussetzungen und Kompatibilität

Diese Seite legt die Kategorien des späteren AddOn-Preflights fest. Der Preflight stellt vor einer Installation fest, ob eine bestehende CIVITAS/CORE-V1-Plattform addon-kompatibel ist und ob die Zielumgebung die Voraussetzungen für das p2d2-AddOn erfüllt. Konkrete Prüfbefehle, Versionsnummern und Schwellwerte werden in einer nachgelagerten Spezifikation bestimmt.

## Preflight-Kategorien

Der spätere AddOn-Preflight muss mindestens die folgenden Kategorien prüfen:

- **Unterstützte CIVITAS/CORE-V1-Version und passendes Inventory-Schema:** Es wird eine klar benannte, unterstützte Basisversion sowie ein dazu passendes Inventory-Schema erwartet. Konkrete Versionsnummern werden bewusst nicht in dieser Spezifikation festgelegt.
- **Kubernetes-Zugang mit ausreichenden Rechten:** Der Zugang zur Zielplattform muss vorhanden sein und die für p2d2-eigene Ressourcen erforderlichen Rechte bieten.
- **Gesicherter Ausgangszustand:** Vor jeder Installation muss ein dokumentierter und gesicherter Ausgangszustand der Plattform vorliegen.
- **Zugriff auf die p2d2-Container-Artefakte:** Die für das AddOn benötigten p2d2-Artefakte müssen in der Zielumgebung verfügbar sein.
- **Kollisionsfreie Namen:** Die Namen für Deployments, Services, URLs, Ingress-Routen, Datenbanken, GeoServer-Workspaces und Keycloak-Clients müssen eindeutig und kollisionsfrei zur bestehenden Plattform wählbar sein.
- **Geklärte Portal-Backend-Kompatibilität:** Die Kompatibilität des bestehenden `portal-backend` mit der p2d2-Masterportal-Instanz muss geklärt sein.
- **Dokumentierter Rückbaupfad:** Vor der Installation muss feststehen, wie p2d2-eigene Ressourcen vollständig und nachvollziehbar zurückgebaut werden können.
- **Definierte AddOn-Test-Baseline:** Für Entwicklungs- und Migrationsläufe muss eine dokumentierte, restaurierbare V1s-AddOn-Baseline vorhanden sein. Für Bestandsplattformen wird ein gleichwertiger gesicherter Ausgangszustand benötigt. Dies setzt nicht voraus, dass externe Bestandsplattformen zwingend mit Proxmox betrieben werden.

## Kompatibilitätsfälle

### Bestehende S3-basierte Plattformen

Plattformen, deren Masterportal-Konfiguration über die bestehende S3-/RustFS-Ablage bereitgestellt wird, bilden einen **separaten Kompatibilitätsfall**. Für sie gelten die Regelungen der [statischen Masterportal-Konfiguration](../civitas-core-v1-statische-masterportal-konfiguration/) als konfigurative Grundlage. Eine AddOn-Installation auf einer solchen Plattform setzt voraus, dass dieser Kompatibilitätsfall im Preflight ausdrücklich geprüft und dokumentiert wurde.

### Keine pauschale Kompatibilitätsbehauptung

Diese Spezifikation behauptet ausdrücklich **nicht**, dass jede bestehende CIVITAS/CORE-V1-Installation ohne Prüfung addon-kompatibel ist. Die Kompatibilität wird immer individuell über den AddOn-Preflight festgestellt.

## Abgrenzung

Der Preflight prüft ausschließlich Voraussetzungen für p2d2-eigene Ressourcen. Er verändert keine bestehenden CIVITAS-Ressourcen und führt keine Migration oder Neuprovisionierung der Basisplattform durch.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben des p2d2-V1-AddOns
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Standalone-Prinzip, eigene Bausteine und offene Architekturentscheidungen
- [Installation, Upgrade und Rückbau](./installation-upgrade-und-rueckbau) – Ziel-Lifecycle und Abnahmekriterien