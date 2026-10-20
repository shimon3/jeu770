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
// - L'emplacement de l'escalier extérieur : placé dans la courette entourée
//   d'un parapet à balustres devant 784 (visible sur la photo Clio), sans
//   photo de l'escalier lui-même.
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
  largeur: 3.4, // ESTIMÉ — à calibrer
  hauteur: 3.2, // ESTIMÉ — à calibrer
  profondeur: 1.0, // ESTIMÉ
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
  // Courette en contrebas devant 784, entourée d'un parapet à balustres :
  // RECONSTITUTION ARTISTIQUE de l'accès (photo Clio pour le parapet).
  x0: 15.2,
  x1: 24.0,
  z0: -1.0, // façade de 784
  z1: 2.2,
  hautMarches: 15.6, // x du nez de la première marche (niveau trottoir)
  largeurMarches: 2.0,
  contremarche: 0.189, // ESTIMÉ
  giron: 0.28, // ESTIMÉ
  nombre: 18,
  porteX0: 21.4,
  porteLargeur: 1.4,
  porteHauteur: 2.3,
}
