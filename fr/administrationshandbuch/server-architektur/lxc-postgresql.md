---
title: Conteneur PostgreSQL/PostGIS
description: Serveur de géodatabase avec extensions spatiales
quality:
  completeness: 80
  accuracy: 50
  reviewed: false
  reviewer: "(Traduction: IA)"
  reviewDate: null
---

# LXC : PostgreSQL/PostGIS

## Informations sur le Conteneur

```
Type : LXC (privilégié/non privilégié selon la configuration)
OS : Debian 13 (trixie)
Hostname : postgresql (personnalisable)
Statut : en cours d'exécution

Ressources :
  RAM : 2 Go
  Disque : 15 Go (extensible dynamiquement)
  Parts CPU : Standard (1024)
```

## Logiciels Installés

### PostgreSQL

```
Version : 18.x (Dépôt officiel Debian)
Service : postgresql.service (systemd)
Socket : UNIX + TCP/IP
Accès : LAN interne (non exposé publiquement)
```

### PostGIS

```
Version : 3.6.x
Extension : Activée dans la base de données de production
Fonctionnalités : 
  - Types de géométrie spatiale (Point, LineString, Polygon)
  - Index spatiaux (GiST, SP-GiST)
  - Transformations de coordonnées (Support SRID)
  - Support de topologie
```

## Bases de données

| Database | PostGIS | Objectif |
|---|---|---|
| `postgres` | ❌ | Base de données système (Standard) |
| `data-dna` | ✅ | **BD de production pour p2d2** |

::: tip Activer l'extension PostGIS

```
-- Dans la nouvelle base de données
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;

-- Vérification
SELECT PostGIS_Full_Version();
```

:::

## Accès Réseau

```
Écoute : 
  - Port TCP <STANDARD_PG_PORT> (toutes les interfaces)
  - Socket UNIX : /var/run/postgresql/

pg_hba.conf :
  - localhost : Trust (pour maintenance)
  - LAN interne : Authentification par mot de passe md5
  - WAN : DENY (bloqué par le pare-feu)
```

**Chaîne de Connexion** (pour les applications sur le même LAN) :

```
postgresql://<USER>:<PASSWORD>@<DB_HOST>:<PORT>/data-dna
```

## Service Systemd

```
# Vérifier l'état du service
systemctl status postgresql

# Redémarrer le service (avec temps d'arrêt)
systemctl restart postgresql

# Afficher les logs
journalctl -u postgresql -f --no-pager

# Activer le service (démarrage automatique)
systemctl enable postgresql
```

## Fonctions PostGIS

### Requêtes Spatiales

```
-- Test Point-in-Polygon
SELECT name FROM kommunen 
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(7.0, 51.0), 4326));

-- Calcul de distance (en mètres)
SELECT ST_Distance(
  ST_Transform(geom1, 3857),
  ST_Transform(geom2, 3857)
);

-- Buffer (tampon de 500m autour de la géométrie)
SELECT ST_Buffer(ST_Transform(geom, 3857), 500);
```

### Optimisation des Performances

```
-- Créer un index spatial
CREATE INDEX idx_kommunen_geom ON kommunen USING GIST(geom);

-- Mettre à jour les statistiques
ANALYZE kommunen;

-- Vacuum pour nettoyage
VACUUM ANALYZE kommunen;
```

## Stratégie de Sauvegarde

### Snapshot PBS (Niveau Conteneur)

  - **Planification**: Quotidienne nocturne
  - **Rétention**: 14 jours
  - **Type**: Snapshot LVM-Thin (cohérent)

### Dumps SQL (Niveau Base de Données)

```
# Sauvegarde manuelle
sudo -u postgres pg_dump data-dna | gzip > /backup/data-dna_$(date +%Y%m%d).sql.gz

# Automatisation via Cronjob
# /etc/cron.daily/postgres-backup
#!/bin/bash
BACKUP_DIR="/backup/postgres"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump data-dna | gzip > $BACKUP_DIR/data-dna_$(date +%Y%m%d).sql.gz

# Supprimer les anciens backups (>30 jours)
find $BACKUP_DIR -name "data-dna_*.sql.gz" -mtime +30 -delete
```

