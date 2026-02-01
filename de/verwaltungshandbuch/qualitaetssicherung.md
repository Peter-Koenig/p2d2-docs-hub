---
quality:
  completeness: 10
  accuracy: 20
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Qualitätssicherung

Dieses Kapitel beschreibt die Qualitätssicherungsprozesse in p2d2 aus Sicht der öffentlichen Verwaltung. Sie erfahren, wie p2d2 Datenqualität sicherstellt, welche Prüfverfahren zum Einsatz kommen und wie Verwaltungsmitarbeitende die Qualitätssicherung aktiv gestalten und überwachen können.

## Warum Qualitätssicherung für Verwaltungen wichtig ist

Die Qualität von Verwaltungsdaten hat direkte Auswirkungen auf:

- **Entscheidungsgrundlagen**: Fehlerhafte Daten führen zu fehlerhaften Entscheidungen
- **Rechtssicherheit**: Parzellengenaue Geodaten sind Grundlage für behördliche Verfahren
- **Effizienz**: Qualitätsgesicherte Daten reduzieren Nacharbeit und Korrekturaufwand
- **Vertrauen**: Bürger:innen vertrauen auf die Korrektheit behördlicher Informationen
- **Interoperabilität**: Standardisierte, qualitätsgesicherte Daten ermöglichen reibungslosen Austausch

p2d2 setzt auf einen mehrstufigen Qualitätssicherungsansatz, der automatisierte Prüfungen mit menschlicher Expertise kombiniert.

## Mehrstufiger Qualitätssicherungsprozess

p2d2 implementiert einen vierstufigen Qualitätssicherungsprozess:

### Stufe 1: Automatische Basisvalidierung
- **Bei Import**: Geometrie- und Attributprüfung nach Schema
- **Bei Änderungen**: Konfliktprüfung mit bestehenden Daten
- **Vor Export**: Vollständigkeits- und Konsistenzprüfung

### Stufe 2: Community-Review
- **Prüfung durch Bürger:innen** und Community-Expert:innen
- **Visuelle Kontrolle** in Kartenansicht
- **Ergänzung von Informationen** aus Lokalwissen
- **Diskussion und Konsensfindung** bei Unstimmigkeiten

### Stufe 3: Fachliche Prüfung durch die Verwaltung
- **Fachliche Validierung** durch zuständige Sachbearbeiter:innen
- **Freigabeentscheidung** für Community-Änderungen
- **Qualitätsbewertung** nach behördlichen Standards

### Stufe 4: Kontinuierliches Monitoring
- **Regelmäßige Qualitätskontrollen** auf Stichprobenbasis
- **Monitoring von Qualitätskennzahlen** (KPIs)
- **Proaktive Fehlererkennung** durch automatisierte Checks

## Rollen und Verantwortlichkeiten in der Qualitätssicherung

| Rolle | Qualitätssicherungsaufgaben | Typische Funktion in der Verwaltung |
|-------|-----------------------------|-------------------------------------|
| **Dateneigner** | Gesamtverantwortung für Datenqualität, Freigabe von Qualitätsstandards | Fachbereichsleitung, Amtsleitung |
| **Qualitätsverantwortliche** | Definition von Qualitätskriterien, Überwachung der Einhaltung | Qualitätsmanagement, Fachbereich |
| **Sachbearbeiter:in** | Fachliche Prüfung, Freigabe von Community-Änderungen, Fehlerkorrektur | Fachamt, Sachgebiet |
| **OpenData-Beauftragte** | Lizenzkonformität, Metadatenqualität, Prozessqualität | Stabsstelle Digitalisierung |
| **Community-Moderator** | Moderation von Review-Prozessen, Konfliktlösung, Qualitätsbewertung | Externe oder interne Rolle |

## Qualitätskriterien nach Datenkategorien

Jede Datenkategorie hat spezifische Qualitätsanforderungen. Eine detaillierte Übersicht finden Sie im Kapitel [Datenkategorien](../datenkategorien). Die wesentlichen Kriterien umfassen:

### Geometrische Qualität
- **Genauigkeit**: Abweichungstoleranzen je nach Kategorie (0,5–5,0 m)
- **Vollständigkeit**: Geschlossene Polygone, korrekte Topologie
- **Konsistenz**: Einheitliches Koordinatensystem (EPSG:25832)

### Attributive Qualität
- **Vollständigkeit**: Pflichtattribute zu ≥95% befüllt
- **Korrektheit**: Amtlich bestätigte Werte, standardisierte Begriffe
- **Aktualität**: Maximales Alter der Daten (kategorienspezifisch)
- **Konsistenz**: Logische Zusammenhänge zwischen Attributen

### Metadaten-Qualität
- **Vollständige Metadaten**: Herausgeber, Lizenz, Aktualisierungszyklus
- **Nachvollziehbarkeit**: Änderungshistorie mit Autor:in und Zeitstempel
- **Lizenzkonformität**: Einhaltung der gewählten OpenData-Lizenz

## Automatisierte Prüfungen

p2d2 führt folgende automatisierte Qualitätsprüfungen durch:

