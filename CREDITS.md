# Crédits

## Textures et éclairage (CC0, Poly Haven — https://polyhaven.com)

Licence CC0 : domaine public, aucune attribution obligatoire. Listées par honnêteté.

| Fichiers dans `public/assets/` | Ressource Poly Haven | Usage |
|---|---|---|
| `textures/red_brick_03_*_2k.jpg` | Red Brick 03 | Façade du 770, muret |
| `textures/brick_wall_02_*_1k.jpg` | Brick Wall 02 | Bâtiments voisins |
| `textures/roof_slates_02_*_1k.jpg` | Roof Slates 02 | Ardoise (teintée) |
| `textures/herringbone_brick_*_1k.jpg` | Herringbone Brick | Allée, marches (teintée en rouge) |
| `textures/oak_veneer_01_*_1k.jpg` | Oak Veneer 01 | Portes, escalier, colombages |
| `textures/asphalt_02_*_1k.jpg` | Asphalt 02 | Chaussée |
| `textures/concrete_pavement_*_1k.jpg` | Concrete Pavement | Trottoir |
| `textures/plastered_wall_04_*_1k.jpg` | Plastered Wall 04 | Plâtre intérieur, pierre |
| `hdri/kloofendal_1k.hdr` | Kloofendal 48d Partly Cloudy (Pure Sky) | Ciel et éclairage d'ambiance |

Les textures ont été recompressées (JPEG qualité 72–80) pour le navigateur.

## Modèles 3D

| Fichier | Origine | Usage |
|---|---|---|
| `public/models/hasidic_man_v6_brasSym.glb` | Personnage généré avec **Meshy AI** par Samuel sous **abonnement payant** (27/10/2026), à partir d'une image de référence elle-même générée par IA (pas de photo d'une personne réelle). Retouché dans Blender (poids, matériaux, textures, animations Idle_11 / Walking / Quick_Walk / Running) puis bras gauche reconstruit en miroir du bras droit | Modèle de **tous** les hassids : avatar du joueur et tous les PNJ |
| `public/models/hasidic_man_v6.glb` | Même personnage, avant la reconstruction du bras gauche | Retour arrière (`?avatar=v6`) |
| `public/assets/models/hassid.glb` | Modèle généré avec Sculptly, fourni par Samuel (octobre 2026), anonymisé | Retour arrière (`?avatar=ancien`, `?pnj=ancien`) |

Meshy : d'après les conditions publiées par Meshy (FAQ et page des tarifs, consultées le 28/10/2026), les modèles créés avec un abonnement payant appartiennent à l'utilisateur et peuvent être utilisés commercialement, sous réserve que les éléments sources ne portent pas atteinte aux droits de tiers. Les justificatifs à conserver (abonnement, génération, image de référence) sont listés dans `docs/DROITS-PERSONNAGE-V6.md`. Les poses assise et de balancement sont calculées dans le code (`src/player/posesV6.ts`) : aucune animation supplémentaire n'a été générée.

Sculptly :

Le modèle d'origine portait le visage photographique d'une personne réelle. Il a été **anonymisé** avant publication avec `tools/anonymiser-glb.py` : visage en aplat de peau sans traits et relief lissé, barbe, cheveux et chapeau en aplat sombre, fragments de photo inutilisés effacés, texture réduite à 1024 px. Puis allégé avec glTF-Transform (`weld`, `simplify`) : environ 13 000 triangles, 0,6 Mo. Le fichier d'origine n'est pas versionné. Conditions d'utilisation de Sculptly : à vérifier par Samuel pour une diffusion publique.

## Textures générées par le code

Verre au plomb, sol moucheté, relief de frise, inscription, panneaux de texte : dessinés sur canvas au chargement (`src/world/texturesProcedurales.ts`).

## Polices

- Inter (SIL Open Font License) via `@fontsource/inter`
- Heebo (SIL Open Font License) via `@fontsource/heebo`

## Photographies de référence

Utilisées uniquement comme références de modélisation ; aucune n'est publiée ni plaquée en texture. Détail, licences et auteurs : `docs/REGISTRE.md`.

- Wikimedia Commons : Daykart (domaine public), Sagtkd (domaine public), ArnoldReinhold (CC BY-SA 3.0), Danny-w (CC BY-SA 4.0), אבגד (CC BY-SA 3.0), Rabbi michel (CC BY-SA 4.0).
- Sites d'actualité (droits réservés, référence seulement) : crownheights.info, theclio.com (photo Robbins Becher), anash.org, collive.com, israber.com.

## Bibliothèques

React, Three.js, React Three Fiber, @react-three/drei, @react-three/rapier (Rapier), Zustand, Vite.
