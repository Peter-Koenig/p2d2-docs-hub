---
title: Backup-Strategie
description: Datensicherung und Disaster Recovery für den p2d2-Server
quality:
  completeness: 95
  accuracy: 95
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-01-27
---

# Backup-Strategie

Die Backup-Strategie für den p2d2-Server folgt der **3-2-1-Regel** und nutzt ein **Tiered-Backup-System** mit geografischer Redundanz.

## Backup-Architektur

### Komponenten

1. **Proxmox Host** (Hetzner-Server)
   - Web-UI Port: **** (2FA aktiviert)
   - Führt Backup-Jobs aus
   - Zugangsdaten nicht in Dokumentation

2. **Proxmox Backup Server (PBS) - Hetzner**
   - Web-UI Port: **** (2FA aktiviert)
   - Storage: ZFS, 2x SSD (Mirror), ~49 GB
   - Funktion: **Backup-Cache** (kurze Retention)
   - Datastore: `p2d2-pbs-local`
   - Zugangsdaten nicht in Dokumentation

3. **Proxmox Backup Server (PBS) - HomeOffice**
   - Netzwerk: Privates Netz (über WireGuard)
   - Funktion: **Langzeitarchiv** (lange Retention)
   - Verbindung: WireGuard-Tunnel vom Proxmox-Host

### Netzwerkverbindung

```bash
# WireGuard-Tunnel zwischen Hetzner und HomeOffice
Interface: wg-kinglui
Port: 51015
Persistent Keepalive: 25 Sekunden
```

**Verbindungstest:**
```bash
# Auf Proxmox-Host
wg show

# Ping zum HomeOffice-PBS
ping <HOMEOFFICE_PBS_IP>
```

::: tip 3-2-1-Regel erfüllt
- **3 Kopien**: Produktiv + Hetzner-PBS + HomeOffice-PBS
- **2 Medien**: Hetzner-Storage + HomeOffice-Storage  
- **1 Offsite**: HomeOffice ist geografisch getrennt
:::

## Backup-Workflow

### 1. Lokale Backups (Hetzner → Hetzner-PBS)

Backup-Jobs laufen auf dem Proxmox-Host und speichern direkt auf den lokalen PBS.

**Vorteile:**
- Hohe Performance (niedrige Latenz)
- Unabhängig von WireGuard-Verbindung
- Schnelle Snapshots

**Retention auf Hetzner-PBS:**
```
Keep Last: 2-3 (nur letzte Backups)
Keep Monthly: 2 (monatliche Snapshots)
```

::: warning Speicherplatz-Management
Der Hetzner-PBS hat nur begrenzten Speicher (~49 GB). Die kurze Retention stellt sicher, dass genug Platz für neue Backups vorhanden ist. Das Langzeitarchiv liegt im HomeOffice.
:::

**Retention-Einstellung:**
```bash
# Proxmox GUI: Datacenter → Backup → Job bearbeiten
# → Retention: Keep Last = 2-3, Keep Monthly = 2
```

### 2. Sync zu HomeOffice-PBS (Pull)

Der **HomeOffice-PBS zieht** (Pull) die Backups vom Hetzner-PBS über WireGuard.

**Sync-Job Konfiguration:**
```
Richtung: Pull (HomeOffice ← Hetzner)
Zeitplan: Täglich (nach Backup-Fenstern)
Remove Vanished: Deaktiviert (HomeOffice behält alte Backups)
```

**Vorteile der Pull-Methode:**
- HomeOffice initiiert die Verbindung
- Nur deduplizierte Chunks werden übertragen
- Netzwerk-effizient durch PBS-Deduplizierung
- Keine ausgehenden Verbindungen vom Hetzner-Server nötig

## Backup-Schedule

### Backup-Jobs (Proxmox → Hetzner-PBS)

