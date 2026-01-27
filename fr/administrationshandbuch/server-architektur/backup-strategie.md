---
title: Stratégie de sauvegarde
description: Sauvegarde des données et reprise après sinistre pour le serveur p2d2
quality:
  completeness: 95
  accuracy: 95
  reviewed: true
  reviewer: Peter König
  reviewDate: 2026-01-27
---

# Stratégie de sauvegarde

La stratégie de sauvegarde du serveur p2d2 suit la **règle 3-2-1** et utilise un **système de sauvegarde en plusieurs niveaux** avec redondance géographique.

## Architecture de sauvegarde

### Composants

1. **Hôte Proxmox** (serveur Hetzner)  
   - Port de l’interface Web : **** (2FA activée)  
   - Exécute les tâches de sauvegarde  
   - Les identifiants d’accès ne sont pas documentés

2. **Proxmox Backup Server (PBS) – Hetzner**  
   - Port de l’interface Web : **** (2FA activée)  
   - Stockage : ZFS, 2× SSD (miroir), ~49 Go  
   - Rôle : **cache de sauvegarde** (rétention courte)  
   - Datastore : `p2d2-pbs-local`  
   - Les identifiants d’accès ne sont pas documentés

3. **Proxmox Backup Server (PBS) – Home office**  
   - Réseau : réseau privé (via WireGuard)  
   - Rôle : **archive à long terme** (rétention longue)  
   - Connexion : tunnel WireGuard depuis l’hôte Proxmox

### Connexion réseau

```bash
# Tunnel WireGuard entre Hetzner et le home office
Interface : wg-kinglui
Port : *****
Keepalive persistant : 25 secondes
```

**Vérification de la connectivité :**

```bash
# Sur l’hôte Proxmox
wg show

# Ping vers le PBS du home office
ping <HOMEOFFICE_PBS_IP>
```

::: tip Règle 3-2-1 respectée
- **3 copies** : production + PBS Hetzner + PBS home office  
- **2 types de supports** : stockage Hetzner + stockage home office  
- **1 copie hors site** : home office géographiquement séparé
:::

## Flux de sauvegarde

### 1. Sauvegardes locales (Hetzner → PBS Hetzner)

Les tâches de sauvegarde s’exécutent sur l’hôte Proxmox et écrivent directement sur le PBS local.

**Avantages :**
- Haute performance (faible latence)
- Indépendant de la connexion WireGuard
- Instantanés rapides

**Rétention sur le PBS Hetzner :**

```
Keep Last : 2 (dernières sauvegardes seulement)
Keep Monthly : 2 (instantanés mensuels)
```

::: warning Gestion de l’espace disque
Le PBS Hetzner dispose d’un espace limité (~49 Go). Une rétention courte garantit suffisamment de place pour les nouvelles sauvegardes. L’archive à long terme se trouve au home office.
:::

**Configuration de la rétention :**

```bash
# Interface Proxmox : Datacenter → Backup → Modifier la tâche
# → Rétention : Keep Last = 2, Keep Monthly = 2
```

### 2. Synchronisation vers le PBS du home office (pull)

Le **PBS du home office tire** (pull) les sauvegardes depuis le PBS Hetzner via WireGuard.

**Configuration de la tâche de sync :**

```
Direction : Pull (Home office ← Hetzner)
Planification : Quotidien (après les fenêtres de sauvegarde)
Remove vanished : Désactivé (le home office conserve les anciennes sauvegardes)
```

**Avantages du mode pull :**
- Le home office initie la connexion
- Seuls les blocs dédupliqués sont transférés
- Efficace en bande passante grâce à la déduplication PBS
- Aucune connexion sortante nécessaire depuis le serveur Hetzner

## Planification des sauvegardes

### Tâches de sauvegarde (Proxmox → PBS Hetzner)

| Composant           | VM/LXC | Planification | Type de sauvegarde          |
|---------------------|--------|---------------|------------------------------|
| Firewall OPNsense   | VM     | Quotidien     | Snapshot                     |
| PostgreSQL/PostGIS  | LXC    | Quotidien     | Snapshot + dump SQL          |
| GeoServer           | LXC    | Quotidien     | Snapshot                     |
| MapProxy            | LXC    | Quotidien     | Snapshot                     |
| Frontend (AstroJS)  | LXC    | Quotidien     | Snapshot                     |
| Ory IAM             | LXC    | Quotidien     | Snapshot                     |

::: warning Fenêtre de sauvegarde
Les sauvegardes s’exécutent **en dehors des heures de pointe** (la nuit). Les horaires exacts ne sont pas documentés pour des raisons de sécurité.
:::

