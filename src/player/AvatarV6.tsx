import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, type Anim, type EtatAnim } from './Avatar'
import { URL_AVATAR_V6, VITESSE_NATURELLE } from '../config/avatar'

// Avatar du joueur : personnage Hasidic_Man_v6 (GLB skinné, 4 animations).
// Origine : entre les pieds. Avant du modèle : +z (comme Avatar.tsx).
// Les états sans animation dans le GLB (assis, balancement) affichent
// l'avatar procédural d'origine.

type Clip = 'Idle_11' | 'Walking' | 'Quick_Walk' | 'Running'

const FONDU = 0.25
// En dessous de cette vitesse (joystick peu incliné), marche lente
const SEUIL_MARCHE_LENTE = 1.8
const ETATS_PROCEDURAUX: EtatAnim[] = ['assis', 'balancement']

// `vReelle` : vitesse horizontale réellement parcourue (collisions et
// accélération comprises). La vitesse de lecture suit celle-ci plutôt que la
// vitesse demandée, sinon les pieds glissent quand le joueur est freiné.
function clipPour(a: Anim, vReelle: number): { clip: Clip; echelle: number } {
  const v = vReelle > 0.2 ? vReelle : a.vitesse
  switch (a.etat) {
    case 'course':
      return { clip: 'Running', echelle: v / VITESSE_NATURELLE.Running }
    case 'marche':
    case 'escalier':
      return a.vitesse < SEUIL_MARCHE_LENTE
        ? { clip: 'Walking', echelle: v / VITESSE_NATURELLE.Walking }
        : { clip: 'Quick_Walk', echelle: v / VITESSE_NATURELLE.Quick_Walk }
    case 'saut':
      // Pas d'animation de saut : on garde l'élan de la course, ralenti
      return { clip: 'Running', echelle: 0.35 }
    default:
      return { clip: 'Idle_11', echelle: 1 }
  }
}

function Modele({ anim, groupe }: { anim: MutableRefObject<Anim>; groupe: MutableRefObject<THREE.Group | null> }) {
  const gltf = useGLTF(URL_AVATAR_V6)
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene])
  const actions = useRef<Partial<Record<Clip, THREE.AnimationAction>>>({})
  const courant = useRef<Clip | null>(null)
  const vReelle = useRef(0)
  const posValide = useRef(false)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const posPrec = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
        // Les maillages skinnés sortent de leur boîte d'origine en animation
        m.frustumCulled = false
      }
    })
    for (const c of gltf.animations) actions.current[c.name as Clip] = mixer.clipAction(c)
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(gltf.scene)
      actions.current = {}
      courant.current = null
    }
  }, [gltf, mixer])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.05)
    const g = groupe.current
    if (g && dtBrut > 0) {
      g.getWorldPosition(pos)
      if (posValide.current) {
        const v = Math.hypot(pos.x - posPrec.x, pos.z - posPrec.z) / dtBrut
        // Une téléportation ne doit pas compter comme une vitesse
        if (v < 15) vReelle.current = THREE.MathUtils.damp(vReelle.current, v, 10, dt)
      }
      posPrec.copy(pos)
      posValide.current = true
    }
    const { clip, echelle } = clipPour(anim.current, vReelle.current)
    const suivante = actions.current[clip]
    if (!suivante) return
    if (courant.current !== clip) {
      const precedente = courant.current ? actions.current[courant.current] : undefined
      suivante.reset().play()
      if (precedente) precedente.crossFadeTo(suivante, FONDU, false)
      courant.current = clip
    }
    suivante.timeScale = THREE.MathUtils.clamp(echelle, 0.35, 1.8)
    mixer.update(dt)
    // Outil de test en développement : état de l'animation
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__avatarV6 = {
        clip,
        echelle: suivante.timeScale,
        temps: suivante.time,
        vReelle: vReelle.current,
        etat: anim.current.etat,
        vitessesNaturelles: VITESSE_NATURELLE,
      }
    }
  })

  return (
    <group ref={groupe}>
      <primitive object={gltf.scene} />
    </group>
  )
}

export function AvatarV6({ anim }: { anim: MutableRefObject<Anim> }) {
  const v6 = useRef<THREE.Group | null>(null)
  const ancien = useRef<THREE.Group>(null)

  useFrame(() => {
    const procedural = ETATS_PROCEDURAUX.includes(anim.current.etat)
    if (v6.current) v6.current.visible = !procedural
    if (ancien.current) ancien.current.visible = procedural || !v6.current
  })

  return (
    <>
      <group ref={ancien}>
        <Avatar anim={anim} />
      </group>
      <Suspense fallback={null}>
        <Modele anim={anim} groupe={v6} />
      </Suspense>
    </>
  )
}

useGLTF.preload(URL_AVATAR_V6)
