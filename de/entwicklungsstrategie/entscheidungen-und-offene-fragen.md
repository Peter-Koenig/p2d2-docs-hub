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

- **geklärt** – Entscheidung getroffen und dokumentiert
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
- **Kontext:** p2d2 (Code) ist unter der **EUPL-1.2** lizenziert (Nachweis: `LICENSES/EUPL-1.2.txt` im p2d2-Repository und SPDX-Header in den Projekt-Dateien). Ältere Angaben im Repository sind veraltet und nicht mehr relevant (durchgestrichen):
  - ~~`README.md` der Dokumentation nennt „Code: GPLv3, Dokumentation: CC-BY-SA 4.0“.~~
  - ~~Eine GDI-Architekturseite nennt abweichend „MIT (Code), ODbL (Daten)“.~~
  - ~~Die archivierte OpenSource-Philosophie nannte „Code: GPLv3, Daten: ODbL“.~~
- **Geltende Anforderung:** Kommunale Daten, die in OpenStreetMap eingefügt werden sollen, müssen von der Kommune unter **CC0** bereitgestellt werden, damit sie mit der OSM-Datenbanklizenz (ODbL) vereinbar sind.
- **Frage:** Wie werden die Lizenzen für Daten (insbesondere p2d2-eigene Datenbestände) und Dokumentation verbindlich geregelt, damit Kommunen, OSM-Community und Nutzer:innen klare Bedingungen haben?
- **Nächster Schritt:** Lizenzfrage mit den Projektverantwortlichen klären und im [Leitbild und Prinzipien](./leitbild-und-prinzipien) verbindlich dokumentieren.

### IAM- und Identitätsmodell

- **Status:** geklärt (2026-08-05)
- **Entscheidung:** p2d2-Standalone nutzt **Zitadel**; der Login über „Account anlegen“ und OIDC sind implementiert und aktiv (OIDC ist am Beispiel OpenStreetMap in Benutzung). Für p2d2 als CIVITAS/CORE-AddOn wird von Zitadel auf **Keycloak/OIDC** umgestellt.
- **Kontext:** Die V1-Spezifikation beschreibt die OIDC-/Keycloak-Integration mit klarer Abbildung der p2d2-Rollen und Metadaten (siehe [IDM-Provisionierung und Login](../specs/civitas-core-plugin/serveraufbau-v1/idm-provisionierung-und-login)). Ein früheres Konzept für ein föderiertes IAM mit Zitadel bleibt [archiviert](./archiv/iam-zitadel-konzept).

### Internationale Ausrichtung

- **Status:** offene Entscheidung
- **Kontext:** Europa ist der mittelfristige Fokus. Die globale Perspektive ist langfristig und darf nicht als kurzfristiges Liefer- oder Förderversprechen erscheinen.
- **Frage:** Wann und mit welchen Partnern kann eine internationale Ausrichtung beginnen? Welche Voraussetzungen (lokale Partner, Datenhoheit, eigene Prioritäten, tragfähiger Betrieb) müssen erfüllt sein?
- **Nächster Schritt:** Beobachtung und Gespräche; Konkretisierung erst nach der V1-Erprobung. Siehe [Europa und internationale Perspektive](./europa-und-internationale-perspektive).

### Themen nach Grabfluren

- **Status:** offene Entscheidung
- **Kontext:** Grabfluren bieten sich als Einstieg an, sind aber nicht zwingend vorgeschrieben. Ein zentral vorgegebener Datenkatalog ist ausdrücklich nicht vorgesehen.
- **Frage:** Welche Themen folgen, und wer entscheidet das?
- **Nächster Schritt:** Themen entstehen dort, wo eine Kommune Daten bereitstellen möchte und Menschen sich für das Thema engagieren; die Auswahl erfolgt im Dialog zwischen Kommune und Bürgerschaft. Ein etablierter Prozess dafür existiert noch nicht; er lässt sich finden und wird mit den ersten Gesprächen konkretisiert. Siehe [Kommunale Einführung in Deutschland](./kommunale-einfuehrung-deutschland).

### QuantumLeap und FROST (Komponenten-Bewertung)

- **Status:** vertagt (Bewertung erst bei fachlichem Bedarf)
- **Kontext:** QuantumLeap und FROST werden für p2d2 derzeit nicht betrieben.
  - **QuantumLeap** wird erst bewertet, wenn ein fachlicher Bedarf an historisierten, direkt datenbankseitig abfragbaren NGSI-LD-Daten besteht.
  - **FROST** wird erst bewertet, wenn ein konkreter SensorThings-/Messdaten-Anwendungsfall vorliegt.