### Tâches de maintenance (chronologie)

#### PBS Hetzner

```
Après chaque sauvegarde : Auto-prune (selon la rétention)
Tous les jours 07:00 : Garbage collection
Hebdomadaire (dimanche 03:00) : Tâche de vérification (verify)
```

#### PBS home office

```
Tous les jours 01:00 : Tâche de sync (pull depuis Hetzner)
Tous les jours 06:00 : Tâche de prune
Tous les jours 07:00 : Garbage collection
Hebdomadaire (dimanche 04:00) : Tâche de vérification (verify)
```

::: tip Éviter le chevauchement des tâches
Les tâches de vérification, GC et de synchronisation ne doivent **jamais** s’exécuter simultanément. Des plages horaires séparées réduisent les conflits de ressources.
:::

## Politiques de rétention

### PBS Hetzner (cache)

```
Keep Last : 2
Keep Monthly : 2
```

**But :** cache de sauvegarde à court terme pour des restaurations rapides et la synchronisation vers le home office.

**Utilisation typique :**
- 6 VM/LXC × 4 sauvegardes = 24 instantanés  
- ~35–40 Go utilisés sur 49 Go  
- Après GC : suffisamment d’espace libre pour de nouvelles sauvegardes

### PBS home office (archive long terme)

```
Keep Last : 7
Keep Daily : 7
Keep Weekly : 4
Keep Monthly : 6
```

**But :** conservation à long terme pour la reprise après sinistre et les restaurations historiques.

## Stratégie de sauvegarde PostgreSQL

PostgreSQL nécessite une attention particulière pour la cohérence des données.

### Sauvegarde en deux couches

1. **Snapshot du conteneur** (via sauvegarde Proxmox)  
   - Cohérence au niveau du système de fichiers  
   - La récupération après crash PostgreSQL fonctionne dans plus de 99 % des cas  
   - Rapide et automatisée

2. **Sauvegarde logique** (pg_dumpall)  
   - Dump SQL de toutes les bases de données  
   - Restaurable sur différentes versions de PostgreSQL  
   - Couche de sécurité supplémentaire

### Configuration du dump PostgreSQL

**Dans le conteneur LXC PostgreSQL :**

```bash
# En root dans le conteneur
mkdir -p /var/backups/postgresql
chown postgres:postgres /var/backups/postgresql

# Configurer une tâche cron pour l’utilisateur postgres
crontab -e -u postgres

# Dump quotidien à 03:00 (après les sauvegardes Proxmox)
0 3 * * * pg_dumpall | gzip > /var/backups/postgresql/postgres-$(date +\%Y\%m\%d).sql.gz

# Suppression des dumps de plus de 7 jours
0 4 * * * find /var/backups/postgresql -name "postgres-*.sql.gz" -mtime +7 -delete
```

**Suivi des dumps :**

```bash
# Sur l’hôte Proxmox : lister les dumps dans le conteneur
pct exec <POSTGRES_VMID> -- ls -lh /var/backups/postgresql/

# Vérifier la taille et l’âge du dernier dump
pct exec <POSTGRES_VMID> -- bash -c 'ls -lh /var/backups/postgresql/*.gz | tail -1'
```

::: info Pourquoi pas de pg_backup_start/stop ?
Les versions récentes de PostgreSQL modifient fréquemment l’API de sauvegarde (par exemple `pg_start_backup` → `pg_backup_start` à partir de la v15). Les scripts de hook nécessitent une maintenance à chaque mise à jour de PostgreSQL. La combinaison snapshot + pg_dump est **sans maintenance** et **indépendante des versions**.
:::

### Scénarios de récupération PostgreSQL

| Scénario                | Probabilité | Action                             | Perte de données     |
|-------------------------|------------|------------------------------------|----------------------|
| Normal                  | ~99,5 %    | Restauration du snapshot → recovery crash | 0 seconde      |
| Problème de WAL         | ~0,4 %     | Restauration du snapshot → recovery depuis WAL | Secondes à minutes |
| Échec complet           | ~0,1 %     | Restauration du pg_dump            | Max. 1 jour          |

**Détecter une récupération après crash :**

```bash
# Après restauration, vérifier les logs PostgreSQL
pct exec <POSTGRES_VMID> -- tail -100 /var/log/postgresql/postgresql-*-main.log

# Messages typiques :
# LOG:  database system was interrupted; last known up at ...
# LOG:  database system was not properly shut down; automatic recovery in progress
# LOG:  redo starts at ...
# LOG:  database system is ready to accept connections
```

**Si la récupération du snapshot échoue :**

