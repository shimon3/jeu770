import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ENTREE, ZAL } from '../../config/grandZal'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { BORD_NORD, BORD_SUD, Z_SUD } from './EnveloppeZal'
import { useGame } from '../../state/store'

// Plafond : dalles carrées au centre, longues réglettes latérales, ventilateurs,
// lustres de cristal (rapport photographique 2020, COLlive 2025, Commons 8-9).
// Nombre et répartition ESTIMÉS.

const P = ZAL.plafond
const S = ZAL.sol

// Photos de 2020 (rapport Aaron Valuation p. 9-10) : dalles lumineuses
// carrées dans le volume haut, longues réglettes dans les plafonds bas.
// Les positions ci-dessous sont ESTIMÉES (aucun relevé du plafond disponible).
const DALLES: [number, number][] = []
for (let x = ZAL.x0 + 1.5; x < ZAL.x1 - 1.0; x += 2.4)
  for (let z = BORD_NORD + 1.2; z < BORD_SUD - 1; z += 2.4)
    DALLES.push([x, z])
// Les dalles prolongent la grande salle dans l'aile ouest du shalash.
for (let x = ZAL.shalashX0 + 1.4; x < ZAL.x0 - 0.6; x += 2.4)
  for (let z = BORD_NORD + 0.8; z < ZAL.shalashZ1 - 1; z += 2.4)
    DALLES.push([x, z])

const REGLETTES: [number, number, number][] = []
for (let x = ZAL.x0 + 1.5; x < ZAL.x1 - 1.0; x += 2.7) {
  REGLETTES.push([x, Z_SUD - 0.75, SO - 0.055])
  REGLETTES.push([x, ZAL.z0 + 0.75, SO - 0.055])
}
for (let x = ZAL.shalashX0 + 1.2; x < ZAL.x0 - 0.7; x += 2.7)
  REGLETTES.push([x, ZAL.z0 + 0.7, SO - 0.055])

const VENTILATEURS: [number, number][] = []
for (const x of [12.7, 17.7, 23.5, 29.3, 34.8]) for (const z of [-7.0, -13.0, -19.0, -25.0]) VENTILATEURS.push([x, z])
VENTILATEURS.push([-2.0, -25.5], [4.0, -25.5])

const LUSTRES: [number, number][] = [
  [13.0, -16.0],
  [18.4, -16.0],
  [30.0, -16.0],
  [2.0, -26.5],
]

export function PlafonniersZal({ m }: { m: MateriauxZal }) {
  const pieces = useMemo(() => {
    const pc: PieceLibre[] = []
    // Dalles lumineuses encadrées plutôt que rectangles uniformes.
    for (const [x, z] of DALLES) {
      pc.push({ t: [0.88, 0.035, 0.88], p: [x, P - 0.022, z], mat: m.metal, ombre: false })
      pc.push({ t: [0.76, 0.018, 0.76], p: [x, P - 0.048, z], mat: m.neon, ombre: false })
    }
    // Les réglettes suivent le plafond bas en périphérie, pas le plafond haut.
    for (const [x, z, y] of REGLETTES) {
      pc.push({ t: [1.72, 0.035, 0.19], p: [x, y + 0.02, z], mat: m.metal, ombre: false })
      pc.push({ t: [1.58, 0.017, 0.10], p: [x, y - 0.01, z], mat: m.neon, ombre: false })
    }
    for (const [x, z] of LUSTRES) {
      const y = P - 0.9
      pc.push({ geo: new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), p: [x, P - 0.4, z], mat: m.metal, ombre: false })
      pc.push({ geo: new THREE.ConeGeometry(0.42, 0.55, 10, 1, true), p: [x, y + 0.1, z], r: [Math.PI, 0, 0], mat: m.cristal, ombre: false })
      pc.push({ geo: new THREE.SphereGeometry(0.16, 10, 8), p: [x, y - 0.12, z], mat: m.cristal, ombre: false })
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        pc.push({ geo: new THREE.SphereGeometry(0.05, 6, 5), p: [x + Math.cos(a) * 0.45, y + 0.05, z + Math.sin(a) * 0.45], mat: m.cristal, ombre: false })
      }
    }
    for (const [x, z] of VENTILATEURS) pc.push({ geo: new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5), p: [x, P - 0.25, z], mat: m.ventilateur, ombre: false })
    return pc
  }, [m])

  // Pales des ventilateurs : un InstancedMesh tourné à chaque image
  const pales = useRef<THREE.InstancedMesh>(null)
  const geoPale = useMemo(() => {
    const g = new THREE.BoxGeometry(1.3, 0.015, 0.14)
    g.translate(0.65, 0, 0)
    return g
  }, [])
  const angle = useRef(0)
  const tmp = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, dt) => {
    const im = pales.current
    if (!im) return
    if (useGame.getState().zone !== 'grand-zal' && angle.current !== 0) return
    angle.current += dt * 2.2
    let i = 0
    for (const [x, z] of VENTILATEURS)
      for (let k = 0; k < 4; k++) {
        tmp.position.set(x, P - 0.5, z)
        tmp.rotation.set(0, angle.current + (k * Math.PI) / 2, 0)
        tmp.updateMatrix()
        im.setMatrixAt(i++, tmp.matrix)
      }
    im.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <PiecesLibres pieces={pieces} ombres={false} />
      <instancedMesh ref={pales} args={[geoPale, m.ventilateur, VENTILATEURS.length * 4]} frustumCulled={false} />
    </>
  )
}

