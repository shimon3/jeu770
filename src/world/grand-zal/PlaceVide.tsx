import { useMemo } from 'react'
import * as THREE from 'three'
import { PLACE_VIDE, ZAL } from '../../config/grandZal'
import { Invisible } from '../primitives'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'

// RÈGLE ABSOLUE : la place du Rebbe reste VIDE. Aucun personnage, aucune
// silhouette, aucune image. Aucun PNJ ne s'en approche (voir npc/routines.ts).
// Le joueur ne peut pas monter sur l'estrade : garde-corps sans ouverture.
// Éléments d'après Commons 10 (2020) et COLlive 2025 (photo 020) : estrade
// en bois, lambris, fauteuil de velours rouge, pupitre recouvert d'une housse
// blanche frangée d'or, tapis. Cotes ESTIMÉES.

export function PlaceVide({ m }: { m: MateriauxZal }) {
  const { x0, x1, z0, z1, hauteur: h } = PLACE_VIDE
  const S = ZAL.sol
  const yE = S + h
  const pieces = useMemo(() => {
    const pc: PieceLibre[] = []
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    pc.push({ t: [x1 - x0, h, z1 - z0], p: [cx, S + h / 2, cz], mat: m.bancs, col: true })
    pc.push({ t: [x1 - x0 - 0.3, 0.01, z1 - z0 - 0.3], p: [cx, yE + 0.005, cz], mat: m.tapis, ombre: false })
    // Lambris derrière, contre le mur est
    pc.push({ t: [0.05, ZAL.plafond - yE, z1 - z0], p: [x1 - 0.03, (ZAL.plafond + yE) / 2, cz], mat: m.lambris })
    // Garde-corps sur les trois côtés ouverts
    const rail = (ax: number, az: number, bx: number, bz: number) => {
      const L = Math.hypot(bx - ax, bz - az)
      const rot = Math.atan2(bz - az, bx - ax)
      pc.push({ t: [L, 0.07, 0.08], p: [(ax + bx) / 2, yE + 0.95, (az + bz) / 2], r: [0, -rot, 0], mat: m.boisFonce })
      for (let k = 0; k <= Math.floor(L / 0.16); k++) {
        const f = (k * 0.16) / L
        pc.push({ geo: new THREE.CylinderGeometry(0.022, 0.03, 0.9, 6), p: [ax + (bx - ax) * f, yE + 0.45, az + (bz - az) * f], mat: m.bancs, ombre: false })
      }
    }
    rail(x0 + 0.05, z0 + 0.05, x0 + 0.05, z1 - 0.05)
    rail(x0 + 0.05, z0 + 0.05, x1 - 0.1, z0 + 0.05)
    rail(x0 + 0.05, z1 - 0.05, x1 - 0.1, z1 - 0.05)
    // Fauteuil VIDE (velours rouge, bois sombre), tourné vers la salle
    const fx = x1 - 1.0
    const fz = cz - 0.4
    pc.push({ t: [0.55, 0.1, 0.55], p: [fx, yE + 0.47, fz], mat: m.veloursRouge })
    pc.push({ t: [0.1, 0.7, 0.55], p: [fx + 0.27, yE + 0.85, fz], mat: m.veloursRouge })
    for (const s of [-1, 1]) {
      pc.push({ t: [0.5, 0.06, 0.07], p: [fx, yE + 0.68, fz + s * 0.3], mat: m.boisFonce })
      for (const dx of [-0.22, 0.22]) pc.push({ t: [0.05, 0.45, 0.05], p: [fx + dx, yE + 0.22, fz + s * 0.24], mat: m.boisFonce })
    }
    // Pupitre à housse blanche frangée d'or
    const px = x1 - 1.1
    const pz = cz + 0.8
    pc.push({ t: [0.5, 1.15, 0.6], p: [px, yE + 0.575, pz], mat: m.boisFonce })
    pc.push({ t: [0.56, 0.05, 0.66], p: [px, yE + 1.17, pz], mat: m.nappeBlanche })
    pc.push({ t: [0.58, 0.08, 0.68], p: [px, yE + 1.11, pz], mat: m.or, ombre: false })
    return pc
  }, [m, x0, x1, z0, z1, h, S, yE])

  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      {/* Garde-corps fermé : le joueur ne monte pas sur l'estrade */}
      <Invisible taille={[0.1, 2.2, z1 - z0]} position={[x0 + 0.05, S + 1.1, (z0 + z1) / 2]} />
      <Invisible taille={[x1 - x0, 2.2, 0.1]} position={[(x0 + x1) / 2, S + 1.1, z0 + 0.05]} />
      <Invisible taille={[x1 - x0, 2.2, 0.1]} position={[(x0 + x1) / 2, S + 1.1, z1 - 0.05]} />
    </>
  )
}
