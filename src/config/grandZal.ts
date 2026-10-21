// Grand Zal souterrain (état de référence : Tichri 2025) et accès depuis la rue.
//
// CE QUI EST CONFIRMÉ (voir docs/REGISTRE.md) :
// - Le Zal est sous le niveau de la rue, principalement sous 784 et 788
//   Eastern Parkway (Wikipedia ; chabad.org « What Is 770 ») ; il comprend
//   aussi l'ancien « shalash », bâti dans la cour arrière du 770 (ChabadInfo,
//   « Ever Expanding »).
// - 784-788 est à DROITE du 770 vu de la rue (OpenStreetMap ; photo COLlive
//   11/2025).
// - « Depuis la rue, on descend des marches » (chabad.org, The Revolutionaries).
// - Trois grands piliers marquent les anciennes limites shalash / 784 / 788.
// - Matériaux et mobilier : photos COLlive (Hakafot, 13/10/2025) et Commons
//   8-11 (2020).
//
// CE QUI EST UNE RECONSTITUTION ARTISTIQUE :
// - Le plan exact (aucun plan publié trouvé), toutes les cotes ci-dessous.
// - Les cotes de l'escalier extérieur. Sa disposition (descente frontale
//   depuis le trottoir, deux portes en bas sur la façade avant) est, elle,
//   confirmée par la photo de nuit n° 4 fournie par Samuel (2026).
// - La position des piliers, des blocs de bancs, des gradins et des tables.
//
// Repère identique à dimensions.ts : x vers la droite vu de la rue (est),
// z vers la rue (sud), y vers le haut, 0 = trottoir.

export const ZAL = {
  sol: -3.4, // ESTIMÉ — à calibrer
  plafond: 1.15, // ESTIMÉ — à calibrer (≈ 4,5 m sous faux plafond)
  soffite: -0.8, // ESTIMÉ — à calibrer (plafond bas en périphérie, bibliothèques dessous)
  profondeurSoffite: 3.0, // ESTIMÉ — à calibrer
  // Salle principale sous 784-788
  x0: 9.6, // limite 770 / 784 — ESTIMÉ
  x1: 40.0, // ESTIMÉ — reconstitution artistique
  z0: -31.0, // fond (nord) — ESTIMÉ
  z1: -1.0, // façade de 784 (sud) — ESTIMÉ
  // Aile ouest : ancien shalash, dans la cour arrière du 770
  shalashX0: -6.0, // ESTIMÉ — reconstitution artistique
  shalashZ1: -23.0, // derrière le mur arrière du 770 (profondeur 22 m ESTIMÉE)
  epaisseurMur: 0.3,
}

// Grille des colonnes carrées blanches (photos 2025) — positions ESTIMÉES
export const COLONNES = {
  cote: 0.42,
  xs: [15.0, 20.4, 26.6, 32.0],
  zs: [-4.0, -10.0, -22.0, -28.0],
}

// Les trois grands piliers des anciennes limites (ChabadInfo) — positions ESTIMÉES
export const GRANDS_PILIERS: [number, number][] = [
  [9.6, -27.0], // fin du shalash / début de 784
  [23.6, -10.0], // fin de 784
  [24.9, -22.0], // début de 788
]

export const BIMAH = {
  // Enceinte de bois à balustres sur roulettes (Commons 8 ; COLlive 2025)
  x: 23.5,
  z: -16.0,
  cote: 3.6, // ESTIMÉ — à calibrer
  hauteurPlancher: 0.3, // ESTIMÉ
  hauteurGardeCorps: 1.1, // ESTIMÉ
}

export const ARON = {
  // Contre le mur est, sur une estrade avec marches et garde-corps (COLlive 2025)
  x: 40.0,
  z: -16.0,
  // Toujours FERMÉ : parokhet tiré en permanence (photo n° 3 fournie par
  // Samuel, 2026). Aucune variante ouverte n'existe dans le jeu.
  largeur: 3.9, // ESTIMÉ — à calibrer (élargi pour un meuble plus imposant)
  hauteur: 3.2, // ESTIMÉ — à calibrer (limité par le faux plafond)
  profondeur: 1.15, // ESTIMÉ
  estradeHauteur: 0.9, // ESTIMÉ
  estradeProfondeur: 2.8, // ESTIMÉ
  estradeLargeur: 7.0, // ESTIMÉ
}

