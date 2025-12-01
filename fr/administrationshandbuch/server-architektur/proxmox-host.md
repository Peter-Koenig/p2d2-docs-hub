---
title: Hôte Proxmox
description: Plateforme de virtualisation pour l'infrastructure p2d2
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Hôte Proxmox

## Spécifications Matérielles

```
CPU : Intel Core i5 13e Génération
  - Cœurs : 14 Cœurs Physiques
  - Threads : 20 CPU Logiques
  - Fonctionnalités : AVX2, AES-NI, Virtualisation (VT-x/VT-d)

RAM : 64 Go DDR4
Swap : 6 Go

Type de système : Serveur Dédié (Bare Metal)
```

## Pile Logicielle

```
Virtualisation : Proxmox VE 9.x (Stable actuelle)
Noyau : Linux 6.x (optimisé PVE)
QEMU/KVM : Version 9.x
Moteur de conteneur : LXC (Linux Containers)
```

::: tip Pourquoi Proxmox ?

  - **Open Source** : Gratuit, piloté par la communauté
  - **Prêt pour l'entreprise** : Utilisable en production sans coûts de licence
  - **Hybride** : Combine VMs (KVM) et conteneurs (LXC)
  - **Intégration de sauvegarde** : Proxmox Backup Server (PBS) intégré nativement
    :::

## Architecture de Stockage

### Pool LVM-Thin (VMs-Conteneurs)

```
Type : Volume LVM-Thin
Utilisation : Systèmes de fichiers racine pour LXC et disques VM
Avantage : Snapshots, Provisionnement léger, Efficacité
```

### Stockage Répertoire Local

```
Type : Répertoire
Utilisation : Modèles, ISOs, sauvegardes temporaires
Chemin : /var/lib/vz
```

### Proxmox Backup Server (PBS)

```
Type : Stockage de sauvegarde dédupliqué
Utilisation : Sauvegardes de production de tous les VMs/LXCs
Fonctionnalités : Snapshots incrémentiels, chiffrement, vérification
```

::: warning Capacité de Sauvegarde
Le stockage PBS doit être régulièrement vérifié pour son utilisation. Si >80%, recommandation : planifier une extension.
:::

## Configuration Réseau

```
Ponts :
  - vmbr0 : Pont WAN (face à Internet)
  - vmbr1 : Pont LAN (Réseau de service interne)
  - vmbr2 : VLAN de Gestion (Accès admin)

VPN : WireGuard pour administration à distance sécurisée
```

Architecture réseau détaillée : [Documentation Réseau](https://www.google.com/search?q=./netzwerk-architektur.md)

## Configuration de Sécurité

### Pare-feu Proxmox

```
Statut : Activé au niveau de l'hôte
Politique : DROP par défaut (Approche liste blanche)
Gestion des règles : Via Web UI ou pvesh CLI
```

### Contrôle d'Accès

  - **Web UI** : HTTPS uniquement, Port 8006
  - **SSH** : Uniquement via VLAN de Gestion ou VPN
  - **API** : Authentification basée sur les jetons
  - **Mises à jour** : Correctifs de sécurité automatiques (optionnel)

## Instances en Cours d'Exécution

### Conteneurs LXC (Légers)

| Nom | Statut | Rôle | Ressources |
|------|--------|-------|------------|
| postgresql | ✅ en cours | Géodatabase | 2 Go RAM, 15 Go Disque |
| geoserver | ✅ en cours | Serveur WFS/WMS | 6 Go RAM, 12 Go Disque |
| mapproxy | ✅ en cours | Proxy Tuiles | 4 Go RAM, 38 Go Disque |
| frontend | ✅ en cours | Frontend Web | 4 Go RAM, 25 Go Disque |
| zabbix | ⏸ arrêté | Monitoring (optionnel) | 2 Go RAM, 10 Go Disque |

### Machines Virtuelles (VMs Complètes)

| Nom | Statut | Rôle | Ressources |
|------|--------|-------|------------|
| OPNSense | ✅ en cours | Pare-feu + Proxy | 4 Go RAM, 25 Go Disque |
| osm-tiler | ✅ en cours | Rendu Tuiles | 6 Go RAM, 65 Go Disque |

## Outils de Gestion

### Administration CLI

```
# Gestion Conteneur
pct list                    # Lister conteneurs
pct start <VMID>           # Démarrer conteneur
pct exec <VMID> -- bash    # Shell dans conteneur

# Gestion VM
qm list                     # Lister VMs
qm start <VMID>             # Démarrer VM
qm snapshot <VMID> <NAME>  # Créer snapshot

# Gestion Sauvegarde
pvesm list <STORAGE>       # Lister sauvegardes
vzdump <VMID>              # Sauvegarde manuelle
```

### Web UI

  - **URL** : `https://<PROXMOX_HOST>:8006`
  - **Fonctionnalités** :
      - Vue d'ensemble graphique des ressources
      - Accès console aux VMs/LXCs
      - Planification des tâches de sauvegarde
      - Éditeur de règles de pare-feu

## Liste de Contrôle de Maintenance

**Hebdomadaire** :

  - [ ] Vérifier capacité PBS
  - [ ] Vérifier logs de sauvegarde pour erreurs

**Mensuelle** :

  - [ ] Mises à jour noyau via `apt update && apt upgrade`
  - [ ] Vérifier mises à jour modèles conteneurs
  - [ ] Effectuer test de restauration d'une sauvegarde

**Trimestrielle** :

  - [ ] Revoir règles de pare-feu
  - [ ] Analyser utilisation des ressources
  - [ ] Tester plan de reprise après sinistre

## Références

  - [Documentation Proxmox VE](https://pve.proxmox.com/pve-docs/)
  - [LXC vs. KVM : Quand utiliser quoi ?](https://pve.proxmox.com/wiki/Linux_Container)
  - [Proxmox Backup Server](https://pbs.proxmox.com/docs/)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.