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

## Phase 2 — Grand Zal souterrain (20 octobre 2026, branche `phase-2-grand-zal`)

### Fait et testé (Chrome, `npm run dev`, événements clavier simulés)

| Élément | Résultat |
|---|---|
| Correction 766 (gauche) / 784-788 (droite) | Fait ; registre corrigé |
| Départ toujours sur le trottoir, entre le 770 et 784-788 | OK, y compris avec « Continuer la partie » (missions conservées) |
| Panneau indicateur « Maison du Rabbi — 770 » / « Grand Zal » | OK en français et en hébreu (texte RTL, flèches correctes) |
| Descente rue → courette → escalier → palier | OK, continue, sans téléportation |
| Porte du Zal | OK : bloque fermée, s'ouvre avec E |
| Remontée palier → escalier → trottoir | OK |
| Grand Zal : enveloppe, mobilier, bimah, Aron, place vide, plafonniers | OK visuellement (captures) |
| Banderole hébraïque | OK : lecture de droite à gauche, lettres non inversées |
| Lieu de calme (course et saut désactivés) | Badge affiché ; zone `grand-zal` marquée `calme` |
| Missions : descendre au Zal, siddour, rejoindre la bimah, préparer le farbrenguen, retrouver un livre | OK de bout en bout ; sauvegarde écrite |
| Porte du 770 et mission 1 | La porte principale répond toujours (non-régression partielle) |
| `npm run build` | OK |
| Coût de rendu dans le Zal | 13,1 ms par image en 1800×843 (Iris Xe), contre 63 ms avant optimisation |

### Optimisations
- Dans le Zal : soleil coupé et carte d'ombres figée (inutiles sous terre).
- Éclairage du Zal par une lumière hémisphérique (néons uniformes) au lieu de 5 lumières ponctuelles.
- Densité de pixels plafonnée à 1,25.
- PNJ du Zal dessinés seulement quand le joueur est dans le Zal ou l'escalier ; mobilier du Zal sans ombre solaire.

### Fait mais NON testé
- S'asseoir sur les bancs du Zal et se relever (point de sortie) : code écrit, non testé.
- Montée sur les gradins de l'aile ouest : non testée (le premier essai a été faussé par le bridage de l'onglet).
- Trajets des PNJ marcheurs sur la durée (collisions visuelles possibles avec le joueur).
- Souris, molette, son (comme en phase 1).

### Reste à faire
- Examiner les images A à D (pas encore reçues), la galerie « 100 détails » et les autres galeries COLlive, puis ajuster la disposition des bancs, colonnes, estrades.
- Lire le texte du PDF 1943-1945.
- Fusionner la branche dans `master` après validation.

### Modifications de fichiers existants (autorisées)
`Voisins.tsx` (correction et retrait du bâtiment de droite), `Rue.tsx` (sol percé, voiture déplacée), `Monde.tsx` (montage, soleil), `App.tsx` (départ sur le trottoir, densité de pixels), `store.ts` et `Joueur.tsx` (point de sortie optionnel d'un siège), `zones.json`, `missions.json`, `fr.json`, `he.json` (ajouts uniquement).
