import { useMemo } from 'react'
import { CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useMateriaux, type Materiaux } from './materiaux'

export type V3 = [number, number, number]
type CleMat = { [K in keyof Materiaux]: Materiaux[K] extends THREE.Material ? K : never }[keyof Materiaux]

// Une pièce de décor : boîte (t = taille) ou géométrie libre (geo), en
// coordonnées monde. `col` ajoute un collider (boîtes uniquement).
export type Piece =
  | { t: V3; p: V3; r?: V3; m: CleMat; col?: boolean; ombre?: boolean }
  | { geo: THREE.BufferGeometry; p?: V3; r?: V3; m: CleMat; ombre?: boolean }

// UV en mètres alignés sur le monde : les motifs se raccordent entre boîtes.
export function geoBoite(w: number, h: number, d: number, decalage: V3 = [0, 0, 0]) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + decalage[0]
    const y = pos.getY(i) + decalage[1]
    const z = pos.getZ(i) + decalage[2]
    if (Math.abs(nor.getX(i)) > 0.5) uv.setXY(i, z, y)
    else if (Math.abs(nor.getY(i)) > 0.5) uv.setXY(i, x, z)
    else uv.setXY(i, x, y)
  }
  uv.needsUpdate = true
  return geo
}

const m4 = new THREE.Matrix4()
const qq = new THREE.Quaternion()
const ee = new THREE.Euler()
const un = new THREE.Vector3(1, 1, 1)

function geometriePiece(pc: Piece): THREE.BufferGeometry {
  let g: THREE.BufferGeometry
  const p = pc.p ?? [0, 0, 0]
  if ('t' in pc) g = geoBoite(pc.t[0], pc.t[1], pc.t[2], pc.r ? [0, 0, 0] : p)
  else g = pc.geo.clone()
  if (g.index) g = g.toNonIndexed()
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
  qq.setFromEuler(ee.set(...(pc.r ?? [0, 0, 0])))
  m4.compose(new THREE.Vector3(...p), qq, un)
  g.applyMatrix4(m4)
  return g
}

// Fusionne les pièces par matériau (un draw call par matériau) et crée les
// colliders demandés.
export function Pieces({ pieces }: { pieces: Piece[] }) {
  const mats = useMateriaux()
  const { lots, colliders } = useMemo(() => {
    const parMat = new Map<string, { ombre: THREE.BufferGeometry[]; sans: THREE.BufferGeometry[] }>()
    const cols: { t: V3; p: V3; r?: V3 }[] = []
    for (const pc of pieces) {
      const lot = parMat.get(pc.m) ?? { ombre: [], sans: [] }
      parMat.set(pc.m, lot)
      ;(pc.ombre === false ? lot.sans : lot.ombre).push(geometriePiece(pc))
      if ('t' in pc && pc.col) cols.push({ t: pc.t, p: pc.p, r: pc.r })
    }
    const lots: { cle: string; geo: THREE.BufferGeometry; ombre: boolean }[] = []
    for (const [cle, l] of parMat) {
      if (l.ombre.length) lots.push({ cle, geo: mergeGeometries(l.ombre), ombre: true })
      if (l.sans.length) lots.push({ cle, geo: mergeGeometries(l.sans), ombre: false })
    }
    return { lots, colliders: cols }
  }, [pieces])

  return (
    <>
      {lots.map((l, i) => (
        <mesh key={i} geometry={l.geo} material={mats[l.cle as CleMat]} castShadow={l.ombre} receiveShadow />
      ))}
      {colliders.map((c, i) => (
        <CuboidCollider key={i} args={[c.t[0] / 2, c.t[1] / 2, c.t[2] / 2]} position={c.p} rotation={c.r} />
      ))}
    </>
  )
}

// Collider seul (limites invisibles, rampes d'escalier)
export function Invisible({ taille, position, rotation }: { taille: V3; position: V3; rotation?: V3 }) {
  return <CuboidCollider args={[taille[0] / 2, taille[1] / 2, taille[2] / 2]} position={position} rotation={rotation} />
}

export type Rect = { x0: number; x1: number; y0: number; y1: number }

