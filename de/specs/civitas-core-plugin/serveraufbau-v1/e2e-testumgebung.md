---
title: E2E-Testumgebung
description: Spezifikation der Vorbereitung und Durchführung von End-to-End-Tests (Playwright/Chromium) für das CIVITAS/CORE-Installationsskript.
status: draft
lastUpdated: 2026-07-16
lang: de
category: spec
specid: civitas-core-plugin-serveraufbau-e2e-testumgebung
parent: civitas-core-plugin-serveraufbau-index
dependencies:
  - civitas-core-plugin-serveraufbau-installationsphasen-und-abnahme
  - civitas-core-plugin-serveraufbau-skriptarchitektur
quality:
  completeness: 60
  accuracy: 75
  reviewed: false
  reviewer:
  reviewDate:
---

# E2E-Testumgebung

## Ziel

Dieses Dokument spezifiziert die Vorbereitung und Durchführung von End-to-End-Tests
für die CIVITAS/CORE-Installation. Es beschreibt die Abhängigkeiten für den
Playwright/Chromium-Browser, die Generierung der Test-`.env`-Datei sowie die
Konvention für `TEST_ID` / `BASE_DOMAIN`.

Die hier dokumentierten Schritte werden in Phase 3 des Installationsskripts
ausgeführt (siehe `07_verify.sh`, Funktionen `setup_tests_env()` und
`run_test_suite()`), sofern die Steuervariable `RUN_TESTS=true` gesetzt ist
(siehe `01_config.sh`).

## Rahmenbedingungen

| Rahmenbedingung | Beschreibung |
|---|---|
| Zielplattform | CIVITAS/CORE-VM (Debian 13 Trixie), k3s-Cluster |
| Test-Repository | Geklont unter `${CC_V1_REPO_PATH}/tests` |
| Steuervariable | `RUN_TESTS="${RUN_TESTS:-false}"` aus `01_config.sh` |
| Auslösung | `source .env.local ; qm stop 2010 ; qm destroy 2010 ; ./install_civitas_core_V1.sh` |
| Aufruf in Phase 3 | `setup_tests_env()` → `run_test_suite()` in `07_verify.sh` |
| Test-Framework | pytest mit Playwright für Browser-basierte E2E-Tests |
| Installations-Tool für Python-Abhängigkeiten | `uv` (installiert via `pipx` aus Debian-Repo) |

## uv-Installation

Die Installation von `uv` erfolgt über `pipx` aus dem Debian-Repository, nicht
über den Astral-Standalone-Installer (der in der Zielumgebung scheitert).

**Ablauf in `setup_tests_env()`:**

1. `command -v uv` → bereits installiert? → `log_ok`, überspringen
2. `command -v pipx` → falls nicht vorhanden: `apt-get install -y pipx python3-all python-is-python3`
3. `pipx ensurepath` + `export PATH="${HOME}/.local/bin:${PATH}"`
4. `pipx install uv`
5. `command -v uv` + `uv --version` → Verifikation

| Status | Implementiert |
|---|---|
| ✅ | `setup_tests_env()` in `07_verify.sh` — pipx-basierte Installation |
| ✅ | Fehlerbehandlung mit aussagekräftiger Log-Ausgabe (kein `2>/dev/null`) |
| ✅ | Soft-fail (Tests werden übersprungen, Skript bricht nicht ab) |

## Playwright-Browser-Abhängigkeiten

### Root Cause

Auf Debian 13 Trixie schlägt `playwright install --with-deps chromium` fehl,
weil Playwright intern veraltete, Ubuntu-basierte Paketnamen anfragt:

- `ttf-ubuntu-font-family` — existiert in Trixie nicht mehr
- `ttf-unifont` — existiert in Trixie nicht mehr

Die Nachfolgepakete in Debian 13 sind:

| Veralteter Name (Ubuntu) | Ersatz (Debian 13) | Repository-Sektion |
|---|---|---|
| `ttf-ubuntu-font-family` | `fonts-ubuntu` | non-free |
| `ttf-unifont` | `fonts-unifont` | main |

**Voraussetzung:** `non-free` muss in `/etc/apt/sources.list.d/debian.sources`
aktiviert sein, sonst ist `fonts-ubuntu` nicht auflösbar.

