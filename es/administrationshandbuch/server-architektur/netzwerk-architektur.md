---
title: Arquitectura de Red
description: Segmentación de red y diseño de firewall
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Traducción: IA)"
  reviewDate: null
---

# Arquitectura de Red

## Topología de Red

```
graph TB
    subgraph Internet
        WAN[Internet<br/>IPs Públicas]
    end
    
    subgraph "Host Proxmox"
        subgraph "Puente WAN"
            VM_WAN[Interfaz WAN OPNSense]
        end
        
        subgraph "Puente LAN (Red Interna)"
            VM_LAN[Interfaz LAN OPNSense<br/>Gateway + DNS]
            DB[PostgreSQL/PostGIS]
            GeoServer[GeoServer WFS/WMS]
            MapProxy[MapProxy Teselas]
            Frontend[AstroJS Frontend]
            Tiler[VM OSM-Tiler]
            IAM[Ory IAM (planeado)]
        end
        
        subgraph "VLAN de Gestión"
            AdminAccess[Acceso Admin<br/>VPN-Only]
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
    
    AdminAccess -.->|Túnel VPN| VM_LAN
    
    style IAM stroke-dasharray: 5 5
```

## Configuración de Puentes

### Puente WAN (conectado a Internet)

```
Función: Conexión a enlace ascendente de Internet
Interfaces conectadas: Interfaz WAN OPNSense
Seguridad: NINGÚN contenedor/VM directo (solo firewall)
```

**Flujo de Tráfico**:

```
Internet → Puente WAN → Firewall OPNSense → NAT/Ruteo → Puente LAN → Servicios
```

### Puente LAN (Red de Servicios Interna)

```
Función: Red privada para todos los servicios p2d2
Tipo: Red Privada RFC1918
Gateway: Interfaz LAN OPNSense
DNS: Unbound (en OPNSense)

Hosts conectados:
  - Interfaz LAN OPNSense (Gateway, DHCP, DNS)
  - Contenedor PostgreSQL/PostGIS
  - Contenedor GeoServer
  - Contenedor MapProxy
  - Contenedor Frontend
  - VM OSM-Tiler
  - Contenedor Ory IAM (planeado)
```

**Política de Firewall**: Default DENY (Enfoque de lista blanca)

Conexiones permitidas:

  - Frontend → Base de Datos (Protocolo PostgreSQL)
  - Frontend → GeoServer (Solicitudes WFS-T)
  - GeoServer → Base de Datos (Acceso PostGIS)
  - MapProxy → GeoServer (Proxy WMS)
  - MapProxy → OSM-Tiler (Solicitudes de teselas)
  - Ory IAM → Base de Datos (Datos de autenticación)
  - Frontend → Ory IAM (Validación de sesión)

### VLAN de Gestión

```
Función: Red dedicada para administración
Acceso: Solo vía VPN o acceso físico a consola
VLAN-ID: Personalizado (configurable)

Uso:
  - Acceso Web-UI Proxmox
  - SSH a host Proxmox
  - Gestión fuera de banda
  - Recuperación de emergencia
```

::: warning Acceso Admin
¡La VLAN de Gestión **NUNCA** es accesible directamente desde Internet! Acceso exclusivamente vía VPN (WireGuard).
:::

## Reglas de Firewall OPNSense

### Filosofía de Firewall

```
Política por Defecto: DROP (descartar todos los paq.)
Enfoque: Lista blanca (solo conexiones explícitamente permitidas)
Stateful: Sí (rastrear conexiones establecidas)
Logging: Registrar eventos importantes (sin captura completa de paq.)
```

### Categorías de Reglas (simplificadas)

#### WAN → LAN (Entrante)

```
1. HTTPS (443) → Caddy Reverse Proxy: PERMITIR
2. HTTP (80) → Caddy (Redirección a HTTPS): PERMITIR
3. SSH (22): DENEGAR (solo VPN)
4. Todos los demás puertos: DENEGAR
```

#### LAN → Internet (Saliente)

```
1. HTTP/HTTPS (80/443): PERMITIR (para actualizaciones APT, Let's Encrypt)
2. DNS (53): PERMITIR (Resolvers upstream)
3. NTP (123): PERMITIR (Sincronización de tiempo)
4. SMTP (25/587): PERMITIR (solo para envío email Ory)
5. Otros: DENEGAR (solo puertos explícitamente req.)
```

#### LAN → LAN (Servicio-a-Servicio)

Ver **Matriz de Servicios** abajo.

