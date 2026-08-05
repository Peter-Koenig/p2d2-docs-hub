---
title: CIVITAS/CORE und Plattformstrategie
description: Standalone-Betrieb plus V1-AddOn, V2 erst nach Praxiserfahrung, Abgrenzung zu technischen Spezifikationen
status: geplant
lastUpdated: 2026-08-05
quality:
  completeness: 75
  accuracy: 85
  reviewed: false
  reviewer: null
  reviewDate: null
---

# CIVITAS/CORE und Plattformstrategie

Diese Seite beschreibt die strategische Einordnung der CIVITAS/CORE-Integration: was p2d2 eigenständig hält, was mit CIVITAS/CORE V1 erprobt wird und warum eine V2-Integration noch nicht entschieden ist. Technische Details gehören nicht hierher, sondern in die [Spezifikationen](../specs/civitas-core-plugin/).

## Ausgangspunkt: Standalone bleibt der Kern

p2d2 ist ein eigenständig betreibbares Prozess- und Synchronisationswerkzeug. Die Integration in CIVITAS/CORE ist eine Erweiterung, kein Ersatz. Diese Reihenfolge ist Grundlage der [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027): Erst wird p2d2 verständlich gemacht und gemeinsam mit Kommunen erprobt, danach wird die technische Integration vorbereitet.

## CIVITAS/CORE V1 als Erweiterungsplattform

**Status:** geplant; beginnt nach der ersten kommunikativen und fachlichen Validierung (Arbeitspaket 4 der PTF-Roadmap)

### Ausgangspunkt

Die derzeitige V1-Installation muss von einer S3-orientierten Auslieferungsvariante auf die vollständig konfigurierbare V1-Variante umgestellt werden. Dadurch entsteht die technische Voraussetzung, eigene Dienste, Routen, Rollen und Geodatenkomponenten kontrolliert einzubinden.

### Technische Ziele (geplant)

- Reproduzierbare vollständige CIVITAS/CORE-V1-Installation.
- p2d2-Frontend als eigener Deployment-/Helm-Baustein.
- MapProxy als eigener Deployment-/Helm-Baustein.
- Geeignete PostgreSQL-/PostGIS-Strukturen für p2d2.
- Geeignete GeoServer-Workspaces, Datenquellen, Layer und Rechte.
- OIDC-/Keycloak-Integration mit klarer Abbildung der p2d2-Rollen und Metadaten.
- Gateway-/Ingress-Routing für p2d2-Dienste.
- Wiederholbare Installation, Verifikation, Upgrade- und Rückbaupfade.

Diese Ziele sind als Arbeitsrichtungen formuliert, nicht als zugesagte Lieferungen. Ob und wie sie umgesetzt werden, entscheidet sich mit den Ergebnissen der kommunalen Ansprache und der fachlichen Erprobung.

### Architekturprinzip

p2d2 bleibt fachlich eigenständig. Eine CIVITAS/CORE-Integration darf nicht dazu führen, dass p2d2-spezifische Datenmodelle, Workflows und die Standalone-Fähigkeit unkontrolliert von CIVITAS/CORE-spezifischen APIs oder Prozessen abhängig werden.

## Abgrenzung zu den technischen Spezifikationen

Dieses Handbuch beschreibt Zweck, Reihenfolge und Entscheidungsgrenzen. Die konkreten Installations-, Konfigurations- und Abnahmedetails stehen in den Spezifikationen:

- [Serveraufbau CIVITAS/CORE V1](../specs/civitas-core-plugin/serveraufbau-v1/) – Übersicht
- [Zielbild und Abgrenzung](../specs/civitas-core-plugin/serveraufbau-v1/zielbild-und-abgrenzung) – Geltungsbereich und offene technische Entscheidungen
- [IDM-Provisionierung und Login](../specs/civitas-core-plugin/serveraufbau-v1/idm-provisionierung-und-login) – Rollen, Identitäten und Login-Prozesse
- [CIVITAS/CORE: technische Einordnung](../specs/civitas-core-plugin/) – Einordnung der Spezifikationsbereiche

## CIVITAS/CORE V2: noch nicht entschieden

**Status:** offene Entscheidung

Eine V2-Integration ist ausdrücklich **nicht entschieden**. Erst auf Basis von Erfahrungen mit Nutzerkommunen, dem V1-AddOn und der kommunalen Betriebsrealität wird entschieden, wie p2d2 an CIVITAS/CORE V2 anschließen soll. Mögliche Themen sind dann Prozessmanagement, Modell- und Datenmanagement, Identitäten, Rollen und AddOn-Lifecycle.

Diese Fragen sind bewusst vertagt und unter [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen) erfasst.

## Geklärtes und offene Entscheidungen im Umfeld

- **IAM und Identitäten (geklärt):** p2d2-Standalone nutzt **Zitadel**; der Login über „Account anlegen“ und OIDC sind implementiert und aktiv (OIDC ist am Beispiel OpenStreetMap in Benutzung). Für p2d2 als CIVITAS/CORE-AddOn wird von Zitadel auf **Keycloak/OIDC** umgestellt. Ein früheres Konzept für ein föderiertes IAM mit Zitadel bleibt [archiviert](./archiv/iam-zitadel-konzept).
- **Lizenzmodell:** p2d2 ist unter der **EUPL-1.2** lizenziert. Offen ist, wie die Lizenzen für Daten und Dokumentation verbindlich geregelt werden. Für kommunale Daten, die in OpenStreetMap eingefügt werden sollen, gilt **CC0** als Voraussetzung für die Kompatibilität mit der OSM-Datenbanklizenz (ODbL).
- **Betrieb und Finanzierung:** Welche tragfähigen Modelle gibt es für Hosting, Support und Pflege in Kommunen? (Siehe [Governance und Verstetigung](./governance-und-verstetigung).)

## Verwandte Seiten

- [PTF-Roadmap 2026–2027](./ptf-roadmap-2026-2027) – Arbeitspaket 4 und Perspektive nach der V1-Erprobung
- [Leitbild und Prinzipien](./leitbild-und-prinzipien) – Architekturprinzip der fachlichen Eigenständigkeit
- [Kommunale Einführung in Deutschland](./kommunale-einfuehrung-deutschland) – fachlicher Einstieg über lokale Themen
- [Governance und Verstetigung](./governance-und-verstetigung) – langfristige Organisationsmodelle
- [Entscheidungen und offene Fragen](./entscheidungen-und-offene-fragen) – offene Strategiefragen
- [Spezifikationshandbuch](../specs/) – technische Details