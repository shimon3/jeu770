# Audit — façade du 770, accès frontal au grand Zal, Aron Kodesh, pièce de la chaise (21 octobre 2026)

> Statut : modifications faites **d'après la description écrite** des cinq photos de référence fournies par Samuel. Les photos elles-mêmes n'étaient pas jointes à la session de travail : **aucune comparaison image par image n'a été faite**. Ce document ne valide pas la fidélité ; il dit ce qui a changé et ce qui reste estimé.

## Ce qui est exact (selon la description des photos)
- Photo 1 : porte centrale **en bois**, **oriel noir** au-dessus, **pierre claire** autour de la porte → conservés et renforcés.
- Photo 2 : un arbre se trouve devant la façade → **retiré volontairement** (choix de jeu, pour la vue).
- Photo 3 : Aron Kodesh **fermé**, parokhet **fermé** → aucun état ouvert dans le jeu.
- Photo 4 : accès par la **façade avant** de 784 ; escalier qui **descend du trottoir** vers le sous-sol ; **deux portes** en bas.
- Photo 5 : petite pièce avec **boiseries**, **tapis**, **chaise rouge**, **pupitre** ; ambiance sobre.

## Ce qui reste estimé (reconstitution artistique)
| Élément | Valeur dans le jeu | Fichier |
|---|---|---|
| Parement de pierre autour de la porte | 3,90 × 3,05 m | `src/config/dimensions.ts` (`PORTE.champPierre*`) |
| Position de la courette frontale | x = 19,35 → 23,45 m (centrée sur 21,4) | `src/config/grandZal.ts` (`ENTREE`) |
| Escalier | 18 marches de 0,189 × 0,28 m, largeur 3,6 m | idem |
| Palier bas | 1,4 m de profondeur | idem |
| Deux portes | 1,30 × 2,30 m, trumeau de 0,5 m | idem (`ENTREE.portes`) |
| Couleur du parokhet | blanc (Tichri 2025, COLlive) | `src/world/grand-zal/materiauxZal.ts` |
| Dimensions de l'Aron | 3,9 × 3,2 × 1,15 m (hauteur limitée par le faux plafond) | `src/config/grandZal.ts` (`ARON`) |
| Pièce de la chaise : emplacement | derrière le mur est du Zal, au sud de l'Aron, porte à z = −3,6 → −2,6 m | `src/config/grandZal.ts` (`PIECE_CHAISE`) |
| Pièce de la chaise : cotes et mobilier | 4,3 × 4,0 m, plafond 2,65 m ; formes de la chaise et du pupitre | `src/world/grand-zal/PieceChaise.tsx` |

## Contrôles
- Règle absolue : la chaise reste vide, garde-corps fermé, aucun PNJ dans la pièce ; aucune représentation du Rebbe.
- Missions inchangées : la mission « descendre au Zal » se valide toujours par l'entrée dans la zone `grand-zal`, atteinte par l'une ou l'autre des deux portes.
- Commandes clavier et tactiles, textes FR/HE : inchangés ; nouveaux textes ajoutés dans les deux langues (`zone.chaise-rabbi`, `zal.chaiseTexte`).

## À faire par Samuel
1. Comparer le jeu aux photos 1 à 5 et signaler les écarts (proportions du parement, largeur de la courette, couleur du parokhet).
2. Copier les photos dans `references/` (non publié) avec leur origine.
3. Indiquer, si connu, l'emplacement réel de la pièce de la chaise.
