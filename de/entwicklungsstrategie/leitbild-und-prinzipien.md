---
title: Leitbild und Prinzipien
description: Digitaler Zwilling von unten, Data-DNA, Datenhoheit, Open Source, OpenStreetMap und lokale Themen statt zentralem Datenkatalog
status: active
lastUpdated: 2026-08-05
quality:
  completeness: 80
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Leitbild und Prinzipien

Dieses Dokument beschreibt, wofür p2d2 steht und nach welchen Prinzipien die Entwicklung geführt wird. Es ist Teil des Strategie-Handbuchs und wird durch die [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027) sowie die [offenen Entscheidungen](./entscheidungen-und-offene-fragen) ergänzt.

## Leitbild: Ein digitaler Zwilling von unten

p2d2 ist **kein Datenportal**. p2d2 ist ein Prozess- und Synchronisationswerkzeug, das Kommunen, OpenStreetMap-Community und interessierte Menschen dabei unterstützt, öffentliche Geodaten schrittweise gemeinsam sichtbar, nachvollziehbar und pflegbar zu machen.

Der zentrale Ansatz heißt **„digitaler Zwilling von unten“**:

```text
Ein kommunales Fachverfahren
+ freigabefähige Daten
+ fachliche Verantwortung
+ Menschen mit lokalem Interesse
= ein digitaler Zwilling von unten
```

Eine Kommune startet nicht mit einem zentral vorgegebenen Datenkatalog, sondern mit einem lokalen Thema, für das Daten, Fachverantwortung und echtes Interesse zusammenkommen. Friedhöfe und Grabflure sind der aktuelle fachliche Einstieg; weitere Themen können folgen, wenn eine Kommune und lokale Gruppen sie tragen.

## Data-DNA

Das Bild der **Public-Public Data-DNA** beschreibt, wie p2d2 zwei Datenstränge miteinander verzahnt: die Daten der Öffentlichkeit auf der einen und die offenen Daten der Verwaltung auf der anderen Seite. Die Synchronität der einzelnen Datenobjekte entspricht dabei der Basenpaarung im Bild der DNA.

Der Einstieg erfolgt über Geodaten, weil diese durch Visualisierbarkeit und Wiedererkennbarkeit einen niedrigschwelligen Zugang bieten. Die zugrunde liegende Architektur ist jedoch bewusst nicht auf Geodaten beschränkt.

## Prinzipien

### Lokale Themen statt zentralem Datenkatalog

Der Einstieg in p2d2 ist ein konkretes Thema vor Ort, nicht ein vorgegebener Katalog von Datenkategorien. Was bearbeitet wird, bestimmt sich aus dem Zusammenkommen von kommunaler Fachverantwortung, freigabefähigen Daten und lokalem Interesse. Diese Reihenfolge ist Grundlage der aktuellen Roadmap: Zuerst wird p2d2 verständlich gemacht, dann werden Kommunen und Multiplikatoren angesprochen, danach wird ein erstes Thema als Pilot konkretisiert.

### Datenhoheit

Kommunen und Organisationen behalten die Kontrolle über ihre Daten und über die Daten der Menschen, die sich beteiligen. Das Ziel ist, Abhängigkeiten von einzelnen Anbietern und zentrale Kontrollpunkte zu vermeiden. Gleiches gilt für die technische Integration: p2d2 bleibt fachlich eigenständig und soll nicht unkontrolliert von den APIs oder Prozessen einer Plattform abhängig werden.

### Open Source

Der Code von p2d2 ist unter der **GNU General Public License v3.0 (GPLv3)** veröffentlicht. Offener Quellcode ermöglicht:

- **Transparenz**: Nachvollziehbarkeit, wie Daten und Prozesse funktionieren.
- **Sicherheit**: Öffentliche Prüfung findet Schwachstellen schneller.
- **Unabhängigkeit**: Verwaltungen bleiben unabhängig von einzelnen Anbietern.
- **Nachhaltigkeit**: Software kann auch dann weiterentwickelt werden, wenn das ursprüngliche Team nicht mehr aktiv ist.

Das Lizenzmodell für **Daten und Dokumentation** ist im Repository nicht eindeutig belegt (genannt werden ODbL, CC-BY-SA 4.0 und abweichende Angaben). Diese Frage ist unter [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen) als offene Entscheidung erfasst.

### OpenStreetMap als offene Datenbasis

OpenStreetMap ist die zentrale offene Datenplattform, mit der p2d2 zusammenarbeitet. Datenmodelle, Herkunft, Review, Export und Referenzen (beispielsweise eine INSPIRE-Referenz über `de:inspireid`) werden mit der OSM-Community abgestimmt, damit Unterschiede zwischen Verwaltungsdaten und OSM-Daten nachvollziehbar bleiben.

### Fachliche Verantwortung und Beteiligung

Ein digitaler Zwilling von unten trägt nur, wenn beides zusammenkommt:

- **Fachliche Verantwortung**: Eine Kommune oder Fachverwaltung, die Daten freigibt, pflegt und Rückmeldungen in ihre Prozesse aufnimmt.
- **Menschen mit lokalem Interesse**: OpenStreetMap-Community, Vereine, Bildungseinrichtungen, Stadtgesellschaft – Menschen, die ein Thema mit Wissen und Engagement tragen.

## Status und Reichweite

- **Status:** aktuell – dieses Leitbild ist die Grundlage der laufenden Entwicklung und der PTF-Roadmap 2026–2027.
- Die technischen Installations- und Architekturdetails sind nicht Teil dieses Handbuchs. Sie stehen im [Spezifikationshandbuch](../specs/), insbesondere unter [Serveraufbau CIVITAS/CORE V1](../specs/civitas-core-plugin/serveraufbau-v1/).
- Frühere, spekulative Strategieinhalte sind im [Archiv](./archiv/roadmap-bis-2025) nachvollziehbar abgelegt und gelten nicht mehr als aktuelle Strategie.

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-05 | Neufassung als Leitbild- und Prinzipienseite im Rahmen der Neustrukturierung des Strategie-Handbuchs; ersetzt die archivierte OpenSource-Philosophie und spekulative Vision-Inhalte |