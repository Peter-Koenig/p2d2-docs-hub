---
title: Kommunale Einführung in Deutschland
description: Wie eine Kommune ein Fachverfahren, einen Datensatz, ein Thema und eine lokale Community findet
status: geplant
lastUpdated: 2026-08-05
quality:
  completeness: 75
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Kommunale Einführung in Deutschland

Diese Seite beschreibt, wie eine Kommune in Deutschland mit p2d2 starten kann: über ein lokales Thema, für das Daten, Fachverantwortung und lokales Interesse zusammenkommen. Sie ergänzt die [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027) und ist mit den dortigen Arbeitspaketen verzahnt.

## Ausgangspunkt: ein lokales Thema statt eines Datenkatalogs

Eine Kommune startet nicht mit einem zentral vorgegebenen Datenkatalog, sondern mit einem konkreten Thema vor Ort.

### Der zentrale Ansatz heißt **„digitaler Zwilling von unten“**

::: tip Ein digitaler Zwilling entsteht, wenn möglichst oft vier Dinge zusammenkommen:
1. Ein kommunales Fachverfahren
2. freigabefähige Daten
3. fachliche Verantwortung
4. Menschen mit lokalem Interesse

**Ergebnis:** ein belastbarer Baustein für den **digitalen Zwilling von unten**
:::

Welches Thema bearbeitet wird, bestimmt sich aus dem Zusammenkommen dieser vier Bausteine – nicht aus einer vorgegebenen Liste.

Ein einzelnes Thema ist dabei noch kein vollständiger digitaler Zwilling. Der digitale Zwilling entsteht schrittweise: Wenn zunehmend mehr kommunale Fachverfahren ihre Daten verantwortet und dauerhaft mit OpenStreetMap abgleichen, wächst aus vielen fachlichen Bausteinen eine gemeinschaftlich gepflegte, immer vollständigere Abbildung der Kommune in der OpenStreetMap.

## Was eine Kommune mitbringt

- **Ein kommunales Fachverfahren**: ein Verwaltungsbereich mit fachlicher Verantwortung, zum Beispiel die Friedhofsverwaltung.
- **Freigabefähige Daten**: Daten aus diesem Fachverfahren, die die Kommune unter **CC0** bereitstellt. CC0 ist die Voraussetzung dafür, dass die Daten in OpenStreetMap (ODbL) eingefügt werden können.
- **Fachliche Verantwortung**: eine Stelle, die Daten freigibt, pflegt und Rückmeldungen in ihre Prozesse aufnimmt.
- **Menschen mit lokalem Interesse**: OpenStreetMap-Community, Vereine, Bildungseinrichtungen, Stadtgesellschaft – Menschen, die das Thema mit Wissen und Engagement tragen.

## Schritte aus der Roadmap

Der kommunale Einstieg folgt der Reihenfolge der PTF-Roadmap 2026–2027.

### Schritt 1: p2d2 verständlich machen (in Arbeit)

**Status:** in Arbeit

Bevor Kommunen angesprochen werden, muss p2d2 verständlich und einladend sein. Die öffentliche Website soll erklären, warum p2d2 sinnvoll ist und wie Menschen sowie Kommunen mit einem eigenen Thema beginnen können. Die Karte und die Kommunen-/Themen-Auswahl bleiben das Zentrum der Seite.

Mehr dazu im Arbeitspaket 1 der [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027).

### Schritt 2: Kommunen und Multiplikatoren ansprechen (geplant)

**Status:** geplant, beginnt nach dem ersten Website-Release

Die überarbeitete Website ist die verständliche Grundlage für Gespräche mit Kommunen und Multiplikatoren. Ziel ist nicht die sofortige flächendeckende Einführung, sondern die Validierung eines ersten lokalen Themas und eines tragfähigen Beteiligungsprozesses.

#### Zielgruppen der Ansprache

- Kommunen und kommunale Fachämter
- Open-Data- und Geodaten-Netzwerke
- lokale und überregionale OpenStreetMap-Community
- Organisationen und Multiplikatoren im Umfeld von Open Data, kommunaler Digitalisierung und Geodateninfrastruktur
- interessierte Vereine, Initiativen, Bildungseinrichtungen und Fachgemeinschaften

#### Gesprächsfrage

> Welches Thema möchte Ihre Kommune gemeinsam mit Menschen vor Ort besser sichtbar und langfristig pflegbar machen?

#### Erwartete Ergebnisse (Ziele, keine Zusagen)

- Gespräche mit potenziellen Pilotkommunen und Multiplikatoren
- identifizierte Fachverfahren und mögliche offene Datensätze
- Rückmeldungen zu Datenqualität, Rollen, Beteiligung und Betriebsmodell
- Austausch mit der OSM-Community über Datenmodell, Herkunft, Review und Export
- nach Möglichkeit eine schriftliche Interessenbekundung, ein Letter of Intent oder eine Pilot-Skizze

