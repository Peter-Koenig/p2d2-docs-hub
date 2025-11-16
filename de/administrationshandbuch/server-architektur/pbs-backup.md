# Proxmox Backup Server

Proxmox Backup Server (PBS) ist die Backup-Lösung für p2d2-VMs und Container. PBS bietet deduplizierte, inkrementelle Backups.

## Installation

### Dedizierter Server

```
# PBS ISO herunterladen
wget https://enterprise.proxmox.com/iso/proxmox-backup-server_3.1-1.iso

# Installation wie Proxmox VE
# Boot von ISO, Installationsassistent folgen
```

### Als LXC-Container

```
# PBS-Container auf Proxmox erstellen
pct create 200 \
  /var/lib/vz/template/cache/debian-12-standard_12.2-1_amd64.tar.zst \
  --hostname pbs \
  --memory 4096 \
  --cores 2 \
  --rootfs tank:32 \
  --net0 name=eth0,bridge=vmbr1,ip=10.0.0.10/24,gw=10.0.0.1

# Container starten
pct start 200

# In Container einloggen
pct enter 200

# PBS-Repository hinzufügen
echo "deb http://download.proxmox.com/debian/pbs bookworm pbs-no-subscription" \
  > /etc/apt/sources.list.d/pbs.list

# PBS installieren
apt update
apt install proxmox-backup-server
```

## Datastore-Konfiguration

### ZFS-Datastore

```
# ZFS-Pool für Backups
zpool create backup-pool mirror /dev/sdd /dev/sde

# Compression und Deduplication
zfs set compression=lz4 backup-pool
zfs set dedup=on backup-pool  # Nur mit viel RAM!

# Datastore in PBS anlegen
proxmox-backup-manager datastore create \
  p2d2-backups /backup-pool/p2d2
```

### Retention Policy

```
# Aufbewahrungsrichtlinie
proxmox-backup-manager datastore update p2d2-backups \
  --keep-last 7 \
  --keep-daily 14 \
  --keep-weekly 8 \
  --keep-monthly 12 \
  --keep-yearly 3
```

## Proxmox VE anbinden

### PBS-Storage in PVE hinzufügen

```
# Auf Proxmox VE
pvesm add pbs pbs-p2d2 \
  --server 10.0.0.10 \
  --datastore p2d2-backups \
  --username backup@pbs \
  --password <password> \
  --content backup
```

### Backup-Job erstellen

```
# Wöchentliches Full-Backup
pvesh create /cluster/backup \
  --storage pbs-p2d2 \
  --vmid 100,101,102 \
  --dow sunday \
  --starttime 01:00 \
  --mode snapshot \
  --compress zstd \
  --notes-template "{{guestname}}"
```

## Pruning und GC

### Automatisches Pruning

```
# Prune-Job für Datastore
proxmox-backup-manager datastore prune \
  p2d2-backups \
  --keep-last 7
```

### Garbage Collection

```
# GC-Schedule setzen
proxmox-backup-manager datastore update p2d2-backups \
  --gc-schedule "daily"

# Manuell GC starten
proxmox-backup-manager garbage-collect p2d2-backups
```

## Wiederherstellung

### VM wiederherstellen

```
# Über Proxmox VE Web-UI:
# Datacenter → Storage → pbs-p2d2 → Backups
# → VM auswählen → Restore

# Oder CLI:
qmrestore pbs-p2d2:backup/vm/100/2024-01-15T01:00:00Z 100
```

### Datei-Level-Restore

```
# Backup mounten
proxmox-backup-client mount \
  vm/100/2024-01-15T01:00:00Z \
  /mnt/restore \
  --repository backup@pbs@10.0.0.10:p2d2-backups

# Dateien extrahieren
cp /mnt/restore/etc/postgresql/15/main/postgresql.conf /tmp/

# Unmounten
umount /mnt/restore
```

## Offsite-Backup

### Sync zu Remote-PBS

```
# Remote-PBS als Sync-Target
proxmox-backup-manager sync-job create offsite-sync \
  --remote offsite-pbs \
  --remote-store p2d2-backups \
  --store p2d2-backups \
  --schedule "daily"
```

### Encryption

```
# Verschlüsselten Backup-Namespace
proxmox-backup-manager namespace create encrypted \
  --parent p2d2-backups

# Encryption-Key generieren
proxmox-backup-manager encryption-key create
```

## Monitoring

### Email-Benachrichtigungen

```
# SMTP konfigurieren
proxmox-backup-manager email-forward \
  --mailto admin@example.com \
  --from-address pbs@example.com \
  --smtp-server mail.example.com
```

### Backup-Reports

```
# Täglicher Report
proxmox-backup-manager verify-job create daily-verify \
  --store p2d2-backups \
  --schedule "daily"
```

## Best Practices

- **3-2-1-Regel**: 3 Kopien, 2 Medien, 1 offsite
- **Testing**: Regelmäßige Restore-Tests
- **Monitoring**: Überwachung der Backup-Jobs
- **Encryption**: Sensitive Daten verschlüsseln
- **Retention**: Sinnvolle Aufbewahrungsfristen

::: warning Restore-Tests
Backups sind wertlos, wenn sie nicht wiederhergestellt werden können! Führen Sie regelmäßige Restore-Tests durch.
:::
