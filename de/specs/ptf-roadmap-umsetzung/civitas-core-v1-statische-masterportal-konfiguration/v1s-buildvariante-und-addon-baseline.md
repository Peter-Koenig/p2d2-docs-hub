---
title: "CIVITAS/CORE V1s: Buildvariante und AddOn-Baseline"
description: Abgrenzung der bestehenden V1-Referenz von der V1s-Variante mit statischer Masterportal-Konfiguration sowie Kriterien für die restaurierbare AddOn-Test-Baseline
quality:
  completeness: 40
  accuracy: 40
  reviewed: false
  reviewer:
  reviewDate:
---

# CIVITAS/CORE V1s: Buildvariante und AddOn-Baseline

Diese Spezifikation ergänzt das Vorhaben [Statische Masterportal-Konfiguration](./). Sie definiert das Zielbild einer klar getrennten Buildvariante **CIVITAS/CORE V1s** und legt die Kriterien für eine restaurierbare AddOn-Test-Baseline auf Basis eines Proxmox-Backups fest.

## 1. Zweck

Drei Ziele stehen im Vordergrund:

- **Schutz der funktionierenden V1-Referenz:** Die bestehende CIVITAS/CORE-V1-Variante mit S3-/RustFS-basierter Masterportal-Konfiguration funktioniert und bleibt zunächst unverändert erhalten. Sie darf nicht durch unfertige Änderungen an der statischen Konfigurationsvariante instabil werden.
- **Kontrollierte Entwicklung der V1s-Variante:** Die neue Variante mit statischer und versionierter Masterportal-Konfiguration wird als klar getrennte Buildvariante entwickelt und abgenommen. Der konkrete Auslieferungsmechanismus wird gesondert entschieden.
- **Vorbereitung einer schnell restaurierbaren AddOn-Test-Baseline:** Ein definierter Proxmox-Backup-Breakpoint soll spätere p2d2-AddOn-Experimente ermöglichen, ohne bei jedem Test den vollständigen CIVITAS/CORE-Build erneut durchlaufen zu müssen.

## 2. Varianten und Abgrenzung

| Variante | Bedeutung |
|---|---|
| **V1** | Bestehende, funktionierende Referenzvariante mit bisheriger S3-/RustFS-basierter Masterportal-Konfiguration. |
| **V1s** | CIVITAS/CORE V1 mit statischer und versionierter Masterportal-Konfiguration. Der konkrete Auslieferungsmechanismus wird gesondert entschieden. |
| **V2** | Eigenständiges, späteres Vorhaben. V2 ist nicht von V1s abgeleitet und verwendet voraussichtlich eine andere Architektur (Helm-Charts statt Ansible/`cc_cli`). |

V1s ist **keine CIVITAS/CORE-Hauptversion** und **keine V2-Vorwegnahme**. Der Buchstabe `s` steht ausschließlich für die statische Masterportal-Konfiguration.

Die nachfolgende Verzeichnisstruktur ist **implementiert** (Stand 2026-08-26):

```text
civitas_einrichtung/
├── install_civitas_core_V1.sh
├── modules_V1/
├── templates_V1/
├── overlay_V1/
│
├── install_civitas_core_V1s.sh
├── modules_V1s/
├── templates_V1s/
└── overlay_V1s/
```

Die technischen Details zur V1s-Buildvariante sind in der Detail-Spezifikation [Serveraufbau V1s](../../civitas-core-plugin/serveraufbau-v1s/) dokumentiert (`index.md`, `inventory-delta.md`, `portal-backend-image-build.md`).

## Bekannte Einschränkung: Monitoring/Prometheus

**Stand:** Monitoring (Prometheus/Loki/Grafana) aktiviert; `inv_access.apis.import: true` reaktiviert die Apisix-Routen (2026-08-31).

Es sind zwei getrennte Sachverhalte zu unterscheiden:

1. **`cc_cli validate` (Business-Regel):** Die Regel „Ensure that Prometheus and Loki are enabled if APIs are enabled and imported“ (`cc_cli/config/semantic_rules.yaml`) verlangt:

   ```text
   inv_access.apis.import == false
     ODER (inv_op_stack.monitoring.prometheus.enable == true
           UND  inv_op_stack.monitoring.loki.enable == true)
   ```

   Die V1s-Buildvariante benötigt die Apisix-Routen für die Geodata-Kernkomponenten (u. a. `portalBackend`), daher ist `inv_access.apis.import: true` gesetzt. Die Regel wird damit über den **zweiten ODER-Zweig** erfüllt: `inv_op_stack.monitoring.prometheus.enable` und `inv_op_stack.monitoring.loki.enable` sind beide `true`.

2. **Prometheus-Operator-CRDs:** Bei aktivem Monitoring rendert das APISIX-Helm-Chart `metrics.serviceMonitor.enabled: true`. Die dafür nötigen `monitoring.coreos.com/v1`-CRDs (`ServiceMonitor`, `PodMonitor`, `PrometheusRule`, …) installiert V1s vorab in `modules_V1s/05_addons.sh` (`install_prometheus_operator_crds()`, Version v0.89.0). Der `kube-prometheus-stack` lief im Live-Lauf nicht zuverlässig vor der APISIX-Installation an. Ohne den Vorab-Install fehlte die `ServiceMonitor`-CRD zum Zeitpunkt des APISIX-Helm-Installs. Der Vorbereitungsschritt ist daher erforderlich und erfolgt idempotent vor `install_nginx_ingress`.

