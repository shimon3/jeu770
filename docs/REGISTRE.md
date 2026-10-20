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
| Bâtiment voisin de gauche = **766, bibliothèque** (corrigé en phase 2) | Clio ; OpenStreetMap ; COLlive 11/2025 | Immeuble de brique à bandeaux clairs, plus haut que le 770, à l'ouest du 770 | **Volume approximatif** |
| Bâtiment voisin de droite = **784-788** (corrigé en phase 2 ; la phase 1 l'appelait à tort « bibliothèque ») | Clio ; OpenStreetMap ; COLlive 11/2025 | Brique, pignon, portail de pierre, parapet à balustres, à l'est du 770 | **Volume approximatif** |
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

---

# Phase 2 — Grand Zal souterrain (mise à jour du 20 octobre 2026)

## 5. Correction d'identification des bâtiments

Coordonnées OpenStreetMap (Nominatim), d'ouest en est : 766 (−73,94307) → 770 (−73,94280) → 784 (−73,94260) → 788 (−73,94243) → Kingston Avenue (−73,94218). Vu depuis le trottoir, **la bibliothèque (766) est à gauche, 784-788 à droite**. Confirmé visuellement par la photo de groupe COLlive du 16/11/2025 (vue frontale : immeuble à fenêtres cintrées à gauche du 770, bâtiment Tudor à pignon à droite).

## 6. Sources consultées pour la phase 2

| Source | Date | Statut | Utilisation |
|---|---|---|---|
| chabad.org, « What Is 770 » | — | Lue | Le Zal occupe le sous-sol reconstruit et l'ancien rez-de-chaussée de l'immeuble voisin ; bancs de bois, gradins |
| chabad.org, « The Revolutionaries » (T. Freeman) | vers 2006, récit après 1991 | Lue | « Depuis la rue, on descend des marches » |
| ChabadInfo, « Ever Expanding » (Hatomim) | — | Lue | Shalash dans la cour du 770 (1959-1960), achat de 784-788 (1965), travaux (1967), 3 grands piliers marquant les anciennes limites |
| Wikipedia, « 770 Eastern Parkway » et « New York City synagogue tunnel incident » | — | Lues | Synagogue souterraine surtout sous 784 et 788 ; galerie des femmes à l'étage au-dessus ; un escalier mène à la synagogue |
| OpenStreetMap (Nominatim) | consulté le 20/10/2026 | Interrogé | Ordre des bâtiments |
| COLlive, « 770 Shul Prepared for Hakafos » (photographe : filigrane « Mendi ») | 13/10/2025 | 38 photos téléchargées et examinées, aucun portrait affiché | **Référence principale du Zal (Tichri 2025)** |
| COLlive, « Shluchim Group Photo: Second Gallery » | 16/11/2025 | 110 photos téléchargées ; surtout des foules | Ordre des bâtiments (photo 099) |
| COLlive, « Photo: An Army of Light » | 16/11/2025 | 3 photos utiles (1 hors sujet supprimée) | Vue d'ensemble |
| Commons 8 à 11 (Rabbi michel, CC BY-SA 4.0) | 06/04/2020 | Examinées ; aucune ne montre le Rebbe ; n° 10 = place vide | Bimah, bancs, galerie, place vide ; parokhet bleu de 2020 **non utilisé** (autre époque) |
| anash.org, « 80 Years Since Purchase of 770 » | 02/08/2020 | Texte lu, images non téléchargées | Historique |
| anash.org, « 770's Tashlich Pond in 5735 » | 02/10/2024 | Texte lu, images **non téléchargées** (sans légendes, risque d'images du Rebbe) | Hors époque, non utilisé |
| ChabadInfo, « 100 Rare Details » (Dov Ber Hechtman) | 11/2022 | Page accessible ; 103 images **pas encore examinées** | À faire |
| COLlive : Seli'hot (14/09/2025), Tisha BeAv (03/08/2025), Leil Shishi (17/10/2025), Tsom Guedalia (15/09/2026), Picture of the Day 1714 (19/09/2025) | — | Pages accessibles, images **pas encore examinées** | À faire |
| PDF « mbhg-e » (1943-1945) | — | **Non consulté** | À faire (texte seulement) |
| Urban Archive (1965) | — | **Inaccessible** (HTTP 403, protection anti-robots) | — |
| chabad.org, « Portraits Offer Deeper Revelations » | — | **Exclue** : collection de photos du Rebbe (règle absolue) | — |
| Images A à D fournies par l'utilisateur | — | **Pas encore reçues** | Disposition des bancs, colonnes, estrades à confirmer |

