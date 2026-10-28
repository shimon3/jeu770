import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as clonerAvecSquelette } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { Anim } from '../player/Avatar'
import { usePlafondMipmaps } from '../player/AvatarV6'
import { URL_AVATAR, VITESSE_NATURELLE, plafondMipmapChoisi } from '../config/avatar'

// Corps d'un PNJ avec le personnage hassidique v6 (bras gauche en miroir).
// Le GLB est chargé une fois : chaque PNJ en reçoit un clone qui partage le
// maillage, les matériaux et les textures, avec son propre squelette et son
// propre mixer (animations indépendantes).
// Le GLB n'a que Idle_11, Walking, Quick_Walk et Running. Les états « assis »
// et « balancement » sont des poses posées par-dessus Idle_11 à chaque image,
// sans modifier le GLB : le haut du corps garde la respiration d'Idle_11.

const URL = URL_AVATAR.v6sym
const FONDU = 0.3

// Assis sur un banc du Grand Zal (assise à 0,475 m) : bassin abaissé, cuisses
// à l'horizontale, tibias verticaux, mains vers les genoux, buste un peu penché.
const ASSIS = { baisseBassin: 0.33, cuisse: -88, genou: 88, bras: -38, buste: 6 }
// Balancement d'étude ou de prière, comme l'avatar d'origine :
// inclinaison 0,12 ± 0,12 rad, 2,4 rad/s, répartie sur les trois vertèbres.
const BALANCEMENT = { moyenne: 0.12, amplitude: 0.12, pulsation: 2.4, part: [0.4, 0.3, 0.3] }

type Os = THREE.Bone

function axeLateral(sk: THREE.SkinnedMesh, os: Os): THREE.Vector3 {
  // Axe x du maillage (gauche-droite), exprimé dans l'espace local du parent de l'os, au repos
  const i = sk.skeleton.bones.indexOf(os.parent as Os)
  if (i < 0) return new THREE.Vector3(1, 0, 0)
  const q = new THREE.Quaternion()
  sk.skeleton.boneInverses[i].decompose(new THREE.Vector3(), q, new THREE.Vector3())
  return new THREE.Vector3(1, 0, 0).applyQuaternion(q).normalize()
}

export function PnjV6({ anim }: { anim: MutableRefObject<Anim> }) {
  const gltf = useGLTF(URL)
  const { racine, sk, os } = useMemo(() => {
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
    const nom = (b: Os) => b.name.replace(/mixamorig:?/, '')
    const par = new Map(sk!.skeleton.bones.map((b) => [nom(b), b]))
    return { racine, sk: sk!, os: par }
  }, [gltf.scene])
  usePlafondMipmaps(racine, plafondMipmapChoisi())

  const mixer = useMemo(() => new THREE.AnimationMixer(racine), [racine])
  const actions = useRef<Record<string, THREE.AnimationAction>>({})
  const courant = useRef<string | null>(null)
  const t = useRef(Math.random() * 10)
  const ombreReglee = useRef(false)

  // Os utilisés par les poses et leurs axes latéraux (pris au repos)
  const pose = useMemo(() => {
    const b = (n: string) => os.get(n)
    const hanches = b('Hips')
    const jambes = (['Left', 'Right'] as const).map((c) => ({ cuisse: b(`${c}UpLeg`), tibia: b(`${c}Leg`) }))
    const bras = ['Left', 'Right'].map((c) => b(`${c}ForeArm`))
    const vertebres = ['Spine', 'Spine1', 'Spine2'].map((n) => b(n))
    const tous = [hanches, ...jambes.flatMap((j) => [j.cuisse, j.tibia]), ...bras, ...vertebres].filter(Boolean) as Os[]
    const axe = new Map(tous.map((o) => [o, axeLateral(sk, o)]))
    return { hanches, jambes, bras, vertebres, axe }
  }, [os, sk])

  useEffect(() => {
    // Actions créées ici (et non dans un useMemo) : compatible avec le double
    // montage de StrictMode, qui vide le cache du mixer au démontage
    actions.current = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]))
    return () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(racine)
      actions.current = {}
      courant.current = null
    }
  }, [gltf.animations, mixer, racine])

  const q = useMemo(() => new THREE.Quaternion(), [])
  // Les poses s'ajoutent à l'animation. Le mixer ne réécrit pas toutes les
  // valeurs des os à chaque image : on rétablit donc l'état d'avant la pose
  // avant chaque mise à jour, sinon la pose s'accumulerait.
  const sauves = useRef(new Map<Os, { p: THREE.Vector3; q: THREE.Quaternion }>())
  const sauver = (o: Os) => {
    if (!sauves.current.has(o)) sauves.current.set(o, { p: o.position.clone(), q: o.quaternion.clone() })
  }
  const retablir = () => {
    for (const [o, v] of sauves.current) {
      o.position.copy(v.p)
      o.quaternion.copy(v.q)
    }
    sauves.current.clear()
  }
  const tourner = (o: Os | undefined, degres: number) => {
    if (!o) return
    sauver(o)
    q.setFromAxisAngle(pose.axe.get(o)!, THREE.MathUtils.degToRad(degres))
    o.quaternion.premultiply(q)
  }
  useEffect(() => () => retablir(), [])

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
    retablir()
    mixer.update(dt)

    if (etat === 'assis') {
      const h = pose.hanches
      if (h) {
        sauver(h)
        h.position.y -= ASSIS.baisseBassin / (h.parent?.scale.y || 1)
      }
      for (const j of pose.jambes) {
        tourner(j.cuisse, ASSIS.cuisse)
        tourner(j.tibia, ASSIS.genou)
      }
      for (const b of pose.bras) tourner(b, ASSIS.bras)
      tourner(pose.vertebres[0], ASSIS.buste)
    } else if (etat === 'balancement') {
      const a = BALANCEMENT.moyenne + Math.sin(t.current * BALANCEMENT.pulsation) * BALANCEMENT.amplitude
      pose.vertebres.forEach((v, i) => tourner(v, THREE.MathUtils.radToDeg(a * BALANCEMENT.part[i])))
    }
  })

  return <primitive object={racine} />
}

useGLTF.preload(URL)
