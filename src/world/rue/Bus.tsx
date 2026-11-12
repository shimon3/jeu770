import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import { CorpsPnj, type ModelePnj } from '../../npc/CorpsPnj'
import type { Anim } from '../../player/Avatar'
import { devant, flotte, type Etat } from './Circulation'
import { GABARIT, PORTE_BUS, geometriesParMateriau } from './voitures'

// Ligne de bus : le bus roule dans sa voie, se rabat vers le trottoir avant
// l'arrêt, s'arrête porte face à l'abri, attend que les voyageurs soient
// montés, puis reprend sa voie et quitte la rue. Il revient après une pause
// hors champ, et de nouveaux voyageurs attendent à l'arrêt.

const BORNE = 64
const VMAX = 8
const FREINAGE = 1.6 // m/s²
const RABAT = 16 // distance sur laquelle le bus se rabat ou reprend sa voie (m)
const PAUSE_HORS_CHAMP = 14 // s

type Ligne = {
  x: number
  z: number
  cap: number
  etat: 'roule' | 'arrete' | 'repart' | 'hors'
  t: number
  montes: number
  cycle: number
}

type Props = {
  id: string
  sens: 1 | -1
  zVoie: number
  zQuai: number
  xArret: number // position de l'abri : la porte s'y arrête
  y: number
  voyageurs: { modele: ModelePnj; attente: [number, number] }[]
  porte: [number, number] // où les voyageurs montent (au bord du trottoir)
}

export function LigneBus({ id, sens, zVoie, zQuai, xArret, y, voyageurs, porte }: Props) {
  const mats = useMateriaux()
  const geos = useMemo(() => geometriesParMateriau('busVille', 'voiture3'), [])
  const [l, h, w] = GABARIT.busVille
  const xCentreArret = xArret - sens * PORTE_BUS
  const groupe = useRef<THREE.Group>(null)
  const corps = useRef<RapierRigidBody>(null)
  const ligne = useMemo<Ligne>(() => ({ x: -sens * 40, z: zVoie, cap: sens > 0 ? 0 : Math.PI, etat: 'roule', t: 0, montes: 0, cycle: 0 }), [sens, zVoie])
  const etat = useMemo<Etat>(() => ({ x: ligne.x, z: zVoie, v: VMAX, demi: l / 2 }), [ligne, zVoie, l])
  useEffect(() => {
    flotte.push(etat)
    return () => void flotte.splice(flotte.indexOf(etat), 1)
  }, [etat])
  const q = useMemo(() => new THREE.Quaternion(), [])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.1)
    const L = ligne
    const d = (xCentreArret - L.x) * sens // > 0 avant l'arrêt
    let cible = VMAX
    if (L.etat === 'hors') {
      L.t += dt
      if (L.t > PAUSE_HORS_CHAMP) {
        L.etat = 'roule'
        L.montes = 0
        L.cycle++
      }
      etat.v = 0
    } else if (L.etat === 'arrete') {
      L.t += dt
      etat.v = 0
      if (L.montes >= voyageurs.length && L.t > 6) L.etat = 'repart'
    } else {
      if (L.etat === 'roule' && d > 0) cible = Math.min(cible, Math.sqrt(2 * FREINAGE * d) + 0.3)
      const libre = devant(etat, sens)
      if (libre < 5) cible = 0
      else if (libre < 15) cible = Math.min(cible, (VMAX * (libre - 5)) / 10)
      etat.v = THREE.MathUtils.damp(etat.v, cible, cible < etat.v ? 3 : 0.8, dt)
      if (L.etat === 'roule' && d <= 0.15 && d > -2) {
        L.etat = 'arrete'
        L.t = 0
        etat.v = 0
      }
      L.x += sens * etat.v * dt
      if (L.x * sens > BORNE) {
        L.x = -sens * BORNE
        L.etat = 'hors'
        L.t = 0
      }
    }
    // Rabattement vers le quai (avant l'arrêt) et retour dans la voie (après)
    const dn = (xCentreArret - L.x) * sens
    const f = L.etat === 'roule' ? THREE.MathUtils.clamp((RABAT + 4 - dn) / RABAT, 0, 1) : L.etat === 'arrete' ? 1 : THREE.MathUtils.clamp(1 + dn / RABAT, 0, 1)
    const zAvant = L.z
    L.z = THREE.MathUtils.lerp(zVoie, zQuai, f * f * (3 - 2 * f))
    const dx = etat.v * dt
    const lacet = dx > 1e-4 ? Math.atan2(-(L.z - zAvant) * sens, dx) : 0
    L.cap = (sens > 0 ? 0 : Math.PI) + lacet
    etat.x = L.x
    etat.z = L.z
    if (groupe.current) {
      groupe.current.position.set(L.x, y, L.z)
      groupe.current.rotation.y = L.cap
      groupe.current.visible = L.etat !== 'hors'
    }
    const rb = corps.current
    if (rb) {
      rb.setNextKinematicTranslation({ x: L.x, y: y + h / 2 + (L.etat === 'hors' ? -20 : 0), z: L.z })
      rb.setNextKinematicRotation(q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, L.cap))
    }
  })

  return (
    <>
      <group ref={groupe}>
        {geos.map(([m, g]) => (
          <mesh key={m} geometry={g} material={mats[m]} receiveShadow />
        ))}
      </group>
      <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={[ligne.x, y + h / 2, zVoie]}>
        <CuboidCollider args={[l / 2, h / 2, w / 2]} />
      </RigidBody>
      {voyageurs.map((v, i) => (
        <Voyageur key={i} id={`${id}-voyageur-${i}`} rang={i} ligne={ligne} modele={v.modele} attente={v.attente} porte={porte} />
      ))}
    </>
  )
}

