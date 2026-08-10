---
title: "CIVITAS/CORE V1: Statische Masterportal-Konfiguration – Testverfahren mit Proxmox-Backup"
description: Restaurierbares Proxmox-Backup als Test-Baseline für die Migration zur statischen Masterportal-Konfiguration – Testablauf, Rolle und Grenzen des Backups
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# Testverfahren mit Proxmox-Backup

Diese Seite beschreibt das Testverfahren für das Migrationsvorhaben zur statischen Masterportal-Konfiguration (siehe [Übersicht](./)). Grundlage ist das restaurierbare Proxmox-Backup der bisher funktionierenden CIVITAS/CORE-V1-Referenzinstallation.

## Zweck

Das Proxmox-Backup dient als reproduzierbare Test-Baseline: Jeder Migrations- und Abnahmedurchlauf startet aus demselben, definierten Ausgangszustand. Dadurch wird das Migrationsvorhaben wiederholbar und unabhängig von manuell veränderten Testinstanzen.

## Zwei Test-Baselines: V1 und V1s

Es sind zwei unterschiedliche Backup-Rollen zu unterscheiden:

- **V1-Backup (Migrations-Test-Baseline):** Das aktuelle Backup der funktionierenden CIVITAS/CORE-V1-Referenzinstallation mit S3-/RustFS-basierter Masterportal-Konfiguration. Es dient als Ausgangszustand für die Entwicklung und Abnahme der V1s-Variante (siehe [V1s-Buildvariante und AddOn-Baseline](./v1s-buildvariante-und-addon-baseline)).
- **V1s-Backup (AddOn-Test-Baseline):** Ein späteres Backup der abgenommenen V1s-Variante mit statischer Masterportal-Konfiguration. Es dient als restaurierbare Testbasis für die p2d2-AddOn-Entwicklung, damit nach einem Restore nur AddOn-Artefakte und AddOn-Konfigurationen erneut ausgerollt werden müssen.

Das V1s-Backup darf erst **nach erfolgreicher V1s-Plattformabnahme und mindestens einem verifizierten, isolierten Restore** erstellt beziehungsweise als AddOn-Test-Baseline verwendet werden.

## Testablauf

Der Ablauf umfasst fünf Schritte:

1. **Backup in einer isolierten Testumgebung restaurieren.**
   Die Testumgebung ist von der produktiven Plattform und anderen Umgebungen getrennt. Es werden ausschließlich die aus dem Backup wiederhergestellten Ressourcen verwendet.

2. **Ausgangszustand verifizieren.**
   Vor jedem Migrationsschritt wird geprüft, ob die restaurierte Instanz dem dokumentierten Ausgangszustand entspricht und die bestehenden Portale sowie Kernendpunkte wie erwartet funktionieren.

3. **Migrationsstand kontrolliert einspielen.**
   Der jeweils zu testende Migrationsstand wird schrittweise und nachvollziehbar eingespielt. Jede Änderung erfolgt nur auf der isolierten Testinstanz.

4. **Plattform- und Portal-Abnahme durchführen.**
   Abschließend wird die Migration anhand der konzeptionellen Abnahmekriterien geprüft, insbesondere, dass das Masterportal seine Konfiguration lädt, kein `ENOENT` für die erforderlichen Konfigurationsdateien auftritt, die Kernendpunkte erreichbar bleiben und bestehende Portale nicht unbeabsichtigt verändert wurden.

5. **Bei Fehlern Testinstanz verwerfen oder erneut aus der Baseline restaurieren.**
   Tritt während der Migration oder Abnahme ein Fehler auf, wird die Testinstanz verworfen oder vollständig erneut aus der Baseline restauriert. Es wird nicht versucht, eine fehlerhafte Testinstanz dauerhaft zu reparieren.

## Rolle und Grenzen des Backups

- Das Backup ersetzt **keinen fachlichen AddOn-Rückbau**. Ein Rückbau des zukünftigen p2d2-AddOns folgt eigenen, AddOn-spezifischen Regeln und wird in der AddOn-Spezifikation beschrieben.
- Das Backup ist ein **Mittel für reproduzierbare Migrationstests**. Es dokumentiert keinen produktiven Betriebs- oder Wiederherstellungsprozess über dieses Testverfahren hinaus.

## Keine konkreten Infrastrukturdaten

Diese Spezifikation dokumentiert bewusst **keine konkreten VM-IDs, IP-Adressen, Domainnamen oder Zugangsdaten**. Die konkreten Werte werden ausschließlich in der isolierten Testumgebung verwendet und sind nicht Bestandteil dieser Dokumentation.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben der statischen Masterportal-Konfiguration
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Ausgangslage, Zielarchitektur und offene Entscheidungen
- [S3-zu-statisch-Migration](./s3-zu-statisch-migration) – Migrationsvorhaben, Prinzipien und konzeptionelle Abnahme
- [V1s-Buildvariante und AddOn-Baseline](./v1s-buildvariante-und-addon-baseline) – getrennte Buildvariante und Kriterien für die restaurierbare AddOn-Test-Baseline