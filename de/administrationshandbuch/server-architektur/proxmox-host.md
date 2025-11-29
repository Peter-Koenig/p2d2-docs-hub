---
title: Proxmox Host
description: Virtualisierungsplattform für p2d2-Infrastruktur
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# Proxmox Host

## Hardware-Spezifikationen

```
CPU: Intel Core i5 13th Generation
  - Cores: 14 Physical Cores
  - Threads: 20 Logical CPUs
  - Features: AVX2, AES-NI, Virtualization (VT-x/VT-d)

RAM: 64 GB DDR4
Swap: 6 GB

Systemtyp: Dedicated Server (Bare Metal)
```

## Software-Stack

```
Virtualization: Proxmox VE 9.x (aktuelle Stable)
Kernel: Linux 6.x (PVE-optimiert)
QEMU/KVM: Version 9.x
Container Engine: LXC (Linux Containers)
```

::: tip Warum Proxmox?
- **Open Source**: Kostenlos, Community-getrieben
- **Enterprise-Ready**: Produktiv einsetzbar ohne Lizenzkosten
- **Hybrid**: Kombiniert VMs (KVM) und Container (LXC)
- **Backup-Integration**: Proxmox Backup Server (PBS) nativ integriert
:::

## Storage-Architektur

### LVM-Thin Pool (VMs-Containers)
```
Typ: LVM-Thin Volume
Verwendung: Root-Filesysteme für LXC und VM-Disks
Vorteil: Snapshots, Thin Provisioning, Effizienz
```

### Local Directory Storage
```
Typ: Directory
Verwendung: Templates, ISOs, temporäre Backups
Pfad: /var/lib/vz
```

### Proxmox Backup Server (PBS)
```
Typ: Deduplizierender Backup-Storage
Verwendung: Produktions-Backups aller VMs/LXCs
Features: Inkrementelle Snapshots, Verschlüsselung, Verifizierung
```

::: warning Backup-Kapazität
PBS-Storage sollte regelmäßig auf Auslastung geprüft werden. Bei >80% Empfehlung: Erweiterung planen.
:::

## Netzwerk-Konfiguration

```
Bridges:
  - vmbr0: WAN-Bridge (Internet-facing)
  - vmbr1: LAN-Bridge (Internes Service-Netzwerk)
  - vmbr2: Management-VLAN (Admin-Zugang)

VPN: WireGuard für sichere Remote-Administration
```

Detaillierte Netzwerk-Architektur: [Netzwerk-Dokumentation](./netzwerk-architektur.md)

## Sicherheits-Konfiguration

### Proxmox-Firewall
```
Status: Enabled auf Host-Ebene
Policy: Default DROP (Whitelist-Ansatz)
Regel-Management: Via Web-UI oder pvesh CLI
```

### Zugriffskontrolle
- **Web-UI**: HTTPS-only, Port 8006
- **SSH**: Nur über Management-VLAN oder VPN
- **API**: Token-basierte Authentifizierung
- **Updates**: Automatische Security-Patches (optional)

## Laufende Instanzen

### LXC Container (Lightweight)
| Name | Status | Rolle | Ressourcen |
|------|--------|-------|------------|
| postgresql | ✅ running | Geodatenbank | 2 GB RAM, 15 GB Disk |
| geoserver | ✅ running | WFS/WMS-Server | 6 GB RAM, 12 GB Disk |
| mapproxy | ✅ running | Tile-Proxy | 4 GB RAM, 38 GB Disk |
| frontend | ✅ running | Web-Frontend | 4 GB RAM, 25 GB Disk |
| zabbix | ⏸ stopped | Monitoring (optional) | 2 GB RAM, 10 GB Disk |

### Virtual Machines (Vollständige VMs)
| Name | Status | Rolle | Ressourcen |
|------|--------|-------|------------|
| OPNSense | ✅ running | Firewall + Proxy | 4 GB RAM, 25 GB Disk |
| osm-tiler | ✅ running | Tile-Rendering | 6 GB RAM, 65 GB Disk |

## Management-Tools

### CLI-Administration
```
# Container-Management
pct list                    # Container auflisten
pct start <VMID>           # Container starten
pct exec <VMID> -- bash    # Shell im Container

# VM-Management
qm list                     # VMs auflisten
qm start <VMID>            # VM starten
qm snapshot <VMID> <NAME>  # Snapshot erstellen

# Backup-Management
pvesm list <STORAGE>       # Backups auflisten
vzdump <VMID>              # Manuelles Backup
```

### Web-UI
- **URL**: `https://<PROXMOX_HOST>:8006`
- **Features**: 
  - Grafische Ressourcen-Übersicht
  - Konsolen-Zugriff auf VMs/LXCs
  - Backup-Job-Planung
  - Firewall-Regel-Editor

## Wartungs-Checkliste

**Wöchentlich**:
- [ ] PBS-Kapazität prüfen
- [ ] Backup-Logs auf Fehler checken

**Monatlich**:
- [ ] Kernel-Updates via `apt update && apt upgrade`
- [ ] Container-Template-Updates prüfen
- [ ] Restore-Test eines Backups durchführen

**Quartalsweise**:
- [ ] Firewall-Regeln reviewen
- [ ] Ressourcen-Auslastung analysieren
- [ ] Disaster-Recovery-Plan testen

## Referenzen

- [Proxmox VE Dokumentation](https://pve.proxmox.com/pve-docs/)
- [LXC vs. KVM: Wann was?](https://pve.proxmox.com/wiki/Linux_Container)
- [Proxmox Backup Server](https://pbs.proxmox.com/docs/)