### Matriz de Servicios (Comunicación Interna)

| Fuente | Destino | Servicio | Propósito |
|---|---|---|---|
| Frontend | DB | PostgreSQL | Persistencia datos WFS-T |
| Frontend | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | Consultas capa PostGIS |
| MapProxy | GeoServer | HTTP | Proxy WMS para caché |
| MapProxy | OSM-Tiler | HTTP | Solicitudes renderizado teselas |
| Caddy (OPNSense) | Frontend | HTTP | Reverse Proxy a puertos AstroJS |
| Caddy (OPNSense) | MapProxy | HTTP | Entrega de teselas |
| **Ory IAM (planeado)** | **DB** | **PostgreSQL** | **Bases de datos Auth** |
| **Frontend** | **Ory IAM** | **HTTP** | **Validación de sesión** |

## Resumen de Puertos

### Puertos Externos (Internet → OPNSense)

| Puerto | Protocolo | Servicio | Público |
|---|---|---|---|
| 443 | HTTPS | Caddy (todos dominios) | ✅ Sí |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ Sí |
| 22 | SSH | OPNSense | ❌ No (solo VPN) |
| \<VPN\_PORT\> | UDP | WireGuard | ✅ Sí (para clientes VPN) |

### Puertos Internos (solo LAN, no públicos)

| Servicio | Puerto Estándar | Protocolo | Acceso |
|---|---|---|---|
| PostgreSQL | 5432 | TCP | LAN Interna |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | LAN Interna |
| MapProxy | 8080 | HTTP | LAN Interna |
| AstroJS (main) | 3000 | HTTP | Vía Caddy-Proxy |
| AstroJS (develop) | 3001 | HTTP | Vía Caddy-Proxy |
| AstroJS (features) | 3002-3004 | HTTP | Vía Caddy-Proxy |
| Webhook-Server | 9321 | HTTP | LAN Interna |
| OSM-Tiler | 8080 | HTTP | LAN Interna |
| **Ory Kratos (planeado)** | **4433/4434** | **HTTP** | **Vía Caddy-Proxy** |
| **Ory Hydra (planeado)** | **4444/4445** | **HTTP** | **Vía Caddy-Proxy** |

::: tip Estandarización de Puertos
Todos los servicios HTTP usan puerto 8080 internamente (GeoServer, MapProxy, OSM-Tiler). Caddy Reverse Proxy mapea estos a dominios externos con HTTPS.
:::

## Configuración DNS

### Servidor DNS Interno (Unbound en OPNSense)

```
Servidor DNS: Interfaz LAN OPNSense
Resolvers Upstream: 
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
DNSSEC: Habilitado
Query-Logging: Opcional (para troubleshooting)

Registros DNS Locales (Dominio .lan):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (planeado)
```

### DNS Público (Dominio Externo)

```
Dominio: data-dna.eu
Registrador: <NOMBRE_REGISTRADOR>
Servidores de Nombres: <EXTERNAL_NS1>, <EXTERNAL_NS2>

Registros A (todos apuntando a IP WAN OPNSense):
  - www.data-dna.eu (Frontend principal)
  - dev.data-dna.eu (Rama Develop)
  - f-de1/de2/fv.data-dna.eu (Ramas de funcionalidad)
  - doc.data-dna.eu (Documentación VitePress)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)
  
  Planeado:
  - auth.data-dna.eu (UI Ory Kratos)
  - api.auth.data-dna.eu (API Ory Kratos)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning Propagación DNS
¡Cambios en registros A pueden tardar hasta 24 horas en propagarse globalmente (depende de TTL)! Para cambios críticos, reducir TTL previamente.
:::

## Características de Seguridad

### Segmentación de Red

  - **Principio DMZ**: Frontend no tiene acceso directo de escritura a BD (solo vía WFS-T sobre GeoServer)
  - **Aislamiento de Servicio**: Cada servicio en contenedor/VM separado
  - **Mínimo Privilegio**: Servicios solo pueden comunicarse con otros servicios explícitamente requeridos
  - **Aislamiento de Gestión**: Acceso admin completamente separado de tráfico producción

### Endurecimiento de Firewall

```
Filtro de Paquetes: Stateful Packet Inspection (SPI)
Seguimiento Conexión: Rastrear conexiones establecidas
Geo-Bloqueo: Habilitable opcionalmente (ej. solo tráfico UE)
IDS/IPS: Suricata (opcional, considerar impacto rendimiento)
Limitación de Tasa: Nivel Caddy (ej. 100 req/min por IP)
```

### TLS/SSL

```
Fuente Certificado: Let's Encrypt (automático vía Caddy)
Versiones TLS: TLS 1.2 mínimo, TLS 1.3 preferido
Suites Cifrado: Modernas (sin cifrados obsoletos)
HSTS: Habilitado (Cabecera Strict-Transport-Security)
Certificate Pinning: Opcional para dominios críticos
```

## Acceso VPN (WireGuard)

### Configuración (simplificada)

```
# /etc/wireguard/wg0.conf (en OPNSense)
[Interface]
Address = <VPN_INTERNAL_IP>/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = <VPN_PORT>

