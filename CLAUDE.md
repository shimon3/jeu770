# PROJET : 770 BROOKLYN — JEU 3D IMMERSIF

Un vrai jeu 3D jouable dans le navigateur, qui se déroule dans et autour du
**véritable 770 Eastern Parkway, Brooklyn, NY 11213**. Inspiration d'ergonomie :
https://niveau-effort-3d-ultracode.pages.dev/ (HUD discret, mini-carte, touche E,
mode cinéma). Ne copier le code d'aucun site : tout est écrit de zéro.

- Uniquement le 770 original de Brooklyn. Jamais les répliques (Kfar Habad,
  Jérusalem, Rishon LeZion, Melbourne…).
- Pas de visite virtuelle par panoramas : un monde 3D où l'on marche, court,
  franchit des portes, monte et descend des escaliers et interagit.
- Murs, portes, escaliers et meubles sont de vrais objets 3D. Jamais une photo
  plaquée à la place d'un volume.

## RÈGLE ABSOLUE — non négociable
- Le Rebbe n'est JAMAIS représenté : ni personnage, ni silhouette, ni portrait,
  ni buste, ni photo de lui en texture, en décor ou sur un écran.
- La place du Rebbe dans le grand Zal et le fauteuil de son bureau restent VIDES.
  Aucun PNJ ne s'y assoit ni ne s'en approche dans ses déplacements.
- Les PNJ sont des hassidim anonymes et génériques, sans visage réaliste.
- Ne jamais générer ni télécharger d'image du Rebbe, même comme placeholder.
  Une photo de référence qui le montre est supprimée de references/ et ignorée.
- Si une tâche semble exiger de contourner cette règle : s'arrêter et demander.

## Stack
- React + TypeScript + Vite.
- Three.js via React Three Fiber, @react-three/drei.
- Physique : @react-three/rapier (contrôleur de personnage cinématique,
  marches franchissables via `autostep`, gravité, collisions).
- Assets 3D en GLB/glTF. Modélisation surtout en code (géométries procédurales
  ou glTF générés par script). Blender seulement en ligne de commande
  (`blender -b -P script.py`) s'il est installé ; sinon, s'en passer et le dire.
- Code sur GitHub ; déploiement sur Cloudflare Pages (`npm run build` → `dist/`).
- Cible : 60 fps sur un portable moyen. Textures 1K par défaut, 2K pour la
  façade. Chargement progressif par zone.

## Joueur
- Avatar : hassid générique en **sirtouk** (long manteau noir), **chapeau
  noir**, barbe, tsitsit visibles. Low-poly propre, sans visage réaliste.
- Caméra en **troisième personne** par défaut (derrière l'épaule).
  Touche **V** : bascule en première personne (pour lire, regarder de près).
- Animations : repos, marche, course, monter des escaliers, s'asseoir.

## Commandes
- ZQSD / WASD / flèches : se déplacer (via `event.code`, AZERTY et QWERTY)
- Souris : caméra ; molette : zoom en troisième personne
- Maj : courir ; Espace : sauter (désactivé dans les lieux de prière et le bureau)
- E : interagir, ouvrir une porte ; V : 1re / 3e personne
- M : plan ; P : programme du jour ; J : journal des missions
- Échap : menu (reprendre, langue, son, sauvegarde) et sortie du mode cinéma

## Physique et circulation
- Collisions partout, gravité, plusieurs niveaux.
- Escaliers praticables sans téléportation ; portes avec animation d'ouverture.
- Passage fluide extérieur → intérieur.
- Respecter la circulation réelle entre les salles. Toute liaison intérieure
  non vérifiée par une source est signalée en jeu (petite mention
  « reconstitution artistique ») et dans docs/REGISTRE.md.
- Ne pas supposer que toutes les salles communiquent directement.

## Fidélité et photos
Pour chaque photo de référence :
1. Vérifier qu'elle montre bien le 770 original à Brooklyn.
2. L'examiner en pleine résolution si possible (lire l'image).
3. Noter sa licence et ses crédits (Wikimedia : licence libre, crédit
   obligatoire ; sites d'actualité : référence seulement, jamais publiée).
4. Lister les éléments architecturaux visibles.
5. En tirer les objets 3D.
6. Ne jamais présenter un détail inventé comme authentique.
7. Tout consigner dans `docs/REGISTRE.md` : source, éléments confirmés,
   parties approximatives.
Une photo inaccessible est signalée comme telle, jamais décrite de mémoire.
Les cotes vont dans `src/config/dimensions.ts`, chaque estimation commentée
`// ESTIMÉ — à calibrer`. Matériaux : textures CC0 Poly Haven ou ambientCG,
listées dans CREDITS.md.

## Langues
- Interface bilingue français / hébreu, bascule dans le menu.
- Hébreu : `dir="rtl"`, panneaux en miroir. Le monde 3D ne change pas.
- Aucun texte en dur : tout passe par `t('cle')` (src/i18n/fr.json, he.json).

## Contenus
- Hitat du jour : lien configurable `hitatUrl` vers le site Yom Beyomo.
- Mode cinéma : lecteur YouTube intégré, liste de vidéos dans
  `src/config/zones.json`, vide par défaut (Samuel la remplira).
- Horaires des tefilot : `src/config/tefilot.json`, éditable à la main.

## Missions
- Système de missions avec journal (J) et sauvegarde locale (localStorage,
  lecture et écriture protégées par try/catch).
- Missions données par des PNJ, définies en données (`src/config/missions.json`).

## Livrables attendus
- README en français : installation Windows (Node, Git Bash), commandes locales
  (`npm install`, `npm run dev`), build et déploiement Cloudflare Pages.
- docs/REGISTRE.md, CREDITS.md, docs/PROGRESS.md à jour.

## Méthode
- Ne pas construire tout le complexe d'un coup : une phase à la fois
  (prompts/phase-N.md).
- Commits petits, messages en français.
- Fin de phase : `npm run build` sans erreur, test en `npm run dev`, mise à jour
  de docs/PROGRESS.md (fait, reste, points à calibrer).
- Ne jamais présenter comme fonctionnel ce qui n'a pas été testé.