| Komponente | VM/LXC | Zeitplan | Backup-Typ |
|------------|--------|----------|------------|
| OPNsense Firewall | VM | Täglich | Snapshot |
| PostgreSQL/PostGIS | LXC | Täglich | Snapshot + SQL-Dump |
| GeoServer | LXC | Täglich | Snapshot |
| MapProxy | LXC | Täglich | Snapshot |
| Frontend (AstroJS) | LXC | Täglich | Snapshot |
| Ory IAM | LXC | Täglich | Snapshot |

::: warning Backup-Fenster
Backups laufen **außerhalb der Hauptnutzungszeiten** (nachts). Konkrete Zeitpunkte sind aus Sicherheitsgründen nicht dokumentiert.
:::

### Maintenance-Jobs (zeitlicher Ablauf)

#### Hetzner-PBS

```
Nach jedem Backup: Auto-Prune (gemäß Retention)
Täglich 07:00: Garbage Collection
Wöchentlich (Sonntag 03:00): Verify Job
```

#### HomeOffice-PBS

```
Täglich 01:00: Sync-Job (Pull von Hetzner)
Täglich 06:00: Prune-Job
Täglich 07:00: Garbage Collection
Wöchentlich (Sonntag 04:00): Verify Job
```

::: tip Jobs nicht überlappen
Verify, GC und Sync-Jobs sollten **niemals gleichzeitig** laufen. Zeitliche Abstände vermeiden Ressourcenkonflikte.
:::

## Retention-Policies

### Hetzner-PBS (Cache)

```
Keep Last: 2-3
Keep Monthly: 2
```

**Zweck:** Kurzzeitiger Backup-Cache für schnelle Restores und Sync zum HomeOffice.

**Typische Speichernutzung:**
- 6 VMs/LXCs × 2-3 Backups = 12-18 Snapshots
- ~35-40 GB bei 49 GB Kapazität
- Nach GC: Ausreichend Platz für neue Backups

### HomeOffice-PBS (Langzeitarchiv)

```
Keep Last: 7
Keep Daily: 7
Keep Weekly: 4
Keep Monthly: 6
```

**Zweck:** Langfristige Aufbewahrung für Disaster Recovery und historische Wiederherstellung.

## PostgreSQL-Backup-Strategie

PostgreSQL erfordert besondere Aufmerksamkeit für Datenkonsistenz.

### Zwei-Stufen-Backup

1. **Container-Snapshot** (via Proxmox Backup)
   - Filesystem-konsistent
   - PostgreSQL Crash Recovery funktioniert in 99%+ der Fälle
   - Schnell und automatisch

2. **Logisches Backup** (pg_dumpall)
   - SQL-Dump aller Datenbanken
   - Versionunabhängig restore-bar
   - Zusätzliche Sicherheitsebene

### PostgreSQL Dump-Konfiguration

**Im PostgreSQL-Container (LXC):**

```bash
# Als root im Container
mkdir -p /var/backups/postgresql
chown postgres:postgres /var/backups/postgresql

# Cron-Job für postgres-User einrichten
crontab -e -u postgres

# Tägliches Dump um 3:00 Uhr (nach Proxmox-Backups)
0 3 * * * pg_dumpall | gzip > /var/backups/postgresql/postgres-$(date +\%Y\%m\%d).sql.gz

# Alte Dumps nach 7 Tagen löschen
0 4 * * * find /var/backups/postgresql -name "postgres-*.sql.gz" -mtime +7 -delete
```

**Dump-Monitoring:**

```bash
# Auf Proxmox-Host: Dumps im Container prüfen
pct exec <POSTGRES_VMID> -- ls -lh /var/backups/postgresql/

# Größe und Alter prüfen
pct exec <POSTGRES_VMID> -- bash -c 'ls -lh /var/backups/postgresql/*.gz | tail -1'
```

::: info Warum kein pg_backup_start/stop Hook?
Moderne PostgreSQL-Versionen wechseln häufig die Backup-API (z.B. `pg_start_backup` → `pg_backup_start` in v15+). Hook-Scripts erfordern ständige Wartung bei PostgreSQL-Updates. Die Kombination aus Snapshot + pg_dump ist **wartungsfrei** und **versionunabhängig**.
:::

