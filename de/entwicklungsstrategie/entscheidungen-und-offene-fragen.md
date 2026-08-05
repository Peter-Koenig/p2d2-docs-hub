---
title: Entscheidungen und offene Fragen
description: ADR-artige Liste offener Strategieentscheidungen und bewusst vertagter Fragen
status: offene Entscheidung
lastUpdated: 2026-08-05
quality:
  completeness: 75
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Entscheidungen und offene Fragen

Diese Seite sammelt offene Strategieentscheidungen und bewusst vertagte Fragen. Sie ist bewusst als Liste angelegt und wird fortgeschrieben, sobald Entscheidungen reifen oder neue Fragen entstehen.

Sie ist **kein Ersatz** für technische Spezifikationen. Offene Architektur- und Installationsentscheidungen werden in den zugehörigen Spezifikationen geführt, insbesondere im [Spezifikationshandbuch](../specs/) unter [Serveraufbau CIVITAS/CORE V1](../specs/civitas-core-plugin/serveraufbau-v1/).

## Status-Legende

- **offene Entscheidung** – Grundsatzfrage, bewusst noch nicht entschieden
- **in Prüfung** – Optionen werden untersucht, Entscheidung steht aus
- **vertagt** – Frage wird erst nach einem definierten Zwischenschritt behandelt

## Offene Entscheidungen

### V2-Integration

- **Status:** offene Entscheidung (vertagt auf die V1-Erprobung)
- **Kontext:** CIVITAS/CORE V1 ist der aktuelle Integrationsfokus. Eine V2-Integration ist ausdrücklich **noch nicht entschieden**.
- **Zu klärende Punkte:** Prozessmanagement, Modell- und Datenmanagement, Identitäten, Rollen und AddOn-Lifecycle.
- **Nächster Schritt:** Entscheidung erst auf Basis von Erfahrungen mit Nutzerkommunen, dem V1-AddOn und der kommunalen Betriebsrealität. Siehe [CIVITAS/CORE und Plattformstrategie](./civitas-core-und-plattformstrategie) und [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027).

### Verstetigungsform und Governance

- **Status:** offene Entscheidung (Perspektive, kein beschlossenes Ergebnis)
- **Optionen:** offene Governance, Anwenderverein, professionelle Unterstützungsangebote (beispielsweise eine Beratungsgesellschaft), europäische Dachstruktur.
- **Kontext:** Diese Optionen sind als Perspektive nach der V1-Erprobung formuliert und kein kurzfristiges Lieferziel.
- **Nächster Schritt:** Diskussion und Entscheidung, sobald Ergebnisse aus der V1-Erprobung vorliegen. Siehe [Governance und Verstetigung](./governance-und-verstetigung).

### Lizenzmodell für Daten und Dokumentation

- **Status:** offene Entscheidung
- **Kontext:** Im Repository finden sich unterschiedliche Angaben:
  - `README.md`: Code unter GPLv3, Dokumentation unter CC-BY-SA 4.0.
  - Eine GDI-Architekturseite nennt abweichend „MIT (Code), ODbL (Daten)“.
  - Die archivierte OpenSource-Philosophie nannte „Code: GPLv3, Daten: ODbL“.
- **Frage:** Wie sind Daten- und Dokumentationslizenz verbindlich zu regeln, damit Kommunen, OSM-Community und Nutzer:innen klare Bedingungen haben?
- **Nächster Schritt:** Lizenzfrage mit den Projektverantwortlichen klären und im [Leitbild und Prinzipien](./leitbild-und-prinzipien) verbindlich dokumentieren.

### IAM- und Identitätsmodell

