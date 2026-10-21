import { useMemo } from 'react'
import * as THREE from 'three'
import { PIECE_CHAISE, ZAL } from '../../config/grandZal'
import { Invisible } from '../primitives'
import { Porte } from '../Porte'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'

// Pièce de la « sainte chaise du Rabbi » — d'après la photo n° 5 fournie par
// Samuel (2026) : petite pièce sobre, boiseries murales, tapis, chaise de
// velours rouge et pupitre.
//
// CE QUI VIENT DE LA PHOTO : la nature des éléments (boiseries, tapis rouge,
// chaise rouge, pupitre) et l'ambiance sobre.
// RECONSTITUTION ARTISTIQUE : l'emplacement de la pièce (placée derrière le
// mur est du Zal, au sud de l'Aron), ses cotes, le dessin des panneaux, la
// forme exacte de la chaise et du pupitre. Voir docs/REGISTRE.md.
//
// RÈGLE ABSOLUE (CLAUDE.md) : la chaise reste VIDE. Aucun personnage, aucune
// silhouette, aucune image. Le joueur ne peut ni s'y asseoir ni l'approcher :
// un garde-corps sans ouverture la tient à distance. Aucun PNJ n'entre dans
// la pièce (voir npc/routines.ts).

const PC = PIECE_CHAISE
const S = ZAL.sol
const EP = 0.2

// Boiseries d'un mur : lambris de fond, soubassement, cimaise, cadres des
// panneaux hauts et corniche. `axe` 'x' : mur dans un plan z = cte ;
// `sens` : direction de la pièce depuis le mur.
function boiseries(m: MateriauxZal, axe: 'x' | 'z', plan: number, de: number, a: number, sens: 1 | -1, trous: [number, number][] = []): PieceLibre[] {
  const pc: PieceLibre[] = []
  const boite = (u0: number, u1: number, y0: number, y1: number, ep: number, recul: number, mat: THREE.Material): PieceLibre => {
    const l = u1 - u0
    const c = (u0 + u1) / 2
    const h = y1 - y0
    const off = plan + sens * (recul + ep / 2)
    return axe === 'x' ? { t: [l, h, ep], p: [c, y0 + h / 2, off], mat } : { t: [ep, h, l], p: [off, y0 + h / 2, c], mat }
  }
  // Tronçons pleins (hors porte)
  const libres: [number, number][] = []
  let u = de
  for (const [t0, t1] of [...trous].sort((p, q) => p[0] - q[0])) {
    if (t0 > u) libres.push([u, t0])
    u = Math.max(u, t1)
  }
  if (u < a) libres.push([u, a])
  for (const [u0, u1] of libres) {
    pc.push(boite(u0, u1, S, PC.plafond, 0.03, 0, m.lambris))
    // Plinthe, soubassement et cimaise
    pc.push(boite(u0, u1, S, S + 0.14, 0.05, 0.03, m.boisFonce))
    pc.push(boite(u0, u1, S + 0.88, S + 0.98, 0.06, 0.03, m.boisFonce))
    // Corniche sous le plafond
    pc.push(boite(u0, u1, PC.plafond - 0.16, PC.plafond, 0.08, 0.03, m.boisFonce))
    // Cadres des panneaux (soubassement et partie haute)
    const n = Math.max(1, Math.round((u1 - u0) / 0.85))
    const pas = (u1 - u0) / n
    for (let k = 0; k <= n; k++) {
      const uk = Math.min(u0 + k * pas, u1 - 0.03)
      pc.push(boite(uk - 0.035, uk + 0.035, S + 0.14, PC.plafond - 0.16, 0.05, 0.03, m.boisFonce))
    }
    for (let k = 0; k < n; k++) {
      const a0 = u0 + k * pas + 0.16
      const a1 = u0 + (k + 1) * pas - 0.16
      if (a1 - a0 < 0.15) continue
      // Moulures des panneaux à plates-bandes
      for (const [y0, y1] of [
        [S + 0.28, S + 0.76],
        [S + 1.15, PC.plafond - 0.35],
      ] as const) {
        pc.push(boite(a0, a1, y0, y0 + 0.035, 0.03, 0.06, m.bancs))
        pc.push(boite(a0, a1, y1 - 0.035, y1, 0.03, 0.06, m.bancs))
        pc.push(boite(a0, a0 + 0.035, y0, y1, 0.03, 0.06, m.bancs))
        pc.push(boite(a1 - 0.035, a1, y0, y1, 0.03, 0.06, m.bancs))
      }
    }
  }
  return pc
}