### PostgreSQL Recovery-Szenarien

| Szenario | Wahrscheinlichkeit | Vorgehen | Datenverlust |
|----------|-------------------|----------|--------------|
| **Normal** | ~99.5% | Snapshot restore → PostgreSQL startet mit Crash Recovery | 0 Sekunden |
| **WAL-Problem** | ~0.4% | Snapshot restore → PostgreSQL recovered aus WAL | Sekunden bis Minuten |
| **Komplettausfall** | ~0.1% | pg_dump einspielen | Max. 1 Tag |

**Crash Recovery erkennen:**

```bash
# PostgreSQL-Logs nach Restore prüfen
pct exec <POSTGRES_VMID> -- tail -100 /var/log/postgresql/postgresql-*-main.log

# Typische Recovery-Messages:
# LOG:  database system was interrupted; last known up at ...
# LOG:  database system was not properly shut down; automatic recovery in progress
# LOG:  redo starts at ...
# LOG:  database system is ready to accept connections
```

**Falls Snapshot-Recovery fehlschlägt:**

```bash
# Im PostgreSQL-Container
# 1. Neuestes Dump finden
ls -lh /var/backups/postgresql/

# 2. Datenbank-Cluster neu initialisieren
pg_dropcluster --stop <VERSION> main
pg_createcluster <VERSION> main

# 3. Dump einspielen
gunzip -c /var/backups/postgresql/postgres-YYYYMMDD.sql.gz | psql -U postgres

# Datenverlust: Maximal 1 Tag
```

## Wartungsaufgaben

### Prune & Garbage Collection

#### Was ist Prune?

**Prune** entfernt alte Backup-Snapshots gemäß Retention-Policy:
- Löscht Metadaten und Snapshot-Referenzen
- Gibt **NICHT** sofort Speicherplatz frei
- Läuft automatisch nach Backup-Jobs (Hetzner)
- Benötigt separaten Job im HomeOffice (wegen Sync)

#### Was ist Garbage Collection (GC)?

**GC** gibt tatsächlich Speicherplatz frei:
- Löscht Chunks, die von keinem Snapshot mehr referenziert werden
- **Essentiell** für Speicherfreigabe nach Prune
- Läuft täglich nach Prune-Jobs
- Kann rechenintensiv sein (nicht während Backups laufen lassen)

::: danger GC ist zwingend erforderlich
Ohne Garbage Collection bleibt Speicherplatz belegt, auch wenn Backups gepruned wurden! GC **muss** regelmäßig laufen.
:::

**Workflow:**
```
1. Backup-Job erstellt Snapshot
2. Prune markiert alte Snapshots zum Löschen
3. GC löscht nicht mehr referenzierte Daten-Chunks
4. Speicherplatz wird freigegeben
```

#### GC-Job einrichten

**Hetzner-PBS:**
```bash
# GUI: Datastore → Prune & GC → Schedule
Schedule: Daily 07:00
```

**HomeOffice-PBS:**
```bash
# GUI: Datastore → Prune & GC → Schedule
Schedule: Daily 07:00
```

#### Manuelle GC ausführen

```bash
# CLI auf PBS
proxmox-backup-manager garbage-collect <datastore-name>

# Oder GUI: Datastore → Content → Garbage Collection → Start GC
```

**Nach GC prüfen:**
```bash
# Datastore Usage anzeigen
df -h /path/to/datastore

# Oder GUI: Datastore → Summary → Usage
```

### Verify-Jobs

**Verify** prüft die Integrität gesicherter Daten:

- Verifiziert Checksums aller Chunks
- Stellt sicher, dass Daten nicht korrupt sind
- Testet, ob Restore funktionieren würde
- Schreibt Logs bei Problemen

**Konfiguration:**

| PBS | Schedule | Max Depth | Grund |
|-----|----------|-----------|-------|
| Hetzner | Wöchentlich | Current | Nur Cache, ressourcenintensiv |
| HomeOffice | Wöchentlich | All | Langzeitarchiv, alle Backups prüfen |