Toutes les photos d'actualité restent dans `references/` (exclu de git) : référence de modélisation uniquement, jamais publiées ni plaquées en texture.

## 7. Registre des éléments 3D du grand Zal

| Élément 3D | Source(s) | Confirmé | Approximatif / reconstitution artistique |
|---|---|---|---|
| Emplacement souterrain sous 784-788 + shalash | Wikipedia ; chabad.org ; ChabadInfo | Sous le niveau de la rue, sous 784 et 788, plus l'ancien shalash dans la cour du 770 | Emprise (30 × 30 m + aile ouest), profondeur (−3,4 m), hauteur (4,5 m) |
| Accès depuis la rue | The Revolutionaries ; Wikipedia | Un escalier descend de la rue | **Reconstitution artistique** : escalier de 18 marches dans la courette à balustres devant 784 (aucune photo de l'escalier réel) |
| Sol carrelé | COLlive 2025 (021, 026, 037) ; Commons 8 | Carreaux crème, losanges et bandes saumon | Motif exact et espacement |
| Colonnes carrées blanches, base évasée | COLlive 2025 ; Commons 8 | Forme, couleur | Grille et nombre |
| Trois grands piliers | ChabadInfo | Leur existence et leur rôle | Positions |
| Faux plafond, néons, ventilateurs, lustres de cristal | COLlive 2025 ; Commons 8, 9 | Présents | Nombre et répartition |
| Galerie lambrissée et vitrée en hauteur | COLlive 2025 (021, 031, 037) ; Commons 8, 9 | Lambris foncé, bandeau de vitres sombres en haut des murs | Identification comme galerie des femmes probable (Wikipedia), non vérifiée sur photo |
| Plafonds bas périphériques avec bibliothèques | COLlive 2025 (037) | Présents | Profondeur, longueur |
| Murs de brique peinte en blanc (côté Aron) | COLlive 2025 (005, 016, 038) ; Commons 10 | Présents | Étendue |
| Bancs à dossier et tablette à livres | Commons 8 | Forme | Nombre, rangées, orientation (en attente des images A à D) |
| Tables d'étude, pupitres | COLlive 2025 ; The Revolutionaries | Présents | Positions |
| Gradins | chabad.org (« bleachers ») | Leur existence | **Position et forme : reconstitution artistique** |
| Bimah | Commons 8 ; COLlive 2025 (032-034) | Enceinte de bois à balustres, sur roulettes, table couverte de bordeaux | Dimensions, position |
| Aron Kodesh | COLlive 2025 (005, 006, 016) | Bois doré sculpté, couronnement en gradins, pilastres marquetés en chevrons, parokhet **blanc** et cantonnière frangée d'or (Tichri 2025), estrade avec marches et garde-corps | Dimensions ; broderies simplifiées ; aucune inscription (illisible sur les photos de 2025) |
| Place du Rebbe, **VIDE** | Commons 10 ; COLlive 2025 (020) | Estrade, lambris, fauteuil de velours rouge, pupitre à housse blanche frangée d'or, tapis | Position au sud de l'Aron : ESTIMÉE (« angle sud-est » à l'époque du shalash, ChabadInfo ; estrade à droite de l'Aron sur COLlive 016) |
| Banderole « יחי אדוננו מורנו ורבינו מלך המשיח לעולם ועד » | COLlive 13/10/2025 (photo 036) ; même texte sur Commons 11 | **Texte vérifié sur deux sources** | Position, taille, police |
| Autres banderoles | COLlive 2025 | Présentes | **Non reproduites** : textes non relevés avec certitude |
| Horloge murale, panneau EXIT | Commons 9 | Présents | Positions |
| Bâtiment 784-788 en surface | Clio ; COLlive 11/2025 | Pignon, portail de pierre, parapet à balustres | Volume, fenêtres |
| Panneau indicateur sur le trottoir | — | — | **Élément de jeu**, n'existe pas dans la réalité |

## 8. Liaisons (phase 2)

| Liaison | Statut |
|---|---|
| Rue → courette de 784 → escalier → porte → grand Zal | Descente depuis la rue confirmée ; **emplacement exact : reconstitution artistique** |
| Salle principale ↔ aile ouest (ancien shalash) | Confirmée (mur abattu en 1967, ChabadInfo) |
| Hall du 770 ↔ grand Zal | **Non créée** : aucune source ne la décrit |
