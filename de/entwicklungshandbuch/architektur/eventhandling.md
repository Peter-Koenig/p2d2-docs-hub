---
title: Event Handling & Cross-Window Kommunikation
description: Architektur und Implementierung des Event-Systems mit Cross-Window-Kommunikation in p2d2
quality:
  completeness: 85
  accuracy: 85
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-12-17
---

# Event Handling & Cross-Window Kommunikation

## Übersicht

Das Event-System in p2d2 ermöglicht eine robuste, asynchrone Kommunikation zwischen verschiedenen Komponenten der Anwendung und unterstützt insbesondere die bidirektionale Kommunikation zwischen Hauptfenster und Editor-Fenstern. Das System basiert auf einem CustomEvent-basierten Ansatz mit erweiterten Funktionen wie Retry-Mechanismen, Throttling und Cross-Window-Propagation.

## Architektur-Konzept

### Kernkomponenten

1. **Event Dispatcher**: Zentrale Klasse für Event-Dispatching mit Throttling-Unterstützung
2. **Event Console**: Debugging-Oberfläche für Live-Event-Überwachung mit Filter- und Export-Funktionen
3. **Cross-Window Bridge**: Bidirektionale Kommunikation zwischen Browser-Fenstern
4. **Event Queue**: Retry-Mechanismus für zuverlässige Event-Verarbeitung

### Datenfluss-Architektur

```
┌────────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│   Hauptfenster     │      │  Cross-Window Bridge │      │  Editor-Fenster  │
│                    │      │                      │      │                  │
│  • Event Console   │ ◄────┤  • initialize()      │────► │• Event Console   │
│  • Event Dispatch  │      │  • registerWindow()  │      │ • Event Dispatch │
│  • Event Listener  │      │  • broadcastEvent()  │      │ • Event Listener │
└────────────────────┘      └──────────────────────┘      └──────────────────┘
         │                            │                               │
         └────────────────────────────┼───────────────────────────────┘
                                      │
                          ┌───────────▼────────────┐
                          │ window.postMessage()   │ 
                          │ (Same-Origin Policy)   │ 
                          └────────────────────────┘
```

## Event-Typologie

### Kategorien und Prioritäten

Das Event-System kategorisiert Events nach Funktionsbereichen und priorisiert sie für die Cross-Window-Kommunikation:

| Kategorie | Beschreibung | Beispiele | Cross-Window-Priorität |
|-----------|--------------|-----------|------------------------|
| **Kommune** | Kommunen-bezogene Events | `kommunen:focus`, `kommunen:selected` | Mittel-Hoch |
| **Map** | Karteninteraktionen | `map:ready`, `map:moveend`, `map:zoomend` | Mittel |
| **WFS** | WFS-Datenoperationen | `wfs:load:start`, `wfs:feature:created` | Hoch |
| **Editor** | Editor-Operationen | `editor:ready`, `editor:feature:modified` | Hoch |
| **UI** | Benutzeroberfläche | `ui:panel:toggle`, `crs:change` | Niedrig |

### Event-Inventar

| Event-Typ | Kategorie | Beschreibung | Priorität | Cross-Window | Implementiert |
|-----------|-----------|--------------|-----------|--------------|---------------|
| `p2d2:kommunen:focus` | Kommune | Fokus auf eine Kommune (Zoom/Pan) | Mittel | Nein | Ja |
| `p2d2:kommunen:selected` | Kommune | Kommune ausgewählt | Hoch | Ja | Ja |
| `p2d2:map:ready` | Map | Karte initialisiert | Hoch | Ja | Ja |
| `p2d2:map:moveend` | Map | Kartenbewegung abgeschlossen | Niedrig | Nein | Ja |
| `p2d2:map:zoomend` | Map | Zoom-Änderung abgeschlossen | Niedrig | Nein | Ja |
| `p2d2:wfs:load:start` | WFS | WFS-Ladevorgang gestartet | Hoch | Ja | Ja |
| `p2d2:wfs:load:complete` | WFS | WFS-Ladevorgang erfolgreich | Hoch | Ja | Ja |
| `p2d2:wfs:load:error` | WFS | WFS-Ladevorgang fehlgeschlagen | Hoch | Ja | Ja |
| `p2d2:wfs:feature:created` | WFS | Feature erstellt | Hoch | Ja | Ja |
| `p2d2:wfs:feature:updated` | WFS | Feature aktualisiert | Hoch | Ja | Ja |
| `p2d2:wfs:feature:deleted` | WFS | Feature gelöscht | Hoch | Ja | Ja |
| `p2d2:editor:ready` | Editor | Editor-Fenster initialisiert | Hoch | Ja | Ja |
| `p2d2:editor:feature:modified` | Editor | Feature im Editor modifiziert | Hoch | Ja | Ja |
| `p2d2:editor:mode:change` | Editor | Modus (navigate/edit) geändert | Hoch | Ja | Ja |
| `p2d2:editor:feature:selected` | Editor | Feature im Editor ausgewählt | Hoch | Ja | Ja |

