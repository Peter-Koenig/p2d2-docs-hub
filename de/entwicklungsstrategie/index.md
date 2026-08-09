---
title: Entwicklungsstrategie
description: Übersicht über Leitbild, Roadmap, strategische Schwerpunkte und offene Entscheidungen von p2d2
status: active
lastUpdated: 2026-08-09
quality:
  completeness: 80
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Entwicklungsstrategie

Das Strategie-Handbuch beschreibt, wohin sich p2d2 entwickelt, warum und in welcher Reihenfolge. Es unterscheidet ausdrücklich zwischen:

- **aktuell** – geltende Aussagen und laufende Arbeit
- **in Arbeit** – begonnene, noch nicht abgeschlossene Schritte
- **geplant** – vorgesehene Schritte mit definierter Reihenfolge
- **in Prüfung** – Optionen, über die noch nicht entschieden ist
- **offene Entscheidung** – bewusst vertagte Grundsatzfragen
- **archiviert** – historische Inhalte, die nicht mehr als aktuelle Strategie gelten

## Was ist p2d2?

p2d2 ist kein Datenportal. p2d2 ist ein Prozess- und Synchronisationswerkzeug, das die öffentliche Verwaltung, die OpenStreetMap-Community und interessierte Menschen dabei unterstützt, öffentliche Geodaten schrittweise gemeinsam sichtbar, gemeinsam nutzbar und gleichermaßen von der Verwaltung und der Öffentlichkeit pflegbar zu machen - jeweils in ihren Zuständigkeiten mit nachfolgender Synchronisation.

Eine Idee dabei ist, dass nach einer initialen Synchonisation eines Fachverfahrens einer Kommune, einer Landes- oder Bundesbehörde, die nachfolgenden Detail-Änderungen zwar stetig, aber gering sind. p2d2 will hierfür die Werkzeuge bereit stellen und optimieren.

### Am Ende ist das Ziel der **„digitale Zwilling von unten“**

::: tip Ein digitaler Zwilling entsteht, wenn möglichst oft drei Dinge zusammen kommen:
1. Das kommunale Fachverfahren, das geteilt werden soll
2. freigabefähige Daten
3. Menschen mit lokalem Interesse

**Ergebnis:** ein belastbarer Baustein für den **digitalen Zwilling von unten**
:::

Eine Kommune startet nicht mit einem zentral vorgegebenen Datenkatalog, sondern mit einem lokalen Thema, für das Daten, Fachverantwortung und echtes Interesse zusammenkommen. Grabfluren bieten sich als Einstieg an, sind aber nicht zwingend vorgeschrieben; welches Thema bearbeitet wird, entscheidet sich im Dialog zwischen Kommune und Bürgerschaft.

Der digitale Zwilling entsteht dann schrittweise: Wenn im Laufe der Zeit immer mehr Fachverfahren einer Kommune, eines Landes oder eines EU-Staates in der OpenStreetMap bidirektional abgeglichen werden, wächst aus vielen fachlichen Bausteinen eine gemeinschaftlich gepflegte, immer vollständigere Abbildung der Kommune, des Landes, des Staates und der EU in der OpenStreetMap. 

## Aufbau des Handbuchs

| Seite | Inhalt |
|---|---|
| [Leitbild und Prinzipien](./leitbild-und-prinzipien) | Digitaler Zwilling von unten, Data-DNA, Datenhoheit, Open Source, OSM und lokale Themen statt zentralem Datenkatalog |
| [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027) | Der aktuelle verbindliche Arbeitsweg: Website → Ansprache → Pilot → CIVITAS/CORE V1 → Evidenz für die Prototype-Fund-Second-Stage |
| [Kommunale Einführung in Deutschland](./kommunale-einfuehrung-deutschland) | Wie eine Kommune ein Fachverfahren, einen Datensatz, ein Thema und eine lokale Community findet |
| [CIVITAS/CORE und Plattformstrategie](./civitas-core-und-plattformstrategie) | Standalone-Betrieb plus V1-AddOn, V2 erst nach Praxiserfahrung, Abgrenzung zu technischen Spezifikationen |
| [Europa und internationale Perspektive](./europa-und-internationale-perspektive) | Europa als mittelfristiger Fokus; die globale Perspektive ist langfristig und partnerorientiert |
| [Governance und Verstetigung](./governance-und-verstetigung) | Verein, offene Governance, Beratungsgesellschaft und europäische Dachstruktur – klar als Perspektive, nicht als beschlossenes Ergebnis |
| [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen) | ADR-artige Liste offener Strategieentscheidungen und bewusst vertagter Fragen |

## Aktueller Stand im Überblick

- **Aktuell:** Leitbild und Prinzipien, PTF-Roadmap 2026–2027
- **In Arbeit:** Website-Überarbeitung, damit p2d2 verständlich und einladend wird (Roadmap, Arbeitspaket 1)
- **Geplant:** Ansprache von Kommunen und Multiplikatoren, Grabflur-Pilot, Vorbereitung von CIVITAS/CORE V1 als Erweiterungsplattform
- **Geklärt:** IAM-Modell – p2d2-Standalone nutzt Zitadel („Account anlegen“ und OIDC, z. B. OpenStreetMap); für das CIVITAS/CORE-AddOn erfolgt die Umstellung auf Keycloak/OIDC
- **In Prüfung / offene Entscheidung:** V2-Integration, Governance- und Verstetigungsmodelle, internationale Ausrichtung, Lizenzfragen für Daten und Dokumentation, Adressatenkreis oberhalb der kommunalen Ebene (Länder, Bund)
- **Archiviert:** Frühere Roadmaps, Vision 2030, IAM-Konzept und Skalierungsentwürfe – nachvollziehbar unter [Archiv](./archiv/roadmap-bis-2025)

## Abgrenzung zu den Spezifikationen

Dieses Handbuch beschreibt Zweck, Reihenfolge und Entscheidungsgrenzen. Technische Installationsdetails gehören nicht hierher, sondern ins [Spezifikationshandbuch](../specs/) – insbesondere unter [Serveraufbau CIVITAS/CORE V1](../specs/civitas-core-plugin/serveraufbau-v1/). Das Strategie-Handbuch verlinkt auf diese Spezifikationen, wo sie für die Strategie relevant sind.

## Weiterführende Dokumente

- [Benutzerhandbuch](../benutzerhandbuch/)
- [Verwaltungshandbuch](../verwaltungshandbuch/)
- [Administrationshandbuch](../administrationshandbuch/)
- [Spezifikationshandbuch](../specs/)
