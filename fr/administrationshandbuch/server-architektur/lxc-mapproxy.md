---
title: Conteneur MapProxy
description: Cache de tuiles et proxy pour une livraison de cartes performante
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung: KI)"
  reviewDate: null
---

# LXC : MapProxy

## Informations sur le Conteneur

```
Type : LXC (privilégié/non privilégié selon la configuration)
OS : Debian 13 (trixie)
Hostname : mapproxy (personnalisable)
Statut : en cours d'exécution

Ressources :
  RAM : 4 Go
  Disque : 38 Go (extensible dynamiquement)
  Parts CPU : Standard (1024)
```

## Logiciels Installés

### Python Runtime

```
Version : Python 3.13.x (Dépôt officiel Debian)
Environnement Virtuel : /opt/mapproxy/venv
Gestionnaire de paquets : pip (Python Package Index)
```

### MapProxy

```
Version : 4.x (Stable actuelle)
Installation : Paquet Python via pip
Service : mapproxy.service (systemd)
Serveur WSGI : Gunicorn
Workers : 4 (configurable)
```

### Gunicorn (Serveur WSGI)

```
Version : 21.x (Serveur HTTP WSGI Python)
Binding : UNIX Socket + TCP (pour développement)
Process Manager : Modèle de worker Pre-fork
```

## Configuration du Service

### Service Systemd

```
# Vérifier l'état du service
systemctl status mapproxy

# Redémarrer le service (avec temps d'arrêt)
systemctl restart mapproxy

# Afficher les logs
journalctl -u mapproxy -f --no-pager

# Activer le service (démarrage automatique)
systemctl enable mapproxy
```

### Configuration MapProxy

#### Configuration Principale (mapproxy.yaml)

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

## Accès Réseau

```
Écoute : 
  - UNIX Socket : /run/mapproxy/mapproxy.sock
  - Port TCP 8080 (HTTP, LAN interne, Développement)

Accès via Reverse Proxy :
  - tiles.data-dna.eu → Endpoints de tuiles
  - proxy.data-dna.eu → Endpoints WMS

Règles de pare-feu :
  - Caddy (OPNSense) → MapProxy : AUTORISER
  - Frontend → MapProxy : AUTORISER (Requêtes de tuiles)
  - MapProxy → GeoServer : AUTORISER (Proxy WMS)
  - MapProxy → OSM-Tiler : AUTORISER (Rendu de tuiles)
  - Accès externe : REJETER (uniquement via Caddy)
```

## Optimisation des Performances

### Configuration Gunicorn

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

### Optimisation du Cache

```
Stockage du Cache :
  - Tuiles OSM : ~20 Go (niveaux de zoom préconfigurés)
  - Cache GeoServer : ~10 Go (croissance dynamique)
  - Espace Temp : ~8 Go (pour opérations de rendu)

Nettoyage du Cache :
  - Nettoyage automatique des anciennes tuiles
  - Politique LRU (Least Recently Used)
  - Invalidation manuelle du cache lors de modifications de couche
```

## Stratégie de Sauvegarde

### Snapshot PBS (Niveau Conteneur)

  - **Planification**: Hebdomadaire
  - **Rétention**: 4 semaines
  - **Type**: Snapshot LVM-Thin

### Sauvegarde de la Configuration

```
# Sauvegarde manuelle de la configuration
tar -czf /backup/mapproxy-config_$(date +%Y%m%d).tar.gz \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Automatisation via Cronjob
# /etc/cron.weekly/mapproxy-backup
#!/bin/bash
BACKUP_DIR="/backup/mapproxy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/mapproxy-config_$(date +%Y%m%d).tar.gz" \
  /etc/mapproxy/ \
  /opt/mapproxy/

# Supprimer les anciennes sauvegardes (>90 jours)
find "$BACKUP_DIR" -name "mapproxy-config_*.tar.gz" -mtime +90 -delete
```

::: warning Données de Cache
Les données de cache MapProxy ne sont **pas** sauvegardées. Elles peuvent être régénérées si nécessaire. Seule la configuration est critique.
:::

## Monitoring

### Bilans de Santé

```
# État du service
curl -I http://localhost:8080/demo

# Tester la requête de tuile
curl "http://localhost:8080/tms/1.0.0/osm/0/0/0.png" -o /dev/null -w "%{http_code}"

# Capacités WMS
curl "http://localhost:8080/service?service=WMS&request=GetCapabilities"
```

### Métriques de Performance

```
# Utilisation du cache
du -sh /cache/osm/
du -sh /cache/geoserver/

# Statut du worker Gunicorn
systemctl status mapproxy | grep "active (running)"

# Analyse des logs
tail -f /var/log/mapproxy/access.log | grep " 200 "
tail -f /var/log/mapproxy/error.log
```

