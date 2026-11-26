import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AvatarProcedural, type Anim } from './Avatar'
import { useChargement } from '../state/chargement'

// Nouveau personnage principal (26/11/2026), distinct des PNJ : jeune hassid
// à la barbe auburn, lunettes rondes, chapeau, sirtouk, gartel et tsitsit.
// Image de référence, modèle 3D, squelette et animations : Meshy (image
// nano-banana-2, modèle meshy-t2.5 + texture meshy-n1, rig Meshy) ;
// préparation dans Blender (tools/blender/preparer-joueur-meshy.py).
// Visage réaliste : exception décidée par Samuel le 26/11/2026 (CLAUDE.md).
// Clips : Idle_11, Walking, Running, Assis (tirés de la bibliothèque Meshy).

export const URL_JOUEUR_MESHY = '/models/joueur_meshy_v1.glb'

type Clip = 'Idle_11' | 'Walking' | 'Running' | 'Assis'
const FONDU = 0.25
// Vitesse au sol des clips à vitesse de lecture 1 (m/s) — ESTIMÉ, à calibrer
const NATUREL = { Walking: 1.45, Running: 4.0 }

// Les clips Meshy avancent ou reculent un peu le bassin : on le garde sur
// place (le déplacement vient de la physique du joueur)
function surPlace(clips: THREE.AnimationClip[]) {
  return clips.map((c) => {
    const k = c.clone()
    for (const p of k.tracks) {
      if (!/Hips\.position$/.test(p.name)) continue
      const v = p.values
      for (let i = 0; i < v.length; i += 3) {
        v[i] = v[0]
        v[i + 2] = v[2]
      }
    }
    return k
  })
}

const _AXE = new THREE.Vector3()
const _Q = new THREE.Quaternion()
const _Q2 = new THREE.Quaternion()

function Modele({ anim }: { anim: MutableRefObject<Anim> }) {
  const gltf = useGLTF(URL_JOUEUR_MESHY, '/draco/')
  const racine = gltf.scene
  const mixer = useMemo(() => new THREE.AnimationMixer(racine), [racine])
  const clips = useMemo(() => surPlace(gltf.animations), [gltf.animations])
  const actions = useRef<Partial<Record<Clip, THREE.AnimationAction>>>({})
  const courant = useRef<Clip | null>(null)
  const t = useRef(0)
  const dos = useMemo(() => {
    let o: THREE.Object3D | undefined
    racine.traverse((x) => {
      if (x.name === 'Spine01') o = x
    })
    return o
  }, [racine])

  useEffect(() => useChargement.setState({ joueur: true }), [])
  useEffect(() => {
    racine.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        m.frustumCulled = false
      }
    })
    for (const c of clips) actions.current[c.name as Clip] = mixer.clipAction(c)
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(racine)
      actions.current = {}
      courant.current = null
    }
  }, [clips, mixer, racine])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.05)
    t.current += dt
    const { etat, vitesse } = anim.current
    const clip: Clip = etat === 'assis' ? 'Assis' : etat === 'course' ? 'Running' : etat === 'marche' || etat === 'escalier' ? 'Walking' : 'Idle_11'
    const a = actions.current[clip]
    if (!a) return
    if (courant.current !== clip) {
      const prec = courant.current ? actions.current[courant.current] : undefined
      a.reset().play()
      if (prec) prec.crossFadeTo(a, FONDU, false)
      courant.current = clip
    }
    a.timeScale = clip === 'Walking' || clip === 'Running' ? THREE.MathUtils.clamp(vitesse / NATUREL[clip], 0.5, 1.8) : 1
    mixer.update(dt)
    // Prière : balancement du buste d'avant en arrière (shokeln)
    if (etat === 'balancement' && dos) {
      const ang = 0.16 + Math.sin(t.current * 3.0) * 0.16
      _AXE.set(1, 0, 0).transformDirection(racine.matrixWorld)
      _Q.setFromAxisAngle(_AXE, ang)
      dos.getWorldQuaternion(_Q2).premultiply(_Q)
      dos.parent!.getWorldQuaternion(_Q).invert()
      dos.quaternion.copy(_Q.multiply(_Q2))
    }
  })

  return <primitive object={racine} />
}

export function AvatarMeshy({ anim }: { anim: MutableRefObject<Anim> }) {
  return (
    <Suspense fallback={<AvatarProcedural anim={anim} />}>
      <Modele anim={anim} />
    </Suspense>
  )
}
