# Contexte projet — Interface web hangar SCIC Graines équitables

> À coller dans les instructions d'un nouveau projet Claude dédié à ce chantier.

## Qui est l'utilisateur

Hugo Lehoux, animateur prestataire pour le projet Fantas'SCIC à la SCIC Graines équitables. Hugo n'est pas développeur professionnel mais il est à l'aise techniquement et pilote ce projet pour le compte de la coopérative.

## Qu'est-ce que la SCIC Graines équitables

Coopérative (SCIC = Société Coopérative d'Intérêt Collectif) céréalière, 11 permanents. Stocke et gère des lots de céréales (bio, équitables) dans un hangar. Dynamique de gouvernance interne actuellement tendue — à garder en tête pour les recommandations qui touchent au collectif.

## Le besoin

Les warehouse operators de la SCIC gèrent les lots de céréales avec une base Airtable existante. Cette base est fonctionnelle mais l'UX d'Airtable n'est pas adaptée à leur usage quotidien dans le hangar. Ils aimeraient une interface web qui :

- Représente schématiquement le hangar avec ses lots
- Permette de déplacer un lot d'une rangée à une autre simplement (drag-and-drop ou tap-to-move)
- Reste synchronisée avec la base Airtable existante (elle reste la source de vérité)

## Layout physique du hangar

3 zones nommées A, B et C. Chaque zone est subdivisée en colonnes appelées "rangées". Une rangée s'identifie par exemple "A15", "B7", "C12".

## Cible et contraintes

- **Ambition** : outil pérenne et robuste (pas un proto jetable). Pas un MVP fragile, pas non plus une usine à gaz.
- **Appareils** : smartphone (dans le hangar) + ordinateur de bureau (au bureau). Pas de tablette pour l'instant.
- **Délai** : la moisson 2026 démarre mi-juin 2026, donc l'outil doit être prêt pour validation terrain à ce moment-là.
- **Utilisateurs** : ~11 personnes maximum (les permanents de la SCIC).

## Stack technique proposée (à valider en début de projet)

- **Next.js** (React + API routes) pour garder la clé API Airtable côté serveur, jamais exposée au navigateur.
- **Tailwind CSS** pour le responsive smartphone/desktop.
- **@dnd-kit** pour le drag-and-drop (gère bien le tactile, contrairement à react-dnd).
- **NextAuth.js** pour l'authentification.
- **Vercel** pour l'hébergement (gratuit suffisant pour ~11 utilisateurs).
- **Synchro Airtable** : polling toutes les 5-10s côté navigateur en V1, webhooks Airtable plus tard si besoin de temps réel propre.

## Estimation d'effort

3-4 journées de développement pour un outil propre, déployé et utilisable :
- J1 : setup Next.js + lecture Airtable + vue read-only responsive
- J2 : drag-and-drop + écriture Airtable + auth basique
- J3-J4 : tests terrain, polish, gestion d'erreurs et conflits multi-utilisateurs

## Décisions déjà prises (2026-05-20)

- Lancer le chantier en parallèle du travail RACI moisson, sans attendre la validation par les salariés (le besoin est déjà connu et exprimé par les opérateurs).
- Cible = outil pérenne, pas un proto.
- Appareils = smartphone + desktop, pas de tablette.
- Étape suivante = maquette HTML statique de l'UI à valider avant tout code de production.

## Questions ouvertes à clarifier en début de projet

1. **Structure Airtable** : quels champs sur la table des lots ? Y a-t-il déjà un champ "emplacement" exploitable, ou faut-il l'ajouter / le normaliser ?
2. **Accès Airtable** : qui possède le compte Airtable côté SCIC ? Comment obtenir une clé API ? Quelle table / quelle base précisément ?
3. **Authentification** : un mot de passe partagé suffit-il en V1, ou un compte par opérateur dès le départ ?
4. **Hébergement** : Vercel gratuit OK pour la SCIC, ou besoin d'un hébergement chez eux (OVH, autre) ?
5. **Maintenance post-livraison** : Hugo ? Quelqu'un de la SCIC ? Personne (= l'outil doit être autonome et sans dépendance technique vivante) ?
6. **Champs à afficher sur chaque "carte" lot** : numéro de lot, variété, poids, date d'entrée… à confirmer avec les opérateurs.

## Prochaine étape concrète

Dès que Hugo aura partagé la structure Airtable (questions 1 et 2), monter une maquette HTML statique non connectée de l'UI cible, pour validation visuelle avec les opérateurs avant d'écrire la moindre ligne de code de production.

## Lien avec l'autre chantier en cours

Ce projet est mené en parallèle d'un chantier RACI (clarification des rôles pendant la moisson 2026), géré dans un autre projet Claude ("Moisson 2026 SCIC Graines équitables"). Les deux chantiers convergent vers la moisson de juin 2026 mais sont indépendants côté livrables. Ne pas mélanger : ce projet-ci est purement l'outil hangar.

## Mode de collaboration souhaité

- Hugo apprécie les réponses honnêtes et techniques, qui distinguent ce qui est sûr de ce qui demande validation.
- Toujours poser les questions de cadrage avant de coder ou de produire un livrable.
- Quand un livrable est prêt, le déposer dans le dossier du projet sélectionné par Hugo et fournir un lien `computer://`.
