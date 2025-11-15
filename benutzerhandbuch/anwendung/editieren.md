# Editieren

Dieser Abschnitt beschreibt Best Practices für das Editieren von Geodaten in p2d2.

## Vorbereitung

### Datenbasis prüfen

Bevor Sie mit der Bearbeitung beginnen:

1. **Hintergrundkarten**: Wechseln Sie zu aktuellen Luftbildern
2. **Vergleich**: Prüfen Sie, ob die vorhandenen Daten stimmen
3. **Informationsbeschaffung**: Recherchieren Sie fehlende Informationen

### Quellen nutzen

Gültige Informationsquellen:

- **Luftbilder**: Für Geometrien
- **OpenData-Portal**: Für offizielle Daten
- **Vor-Ort-Begehung**: Für Details wie Öffnungszeiten
- **Webseiten**: Für Kontaktdaten und Beschreibungen

::: danger Keine Urheberrechtsverletzungen
Nutzen Sie **keine** urheberrechtlich geschützten Quellen wie Google Maps, kommerzielle Karten oder proprietäre Daten!
:::

## Geometrie-Erfassung

### Genauigkeit

- **Mindestgenauigkeit**: 1 Meter
- **Gebäudegrenzen**: Möglichst exakt an Außenwände
- **Wege**: Mittellinie des Weges
- **Flächen**: Geschlossene Polygone ohne Selbstüberschneidungen

### Topologie

- **Angrenzende Flächen**: Sollten gemeinsame Kanten haben (keine Lücken/Überlappungen)
- **Multipolygone**: Für Flächen mit Löchern oder getrennten Teilen

## Attribut-Pflege

### Namensgebung

- **Offizielle Namen**: Verwenden Sie die offiziellen Bezeichnungen
- **Keine Abkürzungen**: Außer bei etablierten Kürzeln
- **Schreibweise**: Groß-/Kleinschreibung beachten

### Strukturierte Daten

- **Öffnungszeiten**: Schema "Mo-Fr 09:00-17:00"
- **Telefonnummern**: Internationales Format "+49 221 12345"
- **URLs**: Vollständige URLs inkl. https://

### Vollständigkeit

Versuchen Sie, möglichst viele Attribute zu erfassen:

- **Basis-Attribute**: Name, Kategorie, Adresse
- **Kontakt**: Telefon, E-Mail, Website
- **Zeiten**: Öffnungszeiten
- **Beschreibung**: Kurze Erläuterung (1-2 Sätze)

## Änderungskommentare

Bei jeder Änderung sollten Sie einen **Kommentar** hinterlassen:

- **Was**: Was wurde geändert?
- **Warum**: Grund für die Änderung
- **Quelle**: Woher stammt die Information?

**Beispiel**: "Geometrie korrigiert nach Luftbild 2024, Öffnungszeiten von Webseite übernommen"

## Konfliktlösung

Wenn Sie auf Konflikte stoßen:

1. **Prüfen**: Ist die vorhandene oder die neue Information korrekt?
2. **Recherchieren**: Zusätzliche Quellen konsultieren
3. **Diskutieren**: Im p2d2-Forum oder Chat nachfragen
4. **Dokumentieren**: Konflikt im Kommentar festhalten

::: tip Qualität vor Geschwindigkeit
Lieber wenige Features korrekt als viele Features fehlerhaft erfassen!
:::
