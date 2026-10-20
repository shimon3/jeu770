import { useMemo } from 'react'
import * as THREE from 'three'
import { geoPignon, Pieces, type Piece } from '../primitives'

// Bâtiments immédiatement voisins : VOLUMES APPROXIMATIFS d'après la photo
// Clio (vue frontale) et Commons 5. À gauche, l'immeuble de brique à
// bandeaux clairs ; à droite, la bibliothèque Habad avec pignon et terrasse à
// balustres. Hauteurs, profondeurs et retraits ESTIMÉS — à calibrer.

function grilleFenetres(x0: number, x1: number, zFace: number, etages: number[], hauteur: number, nb: number, cadre: 'pierre' | 'pierreFoncee'): Piece[] {
  const pc: Piece[] = []
  const pas = (x1 - x0) / nb
  for (const y of etages) {
    for (let i = 0; i < nb; i++) {
      const cx = x0 + pas * (i + 0.5)
      const w = Math.min(1.3, pas * 0.55)
      pc.push({ t: [w, hauteur, 0.05], p: [cx, y + hauteur / 2, zFace + 0.01], m: 'vitre', ombre: false })
      pc.push({ t: [w + 0.2, 0.12, 0.12], p: [cx, y - 0.04, zFace + 0.05], m: cadre })
      pc.push({ t: [w + 0.2, 0.14, 0.1], p: [cx, y + hauteur + 0.07, zFace + 0.04], m: cadre })
    }
  }
  return pc
}

export function Voisins() {
  const pieces = useMemo(() => {
    const pc: Piece[] = []
    // --- Immeuble de gauche ---
    const g = { x0: -32, x1: -9.6, z: 1.5, h: 17.5, prof: 24 }
    pc.push({ t: [g.x1 - g.x0, g.h, g.prof], p: [(g.x0 + g.x1) / 2, g.h / 2 - 0.2, g.z - g.prof / 2], m: 'briqueVoisinClaire', col: true })
    for (const y of [4.4, 7.6, 10.8, 14.0]) pc.push({ t: [g.x1 - g.x0, 0.25, 0.12], p: [(g.x0 + g.x1) / 2, y - 0.3, g.z + 0.06], m: 'pierre' })
    pc.push({ t: [g.x1 - g.x0 + 0.4, 0.6, 0.5], p: [(g.x0 + g.x1) / 2, g.h - 0.2, g.z + 0.1], m: 'pierre' })
    pc.push(...grilleFenetres(g.x0 + 0.5, g.x1 - 0.5, g.z, [1.6, 4.8, 8.0, 11.2, 14.4], 2.1, 6, 'pierre'))
    // --- Bibliothèque (à droite) ---
    const d = { x0: 9.6, x1: 30, z: -1.0, h: 11.5, prof: 22 }
    pc.push({ t: [d.x1 - d.x0, d.h, d.prof], p: [(d.x0 + d.x1) / 2, d.h / 2 - 0.2, d.z - d.prof / 2], m: 'briqueVoisin', col: true })
    pc.push({ geo: geoPignon(15.5, 22.5, d.h - 0.2, d.h + 3.2, 3), p: [0, 0, d.z], m: 'briqueVoisin' })
    const ang = Math.atan2(3.4, 3.5)
    for (const s of [-1, 1])
      pc.push({ t: [Math.hypot(3.5, 3.4) + 0.2, 0.14, 0.5], p: [19 + s * 1.75, d.h - 0.2 + 1.7 + 0.08, d.z - 0.2], r: [0, 0, -s * ang], m: 'pierre' })
    pc.push(...grilleFenetres(d.x0 + 0.5, d.x1 - 0.5, d.z, [1.9, 5.3, 8.6], 1.9, 6, 'pierre'))
    // Portail de pierre et terrasse à balustres (Clio, Commons 5)
    pc.push({ t: [2.0, 3.2, 0.3], p: [12.6, 1.6, d.z + 0.15], m: 'pierre' })
    pc.push({ t: [1.1, 2.4, 0.1], p: [12.6, 1.4, d.z + 0.31], m: 'noir' })
    pc.push({ t: [9, 1.0, 3.2], p: [19.5, 0.5, d.z + 1.6], m: 'briqueVoisin', col: true })
    pc.push({ t: [9.1, 0.1, 0.3], p: [19.5, 1.95, d.z + 3.1], m: 'pierre' })
    for (let i = 0; i < 26; i++)
      pc.push({ geo: new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), p: [15.15 + i * 0.35, 1.45, d.z + 3.1], m: 'pierre', ombre: false })
    return pc
  }, [])
  return <Pieces pieces={pieces} />
}
