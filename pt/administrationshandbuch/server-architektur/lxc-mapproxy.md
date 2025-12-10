---
title: Contêiner MapProxy
description: Cache de tiles e proxy para entrega de mapas com performance
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung: KI)"
  reviewDate: null
---

# LXC: MapProxy

## Informações do Contêiner

```
Tipo: LXC (privilegiado/não privilegiado dependendo da configuração)
SO: Debian 13 (trixie)
Hostname: mapproxy (personalizável)
Status: em execução

Recursos:
  RAM: 4 GB
  Disco: 38 GB (expansível dinamicamente)
  CPU Shares: Padrão (1024)
```

## Software Instalado

### Python Runtime

```
Versão: Python 3.13.x (Repositório Oficial Debian)
Ambiente Virtual: /opt/mapproxy/venv
Gerenciador de Pacotes: pip (Python Package Index)
```

### MapProxy

```
Versão: 4.x (Estável atual)
Instalação: Pacote Python via pip
Serviço: mapproxy.service (systemd)
Servidor WSGI: Gunicorn
Workers: 4 (configurável)
```

### Gunicorn (Servidor WSGI)

```
Versão: 21.x (Servidor HTTP WSGI Python)
Binding: UNIX Socket + TCP (para desenvolvimento)
Process Manager: Modelo de worker Pre-fork
```

## Configuração do Serviço

### Serviço Systemd

```
# Verificar status do serviço
systemctl status mapproxy

# Reiniciar serviço (com downtime)
systemctl restart mapproxy

# Visualizar logs
journalctl -u mapproxy -f --no-pager

# Habilitar serviço (autostart)
systemctl enable mapproxy
```

### Configuração MapProxy

#### Configuração Principal (mapproxy.yaml)

```
# /etc/mapproxy/mapproxy.yaml
services:
  demo:
  wms:
    srs: ['EPSG:3857', 'EPSG:4326']
    image_formats: ['image/png', 'image/jpeg']
    max_output_pixels: [3000, 3000]
  kml:
    srs: 'EPSG:4326'
  tms:
    origin: 'nw'
  wmts:
    restful: true
    restful_template: '/{Layer}/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.{Format}'
    kvp: true

layers:
  - name: osm
    title: OpenStreetMap Tiles
    sources: [osm_cache]

  - name: geoserver_base
    title: GeoServer Base Layers
    sources: [geoserver_cache]

caches:
  osm_cache:
    grids: [webmercator]
    sources: [osm_tiles]
    cache:
      type: file
      directory: /cache/osm
      directory_layout: tms

  geoserver_cache:
    grids: [webmercator]
    sources: [geoserver_wms]
    cache:
      type: file
      directory: /cache/geoserver
      directory_layout: tms

sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator

  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

grids:
  webmercator:
    base: GLOBAL_WEBMERCATOR
    srs: 'EPSG:3857'
    origin: 'nw'

globals:
  cache:
    base_dir: '/cache'
    lock_dir: '/cache/locks'
  image:
    resampling_method: bilinear
```

## Acesso à Rede

```
Escutando: 
  - UNIX Socket: /run/mapproxy/mapproxy.sock
  - Porta TCP 8080 (HTTP, LAN interna, Desenvolvimento)

Acesso via Reverse Proxy:
  - tiles.data-dna.eu → Endpoints de tiles
  - proxy.data-dna.eu → Endpoints WMS

Regras de Firewall:
  - Caddy (OPNSense) → MapProxy: PERMITIR
  - Frontend → MapProxy: PERMITIR (Requisições de tiles)
  - MapProxy → GeoServer: PERMITIR (Proxy WMS)
  - MapProxy → OSM-Tiler: PERMITIR (Renderização de tiles)
  - Acesso Externo: NEGAR (somente via Caddy)
```

## Otimização de Performance

### Configuração Gunicorn

```
# /etc/mapproxy/gunicorn.conf.py
bind = "unix:/run/mapproxy/mapproxy.sock"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/mapproxy/access.log"
errorlog = "/var/log/mapproxy/error.log"
loglevel = "info"
```

### Otimização de Cache

```
Armazenamento de Cache:
  - OSM Tiles: ~20 GB (níveis de zoom pré-configurados)
  - GeoServer Cache: ~10 GB (crescimento dinâmico)
  - Espaço Temp: ~8 GB (para operações de renderização)

Limpeza de Cache:
  - Limpeza automática de tiles antigos
  - Política LRU (Least Recently Used)
  - Invalidação manual de cache em alterações de camada
```

## Estratégia de Backup