// Éclairage du Zal. Les néons donnent une lumière uniforme : une lumière
// hémisphérique dont l'intensité monte quand le joueur entre suffit, sans
// lumière ponctuelle (coûteuses pour tous les pixels de la scène).
// Dans le Zal, le soleil est coupé et la carte d'ombres n'est plus
// recalculée : sous terre, ils sont inutiles. Le nombre de lumières ne
// change jamais (pas de recompilation des shaders), seules les intensités.
export function EclairageZal() {
  const hemi = useRef<THREE.HemisphereLight>(null)
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const zone = useGame((s) => s.zone)
  const soleil = useRef<{ l: THREE.DirectionalLight; base: number } | null>(null)
  const dedans = zone === 'grand-zal'
  useEffect(() => {
    if (!soleil.current)
      scene.traverse((o) => {
        if (!soleil.current && (o as THREE.DirectionalLight).isDirectionalLight) {
          const l = o as THREE.DirectionalLight
          soleil.current = { l, base: l.intensity }
        }
      })
    const s = soleil.current
    if (s) s.l.intensity = dedans ? 0 : s.base
    gl.shadowMap.autoUpdate = !dedans
    gl.shadowMap.needsUpdate = true
  }, [dedans, scene, gl])
  useEffect(
    () => () => {
      gl.shadowMap.autoUpdate = true
      if (soleil.current) soleil.current.l.intensity = soleil.current.base
    },
    [gl],
  )
  useFrame((_, dt) => {
    const cible = dedans ? 1.9 : zone === 'escalier-zal' ? 0.5 : 0
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.damp(hemi.current.intensity, cible, 3, dt)
  })
  return <hemisphereLight ref={hemi} args={['#fffaf0', '#c9b8a2', 0]} />
}

// Décor vérifié : banderole (inscription relevée sur photo), horloge
// (Commons 9), panneau EXIT au-dessus de la porte (Commons 9).
export function DecorZal({ m }: { m: MateriauxZal }) {
  const yB = ZAL.soffite + 1.3
  return (
    <>
      <mesh position={[24.0, yB, BORD_NORD + 0.1]} material={m.banderole}>
        <planeGeometry args={[11, 1.05]} />
      </mesh>
      <mesh position={[31.5, ZAL.soffite + 0.5, BORD_NORD + 0.08]} material={m.horloge}>
        <circleGeometry args={[0.32, 24]} />
      </mesh>
      <mesh position={[ENTREE.porteX0 + ENTREE.porteLargeur / 2, S + ENTREE.porteHauteur + 0.17, Z_SUD - 0.04]} rotation={[0, Math.PI, 0]} material={m.exit}>
        <planeGeometry args={[0.42, 0.16]} />
      </mesh>
    </>
  )
}
