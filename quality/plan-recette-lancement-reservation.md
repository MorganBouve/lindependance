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

| Contrôle | Environnement | Priorité | État au 30/10/2026 | Dernière exécution / preuve | Critère de sortie |
|---|---|---:|---|---|---|
| Livraison et renouvellement du code e-mail | Préproduction | Bloquant | PASS | 26/10 — sur le profil initial, codes indépendant et de remplacement reçus en moins de 2 min ; ancien refusé, nouveau accepté. 27/10 — après confirmation que l'adresse du second profil correspond à la boîte surveillée et vérification des indésirables, un nouveau code est arrivé et a permis l'authentification. 30/10 — CUS-05 : modèles OTP personnalisé et par défaut reçus dans les deux organisations ; codes acceptés. Le modèle temporaire du Salon recette réel a été restauré après le test. | Le code arrive de façon répétable ; un code expiré ou remplacé est refusé et le dernier code valide permet la connexion. |
| Information pour un premier rendez-vous | Préproduction | Important | PASS | 26/10 — après actualisation du portail sans session, la consigne apparaît avant le champ e-mail ; le contact téléphonique du salon est visible. | La consigne est visible sans session, indique d'appeler si un téléphone est configuré et reste indépendante de l'adresse saisie. |
| Deux clients réservent le même créneau | Préproduction | Bloquant | PASS | 27/10 — deux comptes distincts ont soumis presque simultanément le service de test du 27/10 à 15 h 30 chez le même praticien ; un rendez-vous confirmé, l'autre refusé (« créneau plus disponible »). L'agenda staff n'affichait qu'un rendez-vous ; l'autre compte n'en affichait aucun. Le rendez-vous de recette a été supprimé et les deux portails vérifiés sans rendez-vous à venir. | Une seule réservation est confirmée ; l'autre reçoit un refus clair et le créneau n'est pas dupliqué dans l'agenda. |
| Même client, même créneau, deux praticiens | Préproduction | Bloquant | PASS | 27/10 — deux sessions du même compte client ont soumis le même service, la même date et 15 h 30 avec Morgan Bouve et Praticien Recette ; une réservation confirmée, l'autre refusée (« cette fiche client a déjà un rendez-vous sur ce créneau »). Un seul rendez-vous figurait dans l'agenda. Il a été supprimé et les deux sessions client vérifiées sans rendez-vous à venir. Le praticien fictif ajouté pour le test a ensuite été désactivé. | Une seule réservation du même client est possible sur le même horaire, même si deux praticiens distincts sont choisis simultanément. |
| Choix de prestations, praticiens et horaires | Préproduction | Important | PASS | 27/10 — après actualisation, le praticien de recette désactivé n'est plus proposé ; avec un seul praticien actif, le sélecteur est masqué. Les prestations de 30 et 60 min proposaient respectivement un dernier départ à 16:30 et 16:00 pour une fermeture à 17:00. Un blocage de 09:00 à 09:30 a retiré le départ de 09:00 ; après suppression du blocage, 09:00 est réapparu. La prestation temporaire a été supprimée ; le portail actualisé n'affiche plus que « Prestation test — 30 min ». | Les choix disponibles sont corrects ; la durée tient dans les horaires d'ouverture et les indisponibilités sont respectées. |
| Limite de réservation à 60 jours | Préproduction | Important | PASS | 27/10 — le calendrier accepte le 26/12 (60 jours après le 27/10) et affiche des créneaux ; le 27/12 affiche « Date hors de la période de réservation » et est invalide. Les 26 tests de domaine, service et API ciblés passent. Aucun rendez-vous n'a été conservé pour ce contrôle. | La borne exacte est sélectionnable ; toute date ultérieure est refusée côté calendrier et API. |
| Import de l'invitation calendrier | Préproduction | Important | PASS | 27/10 — l'utilisateur a importé l'invitation de recette et confirmé les bons salon, prestation, praticien et horaire (26/12/2026, 09:00–09:30). Le rendez-vous est apparu une seule fois dans le portail et l'agenda staff ; il a été supprimé après vérification, puis son absence a été confirmée dans les deux interfaces. | L'événement importé a le bon salon, service, praticien et horaire, sans créer de réservation supplémentaire. |
| Confirmation e-mail dans deux organisations | Préproduction | Important | PASS | 26–27/10 — l'e-mail et l'invitation du salon de recette ont été reçus et vérifiés. Pour Osez l'Etre, l'utilisateur a confirmé la réception du message par défaut avec le bon salon, la prestation, la date, l'horaire et le fuseau. Le rendez-vous test a été supprimé par le staff ; après actualisation, aucun rendez-vous à venir ne figurait dans le portail client. | Vérifier les deux messages dans une boîte contrôlée et autorisée, avec le bon salon, la prestation et l'horaire ; confirmer le texte par défaut de la seconde organisation. |
| Visibilité de l'agenda après annulation | Préproduction | Important | PASS | 28/10 — après actualisation, le rendez-vous QA annulé du 29/10 à 14 h restait absent et un rendez-vous QA actif du 29/10 à 09 h restait visible. Le rendez-vous créé pour ce contrôle a ensuite été supprimé ; son absence a été confirmée dans l'agenda et le portail client. | Les rendez-vous annulés sont masqués sans masquer les rendez-vous actifs. |
| Cloisonnement inter-salon des demandes staff | Préproduction | Bloquant | PASS | 28/10 — deux demandes QA distinctes : le staff du Salon recette réel n'a vu que sa demande et le staff d'Osez l'Etre uniquement la sienne. Demandes refusées, rendez-vous temporaires supprimés et adresses e-mail de recette retirées des fiches ; agendas et portails vérifiés après nettoyage. | Chaque compte staff ne voit que les demandes de son organisation. |
| E-mail d'annulation et retrait calendrier | Préproduction | Important | PASS | 28/10 — l'utilisateur a confirmé la réception des e-mails après annulation par le client et suppression par le salon, ainsi que le retrait des événements via les pièces jointes calendrier. Pour un rendez-vous QA non payé à moins de 24 h, le portail refusait l'annulation et l'utilisateur a confirmé qu'aucun e-mail d'annulation n'avait été reçu. | Annuler un rendez-vous client et en supprimer un autre depuis l'agenda staff ; vérifier les deux messages et l'import de l'annulation `.ics` sur l'événement existant ; confirmer l'absence d'e-mail lors d'une annulation refusée. |
| Alias stable de préproduction | Préproduction | Important | BLOQUÉ | 28/10 — `https://lindependance-testing.vercel.app/` renvoie une 404 Vercel `DEPLOYMENT_NOT_FOUND` ; aucun rattachement distant n'a été modifié. | L'alias ouvre le déploiement Preview courant de `preprod` et suit ses mises à jour sans affecter Production. |
| Domaine dédié et identité du nouveau salon | Préproduction | Bloquant pour l'ouverture publique | BLOQUÉ | 27/10 — aucun domaine dédié au salon de recette n'est disponible pour le test. `testing.osezletre.fr` est partagé et associé à Osez l'Etre ; cette association n'a pas été modifiée. | Le domaine choisi ouvre le bon salon, avec son identité, sans exposer les données d'un autre salon. |
| Vérification de mise en production | Production | Bloquant | EN ATTENTE D'AUTORISATION | Aucun test de production réalisé. | Configuration validée puis smoke test contrôlé réussi et données de recette nettoyées. |

