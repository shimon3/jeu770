import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, type Anim, type EtatAnim } from './Avatar'
import {
  URL_AVATAR_V6,
  VITESSE_NATURELLE,
  SEUIL_VERS_COURSE,
  SEUIL_VERS_MARCHE_RAPIDE,
  plafondMipmapChoisi,
} from '../config/avatar'

// Avatar du joueur : personnage Hasidic_Man_v6 (GLB skinné, 4 animations).
// Origine : entre les pieds. Avant du modèle : +z (comme Avatar.tsx).
// Les états sans animation dans le GLB (assis, balancement) affichent
// l'avatar procédural d'origine.

type Clip = 'Idle_11' | 'Walking' | 'Quick_Walk' | 'Running'

const FONDU = 0.25
// Joueur transmet la vitesse nominale : au-dessus, la course est demandée
// (Maj ou joystick à fond), même si la vitesse réelle est plus basse
const COURSE_DEMANDEE = 3
// La vitesse réelle est lissée : au démarrage, elle n'a pas encore rattrapé la
// vitesse demandée. Pendant ce délai, on se fie à la vitesse demandée, et
// Quick_Walk n'est pas choisi au début d'une course.
const DEMARRAGE = 0.3
// Bloqué contre un obstacle : repos plutôt que marche sur place (hystérésis)
const BLOQUE = 0.3
const DEBLOQUE = 0.5
const ETATS_PROCEDURAUX: EtatAnim[] = ['assis', 'balancement']

// `vReelle` : vitesse horizontale réellement parcourue (collisions comprises).
// Le clip et sa vitesse de lecture la suivent plutôt que la vitesse demandée,
// sinon les pieds glissent quand le joueur est freiné.
// `tMouvement` et `tCourse` : durées depuis lesquelles le déplacement et la
// course sont demandés, en secondes.
function clipPour(
  a: Anim,
  vReelle: number,
  courant: Clip | null,
  tMouvement: number,
  tCourse: number,
): { clip: Clip; echelle: number } {
  if (a.etat === 'saut') {
    // Pas d'animation de saut : on garde l'élan de la course, ralenti
    return { clip: 'Running', echelle: 0.35 }
  }
  if (a.etat === 'repos' || a.vitesse === 0) return { clip: 'Idle_11', echelle: 1 }
  const v = tMouvement < DEMARRAGE ? Math.max(vReelle, a.vitesse) : vReelle
  if (v < (courant === 'Idle_11' ? DEBLOQUE : BLOQUE)) return { clip: 'Idle_11', echelle: 1 }
  if (a.vitesse < COURSE_DEMANDEE) return { clip: 'Walking', echelle: v / VITESSE_NATURELLE.Walking }
  const seuil = courant === 'Running' ? SEUIL_VERS_MARCHE_RAPIDE : SEUIL_VERS_COURSE
  return v >= seuil || tCourse < DEMARRAGE
    ? { clip: 'Running', echelle: v / VITESSE_NATURELLE.Running }
    : { clip: 'Quick_Walk', echelle: v / VITESSE_NATURELLE.Quick_Walk }
}

// Plafond du niveau de mipmap des textures de couleur (paramètre WebGL2
// standard TEXTURE_MAX_LOD, sans toucher aux shaders de Three.js). Three.js
// n'expose pas ce paramètre : on le pose sur la texture WebGL une fois envoyée,
// et on le repose si Three.js en crée une nouvelle (contexte WebGL perdu puis
// restauré, changement de réglages de la texture).
function usePlafondMipmaps(scene: THREE.Object3D, plafond: number | null) {
  const gl = useThree((s) => s.gl)
  const cartes = useMemo(() => {
    const s = new Set<THREE.Texture>()
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if ((o as THREE.Mesh).isMesh && m?.map) s.add(m.map)
    })
    return [...s]
  }, [scene])
  const posees = useRef(new WeakMap<THREE.Texture, WebGLTexture>())

  useFrame(() => {
    if (plafond === null) return
    // Three.js n'utilise que WebGL2
    const c = gl.getContext() as WebGL2RenderingContext
    if (c.isContextLost()) return
    for (const t of cartes) {
      const tex = (gl.properties.get(t) as { __webglTexture?: WebGLTexture }).__webglTexture
      if (!tex || posees.current.get(t) === tex) continue
      // Liaison par l'état de Three.js pour que son cache reste exact
      gl.state.bindTexture(c.TEXTURE_2D, tex)
      c.texParameterf(c.TEXTURE_2D, c.TEXTURE_MAX_LOD, plafond)
      posees.current.set(t, tex)
    }
  })
}

function Modele({ anim, groupe }: { anim: MutableRefObject<Anim>; groupe: MutableRefObject<THREE.Group | null> }) {
  const gltf = useGLTF(URL_AVATAR_V6)
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene])
  const actions = useRef<Partial<Record<Clip, THREE.AnimationAction>>>({})
  const courant = useRef<Clip | null>(null)
  const vReelle = useRef(0)
  const tMouvement = useRef(0)
  const tCourse = useRef(0)
  const posValide = useRef(false)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const posPrec = useMemo(() => new THREE.Vector3(), [])
  const plafond = useMemo(() => plafondMipmapChoisi(), [])
  usePlafondMipmaps(gltf.scene, plafond)

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
    const a = anim.current
    const bouge = a.etat !== 'repos' && a.vitesse > 0
    tMouvement.current = bouge ? tMouvement.current + dt : 0
    tCourse.current = bouge && a.vitesse >= COURSE_DEMANDEE ? tCourse.current + dt : 0
    const { clip, echelle } = clipPour(a, vReelle.current, courant.current, tMouvement.current, tCourse.current)
    const suivante = actions.current[clip]
    if (!suivante) return
    if (courant.current !== clip) {
      const precedente = courant.current ? actions.current[courant.current] : undefined
      suivante.reset().play()
      if (precedente) precedente.crossFadeTo(suivante, FONDU, false)
      courant.current = clip
    }
    suivante.timeScale = THREE.MathUtils.clamp(echelle, 0.35, 2)
    mixer.update(dt)
    // Outil de test en développement : état de l'animation et du rendu
    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__avatarV6 = {
        clip,
        echelle: suivante.timeScale,
        temps: suivante.time,
        vReelle: vReelle.current,
        etat: anim.current.etat,
        vitessesNaturelles: VITESSE_NATURELLE,
        plafondMipmap: plafond,
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
