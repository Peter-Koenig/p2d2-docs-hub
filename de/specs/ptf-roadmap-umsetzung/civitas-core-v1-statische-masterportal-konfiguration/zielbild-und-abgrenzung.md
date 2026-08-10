---
title: "CIVITAS/CORE V1: Statische Masterportal-Konfiguration – Zielbild und Abgrenzung"
description: Ausgangslage der S3-/RustFS-Ablage, Zielbild der statischen Masterportal-Konfiguration, Architekturprinzipien, Nichtziele und offene Entscheidungen
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# Zielbild und Abgrenzung

Diese Seite beschreibt das Zielbild der statischen, versionierten und imagebasierten Masterportal-Konfiguration für CIVITAS/CORE V1 sowie die Abgrenzung zu anderen Vorhaben.

## Ausgangslage

Die Masterportal-Konfiguration wird derzeit über eine RustFS-/S3-basierte Ablage bereitgestellt. Betroffen sind die drei Masterportal-Dateien:

- `config.json`
- `services.json`
- `rest-services.json`

Die lokale RustFS-LXC ist damit aktuell eine zwingende Voraussetzung für die Auslieferung dieser Konfiguration.

## Ziel

Die fachlichen Portal-Konfigurationen sollen unabhängig von der lokalen RustFS-/S3-Ablage ausgeliefert werden können. Ziel ist eine statische, versionierte und imagebasierte Masterportal-Konfiguration, die sich reproduzierbar bereitstellen und überprüfen lässt.

## Architekturprinzipien

Die Zielvariante folgt diesen Prinzipien:

- **reproduzierbar** – identische Konfiguration führt zu identischem Ergebnis,
- **versioniert** – jede Änderung ist einer Version und deren Historie zuordenbar,
- **reviewbar** – Änderungen sind vor der Auslieferung prüfbar,
- **überprüfbar** – der ausgelieferte Zustand ist verifizierbar,
- **rückbaubar** – ein vorheriger Zustand ist wiederherstellbar,
- **keine verdeckten manuellen Infrastrukturzustände** – die Bereitstellung ist nachvollziehbar und nicht von nicht dokumentierten Handgriffen abhängig.

## Klarstellung zu S3

S3 wird durch diese Spezifikation nicht als generelle Technologie ausgeschlossen. Die lokale RustFS-LXC darf jedoch keine zwingende Voraussetzung für die Zielvariante sein. Ob und wo S3-kompatible Dienste weiterhin eingesetzt werden, ist eine separate technische Entscheidung.

## Nichtziele

Ausdrücklich nicht Bestandteil dieses Vorhabens:

- **keine p2d2-AddOn-Implementierung** – das AddOn wird in einer eigenen Spezifikation beschrieben,
- **keine Änderung der V2-Architektur** – CIVITAS/CORE V2 ist ein eigenständiges, späteres Vorhaben,
- **keine pauschale Migration bestehender kommunaler Plattformen** – eine Migration erfolgt nur im Rahmen eines definierten, kompatibilitätsgeprüften Verfahrens.

## Offene Entscheidungen

Die folgenden Punkte sind noch nicht entschieden und werden als offene Fragen geführt:

- kontrollierter Geoportal-Components-Fork beziehungsweise dessen Nachfolgeartefakt,
- genaue Image-Build- und Release-Verantwortung,
- genaue Inventory-Felder,
- Anzahl und Zuordnung von `portal-backend`-Deployments zu Masterportal-Instanzen,
- mögliche Koexistenz bestehender S3- und neuer statischer Konfigurationen.