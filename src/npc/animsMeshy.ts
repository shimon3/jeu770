import * as THREE from 'three'
import type { Geste } from '../player/Avatar'

// Gestes partagés par les PNJ Meshy (26/11/2026) : un seul fichier de clips
// (anims_meshy_v1.glb, squelette Meshy sans maillage, préparé dans Blender
// par tools/blender/preparer-joueur-meshy.py) rejoué sur l'enfant, le
// policier, le touriste, le bo'hour…
// Les squelettes ne sont pas tous orientés pareil au repos (l'enfant a été
// riggé en A, les clips en T) : on ne recopie pas les rotations des os, on
// fait pointer chaque os de la cible dans la même direction que l'os du clip
// (repère du personnage). Les proportions n'importent donc pas.

export const URL_GESTES = '/models/anims_meshy_v1.glb'

export const CLIP_GESTE: Record<Geste, string> = {
  parle: 'Parle',
  ecoute: 'Ecoute',
  joie: 'Joie',
  tir: 'Tir',
  salue: 'Salue',
  telephone: 'Telephone',
  discute: 'Discute',
}

// Os → os enfant qui donne sa direction (du haut vers le bas de la chaîne)
const CHAINE: [string, string][] = [
  ['Spine02', 'Spine01'],
  ['Spine01', 'Spine'],
  ['Spine', 'neck'],
  ['neck', 'Head'],
  ['Head', 'head_end'],
  ['LeftShoulder', 'LeftArm'],
  ['LeftArm', 'LeftForeArm'],
  ['LeftForeArm', 'LeftHand'],
  ['RightShoulder', 'RightArm'],
  ['RightArm', 'RightForeArm'],
  ['RightForeArm', 'RightHand'],
  ['LeftUpLeg', 'LeftLeg'],
  ['LeftLeg', 'LeftFoot'],
  ['LeftFoot', 'LeftToeBase'],
  ['RightUpLeg', 'RightLeg'],
  ['RightLeg', 'RightFoot'],
  ['RightFoot', 'RightToeBase'],
]

const nomOs = (n: string) => n.replace(/mixamorig:?/, '')

function osPar(racine: THREE.Object3D) {
  const m = new Map<string, THREE.Object3D>()
  racine.traverse((o) => {
    if ((o as THREE.Bone).isBone || o.name) m.set(nomOs(o.name), o)
  })
  return m
}

type ClipSource = { duree: number; pistes: { os: THREE.Object3D; interp: THREE.Interpolant }[] }
type Source = { racine: THREE.Object3D; os: Map<string, THREE.Object3D>; clips: Map<string, ClipSource>; hanchesRepos: THREE.Quaternion }

type GLTF = { scene: THREE.Object3D; animations: THREE.AnimationClip[] }

const sources = new WeakMap<object, Source>()

// Squelette source unique (hors scène), posé à la demande pour chaque PNJ
export function sourceGestes(gltf: GLTF): Source {
  let s = sources.get(gltf)
  if (s) return s
  const racine = gltf.scene
  racine.updateMatrixWorld(true)
  const os = osPar(racine)
  const clips = new Map<string, ClipSource>()
  for (const c of gltf.animations) {
    const pistes: ClipSource['pistes'] = []
    for (const p of c.tracks) {
      if (!(p instanceof THREE.QuaternionKeyframeTrack)) continue
      const o = os.get(nomOs(p.name.split('.')[0]))
      if (o) pistes.push({ os: o, interp: (p as unknown as { createInterpolant: () => THREE.Interpolant }).createInterpolant() })
    }
    clips.set(c.name, { duree: c.duration, pistes })
  }
  const hanchesRepos = new THREE.Quaternion()
  os.get('Hips')?.getWorldQuaternion(hanchesRepos)
  s = { racine, os, clips, hanchesRepos }
  sources.set(gltf, s)
  return s
}

export function dureeClip(src: Source, clip: string) {
  return src.clips.get(clip)?.duree ?? 1
}

// Pose le squelette source à l'instant t du clip (en boucle ou bloqué à la fin)
function poser(src: Source, clip: string, t: number, boucle: boolean) {
  const c = src.clips.get(clip)
  if (!c) return false
  const tt = boucle ? ((t % c.duree) + c.duree) % c.duree : Math.min(t, c.duree - 1e-3)
  for (const p of c.pistes) p.os.quaternion.fromArray(p.interp.evaluate(tt) as unknown as number[])
  src.racine.updateMatrixWorld(true)
  return true
}

const _A = new THREE.Vector3()
const _B = new THREE.Vector3()
const _D = new THREE.Vector3()
const _V = new THREE.Vector3()
const _Q = new THREE.Quaternion()
const _Q2 = new THREE.Quaternion()
const _R = new THREE.Quaternion()
const _I = new THREE.Quaternion()

export type Recibleur = { appliquer: (src: Source, clip: string, t: number, poids: number, boucle?: boolean) => void }

export function creerRecibleur(racine: THREE.Object3D): Recibleur {
  const os = osPar(racine)
  const hanches = os.get('Hips')
  const paires = CHAINE.map(([a, b]) => [os.get(a), os.get(b), a, b] as const).filter(([a, b]) => a && b) as unknown as [THREE.Object3D, THREE.Object3D, string, string][]
  return {
    appliquer(src, clip, t, poids, boucle = true) {
      if (poids <= 0.001 || !poser(src, clip, t, boucle)) return
      racine.updateMatrixWorld(true)
      racine.getWorldQuaternion(_R)
      // Bassin : la rotation du clip (par rapport à son repos) s'ajoute
      const hs = src.os.get('Hips')
      if (hanches && hs) {
        hs.getWorldQuaternion(_Q).multiply(_Q2.copy(src.hanchesRepos).invert())
        _Q.premultiply(_Q2.copy(_R)).multiply(_Q2.copy(_R).invert())
        _Q.slerp(_I, 1 - poids)
        hanches.getWorldQuaternion(_Q2).premultiply(_Q)
        hanches.parent!.getWorldQuaternion(_Q).invert()
        hanches.quaternion.copy(_Q.multiply(_Q2))
        hanches.updateMatrixWorld(true)
      }
      for (const [a, b, na, nb] of paires) {
        const sa = src.os.get(na)
        const sb = src.os.get(nb)
        if (!sa || !sb) continue
        // Direction voulue (clip, repère du personnage → monde de la cible)
        sb.getWorldPosition(_D).sub(sa.getWorldPosition(_V)).applyQuaternion(_R).normalize()
        // Direction actuelle de l'os de la cible
        b.getWorldPosition(_B).sub(a.getWorldPosition(_A)).normalize()
        _Q.setFromUnitVectors(_B, _D).slerp(_I, 1 - poids)
        a.getWorldQuaternion(_Q2).premultiply(_Q)
        a.parent!.getWorldQuaternion(_Q).invert()
        a.quaternion.copy(_Q.multiply(_Q2))
        a.updateMatrixWorld(true)
      }
    },
  }
}