### Verifizierte Lösung

Der Befehl `playwright install --with-deps chromium` wird **nicht** verwendet.
Stattdessen werden die benötigten Schriftarten und Chromium-Laufzeitbibliotheken
explizit vor der Playwright-Installation per `apt-get install` bereitgestellt:

```bash
apt-get install -y fonts-ubuntu fonts-unifont \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcb1 \
  libxkbcommon0 libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 \
  libxext6 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 \
  libasound2
```

Diese Bibliotheksliste stammt direkt aus der Playwright-eigenen
Host-Validierungs-Fehlermeldung: `"Host system is missing dependencies
to run browsers"`.

Danach erfolgt die Playwright-Installation ohne `--with-deps`:

```bash
playwright install chromium
```

### Verifikation

Der folgende Python-Test wurde erfolgreich auf der Ziel-VM ausgeführt:

```bash
python -c "
from playwright.sync_api import sync_playwright
p = sync_playwright().start()
b = p.chromium.launch()
print('Chromium OK')
b.close()
p.stop()
"
```

| Status | Beschreibung |
|---|---|
| ✅ | Chromium-Browser installierbar |
| ✅ | Kein `--with-deps` (nur `playwright install chromium`) |
| ✅ | System-Abhängigkeiten via apt (kein curl-Download von Ubuntu-Archiven) |
| ⚠️ | `non-free` muss in `debian.sources` aktiviert sein (Preflight-Prüfung empfohlen) |

## Test-`.env`-Generierung über `prefill_env.py`

Die E2E-Test-Fixture in `tests/e2e_tests/fixtures/fixtures_config.py` erwartet
eine Datei `tests/.env` mit einer Reihe von Umgebungsvariablen.

### Aktueller Stand (noch unvollständig)

Die Funktion `generatetestenv()` in `06_civitas.sh` erzeugt eine minimale
`tests/.env` mit nur wenigen Variablen:

```bash
DOMAIN=${DOMAIN}
ENVIRONMENT=${CC_ENVIRONMENT}
KEYCLOAK_ADMIN_USER=...
KEYCLOAK_ADMIN_PASSWORD=...
GEOSERVER_USER=...
GEOSERVER_PASSWORD=...
```

Die Test-Fixture erwartet jedoch zusätzlich:

| Variable | Erwartet in `.example.env` | Aktuell in `generatetestenv()` |
|---|---|---|
| `BASE_DOMAIN` | ja | **fehlt** |
| `TEST_ID` | ja | **fehlt** |
| `API_DASHBOARD_PASSWORD` | ja | **fehlt** |
| `USER_PASSWORD` | ja | **fehlt** |
| `QUANTUMLEAP_DB_PASSWORD` | ja | **fehlt** |
| `GEODATA_DB_USER` | ja | **fehlt** |
| `GEODATA_DB_PASSWORD` | ja | **fehlt** |
| `GEODATA_DB_NAME` | ja | **fehlt** |
| `GEODATA_DB_SCHEMA` | ja | **fehlt** |
| `GEODATA_DB_HOST` | ja | **fehlt** |
| `GEODATA_DB_PORT` | ja | **fehlt** |
| `KUBE_CONFIG_FILE` | ja | **fehlt** |
| `KUBECONTEXT` | ja | **fehlt** |

### Geplante Lösung

Im Repository existiert das Tool `tests/prefill_env.py`, das alle benötigten
Variablen automatisch aus dem Ansible-Inventory und aus Kubernetes-Secrets
via `kubectl` befüllt.

**Vorgehen:**

1. `generatetestenv()` in `06_civitas.sh` durch einen Aufruf von
   `prefill_env.py` ersetzen
2. Aufruf mit `--local` und der produktiven `${DOMAIN}` als Eingabe:

   ```bash
   cd "${CC_V1_REPO_PATH}/tests"
   python3 prefill_env.py --local "${DOMAIN}" > .env
   ```

3. `prefill_env.py --local` splittet die Domain an der ersten Punkt-Stelle:
   - `TEST_ID` = erstes Label (z. B. `udp`)
   - `BASE_DOMAIN` = Rest der Domain (z. B. `data-dna.eu`)

4. Die `.env` enthält danach automatisch alle von `fixtures_config.py`
   erwarteten Variablen, inklusive Datenbank-Credentials aus
   Kubernetes-Secrets.

