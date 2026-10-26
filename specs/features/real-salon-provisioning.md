# Feature — Créer un salon réel et son premier ADMIN

## Objectif

Permettre à un `TECH_ADMIN` de créer un salon réel depuis l'écran de gestion,
sans intervention manuelle dans la base. Chaque déploiement écrit uniquement
dans la base configurée pour ce déploiement.

## Parcours et données

- L'écran `/test-salons` devient l'écran de gestion des salons et reste
  accessible en préproduction comme en production aux seuls `TECH_ADMIN`.
- Le formulaire demande le nom du salon, un slug unique et l'adresse e-mail
  du premier `ADMIN`. L'e-mail de contact et le téléphone sont facultatifs.
- Le formulaire confirme explicitement que l'adresse du premier ADMIN est
  contrôlée et autorise l'envoi du lien d'activation.
- Le salon et son premier compte `ADMIN` sans mot de passe sont créés dans une
  même transaction. Le rattachement de l'utilisateur est choisi côté serveur.
- Le portail client reste désactivé (`portalEnabled: false`) jusqu'à sa
  configuration par l'ADMIN.
- Après la transaction, le parcours d'activation existant envoie un lien
  aléatoire à usage unique valable une heure. Si l'envoi échoue, le salon et
  le compte restent créés ; l'interface le signale sans révéler de secret.
- Le provisionnement synthétique et l'ajout d'un ADMIN à un salon déjà créé
  restent des outils distincts, uniquement sur l'aperçu Vercel de la branche
  `preprod`.

## API et sécurité

- `POST /api/tech-admin/organizations` accepte uniquement les champs du
  formulaire validés par Zod ; les champs inattendus, dont `organizationId`
  et `role`, sont refusés.
- La route et le service vérifient le rôle `TECH_ADMIN`. Aucun identifiant
  d'organisation ni rôle n'est choisi par le navigateur.
- Les slugs sont normalisés en minuscules et leur unicité est vérifiée dans la
  base de données du déploiement courant.
- La réponse est privée, sans cache, et ne contient ni jeton ni mot de passe.
- Les tests automatisés simulent Prisma et le fournisseur d'e-mail ; ils ne
  créent aucune donnée dans les bases de préproduction ou de production et
  n'envoient aucun e-mail réel.

## Critères d'acceptation

1. Un visiteur non authentifié ou un compte sans rôle `TECH_ADMIN` ne peut pas
   afficher l'écran de gestion ni créer un salon.
2. Un `TECH_ADMIN` peut créer un salon avec un nom, un slug et un e-mail ADMIN
   valides ; les contacts facultatifs peuvent être omis.
3. Un slug ou un e-mail ADMIN déjà utilisé est refusé explicitement sans
   laisser de salon partiellement créé ni envoyer d'invitation.
4. Le salon et son ADMIN sont enregistrés dans la même transaction ; le compte
   n'a pas de mot de passe et appartient à l'organisation créée.
5. Le portail est désactivé à la création et les coordonnées facultatives sont
   enregistrées.
6. Un lien d'activation à usage unique d'une heure est envoyé après confirmation
   de contrôle de la boîte ; aucun secret ne figure dans la réponse.
7. Une erreur d'envoi est visible et ne supprime pas le salon ni le compte.
8. La création réelle est disponible en préproduction et en production ; les
   outils de provisionnement synthétique restent limités à l'aperçu `preprod`.
