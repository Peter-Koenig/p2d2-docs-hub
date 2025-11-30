---
title: Conteneur GeoServer
description: Serveur WFS/WMS pour services de géodonnées
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# LXC : GeoServer

## Informations sur le Conteneur

```
Type : LXC (privilégié/non privilégié selon la configuration)
OS : Debian 13 (trixie)
Hostname : geoserver (personnalisable)
Statut : en cours d'exécution

Ressources :
  RAM : 6 Go
  Disque : 12 Go (extensible dynamiquement)
  Parts CPU : Standard (1024)
```

## Logiciels Installés

### Java Runtime

```
Version : OpenJDK 17 (LTS)
Options JVM : Optimisées pour la charge de travail GeoServer
Mémoire : 4 Go de tas (Xmx), 512 Mo de PermGen
```

### Conteneur de Servlets Tomcat

```
Version : 9.x (Dépôt officiel Debian)
Service : tomcat9.service (systemd)
Webroot : /var/lib/tomcat9/webapps/geoserver
Port : 8080 (HTTP), 8443 (HTTPS optionnel)
```

### GeoServer

```
Version : 2.x (Stable actuelle)
Installation : Fichier WAR dans Tomcat
Chemin de contexte : /geoserver
Interface d'administration : /geoserver/web
```

## Configuration du Service

### Service Systemd

```
# Vérifier l'état du service
systemctl status tomcat9

# Redémarrer le service (avec temps d'arrêt)
systemctl restart tomcat9

# Afficher les logs
journalctl -u tomcat9 -f --no-pager

# Activer le service (démarrage automatique)
systemctl enable tomcat9
```

### Configuration de Tomcat

```
# Configuration du serveur
/etc/tomcat9/server.xml
  - Port du connecteur : 8080
  - Connecteur AJP : Désactivé (Sécurité)
  - SSL/TLS : Optionnel (via proxy Caddy)

# Configuration de l'application
/var/lib/tomcat9/webapps/geoserver/WEB-INF/web.xml
```

## Fonctionnalités de GeoServer

### Protocoles Pris en Charge

```
WMS (Web Map Service) : Rendu de cartes
  - Version : 1.1.1, 1.3.0
  - GetMap, GetFeatureInfo, GetLegendGraphic

WFS (Web Feature Service) : Données vectorielles
  - Version : 1.0.0, 1.1.0, 2.0.0
  - GetFeature, DescribeFeatureType, Transaction

WFS-T (Transactionnel) : Accès en écriture
  - Opérations Insert, Update, Delete
  - Pour la persistance des données du frontend p2d2

WMTS (Web Map Tile Service) : Optionnel
```

### Configuration de la Source de Données

#### Connexion PostgreSQL/PostGIS

```
Paramètres de connexion :
  - Hôte : postgresql.lan (DNS interne)
  - Base de données : data-dna
  - Schéma : public
  - Utilisateur : geoserver (utilisateur dédié)

Magasin PostGIS :
  - Limites estimées : Calcul automatique
  - Exposer les clés primaires : Activé
  - Requêtes préparées : Activé (Performance)
```

#### Publication des Couches

```
Couches publiées :
  - kommunen (géométries Polygon)
  - gebaeude (Point/LineString)
  - strassen (LineString)
  - Couches personnalisées selon l'importation de données

Styling (SLD) :
  - Styles standards pour différents types de géométrie
  - SLD personnalisé pour des représentations spéciales
  - Classification basée sur des règles
```

## Accès Réseau

```
Écoute : 
  - Port TCP 8080 (HTTP, LAN interne)
  - Pas d'exposition directe au WAN

Accès via Reverse Proxy :
  - ows.data-dna.eu → Endpoints WMS/WFS
  - wfs.data-dna.eu → Endpoints WFS-T (Frontend)

Règles de pare-feu :
  - Caddy (OPNSense) → GeoServer : AUTORISER
  - Frontend → GeoServer : AUTORISER (WFS-T)
  - MapProxy → GeoServer : AUTORISER (WMS)
  - Accès externe : REJETER (uniquement via Caddy)
```

## Optimisation des Performances

### Options JVM (setenv.sh)

```
# /usr/share/tomcat9/bin/setenv.sh
export JAVA_OPTS="$JAVA_OPTS -Xmx4g -Xms2g"
export JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC"
export JAVA_OPTS="$JAVA_OPTS -DGEOSERVER_DATA_DIR=/var/lib/geoserver/data"
export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
```

### Configuration de GeoServer

```
# /var/lib/geoserver/data/global.xml

<global>
  <settings>
    <proxyBaseUrl>https://ows.data-dna.eu/geoserver</proxyBaseUrl>
    <useHeadersProxyURL>false</useHeadersProxyURL>
    <verbose>false</verbose>
    <verboseExceptions>false</verboseExceptions>
    <maxFeatures>10000</maxFeatures>
    <numDecimals>8</numDecimals>
  </settings>
</global>
```

### Configuration GWC (GeoWebCache)

```
Configuration du cache :
  - Quota disque : 2 Go (limité par le disque du conteneur)
  - Couches de tuiles : Automatique pour les couches WMS
  - Sous-ensembles de grilles : WebMercator (EPSG:3857), WGS84 (EPSG:4326)
  - Méta-tuilage : 4x4 (Performance vs Qualité)
```

## Stratégie de Sauvegarde

### Snapshot PBS (Niveau Conteneur)

  - **Planification**: Hebdomadaire
  - **Rétention**: 4 semaines
  - **Type**: Snapshot LVM-Thin

### Sauvegarde de la Configuration GeoServer

