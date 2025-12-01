---
title: Architecture Réseau
description: Segmentation réseau et conception du pare-feu
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Traduction: IA)"
  reviewDate: null
---

# Architecture Réseau

## Topologie du Réseau

```
graph TB
    subgraph Internet
        WAN[Internet<br/>IPs Publiques]
    end
    
    subgraph "Hôte Proxmox"
        subgraph "Bridge WAN"
            VM_WAN[Interface WAN OPNSense]
        end
        
        subgraph "Bridge LAN (Réseau Interne)"
            VM_LAN[Interface LAN OPNSense<br/>Passerelle + DNS]
            DB[PostgreSQL/PostGIS]
            GeoServer[GeoServer WFS/WMS]
            MapProxy[MapProxy Tiles]
            Frontend[AstroJS Frontend]
            Tiler[VM OSM-Tiler]
            IAM[Ory IAM (prévu)]
        end
        
        subgraph "VLAN de Gestion"
            AdminAccess[Accès Admin<br/>VPN-Only]
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
    
    AdminAccess -.->|Tunnel VPN| VM_LAN
    
    style IAM stroke-dasharray: 5 5
```

## Configuration des Bridges

### Bridge WAN (face à Internet)

```
Fonction: Connexion à la liaison montante Internet
Interfaces connectées: Interface WAN OPNSense
Sécurité: AUCUN conteneur/VM direct (seulement le pare-feu)
```

**Flux de Trafic**:

```
Internet → Bridge WAN → Firewall OPNSense → NAT/Routage → Bridge LAN → Services
```

### Bridge LAN (Réseau de Service Interne)

```
Fonction: Réseau privé pour tous les services p2d2
Type: Réseau Privé RFC1918
Passerelle: Interface LAN OPNSense
DNS: Unbound (sur OPNSense)

Hôtes connectés:
  - Interface LAN OPNSense (Passerelle, DHCP, DNS)
  - Conteneur PostgreSQL/PostGIS
  - Conteneur GeoServer
  - Conteneur MapProxy
  - Conteneur Frontend
  - VM OSM-Tiler
  - Conteneur Ory IAM (prévu)
```

**Politique de Pare-feu**: Default DENY (Approche liste blanche)