- **Status:** in Prüfung
- **Kontext:** Die technischen Spezifikationen für CIVITAS/CORE V1 setzen auf OIDC/Keycloak mit klarer Abbildung der p2d2-Rollen und Metadaten (siehe [IDM-Provisionierung und Login](../specs/civitas-core-plugin/serveraufbau-v1/idm-provisionierung-und-login)). Ein früheres Konzept für ein föderiertes IAM mit Zitadel ist ins [Archiv](./archiv/iam-zitadel-konzept) verschoben.
- **Frage:** Welches IAM-Modell trägt den Standalone-Betrieb und das V1-AddOn langfristig? Welche Föderations- und Datenhoheitsanforderungen ergeben sich aus der Kommunen-Praxis?
- **Nächster Schritt:** Erkenntnisse aus dem V1-Aufbau und den Kommunengesprächen auswerten; Entscheidung im Rahmen der Plattformstrategie.

### Internationale Ausrichtung

- **Status:** offene Entscheidung
- **Kontext:** Europa ist der mittelfristige Fokus. Die globale Perspektive ist langfristig und darf nicht als kurzfristiges Liefer- oder Förderversprechen erscheinen.
- **Frage:** Wann und mit welchen Partnern kann eine internationale Ausrichtung beginnen? Welche Voraussetzungen (lokale Partner, Datenhoheit, eigene Prioritäten, tragfähiger Betrieb) müssen erfüllt sein?
- **Nächster Schritt:** Beobachtung und Gespräche; Konkretisierung erst nach der V1-Erprobung. Siehe [Europa und internationale Perspektive](./europa-und-internationale-perspektive).

### Themen nach Grabfluren

- **Status:** offene Entscheidung
- **Kontext:** Friedhöfe und Grabflure sind der aktuelle fachliche Einstieg. Ein zentral vorgegebener Datenkatalog ist ausdrücklich nicht vorgesehen.
- **Frage:** Welche Themen folgen, und wer entscheidet das?
- **Nächster Schritt:** Themen entstehen dort, wo eine Kommune Daten bereitstellen möchte und Menschen sich für das Thema engagieren. Konkretisierung über die Kommunen-Ansprache und den Grabflur-Pilot. Siehe [Kommunale Einführung in Deutschland](./kommunale-einfuehrung-deutschland).

## In Prüfung (technische Entscheidungen)

Technische Entscheidungen gehören in die Spezifikationen. Die folgenden Punkte sind dort als offene Entscheidungen erfasst und werden hier nur zur Orientierung gelistet:

- **Kubernetes-Distribution** für die CIVITAS/CORE-V1-Installation (Single-Node vs. Multi-Node) – siehe [Zielbild und Abgrenzung](../specs/civitas-core-plugin/serveraufbau-v1/zielbild-und-abgrenzung).
- **TLS-Strategie** (eigenständiges Zertifikat vs. Terminierung über den bestehenden Reverse-Proxy) – siehe [Zielbild und Abgrenzung](../specs/civitas-core-plugin/serveraufbau-v1/zielbild-und-abgrenzung) und [Netzwerk, DNS und TLS](../specs/civitas-core-plugin/serveraufbau-v1/netzwerk-dns-tls).
- **Storage-Provider** für die Plugin-VM – siehe [Zielbild und Abgrenzung](../specs/civitas-core-plugin/serveraufbau-v1/zielbild-und-abgrenzung).

## Bewusst nicht behauptet

Die folgenden Punkte werden in diesem Strategie-Handbuch bewusst **nicht** als Tatsache oder Zusage dargestellt, weil dafür kein belastbarer Nachweis im Repository vorliegt:

- Konkrete Nutzer-, Kommunen- oder Community-Zahlen
- Konkrete Release-Termine und Versionszusagen
- Zugesagte Partnerschaften oder Kooperationen
- Zugesagte Förderungen oder Finanzierungen (einschließlich EU-Förderung)
- Produktivstände einzelner Kommunen oder Instanzen
- Verfügbare technische Fähigkeiten (etwa Föderation, Multi-Tenancy, KI-Funktionen)

Frühere Dokumente mit solchen Aussagen sind ins [Archiv](./archiv/roadmap-bis-2025) verschoben und gelten nicht mehr als aktuelle Strategie.

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-05 | Neuanlage als ADR-artige Liste im Rahmen der Neustrukturierung des Strategie-Handbuchs |