**Précision du 28/10 :** l'absence d'e-mail après le refus client a été
confirmée avant le nettoyage ; l'e-mail d'annulation reçu ensuite faisait
suite à la suppression du rendez-vous test par le staff.

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
connexion. **Résultat au 27/10/2026 : PASS** — sur le premier profil, deux
codes ont été reçus en moins de 2 minutes ; le premier a été refusé après
remplacement et le nouveau a permis la vérification. Le 27/10, après
confirmation de la boîte de recette associée au second profil et vérification
des indésirables, un code indépendant est arrivé et a permis l'authentification.
Aucun code ni adresse n'est consigné ici.

### 2. Vérifier la protection contre les doubles réservations

**Préparation :** choisir un créneau libre en préproduction et ouvrir le même
salon, service, praticien, date et créneau dans deux comptes client distincts
et deux sessions isolées.

1. Soumettre les deux réservations presque simultanément.
2. Vérifier le résultat des deux pages et l'agenda staff.
3. Actualiser les disponibilités et rechercher une éventuelle deuxième
   réservation au même horaire.

**Succès :** une seule réservation existe ; l'autre tentative est refusée avec
un message compréhensible et aucun doublon n'apparaît dans l'agenda.

**Résultats du 27/10/2026 : PASS**

- Deux comptes clients distincts, même créneau et même praticien : une
  réservation a été confirmée ; l'autre compte a reçu « Time slot is no longer
  available ». L'agenda staff n'affichait qu'un rendez-vous et le second compte
  n'en affichait aucun.
