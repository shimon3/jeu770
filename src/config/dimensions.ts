// Cotes du 770 Eastern Parkway (bâtiment historique) et de ses abords.
//
// Repère : mètres. x le long de la rue (+x = droite vue depuis le trottoir),
// y vers le haut (0 = niveau du trottoir), z vers la rue (façade à z = 0,
// bâtiment vers -z).
//
// Méthode : les cotes de façade sont mesurées en pixels sur la photo frontale
// Commons n° 2 (770Lubavitch.JPG, domaine public), avec pour étalon la porte
// principale supposée haute de 2,30 m (≈ 0,0131 m/px). Tout ce qui en découle
// reste une estimation. Voir docs/REGISTRE.md.

export const NIVEAUX = {
  trottoir: 0,
  cour: 0.5, // ESTIMÉ — à calibrer (3 marches depuis le trottoir, photo Clio)
  rdc: 1.0, // ESTIMÉ — à calibrer (3 marches de la cour au palier, crownheights.info 2022)
  etage1: 4.8, // ESTIMÉ — à calibrer
  etage2: 8.2, // ESTIMÉ — à calibrer
  dalle: 0.2, // ESTIMÉ — à calibrer (épaisseur des planchers)
}

export const FACADE = {
  // Trois travées sous trois pignons (confirmé : photos Commons 1, 2, Clio).
  largeurTraveeGauche: 6.2, // ESTIMÉ — à calibrer
  largeurTraveeCentre: 4.2, // ESTIMÉ — à calibrer
  largeurTraveeDroite: 6.2, // ESTIMÉ — à calibrer
  epaisseurMur: 0.45, // ESTIMÉ — à calibrer
  profondeur: 22, // ESTIMÉ — à calibrer (aucune vue de profil exploitable)
  egout: 11.2, // ESTIMÉ — à calibrer (hauteur de l'égout des pignons latéraux)
  egoutCentre: 10.9, // ESTIMÉ — à calibrer
  faitePignonLateral: 14.1, // ESTIMÉ — à calibrer
  faitePignonCentre: 13.1, // ESTIMÉ — à calibrer
  hauteurToitPrincipal: 13.4, // ESTIMÉ — à calibrer (toit plat caché derrière le pan avant)
  profondeurPanAvant: 2.3, // ESTIMÉ — à calibrer
  profondeurAilesPignons: 4.0, // ESTIMÉ — à calibrer
  hauteurCheminee: 14.0, // ESTIMÉ — à calibrer
}

export const LARGEUR_FACADE =
  FACADE.largeurTraveeGauche + FACADE.largeurTraveeCentre + FACADE.largeurTraveeDroite

// Centres des travées en x
export const TRAVEES = {
  gauche: -LARGEUR_FACADE / 2 + FACADE.largeurTraveeGauche / 2,
  centre: -LARGEUR_FACADE / 2 + FACADE.largeurTraveeGauche + FACADE.largeurTraveeCentre / 2,
  droite: LARGEUR_FACADE / 2 - FACADE.largeurTraveeDroite / 2,
}

// Fenêtres de façade : x = centre, y = appui (bas de l'ouverture), w, h,
// cols = nombre de jours, transom = hauteur relative de l'imposte (0 = aucune).
// Disposition confirmée par les photos (3 jours aux étages, grandes baies au
// rez-de-chaussée) ; cotes ESTIMÉES — à calibrer.
export type FenetreDef = { x: number; y: number; w: number; h: number; cols: number; transom: number }

export const FENETRES: FenetreDef[] = [
  // Travée gauche
  { x: TRAVEES.gauche, y: 1.6, w: 2.4, h: 2.5, cols: 3, transom: 0.35 }, // ESTIMÉ — à calibrer
  { x: TRAVEES.gauche, y: 5.6, w: 2.15, h: 1.65, cols: 3, transom: 0 }, // ESTIMÉ — à calibrer
  { x: TRAVEES.gauche, y: 8.95, w: 2.05, h: 1.25, cols: 3, transom: 0 }, // ESTIMÉ — à calibrer
  // Travée droite
  { x: TRAVEES.droite + 0.25, y: 1.6, w: 3.0, h: 2.5, cols: 4, transom: 0.35 }, // ESTIMÉ — à calibrer
  { x: TRAVEES.droite, y: 5.6, w: 2.2, h: 1.65, cols: 3, transom: 0 }, // ESTIMÉ — à calibrer
  { x: TRAVEES.droite, y: 8.95, w: 2.15, h: 1.3, cols: 3, transom: 0 }, // ESTIMÉ — à calibrer
  // Travée centrale : fenêtre du 2e étage, au-dessus de l'oriel
  { x: TRAVEES.centre, y: 8.65, w: 1.4, h: 1.55, cols: 3, transom: 0 }, // ESTIMÉ — à calibrer
]

