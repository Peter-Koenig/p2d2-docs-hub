---
title: Startseite, Karten-Onboarding und Navigation
description: Soll-Spezifikation für eine verständlichere öffentliche p2d2-Startseite, lokales Karten-Onboarding und zielgruppenorientierte Navigation
status: draft
lastUpdated: 2026-08-09
lang: de
category: spec
specid: ptf-roadmap-webauftritt-startseite
parent: ptf-roadmap-umsetzung
dependencies:
  - ../../../entwicklungshandbuch/website/startseite-und-onboarding
  - ../../../entwicklungshandbuch/architektur/eventhandling
  - ../../../entwicklungshandbuch/architektur/datenfluss
  - ../../../entwicklungshandbuch/architektur/wfs-layer-architektur
quality:
  completeness: 85
  accuracy: 85
  reviewed: false
  reviewer:
  reviewDate:
---

# Startseite, Karten-Onboarding und Navigation

Diese Spezifikation beschreibt die erste operative Maßnahme der PTF-Roadmap 2026–2027 (Arbeitspaket 1: „p2d2 verständlich machen“): Die öffentliche p2d2-Startseite soll verständlicher, einladender und besser bedienbar werden. Sie ist eine Soll-Spezifikation im Entwurfsstadium. Ihre verbindlichen Anforderungen dienen als Grundlage für die spätere Implementierung und werden vor dem Merge fachlich reviewt. Der Status `draft` bedeutet nicht, dass die im Dokument festgelegten Anforderungen unverbindlich oder frei interpretierbar sind.

## 1. Zweck

Die öffentliche Startseite soll p2d2 für Menschen aus Öffentlicher Verwaltung, OpenStreetMap-Community und Stadtgesellschaft verständlich und einladend erklären.

Sie soll zeigen:

- p2d2 beginnt mit einem konkreten Thema vor Ort,
- Öffentliche Verwaltung kann passende Daten schrittweise öffnen,
- Menschen mit Ortswissen und die OSM-Community können beitragen,
- aus diesem Zusammenspiel kann ein digitaler Zwilling von unten entstehen.

p2d2 darf dabei nicht als Datenportal beschrieben werden. Es ist ein Prozess- und Synchronisationswerkzeug.

## 2. Scope und Nicht-Ziele

### Im Scope

- Öffentliche Startseite `/`
- Hero-Claim
- Kartenüberschrift und Karten-Onboarding
- Kommunen-/Kategorien-Grids auf der Startseite
- Werte-Reihe: Umwidmung als nächste Roadmap-Aufgabe (siehe Abschnitt 9)
- Header-Navigation der öffentlichen Website
- Footer-Link zur technischen CIVITAS/CORE-Seite
- Vorbereitung der öffentlichen Zielrouten `/fuer-oev` und `/fuer-osm`
- mobile, Tastatur- und Screenreader-Anforderungen
- Abnahme- und Regressionstests

### Nicht im Scope

- Feature-Editor
- Grabflur-Editor
- Rollen- und Berechtigungsmodell
- Zitadel/OIDC
- mapState
- P2D2EventType, events.ts und Cross-Window-Bridge
- WFSLayerManager
- FeaturePopupHandler
- CQL, WFS, WFS-T, GeoServer, PostGIS, MapProxy
- OSM_Admin_Level-Logik
- CIVITAS/CORE-V1- oder V2-Integration
- Cookie-/Consent-Implementierung
- Datenschutztext, Impressum oder Privacy-UI

## 3. Bestehende Integrationsgrenzen

Die vorhandene Auswahlkette bleibt unverändert:

```text
KommunenGrid
→ KommunenClickHandler
→ P2D2EventType.KOMMUNEN_FOCUS
→ MapCanvas
→ mapState.selectedKommune
→ CRS-, Center- oder BBOX-Navigation

KategorienGrid
→ mapState.selectedCategory
→ P2D2EventType.CATEGORY_SELECTED
→ WFSLayerManager reagiert reaktiv auf mapState
```

Das Karten-Onboarding darf ausschließlich lokale UI-Interaktion verwenden.

Verboten:

- neue P2D2EventType-Werte,
- neue CustomEvent-Namen,
- neue window.dispatchEvent()-Aufrufe,
- dispatchP2D2Event(),
- dispatchCrossWindowEvent(),
- initializeCrossWindowBridge(),
- direkte Änderungen an mapState,
- Änderungen an WFSLayerManager oder FeaturePopupHandler.