export function PieceChaise({ m }: { m: MateriauxZal }) {
  const zone = useGame((s) => s.zone)
  const { x0, x1, z0, z1, plafond: P, porteZ0, porteZ1, porteHauteur, garde } = PC
  const cz = (z0 + z1) / 2
  const pieces = useMemo(() => {
    const pc: PieceLibre[] = []
    const cx = (x0 + x1) / 2
    // Enveloppe : sol parqueté, plafond, murs nord, sud et est
    pc.push({ t: [x1 - x0, 0.3, z1 - z0], p: [cx, S - 0.15, cz], mat: m.bancs, col: true })
    pc.push({ t: [x1 - x0 + 2 * EP, 0.15, z1 - z0 + 2 * EP], p: [cx, P + 0.075, cz], mat: m.plafond, col: true })
    const H = P - S + 0.4
    const yM = (P + S) / 2
    pc.push({ t: [x1 - x0 + 2 * EP, H, EP], p: [cx, yM, z0 - EP / 2], mat: m.peintureBlanche, col: true })
    pc.push({ t: [x1 - x0 + 2 * EP, H, EP], p: [cx, yM, z1 + EP / 2], mat: m.peintureBlanche, col: true })
    pc.push({ t: [EP, H, z1 - z0], p: [x1 + EP / 2, yM, cz], mat: m.peintureBlanche, col: true })
    // Boiseries sur les quatre murs (côté ouest : autour de la porte)
    pc.push(...boiseries(m, 'x', z0, x0, x1, 1))
    pc.push(...boiseries(m, 'x', z1, x0, x1, -1))
    pc.push(...boiseries(m, 'z', x1, z0, z1, -1))
    pc.push(...boiseries(m, 'z', x0, z0, z1, 1, [[porteZ0, porteZ1]]))
    // Imposte boisée au-dessus de la porte
    pc.push({ t: [0.03, P - (S + porteHauteur), porteZ1 - porteZ0], p: [x0 + 0.015, (P + S + porteHauteur) / 2, (porteZ0 + porteZ1) / 2], mat: m.lambris })
    // Chambranles de la porte, côté Zal et côté pièce
    for (const x of [ZAL.x1 - 0.03, x0 + 0.03])
      for (const z of [porteZ0 - 0.05, porteZ1 + 0.05]) pc.push({ t: [0.06, porteHauteur + 0.1, 0.1], p: [x, S + (porteHauteur + 0.1) / 2, z], mat: m.boisFonce })
    for (const x of [ZAL.x1 - 0.03, x0 + 0.03]) pc.push({ t: [0.06, 0.1, porteZ1 - porteZ0 + 0.2], p: [x, S + porteHauteur + 0.05, (porteZ0 + porteZ1) / 2], mat: m.boisFonce })

    // Tapis (bordure foncée, champ rouge)
    pc.push({ t: [x1 - x0 - 0.7, 0.012, z1 - z0 - 0.7], p: [cx + 0.1, S + 0.006, cz], mat: m.tapis, ombre: false })
    pc.push({ t: [x1 - x0 - 0.6, 0.008, z1 - z0 - 0.6], p: [cx + 0.1, S + 0.004, cz], mat: m.bordeaux, ombre: false })

    // Chaise de velours rouge, VIDE, contre le mur est, tournée vers la porte
    const fx = x1 - 0.6
    const fz = cz
    pc.push({ t: [0.56, 0.12, 0.58], p: [fx, S + 0.5, fz], mat: m.veloursRouge })
    pc.push({ t: [0.6, 0.06, 0.62], p: [fx, S + 0.42, fz], mat: m.boisFonce })
    pc.push({ t: [0.1, 0.78, 0.5], p: [fx + 0.27, S + 0.98, fz], mat: m.veloursRouge })
    pc.push({ t: [0.07, 0.9, 0.62], p: [fx + 0.33, S + 0.98, fz], mat: m.boisFonce })
    pc.push({ t: [0.1, 0.08, 0.66], p: [fx + 0.33, S + 1.47, fz], mat: m.boisFonce })
    for (const s of [-1, 1]) {
      pc.push({ t: [0.5, 0.06, 0.08], p: [fx, S + 0.74, fz + s * 0.3], mat: m.boisFonce })
      pc.push({ t: [0.42, 0.05, 0.07], p: [fx, S + 0.78, fz + s * 0.3], mat: m.veloursRouge })
      pc.push({ t: [0.05, 0.3, 0.05], p: [fx - 0.22, S + 0.6, fz + s * 0.3], mat: m.boisFonce })
      for (const dx of [-0.24, 0.24]) pc.push({ geo: new THREE.CylinderGeometry(0.025, 0.03, 0.42, 8), p: [fx + dx, S + 0.21, fz + s * 0.26], mat: m.boisFonce })
    }

    // Pupitre de bois devant la chaise, plateau incliné
    const px = fx - 0.75
    pc.push({ t: [0.42, 0.98, 0.62], p: [px, S + 0.49, fz], mat: m.boisFonce })
    pc.push({ t: [0.38, 0.06, 0.58], p: [px, S + 0.06, fz], mat: m.bancs })
    pc.push({ t: [0.5, 0.04, 0.7], p: [px - 0.02, S + 1.03, fz], r: [0, 0, 0.22], mat: m.bancs })
    pc.push({ t: [0.05, 0.05, 0.7], p: [px - 0.25, S + 0.98, fz], mat: m.boisFonce })
    for (const s of [-1, 1]) pc.push({ t: [0.36, 0.06, 0.05], p: [px, S + 0.7, fz + s * 0.29], mat: m.bancs })

    // Garde-corps en bois sans ouverture : la chaise reste à distance
    pc.push({ t: [0.09, 0.08, z1 - z0], p: [garde, S + 0.98, cz], mat: m.boisFonce })
    pc.push({ t: [0.07, 0.06, z1 - z0], p: [garde, S + 0.12, cz], mat: m.boisFonce })
    for (let z = z0 + 0.08; z <= z1 - 0.07; z += 0.16)
      pc.push({ geo: new THREE.CylinderGeometry(0.022, 0.03, 0.82, 6), p: [garde, S + 0.56, z], mat: m.bancs, ombre: false })
    for (const z of [z0 + 0.06, cz, z1 - 0.06]) pc.push({ t: [0.12, 1.08, 0.12], p: [garde, S + 0.54, z], mat: m.boisFonce })

    // Appliques murales sobres (nord et sud)
    for (const [z, s] of [
      [z0, 1],
      [z1, -1],
    ] as const) {
      pc.push({ t: [0.12, 0.2, 0.08], p: [cx + 0.6, S + 1.85, z + s * 0.1], mat: m.or, ombre: false })
      pc.push({ t: [0.1, 0.14, 0.06], p: [cx + 0.6, S + 2.0, z + s * 0.14], mat: m.cristal, ombre: false })
    }
    return pc
  }, [m, x0, x1, z0, z1, P, porteZ0, porteZ1, porteHauteur, garde, cz])

  useInteractif('plaque-chaise', [garde - 0.4, S + 1.2, cz], 1.4, () => t('action.lirePlaque'), () => {
    useGame.getState().set({ panneau: { type: 'message', cle: 'zal.chaiseTexte' } })
  })

  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      {/* Garde-corps fermé : collision plus haute que la rambarde visible */}
      <Invisible taille={[0.12, 2.2, z1 - z0]} position={[garde, S + 1.1, cz]} />
      {/* Porte entre le Zal et la pièce ; elle s'ouvre vers la pièce */}
      <Porte
        id="porte-chaise"
        charniere={[ZAL.x1 + ZAL.epaisseurMur / 2, S, porteZ1 - 0.05]}
        largeur={porteZ1 - porteZ0 - 0.1}
        hauteur={porteHauteur - 0.05}
        sens={1}
        rotationY={Math.PI / 2}
        angleOuverture={-1.5}
      />
      {zone === 'chaise-rabbi' && <pointLight position={[(x0 + garde) / 2 + 0.6, P - 0.4, cz]} intensity={5} distance={6} decay={2} color="#ffe2b8" />}
    </>
  )
}
