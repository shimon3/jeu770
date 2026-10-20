// Pièces du 770 derrière le hall (rez-de-chaussée et étage).
//
// CONFIRMÉ :
// - Le bureau du Rebbe est au rez-de-chaussée, à gauche de l'entrée vue de la
//   rue, avec une fenêtre sur Eastern Parkway (shabboshouse.org ;
//   crownheights.info ; anash.org).
// - Son antichambre s'appelle « Gan Eden HaTa'hton » (anash.org).
// - Mobilier du bureau d'après anash.org (2025, photos 02 et 03) : lambris de
//   chêne foncé, bibliothèques vitrées, plancher de chêne à larges lames,
//   grand bureau à plateau de verre, fauteuil de cuir fauve, table ronde
//   sculptée (Rebbe Maharash), pupitres sous housses de velours noir frangées
//   d'or, classeur métallique, fenêtres à meneaux avec stores en bois.
// - La petite synagogue d'origine reste en usage dans le 770 (chabad.org).
// - L'étage abritait l'appartement du Rabbi précédent (chabad.org).
//
// RECONSTITUTION ARTISTIQUE : toutes les positions et dimensions ci-dessous,
// la forme de l'antichambre, le couloir, l'emplacement du petit zal, tout
// l'aménagement de l'appartement (aucune photo vérifiée).

export const MAISON = {
  xOuest: -7.85, // face intérieure du mur latéral gauche (façade 16,6 m, murs 0,45 m)
  xEst: 7.85,
  zFond: -21.55, // face intérieure du mur arrière (profondeur 22 m ESTIMÉE)
  ep: 0.15, // cloisons
}

export const BUREAU = {
  // Pièce d'angle avant gauche, derrière la grande baie gauche du rez-de-chaussée
  x0: MAISON.xOuest,
  x1: -3.6, // ESTIMÉ
  z0: -5.2, // ESTIMÉ
  z1: -0.45,
  porteZ0: -4.05, // porte (ouverte) vers l'antichambre, dans la cloison est
  porteZ1: -3.0,
}

export const ANTICHAMBRE = {
  // En L : bande le long du hall + salle derrière le bureau. ESTIMÉ
  bandeX0: BUREAU.x1,
  x1: -2.15, // mur ouest du hall
  zArriere: -8.6,
}

export const COULOIR = {
  x0: -1.6, // ESTIMÉ
  x1: 0.6,
  z0: -12.0,
  z1: -8.75,
}

export const PETIT_ZAL = {
  x0: MAISON.xOuest,
  x1: MAISON.xEst,
  z0: MAISON.zFond,
  z1: COULOIR.z0,
}

export const APPARTEMENT = {
  // Étage, aile ouest : salon (avant, fenêtre sur la rue) et cabinet (arrière)
  x0: MAISON.xOuest,
  x1: -2.15,
  cloisonZ: -4.2, // ESTIMÉ
  z1: -0.45,
  zArriere: -8.6,
}
