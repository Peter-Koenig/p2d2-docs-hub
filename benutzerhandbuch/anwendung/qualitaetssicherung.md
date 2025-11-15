# Qualitätssicherung

Die Qualitätssicherung (QS) ist ein zentraler Bestandteil von p2d2. Sie stellt sicher, dass nur korrekte und vollständige Daten in öffentliche Plattformen übertragen werden.

## Das Vier-Augen-Prinzip

p2d2 setzt auf das **Vier-Augen-Prinzip**:

1. **Erfasser:in**: Erstellt oder ändert Feature
2. **Prüfer:in**: Kontrolliert die Änderung
3. **Freigabe**: Erst nach Prüfung wird das Feature exportiert

## QS-Workflow

### 1. Feature wird zur QS eingereicht

- Status ändert sich zu **"In QS"**
- Feature erscheint in der **QS-Warteschlange**
- Benachrichtigung an QS-Team

### 2. Prüfer:in wählt Feature

QS-Prüfer:innen sehen:

- **Änderungsliste**: Was wurde geändert?
- **Vorher/Nachher-Vergleich**: Side-by-Side-Ansicht
- **Änderungskommentar**: Begründung der Änderung
- **Quellen**: Angegebene Informationsquellen

### 3. Prüfung

Der/Die Prüfer:in kontrolliert:

- **Geometrie**: Ist die Form korrekt und präzise?
- **Attribute**: Sind alle Informationen vollständig und richtig?
- **Quellen**: Sind die angegebenen Quellen zulässig?
- **Konsistenz**: Passen die Daten zu benachbarten Features?

### 4. Entscheidung

Drei Optionen:

#### Freigeben ✅

- Feature ist korrekt
- Wird für Export markiert
- Erfasser:in erhält Benachrichtigung

#### Ablehnen ❌

- Feature hat Mängel
- **Begründung erforderlich**
- Geht zurück an Erfasser:in zur Überarbeitung

#### Rückfrage ❓

- Unsicherheit bei der Prüfung
- Diskussion in Kommentaren
- Weitere Prüfer:innen können hinzugezogen werden

## QS-Kriterien

### Geometrie-Qualität

- **Genauigkeit**: Mind. 1 Meter
- **Topologie**: Keine Selbstüberschneidungen
- **Vollständigkeit**: Alle relevanten Features erfasst

### Attribut-Qualität

- **Vollständigkeit**: Pflichtfelder ausgefüllt
- **Format**: Korrekte Formatierung (URLs, Telefonnummern, etc.)
- **Konsistenz**: Keine Widersprüche innerhalb des Features

### Quellen-Qualität

- **Zulässigkeit**: Nur erlaubte Quellen verwendet
- **Aktualität**: Möglichst aktuelle Informationen
- **Nachvollziehbarkeit**: Quellen sind angegeben

## QS-Rollen

### QS-Neuling

- **Berechtigung**: Kann eigene Features zur QS einreichen
- **Beschränkung**: Kann noch nicht QS durchführen

### QS-Prüfer:in

- **Berechtigung**: Kann QS durchführen
- **Anforderung**: Mind. 50 erfolgreiche eigene Features
- **Rechte**: Freigeben, Ablehnen, Rückfrage

### QS-Moderator:in

- **Berechtigung**: Kann QS-Konflikte lösen
- **Rechte**: Alle Prüfer:innen-Rechte + Konfliktlösung
- **Rolle**: Ansprechpartner:in bei Unsicherheiten

## Automatische Prüfungen

Zusätzlich zur manuellen QS gibt es **automatische Prüfungen**:

### Geometrie-Validierung

- **Geschlossene Polygone**: Polygone müssen geschlossen sein
- **Mindestgröße**: Features müssen Mindestgröße haben
- **Bounding Box**: Features müssen in erlaubtem Gebiet liegen

### Attribut-Validierung

- **Pflichtfelder**: Müssen ausgefüllt sein
- **Format**: URLs, E-Mails, Telefonnummern werden validiert
- **Wertebereich**: Numerische Werte müssen in erlaubtem Bereich liegen

### Duplikat-Erkennung

- **Räumlich**: Warnung bei überlappenden Features
- **Attribut**: Warnung bei identischen Namen in Nähe

::: tip QS-Prüfer:in werden
Interessiert an der QS? Nach 50 erfolgreichen eigenen Features können Sie sich als QS-Prüfer:in bewerben!
:::

## QS-Dashboard

Das QS-Dashboard zeigt:

- **Warteschlange**: Features, die auf QS warten
- **Meine Prüfungen**: Von mir geprüfte Features
- **Statistiken**: QS-Durchlaufzeiten, Ablehnungsquoten
- **Trends**: Häufige Fehlertypen

## Feedback-Kultur

Bei Ablehnung:

- **Konstruktiv**: Erklären Sie, was verbessert werden muss
- **Konkret**: Nennen Sie spezifische Probleme
- **Hilfsbereit**: Geben Sie Hinweise zur Verbesserung

::: warning Qualität über Quantität
QS-Prüfer:innen sollten sorgfältig prüfen, nicht schnell durchwinken!
:::
