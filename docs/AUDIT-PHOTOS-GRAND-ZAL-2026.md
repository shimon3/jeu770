# Audit photographique — Grand Zal original de Brooklyn (21 octobre 2026)

> Statut : AUDIT PARTIEL, aucune correction architecturale autorisée par les sources disponibles à ce stade. Ce document ne valide **pas** la fidélité complète du jeu ni la conformité à la galerie Google Maps fournie. L'état de référence implémenté dans le jeu est Tichri 2025.

## Périmètre / accès vérifié
- Dépôt analysé : https://github.com/shimon3/jeu770 , branche `master`, commit `7fdb221c5e4da098d1331665b34586027ee3ce64`.
- Site publié : https://jeu770.pages.dev/ — le navigateur de consultation n'a pas pu charger le rendu interactif. **Pas de comparaison visuelle jeu/photo** effectuée.
- Lien Google Maps fourni pour « 770 Eastern Pkwy, Brooklyn » : la galerie de photos n'est pas accessible depuis le navigateur de consultation. **Aucune photographie individuelle de cette galerie n'a été contrôlée** ; demander des captures utilisateur avant une correction basée sur cette galerie.
- `docs/photos/beit-midrash.txt` : **59 adresses d'images externes** (COLlive). Ce sont des références, pas des textures importées dans `public/assets`.
- Règle du projet conservée : uniquement Brooklyn (jamais les répliques), aucune image du Rebbe réutilisée, sa place et son fauteuil restent vides.

## Photos extérieures au dépôt examinées / identifiées
| Source | Date | Observations utilisables | Limites |
|---|---|---|---|
| https://commons.wikimedia.org/wiki/File:Partial_view_of_synagogue_at_770_eastern_parkway.jpg | 2020, Rabbi michel, CC BY-SA 4.0 | Vue partielle d'un intérieur identifié comme synagogue du 770 ; référence au sol, mobilier et structure | Cadrage partiel ; ne fixe pas les dimensions ni le plan |
| https://anash.org/770-shul-sparkling-clean-and-ready-for-pesach/ | 04/04/2023, photos Avreimke Eisenshtein | Rangées de bancs en bois, supports visibles, luminaires encastrés, piliers clairs, boiseries et Aron | Une époque différente ; ne pas transposer automatiquement la couleur du parokhet à Tichri 2025 |
| https://anash.org/770-shul-sparkles-in-time-for-pesach/ | mars 2026 | Carrelage beige/crème avec accents bruns/saumon, plafonniers rectangulaires, tables et pupitres en bois | Salle dégagée pour nettoyage, **ne fournit pas une disposition normale des bancs** |
| https://collive.com/770-shul-prepared-for-hakafos-7/ | 13/10/2025, Mendy Krief/COLlive | Série archivées de référence déjà documentée dans REGISTRE.md | Salle préparée pour les hakafot : ne pas considérer le mobilier déplacé comme disposition permanente |
| https://collive.com/770-shul-prepared-for-hakafos-8/ | 02/10/2026 | Date et contexte de préparation des hakafot vérifiés | Les photos de la galerie n'ont pas été examinées individuellement : ne pas en déduire des modifications visuelles |

**Droits :** les images d'Anash et COLlive ne sont que des références ; ne pas les inclure dans le dépôt ou les plaquer comme textures. Une photo Wikimedia sous CC BY-SA nécessite attribution et respect de la licence en cas de réutilisation.

## Correspondances présentes dans le code
- `src/config/grandZal.ts` : ensemble souterrain, colonnes, Aron, bimah, accès, cotes **estimées**.
- `src/world/grand-zal/EnveloppeZal.tsx` : murs clairs/briques peintes, piliers carrés, galeries, bibliothèques et plafond.
- `src/world/grand-zal/texturesZal.ts` : motif de carrelage inspiré des sources, **motif exact estimé** ; texture de bois, plafond et banderole.
- `src/world/grand-zal/MobilierZal.tsx` : rangées de bancs, tables et gradins ; **nombre, alignement et orientation estimés**.
- `src/world/grand-zal/AronKodesh.tsx` : structure dorée et parokhet blanc d'après références **Tichri 2025**, non interchangeable sans vérification de l'époque.
- `src/world/grand-zal/BimahZal.tsx`, `PlafonniersZal.tsx`, `PlaceVide.tsx` : bimah, luminaires/ventilateurs et estrade vide.
- `src/config/grandZal.ts` / `src/world/complexe/Complexe784.tsx` : accès souterrain **placé artistiquement**, sans preuve photographique de son emplacement.

