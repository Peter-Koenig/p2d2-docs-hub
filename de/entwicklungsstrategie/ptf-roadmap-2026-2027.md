---
title: PTF-Roadmap 2026–2027
description: Aktuelle Roadmap von p2d2 – Website, Kommunen-Ansprache, Grabflur-Pilot, CIVITAS/CORE V1 und Evidenz für die Prototype-Fund-Second-Stage
status: active
lastUpdated: 2026-08-11
quality:
  completeness: 70
  accuracy: 80
  reviewed: false
  reviewer: null
  reviewDate: null
---

# PTF-Roadmap 2026–2027

Diese Roadmap beschreibt die aktuelle Entwicklungsrichtung von p2d2. Sie verbindet Produktentwicklung, kommunale Erprobung und die mögliche Integration in CIVITAS/CORE.

Sie ist kein Katalog verbindlich zugesagter Funktionen und kein Ersatz für technische Spezifikationen. Entscheidungen, die noch nicht getroffen sind, werden als **in Prüfung** oder **geplant** gekennzeichnet.

## Leitidee

p2d2 unterstützt Kommunen dabei, Fachverfahren schrittweise mit der Öffentlichkeit zu verbinden. Der Einstieg beginnt nicht mit einem starren Datenkatalog, sondern mit einem konkreten Thema vor Ort:

::: tip Ein digitaler Zwilling entsteht, wenn möglichst oft drei Dinge zusammen kommen:
1. Das kommunale Fachverfahren, das geteilt werden soll
2. freigabefähige Daten
3. Menschen mit lokalem Interesse

**Ergebnis:** ein belastbarer Baustein für den **digitalen Zwilling von unten**
:::

Ein einzelnes Thema ist dabei noch kein vollständiger digitaler Zwilling. Der digitale Zwilling entsteht schrittweise: Wenn zunehmend mehr kommunale Fachverfahren ihre Daten verantwortet und dauerhaft mit OpenStreetMap abgleichen, wächst aus vielen fachlichen Bausteinen eine gemeinschaftlich gepflegte, immer vollständigere Abbildung der Kommune in der OpenStreetMap.

Grabfluren bieten sich als Einstieg an, sind aber nicht zwingend vorgeschrieben. Weitere Themen entstehen dort, wo eine Kommune Daten bereitstellen möchte und Menschen – aus Verwaltung, Stadtgesellschaft, OpenStreetMap-Community, Vereinen oder Bildung – sich für das Thema engagieren. Die Themenwahl selbst ist Gegenstand eines Dialogs zwischen Kommune und Bürgerschaft.

## Aktueller Fokus

Die nächsten Schritte folgen bewusst einer Reihenfolge. Zuerst muss p2d2 für Kommunen, OpenStreetMap-Community und interessierte Menschen verständlich und einladend sein. Die technische CIVITAS/CORE-Integration folgt als zweiter Schritt und wird durch Rückmeldungen aus der Ansprache und möglichen Pilotvorhaben konkretisiert.

```text
p2d2 verständlich machen
        ↓
Kommunen und Multiplikatoren ansprechen
        ↓
CIVITAS/CORE V1 vollständig konfigurierbar aufbauen
        ↓
p2d2 als V1-AddOn erproben
        ↓
Ergebnisse, Partnerinteresse und Entscheidungen dokumentieren
        ↓
Antrag für die Prototype-Fund-Second-Stage
```

## Arbeitspaket 1: p2d2 verständlich machen

**Status:** abgeschlossen

Die öffentliche Website soll erklären, warum p2d2 sinnvoll ist und wie Menschen sowie Kommunen mit einem eigenen Thema beginnen können. Die Karte und die bestehenden Auswahlmöglichkeiten bleiben das Zentrum der Seite.

### Ziele

- Den Begriff **„digitaler Zwilling von unten“** verständlich erklären.
- Den Nutzen für Kommunen, OpenStreetMap-Community und interessierte Menschen sichtbar machen.
- Die Nutzung der Hauptkarte und der Kommunen-/Themen-Auswahl ohne technische Vorbildung verständlich machen.
- Unbeabsichtigte Karteninteraktion beim Scrollen vermeiden.
- Technische Detailseiten erreichbar halten, aber aus dem ersten Eindruck herausnehmen.

### Geplante Maßnahmen

