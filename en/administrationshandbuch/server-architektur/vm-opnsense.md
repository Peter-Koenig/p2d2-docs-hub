---
title: OPNSense Firewall
description: Firewall and Reverse Proxy for p2d2 infrastructure
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# VM: OPNSense Firewall

## VM Information

```
Type: Virtual Machine (KVM/QEMU)
OS: OPNSense 25.x (FreeBSD 14.x)
Hostname: opnsense (customizable)
Status: running

Resources:
vCPUs: 4
RAM: 4 GB
Disk: 25 GB (dynamically expandable)
```

## Installed Software

### OPNSense Firewall
```
Version: 25.x (current Stable)
Base: FreeBSD 14.x
Firewall Engine: pf (Packet Filter)
Web Interface: Lighttpd + PHP
```

### Caddy Reverse Proxy
```
Version: 2.x (current Stable)
Installation: FreeBSD Package
Service: caddy.service (systemd)
TLS: Let's Encrypt (automatic)
```

### DNS Resolver
```
Service: Unbound
Upstream: Cloudflare, Quad9
DNSSEC: Enabled
Query Logging: Optional
```

## Network Configuration

### Network Interfaces
```
WAN Interface:
  - Type: Virtual (vmbr0 Bridge)
  - IP: DHCP or static (ISP-dependent)
  - Firewall: Default DENY (Whitelist)

LAN Interface:
  - Type: Virtual (vmbr1 Bridge)
  - IP: RFC1918 Private Network
  - Gateway: For internal services
  - DHCP: Enabled for internal clients
```

### Bridge Configuration (Proxmox)
```
vmbr0 (WAN):
  - Connection to Internet Uplink
  - Only OPNSense WAN Interface

vmbr1 (LAN):
  - Private network for p2d2 services
  - All LXC containers and internal VMs
```

## Firewall Rules

### Firewall Philosophy
```
Default Policy: DROP (all packets)
Approach: Whitelist (only explicitly allowed connections)
Stateful: Yes (track established connections)
Logging: Log important events
```

### Rule Categories

#### WAN → LAN (Inbound)
```
1.  HTTPS (443) → Caddy Reverse Proxy: ALLOW
2.  HTTP (80) → Caddy (Redirect to HTTPS): ALLOW
3.  WireGuard (<VPN_PORT>) → VPN Server: ALLOW
4.  All other ports: DENY
```

#### LAN → Internet (Outbound)
```
1.  HTTP/HTTPS (80/443): ALLOW (for APT updates, Let's Encrypt)
2.  DNS (53): ALLOW (Upstream resolvers)
3.  NTP (123): ALLOW (Time synchronization)
4.  SMTP (25/587): ALLOW (only for Ory Email dispatch)
5.  Others: DENY (only explicitly needed ports)
```

#### LAN → LAN (Service-to-Service)
See **Service Matrix** in Network Documentation.

## Caddy Reverse Proxy

### Main Configuration (Caddyfile)

```
# /usr/local/etc/caddy/Caddyfile

# Global Settings
{
email admin@data-dna.eu
acme_ca https://acme-v02.api.letsencrypt.org/directory
}

# Auto-HTTPS for all domains
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

### Custom Configurations

```
# /usr/local/etc/caddy/caddy.d/geo-services.conf

# GeoServer WMS Optimizations
ows.data-dna.eu {
reverse_proxy http://geoserver.lan:8080 {
header_up X-Real-IP {remote_host}
header_up X-Forwarded-Proto {scheme}
}

# Rate Limiting for WMS
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

# MapProxy Tile Service
tiles.data-dna.eu {
reverse_proxy http://mapproxy.lan:8080

# Caching for Tiles
header Cache-Control "public, max-age=86400"

# CORS for Web-Apps
header Access-Control-Allow-Origin *
}
```

## DNS Configuration (Unbound)

### Local DNS Records
```
# /var/unbound/host_entries.conf

