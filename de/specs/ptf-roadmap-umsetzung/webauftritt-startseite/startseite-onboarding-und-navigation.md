---
title: Startseite, Karten-Onboarding und Navigation
description: Soll-Spezifikation für eine verständlichere öffentliche p2d2-Startseite, lokales Karten-Onboarding und zielgruppenorientierte Navigation
status: draft
lastUpdated: 2026-08-06
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
- Ersatz des WerteGrid auf der Startseite
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

Zusätzlich darf später ausschließlich für den Ersatz der bisherigen Startseiten-SLOP-Reihe eine neue, klar benannte Präsentationskomponente unter `p2d2/src/components/` angelegt werden.

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
→ Beteiligungssektion „Ein Thema. Eine Kommune. Viele Perspektiven.“
→ Standard-Footer
```

Die DNA-Video-Animation bleibt erhalten. Die Hauptkarte bleibt der zentrale räumliche Erlebnis- und Interaktionsbereich. Kommunen- und Kategorien-Grids bleiben funktionale Auswahlmechanismen.

## 6. Hero

Verbindlicher Hero-Claim:

```html
# Gemeinsam den öffentlichen Raum sichtbar machen</br>
<span style="color:#41C7B4;">Mit Wissen aus der Öffentlichen Verwaltung, OpenStreetMap und vor Ort.</span>
```

Die spätere Implementierung ersetzt dafür ausschließlich den Inhalt von:

```text
p2d2/src/content/hero.md
```

Die Videoquellen, Größen, Animation, Bildmotive und grundlegende Hero-Struktur sind nicht Bestandteil dieser Änderung.

## 7. Karten-Sektion

### Kartenüberschrift und Einführung

Die Karten-Sektion erhält eine verständliche Einleitung mit diesem Inhalt:

```text
Überschrift:
Entdecke den öffentlichen Raum

Text:
p2d2 verbindet Daten aus der Öffentlichen Verwaltung mit Wissen von Menschen
vor Ort und OpenStreetMap. Wähle eine Kommune oder ein Thema und entdecke,
welche Orte bereits sichtbar sind.

Schritte:
1. Kommune oder Thema auswählen
2. Orte auf der Karte entdecken
3. Wissen beitragen und Daten gemeinsam weiterentwickeln
```

Die vorhandenen Links „Kommune“ und „Kategorie“ dürfen funktional erhalten bleiben, müssen aber in diese verständliche Einführung integriert werden.

### Lokales Karten-Onboarding

Verbindliche Definition:

- Kein seitenweites Modal.
- Kein <dialog>.
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

Definition:

```text
Abschnittsüberschrift:
Finde dein Thema oder deinen Ort

Einleitung:
Jede Öffentliche Verwaltung beginnt mit dem Thema, das vor Ort wichtig ist.
Wähle einen Ort, um seinen öffentlichen Raum zu entdecken – oder ein Thema,
das dich interessiert.
```

Die bestehende Tab-Umschaltung bleibt erhalten. Sichtbare Begriffe:

```text
Kommunen entdecken
Themen entdecken
```

Außerdem gilt:

- KommunenGrid und KategorienGrid bleiben inhaltlich und funktional erhalten.
- Die bestehenden Karten und Content Collections bleiben Datenquelle.
- Auswahl durch Grid-Klick aktualisiert weiterhin Karte, BBOX, CRS, mapState und WFS-Layer über die vorhandene Auswahlkette.
- Das Karten-Onboarding darf Grid-Auswahl nicht blockieren.
- Das doppelte DOM-ID-Vorkommen `kategorien-grid` ist bei der späteren Umsetzung zu bereinigen: Die ID bleibt am äußeren Tab-Container in index.astro; KategorienGrid.astro darf diese ID nicht zusätzlich ausgeben.
- Eine Erweiterung für mehr als zwölf Kategorien oder Kommunen ist nicht Bestandteil dieser Spezifikation.

## 9. Ersatz der Werte-Reihe

`WerteGrid` wird auf der Startseite durch eine neue Beteiligungssektion ersetzt. Die Werte-Collection und die Komponente `WerteGrid.astro` werden nicht gelöscht, weil sie außerhalb der Startseite weiterverwendbar bleiben können.

Für den Ersatz von WerteGrid wird ausschließlich diese neue Komponente angelegt:

p2d2/src/components/ParticipationSection.astro

index.astro:
- entfernt den Import und die Verwendung von WerteGrid auf der Startseite,
- importiert ParticipationSection,
- rendert ParticipationSection an derselben Position nach dem Grid-Container.

WerteGrid.astro und src/content/werte/* werden nicht geändert oder gelöscht.

Verbindlicher Inhalt der neuen Sektion:

```text
Überschrift:
Ein Thema. Eine Kommune. Viele Perspektiven.

Einleitung:
p2d2 beginnt dort, wo ein Thema vor Ort wichtig ist. Eine Öffentliche Verwaltung
kann passende Daten schrittweise öffnen. Menschen mit Ortswissen, lokale Gruppen
und die OpenStreetMap-Community können helfen, sie zu verstehen, zu prüfen und
weiterzuentwickeln.

Karte 1:
Ich kenne Orte und Geschichten
Lokales Wissen sichtbar machen
Ziel: /mitmachen

Karte 2:
Ich arbeite mit öffentlichen Daten
Ein Fachverfahren als gemeinsames Thema öffnen
Ziel: /fuer-oev

Karte 3:
Ich mappe mit OpenStreetMap
Daten prüfen, ergänzen und gemeinsam weiterentwickeln
Ziel: /fuer-osm
```

Die neue Sektion darf keine Aussagen über bereits verfügbare Beteiligungsfunktionen enthalten, die nicht durch den aktuellen Code oder separate öffentliche Zielseiten gedeckt sind.

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
- Status
- Umsetzung
- Zukunft
- Tests
```

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

## 14. Abhängige Folge-Spezifikationen

Folgende Spezifikationen sind abhängig, werden aber mit dieser Datei nicht angelegt:

- Privacy-/Consent- und Storage-Spezifikation
- Öffentliche Zielseite „Für ÖV“
- Öffentliche Zielseite „Für OSM“
- detaillierte Implementierungsspezifikation für Karten-Onboarding
- detaillierte Content- und Migrationsspezifikation für öffentliche Seiten

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.1 | 2026-08-06 | Präzisierung: Entwurfsstatus verbindlich formuliert, Ankerziel „Entdecken“ (DOM-ID `entdecken`) definiert, Beteiligungssektion als `ParticipationSection.astro` benannt, Footer-Änderung dateigenau festgelegt (Überschrift „Technisches & Ressourcen“, Link unterhalb der Repository-Links). |