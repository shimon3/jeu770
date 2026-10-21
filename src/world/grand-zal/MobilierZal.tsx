import { useMemo } from 'react'
import type { Vector3Tuple } from 'three'
import { ZAL } from '../../config/grandZal'
import { escalier, Invisible } from '../primitives'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'

// Mobilier du grand Zal. Formes d'après COLlive 2025 et Commons 8 : longs
// bancs à dossier munis d'une tablette à livres, tables d'étude avec bancs,
// pupitres, gradins (« bleachers », chabad.org). Nombre, position et
// orientation des rangées : RECONSTITUTION ARTISTIQUE (en attente de
// l'analyse des images A à D).

const S = ZAL.sol

// Segments de bancs le long de z (allées transversales entre eux)
const SEGMENTS: [number, number][] = [
  [-4.8, -9.3],
  [-10.7, -15.3],
  [-16.7, -21.3],
  [-22.7, -27.3],
]
// Rangées : bloc ouest et bloc est, de part et d'autre de la bimah
const RANGEES = [...Array.from({ length: 8 }, (_, i) => 11.4 + i * 1.2), ...Array.from({ length: 6 }, (_, i) => 28.4 + i * 1.2)]

export type SiegeDef = { id: string; position: Vector3Tuple; rotationY: number; sortie: Vector3Tuple }

function banc(m: MateriauxZal, rx: number, za: number, zb: number): PieceLibre[] {
  // Rangée de bancs à dossier haut, tablette pour sefarim et repose-pied.
  // Forme observée sur le reportage intérieur 2020, p. 9-10. Les positions
  // de toutes les rangées restent des ESTIMATIONS.
  const L = za - zb
  const zc = (za + zb) / 2
  const pieces: PieceLibre[] = [
    // Assise, lèvre avant et dossier.
    { t: [0.44, 0.065, L], p: [rx, S + 0.45, zc], mat: m.bancs },
    { t: [0.055, 0.14, L], p: [rx + 0.20, S + 0.40, zc], mat: m.bancs },
    { t: [0.065, 0.62, L], p: [rx - 0.24, S + 0.75, zc], mat: m.bancs },
    // Tablette supérieure, légèrement inclinée pour les livres.
    { t: [0.28, 0.045, L], p: [rx - 0.36, S + 0.90, zc], r: [0, 0, -0.09], mat: m.boisFonce },
    { t: [0.035, 0.10, L], p: [rx - 0.50, S + 0.87, zc], mat: m.boisFonce },
    // Repose-pieds et entretoise longitudinale.
    { t: [0.24, 0.05, L - 0.2], p: [rx + 0.18, S + 0.15, zc], mat: m.boisFonce },
    // Panneaux porteurs à chaque extrémité.
    { t: [0.60, 0.95, 0.065], p: [rx - 0.06, S + 0.475, za - 0.04], mat: m.boisFonce },
    { t: [0.60, 0.95, 0.065], p: [rx - 0.06, S + 0.475, zb + 0.04], mat: m.boisFonce },
  ]
  // Pieds intermédiaires : les longues assises ne semblent plus flotter.
  // Ils n'ajoutent pas de collision (la collision du banc est déjà globale).
  const n = Math.max(0, Math.floor(L / 1.45))
  for (let i = 1; i <= n; i++) {
    const z = zb + (L * i) / (n + 1)
    pieces.push({ t: [0.09, 0.43, 0.09], p: [rx + 0.11, S + 0.215, z], mat: m.boisFonce })
    pieces.push({ t: [0.065, 0.84, 0.085], p: [rx - 0.23, S + 0.42, z], mat: m.boisFonce })
  }
  return pieces
}

export function bancsEtSieges(m: MateriauxZal) {
  const pieces: PieceLibre[] = []
  const colliders: { t: Vector3Tuple; p: Vector3Tuple }[] = []
  const sieges: SiegeDef[] = []
  for (const rx of RANGEES)
    for (const [za, zb] of SEGMENTS) {
      pieces.push(...banc(m, rx, za, zb))
      colliders.push({ t: [0.64, 1.0, za - zb], p: [rx - 0.07, S + 0.5, (za + zb) / 2] })
      // Une place assise au bout des bancs qui bordent l'allée centrale
      // (z = -16) ; les allées transversales sont occupées par les colonnes
      if (za !== SEGMENTS[1][0] && za !== SEGMENTS[2][0]) continue
      const versAllee = za > -16 ? -1 : 1
      const bout = versAllee < 0 ? zb : za
      sieges.push({
        id: `banc-zal-${rx.toFixed(1)}-${za}`,
        position: [rx, S, bout - versAllee * 0.45],
        rotationY: Math.PI / 2,
        sortie: [rx, S, bout + versAllee * 0.6],
      })
    }
  return { pieces, colliders, sieges }
}