### Geometrische Validierung
- **Topologieprüfung**: Keine Selbstüberschneidungen, geschlossene Polygone
- **Koordinatengültigkeit**: Innerhalb des definierten Gebiets (Kommunalgrenzen)
- **Größenprüfung**: Plausible Flächengrößen (keine Mikro-/Riesenpolygone)

### Attributive Validierung
- **Schema-Konformität**: Datentypen, Pflichtfelder, Wertebereiche
- **Referentielle Integrität**: Verweise auf existierende Objekte
- **Plausibilitätsprüfungen**: Logische Zusammenhänge (z.B. Spielplatzfläche ≥ Mindestgröße)

### Konsistenzprüfungen
- **Duplikaterkennung**: Gleiche Geometrie mit unterschiedlichen IDs
- **Überlappungsprüfung**: Konflikte zwischen benachbarten Features
- **Zeitliche Konsistenz**: Chronologische Reihenfolge von Änderungen

## Manuelle Prüfungen und Review-Prozesse

### Community-Review-Prozess
1. **Sichtbarmachung**: Neue oder geänderte Daten werden im Portal veröffentlicht
2. **Einladung zur Prüfung**: Community-Mitglieder werden benachrichtigt
3. **Feedback-Sammlung**: Kommentare, Korrekturvorschläge, Ergänzungen
4. **Diskussion und Konsens**: Abwägung unterschiedlicher Sichtweisen
5. **Qualitätsbewertung**: Community-Voting zur Datenqualität

### Fachliche Prüfung durch die Verwaltung
- **Freigabeprüfung**: Entscheidung über Annahme von Community-Änderungen
- **Stichprobenprüfung**: Regelmäßige Kontrolle von Community-beiträgen
- **Fehleranalyse**: Systematische Auswertung von Qualitätsproblemen
- **Prozessoptimierung**: Verbesserung von Qualitätssicherungsprozessen

## Qualitätsmetriken und Monitoring

p2d2 stellt folgende Qualitätskennzahlen bereit:

### Datenqualitäts-KPIs
- **Fehlerrate**: Anteil fehlerhafter Datensätze an Gesamtdaten
- **Vollständigkeitsgrad**: Prozentualer Anteil befüllter Pflichtattribute
- **Aktualitätsindex**: Durchschnittsalter der Daten in Tagen
- **Community-Bewertung**: Durchschnittliche Qualitätsbewertung durch Community

### Prozessqualitäts-KPIs
- **Durchlaufzeit**: Zeit von Datenbereitstellung bis Export
- **Review-Abdeckung**: Anteil der Datensätze mit Community-Review
- **Freigabequote**: Prozentualer Anteil freigegebener Community-Änderungen
- **Rückmeldequote**: Anteil der Community-Beiträge, die in Verwaltungssysteme integriert wurden

### Monitoring-Dashboards
- **Echtzeit-Übersicht**: Aktueller Status aller Datensätze
- **Qualitätstrends**: Entwicklung der Qualitätskennzahlen über Zeit
- **Problem-Hotspots**: Geografische oder thematische Schwerpunkte von Qualitätsproblemen
- **Community-Aktivität**: Beteiligungsniveau und Engagement

## Dokumentation und Nachvollziehbarkeit

### Qualitätsdokumentation
- **Qualitätsberichte**: Regelmäßige Zusammenfassung der Qualitätskennzahlen
- **Fehlerprotokolle**: Dokumentation aller erkannten Qualitätsprobleme
- **Korrekturmaßnahmen**: Geplante und durchgeführte Verbesserungen
- **Best Practices**: Sammlung erfolgreicher Qualitätssicherungsansätze

### Audit-Trail
- **Vollständige Historie**: Wer hat wann welche Änderung vorgenommen?
- **Freigabe-Protokolle**: Dokumentation aller Freigabeentscheidungen
- **Export-Logs**: Nachweis aller Synchronisationen mit externen Plattformen
- **Lizenz-Compliance**: Dokumentation der Lizenzkonformität

## Nächste Schritte für Ihre Verwaltung

1. **Qualitätsanforderungen definieren**: Legen Sie kategorie-spezifische Qualitätskriterien fest
2. **Prüfprozesse etablieren**: Integrieren Sie p2d2-Qualitätssicherung in Ihre Arbeitsabläufe
3. **Verantwortlichkeiten klären**: Benennen Sie Qualitätsverantwortliche in jedem Fachbereich
4. **Pilotierung starten**: Testen Sie die Qualitätssicherungsprozesse mit einer ausgewählten Kategorie
5. **Monitoring aufbauen**: Nutzen Sie die Qualitätskennzahlen für kontinuierliche Verbesserung

::: tip Qualitätskultur entwickeln
Qualitätssicherung ist kein einmaliger Prozess, sondern eine kontinuierliche Aufgabe. Fördern Sie eine Qualitätskultur in Ihrer Verwaltung, die Fehler als Lernchance begreift und kontinuierliche Verbesserung zum Standard macht.
:::

::: warning Wichtig
Dieses Kapitel wird kontinuierlich mit konkreten Beispielen, Checklisten und Vorlagen ergänzt. Für die Einführung eines umfassenden Qualitätsmanagementsystems in Ihrer Kommune empfiehlt sich eine individuelle Beratung durch das p2d2-Team.
:::