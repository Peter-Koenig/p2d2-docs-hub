---
title: OPNSense Firewall
description: Firewall und Reverse Proxy für p2d2-Infrastruktur
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# VM: OPNSense Firewall

## VM-Informationen

```
Typ: Virtual Machine (KVM/QEMU)
OS: OPNSense 25.x (FreeBSD 14.x)
Hostname: opnsense (anpassbar)
Status: running

Ressourcen:
  vCPUs: 4
  RAM: 4 GB
  Disk: 25 GB (dynamisch erweiterbar)
```

## Installierte Software

### OPNSense Firewall
```
Version: 25.x (aktuelle Stable)
Base: FreeBSD 14.x
Firewall Engine: pf (Packet Filter)
Web-Interface: Lighttpd + PHP
```

### Caddy Reverse Proxy
```
Version: 2.x (aktuelle Stable)
Installation: FreeBSD Package
Service: caddy.service (systemd)
TLS: Let's Encrypt (automatisch)
```

### DNS Resolver
```
Service: Unbound
Upstream: Cloudflare, Quad9
DNSSEC: Enabled
Query-Logging: Optional
```

## Netzwerk-Konfiguration

### Network Interfaces
```
WAN Interface:
  - Typ: Virtuell (vmbr0 Bridge)
  - IP: DHCP oder statisch (ISP-abhängig)
  - Firewall: Default DENY (Whitelist)

LAN Interface:
  - Typ: Virtuell (vmbr1 Bridge)
  - IP: RFC1918 Private Network
  - Gateway: Für interne Services
  - DHCP: Aktiviert für interne Clients
```

### Bridge-Konfiguration (Proxmox)
```
vmbr0 (WAN):
  - Verbindung zu Internet-Uplink
  - Nur OPNSense WAN-Interface

vmbr1 (LAN):
  - Private Netzwerk für p2d2-Services
  - Alle LXC-Container und interne VMs
```

## Firewall-Regeln

### Firewall-Philosophie
```
Default Policy: DROP (alle Pakete verwerfen)
Ansatz: Whitelist (nur explizit erlaubte Verbindungen)
Stateful: Ja (etablierte Verbindungen tracken)
Logging: Wichtige Events loggen
```

### Regel-Kategorien

#### WAN → LAN (Eingehend)
```
1. HTTPS (443) → Caddy Reverse Proxy: ALLOW
2. HTTP (80) → Caddy (Redirect zu HTTPS): ALLOW
3. WireGuard (<VPN_PORT>) → VPN Server: ALLOW
4. Alle anderen Ports: DENY
```

#### LAN → Internet (Ausgehend)
```
1. HTTP/HTTPS (80/443): ALLOW (Updates, Let's Encrypt)
2. DNS (53): ALLOW (Upstream-Resolver)
3. NTP (123): ALLOW (Zeit-Synchronisation)
4. SMTP (25/587): ALLOW (nur für Ory Email-Versand)
5. Andere: DENY (nur explizit benötigte Ports)
```

#### LAN → LAN (Service-zu-Service)
Siehe **Service-Matrix** in Netzwerk-Dokumentation.

## Caddy Reverse Proxy

### Hauptkonfiguration (Caddyfile)

```
# /usr/local/etc/caddy/Caddyfile

# Global Settings
{
    email admin@data-dna.eu
    acme_ca https://acme-v02.api.letsencrypt.org/directory
}

# Auto-HTTPS für alle Domains
*.data-dna.eu {
    tls {
        dns cloudflare <CF_API_TOKEN>
    }
    
    @main host www.data-dna.eu
    handle @main {
        reverse_proxy http://frontend.lan:3000
    }
    
    @dev host dev.data-dna.eu
    handle @dev {
        reverse_proxy http://frontend.lan:3001
    }
    
    @feature1 host f-de1.data-dna.eu
    handle @feature1 {
        reverse_proxy http://frontend.lan:3002
    }
    
    @feature2 host f-de2.data-dna.eu
    handle @feature2 {
        reverse_proxy http://frontend.lan:3003
    }
    
    @feature3 host f-fv.data-dna.eu
    handle @feature3 {
        reverse_proxy http://frontend.lan:3004
    }
    
    @doc host doc.data-dna.eu
    handle @doc {
        reverse_proxy http://frontend.lan:4173
    }
    
    @ows host ows.data-dna.eu
    handle @ows {
        reverse_proxy http://geoserver.lan:8080
    }
    
    @wfs host wfs.data-dna.eu
    handle @wfs {
        reverse_proxy http://geoserver.lan:8080
    }
    
    @tiles host tiles.data-dna.eu
    handle @tiles {
        reverse_proxy http://mapproxy.lan:8080
    }
    
    @proxy host proxy.data-dna.eu
    handle @proxy {
        reverse_proxy http://mapproxy.lan:8080
    }
}

# HTTP to HTTPS Redirect
http://*data-dna.eu {
    redir https://{host}{uri} permanent
}
```

### Custom Konfigurationen

```
# /usr/local/etc/caddy/caddy.d/geo-services.conf

# GeoServer WMS Optimierungen
ows.data-dna.eu {
    reverse_proxy http://geoserver.lan:8080 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
    
    # Rate Limiting für WMS
    @wms {
        path /geoserver/wms*
    }
    handle @wms {
        rate_limit {
            zone wms_zone 10r/s
            key {remote_host}
        }
        reverse_proxy http://geoserver.lan:8080
    }
}

# MapProxy Tile-Service
tiles.data-dna.eu {
    reverse_proxy http://mapproxy.lan:8080
    
    # Caching für Tiles
    header Cache-Control "public, max-age=86400"
    
    # CORS für Web-Apps
    header Access-Control-Allow-Origin *
}
```