**Einrichten:**
```bash
# GUI: Datastore → Verify Jobs → Add
Schedule: Weekly (Sunday 03:00 für Hetzner, 04:00 für HomeOffice)
```

**Verify-Logs prüfen:**
```bash
# GUI: Datastore → Verify Jobs → Task History
# Oder CLI:
journalctl -u proxmox-backup.service | grep -i verify
```

## Restore-Szenarien

### Einzelne VM/LXC wiederherstellen

**Via GUI:**
```
1. Proxmox Web-UI → Storage → PBS → Content
2. Gewünschtes Backup auswählen
3. "Restore" → Ziel-Node auswählen → Start
```

**Via CLI:**
```bash
# LXC wiederherstellen
pct restore <neue-vmid> <backup-path> --storage <storage>

# VM wiederherstellen
qmrestore <backup-path> <neue-vmid>
```

### Einzelne Dateien aus Backup extrahieren

```bash
# Backup mounten (auf PBS)
proxmox-backup-client mount <snapshot> /mnt/backup

# Dateien kopieren
cp /mnt/backup/path/to/file /destination/

# Unmount
umount /mnt/backup
```

### Disaster Recovery (kompletter Serverausfall)

#### Vorbereitung

**Dokumentiere:**
- Hetzner-Server Details (Produktnummer, IP-Adressen)
- PBS-Fingerprints (für Storage-Konfiguration)
- WireGuard-Konfiguration (Keys, Endpoints)
- Netzwerk-Konfiguration (VLANs, IP-Bereiche)

#### Wiederherstellung

**1. Proxmox neu installieren:**
```bash
# Hetzner Rescue-System starten
# Proxmox VE installieren (via ISO oder Hetzner Installimage)
```

**2. Netzwerk konfigurieren:**
```bash
# /etc/network/interfaces
# Bridges (vmbr0, vmbr1, vmbr2) gemäß Netzwerk-Architektur

# WireGuard wiederherstellen
# /etc/wireguard/wg-kinglui.conf
```

**3. PBS-Storage hinzufügen:**

```bash
# Fingerprint vom HomeOffice-PBS abrufen
# (auf HomeOffice-PBS): proxmox-backup-manager cert info

# Storage auf Proxmox-Host hinzufügen
pvesm add pbs p2d2-pbs-homeoffice \
  --server <HOMEOFFICE_PBS_IP> \
  --datastore <datastore> \
  --username <user>@pbs \
  --fingerprint <PBS_FINGERPRINT>

# Status prüfen
pvesm status
```

**4. VMs/LXCs restoren:**
```bash
# Verfügbare Backups anzeigen
pvesm list p2d2-pbs-homeoffice

# OPNsense VM zuerst (für Netzwerk)
qmrestore <backup-id> 120 --storage local-lvm

# Dann LXCs
pct restore 110 <backup-id> --storage local-lvm  # PostgreSQL
pct restore 111 <backup-id> --storage local-lvm  # GeoServer
# etc.
```

**5. Netzwerk verifizieren:**
```bash
# VMs/LXCs starten
qm start 120  # OPNsense
pct start 110 # PostgreSQL

# Konnektivität prüfen
ping <INTERNAL_IPS>
```

::: tip Fingerprint-Problem
Bei Fehler `fingerprint not verified, abort!`:
```bash
# Auf PBS: Fingerprint abrufen
proxmox-backup-manager cert info

# Auf Proxmox: Storage aktualisieren
pvesm set <storage-name> --fingerprint '<NEUER_FINGERPRINT>'
```
:::

## Backup-Typen

### LXC Container Snapshots

**Snapshot-Modus (Standard):**
- Schnell (Sekunden)
- Konsistenter Zustand (Filesystem eingefroren)
- Empfohlen für zustandslose Container (Frontend, GeoServer, MapProxy)

**Stop-Modus:**
- Container wird gestoppt
- Garantiert konsistent
- Längere Downtime
- Nur für kritische Systeme mit Konsistenzproblemen