- Einstieg über DNA-Visualisierung, öffentliche Orte und die Idee zweier souveräner Datenstränge beibehalten.
- Lokales Einführungs-Overlay über der Hauptkarte: Karte zunächst gegen unbeabsichtigtes Zoomen und Dragging schützen, Scrolling der Seite weiterhin ermöglichen.
- Karte als Weg erklären: Kommune oder Thema auswählen, Orte erkunden, Wissen beitragen.
- Kommunen- und Themen-Grids als Einstieg in konkrete lokale Themen gestalten.
- Die bisherige, nicht zielgruppengerechte Reihe unter den Grids durch eine Beteiligungssektion ersetzen.
- Hauptnavigation an der Nutzung ausrichten: `Entdecken`, `Mitmachen`, `Für Kommunen`, `Für OSM`, `Über p2d2`, `Kontakt`.
- Die technische Seite zu CIVITAS/CORE aus dem Hauptmenü in den Footer unter „Technisches & Ressourcen“ verschieben.
- Die Handbücher unter [doc.data-dna.eu](https://doc.data-dna.eu/de/) als Vertiefung verlinken.

### Erfolgskriterium

Eine Person soll nach kurzem Besuch der Startseite beantworten können:

1. Was ist p2d2?
2. Warum ist es für einen konkreten Ort oder ein lokales Thema nützlich?
3. Wie kann eine Kommune, eine OSM-Community oder eine interessierte Person beginnen?

## Arbeitspaket 2: Kommunen und Multiplikatoren gewinnen

**Status:** in Arbeit

Die Website-Überarbeitung (Arbeitspaket 1) ist abgeschlossen; die Ansprache von Kommunen und Multiplikatoren hat begonnen.

Die überarbeitete Website wird als verständliche Grundlage für Gespräche mit Kommunen und Multiplikatoren genutzt. Ziel ist nicht die sofortige flächendeckende Einführung, sondern die Validierung eines ersten lokalen Themas und eines tragfähigen Beteiligungsprozesses.

### Zielgruppen

- Kommunen und kommunale Fachämter
- Open-Data- und Geodaten-Netzwerke
- lokale und überregionale OpenStreetMap-Community
- Organisationen und Multiplikatoren, etwa im Umfeld von Open Data, kommunaler Digitalisierung und Geodateninfrastruktur
- interessierte Vereine, Initiativen, Bildungseinrichtungen und Fachgemeinschaften

### Gesprächsfrage

> Welches Thema möchte Ihre Kommune gemeinsam mit Menschen vor Ort besser sichtbar und langfristig pflegbar machen?

### Erwartete Ergebnisse

- Gespräche mit potenziellen Pilotkommunen und Multiplikatoren
- identifizierte Fachverfahren und mögliche offene Datensätze
- Rückmeldungen zu Datenqualität, Rollen, Beteiligung und Betriebsmodell
- Austausch mit der OSM-Community über Datenmodell, Herkunft, Review und Export
- nach Möglichkeit eine schriftliche Interessenbekundung, ein Letter of Intent oder eine Pilot-Skizze

## Arbeitspaket 3: Pilot „Digitalisierung von Grabfluren“

**Status:** Vorschlag für Pilotkommunen und Fachgespräche

Grabfluren sind ein naheliegender, aber **nicht zwingender** Einstieg: Sie sind räumlich klar abgrenzbar, haben kommunale Fachverantwortung und können für Geschichte, Erinnerungskultur, Friedhofsverwaltung sowie lokale Kartierung relevant sein. Welches Thema eine Kommune letztlich bearbeitet, entscheidet sich im verwaltungsinternen und bürgerschaftlichen Dialog.

### Ziel

Eine Kommune erprobt, wie Grabflur-Daten aus ihrem Fachkontext schrittweise geöffnet, geprüft und mit OpenStreetMap sowie lokalem Wissen in Beziehung gesetzt werden können.

### Zu klärende Fragen

- Welche Grabflur- und Friedhofsdaten dürfen unter welchen Bedingungen bereitgestellt werden?
- Welche Rolle übernehmen Friedhofsverwaltung, weitere kommunale Stellen und lokale Interessierte?
- Welche Daten gehören in OpenStreetMap, welche bleiben Verwaltungsdaten, und wie werden Unterschiede nachvollziehbar gemacht?
- Wie kann eine INSPIRE-Referenz – beispielsweise über `de:inspireid` – fachlich korrekt und mit der OSM-Community abgestimmt verwendet werden?
- Wie soll der Rückweg von Referenzen oder Änderungen in kommunale Prozesse aussehen?

Die konkrete technische und fachliche Ausgestaltung wird erst nach Abstimmung mit Pilotkommune und OSM-Community festgelegt.

## Arbeitspaket 4: CIVITAS/CORE V1 als Erweiterungsplattform

**Status:** in Arbeit (Schritt 4.3 aktiv; Schritte 4.1, 4.2 und 4.4 beginnen erst nach der ersten kommunikativen und fachlichen Validierung)

p2d2 soll weiterhin eigenständig betreibbar bleiben. Parallel wird geprüft und erprobt, wie p2d2 als AddOn in CIVITAS/CORE V1 integriert werden kann. Dieses Arbeitspaket läuft nicht strikt nach Arbeitspaket 2 und 3, sondern parallel dazu: Die Ansprache von Kommunen und Multiplikatoren sowie der Grabflur-Pilot sind operative Tätigkeiten (Anschreiben, Gespräche, Veranstaltungen), während dieses Arbeitspaket die technische Integrationsfähigkeit vorbereitet.

Der Weg gliedert sich in vier Schritte:

### Schritt 4.1: Installationsscript auf volle Konfigurationsfreiheit umstellen

**Status:** in Arbeit (Build+Deploy-Testlauf erfolgreich; E2E-Abnahme-Checks und fachliche Prüfung stehen noch aus)

Die derzeitige V1-Installation (`civitas_einrichtung/install_civitas_core_V1.sh`) nutzt eine S3-orientierte Auslieferungsvariante. Diese wird auf die vollständig konfigurierbare V1-Variante umgestellt. Erst dadurch entsteht die technische Voraussetzung, eigene Dienste, Routen, Rollen und Geodatenkomponenten kontrolliert einzubinden.

Die V1s-Buildvariante (statische, imagebasierte Masterportal-Konfiguration, inkl. Entfernung der RustFS/S3-Abhängigkeit) ist implementiert. Der Schritt bleibt „in Arbeit“: Am 2026-08-31 lief der vollständige Build+Deploy-Testlauf im isolierten Testsystem erstmals erfolgreich durch (Keycloak, Apisix, Geoserver, Masterportal, Portal-Backend, pgAdmin, Superset, Prometheus/Loki/Grafana, gültige Let's-Encrypt-Zertifikate; Beleg in `ai-runs/2026-08-31-v1s-installationsskript-lauffaehig`). Die E2E-Abnahme-Checks in den Verify-Modulen und die fachliche Prüfung der Masterportal-Konfigurationsdateien im Soft-Fork-Repo stehen noch aus.

### Schritt 4.2: p2d2 in CIVITAS/CORE V1 integrieren

**Status:** geplant

p2d2-Standalone nutzt für den Login **Zitadel** („Account anlegen“ und OIDC, beispielsweise mit OpenStreetMap). Für die V1-AddOn-Variante wird die Identitäts- und Rollenverwaltung von Zitadel auf **Keycloak/OIDC** umgestellt.

Technische Ziele:

- Reproduzierbare vollständige CIVITAS/CORE-V1-Installation.
- p2d2-Frontend als eigener Deployment-/Helm-Baustein.
- MapProxy als eigener Deployment-/Helm-Baustein.
- Geeignete PostgreSQL-/PostGIS-Strukturen für p2d2.
- Geeignete GeoServer-Workspaces, Datenquellen, Layer und Rechte.
- OIDC-/Keycloak-Integration mit klarer Abbildung der p2d2-Rollen und Metadaten.
- Gateway-/Ingress-Routing für p2d2-Dienste.
- Wiederholbare Installation, Verifikation, Upgrade- und Rückbaupfade.

Ziel ist, für Kommunen attraktiv zu sein, die bereits CIVITAS/CORE V1 einsetzen und voraussichtlich im Laufe des Jahres 2027 zu V2 migrieren.

### Schritt 4.3: Qualitätssicherungsprozess und OSM-Export fertigstellen

**Status:** in Arbeit (technisch weit fortgeschritten, noch nicht final)

Der Weg von der Bearbeitung über die interne Qualitätssicherung bis zum tatsächlichen Export nach OpenStreetMap ist technisch weit vorbereitet: Zustands-Workflow für jede editierbare Einheit, Authentifizierung und Rollen (editor, qs1_reviewer, qs2_reviewer, export_admin), WFS-T-Anbindung zum Speichern sowie differenzielle GeoJSON-Zwischenstände zur Absicherung bei Verbindungsabbrüchen. Final implementiert ist dieser Weg bis zum OSM-Export noch nicht. Die Fertigstellung ist Voraussetzung dafür, Kommunen nicht nur für die Datenerfassung, sondern auch für eine verlässliche Begleitung des gesamten Wegs bis zum OSM-Export gewinnen zu können.

### Schritt 4.4: Feedback-Zyklus mit Kommunen vorbereiten

**Status:** in Prüfung

Der eigentliche Feedback-Zyklus – laufende Rückmeldungen aus OSM-Community und Verwaltung in einen dauerhaften Pflegeprozess – soll gemeinsam mit einer Pilotkommune entwickelt werden, sobald eine solche gewonnen ist (siehe Arbeitspaket 3). Architektonisch muss bereits vor einer Pilotkommune vorbereitet sein, worauf ein solcher Zyklus aufsetzen kann; ein eigenständiger, fertiger Feedback-Mechanismus existiert noch nicht.

### Architekturprinzip

p2d2 bleibt fachlich eigenständig. Eine CIVITAS/CORE-Integration darf nicht dazu führen, dass p2d2-spezifische Datenmodelle, Workflows und Standalone-Fähigkeit unkontrolliert von CIVITAS/CORE-spezifischen APIs oder Prozessen abhängig werden.

Die technische Referenzdokumentation liegt unter:

- [Serveraufbau CIVITAS/CORE V1](../specs/civitas-core-plugin/serveraufbau-v1/)

## Arbeitspaket 5: Dokumentation und Evidence Log

**Status:** fortlaufend

Die Roadmap wird bei jedem wesentlichen Schritt aktualisiert. Sie ist zugleich Kontext für Entwicklung, Reviews und Förderanträge.

### Dokumentationsregeln

- Tatsachen, laufende Arbeiten, geplante Schritte und offene Entscheidungen klar unterscheiden.
- Keine unbelegten Reichweiten-, Nutzer- oder Kommunenzahlen aufnehmen.
- Keine Architekturentscheidung als beschlossen dokumentieren, solange sie noch in Prüfung ist.
- Technische Details in den zugehörigen Spezifikationen pflegen; diese Seite dokumentiert Zweck, Reihenfolge, Abhängigkeiten und Ergebnisse.
- Jede Änderung mit Datum, Anlass, Ergebnis und gegebenenfalls Link auf Issue, Merge Request, Test oder externe Rückmeldung ergänzen.

### Fortschrittslog

| Datum | Arbeitspaket | Ergebnis | Status / Nachweis |
|---|---|---|---|
| 2026-08-05 | Roadmap | Roadmap auf den aktuellen Fokus „p2d2 verständlich machen → kommunal validieren → CIVITAS/CORE V1 integrieren“ ausgerichtet | Ersetzt die frühere zeit- und funktionsgetriebene Roadmap |
| 2026-08-05 | Strategie-Handbuch | Neustrukturierung des Strategie-Handbuchs; diese Roadmap wird als PTF-Roadmap 2026–2027 geführt | Ersetzt `roadmap_bis_2025.md` im Archiv; Querverweise und Links auf die VitePress-Struktur angepasst |
| 2026-08-26 | Arbeitspaket 4.1 | V1s-Buildvariante implementiert (statische/imagebasierte Masterportal-Konfiguration, RustFS/S3 entfernt); Status auf „in Arbeit“ gesetzt | Verweis auf `ai-runs/2026-08-26-civitas-v1s-s3-entfernen` und `ai-runs/2026-08-26-civitas-v1s-doku-aktualisierung` |
| 2026-08-31 | Arbeitspaket 4.1 | V1s-End-to-End-Testlauf bis Task 124 von >100 (Abbruch bei APISIX-Installation); Monitoring/Prometheus wegen fehlender Prometheus-Operator-CRDs befristet deaktiviert, Nachrüstung als offene Aufgabe dokumentiert | Verweis auf `ai-runs/2026-08-31-v1s-docker-purge-cleanup-bugfix` |
| 2026-08-31 | Arbeitspaket 4.1 | Vollständiger V1s-Testlauf erstmals erfolgreich (alle Kernkomponenten stabil, Monitoring produktiv aktiviert, gültige Let's-Encrypt-Zertifikate) | Verweis auf `ai-runs/2026-08-31-v1s-installationsskript-lauffaehig` |

## Perspektive nach der V1-Erprobung

**Status:** noch nicht entschieden

Erst auf Basis von Erfahrungen mit Nutzerkommunen, dem V1-AddOn und der kommunalen Betriebsrealität wird entschieden, wie p2d2 an CIVITAS/CORE V2 anschließen soll. CIVITAS/CORE V2 bringt voraussichtlich erweiterte Prozessmanagement-Fähigkeiten mit; für p2d2 stellt sich dann die Frage, wie die eigenen Workflow-Prozesse (Session-Lifecycle, mehrstufige Qualitätssicherung) mit dem Prozessmanagement von V2 zusammengeführt werden, statt dauerhaft parallel dazu zu bestehen. Mögliche Themen sind Prozessmanagement, Modell- und Datenmanagement, Identitäten, Rollen und AddOn-Lifecycle.

Parallel kann die langfristige Verstetigung vorbereitet werden: offene Governance, ein Anwenderverein, professionelle Unterstützungsangebote und eine europäische Zusammenarbeit. Diese Perspektive ist kein kurzfristiges Lieferziel dieser Roadmap.

## Weiterführende Dokumente

- [PTF-Roadmap, AP 1: Startseite, Karten-Onboarding und Navigation](../specs/ptf-roadmap-umsetzung/webauftritt-startseite/)
- [PTF-Roadmap, AP 4: CIVITAS/CORE V1, Statische Masterportal-Konfiguration](../specs/ptf-roadmap-umsetzung/civitas-core-v1-statische-masterportal-konfiguration/)
- [PTF-Roadmap, AP 4: p2d2 als CIVITAS/CORE-V1-AddOn](../specs/ptf-roadmap-umsetzung/p2d2-civitas-core-v1-addon/)
- [CIVITAS/CORE V1: Serveraufbau](../specs/civitas-core-plugin/serveraufbau-v1/)
- [CIVITAS/CORE: technische Einordnung](../specs/civitas-core-plugin/)
- [Leitbild und Prinzipien](./leitbild-und-prinzipien)
- [Kommunale Einführung in Deutschland](./kommunale-einfuehrung-deutschland)
- [CIVITAS/CORE und Plattformstrategie](./civitas-core-und-plattformstrategie)
- [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen)
- [Benutzerhandbuch](../benutzerhandbuch/)
- [Administrationshandbuch](../administrationshandbuch/)

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-05 | Neufassung: aktuelle Roadmap mit Website-Überarbeitung, kommunaler Validierung, Grabflur-Pilot, CIVITAS/CORE-V1-Integration und fortlaufender Evidenzdokumentation |
| 1.1 | 2026-08-05 | Übernahme in das neustrukturierte Strategie-Handbuch als PTF-Roadmap 2026–2027; Links und Querverweise an die VitePress-Struktur angepasst |
| 1.2 | 2026-08-05 | Leitidee präzisiert: Ein kommunales Fachverfahren ist ein belastbarer Baustein für den digitalen Zwilling von unten; der digitale Zwilling entsteht schrittweise, wenn viele Fachverfahren ihre Daten verantwortet und dauerhaft mit OpenStreetMap abgleichen. Formel als hervorgehobene Admonition-Box formatiert |
| 1.3 | 2026-08-05 | Formel-Darstellung in der Leitidee finalisiert: nummerierte Liste und neuer Admonition-Titel; Abschlussabsatz auf die gekürzte Fassung ohne 1:1-Zielbild angeglichen |
| 1.4 | 2026-08-05 | IAM-Sachstand ergänzt (Standalone: Zitadel mit „Account anlegen“ und OIDC, z. B. OpenStreetMap; AddOn: Umstellung auf Keycloak/OIDC); Grabflur-Pilot als naheliegend, aber nicht zwingend präzisiert; Themenwahl im Dialog zwischen Kommune und Bürgerschaft |
| 1.5 | 2026-08-09 | Arbeitspaket 4 in vier Schritte gegliedert (Installationsscript, CIVITAS/CORE-V1-Integration, QS-Prozess/OSM-Export, Feedback-Zyklus); Perspektive V2 um Prozessmanagement-Zusammenführung präzisiert. |
| 1.6 | 2026-08-09 | Satz in Schritt 4.2 präzisiert: Kommunen, die CIVITAS/CORE V1 einsetzen, migrieren voraussichtlich im Laufe des Jahres 2027 zu V2. |
| 1.7 | 2026-08-10 | Status aktualisiert: Arbeitspaket 1 abgeschlossen, Arbeitspaket 2 und das Gesamtpaket 4 auf 'in Arbeit' gesetzt (Teilschritt-Status von AP4 unverändert granular). |
| 1.8 | 2026-08-11 | Verweise auf die Umsetzungs-Spezifikationen ergänzt: Startseite, Karten-Onboarding und Navigation; CIVITAS/CORE V1: Statische Masterportal-Konfiguration; p2d2 als CIVITAS/CORE-V1-AddOn. |
