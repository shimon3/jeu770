import { useMemo } from 'react'
import type { Vector3Tuple } from 'three'
import { ZAL } from '../../config/grandZal'
import * as THREE from 'three'
import { Invisible } from '../primitives'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { useInteractif } from '../interaction'
import { useDecalage } from '../decalage'
import { useGame } from '../../state/store'
import { t } from '../../i18n'

// Mobilier du grand Zal. Formes d'après COLlive 2025 et Commons 8 : longs
// bancs à dossier munis d'une tablette à livres, tables d'étude avec bancs,
// pupitres, gradins (« bleachers », chabad.org). Nombre, position et
// orientation des rangées : RECONSTITUTION ARTISTIQUE (en attente de
// l'analyse des images A à D).

const S = ZAL.sol

// Segments de tables le long de z (allées transversales entre eux)
const SEGMENTS: [number, number][] = [
  [-4.8, -9.3],
  [-10.7, -15.3],
  [-16.7, -21.3],
  [-22.7, -27.3],
]
// Disposition corrigée le 26/11/2026 (Samuel) : au 770, on ne s'assoit pas
// en rangées tournées vers l'avant comme dans une église, mais sur des bancs
// placés DE CHAQUE CÔTÉ de longues tables (on se fait face). Bloc ouest et
// bloc est de part et d'autre de la bimah. Nombre et position des tables :
// RECONSTITUTION ARTISTIQUE.
export const TABLES_OUEST = [12.4, 15.4, 18.4]
export const TABLES_EST = [29.2, 32.2]
// Devant le heichal (bloc est) : seulement les deux segments du milieu
const SEGMENTS_EST: [number, number][] = [SEGMENTS[1], SEGMENTS[2]]
const BLOCS: [number[], [number, number][]][] = [
  [TABLES_OUEST, SEGMENTS],
  [TABLES_EST, SEGMENTS_EST],
]
// Écart entre l'axe de la table et l'axe de chaque banc
export const ECART_BANC = 0.72

export type SiegeDef = { id: string; position: Vector3Tuple; rotationY: number; sortie: Vector3Tuple }

// Couvertures des sefarim : bordeaux, bleu nuit, vert foncé, noir, brun
const COUVERTURES = ['#5a1a1f', '#1d2747', '#1f3a2a', '#151515', '#4a2c18'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }))
const PAGES = new THREE.MeshStandardMaterial({ color: '#efe6cf', roughness: 0.9 })

