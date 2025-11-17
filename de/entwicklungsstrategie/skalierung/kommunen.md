---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Kommunale Ebene

Die Ausdehnung auf weitere Kommunen folgt einem strukturierten Ansatz.

## Pilotstadt: Köln

**Status**: Produktiv seit 2024

**Erfolge**:
- 25 Friedhöfe erfasst
- 5 aktive QC-Prüfer:innen
- 50+ Community-Mitglieder
- Integration ins OpenData-Portal

**Learnings**:
- Verwaltungs-Buy-in ist entscheidend
- Community braucht Motivation (Gamification)
- Datenqualität im OpenData-Portal variiert
- Synchronisation OSM ↔ Verwaltung braucht klare Prozesse

## Nächste Städte

### Bonn (2025)

**Warum Bonn?**
- Geografische Nähe zu Köln
- Aktive OSM-Community
- Progressive Verwaltung (Open Government)

**Geplant**:
- Start mit Friedhöfen (bekanntes Terrain)
- Parallel: Denkmäler (Bonn hat viele!)
- Kooperation mit Stadtarchiv

### Weitere NRW-Kommunen (2026)

- **Düsseldorf**: Großstadt, starke IT-Infrastruktur
- **Aachen**: Grenzstadt, internationale Community
- **Münster**: Fahrradstadt, Radwege-Kategorie

## Anforderungen an neue Kommunen

### Technisch

- **OpenData-Portal**: Muss vorhanden sein
- **GIS-Fähigkeit**: Verwaltung sollte GIS nutzen
- **API-Zugang**: Automatisierter Daten-Import

### Organisatorisch

- **Ansprechpartner**: Mind. eine Person in Verwaltung
- **Datenlizenz**: Daten müssen offen lizenziert sein (CC0, CC-BY)
- **Commitment**: Langfristige Zusammenarbeit

### Community

- **OSM-Community**: Lokale OSM-Mapper:innen vorhanden
- **Civic Tech**: Interesse an offenen Daten

## Multi-Tenancy-Architektur

### Technische Umsetzung

```
┌─────────────────────────────────┐
│       p2d2 Platform             │
├─────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │Köln │  │Bonn │  │ Ddf │     │
│  └──┬──┘  └──┬──┘  └──┬──┘     │
│     │        │        │         │
│  ┌──▼────────▼────────▼──┐     │
│  │   Shared Services    │     │
│  └────────────────────────┘     │
└─────────────────────────────────┘
```

### Schema-Isolation

```
-- Pro Kommune ein Schema
CREATE SCHEMA koeln;
CREATE SCHEMA bonn;

-- Gemeinsame Nutzer-DB
CREATE SCHEMA users;
```

### URL-Routing

```
https://koeln.data-dna.eu
https://bonn.data-dna.eu
https://duesseldorf.data-dna.eu
```

## Onboarding-Prozess

### Schritt 1: Vorgespräch

- Kennenlernen
- Erwartungen klären
- Technische Voraussetzungen prüfen

### Schritt 2: Datenanalyse

- OpenData-Portal-Daten sichten
- Datenqualität bewerten
- Kategorien auswählen

### Schritt 3: Setup

- Tenant in p2d2 anlegen
- Datenimport konfigurieren
- Initiales Seeding

### Schritt 4: Schulung

- Verwaltungsmitarbeiter:innen schulen
- Community-Kickoff-Event
- Dokumentation bereitstellen

### Schritt 5: Go-Live

- Produktivbetrieb starten
- Monitoring einrichten
- Support bereitstellen

## Shared Services

### Zentrale Dienste

- **Authentifizierung**: OAuth2/OIDC
- **API-Gateway**: Rate-Limiting, Caching
- **Monitoring**: Prometheus, Grafana
- **Backup**: Proxmox PBS

### Kommunen-spezifische Dienste

- **GeoServer-Workspace**: Pro Kommune ein Workspace
- **Datenbank-Schema**: Pro Kommune ein Schema
- **Frontend-Customization**: Logo, Farben

## Kosten-Modell

### Kostenlose Tier (Pilot)

- Bis 1000 Features
- Community-Support
- Shared Infrastructure

### Kommune-Tier

- Unlimitierte Features
- Dedizierter Support
- SLA 99,5%
- Kosten: Nach Aufwand (Hosting + Support)

### Enterprise-Tier

- Dedizierte Infrastruktur
- On-Premise möglich
- Custom-Development
- Kosten: Individual

::: tip Kommune interessiert?
Kontaktieren Sie uns für ein unverbindliches Vorgespräch!
:::