// Voyageur : attend à l'arrêt, tourné vers la chaussée ; quand le bus est
// arrêté et que son tour vient, marche jusqu'à la porte et monte.
function Voyageur({ id, rang, ligne, modele, attente, porte }: { id: string; rang: number; ligne: Ligne; modele: ModelePnj; attente: [number, number]; porte: [number, number] }) {
  const anim = useRef<Anim>({ etat: 'repos', vitesse: 0 })
  const groupe = useRef<THREE.Group>(null)
  const s = useRef({ x: attente[0], z: attente[1], monte: false, cycle: ligne.cycle })
  const capAttente = Math.atan2(porte[0] - attente[0], porte[1] - attente[1])
  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.1)
    const e = s.current
    if (e.cycle !== ligne.cycle) {
      // Nouveau passage du bus : un nouveau voyageur attend
      e.cycle = ligne.cycle
      e.monte = false
      e.x = attente[0]
      e.z = attente[1]
    }
    const g = groupe.current
    if (!g) return
    g.visible = !e.monte
    if (e.monte) return
    if (ligne.etat === 'arrete' && ligne.montes === rang) {
      const dx = porte[0] - e.x
      const dz = porte[1] - e.z
      const d = Math.hypot(dx, dz)
      if (d < 0.15) {
        e.monte = true
        ligne.montes++
        anim.current = { etat: 'repos', vitesse: 0 }
        return
      }
      const pas = Math.min(d, 1.3 * dt)
      e.x += (dx / d) * pas
      e.z += (dz / d) * pas
      g.rotation.y = Math.atan2(dx, dz)
      anim.current = { etat: 'marche', vitesse: 1.3 }
    } else {
      g.rotation.y = capAttente
      anim.current = { etat: 'repos', vitesse: 0 }
    }
    g.position.set(e.x, 0, e.z)
  })
  return (
    <group ref={groupe} position={[attente[0], 0, attente[1]]}>
      <CorpsPnj id={id} anim={anim} modele={modele} />
    </group>
  )
}