## Dépannage

### MapProxy ne démarre pas

```
# Vérifier les logs systemd
journalctl -u mapproxy --no-pager -n 100

# Validation de la configuration
/opt/mapproxy/venv/bin/mapproxy-util serve-develop /etc/mapproxy/mapproxy.yaml

# Problèmes de permissions
ls -la /run/mapproxy/
ls -la /cache/
```

### Erreurs de Rendu de Tuiles

```
# Connexion OSM-Tiler
curl -I http://osm-tiler.lan:8080/tiles/0/0/0.png

# Connexion GeoServer
curl "http://geoserver.lan:8080/geoserver/wms?service=WMS&request=GetCapabilities"

# Permissions du répertoire de cache
ls -la /cache/osm/0/0/
```

### Problèmes de Performance

```
# Vérifier les processus worker
ps aux | grep gunicorn

# Utilisation mémoire
free -h

# Espace disque
df -h /cache
```

## Configuration de Sécurité

### Durcissement du Service

```
Isolation utilisateur :
  - Utilisateur dédié : mapproxy
  - Groupe : mapproxy
  - Répertoire personnel : /opt/mapproxy

Permissions des fichiers :
  - Fichiers de configuration : 640 (root:mapproxy)
  - Répertoire de cache : 755 (mapproxy:mapproxy)
  - Fichiers de log : 644 (mapproxy:mapproxy)
```

### Sécurité Réseau

```
Règles de pare-feu :
  - Seuls les services autorisés ont accès
  - Pas d'exposition directe au WAN
  - Reverse Proxy avec limitation de débit

TLS/SSL :
  - Via proxy Caddy (Let's Encrypt)
  - En-tête HSTS activé
  - Suites de chiffrement modernes
```

## Intégration avec l'Architecture p2d2

### Intégration Frontend

```
// Frontend AstroJS → Tuiles MapProxy
const tileUrl = `https://tiles.data-dna.eu/tms/1.0.0/osm/{z}/{x}/{y}.png`;

// Intégration Leaflet
const map = L.map('map').setView([51.0, 7.0], 10);
L.tileLayer(tileUrl, {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);
```

### Proxy GeoServer

```
# Proxy WMS pour couche GeoServer
const wmsUrl = `https://proxy.data-dna.eu/service?` +
  `service=WMS&version=1.3.0&request=GetMap&` +
  `layers=geoserver_base&styles=&format=image/png&` +
  `transparent=true&width=256&height=256&` +
  `crs=EPSG:3857&bbox={bbox-epsg-3857}`;
```

### Intégration OSM-Tiler

```
# Requêtes de tuiles directes à OSM-Tiler
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

## Fonctionnalités Avancées

### Seeding (Pré-rendu)

```
# Seeding manuel pour zones spécifiques
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 0-10 \
  --bbox 5.8,50.2,9.0,52.5

# Seeding automatique via Cron
# /etc/cron.daily/mapproxy-seed
#!/bin/bash
/opt/mapproxy/venv/bin/mapproxy-seed -f /etc/mapproxy/mapproxy.yaml \
  -c osm_cache \
  --grid webmercator \
  --levels 11-14 \
  --bbox 6.0,50.5,7.5,51.5
```

### Gestion du Cache

```
# Statistiques du cache
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  cache-stats osm_cache

# Nettoyage du cache
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache osm_cache --max-age 30

# Invalidation du cache
/opt/mapproxy/venv/bin/mapproxy-util -f /etc/mapproxy/mapproxy.yaml \
  clean-cache geoserver_cache --all
```

## Bonnes Pratiques

✅ **À faire**:

  - Mises à jour régulières de MapProxy (correctifs de sécurité)
  - Surveillance de l'utilisation du cache
  - Adapter les workers Gunicorn aux cœurs CPU disponibles
  - Répertoire de cache sur partition/volume séparé
  - Rotation des logs pour les logs d'accès/erreur

❌ **À ne pas faire**:

  - Exposer MapProxy directement à Internet
  - Autoriser un stockage de cache illimité
  - Exécuter sans limitation de débit
  - Modifier la configuration sans sauvegarde
  - Conserver les anciennes données de cache indéfiniment

## Références

  - [Documentation MapProxy](https://mapproxy.org/docs/)
  - [Configuration Gunicorn](https://docs.gunicorn.org/en/stable/configure.html)
  - [Spécification Tile Map Service](https://wiki.osgeo.org/wiki/Tile_Map_Service_Specification)
  - [Web Map Tile Service (WMTS)](https://www.ogc.org/standards/wmts)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.