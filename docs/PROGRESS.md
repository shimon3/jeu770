# Progression

## Phase 1 — Prototype jouable (20 octobre 2026)

### Fait et testé

Tests réalisés dans Chrome (`npm run dev`) en pilotant le jeu par événements clavier simulés et en lisant l'état du jeu, plus captures d'écran.

| Élément | Résultat du test |
|---|---|
| Écran d'accueil FR/HE | OK : boutons, tableau des commandes, chargement des textures. « Continuer / Nouvelle partie » apparaît quand une sauvegarde existe ; « Continuer » restaure missions et position. |
| Bascule hébreu | OK : `dir="rtl"`, HUD en miroir (zone à droite, mission à gauche), menu et invites traduits. |
| Rue, façade, voisins | OK visuellement (captures). |
| Déplacement ZQSD/WASD | OK : marche 2,2 m/s ; course (Maj) 3,8 m/s mesurée. |
| Saut (Espace) | OK : 0,68 m. |
| Marches extérieures | OK : trottoir → cour → palier sans téléportation. |
| Porte principale | OK : fermée, elle bloque le joueur (arrêt à 0,19 m) ; E l'ouvre avec animation ; on entre dans le hall. |
| Hall, escalier | OK : montée continue de y 1,0 à y 4,8, sortie sur le palier de l'étage, collisions avec les murs. |
| Portes intérieures fermées | OK : message « bientôt » / « porte fermée ». |
| Mission « Découvrir le 770 » | OK de bout en bout : parler au PNJ → panneau d'histoire → entrer dans le hall → tableau d'annonces → monter à l'étage → mission terminée. |
| Sauvegarde localStorage | OK : écrite automatiquement à chaque étape (lecture/écriture sous try/catch). |
| Banc | OK : s'asseoir (E), animation assise, se lever (E ou déplacement). |
| Vue 1re personne (V) | OK. |
| Touches J, M, P, Échap | OK, y compris M en AZERTY (code `Semicolon`) et J sur clavier hébreu. |
| Mention « Reconstitution artistique » | OK : affichée dans le hall et à l'étage. |
| `npm run build` | OK, sans erreur TypeScript. |
| Coût de rendu | ~11 ms par image (dont ~4,4 ms d'ombres) en 1680×825 sur Intel Iris Xe (mesure par rendus synchrones). Le fps réel n'a pas pu être mesuré proprement : Chrome bride l'onglet piloté par l'automatisation. |

### Fait mais NON testé

- Orientation de la caméra à la souris sous verrouillage du pointeur et zoom à la molette : code écrit, non testé (l'automatisation ne fournit pas de vrais mouvements de souris verrouillés). **À vérifier à la main.**
- Ambiance sonore procédurale et bouton Son : non vérifiés à l'oreille.
- Déclenchement du menu par la perte du verrouillage du pointeur (Échap réel) : observé une fois de façon incidente, pas testé méthodiquement.
- `npm run preview` / déploiement Cloudflare Pages : non testés.

### Reste à faire (phases suivantes)

- Phase 2 : couloir, antichambre « Gan Eden HaTa'hton », bureau du Rebbe (fauteuil vide, aucun PNJ). Examiner d'abord `references/bureau/`.
- Phase 3 : grand Zal, PNJ animés. Examiner `references/beit-midrash/` et Commons 8 à 11.
- Phase 4 : petit zal, mode cinéma, Hitat (`hitatUrl`), programme (P), plan (M), mini-carte. P et M affichent pour l'instant « bientôt ».
- Phase 5 : optimisation (bundle JS de 3,5 Mo dont le WASM de Rapier ; découpage en chunks ; GLB compressés), joystick mobile, README complet, déploiement.

### Points à calibrer

- Toutes les cotes de `src/config/dimensions.ts` marquées `// ESTIMÉ — à calibrer`.
- Teinte de la brique de façade (un peu plus violacée que sur les photos).
- Volumes des voisins (approximatifs).
- Disposition du hall : reconstitution artistique en attendant un plan ou des photos du hall d'entrée lui-même.
- Horaires des tefilot : valeurs d'exemple à remplacer dans `src/config/tefilot.json`.

### Notes techniques

- Blender n'est pas installé sur cette machine : toute la modélisation est faite en code (géométries procédurales fusionnées par matériau, ~240 draw calls). Aucun GLB pour l'instant, donc pas de compression Draco/Meshopt à ce stade.
- Outil de test en développement : `window.__770` (téléportation, état, store). Absent du build de production.
- F3 affiche les colliders Rapier.
