import { useMemo } from 'react'
import * as THREE from 'three'
import { ARON, ZAL } from '../../config/grandZal'
import { escalier, Invisible } from '../primitives'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'

// Aron Kodesh du grand Zal, état de Tichri 2025 (COLlive, 13/10/2025, photos
// 005, 006, 016) : grand meuble de bois doré sculpté à couronnement en
// gradins, pilastres marquetés en chevrons, parokhet BLANC sous une
// cantonnière frangée d'or. Sur une estrade avec marches et garde-corps.
// Le parokhet bleu nuit de Commons 11 (2020) n'est PAS utilisé : autre époque.
// Aucune inscription n'est lisible sur le parokhet de 2025 : aucune n'est
// reproduite. Cotes ESTIMÉES.
//
// TOUJOURS FERMÉ (photo n° 3 fournie par Samuel, 2026 : Aron fermé,
// parokhet fermé) : le parokhet couvre les portes en permanence, d'un seul
// tenant jusqu'au bas du meuble. Il n'existe AUCUN état ouvert, aucune
// animation ni interaction d'ouverture : la seule interaction est la lecture
// de la plaque. Ne pas en ajouter.

export function AronKodesh({ m }: { m: MateriauxZal }) {
  const S = ZAL.sol
  const { x: xMur, z, largeur: L, hauteur: H, profondeur: P, estradeHauteur: eh, estradeProfondeur: ep, estradeLargeur: el } = ARON
  const yE = S + eh
  const { pieces, rampe } = useMemo(() => {
    const pc: PieceLibre[] = []
    const xE0 = xMur - ep
    // Estrade
    pc.push({ t: [ep, eh, el], p: [xMur - ep / 2, S + eh / 2, z], mat: m.bancs, col: true })
    pc.push({ t: [0.04, eh, el], p: [xE0 - 0.02, S + eh / 2, z], mat: m.lambris, ombre: false })
    // Marches au centre, côté salle
    const nb = 5
    const e = escalier({ x: z, largeur: 2.0, depart: xE0 - nb * 0.3, sens: 1, yDepart: S, contremarche: eh / nb, giron: 0.3, nombre: nb, m: 'chene', axe: 'x' })
    for (const p of e.pieces) if ('t' in p) pc.push({ t: p.t, p: p.p, mat: m.bancs })
    // Garde-corps de l'estrade de part et d'autre des marches
    for (const s of [-1, 1]) {
      const za = z + s * 1.05
      const zb = z + s * (el / 2)
      const lg = Math.abs(zb - za)
      pc.push({ t: [0.08, 0.07, lg], p: [xE0 + 0.05, yE + 1.0, (za + zb) / 2], mat: m.boisFonce })
      for (let k = 0; k <= Math.floor(lg / 0.16); k++)
        pc.push({ geo: new THREE.CylinderGeometry(0.022, 0.03, 0.95, 6), p: [xE0 + 0.05, yE + 0.5, za + s * k * 0.16], mat: m.bancs, ombre: false })
      pc.push({ t: [0.12, 1.1, 0.12], p: [xE0 + 0.05, yE + 0.55, za], mat: m.boisFonce })
    }
    // Corps de l'Aron, sur un socle mouluré de bois foncé
    const xA = xMur - P / 2
    pc.push({ t: [P, H, L], p: [xA, yE + H / 2, z], mat: m.boisDore, col: true })
    pc.push({ t: [P + 0.16, 0.22, L + 0.16], p: [xMur - (P + 0.16) / 2, yE + 0.11, z], mat: m.boisFonce })
    pc.push({ t: [P + 0.2, 0.04, L + 0.2], p: [xMur - (P + 0.2) / 2, yE + 0.24, z], mat: m.or, ombre: false })
    // Flancs sculptés : panneaux à plates-bandes encadrés (motif géométrique)
    for (const s of [-1, 1]) {
      const zF = z + s * (L / 2 + 0.015)
      for (const [y0, y1] of [
        [yE + 0.45, yE + 1.35],
        [yE + 1.55, yE + H - 0.55],
      ] as const) {
        const hh = y1 - y0
        pc.push({ t: [P - 0.3, hh, 0.03], p: [xA, y0 + hh / 2, zF], mat: m.boisFonce, ombre: false })
        pc.push({ t: [P - 0.5, hh - 0.2, 0.05], p: [xA, y0 + hh / 2, zF + s * 0.01], mat: m.boisDore, ombre: false })
      }
    }
    // Pilastres marquetés en chevrons
    for (const s of [-1, 1]) pc.push({ t: [0.06, H - 0.2, 0.42], p: [xMur - P - 0.03, yE + (H - 0.2) / 2 + 0.1, z + s * (L / 2 - 0.3)], mat: m.chevrons })
    // Couronnement en gradins
    for (let k = 0; k < 3; k++) {
      const w = L - 0.3 - k * 0.7
      pc.push({ t: [P + 0.1 - k * 0.15, 0.12, w], p: [xA, yE + H + 0.06 + k * 0.12, z], mat: k === 0 ? m.or : m.boisDore })
    }
    // Encadrement de l'Aron : deux colonnes tournées, corniche sculptée
    // simplifiée et rosaces. Les photos 2020/2025 montrent un meuble en bois
    // avec reliefs, et non un simple parallélépipède plat. Les cotes restent
    // ESTIMÉES ; cette décoration ne masque pas le parokhet de Tichri 2025.
    const xFace = xMur - P - 0.11
    for (const signe of [-1, 1]) {
      const zz = z + signe * (L / 2 - 0.32)
      pc.push({ geo: new THREE.CylinderGeometry(0.13, 0.18, H - 0.7, 10), p: [xFace, yE + H / 2, zz], mat: m.boisDore })
      for (const y of [yE + 0.27, yE + H - 0.24]) {
        pc.push({ t: [0.38, 0.18, 0.4], p: [xFace, y, zz], mat: m.boisDore })
        pc.push({ t: [0.40, 0.045, 0.44], p: [xFace, y + 0.11, zz], mat: m.or, ombre: false })
      }
    }
    pc.push({ t: [0.22, 0.22, L - 0.34], p: [xFace, yE + H - 0.38, z], mat: m.boisDore })
    pc.push({ t: [0.24, 0.05, L - 0.25], p: [xFace - 0.01, yE + H - 0.22, z], mat: m.or, ombre: false })
    // Rosaces de la frise : motifs géométriques, aucune inscription inventée.
    // Denticules sous le couronnement
    for (let i = 0; i <= 22; i++) {
      const zz = z - (L - 0.4) / 2 + (i * (L - 0.4)) / 22
      pc.push({ t: [0.06, 0.07, 0.07], p: [xFace + 0.02, yE + H - 0.1, zz], mat: m.boisDore, ombre: false })
    }
    for (let i = -3; i <= 3; i++) {
      const zz = z + i * (L - 0.8) / 7
      pc.push({ geo: new THREE.SphereGeometry(0.09, 8, 6), p: [xFace - 0.13, yE + H - 0.38, zz], mat: m.or, ombre: false })
    }
    // Parokhet blanc FERMÉ, d'un seul tenant, et cantonnière frangée d'or
    const lp = L - 1.0
    const hp = H - 0.75
    pc.push({ t: [0.03, hp, lp], p: [xMur - P - 0.02, yE + 0.2 + hp / 2, z], mat: m.parokhet })
    // Bas du rideau lesté, frange d'or : le tissu tombe droit, fermé
    pc.push({ t: [0.05, 0.06, lp + 0.02], p: [xMur - P - 0.045, yE + 0.23, z], mat: m.or, ombre: false })
    // Relief discret de plis verticaux ; le tissu n'est plus complètement plat.
    for (let i = 1; i < 14; i++) {
      const zz = z - lp / 2 + (lp * i) / 14
      pc.push({ geo: new THREE.CylinderGeometry(0.022, 0.025, hp - 0.06, 6), p: [xMur - P - 0.055, yE + 0.2 + hp / 2, zz], mat: m.parokhet, ombre: false })
    }
    pc.push({ t: [0.08, 0.36, lp + 0.15], p: [xMur - P - 0.06, yE + 0.2 + hp - 0.1, z], mat: m.parokhet })
    pc.push({ t: [0.09, 0.05, lp + 0.17], p: [xMur - P - 0.065, yE + 0.2 + hp - 0.3, z], mat: m.or, ombre: false })
    pc.push({ geo: new THREE.CylinderGeometry(0.025, 0.025, lp + 0.4, 8), p: [xMur - P - 0.07, yE + 0.2 + hp + 0.1, z], r: [Math.PI / 2, 0, 0], mat: m.or, ombre: false })
    // Broderies dorées (motif décoratif, sans texte)
    pc.push({ t: [0.01, 0.35, 0.5], p: [xMur - P - 0.04, yE + 0.2 + hp * 0.68, z], mat: m.or, ombre: false })
    for (const s of [-1, 1]) pc.push({ t: [0.01, hp * 0.5, 0.05], p: [xMur - P - 0.04, yE + 0.2 + hp * 0.35, z + s * 0.45], mat: m.or, ombre: false })
    // Mur de brique blanche derrière : déjà fourni par l'enveloppe
    return { pieces: pc, rampe: e.rampe }
  }, [m, xMur, z, L, H, P, eh, ep, el, S, yE])

  useInteractif('aron-plaque', [xMur - ep - 0.4, S + 1.2, z + 1.4], 1.6, () => t('action.lirePlaque'), () => {
    useGame.getState().set({ panneau: { type: 'message', cle: 'zal.aronTexte' } })
  })

  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      <Invisible taille={rampe.taille} position={rampe.position} rotation={rampe.rotation} />
      {/* Garde-corps de l'estrade (collisions) */}
      {[-1, 1].map((s) => (
        <Invisible key={s} taille={[0.1, 1.1, el / 2 - 1.05]} position={[xMur - ep + 0.05, yE + 0.55, z + s * (1.05 + (el / 2 - 1.05) / 2)]} />
      ))}
    </>
  )
}