Erlaubt:

- lokale DOM-Event-Listener,
- lokaler, komponentengebundener UI-State,
- CSS- und Pointer-Event-Steuerung innerhalb des Kartencontainers.

## 4. Dateigenaue spätere Implementierungsfläche

Eine spätere Implementierung darf voraussichtlich nur diese Anwendungsdateien verändern oder ergänzen:

```text
p2d2/src/pages/index.astro
p2d2/src/components/HeroSection.astro
p2d2/src/content/hero.md
p2d2/src/components/OpenLayersMap.astro
p2d2/src/components/MapCanvas.astro
p2d2/src/components/Header.astro
p2d2/src/components/Footer.astro
p2d2/src/styles/global.css
```

Eine neue Präsentationskomponente für die Werte-Reihe ist in dieser Spezifikation nicht vorgesehen; die Umwidmung ist als nächste Roadmap-Aufgabe vorgesehen und wird separat spezifiziert (siehe Abschnitt 9).

Nicht ändern:

```text
p2d2/src/utils/events.ts
p2d2/src/utils/cross-window-events.ts
p2d2/src/utils/map-state.ts
p2d2/src/utils/wfs-layer-manager.ts
p2d2/src/utils/feature-popup-handler.ts
p2d2/src/utils/kommunen-click-handler.ts

p2d2/src/components/feature-editor/*
p2d2/src/pages/feature-editor/*
p2d2/src/pages/verwaltung/grabflur-editor.astro
```

## 5. Startseiten-Reihenfolge

Die Soll-Reihenfolge der Startseite lautet:

```text
BaseLayout
→ Standard-Header
→ HeroSection
→ Karten-Sektion mit erklärender Überschrift und lokalem Onboarding
→ Kommunen-/Themen-Auswahl
→ Werte-Reihe (Umwidmung als nächste Roadmap-Aufgabe, siehe Abschnitt 9)
→ Standard-Footer
```

Die DNA-Video-Animation bleibt erhalten. Die Hauptkarte bleibt der zentrale räumliche Erlebnis- und Interaktionsbereich. Kommunen- und Kategorien-Grids bleiben funktionale Auswahlmechanismen.

## 6. Hero

Der bisherige Hero-Claim bleibt verbindlich erhalten und wird nicht geändert:

```html
# Erfassen wir den öffentlichen Datenraum</br>
<span style="color:#41C7B4;">der für uns Freiheit und Souveränität bedeutet</span>
```

`p2d2/src/content/hero.md` bleibt inhaltlich unverändert. Der in einer früheren Entwurfsfassung vorgeschlagene Claim „Gemeinsam den öffentlichen Raum sichtbar machen …“ ist verworfen und wird nicht umgesetzt.

Die Videoquellen, Größen, Animation, Bildmotive und grundlegende Hero-Struktur sind nicht Bestandteil dieser Änderung.

## 7. Karten-Sektion

### Kartenüberschrift und Einführung

Zwischen Hero und Karten-Sektion steht nur noch die bestehende Überschrift. Eine längere Einleitung mit Absatz und Schritten wird nicht auf der Seite ausgegeben:

```text
Überschrift (bestehend, unverändert):
All die Objekte, die uns umgeben - es ist unser aller Raum!
```

Die inhaltliche Erklärung wurde semantisch gekürzt in das lokale Karten-Onboarding übernommen (siehe unten). Die zuvor vorgesehenen Links „Kommune“/„Kategorie“ entfallen auf der Seite; die Tab-Umschaltung auf der Karte bleibt der funktionale Einstieg in die Auswahl.

### Lokales Karten-Onboarding

Verbindliche Definition:

- Kein seitenweites Modal.
- Kein `<dialog>`.
- Kein Fokus-Fang für die ganze Seite.
- Das Onboarding liegt ausschließlich innerhalb des Kartencontainers.
- Es dimmt nur die Karte.
- Es fängt direkte Karten-Pointer-Interaktion ab: Klick, Drag, Zoom und Touch-Interaktion erreichen OpenLayers nicht.
- Seitenscrollen bleibt möglich.
- Touch-Interaktion darf vertikales Seitenscrollen nicht blockieren.
- Der Button „Karte erkunden“ gibt die direkte Karteninteraktion frei.
- Nach Freigabe bleibt ein kleiner Hilfe-Einstieg innerhalb der Karte erreichbar.
- Der Hilfe-Einstieg öffnet die Einführung erneut.
- Das Overlay darf keine Auswahl, keine Kartenposition und keine Layer verändern.
- Das Overlay ist bewusst breit angelegt (aktuell `max-w-4xl`), damit die gekürzte Einführung lesbar bleibt.