// Tables d'étude de l'aile ouest (ancien shalash) ; elles servent aussi à la
// mission « préparer le farbrenguen »
export const TABLES_SHALASH: { id: string; x: number; z: number }[] = [
  { id: 'table-farbrenguen-1', x: -1.0, z: -25.6 },
  { id: 'table-farbrenguen-2', x: 3.0, z: -25.6 },
  { id: 'table-farbrenguen-3', x: 7.0, z: -25.6 },
]

function tableEtBancs(m: MateriauxZal, x: number, z: number): { pieces: PieceLibre[]; sieges: SiegeDef[] } {
  const pieces: PieceLibre[] = [
    { t: [3.0, 0.05, 0.9], p: [x, S + 0.76, z], mat: m.bancs, col: true },
    { t: [2.8, 0.7, 0.06], p: [x, S + 0.38, z], mat: m.boisFonce },
  ]
  for (const dx of [-1.4, 1.4]) pieces.push({ t: [0.06, 0.74, 0.8], p: [x + dx, S + 0.37, z], mat: m.boisFonce, col: true })
  const sieges: SiegeDef[] = []
  for (const s of [-1, 1]) {
    pieces.push({ t: [3.0, 0.05, 0.36], p: [x, S + 0.45, z + s * 0.8], mat: m.bancs, col: true })
    for (const dx of [-1.3, 1.3]) pieces.push({ t: [0.06, 0.43, 0.3], p: [x + dx, S + 0.215, z + s * 0.8], mat: m.boisFonce })
    // Places assises côté nord seulement : côté sud, la touche E sert à la
    // table (mission du farbrenguen)
    if (s > 0) continue
    sieges.push({
      id: `banc-table-${x}-${s}`,
      position: [x - 0.6, S, z + s * 0.8],
      rotationY: s > 0 ? Math.PI : 0,
      sortie: [x - 0.6, S, z + s * 1.45],
    })
  }
  return { pieces, sieges }
}

function pupitre(m: MateriauxZal, x: number, z: number, rot: number): PieceLibre[] {
  return [
    { t: [0.5, 1.0, 0.4], p: [x, S + 0.5, z], r: [0, rot, 0], mat: m.boisFonce, col: true },
    { t: [0.6, 0.04, 0.5], p: [x, S + 1.08, z], r: [0.35, rot, 0], mat: m.bancs },
  ]
}

export function MobilierZal({ m }: { m: MateriauxZal }) {
  const { pieces, colliders, sieges, rampe } = useMemo(() => {
    const b = bancsEtSieges(m)
    const pieces = [...b.pieces]
    const sieges = [...b.sieges]
    for (const tb of TABLES_SHALASH) {
      const r = tableEtBancs(m, tb.x, tb.z)
      pieces.push(...r.pieces)
      sieges.push(...r.sieges)
    }
    // Pupitres
    for (const [x, z, r] of [
      [10.6, -16.0, Math.PI / 2],
      [2.0, -30.0, 0],
      [-4.2, -30.0, 0],
      [35.8, -5.5, Math.PI],
    ] as const)
      pieces.push(...pupitre(m, x, z, r))
    // Gradins contre le mur ouest du shalash, avec escalier d'accès
    const xMur = ZAL.shalashX0
    for (let k = 0; k < 4; k++) {
      const xFront = -3.2 - k * 0.7
      const w = xFront - xMur
      pieces.push({ t: [w, 0.4, 3.8], p: [(xMur + xFront) / 2, S + 0.4 * k + 0.2, -25.9], mat: m.bancs, col: true })
      pieces.push({ t: [0.03, 0.38, 3.8], p: [xFront + 0.015, S + 0.4 * k + 0.2, -25.9], mat: m.boisFonce, ombre: false })
    }
    const e = escalier({ x: -23.6, largeur: 0.8, depart: -3.2, sens: -1, yDepart: S, contremarche: 0.2, giron: 0.35, nombre: 8, m: 'chene', axe: 'x' })
    for (const p of e.pieces) if ('t' in p) pieces.push({ t: p.t, p: p.p, mat: m.bancs })
    return { pieces, colliders: b.colliders, sieges, rampe: e.rampe }
  }, [m])

  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      {colliders.map((c, i) => (
        <Invisible key={i} taille={c.t} position={c.p} />
      ))}
      <Invisible taille={rampe.taille} position={rampe.position} rotation={rampe.rotation} />
      {sieges.map((s) => (
        <Siege key={s.id} def={s} />
      ))}
    </>
  )
}

function Siege({ def }: { def: SiegeDef }) {
  useInteractif(def.id, [def.position[0], def.position[1] + 0.6, def.position[2]], 1.0, () => t('action.asseoir'), () => {
    useGame.getState().set({ siege: { position: def.position, rotationY: def.rotationY, sortie: def.sortie } })
    useGame.getState().notifier('message.leverDebout')
  })
  return null
}
