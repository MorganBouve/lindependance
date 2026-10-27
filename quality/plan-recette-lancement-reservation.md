# Plan de recette avant mise en production — réservation en ligne

## Objectif

Suivre les vérifications restantes avant l'ouverture de la réservation en
ligne. La recette fonctionnelle initiale a été réalisée en préproduction le
26/10/2026. Ce plan ne vaut pas autorisation de tester ou de modifier la
production.

**Build/commit préproduction à relever avant chaque campagne :** `________`

**Testeur :** `________` · **Date :** `________` · **Navigateur/appareil :** `________`

## État déjà validé

- Création du salon de recette et activation de son premier compte ADMIN en
  préproduction ; le lien d'activation ne peut pas être réutilisé et le slug
  déjà pris est refusé. Voir `quality/recette-beta-admin.md` (ADM-25).
- Une réservation gratuite de 30 minutes avec un praticien a abouti ; elle
  est apparue dans le portail client et l'agenda staff. L'utilisateur a
  confirmé la réception de l'e-mail de confirmation et de l'invitation
  calendrier. Le rendez-vous a ensuite été supprimé. Voir
  `quality/recette-beta-customer.md`.
- Aucune recette ni modification n'a été réalisée en production.

## Tableau de suivi

| Contrôle | Environnement | Priorité | État au 26/10/2026 | Dernière exécution / preuve | Critère de sortie |
|---|---|---:|---|---|---|
| Livraison et renouvellement du code e-mail | Préproduction | Bloquant | PARTIEL | 26/10 — sur le premier profil, codes indépendant et de remplacement reçus en moins de 2 min ; ancien refusé, nouveau accepté. Sur le second profil, le testeur n'a pas reçu le code ; la correspondance exacte de l'adresse staff avec la boîte surveillée reste à confirmer. | Le code arrive de façon répétable ; un code expiré ou remplacé est refusé et le dernier code valide permet la connexion. |
| Information pour un premier rendez-vous | Préproduction | Important | PASS | 26/10 — après actualisation du portail sans session, la consigne apparaît avant le champ e-mail ; le contact téléphonique du salon est visible. | La consigne est visible sans session, indique d'appeler si un téléphone est configuré et reste indépendante de l'adresse saisie. |
| Deux clients réservent le même créneau | Préproduction | Bloquant | BLOQUÉ | 26/10 — second profil créé, mais impossible de poursuivre sans OTP reçu ; aucune réservation concurrente soumise. | Une seule réservation est confirmée ; l'autre reçoit un refus clair et le créneau n'est pas dupliqué dans l'agenda. |
| Choix de prestations, praticiens et horaires | Préproduction | Important | PARTIEL | 26/10 — un service et un praticien testés ; choix multiples restant à tester. | Les choix disponibles sont corrects ; la durée tient dans les horaires d'ouverture et les indisponibilités sont respectées. |
| Limite de réservation à 60 jours | Préproduction | Important | PARTIEL | Tests automatisés de borne disponibles ; vérification manuelle du calendrier à faire. | Les tests automatisés couvrent la borne et son refus côté API ; la vérification manuelle du calendrier reste à faire. |
| Import de l'invitation calendrier | Préproduction | Important | PARTIEL | 26/10 — invitation reçue ; import non vérifié. | L'événement importé a le bon salon, service, praticien et horaire, sans créer de réservation supplémentaire. |
| Domaine dédié et identité du nouveau salon | Préproduction | Bloquant pour l'ouverture publique | PARTIEL | 26/10 — lien direct par slug vérifié ; domaine dédié non testé. | Le domaine choisi ouvre le bon salon, avec son identité, sans exposer les données d'un autre salon. |
| Vérification de mise en production | Production | Bloquant | EN ATTENTE D'AUTORISATION | Aucun test de production réalisé. | Configuration validée puis smoke test contrôlé réussi et données de recette nettoyées. |

Mettre à jour l'état, la date et la preuve expurgée après chaque exécution.
Ne jamais consigner de code OTP, mot de passe, adresse e-mail personnelle ou
autre donnée client dans ce fichier.

## Procédures restantes

### 1. Vérifier la livraison des codes e-mail

**Préparation :** utiliser uniquement une boîte contrôlée par l'équipe et le
profil client de recette du salon. Le testeur/staff vérifie dans la fiche
client que l'adresse de recette est enregistrée, sans exposer cette
vérification au client. Ne pas copier le code dans le compte rendu.

1. Demander un code et noter l'heure de la demande puis l'heure de réception.
2. Avant son expiration, demander un code de remplacement sans utiliser le
   premier.
3. Vérifier que le premier code est refusé, puis entrer le code de remplacement
   directement dans le navigateur et confirmer l'accès à l'espace client.
4. Dans une nouvelle session client, demander un autre code indépendant,
   noter le délai de réception et confirmer qu'il permet aussi la connexion.
   Respecter les limites de demandes de l'environnement.

