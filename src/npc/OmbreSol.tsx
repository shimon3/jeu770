import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Ombre ronde et douce sous un PNJ éloigné (ou sous terre), à la place de
// l'ombre portée réelle, coupée au-delà de DIST_OMBRE_REELLE pour alléger la
// carte graphique. Une seule texture, une seule géométrie et un seul matériau
// partagés par tous les PNJ.

export const DIST_OMBRE_REELLE = 8

// Disque dégradé en couleurs de sommets (noir, alpha décroissant du centre
// vers le bord) : pas de texture (l'ancienne texture canvas restait invisible)
function disque() {
  const anneaux = [
    [0, 0.95],
    [0.25, 0.85],
    [0.5, 0.6],
    [0.75, 0.25],
    [1, 0],
  ]
  const seg = 24
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  pos.push(0, 0, 0)
  col.push(0, 0, 0, anneaux[0][1])
  for (let r = 1; r < anneaux.length; r++)
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2
      pos.push(Math.cos(a) * anneaux[r][0] * 0.5, 0, Math.sin(a) * anneaux[r][0] * 0.5)
      col.push(0, 0, 0, anneaux[r][1])
    }
  const v = (r: number, i: number) => (r === 0 ? 0 : 1 + (r - 1) * seg + (i % seg))
  for (let r = 0; r < anneaux.length - 1; r++)
    for (let i = 0; i < seg; i++) {
      if (r === 0) idx.push(0, v(1, i + 1), v(1, i))
      else idx.push(v(r, i), v(r, i + 1), v(r + 1, i), v(r, i + 1), v(r + 1, i + 1), v(r + 1, i))
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  g.setIndex(idx)
  return g
}

let partage: { geo: THREE.BufferGeometry; mat: THREE.MeshBasicMaterial } | null = null
function ressources() {
  if (!partage) {
    const geo = disque()
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 })
    partage = { geo, mat }
  }
  return partage
}

const POS = new THREE.Vector3()

export function OmbreSol({ rayon = 0.45 }: { rayon?: number }) {
  const m = useRef<THREE.Mesh>(null)
  const base = useRef(rayon * 2)
  base.current = rayon * 2
  const { geo, mat } = ressources()
  useFrame(() => {
    const o = m.current
    if (!o) return
    o.getWorldPosition(POS)
    // Ombre de contact toujours présente (sans elle, les PNJ semblent flotter,
    // retour de Samuel 12/11)
    o.scale.set(base.current, 1, base.current)
  })
  return <mesh ref={m} geometry={geo} material={mat} position={[0, 0.03, 0]} scale={[rayon * 2, 1, rayon * 2]} renderOrder={-1} />
}