Ob und in welcher Form diese Ergebnisse eintreten, hängt von den Gesprächen und dem Interesse der Beteiligten ab.

### Schritt 3: Pilot „Digitalisierung von Grabfluren“ (Vorschlag)

**Status:** Vorschlag für Pilotkommunen und Fachgespräche

Grabfluren sind ein naheliegender, aber **nicht zwingender** Einstieg: Sie sind räumlich klar abgrenzbar, haben kommunale Fachverantwortung und können für Geschichte, Erinnerungskultur, Friedhofsverwaltung sowie lokale Kartierung relevant sein. Welches Thema eine Kommune bearbeitet, entscheidet sich im verwaltungsinternen und bürgerschaftlichen Dialog.

#### Ziel des Piloten

Eine Kommune erprobt, wie Grabflur-Daten aus ihrem Fachkontext schrittweise geöffnet, geprüft und mit OpenStreetMap sowie lokalem Wissen in Beziehung gesetzt werden können.

#### Zu klärende Fragen

- Welche Grabflur- und Friedhofsdaten dürfen unter welchen Bedingungen bereitgestellt werden?
- Welche Rolle übernehmen Friedhofsverwaltung, weitere kommunale Stellen und lokale Interessierte?
- Welche Daten gehören in OpenStreetMap, welche bleiben Verwaltungsdaten, und wie werden Unterschiede nachvollziehbar gemacht?
- Wie kann eine INSPIRE-Referenz – beispielsweise über `de:inspireid` – fachlich korrekt und mit der OSM-Community abgestimmt verwendet werden?
- Wie soll der Rückweg von Referenzen oder Änderungen in kommunale Prozesse aussehen?

Die konkrete technische und fachliche Ausgestaltung wird erst nach Abstimmung mit Pilotkommune und OSM-Community festgelegt. Für die technische Umsetzung wird auf das [Spezifikationshandbuch](../specs/) verwiesen, insbesondere auf den [Serveraufbau CIVITAS/CORE V1](../specs/civitas-core-plugin/serveraufbau-v1/).

## Weitere Themen und Themenfindung

Grabfluren bieten sich als Einstieg an, sind aber **nicht zwingend vorgeschrieben**. Welches Thema eine Kommune bearbeitet, entscheidet sich im Dialog: verwaltungsintern und mit den Bürger:innen. Gefragt ist, welche Daten eine Kommune gerne mit ihren Bürger:innen teilen möchte – mit Blick auf Synergien – und welche Daten die Menschen gerne in ihre Obhut übernehmen wollen, dort wo echtes Interesse existiert.

Interessensgruppen sind in der Regel SIGs (Special Interest Groups) zu einzelnen Themen – etwa Fahrradständer für Fahrradinteressierte – sowie OSM-affine Menschen. Ein etablierter Prozess für diese Themenfindung existiert noch nicht; er lässt sich finden und wird mit den ersten Gesprächen und dem Pilot konkretisiert.

## Offene Fragen

Die folgenden Punkte sind bewusst offen und werden im Laufe der Gespräche und des Piloten geklärt:

- **Betriebsmodell**: Wie wird p2d2 in einer Kommune betrieben und finanziert? Gibt es tragfähige Modelle für Hosting, Support und Pflege? (Siehe auch [Governance und Verstetigung](./governance-und-verstetigung).)
- **Rollen und Rechte**: Welche Rollen braucht eine Kommune für Datenfreigabe, Qualitätssicherung und Rückmeldungen?
- **Datenqualität**: Wie wird die Qualität freigegebener Verwaltungsdaten bewertet und verbessert?
- **Themenfindung**: Welche Themen eignen sich als nächste Schritte? Das entscheidet sich im Dialog – verwaltungsintern und mit der Bürgerschaft. Ein etablierter Prozess dafür existiert noch nicht; er lässt sich finden und wird mit den ersten Gesprächen konkretisiert. Interessensgruppen sind in der Regel SIGs zu einzelnen Themen sowie OSM-affine Menschen.
- **Datenfreigabe**: Kommunale Daten, die in OpenStreetMap eingefügt werden sollen, müssen von der Kommune unter **CC0** bereitgestellt werden. Welche Daten im Einzelfall freigegeben werden dürfen (z. B. Datenschutz), klärt die Kommune mit den zuständigen Stellen. (Siehe [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen).)

## Verwandte Seiten

- [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027) – Arbeitspakete 2 und 3
- [Leitbild und Prinzipien](./leitbild-und-prinzipien) – Grundlagen
- [CIVITAS/CORE und Plattformstrategie](./civitas-core-und-plattformstrategie) – technische Integration
- [Governance und Verstetigung](./governance-und-verstetigung) – langfristige Modelle
- [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen) – offene Strategiefragen