Verbindlicher Inhalt des Onboarding-Overlays (gekürzte, semantische Übernahme der Einführung):

```text
p2d2 verbindet Daten aus öffentlichen Verwaltungen mit unserem Wissen in der OpenStreetMap - bidirektional!

1. Kommune auswählen
2. Kategorie auswählen
3. Objekte anklicken

[Button: Karte erkunden]
```

### Zusammenhang mit FeaturePopupHandler

Solange das Onboarding aktiv ist, darf der OpenLayers-Klickhandler keine Pointer-Ereignisse empfangen. FeaturePopupHandler, WFS-Prüfung, Dialog und Feature-Editor-Öffnung dürfen dadurch nicht ausgelöst werden.

Nach Freigabe muss das bestehende Kartenklick-Verhalten vollständig und unverändert funktionieren.

### Privacy- und Persistenzabhängigkeit

Fachliches Ziel:

```text
Nach Klick auf „Karte erkunden“ soll das Onboarding bei späteren Aufrufen
dauerhaft ausgeblendet bleiben.
```

Technische Einschränkung:

```text
Diese Persistenz darf erst implementiert werden, wenn eine eigenständige
Privacy-/Consent-Spezifikation die Speicherung und den Zugriff auf den
betreffenden localStorage-Key geregelt hat.
```

Bis dahin:

- kein neuer localStorage-Key,
- keine simulierte Consent-Logik,
- keine Cookie-/Consent-Banner-Implementierung,
- Onboarding nur innerhalb der aktuellen Seitenansicht freigeben.

## 8. Kommunen- und Themenauswahl

Die Auswahl-Sektion erhält keine neue Abschnittsüberschrift und keine neue Einleitung. Die bestehende Tab-Umschaltung bleibt erhalten; die sichtbaren Begriffe bleiben unverändert:

```text
Kommunen
Kategorien
```

Eine sprachliche Überarbeitung der Tab-Begriffe (z. B. „Themen entdecken“) ist nicht Bestandteil dieser Spezifikation.

Außerdem gilt:

- KommunenGrid und KategorienGrid bleiben inhaltlich und funktional erhalten.
- Die bestehenden Karten und Content Collections bleiben Datenquelle.
- Auswahl durch Grid-Klick aktualisiert weiterhin Karte, BBOX, CRS, mapState und WFS-Layer über die vorhandene Auswahlkette.
- Das Karten-Onboarding darf Grid-Auswahl nicht blockieren.
- Das doppelte DOM-ID-Vorkommen `kategorien-grid` ist bei der späteren Umsetzung zu bereinigen: Die ID bleibt am äußeren Tab-Container in index.astro; KategorienGrid.astro darf diese ID nicht zusätzlich ausgeben.
- Eine Erweiterung für mehr als zwölf Kategorien oder Kommunen ist nicht Bestandteil dieser Spezifikation.

## 9. Werte-Reihe: Umwidmung als nächste Roadmap-Aufgabe

Status: **nächste Roadmap-Aufgabe, noch nicht umgesetzt** – nicht Teil der ersten Code-Implementierung dieser Spezifikation.

Der aktuelle Zustand der Werte-Reihe (`WerteGrid`, „Offene Daten“, „Gemeinschaft“, „Transparenz“) gilt als überarbeitungswürdig. Sie soll **umgewidmet** und inhaltlich neu ausgerichtet werden, nicht unverändert bleiben. Die bestätigte Richtung ist die neue Überschrift **„Ein Thema. Eine Kommune. Viele Perspektiven.“** mit Beteiligungswegen für Menschen mit Ortswissen, Öffentliche Verwaltung und die OSM-Community.

Da die Aufgabe zum Zeitpunkt dieser Spezifikation noch nicht erreicht ist, bleiben `WerteGrid.astro`, `src/content/werte/*` und die Einbindung in `index.astro` im Rahmen dieser Spezifikation unverändert. Die konkrete Umwidmung (Komponente, Inhalte, Verlinkung auf `/mitmachen`, `/fuer-oev`, `/fuer-osm`) wird in einer eigenen Folge-Spezifikation verbindlich festgelegt (siehe Abschnitt 14).

## 10. Header-Navigation

Die öffentliche Hauptnavigation ist verbindlich:

```text
Entdecken · Mitmachen · Für ÖV · Für OSM · Über p2d2 · Kontakt
```

Jeder Eintrag braucht eine sichtbare Kurzbezeichnung, einen vollständigen `aria-label`, eine Erklärung für Desktop-Hover und Tastaturfokus sowie eine sichtbare Erklärung im mobilen Menü.

| Sichtbar | aria-label und Erklärung | Ziel |
|---|---|---|
| Entdecken | p2d2 entdecken | `/#entdecken` |
| Mitmachen | Bei p2d2 mitmachen | `/mitmachen` |
| Für ÖV | Für die Öffentliche Verwaltung | `/fuer-oev` |
| Für OSM | Für die OSM-Community | `/fuer-osm` |
| Über p2d2 | Über p2d2 | Dropdown |
| Kontakt | Kontakt zu p2d2 | `/kontakt` |

Zusätzlich gilt:

- „Für ÖV“ steht für Öffentliche Verwaltung, nicht für öffentlichen Verkehr.
- Desktop-Erklärungen dürfen nicht ausschließlich als HTML-title implementiert werden.
- Tooltips müssen bei Hover und Tastaturfokus sichtbar sein.
- Mobile-Menüs müssen die Erklärung sichtbar als Untertitel oder gleichwertige Textinformation anzeigen.
- Die bestehenden geschützten Arbeitsbereiche bleiben zusätzlich und rollenabhängig:
  - Verwaltung → /verwaltung
  - OSM → /osm
- Die geschützten Arbeitsbereiche sind keine Ziele der öffentlichen Menüpunkte „Für ÖV“ und „Für OSM“.

### Ankerziel „Entdecken“

Der äußere Abschnitt der Karten-Sektion in OpenLayersMap.astro erhält bei der späteren Implementierung die eindeutige DOM-ID `entdecken`.

Der Header-Link „Entdecken“ verweist auf `/#entdecken`.

Die ID `map` bleibt ausschließlich der technische OpenLayers-Target-Container in MapCanvas.astro und wird nicht als Navigationsanker umgewidmet.

### Über-p2d2-Dropdown

Zielstruktur:

```text
Über p2d2
- Hintergrund
- Ziel
- Status
- Umsetzung
- Zukunft
- Tests
```

„Ziel“ bleibt im Dropdown, sobald der zugehörige Seiteninhalt überarbeitet und mit dem Entwicklungsstrategie-Handbuch abgeglichen ist.

`CIVITAS/CORE` wird aus diesem öffentlichen Dropdown entfernt.

Die inhaltliche Bereinigung, Umbenennung oder Zusammenlegung der weiteren Über-p2d2-Seiten ist nicht Bestandteil dieser Spezifikation.

## 11. Footer

- Die CIVITAS/CORE-Seite `/ueber/civitas-core` bleibt unverändert erreichbar.
- Sie wird aus dem Header-Dropdown entfernt.
- In `Footer.astro` wird die bestehende Überschrift „Ressourcen“ in „Technisches & Ressourcen“ umbenannt.
- Unterhalb der Repository-Links wird ein zusätzlicher interner Link ergänzt:

```text
CIVITAS/CORE: technische Einordnung
→ /ueber/civitas-core
```

- Dokumentationslinks nach doc.data-dna.eu/de/ und /en/ bleiben erhalten.
- Repositories, Förderpartner und Legal-Links bleiben erhalten.

## 12. Öffentliche Zielrouten

Die späteren Routen `/fuer-oev` und `/fuer-osm` sind Teil der öffentlichen Informationsarchitektur, aber nicht Teil der ersten Code-Implementierung dieser Startseiten-Spezifikation.

Vor einer Header-Änderung müssen diese Routen entweder:

- implementiert sein oder
- in einer unmittelbar folgenden, eigenen Spezifikation verbindlich erstellt werden.

Es dürfen keine Header-Links auf nicht existierende öffentliche Routen ausgeliefert werden.

## 13. Abnahme- und Regressionstests

Mindestens diese Abnahmekriterien:

1. Die öffentliche Startseite erklärt p2d2 ohne Einstieg über WFS, CQL, OSM_Admin_Level, GeoServer, PostGIS oder Editor-Interna.

2. Hero-Video, Hauptkarte, Kommunen-Grid und Themen-Grid bleiben sichtbar und funktional.