## DNS-Konfiguration (Unbound)

### Lokale DNS-Records
```
# /var/unbound/host_entries.conf
local-data: "postgresql.lan A <DB_CONTAINER_IP>"
local-data: "geoserver.lan A <GEOSERVER_CONTAINER_IP>"
local-data: "mapproxy.lan A <MAPPROXY_CONTAINER_IP>"
local-data: "frontend.lan A <FRONTEND_CONTAINER_IP>"
local-data: "osm-tiler.lan A <TILER_VM_IP>"
local-data-ptr: "<DB_CONTAINER_IP> postgresql.lan"
```

### Upstream-Resolver
```
# /var/unbound/forwarding.conf
forward-zone:
    name: "."
    forward-addr: 1.1.1.1@853#cloudflare-dns.com
    forward-addr: 9.9.9.9@853#dns.quad9.net
    forward-tls-upstream: yes
```

## VPN-Zugang (WireGuard)

### Server-Konfiguration
```
# /usr/local/etc/wireguard/wg0.conf
[Interface]
Address = <VPN_INTERNAL_IP>/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = <VPN_PORT>

[Peer]
# Admin Client 1
PublicKey = <CLIENT_1_PUBLIC_KEY>
AllowedIPs = <CLIENT_1_VPN_IP>/32
PersistentKeepalive = 25

[Peer]
# Admin Client 2
PublicKey = <CLIENT_2_PUBLIC_KEY>
AllowedIPs = <CLIENT_2_VPN_IP>/32
PersistentKeepalive = 25
```

### Firewall-Regeln für VPN
```
VPN → LAN: ALLOW (für Admin-Zugriff)
VPN → WAN: DENY (nur über NAT)
VPN Clients können auf interne Services zugreifen
```

## Backup-Strategie

### PBS-Snapshot (VM-Level)
- **Zeitplan**: Täglich
- **Retention**: 7 Tage
- **Typ**: QEMU Snapshot

### Konfigurations-Backup
```
# OPNSense Config Export
System → Configuration → Backups → Download

# Caddy Konfiguration
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/

# Automatisierung via Cron
# /etc/cron.daily/opnsense-backup
#!/bin/sh
/usr/local/etc/rc.backup_running
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/
```

## Monitoring

### Health-Checks
```
# Service-Status
service -e | grep -E "(caddy|unbound|wireguard)"

# Caddy-Status
curl -I https://www.data-dna.eu

# DNS-Resolution
nslookup www.data-dna.eu 127.0.0.1

# Firewall-Stats
pfctl -si | grep -E "(states|searches)"
```

### Log-Analyse
```
# Firewall-Logs
tail -f /var/log/filter.log

# Caddy-Logs
tail -f /var/log/caddy/access.log
tail -f /var/log/caddy/error.log

# System-Logs
tail -f /var/log/system.log
```

## Troubleshooting

### Netzwerk-Probleme
```
# Interface-Status
ifconfig -a

# Routing-Tabelle
netstat -rn

# Firewall-Regeln
pfctl -sr

# Packet Capture
tcpdump -i <INTERFACE> -n
```

### Caddy-Probleme
```
# Service-Status
service caddy status

# Konfigurations-Validierung
caddy validate --config /usr/local/etc/caddy/Caddyfile

# Log-Analyse
journalctl -u caddy --no-pager -n 100
```

### DNS-Probleme
```
# Unbound-Status
service unbound status

# DNS-Resolution testen
dig @127.0.0.1 www.data-dna.eu

# Query-Logs
tail -f /var/log/unbound.log
```

## Sicherheits-Konfiguration

### OPNSense Hardening
```
Web-Interface:
  - HTTPS-only
  - Strong Admin Password
  - 2FA optional aktivierbar

SSH-Zugang:
  - Nur über VPN oder Management-VLAN
  - Key-based Authentication
  - Password Authentication deaktiviert

Firewall:
  - Default DENY Policy
  - Stateful Packet Inspection
  - Geo-Blocking optional
```

### Caddy Security
```
TLS-Konfiguration:
  - TLS 1.2 minimum, TLS 1.3 preferred
  - Modern Cipher Suites
  - HSTS Header
  - OCSP Stapling

Rate-Limiting:
  - Für alle öffentlichen Endpoints
  - IP-basierte Limits
  - Burst-Protection
```

## Best Practices

✅ **Do**:
- Regelmäßige OPNSense Updates (Security-Patches)
- Firewall-Regeln regelmäßig reviewen
- VPN für alle Admin-Zugriffe verwenden
- Monitoring der System-Logs
- Backup der Konfiguration

❌ **Don't**:
- Standard-Passwörter verwenden
- Unnötige Ports öffnen
- Ohne Rate-Limiting laufen lassen
- Firewall-Logs ignorieren
- Direkten SSH-Zugang aus dem Internet

## Referenzen

- [OPNSense Dokumentation](https://docs.opnsense.org/)
- [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
- [WireGuard VPN](https://www.wireguard.com/)
- [Unbound DNS](https://nlnetlabs.nl/documentation/unbound/)