---
title: Network Architecture
description: Network segmentation and firewall design
quality:
  completeness: 85
  accuracy: 80
  reviewed: true
  reviewer: Peter König
  reviewDate: 2025-11-29
---

# Network Architecture

## Network Topology

```
graph TB
subgraph Internet
    WAN[Internet<br>Public IPs]
end

subgraph "Proxmox Host"
    subgraph "WAN Bridge"
        VM_WAN[OPNSense WAN Interface]
    end
    
    subgraph "LAN Bridge (Internal Network)"
        VM_LAN[OPNSense LAN Interface<br/>Gateway + DNS]
        DB[PostgreSQL/PostGIS]
        GeoServer[GeoServer WFS/WMS]
        MapProxy[MapProxy Tiles]
        Frontend[AstroJS Frontend]
        Tiler[OSM Tiler VM]
        IAM[Ory IAM (planned)]
    end
    
    subgraph "Management VLAN"
        AdminAccess[Admin Access<br/>VPN-Only]
    end
end

WAN <-->|NAT| VM_WAN
VM_WAN <--> VM_LAN

VM_LAN <--> DB
VM_LAN <--> GeoServer
VM_LAN <--> MapProxy
VM_LAN <--> Frontend
VM_LAN <--> Tiler
VM_LAN -.-> IAM

AdminAccess -.->|VPN Tunnel| VM_LAN

style IAM stroke-dasharray: 5 5
```

## Bridge Configuration

### WAN Bridge (Internet-facing)
```
Function: Connection to Internet Uplink
Attached Interfaces: OPNSense WAN Interface
Security: NO direct containers/VMs (firewall only)
```

**Traffic Flow**:
```
Internet → WAN Bridge → OPNSense Firewall → NAT/Routing → LAN Bridge → Services
```

### LAN Bridge (Internal Service Network)
```
Function: Private network for all p2d2 services
Type: RFC1918 Private Network
Gateway: OPNSense LAN Interface
DNS: Unbound (on OPNSense)

Attached Hosts:
  - OPNSense LAN Interface (Gateway, DHCP, DNS)
  - PostgreSQL/PostGIS Container
  - GeoServer Container
  - MapProxy Container
  - Frontend Container
  - OSM-Tiler VM
  - Ory IAM Container (planned)
```

**Firewall Policy**: Default DENY (Whitelist approach)

Allowed Connections:
- Frontend → Database (PostgreSQL protocol)
- Frontend → GeoServer (WFS-T Requests)
- GeoServer → Database (PostGIS access)
- MapProxy → GeoServer (WMS Proxy)
- MapProxy → OSM-Tiler (Tile Requests)
- Ory IAM → Database (Auth data)
- Frontend → Ory IAM (Session validation)

### Management VLAN
```
Function: Dedicated network for administration
Access: Only via VPN or physical console access
VLAN ID: Custom (configurable)

Usage:
  - Proxmox Web-UI access
  - SSH to Proxmox host
  - Out-of-Band Management
  - Emergency Recovery
```

::: warning Admin Access
Management VLAN is **NEVER** directly accessible from the internet. Access exclusively via VPN (WireGuard).
:::

## OPNSense Firewall Rules

### Firewall Philosophy
```
Default Policy: DROP (all packets)
Approach: Whitelist (only explicitly allowed connections)
Stateful: Yes (track established connections)
Logging: Log important events (no full packet capture)
```

### Rule Categories (simplified)

#### WAN → LAN (Inbound)
```
1.  HTTPS (443) → Caddy Reverse Proxy: ALLOW
2.  HTTP (80) → Caddy (Redirect to HTTPS): ALLOW
3.  SSH (22): DENY (VPN-only)
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
See **Service Matrix** below.

### Service Matrix (Internal Communication)

| Source | Destination | Service | Purpose |
|--------|-------------|---------|-------|
| Frontend | DB | PostgreSQL | WFS-T Data Persistence |
| Frontend | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | PostGIS Layer Queries |
| MapProxy | GeoServer | HTTP | WMS Proxy for Caching |
| MapProxy | OSM-Tiler | HTTP | Tile Rendering Requests |
| Caddy (OPNSense) | Frontend | HTTP | Reverse Proxy to AstroJS Ports |
| Caddy (OPNSense) | MapProxy | HTTP | Tile Delivery |
| **Ory IAM (planned)** | **DB** | **PostgreSQL** | **Auth Databases** |
| **Frontend** | **Ory IAM** | **HTTP** | **Session Validation** |

## Port Overview

### External Ports (Internet → OPNSense)
| Port | Protocol | Service | Public |
|------|-----------|--------|------------|
| 443 | HTTPS | Caddy (all domains) | ✅ Yes |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ Yes |
| 22 | SSH | OPNSense | ❌ No (VPN-only) |
| <VPN_PORT> | UDP | WireGuard | ✅ Yes (for VPN clients) |

### Internal Ports (LAN-only, not public)
| Service | Default Port | Protocol | Access |
|---------|---------------|-----------|---------|
| PostgreSQL | 5432 | TCP | Internal LAN |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | Internal LAN |
| MapProxy | 8080 | HTTP | Internal LAN |
| AstroJS (main) | 3000 | HTTP | Via Caddy Proxy |
| AstroJS (develop) | 3001 | HTTP | Via Caddy Proxy |
| AstroJS (features) | 3002-3004 | HTTP | Via Caddy Proxy |
| Webhook Server | 9321 | HTTP | Internal LAN |
| OSM-Tiler | 8080 | HTTP | Internal LAN |
| **Ory Kratos (planned)** | **4433/4434** | **HTTP** | **Via Caddy Proxy** |
| **Ory Hydra (planned)** | **4444/4445** | **HTTP** | **Via Caddy Proxy** |

::: tip Port Standardization
All HTTP services use port 8080 internally (GeoServer, MapProxy, OSM-Tiler). Caddy Reverse Proxy maps these to external domains with HTTPS.
:::

## DNS Configuration

### Internal DNS Server (Unbound on OPNSense)
```
DNS Server: OPNSense LAN Interface
Upstream Resolver:
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
    DNSSEC: Enabled
    Query Logging: Optional (for troubleshooting)