## Corrections nécessaires avant toute prétention de fidélité
1. **Comparer des captures du jeu** (mêmes angles que les photographies) au rendu actuel. Le site n'a pas été inspectable ici.
2. **Identifier et dater les photos Google Maps** vues par l'utilisateur ; vérifier qu'elles montrent l'original et la salle principale, pas la petite synagogue ou une réplique.
3. **Relever séparément** position de l'Aron, bimah, piliers, bancs, allées, galerie, ventilateurs, luminaires, gradins, entrée et escaliers. Marquer « non établi » si l'angle ne suffit pas.
4. **Choisir un état daté** de la salle avant toute modification : Tichri 2025 (actuel), 2026 ou autre. Ne pas fusionner arbitrairement une salle vide pour hakafot et une salle équipée en semaine.
5. Implémenter une petite modification vérifiable à la fois dans `src/config/grandZal.ts` et les composants concernés ; vérifier collisions, déplacements, missions, français/hébreu et performances mobiles.
6. Exécuter `npm run build`, `npm run test:mobile` et un contrôle visuel en situation avant fusion/déploiement.

## Conclusion
L'architecture générale est déjà largement modélisée. Les plus grosses inconnues sont **la position exacte des rangées et des colonnes, l'accès souterrain, et les proportions**. Aucun changement de géométrie n'est effectué par ce seul audit, pour éviter d'« inventer » un plan à partir de photos inaccessibles.

## Découverte indépendante : rapport photographique du complexe (2020)

**Source primaire exploitable :** https://media.chabad.info/chabadinfoheb/wp-content/uploads/2020/08/06-08-2020-12-39-22-Ex-B-to-DSA-Aff.pdf — Aaron Valuation, étude immobilière datée du 16 juin 2020, pages PDF **6, 9 et 10** (index zéro 5, 8, 9). Ce rapport a été préparé pour Chabad Lubavitch et concerne les cinq parcelles contiguës 770, 784, 788 Eastern Parkway et 302-304 Kingston Avenue. Les photos d'intérieur ont été **fournies par le client** ; l'auteur du rapport indique ne pas avoir lui-même inspecté l'intérieur.

### Constatations précises sur les photos

- **Page PDF 6, photographies extérieures** : le 784-788 comporte une **entrée inférieure large avec plusieurs portes en bois vitrées**, sous une terrasse/plateforme haute, des escaliers latéraux visibles et une longue rampe d'accès munie d'un garde-corps métallique. Cela donne un repère solide pour la façade et la descente du joueur vers le grand Zal. **L'agencement exact de toutes les liaisons ne se déduit pas d'une seule photo**.
- **Page PDF 9, photo supérieure** : perspective plongeante d'une vaste salle avec rangées de bancs et tables en bois, panneau de textes hébreux sur les boiseries, colonnes claires, lustres/ventilateurs, plafond à dalles lumineuses carrées au centre et luminaires étroits parallèles sur les parties latérales. Photo de 2020 : **configuration non automatiquement valide en 2025–2026**.
- **Page PDF 9, photo inférieure** : vue claire de la **bimah en bois avec balustrades, escaliers et plateforme surélevée** ; motif de carrelage à grands encadrements de bandes et carrés saumon ; blocs de bancs sur les côtés ; horloge contre lambris au fond.
- **Page PDF 10, photo supérieure gauche** : rangées parallèles de longs bancs foncés, couloir central au carrelage crème à carrés saumon, colonnes alignées et **Aron Kodesh en bois sur estrade**, avec garde-corps/escalier latéral. Cette photo permet d'évaluer l'axe bimah → Aron.
- **Page PDF 10, photo inférieure gauche** : luminaires en bandeaux sur faux plafond plus bas, bibliothèques/rangements et mobilier en bois ; il peut s'agir d'un secteur annexe du complexe, **ne pas l'attribuer au grand Zal sans corroboration**.
- **Page PDF 10, photo inférieure droite** : hall/vestibule distinct, grandes portes vitrées en bois et plafonniers ronds ; **ne pas confondre avec le grand Zal**.