## Cross-Window Kommunikation

### Architektur

Die Cross-Window-Kommunikation ermöglicht die Synchronisation zwischen Hauptfenster und Editor-Fenstern über die `window.postMessage()` API unter strikter Einhaltung der Same-Origin Policy.

#### Kernkomponenten

1. **Cross-Window Bridge** (`cross-window-events.ts`):
   - Initialisierung und Fenster-Registrierung
   - Bidirektionale Event-Propagation
   - Fenster-Identifikation und Lifecycle-Management

2. **Event Console Erweiterung**:
   - Source-Labeling (`🏠 Main`, `🪟 Editor`)
   - Cross-Window-Markierung (`⚡ Cross-Window`)
   - Filterung nach Event-Quelle

3. **Event Metadata**:
   ```typescript
   interface LogEntryMeta {
     source?: 'main' | 'editor' | string;
     windowId?: string;
     crossWindow?: boolean;
     retryCount?: number;
     throttled?: boolean;
     success?: boolean;
     error?: string;
   }
   ```

### Implementierungsdetails

#### Event-Dispatch mit Cross-Window-Propagation

```typescript
// Beispiel: Cross-Window Event Dispatch
function dispatchCrossWindowEvent(
  eventName: string, 
  detail: any, 
  options: { crossWindow: boolean } = { crossWindow: false }
): void {
  // 1. Lokales Event feuern
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
  
  // 2. In Event Console loggen
  eventConsole.logEvent(eventName, detail, {
    source: getWindowType(),
    crossWindow: options.crossWindow,
    windowId: getWindowId()
  });
  
  // 3. Bei Cross-Window-Flag an andere Fenster propagieren
  if (options.crossWindow && crossWindowBridge) {
    crossWindowBridge.broadcastToOtherWindows(eventName, detail);
  }
}
```

#### Fenster-Registrierung und Lifecycle

```typescript
// Hauptfenster: Editor-Fenster registrieren
function registerEditorWindow(editorWindow: Window): void {
  editorWindows.add(editorWindow);
  
  // Cleanup bei Fensterschließung
  const intervalId = setInterval(() => {
    if (editorWindow.closed) {
      editorWindows.delete(editorWindow);
      clearInterval(intervalId);
    }
  }, 1000);
}

// Editor-Fenster: Bei Hauptfenster registrieren
function initializeEditorBridge(): void {
  if (window.opener) {
    window.opener.postMessage({
      type: 'EDITOR_REGISTER',
      windowId: getWindowId(),
      source: 'editor'
    }, window.location.origin);
  }
}
```

### Sicherheitsaspekte

1. **Same-Origin Policy**: Nur Kommunikation zwischen Fenstern gleicher Herkunft
2. **Event-Validation**: Eingangs-Events werden auf Gültigkeit geprüft
3. **Window-Verifikation**: Nur registrierte Fenster dürfen Events empfangen
4. **Payload-Limits**: Maximale Event-Größen zur Vermeidung von DoS-Angriffen

## Event Console

### Funktionsumfang

Die Event Console dient als Debugging- und Monitoring-Tool mit folgenden Features:

1. **Live-Event-Überwachung**: Echtzeit-Anzeige aller System-Events
2. **Source-Labeling**: Visuelle Unterscheidung nach Event-Quelle
   - `🏠 Main`: Events aus dem Hauptfenster (grün)
   - `🪟 Editor`: Events aus Editor-Fenstern (lila)
   - `⚡ Cross-Window`: Cross-Window-Events (gelb)
3. **Filterung**: Nach Event-Typ, Detail-Inhalt oder Quelle
4. **Export**: JSON-Export aller Events in die Zwischenablage
5. **Persistenz**: Console-Zustand im LocalStorage (24h Gültigkeit)

### Bedienung

- **Öffnen/Schließen**: `Ctrl+Shift+E` (Windows/Linux) oder `Cmd+Shift+E` (Mac)
- **Filter**: Text-Eingabe im Filter-Input
- **Clear**: Alle Events löschen
- **Export**: "Copy JSON"-Button für vollständigen Export

## Priorisierungsstrategie

### Phase 1: Kritische Cross-Window-Events

| Event | Priorität | Begründung |
|-------|-----------|------------|
| `p2d2:editor:ready` | Hoch | Grundstatus des Editor-Fensters |
| `p2d2:map:ready` | Hoch | Grundstatus des Hauptfensters |
| `p2d2:editor:feature:modified` | Hoch | Live-Änderungen vom Editor |
| `p2d2:wfs:load:*` | Hoch | Ladezustände vom Hauptfenster |

### Phase 2: Erweiterte Synchronisation

