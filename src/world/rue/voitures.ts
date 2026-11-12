import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Piece, V3 } from '../primitives'

// Véhicules modélisés en code (aucun fichier à télécharger) : berline,
// monospace familial, voiture de police et camion de pompiers, silhouettes
// génériques sans marque ni logo. Chaque modèle est construit une seule fois en
// repère local (avant vers +x, sol à y = 0), puis posé à chaque emplacement ;
// Pieces fusionne ensuite tous les véhicules garés par matériau.

export type CouleurVoiture = 'voiture0' | 'voiture1' | 'voiture2' | 'voiture3' | 'taxi'
type MatLocal = Piece['m'] | 'carrosserie'
type PieceLocale = { geo: THREE.BufferGeometry; m: MatLocal }

function extrusion(points: [number, number][], largeur: number, biseau = 0.05) {
  const forme = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  const geo = new THREE.ExtrudeGeometry(forme, {
    depth: largeur - 2 * biseau,
    bevelEnabled: true,
    bevelSize: biseau,
    bevelThickness: biseau,
    bevelSegments: 2,
    curveSegments: 4,
  })
  geo.translate(0, 0, -(largeur - 2 * biseau) / 2)
  geo.computeVertexNormals()
  return geo
}

const boite = (w: number, h: number, d: number, x: number, y: number, z: number) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)

function roues(essieux: number[], voie: number, r = 0.33): PieceLocale[] {
  const pc: PieceLocale[] = []
  for (const x of essieux)
    for (const s of [-1, 1]) {
      const z = (s * voie) / 2
      pc.push({ geo: new THREE.CylinderGeometry(r, r, 0.24 + r * 0.2, 16).rotateX(Math.PI / 2).translate(x, r, z), m: 'noir' })
      // Jante, légèrement en saillie côté extérieur
      pc.push({ geo: new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.04, 12).rotateX(Math.PI / 2).translate(x, r, z + s * (0.13 + r * 0.1)), m: 'zinc' })
    }
  return pc
}

type Habillage = { avant: number; arriere: number; hFeu: number; demiLargeur: number; retro: [number, number] }

function habillage({ avant, arriere, hFeu, demiLargeur, retro }: Habillage): PieceLocale[] {
  const pc: PieceLocale[] = []
  for (const s of [-1, 1]) {
    pc.push({ geo: boite(0.06, 0.12, 0.34, avant, hFeu, s * (demiLargeur - 0.25)), m: 'phare' })
    pc.push({ geo: boite(0.06, 0.12, 0.3, arriere, hFeu + 0.05, s * (demiLargeur - 0.22)), m: 'feuArriere' })
    pc.push({ geo: boite(0.14, 0.1, 0.16, retro[0], retro[1], s * (demiLargeur + 0.08)), m: 'noir' })
  }
  // Plaques et pare-chocs
  pc.push({ geo: boite(0.04, 0.15, 0.52, avant + 0.02, 0.42, 0), m: 'papier' })
  pc.push({ geo: boite(0.04, 0.15, 0.52, arriere - 0.02, 0.5, 0), m: 'papier' })
  pc.push({ geo: boite(0.14, 0.16, demiLargeur * 2 - 0.1, avant - 0.02, 0.36, 0), m: 'noir' })
  pc.push({ geo: boite(0.14, 0.16, demiLargeur * 2 - 0.1, arriere + 0.02, 0.36, 0), m: 'noir' })
  return pc
}

// Berline : environ 4,75 × 1,82 × 1,45 m
function berline(): PieceLocale[] {
  const L = 2.35
  return [
    {
      geo: extrusion([[-L, 0.3], [L, 0.3], [L + 0.03, 0.55], [L - 0.05, 0.76], [1.25, 0.9], [-1.4, 0.95], [-L + 0.12, 0.93], [-L - 0.02, 0.74], [-L, 0.45]], 1.8),
      m: 'carrosserie',
    },
    { geo: extrusion([[1.25, 0.9], [0.35, 1.38], [-0.8, 1.4], [-1.4, 0.95]], 1.56, 0.04), m: 'vitre' },
    { geo: boite(1.2, 0.05, 1.5, -0.22, 1.42, 0), m: 'carrosserie' },
    ...roues([-1.4, 1.4], 1.62),
    ...habillage({ avant: L + 0.02, arriere: -L - 0.02, hFeu: 0.68, demiLargeur: 0.9, retro: [1.05, 1.0] }),
  ]
}