local-data: "postgresql.lan A <DB_CONTAINER_IP>"
local-data: "geoserver.lan A <GEOSERVER_CONTAINER_IP>"
local-data: "mapproxy.lan A <MAPPROXY_CONTAINER_IP>"
local-data: "frontend.lan A <FRONTEND_CONTAINER_IP>"
local-data: "osm-tiler.lan A <TILER_VM_IP>"
local-data-ptr: "<DB_CONTAINER_IP> postgresql.lan"
```

### Upstream Resolver
```
# /var/unbound/forwarding.conf

forward-zone:
name: "."
forward-addr: 1.1.1.1@853#cloudflare-dns.com
forward-addr: 9.9.9.9@853#dns.quad9.net
forward-tls-upstream: yes
```

## VPN Access (WireGuard)

### Server Configuration
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
```

### Firewall Rules for VPN
```
VPN → LAN: ALLOW (for Admin access)
VPN → WAN: DENY (only via NAT)
VPN Clients can access internal services
```

## Backup Strategy

### PBS Snapshot (VM-Level)
- **Schedule**: Daily
- **Retention**: 7 days
- **Type**: QEMU Snapshot

### Configuration Backup
```
# OPNSense Config Export
System → Configuration → Backups → Download

# Caddy Configuration
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz  
/usr/local/etc/caddy/

# Automation via Cron
# /etc/cron.daily/opnsense-backup
#!/bin/sh
/usr/local/etc/rc.backup_running
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz  
/usr/local/etc/caddy/
```

## Monitoring

### Health Checks
```
# Service Status
service -e | grep -E "(caddy|unbound|wireguard)"

# Caddy Status
curl -I https://www.data-dna.eu

# DNS Resolution
nslookup www.data-dna.eu 127.0.0.1

# Firewall Stats
pfctl -si | grep -E "(states|searches)"
```

### Log Analysis
```
# Firewall Logs
tail -f /var/log/filter.log

# Caddy Logs
tail -f /var/log/caddy/access.log
tail -f /var/log/caddy/error.log

# System Logs
tail -f /var/log/system.log
```

## Troubleshooting

### Network Problems
```
# Interface Status
ifconfig -a

# Routing Table
netstat -rn

# Firewall Rules
pfctl -sr

# Packet Capture
tcpdump -i <INTERFACE> -n
```

### Caddy Problems
```
# Service Status
service caddy status

# Configuration Validation
caddy validate --config /usr/local/etc/caddy/Caddyfile

# Log Analysis
journalctl -u caddy --no-pager -n 100
```

### DNS Problems
```
# Unbound Status
service unbound status

# Test DNS Resolution
dig @127.0.0.1 www.data-dna.eu

# Query Logs
tail -f /var/log/unbound.log
```

## Security Configuration

### OPNSense Hardening
```
Web Interface:
  - HTTPS-only
  - Strong Admin Password
  - 2FA optionally activatable

SSH Access:
  - Only via VPN or Management VLAN
  - Key-based Authentication
  - Password Authentication disabled

Firewall:
  - Default DENY Policy
  - Stateful Packet Inspection
  - Geo-Blocking optional
```

### Caddy Security
```
TLS Configuration:
  - TLS 1.2 minimum, TLS 1.3 preferred
  - Modern Cipher Suites
  - HSTS Header
  - OCSP Stapling

Rate-Limiting:
  - For all public endpoints
  - IP-based limits
  - Burst Protection
```

## Best Practices

✅ **Do**:
- Regular OPNSense updates (Security Patches)
- Review firewall rules regularly
- Use VPN for all admin access
- Monitor system logs
- Backup the configuration

❌ **Don't**:
- Use default passwords
- Open unnecessary ports
- Run without rate limiting
- Ignore firewall logs
- Allow direct SSH access from the internet

## References

- [OPNSense Documentation](https://docs.opnsense.org/)
- [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
- [WireGuard VPN](https://www.wireguard.com/)
- [Unbound DNS](https://nlnetlabs.nl/documentation/unbound/)