### Snapshot PBS (Nível Contêiner)

  - **Agendamento**: Semanal
  - **Retenção**: 4 semanas
  - **Tipo**: Snapshot LVM-Thin

### Backup de Configuração

```
# Backup manual da configuração
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Automação via Cronjob
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz" \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Excluir backups antigos (>90 dias)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning Dados de Cache
Dados de cache MapProxy **não** são sauvegardados. Estes podem ser re-renderizados se necessário. Apenas a configuração é crítica.
:::

## Monitoramento

### Verificações de Saúde

```
# Status do serviço
curl -I http://localhost:8080/demo

# Testar requisição de tile
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# Capacidades WMS
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### Métricas de Performance

```
# Uso de cache
du -sh /cache/osm/
du -sh /cache/geoserver/

# Status worker Gunicorn
systemctl status mapproxy | grep "active (running)"

# Análise de logs
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## Solução de Problemas

### MapProxy não inicia

```
# Verificar logs systemd
journalctl -u mapproxy --no-pager -n 100

# Validação de configuração
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# Problemas de permissão
ls -la /run/mapproxy/
ls -la /cache/
```

### Erros de Renderização de Tiles

```
# Conexão OSM-Tiler
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# Conexão GeoServer
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# Permissões diretório cache
ls -la /cache/osm/0/0/
```

### Problemas de Performance

```
# Verificar processos worker
ps aux | grep gunicorn

# Uso de memória
free -h

# Espaço em disco
df -h /cache
```

## Configuração de Segurança

### Endurecimento do Serviço

```
Isolamento de Usuário:
  - Usuário Dedicado: mapproxy
  - Grupo: mapproxy
  - Diretório Home: /opt/mapproxy

Permissões de Arquivo:
  - Arquivos de Config: 640 (root:mapproxy)
  - Diretório Cache: 755 (mapproxy:mapproxy)
  - Arquivos de Log: 644 (mapproxy:mapproxy)
```

### Segurança de Rede

```
Regras de Firewall:
  - Somente serviços autorizados têm acesso
  - Sem exposição direta à WAN
  - Reverse Proxy com limitação de taxa

TLS/SSL:
  - Via proxy Caddy (Let's Encrypt)
  - Cabeçalho HSTS habilitado
  - Suites de Cifragem Modernas
```

## Integração com Arquitetura p2d2

### Integração Frontend

```
// Frontend AstroJS → Tiles MapProxy
const tileUrl = `https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png`;

// Integração Leaflet
const map = L.map('map').setView([51.0, 7.0], 10);
L.tileLayer(tileUrl, {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);
```

### Proxy GeoServer

```
# Proxy WMS para camada GeoServer
const wmsUrl = `https://proxy.data-dna.eu/service?` +
  `service=WMS&version=1.3.0&request=GetMap&` +
  `layers=geoserver_base&styles=&format=image/png&` +
  `transparent=true&width=256&height=256&` +
  `crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### Integração OSM-Tiler

```
# Requisições de tiles diretas para OSM-Tiler
sources:
  osm_tiles:
    type: tile
    url: http://osm-tiler.lan:8080/tiles/%(tms_path)s.png
    grid: webmercator
    transparent: true
    coverage:
      bbox: [-180, -85, 180, 85]
      srs: 'EPSG:4326'
```

## Recursos Avançados

### Seeding (Pré-renderização)

```
# Seeding manual para áreas específicas
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 0-10 \
  --bbox 5.8,50.2,9.0,52.5

# Seeding automático via Cron
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 11-14 \
  --bbox 6.0,50.5,7.5,51.5
```

### Gerenciamento de Cache

```
# Estatísticas de cache
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  cache-stats osm_cache

# Limpeza de cache
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache osm_cache --max-age 30

# Invalidação de cache
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache geoserver_cache --all
```

## Melhores Práticas

✅ **Fazer**:

  - Atualizações regulares do MapProxy (Patches de segurança)
  - Monitoramento da utilização de cache
  - Ajustar workers Gunicorn aos núcleos CPU disponíveis
  - Diretório cache em partição/volume separado
  - Rotação de logs para logs de acesso/erro

❌ **Não Fazer**:

  - Expor MapProxy diretamente à internet
  - Permitir armazenamento cache ilimitado
  - Executar sem limitação de taxa
  - Alterar configuração sem backup
  - Reter dados cache antigos indefinidamente

## Referências

  - [Documentação MapProxy](https://mapproxy.org/docs/)
  - [Configuração Gunicorn](https://docs.gunicorn.org/en/stable/configure.html)
  - [Especificação Tile Map Service](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
  - [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)

> **Nota:** Este texto foi traduzido automaticamente com assistência de IA e ainda não foi revisado por um humano.