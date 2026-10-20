import { useMemo } from 'react'
import * as THREE from 'three'
import { BIMAH, ZAL } from '../../config/grandZal'
import { Invisible, type V3 } from '../primitives'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { useInteractif } from '../interaction'
import { t } from '../../i18n'
import { evenementMission } from '../../missions/missions'
import { useGame } from '../../state/store'

// Bimah : enceinte carrée en bois à balustres tournés, plancher surélevé sur
// roulettes, table couverte d'un tissu bordeaux (Commons 8, 2020 ; COLlive
// 2025 photos 032-034, où elle est déplacée sur ses roulettes). Cotes ESTIMÉES.

export function BimahZal({ m }: { m: MateriauxZal }) {
  const { x, z, cote, hauteurPlancher: hp, hauteurGardeCorps: hg } = BIMAH
  const S = ZAL.sol
  const pieces = useMemo(() => {
    const pc: PieceLibre[] = []
    const d = cote / 2
    const yP = S + hp
    pc.push({ t: [cote, hp - 0.08, cote], p: [x, S + 0.08 + (hp - 0.08) / 2, z], mat: m.bancs, col: true })
    // Roulettes
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        pc.push({ geo: new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), p: [x + sx * (d - 0.2), S + 0.05, z + sz * (d - 0.2)], r: [Math.PI / 2, 0, 0], mat: m.metal, ombre: false })
    // Marche d'accès côté ouest
    pc.push({ t: [0.35, hp / 2, 1.0], p: [x - d - 0.175, S + hp / 4, z], mat: m.bancs, col: true })
    // Garde-corps : poteaux, lisses, balustres ; ouverture de 1 m à l'ouest
    const lisse = (x0: number, z0: number, x1: number, z1: number) => {
      const L = Math.hypot(x1 - x0, z1 - z0)
      const rot = Math.atan2(z1 - z0, x1 - x0)
      pc.push({ t: [L, 0.07, 0.09], p: [(x0 + x1) / 2, yP + hg, (z0 + z1) / 2], r: [0, -rot, 0], mat: m.boisFonce })
      pc.push({ t: [L, 0.18, 0.06], p: [(x0 + x1) / 2, yP + 0.09, (z0 + z1) / 2], r: [0, -rot, 0], mat: m.boisFonce })
      const n = Math.floor(L / 0.16)
      for (let i = 1; i < n; i++) {
        const k = i / n
        pc.push({ geo: new THREE.CylinderGeometry(0.022, 0.03, hg - 0.2, 6), p: [x0 + (x1 - x0) * k, yP + 0.18 + (hg - 0.2) / 2, z0 + (z1 - z0) * k], mat: m.bancs, ombre: false })
      }
    }
    lisse(x - d, z - d, x + d, z - d)
    lisse(x + d, z - d, x + d, z + d)
    lisse(x + d, z + d, x - d, z + d)
    lisse(x - d, z + d, x - d, z + 0.5)
    lisse(x - d, z - 0.5, x - d, z - d)
    for (const [px, pz] of [
      [x - d, z - d],
      [x + d, z - d],
      [x + d, z + d],
      [x - d, z + d],
      [x - d, z + 0.5],
      [x - d, z - 0.5],
    ])
      pc.push({ t: [0.12, hg + 0.1, 0.12], p: [px, yP + (hg + 0.1) / 2, pz], mat: m.boisFonce })
    // Table de lecture couverte de bordeaux
    pc.push({ t: [1.0, 0.95, 1.7], p: [x + 0.4, yP + 0.475, z], mat: m.boisFonce, col: true })
    pc.push({ t: [1.06, 0.04, 1.76], p: [x + 0.4, yP + 0.97, z], mat: m.bordeaux })
    pc.push({ t: [0.02, 0.4, 1.76], p: [x - 0.12, yP + 0.78, z], mat: m.bordeaux, ombre: false })
    return pc
  }, [m, x, z, cote, hp, hg, S])

  useInteractif('bimah', [x + 0.4, S + hp + 1.0, z], 2.6, () => t('action.examinerBimah'), () => {
    useGame.getState().set({ panneau: { type: 'message', cle: 'zal.bimahTexte' } })
    evenementMission('interagir', 'bimah')
  })

  const d = cote / 2
  const yP = S + hp
  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      {/* Garde-corps (collisions) ; l'ouverture ouest reste libre */}
      <BoiteCol t={[cote, 1.2, 0.1]} p={[x, yP + 0.6, z - d]} />
      <BoiteCol t={[cote, 1.2, 0.1]} p={[x, yP + 0.6, z + d]} />
      <BoiteCol t={[0.1, 1.2, cote]} p={[x + d, yP + 0.6, z]} />
      <BoiteCol t={[0.1, 1.2, d - 0.5]} p={[x - d, yP + 0.6, z - 0.5 - (d - 0.5) / 2]} />
      <BoiteCol t={[0.1, 1.2, d - 0.5]} p={[x - d, yP + 0.6, z + 0.5 + (d - 0.5) / 2]} />
    </>
  )
}

function BoiteCol({ t: taille, p }: { t: V3; p: V3 }) {
  return <Invisible taille={taille} position={p} />
}
