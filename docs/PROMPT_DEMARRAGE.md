# Premier message à coller dans Claude Code

Une fois dans Claude Code (depuis le dossier `/Users/hugolehoux/Documents/Claude/Projects/Interface Hangar/`), copie-colle le message ci-dessous pour démarrer.

Claude Code aura déjà lu automatiquement `CLAUDE.md` à l'ouverture, donc tout le contexte est là.

---

## Message à coller :

```
Salut. On va démarrer le portage de la maquette HTML statique vers une app Next.js de production.

Avant de commencer :
1. Ouvre et lis maquette_hangar_v1.html (c'est la spec visuelle ET fonctionnelle de ce qu'on doit reproduire — comportement drag-drop, modales, toasts, allotements, etc.)
2. Vérifie que tu as bien le contexte du CLAUDE.md (stack, layout hangar, tables Airtable, décisions UX, mode dry-run)
3. Confirme ce que tu as compris en 5-10 lignes, puis propose-moi UNE structure de projet Next.js avec les premiers fichiers à créer (app router, components, lib/airtable, etc.) — pas de code à ce stade, juste l'arborescence et les choix techniques que tu recommandes.

On itère ensemble étape par étape. Pas de gros chantier en autonomie sans validation : je veux suivre de près. Démarre doucement, fais valider l'arborescence avant d'écrire le moindre composant.

Pour les choses à clarifier :
- Auth : ouverte en V1 (pas de NextAuth pour l'instant)
- Écritures Airtable : commence en mode DRY-RUN (logue mais n'envoie pas). Je créerai une base "Hangar - test" pour les premiers tests réels.
- Clé Airtable : je te la créerai en PAT quand on en aura besoin (scopes data.records:read + write)
- Hébergement : à trancher plus tard (Vercel probable, OVH possible)

Vas-y, démarre.
```

---

## Quoi faire AVANT de lancer Claude Code

1. **Installer Node.js 20+** si ce n'est pas déjà fait (`brew install node@20` ou via nvm)
2. **Installer Claude Code** : `npm install -g @anthropic-ai/claude-code` puis `claude` dans le terminal (voir la doc Anthropic pour la procédure exacte)
3. **Ouvrir un terminal dans le dossier projet** : `cd "/Users/hugolehoux/Documents/Claude/Projects/Interface Hangar"`
4. **Lancer `claude`** dans ce dossier — il va automatiquement détecter `CLAUDE.md`
5. **Coller le message ci-dessus**

## À préparer en parallèle (avant la première écriture Airtable)

- **Créer un Personal Access Token Airtable** : https://airtable.com/create/tokens
  - Scopes : `data.records:read` + `data.records:write` + `schema.bases:read`
  - Accès : ta base "SCIC Graines équitables" (et la copie "Hangar - test" quand tu l'auras créée)
  - Tu colleras le token dans le `.env.local` que Claude Code créera (jamais commit en git, déjà dans le `.gitignore` par défaut)

- **Créer une copie de la base Airtable** "SCIC Graines équitables" → "Hangar - test"
  - Depuis l'interface Airtable : Workspace → ... → Duplicate base
  - Permet de tester les écritures sans risque

## Ce qu'il faut garder en tête côté workflow

- Claude Code est plus à l'aise que moi (Cowork) pour du dev multi-fichiers continu — il a un meilleur contexte des projets de code
- Tu peux toujours revenir ici (Cowork) pour les questions ponctuelles ou pour faire évoluer la maquette HTML
- Le `CLAUDE.md` est la mémoire partagée entre les sessions Claude Code — si tu fais des décisions importantes pendant le dev, demande à Claude Code de mettre à jour ce fichier