```bash
# Dans le conteneur PostgreSQL
# 1. Trouver le dernier dump
ls -lh /var/backups/postgresql/

# 2. Réinitialiser le cluster
pg_dropcluster --stop <VERSION> main
pg_createcluster <VERSION> main

# 3. Restaurer le dump
gunzip -c /var/backups/postgresql/postgres-YYYYMMDD.sql.gz | psql -U postgres

# Perte de données : au maximum une journée
```

## Tâches de maintenance

### Prune & garbage collection

#### Qu’est-ce que le prune ?

**Prune** supprime les anciens instantanés de sauvegarde selon la politique de rétention :
- Supprime les métadonnées et les références aux snapshots  
- Ne libère **pas** immédiatement l’espace disque  
- S’exécute automatiquement après les tâches de sauvegarde (Hetzner)  
- Nécessite une tâche séparée sur le PBS du home office (à cause de la sync)

#### Qu’est-ce que la garbage collection (GC) ?

La **GC** libère réellement l’espace disque :
- Supprime les blocs (chunks) non référencés par un snapshot  
- **Essentiel** pour récupérer de l’espace après un prune  
- S’exécute quotidiennement après les tâches de prune  
- Peut être gourmande en ressources (à éviter pendant les sauvegardes)

::: danger La GC est obligatoire
Sans GC, l’espace disque ne diminue pas même si les sauvegardes sont prunées. La GC doit **absolument** être exécutée régulièrement.
:::

**Flux :**

```
1. La tâche de sauvegarde crée un snapshot
2. Prune marque les anciens snapshots pour suppression
3. GC supprime les chunks non référencés
4. L’espace disque est libéré
```

#### Planifier les tâches de GC

**PBS Hetzner :**

```bash
# Interface : Datastore → Prune & GC → Schedule
Schedule : Daily 07:00
```

**PBS home office :**

```bash
# Interface : Datastore → Prune & GC → Schedule
Schedule : Daily 07:00
```

#### Lancer une GC manuellement

```bash
# Sur le PBS
proxmox-backup-manager garbage-collect <datastore-name>

# Ou via l’interface : Datastore → Content → Garbage Collection → Start GC
```

**Vérifier l’utilisation après GC :**

```bash
df -h /path/to/datastore

# Ou via l’interface : Datastore → Summary → Usage
```

### Tâches de vérification (Verify)

**Verify** vérifie l’intégrité des données sauvegardées :

- Vérifie les checksums des chunks  
- S’assure que les données ne sont pas corrompues  
- Garantit que les restaurations sont possibles  
- Journalise les problèmes éventuels

**Configuration :**

| PBS         | Planification | Profondeur | Raison                         |
|-------------|---------------|-----------:|--------------------------------|
| Hetzner     | Hebdomadaire  | Current    | Cache uniquement, coûteux     |
| Home office | Hebdomadaire  | All        | Archive long terme            |

**Mise en place :**

```bash
# Interface : Datastore → Verify Jobs → Add
Schedule : Weekly (dimanche 03:00 pour Hetzner, 04:00 pour home office)
```

**Consulter les logs de Verify :**

```bash
# Interface : Datastore → Verify Jobs → Task History

# Ou via CLI :
journalctl -u proxmox-backup.service | grep -i verify
```

## Scénarios de restauration

### Restauration d’une VM/LXC

**Via l’interface graphique :**

```
1. Proxmox Web UI → Storage → PBS → Content
2. Sélectionner la sauvegarde
3. “Restore” → choisir le nœud cible → Start
```

**Via CLI :**

```bash
# Restaurer un conteneur LXC
pct restore <NEW_VMID> <backup-path> --storage <storage>

# Restaurer une VM
qmrestore <backup-path> <NEW_VMID>
```

### Restauration de fichiers individuels

```bash
# Sur le PBS : monter une sauvegarde
proxmox-backup-client mount <snapshot> /mnt/backup

# Copier les fichiers
cp /mnt/backup/path/to/file /destination/

# Démonter
umount /mnt/backup
```

### Reprise après sinistre (perte complète du serveur)

#### Préparation

Documenter :

- Détails du serveur Hetzner (référence, adresses IP)  
- Empreintes des PBS (pour la configuration des stockages)  
- Configuration WireGuard (clés, endpoints)  
- Configuration réseau (VLAN, plages IP)

#### Étapes de reprise

**1. Réinstaller Proxmox :**

```bash
# Démarrer en mode rescue Hetzner
# Installer Proxmox VE (ISO ou Hetzner installimage)
```

**2. Configurer le réseau :**

```bash
# /etc/network/interfaces
# Bridges (vmbr0, vmbr1, vmbr2) comme dans l’architecture réseau

# Restaurer WireGuard
# /etc/wireguard/wg-kinglui.conf
```

