---
title: "Dokumentations-Qualitätsübersicht"
description: "Übersicht über die Qualität aller p2d2-Dokumentationen"
layout: doc
---

<script setup>
import { data as documents } from './quality-overview.data.ts'
import QualityOverview from '../.vitepress/theme/components/QualityOverview.vue'
</script>

# 📈 Dokumentations-Qualitätsübersicht

Diese Seite bietet einen Überblick über die Qualität aller p2d2-Dokumentationen. Das Quality-Tracking-System hilft dabei, die Dokumentationsqualität kontinuierlich zu verbessern und Transparenz über den aktuellen Stand zu schaffen.

<QualityOverview :documents="documents" />

## Über das Quality-System

Das p2d2 Quality-Tracking-System verfolgt folgende Metriken:

- **Vollständigkeit (Completeness)**: Wie vollständig ist die Dokumentation? Deckt sie alle relevanten Themen ab?
- **Korrektheit (Accuracy)**: Wie korrekt und aktuell sind die Informationen?
- **Review-Status**: Wurde die Dokumentation von einem Experten geprüft?

### Qualitätsstufen

| Stufe | Score | Beschreibung |
|-------|-------|--------------|
| ✅ Sehr gut | 80-100% | Vollständige, geprüfte und aktuelle Dokumentation |
| 🔵 Gut | 60-79% | Gute Abdeckung, kleinere Lücken möglich |
| 🟡 Ausreichend | 40-59% | Grundlegende Dokumentation vorhanden, Verbesserungspotential |
| 🔴 Verbesserungsbedarf | 0-39% | Unvollständige oder veraltete Dokumentation |

## Quality-Status in Dokumenten

In jeder Dokumentation wird automatisch der aktuelle Quality-Status angezeigt, wenn Quality-Metriken im Frontmatter vorhanden sind.

Der Status zeigt:
- **Vollständigkeit**: Wie vollständig die Dokumentation ist
- **Korrektheit**: Wie aktuell und korrekt die Informationen sind  
- **Review-Status**: Ob die Dokumentation bereits geprüft wurde

### Beispiel

Ein Dokument mit folgenden Metriken:
- Vollständigkeit: 85%
- Korrektheit: 90%
- Review-Status: Geprüft

würde als "Sehr gut (88%)" eingestuft werden.

## Wie man das Quality-System nutzt

### Für Dokumentations-Autoren

1. **Neue Dokumente erstellen**: Fügen Sie das Quality-Frontmatter zu jeder neuen Markdown-Datei hinzu
2. **Metriken aktualisieren**: Passen Sie die Werte an, wenn Sie die Dokumentation verbessern
3. **Review anfordern**: Setzen Sie `reviewed: true` und tragen Sie Reviewer und Datum ein

### Für Reviewer

1. **Dokumente prüfen**: Lesen Sie die Dokumentation auf Vollständigkeit, Korrektheit und Aktualität
2. **Metriken bewerten**: Geben Sie eine realistische Einschätzung der Qualitätsmetriken
3. **Review dokumentieren**: Tragen Sie sich als Reviewer ein und setzen Sie das Review-Datum

## Praktische Beispiele

### Beispiel 1: GDI-Architektur (Gut - 70%)

```yaml
quality:
  completeness: 75
  accuracy: 65
  reviewed: true
  reviewer: "Peer Kaiser"
  reviewDate: "2025-11-17"
```

- **Vollständigkeit**: 75% - Deckt alle Kernkomponenten ab, aber Details zu OSM-Tileserver fehlen
- **Korrektheit**: 65% - Technische Details stimmen, aber einige URLs sind veraltet
- **Review**: ✅ Geprüft von Peer Kaiser am 17.11.2025
- **Gesamt**: 70% - Gute Basis, aber Verbesserungspotential bei Details

### Beispiel 2: GeoServer (Sehr gut - 85%)

```yaml
quality:
  completeness: 90
  accuracy: 80
  reviewed: true
  reviewer: "Peer Kaiser"
  reviewDate: "2025-11-17"
```

- **Vollständigkeit**: 90% - Umfassende Dokumentation aller Features
- **Korrektheit**: 80% - Aktuelle Konfigurationen und Best Practices
- **Review**: ✅ Geprüft von Peer Kaiser am 17.11.2025
- **Gesamt**: 85% - Exzellente Dokumentation mit kleinen Optimierungen

### Beispiel 3: MapProxy (Gut - 70%)

```yaml
quality:
  completeness: 75
  accuracy: 65
  reviewed: true
  reviewer: "Peer Kaiser"
  reviewDate: "2025-11-17"
```

- **Vollständigkeit**: 75% - Gute Abdeckung der Hauptfunktionen
- **Korrektheit**: 65% - Grundlegende Konfiguration korrekt, aber Performance-Tuning fehlt
- **Review**: ✅ Geprüft von Peer Kaiser am 17.11.2025
- **Gesamt**: 70% - Solide Dokumentation mit Raum für Erweiterungen

## Technische Details

### Frontmatter Schema

Jede Markdown-Datei enthält ein Quality-Frontmatter:

```yaml
---
title: Dokument-Titel
quality:
  completeness: 50    # Vollständigkeit (0-100%)
  accuracy: 70        # Korrektheit (0-100%)
  reviewed: false     # Review-Status
  reviewer: null      # Name des Reviewers
  reviewDate: null    # Datum des Reviews
---
```

### Automatische Berechnung

Der Gesamtscore wird automatisch berechnet:
- **Geprüfte Dokumente**: `(completeness + accuracy) / 2`
- **Ungeprüfte Dokumente**: `(completeness + accuracy) / 2 * 0.8`

### Kategorien

Dokumente werden automatisch folgenden Kategorien zugeordnet:
- **Administration**: Administrationshandbuch
- **Benutzerhandbuch**: Benutzerhandbuch  
- **Entwicklung**: Entwicklung
- **Strategie**: Entwicklungsstrategie
- **Allgemein**: Sonstige Dokumente

## Nächste Schritte

- [x] Alle bestehenden Dokumente mit initialen Quality-Metriken versehen (69 Dateien)
- [x] Review-Prozess für kritische Dokumente etablieren (Beispiele implementiert)
- [x] Quality-Dashboard für Projekt-Manager erstellen
- [ ] Automatische Quality-Checks implementieren
- [ ] Historische Quality-Daten verfolgen

---

**Letztes Update**: 17. November 2025  
**Verantwortlich**: p2d2 Documentation Team

Weitere Details zum Quality-System finden Sie in [QUALITY_SYSTEM.md](/QUALITY_SYSTEM.html).