### VM Snapshots

**Snapshot-Modus:**
- QEMU Guest Agent erstellt konsistenten Snapshot
- VM läuft weiter (kurzes Einfrieren)
- Empfohlen für OPNsense, OSM-Tiler

**Stop-Modus:**
- VM wird heruntergefahren
- Offline-Backup
- Keine Inkonsistenzen möglich

## Monitoring & Alerts

### Backup-Status prüfen

**Proxmox-Host:**
```bash
# Letzter Backup-Status
cat /var/log/vzdump.log | tail -50

# Aktive Backup-Jobs
cat /var/log/pve/tasks/active

# GUI: Datacenter → Backup → Status
```

**PBS:**
```bash
# CLI: Datastore-Status
proxmox-backup-manager status

# Storage-Usage
df -h /path/to/datastore

# GUI: Datastore → Summary
```

### Wichtige Metriken

| Metrik | Grenzwert | Aktion bei Überschreitung |
|--------|-----------|---------------------------|
| **Last Successful Backup** | < 48h | Backup-Jobs manuell starten, Logs prüfen |
| **PBS Storage (Hetzner)** | < 85% | Retention reduzieren oder GC manuell ausführen |
| **PBS Storage (HomeOffice)** | < 70% | Speicher erweitern oder alte Backups prunen |
| **Verify Errors** | 0 | Backup neu erstellen, Storage prüfen |
| **Sync Status** | < 24h | WireGuard prüfen, Sync manuell starten |

### E-Mail-Benachrichtigungen einrichten

```bash
# Proxmox: Datacenter → Notifications
# E-Mail für fehlgeschlagene Backups, Verify-Fehler, vollen Speicher
```

**PBS Notifications:**
```bash
# GUI: Configuration → Notifications → Add
# Ereignisse: Backup failed, Verify failed, Low disk space
```

## Sicherheit

### PBS-Zugang

- **2FA aktiviert** auf beiden PBS-Instanzen (Hetzner + HomeOffice)
- **Zugangsdaten NICHT in Dokumentation**
- **Separate User** für Backup-Jobs (nicht root@pam)
- PBS-Fingerprints werden über sichere Kanäle ausgetauscht

### WireGuard-Sicherheit

- **Private Keys niemals in Git committen**
- **Regelmäßige Key-Rotation** (empfohlen: jährlich)
- **Firewall-Regeln**: Nur PBS-Port über WireGuard erreichbar
- **Monitoring**: Handshake-Zeiten überwachen (`wg show`)

### Verschlüsselung

PBS unterstützt **Client-seitige Verschlüsselung**:

```bash
# Verschlüsselungs-Key generieren
proxmox-backup-client key create --kdf scrypt /root/backup-encryption.key

# Key sicher aufbewahren (offline, verschlüsselt)

# In Backup-Job aktivieren
# GUI: Datacenter → Backup → Edit → Encryption Key
```

**Abwägung:**
- **Pro**: Schutz bei PBS-Kompromittierung, Compliance-Anforderungen
- **Contra**: Key-Management-Overhead, langsamerer Restore, Key-Verlust = Datenverlust
- **Empfehlung für p2d2**: Nicht erforderlich (geografisch getrennte Standorte, 2FA)

## Troubleshooting

### Problem: Backup-Jobs schlagen fehl

```bash
# 1. Logs prüfen
tail -100 /var/log/vzdump.log

# 2. Fingerprint-Verifikation
pvesm status | grep pbs

# Fehler: "fingerprint not verified"
# → PBS Fingerprint neu setzen (siehe Disaster Recovery)

# 3. PBS erreichbar?
ping <PBS_IP>
curl -k https://<PBS_IP>:****

# 4. Storage-Platz voll?
# GUI: PBS → Datastore → Summary → Usage
```

### Problem: Sync-Job läuft nicht

