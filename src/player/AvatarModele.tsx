import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Anim } from './Avatar'

// Modèle de TOUS les hassids du jeu (joueur et PNJ) : modèle Sculptly fourni
// par Samuel (octobre 2026), ANONYMISÉ avant publication (visage uni sans
// traits, voir tools/anonymiser-glb.py) puis allégé (≈ 13 000 triangles).
//
// Le modèle n'a pas de squelette : les mouvements sont procéduraux.
// - Deux « morph targets » calculés au chargement : « pas » (jambes en
//   ciseaux autour des hanches) et « assis » (cuisses à l'horizontale,
//   tibias verticaux, pieds au sol).
// - Balancement, respiration, petit roulis de marche : rotations du groupe.
// Origine : entre les pieds. Avant : +z (comme l'avatar procédural).

export const URL_HASSID = '/assets/models/hassid.glb'

// Repères du modèle source (unités du fichier) — ESTIMÉS sur la silhouette
const PIEDS = -0.495
const HAUT = 0.493
const Y_HANCHE = -0.02
const Y_GENOU = -0.235
const HAUTEUR = 1.8 // m dans le jeu
const ECHELLE = HAUTEUR / (HAUT - PIEDS)
const ANGLE_PAS = 0.32 // rad, amplitude d'une jambe à pleine influence

const lisse = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Ajoute les deux morph targets (relatifs) à une géométrie, une seule fois
function preparer(g: THREE.BufferGeometry) {
  if (g.userData.hassidPrepare) return
  g.userData.hassidPrepare = true
  const pos = g.attributes.position as THREE.BufferAttribute
  const nor = g.attributes.normal as THREE.BufferAttribute | undefined
  const n = pos.count
  const dPas = new Float32Array(n * 3)
  const dAssis = new Float32Array(n * 3)
  const nAssis = new Float32Array(n * 3)
  const cuisse = Y_HANCHE - Y_GENOU
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    // Poids « sous la hanche » (transition douce sur ±3 cm)
    const wH = 1 - lisse(Y_HANCHE - 0.03, Y_HANCHE + 0.03, y)
    const ry = y - Y_HANCHE
    // --- Pas : rotation autour de l'axe des hanches ; jambe gauche (x > 0)
    // vers l'avant, droite vers l'arrière. Poids transversal doux pour ne pas
    // déchirer le pan du manteau au centre.
    if (wH > 0) {
      const a = ANGLE_PAS * Math.max(-1, Math.min(1, x / 0.05)) * wH
      dPas[i * 3 + 1] = Y_HANCHE + ry * Math.cos(a) + z * Math.sin(a) - y
      dPas[i * 3 + 2] = z * Math.cos(a) - ry * Math.sin(a) - z
    }
    // --- Assis : le haut du corps descend de la longueur de cuisse ; la cuisse
    // pivote de 90° (le bas vers l'avant) ; le tibia reste vertical, pieds au sol.
    const wG = 1 - lisse(Y_GENOU - 0.03, Y_GENOU + 0.03, y) // 1 sous le genou
    const cy = Y_HANCHE - cuisse + z // cuisse : (ry, z) -> (z, -ry)
    const cz = -ry
    const ty = y // tibia
    const tz = z + cuisse
    const ny = (cy * (1 - wG) + ty * wG) * wH + (y - cuisse) * (1 - wH)
    const nz = (cz * (1 - wG) + tz * wG) * wH + z * (1 - wH)
    dAssis[i * 3 + 1] = ny - y
    dAssis[i * 3 + 2] = nz - z
    if (nor) {
      const ny0 = nor.getY(i)
      const nz0 = nor.getZ(i)
      const k = wH * (1 - wG)
      // normale de cuisse tournée comme la géométrie : (ny, nz) -> (nz, -ny)
      nAssis[i * 3 + 1] = (nz0 - ny0) * k
      nAssis[i * 3 + 2] = (-ny0 - nz0) * k
    }
  }
  g.morphAttributes.position = [new THREE.BufferAttribute(dPas, 3), new THREE.BufferAttribute(dAssis, 3)]
  if (nor) g.morphAttributes.normal = [new THREE.BufferAttribute(new Float32Array(n * 3), 3), new THREE.BufferAttribute(nAssis, 3)]
  g.morphTargetsRelative = true
  g.computeBoundingSphere()
  if (g.boundingSphere) g.boundingSphere.radius *= 1.5 // marge pour les poses
}

export function AvatarModele({ anim, visible = true }: { anim: MutableRefObject<Anim>; visible?: boolean }) {
  const { scene } = useGLTF(URL_HASSID)
  const racine = useRef<THREE.Group>(null)
  const pivot = useRef<THREE.Group>(null)
  const phase = useRef(0)
  const t = useRef(Math.random() * 10)
  const influences = useRef({ pas: 0, assis: 0 })

  const { objet, meshes } = useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        preparer(m.geometry)
        m.updateMorphTargets()
      }
    })
    const c = scene.clone(true)
    const ms: THREE.Mesh[] = []
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        m.morphTargetInfluences = [0, 0]
        ms.push(m)
      }
    })
    return { objet: c, meshes: ms }
  }, [scene])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.05)
    const { etat, vitesse } = anim.current
    t.current += dt
    const marche = etat === 'marche' || etat === 'course' || etat === 'escalier'
    const cadence = etat === 'course' ? 9 : etat === 'escalier' ? 6 : 6.5
    if (marche) phase.current += dt * cadence * Math.max(0.6, vitesse / 2.2)
    const amp = etat === 'course' ? 1 : etat === 'escalier' ? 0.9 : etat === 'marche' ? 0.75 : 0
    const k = 1 - Math.exp(-dt * 12)
    const cible = { pas: Math.sin(phase.current) * amp, assis: etat === 'assis' ? 1 : 0 }
    const inf = influences.current
    inf.pas += (cible.pas - inf.pas) * (marche ? 1 : k)
    inf.assis += (cible.assis - inf.assis) * k
    for (const m of meshes) {
      const mi = m.morphTargetInfluences!
      mi[0] = inf.pas
      mi[1] = inf.assis
    }
    // Corps : rebond de marche, roulis, inclinaison, balancement, respiration
    let basY = 0
    let penche = 0
    let roulis = 0
    if (marche) {
      basY = Math.abs(Math.cos(phase.current)) * (etat === 'course' ? 0.05 : 0.025)
      roulis = Math.sin(phase.current) * 0.035
      penche = etat === 'course' ? 0.12 : etat === 'escalier' ? 0.08 : 0.03
    } else if (etat === 'balancement') {
      penche = 0.1 + Math.sin(t.current * 2.4) * 0.12
    } else if (etat === 'repos') {
      basY = Math.sin(t.current * 1.6) * 0.004
    } else if (etat === 'assis') {
      penche = 0.04
    }
    if (racine.current) racine.current.position.y += (basY - racine.current.position.y) * k
    if (pivot.current) {
      pivot.current.rotation.x += (penche - pivot.current.rotation.x) * k
      pivot.current.rotation.z += (roulis - pivot.current.rotation.z) * k
    }
  })

  // Le corps s'incline autour des hanches (debout) ; assis, les hanches sont
  // plus bas mais l'écart reste faible pour une inclinaison de quelques degrés
  const yPivot = (Y_HANCHE - PIEDS) * ECHELLE
  return (
    <group visible={visible}>
      <group ref={racine}>
        <group position={[0, yPivot, 0]}>
          <group ref={pivot}>
            <primitive object={objet} scale={ECHELLE} position={[0, -yPivot - PIEDS * ECHELLE, 0]} />
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(URL_HASSID)
