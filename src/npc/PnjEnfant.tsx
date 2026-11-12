import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { DIST_OMBRE_REELLE } from './OmbreSol'
import { clone as clonerAvecSquelette } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Anim } from '../player/Avatar'
import { VITESSE_NATURELLE } from '../config/avatar'

// Corps léger d'un PNJ enfant (garçon à la kippa), fille ou femme.
// Chaque modèle est un seul GLB (< 1 Mo, maillage compressé Draco, textures
// 1K) chargé à la demande, sans préchargement : il ne retarde pas le
// lancement du jeu. Tous les clones partagent maillage, matériaux et textures,
// chacun avec son squelette et son mixer.
// Clips : Idle_11 (repos) et Walking (marche), mêmes noms que les adultes.
// Les états « assis » et « balancement » retombent sur Idle_11.

export type ModeleLeger = 'enfant' | 'fille' | 'femme'

const URLS: Record<ModeleLeger, string> = {
  enfant: '/models/enfant_habad_v1.glb',
  fille: '/models/fille_habad_v1.glb',
  femme: '/models/femme_habad_v1.glb',
}

// Décodeur Draco servi par le jeu (pas de CDN)
const DECODEUR_DRACO = '/draco/'
const FONDU = 0.3
const CADENCE: Record<ModeleLeger, number> = { enfant: 1.3, fille: 1.25, femme: 1.0 }
const DIST_OMBRE = DIST_OMBRE_REELLE
const DIST_MOYEN = 15
const DIST_LOIN = 30
const POS = new THREE.Vector3()

// Gabarit physique : capsule (demi-hauteur, rayon) centrée à centreY
export function gabaritPnj(modele: ModeleLeger | 'adulte') {
  if (modele === 'enfant' || modele === 'fille') return { demiHauteur: 0.38, rayon: 0.22, centreY: 0.6, hauteurBulle: 0.95 }
  return { demiHauteur: 0.55, rayon: 0.3, centreY: 0.85, hauteurBulle: 1.2 }
}

type DiagnosticLeger = { modele: ModeleLeger; etat: Anim['etat']; clip: string | null }

function diagnostics(): Map<string, DiagnosticLeger> | null {
  if (!import.meta.env.DEV) return null
  const w = window as unknown as { __pnjLeger?: Map<string, DiagnosticLeger> }
  return (w.__pnjLeger ??= new Map())
}

export function PnjEnfant({ id, anim, modele }: { id: string; anim: MutableRefObject<Anim>; modele: ModeleLeger }) {
  const gltf = useGLTF(URLS[modele], DECODEUR_DRACO)
  const racine = useMemo(() => {
    const r = clonerAvecSquelette(gltf.scene)
    r.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return r
  }, [gltf.scene])

  const mixer = useMemo(() => new THREE.AnimationMixer(racine), [racine])
  const actions = useRef<Record<string, THREE.AnimationAction>>({})
  const courant = useRef<string | null>(null)
  const ombreReglee = useRef(false)
  const sousTerre = useRef(false)
  const ombreActive = useRef(true)
  const attente = useRef(0)

  useEffect(() => {
    actions.current = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]))
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(racine)
      actions.current = {}
      courant.current = null
    }
  }, [gltf.animations, mixer, racine])

  useEffect(() => {
    const d = diagnostics()
    d?.set(id, { modele, etat: anim.current.etat, clip: null })
    return () => void d?.delete(id)
  }, [anim, id, modele])

  useFrame(({ camera }, dtBrut) => {
    racine.getWorldPosition(POS)
    if (!ombreReglee.current) {
      sousTerre.current = POS.y < -1
      ombreReglee.current = true
    }
    // Niveau de détail : loin de la caméra, pas d'ombre et animation moins
    // fréquente (le corps reste visible et bouge, mais coûte moins)
    const d = POS.distanceTo(camera.position)
    const ombre = !sousTerre.current && d < DIST_OMBRE
    if (ombre !== ombreActive.current) {
      racine.traverse((o) => void (o.castShadow = ombre))
      ombreActive.current = ombre
    }
    attente.current += dtBrut
    const pas = d > DIST_LOIN ? 1 / 10 : d > DIST_MOYEN ? 1 / 20 : 0
    if (attente.current < pas) return
    const dt = Math.min(attente.current, 0.12)
    attente.current = 0
    const { etat, vitesse } = anim.current
    const clip = etat === 'marche' ? 'Walking' : 'Idle_11'
    const suivante = actions.current[clip]
    if (suivante && courant.current !== clip) {
      const precedente = courant.current ? actions.current[courant.current] : undefined
      suivante.reset().play()
      if (precedente) precedente.crossFadeTo(suivante, FONDU, false)
      else suivante.time = Math.random() * suivante.getClip().duration
      courant.current = clip
    }
    // Pas plus courts que ceux d'un adulte : cadence plus rapide à vitesse égale
    if (suivante) suivante.timeScale = clip === 'Walking' ? THREE.MathUtils.clamp((vitesse / VITESSE_NATURELLE.Walking) * CADENCE[modele], 0.35, 2.2) : 1
    mixer.update(dt)
    diagnostics()?.set(id, { modele, etat, clip: courant.current })
  })

  return <primitive object={racine} />
}

// ?enfants=0 : sans les nouveaux PNJ (mesure des images par seconde)
export function pnjLegersActifs() {
  if (typeof window === 'undefined') return true
  return new URLSearchParams(window.location.search).get('enfants') !== '0'
}
