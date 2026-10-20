import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Avatar, type Anim, type EtatAnim } from '../player/Avatar'
import { useInteractif } from '../world/interaction'
import { useGame } from '../state/store'
import { t } from '../i18n'
import { demarrerMission, evenementMission, MISSIONS } from '../missions/missions'
import { cheminAutorise, pointAutorise } from './routines'

// Hassid anonyme et générique (visage lisse, sans traits). Trois usages :
// - immobile (debout, assis ou en balancement d'étude) ;
// - marcheur sur un chemin en boucle (vérifié par routines.ts) ;
// - donneur de missions (missions dont `donneur` = son id, dans l'ordre).

type Props = {
  id: string
  position: [number, number, number]
  rotationY: number
  etat?: EtatAnim
  chemin?: [number, number][]
  parle?: boolean // interaction E
  nomCle?: string
  repliqueCle?: string // réplique quand il n'a pas de mission à donner
  peau?: string
  barbe?: string
}

const v = new THREE.Vector3()

export function PnjZal({ id, position, rotationY, etat = 'repos', chemin, parle = true, nomCle = 'pnj.nom', repliqueCle = 'zal.pnjRepos', peau = '#c99878', barbe = '#4a3626' }: Props) {
  const anim = useRef<Anim>({ etat, vitesse: 0 })
  const groupe = useRef<THREE.Group>(null)
  const corps = useRef<RapierRigidBody>(null)
  const route = useMemo(() => (chemin ? cheminAutorise(chemin) : []), [chemin])
  const etatRoute = useRef({ i: 0, x: position[0], z: position[2], cap: rotationY, pause: 0 })
  const autorise = pointAutorise(position[0], position[2])
  // Sous terre, l'ombre solaire est inutile ; dehors (PNJ d'entrée), on la garde
  useEffect(() => {
    if (position[1] < -1) groupe.current?.traverse((o) => void (o.castShadow = false))
  }, [position])

  useInteractif(
    id,
    [position[0], position[1] + 1.2, position[2]],
    parle ? 1.8 : 0,
    () => t('action.parler'),
    () => {
      if (!parle) return
      // 1. Ce dialogue peut terminer une étape « parler à … »
      const avant = JSON.stringify(useGame.getState().missions)
      evenementMission('interagir', id)
      const apres = useGame.getState().missions
      const avance = JSON.stringify(apres) !== avant
      // 2. Mission en cours confiée par ce PNJ ?
      const miennes = MISSIONS.filter((m) => m.donneur === id)
      const enCours = miennes.find((m) => apres[m.id]?.etat === 'active')
      let cle = repliqueCle
      if (enCours) cle = `mission.${enCours.id}.rappel`
      else {
        const suivante = miennes.find((m) => !apres[m.id])
        if (suivante) {
          demarrerMission(suivante.id)
          cle = `mission.${suivante.id}.debut`
        } else if (miennes.length) cle = avance ? `mission.${miennes[miennes.length - 1].id}.fin` : repliqueCle
      }
      useGame.getState().set({ panneau: { type: 'dialogue', nomCle, cle } })
    },
  )

  useFrame((_, dtBrut) => {
    if (!route.length) return
    const dt = Math.min(dtBrut, 0.05)
    const e = etatRoute.current
    if (e.pause > 0) {
      e.pause -= dt
      anim.current = { etat: 'repos', vitesse: 0 }
      return
    }
    const [tx, tz] = route[e.i]
    v.set(tx - e.x, 0, tz - e.z)
    const d = v.length()
    if (d < 0.1) {
      e.i = (e.i + 1) % route.length
      e.pause = 1 + Math.random() * 2.5
      return
    }
    v.multiplyScalar(Math.min(1.1 * dt, d) / d)
    const nx = e.x + v.x
    const nz = e.z + v.z
    if (!pointAutorise(nx, nz)) return // sécurité supplémentaire
    e.x = nx
    e.z = nz
    let dc = Math.atan2(v.x, v.z) - e.cap
    while (dc > Math.PI) dc -= Math.PI * 2
    while (dc < -Math.PI) dc += Math.PI * 2
    e.cap += dc * Math.min(1, dt * 8)
    anim.current = { etat: 'marche', vitesse: 1.1 }
    groupe.current?.position.set(e.x, position[1], e.z)
    if (groupe.current) groupe.current.rotation.y = e.cap
    corps.current?.setNextKinematicTranslation({ x: e.x, y: position[1] + 0.85, z: e.z })
  })

  if (!autorise) {
    if (import.meta.env.DEV) console.warn(`[PNJ] ${id} refusé : trop près de la place vide`)
    return null
  }

  return (
    <>
      {etat !== 'assis' && (
        <RigidBody ref={corps} type={route.length ? 'kinematicPosition' : 'fixed'} colliders={false} position={[position[0], position[1] + 0.85, position[2]]}>
          <CapsuleCollider args={[0.55, 0.3]} />
        </RigidBody>
      )}
      <group ref={groupe} position={position} rotation={[0, rotationY, 0]}>
        <Avatar anim={anim} peau={peau} barbe={barbe} />
      </group>
    </>
  )
}