export const PORTE = {
  largeur: 1.05, // ESTIMÉ — à calibrer (étalon : hauteur 2,30 m)
  hauteur: 2.3, // ESTIMÉ — étalon de toutes les mesures de façade
  epaisseur: 0.06,
  // Encadrement en pierre à arc Tudor et frise sculptée (confirmé : Commons 3, 4)
  encadrementLargeur: 2.0, // ESTIMÉ — à calibrer
  encadrementHauteur: 3.05, // ESTIMÉ — à calibrer
  // Deux petites fenêtres grillagées de part et d'autre (confirmé : Commons 3)
  petiteFenetreLargeur: 0.38, // ESTIMÉ — à calibrer
  petiteFenetreHauteur: 1.15, // ESTIMÉ — à calibrer
  petiteFenetreEcart: 1.45, // ESTIMÉ — à calibrer (distance du centre de la porte)
  // Champ de pierre claire autour de la porte et des deux petites fenêtres,
  // sous l'oriel (photos 1 et 2 fournies par Samuel, 2026 : pierre claire
  // autour de la porte de bois). Étendue et hauteur ESTIMÉES — à calibrer.
  champPierreLargeur: 3.9, // ESTIMÉ — à calibrer
  champPierreHauteur: 3.05, // ESTIMÉ — à calibrer (aligné sur l'encadrement)
}

export const ORIEL = {
  // Oriel à pans, châssis noir, toit d'ardoise, sur console en pierre portant
  // l'inscription bilingue (confirmé : Commons 2, 3, 4).
  largeur: 2.5, // ESTIMÉ — à calibrer
  saillie: 0.8, // ESTIMÉ — à calibrer
  bas: 5.35, // ESTIMÉ — à calibrer
  haut: 7.7, // ESTIMÉ — à calibrer
  toit: 0.85, // ESTIMÉ — à calibrer
  consoleHauteur: 1.3, // ESTIMÉ — à calibrer
}

export const ABORDS = {
  profondeurCour: 6.0, // ESTIMÉ — à calibrer (distance façade → muret)
  murEpaisseur: 0.4, // ESTIMÉ — à calibrer
  murHauteur: 0.9, // ESTIMÉ — à calibrer (côté trottoir)
  alleeLargeur: 2.4, // ESTIMÉ — à calibrer
  marches: 3, // confirmé : 3 marches du trottoir à la cour (photo Clio) — hauteur ESTIMÉE
  marchesPorte: 3, // confirmé : 3 marches de la cour au palier (crownheights.info 2022)
  palierProfondeur: 0.8, // ESTIMÉ — à calibrer
  giron: 0.33, // ESTIMÉ — à calibrer
  largeurTrottoir: 5.6, // ESTIMÉ — à calibrer
  largeurContreAllee: 7.0, // ESTIMÉ — à calibrer
  largeurTerrePlein: 6.0, // ESTIMÉ — à calibrer
  largeurChaussee: 20, // ESTIMÉ — à calibrer
  bordure: 0.15, // ESTIMÉ — à calibrer
}

// Hall intérieur : RECONSTITUTION ARTISTIQUE. Aucun plan publié n'a été trouvé.
// Les photos du couloir (anash.org, 2021) confirment les matériaux (plâtre
// crème, colombages en chêne foncé, escalier en chêne à balustres tournés et
// poteaux à pommeau, lustre en laiton) mais pas la disposition.
export const HALL = {
  xMin: -2.0, // ESTIMÉ — reconstitution artistique
  xMax: 3.0, // ESTIMÉ — reconstitution artistique
  zMax: -FACADE.epaisseurMur,
  zMin: -8.6, // ESTIMÉ — reconstitution artistique
  escalierLargeur: 1.1, // ESTIMÉ — à calibrer
  contremarche: 0.19, // ESTIMÉ — à calibrer
  giron: 0.27, // ESTIMÉ — à calibrer
  escalierDebutZ: -2.4, // ESTIMÉ — reconstitution artistique
}
