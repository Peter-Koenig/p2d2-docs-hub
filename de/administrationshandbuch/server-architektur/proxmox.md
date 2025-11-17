---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Proxmox VE

Proxmox Virtual Environment (Proxmox VE) ist die Virtualisierungsplattform für p2d2. Sie bietet KVM-basierte Virtualisierung und LXC-Container.

## Installation

### Hardware-Vorbereitung

- **BIOS**: Virtualisierung aktivieren (Intel VT-x oder AMD-V)
- **Netzwerk**: Mind. zwei Netzwerkkarten (Management + Daten)
- **Storage**: ZFS für Storage-Pool empfohlen

### Proxmox VE installieren

```
# ISO herunterladen
wget https://enterprise.proxmox.com/iso/proxmox-ve_8.1-1.iso

# Auf USB-Stick schreiben
dd if=proxmox-ve_8.1-1.iso of=/dev/sdX bs=1M status=progress

# Von USB-Stick booten und Installation folgen
```

### Post-Installation

```
# Enterprise-Repository deaktivieren (ohne Subscription)
rm /etc/apt/sources.list.d/pve-enterprise.list

# No-Subscription-Repository aktivieren
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" \
  > /etc/apt/sources.list.d/pve-no-subscription.list

# System aktualisieren
apt update && apt full-upgrade -y
```

## Netzwerk-Konfiguration

### Bridges

```
# /etc/network/interfaces
auto lo
iface lo inet loopback

# Management
auto eno1
iface eno1 inet manual

auto vmbr0
iface vmbr0 inet static
    address 192.168.1.10/24
    gateway 192.168.1.1
    bridge-ports eno1
    bridge-stp off
    bridge-fd 0

# VM-Netzwerk
auto eno2
iface eno2 inet manual

auto vmbr1
iface vmbr1 inet static
    address 10.0.0.1/24
    bridge-ports eno2
    bridge-stp off
    bridge-fd 0
```

### Firewall

```
# Proxmox-Firewall aktivieren
pvesh set /cluster/firewall/options -enable 1

# SSH erlauben
pvesh create /cluster/firewall/rules \
  --action ACCEPT \
  --proto tcp \
  --dport 22 \
  --type in
```

## Storage-Konfiguration

### ZFS-Pool

```
# ZFS-Pool erstellen
zpool create -f tank mirror /dev/sdb /dev/sdc

# Kompression aktivieren
zfs set compression=lz4 tank

# Als Proxmox-Storage registrieren
pvesm add zfspool tank --pool tank
```

### NFS-Storage

```
# NFS-Share mounten
pvesm add nfs backup \
  --server 192.168.1.20 \
  --export /mnt/backup \
  --content backup,vztmpl,iso
```

## VM-Erstellung für p2d2

### Geodatenbank-VM

```
# VM erstellen
qm create 100 \
  --name gis-db \
  --memory 8192 \
  --cores 4 \
  --net0 virtio,bridge=vmbr1 \
  --scsi0 tank:32 \
  --ostype l26 \
  --cdrom local:iso/debian-12-amd64.iso \
  --boot order=scsi0

# VM starten
qm start 100
```

### GeoServer-VM

```
qm create 101 \
  --name geoserver \
  --memory 4096 \
  --cores 2 \
  --net0 virtio,bridge=vmbr1 \
  --scsi0 tank:20 \
  --ostype l26
```

### Frontend-VM

```
qm create 102 \
  --name p2d2-frontend \
  --memory 2048 \
  --cores 2 \
  --net0 virtio,bridge=vmbr1 \
  --scsi0 tank:20 \
  --ostype l26
```

## Backup-Integration

```
# Backup-Job erstellen
pvesh create /cluster/backup \
  --storage backup \
  --vmid 100,101,102 \
  --dow mon,wed,fri \
  --starttime 02:00 \
  --compress lzo \
  --mode snapshot
```

## Monitoring

### Prometheus-Exporter

```
# PVE-Exporter installieren
apt install prometheus-pve-exporter

# Konfigurieren
cat > /etc/prometheus/pve.yml << EOFin
default:
  user: monitoring@pve
  password: <monitoring-password>
  verify_ssl: false
EOFin
```

### Grafana-Dashboard

Importieren Sie das Proxmox-Dashboard (ID 10347) in Grafana.

## Best Practices

- **HA-Cluster**: Für Produktion mind. 3 Proxmox-Nodes
- **Backup**: Tägliche Backups auf separatem Storage
- **Updates**: Regelmäßige Updates, aber nicht automatisch
- **Monitoring**: Prometheus + Grafana für Überwachung
- **Dokumentation**: Änderungen dokumentieren

::: tip High Availability
Für produktive Umgebungen sollte ein Proxmox-Cluster mit mindestens 3 Nodes aufgebaut werden.
:::