**Hinweis zu `grafana.enable`:** Der Task `"Monitoring: [Check] Grafana reachable"` in `tasks/operation/monitoring.yml` ist **nicht** mit `when:` gegated und läuft daher immer, sobald `inv_op_stack.monitoring.enable: true` ist. Deshalb muss `grafana.enable: true` gesetzt sein, solange Monitoring insgesamt aktiv ist — andernfalls entsteht am ungated Health-Check derselbe 404-Effekt wie beim früheren `portalBackend`-Fall.

## 3. Entwicklungs- und Übernahmeregel

Historisch ist V1s als **bewusst abgeleitete, kontrollierte Buildvariante** auf Grundlage der V1-Referenz entstanden. Abweichungen zwischen V1 und V1s sind **dokumentiert und begründet**. Es bestand **keine implizite, automatische Synchronisierung** zwischen V1 und V1s; Sicherheits- und Stabilitätskorrekturen aus V1 konnten bei Bedarf **gezielt nach V1s übernommen** werden.

Diese Übernahmeregel ist inzwischen **nicht mehr aktiv**: Die V1-Referenz-VM steht separat und wird nicht mehr aktiv als Referenz genutzt. Es besteht **keine laufende Übernahmepflicht** von V1 nach V1s und **keine aktive Abhängigkeit** zwischen den beiden Varianten. Die historische Herleitung bleibt für das Verständnis der Abgrenzung erhalten, begründet aber keine laufende Pflegebeziehung.

## 4. V1s-AddOn-Baseline

Nach erfolgreicher V1s-Abnahme soll ein definierter Proxmox-Backup-Breakpoint entstehen:

```text
V1s-Build und Plattformabnahme erfolgreich
        ↓
V1s-AddOn-Baseline sichern
        ↓
p2d2-AddOn iterativ installieren und testen
        ↓
bei Fehlern: Restore der V1s-AddOn-Baseline
        ↓
nur AddOn und dessen Konfiguration erneut ausrollen
```

Zweck des Breakpoints ist, für p2d2-AddOn-Experimente nicht jedes Mal den vollständigen CIVITAS/CORE-Build erneut durchlaufen zu müssen.

Ein Backup darf erst dann als **V1s-AddOn-Baseline** gelten, wenn alle folgenden Kriterien erfüllt sind:

- der V1s-Build war **ohne nicht dokumentierte manuelle Nacharbeiten** erfolgreich,
- Cluster, zentrale Dienste, Routing, TLS und Identitätsmanagement sind **abgenommen**,
- das Masterportal lädt die **statische beziehungsweise versionierte Konfiguration**,
- im `portal-backend` tritt **kein Fehler wegen fehlender Konfigurationsdateien** auf,
- die lokale RustFS-LXC beziehungsweise deren Credentials sind für die V1s-Portal-Auslieferung **nicht erforderlich**,
- der zugrunde liegende **Git-Stand und die relevanten Artefakt-Versionen** sind dokumentiert,
- ein **verifizierter Shutdown-/Restart-Zyklus dieser Baseline wurde auf derselben VM mindestens einmal erfolgreich durchgeführt**.

Ein isolierter Restore auf separater Hardware ist für den aktuellen Zweck — die Wiederherstellbarkeit der AddOn-Entwicklungsumgebung — nicht zusätzlich erforderlich. Die V1s-Baseline ist eine Single-Node-Umgebung auf einer einzelnen VM; ein verifizierter Shutdown-/Restart-Zyklus auf derselben VM belegt, dass die Baseline nach einem Neustart ohne manuelle Nacharbeit wieder vollständig hochfährt (Cluster und Kernkomponenten healthy, keine Geister-Nodes, keine PV-`nodeAffinity`-Konflikte). Ein separater Hardware-Restore würde lediglich zusätzlich die Hardware-Unabhängigkeit des Backups nachweisen, was hier nicht das Ziel ist.

Stand 2026-08-31: Die ersten fünf Kriterien sind durch den erfolgreichen V1s-Testlauf erfüllt. Das Kriterium zur Dokumentation von Git-Stand und Artefakt-Versionen wird in der laufenden Doku-Aktualisierung nachgezogen. Das Restore-Kriterium (Kriterium 7) war zu diesem Zeitpunkt noch offen.

Am 2026-08-31 kam es beim Server-Shutdown zu einem Fehlstart des V1s-Clusters. Der zuvor manuell angelegte PBS-Snapshot `vm/2010/2026-08-31T20:50:27Z` wurde eingespielt. Danach liefen alle Komponenten ohne manuellen Eingriff wieder vollständig und öffentlich erreichbar. Das ist ein faktischer Restore-Nachweis, aber kein geplanter verifizierter Shutdown-/Restart-Zyklus im Sinne des neu formulierten Kriteriums 7. Der faktische Nachweis bleibt dokumentiert.

