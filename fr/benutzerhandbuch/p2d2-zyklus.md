---
quality:
  completeness: 90
  accuracy: 90
  reviewed: true
  reviewer: Peter König (=> AI-Translation)
  reviewDate: 2025-11-24
---

# Le Cycle p2d2

Le cycle p2d2 décrit le flux de données bidirectionnel entre l'administration, le portail OpenData, la communauté p2d2 et les plateformes publiques de données. Le processus se compose de **9 étapes** :

![Cycle p2d2 - Flux de Données Bidirectionnel](../assets/p2d2-zyklus.svg)
*Figure : Le cycle p2d2 visualise le flux de données bidirectionnel entre l'administration, la communauté p2d2 et les plateformes publiques*

## 1. L'Administration Crée des Données

Le personnel administratif collecte et maintient des données dans des **systèmes spécialisés** :

- Logiciel de gestion des cimetières
- Systèmes SIG de l'administration
- Bases de données spécialisées

**Exemple** : Un nouveau cimetière est créé dans le SIG municipal.

## 2. Publication Automatisée

Les données sont **automatiquement** publiées dans le **portail OpenData** de la municipalité :

- Exportation depuis les systèmes spécialisés
- Transformation en formats OpenData (ex. : GeoJSON, CSV)
- Mise à disposition via l'API du portail

**Exemple** : Les données des cimetières apparaissent mises à jour quotidiennement sur offenedaten-koeln.de.

## 3. p2d2 Reprend les Données

p2d2 **importe** automatiquement les données depuis le portail OpenData :

- Synchronisation régulière (ex. : quotidienne)
- Transformation en modèle de données unifié
- Stockage dans la base de données PostGIS

**Exemple** : Les nouveaux cimetières sont automatiquement chargés dans p2d2.

## 4. Les Utilisateurs Modifient les Données

**Les utilisateurs de p2d2** vérifient et améliorent les données :

- Correction des géométries (limites, entrées)
- Ajout d'attributs manquants
- Ajout de photos ou descriptions
- Marquage pour l'assurance qualité

**Exemple** : Un utilisateur corrige l'entrée du cimetière et ajoute les heures d'ouverture.

## 5. La Communauté Vérifie la Qualité

La **communauté p2d2** examine les modifications :

- Révision par des utilisateurs expérimentés
- Vérification de l'exhaustivité et de la cohérence
- Approbation pour l'importation en masse dans OSM/WikiData
- Ou : Rejet avec justification

**Exemple** : Un modérateur de la communauté examine les modifications et les approuve.

## 6. Transfert Automatisé

Après approbation, les données sont **automatiquement transférées** :

- **OpenStreetMap** : Via OSM-API ou JOSM
- **WikiData** : Via WikiData-API
- **Autres plateformes** : Selon la configuration

**Exemple** : Le cimetière corrigé est importé dans OSM.

## 7. Les Modifications Déclenchent une Notification

Les modifications des données dans les plateformes publiques déclenchent des **notifications** :

- Les changesets OSM sont surveillés
- Les modifications WikiData sont suivies
- Le service spécialisé reçoit une notification

**Exemple** : L'administration du cimetière est informée de la modification OSM.

## 8. L'Administration Examine la Modification

**Le personnel administratif** examine la modification :

- Vérification de l'exactitude
- Décision : Adopter ou rejeter
- Si adopté : Mise à jour dans le système spécialisé

**Exemple** : L'administration adopte les heures d'ouverture corrigées.

## 9. Boucle Complète : Données Améliorées

Les **données améliorées** sont maintenant disponibles pour tous :

- Le système spécialisé a des données actuelles
- Le portail OpenData est mis à jour
- p2d2 synchronise les modifications
- OSM/WikiData ont des données de qualité garantie

**Exemple** : Le cimetière est maintenant correctement et actuellement enregistré dans tous les systèmes.

---

## Avantages du Cycle

- **Bidirectionnalité** : Les données circulent dans les deux sens
- **Assurance Qualité** : La communauté et l'administration vérifient ensemble
- **Actualité** : Les modifications sont adoptées rapidement
- **Transparence** : Toutes les étapes sont traçables
- **Efficacité** : Plus de travail en double

## Mise en Œuvre Technique

Le cycle est rendu possible par divers composants :

- **Automatisation** : Cronjobs, webhooks, APIs
- **Versioning** : Historique des modifications similaire à Git
- **Notifications** : E-mail, RSS, webhooks
- **Interfaces** : REST-APIs, services OGC

::: tip
Le cycle p2d2 est le cœur de l'application et distingue p2d2 des outils de collecte de données purs.
:::
