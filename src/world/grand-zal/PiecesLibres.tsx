import { useMemo } from 'react'
import { CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { geoBoite, type V3 } from '../primitives'

// Comme `Pieces` (primitives.tsx), mais le matériau est un objet Three.js
// quelconque : utilisé pour les matériaux propres au Zal.
export type PieceLibre =
  | { t: V3; p: V3; r?: V3; mat: THREE.Material; col?: boolean; ombre?: boolean }
  | { geo: THREE.BufferGeometry; p?: V3; r?: V3; s?: V3; mat: THREE.Material; ombre?: boolean }

const m4 = new THREE.Matrix4()
const q = new THREE.Quaternion()
const e = new THREE.Euler()

function geometrie(pc: PieceLibre) {
  const p = pc.p ?? [0, 0, 0]
  let g = 't' in pc ? geoBoite(pc.t[0], pc.t[1], pc.t[2], pc.r ? [0, 0, 0] : p) : pc.geo.clone()
  if (g.index) g = g.toNonIndexed()
  if (!g.attributes.uv) {
    const n = g.attributes.position.count
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2))
  }
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k)
  q.setFromEuler(e.set(...(pc.r ?? [0, 0, 0])))
  const s = 's' in pc && pc.s ? new THREE.Vector3(...pc.s) : new THREE.Vector3(1, 1, 1)
  m4.compose(new THREE.Vector3(...p), q, s)
  g.applyMatrix4(m4)
  return g
}

// `ombres = false` : rien ne projette d'ombre solaire (intérieur souterrain)
export function PiecesLibres({ pieces, ombres = true }: { pieces: PieceLibre[]; ombres?: boolean }) {
  const { lots, colliders } = useMemo(() => {
    const parMat = new Map<THREE.Material, { ombre: THREE.BufferGeometry[]; sans: THREE.BufferGeometry[] }>()
    const cols: { t: V3; p: V3; r?: V3 }[] = []
    for (const pc of pieces) {
      const lot = parMat.get(pc.mat) ?? { ombre: [], sans: [] }
      parMat.set(pc.mat, lot)
      ;(pc.ombre === false ? lot.sans : lot.ombre).push(geometrie(pc))
      if ('t' in pc && pc.col) cols.push({ t: pc.t, p: pc.p, r: pc.r })
    }
    const lots: { mat: THREE.Material; geo: THREE.BufferGeometry; ombre: boolean }[] = []
    for (const [mat, l] of parMat) {
      if (l.ombre.length) lots.push({ mat, geo: mergeGeometries(l.ombre), ombre: true })
      if (l.sans.length) lots.push({ mat, geo: mergeGeometries(l.sans), ombre: false })
    }
    return { lots, colliders: cols }
  }, [pieces])
  return (
    <>
      {lots.map((l, i) => (
        <mesh key={i} geometry={l.geo} material={l.mat} castShadow={ombres && l.ombre} receiveShadow />
      ))}
      {colliders.map((c, i) => (
        <CuboidCollider key={i} args={[c.t[0] / 2, c.t[1] / 2, c.t[2] / 2]} position={c.p} rotation={c.r} />
      ))}
    </>
  )
}
