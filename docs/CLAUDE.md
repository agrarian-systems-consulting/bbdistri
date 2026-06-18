# Projet "SCICle" — Interface Hangar SCIC Graines équitables

> Ce fichier est chargé automatiquement par Claude Code à chaque session.
> Il donne tout le contexte nécessaire pour éviter de tout réexpliquer.

## Qui est l'utilisateur

Hugo Lehoux, animateur prestataire pour le projet Fantas'SCIC à la SCIC Graines équitables (coopérative céréalière, 11 permanents). Pas développeur professionnel mais à l'aise techniquement. Préfère :

- Réponses honnêtes et techniques, distinguer ce qui est sûr de ce qui demande validation
- **Toujours poser les questions de cadrage** avant de coder ou de produire un livrable
- Pas de promesses irréalistes (cf. session du 2026-05-23 où il a refusé un dev nocturne autonome au profit d'un travail à deux)

## Ce que fait l'application

Interface web pour les warehouse operators de la SCIC Graines équitables, qui gère des lots de céréales bio dans un hangar physique. Airtable est la **source de vérité** ; l'app en lit et écrit le contenu avec une UX adaptée au terrain (smartphone dans le hangar + desktop au bureau).

**Fonctionnalités principales** (validées sur maquette HTML statique) :

- Vue plan du hangar avec emplacements physiques (allées + zones logiques)
- Drag-and-drop d'un lot d'une allée à une autre, avec modale de confirmation adaptative (mono/multi-emplacement, fusion)
- Modale d'édition d'un lot au clic
- Placeholder "+" au survol d'une allée pour ajouter un lot existant (typeahead)
- Toggle filtres statut (légende cliquable) + recherche typeahead produit/N°lot
- Toggle "Suggestions d'allotements" qui met en évidence les lots groupables (même Produit+Destination)
- Mode plein écran par zone (icône d'expand → croix de fermeture)
- Toast d'undo 5s après chaque action de déplacement / ajout
- Badges caisson sur les cartes (visibles en fullscreen + modale, cachés en vue globale pour ne pas surcharger)
- Hover-highlight des autres portions d'un lot multi-emplacements

## Stack technique recommandée

- **Next.js 14+ (App Router)** + TypeScript
- **Tailwind CSS** pour le styling
- **shadcn/ui** pour les composants UI (Dialog, Toast, Select, etc.) — c'est le système de design qui colle naturellement au look "Claude/Linear" sans complications
- **@dnd-kit** pour le drag-and-drop (gère le tactile correctement, contrairement à react-dnd)
- **Airtable JS SDK** côté API routes (clé API JAMAIS exposée au navigateur)
- **TanStack Query** (react-query) pour la synchro et le cache, avec polling toutes les 5-10s en V1
- **NextAuth.js** prévu mais NON activé en V1 (cf. décisions UX)
- **Vercel** pour l'hébergement (gratuit suffit pour 11 utilisateurs), ou OVH si la SCIC préfère

## Layout physique du hangar (vue de dessus, mur Nord en haut)

```
+-----------------------------------------------+
|  ZONE A (17 allées)   |  pass.  |  ZONE PRÉPA  |   ← rang haut
|  A17 ← ... ← A01      | vert.   |  COMMANDE     |     (A déc., prépa vrac)
+-----------------------------------------------+
|           ALLÉE DE PASSAGE HORIZONTALE        |   ← rang milieu (vide)
+-----------------------------------------------+
|  ZONE C              |     ZONE B            |   ← rang bas
|  C1 → C20            |   B20 ← ... ← B01     |     (C cr., B déc.)
+-----------------------------------------------+
```

**Données réelles** : 82 allées physiques (A01-A17, B01-B20, C1-C20) + 1 zone vrac (prépa commande). La Zone-tampon a été retirée du front (l'emplacement subsiste dans Airtable, filtré côté serveur) ; les lots qui y restaient sont tous Épuisé, donc déjà masqués. 280 lots placés au total, dont 119 Épuisé qu'on filtre toujours côté UI. 19 groupes d'allotement détectés (clé Produit+Destination identique sur 2+ lots).

## Tables Airtable utilisées

Base : **"SCIC Graines équitables"** — `app7BMeStHVHQo3Tz`

| Table | ID | Rôle |
|---|---|---|
| Lots | `tblLYUOw0rwL5OJAT` | Table centrale. Champs clés : Lot (primary), Statut triage, Produit (court, lookup vers Catalogue), Bio/C2, Emplacements (multipleRecordLinks), Dépôt, Caissons, CléSuggestionAllotement (formula) |
| Emplacements | `tblV0Kws9SasEAM3g` | Référentiel physique. Name (formula = Zone+Allée), Zone (singleSelect A/B/C/PREP ; l'option TAMPON existe encore dans Airtable mais n'est plus exposée au front), Allée (texte), Lots (lien retour) |
| Catalogue | `tblnXQZs7n8JIejlD` | Produits (artdesignation, artcode, sous-famille...) |
| Dépôts | `tblXP2p2xgQ7yRSW6` | Le dépôt principal s'appelle juste **"Hangar"** dans Airtable. Filtrer Dépôt = "Hangar" pour la V1 (le reste = cellules/silos/big bags, hors scope) |
| Caissons métalliques | `tblkilMNlWg0pQY4h` | Caissons réutilisables (lien depuis Lots) |
| Pesée de lot | `tbld6EChYEPZ9dJxd` | Pesées pour mouvements de stock (utile V1.5 pour pesées sortie) |

Détails complets dans le fichier `contexte_projet_interface_hangar.md`.

## Décisions UX validées avec Hugo

- **Filtrage par défaut** : ne pas afficher les lots `Statut triage = "Epuisé"`, ni les lots du Dépôt ≠ "Hangar"
- **Multi-emplacements** : un lot peut être dans plusieurs allées (cas réel : lot 23-079 dispersé sur 7 allées). Le déplacement d'une portion doit déclencher une modale de confirmation avec choix "cette portion seulement" / "tout regrouper"
- **Fusion automatique** : si on drag un lot vers une allée qui contient déjà ce lot, la confirmation propose "fusionner" (= retirer de la source, l'addition est idempotente)
- **Ordre des allées** : A décroissant (A17 à gauche → A01 à droite), B décroissant (B20 → B01), C croissant (C1 → C20)
- **Undo** : toast 5s en bas à droite après déplacement ou ajout, avec snapshot des emplacements impactés pour restauration
- **Hover** : passer sur un lot multi-emplacements met en surbrillance ses autres portions
- **Badges caisson** : cachés en vue globale (cards déjà chargées), visibles en fullscreen + modale
- **Zone vrac** (Prépa commande) : pas d'allées numérotées, juste une grille de cards

## Mode de travail (important pour les écritures Airtable)

**Phase test (au démarrage)** :
- **Auth ouverte** (pas de NextAuth pour V1) — l'app ne sera pas exposée publiquement au début
- **Écritures Airtable en dry-run** par défaut — toutes les mutations sont **loguées dans la console serveur** mais NON envoyées à Airtable. Variable d'env `AIRTABLE_DRY_RUN=true` au début.
- **Tester d'abord sur une copie de la base** (Hugo créera "Hangar - test" dans Airtable) avant tout passage en live sur la prod
- **Première écriture réelle = test ciblé sur un lot bidon, en présence de Hugo**

**Phase prod (après validation)** :
- Bascule `AIRTABLE_DRY_RUN=false`
- Ajout potentiel de NextAuth selon décision de la SCIC
- Déploiement sur Vercel ou OVH (à trancher avec Hugo)

## Roadmap prioritaire (V1.5, avant la moisson juin 2026)

D'après la session du 2026-05-23, les priorités identifiées sont :

1. **Vue mobile dédiée** (sans elle, pas utilisable dans le hangar). Une vue "une allée à la fois", grands boutons, swipe pour changer d'allée
2. **Changement de statut rapide** (Brut→Trié→Épuisé) en un clic, sans passer par la modale
3. **Marquer un lot épuisé** facilement (avec toast undo bien sûr)
4. **Historique d'un lot exposé** dans la modale ("dernière modification : Pierre, 12 mai")
5. **Indicateurs visuels** : Bio/C2 visible, lots stationnaires depuis longtemps, lots avec analyse récente

À plus long terme : recherche/agrégation par produit, workflow "préparation de commande", scan code-barres mobile, allotements actionables (créer le lot fusion dans Airtable).

## Fichiers de référence dans ce dossier

| Fichier | Rôle |
|---|---|
| `maquette_hangar_v1.html` | **Maquette de référence validée** par Hugo et ses filles. Tout le comportement UX y est implémenté. Servir de spec visuelle et fonctionnelle au portage Next.js. À ouvrir dans un navigateur pour voir le rendu cible. |
| `maquette_hangar_v2_sobre.html` | Variante design sobre clair/sombre (inspirée Claude/shadcn). NON retenue par Hugo mais gardée comme inspiration possible. |
| `contexte_projet_interface_hangar.md` | Document de cadrage initial du projet. |
| `PROMPT_DEMARRAGE.md` | Premier message à coller dans Claude Code pour démarrer le portage. |

## Conventions de code à respecter

- TypeScript strict
- Composants React fonctionnels avec hooks
- Server Components par défaut, Client Components ("use client") seulement où nécessaire (drag-drop, modales interactives, etc.)
- API routes dans `app/api/` pour toutes les interactions Airtable
- Types Airtable générés depuis la structure (ou écrits à la main proprement)
- Pas de `console.log` en prod (sauf logs de mutations Airtable, gardés)
- Tests avec Vitest si possible (au minimum pour la logique métier moveLot, fusion, allotements)

## Pièges à éviter

- **Ne JAMAIS appeler Airtable depuis le navigateur** — toujours passer par une API route côté serveur, sinon la clé API est exposée
- **Ne PAS modifier Airtable de prod sans le mode dry-run actif au démarrage** — voir "Mode de travail"
- **Drag-and-drop tactile** : tester sur smartphone réel, pas juste sur le devtools mobile (le tactile a des comportements subtils)
- **Polling Airtable** : 5-10s suffit, ne pas hammer l'API (limite ~5 req/s par base)
- **Statut "Epuisé"** : exclure systématiquement de la vue UI, mais GARDER dans la table (c'est une trace historique, on ne supprime pas)
