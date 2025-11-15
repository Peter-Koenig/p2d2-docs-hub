# OPNsense Firewall

OPNsense ist die Firewall- und Router-Lösung für p2d2. Sie schützt die Geodateninfrastruktur und routet den Traffic zwischen den Netzwerken.

## Installation

### Als Proxmox-VM

```
# VM für OPNsense erstellen
qm create 10 \
  --name opnsense \
  --memory 2048 \
  --cores 2 \
  --net0 virtio,bridge=vmbr0 \
  --net1 virtio,bridge=vmbr1 \
  --scsi0 tank:16 \
  --ostype other \
  --cdrom local:iso/OPNsense-24.1-amd64.iso \
  --boot order=scsi0

# VM starten
qm start 10
```

### Initiale Konfiguration

1. **Boot von ISO**
2. **Installer starten**: `Install (UFS)`
3. **Disk auswählen**: `da0`
4. **Root-Passwort setzen**
5. **Reboot**

## Netzwerk-Konfiguration

### Interfaces zuweisen

```
WAN:  vtnet0 (vmbr0 - Internet)
LAN:  vtnet1 (vmbr1 - Internes Netz)
```

### Interface-Konfiguration

**WAN (vtnet0)**:
- IPv4: DHCP oder statisch (z.B. 203.0.113.10/24)
- IPv6: DHCP6 oder statisch

**LAN (vtnet1)**:
- IPv4: 10.0.0.1/24
- DHCP-Server: 10.0.0.100-10.0.0.250

## Firewall-Regeln

### LAN → WAN (Ausgehend)

```
# Web-Zugriff erlauben
Action: Pass
Interface: LAN
Protocol: TCP
Source: LAN net
Destination: any
Destination Port: 80, 443

# DNS erlauben
Action: Pass
Interface: LAN
Protocol: UDP
Source: LAN net
Destination: any
Destination Port: 53
```

### WAN → LAN (Eingehend)

```
# Nur spezifische Dienste
# HTTPS für p2d2-Frontend
Action: Pass
Interface: WAN
Protocol: TCP
Source: any
Destination: 10.0.0.102 (Frontend-VM)
Destination Port: 443

# SSH (nur aus bestimmten Netzen)
Action: Pass
Interface: WAN
Protocol: TCP
Source: <Admin-IP-Range>
Destination: 10.0.0.1
Destination Port: 22
```

### GDI-Dienste freigeben

```
# WFS/WMS (GeoServer)
Action: Pass
Interface: WAN
Protocol: TCP
Source: any
Destination: 10.0.0.101 (GeoServer-VM)
Destination Port: 8080

# Tile-Server
Action: Pass
Interface: WAN
Protocol: TCP
Source: any
Destination: 10.0.0.103 (Tileserver-VM)
Destination Port: 8081
```

## NAT-Konfiguration

### Port-Forwarding

```
# p2d2-Frontend
Interface: WAN
Protocol: TCP
Destination: WAN address
Destination Port: 443
Redirect target IP: 10.0.0.102
Redirect target Port: 443

# GeoServer WFS
Interface: WAN
Protocol: TCP
Destination: WAN address
Destination Port: 8080
Redirect target IP: 10.0.0.101
Redirect target Port: 8080
```

### Outbound NAT

```
# Automatisches Outbound NAT für LAN
Interface: WAN
Source: 10.0.0.0/24
Translation: Interface address
```

## VPN-Konfiguration

### Wireguard für Remote-Admins

```
# Wireguard-Instanz erstellen
# Web-UI: VPN → WireGuard → Instances → Add

# Endpoint
Name: admin-vpn
Listen Port: 51820
Tunnel Address: 10.10.10.1/24

# Peer hinzufügen
Name: admin-laptop
Public Key: <public-key>
Allowed IPs: 10.10.10.2/32
```

### OpenVPN für Site-to-Site

```
# Für Verbindung zu anderen p2d2-Instanzen
# Web-UI: VPN → OpenVPN → Servers → Add

# Server-Modus: SSL/TLS
# Protocol: UDP
# Port: 1194
# Network: 10.20.0.0/24
```

## IDS/IPS mit Suricata

### Installation

```
# Web-UI: Services → Intrusion Detection → Administration
# Enable: Yes
# Pattern matcher: Hyperscan
# Interfaces: WAN
```

### Regelsets

```
# ET Open aktivieren
# Abuse.ch aktivieren
# SCWG-Security aktivieren
```

### Alerts

```
# Email-Benachrichtigung
# Web-UI: Services → Intrusion Detection → Alerts
# SMTP-Server konfigurieren
```

## HTTPS-Inspektion (Optional)

::: warning Datenschutz
HTTPS-Inspektion erfordert Vertrauen des CA-Zertifikats auf allen Clients und wirft Datenschutzfragen auf!
:::

```
# Web-UI: System → Trust → Authorities
# CA erstellen für HTTPS-Inspektion

# Web-UI: Firewall → Settings → Normalization
# SSL/TLS inspection aktivieren
```

## Monitoring und Logging

### Netflow/IPFIX

```
# Web-UI: Reporting → NetFlow
# Enable: Yes
# Interface: LAN, WAN
# Aggregation: 60s
```

### Syslog an zentralen Server

```
# Web-UI: System → Settings → Logging/Targets
# Transport: UDP
# Hostname: syslog.example.com
# Port: 514
# Level: Informational
```

### Grafana-Dashboard

```
# Prometheus-Exporter installieren
# Web-UI: System → Firmware → Plugins
# os-prometheus-exporter installieren

# Prometheus konfigurieren
# /usr/local/etc/prometheus/prometheus.yml
scrape_configs:
  - job_name: 'opnsense'
    static_configs:
      - targets: ['10.0.0.1:9100']
```

## Hochverfügbarkeit (HA)

### CARP (Common Address Redundancy Protocol)

```
# Zweite OPNsense-VM aufsetzen
# Web-UI: System → High Availability → Settings

# Node 1:
# Synchronize Config to IP: 10.0.0.252
# Synchronize authentication: <shared-secret>

# VIP (Virtual IP) erstellen
# Type: CARP
# Interface: LAN
# Address: 10.0.0.254/24
# VHID: 1
```

## Backup und Restore

### Automatisches Backup

```
# Web-UI: System → Configuration → Backups
# Enable automatic backup
# Backup location: /conf/backup
# Encryption: AES-256

# Backup auf Remote-Storage
# Web-UI: System → Configuration → Backups → Backup/Restore
# → Download configuration: config.xml
```

### Restore

```
# Web-UI: System → Configuration → Backups → Backup/Restore
# Restore area: Upload config.xml
```

## Best Practices

- **Least Privilege**: Nur notwendige Ports öffnen
- **Geo-Blocking**: Zugriff auf bestimmte Länder beschränken
- **Rate-Limiting**: DDoS-Schutz durch Rate-Limits
- **Updates**: Regelmäßige Updates einspielen
- **Monitoring**: Firewall-Logs überwachen
- **HA**: Für Produktion zwei OPNsense-Instanzen im HA-Modus

::: tip Sicherheits-Audit
Führen Sie regelmäßig Sicherheits-Audits durch und überprüfen Sie die Firewall-Regeln!
:::