::: warning Complémentarité des Sauvegardes
Les snapshots PBS sont rapides pour la restauration de conteneurs. Les dumps SQL permettent une restauration sélective des tables et sont portables entre les versions de PostgreSQL.
:::

## Réglage des Performances

### Ajustements recommandés de postgresql.conf

```
# Mémoire (pour conteneur de 2GB RAM)
shared_buffers = 512MB            # 25% de la RAM
effective_cache_size = 1536MB     # 75% de la RAM
work_mem = 16MB                   # Mémoire par requête
maintenance_work_mem = 128MB      # Pour VACUUM/CREATE INDEX

# Optimisations PostGIS
max_parallel_workers_per_gather = 2
random_page_cost = 1.1            # Optimisé SSD (au lieu de 4.0 pour HDD)
```

### Analyse des Requêtes

```
-- Identifier les requêtes lentes (Extension pg_stat_statements)
CREATE EXTENSION pg_stat_statements;

SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- >1 seconde
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitoring

```
-- Connexions actives
SELECT count(*), state FROM pg_stat_activity 
GROUP BY state;

-- Taille de la base de données
SELECT pg_size_pretty(pg_database_size('data-dna'));

-- Plus grandes tables
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

## Dépannage

### Le conteneur ne démarre pas

```
# Sur l'hôte Proxmox
pct status <VMID>
pct start <VMID>
pct logs <VMID>  # Derniers logs de démarrage
```

### PostgreSQL ne démarre pas

```
# Dans le conteneur
systemctl status postgresql
journalctl -u postgresql --no-pager -n 50

# Tester le fichier de configuration
su - postgres -c "postgres -C config_file"
```

### Problèmes de connexion

```
# PostgreSQL écoute-t-il ?
ss -tlnp | grep postgres

# Règle de pare-feu existe-t-elle ?
iptables -L -n | grep <PORT>

# Vérifier pg_hba.conf
cat /etc/postgresql/*/main/pg_hba.conf
```

## Extension pour Ory IAM (prévue)

Pour l'intégration Ory prévue, des bases de données supplémentaires sont nécessaires :

```
-- Base de données Ory-Kratos
CREATE USER ory_kratos WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_kratos OWNER ory_kratos;
GRANT ALL PRIVILEGES ON DATABASE ory_kratos TO ory_kratos;

-- Base de données Ory-Hydra
CREATE USER ory_hydra WITH PASSWORD '<STRONG_PASSWORD>';
CREATE DATABASE ory_hydra OWNER ory_hydra;
GRANT ALL PRIVILEGES ON DATABASE ory_hydra TO ory_hydra;
```

Détails : [Intégration Ory IAM](https://www.google.com/search?q=./lxc-ory-iam.md)

## Bonnes Pratiques

✅ **À faire**:

  - VACUUM ANALYZE réguliers pour la performance
  - Index spatiaux sur les colonnes de géométrie
  - Pooling de connexions (pgBouncer) pour forte charge
  - Comptes utilisateurs séparés avec privilèges minimaux

❌ **À ne pas faire**:

  - Exécuter PostgreSQL en tant que root
  - Utiliser des mots de passe par défaut
  - Exposition directe de la base de données sur le WAN
  - Stocker de grandes géométries sans généralisation

## Références

  - [Documentation PostgreSQL 18](https://www.postgresql.org/docs/18/)
  - [Manuel PostGIS 3.6](https://postgis.net/docs/manual-3.6/)
  - [Guide d'optimisation des performances](https://wiki.postgresql.org/wiki/Performance_Optimization)

> **Note :** Ce texte a été traduit automatiquement avec l'aide de l'IA et n'a pas encore été vérifié par un humain.