- Même compte client dans deux sessions, même créneau avec deux praticiens
  distincts : une réservation a été confirmée ; l'autre session a reçu
  « Cette fiche client a déjà un rendez-vous sur ce créneau ». Un seul
  rendez-vous figurait dans l'agenda.

Les deux rendez-vous acceptés ont été supprimés depuis l'agenda staff. Après
actualisation, aucun rendez-vous à venir ne figurait dans les espaces clients
concernés ni dans l'agenda staff. Le praticien fictif créé pour le second test
a été désactivé après vérification.

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

### 6. Vérifier les e-mails de confirmation dans deux organisations

Utiliser uniquement une boîte de recette contrôlée et explicitement autorisée
pour chaque organisation. Ne pas utiliser une adresse client réelle ni
l'adresse publique de contact du salon.

1. Réserver dans `ORG-A` et `ORG-B` avec les profils de recette associés à la
   boîte autorisée.
2. Vérifier la réception des deux e-mails, le nom du salon, la prestation, la
   date et l'horaire ; confirmer que `ORG-A` utilise son message personnalisé
   et que `ORG-B` utilise le texte par défaut.
3. Vérifier l'invitation calendrier de `ORG-A` et l'absence de doublon.
4. Supprimer les rendez-vous de recette et vérifier leur absence dans le
   portail et l'agenda staff.

**Succès :** les deux messages correspondent à leur organisation, l'invitation
est correcte et les rendez-vous de recette sont nettoyés. **Résultat au
27/10/2026 : PASS** — la boîte de recette a reçu le message par défaut de
`ORG-B` avec les bonnes informations ; le rendez-vous test a été supprimé par
le staff et son absence vérifiée dans le portail client après actualisation.

### Vérifier les e-mails d'annulation et le retrait du calendrier

Utiliser une boîte de recette autorisée. Ne pas supprimer ni annuler un
rendez-vous de client réel.

1. Réserver un rendez-vous futur dans le portail et importer son invitation
   initiale dans un agenda de test.
2. Annuler ce rendez-vous depuis le portail client. Vérifier l'e-mail reçu et
   importer la pièce jointe `.ics` ; elle doit retirer le même rendez-vous,
   avec le même UID et une séquence supérieure.
3. Créer un second rendez-vous futur de recette, puis le supprimer depuis
   l'agenda staff. Vérifier l'e-mail et le retrait de l'événement calendrier.
4. Si l'adresse du client est absente, vérifier que le rendez-vous reste
   supprimé et qu'un avertissement est affiché au staff. Vérifier qu'une
   annulation refusée n'envoie pas d'e-mail.
5. Confirmer l'absence des rendez-vous de recette dans le portail et l'agenda.

**Succès :** le client est averti pour les deux parcours ; l'annulation
calendrier retire l'événement initial, sans créer de rendez-vous ni doublon.
En cas d'échec du fournisseur, le rendez-vous reste annulé et un avertissement
est visible.

### 7. Vérifier le domaine et l'identité du salon

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

### 8. Passage en production — plan opérationnel multi-outils

**État au 30/10/2026 :** les principaux parcours fonctionnels sont validés en
préproduction. L'alias stable Preview est en panne, mais cela ne bloque pas à
lui seul la production. La configuration de production, l'état de sa base et
le smoke test n'ont pas encore été vérifiés. Aucun test ni changement de
configuration n'a été effectué en production.

Avant de commencer, définir le périmètre : pilote pour les salons déjà
configurés ou ouverture publique du nouveau salon de recette. Pour ce dernier,
le domaine dédié reste un prérequis ; ne pas réassocier
`testing.osezletre.fr`, déjà utilisé par Osez l'Être. Les étapes ci-dessous ne
valent pas autorisation d'accéder à la production, d'y appliquer une migration
ou d'y créer un rendez-vous.

#### 8.1 GitHub — choisir et contrôler le candidat

- [ ] Identifier le commit de `preprod` qui doit être publié et vérifier que
  les contrôles CI correspondants sont verts : `CI / Lint, typecheck, test,
  and build`.
- [ ] Vérifier le diff complet entre `preprod` et `main` : seuls les changements
  attendus pour la réservation doivent être inclus.
- [ ] Préparer une PR de `preprod` vers `main`. Vérifier le contrôle
  `Main promotion source / Only preprod may target main` et la protection de
  `main` ; ne pas pousser directement sur `main`.
