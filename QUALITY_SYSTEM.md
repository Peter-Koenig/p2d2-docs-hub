# p2d2 Quality Tracking System

## Überblick

Das p2d2 Quality Tracking System ist ein integriertes Framework zur Überwachung und Verbesserung der Dokumentationsqualität. Es besteht aus:

- **Frontmatter-Schema** für Qualitätsmetriken in allen Markdown-Dateien
- **Vue.js Components** für die visuelle Darstellung
- **Übersichtsseiten** für das Qualitätsmanagement

## Frontmatter Schema

Jede Markdown-Datei enthält ein Quality-Frontmatter:

```yaml
---
title: Dokument-Titel
quality:
  completeness: 50    # Vollständigkeit (0-100%)
  accuracy: 70        # Genauigkeit (0-100%)
  reviewed: false     # Review-Status
  reviewer: null      # Name des Reviewers
  reviewDate: null    # Datum des Reviews
---
```

### Metriken Erklärung

- **completeness** (Vollständigkeit): Wie vollständig ist die Dokumentation? Deckt sie alle relevanten Themen ab?
- **accuracy** (Genauigkeit): Wie korrekt und aktuell sind die Informationen?
- **reviewed**: Wurde die Dokumentation von einem Experten geprüft?

### Qualitätsstufen

| Stufe | Score | Farbe | Beschreibung |
|-------|-------|-------|--------------|
| 🟢 Exzellent | 80-100% | Grün | Vollständige, geprüfte und aktuelle Dokumentation |
| 🔵 Gut | 60-79% | Blau | Gute Abdeckung, kleinere Lücken möglich |
| 🟡 Ausreichend | 40-59% | Orange | Grundlegende Dokumentation vorhanden, Verbesserungspotential |
| 🔴 Verbesserungsbedarf | 0-39% | Rot | Unvollständige oder veraltete Dokumentation |

## Components

### QualityStatus Component

Zeigt den Quality-Status einer einzelnen Dokumentation an:

```vue
<QualityStatus :quality="{
  completeness: 85,
  accuracy: 90, 
  reviewed: true,
  reviewer: 'tech-lead',
  reviewDate: '2025-11-17'
}" />
```

**Features:**
- Visuelle Progress-Bars für Vollständigkeit und Genauigkeit
- Review-Status mit Datum und Reviewer
- Responsive Design
- Farbcodierung nach Qualitätsstufe

### QualityOverview Component

Bietet eine Übersicht über alle Dokumentationen:

```vue
<QualityOverview />
```

**Features:**
- Filter nach Kategorie, Status und Qualität
- Qualitätsverteilung als Diagramm
- Sortierbare Dokumentenliste
- Responsive Tabellenansicht

## Verwendung

### 1. Neue Dokumente erstellen

Fügen Sie das Quality-Frontmatter zu jeder neuen Markdown-Datei hinzu:

```yaml
---
title: Ihr Dokument
quality:
  completeness: 50    # Initial-Schätzung
  accuracy: 70        # Initial-Schätzung
  reviewed: false
  reviewer: null
  reviewDate: null
---
```

### 2. Quality-Status anzeigen

Fügen Sie in Markdown-Dateien das Component hinzu:

```markdown
# Ihr Dokument

<QualityStatus :quality="$frontmatter.quality" />

<script setup>
import QualityStatus from '../.vitepress/components/QualityStatus.vue'
</script>
```

### 3. Metriken aktualisieren

Passen Sie die Werte an, wenn Sie die Dokumentation verbessern:

- **completeness erhöhen**: Neue Abschnitte hinzufügen
- **accuracy erhöhen**: Fehler korrigieren, Informationen aktualisieren
- **reviewed setzen**: Nach erfolgreicher Prüfung

## Best Practices

### Für Autoren

- **Realistische Schätzungen**: Geben Sie ehrliche Einschätzungen der Metriken
- **Regelmäßige Updates**: Synchronisieren Sie Dokumentation mit Code-Änderungen
- **Konkrete Beispiele**: Fügen Sie Code-Snippets und Anwendungsfälle hinzu
- **Strukturierte Gliederung**: Verwenden Sie klare Hierarchien

### Für Reviewer

- **Zweite Meinung**: Lassen Sie Dokumentation immer prüfen
- **Fachkompetenz**: Wählen Sie Reviewer mit entsprechendem Wissen
- **Konstruktives Feedback**: Geben Sie spezifische Verbesserungsvorschläge
- **Review-Dokumentation**: Tragen Sie sich als Reviewer ein

### Review-Prozess

1. **Initiale Erstellung**: Autor erstellt Dokument mit initialen Metriken
2. **Selbst-Review**: Autor prüft eigene Arbeit
3. **Peer-Review**: Zweite Person prüft die Dokumentation
4. **Metriken-Anpassung**: Reviewer passt Quality-Metriken an
5. **Status-Update**: Setze `reviewed: true` mit Datum und Name

## Technische Details

### Dateistruktur

```
.vitepress/
├── components/
│   ├── QualityStatus.vue      # Einzelner Quality-Status
│   └── QualityOverview.vue    # Übersicht aller Dokumente
├── config.ts                  # Sidebar-Konfiguration
└── theme/                     # Custom Theme (optional)

de/
├── quality-overview.md        # Haupt-Übersichtsseite
└── ...                        # Alle anderen Dokumente
```

### Frontmatter Extraction

Die Components lesen die Quality-Metriken aus dem Frontmatter:

```javascript
// In Vue Component
const quality = $frontmatter.quality
```

### Responsive Design

Alle Components sind für mobile Geräte optimiert:
- Flexible Layouts
- Touch-friendly Buttons
- Readable typography on small screens

## Nächste Schritte

- [ ] Automatische Quality-Checks implementieren
- [ ] Quality-Dashboard für Projekt-Manager erstellen
- [ ] Integration mit CI/CD Pipeline
- [ ] Historische Quality-Daten verfolgen
- [ ] Export-Funktion für Reports

## Beispiele

### Exzellente Dokumentation

```yaml
quality:
  completeness: 95
  accuracy: 92
  reviewed: true
  reviewer: "maria-muster"
  reviewDate: "2025-11-15"
```

### Dokumentation mit Verbesserungsbedarf

```yaml
quality:
  completeness: 35
  accuracy: 40
  reviewed: false
  reviewer: null
  reviewDate: null
```

## Support

Bei Fragen zum Quality-System:
- Dokumentation: `/de/quality-overview`
- Issues: GitHub/GitLab Issue Tracker
- Diskussion: Projekt-Chat/Kanäle

---

**Version**: 1.0.0  
**Letztes Update**: 17. November 2025  
**Verantwortlich**: p2d2 Documentation Team