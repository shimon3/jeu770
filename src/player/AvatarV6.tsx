import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Avatar, type Anim, type EtatAnim } from './Avatar'
import {
  URL_AVATAR,
  type ChoixGlb,
  VITESSE_NATURELLE,
  SEUIL_VERS_COURSE,
  SEUIL_VERS_MARCHE_RAPIDE,
  plafondMipmapChoisi,
  fermetureBrasChoisie,
  avatarChoisi,
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
export function usePlafondMipmaps(scene: THREE.Object3D, plafond: number | null) {
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

// Fermeture des bras : rotation de chaque os ForeArm (enfant direct de Spine2,
// sans os d'épaule) autour de l'axe avant du torse, en pivotant sur une épaule
// virtuelle, appliquée après le mixer. Le mixer ne réécrit pas la position de
// ces os à chaque image : on rétablit donc l'état d'avant la fermeture avant
// chaque mise à jour du mixer, sinon le décalage s'accumulerait.
const EPAULE_VIRTUELLE = { x: 0.215, y: 1.3, z: -0.09 } // espace du maillage au repos, en m

type BrasPrepare = {
  os: THREE.Bone
  pivot: THREE.Vector3
  rotation: THREE.Quaternion
  position0: THREE.Vector3
  quaternion0: THREE.Quaternion
  ferme: boolean
}

function preparerBras(scene: THREE.Object3D, fermeture: { gauche: number; droite: number } | null): BrasPrepare[] {
  if (!fermeture) return []
  let sk: THREE.SkinnedMesh | undefined
  scene.traverse((o) => {
    if (!sk && (o as THREE.SkinnedMesh).isSkinnedMesh) sk = o as THREE.SkinnedMesh
  })
  if (!sk) return []
  const { bones, boneInverses } = sk.skeleton
  const nom = (b: THREE.Bone) => b.name.replace(/mixamorig:?/, '')
  const i2 = bones.findIndex((b) => nom(b) === 'Spine2')
  if (i2 < 0) return []
  // Repos : espace du maillage → espace local de Spine2 (avec son échelle)
  const versSpine2 = boneInverses[i2]
  const q = new THREE.Quaternion()
  versSpine2.decompose(new THREE.Vector3(), q, new THREE.Vector3())
  const axe = new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize()
  const res: BrasPrepare[] = []
  for (const [cote, signe, angle] of [['Left', -1, fermeture.gauche], ['Right', 1, fermeture.droite]] as const) {
    const os = bones.find((b) => nom(b) === `${cote}ForeArm`)
    if (!os || os.parent !== bones[i2] || !angle) continue
    const pivot = new THREE.Vector3(signe * -EPAULE_VIRTUELLE.x, EPAULE_VIRTUELLE.y, EPAULE_VIRTUELLE.z).applyMatrix4(versSpine2)
    res.push({
      os,
      pivot,
      rotation: new THREE.Quaternion().setFromAxisAngle(axe, THREE.MathUtils.degToRad(signe * angle)),
      position0: new THREE.Vector3(),
      quaternion0: new THREE.Quaternion(),
      ferme: false,
    })
  }
  return res
}

function fermerBras(bras: BrasPrepare[]) {
  for (const b of bras) {
    b.position0.copy(b.os.position)
    b.quaternion0.copy(b.os.quaternion)
    b.os.position.sub(b.pivot).applyQuaternion(b.rotation).add(b.pivot)
    b.os.quaternion.premultiply(b.rotation)
    b.ferme = true
  }
}

function rouvrirBras(bras: BrasPrepare[]) {
  for (const b of bras) {
    if (!b.ferme) continue
    b.os.position.copy(b.position0)
    b.os.quaternion.copy(b.quaternion0)
    b.ferme = false
  }
}

function Modele({
  anim,
  groupe,
  choix,
}: {
  anim: MutableRefObject<Anim>
  groupe: MutableRefObject<THREE.Group | null>
  choix: ChoixGlb
}) {
  const gltf = useGLTF(URL_AVATAR[choix])
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
  const bras = useMemo(() => preparerBras(gltf.scene, fermetureBrasChoisie(choix)), [gltf.scene, choix])
  // La scène du GLB est mise en cache : la rendre telle qu'on l'a trouvée
  useEffect(() => () => rouvrirBras(bras), [bras])

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
    rouvrirBras(bras)
    mixer.update(dt)
    fermerBras(bras)
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
        brasFermes: bras.length,
        modele: choix,
      }
    }
  })

  return (
    <group ref={groupe}>
      <primitive object={gltf.scene} />
    </group>
  )
}

export function AvatarV6({ anim, choix = 'v6' }: { anim: MutableRefObject<Anim>; choix?: ChoixGlb }) {
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
        <Modele anim={anim} groupe={v6} choix={choix} />
      </Suspense>
    </>
  )
}

// Préchargement du seul GLB choisi
const choixInitial = avatarChoisi()
if (choixInitial !== 'ancien') useGLTF.preload(URL_AVATAR[choixInitial])
