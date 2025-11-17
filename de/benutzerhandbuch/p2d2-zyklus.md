---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Der p2d2-Zyklus

Der p2d2-Zyklus beschreibt den bidirektionalen Datenfluss zwischen Verwaltung, OpenData-Portal, p2d2-Community und öffentlichen Datenplattformen. Der Prozess besteht aus **9 Schritten**:

## 1. Verwaltung legt Daten an

Verwaltungsmitarbeiter:innen erfassen und pflegen Daten in **Fachverfahren**:

- Friedhofsverwaltungssoftware
- GIS-Systeme der Verwaltung
- Fachdatenbanken

**Beispiel**: Ein neuer Friedhof wird im kommunalen GIS angelegt.

## 2. Automatisierte Veröffentlichung

Die Daten werden **automatisch** im **OpenData-Portal** der Kommune veröffentlicht:

- Export aus Fachverfahren
- Transformation in OpenData-Formate (z.B. GeoJSON, CSV)
- Bereitstellung über Portal-API

**Beispiel**: Friedhofsdaten erscheinen täglich aktualisiert auf offenedaten-koeln.de.

## 3. p2d2 übernimmt Daten

p2d2 **importiert** die Daten automatisch aus dem OpenData-Portal:

- Regelmäßige Synchronisation (z.B. täglich)
- Transformation in einheitliches Datenmodell
- Speicherung in PostGIS-Datenbank

**Beispiel**: Neue Friedhöfe werden automatisch in p2d2 geladen.

## 4. Nutzer:innen bearbeiten Daten

**p2d2-Nutzer:innen** überprüfen und verbessern die Daten:

- Korrektur von Geometrien (Grenzen, Eingänge)
- Ergänzung fehlender Attribute
- Hinzufügen von Fotos oder Beschreibungen
- Markierung für Qualitätssicherung

**Beispiel**: Ein:e Nutzer:in korrigiert den Friedhofseingang und ergänzt Öffnungszeiten.

## 5. Community prüft Qualität

Die **p2d2-Community** überprüft die Änderungen:

- Review durch erfahrene Nutzer:innen
- Prüfung auf Vollständigkeit und Konsistenz
- Freigabe für Massenimport in OSM/WikiData
- Oder: Ablehnung mit Begründung

**Beispiel**: Ein Community-Moderator prüft die Änderungen und gibt sie frei.

## 6. Automatisierter Transfer

Nach Freigabe werden die Daten **automatisch übertragen**:

- **OpenStreetMap**: Via OSM-API oder JOSM
- **WikiData**: Via WikiData-API
- **Andere Plattformen**: Je nach Konfiguration

**Beispiel**: Der korrigierte Friedhof wird in OSM importiert.

## 7. Änderungen triggern Benachrichtigung

Änderungen an den Daten in öffentlichen Plattformen lösen **Benachrichtigungen** aus:

- OSM-Changesets werden überwacht
- WikiData-Edits werden getracked
- Fachamt erhält Benachrichtigung

**Beispiel**: Die Friedhofsverwaltung wird über die OSM-Änderung informiert.

## 8. Verwaltung sichtet Änderung

**Verwaltungsmitarbeiter:innen** prüfen die Änderung:

- Überprüfung auf Richtigkeit
- Entscheidung: Übernehmen oder ablehnen
- Bei Übernahme: Update im Fachverfahren

**Beispiel**: Die Verwaltung übernimmt die korrigierten Öffnungszeiten.

## 9. Zirkelschluss: Verbesserte Daten

Die **verbesserten Daten** stehen nun allen zur Verfügung:

- Fachverfahren hat aktuelle Daten
- OpenData-Portal wird aktualisiert
- p2d2 synchronisiert die Änderungen
- OSM/WikiData haben qualitätsgesicherte Daten

**Beispiel**: Der Friedhof ist nun in allen Systemen korrekt und aktuell erfasst.

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
