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