export const PLACE_VIDE = {
  // Place du Rebbe : estrade au sud de l'Aron (côté rue), fauteuil VIDE,
  // pupitre, tapis (Commons 10, 2020 ; COLlive 2025 photo 020). Position
  // ESTIMÉE : « dans l'angle sud-est » à l'époque du shalash (ChabadInfo) et
  // estrade à escalier à droite de l'Aron sur la photo COLlive 016.
  // Aucun PNJ n'y accède.
  x0: 37.0,
  x1: 40.0,
  z0: -12.2,
  z1: -8.2,
  hauteur: 1.0, // ESTIMÉ
  rayonExclusionPnj: 4.0,
}

export const ENTREE = {
  // Courette anglaise FRONTALE devant 784 (photo de nuit n° 4 fournie par
  // Samuel, 2026) : depuis le trottoir, un escalier droit descend
  // perpendiculairement à la façade, vers le sous-sol ; en bas, un palier et
  // DEUX portes dans la façade avant donnent sur le grand Zal.
  // CONFIRMÉ par la photo 4 : accès sur la face avant, descente frontale,
  // deux portes en bas. ESTIMÉ (reconstitution artistique) : la position en
  // x, la largeur, le nombre exact de marches, la profondeur du palier, les
  // cotes des portes.
  // Cette disposition remplace l'ancienne descente latérale (escalier
  // parallèle à la façade, partant de la gauche, puis une seule porte).
  x0: 19.35, // nu extérieur du mur de soutènement ouest — ESTIMÉ
  x1: 23.45, // nu extérieur du mur de soutènement est — ESTIMÉ
  mur: 0.25, // épaisseur des murs de soutènement — ESTIMÉ
  z0: -1.0, // façade de 784
  palier: 1.4, // profondeur du palier bas devant les portes — ESTIMÉ
  contremarche: 0.189, // ESTIMÉ
  giron: 0.28, // ESTIMÉ
  nombre: 18, // ESTIMÉ (18 × 0,189 m = 3,40 m, profondeur du Zal)
  porteHauteur: 2.3, // ESTIMÉ
  // Les deux portes du bas. La première garde l'id historique « porte-zal ».
  portes: [
    { id: 'porte-zal-2', x0: 19.85, largeur: 1.3 }, // ESTIMÉ
    { id: 'porte-zal', x0: 21.65, largeur: 1.3 }, // ESTIMÉ
  ],
}

// Bord intérieur de la courette et nez de la marche du haut (niveau trottoir)
export const COURETTE = {
  xa: ENTREE.x0 + ENTREE.mur,
  xb: ENTREE.x1 - ENTREE.mur,
  zBas: ENTREE.z0 + ENTREE.palier, // pied de l'escalier
  zHaut: ENTREE.z0 + ENTREE.palier + ENTREE.nombre * ENTREE.giron, // arrivée au trottoir
}

// Petite pièce de la « sainte chaise du Rabbi » (photo n° 5 fournie par
// Samuel, 2026 : boiseries murales, tapis, chaise de velours rouge, pupitre).
// RECONSTITUTION ARTISTIQUE : l'emplacement réel de la pièce n'est pas établi
// par une source ; elle est placée ici contre le mur est du Zal, au sud de
// l'Aron, avec une porte dans ce mur. Cotes ESTIMÉES.
// RÈGLE ABSOLUE : la chaise reste VIDE. Le joueur ne peut ni s'y asseoir ni
// l'approcher (garde-corps) ; aucun PNJ n'entre dans la pièce.
export const PIECE_CHAISE = {
  x0: ZAL.x1 + ZAL.epaisseurMur, // derrière le mur est du Zal
  x1: 44.6, // ESTIMÉ
  z0: -5.4, // ESTIMÉ
  z1: -1.4, // ESTIMÉ
  plafond: -0.75, // ESTIMÉ (sous la dalle du trottoir voisin)
  porteZ0: -3.6, // ESTIMÉ
  porteZ1: -2.6, // ESTIMÉ
  porteHauteur: 2.2, // ESTIMÉ
  garde: 42.9, // x du garde-corps qui tient la chaise à distance — ESTIMÉ
  rayonExclusionPnj: 2.0,
}
