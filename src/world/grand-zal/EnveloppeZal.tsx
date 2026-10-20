import { useMemo } from 'react'
import { COLONNES, ENTREE, GRANDS_PILIERS, ZAL } from '../../config/grandZal'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'

// Enveloppe du grand Zal : sol, murs, faux plafond, plafonds bas
// périphériques (bibliothèques dessous) et galerie vitrée au-dessus,
// colonnes et grands piliers. Matériaux d'après COLlive (13/10/2025) et
// Commons 8 ; disposition : RECONSTITUTION ARTISTIQUE.

const S = ZAL.sol
const P = ZAL.plafond
const SO = ZAL.soffite
const EP = ZAL.epaisseurMur
export const Z_SUD = ZAL.z1 - 0.3 // face intérieure de la façade de 784
export const BORD_SUD = COLONNES.zs[0] // bord du plafond bas sud
export const BORD_NORD = COLONNES.zs[COLONNES.zs.length - 1] // bord du plafond bas nord

function galerie(m: MateriauxZal, x0: number, x1: number, z: number, sens: 1 | -1): PieceLibre[] {
  // Face de la galerie : lambris bas, bandeau de vitres sombres, lambris haut
  const pc: PieceLibre[] = []
  const L = x1 - x0
  const cx = (x0 + x1) / 2
  pc.push({ t: [L, 0.15, Math.abs(z - (sens > 0 ? ZAL.z0 : Z_SUD))], p: [cx, SO + 0.075, (z + (sens > 0 ? ZAL.z0 : Z_SUD)) / 2], mat: m.plafond })
  pc.push({ t: [L, 0.95, 0.12], p: [cx, SO + 0.475, z], mat: m.lambris })
  pc.push({ t: [L, 0.85, 0.04], p: [cx, SO + 0.95 + 0.425, z - sens * 0.02], mat: m.vitreSombre, ombre: false })
  for (let x = x0; x <= x1 + 0.01; x += 1.6) pc.push({ t: [0.1, 0.85, 0.1], p: [Math.min(x, x1 - 0.05), SO + 1.375, z], mat: m.lambris })
  const yHaut = SO + 1.8
  if (P - yHaut > 0.01) pc.push({ t: [L, P - yHaut, 0.12], p: [cx, (P + yHaut) / 2, z], mat: m.lambris })
  return pc
}

function bibliotheque(m: MateriauxZal, x0: number, x1: number, zMur: number, sens: 1 | -1): PieceLibre[] {
  // sens : direction de la salle depuis le mur (+1 = vers +z)
  const pc: PieceLibre[] = []
  const L = x1 - x0
  const cx = (x0 + x1) / 2
  const h = 2.3
  const zc = zMur + sens * 0.2
  pc.push({ t: [L, h, 0.4], p: [cx, S + h / 2, zc], mat: m.boisFonce, col: true })
  pc.push({ t: [L - 0.1, h - 0.2, 0.02], p: [cx, S + h / 2, zMur + sens * 0.41], mat: m.livres, ombre: false })
  for (let x = x0; x <= x1 + 0.01; x += 1.0) pc.push({ t: [0.05, h, 0.06], p: [Math.min(x, x1), S + h / 2, zMur + sens * 0.42], mat: m.boisFonce, ombre: false })
  return pc
}

