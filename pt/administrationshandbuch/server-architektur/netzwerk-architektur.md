---
title: Arquitetura de Rede
description: Segmentação de rede e design de firewall
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Tradução: IA)"
  reviewDate: null
---

# Arquitetura de Rede

## Topologia da Rede

```
graph TB
    subgraph Internet
        WAN[Internet<br/>IPs Públicos]
    end
    
    subgraph "Host Proxmox"
        subgraph "Ponte WAN"
            VM_WAN[Interface WAN OPNSense]
        end
        
        subgraph "Ponte LAN (Rede Interna)"
            VM_LAN[Interface LAN OPNSense<br/>Gateway + DNS]
            DB[PostgreSQL/PostGIS]
            GeoServer[GeoServer WFS/WMS]
            MapProxy[MapProxy Tiles]
            Frontend[AstroJS Frontend]
            Tiler[VM OSM-Tiler]
            IAM[Ory IAM (planejado)]
        end
        
        subgraph "VLAN de Gerenciamento"
            AdminAccess[Acesso Admin<br/>VPN-Only]
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

## Configuração das Pontes

### Ponte WAN (voltada para Internet)

```
Função: Conexão com uplink da Internet
Interfaces conectadas: Interface WAN OPNSense
Segurança: NENHUM contêiner/VM direto (apenas firewall)
```

**Fluxo de Tráfego**:

```
Internet → Ponte WAN → Firewall OPNSense → NAT/Roteamento → Ponte LAN → Serviços
```

### Ponte LAN (Rede de Serviço Interna)

```
Função: Rede privada para todos os serviços p2d2
Tipo: Rede Privada RFC1918
Gateway: Interface LAN OPNSense
DNS: Unbound (no OPNSense)

Hosts conectados:
  - Interface LAN OPNSense (Gateway, DHCP, DNS)
  - Contêiner PostgreSQL/PostGIS
  - Contêiner GeoServer
  - Contêiner MapProxy
  - Contêiner Frontend
  - VM OSM-Tiler
  - Contêiner Ory IAM (planejado)
```

**Política de Firewall**: Default DENY (Abordagem de lista branca)

Conexões permitidas:

  - Frontend → Banco de Dados (Protocolo PostgreSQL)
  - Frontend → GeoServer (Requisições WFS-T)
  - GeoServer → Banco de Dados (Acesso PostGIS)
  - MapProxy → GeoServer (Proxy WMS)
  - MapProxy → OSM-Tiler (Requisições de tiles)
  - Ory IAM → Banco de Dados (Dados de autenticação)
  - Frontend → Ory IAM (Validação de sessão)

### VLAN de Gerenciamento

```
Função: Rede dedicada para administração
Acesso: Somente via VPN ou acesso físico ao console
VLAN-ID: Personalizado (configurável)

Uso:
  - Acesso Web-UI Proxmox
  - SSH para host Proxmox
  - Gerenciamento fora de banda
  - Recuperação de emergência