**3. Ajouter le stockage PBS :**

```bash
# Sur le PBS du home office : récupérer l’empreinte
proxmox-backup-manager cert info

# Sur l’hôte Proxmox : ajouter le stockage
pvesm add pbs p2d2-pbs-homeoffice \
  --server <HOMEOFFICE_PBS_IP> \
  --datastore <DATASTORE> \
  --username <USER>@pbs \
  --fingerprint <PBS_FINGERPRINT>

# Vérifier le statut
pvesm status
```

**4. Restaurer les VM/LXC :**

```bash
# Lister les sauvegardes disponibles
pvesm list p2d2-pbs-homeoffice

# Restaurer d’abord la VM OPNsense (réseau)
qmrestore <backup-id> 120 --storage local-lvm

# Restaurer les conteneurs LXC
pct restore 110 <backup-id> --storage local-lvm  # PostgreSQL
pct restore 111 <backup-id> --storage local-lvm  # GeoServer
# etc.
```

**5. Vérifier le réseau :**

```bash
# Démarrer les VM/LXC
qm start 120       # OPNsense
pct start 110      # PostgreSQL

# Tester la connectivité
ping <INTERNAL_IPS>
```

::: tip Problèmes d’empreinte (fingerprint)
En cas d’erreur `fingerprint not verified, abort!` :

```bash
# Sur le PBS : récupérer la nouvelle empreinte
proxmox-backup-manager cert info

# Sur Proxmox : mettre à jour le stockage
pvesm set <STORAGE_NAME> --fingerprint '<NEW_FINGERPRINT>'
```
:::

## Types de sauvegardes

### Snapshots de conteneurs LXC

**Mode snapshot (par défaut) :**
- Rapide (quelques secondes)  
- Cohérent au niveau système de fichiers  
- Recommandé pour les conteneurs stateless (frontend, GeoServer, MapProxy)

**Mode stop :**
- Le conteneur est arrêté pendant la sauvegarde  
- Cohérence garantie  
- Temps d’indisponibilité plus long  
- À réserver aux systèmes critiques si nécessaire

### Snapshots de VM

**Mode snapshot :**
- L’agent invité QEMU crée un snapshot cohérent  
- La VM continue de tourner (court gel)  
- Recommandé pour OPNsense, serveur de tuiles OSM

**Mode stop :**
- La VM est arrêtée pendant la sauvegarde  
- Aucune incohérence d’exécution possible  
- Temps d’arrêt plus long

## Supervision & alertes

### Vérifier l’état des sauvegardes

**Sur l’hôte Proxmox :**

```bash
# Dernier état des sauvegardes
tail -50 /var/log/vzdump.log

# Tâches de sauvegarde actives
cat /var/log/pve/tasks/active
```

**Sur PBS :**

```bash
# Statut du datastore
proxmox-backup-manager status

# Utilisation du stockage
df -h /path/to/datastore
```

### Indicateurs clés

| Indicateur             | Seuil      | Action                                |
|------------------------|-----------:|---------------------------------------|
| Dernière sauvegarde OK | > 48 h     | Lancer une sauvegarde, vérifier logs  |
| Stockage PBS Hetzner   | > 85 %     | Réduire rétention ou lancer une GC    |
| Stockage PBS home office | > 70 %  | Étendre le stockage ou pruner         |
| Erreurs de verify      | > 0        | Refaire la sauvegarde, vérifier le PBS|
| Âge de la sync         | > 24 h     | Vérifier WireGuard, relancer la sync  |

### Notifications e-mail

```bash
# Proxmox : Datacenter → Notifications
# Configurer les mails pour :
# - sauvegardes échouées
# - erreurs de verify
# - espace disque faible
```

Sur PBS :

```bash
# Interface : Configuration → Notifications → Add
# Événements : Backup failed, Verify failed, Low disk space
```

## Sécurité

### Accès PBS

- **2FA activée** sur les deux PBS (Hetzner + home office)  
- **Identifiants non documentés**  
- **Utilisateurs distincts** pour les tâches de sauvegarde (pas `root@pam`)  
- Les empreintes PBS sont échangées par canaux sécurisés

### Sécurité WireGuard

- Ne jamais committer les clés privées dans Git  
- Rotation régulière des clés (recommandée : annuelle)  
- Règles de firewall : seul le port PBS est accessible via WireGuard  
- Surveiller les handshakes (`wg show`)

### Chiffrement

PBS supporte le **chiffrement côté client** :