**Succès :** le code remplacé est refusé ; le code de remplacement et un code
indépendant sont reçus sans délai empêchant leur utilisation et permettent la
connexion. **Résultat du 26/10/2026 : PARTIEL** — sur le premier profil, les
deux codes ont été reçus en moins de 2 minutes ; le premier a été refusé après
remplacement et le nouveau a permis la vérification. Un premier essai plus tôt
dans la recette avait été retardé ; ce délai ne s'est pas reproduit. Une
demande sur le second profil a été acceptée par la page, mais aucun code n'a
été reçu. L'adresse est enregistrée côté staff ; sa correspondance avec la
boîte surveillée et le dossier de livraison restent à vérifier. Aucun autre
renvoi n'a été fait afin d'éviter les quotas. Si un code n'arrive pas, noter
les heures et faire vérifier la livraison côté fournisseur e-mail.

### 2. Vérifier la protection contre les doubles réservations

**Préparation :** choisir un créneau libre en préproduction et ouvrir le même
salon, service, praticien et créneau dans deux sessions client isolées.

1. Soumettre les deux réservations presque simultanément.
2. Vérifier le résultat des deux pages et l'agenda staff.
3. Actualiser les disponibilités et rechercher une éventuelle deuxième
   réservation au même horaire.

**Succès :** une seule réservation existe ; la seconde est refusée avec un
message compréhensible et le créneau n'apparaît plus disponible.

### 3. Vérifier les choix et la durée des créneaux

**Préparation :** disposer de deux prestations de durées différentes, de deux
praticiens actifs et d'un praticien inactif, dans un salon de recette.

1. Vérifier que chaque prestation et chaque praticien actif est proposé.
2. Vérifier qu'un praticien inactif n'est pas proposé.
3. Comparer les créneaux proposés pour les deux durées, y compris près de
   l'ouverture et de la fermeture.
4. Vérifier qu'une indisponibilité et un rendez-vous existant retirent le
   créneau concerné.

**Succès :** seuls les choix actifs sont proposés et chaque créneau respecte
la durée, les heures d'ouverture et les indisponibilités.

### 4. Vérifier la fenêtre de 60 jours

1. Dans le calendrier client, vérifier que la date située à 60 jours peut être
   sélectionnée selon la règle configurée et qu'aucune date ultérieure n'est
   proposée.
2. Confirmer avec l'équipe technique que les tests automatisés de la borne
   exacte et du refus au-delà de la limite passent sur le commit testé.

**Succès :** borne exacte conforme à la règle produit, refus au-delà de
60 jours. Ne pas créer de rendez-vous inutile pour vérifier une date.

### 5. Vérifier l'invitation calendrier

**Préparation :** créer une nouvelle réservation de recette et conserver le
rendez-vous jusqu'à la fin de cette vérification.

1. Ouvrir l'invitation reçue dans une application d'agenda de test.
2. Vérifier le salon, la prestation, le praticien, la date, les heures de
   début et de fin.
3. Vérifier que l'import ne crée pas un second rendez-vous dans l'agenda staff
   ou le portail client.
4. Supprimer ensuite le rendez-vous de recette et vérifier qu'il n'est plus
   présent dans les deux interfaces.

**Succès :** invitation correcte, aucun doublon de réservation, rendez-vous
de recette nettoyé.

### 6. Vérifier le domaine et l'identité du salon

Le domaine `testing.osezletre.fr` est déjà associé à Osez l'Etre : **ne pas
modifier cette association pour cette recette**. Utiliser un domaine de test
dédié au nouveau salon, configuré en préproduction par un TECH_ADMIN.

1. Ouvrir le domaine dédié et le lien direct du portail.
2. Vérifier que les deux affichent le bon salon, son identité et ses
   coordonnées publiques.
3. Actualiser la page et vérifier que le salon reste le même.
4. Vérifier qu'aucune information d'un autre salon n'est visible.

**Succès :** le domaine et le lien direct ouvrent le même salon ; identité et
isolation correctes. Si aucun domaine de test dédié n'est disponible, laisser
ce contrôle BLOQUÉ plutôt que de repointer le domaine partagé.

### 7. Vérifier la production après autorisation explicite

Cette étape est conditionnelle. Ne pas la lancer avant accord explicite et
confirmation par l'équipe qu'un compte, une boîte e-mail et un salon de recette
en production sont autorisés.

1. Vérifier le déploiement, le domaine, les réglages e-mail et les migrations
   avec l'équipe technique.
2. Avec le compte de recette autorisé, vérifier l'accès public, demander un
   code e-mail et confirmer la connexion.
3. Effectuer une seule réservation de test sur un créneau convenu, confirmer
   l'e-mail et l'invitation, puis vérifier le rendez-vous dans les interfaces.
4. Supprimer le rendez-vous de test et confirmer le nettoyage.

**Succès :** configuration et parcours contrôlé validés, sans donnée de client
réel ; rendez-vous de recette supprimé. En cas d'échec, arrêter la campagne et
ne pas poursuivre l'ouverture publique.

## Décision de lancement

- **NO-GO immédiat :** fuite inter-salons, double réservation, mauvais salon
  servi par le domaine public, ou impossibilité répétée d'accéder au portail
  par OTP.
- **GO pilote limité :** tous les contrôles bloquants passent, aucun incident
  de sécurité ou de double réservation n'est observé, et la configuration
  domaine/e-mail de production a été vérifiée par l'équipe responsable.
- **GO ouverture générale :** contrôles bloquants et importants passés, ou
  éventuel écart restant explicitement accepté et documenté par le responsable
  produit.
