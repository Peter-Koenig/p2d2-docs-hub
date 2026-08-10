---
title: "CIVITAS/CORE V1: Statische Masterportal-Konfiguration"
description: Soll-Spezifikation für die statische, versionierte und imagebasierte Auslieferung der Masterportal-Konfiguration auf CIVITAS/CORE V1
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# CIVITAS/CORE V1: Statische Masterportal-Konfiguration

Diese Spezifikation beschreibt ein generisches CIVITAS/CORE-V1-Vorhaben: die bisherige S3-/RustFS-basierte Ablage der Masterportal-Konfiguration soll durch eine statische, versionierte und imagebasierte Auslieferung abgelöst werden. Sie ist Teil der PTF-Roadmap-Umsetzung und bildet die Grundlage für das darauf aufbauende p2d2-AddOn (siehe Abgrenzung unten).

## Zweck

Das Vorhaben macht die Auslieferung der Masterportal-Konfiguration reproduzierbar, versioniert und überprüfbar. Masterportal-Konfigurationen sollen künftig als statische, versionierte Artefakte beziehungsweise Images bereitgestellt werden, ohne dass eine lokale RustFS-/S3-Ablage zwingende Voraussetzung ist. Es handelt sich um eine generische Verbesserung der CIVITAS/CORE-V1-Plattform und nicht um eine p2d2-spezifische Funktion.

Die bisher funktionierende, aus einem Proxmox-Backup restaurierbare CIVITAS/CORE-V1-Installation dient als Test-Baseline für das Migrationsvorhaben.

## Unterseiten

- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Ausgangslage, Zielarchitektur, Prinzipien, Nichtziele und offene Entscheidungen
- [S3-zu-statisch-Migration](./s3-zu-statisch-migration) – Migrationsvorhaben vom bestehenden RustFS-/S3-Zustand zu statischen Artefakten
- [Testverfahren mit Proxmox-Backup](./testverfahren-mit-proxmox-backup) – restaurierbare Test-Baseline und wiederholbarer Abnahmeprozess

## Einordnung in die PTF-Roadmap

Das Vorhaben ist Teil der technischen Vorbereitung der [PTF-Roadmap 2026–2027](../../../entwicklungsstrategie/ptf-roadmap-2026-2027). Es schafft die konfigurative Grundlage für die spätere Integration eigener Dienste im Rahmen des CIVITAS/CORE-V1-Ausbaus und geht dem p2d2-AddOn voraus.

## Abgrenzung zum p2d2-AddOn

Die statische Masterportal-Konfiguration ist eine generische CIVITAS/CORE-V1-Verbesserung und **kein Bestandteil** des [p2d2-AddOns](../p2d2-civitas-core-v1-addon/). Das AddOn setzt auf einer kompatiblen Basisplattform auf und nutzt die hier spezifizierte Konfigurationsform, bringt aber eigene, p2d2-spezifische Bausteine und Konfigurationen mit.

## Verwandte Spezifikationen

- [Serveraufbau CIVITAS/CORE V1](../../civitas-core-plugin/serveraufbau-v1/) – generische Installations- und Plattformspezifikation

Allgemeine Installationsdetails der CIVITAS/CORE-V1-Plattform werden in dieser Spezifikation nicht wiederholt; sie sind den oben verlinkten Basisspezifikationen zu entnehmen.