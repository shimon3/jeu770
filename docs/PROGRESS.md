# Progression





## Graphismes, guide de mission, 3 missions, plan, chargement allégé — 16 novembre 2026 (branche `ameliorations/graphismes-missions-perf`)

### Fait
- **Chargement** : textures du monde en WebP (rugosité en 512), textures des modèles en WebP et plafonnées à 2048 (le manteau du hassid était en 4096), fichiers inutilisés retirés (`*_2k.jpg`, `kloofendal_1k.hdr`). Écran d'attente affiché avant le code du jeu, préchargement du joueur, du ciel et du décodeur dès la première ligne de la page, cache navigateur (`public/_headers`), icône d'onglet.
- **Graphismes** : effets d'image chargés à part (`src/world/Effets.tsx`) : occlusion ambiante, halo, vignette, courbe ACES. Réglage « Graphismes » dans le menu : automatique, haute qualité, équilibrée, rapide (`src/config/qualite.ts`). En automatique : effets sur ordinateur seulement, coupés en premier si l'appareil peine.
- **Guide de mission** (`src/missions/guide.ts`, `MissionsRue.tsx`) : colonne dorée et losange sur la prochaine étape, losange au-dessus des PNJ qui ont une mission, distance et numéro d'étape dans le HUD.
- **Étape « collecte »** dans `missions.json` (ramasser N objets, compteur sauvegardé). Toute interaction E peut valider une étape « interagir ».
- **3 missions** confiées par un jeune chalia'h (trottoir, entre le 770 et la descente du Zal) : pièces de tsedaka (8 pièces puis pouchké), affiches du farbrenguen (3 panneaux d'affichage), plaques du 770 (4 plaques). 15 $ au total.
- **Plan (M)** : vue de dessus du monde 3D avec la position du joueur et la prochaine étape (`src/ui/Plan.tsx`, image produite par `tools/captures/plan.mjs`).
- **Journal** : rang (Visiteur → Chalia'h) et jauge de progression.
- Outils : `tools/captures/` (captures, mesure du démarrage, plan, parcours des missions) ; `?outils=1` active l'outil de test sur le site publié.

### Vérifié (Chrome réel, carte graphique de l'ordinateur de Samuel, serveur local)
- `npm run build` sans erreur.
- Démarrage du build de production : 11,8 Mo → 8,1 Mo téléchargés avant « Jouer » ; bouton prêt en 5,8 s au lieu de 6,8 s.
- `node tools/captures/verifier-missions.mjs` : 23 contrôles réussis (les 2 premières missions en entier, 1re plaque de la 3e, sauvegarde), aucune erreur de page.
- Compression des modèles : vue de dessus identique avant/après.
- Images par seconde dans la rue (fenêtre 1280×720) : 58 sans effets, 48 avec.

### Non vérifié / reste
- Téléphone réel, connexion lente réelle, site publié (rien n'est déployé).
- Mission des plaques : plaques 2 à 4 non parcourues automatiquement.
- Plan : pas de vue des intérieurs ni du grand Zal ; l'image est à régénérer si la rue change.
- Les tâches longues du démarrage (≈ 3,6 s de calcul : compilation des shaders, envoi des textures) ne sont pas réduites.
- Texte hébreu des nouvelles missions : à relire par Samuel.

## Plus d'argent : récompenses des missions et livraisons de pizza — 15 novembre 2026 (branche `plus-argent-livraisons`)

### Fait
- Récompense propre à chaque mission (`recompense` dans missions.json) : 2 à 5 $ selon la longueur (22 $ au total au lieu de 7). Affichée dans le journal.
- Livraisons de pizza, répétables : à la pizzeria, « Faire une livraison » ; un client apparaît sous une colonne dorée à l'un de 6 endroits du trottoir ; HUD avec le lieu et la distance (✕ pour abandonner) ; E au client : +3 $, +1 $ de pourboire en moins de 60 s.

### Vérifié
- `npm run build` ; `tests/magasins.spec.ts` « livraison » réussi (portrait 360×780).

### Reste
- Livrer depuis la voiture sans en descendre.

## Magasins juifs sur Eastern Parkway — 15 novembre 2026 (branche `magasins-eastern-parkway`, basée sur `voiture-son-compteur-tank`)

### Fait
- Rangée de 5 magasins après le 784-788 (x 40,2 → 59,6) : pizzeria cachère, glacier, vêtements, chemises, chapeaux (`src/world/rue/Magasins.tsx`, données dans `src/missions/magasins.ts`). Enseignes bilingues EN/HE génériques, store coloré, vitrine, porte, vendeur devant chaque porte. Choix de jeu signalé (REGISTRE.md).
- E devant la porte : panneau du magasin, achat avec les dollars. Nourriture mangée tout de suite avec la berakha (glace : Chehakol ; knish : Mezonot ; pizza : Mezonot, Hamotsi si repas) ; vêtements dans l'inventaire (gartel, talit katan, sirtouk, chemise, cravate, chapeau, kippa).
- Limite piétonne est déplacée de x 40 à x 59,6 ; immeuble d'angle en décor au-delà.

### Vérifié
- `npm run build` ; `tests/magasins.spec.ts` (portrait 360×780) : invite « Entrer : Glacier », panneau, achat d'un cornet (5 $ → 4 $).

### Reste
- Les vêtements achetés ne changent pas encore l'avatar. Intérieurs non visitables.

## Conduite fluide, son, compteur, haut-parleur du tank — 15 novembre 2026 (branche `voiture-son-compteur-tank`, basée sur `objets-utiles-zmanim`)

### Fait
- **Fluidité** (`VoitureConduite.tsx`) : volant et accélérateur lissés ; braquage adouci à haute vitesse (tank plus lourd) ; décélération régulière au relâchement ; contre un obstacle, la vitesse devient celle réellement parcourue (glissement sans à-coups au lieu de la division par deux à chaque image) ; la voiture est mise à jour AVANT la caméra (`useFrame` priorité −1), ce qui supprime le tremblement d'une image de retard.
- **Téléphone** : conduite par direction — on pousse le joystick là où l'on veut aller (haut = tout droit, côtés = tourner, bas = marche arrière, l'inclinaison règle la vitesse).
- **Son** (`src/audio/vehicule.ts`, procédural) : moteur dont la hauteur suit la vitesse, klaxon (H, bouton 📯).
- **Compteur** km/h en haut au centre pendant la conduite.
- **Haut-parleur du Mitzvah Tank** (N, bouton 🎶) : niggoun original composé pour le jeu (ré freygish), filtre mégaphone ; continue garé, volume selon la distance.
- Test `tests/voiture-son.spec.ts` (PC) : compteur, haut-parleur, joystick avant/gauche/arrière.

### Vérifié
- `npm run build` ; `tests/voiture-son.spec.ts` réussi (2 tests).
- `mission-tank.spec.ts` « monter » échoue ici AUSSI sur `master` (8fa4b73) : la touche E n'est pas prise en compte dans cet environnement à ~2 images/s, défaut antérieur à cette branche.

### Ajouts du soir (même branche)
- **Haut-parleur** : joue « Haneshama Yoredet » de Shmouel Bentouza (`public/audio/haneshama-yoredet.mp3`, 1,4 Mo, préchargé en montant dans le tank), filtre mégaphone adouci ; la mélodie de synthèse ne sert plus qu'en secours si le fichier ne se charge pas.
- **Saccades du joueur à pied** (`Joueur.tsx`) : la position était relue dans Rapier (pas fixe 1/60 s) ; sur écran 90/120 Hz ou à rythme variable, un pas était perdu puis doublé. Position désormais intégrée image par image et capsule placée immédiatement (`setTranslation`). Tests mobiles « joystick dans les 4 directions » et « caméra au doigt » réussis.

### Retours de Samuel sur téléphone (soir du 15/11)
- Le niggoun s'arrête en descendant du tank.
- Prière à la bimah : plus de panneau qui cache tout ; le personnage se balance sur place, un bandeau montre la prière du moment et le Chema, « Terminer » ou se déplacer y met fin. +1 $ par prière (Cha'harit, Min'ha, Arvit) et par jour à New York ; Tehilim du jour pareil, +1 $ par jour.
- **Boutons du HUD non cliquables sur téléphone** : la zone caméra tactile passait par-dessus. `.hud` en z-index 2, panneaux et menu en z-index 10.
- HUD mobile : zone, dollars, compteur empilés ; pastille dollars dorée.
- Test `tests/objets.spec.ts` (portrait 360×780) réussi.

### Reste
- Ressenti à valider sur téléphone réel (réglages : `LISSAGE_VOLANT`, `ACCEL`, `RALENTI`, taux de braquage).

## Objets utiles, zmanim et 'Hitat — 15 novembre 2026 (branche `objets-utiles-zmanim`)

### Fait
- **Siddour** : à la bimah du grand Zal, E propose « Prier à la bimah » ; panneau avec la prière du moment (heure de New York) et le premier verset du Chema. Sans siddour, le texte de la bimah invite à en acheter un.
- **Tehilim** : dans un lieu de calme, un bouton « Réciter les Tehilim du jour » apparaît ; chapitres du jour selon le cycle mensuel (date hébraïque à New York).
- **Pouchké** : boîte de tsedaka sur le mur ouest du hall (emplacement ESTIMÉ) ; E y glisse une pièce achetée au kiosque.
- Compteurs prières / Tehilim / tsedaka dans le magasin (entrées d'inventaire `priere`, `tehilim-lu`, `don`, sauvegardées).
- **Zmanim** calculés dans le navigateur (`src/world/zmanim.ts`) : nets, fin du Chema (GRA), 'hatsot, chkia, affichés sous le tableau d'annonces.
- `hitatUrl` = https://yom-beyomo.pages.dev, lien dans le tableau d'annonces et la bibliothèque.

### Vérifié
- `npm run build` réussi ; zmanim contrôlés pour le 15/11/2026 (nets 06:42, chkia 16:38) et le 21/06/2026 (chkia 20:30).

### Reste
- Horaires des minyanim de `tefilot.json` toujours d'exemple ; liste `videosCinema` vide.
- Tests Playwright non relancés en entier (trop lents sans GPU ici) ; vérifier sur téléphone.

## Personnages hassidiques v6sym — intégration finalisée (29 octobre 2026)

### Fait

- `hasidic_man_v6_brasSym.glb` est le personnage par défaut du joueur et des
  **13 PNJ** : deux à l'extérieur et onze dans le Grand Zal.
- Joueur : repos, marche, marche rapide et course avec fondus ; vitesse de
  lecture calée sur le déplacement réel ; vue première/troisième personne,
  collisions et interactions conservées.
- PNJ : un squelette et un mixer indépendants par personnage, avec géométrie,
  matériaux et textures partagés ; dialogues, missions, collisions et trajets
  conservés.
- Poses assise et balancement appliquées au squelette par `posesV6.ts`.
- Bras gauche et droit fermés symétriquement à 12° après chaque image
  d'animation : ils restent proches du corps sans coller au sirtouk.
- Balancement des avant-bras réduit à 30 % dans les clips de marche, marche
  rapide et course, sans modifier les jambes, le bassin ni le torse.
- En course, les positions des deux mains restent verrouillées sur les
  poignets afin qu'elles ne paraissent jamais détachées des avant-bras.
- Le joueur charge maintenant `hasidic_man_v6_player.glb` : son clip Running
  corrige directement les rotations des bras et des mains dans le GLB. Les
  PNJ continuent de charger `hasidic_man_v6_brasSym.glb` sans modification.
- Retour arrière immédiat avec `?avatar=v6`, `?avatar=ancien` et
  `?pnj=ancien`.
- Les pauses des PNJ marcheurs suivent maintenant le temps réel quand le rendu
  est lent ; leur déplacement reste plafonné pour éviter les bonds.

### Vérifié

- `npm run build` : réussi sans erreur TypeScript.
- Tests ciblés : joueur v6sym au repos, en marche et en course ; inventaire des
  13 PNJ ; cinq PNJ assis, deux en balancement, marcheurs actifs ; retours
  arrière joueur et PNJ. **3 tests réussis**.
- Suite Playwright mobile/PC : **23 tests réussis, 47 ignorés selon les formats,
  aucun échec**.
- Contrôle visuel en 1280×720 : joueur dehors et dans le Grand Zal, PNJ debout,
  en balancement et assis sur un banc.

### Limites connues, non bloquantes

- Le GLB ne contient pas de clip dédié au saut, aux escaliers, à l'assise ou
  au balancement : saut et escaliers réutilisent les clips locomoteurs ; assise
  et balancement sont procéduraux.
- Le nouveau GLB utilise une texture unique : les anciennes couleurs de peau et
  de barbe par PNJ ne s'appliquent qu'au modèle de retour arrière.
- Les performances et sensations restent à confirmer sur un téléphone physique ;
  les tests mobiles utilisent l'émulation tactile de Chrome.

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

## Maison du Rabbi — pièces derrière les portes (branche `phase-2b-maison`)

### Testé (Chrome, événements simulés et captures)
- Porte du hall vers l'antichambre : s'ouvre ; zones antichambre et bureau reconnues.
- Bureau du Rebbe : rendu vérifié (bibliothèques vitrées garnies, bureau, fauteuil vide, pupitres, fenêtre translucide sur la rue) ; plaque et bibliothèque (E) affichent leur panneau.
- Étage : sans clé, message « fermée à clé » ; clé prise dans l'armoire de l'antichambre (inventaire mis à jour) ; la porte de l'étage s'ouvre alors ; zone appartement reconnue ; salon rendu.
- Porte du fond : couloir et petit zal accessibles et reconnus ; petit zal rendu.
- `npm run build` OK.

### Non testé
- Refermer à clé et remettre la clé ; sauvegarde puis rechargement de l'inventaire.
- Porte du fond de l'étage (même clé) et salle à manger de l'étage.
- Coût de rendu dans les nouvelles pièces.

## Version mobile (branche `mobile`, fusionnée dans `master`)

### Fait et testé (Chrome, mode tactile forcé par `?tactile=1`, gestes simulés)
- Détection : téléphone et tablette (pointeur grossier sans survol). Un portable à écran tactile garde les commandes clavier/souris (vérifié sur cette machine : 10 points tactiles, mode ordinateur conservé).
- Joystick qui apparaît sous le pouce : marche proportionnelle (0,95 m/s pouce léger), course pouce à fond (4,8 m/s) hors lieux de calme.
- Glissement à droite : rotation de la caméra ; deux doigts simultanés (marcher + tourner) : OK.
- Boutons E, F, V, J et menu ☰ : OK ; le menu remet le joystick à zéro.
- Accueil : aide tactile à la place du tableau des touches ; HUD sans aides clavier.
- Téléphone : carte d'ombres 1024 au lieu de 2048 ; mise en page adaptée aux petits écrans.

### Non testé
- Sur un vrai téléphone (iPhone, Android) : sensations, performances, orientation portrait.

## Correction des commandes mobiles (branche `mobile-correctifs`, NON fusionnée)

Signalé sur Android/Chrome (viewport 360 × 641, DPR 3) : boutons trop bas ou masqués, message Android sur le curseur, joystick peu visible.

### Corrections
- Aucun appel à `requestPointerLock()` sur appareil tactile (démarrage, reprise, clic sur la scène) ; la perte de verrouillage ne met plus le jeu en pause sur mobile.
- Joystick fixe toujours visible en bas à gauche ; saisissable dans toute la moitié gauche ; remise à zéro au relâchement, à l'annulation, à la perte de capture et en arrière-plan.
- Boutons étiquetés E Agir, F Fermer, V Vue, J Journal, et ⤒ Saut seulement hors lieux de calme ; menu ☰ en bas au centre.
- **Clic fantôme corrigé** : les boutons agissaient au contact du doigt ; le clic qui suit tombait sur le panneau qui venait de s'ouvrir (le menu se refermait aussitôt). Ils agissent maintenant au clic.
- Safe-area (`env(safe-area-inset-*)`, `viewport-fit=cover`), unités `dvh`, tailles adaptatives (`clamp`, `vmin`) ; pas de défilement, rebond ni zoom pendant le jeu ; HUD repositionné en mode tactile (invite au-dessus des commandes, bouton « Fermer la porte » du HUD masqué au profit de F).

### Tests automatisés (Playwright, ÉMULATION tactile Chromium — pas un vrai téléphone)
`npm run test:mobile` : 20 tests réussis sur 7 formats (360×641, 360×780, 375×667, 390×844 en portrait ; 641×360, 844×390 en paysage ; PC 1280×720).
- Disposition : commandes et HUD dans le viewport, sans chevauchement, en français, en hébreu (RTL) et dans le grand Zal.
- Aucun verrouillage du pointeur, pas de pause au démarrage ni après tapotement.
- Joystick dans les 4 directions, arrêt au relâchement ; caméra au doigt ; joystick + caméra à deux doigts.
- E (dialogue + mission sauvegardée), J, V, F (porte), saut présent dehors et absent dans le Zal, menu puis reprise.
- Escalier du hall monté au joystick.
- PC : pas de commandes tactiles, aide clavier présente, verrouillage du pointeur demandé.

### Reste à tester sur le vrai téléphone Android
Sensibilité du joystick et de la caméra, fluidité (ombres allégées), barre d'adresse Chrome qui apparaît/disparaît, mode plein écran / navigation par gestes, rotation portrait ↔ paysage en cours de partie.


## Améliorations photographiques du Grand Zal — 21 octobre 2026 (branche `ameliorations-grand-zal-photos-2026`)

### Code implémenté
- `texturesZal.ts` : retrait du losange inventé, carrelage crème avec bandes rectilignes saumon et carrés ; dimensions estimées, motif procédural original.
- `PlafonniersZal.tsx` : dalles carrées encadrées sous plafond haut et réglettes linéaires sous plafonds bas, en conservant les ventilateurs et lustres.
- `MobilierZal.tsx` : bancs à dossier, tablette à sefarim légèrement inclinée, repose-pied et montants intermédiaires (sans nouveaux colliders).
- `AronKodesh.tsx` : colonnes tournées, frise en relief, corniches, plis du parokhet. Le parokhet blanc de Tichri 2025 et la place vide restent inchangés.
- `Complexe784.tsx` : trois vantaux voisins vitrés décoratifs, encadrement de la porte interactive et garde-corps supérieur, inspirés des photos 2020.
- `src/config/grandZal.ts` : mesures et trajet de la descente actuelle NON modifiés ; emplacement exact historique encore approximatif.
- `.github/workflows/verify-zal.yml` : vérification automatisée build et Playwright mobile/PC sur pull request.

### Sources et limites
Voir `docs/AUDIT-PHOTOS-GRAND-ZAL-2026.md` et le rapport photographique Aaron Valuation (juin 2020, p. 6, 9, 10). Les photos sont des références et ne sont pas enregistrées comme textures. Les dimensions, le nombre exact de portes, les positions de plafonniers et la distribution des bancs restent estimées.

### À vérifier avant de déclarer la reconstitution fidèle
Comparer en vrai navigateur : entrée 784-788, reflet des vitres, calage de la porte animée, lisibilité du parokhet et rapport d'échelle des bancs. Vérifier les collisions et la fluidité sur téléphone réel. La couverture CI atteste seulement le build et l'ergonomie testée en émulation.


## Façade, accès frontal au Zal, Aron fermé, pièce de la chaise — 21 octobre 2026 (branche `facade-acces-zal-aron-chaise`)

### Fait
- **Entrée du 770** : parement de pierre claire autour de la porte de bois et des petites fenêtres, sous l'oriel noir (photos 1–2). Arbres retirés de l'axe de la façade ; arbre de trottoir devant 784 décalé.
- **Accès au grand Zal** : l'escalier latéral (parallèle à la façade, partant de la gauche) est supprimé. Nouvelle courette anglaise frontale : depuis le trottoir, 18 marches descendent perpendiculairement à la façade jusqu'à un palier et **deux portes** (photo 4). Les deux portes s'ouvrent (E) et mènent au Zal. Applique éclairée, EXIT au-dessus de chaque porte côté Zal. Le PNJ de la mission « descendre au Zal » est déplacé en haut du nouvel escalier.
- **Grand Zal** : toujours à −3,40 m sous le trottoir ; reste du Zal, PNJ et missions inchangés.
- **Aron Kodesh** : toujours fermé (aucun état ouvert dans le code), parokhet d'un seul tenant, meuble plus imposant (photo 3).
- **Pièce de la chaise du Rabbi** (photo 5) : boiseries, tapis, chaise de velours rouge VIDE, pupitre, garde-corps ; porte depuis le mur est du Zal ; plaque de lecture FR/HE ; zone « reconstitution artistique ».
- Documentation : `docs/REGISTRE.md` section 11, `docs/AUDIT-FACADE-ACCES-2026.md`.

### Vérifié
- `npm run build` réussi.
- Rendu contrôlé par captures (Chromium sans GPU, SwiftShader) : façade sans arbre dans l'axe, parement de pierre, descente frontale vue du trottoir, deux portes vues du Zal, Aron fermé, pièce de la chaise.
- Parcours simulé au clavier : descente des 18 marches et remontée, ouverture de chacune des deux portes puis entrée dans la zone `grand-zal` ; entrée dans `chaise-rabbi` par sa porte ; le garde-corps arrête le joueur avant la chaise. (Rendu à ~2 images/s dans cet environnement : la fluidité n'est pas évaluée.)
- `npm run test:mobile` (émulation tactile Chromium, avec un Chromium local) : 20 tests réussis, 29 ignorés, comme avant.

### Non vérifié / reste
- Les **photos 1 à 5 n'ont pas été examinées** pendant ce travail (non jointes à la session) : comparaison visuelle jeu ↔ photos à faire par Samuel ; copier les photos dans `references/` avec leur origine.
- Couleur du parokhet de la photo 3 (le blanc de 2025 est conservé).
- Emplacement réel de la pièce de la chaise.

## PNJ hassid (modèle Sculptly anonymisé) — 21 octobre 2026 (branche `pnj-hassid-sculptly`)

### Fait
- Modèle GLB fourni par Samuel intégré comme hassid immobile dans le grand Zal, près de l'entrée (`src/npc/PnjModele.tsx`, `public/assets/models/hassid-sculptly.glb`, 1,5 Mo).
- Visage anonymisé avant publication (`tools/anonymiser-glb.py`), mis à l'échelle (1,75 m), texture 1K, collision.

### Vérifié
- `npm run build` réussi ; rendu contrôlé en jeu (face, profil, distance) et texture finale contrôlée.

### Non vérifié / reste
- `npm run test:mobile` non relancé pour cet ajout (la CI le lance sur `master`).
- Modèle figé (pas de squelette) : pas d'animation possible. 40 000 triangles : à alléger si le téléphone peine dans le Zal.
- Conditions d'utilisation de Sculptly à vérifier pour une diffusion publique.

## Modèle unique pour tous les hassids — 21 octobre 2026 (branche `hassid-modele-unique`)

### Fait
- `src/player/AvatarModele.tsx` : le modèle Sculptly anonymisé et allégé remplace l'avatar procédural pour le joueur et tous les PNJ (`Avatar` charge le modèle ; l'ancien avatar sert de remplaçant pendant le chargement).
- Poses procédurales par « morph targets » : marche (jambes), assis ; balancement, respiration, roulis de marche par rotations.
- Le hassid statique de l'entrée du Zal devient un PNJ ordinaire (même modèle) ; `PnjModele.tsx` supprimé.

### Vérifié
- `npm run build` réussi ; rendus contrôlés : joueur, PNJ debout, PNJ en balancement, PNJ assis, poses assise et de marche isolées.

### Non vérifié / reste
- Poses approximatives (manteau qui se fend à la marche, pan arrière en pose assise).
- Performance sur téléphone réel avec ~12 personnages de 13 000 triangles.
- Les couleurs de peau et de barbe propres à chaque PNJ ne s'appliquent plus (tous identiques).


## Devantures des magasins (16/11/2026, branche `ameliorations/graphismes-missions-perf`, NON commité)

Choix de jeu, pas une reconstitution (aucune enseigne réelle). Code : `src/world/rue/Vitrines.tsx`, structure dans `Magasins.tsx`.

### Fait et vérifié (captures Chrome, `node tools/captures/devantures.mjs`)
- Vitrines en retrait de 0,8 m derrière une vitre, garnies d'objets 3D : four et pizzas ; bacs de glace et cornets ; bustes en sirtouk et en talit katan ; rayonnages de chemises et cravates ; chapeaux sur socles et kippot.
- Portes à cadre de la couleur du magasin, plaque « OPEN / פתוח », paillasson ; enseignes agrandies avec icône ; enseignes rondes en drapeau ; stores rayés (pizzeria, glacier) ou courts ; ardoises de prix lues dans `magasins.ts`.
- `npm run build` OK ; `tests/magasins.spec.ts` : 2 réussis (portrait-360x780).

### À savoir
- Le vendeur est déplacé de 0,4 m vers la porte pour ne plus cacher l'étalage. Conséquence : celui du glacier passe à 2,07 m de la pièce de la chaise (limite 2,0 m, contrôle inchangé dans `routines.ts`) et s'affiche maintenant ; celui de la pizzeria reste refusé par ce contrôle.
- Non testé : collision des ardoises en jeu, rendu sur un vrai téléphone, coût de rendu mesuré.
- Échecs antérieurs à ce chantier : `mobile.spec.ts` « escalier du hall au joystick » (montée 0,25 à 0,30 m au lieu de > 0,4) ; `personnages-v6.spec.ts` attend 40 PNJ adultes (44 avant ce chantier, 45 après).

## Magasins où l'on entre, flèche de suivi, mission suivie (16/11/2026, NON commité)

### Fait et vérifié
- On entre dans les cinq magasins : entrée en retrait, porte vitrée (E, rayon 2,6 m, modèle `vitree` de `Porte.tsx`), salle de 3,7 × 7,6 m, comptoir, rayons, tables ; achat au comptoir (`magasin-<id>`). Zone `magasins` (intérieur). `tests/magasins.spec.ts` : 3 réussis, dont l'entrée à pied dans le glacier ; captures des cinq salles regardées.
- Flèche de suivi : flèche 3D dorée à la place du losange (balise et PNJ donneurs), flèche de direction dans l'encart Mission. Vue en capture devant le chalia'h.
- Encart Mission et balise : suivent la dernière mission commencée ou avancée (`missionSuivie`), sinon une collecte entamée, sinon la première active. `npm run build` OK.

### À savoir
- Pizzeria : comptoir sans vendeur. Le contrôle des PNJ (`routines.ts`, inchangé) refuse toute position dans cette salle, située au-dessus de la place vide et de la pièce de la chaise.
- Non testé : le compte des pièces à l'écran avec deux missions en cours ; l'entrée à pied dans les quatre autres magasins ; les collisions des meubles ; un vrai téléphone ; la suite de tests complète après ces changements.
- Corrigé après les captures, non revu à l'écran : murs d'extrémité (pizzeria à gauche, chapeaux à droite) qui montraient la brique au lieu de l'habillage.

## Chaussures des PNJ, magasins agrandis, générique, radar (16/11/2026, NON commité)

### Fait et vérifié
- Garçon : la chaussure du pied levé s'étirait en palme. Cause mesurée (`tools/analyser-poids-glb.mjs`) : 28 % du poids des sommets de la semelle sur le tibia, 5 à 9 % sur la cuisse. Corrigé dans le GLB (`tools/corriger-chaussures-glb.mjs`) : sous la cheville, pied et pointe seulement. Même correction (chaussures seules) sur la femme et le vieux hassid. Fichiers renommés `*_habad_v2.glb` (le cache garde l'ancien nom un jour). Gros plans avant/après regardés pour le garçon (`tools/captures/enfant.mjs`).
- Garçon : chevilles plus écartées que les hanches (±11 cm en marche, ±14 cm au repos, hanches ±9 cm ; `tools/mesurer-jambes-glb.mjs`). Après l'animation, les cuisses sont ramenées pour que la cheville passe sous la hanche (`PnjEnfant.tsx`, `?jambes=0` pour comparer).
- Magasins : salles de 10,5 m de profondeur (7,6 avant), porte de 1,4 m (1,0 avant), meubles plaqués aux murs et alternés, plus rien au milieu. Captures de la pizzeria et des chemises regardées.
- Générique d'ouverture : image de la façade rendue par le jeu (`public/assets/generique.jpg`, `tools/captures/generique.mjs`), lignes successives, puis menu. Sauté par les tests automatiques (`navigator.webdriver`), forcé par `?generique=1`.
- Radar rond en bas à gauche sur ordinateur (`src/ui/Radar.tsx`) : immeubles, chaussées, prochaine étape, PNJ donneurs.
- Fluidité mesurée sur ce PC : 60 images/s dans la rue, 478 appels de dessin, 635 000 triangles. Les déplacements n'ont pas d'inertie (vitesse appliquée dans l'image).

### Non testé
- Femme et vieux hassid à l'écran (vérifiés par les poids seulement) ; fille non modifiée (2 % de poids parasites).
- Fluidité sur téléphone ; générique sur téléphone et en hébreu ; radar en hébreu (RTL).
- Suite de tests complète.