```

::: warning Acesso Admin
A VLAN de Gerenciamento **NUNCA** é acessível diretamente da Internet! Acesso exclusivamente via VPN (WireGuard).
:::

## Regras de Firewall OPNSense

### Filosofia do Firewall

```
Política Padrão: DROP (descartar todos os pacotes)
Abordagem: Lista branca (apenas conexões explicitamente permitidas)
Stateful: Sim (rastrear conexões estabelecidas)
Logging: Registrar eventos importantes (sem captura total de pacotes)
```

### Categorias de Regras (simplificadas)

#### WAN → LAN (Entrada)

```
1. HTTPS (443) → Caddy Reverse Proxy: PERMITIR
2. HTTP (80) → Caddy (Redirecionar para HTTPS): PERMITIR
3. SSH (22): NEGAR (somente VPN)
4. Todas as outras portas: NEGAR
```

#### LAN → Internet (Saída)

```
1. HTTP/HTTPS (80/443): PERMITIR (para atualizações APT, Let's Encrypt)
2. DNS (53): PERMITIR (Resolvers upstream)
3. NTP (123): PERMITIR (Sincronização de tempo)
4. SMTP (25/587): PERMITIR (apenas para envio de email Ory)
5. Outros: NEGAR (apenas portas explicitamente necessárias)
```

#### LAN → LAN (Serviço-para-Serviço)

Veja **Matriz de Serviços** abaixo.

### Matriz de Serviços (Comunicação Interna)

| Fonte | Destino | Serviço | Propósito |
|---|---|---|---|
| Frontend | DB | PostgreSQL | Persistência dados WFS-T |
| Frontend | GeoServer | HTTP | WFS GetFeature/Transaction |
| GeoServer | DB | PostgreSQL | Consultas camada PostGIS |
| MapProxy | GeoServer | HTTP | Proxy WMS para cache |
| MapProxy | OSM-Tiler | HTTP | Requisições renderização tiles |
| Caddy (OPNSense) | Frontend | HTTP | Reverse Proxy para portas AstroJS |
| Caddy (OPNSense) | MapProxy | HTTP | Entrega de tiles |
| **Ory IAM (planejado)** | **DB** | **PostgreSQL** | **Bancos de dados Auth** |
| **Frontend** | **Ory IAM** | **HTTP** | **Validação de sessão** |

## Visão Geral das Portas

### Portas Externas (Internet → OPNSense)

| Porta | Protocolo | Serviço | Público |
|---|---|---|---|
| 443 | HTTPS | Caddy (todos domínios) | ✅ Sim |
| 80 | HTTP | Caddy (Redirect → 443) | ✅ Sim |
| 22 | SSH | OPNSense | ❌ Não (somente VPN) |
| \<VPN\_PORT\> | UDP | WireGuard | ✅ Sim (para clientes VPN) |

### Portas Internas (somente LAN, não públicas)

| Serviço | Porta Padrão | Protocolo | Acesso |
|---|---|---|---|
| PostgreSQL | 5432 | TCP | LAN Interna |
| GeoServer/Tomcat | 8080/8443 | HTTP/HTTPS | LAN Interna |
| MapProxy | 8080 | HTTP | LAN Interna |
| AstroJS (main) | 3000 | HTTP | Via Caddy-Proxy |
| AstroJS (develop) | 3001 | HTTP | Via Caddy-Proxy |
| AstroJS (features) | 3002-3004 | HTTP | Via Caddy-Proxy |
| Webhook-Server | 9321 | HTTP | LAN Interna |
| OSM-Tiler | 8080 | HTTP | LAN Interna |
| **Ory Kratos (planejado)** | **4433/4434** | **HTTP** | **Via Caddy-Proxy** |
| **Ory Hydra (planejado)** | **4444/4445** | **HTTP** | **Via Caddy-Proxy** |

::: tip Padronização de Portas
Todos os serviços HTTP usam porta 8080 internamente (GeoServer, MapProxy, OSM-Tiler). Caddy Reverse Proxy mapeia estes para domínios externos com HTTPS.
:::

## Configuração DNS

### Servidor DNS Interno (Unbound no OPNSense)

```
Servidor DNS: Interface LAN OPNSense
Resolvers Upstream: 
  - Cloudflare (1.1.1.1)
  - Quad9 (9.9.9.9)
DNSSEC: Habilitado
Query-Logging: Opcional (para troubleshooting)

Registros DNS Locais (Domínio .lan):
  - postgresql.lan → <DB_CONTAINER_IP>
  - geoserver.lan → <GEOSERVER_CONTAINER_IP>
  - mapproxy.lan → <MAPPROXY_CONTAINER_IP>
  - frontend.lan → <FRONTEND_CONTAINER_IP>
  - osm-tiler.lan → <TILER_VM_IP>
  - ory-iam.lan → <IAM_CONTAINER_IP> (planejado)
```

### DNS Público (Domínio Externo)

```
Domínio: data-dna.eu
Registrar: <NOME_REGISTRAR>
Nameservers: <EXTERNAL_NS1>, <EXTERNAL_NS2>

Registros A (todos apontando para IP WAN OPNSense):
  - www.data-dna.eu (Frontend principal)
  - dev.data-dna.eu (Branch Develop)
  - f-de1/de2/fv.data-dna.eu (Branches de funcionalidade)
  - doc.data-dna.eu (Documentação VitePress)
  - ows.data-dna.eu (GeoServer WFS/WMS)
  - wfs.data-dna.eu (GeoServer WFS-T)
  
  Planejado:
  - auth.data-dna.eu (UI Ory Kratos)
  - api.auth.data-dna.eu (API Ory Kratos)
  - oauth.data-dna.eu (Ory Hydra OAuth2)
```

::: warning Propagação DNS
Alterações em registros A podem levar até 24 horas para propagação global (dependente do TTL)! Para alterações críticas, reduza o TTL antecipadamente.
:::

## Recursos de Segurança

### Segmentação de Rede

  - **Princípio DMZ**: Frontend não tem acesso direto de escrita ao BD (somente via WFS-T sobre GeoServer)
  - **Isolamento de Serviço**: Cada serviço em contêiner/VM separado
  - **Menor Privilégio**: Serviços só podem se comunicar com outros serviços explicitamente necessários
  - **Isolamento de Gerenciamento**: Acesso admin completamente separado do tráfego produção

### Endurecimento do Firewall

```
Filtro de Pacotes: Stateful Packet Inspection (SPI)
Rastreamento Conexão: Rastrear conexões estabelecidas
Geo-Bloqueio: Habilitável opcionalmente (ex. apenas tráfego UE)
IDS/IPS: Suricata (opcional, considerar impacto performance)
Limitação de Taxa: Nível Caddy (ex. 100 req/min por IP)
```

### TLS/SSL

```
Fonte Certificado: Let's Encrypt (automático via Caddy)
Versões TLS: TLS 1.2 mínimo, TLS 1.3 preferido
Suites Cifragem: Modernas (sem cifras obsoletas)
HSTS: Habilitado (Cabeçalho Strict-Transport-Security)
Certificate Pinning: Opcional para domínios críticos
```

## Acesso VPN (WireGuard)

### Configuração (simplificada)

```
# /etc/wireguard/wg0.conf (no OPNSense)
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

  - Acesso SSH ao host Proxmox
  - Acesso direto à Web-UI OPNSense
  - Administração Banco de Dados (Clientes PostgreSQL)
  - Recuperação de emergência

::: danger Gerenciamento Chaves VPN
Chaves privadas WireGuard são **altamente sensíveis**! Nunca commitar no Git ou enviar por email não criptografado!
:::

## Solução de Problemas

### Testar Conectividade Rede

```
# Do host Proxmox
ping <DB_CONTAINER_IP>  # Contêiner PostgreSQL
ping <FRONTEND_CONTAINER_IP>  # Contêiner Frontend

# Do contêiner Frontend (LXC)
curl http://<DB_CONTAINER_IP>:5432  # PostgreSQL (connection refused = OK)
curl http://<GEOSERVER_CONTAINER_IP>:8080/geoserver  # GeoServer

# Verificar resolução DNS
nslookup www.data-dna.eu <OPNSENSE_LAN_IP>
dig @<OPNSENSE_LAN_IP> postgresql.lan
```

### Debugging Firewall (OPNSense)

```
# No OPNSense (via SSH sobre VPN)
pfctl -sr | grep <SERVICE_NAME>  # Mostrar regras ativas
pfctl -ss | grep <PORT>  # Estados/conexões ativos

# Capturar tráfego ao vivo
tcpdump -i <INTERFACE> port <PORT> -n

# Logs Firewall (pacotes bloqueados)
grep "block" /var/log/filter.log | tail -50
```

### Debugging Roteamento Caddy

```
# No OPNSense
curl -I https://www.data-dna.eu  # Requisição externa
curl -I http://<FRONTEND_CONTAINER_IP>:3000  # Teste backend direto

# Logs Caddy
tail -f /var/log/caddy/caddy.log
tail -f /var/log/caddy/access.log
```

## Extensões Planejadas

### Integração Ory IAM

**Novas Regras Firewall**:

  - Frontend → Ory IAM (Validação sessão)
  - Ory IAM → Banco de Dados (Dados Auth)
  - Caddy → Ory IAM (Reverse Proxy para domínios auth)

**Novos Domínios Caddy**:

  - `auth.data-dna.eu` → UI Ory Kratos
  - `api.auth.data-dna.eu` → API Ory Kratos
  - `oauth.data-dna.eu` → Ory Hydra OAuth2

### Pilha Monitoramento (Opcional)

  - **Prometheus**: Coleção métricas de todos contêineres
  - **Grafana**: Visualização (Dashboards)
  - **Alertmanager**: Notificações Email/Telegram em problemas
  - **Node Exporter**: Métricas sistema (CPU, RAM, Disco)

## Melhores Práticas

✅ **Fazer**:

  - Revisar regras firewall regularmente (trimestral)
  - Usar VPN para todo acesso admin
  - Contas usuário separadas para serviços (sem credenciais compartilhadas)
  - Manter segmentação rede (não "Rede Plana")
  - Considerar DNS-over-HTTPS (DoH) para resolvers upstream

❌ **Não Fazer**:

  - Exposição direta banco de dados à Internet
  - Usar senhas padrão para OPNSense/Proxmox
  - Executar todos serviços no mesmo contêiner
  - Ignorar logs firewall (verificar anomalias regularmente)
  - Misturar VLAN gerenciamento com rede produção

## Referências

  - [Documentação OPNSense](https://docs.opnsense.org/)
  - [Guia Firewall pfSense](https://docs.netgate.com/pfsense/) (compatível com OPNSense)
  - [VPN WireGuard](https://www.wireguard.com/quickstart/)
  - [Caddy Reverse Proxy](https://caddyserver.com/docs/caddyfile)
  - [Redes Privadas RFC1918](https://datatracker.ietf.org/doc/html/rfc1918)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.