# Speichern

Das Speichern von Änderungen in p2d2 folgt einem strukturierten Prozess, um Datenverlust zu vermeiden und Qualitätssicherung zu ermöglichen.

## Speichern-Workflow

### 1. Lokales Speichern

Während der Bearbeitung werden Änderungen **lokal im Browser** gespeichert:

- **Automatisch**: Alle 30 Sekunden
- **Manuell**: Strg + S oder "Speichern"-Button
- **Browser-Storage**: IndexedDB

::: tip Auto-Save
Sie müssen nicht manuell speichern - die Anwendung sichert Ihre Arbeit automatisch.
:::

### 2. Änderungen markieren

Bearbeitete Features werden markiert:

- **Gelb**: Ungespeicherte lokale Änderungen
- **Orange**: Zur Qualitätssicherung vorgemerkt
- **Grün**: Qualitätsgesichert, bereit für Export

### 3. Zur Qualitätssicherung einreichen

Wenn Sie mit Ihrer Arbeit zufrieden sind:

1. **Feature auswählen**
2. **"Zur QS einreichen"**: Button in der Seitenleiste
3. **Kommentar**: Änderungen beschreiben
4. **Bestätigen**

Das Feature wird nun der **Community zur Prüfung** vorgelegt.

## Speicherorte

### Browser (IndexedDB)

- **Lokaler Cache**: Für offline-Bearbeitung
- **Automatische Synchronisation**: Bei Online-Verbindung
- **Versionierung**: Mehrere Bearbeitungsstände

### Server (PostgreSQL/PostGIS)

- **Nach QS-Einreichung**: Daten werden auf Server übertragen
- **Versionierung**: Git-ähnliche Änderungshistorie
- **Backup**: Tägliche Sicherungen

### Export

Nach erfolgreicher Qualitätssicherung:

- **OpenStreetMap**: Via OSM-API
- **WikiData**: Via WikiData-API
- **OpenData-Portal**: Rückmeldung an Verwaltung

## Konfliktbehandlung

### Gleichzeitige Bearbeitung

Wenn mehrere Nutzer:innen dasselbe Feature bearbeiten:

1. **Warnung**: "Feature wird bereits bearbeitet"
2. **Optionen**:
   - Warten, bis andere:r fertig ist
   - Nur-Lesen-Modus
   - Konflikt erzwingen (für Admins)

### Versionskonflikt

Bei Versionskonflikten (Server hat neuere Version):

1. **Merge-Dialog**: Zeigt beide Versionen
2. **Vergleich**: Side-by-Side-Ansicht
3. **Auflösung**:
   - Server-Version übernehmen
   - Lokale Version bevorzugen
   - Manuell mergen

## Rückgängig machen

### Vor dem Einreichen

- **Strg + Z**: Einzelne Änderung rückgängig
- **"Verwerfen"**: Alle Änderungen eines Features verwerfen

### Nach dem Einreichen

- **Nur durch Admins**: Eingereichte Änderungen können nur von Moderator:innen zurückgenommen werden
- **Begründung erforderlich**: Warum soll die Änderung rückgängig gemacht werden?

## Offline-Modus

p2d2 unterstützt **Offline-Bearbeitung**:

1. **Daten synchronisieren**: Vor dem Offline-Gehen
2. **Offline bearbeiten**: Alle Funktionen verfügbar
3. **Synchronisation**: Änderungen werden hochgeladen, sobald Online-Verbindung besteht

::: warning Datenverlust vermeiden
Löschen Sie nicht den Browser-Cache, solange ungespeicherte Änderungen vorhanden sind!
:::

## Best Practices

- **Regelmäßig einreichen**: Reichen Sie Änderungen regelmäßig zur QS ein, statt große Batches anzusammeln
- **Kommentare**: Beschreiben Sie Ihre Änderungen aussagekräftig
- **Prüfen vor Einreichen**: Kontrollieren Sie Ihre Arbeit selbst, bevor Sie sie einreichen
- **Backup**: Bei umfangreichen Änderungen: Export als GeoJSON zur Sicherheit