Stand 2026-09-05: Kriterium 7 ist erfüllt. Am 2026-09-05 wurde auf derselben VM ein verifizierter Shutdown-/Restart-Zyklus durchgeführt: Shutdown → Restart → k3s-Cluster und alle Kernkomponenten wieder healthy, keine Geister-Nodes, keine PV-Konflikte. Der Zyklus dauerte ca. 90 Sekunden. Damit gilt der verifizierte Restart als hinreichender Nachweis für die Restaurierbarkeit der V1s-AddOn-Baseline.

Belege aus dem faktischen Restore:

- Kriterium 3 und 4: `config.json` und `services-internet.json` wurden nach dem Restore ohne Eingriff mit gültigem Inhalt ausgeliefert.
- Kriterium 5: `S3_ENABLED=false` bestand zum Zeitpunkt des Restore und danach. Die übrigen `S3_*`-Variablen stehen auf `unused` beziehungsweise Default.
- Clusterzustand: 28 Pods in 11 Namespaces `Running`, keine `CrashLoopBackOff`, keine `Pending`. Alle 11 Helm-Releases blieben auf REVISION 1 und wurden nach dem Restore nicht neu ausgerollt.

Ein Backup ist erst nach einem verifizierten Shutdown-/Restart-Zyklus als AddOn-Baseline zulässig. Das Backup ersetzt **keinen AddOn-Rückbau**: Ein Rückbau p2d2-eigener Ressourcen folgt eigenen, AddOn-spezifischen Regeln.

## Lessons Learned: Hostname-Drift bei Cloud-Init-Re-Provisionierung

**Root Cause:** Bei Re-Provisionierung beziehungsweise Neustart setzte Cloud-Init den Hostnamen der VM neu. Dadurch wich der Hostname von dem beim k3s-Start registrierten Node-Namen ab. k3s meldete daraufhin einen abweichenden Node an („Geister-Node“), und PersistentVolumes mit `nodeAffinity` auf den alten Node-Namen fanden beim Neustart keinen passenden Node mehr (PV-`nodeAffinity`-Konflikte).

**Bugfix:** `cico-shutdown` und `cico-uncordon` ermitteln den Node-Namen nicht mehr hartkodiert, sondern dynamisch aus `hostname`. Die Ursache an der Quelle wird zusätzlich in `civitas_einrichtung` behoben (stabiler Hostname über `preserve_hostname: true` sowie explizites Node-Name-Pinning via `--node-name`).

**Wiedererkennung:** Beim späteren Anpacken der VM auf mehrere Node-Objekte mit ähnlichen Namen, „Geister-Nodes“ oder PV-`nodeAffinity`-Konflikte nach einem Neustart achten — Ursache ist fast immer ein Hostname-Wechsel durch Cloud-Init.

## 5. Beziehung zum AddOn

- Die V1s-AddOn-Baseline ist die **vorgesehene Testbasis** für die Entwicklung des p2d2-AddOns.
- Nach einem Restore sollen **nur AddOn-Artefakte und AddOn-Konfigurationen** erneut ausgerollt werden; ein vollständiger CIVITAS/CORE-Build ist danach nicht erforderlich.
- Es besteht kein Anspruch, dass alle Details bereits entschieden oder implementiert sind.

Die konkrete Auslieferung der p2d2-Masterportal-Instanzkonfiguration bleibt eine offene Architekturentscheidung (siehe [Zielbild und Abgrenzung](./zielbild-und-abgrenzung)).

## 6. Offene Punkte

Die V1s-Skriptstruktur und der Artefakt-/Image-Build-Prozess sind implementiert und nicht mehr offen. Die folgenden Punkte sind noch zu klären:

- genaue Abnahmetests,
- Backup-Namens- und Aufbewahrungskonzept,
- konkrete Preflight- und Restore-Automatisierung,
- Konfigurations-Lifecycle einer späteren p2d2-Masterportal-Instanz: Abgrenzung zwischen Build-Time-Artefakten, Deployment-Time-Konfiguration, schnell aktualisierbarer Instanzkonfiguration und sensiblen Werten.

## Verwandte Seiten

- [Übersicht](./) – Gesamtvorhaben der statischen Masterportal-Konfiguration
- [Zielbild und Abgrenzung](./zielbild-und-abgrenzung) – Ausgangslage, Zielarchitektur und offene Entscheidungen
- [S3-zu-statisch-Migration](./s3-zu-statisch-migration) – Migrationsvorhaben, Prinzipien und konzeptionelle Abnahme
- [p2d2 als CIVITAS/CORE-V1-AddOn](../p2d2-civitas-core-v1-addon/) – Zielbild, Voraussetzungen und Lifecycle des AddOns

## Änderungshistorie

| Version | Datum | Änderung |
|---|---|---|
| 1.0 | 2026-09-05 | Kriterium 7 (Restore) umformuliert und als erfüllt dokumentiert (verifizierter Shutdown-/Restart-Zyklus statt isoliertem Restore), Abschnitt 3 (V1↔V1s-Übernahmeregel) entschärft, Lessons-Learned-Abschnitt ergänzt. |