Local DNS Records (.lan-Domain):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (planned)
```

### Public DNS (External Domain)
```
Domain: data-dna.eu
Registrar: <REGISTRAR_NAME>
Nameservers: <EXTERNAL_NS1>, <EXTERNAL_NS2>

A-Records (all point to OPNSense WAN IP):
  - www.data-dna.eu (Main Frontend)
  - dev.data-dna.eu (Develop Branch)
  - f-de1/de2/fv.data-dna.eu (Feature Branches)
  - doc.data-dna.eu (VitePress Documentation)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)

Planned:
  - auth.data-dna.eu (Ory Kratos UI)
  - api.auth.data-dna.eu (Ory Kratos API)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning DNS Propagation
Changes to A-Records can take up to 24 hours for global propagation (TTL-dependent). Reduce TTL beforehand for critical changes.
:::

## Security Features

### Network Segmentation
- **DMZ Principle**: Frontend has no direct database write access (only via WFS-T over GeoServer)
- **Service Isolation**: Each service in a separate container/VM
- **Least Privilege**: Services can only communicate with explicitly needed other services
- **Management Isolation**: Admin access completely separate from production traffic

### Firewall Hardening
```
Packet Filter: Stateful Packet Inspection (SPI)
Connection Tracking: Track established connections
Geo-Blocking: Optional (e.g., only EU traffic)
IDS/IPS: Suricata (optional, note performance impact)
Rate Limiting: Caddy level (e.g., 100 req/min per IP)
```

### TLS/SSL
```
Certificate Source: Let's Encrypt (automatic via Caddy)
TLS Versions: TLS 1.2 minimum, TLS 1.3 preferred
Cipher Suites: Modern (no outdated ciphers)
HSTS: Enabled (Strict-Transport-Security Header)
Certificate Pinning: Optional for critical domains
```

## VPN Access (WireGuard)

### Configuration (simplified)
```
# /etc/wireguard/wg0.conf (on OPNSense)

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

**Use Cases**:
- SSH access to Proxmox host
- Direct access to OPNSense Web-UI
- Database administration (PostgreSQL clients)
- Emergency Recovery

::: danger VPN Key Management
WireGuard private keys are **highly sensitive**. Never commit to Git or send via unencrypted email!
:::

## Troubleshooting

### Testing Network Connectivity

```
# From Proxmox host
ping <DB_CONTAINER_IP>  # PostgreSQL Container
ping <FRONTEND_CONTAINER_IP>  # Frontend Container

# From Frontend container (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# Check DNS resolution
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### Firewall Debugging (OPNSense)

```
# On OPNSense (via SSH over VPN)
pfctl -sr | grep <SERVICE_NAME>  # Show active rules
pfctl -ss | grep <PORT>  # Show active states/connections

# Live traffic capture
tcpdump -i <INTERFACE> port <PORT> -n

# Firewall logs (blocked packets)
grep "block" /var/log/filter.log | tail -50
```

### Caddy Routing Debugging

```
# On OPNSense
curl -I https://www.data-dna.eu  # External Request
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # Direct Backend Test

# Caddy logs
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## Planned Extensions

### Ory IAM Integration
**New Firewall Rules**:
- Frontend → Ory IAM (Session validation)
- Ory IAM → Database (Auth data)
- Caddy → Ory IAM (Reverse proxy for auth domains)

**New Caddy Domains**:
- `auth.data-dna.eu` → Ory Kratos UI
- `api.auth.data-dna.eu` → Ory Kratos API
- `oauth.data-dna.eu` → Ory Hydra OAuth2

### Monitoring Stack (Optional)
- **Prometheus**: Metrics collection from all containers
- **Grafana**: Visualization (Dashboards)
- **Alertmanager**: Email/Telegram notifications for problems
- **Node Exporter**: System metrics (CPU, RAM, Disk)

## Best Practices

✅ **Do**:
- Regularly review firewall rules (quarterly)
- Use VPN for all admin access
- Separate user accounts for services (no shared credentials)
- Maintain network segmentation (no "Flat Network")
- Consider DNS-over-HTTPS (DoH) for upstream resolvers

❌ **Don't**:
- Expose database directly to the internet
- Use default passwords for OPNSense/Proxmox
- Run all services in the same container
- Ignore firewall logs (check for anomalies regularly)
- Mix management VLAN with production network

## References

- [OPNSense Documentation](https://docs.opnsense.org/)
- [pfSense Firewall Guide](https://docs.netgate.com/pfsense/) (compatible with OPNSense)
- [WireGuard VPN](https://www.wireguard.com/quickstart/)
- [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
- [RFC1918 Private Networks](https://datatracker.ietf.org/doc/html/rfc1918)