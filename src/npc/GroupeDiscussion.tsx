import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Anim } from '../player/Avatar'
import { CorpsPnj, type ModelePnj } from './CorpsPnj'
import { gabaritPnj } from './PnjEnfant'
import { OmbreSol } from './OmbreSol'
import { cheminAutorise, pointAutorise } from './routines'

// Petit groupe de PNJ qui discutent ensemble puis se déplacent ensemble.
// Règle de jeu (Samuel, 12/11/2026) : un PNJ est soit en mouvement, soit
// arrêté pour parler, et jamais plus de 3 à 4 minutes immobile.
// - « discute » : en cercle autour d'un lieu, chacun tourné vers celui qui
//   parle ; l'orateur change toutes les 4 à 9 s. Durée 1 à 3 min 20.
// - « marche » : chacun rejoint sa place autour du lieu suivant.
// Les lieux passent par cheminAutorise (place du Rebbe et pièce de la chaise
// interdites), et chaque pas par pointAutorise.

export type MembreGroupe = { id: string; modele?: ModelePnj; peau?: string; barbe?: string }

type Props = {
  id: string
  y: number
  lieux: [number, number][]
  membres: MembreGroupe[]
  rayon?: number
}

const VITESSE = 1.1
const DUREE_MIN = 60
const DUREE_MAX = 200 // 3 min 20 : jamais plus de 3 à 4 minutes immobile

type EtatMembre = { x: number; z: number; cap: number; arrive: boolean; anim: MutableRefObject<Anim> }

function hasard(a: number, b: number) {
  return a + Math.random() * (b - a)
}

export function GroupeDiscussion({ id, y, lieux, membres, rayon }: Props) {
  const route = useMemo(() => cheminAutorise(lieux), [lieux])
  const n = membres.length
  const r = rayon ?? (membres.every((m) => m.modele === 'enfant' || m.modele === 'fille') ? 0.55 : 0.75)

  // Place du membre i autour du lieu k (repliée sur le centre si interdite)
  const place = (k: number, i: number): [number, number] => {
    const [cx, cz] = route[k]
    const a = (i / n) * Math.PI * 2 + k * 0.7
    const x = cx + Math.sin(a) * r
    const z = cz + Math.cos(a) * r
    return pointAutorise(x, z) ? [x, z] : [cx, cz]
  }

  const etats = useRef<EtatMembre[]>([])
  if (!etats.current.length && route.length) {
    etats.current = membres.map((_, i) => {
      const [x, z] = place(0, i)
      return { x, z, cap: 0, arrive: true, anim: { current: { etat: 'repos', vitesse: 0 } } }
    })
  }
  const groupe = useRef({
    phase: 'discute' as 'discute' | 'marche',
    k: 0,
    reste: hasard(20, DUREE_MAX), // premier arrêt plus court : départs décalés
    orateur: 0,
    resteOrateur: hasard(4, 9),
    t: Math.random() * 10,
  })
  const objets = useRef<(THREE.Group | null)[]>([])
  const corps = useRef<(RapierRigidBody | null)[]>([])

  useFrame((_, dtBrut) => {
    if (!route.length) return
    const dt = Math.min(dtBrut, 0.1)
    const g = groupe.current
    g.t += dt
    const [cx, cz] = route[g.k]
    if (g.phase === 'discute') {
      g.reste -= Math.min(dtBrut, 0.5)
      g.resteOrateur -= dt
      if (g.resteOrateur <= 0) {
        g.orateur = (g.orateur + 1 + Math.floor(Math.random() * Math.max(1, n - 1))) % n
        g.resteOrateur = hasard(4, 9)
      }
      const o = etats.current[g.orateur]
      etats.current.forEach((e, i) => {
        // Les auditeurs regardent l'orateur ; l'orateur regarde le groupe en
        // tournant un peu la tête et les épaules, comme s'il s'adressait à chacun
        const cible = i === g.orateur ? Math.atan2(cx - e.x, cz - e.z) + Math.sin(g.t * 1.3 + i) * 0.35 : Math.atan2(o.x - e.x, o.z - e.z)
        let dc = cible - e.cap
        while (dc > Math.PI) dc -= Math.PI * 2
        while (dc < -Math.PI) dc += Math.PI * 2
        e.cap += dc * Math.min(1, dt * 3)
        e.anim.current = { etat: 'repos', vitesse: 0 }
      })
      if (g.reste <= 0) {
        g.phase = 'marche'
        g.k = (g.k + 1) % route.length
        etats.current.forEach((e) => (e.arrive = false))
      }
    } else {
      let tous = true
      etats.current.forEach((e, i) => {
        if (e.arrive) return
        const [tx, tz] = place(g.k, i)
        const vx = tx - e.x
        const vz = tz - e.z
        const d = Math.hypot(vx, vz)
        if (d < 0.08) {
          e.arrive = true
          e.anim.current = { etat: 'repos', vitesse: 0 }
          return
        }
        tous = false
        const pas = Math.min(VITESSE * dt, d) / d
        const nx = e.x + vx * pas
        const nz = e.z + vz * pas
        if (pointAutorise(nx, nz)) {
          e.x = nx
          e.z = nz
        }
        let dc = Math.atan2(vx, vz) - e.cap
        while (dc > Math.PI) dc -= Math.PI * 2
        while (dc < -Math.PI) dc += Math.PI * 2
        e.cap += dc * Math.min(1, dt * 8)
        e.anim.current = { etat: 'marche', vitesse: VITESSE }
      })
      if (tous) {
        g.phase = 'discute'
        g.reste = hasard(DUREE_MIN, DUREE_MAX)
      }
    }
    etats.current.forEach((e, i) => {
      const o = objets.current[i]
      if (o) {
        o.position.set(e.x, y, e.z)
        o.rotation.y = e.cap
      }
      corps.current[i]?.setNextKinematicTranslation({ x: e.x, y: y + gabaritPnj(membres[i].modele ?? 'adulte').centreY, z: e.z })
    })
  })

  if (!route.length) {
    if (import.meta.env.DEV) console.warn(`[PNJ] groupe ${id} refusé : lieux trop près de la place vide`)
    return null
  }

  return (
    <>
      {membres.map((m, i) => {
        const e = etats.current[i]
        const gb = gabaritPnj(m.modele ?? 'adulte')
        return (
          <group key={m.id}>
            <RigidBody ref={(b) => void (corps.current[i] = b)} type="kinematicPosition" colliders={false} position={[e.x, y + gb.centreY, e.z]}>
              <CapsuleCollider args={[gb.demiHauteur, gb.rayon]} />
            </RigidBody>
            <group ref={(o) => void (objets.current[i] = o)} position={[e.x, y, e.z]}>
              <CorpsPnj id={m.id} anim={e.anim} peau={m.peau} barbe={m.barbe} modele={m.modele} />
              <OmbreSol rayon={gb.rayon * 1.5} />
            </group>
          </group>
        )
      })}
    </>
  )
}