- **Hinweis:** Damit sind die zugehörigen E2E-Tests der CIVITAS/CORE-Suite für p2d2 derzeit nicht relevant.

## Geklärte technische Entscheidungen (CIVITAS/CORE V1)

Die technischen Entscheidungen für die CIVITAS/CORE-V1-Installation sind anhand des Installationsskripts (`civitas_einrichtung/install_civitas_core_V1.sh` und `modules_V1/`) sowie des Installationskontexts (`civitas_einrichtung/supplement/civitas-core-installation-context.md`) geklärt:

- **Kubernetes-Distribution:** **k3s v1.32.3, Single-Node** – Traefik deaktiviert, nginx-Ingress nachinstalliert (`modules_V1/04_k3s.sh`, `01_config.sh`).
- **TLS-Strategie:** **cert-manager** mit zweistufigem Issuer – interner `selfsigned-issuer` für Bootstrap, Let's Encrypt Staging und Production (Umschaltung über `LE_CERT`) (`modules_V1/05_addons.sh`, `06a_network_certs.sh`).
- **Storage:** **local-path** (k3s-Default-StorageClass, RWO) für alle Storage-Klassen (`STORAGECLASS_RWO/RWX/LOC=local-path` in `01_config.sh`).
- **Gastbetriebssystem:** Debian 13 (Trixie); **DNS:** interne Auflösung über Pi-hole/Unbound; **Betriebsmodus:** Entwicklungs-/Evaluationsumgebung (Single-Node, kein HA).

Die zugehörigen Spec-Seiten unter [Serveraufbau V1](../specs/civitas-core-plugin/serveraufbau-v1/) führen diese Punkte teilweise noch als Entwurf oder offen; maßgeblich für den Ist-Stand sind die Skripte und der Installationskontext.

## E2E-Tests (CIVITAS/CORE V1)

Die E2E-Testsuite (pytest/Playwright, aktiviert über `RUN_TESTS=true`) schlägt überwiegend fehl, weil QuantumLeap nicht installiert wurde. Dadurch werden die Datenbank-Secrets (u. a. `QUANTUMLEAP_DB_PASSWORD`) nicht erzeugt, und die Test-Konfiguration bricht mit `KeyError` ab. Ein Teil der fehlschlagenden Tests betrifft Komponenten, die für p2d2 derzeit nicht betrieben werden (QuantumLeap, FROST – siehe Eintrag oben).

Die Komponenten sind trotz der nicht durchführbaren E2E-Tests funktionstüchtig, so dass die p2d2-Installation als Add-On erfolgen kann.


## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-08-05 | Neuanlage als ADR-artige Liste im Rahmen der Neustrukturierung des Strategie-Handbuchs |
| 1.1 | 2026-08-05 | Lizenzmodell-Eintrag überarbeitet: p2d2 ist unter EUPL-1.2 lizenziert; CC0 als geltende Anforderung für kommunale Daten zur OSM-Rückführung ergänzt; veraltete Lizenzangaben (GPLv3, MIT, ODbL, CC-BY-SA) als solche benannt |
| 1.2 | 2026-08-05 | IAM-Entscheidung dokumentiert (Standalone: Zitadel; AddOn: Umstellung auf Keycloak/OIDC); veraltete Lizenzangaben als nicht mehr relevant markiert (durchgestrichen); Themenfindung im Dialog (SIGs, OSM-affine Menschen) ergänzt; Status-Legende um „geklärt“ erweitert |
| 1.3 | 2026-08-05 | Technische Entscheidungen CIVITAS/CORE V1 anhand der Installationsskripte als geklärt dokumentiert (k3s Single-Node, cert-manager/Let's Encrypt, local-path-Storage); offener Punkt E2E-Tests ergänzt (fehlendes Tool zur automatischen Datenbank-Erstellung) |
| 1.4 | 2026-08-05 | Komponenten-Bewertung QuantumLeap und FROST ergänzt (derzeit nicht betrieben; Bewertung erst bei fachlichem Bedarf); E2E-Test-Absatz präzisiert (fehlschlagende Tests betreffen teils nicht betriebene Komponenten) |
| 1.5 | 2026-08-05 | Klarstellung und Bereinigung E2E-Tests, fehlendes QuantumLeap |