### Différences avec le code actuel et actions recommandées

| Composant actuel | Constat photo 2020 | Intervention sûre |
|---|---|---|
| `Complexe784.tsx` : accès en courette étroite avec 18 marches et porte individuelle | La façade montre une **entrée inférieure bien plus large**, plusieurs portes et un escalier/rampes latéraux | **Priorité haute** : repenser visuellement l'accès. Conserver provisoirement les chemins de collision tant que la topographie n'est pas recalée ; ne pas inventer les cotes |
| `PlafonniersZal.tsx` : panneaux uniformes (1,2 × 0,6 m), ventilateurs | Les photos montrent des **zones de panneaux lumineux carrés et des zones de barres allongées**, avec ventilateurs | Distinguer deux familles de luminaires selon la zone, après confirmation sur sources 2025/2026 |
| `texturesZal.ts` : carrelage à losange central + quatre coins | Les clichés 2020 montrent plutôt des **carrés saumon répartis au centre des carreaux et des bandes rectilignes**, sans losange central évident | Réviser le motif à partir de vues 2025/2026 ; c'est une **différence photographique établie**, pas une cote |
| `MobilierZal.tsx` : bancs systématiquement orientés vers +x en grille procédurale | Les photos 2020 présentent des bancs longs dans des blocs, avec **allées et circulation autour de la bimah** | Réévaluer les rangées, leurs axes et les couloirs ; aucune coordonnée exacte certifiée par les photos |
| `BimahZal.tsx` : balustrade, marche, table | Correspondance de principe **confirmée visuellement** | Affiner les panneaux, les balustres et le positionnement quand des vues 2025 comparables seront trouvées |
| `AronKodesh.tsx` : estrade, garde-corps, bois | Correspondance de principe **confirmée** ; parokhet 2025 blanc n'est pas daté 2020 | Garder la version **Tichri 2025** tant qu'une actualisation n'a pas été demandée explicitement |

**Limitation persistante** : la fiche Google Maps de 770 Eastern Parkway est retrouvée sur https://www.google.com/maps/search/770%2BEastern%2BParkway mais n'expose qu'une « limited view » sans galerie photo exploitable par l'outil. Les pages PDF ci-dessus sont bien visualisées, mais ne sont **pas** des photos Google Maps. Le texte du rapport n'autorise pas la republication de ses photographies : conserver uniquement le lien et l'analyse, pas les images dans `public/assets`.


## Exécution — branche de corrections du 21 octobre 2026

Les différences **documentées et suffisamment visibles** ont été appliquées dans la branche `ameliorations-grand-zal-photos-2026`, sans déplacement des coordonnées centrales non vérifiées :
- carrelage : losange retiré au profit de bandes rectilignes et petits carrés ;
- plafonnier : deux types de sources (dalles carrées / réglettes) selon l'altitude de plafond ;
- mobilier : supports et tablettes réalistes des bancs ;
- Aron : détail des colonnes, corniches et du parokhet ;
- accès inférieur : plusieurs portes vitrées et garde-corps, avec maintien du chemin jouable.

Les trois portes supplémentaires sur la façade sont **décoratives et non traversables**, l'escalier actuel et la porte interactive sont préservés pour ne pas casser les missions. L'emplacement réel et le nombre exact de vantaux restent inconnus. Voir `docs/PROGRESS.md` pour les changements et les vérifications CI. La galerie Google Maps n'a toujours pas été accessible dans l'outil.
