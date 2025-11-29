---
title: Netzwerk-Architektur
description: Netzwerk-Segmentierung und Firewall-Design
---

# Netzwerk-Architektur

## Netzwerk-Topologie

```
graph TB
    subgraph Internet
        WAN[Internet<br/>Öffentliche IPs]
    end
    
    subgraph "Proxmox Host"
        subgraph "WAN-Bridge"
            VM_WAN[OPNSense WAN-Interface]
        end
        
        subgraph "LAN-Bridge (Internes Netzwerk)"
            VM_LAN[OPNSense LAN-Interface<br/>Gateway + DNS]
            DB[PostgreSQL/PostGIS]
            GeoServer[GeoServer WFS/WMS]
            MapProxy[MapProxy Tiles]
            Frontend[AstroJS Frontend]
            Tiler[OSM-Tiler VM]
            IAM[Ory IAM (geplant)]
        end
        
        subgraph "Management-VLAN"
            AdminAccess[Admin-Zugang<br/>VPN-Only]
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

## Bridge-Konfiguration

### WAN-Bridge (Internet-facing)
```
Funktion: Verbindung zur Internet-Uplink
Angeschlossene Interfaces: OPNSense WAN-Interface
Sicherheit: KEINE direkten Container/VMs (nur Firewall)
```

**Traffic-Flow**:
```
Internet → WAN-Bridge → OPNSense Firewall → NAT/Routing → LAN-Bridge → Services
```

### LAN-Bridge (Internes Service-Netzwerk)
```
Funktion: Private Netzwerk für alle p2d2-Services
Typ: RFC1918 Private Network
Gateway: OPNSense LAN-Interface
DNS: Unbound (auf OPNSense)

Angeschlossene Hosts:
  - OPNSense LAN-Interface (Gateway, DHCP, DNS)
  - PostgreSQL/PostGIS Container
  - GeoServer Container
  - MapProxy Container
  - Frontend Container
  - OSM-Tiler VM
  - Ory IAM Container (geplant)
```

**Firewall-Policy**: Default DENY (Whitelist-Ansatz)

Erlaubte Verbindungen:
- Frontend → Datenbank (PostgreSQL-Protokoll)
- Frontend → GeoServer (WFS-T Requests)
- GeoServer → Datenbank (PostGIS-Zugriff)
- MapProxy → GeoServer (WMS-Proxy)
- MapProxy → OSM-Tiler (Tile-Requests)
- Ory IAM → Datenbank (Auth-Daten)
- Frontend → Ory IAM (Session-Validierung)

### Management-VLAN
```
Funktion: Dediziertes Netzwerk für Administration
Zugriff: Nur über VPN oder physischen Console-Access
VLAN-ID: Custom (konfigurierbar)

Verwendung:
  - Proxmox Web-UI Zugang
  - SSH zu Proxmox-Host
  - Out-of-Band Management
  - Emergency-Recovery