```bash
# Générer une clé de chiffrement
proxmox-backup-client key create --kdf scrypt /root/backup-encryption.key

# Stocker la clé en lieu sûr (offline, chiffrée)

# Activer dans la tâche de backup
# Interface Proxmox : Datacenter → Backup → Edit → Encryption Key
```

**Compromis :**
- **Avantages :** protection si un PBS est compromis, meilleure conformité  
- **Inconvénients :** gestion des clés, restaurations plus lentes, perte de clé = perte de données  
- **Recommandation pour p2d2 :** non indispensable (sites séparés, 2FA)

## Dépannage

### Sauvegardes en échec

```bash
# 1. Vérifier les logs
tail -100 /var/log/vzdump.log

# 2. Vérifier la fingerprint
pvesm status | grep pbs

# 3. Accessibilité du PBS
ping <PBS_IP>
curl -k https://<PBS_IP>:****

# 4. Espace disque
# Interface PBS : Datastore → Summary → Usage
```

### Tâche de sync qui ne tourne pas

```bash
# 1. Vérifier WireGuard sur l’hôte Proxmox
wg show
ping <HOMEOFFICE_PBS_IP>

# 2. Vérifier le service WireGuard
systemctl status wg-quick@wg-kinglui

# 3. Vérifier les règles de firewall
# S’assurer que le port PBS est autorisé via WireGuard

# 4. Vérifier les identifiants PBS sur le PBS du home office
# Interface : Sync Jobs → Edit → Test connection
```

### L’espace disque ne diminue pas

```bash
# 1. Historique de prune
# Interface PBS : Datastore → Prune & GC → Task history

# 2. Lancer GC manuellement
proxmox-backup-manager garbage-collect <DATASTORE>

# 3. Vérifier la planification GC
# Interface : Datastore → Prune & GC → Schedule GC

# 4. Vérifier les logs
journalctl -u proxmox-backup.service -f
```

Causes typiques :
- Prune fonctionne, mais GC n’est pas configurée  
- GC s’exécute, mais beaucoup de chunks sont encore partagés (déduplication)  
- La rétention a changé, mais les anciens snapshots n’ont pas encore été prunés

### Le conteneur PostgreSQL ne démarre pas après restauration

```bash
# 1. Vérifier les logs PostgreSQL
pct exec <VMID> -- tail -100 /var/log/postgresql/*.log

# Exemple : "could not locate a valid checkpoint"
# → échec de la récupération après crash

# 2. Utiliser le pg_dump pour la restauration
pct exec <VMID> -- bash
cd /var/backups/postgresql
ls -lh  # trouver le dernier dump

# 3. Réinitialiser le cluster
pg_dropcluster --stop <VERSION> main
pg_createcluster <VERSION> main

# 4. Restaurer le dump
gunzip -c postgres-YYYYMMDD.sql.gz | psql -U postgres
```

### Instabilité WireGuard

```bash
# Sur l’hôte Proxmox
wg show

# Si "latest handshake" > 2 minutes :
ping <HOMEOFFICE_ENDPOINT_IP>

# Si DNS utilisé : essayer l’IP directe dans la config WG

# Redémarrer WireGuard
systemctl restart wg-quick@wg-kinglui

# Vérifier le firewall
iptables -L -n | grep <WG_PORT>
```

## Bonnes pratiques

1. **Tester les restaurations régulièrement** (trimestriel)  
   - Restaurer sur des VM/LXC de test  
   - Tester la restauration des dumps PostgreSQL  
   - Documenter le temps de reprise  

2. **Surveiller les tâches de vérification**  
   - Considérer les erreurs de verify comme critiques  
   - Recréer les sauvegardes concernées  

3. **Sauvegarder avant les changements**  
   - Avant les mises à jour  
   - Avant les changements de configuration majeurs  
   - Lancer une sauvegarde manuelle hors planification  

4. **Maintenir la documentation à jour**  
   - Après chaque changement de configuration  
   - Après modification matérielle  
   - En cas de changement de fingerprint PBS  

5. **Ne pas oublier la GC**  
   - Vérifier qu’une tâche GC automatique existe  
   - Lancer manuellement après modification de la rétention  
   - Surveiller l’utilisation du datastore  

6. **Surveiller la santé de WireGuard**  
   - Age du handshake, compteurs de paquets  
   - Crucial pour les sauvegardes hors site  

7. **Contrôler les dumps PostgreSQL**  
   - Vérifier la présence des dumps quotidiens  
   - Tester périodiquement une restauration complète dans un environnement de dev  

## Références

- Documentation Proxmox Backup Server  
- Proxmox VE Backup and Restore  
- Documentation WireGuard  
- PostgreSQL Backup and Recovery  
- Stratégie de sauvegarde 3-2-1