// Taxi : berline jaune avec enseigne de toit
function taxi(): PieceLocale[] {
  return [...berline(), { geo: boite(0.25, 0.16, 0.7, -0.1, 1.53, 0), m: 'phare' }]
}

// Voiture de police générique : berline blanche, bande bleue, rampe de gyrophares
function police(): PieceLocale[] {
  const pc = berline()
  for (const s of [-1, 1]) pc.push({ geo: boite(4.2, 0.14, 0.02, 0, 0.66, s * 0.94), m: 'policeBleu' })
  pc.push({ geo: boite(0.3, 0.1, 1.1, 0.1, 1.5, 0), m: 'noir' })
  pc.push({ geo: boite(0.26, 0.1, 0.5, 0.1, 1.58, -0.27), m: 'gyroRouge' })
  pc.push({ geo: boite(0.26, 0.1, 0.5, 0.1, 1.58, 0.27), m: 'gyroBleu' })
  return pc
}

// Monospace familial : environ 5,15 × 1,95 × 1,8 m
function monospace(): PieceLocale[] {
  const L = 2.55
  const pc: PieceLocale[] = [
    { geo: extrusion([[-L, 0.32], [L, 0.32], [L + 0.03, 0.6], [L - 0.1, 0.84], [1.6, 1.02], [-L + 0.05, 1.05], [-L - 0.03, 0.62]], 1.92), m: 'carrosserie' },
    { geo: extrusion([[1.6, 1.02], [0.85, 1.66], [-L + 0.25, 1.7], [-L + 0.05, 1.05]], 1.7, 0.04), m: 'vitre' },
    { geo: boite(3.25, 0.06, 1.66, -0.75, 1.74, 0), m: 'carrosserie' },
    ...roues([-1.5, 1.5], 1.7),
    ...habillage({ avant: L + 0.02, arriere: -L - 0.02, hFeu: 0.74, demiLargeur: 0.96, retro: [1.4, 1.1] }),
  ]
  for (const s of [-1, 1]) {
    // Barres de toit et rail de la porte coulissante
    pc.push({ geo: boite(2.6, 0.05, 0.05, -0.8, 1.8, s * 0.7), m: 'zinc' })
    pc.push({ geo: boite(1.1, 0.03, 0.02, -0.6, 0.98, s * 0.97), m: 'noir' })
  }
  return pc
}

// Camion de pompiers générique : environ 9,6 × 2,5 × 3,3 m, échelle sur le toit
function pompiers(): PieceLocale[] {
  const pc: PieceLocale[] = [
    // Cabine (avant plat, léger arrondi)
    { geo: extrusion([[2.5, 0.55], [4.75, 0.55], [4.8, 1.3], [4.7, 2.95], [2.5, 3.0]], 2.5, 0.08), m: 'rougePompier' },
    // Caisse arrière avec coffres
    { geo: boite(7.1, 2.3, 2.46, -1.05, 1.7, 0), m: 'rougePompier' },
    { geo: boite(0.08, 1.0, 2.1, 4.78, 2.35, 0), m: 'vitre' },
    ...roues([3.4, -2.0, -3.3], 2.1, 0.5),
    // Pare-chocs, phares, plaque
    { geo: boite(0.25, 0.3, 2.5, 4.85, 0.75, 0), m: 'zinc' },
    { geo: boite(0.06, 0.16, 0.4, 4.83, 1.15, 0.85), m: 'phare' },
    { geo: boite(0.06, 0.16, 0.4, 4.83, 1.15, -0.85), m: 'phare' },
    { geo: boite(0.06, 0.16, 0.3, -4.62, 1.0, 0.95), m: 'feuArriere' },
    { geo: boite(0.06, 0.16, 0.3, -4.62, 1.0, -0.95), m: 'feuArriere' },
    // Rampe de gyrophares de la cabine
    { geo: boite(0.35, 0.16, 1.9, 4.2, 3.1, 0), m: 'gyroRouge' },
  ]
  for (const s of [-1, 1]) {
    // Fenêtres de cabine, bande blanche, poignées de coffres
    pc.push({ geo: boite(1.4, 0.8, 0.04, 3.6, 2.4, s * 1.27), m: 'vitre' })
    pc.push({ geo: boite(9.4, 0.14, 0.04, -0.05, 1.25, s * 1.26), m: 'voiture3' })
    for (const x of [-3.6, -2.1, -0.6, 0.9]) pc.push({ geo: boite(1.3, 1.5, 0.03, x, 1.9, s * 1.245), m: 'zinc' })
    // Montants de l'échelle
    pc.push({ geo: boite(7.4, 0.08, 0.08, -0.9, 3.05, s * 0.45), m: 'zinc' })
  }
  for (let x = -4.4; x <= 2.6; x += 0.5) pc.push({ geo: boite(0.05, 0.05, 0.9, x, 3.05, 0), m: 'zinc' })
  return pc
}