```
# Sauvegarde manuelle de la configuration
tar -czf /backup/geoserver-config_$(date +%Y%m%d).tar.gz \
  /var/lib/geoserver/data/

# Automatisation via Cronjob
# /etc/cron.weekly/geoserver-backup
#!/bin/bash
BACKUP_DIR="/backup/geoserver"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/geoserver-config_$(date +%Y%m%d).tar.gz" \
  /var/lib/geoserver/data/

# Supprimer les anciennes sauvegardes (>90 jours)
find "$BACKUP_DIR" -name "geoserver-config_*.tar.gz" -mtime +90 -delete
```

::: tip Portabilité de la Configuration
Les sauvegardes de configuration GeoServer sont spécifiques à la version. Pour les mises à jour majeures, exporter/importer la configuration via l'interface utilisateur de GeoServer.
:::

## Surveillance

### Bilans de Santé

```
# État du service
curl -I http://localhost:8080/geoserver/web

# Capacités WMS
curl "http://localhost:8080/geoserver/wms?service=WMS&version=1.3.0&request=GetCapabilities"

# Liste des couches
curl "http://localhost:8080/geoserver/rest/layers.json" -u admin:<PASSWORD>
```

### Analyse des Logs

```
# Logs Tomcat
tail -f /var/log/tomcat9/catalina.out
tail -f /var/log/tomcat9/geoserver.log

# Logs GeoServer
tail -f /var/lib/geoserver/data/logs/geoserver.log

# Métriques de performance
grep "Request time" /var/lib/geoserver/data/logs/geoserver.log | tail -10
```

## Dépannage

### GeoServer ne démarre pas

```
# Vérifier les logs Tomcat
journalctl -u tomcat9 --no-pager -n 100

# Permissions du répertoire de données GeoServer
ls -la /var/lib/geoserver/data/

# Problèmes de mémoire JVM
grep "OutOfMemory" /var/log/tomcat9/catalina.out
```

### Messages d'Erreur WMS/WFS

```
# Couche non disponible
- Vérifier la connexion au magasin de données
- Tester la connexion PostgreSQL
- Permissions de la couche dans GeoServer

# Problèmes de performance
- Augmenter la taille du tas JVM
- Vérifier les index PostGIS
- Activer le cache GWC
```

### Connexion à PostgreSQL

```
# Tester depuis le conteneur GeoServer
psql -h postgresql.lan -U geoserver -d data-dna -c "SELECT version();"

# Connectivité réseau
ping postgresql.lan
telnet postgresql.lan <PG_PORT>
```

## Configuration de Sécurité

### Sécurité GeoServer

```
Utilisateur admin : 
  - Nom d'utilisateur : admin (à changer en production)
  - Mot de passe : <STRONG_PASSWORD> (pas le standard)

Accès basé sur les rôles :
  - ADMIN_ROLE : Accès complet
  - GROUP_ADMIN : Gestion des couches
  - WMS_USER : Accès en lecture seule
  - WFS_USER : Accès aux fonctionnalités

Sécurité des données :
  - Permissions au niveau de la couche
  - Isolation de l'espace de travail
  - Limites de service OGC
```

### Sécurité Réseau

```
Règles de pare-feu :
  - Seul le proxy Caddy a accès (Reverse Proxy)
  - Pas d'exposition directe au WAN
  - Communication interne uniquement avec les services autorisés

TLS/SSL :
  - Via proxy Caddy (Let's Encrypt)
  - En-tête HSTS activé
  - Suites de chiffrement modernes
```

## Intégration avec l'Architecture p2d2

### Intégration Frontend (WFS-T)

```
// Frontend AstroJS → GeoServer WFS-T
const wfsTransaction = `
<wfs:Transaction service="WFS" version="2.0.0"
  xmlns:wfs="http://www.opengis.net/wfs/2.0"
  xmlns:gml="http://www.opengis.net/gml/3.2">
  <wfs:Insert>
    <feature:gebaeude xmlns:feature="http://www.data-dna.eu/features">
      <feature:geom>
        <gml:Point srsName="EPSG:4326">
           <gml:pos>7.0 51.0</gml:pos>
        </gml:Point>
      </feature:geom>
    </feature:gebaeude>
  </wfs:Insert>
</wfs:Transaction>`;

// HTTP POST vers GeoServer
fetch('https://wfs.data-dna.eu/geoserver/wfs', {
  method: 'POST',
  headers: { 'Content-Type': 'text/xml' },
  body: wfsTransaction
});
```

### Intégration MapProxy (WMS)

```
# Configuration MapProxy
sources:
  geoserver_wms:
    type: wms
    req:
      url: http://geoserver.lan:8080/geoserver/wms
      layers: kommunen,strassen
      transparent: true

caches:
  geoserver_cache:
    sources: [geoserver_wms]
    grids: [webmercator]
    cache:
      type: file
      directory: /cache/geoserver
```

## Bonnes Pratiques

✅ **À faire** :

  - Mises à jour régulières de GeoServer (correctifs de sécurité)
  - Utilisateurs séparés pour différents niveaux d'accès
  - Cache GWC pour les couches fréquemment demandées
  - Surveillance des performances JVM (utilisation du tas)
  - Sauvegarde de la configuration GeoServer

❌ **À ne pas faire** :

  - Utiliser les mots de passe par défaut
  - Exposer GeoServer directement à Internet
  - Autoriser des MaxFeatures illimités
  - Exécuter sans limites de ressources
  - Modifier la configuration sans sauvegarde

## Références

  - [Documentation GeoServer](https://docs.geoserver.org/)
  - [Sécurité GeoServer](https://docs.geoserver.org/stable/en/user/security/)
  - [Spécification WFS-T](https://www.ogc.org/standards/wfs)
  - [Administration Tomcat 9](https://tomcat.apache.org/tomcat-9.0-doc/)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.