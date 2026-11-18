import { useMemo } from 'react'
import { Pieces, type Piece } from '../primitives'

// Bâtiment voisin de GAUCHE (vu de la rue) : 766 Eastern Parkway, la
// bibliothèque d'Agudas Chassidei Chabad. Position confirmée par les
// coordonnées OpenStreetMap (766 à l'ouest du 770) et la photo de groupe
// COLlive de novembre 2025 (vue frontale). Correction de la phase 1, qui
// l'avait placée à droite. VOLUME APPROXIMATIF ; hauteur, profondeur et
// retrait ESTIMÉS — à calibrer.
// Le bâtiment de DROITE (784-788, au-dessus du grand Zal) est dans
// complexe/Complexe784.tsx.

export function grilleFenetres(x0: number, x1: number, zFace: number, etages: number[], hauteur: number, nb: number, cadre: 'pierre' | 'pierreFoncee'): Piece[] {
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
    // --- 766 : bibliothèque (à gauche) ---
    const g = { x0: -32, x1: -9.6, z: 1.5, h: 17.5, prof: 24 }
    pc.push({ t: [g.x1 - g.x0, g.h, g.prof], p: [(g.x0 + g.x1) / 2, g.h / 2 - 0.2, g.z - g.prof / 2], m: 'briqueVoisinClaire', col: true })
    for (const y of [4.4, 7.6, 10.8, 14.0]) pc.push({ t: [g.x1 - g.x0, 0.25, 0.12], p: [(g.x0 + g.x1) / 2, y - 0.3, g.z + 0.06], m: 'pierre' })
    pc.push({ t: [g.x1 - g.x0 + 0.4, 0.6, 0.5], p: [(g.x0 + g.x1) / 2, g.h - 0.2, g.z + 0.1], m: 'pierre' })
    pc.push(...grilleFenetres(g.x0 + 0.5, g.x1 - 0.5, g.z, [1.6, 4.8, 8.0, 11.2, 14.4], 2.1, 6, 'pierre'))
    // Détails ajoutés le 18/11/2026 (génériques, NON relevés sur photo) :
    // soubassement en pierre, croisillons des fenêtres, corniche à consoles,
    // chaînes d'angle et portail d'entrée central. ESTIMÉ — à calibrer.
    const xm = (g.x0 + g.x1) / 2
    pc.push({ t: [g.x1 - g.x0, 1.2, 0.12], p: [xm, 0.5, g.z + 0.06], m: 'pierreFoncee' })
    const pasF = (g.x1 - g.x0 - 1) / 6
    for (const y of [1.6, 4.8, 8.0, 11.2, 14.4])
      for (let i = 0; i < 6; i++) {
        const cx = g.x0 + 0.5 + pasF * (i + 0.5)
        pc.push({ t: [0.06, 2.1, 0.04], p: [cx, y + 1.05, g.z + 0.05], m: 'blancCamping', ombre: false })
        pc.push({ t: [Math.min(1.3, pasF * 0.55), 0.06, 0.04], p: [cx, y + 1.15, g.z + 0.05], m: 'blancCamping', ombre: false })
      }
    for (let x = g.x0 + 0.4; x < g.x1 - 0.2; x += 1.0) pc.push({ t: [0.18, 0.5, 0.55], p: [x, g.h - 0.75, g.z + 0.28], m: 'pierre' })
    for (const x of [g.x0 + 0.3, g.x1 - 0.3]) for (let y = 0.6; y < g.h - 1; y += 0.9) pc.push({ t: [0.65, 0.42, 0.1], p: [x, y, g.z + 0.05], m: 'pierre' })
    pc.push({ t: [2.2, 3.6, 0.3], p: [xm, 1.8, g.z + 0.15], m: 'pierre' })
    pc.push({ t: [1.5, 2.8, 0.1], p: [xm, 1.4, g.z + 0.31], m: 'cheneFonce', ombre: false })
    pc.push({ t: [2.6, 0.35, 0.6], p: [xm, 3.75, g.z + 0.3], m: 'pierreFoncee' })
    // Le bâtiment de droite (784-788) est construit par complexe/Complexe784.tsx
    return pc
  }, [])
  return <Pieces pieces={pieces} />
}
