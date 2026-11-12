import * as THREE from 'three'
import type { Piece, V3 } from '../primitives'

// Deux modèles de voitures garées, modélisés en code (aucun fichier à
// télécharger) : une berline et un monospace familial, silhouettes génériques
// sans marque. Chaque modèle est construit une seule fois en repère local
// (avant vers +x, sol à y = 0), puis posé à chaque emplacement ; Pieces
// fusionne ensuite toutes les voitures par matériau (quelques appels de dessin
// pour toute la rue).

export type CouleurVoiture = 'voiture0' | 'voiture1' | 'voiture2' | 'voiture3'
type PieceLocale = { geo: THREE.BufferGeometry; m: Piece['m'] | 'carrosserie' }

const R_ROUE = 0.33

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

function roues(empattement: number, voie: number): PieceLocale[] {
  const pc: PieceLocale[] = []
  for (const x of [-empattement / 2, empattement / 2])
    for (const s of [-1, 1]) {
      const z = (s * voie) / 2
      pc.push({ geo: new THREE.CylinderGeometry(R_ROUE, R_ROUE, 0.24, 16).rotateX(Math.PI / 2).translate(x, R_ROUE, z), m: 'noir' })
      // Jante, légèrement en saillie côté extérieur
      pc.push({ geo: new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12).rotateX(Math.PI / 2).translate(x, R_ROUE, z + s * 0.11), m: 'zinc' })
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
    ...roues(2.8, 1.62),
    ...habillage({ avant: L + 0.02, arriere: -L - 0.02, hFeu: 0.68, demiLargeur: 0.9, retro: [1.05, 1.0] }),
  ]
}

// Monospace familial : environ 5,15 × 1,95 × 1,8 m
function monospace(): PieceLocale[] {
  const L = 2.55
  const pc: PieceLocale[] = [
    { geo: extrusion([[-L, 0.32], [L, 0.32], [L + 0.03, 0.6], [L - 0.1, 0.84], [1.6, 1.02], [-L + 0.05, 1.05], [-L - 0.03, 0.62]], 1.92), m: 'carrosserie' },
    { geo: extrusion([[1.6, 1.02], [0.85, 1.66], [-L + 0.25, 1.7], [-L + 0.05, 1.05]], 1.7, 0.04), m: 'vitre' },
    { geo: boite(3.25, 0.06, 1.66, -0.75, 1.74, 0), m: 'carrosserie' },
    ...roues(3.0, 1.7),
    ...habillage({ avant: L + 0.02, arriere: -L - 0.02, hFeu: 0.74, demiLargeur: 0.96, retro: [1.4, 1.1] }),
  ]
  for (const s of [-1, 1]) {
    // Barres de toit et rail de la porte coulissante
    pc.push({ geo: boite(2.6, 0.05, 0.05, -0.8, 1.8, s * 0.7), m: 'zinc' })
    pc.push({ geo: boite(1.1, 0.03, 0.02, -0.6, 0.98, s * 0.97), m: 'noir' })
  }
  return pc
}

const MODELES = { berline: berline(), monospace: monospace() }
export type ModeleVoiture = keyof typeof MODELES

// Dimensions hors tout (longueur, hauteur, largeur), pour les collisions
export const GABARIT: Record<ModeleVoiture, [number, number, number]> = {
  berline: [4.75, 1.45, 1.82],
  monospace: [5.15, 1.8, 1.95],
}

// Pose un modèle : y0 = niveau de la chaussée, rotY = cap (0 : avant vers +x)
export function voitureGaree(modele: ModeleVoiture, x: number, y0: number, z: number, rotY: number, couleur: CouleurVoiture): Piece[] {
  return MODELES[modele].map((p) => ({
    geo: p.geo,
    p: [x, y0, z] as V3,
    r: [0, rotY, 0] as V3,
    m: p.m === 'carrosserie' ? couleur : p.m,
  }))
}