[Peer]
# Cliente Admin 1
PublicKey = <CLIENT_1_PUBLIC_KEY>
AllowedIPs = <CLIENT_1_VPN_IP>/32
PersistentKeepalive = 25

[Peer]
# Cliente Admin 2
PublicKey = <CLIENT_2_PUBLIC_KEY>
AllowedIPs = <CLIENT_2_VPN_IP>/32
PersistentKeepalive = 25
```

**Casos de uso**:

  - Acceso SSH a host Proxmox
  - Acceso directo a Web-UI OPNSense
  - Administración Base de Datos (Clientes PostgreSQL)
  - Recuperación de emergencia

::: danger Gestión Claves VPN
¡Las claves privadas WireGuard son **altamente sensibles**! ¡Nunca commitear a Git o enviar por email no cifrado!
:::

## Solución de Problemas

### Probar Conectividad Red

```
# Desde host Proxmox
ping <DB_CONTAINER_IP>  # Contenedor PostgreSQL
ping <FRONTEND_CONTAINER_IP>  # Contenedor Frontend

# Desde contenedor Frontend (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# Comprobar resolución DNS
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### Debugging Firewall (OPNSense)

```
# En OPNSense (vía SSH sobre VPN)
pfctl -sr | grep <SERVICE_NAME>  # Mostrar reglas activas
pfctl -ss | grep <PORT>  # Estados/conexiones activos

# Capturar tráfico en vivo
tcpdump -i <INTERFACE> port <PORT> -n

# Logs Firewall (paquetes bloqueados)
grep "block" /var/log/filter.log | tail -50
```

### Debugging Ruteo Caddy

```
# En OPNSense
curl -I https://www.data-dna.eu  # Solicitud externa
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # Prueba backend directa

# Logs Caddy
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## Extensiones Planeadas

### Integración Ory IAM

**Nuevas Reglas Firewall**:

  - Frontend → Ory IAM (Validación sesión)
  - Ory IAM → Base de Datos (Datos Auth)
  - Caddy → Ory IAM (Reverse Proxy para dominios auth)

**Nuevos Dominios Caddy**:

  - `auth.data-dna.eu` → UI Ory Kratos
  - `api.auth.data-dna.eu` → API Ory Kratos
  - `oauth.data-dna.eu` → Ory Hydra OAuth2

### Pila Monitorización (Opcional)

  - **Prometheus**: Colección métricas de todos contenedores
  - **Grafana**: Visualización (Dashboards)
  - **Alertmanager**: Notificaciones Email/Telegram en problemas
  - **Node Exporter**: Métricas sistema (CPU, RAM, Disco)

## Buenas Prácticas

✅ **Hacer**:

  - Revisar reglas firewall regularmente (trimestral)
  - Usar VPN para todo acceso admin
  - Cuentas usuario separadas para servicios (sin credenciales compartidas)
  - Mantener segmentación red (no "Red Plana")
  - Considerar DNS-over-HTTPS (DoH) para resolvers upstream

❌ **No Hacer**:

  - Exposición directa base de datos a Internet
  - Usar contraseñas por defecto para OPNSense/Proxmox
  - Ejecutar todos servicios en mismo contenedor
  - Ignorar logs firewall (revisar anomalías regularmente)
  - Mezclar VLAN gestión con red producción

## Referencias

  - [Documentación OPNSense](https://docs.opnsense.org/)
  - [Guía Firewall pfSense](https://docs.netgate.com/pfsense/) (compatible con OPNSense)
  - [VPN WireGuard](https://www.wireguard.com/quickstart/)
  - [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
  - [Redes Privadas RFC1918](https://datatracker.ietf.org/doc/html/rfc1918)

> **Nota:** Este texto fue traducido automáticamente con IA y aún no ha sido revisado por un humano.