// Découpe un rectangle de mur en sous-rectangles pleins autour des ouvertures.
export function decouperMur(mur: Rect, ouvertures: Rect[]): Rect[] {
  const ys = new Set([mur.y0, mur.y1])
  for (const o of ouvertures) {
    if (o.y0 > mur.y0 && o.y0 < mur.y1) ys.add(o.y0)
    if (o.y1 > mur.y0 && o.y1 < mur.y1) ys.add(o.y1)
  }
  const bandes = [...ys].sort((a, b) => a - b)
  const res: Rect[] = []
  let precedent: Rect[] = []
  for (let i = 0; i < bandes.length - 1; i++) {
    const ya = bandes[i]
    const yb = bandes[i + 1]
    const trous = ouvertures
      .filter((o) => o.y0 < yb - 1e-6 && o.y1 > ya + 1e-6)
      .map((o) => [Math.max(o.x0, mur.x0), Math.min(o.x1, mur.x1)] as const)
      .sort((a, b) => a[0] - b[0])
    const libres: Rect[] = []
    let x = mur.x0
    for (const [a, b] of trous) {
      if (a > x + 1e-6) libres.push({ x0: x, x1: a, y0: ya, y1: yb })
      x = Math.max(x, b)
    }
    if (x < mur.x1 - 1e-6) libres.push({ x0: x, x1: mur.x1, y0: ya, y1: yb })
    const courant: Rect[] = []
    for (const r of libres) {
      const p = precedent.find((q) => Math.abs(q.x0 - r.x0) < 1e-6 && Math.abs(q.x1 - r.x1) < 1e-6 && Math.abs(q.y1 - ya) < 1e-6)
      if (p) {
        p.y1 = yb
        courant.push(p)
      } else {
        res.push(r)
        courant.push(r)
      }
    }
    precedent = courant
  }
  return res
}

type MurDef = {
  axe: 'x' | 'z' // 'x' : mur dans un plan z = cte ; 'z' : plan x = cte
  plan: number
  epaisseur: number
  de: number
  a: number
  bas: number
  haut: number
  ouvertures?: Rect[]
  m: CleMat
  col?: boolean
}

export function mur({ axe, plan, epaisseur, de, a, bas, haut, ouvertures = [], m, col = true }: MurDef): Piece[] {
  return decouperMur({ x0: de, x1: a, y0: bas, y1: haut }, ouvertures).map((r) => {
    const l = r.x1 - r.x0
    const h = r.y1 - r.y0
    const c = (r.x0 + r.x1) / 2
    const y = (r.y0 + r.y1) / 2
    return axe === 'x'
      ? { t: [l, h, epaisseur] as V3, p: [c, y, plan] as V3, m, col }
      : { t: [epaisseur, h, l] as V3, p: [plan, y, c] as V3, m, col }
  })
}

// Escalier droit : marches visibles + rampe de collision lisse (le
// contrôleur monte la pente sans téléportation).
type EscalierDef = {
  x: number // centre transversal
  largeur: number
  depart: number // nez de la première marche, le long de l'axe
  sens: -1 | 1
  yDepart: number
  contremarche: number
  giron: number
  nombre: number
  m: CleMat
  mNez?: CleMat
  axe?: 'z' | 'x'
  plein?: boolean // marches pleines jusqu'au sol (extérieur)
}

export function escalier(d: EscalierDef): { pieces: Piece[]; rampe: { taille: V3; position: V3; rotation: V3 } } {
  const { x, largeur, depart, sens, yDepart, contremarche, giron, nombre, m, mNez, axe = 'z', plein = true } = d
  const pieces: Piece[] = []
  for (let i = 0; i < nombre; i++) {
    const haut = yDepart + contremarche * (i + 1)
    const bas = plein ? yDepart : haut - contremarche
    const long = depart + sens * giron * (i + 0.5)
    const h = haut - bas
    pieces.push(
      axe === 'z'
        ? { t: [largeur, h, giron], p: [x, bas + h / 2, long], m }
        : { t: [giron, h, largeur], p: [long, bas + h / 2, x], m },
    )
    if (mNez) {
      const n = depart + sens * giron * i + sens * 0.03
      pieces.push(
        axe === 'z'
          ? { t: [largeur + 0.02, 0.045, 0.09], p: [x, haut - 0.02, n], m: mNez, ombre: false }
          : { t: [0.09, 0.045, largeur + 0.02], p: [n, haut - 0.02, x], m: mNez, ombre: false },
      )
    }
  }
  const longueur = giron * nombre
  const montee = contremarche * nombre
  const angle = Math.atan2(montee, longueur)
  const hyp = Math.hypot(longueur, montee) + 0.1
  const centre = depart + (sens * longueur) / 2
  // Le plan passe au milieu des girons (demi-contremarche au-dessus des nez)
  const y = yDepart + montee / 2 + contremarche * 0.5 - 0.06
  // Rx(+θ) abaisse l'extrémité +z ; Rz(+θ) relève l'extrémité +x
  const rampe =
    axe === 'z'
      ? { taille: [largeur, 0.1, hyp] as V3, position: [x, y, centre] as V3, rotation: [-sens * angle, 0, 0] as V3 }
      : { taille: [hyp, 0.1, largeur] as V3, position: [centre, y, x] as V3, rotation: [0, 0, sens * angle] as V3 }
  return { pieces, rampe }
}

// Prisme triangulaire (pignon) dans le plan z : base de xa à xb à la hauteur
// yBase, sommet à (xs, ySommet), extrudé vers -z sur `profondeur`.
export function geoPignon(xa: number, xb: number, yBase: number, ySommet: number, profondeur: number) {
  const s = new THREE.Shape()
  s.moveTo(xa, yBase)
  s.lineTo(xb, yBase)
  s.lineTo((xa + xb) / 2, ySommet)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: profondeur, bevelEnabled: false })
  g.translate(0, 0, -profondeur)
  return g
}