// Hasard déterministe (mêmes livres à chaque chargement)
function graine(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Livres posés sur une table orientée le long de z : piles fermées, livres
// ouverts, siddourim, répartis des deux côtés
export function livresSurTable(x: number, y: number, za: number, zb: number, cle: number): PieceLibre[] {
  const pieces: PieceLibre[] = []
  let k = 0
  for (let z = zb + 0.45; z < za - 0.3; z += 0.62, k++) {
    const h = graine(cle * 97 + k)
    if (h < 0.25) continue
    const cote = k % 2 === 0 ? -1 : 1
    const xl = x + cote * 0.2
    const mat = COUVERTURES[Math.floor(graine(cle * 31 + k) * COUVERTURES.length)]
    if (h < 0.55) {
      // Livre ouvert : deux moitiés légèrement relevées, pages claires
      for (const s of [-1, 1]) {
        pieces.push({ t: [0.17, 0.012, 0.25], p: [xl + s * 0.085, y + 0.012, z], r: [0, 0, s * -0.08], mat })
        pieces.push({ t: [0.16, 0.018, 0.24], p: [xl + s * 0.083, y + 0.026, z], r: [0, 0, s * -0.08], mat: PAGES })
      }
    } else if (h < 0.8) {
      // Pile de 2 ou 3 livres fermés
      const n = h < 0.68 ? 2 : 3
      for (let i = 0; i < n; i++) {
        const mi = COUVERTURES[(Math.floor(h * 10) + i) % COUVERTURES.length]
        pieces.push({ t: [0.2, 0.045, 0.27], p: [xl + (i % 2) * 0.015, y + 0.0225 + i * 0.045, z], r: [0, (i - 1) * 0.12, 0], mat: mi })
      }
    } else {
      // Siddour à plat et petit livre debout
      pieces.push({ t: [0.13, 0.03, 0.19], p: [xl, y + 0.015, z - 0.1], mat })
      pieces.push({ t: [0.04, 0.2, 0.14], p: [xl, y + 0.1, z + 0.12], mat: COUVERTURES[(k + 2) % COUVERTURES.length] })
    }
  }
  return pieces
}

function tableLongue(m: MateriauxZal, tx: number, za: number, zb: number, cle: number): PieceLibre[] {
  const L = za - zb
  const zc = (za + zb) / 2
  const n = Math.max(0, Math.floor(L / 1.6))
  const inter = Array.from({ length: n }, (_, i) => zb + (L * (i + 1)) / (n + 1))
  const pieces: PieceLibre[] = [
    // Plateau, ceinture, pieds en panneaux
    { t: [0.82, 0.05, L], p: [tx, S + 0.76, zc], mat: m.bancs },
    { t: [0.05, 0.12, L - 0.2], p: [tx, S + 0.67, zc], mat: m.boisFonce },
  ]
  for (const z of [za - 0.12, zb + 0.12, ...inter]) pieces.push({ t: [0.66, 0.72, 0.06], p: [tx, S + 0.37, z], mat: m.boisFonce })
  // Un banc de chaque côté de la table
  for (const s of [-1, 1]) {
    const bx = tx + s * ECART_BANC
    pieces.push({ t: [0.36, 0.06, L], p: [bx, S + 0.45, zc], mat: m.bancs })
    pieces.push({ t: [0.04, 0.1, L], p: [bx + s * 0.16, S + 0.39, zc], mat: m.boisFonce })
    for (const z of [za - 0.15, zb + 0.15, ...inter]) pieces.push({ t: [0.3, 0.42, 0.06], p: [bx, S + 0.21, z], mat: m.boisFonce })
  }
  pieces.push(...livresSurTable(tx, S + 0.785, za, zb, cle))
  return pieces
}

export function bancsEtSieges(m: MateriauxZal) {
  const pieces: PieceLibre[] = []
  const colliders: { t: Vector3Tuple; p: Vector3Tuple }[] = []
  const sieges: SiegeDef[] = []
  let cle = 1
  for (const [tables, segments] of BLOCS)
    for (const tx of tables)
      for (const [za, zb] of segments) {
        pieces.push(...tableLongue(m, tx, za, zb, cle++))
        colliders.push({ t: [ECART_BANC * 2 + 0.36, 1.0, za - zb], p: [tx, S + 0.5, (za + zb) / 2] })
        // Places assises au bout des bancs qui bordent l'allée centrale
        // (z = -16), des deux côtés de la table, face à face
        if (za !== SEGMENTS[1][0] && za !== SEGMENTS[2][0]) continue
        const versAllee = za > -16 ? -1 : 1
        const bout = versAllee < 0 ? zb : za
        for (const s of [-1, 1])
          sieges.push({
            id: `banc-zal-${tx.toFixed(1)}-${za}-${s}`,
            position: [tx + s * ECART_BANC, S, bout - versAllee * 0.45],
            rotationY: s < 0 ? Math.PI / 2 : -Math.PI / 2,
            sortie: [tx + s * ECART_BANC, S, bout + versAllee * 0.6],
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
  // Livres sur la table (table le long de x : on échange x et z)
  for (const l of livresSurTable(z, S + 0.785, x + 1.4, x - 1.4, Math.round(x * 7 + 50)))
    if ('t' in l) pieces.push({ ...l, t: [l.t[2], l.t[1], l.t[0]], p: [l.p[2], l.p[1], l.p[0]], r: l.r ? [l.r[2], l.r[1], l.r[0]] : undefined })
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
  // Shtender avec un siddour ouvert posé sur le plan incliné
  const e = new THREE.Euler(0.35, rot, 0)
  const livre = (dx: number, dy: number, mat: THREE.Material, ep: number): PieceLibre => {
    const d = new THREE.Vector3(dx, 0.022 + dy, 0).applyEuler(e)
    return { t: [0.19, ep, 0.27], p: [x + d.x, S + 1.08 + d.y, z + d.z], r: [0.35, rot, 0], mat }
  }
  return [
    { t: [0.5, 1.0, 0.4], p: [x, S + 0.5, z], r: [0, rot, 0], mat: m.boisFonce, col: true },
    { t: [0.6, 0.04, 0.5], p: [x, S + 1.08, z], r: [0.35, rot, 0], mat: m.bancs },
    livre(-0.1, 0, COUVERTURES[0], 0.012),
    livre(0.1, 0, COUVERTURES[0], 0.012),
    livre(-0.098, 0.012, PAGES, 0.016),
    livre(0.098, 0.012, PAGES, 0.016),
  ]
}

export function MobilierZal({ m }: { m: MateriauxZal }) {
  const { pieces, colliders, sieges } = useMemo(() => {
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
    // Gradins retirés le 26/11/2026 (Samuel) : ils menaient au mur et ne
    // sont plus en place au 770 (shabboshouse.org, « Sicha ends absorbed on
    // the bleachers »)
    return { pieces, colliders: b.colliders, sieges }
  }, [m])

  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      {colliders.map((c, i) => (
        <Invisible key={i} taille={c.t} position={c.p} />
      ))}
      {sieges.map((s) => (
        <Siege key={s.id} def={s} />
      ))}
    </>
  )
}

function Siege({ def }: { def: SiegeDef }) {
  // Place assise en coordonnées monde (le Zal est décalé par <Deplace>)
  const d = useDecalage()
  useInteractif(def.id, [def.position[0], def.position[1] + 0.6, def.position[2]], 1.0, () => t('action.asseoir'), () => {
    const [px, py, pz] = def.position
    const [sx, sy, sz] = def.sortie
    useGame.getState().set({ siege: { position: [px + d, py, pz], rotationY: def.rotationY, sortie: [sx + d, sy, sz] } })
    useGame.getState().notifier('message.leverDebout')
  })
  return null
}