Connexions autorisées:

  - Frontend → Base de données (Protocole PostgreSQL)
  - Frontend → GeoServer (Requêtes WFS-T)
  - GeoServer → Base de données (Accès PostGIS)
  - MapProxy → GeoServer (Proxy WMS)
  - MapProxy → OSM-Tiler (Requêtes de tuiles)
  - Ory IAM → Base de données (Données d'authentification)
  - Frontend → Ory IAM (Validation de session)

### VLAN de Gestion

```
Fonction: Réseau dédié pour l'administration
Accès: Uniquement via VPN ou accès console physique
VLAN-ID: Personnalisé (configurable)

Utilisation:
  - Accès Web-UI Proxmox
  - SSH à l'hôte Proxmox
  - Gestion hors bande
  - Récupération d'urgence
```

::: warning Accès Admin
Le VLAN de gestion n'est ** JAMAIS** directement accessible depuis Internet. Accès exclusivement via VPN (WireGuard).
:::

## Règles de Pare-feu OPNSense

### Philosophie du Pare-feu

```
Politique par Défaut: DROP (rejeter tous les paquets)
Approche: Liste blanche (seules les connexions explicitement autorisées)
Stateful: Oui (suivi des connexions établies)
Logging: Logger les événements importants (pas de capture complète de paquets)
```

### Catégories de Règles (simplifiées)

#### WAN → LAN (Entrant)

```
1. HTTPS (443) → Caddy Reverse Proxy: ALLOW
2. HTTP (80) → Caddy (Redirection vers HTTPS): ALLOW
3. SSH (22): DENY (VPN-only)
4. Tous les autres ports: DENY
```

#### LAN → Internet (Sortant)

```
1. HTTP/HTTPS (80/443): ALLOW (pour mises à jour APT, Let's Encrypt)
2. DNS (53): ALLOW (Résolveurs en amont)
3. NTP (123): ALLOW (Synchronisation de l'heure)
4. SMTP (25/587): ALLOW (uniquement pour envoi d'email Ory)
5. Autres: DENY (seulement les ports explicitement requis)
```

#### LAN → LAN (Service-à-Service)

Voir **Matrice de Services** ci-dessous.

### Matrice de Services (Communication Interne)

| Source | Destination | Service | Objectif |
|---|---|---|---|
| Frontend | DB | PostgreSQL | Persistance données WFS-T |
| Frontend | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | Requêtes de couche PostGIS |
| MapProxy | GeoServer | HTTP | Proxy WMS pour caching |
| MapProxy | OSM-Tiler | HTTP | Requêtes de rendu de tuiles |
| Caddy (OPNSense) | Frontend | HTTP | Reverse Proxy vers ports AstroJS |
| Caddy (OPNSense) | MapProxy | HTTP | Livraison de tuiles |
| **Ory IAM (prévu)** | **DB** | **PostgreSQL** | **Bases de données d'authentification** |
| **Frontend** | **Ory IAM** | **HTTP** | **Validation de session** |

## Aperçu des Ports

### Ports Externes (Internet → OPNSense)

| Port | Protocole | Service | Public |
|---|---|---|---|
| 443 | HTTPS | Caddy (tous domaines) | ✅ Oui |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ Oui |
| 22 | SSH | OPNSense | ❌ Non (VPN-only) |
| \<VPN\_PORT\> | UDP | WireGuard | ✅ Oui (pour clients VPN) |

### Ports Internes (LAN-only, non publics)

| Service | Port Standard | Protocole | Accès |
|---|---|---|---|
| PostgreSQL | 5432 | TCP | LAN Interne |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | LAN Interne |
| MapProxy | 8080 | HTTP | LAN Interne |
| AstroJS (main) | 3000 | HTTP | Via Caddy-Proxy |
| AstroJS (develop) | 3001 | HTTP | Via Caddy-Proxy |
| AstroJS (features) | 3002-3004 | HTTP | Via Caddy-Proxy |
| Webhook-Server | 9321 | HTTP | LAN Interne |
| OSM-Tiler | 8080 | HTTP | LAN Interne |
| **Ory Kratos (prévu)** | **4433/4434** | **HTTP** | **Via Caddy-Proxy** |
| **Ory Hydra (prévu)** | **4444/4445** | **HTTP** | **Via Caddy-Proxy** |

::: tip Standardisation des Ports
Tous les services HTTP utilisent le port 8080 en interne (GeoServer, MapProxy, OSM-Tiler). Caddy Reverse Proxy mappe ceux-ci vers des domaines externes avec HTTPS.
:::

## Configuration DNS

### Serveur DNS Interne (Unbound sur OPNSense)

```
Serveur DNS: Interface LAN OPNSense
Résolveurs Amont: 
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
DNSSEC: Enabled
Query-Logging: Optionnel (pour dépannage)

Enregistrements DNS Locaux (Domaine .lan):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (prévu)
```

### DNS Public (Domaine Externe)

```
Domaine: data-dna.eu
Registrar: <NOM_REGISTRAR>
Serveurs de Noms: <EXTERNAL_NS1>, <EXTERNAL_NS2>

Enregistrements A (tous pointant vers IP WAN OPNSense):
  - www.data-dna.eu (Frontend principal)
  - dev.data-dna.eu (Branche Develop)
  - f-de1/de2/fv.data-dna.eu (Branches de fonctionnalité)
  - doc.data-dna.eu (Documentation VitePress)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)
  
  Prévu:
  - auth.data-dna.eu (UI Ory Kratos)
  - api.auth.data-dna.eu (API Ory Kratos)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning Propagation DNS
Les modifications des enregistrements A peuvent prendre jusqu'à 24 heures pour la propagation mondiale (dépendant du TTL). Pour les modifications critiques, réduire le TTL au préalable.
:::

## Fonctionnalités de Sécurité

### Segmentation Réseau

  - **Principe DMZ**: Frontend n'a pas d'accès direct en écriture à la base de données (seulement via WFS-T sur GeoServer)
  - **Isolation de Service**: Chaque service dans conteneur/VM séparé
  - **Moindre Privilège**: Les services ne peuvent communiquer qu'avec les services explicitement requis
  - **Isolation de Gestion**: Accès admin complètement séparé du trafic de production

### Durcissement du Pare-feu

```
Filtre de Paquets: Stateful Packet Inspection (SPI)
Suivi de Connexion: Suivi des connexions établies
Géo-blocage: Activatable en option (par ex. trafic UE uniquement)
IDS/IPS: Suricata (optionnel, attention à l'impact sur les performances)
Limitation de Débit: Niveau Caddy (par ex. 100 req/min par IP)
```

### TLS/SSL

```
Source de Certificat: Let's Encrypt (automatique via Caddy)
Versions TLS: TLS 1.2 minimum, TLS 1.3 préféré
Suites de Chiffrement: Modernes (pas de chiffres obsolètes)
HSTS: Activé (En-tête Strict-Transport-Security)
Certificate Pinning: Optionnel pour domaines critiques
```

## Accès VPN (WireGuard)

### Configuration (simplifiée)

```
# /etc/wireguard/wg0.conf (sur OPNSense)
[Interface]
Address = <VPN_INTERNAL_IP>/24
PrivateKey = <SERVER_PRIVATE_KEY>
ListenPort = <VPN_PORT>

[Peer]
# Client Admin 1
PublicKey = <CLIENT_1_PUBLIC_KEY>
AllowedIPs = <CLIENT_1_VPN_IP>/32
PersistentKeepalive = 25

[Peer]
# Client Admin 2
PublicKey = <CLIENT_2_PUBLIC_KEY>
AllowedIPs = <CLIENT_2_VPN_IP>/32
PersistentKeepalive = 25
```

**Cas d'utilisation**:

  - Accès SSH à l'hôte Proxmox
  - Accès direct à l'interface Web OPNSense
  - Administration de base de données (Clients PostgreSQL)
  - Récupération d'urgence

::: danger Gestion des Clés VPN
Les clés privées WireGuard sont **hautement sensibles**. Ne jamais commiter dans Git ou envoyer par email non chiffré !
:::

## Dépannage

### Tester la Connectivité Réseau

```
# Depuis l'hôte Proxmox
ping <DB_CONTAINER_IP>  # Conteneur PostgreSQL
ping <FRONTEND_CONTAINER_IP>  # Conteneur Frontend

# Depuis conteneur Frontend (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# Vérifier résolution DNS
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### Débogage Pare-feu (OPNSense)

```
# Sur OPNSense (via SSH sur VPN)
pfctl -sr | grep <SERVICE_NAME>  # Afficher règles actives
pfctl -ss | grep <PORT>  # États/connexions actifs

# Capturer trafic en direct
tcpdump -i <INTERFACE> port <PORT> -n

# Logs Pare-feu (paquets bloqués)
grep "block" /var/log/filter.log | tail -50
```

### Débogage Routage Caddy

```
# Sur OPNSense
curl -I https://www.data-dna.eu  # Requête externe
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # Test backend direct

# Logs Caddy
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## Extensions Prévues

### Intégration Ory IAM

**Nouvelles Règles de Pare-feu**:

  - Frontend → Ory IAM (Validation de session)
  - Ory IAM → Base de données (Données d'authentification)
  - Caddy → Ory IAM (Reverse Proxy pour domaines auth)

**Nouveaux Domaines Caddy**:

  - `auth.data-dna.eu` → UI Ory Kratos
  - `api.auth.data-dna.eu` → API Ory Kratos
  - `oauth.data-dna.eu` → Ory Hydra OAuth2

### Pile de Monitoring (Optionnel)

  - **Prometheus**: Collecte de métriques de tous les conteneurs
  - **Grafana**: Visualisation (Tableaux de bord)
  - **Alertmanager**: Notifications Email/Telegram en cas de problèmes
  - **Node Exporter**: Métriques système (CPU, RAM, Disque)

## Bonnes Pratiques

✅ **À faire**:

  - Revoir régulièrement les règles de pare-feu (trimestriel)
  - Utiliser VPN pour tous les accès admin
  - Comptes utilisateurs séparés pour services (pas de credentials partagés)
  - Maintenir segmentation réseau (pas de "Réseau Plat")
  - Envisager DNS-over-HTTPS (DoH) pour résolveurs amont

❌ **À ne pas faire**:

  - Exposition directe de base de données à Internet
  - Utiliser mots de passe par défaut pour OPNSense/Proxmox
  - Exécuter tous les services dans le même conteneur
  - Ignorer les logs de pare-feu (vérifier régulièrement anomalies)
  - Mélanger VLAN de gestion avec réseau de production

## Références

  - [Documentation OPNSense](https://docs.opnsense.org/)
  - [Guide Firewall pfSense](https://docs.netgate.com/pfsense/) (compatible avec OPNSense)
  - [VPN WireGuard](https://www.wireguard.com/quickstart/)
  - [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
  - [Réseaux Privés RFC1918](https://datatracker.ietf.org/doc/html/rfc1918)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.