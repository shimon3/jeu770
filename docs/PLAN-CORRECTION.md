# Plan de correction de l'implantation (branche `correction-implantation`)

Rédigé le 20 octobre 2026 à l'issue de l'étape 0 (vérification des sources).
**Aucune géométrie ni aucun code de jeu n'a encore été modifié.**

## 1. Preuves architecturales

### 1.1 Côté de la rue (OpenStreetMap, API 0.6, consultée le 20/10/2026)

Empreintes des bâtiments (import NYC) et axe des rues, converties en mètres
autour du 770 (x vers l'est, y vers le nord) :

| Élément | x (est) | y (nord) | Surface au sol |
|---|---|---|---|
| Eastern Parkway (axe de la chaussée principale) | — | **≈ +52 m** | — |
| Union Street (rue parallèle) | — | **≈ −55 m** | — |
| 766 (way 250220474) | −28 → −17 | −14 → 13 | 220 m² |
| 770 (way 250220475) | −13 → 11 | −13 → 12 | 509 m² |
| 784 (way 250220476) | 10 → 26 | −14 → 11 | 315 m² |
| 788 (way 250220477) | 25 → 38 | −15 → 10 | 262 m² |
| Kingston Avenue | ≈ 49 | — | — |
| 792, Jewish Children's Museum | 58 → 84 | — | 615 m² |

**Conclusion : le 770 est sur le côté SUD d'Eastern Parkway ; sa façade
regarde vers le NORD.** Vu depuis le trottoir, on regarde vers le sud :
l'est est à GAUCHE, l'ouest à DROITE.

- 784-788 (à l'est) → **à gauche** du 770.
- 766 (à l'ouest) → **à droite** du 770.

L'erreur de la phase 2 : les longitudes étaient justes, mais on avait supposé
une façade tournée vers le sud (`Monde.tsx` : « la façade regarde vers le
sud »), ce qui inversait gauche et droite.

### 1.2 Photographies (examinées le 20/10/2026)

| Photo | Ce qu'elle montre (vue depuis la rue) |
|---|---|
| `facade/01.jpg` (theclio.com, référence seulement) | Gauche : immeuble de brique saumon à **fenêtres cintrées** à encadrements blancs, corniche ; **escalier qui descend** depuis le trottoir avec mains courantes, à son extrémité gauche. Centre : le 770. Droite : immeuble **Tudor à pignon**, balustrade de pierre, porte cintrée. |
| `exterieur/army-of-light-2025-11/001.jpg` (COLlive, A. Gelis) | Même ordre : bâtiment vitré moderne (musée, au-delà de Kingston), immeuble à fenêtres cintrées, le 770, puis bâtiment Tudor derrière les arbres. |
| `exterieur/shluchim-2025-11/099.jpg` (COLlive) | Même ordre (immeuble à fenêtres cintrées à gauche du 770). |
| `commons/05.jpg` « 770 וספריית חב"ד » (CC BY-SA 3.0, אבגד) | Titre : « le 770 et la bibliothèque Habad ». 770 à gauche, **bibliothèque à droite** : Tudor à pignon, balustrade, **porte cintrée à deux vantaux** en haut d'un escalier qui MONTE. |
| `commons/06.jpg` (CC BY-SA 3.0, אבגד) | Le 770 vu en biais depuis la droite ; la balustrade du voisin de droite au premier plan. |

**Deuxième erreur de la phase 2 :** l'aspect Tudor (pignon, portail de pierre,
parapet à balustres, d'après la photo Clio) a été attribué à 784-788 ; c'est
en fait **la bibliothèque 766**. Le 784-788 réel est l'immeuble à fenêtres
cintrées.

Les sources concordent : OpenStreetMap, Commons 5 (légendé par son auteur),
Clio, et les deux galeries COLlive de 2025. **La décision « 784-788 et le grand
Zal à gauche, 766 à droite » est confirmée.**

### 1.3 Surface du grand Zal (~800 m²)

- Aucun chiffre publié n'a été trouvé dans les sources du registre. **800 m²
  n'est pas sourcé.**
- Empreintes OpenStreetMap : 784 + 788 = **577 m²** (façade cumulée ≈ 28 m,
  profondeur ≈ 25 m).
- Le Zal comprend aussi l'ancien shalash, dans la cour arrière du 770
  (ChabadInfo). Sa surface n'est pas publiée : 800 m² au total implique
  ≈ 220 m² de shalash, ce qui est plausible.
- **Dans le jeu aujourd'hui : 912 m² (salle, 30,4 × 30 m) + 125 m² (aile du
  shalash) ≈ 1 037 m²**, soit environ 30 % de trop.

**800 m² n'est PAS une cible.** La surface du jeu sera la conséquence de cotes
justifiées, jamais un chiffre imposé :
- largeur de la salle : façade cumulée 784 + 788 mesurée sur OpenStreetMap
  (≈ 28 m, contre 30,4 m aujourd'hui) ;
- profondeur : conservée à 30 m (estimation actuelle) tant qu'aucune source ne
  la fixe. L'empreinte OSM (≈ 25 m) ne couvre que les bâtiments hors sol ; le
  sous-sol peut s'étendre au-delà ;
- shalash : 125 m² actuels conservés (aucune source).
La surface obtenue sera calculée et notée dans le registre, avec sa marge
d'incertitude.

### 1.4 Niveau, accès, escaliers, portes

| Point | Statut |
|---|---|
| Zal sous le niveau de la rue | Confirmé (Wikipedia ; chabad.org) |
| Profondeur (−3,4 m) | **Non sourcée**, conservée comme estimation |
| Escalier qui descend depuis la rue | Confirmé (texte « The Revolutionaries ») et **visible** sur Clio, à l'extrémité gauche de 784-788 (côté Kingston) |
| Porte du Zal au bas de l'escalier | Non visible sur les photos : **reconstitution artistique** |
| Doubles portes | Les seules doubles portes documentées (Commons 5) sont celles de **la bibliothèque 766**, pas du Zal |
| Vitraux à voiliers | Existence citée (Mosaic Magazine), motifs non relevés : non modélisables sans photo |
| Liaison 770 ↔ Zal | Toujours non documentée : **non créée** |
| Passerelle 770 → bibliothèque (Commons 7) | Documentée, à l'arrière, à l'étage ; hors du périmètre de cette correction |

## 2. Disposition correcte dans le repère du jeu

Repère du jeu inchangé : x vers la droite vu du trottoir, z vers la rue,
façade du 770 à z = 0. Avec la façade tournée vers le nord :
**+z = nord, −x = est, +x = ouest.**

```
            Eastern Parkway (nord, +z)
  ───────────────────────────────────────────────
   trottoir  ▼ départ (x ≈ −7,8)
  [ 784-788 : fenêtres cintrées ][ 770 ][ 766 Tudor ]
   x ≈ −37,6 … −9,6              −8,3…8,3   ≈ 12 … 23
   escalier en contrebas à l'extrémité gauche (côté Kingston)
   grand Zal souterrain sous 784-788 ; aile du shalash derrière le 770
                      (sud, −z)
```

## 3. Transformation retenue : symétrie des coordonnées, pas un miroir d'objets

- **Une rotation de 180° ne convient pas** : elle enverrait le côté rue du Zal
  (entrée, façade de 784) à l'arrière.
- La bonne transformation garde « près du 770 / loin du 770 » et « côté rue /
  fond » : **x → −x**.
- Pour ne rien inverser (inscriptions, portes, gonds), on **recalcule** les
  coordonnées et les angles (θ → −θ) dans les constantes. On n'applique
  **jamais** `scale.x = −1`. Les textes, banderoles et portes restent lisibles
  et dans le bon sens d'ouverture.
- Exception orientée par les sources : la **place vide**. Deux sources la
  placent au sud-est, à droite de l'Aron (ChabadInfo ; COLlive 016). L'Aron
  est sur le mur est (à l'extrémité gauche, x ≈ −38), donc le sud est le **côté
  du fond**, pas le côté rue. La place vide passe de z ≈ −12…−8 à z ≈ −24…−20.
  Le rayon d'exclusion des PNJ (4 m) est conservé.
- Mobilier symétrique (grille de colonnes, bancs, bimah) : déplacé par la même
  formule, sans changer sa forme.

## 4. Fichiers à corriger

1. **Configuration** : `src/config/grandZal.ts` (cotes exprimées dans un repère
   local du Zal + fonction de passage au monde ; anciennes cotes conservées
   dans `grandZal.phase2.ts`), `src/config/zones.json` (2 zones du Zal +
   escalier).
2. **Bâtiments, rue** : `complexe/Complexe784.tsx` (nouvelle façade à fenêtres
   cintrées, escalier côté Kingston), `rue/Voisins.tsx` (766 à droite, en
   **réutilisant** l'aspect Tudor de l'actuel `Complexe784`, largeur ≈ 11 m),
   `rue/Rue.tsx` (sol percé, `solDroit`), `rue/PanneauxDirection.tsx` (poteau à
   x ≈ −8,6, flèches inversées), `Monde.tsx` (PNJ d'entrée, cible et direction
   du soleil : fin d'après-midi au nord-ouest pour garder la façade éclairée).
3. **Intérieur du Zal** : `EnveloppeZal`, `MobilierZal`, `BimahZal`,
   `AronKodesh`, `PlaceVide`, `PlafonniersZal`, `ObjetsMissionsZal`,
   `GrandZal.tsx` (8 PNJ, 2 trajets).
4. **Joueur, PNJ, sauvegarde** : `state/store.ts` (`DEPART_PAR_DEFAUT` x 7,8 →
   −7,8), `npc/routines.ts` (via `PLACE_VIDE`, sans changer la logique),
   `missions/sauvegarde.ts` (position d'une ancienne sauvegarde remise au
   départ ; missions, inventaire, langue et son conservés).
5. **Tests et docs** : `tests/mobile.spec.ts` (téléportation dans le Zal à
   (22,1 ; −2,5 ; −6,0) et sur le trottoir à x = −20), `docs/REGISTRE.md`
   (sections 3, 5, 7, 8 corrigées, l'erreur expliquée), `docs/PROGRESS.md`.

**Inchangés** : `missions.json` (cibles par identifiant), `fr.json` et
`he.json` (sauf si un texte cite « droite »), le 770 (façade, hall, maison du
Rabbi, bureau), les commandes PC et tactiles, `Porte.tsx`.

## 5. Ce qui est protégé, et comment

| Élément | Protection |
|---|---|
| 5 missions | Identifiants d'objets et de zones inchangés ; parcours complet rejoué à l'étape 5 |
| PNJ | Mêmes identifiants, apparences, répliques ; positions recalculées ; aucun trajet dans le rayon de la place vide (test automatique de `routines.ts`) |
| Portes, interactions | `Porte.tsx` intouché ; la porte du Zal garde son identifiant `porte-zal` et s'ouvre vers l'intérieur |
| Sauvegardes | Clé inchangée ; seule une position d'ancienne sauvegarde située dans l'ancien Zal ou devant (x > 9) est remplacée par le départ |
| Langues | Aucun texte en dur ajouté ; panneaux vérifiés en FR et en HE |
| Éléments 3D existants | Rien n'est supprimé : l'aspect Tudor est réutilisé pour 766, l'ancien bâtiment « 766 » à bandeaux sert de base au 784-788 ; anciennes cotes archivées ; tag Git `avant-correction` |

## 6. Risques

1. **Bureau du Rebbe et Zal du même côté** : le Zal (x ≤ −9,6, sous terre)
   passe à côté du bureau (x −7,85 … −3,5, au rez-de-chaussée). Pas de
   recouvrement prévu, vérifié aux colliders (F3).
2. **Aile du shalash** : elle reste derrière le 770 (z < −23), mais s'étend
   vers la gauche ; vérifier qu'elle ne coupe pas les pièces arrière de
   `MaisonRabbi`.
3. **Sol de la rue** : le trou au-dessus du Zal et de la courette change de
   côté ; un oubli ferait tomber le joueur (il est alors ramené au départ).
4. **Largeur du 770** : OpenStreetMap donne 24 m d'empreinte, le jeu 16,6 m de
   façade (mesurée sur photo). Le 770 **ne bouge pas** ; l'écart vient
   probablement d'une annexe à l'est (petit volume bas visible sur Clio entre
   le 770 et 784). Noté pour plus tard, hors de cette correction.
5. **Tests mobiles** : deux coordonnées de `tests/mobile.spec.ts` deviennent
   fausses ; elles sont mises à jour dans la même branche.

## 7. Ordre des opérations (après accord)

| # | Étape | Durée estimée |
|---|---|---|
| 1 | Tag `avant-correction` ; repère local du Zal et archivage des cotes de phase 2 | 1 h |
| 2 | Façades : 784-788 à fenêtres cintrées à gauche, 766 Tudor à droite, rue, panneau, départ, soleil | 1 h 30 |
| 3 | Zal recalé sur la largeur mesurée (OSM) : enveloppe, colonnes, piliers, bancs, bimah, Aron, place vide au sud-est, PNJ et trajets | 1 h 30 |
| 4 | Escalier en contrebas côté Kingston, porte du Zal, zones, sauvegarde | 1 h |
| 5 | Vérification : escaliers, portes, collisions, 5 missions, place vide, FR/HE, `npm run test:mobile`, `npm run build` | 1 h 30 |
| 6 | Éléments manquants **sourcés** (grille, détails de façade, bancs, estrades), un commit par élément | 2 à 4 h |
| 7 | Registre, PROGRESS, CREDITS ; rapport final. Pas de fusion ni de déploiement sans accord | 30 min |

## 8. Points en attente de décision

- Doubles portes du Zal : aucune source ; les doubles portes documentées sont
  celles de la bibliothèque. Source à fournir, sinon porte simple conservée.
- Vitraux à voiliers : photo nécessaire, sinon non modélisés.
- `master` local contient maintenant les 3 commits de `mobile-correctifs`
  (fusion en avance rapide du 20/10/2026, tests Playwright : 20 réussis). **Non
  poussé sur GitHub** : un push de `master` peut déclencher un déploiement
  Cloudflare Pages.
