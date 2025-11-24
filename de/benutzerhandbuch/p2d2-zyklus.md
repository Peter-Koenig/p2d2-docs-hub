---
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-24
---

# Der p2d2-Zyklus

Der p2d2-Zyklus beschreibt den Datenfluss zwischen Verwaltung, OpenData-Portal, p2d2-Community und Plattformen mit offenen Daten, bei Geodaten z.B. der [OpenStreetMap](https://openstreetmap.org). Der Prozess besteht aus **9 Schritten**:

![p2d2-Zyklus - Bidirektionaler Datenfluss](/assets/p2d2-zyklus.png)
*Abbildung: Der p2d2-Zyklus visualisiert den Datenfluss zwischen Verwaltung, p2d2-Community und öffentlichen Plattformen*

## 1. Verwaltung legt Daten an

Verwaltungsmitarbeiter:innen erfassen und pflegen Daten in **Fachverfahren**:

- Z.B. werden mit der Verwaltungssoftware für Friedhöfe, Daten zu Gräbern, Grabfeldern, Eigentümern, etc.
- Ggf. werden auch Daten in lokalen GIS-Systemen der Verwaltungen gepflegt.
- Veränderungen werden in zugehörigen Fachdatenbanken abgespeichert.

**Beispiel**: Ein neues Grabfeld wird in der kommunalen Fachsoftware angelegt.

## 2. Automatisierte Veröffentlichung

Beispielsweise Über einen Datenbank-Dump und eine Skript-gesteuerte Nachbearbeitung werden die Daten aus der Fachdatenbank DSGVO-konform **automatisch** im **OpenData-Portal** der Kommune veröffentlicht:

- Automatisierter Datenbank-Dump und Prozessierung (Python, FME, ..) aus Fachverfahren
- Prozessierung liefert gängiges OpenData-Format, z.B. GeoJSON, CSV, ..
- Automatische Bereitstellung in klaren Zyklen nach BEdarf: Täglich, wöchentlich, ..

**Beispiel**: Es wird angestrebt, dass die Kölner Friedhofsdaten täglich aktualisiert auf offenedaten-koeln.de erscheinen.

## 3. p2d2 übernimmt Daten

p2d2 **importiert** die Daten automatisch aus dem OpenData-Portal:

- Regelmäßige Synchronisation (z.B. täglich)
- Transformation in einheitliches Datenmodell
- Speicherung in PostGIS-Datenbank 
  - Prozessierung der Daten
  - Bereitstellung noch nicht georeferenzierten Daten im GIS-Editor
  - Zugang zum Editor über das [Haupt-Kartenfenster von p2d2](https://www.p2d2.eu):
    - Auswahl der Kommune, Auswahl der Kategorie = zoom auf die Kommune & Anzeige von "Container-Polygonen", z.B. Friedhöfen oder administrativen Grenzen
    - Klick auf z.B. einen Friedhof öffnet den GIS-Editor (Stand 24.11.2025: Nur Editor-Preview und nur für Friedhof [Rheinkassel (Link zur OSM)](https://osm.org/go/0GDpvHbT?m=). [Hier der Direkt-Link](www.data-dna.eu/feature-editor/Rheinkassel?wp_name=de-Köln&container_type=cemetery&name=Rheinkassel&extent=6.933265888200961%2C51.038711467072034%2C6.9350725171451755%2C51.03993740430774&osm_admin_level=8&projection=EPSG%3A25832)

## 4. Nutzer:innen bearbeiten Daten

**p2d2-Nutzer:innen** überprüfen und verbessern die Daten:
(Stand 24.11.2025: Ab hier noch nicht implementiert)

Beispiel Friedhöfe:
- Wenn Gräber noch zu georeferenzieren sind, werden sie ensprechend ihrer Friedhhofs- und Grabfeld-Zuordnung und ihres Grab-Typs in einer Standard Erchteck-Größe in der Mitte des Grabfeldes "virtuell gestapelt".
- Die Georeferenzierung erfolgt dann,
  - indem man das oberste Rechteck vom Stapel herunter- und
  - auf die Position zieht, die durch den bereitgestellten Friedhofsplan und das bereitgestellte Luftbild erkennbar ist (s.Abb.), sowie
  - das jeweilige Grab entsprechend der Karte, dem Luftbild und den umgebenden Gräbern ausrichtet.
- Es ist geplant, dass der Editor über Komfort-FUnktionen verfügen soll, wie z.B.
  - Ausrichtung und Verteilung mehrerer Objekte an einer Grundlinie, ggf. auch gebogen,
  - Erzeugung 2-dimensionaler Anordnungen, auf denen sich die Gräber "snappen" lassen.
- Gräber, die bereits in der OpenStreetMap vorhanden sind:
  - Damit durch p2d2 kein Datenverlust entsteht, müssen Meta-Informationen von bestehenden Grabeintragungen aus dem existierenden Datensatz in den neuen Datensatz übernommen werden.

## 5. Community prüft Qualität

Die **p2d2-Community** überprüft die Änderungen:

Die Speicherung der Daten erfolgt in einer [OSM UserMap](https://umap.openstreetmap.de/de/), wo eine QS und Freigabe durch die Community erfolgt
  - Die Bearbeitung der Geodaten soll so niedrigschwellig wie möglich erfolgen.
  - Daher wird es mindestens Anfangs eine Bearbeitung ohne User-Account möglich sein.
  - Ergebnisse der Positionierungs-Arbeit werden herunterladbar, vor allem aber in einer OSM uMAP abgespeichert
- In der uMap erfolgt die Qualitätskontrolle:
  - wurden alle Gräber korrekt positioniert und ausgerichtet?
  - wurden nicht verteilbare Gräber (Verschattung, Datenfehler, ..) gekennzeichnet, damit bei einem vor Ort Termin manuell zugeordnet werden können?
  - Review durch erfahrene Nutzer:innen
  - Freigabe für Export in OSM
  - Ggf.: Ablehnung mit Begründung (Stand 11/2025: p2d2-Wiki in Planung)
- Bei Erfolg von p2d2 wird das Projekt eigene uMap-Instanzen anlegen um die Ressourcen der OSM-Community zu schonen 

## 6. Automatisierter Transfer

Export in OSM:
- Mit lokaler OSM-Community zu klären, im Fall von Köln: Geklärt 
- Schrittweise Annäherung
  - nach und nach kleine, mittlere und große Friedhöfe
  - enge Abstimmung mit OSM Community
- Export erfolgt entsprechend der QS auf der Ebene von Grabfeldern (ca. 50-250 Gräber)
  - Überschaubarkeit soll erhalten bleiben. 

## 7. Änderungen triggern Benachrichtigung

Wenn Daten in OSM bereit stehen, sind die für alle Mitbürger und Mitbürger:innen veränderbar.
- Veränderungen an den Daten, die die Verwaltung interessieren, sollen einen Trigger in die Verwaltung auslösen
- Geplant ist eine Benachrichtigung per GeoRSS
- Die Datenänderung stellt einen Vorschlag dar, den der oder die Mitarbeiter:in der Verwaltung
  - ablehnen oder
  - annehmen und in den eigenen Datenbestand übernehmen kann.
  - Bei einer Ablehnung soll p2d2-/OSM-seitig überprüft werden, was das Problem war.
- Bei Erfolg von p2d2 ist zu überlegen, wie eine Clearing-Stelle aussehen kann, um das Delta zwischen Verwaltung und OSM klein zu halten

## 8. Verwaltung sichtet Änderung

**Verwaltungsmitarbeiter:innen** prüfen die Änderung:

- Überprüfung auf Richtigkeit
- Entscheidung: Übernehmen oder ablehnen
- Bei Übernahme: Update im Fachverfahren

**Beispiel**: Die Verwaltung übernimmt die korrigierten Öffnungszeiten.

## 9. Zirkelschluss: Verbesserte Daten

Die **verbesserten Daten** stehen nun allen zur Verfügung:

- Fachverfahren hat aktuellere Daten
- OpenData-Portal wird aktualisiert
- p2d2 synchronisiert die Änderungen
- Wir alle verfügen über qualitätsgesicherte und ggf. vollständigere Daten,
  - als unsere Verwaltungen
  - als Unternehmen
- Unternehmen können diese Daten als freie Grundlage für bessere Produkte und Dienstleistungen nutzen

---

## Vorteile des Zyklus

- **Bidirektionalität**: Daten fließen in beide Richtungen
- **Qualitätssicherung**: Community und Verwaltung prüfen gemeinsam
- **Aktualität**: Änderungen werden zeitnah übernommen
- **Transparenz**: Alle Schritte sind nachvollziehbar
- **Effizienz**: Keine Doppelarbeit mehr

## Technische Umsetzung

Der Zyklus wird durch verschiedene Komponenten ermöglicht:

- **Automatisierung**: Cronjobs, Webhooks, APIs
- **Versionierung**: Git-ähnliche Änderungshistorie
- **Benachrichtigungen**: E-Mail, RSS, Webhooks
- **Schnittstellen**: REST-APIs, OGC-Services

::: tip
Der p2d2-Zyklus ist das Herzstück der Anwendung und unterscheidet p2d2 von reinen Erfassungstools.
:::