export function EnveloppeZal({ m }: { m: MateriauxZal }) {
  const pieces = useMemo(() => {
    const pc: PieceLibre[] = []
    const { x0, x1, z0, shalashX0: sx0, shalashZ1: sz1 } = ZAL
    // Sols (carrelage) et faux plafonds
    pc.push({ t: [x1 - x0, 0.3, Z_SUD - z0], p: [(x0 + x1) / 2, S - 0.15, (z0 + Z_SUD) / 2], mat: m.carrelage, col: true })
    pc.push({ t: [x0 - sx0, 0.3, sz1 - z0], p: [(sx0 + x0) / 2, S - 0.15, (z0 + sz1) / 2], mat: m.carrelage, col: true })
    pc.push({ t: [x1 - x0, 0.2, Z_SUD - z0], p: [(x0 + x1) / 2, P + 0.1, (z0 + Z_SUD) / 2], mat: m.plafond, col: true })
    pc.push({ t: [x0 - sx0, 0.2, sz1 - z0], p: [(sx0 + x0) / 2, P + 0.1, (z0 + sz1) / 2], mat: m.plafond, col: true })
    const H = P - S + 0.5
    const yM = (P + S) / 2
    // Murs : nord (peint), est (brique blanche, mur de l'Aron), ouest et aile du shalash
    pc.push({ t: [x1 - sx0 + 2 * EP, H, EP], p: [(sx0 + x1) / 2, yM, z0 - EP / 2], mat: m.peintureBlanche, col: true })
    pc.push({ t: [EP, H, Z_SUD - z0], p: [x1 + EP / 2, yM, (z0 + Z_SUD) / 2], mat: m.briqueBlanche, col: true })
    pc.push({ t: [EP, H, Z_SUD - sz1], p: [x0 - EP / 2, yM, (sz1 + Z_SUD) / 2], mat: m.briqueBlanche, col: true })
    pc.push({ t: [x0 - sx0 + EP, H, EP], p: [(sx0 - EP + x0) / 2, yM, sz1 + EP / 2], mat: m.briqueBlanche, col: true })
    pc.push({ t: [EP, H, sz1 - z0], p: [sx0 - EP / 2, yM, (z0 + sz1) / 2], mat: m.briqueBlanche, col: true })
    // Doublage peint de la façade de 784, percé pour la porte
    const px0 = ENTREE.porteX0
    const px1 = ENTREE.porteX0 + ENTREE.porteLargeur
    const zl = Z_SUD - 0.01
    pc.push({ t: [px0 - x0, P - S, 0.02], p: [(x0 + px0) / 2, yM, zl], mat: m.peintureBlanche, ombre: false })
    pc.push({ t: [x1 - px1, P - S, 0.02], p: [(px1 + x1) / 2, yM, zl], mat: m.peintureBlanche, ombre: false })
    const yPorte = S + ENTREE.porteHauteur
    pc.push({ t: [px1 - px0, P - yPorte, 0.02], p: [(px0 + px1) / 2, (P + yPorte) / 2, zl], mat: m.peintureBlanche, ombre: false })
    // Plafonds bas et galeries (sud sur toute la salle, nord sur la salle et le shalash)
    pc.push(...galerie(m, x0, x1, BORD_SUD, -1))
    pc.push(...galerie(m, sx0, x1, BORD_NORD, 1))
    // Bibliothèques sous les plafonds bas (la porte reste dégagée)
    pc.push(...bibliotheque(m, x0 + 0.3, px0 - 0.6, Z_SUD, -1))
    pc.push(...bibliotheque(m, px1 + 0.6, x1 - 0.3, Z_SUD, -1))
    pc.push(...bibliotheque(m, sx0 + 0.3, x1 - 0.3, z0, 1))
    // Colonnes carrées blanches avec base évasée
    const c = COLONNES.cote
    for (const x of COLONNES.xs)
      for (const z of COLONNES.zs) {
        pc.push({ t: [c, P - S, c], p: [x, yM, z], mat: m.peintureBlanche, col: true })
        pc.push({ t: [c + 0.18, 0.45, c + 0.18], p: [x, S + 0.225, z], mat: m.peintureBlanche })
      }
    // Les trois grands piliers des anciennes limites
    for (const [x, z] of GRANDS_PILIERS) {
      pc.push({ t: [0.9, P - S, 0.9], p: [x, yM, z], mat: m.peintureBlanche, col: true })
      pc.push({ t: [1.1, 0.5, 1.1], p: [x, S + 0.25, z], mat: m.peintureBlanche })
    }
    return pc
  }, [m])
  return <PiecesLibres pieces={pieces} />
}
