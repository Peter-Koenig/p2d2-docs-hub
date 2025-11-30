---
title: Architecture Serveur
description: Aperçu de l'infrastructure de données géospatiales p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: (Übersetzung: KI)
  reviewDate: null
---

# Architecture Serveur

[cite_start]L'infrastructure p2d2 est basée sur **Proxmox VE 9.x** et utilise une architecture hybride composée de **conteneurs LXC** pour les microservices et de **VMs** pour les tâches complexes de réseau et de serveur de tuiles. [cite: 1070] [cite_start]La virtualisation fonctionne sur du matériel Intel moderne (13e génération, 14 cœurs, 64 Go de RAM). [cite: 1070]

## Aperçu de l'Architecture

TODO : Insérer le graphique

## Aperçu des Composants

| Composant | Type | Rôle | RAM | Disque | OS |
|---|---|---|---|---|---|
| **OPNSense** | VM | Pare-feu + Reverse Proxy | 4 Go | 25 Go | [cite_start]FreeBSD 14.x | [cite: 1072]
| **PostgreSQL** | LXC | Géodatabase + PostGIS | 2 Go | 15 Go | [cite_start]Debian 13 | [cite: 1073]
| **GeoServer** | LXC | Serveur WFS/WMS | 6 Go | 12 Go | [cite_start]Debian 13 | [cite: 1074]
| **MapProxy** | LXC | Cache de tuiles + Proxy | 4 Go | 38 Go | [cite_start]Debian 13 | [cite: 1075]
| **OSM-Tiler** | VM | Rendu de tuiles | 6 Go | 65 Go | [cite_start]Debian 13 | [cite: 1075]
| **Frontend** | LXC | AstroJS + VitePress | 4 Go | 25 Go | [cite_start]Debian 13 | [cite: 1076]
| **Ory IAM** *(prévu)* | LXC | Gestion des identités | 2 Go | 10 Go | [cite_start]Debian 13 | [cite: 1077]

## Principes de Conception

### Isolation des Services

[cite_start]Chaque service fonctionne dans son propre conteneur LXC ou VM. [cite: 1078] Cela permet :

  - [cite_start]Des mises à jour indépendantes sans temps d'arrêt des autres services [cite: 1078]
  - [cite_start]L'isolation des ressources et l'optimisation des performances par service [cite: 1078]
  - [cite_start]Le rollback de composants individuels en cas de problème [cite: 1078]

### Segmentation du Réseau

  - [cite_start]**Principe DMZ** : Le conteneur frontend n'a pas d'accès direct en écriture à la base de données [cite: 1078]
  - [cite_start]**Firewall-First** : Toutes les requêtes externes passent par OPNSense [cite: 1078]
  - [cite_start]**LAN Interne** : Réseau privé dédié pour la communication de service à service [cite: 1078]
  - [cite_start]**VLAN de Gestion** : Réseau séparé pour les accès administratifs [cite: 1078]

### Fonctionnalités de Sécurité

  - [cite_start]**Pare-feu Proxmox** : Activé au niveau de l'hôte [cite: 1078]
  - [cite_start]**OPNSense** : Inspection des paquets avec état, règles NAT [cite: 1078]
  - [cite_start]**Caddy TLS** : Certificats Let's Encrypt automatiques [cite: 1078]
  - [cite_start]**Admin VPN-Only** : Accès administratif uniquement via VPN [cite: 1078]

## Stratégie de Sauvegarde

[cite_start]**Proxmox Backup Server (PBS)** crée des snapshots incrémentiels de tous les conteneurs et VMs : [cite: 1079]

  - [cite_start]**Sauvegardes Quotidiennes** : Composants critiques (BD, Frontend, Pare-feu) [cite: 1079]
  - [cite_start]**Sauvegardes Hebdomadaires** : Middleware GDI (GeoServer, MapProxy) [cite: 1079]
  - [cite_start]**Sauvegardes Mensuelles** : Serveur de tuiles (gros volumes de données) [cite: 1079]
  - [cite_start]**Rétention Automatique** : Politiques PBS pour les anciennes sauvegardes [cite: 1079]

[cite_start]Détails : [Stratégie de Sauvegarde](https://www.google.com/search?q=./backup-strategie.md) [cite: 1079]

## Documentation Complémentaire

  - [Détails Hôte Proxmox](https://www.google.com/search?q=./proxmox-host.md)
  - [Conteneur PostgreSQL/PostGIS](https://www.google.com/search?q=./lxc-postgresql.md)
  - [Conteneur GeoServer](https://www.google.com/search?q=./lxc-geoserver.md)
  - [Conteneur MapProxy](https://www.google.com/search?q=./lxc-mapproxy.md)
  - [Conteneur Frontend](https://www.google.com/search?q=./lxc-frontend.md)
  - [Pare-feu OPNSense](https://www.google.com/search?q=./vm-opnsense.md)
  - [Serveur de Tuiles OSM](https://www.google.com/search?q=./vm-osm-tiler.md)
  - [Architecture Réseau](https://www.google.com/search?q=./netzwerk-architektur.md)
  - [Intégration Ory IAM (prévue)](https://www.google.com/search?q=./lxc-ory-iam.md)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.