// Panneau de texte sur un flanc : boîte fine dont les faces ±z portent la
// texture (lisible des deux côtés, quel que soit le sens du véhicule)
function flancs(l: number, h: number, x: number, y: number, demiLargeur: number, m: Piece['m']): PieceLocale[] {
  return [-1, 1].map((s) => ({ geo: boite(l, h, 0.02, x, y, s * (demiLargeur + 0.015)), m }))
}

// Bus « Mashiah » : bus jaune de 12 m, texte sur les flancs (aucune image)
function busMashiah(): PieceLocale[] {
  const L = 6
  const pc: PieceLocale[] = [
    { geo: extrusion([[-L, 0.45], [L, 0.45], [L + 0.05, 2.9], [L - 0.1, 3.1], [-L, 3.1]], 2.55, 0.06), m: 'jauneMashiah' },
    { geo: boite(0.05, 1.3, 2.3, L + 0.04, 2.15, 0), m: 'vitre' },
    { geo: boite(0.05, 0.28, 1.6, L + 0.07, 2.92, 0), m: 'phare' },
    { geo: boite(1.0, 2.1, 0.03, L - 1.2, 1.55, 1.29), m: 'vitre' },
    ...roues([L - 2.0, -L + 2.4], 2.2, 0.5),
    ...flancs(8.6, 0.95, -0.9, 1.35, 1.275, 'bandeauMashiah'),
    { geo: boite(0.2, 0.3, 2.5, L + 0.05, 0.6, 0), m: 'noir' },
    { geo: boite(0.2, 0.3, 2.5, -L - 0.05, 0.6, 0), m: 'noir' },
  ]
  for (const s of [-1, 1]) {
    pc.push({ geo: boite(10.2, 0.85, 0.03, -0.6, 2.4, s * 1.29), m: 'vitre' })
    pc.push({ geo: boite(0.06, 0.18, 0.3, L + 0.04, 0.95, s * 0.95), m: 'phare' })
    pc.push({ geo: boite(0.06, 0.25, 0.25, -L - 0.04, 1.0, s * 1.0), m: 'feuArriere' })
  }
  return pc
}

// « Mitzvah Tank » (Mivtsaim) : camping-car blanc à bande bleue, texte sur
// les flancs (aucune image)
function mitzvahTank(): PieceLocale[] {
  const L = 4
  const pc: PieceLocale[] = [
    { geo: extrusion([[-L, 0.45], [L, 0.45], [L + 0.05, 1.35], [L - 0.6, 2.2], [L - 1.0, 3.3], [-L, 3.3]], 2.4, 0.08), m: 'blancCamping' },
    { geo: extrusion([[L + 0.02, 1.4], [L - 0.55, 2.15], [L - 0.95, 2.15], [L - 0.95, 1.4]], 2.2, 0.03), m: 'vitre' },
    ...roues([L - 1.4, -L + 1.6], 2.1, 0.45),
    ...flancs(6.2, 0.95, -0.9, 2.2, 1.2, 'bandeauMivtsaim'),
    ...habillage({ avant: L + 0.05, arriere: -L - 0.04, hFeu: 1.0, demiLargeur: 1.2, retro: [L - 0.9, 2.0] }),
  ]
  for (const s of [-1, 1]) pc.push({ geo: boite(7.9, 0.14, 0.02, 0, 1.25, s * 1.215), m: 'policeBleu' })
  // Haut-parleurs sur le toit
  pc.push({ geo: new THREE.CylinderGeometry(0.18, 0.1, 0.4, 10).rotateZ(Math.PI / 2).translate(L - 1.4, 3.5, 0.5), m: 'zinc' })
  pc.push({ geo: new THREE.CylinderGeometry(0.18, 0.1, 0.4, 10).rotateZ(Math.PI / 2).translate(L - 1.4, 3.5, -0.5), m: 'zinc' })
  return pc
}