```

::: warning Admin-Zugang
Management-VLAN ist **NIEMALS** direkt vom Internet erreichbar. Zugriff ausschließlich über VPN (WireGuard).
:::

## OPNSense Firewall-Regeln

### Firewall-Philosophie
```
Default Policy: DROP (alle Pakete verwerfen)
Ansatz: Whitelist (nur explizit erlaubte Verbindungen)
Stateful: Ja (etablierte Verbindungen tracken)
Logging: Wichtige Events loggen (kein Full Packet Capture)
```

### Regel-Kategorien (vereinfacht)

#### WAN → LAN (Eingehend)
```
1. HTTPS (443) → Caddy Reverse Proxy: ALLOW
2. HTTP (80) → Caddy (Redirect zu HTTPS): ALLOW
3. SSH (22): DENY (nur über VPN)
4. Alle anderen Ports: DENY
```

#### LAN → Internet (Ausgehend)
```
1. HTTP/HTTPS (80/443): ALLOW (für APT-Updates, Let's Encrypt)
2. DNS (53): ALLOW (Upstream-Resolver)
3. NTP (123): ALLOW (Zeit-Synchronisation)
4. SMTP (25/587): ALLOW (nur für Ory Email-Versand)
5. Andere: DENY (nur explizit benötigte Ports)
```

#### LAN → LAN (Service-zu-Service)
Siehe **Service-Matrix** unten.

### Service-Matrix (Interne Kommunikation)

| Source | Destination | Service | Zweck |
|--------|-------------|---------|-------|
| Frontend | DB | PostgreSQL | WFS-T Daten-Persistierung |
| Frontend | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | PostGIS Layer-Abfragen |
| MapProxy | GeoServer | HTTP | WMS-Proxy für Caching |
| MapProxy | OSM-Tiler | HTTP | Tile-Rendering-Requests |
| Caddy (OPNSense) | Frontend | HTTP | Reverse Proxy zu AstroJS-Ports |
| Caddy (OPNSense) | MapProxy | HTTP | Tile-Auslieferung |
| **Ory IAM (geplant)** | **DB** | **PostgreSQL** | **Auth-Datenbanken** |
| **Frontend** | **Ory IAM** | **HTTP** | **Session-Validierung** |

## Port-Übersicht

### Externe Ports (Internet → OPNSense)
| Port | Protokoll | Dienst | Öffentlich |
|------|-----------|--------|------------|
| 443 | HTTPS | Caddy (alle Domains) | ✅ Yes |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ Yes |
| 22 | SSH | OPNSense | ❌ No (VPN-only) |
| <VPN_PORT> | UDP | WireGuard | ✅ Yes (für VPN-Clients) |

### Interne Ports (LAN-only, nicht öffentlich)
| Service | Standard-Port | Protokoll | Zugriff |
|---------|---------------|-----------|---------|
| PostgreSQL | 5432 | TCP | Internes LAN |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | Internes LAN |
| MapProxy | 8080 | HTTP | Internes LAN |
| AstroJS (main) | 3000 | HTTP | Via Caddy-Proxy |
| AstroJS (develop) | 3001 | HTTP | Via Caddy-Proxy |
| AstroJS (features) | 3002-3004 | HTTP | Via Caddy-Proxy |
| Webhook-Server | 9321 | HTTP | Internes LAN |
| OSM-Tiler | 8080 | HTTP | Internes LAN |
| **Ory Kratos (geplant)** | **4433/4434** | **HTTP** | **Via Caddy-Proxy** |
| **Ory Hydra (geplant)** | **4444/4445** | **HTTP** | **Via Caddy-Proxy** |

::: tip Port-Standardisierung
Alle HTTP-Services verwenden Port 8080 intern (GeoServer, MapProxy, OSM-Tiler). Caddy Reverse Proxy mapped diese auf externe Domains mit HTTPS.
:::

## DNS-Konfiguration

### Interner DNS-Server (Unbound auf OPNSense)
```
DNS-Server: OPNSense LAN-Interface
Upstream Resolver: 
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
DNSSEC: Enabled
Query-Logging: Optional (für Troubleshooting)

Lokale DNS-Records (.lan-Domain):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (geplant)
```

### Öffentliches DNS (Externe Domain)
```
Domain: data-dna.eu
Registrar: <REGISTRAR_NAME>
Nameservers: <EXTERNAL_NS1>, <EXTERNAL_NS2>

A-Records (alle zeigen auf OPNSense WAN-IP):
  - www.data-dna.eu (Haupt-Frontend)
  - dev.data-dna.eu (Develop-Branch)
  - f-de1/de2/fv.data-dna.eu (Feature-Branches)
  - doc.data-dna.eu (VitePress-Dokumentation)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)
  
  Geplant:
  - auth.data-dna.eu (Ory Kratos UI)
  - api.auth.data-dna.eu (Ory Kratos API)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning DNS-Propagation
Änderungen an A-Records können bis zu 24 Stunden für globale Propagation benötigen (TTL-abhängig). Bei kritischen Änderungen TTL vorher reduzieren.
:::

## Sicherheitsfeatures

### Netzwerk-Segmentierung
- **DMZ-Prinzip**: Frontend hat keinen direkten Datenbank-Schreibzugriff (nur via WFS-T über GeoServer)
- **Service-Isolation**: Jeder Dienst in separatem Container/VM
- **Least Privilege**: Services können nur mit explizit benötigten anderen Services kommunizieren
- **Management-Isolation**: Admin-Zugang komplett getrennt von Produktiv-Traffic

### Firewall-Hardening
```
Paket-Filter: Stateful Packet Inspection (SPI)
Connection Tracking: Etablierte Verbindungen tracken
Geo-Blocking: Optional aktivierbar (z.B. nur EU-Traffic)
IDS/IPS: Suricata (optional, Performance-Impact beachten)
Rate-Limiting: Caddy-Level (z.B. 100 req/min per IP)
```