| Event | Priorität | Begründung |
|-------|-----------|------------|
| `p2d2:wfs:feature:*` | Hoch | Vollständige Feature-Synchronisation |
| `p2d2:editor:mode:change` | Mittel | Editor-Kontext teilen |
| `p2d2:layer:toggle` | Mittel | Konsistente Layer-Darstellung |

### Phase 3: Debugging & Monitoring

| Event | Priorität | Begründung |
|-------|-----------|------------|
| `p2d2:map:moveend` | Niedrig | Karteninteraktionen verfolgen |
| `p2d2:ui:panel:toggle` | Niedrig | UI-Status überwachen |

## Technische Implementierung

### Event-System Konfiguration

```typescript
const EVENT_CONFIG = {
  // Retry-Mechanismus
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 250,
  
  // Throttling
  THROTTLE_MS: 200,
  
  // Cross-Window
  WINDOW_ID_PREFIX: 'p2d2-window-',
  MESSAGE_TARGET_ORIGIN: window.location.origin,
  
  // Event Console
  MAX_LOG_ENTRIES: 50,
  STORAGE_KEY: 'p2d2:debug:events',
  STORAGE_TTL_MS: 24 * 60 * 60 * 1000 // 24 Stunden
};
```

### Performance-Optimierungen

1. **Event Throttling**: Verhindert zu häufige Events (z.B. `map:moveend`)
2. **Lazy Propagation**: Cross-Window-Kommunikation nur bei Bedarf
3. **Queue-Batching**: Mehrere Events könnten gebatcht werden
4. **Selective Listening**: Komponenten können spezifische Events abonnieren

### Error-Handling

1. **Retry-Mechanismus**: 3-stufiger Retry für fehlgeschlagene Events
2. **Graceful Degradation**: Fallback bei Cross-Window-Kommunikationsfehlern
3. **Error-Logging**: Umfassendes Logging mit Kontext-Informationen
4. **User Feedback**: Visuelle Rückmeldung bei kritischen Fehlern

## Qualitätssicherung

### Automatisierte Tests

- **Unit Tests**: Event-Dispatch und Cross-Window-Kommunikation
- **Integrationstests**: Fenster-übergreifende Event-Propagation
- **E2E Tests**: Komplette Workflows mit Cypress/Puppeteer

### Manuelle Testszenarien

1. **Basisfunktionalität**:
   - Events erscheinen in der Event Console
   - Filter-Funktion arbeitet korrekt
   - Export erzeugt gültiges JSON

2. **Cross-Window-Kommunikation**:
   - Events werden zwischen Fenstern propagiert
   - Source-Labels werden korrekt angezeigt
   - Fenster-Registrierung und Cleanup

3. **Fehlerbehandlung**:
   - Netzwerkausfälle während der Kommunikation
   - Fensterschließung während aktiver Session
   - Ungültige Event-Payloads

### Monitoring-Metriken

1. **Event-Throughput**: Anzahl Events pro Sekunde
2. **Cross-Window-Latenz**: Zeit für Event-Propagation zwischen Fenstern
3. **Error-Rate**: Anteil fehlgeschlagener Events
4. **Console-Nutzung**: Häufigkeit der Event Console-Nutzung

## Best Practices

### Event-Design

1. **Konsistente Namenskonvention**: `domain:component:action` (z.B. `p2d2:editor:feature:modified`)
2. **Strukturierte Payloads**: Klare Interfaces für Event-Details
3. **Minimale Payload-Größe**: Nur notwendige Daten übertragen
4. **Immutable Daten**: Events sollten unveränderlich sein

### Cross-Window-Kommunikation

1. **Selective Propagation**: Nur notwendige Events cross-window senden
2. **Window-Lifecycle**: Saubere Registrierung/Deregistrierung
3. **Error-Resilience**: Robust gegenüber Fenster-Ausfällen
4. **Security-First**: Strikte Origin-Überprüfung

### Debugging mit Event Console

1. **Source-Filterung**: Nach `main` oder `editor` filtern für Problem-Isolation
2. **JSON-Export**: Für detaillierte Analyse und Bug-Reports
3. **Performance-Monitoring**: Event-Häufigkeit und Latenz beobachten
4. **Reproduktion**: Event-Sequenzen für Bug-Reproduktion exportieren

## Nächste Schritte

### Kurzfristig (nächster Sprint)

1. **Event-Historisierung**: Server-seitiges Logging für Auditing
2. **Event-Replay**: Wiedergabe von Event-Sequenzen für Debugging
3. **Performance-Metriken**: Detaillierte Latenz-Messungen

### Mittelfristig

1. **Plugin-System**: Externe Event-Handler registrieren
2. **Offline-Queue**: Events puffern bei Netzwerkproblemen
3. **Event-Versionierung**: Schema-Evolution unterstützen

### Langfristig

1. **Machine Learning**: Anomale Event-Muster erkennen
2. **Dreidimensionale Events**: Für zukünftige 3D-Funktionalität
3. **Cross-Device-Sync**: Synchronisation über verschiedene Geräte
