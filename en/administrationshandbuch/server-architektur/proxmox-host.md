---
title: Proxmox Host
description: Virtualization platform for p2d2 infrastructure
quality:
  completeness: 85
  accuracy: 80
  reviewed: false
  reviewer: (Translation: KI)
  reviewDate: null
---

# Proxmox Host

## Hardware Specifications

```
CPU: Intel Core i5 13th Generation
  - Cores: 14 Physical Cores
  - Threads: 20 Logical CPUs
  - Features: AVX2, AES-NI, Virtualization (VT-x/VT-d)

RAM: 64 GB DDR4
Swap: 6 GB

System Type: Dedicated Server (Bare Metal)
```

## Software Stack

```
Virtualization: Proxmox VE 9.x (current Stable)
Kernel: Linux 6.x (PVE-optimized)
QEMU/KVM: Version 9.x
Container Engine: LXC (Linux Containers)
```

::: tip Why Proxmox?

  - **Open Source**: Free, community-driven
  - **Enterprise-Ready**: Production-ready without license costs
  - **Hybrid**: Combines VMs (KVM) and containers (LXC)
  - **Backup Integration**: Proxmox Backup Server (PBS) natively integrated
    :::

## Storage Architecture

### LVM-Thin Pool (VMs-Containers)

```
Type: LVM-Thin Volume
Usage: Root filesystems for LXC and VM disks
Advantage: Snapshots, Thin Provisioning, Efficiency
```

### Local Directory Storage

```
Type: Directory
Usage: Templates, ISOs, temporary backups
Path: /var/lib/vz
```

### Proxmox Backup Server (PBS)

```
Type: Deduplicating backup storage
Usage: Production backups of all VMs/LXCs
Features: Incremental snapshots, encryption, verification
```

::: warning Backup Capacity
PBS storage should be regularly checked for utilization. If >80%, recommendation: plan expansion.
:::

## Network Configuration

```
Bridges:
  - vmbr0: WAN Bridge (Internet-facing)
  - vmbr1: LAN Bridge (Internal service network)
  - vmbr2: Management VLAN (Admin access)

VPN: WireGuard for secure remote administration
```

Detailed network architecture: [Network Documentation](https://www.google.com/search?q=./netzwerk-architektur.md)

## Security Configuration

### Proxmox Firewall

```
Status: Enabled at host level
Policy: Default DROP (Whitelist approach)
Rule Management: Via Web UI or pvesh CLI
```

### Access Control

  - **Web UI**: HTTPS-only, Port 8006
  - **SSH**: Only via Management VLAN or VPN
  - **API**: Token-based authentication
  - **Updates**: Automatic security patches (optional)

## Running Instances

### LXC Containers (Lightweight)

| Name | Status | Role | Resources |
|------|--------|-------|------------|
| postgresql | ✅ running | Geodatabase | 2 GB RAM, 15 GB Disk |
| geoserver | ✅ running | WFS/WMS Server | 6 GB RAM, 12 GB Disk |
| mapproxy | ✅ running | Tile Proxy | 4 GB RAM, 38 GB Disk |
| frontend | ✅ running | Web Frontend | 4 GB RAM, 25 GB Disk |
| zabbix | ⏸ stopped | Monitoring (optional) | 2 GB RAM, 10 GB Disk |

### Virtual Machines (Full VMs)

| Name | Status | Role | Resources |
|------|--------|-------|------------|
| OPNSense | ✅ running | Firewall + Proxy | 4 GB RAM, 25 GB Disk |
| osm-tiler | ✅ running | Tile Rendering | 6 GB RAM, 65 GB Disk |

## Management Tools

### CLI Administration

```
# Container Management
pct list                    # List containers
pct start <VMID>           # Start container
pct exec <VMID> -- bash    # Shell in container

# VM Management
qm list                     # List VMs
qm start <VMID>             # Start VM
qm snapshot <VMID> <NAME>  # Create snapshot

# Backup Management
pvesm list <STORAGE>       # List backups
vzdump <VMID>              # Manual backup
```

### Web UI

  - **URL**: `https://<PROXMOX_HOST>:8006`
  - **Features**:
      - Graphical resource overview
      - Console access to VMs/LXCs
      - Backup job scheduling
      - Firewall rule editor

## Maintenance Checklist

**Weekly**:

  - [ ] Check PBS capacity
  - [ ] Check backup logs for errors

**Monthly**:

  - [ ] Kernel updates via `apt update && apt upgrade`
  - [ ] Check container template updates
  - [ ] Perform restore test of a backup

**Quarterly**:

  - [ ] Review firewall rules
  - [ ] Analyze resource utilization
  - [ ] Test disaster recovery plan

## References

  - [Proxmox VE Documentation](https://pve.proxmox.com/pve-docs/)
  - [LXC vs. KVM: When to use which?](https://pve.proxmox.com/wiki/Linux_Container)
  - [Proxmox Backup Server](https://pbs.proxmox.com/docs/)