# 770 Brooklyn — jeu 3D

Jeu 3D jouable dans le navigateur, dans et autour du 770 Eastern Parkway (Brooklyn). React + TypeScript + Vite, Three.js via React Three Fiber, physique Rapier.

État actuel : **phase 1** (rue, façade, hall, escalier, une mission). Détail dans `docs/PROGRESS.md`, sources dans `docs/REGISTRE.md`.

## Installation sous Windows

1. Installer **Node.js 20 ou plus** : https://nodejs.org (version LTS, options par défaut).
2. Installer **Git pour Windows** : https://git-scm.com/download/win. Il fournit **Git Bash**.
3. Ouvrir Git Bash dans le dossier du projet, puis :

```bash
npm install
npm run dev
```

4. Ouvrir l'adresse affichée (par défaut http://localhost:5173).

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Vérification TypeScript puis build optimisé dans `dist/` |
| `npm run preview` | Sert le contenu de `dist/` en local |

## Touches

ZQSD / WASD / flèches : se déplacer · Souris : caméra (cliquer dans la scène pour la capturer) · Molette : zoom · Maj : courir · Espace : sauter · E : interagir · V : 1re / 3e personne · J : journal · M : plan · P : programme · Échap : menu.

## Données éditables

| Fichier | Contenu |
|---|---|
| `src/config/dimensions.ts` | Cotes du bâtiment (`// ESTIMÉ — à calibrer` = estimation) |
| `src/config/zones.json` | Zones, lieux de calme, `hitatUrl`, liste des vidéos du mode cinéma (vide) |
| `src/config/missions.json` | Missions et étapes |
| `src/config/tefilot.json` | Horaires du tableau d'annonces (valeurs d'exemple) |
| `src/i18n/fr.json`, `src/i18n/he.json` | Tous les textes de l'interface |

## Déploiement sur Cloudflare Pages

Option A — depuis GitHub (recommandé) :

1. Pousser le dépôt sur GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → choisir le dépôt.
3. Build command : `npm run build` · Build output directory : `dist`.
4. Variable d'environnement `NODE_VERSION` = `20` si besoin.

Option B — en ligne de commande :

```bash
npm run build
npx wrangler pages deploy dist --project-name 770-brooklyn
```

Le fichier `public/_headers` (copié dans `dist/`) règle le cache : fichiers hachés de `/static/` en cache permanent, textures de `/assets/` une semaine, `index.html` toujours revalidé.

## Structure

```
src/
  config/     dimensions.ts, zones.json, missions.json, tefilot.json
  world/      facade/, rue/, hall/, primitives, matériaux, portes, zones
  player/     avatar, contrôleur et caméra, entrées clavier
  npc/        PNJ
  missions/   logique et sauvegarde
  ui/         accueil, HUD, menu, panneaux
  i18n/       fr.json, he.json
  audio/      ambiance procédurale
public/assets/  textures et HDRI (CC0)
references/     photos de référence (jamais publiées, ignorées par git)
docs/           BRIEF, REGISTRE, PROGRESS, REFERENCES
```