// Bus de ville générique (12 m, sans logo) : blanc à bande bleue, porte
// avant droite (côté trottoir), girouette lumineuse
export const PORTE_BUS = 4.8 // position de la porte avant le long du bus (m)
function busVille(): PieceLocale[] {
  const L = 6
  const pc: PieceLocale[] = [
    { geo: extrusion([[-L, 0.4], [L, 0.4], [L + 0.05, 2.9], [L - 0.1, 3.1], [-L, 3.1]], 2.55, 0.06), m: 'voiture3' },
    { geo: boite(0.05, 1.4, 2.3, L + 0.04, 2.1, 0), m: 'vitre' },
    { geo: boite(0.05, 0.3, 1.8, L + 0.07, 2.93, 0), m: 'phare' },
    { geo: boite(1.0, 2.2, 0.03, PORTE_BUS, 1.5, 1.29), m: 'vitre' },
    ...roues([L - 2.0, -L + 2.4], 2.2, 0.5),
    { geo: boite(0.2, 0.3, 2.5, L + 0.05, 0.55, 0), m: 'noir' },
    { geo: boite(0.2, 0.3, 2.5, -L - 0.05, 0.55, 0), m: 'noir' },
  ]
  for (const s of [-1, 1]) {
    pc.push({ geo: boite(9.6, 1.0, 0.03, -0.9, 2.3, s * 1.29), m: 'vitre' })
    pc.push({ geo: boite(11.9, 0.35, 0.02, 0, 1.15, s * 1.285), m: 'policeBleu' })
    pc.push({ geo: boite(0.06, 0.18, 0.3, L + 0.04, 0.95, s * 0.95), m: 'phare' })
    pc.push({ geo: boite(0.06, 0.25, 0.25, -L - 0.04, 1.0, s * 1.0), m: 'feuArriere' })
  }
  return pc
}

const MODELES = {
  busVille: busVille(),
  berline: berline(),
  monospace: monospace(),
  taxi: taxi(),
  police: police(),
  pompiers: pompiers(),
  busMashiah: busMashiah(),
  mitzvahTank: mitzvahTank(),
}
export type ModeleVoiture = keyof typeof MODELES

// Dimensions hors tout (longueur, hauteur, largeur), pour les collisions
export const GABARIT: Record<ModeleVoiture, [number, number, number]> = {
  berline: [4.75, 1.45, 1.82],
  taxi: [4.75, 1.6, 1.82],
  police: [4.75, 1.65, 1.9],
  monospace: [5.15, 1.8, 1.95],
  pompiers: [9.7, 3.3, 2.6],
  busMashiah: [12.1, 3.15, 2.6],
  busVille: [12.1, 3.15, 2.6],
  mitzvahTank: [8.1, 3.6, 2.45],
}

// Pose un modèle garé : y0 = niveau de la chaussée, rotY = cap (0 : avant vers +x)
export function voitureGaree(modele: ModeleVoiture, x: number, y0: number, z: number, rotY: number, couleur: CouleurVoiture): Piece[] {
  return MODELES[modele].map((p) => ({
    geo: p.geo,
    p: [x, y0, z] as V3,
    r: [0, rotY, 0] as V3,
    m: p.m === 'carrosserie' ? couleur : p.m,
  }))
}

// Géométries d'un modèle fusionnées par matériau, pour un véhicule qui roule
// (un seul objet déplacé par image, quelques appels de dessin par véhicule)
export function geometriesParMateriau(modele: ModeleVoiture, couleur: CouleurVoiture): [Piece['m'], THREE.BufferGeometry][] {
  const parMat = new Map<Piece['m'], THREE.BufferGeometry[]>()
  for (const p of MODELES[modele]) {
    const m = p.m === 'carrosserie' ? couleur : p.m
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
    parMat.set(m, [...(parMat.get(m) ?? []), g])
  }
  return [...parMat].map(([m, geos]) => [m, mergeGeometries(geos)])
}