```bash
# 1. WireGuard-Verbindung prüfen (auf Proxmox-Host)
wg show
ping <HOMEOFFICE_PBS_IP>

# Kein Output bei "wg show"?
# → WireGuard-Service prüfen
systemctl status wg-quick@wg-kinglui

# 2. Firewall-Regeln (HomeOffice)
# Port **** über WireGuard erreichbar?

# 3. PBS-Credentials auf HomeOffice-PBS
# GUI: Sync Jobs → Edit → Test Connection
```

### Problem: Speicher wird nicht freigegeben

```bash
# 1. Prune läuft?
# GUI: PBS → Datastore → Prune & GC → Task History

# 2. GC manuell starten
proxmox-backup-manager garbage-collect <datastore>

# 3. GC-Job Zeitplan prüfen
# GUI: Datastore → Prune & GC → Schedule GC

# 4. Logs prüfen
journalctl -u proxmox-backup.service -f
```

**Typische Ursache:**
- Prune läuft, aber GC wurde nie eingerichtet
- GC läuft, aber Backups teilen viele Chunks (Deduplizierung)
- Retention wurde geändert, aber alte Backups noch nicht gepruned

### Problem: PostgreSQL-Container startet nach Restore nicht

```bash
# 1. PostgreSQL-Logs prüfen
pct exec <VMID> -- tail -100 /var/log/postgresql/*.log

# Fehler: "could not locate a valid checkpoint"
# → Crash Recovery fehlgeschlagen

# 2. pg_dump einspielen
pct exec <VMID> -- bash
cd /var/backups/postgresql
ls -lh  # Neuestes Dump finden

# 3. Datenbank neu initialisieren
pg_dropcluster --stop <VERSION> main
pg_createcluster <VERSION> main

# 4. Dump restore
gunzip -c postgres-YYYYMMDD.sql.gz | psql -U postgres
```

### Problem: WireGuard-Verbindung instabil

```bash
# Auf Proxmox-Host
wg show

# "latest handshake" > 2 Minuten?
# → Verbindungsproblem

# 1. Endpoint erreichbar?
ping <HOMEOFFICE_ENDPOINT_IP>

# 2. DNS-Problem?
# → IP statt Hostname in WireGuard-Config verwenden

# 3. WireGuard neu starten
systemctl restart wg-quick@wg-kinglui

# 4. Firewall-Regeln prüfen
iptables -L -n | grep <WG_PORT>
```

## Best Practices

1. **Regelmäßig Restores testen** (quartalsweise)
   - Restore in Test-VM/LXC
   - PostgreSQL-Dump-Restore testen
   - Wiederherstellungszeit dokumentieren

2. **Verify-Jobs überwachen** 
   - Keine Fehler tolerieren
   - Bei Fehlern: Backup neu erstellen

3. **Backup BEFORE Updates**
   - Vor System-Updates
   - Vor größeren Konfigurationsänderungen
   - Manuelles Backup außerhalb des Schedules

4. **Dokumentation aktuell halten**
   - Nach Config-Änderungen
   - Nach Hardware-Änderungen
   - PBS-Fingerprints dokumentieren

5. **GC nicht vergessen**
   - Automatischer GC-Job muss laufen
   - Nach Retention-Änderungen manuell ausführen
   - Speichernutzung regelmäßig prüfen

6. **WireGuard-Verbindung monitoren**
   - Handshake-Zeit < 2 Minuten
   - Kritisch für Offsite-Backup
   - Bei Problemen: Sofort beheben

7. **PostgreSQL-Dumps prüfen**
   - Regelmäßig Dump-Größe checken
   - Test-Restore in Dev-Umgebung
   - Collation-Warnings beheben

## Weiterführende Dokumentation

- [Proxmox Backup Server Dokumentation](https://pbs.proxmox.com/docs/)
- [Proxmox VE Backup und Restore](https://pve.proxmox.com/wiki/Backup_and_Restore)
- [WireGuard Dokumentation](https://www.wireguard.com/)
- [PostgreSQL Backup und Recovery](https://www.postgresql.org/docs/current/backup.html)
- [3-2-1 Backup-Regel](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)
