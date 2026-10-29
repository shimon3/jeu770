import * as THREE from 'three'

// Les clips Meshy font balancer les bras beaucoup trop loin du corps. On
// conserve 30 % du mouvement original des avant-bras : assez pour que la
// marche reste vivante, sans grands arcs artificiels. Les jambes, le bassin
// et le torse ne sont pas modifiés. Pendant la course uniquement, les
// translations des mains sont verrouillées sur leur point d'attache au
// poignet pour éviter qu'elles paraissent décollées des avant-bras.
export const AMPLITUDE_BALANCEMENT_BRAS = 0.3

export type AnimationsV6Adoucies = {
  clips: THREE.AnimationClip[]
  pistesBrasAdoucies: number
  pistesMainsCourseFixees: number
}

const cache = new WeakMap<THREE.AnimationClip[], AnimationsV6Adoucies>()

function estPisteAvantBras(piste: THREE.KeyframeTrack) {
  return /(?:Left|Right)ForeArm\.(?:quaternion|position)$/.test(piste.name)
}

function estPositionMain(piste: THREE.KeyframeTrack) {
  return /(?:Left|Right)Hand\.position$/.test(piste.name)
}

function moyenneQuaternion(piste: THREE.KeyframeTrack) {
  const valeurs = piste.values
  const premier = new THREE.Quaternion().fromArray(valeurs, 0)
  const q = new THREE.Quaternion()
  const somme = new THREE.Vector4()
  for (let i = 0; i < valeurs.length; i += 4) {
    q.fromArray(valeurs, i)
    const signe = premier.dot(q) < 0 ? -1 : 1
    somme.x += q.x * signe
    somme.y += q.y * signe
    somme.z += q.z * signe
    somme.w += q.w * signe
  }
  return new THREE.Quaternion(somme.x, somme.y, somme.z, somme.w).normalize()
}

function moyennePosition(piste: THREE.KeyframeTrack) {
  const valeurs = piste.values
  const somme = new THREE.Vector3()
  const n = valeurs.length / 3
  for (let i = 0; i < valeurs.length; i += 3) somme.add(new THREE.Vector3(valeurs[i], valeurs[i + 1], valeurs[i + 2]))
  return somme.multiplyScalar(1 / Math.max(1, n))
}

export function adoucirAnimationsBras(animations: THREE.AnimationClip[]): AnimationsV6Adoucies {
  const existant = cache.get(animations)
  if (existant) return existant

  const repos = animations.find((clip) => clip.name === 'Idle_11')
  const references = new Map<string, THREE.Quaternion | THREE.Vector3>()
  for (const piste of repos?.tracks ?? []) {
    if (!estPisteAvantBras(piste) && !estPositionMain(piste)) continue
    references.set(piste.name, piste.name.endsWith('.quaternion') ? moyenneQuaternion(piste) : moyennePosition(piste))
  }

  let pistesBrasAdoucies = 0
  let pistesMainsCourseFixees = 0
  const clips = animations.map((source) => {
    if (source.name === 'Idle_11') return source
    const clip = source.clone()
    for (const piste of clip.tracks) {
      const avantBras = estPisteAvantBras(piste)
      const mainEnCourse = source.name === 'Running' && estPositionMain(piste)
      if (!avantBras && !mainEnCourse) continue
      const reference = references.get(piste.name)
      if (!reference) continue
      if (mainEnCourse && reference instanceof THREE.Vector3) {
        for (let i = 0; i < piste.values.length; i += 3) reference.toArray(piste.values, i)
        pistesMainsCourseFixees++
      } else if (reference instanceof THREE.Quaternion && piste.name.endsWith('.quaternion')) {
        const animee = new THREE.Quaternion()
        for (let i = 0; i < piste.values.length; i += 4) {
          animee.fromArray(piste.values, i)
          reference.clone().slerp(animee, AMPLITUDE_BALANCEMENT_BRAS).toArray(piste.values, i)
        }
      } else if (reference instanceof THREE.Vector3 && piste.name.endsWith('.position')) {
        const animee = new THREE.Vector3()
        for (let i = 0; i < piste.values.length; i += 3) {
          animee.fromArray(piste.values, i)
          reference.clone().lerp(animee, AMPLITUDE_BALANCEMENT_BRAS).toArray(piste.values, i)
        }
      } else continue
      if (avantBras) pistesBrasAdoucies++
    }
    return clip
  })

  const resultat = { clips, pistesBrasAdoucies, pistesMainsCourseFixees }
  cache.set(animations, resultat)
  return resultat
}