### TLS/SSL
```
Zertifikats-Quelle: Let's Encrypt (automatisch via Caddy)
TLS-Versionen: TLS 1.2 minimum, TLS 1.3 preferred
Cipher Suites: Modern (keine veralteten Ciphers)
HSTS: Aktiviert (Strict-Transport-Security Header)
Certificate Pinning: Optional für kritische Domains
```

## VPN-Zugang (WireGuard)

### Konfiguration (vereinfacht)
```
# /etc/wireguard/wg0.conf (auf OPNSense)
[Interface]
Address = <VPN_INTERNAL_IP>/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = <VPN_PORT>

[Peer]
# Admin-Client 1
PublicKey = <CLIENT_1_PUBLIC_KEY>
AllowedIPs = <CLIENT_1_VPN_IP>/32
PersistentKeepalive = 25

[Peer]
# Admin-Client 2
PublicKey = <CLIENT_2_PUBLIC_KEY>
AllowedIPs = <CLIENT_2_VPN_IP>/32
```

**Verwendungszwecke**:
- SSH-Zugang zu Proxmox-Host
- Direkter Zugriff auf OPNSense Web-UI
- Datenbank-Administration (PostgreSQL-Clients)
- Emergency-Recovery

::: danger VPN-Schlüssel-Management
WireGuard Private Keys sind **hochsensibel**. Niemals in Git committen oder per unverschlüsselter Email versenden!
:::

## Troubleshooting

### Netzwerk-Konnektivität testen

```
# Vom Proxmox-Host
ping <DB_CONTAINER_IP>  # PostgreSQL Container
ping <FRONTEND_CONTAINER_IP>  # Frontend Container

# Von Frontend-Container (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# DNS-Auflösung prüfen
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### Firewall-Debugging (OPNSense)

```
# Auf OPNSense (via SSH über VPN)
pfctl -sr | grep <SERVICE_NAME>  # Aktive Regeln anzeigen
pfctl -ss | grep <PORT>  # Aktive States/Verbindungen

# Live-Traffic mitschneiden
tcpdump -i <INTERFACE> port <PORT> -n

# Firewall-Logs (blocked Packets)
grep "block" /var/log/filter.log | tail -50
```

### Caddy-Routing debuggen

```
# Auf OPNSense
curl -I https://www.data-dna.eu  # Externer Request
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # Direkter Backend-Test

# Caddy-Logs
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## Geplante Erweiterungen

### Ory IAM-Integration
**Neue Firewall-Regeln**:
- Frontend → Ory IAM (Session-Validierung)
- Ory IAM → Datenbank (Auth-Daten)
- Caddy → Ory IAM (Reverse Proxy für auth-Domains)

**Neue Caddy-Domains**:
- `auth.data-dna.eu` → Ory Kratos UI
- `api.auth.data-dna.eu` → Ory Kratos API
- `oauth.data-dna.eu` → Ory Hydra OAuth2

### Monitoring-Stack (Optional)
- **Prometheus**: Metriken-Collection von allen Containern
- **Grafana**: Visualisierung (Dashboards)
- **Alertmanager**: Email/Telegram-Benachrichtigungen bei Problemen
- **Node Exporter**: System-Metriken (CPU, RAM, Disk)

## Best Practices

✅ **Do**:
- Firewall-Regeln regelmäßig reviewen (quartalsweise)
- VPN für alle Admin-Zugriffe verwenden
- Separate User-Accounts für Services (keine Shared Credentials)
- Netzwerk-Segmentierung aufrechterhalten (kein "Flat Network")
- DNS-over-HTTPS (DoH) für Upstream-Resolver erwägen

❌ **Don't**:
- Direkte Datenbank-Exposition ins Internet
- Standard-Passwörter für OPNSense/Proxmox verwenden
- Alle Services im selben Container laufen lassen
- Firewall-Logs ignorieren (regelmäßig auf Anomalien prüfen)
- Management-VLAN mit Produktiv-Netzwerk mischen

## Referenzen

- [OPNSense Dokumentation](https://docs.opnsense.org/)
- [pfSense Firewall Guide](https://docs.netgate.com/pfsense/) (kompatibel mit OPNSense)
- [WireGuard VPN](https://www.wireguard.com/quickstart/)
- [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
- [RFC1918 Private Networks](https://datatracker.ietf.org/doc/html/rfc1918)