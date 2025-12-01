---
title: Stratégie de Sauvegarde
description: Sauvegarde des données et reprise après sinistre
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Übersetzung - KI)"
  reviewDate: null
---

# Stratégie de Sauvegarde

## Proxmox Backup Server (PBS)

### Configuration du Stockage

```
Nom du Stockage: p2d2-pbs
Type: Proxmox Backup Server (dédupliquant)
Contenu: Backups (VMs + LXCs)
Statut: Active, Shared
Déduplication: Enabled (basée sur les chunks)
Chiffrement: Configurable en option
```

::: tip Avantages de PBS

  - **Sauvegardes Incrémentales**: Uniquement les modifications depuis la dernière sauvegarde
  - **Déduplication**: Les données redondantes ne sont stockées qu'une fois
  - **Vérification**: Vérification automatique de l'intégrité des sauvegardes
  - **Restaurations Rapides**: Accès direct aux snapshots
    :::

### Planification des Sauvegardes (Généralisée)

**Tâches de Sauvegarde** (configurées via l'interface Web Proxmox) :

| Composant | Planification | Rétention | Type |
|---|---|---|---|
| OPNSense (Firewall) | Quotidienne | 7 jours | Snapshot |
| PostgreSQL/PostGIS | Quotidienne | 14 jours | Snapshot |
| GeoServer | Hebdomadaire | 4 semaines | Snapshot |
| MapProxy | Hebdomadaire | 4 semaines | Snapshot |
| OSM-Tiler | Mensuelle | 3 mois | Snapshot |
| Frontend (AstroJS) | Quotidienne | 7 jours | Snapshot |

::: warning Fenêtre de Sauvegarde
Les sauvegardes doivent être effectuées **en dehors des heures de pointe** (généralement la nuit). Les heures de sauvegarde ne sont **pas documentées spécifiquement** (bonne pratique de sécurité).
:::

### Types de Sauvegarde

#### Snapshots de Conteneur (LXC)

```
# Créer une sauvegarde manuelle
vzdump <VMID> --storage p2d2-pbs --mode snapshot --compress zstd

# Vérifier le statut de la sauvegarde
pvesm list p2d2-pbs | grep "ct-<VMID>"

# Restaurer un conteneur depuis une sauvegarde
pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-*.tar.zst --force
```

**Avantages des Snapshots LVM-Thin** :

  - Cohérents (niveau système de fichiers)
  - Rapides (copie de métadonnées uniquement)
  - Pas d'interruption de service pendant la sauvegarde

#### Backups de VM (QEMU/KVM)

```
# Backup de VM (avec suspension pour cohérence)
vzdump <VMID> --storage p2d2-pbs --mode suspend

# Restaurer une VM
qmrestore p2d2-pbs:backup/vm-<VMID>-*.vma.zst <VMID>
```

### Politique de Rétention

```
Sauvegardes Quotidiennes: 
  - Rétention: 7 jours
  - Services: PostgreSQL, Frontend, Firewall

Sauvegardes Hebdomadaires:
  - Rétention: 4 semaines
  - Services: GeoServer, MapProxy

Sauvegardes Mensuelles:
  - Rétention: 3 mois
  - Services: OSM-Tiler (gros volumes de données)

Nettoyage Automatique: Tâche Prune PBS (quotidienne)
```

## Sauvegardes de Base de Données (En plus de PBS)

### PostgreSQL pg_dump

```
# Dump SQL (sur le conteneur PostgreSQL)
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automatisation via Cron
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump data-dna | gzip > "$BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz"

# Supprimer les anciens backups (>30 jours)
find "$BACKUP_DIR" -name "data-dna_*.sql.gz" -mtime +30 -delete
```

**Pourquoi en plus de PBS ?** :

  - ✅ Restauration sélective de tables individuelles
  - ✅ Portable entre les versions de PostgreSQL
  - ✅ Taille de sauvegarde plus petite (compressée)
  - ✅ Importation dans des environnements de test sans restauration de conteneur

### Format Personnalisé PostGIS

```
# Format personnalisé (avec objets binaires)
pg_dump -Fc -b -v -f /backup/data-dna_postgis.backup data-dna

# Restauration (sélective possible)
pg_restore -d data-dna --table=kommunen /backup/data-dna_postgis.backup
```

## Sauvegardes de Configuration

### Caddy (OPNSense)

```
# Sauvegarder Caddyfile + Configs personnalisées
tar -czf /backup/caddy-config_$(date +%Y%m%d).tar.gz \
  /usr/local/etc/caddy/Caddyfile \
  /usr/local/etc/caddy/caddy.d/

# Certificats TLS (automatiquement sauvegardés via backup VM PBS)
```

### Services Systemd (Frontend)

```
# Sauvegarder tous les services p2d2
tar -czf /backup/systemd-services_$(date +%Y%m%d).tar.gz \
  /etc/systemd/system/astro-*.service \
  /etc/systemd/system/webhook-server.service
```

## Reprise après Sinistre (Disaster Recovery)

### Défaillance Complète de l'Hôte

**Scénario**: Défaillance matérielle du serveur Proxmox

**Étapes de Récupération** :

1.  **Mettre en place un nouvel hôte Proxmox**

    ```
    # Installer Proxmox VE depuis ISO
    # Restaurer la configuration réseau (Bridges)
    ```

2.  **Monter le stockage PBS**

    ```
    # Dans l'interface Web Proxmox: Datacenter → Storage → Add → PBS
    # Serveur PBS: <PBS_IP_OR_HOSTNAME>
    # Datastore: p2d2-backups
    ```

3.  **Restaurer les Conteneurs/VMs**

    ```
    # Via Web-UI: Storage → p2d2-pbs → Content → Restore
    # Ou CLI:
    pct restore <VMID> p2d2-pbs:backup/ct-<VMID>-latest.tar.zst
    qmrestore p2d2-pbs:backup/vm-<VMID>-latest.vma.zst <VMID>
    ```

4.  **Vérifier les Services**

    ```
    # PostgreSQL
    pct exec <PG_VMID> -- systemctl status postgresql

    # Intégrité de la base de données
    pct exec <PG_VMID> -- sudo -u postgres psql -c "SELECT COUNT(*) FROM kommunen;"
    ```

### Défaillance d'un Seul Conteneur

**Scénario**: Conteneur PostgreSQL corrompu

```
# Arrêter le conteneur
pct stop <PG_VMID>

# Restaurer depuis la sauvegarde
pct restore <PG_VMID> p2d2-pbs:backup/ct-<PG_VMID>-<DATE>.tar.zst --force

# Démarrer le conteneur
pct start <PG_VMID>

# Vérifier le statut du service
pct exec <PG_VMID> -- systemctl status postgresql
```

### Corruption de la Base de Données

**Scénario**: Données PostgreSQL corrompues, mais conteneur OK

```
# Supprimer la base de données
sudo -u postgres dropdb data-dna

# Recréer
sudo -u postgres createdb data-dna

# Restaurer le dump SQL
gunzip < /backup/data-dna_20251129.sql.gz | sudo -u postgres psql data-dna

# Réactiver l'extension PostGIS
sudo -u postgres psql -d data-dna -c "CREATE EXTENSION postgis;"
```

## Sauvegardes Hors Site

Actuellement, toutes les instances sont sauvegardées dans le Proxmox-Backup local. Après la sauvegarde, les backups sont synchronisés avec un PBS distant situé en Allemagne.

## Vérification des Sauvegardes

Tous les backups sont vérifiés une fois par semaine sur les deux PBS.

### Test de Restauration Mensuel (planifié)

```
# Créer un conteneur de test depuis la sauvegarde
pct restore 999 p2d2-pbs:backup/ct-<PG_VMID>-latest.tar.zst \
  --hostname postgresql-test \
  --storage local-lvm

# Vérifier le démarrage du service
pct start 999
pct exec 999 -- systemctl status postgresql

# Tester l'accès à la base de données
pct exec 999 -- sudo -u postgres psql -c "SELECT version();"

# Nettoyage
pct stop 999
pct destroy 999
```

### Vérifier l'Intégrité de la Base de Données

```
-- Fonctionnalité PostGIS
SELECT PostGIS_Full_Version();

-- Nombre d'enregistrements (vérification de plausibilité)
SELECT 
  'kommunen' AS table_name, COUNT(*) AS records FROM kommunen
UNION ALL
SELECT 
  'geometries' AS table_name, COUNT(*) FROM geometries;

-- Validité de la géométrie
SELECT COUNT(*) AS invalid_geometries
FROM kommunen
WHERE NOT ST_IsValid(geom);
```

## Monitoring des Sauvegardes

### Logs des Tâches Proxmox

```
# Afficher les logs de sauvegarde
cat /var/log/vzdump.log | grep "ERROR\|WARN"

# Vérifier le statut de PBS
proxmox-backup-manager tasks list

# Utilisation du stockage
pvesm status p2d2-pbs
```

### Configuration des Alertes

```
# Notifications par email pour les échecs de sauvegarde
# Dans Proxmox Web-UI: Datacenter → Notifications

# Script de monitoring personnalisé
#!/bin/bash
# /etc/cron.hourly/backup-check
LAST_BACKUP=$(find /var/lib/proxmox-backup/datastore/ -name "*.log" -mtime -1 | wc -l)
if [ $LAST_BACKUP -eq 0 ]; then
    echo "ALERT: No recent backups found" | mail -s "Backup Alert" admin@data-dna.eu
fi
```

## Bonnes Pratiques

✅ **À faire**:

  - Effectuer des tests de restauration réguliers
  - Surveiller les logs de sauvegarde et analyser les erreurs
  - Adapter les politiques de rétention aux besoins métier
  - Documenter les modifications de configuration
  - Mettre en place un monitoring pour les tâches de sauvegarde

❌ **À ne pas faire**:

  - Considérer les sauvegardes comme fonctionnelles sans vérification
  - Sauvegarder les données critiques sur un seul support
  - Ignorer les échecs de sauvegarde
  - Travailler sans plan de reprise après sinistre
  - Ne pas surveiller la capacité de sauvegarde

## Références

  - [Documentation Proxmox Backup Server](https://pbs.proxmox.com/docs/)
  - [PostgreSQL Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
  - [Disaster Recovery Planning](https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/disaster-recovery)
  - [Règle de sauvegarde 3-2-1](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.