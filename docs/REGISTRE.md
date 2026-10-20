# Registre des sources et de la fidélité

Mis à jour : 20 octobre 2026 (phase 1).

## 1. Vérification des photographies Wikimedia Commons

Vérifiées le 20 octobre 2026 via l'API de Commons (existence, licence, auteur, description) puis examinées une à une pour les n° 1 à 7. Les 11 pages **existent**.

| N° | Fichier | Licence | Auteur | Date | Montre l'original de Brooklyn ? | Examinée |
|---|---|---|---|---|---|---|
| 1 | 770_Eastern_Parkway.jpg | Domaine public | Daykart (Wikipedia en anglais) | photo du 28/12/1990 | Oui : façade sous la neige, 3 pignons, voisin de droite | Oui |
| 2 | 770Lubavitch.JPG | Domaine public | Sagtkd (supposé, d'après la revendication de droits) | 19/02/2006 | Oui : **vue frontale de référence** de toute la façade | Oui |
| 3 | 770_Eastern_Parkway_entrance.jpg | CC BY-SA 3.0 | ArnoldReinhold | 04/06/2013 | Oui : porte, encadrement, console de l'oriel, inscription | Oui |
| 4 | Eastern_Parkway_770_-_front_door.jpg | CC BY-SA 4.0 | Danny-w | 13/09/2022 | Oui : console de l'oriel et inscription en gros plan | Oui |
| 5 | 770_וספריית_חב''ד.JPG | CC BY-SA 3.0 | אבגד (he.wikipedia) | 07/02/2008 | Oui : 770 à gauche, bibliothèque à droite | Oui |
| 6 | מרכז_חב-ד_העולמי_770.JPG | CC BY-SA 3.0 | אבגד | 22/11/2007 | Oui : vue en biais depuis la droite, profondeur du bâtiment | Oui |
| 7 | Bridge_from_770_to_Chabad_library.jpg | CC BY-SA 3.0 | אבגד | 07/02/2008 | Oui (selon la description) : passerelle vers la bibliothèque, vue depuis la cour arrière | Oui |
| 8 | Partial_view_of_synagogue_at_770_eastern_parkway.jpg | CC BY-SA 4.0 | Rabbi michel | 06/04/2020 | Selon la description : intérieur de la synagogue | **Non** (phase 3) |
| 9 | Chabad_hasidim_in_770.jpg | CC BY-SA 4.0 | Rabbi michel | 06/04/2020 | Selon la description : rassemblement de hassidim | **Non** (phase 3) |
| 10 | Lubavitcher_Rebbe's_Place.jpg | CC BY-SA 4.0 | Rabbi michel | 06/04/2020 | Selon la description : « Prayer site of the lubavitcher rebbe » | **Non** (phase 3) — à examiner avant tout usage, conformément à la règle absolue |
| 11 | Synagogue_curtain.jpg | CC BY-SA 4.0 | Rabbi michel | 06/04/2020 | Selon la description : le parokhet du 770 | **Non** (phase 3) |

Copies locales (1280 px) : `references/commons/NN.jpg`, métadonnées dans `references/commons/meta.json`. Le dossier `references/` n'est jamais publié (`.gitignore`). Aucune de ces photos n'est utilisée comme texture.

## 2. Photos des sites d'actualité (référence seulement, jamais publiées)

| Dossier | Source | Téléchargées | Examinées | Observations |
|---|---|---|---|---|
| `references/facade/` | crownheights.info (2022) + theclio.com (1re image seulement) | 15 / 15 | 15 / 15 | Chantier de l'allée 2022 : marches en brique à nez de pierre, piliers à chapeau pyramidal, porte restaurée. Les personnes visibles sont des ouvriers et responsables du chantier en 2022. |
| `references/couloir/` | anash.org (2021) | 25 / 25 | 25 / 25 (planche-contact) | Escalier en chêne à balustres tournés, poteaux à pommeau, colombages de chêne foncé sur plâtre crème, lustre en laiton, appliques, voûtes en plâtre, sol moucheté, faux-marbre brun dans le couloir. Personnes : équipe des travaux de 2021. |
| `references/bureau/` | anash.org, israber.com | 29 / 29 | **Non** (phase 2) | — |
| `references/beit-midrash/` | collive.com | 59 / 59 | **Non** (phase 3) | — |

Les dossiers `bureau/` et `beit-midrash/` seront examinés image par image au début des phases 2 et 3 ; toute image montrant le Rebbe (y compris un portrait ou une photo encadrée visible dans le décor) sera supprimée.

## 3. Registre des éléments 3D

| Élément 3D | Source(s) | Confirmé | Approximatif / reconstitution artistique |
|---|---|---|---|
| Composition de la façade | Commons 1, 2, 5 ; Clio | 3 travées sous 3 pignons (latéraux plus hauts que le central), brique rouge, encadrements de pierre claire | Toutes les cotes (largeurs de travées, hauteurs d'égout et de faîtage) : mesurées en pixels sur Commons 2, étalon porte = 2,30 m |
| Fenêtres de façade | Commons 2, 3 | 3 jours par fenêtre aux étages, grandes baies à imposte au rez-de-chaussée, verre au plomb en losanges, encadrements à harpes, appuis saillants | Nombre exact de jours des baies du rez-de-chaussée (3 à gauche, 4 à droite d'après Commons 2), dimensions |
| Vitraux à voiliers | Mosaic Magazine (texte) | Leur existence | **Non modélisés** : motifs non relevés |
| Oriel | Commons 2, 3, 4 | Oriel à pans, châssis noir, toit d'ardoise, posé sur une console de pierre | Angle des pans, saillie, hauteur |
| Inscription | Commons 3, 4 | Texte exact : « בית אגודת חסידי חב"ד / אהל יוסף יצחק ליובאוויטש » et « BEIS AGUDAS CHASIDEI CHABAD / OHEL YOSSEF YITZCHOK / LUBAVITCH » | Police et mise en page (texture générée, pas une photo) |
| Porte principale | Commons 3 ; crownheights.info 2022 | Porte en chêne clair, 2 jours vitrés en haut, panneaux, longue poignée en laiton côté gauche, gonds à droite | Proportions exactes des panneaux ; sens d'ouverture vers l'intérieur supposé |
| Encadrement de porte | Commons 3, 4 | Pierre claire, arc Tudor surbaissé, frise sculptée de feuillages, lanterne au-dessus | Motif de la frise (relief générique) |
| Petites fenêtres grillagées | Commons 3 | Une de chaque côté de la porte, grille en fer à pointes de lance | Dimensions |
| « 770 » gravé | Commons 3 | Chiffres à droite de la porte, en bas | Position exacte |
| Pignons, rampants, fleurons, plaques | Commons 1, 2 | Chaperons de pierre, fleurons au sommet, plaque en losange sur les pignons latéraux, plaque carrée au centre | Le motif des plaques (quadrilobe) n'est pas sculpté |
| Toiture | Commons 2, 6 | Ardoise gris-bleu visible entre les pignons | Toit plat à l'arrière et profondeur du bâtiment (22 m) : **supposés** |
| Cheminées | Commons 2 | Deux cheminées aux extrémités, avec mitrons | Hauteur, position en profondeur |
| Descentes d'eau | Commons 2, 3 | De part et d'autre de la travée centrale, métal gris | Diamètre |
| Bandeau de pierre | Commons 2 | Sous les fenêtres du 2e étage des travées latérales | Hauteur |
| Allée en brique, marches, palier | crownheights.info 2022 ; Clio | Allée en brique rouge (1977), 3 marches en brique à nez de pierre jusqu'au palier, 3 marches du trottoir à la cour dans l'ouverture du muret | Appareil en chevrons (texture CC0 générique), hauteurs de marche |
| Muret, piliers, grille | Commons 2 ; Clio ; crownheights.info | Muret de brique à chaperon de pierre, piliers à chapeau pyramidal de part et d'autre de l'entrée, grille en fer | Hauteurs, espacement des barreaux |
| Garde-corps des marches | Commons 2, 3 | Garde-corps en fer de chaque côté | Dessin simplifié |
| Thuyas, grand arbre | Commons 2, 3, 5 ; Clio | Deux conifères de part et d'autre de l'entrée, haies | Formes génériques |
| Bancs devant le muret | Clio | Bancs de bois devant le muret côté trottoir | Dessin et position |
| Lampadaires | Clio | Lampadaires à fût vert | Modèle simplifié |
| Rue (trottoir, contre-allée, terre-plein, chaussée) | Commons 5 ; Clio | Trottoir, contre-allée avec voitures garées, arbres | Toutes les largeurs |
| Bâtiment voisin de gauche | Clio | Immeuble de brique à bandeaux clairs, plus haut que le 770 | **Volume approximatif** |
| Bibliothèque (voisin de droite) | Commons 5 ; Clio | Brique, pignon, portail de pierre, terrasse à balustres | **Volume approximatif** |
| Hall : matériaux | anash.org 2021 (couloir) | Plâtre crème, colombages de chêne foncé, escalier de chêne à balustres tournés, poteaux à pommeau, lustre en laiton, appliques, sol moucheté | Teintes |
| Hall : disposition | Aucune | — | **Reconstitution artistique** : position de l'escalier, des portes, dimensions (5 × 8,2 m). Signalé en jeu. |
| Porte vers l'antichambre | Shabboshouse.org (texte) | Le bureau est au rez-de-chaussée, à gauche de l'entrée vue de la rue | Emplacement de la porte dans le hall : **reconstitution artistique** |
| Étage (palier) | Aucune | — | **Reconstitution artistique** |
| Tableau d'annonces | Brief | Demandé par le brief | Aspect et emplacement inventés |
| Horaires des tefilot | `src/config/tefilot.json` | — | **Valeurs d'exemple**, signalées comme telles en jeu |

## 4. Liaisons intérieures

| Liaison | Statut |
|---|---|
| Rue → cour → porte principale → hall | Confirmée (entrée principale) |
| Hall → escalier → étage | Escalier en chêne confirmé (anash.org 2021) ; son emplacement par rapport à l'entrée est une **reconstitution artistique** |
| Hall → antichambre / bureau | À gauche de l'entrée (confirmé par le texte) ; porte fermée en phase 1 |
| Hall → couloir du fond | Porte fermée, non vérifiée |
