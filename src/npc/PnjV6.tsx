import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as clonerAvecSquelette } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Anim } from '../player/Avatar'
import { fermerBras, preparerBras, rouvrirBras, usePlafondMipmaps } from '../player/AvatarV6'
import { URL_AVATAR, VITESSE_NATURELLE, fermetureBrasChoisie, plafondMipmapChoisi } from '../config/avatar'
import { creerPosesV6 } from '../player/posesV6'
import { adoucirAnimationsBras } from '../player/animationsV6'

// Corps d'un PNJ avec le personnage hassidique v6 (bras gauche en miroir).
// Le GLB est chargé une fois : chaque PNJ en reçoit un clone qui partage le
// maillage, les matériaux et les textures, avec son propre squelette et son
// propre mixer (animations indépendantes).
// Les états « assis » et « balancement » sont des poses posées par-dessus
// Idle_11 (player/posesV6.ts), sans modifier le GLB.

const URL = URL_AVATAR.v6sym
const FONDU = 0.3

type DiagnosticPnj = { etat: Anim['etat']; vitesse: number; clip: string | null; brasFermes: number; pistesBrasAdoucies: number }

function diagnostics(): Map<string, DiagnosticPnj> | null {
  if (!import.meta.env.DEV) return null
  const w = window as unknown as { __pnjV6?: Map<string, DiagnosticPnj> }
  return (w.__pnjV6 ??= new Map())
}

export function PnjV6({ id, anim }: { id: string; anim: MutableRefObject<Anim> }) {
  const gltf = useGLTF(URL)
  const { racine, sk } = useMemo(() => {
    const racine = clonerAvecSquelette(gltf.scene)
    let sk: THREE.SkinnedMesh | undefined
    racine.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
      if (!sk && (o as THREE.SkinnedMesh).isSkinnedMesh) sk = o as THREE.SkinnedMesh
    })
    return { racine, sk: sk! }
  }, [gltf.scene])
  usePlafondMipmaps(racine, plafondMipmapChoisi())

  const mixer = useMemo(() => new THREE.AnimationMixer(racine), [racine])
  const animations = useMemo(() => adoucirAnimationsBras(gltf.animations), [gltf.animations])
  const actions = useRef<Record<string, THREE.AnimationAction>>({})
  const courant = useRef<string | null>(null)
  const t = useRef(Math.random() * 10)
  const ombreReglee = useRef(false)

  const poses = useMemo(() => creerPosesV6(sk), [sk])
  const bras = useMemo(() => preparerBras(racine, fermetureBrasChoisie('v6sym')), [racine])

  useEffect(() => {
    // Actions créées ici (et non dans un useMemo) : compatible avec le double
    // montage de StrictMode, qui vide le cache du mixer au démontage
    actions.current = Object.fromEntries(animations.clips.map((c) => [c.name, mixer.clipAction(c)]))
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(racine)
      actions.current = {}
      courant.current = null
    }
  }, [animations, mixer, racine])

  useEffect(() => {
    const d = diagnostics()
    d?.set(id, { etat: anim.current.etat, vitesse: anim.current.vitesse, clip: null, brasFermes: bras.length, pistesBrasAdoucies: animations.pistesBrasAdoucies })
    return () => void d?.delete(id)
  }, [anim, animations.pistesBrasAdoucies, bras.length, id])

  useEffect(() => () => poses.retablir(), [poses])
  useEffect(() => () => rouvrirBras(bras), [bras])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.05)
    t.current += dt
    if (!ombreReglee.current) {
      // Sous terre (Grand Zal), l'ombre solaire est inutile (comme l'avatar d'origine)
      const p = racine.getWorldPosition(new THREE.Vector3())
      if (p.y < -1) racine.traverse((o) => void (o.castShadow = false))
      ombreReglee.current = true
    }
    const { etat, vitesse } = anim.current
    const clip = etat === 'marche' ? 'Walking' : 'Idle_11'
    const suivante = actions.current[clip]
    if (suivante && courant.current !== clip) {
      const precedente = courant.current ? actions.current[courant.current] : undefined
      suivante.reset().play()
      if (precedente) precedente.crossFadeTo(suivante, FONDU, false)
      // Premier clip : départ à un instant au hasard, pour que les PNJ ne
      // respirent pas tous en même temps (chaque PNJ a son propre mixer)
      else suivante.time = Math.random() * suivante.getClip().duration
      courant.current = clip
    }
    if (suivante) suivante.timeScale = clip === 'Walking' ? THREE.MathUtils.clamp(vitesse / VITESSE_NATURELLE.Walking, 0.35, 2) : 1
    poses.retablir()
    rouvrirBras(bras)
    mixer.update(dt)
    fermerBras(bras)
    poses.appliquer(etat, t.current)
    diagnostics()?.set(id, { etat, vitesse, clip: courant.current, brasFermes: bras.length, pistesBrasAdoucies: animations.pistesBrasAdoucies })
  })

  return <primitive object={racine} />
}

useGLTF.preload(URL)
