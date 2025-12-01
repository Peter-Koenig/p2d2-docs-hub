---
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Manuel d'Administration

Bienvenue dans le manuel d'administration de p2d2. Vous trouverez ici la documentation technique pour l'installation, la configuration et l'exploitation de l'infrastructure de géodonnées.

## Public Cible

Ce manuel s'adresse à :

  - **Administrateurs système** qui installent et exploitent p2d2
  - **Ingénieurs DevOps** qui automatisent le déploiement
  - **Spécialistes GDI** qui configurent l'infrastructure de géodonnées

## Aperçu de l'Architecture

p2d2 est basé sur une architecture à plusieurs niveaux :

1.  **Couche Infrastructure**: Proxmox VE, OPNsense, PBS
2.  **Infrastructure de Géodonnées**: PostgreSQL/PostGIS, GeoServer, MapProxy
3.  **Frontend**: Application AstroJS avec OpenLayers
4.  **CI/CD**: Pipeline de déploiement basé sur GitLab

## Prérequis Système

### Matériel

  - **Hôte Proxmox**: Intel 13e Gen (ou comparable), 14 cœurs, 64 Go RAM
  - **Système Total**: ~28 Go RAM pour tous les conteneurs/VM + surcharge pour Proxmox
  - **Stockage**: Min. 200 Go SSD (pour conteneurs/VM + espace de sauvegarde)
  - **Réseau**: 1 Gbit/s (10 Gbit/s pour la production)

### Logiciel

  - **Virtualisation**: Proxmox VE 9.x
  - **OS Conteneur**: Debian 13
  - **OS Firewall**: FreeBSD 14.x (OPNSense)
  - **Base de Données**: PostgreSQL 15+ avec PostGIS 3.4+
  - **Serveur Web**: Caddy (Terminaison TLS)
  - **Node.js**: 20.x LTS

## Navigation

### Infrastructure Serveur

  - [Aperçu de l'Architecture Serveur](./server-architektur/) - Architecture globale de l'infrastructure p2d2
  - [Hôte Proxmox](./server-architektur/proxmox-host) - Plateforme de virtualisation
  - [Firewall OPNSense](./server-architektur/vm-opnsense) - Firewall et Reverse Proxy
  - [Architecture Réseau](./server-architektur/netzwerk-architektur) - Segmentation réseau et conception du firewall
  - [Stratégie de Sauvegarde](./server-architektur/backup-strategie) - Sauvegarde des données et reprise après sinistre

### Infrastructure de Géodonnées

  - [Conteneur PostgreSQL/PostGIS](./server-architektur/lxc-postgresql) - Base de données géospatiale avec extensions spatiales
  - [Conteneur GeoServer](./server-architektur/lxc-geoserver) - Serveur WFS/WMS pour services de géodonnées
  - [Conteneur MapProxy](./server-architektur/lxc-mapproxy) - Cache de tuiles et proxy pour une livraison de cartes performante
  - [VM OSM-Tileserver](./server-architektur/vm-osm-tiler) - Serveur de rendu de tuiles OpenStreetMap
  - [Conteneur Ory IAM (Prévu)](./server-architektur/lxc-ory-iam) - Gestion des Identités et des Accès

### Logiciel & Déploiement

  - [Conteneur Frontend](./server-architektur/lxc-frontend) - Frontend web AstroJS + VitePress avec CI/CD multi-branches
  - [Architecture Frontend](./frontend-architektur) - Application AstroJS
  - [Architecture Logicielle](./software-architektur) - Composants et modules
  - [Déploiement](./deployment/staging) - Staging et Production

## Démarrage Rapide

Pour une installation rapide dans un environnement de test :

```
# Cloner le dépôt
git clone https://gitlab.opencode.de/OC000028072444/p2d2.git
cd p2d2

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Pour une installation de production complète, suivez les sections du Manuel d'Administration.

::: warning Avis de Sécurité
L'installation rapide est uniquement adaptée aux environnements de test ! Pour les systèmes de production, les aspects de sécurité doivent être pris en compte.
:::

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.