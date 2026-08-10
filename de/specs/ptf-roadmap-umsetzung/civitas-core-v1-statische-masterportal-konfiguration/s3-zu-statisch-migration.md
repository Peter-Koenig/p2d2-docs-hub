---
title: "CIVITAS/CORE V1: Statische Masterportal-Konfiguration – S3-zu-statisch-Migration"
description: Migrationsvorhaben von der RustFS-/S3-Ablage zur statischen, versionierten und imagebasierten Masterportal-Konfiguration – Ausgangs- und Zielzustand, Migrationsprinzipien, konzeptionelle Abnahme
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# S3-zu-statisch-Migration

Diese Seite beschreibt das **Migrationsvorhaben** von der bestehenden RustFS-/S3-Ablage hin zu einer statischen, versionierten und imagebasierten Masterportal-Konfiguration. Sie dokumentiert ausdrücklich ein geplantes Vorhaben und keine bereits umgesetzte Migration.

## Ausgangszustand

Ausgangspunkt ist eine funktionierende CIVITAS/CORE-V1-Referenzinstallation, deren Masterportal-Konfiguration über RustFS/S3 bereitgestellt wird. Betroffen sind die drei fachlichen Konfigurationsdateien:

- `config.json`
- `services.json`
- `rest-services.json`

Die lokale RustFS-LXC ist in diesem Zustand eine zwingende Voraussetzung für die Auslieferung der Portal-Konfiguration.

## Zielzustand

Im Zielzustand liegen dieselben fachlichen Portal-Konfigurationen in versionierten, statisch auslieferbaren Artefakten beziehungsweise Images vor. Die Auslieferung ist damit unabhängig von der lokalen RustFS-/S3-Ablage möglich und reproduzierbar, versioniert und überprüfbar.

## Migrationsprinzipien

Die Migration folgt verbindlich diesen Prinzipien:

- **kein stilles Überschreiben funktionierender Bestandsportale** – bestehende Portale bleiben bis zum nachgewiesenen Zielzustand unverändert,
- **Backup vor jeder Änderung** – der Ausgangszustand ist vor jedem Migrationsschritt gesichert,
- **definierte Abbruchbedingungen** – Abbruchkriterien sind vorab festgelegt, bei deren Eintritt die Migration gestoppt wird,
- **nachweisbarer Zielzustand** – der Zielzustand ist überprüfbar und dokumentiert,
- **wiederholbarer Testablauf** – der Migrations- und Abnahmeprozess ist reproduzierbar.

## Konzeptionelle Abnahme

Eine Migration gilt konzeptionell erst dann als erfolgreich, wenn folgende Punkte erfüllt sind:

- das Masterportal lädt seine Konfiguration aus dem neuen statischen Artefakt beziehungsweise Image,
- im `portal-backend` tritt kein `ENOENT` für die erforderlichen Konfigurationsdateien auf,
- die Kernendpunkte der Plattform bleiben erreichbar,
- bestehende Portale wurden nicht unbeabsichtigt verändert.

## Technische Schritte

Die konkreten technischen Schritte der Migration sind **noch zu spezifizieren**. Diese Spezifikation legt ausschließlich Ausgangs-, Zielzustand, Migrationsprinzipien und konzeptionelle Abnahmekriterien fest. Artefakt-Struktur, Image-Build, konkrete Befehle und Bereitstellungsdetails werden in einer nachgelagerten Spezifikation bestimmt.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben der statischen Masterportal-Konfiguration
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Ausgangslage, Zielarchitektur und offene Entscheidungen
- [Testverfahren mit Proxmox-Backup](./testverfahren-mit-proxmox-backup) – restaurierbare Test-Baseline und Abnahmeprozess