- [ ] Ne pas fusionner la PR tant que les vérifications Vercel, Neon et e-mail
  ci-dessous ne sont pas prêtes. Ne pas utiliser le workflow historique
  `Promote Preview to Production`.

#### 8.2 Vercel — vérifier Production sans toucher à Preview

- [ ] Dans le projet Vercel, vérifier que `main` est la branche Production et
  que `preprod` reste la branche Preview.
- [ ] Vérifier le domaine de production, son certificat HTTPS et le bon
  rattachement au déploiement Production. Ne pas utiliser l'URL Preview comme
  domaine public de production.
- [ ] Vérifier dans l'environnement **Production** les variables nécessaires,
  sans copier leur valeur dans un ticket ou un chat : `DATABASE_URL` (URL Neon
  pooler), `DIRECT_URL` (connexion directe aux migrations),
  `NEXTAUTH_SECRET`, `RESEND_API_KEY` et `RESEND_FROM`. Vérifier également
  les éventuels secrets et URL Auth configurés pour le projet ; ils doivent
  correspondre à Production et être distincts des valeurs Preview.
- [ ] Confirmer que le déploiement de Production correspondra au commit retenu
  dans la PR. Le défaut de `lindependance-testing.vercel.app` reste à traiter
  séparément comme incident Preview.

#### 8.3 Neon — sauvegarder, vérifier et appliquer les migrations si nécessaire

- [ ] Avec l'opérateur autorisé, confirmer dans Neon le projet, la branche et
  la base **production** ; créer ou confirmer une sauvegarde avant toute
  migration.
- [ ] Depuis un environnement sécurisé configuré pour Production, exécuter
  `pnpm exec prisma migrate status`. Si la cible est incertaine, une migration
  est en échec ou la liste est inattendue, arrêter et diagnostiquer.
- [ ] Relire chaque migration en attente et confirmer qu'elle est prévue pour
  ce déploiement. Après sauvegarde et autorisation opérationnelle, appliquer
  uniquement avec `pnpm exec prisma migrate deploy`, puis vérifier à nouveau
  avec `pnpm exec prisma migrate status`.
- [ ] Ne jamais exécuter sur Production `migrate dev`, `prisma db push`,
  `migrate reset` ou un seed. Suivre `documentation/migrations-manuelles.md` ;
  ne jamais transmettre les URL ou mots de passe de base dans le chat.

#### 8.4 Resend — confirmer l'envoi d'e-mails de production

- [ ] Vérifier dans Resend que le domaine et l'expéditeur utilisés en
  Production sont autorisés et opérationnels.
- [ ] Confirmer que la clé `RESEND_API_KEY` de Production appartient au bon
  environnement et que `RESEND_FROM` correspond à l'expéditeur vérifié.
- [ ] Conserver les limites OTP standard de Production : 3 demandes par
  adresse sur 15 minutes et 10 demandes par IP sur une heure. Ne pas relever
  les quotas pour la recette.

#### 8.5 Promotion — déployer `main`

- [ ] Une fois les prérequis confirmés, obtenir l'approbation requise et
  fusionner la PR `preprod` vers `main` selon la protection de branche.
- [ ] Dans Vercel, vérifier que le déploiement Production s'est terminé sans
  erreur et qu'il utilise le commit attendu. En cas d'échec, arrêter le test
  et faire diagnostiquer le déploiement avant toute nouvelle tentative.

#### 8.6 Smoke test — uniquement après autorisation explicite

Ne pas lancer cette étape sans accord explicite et confirmation qu'un compte,
une boîte e-mail, un salon et un créneau de recette **en production** sont
autorisés. Ne jamais utiliser un compte ou un rendez-vous client réel.

1. Ouvrir le domaine de production et vérifier que le bon salon et ses
   coordonnées s'affichent.
2. Avec le compte et la boîte autorisés, demander un seul code OTP et confirmer
   sa réception puis la connexion. Ne pas copier le code dans le compte rendu.
3. Créer une seule réservation sur le créneau convenu ; vérifier l'e-mail de
   confirmation, l'invitation calendrier et la présence du rendez-vous dans
   le portail client et l'agenda staff.
4. Supprimer le rendez-vous de recette et vérifier son absence dans les deux
   interfaces. Ne pas répéter le test si une étape échoue : arrêter et
   diagnostiquer.

**Critère de sortie :** déploiement du commit attendu, configuration et base
vérifiées, e-mail et parcours contrôlé réussis, rendez-vous de recette nettoyé.
Consigner uniquement une preuve expurgée, sans secret, adresse ni code OTP.

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
