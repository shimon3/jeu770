import * as THREE from 'three'
import { decouperMur, type Rect, type V3 } from '../primitives'
import type { PieceLibre } from '../grand-zal/PiecesLibres'

// Outils de construction partagés par les pièces de la maison.

export function murLibre(axe: 'x' | 'z', plan: number, ep: number, de: number, a: number, bas: number, haut: number, ouvertures: Rect[], mat: THREE.Material, col = true): PieceLibre[] {
  return decouperMur({ x0: de, x1: a, y0: bas, y1: haut }, ouvertures).map((r) => {
    const l = r.x1 - r.x0
    const h = r.y1 - r.y0
    const c = (r.x0 + r.x1) / 2
    const y = (r.y0 + r.y1) / 2
    return axe === 'x' ? { t: [l, h, ep] as V3, p: [c, y, plan] as V3, mat, col } : { t: [ep, h, l] as V3, p: [plan, y, c] as V3, mat, col }
  })
}

// Sol (dessus à y) et plafond (dessous à yP) d'une pièce rectangulaire
// `epSol` : épaisseur du sol (fine à l'étage, posée sur le plafond du dessous)
export function solPlafond(x0: number, x1: number, z0: number, z1: number, y: number, yP: number, matSol: THREE.Material, matPlafond: THREE.Material, epSol = 0.2): PieceLibre[] {
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  return [
    { t: [x1 - x0, epSol, z1 - z0], p: [cx, y - epSol / 2, cz], mat: matSol, col: true },
    { t: [x1 - x0, 0.17, z1 - z0], p: [cx, yP + 0.085, cz], mat: matPlafond, col: true },
  ]
}

export function lustre(x: number, z: number, yPlafond: number, laiton: THREE.Material, ampoule: THREE.Material, bras = 6): PieceLibre[] {
  const yC = yPlafond - 0.85
  const pc: PieceLibre[] = [
    { geo: new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), p: [x, yPlafond - 0.35, z], mat: laiton, ombre: false },
    { geo: new THREE.SphereGeometry(0.1, 10, 8), p: [x, yC, z], mat: laiton, ombre: false },
  ]
  for (let i = 0; i < bras; i++) {
    const a = (i / bras) * Math.PI * 2
    pc.push({ t: [0.32, 0.02, 0.02], p: [x + Math.cos(a) * 0.16, yC, z + Math.sin(a) * 0.16], r: [0, -a, 0], mat: laiton, ombre: false })
    pc.push({ geo: new THREE.SphereGeometry(0.035, 6, 5), p: [x + Math.cos(a) * 0.32, yC + 0.1, z + Math.sin(a) * 0.32], mat: ampoule, ombre: false })
  }
  return pc
}

// Bibliothèque vitrée : bas plein, haut vitré avec dos de livres
export function bibliothequeVitree(axe: 'x' | 'z', x0: number, x1: number, plan: number, sens: 1 | -1, y: number, bois: THREE.Material, livres: THREE.Material, verre: THREE.Material, hauteur = 2.5): PieceLibre[] {
  const L = x1 - x0
  const c = (x0 + x1) / 2
  const d = 0.42
  const centre = plan + sens * (d / 2)
  const face = plan + sens * (d + 0.01)
  const pos = (u: number, yy: number, w: number): V3 => (axe === 'x' ? [u, yy, w] : [w, yy, u])
  const taille = (l: number, h: number, e: number): V3 => (axe === 'x' ? [l, h, e] : [e, h, l])
  const pc: PieceLibre[] = [
    { t: taille(L, hauteur, d), p: pos(c, y + hauteur / 2, centre), mat: bois, col: true },
    { t: taille(L - 0.1, hauteur - 1.05, 0.01), p: pos(c, y + 0.95 + (hauteur - 1.05) / 2, face - sens * 0.03), mat: livres, ombre: false },
    { t: taille(L - 0.1, hauteur - 1.05, 0.01), p: pos(c, y + 0.95 + (hauteur - 1.05) / 2, face), mat: verre, ombre: false },
    { t: taille(L + 0.06, 0.06, d + 0.06), p: pos(c, y + 0.92, centre), mat: bois },
    { t: taille(L + 0.08, 0.08, d + 0.08), p: pos(c, y + hauteur + 0.04, centre), mat: bois },
  ]
  for (let u = x0; u <= x1 + 0.01; u += 0.9) pc.push({ t: taille(0.05, hauteur - 1.0, 0.04), p: pos(Math.min(u, x1), y + 0.95 + (hauteur - 1.0) / 2, face + sens * 0.01), mat: bois, ombre: false })
  return pc
}

export function chaise(x: number, z: number, rot: number, y: number, bois: THREE.Material, assise: THREE.Material): PieceLibre[] {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  // Repère local : avant = +z
  const p = (lx: number, ly: number, lz: number): V3 => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c]
  const pc: PieceLibre[] = [
    { t: [0.46, 0.06, 0.44], p: p(0, 0.46, 0), r: [0, rot, 0], mat: assise },
    { t: [0.44, 0.5, 0.05], p: p(0, 0.74, -0.2), r: [0, rot, 0], mat: bois },
  ]
  for (const lx of [-0.2, 0.2]) for (const lz of [-0.18, 0.18]) pc.push({ t: [0.04, 0.44, 0.04], p: p(lx, 0.22, lz), r: [0, rot, 0], mat: bois })
  return pc
}