| Status | Beschreibung |
|---|---|
| ❌ | Noch nicht implementiert (ersetzt aktuell `generatetestenv()`) |
| ✅ | `prefill_env.py` existiert im Repository |
| ✅ | Aufruf mit `--local` und Domain-Split ist verifiziert |
| ⚠️ | Kubernetes-Secrets müssen nach `cc_cli exec` verfügbar sein |

## `TEST_ID` / `BASE_DOMAIN`-Konvention

Die Aufteilung der Domain in `TEST_ID` und `BASE_DOMAIN` ist ein Konzept aus
den CIVITAS/CORE-E2E-Tests, ursprünglich für parallele CI-Testläufe mit
eigenen vcluster-Instanzen.

### Funktionsweise

`prefill_env.py --local` führt folgenden Split durch:

```
DOMAIN = "udp.data-dna.eu"
TEST_ID = "udp"          ← erstes Label
BASE_DOMAIN = "data-dna.eu"  ← Rest
```

Die finale Domain für Tests wird aus `TEST_ID` und `BASE_DOMAIN`
rekombiniert:

```python
domain = f"{TEST_ID}.{BASE_DOMAIN}"  # → "udp.data-dna.eu"
```

### Aktuelle Übergangslösung in `.env.local`

Bis die Integration von `prefill_env.py` in `generatetestenv()` umgesetzt
ist, werden die Variablen manuell in `.env.local` gesetzt:

```bash
export DOMAIN="udp.data-dna.eu"
export TEST_ID="udp"
export BASE_DOMAIN="data-dna.eu"
```

| Status | Beschreibung |
|---|---|
| ✅ | `.env.local` enthält `DOMAIN`, `TEST_ID`, `BASE_DOMAIN` |
| ✅ | Entspricht dem Split, den `prefill_env.py --local` später automatisch vornimmt |
| ❌ | Noch nicht in `generatetestenv()` automatisiert |
| ⚠️ | Muss bei Domain-Änderung manuell konsistent gehalten werden |

## Offene Punkte

| Punkt | Status | Entscheidung bei |
|---|---|---|
| `generatetestenv()` durch `prefill_env.py --local` ersetzen | **Offen** (geplant, nicht implementiert) | Nach Freigabe dieser Spec |
| `non-free` in Preflight-Prüfung aufnehmen (`check_nonfree_source()`) | **Offen** (Preflight-Prüfung empfohlen) | Nächste Preflight-Erweiterung |
| Fehlermeldung von `prefill_env.py` bei fehlenden Secrets abfangen | **Offen** (Edge-Case) | Erster Testlauf mit Integration |
| V2-Äquivalent für `tests/` im V2-Repository | **Offen** (nicht betrachtet) | Bei V2-Implementierung |

## Festlegungen

1. Die Installation von `uv` erfolgt ausschließlich über `pipx` aus dem
   Debian-Repository — kein Astral-Standalone-Installer (`curl -LsSf ...`).
2. `playwright install chromium` wird **ohne** `--with-deps` ausgeführt.
   Die System-Abhängigkeiten werden in `setup_tests_env()` explizit
   per `apt-get install` bereitgestellt.
3. `fonts-ubuntu` erfordert die Aktivierung von `non-free` in
   `/etc/apt/sources.list.d/debian.sources`. Dies ist keine
   Aufgabe des Installationsskripts (Infrastruktur-Entscheidung).
4. Die Test-`.env` wird zukünftig über `prefill_env.py --local`
   generiert, nicht mehr manuell in `generatetestenv()`.
5. `TEST_ID` und `BASE_DOMAIN` werden aus der produktiven Domain
   am ersten Punkt gesplittet — dieser Split ist konsistent mit
   der `.env.local`-Übergangslösung.
6. Ein Fehler in der Testvorbereitung (`setup_tests_env()`) führt
   **nicht** zum Abbruch der Installation (Soft-fail). Die E2E-Tests
   werden in diesem Fall übersprungen.
7. Die Spec `installationsphasen-und-abnahme.md` beschreibt die
   übergeordnete Phase 3 (Verifikation) — dieses Dokument
   spezifiziert ausschließlich die konkrete Testumgebungs-Vorbereitung.