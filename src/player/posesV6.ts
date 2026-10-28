import * as THREE from 'three'
import type { EtatAnim } from './Avatar'

// Poses du personnage hassidique v6 posées par-dessus Idle_11 (joueur et PNJ).
// Le GLB n'a que Idle_11, Walking, Quick_Walk et Running : « assis » et
// « balancement » sont calculés à chaque image, sans modifier le GLB. Le haut
// du corps garde la respiration d'Idle_11.
// Le mixer ne réécrit pas toutes les valeurs des os à chaque image : retablir()
// doit être appelé avant chaque mise à jour du mixer, sinon la pose
// s'accumulerait.

// Assis sur un banc du Grand Zal (assise à environ 0,48 m) : bassin abaissé,
// cuisses à l'horizontale, tibias verticaux, buste un peu penché, mains
// ramenées vers les cuisses.
export const ASSIS = { baisseBassin: 0.33, cuisse: -88, genou: 88, bras: -30, brasVersCorps: 6, buste: 6 }
// Balancement d'étude ou de prière, comme l'avatar d'origine :
// inclinaison 0,12 ± 0,12 rad, 2,4 rad/s, répartie sur les trois vertèbres.
export const BALANCEMENT = { moyenne: 0.12, amplitude: 0.12, pulsation: 2.4, part: [0.4, 0.3, 0.3] }

type Os = THREE.Bone

// Axe du maillage (x : gauche-droite, z : avant), exprimé dans l'espace local
// du parent de l'os, au repos
function axeRepos(sk: THREE.SkinnedMesh, os: Os, axe: THREE.Vector3): THREE.Vector3 {
  const i = sk.skeleton.bones.indexOf(os.parent as Os)
  if (i < 0) return axe.clone()
  const q = new THREE.Quaternion()
  sk.skeleton.boneInverses[i].decompose(new THREE.Vector3(), q, new THREE.Vector3())
  return axe.clone().applyQuaternion(q).normalize()
}

export type PosesV6 = { appliquer: (etat: EtatAnim, t: number) => void; retablir: () => void }

export function creerPosesV6(sk: THREE.SkinnedMesh): PosesV6 {
  const nom = (b: Os) => b.name.replace(/mixamorig:?/, '')
  const os = new Map(sk.skeleton.bones.map((b) => [nom(b), b]))
  const hanches = os.get('Hips')
  const jambes = (['Left', 'Right'] as const).map((c) => ({ cuisse: os.get(`${c}UpLeg`), tibia: os.get(`${c}Leg`) }))
  const bras = (['Left', 'Right'] as const).map((c) => ({ os: os.get(`${c}ForeArm`), signe: c === 'Left' ? -1 : 1 }))
  const vertebres = ['Spine', 'Spine1', 'Spine2'].map((n) => os.get(n))
  const tous = [hanches, ...jambes.flatMap((j) => [j.cuisse, j.tibia]), ...bras.map((b) => b.os), ...vertebres].filter(Boolean) as Os[]
  const lateral = new Map(tous.map((o) => [o, axeRepos(sk, o, new THREE.Vector3(1, 0, 0))]))
  const avant = new Map(tous.map((o) => [o, axeRepos(sk, o, new THREE.Vector3(0, 0, 1))]))

  const q = new THREE.Quaternion()
  const sauves = new Map<Os, { p: THREE.Vector3; q: THREE.Quaternion }>()
  const sauver = (o: Os) => {
    if (!sauves.has(o)) sauves.set(o, { p: o.position.clone(), q: o.quaternion.clone() })
  }
  const tourner = (o: Os | undefined, axes: Map<Os, THREE.Vector3>, degres: number) => {
    if (!o || !degres) return
    sauver(o)
    q.setFromAxisAngle(axes.get(o)!, THREE.MathUtils.degToRad(degres))
    o.quaternion.premultiply(q)
  }

  return {
    retablir() {
      for (const [o, v] of sauves) {
        o.position.copy(v.p)
        o.quaternion.copy(v.q)
      }
      sauves.clear()
    },
    appliquer(etat, t) {
      if (etat === 'assis') {
        if (hanches) {
          sauver(hanches)
          hanches.position.y -= ASSIS.baisseBassin / (hanches.parent?.scale.y || 1)
        }
        for (const j of jambes) {
          tourner(j.cuisse, lateral, ASSIS.cuisse)
          tourner(j.tibia, lateral, ASSIS.genou)
        }
        for (const b of bras) {
          tourner(b.os, lateral, ASSIS.bras)
          tourner(b.os, avant, b.signe * ASSIS.brasVersCorps)
        }
        tourner(vertebres[0], lateral, ASSIS.buste)
      } else if (etat === 'balancement') {
        const a = BALANCEMENT.moyenne + Math.sin(t * BALANCEMENT.pulsation) * BALANCEMENT.amplitude
        vertebres.forEach((v, i) => tourner(v, lateral, THREE.MathUtils.radToDeg(a * BALANCEMENT.part[i])))
      }
    },
  }
}

// Outil de réglage en développement : modifier ASSIS ou BALANCEMENT à chaud
if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__posesV6 = { ASSIS, BALANCEMENT }