3. Bei aktivem Karten-Onboarding:
   - Mausrad über der Karte zoomt die Karte nicht.
   - Dragging bewegt die Karte nicht.
   - Klicks lösen FeaturePopupHandler nicht aus.
   - Die Seite bleibt normal scrollbar.
   - Grid-Auswahl bleibt bedienbar und aktualisiert die Karte weiterhin.

4. Nach Klick auf „Karte erkunden“:
   - direkte OpenLayers-Interaktion funktioniert wieder,
   - FeaturePopupHandler und bestehender Editorpfad funktionieren unverändert,
   - Hilfe kann die Einführung erneut anzeigen.

5. Keine Änderungen an:
   - events.ts,
   - cross-window-events.ts,
   - map-state.ts,
   - wfs-layer-manager.ts,
   - feature-popup-handler.ts,
   - Editor-Dateien,
   - Rollen- und Authentifizierungslogik.

6. Kommunen-/Themenauswahl nutzt weiterhin die bestehende Event-, mapState- und WFS-Kette.

7. `kategorien-grid` existiert nach späterer Implementierung nur einmal als DOM-ID.

8. Header:
   - Desktop: Tooltip bei Hover und Tastaturfokus,
   - Mobile: sichtbare Erklärung,
   - nicht angemeldet: Anmelden,
   - angemeldet: Profil-/Abmelde-Menü,
   - passende Rollen: zusätzliche Arbeitsbereiche Verwaltung und OSM.

9. CIVITAS/CORE ist nicht mehr im Header-Dropdown, aber im Footer direkt erreichbar.

10. Die neue Onboarding-Persistenz schreibt bis zur Privacy-/Consent-Spezifikation keinen neuen localStorage-Key.
11. Der Hero-Claim bleibt unverändert („Erfassen wir den öffentlichen Datenraum …“).
12. Zwischen Hero und Karten-Sektion steht nur die bestehende Überschrift („All die Objekte, die uns umgeben - es ist unser aller Raum!“); die Einführung steht gekürzt im Onboarding-Overlay.
13. Die Auswahl-Sektion erhält keine neue Abschnittsüberschrift; die Tab-Begriffe bleiben unverändert „Kommunen“/„Kategorien“.
14. Die Werte-Reihe wird durch diese Spezifikation nicht verändert; ihre Umwidmung bleibt als nächste Roadmap-Aufgabe vorgesehen.

## 14. Abhängige Folge-Spezifikationen

Folgende Spezifikationen sind abhängig, werden aber mit dieser Datei nicht angelegt:

- Privacy-/Consent- und Storage-Spezifikation
- Öffentliche Zielseite „Für ÖV“
- Öffentliche Zielseite „Für OSM“
- Spezifikation zur Umwidmung der Werte-Reihe (nächste Roadmap-Aufgabe, siehe Abschnitt 9)
- detaillierte Implementierungsspezifikation für Karten-Onboarding
- detaillierte Content- und Migrationsspezifikation für öffentliche Seiten

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-06 | Erstanlage: Soll-Spezifikation für Startseite, Karten-Onboarding und Navigation. |
| 1.1 | 2026-08-06 | Präzisierung: Entwurfsstatus verbindlich formuliert, Ankerziel „Entdecken“ (DOM-ID `entdecken`) definiert, Beteiligungssektion als `ParticipationSection.astro` benannt, Footer-Änderung dateigenau festgelegt (Überschrift „Technisches & Ressourcen“, Link unterhalb der Repository-Links). |
| 1.2 | 2026-08-09 | Anpassung an umgesetzten Stand: Hero-Claim bleibt der bisherige (neuer Claim verworfen); Karten-Sektion nur mit bestehender Überschrift, Einführung gekürzt in das verbreiterte Onboarding-Overlay übernommen; keine neuen Abschnittsüberschriften in der Auswahl-Sektion; Werte-Reihe wird umgewidmet statt ersetzt (`ParticipationSection` entfällt, eigene Folge-Spezifikation). |
| 1.3 | 2026-08-09 | Klarstellung Werte-Reihe: Umwidmung ist die nächste Roadmap-Aufgabe und noch nicht umgesetzt; der Status quo gilt als überarbeitungswürdig; bestätigte Richtung „Ein Thema. Eine Kommune. Viele Perspektiven.“; Formulierungen „bleibt erhalten“ und „ParticipationSection entfällt“ korrigiert. |
| 1.4 | 2026-08-09 | Zielstruktur korrigiert: „Ziel“ bleibt im Über-p2d2-Dropdown, nachdem der Seiteninhalt überarbeitet wurde. |
