---
title: Leitbild und Prinzipien
description: Digitaler Zwilling von unten, Data-DNA, Datenhoheit, Open Source, OpenStreetMap und lokale Themen statt zentralem Datenkatalog
status: active
lastUpdated: 2026-08-09
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

### Der zentrale Ansatz heißt **„digitaler Zwilling von unten“**

::: tip Ein digitaler Zwilling entsteht, wenn möglichst oft drei Dinge zusammen kommen:
1. Das kommunale Fachverfahren, das geteilt werden soll
2. freigabefähige Daten
3. Menschen mit lokalem Interesse

**Ergebnis:** ein belastbarer Baustein für den **digitalen Zwilling von unten**
:::

Eine Kommune startet nicht mit einem zentral vorgegebenen Datenkatalog, sondern mit einem lokalen Thema, für das Daten, Fachverantwortung und echtes Interesse zusammenkommen. Grabfluren bieten sich als Einstieg an, sind aber nicht zwingend vorgeschrieben; welches Thema bearbeitet wird, entscheidet sich im Dialog zwischen Kommune und Bürgerschaft.

Ein einzelnes Thema ist dabei noch kein vollständiger digitaler Zwilling. Der digitale Zwilling entsteht schrittweise: Wenn zunehmend mehr kommunale Fachverfahren ihre Daten verantwortet und dauerhaft mit OpenStreetMap abgleichen, wächst aus vielen fachlichen Bausteinen eine gemeinschaftlich gepflegte, immer vollständigere Abbildung der Kommune in der OpenStreetMap.

## Data-DNA

Das Bild der **Public-Public Data-DNA** beschreibt, wie p2d2 zwei Datenstränge miteinander verzahnt: die Daten der Öffentlichkeit auf der einen und die offenen Daten der Verwaltung auf der anderen Seite. Die Synchronität der einzelnen Datenobjekte entspricht dabei der Basenpaarung im Bild der DNA.

Der Einstieg erfolgt über Geodaten, weil diese durch Visualisierbarkeit und Wiedererkennbarkeit einen niedrigschwelligen Zugang bieten. Die zugrunde liegende Architektur ist jedoch bewusst nicht auf Geodaten beschränkt.

## Prinzipien

### Lokale Themen statt zentralem Datenkatalog

Der Einstieg in p2d2 ist ein konkretes Thema vor Ort, nicht ein vorgegebener Katalog von Datenkategorien. Was bearbeitet wird, bestimmt sich aus dem Zusammenkommen von kommunaler Fachverantwortung, freigabefähigen Daten und lokalem Interesse – und aus dem Dialog zwischen Kommune und Bürgerschaft darüber, welche Daten geteilt werden sollen und welche die Menschen gerne in ihre Obhut übernehmen. Grabfluren bieten sich als Einstieg an, sind aber nicht zwingend vorgeschrieben. Diese Reihenfolge ist Grundlage der aktuellen Roadmap: Zuerst wird p2d2 verständlich gemacht, dann werden Kommunen und Multiplikatoren angesprochen, danach wird ein erstes Thema als Pilot konkretisiert.

### Adressatenkreis: nicht auf Kommunen beschränkt

**Status:** in Prüfung

p2d2 beginnt bei Kommunen, weil dort Fachverfahren, freigabefähige Daten und
lokales Interesse besonders unmittelbar zusammenkommen. Das Modell ist damit
aber nicht auf die kommunale Ebene begrenzt: Überall dort, wo eine öffentliche
Stelle – auch auf Landes- oder Bundesebene – fachliche Verantwortung für ein
Geodaten-Fachverfahren trägt und dieses schrittweise mit der Öffentlichkeit
synchronisieren möchte, ist das Prinzip des digitalen Zwillings von unten
grundsätzlich anwendbar.

Eine über die kommunale Ebene hinausgehende Anwendung ist derzeit nicht
Bestandteil eines zugesagten Arbeitspakets. Sie wird als strukturelle
Eigenschaft der Architektur benannt, nicht als terminierte Lieferung.

### Datenhoheit

Kommunen und Organisationen behalten die Kontrolle über ihre Daten und über die Daten der Menschen, die sich beteiligen. Das Ziel ist, Abhängigkeiten von einzelnen Anbietern und zentrale Kontrollpunkte zu vermeiden. Gleiches gilt für die technische Integration: p2d2 bleibt fachlich eigenständig und soll nicht unkontrolliert von den APIs oder Prozessen einer Plattform abhängig werden.

### Open Source

p2d2 ist unter der **European Union Public Licence v1.2 (EUPL-1.2)** veröffentlicht (Nachweis: `LICENSES/EUPL-1.2.txt` im p2d2-Repository). Offener Quellcode ermöglicht:

- **Transparenz**: Nachvollziehbarkeit, wie Daten und Prozesse funktionieren.
- **Sicherheit**: Öffentliche Prüfung findet Schwachstellen schneller.
- **Unabhängigkeit**: Verwaltungen bleiben unabhängig von einzelnen Anbietern.
- **Nachhaltigkeit**: Software kann auch dann weiterentwickelt werden, wenn das ursprüngliche Team nicht mehr aktiv ist.

Das Lizenzmodell für **Daten und Dokumentation** ist im Repository uneinheitlich dokumentiert; ältere Hinweise (~~GPLv3, CC-BY-SA 4.0, MIT oder ODbL~~) sind veraltet und nicht mehr relevant. Die Frage ist unter [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen) als offene Entscheidung erfasst.

### OpenStreetMap als offene Datenbasis

OpenStreetMap ist die zentrale offene Datenplattform, mit der p2d2 zusammenarbeitet. Daten, die in OpenStreetMap eingefügt werden sollen, müssen von der Kommune unter **CC0** bereitgestellt werden, damit sie mit der OSM-Datenbanklizenz (ODbL) vereinbar sind. Datenmodelle, Herkunft, Review, Export und Referenzen (beispielsweise eine INSPIRE-Referenz über `de:inspireid`) werden mit der OSM-Community abgestimmt, damit Unterschiede zwischen Verwaltungsdaten und OSM-Daten nachvollziehbar bleiben.

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
| 1.1 | 2026-08-05 | Lizenzangaben korrigiert: p2d2 ist unter EUPL-1.2 veröffentlicht; CC0-Anforderung für kommunale Daten zur OSM-Rückführung (ODbL-Kompatibilität) ergänzt |
| 1.2 | 2026-08-05 | Formel des digitalen Zwillings präzisiert: Ein einzelnes kommunales Fachverfahren ist ein belastbarer Baustein, nicht der vollständige digitale Zwilling; Darstellung als hervorgehobene Admonition-Box |
| 1.3 | 2026-08-05 | Formel-Darstellung finalisiert: nummerierte Liste, neuer Admonition-Titel „Ein digitaler Zwilling entsteht, wenn möglichst oft vier Dinge zusammenkommen“; Abschlussabsatz auf die gekürzte Fassung ohne 1:1-Zielbild angeglichen |
| 1.4 | 2026-08-05 | Veraltete Lizenzhinweise als nicht mehr relevant markiert (durchgestrichen); Grabflur-Einstieg als naheliegend, aber nicht zwingend präzisiert; Themenfindung im Dialog zwischen Kommune und Bürgerschaft ergänzt |
| 1.5 | 2026-08-09 | Adressatenkreis präzisiert: Das Modell des digitalen Zwillings von unten ist strukturell nicht auf die kommunale Ebene beschränkt; eine Anwendung auf Landes- oder Bundesebene ist in Prüfung und keine terminierte Lieferung |
