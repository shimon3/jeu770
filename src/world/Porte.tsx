import { useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useInteractif } from './interaction'
import { useMateriaux } from './materiaux'
import { useGame } from '../state/store'
import { t } from '../i18n'
import { evenementMission } from '../missions/missions'
import type { V3 } from './primitives'

type Modele = 'principale' | 'interieure'

type Props = {
  id: string
  charniere: V3 // bas du gond, coordonnées monde
  largeur: number
  hauteur: number
  epaisseur?: number
  // Direction du gond vers le bord libre, le long de x (porte fermée dans un plan z = cte)
  sens: 1 | -1
  angleOuverture: number // radians, signé (rotation autour de y)
  modele?: Modele
  verrouillee?: string // clé du message affiché si la porte ne s'ouvre pas
  ouverteInitiale?: boolean
  fixe?: boolean // porte laissée ouverte, sans interaction
  cle?: string // objet d'inventaire nécessaire pour ouvrir ou fermer
  messageSansCle?: string
  rotationY?: number // orientation de la porte fermée
}

const q = new THREE.Quaternion()
const e = new THREE.Euler()

export function Porte({ id, charniere, largeur, hauteur, epaisseur = 0.06, sens, angleOuverture, modele = 'interieure', verrouillee, rotationY = 0, ouverteInitiale = false, fixe = false, cle, messageSansCle = 'message.porteFermeeCle' }: Props) {
  const corps = useRef<RapierRigidBody>(null)
  const [ouverte, setOuverte] = useState(ouverteInitiale)
  const angle = useRef(ouverteInitiale ? angleOuverture : 0)
  const aLaCle = useGame((s) => (cle ? s.inventaire.includes(cle) : true))
  const m = useMateriaux()

  // Point d'interaction : milieu de la porte fermée
  const c = Math.cos(rotationY)
  const s = Math.sin(rotationY)
  const mi = (sens * largeur) / 2
  const centre: V3 = [charniere[0] + mi * c, charniere[1] + 1.2, charniere[2] - mi * s]

  useInteractif(
    id,
    centre,
    fixe ? 0 : 1.7,
    () =>
      verrouillee || !aLaCle
        ? t('action.porteVerrouillee')
        : cle
          ? ouverte ? t('action.fermerPorteCle') : t('action.ouvrirPorteCle')
          : ouverte ? t('action.fermerPorte') : t('action.ouvrirPorte'),
    () => {
      if (fixe) return
      if (verrouillee) {
        useGame.getState().set({ panneau: { type: 'message', cle: verrouillee } })
        return
      }
      if (cle && !useGame.getState().inventaire.includes(cle)) {
        useGame.getState().set({ panneau: { type: 'message', cle: messageSansCle } })
        return
      }
      setOuverte((o) => !o)
      evenementMission('interagir', id)
    },
  )

  useFrame((_, dt) => {
    const cible = ouverte ? angleOuverture : 0
    const avant = angle.current
    angle.current = THREE.MathUtils.damp(angle.current, cible, 4, Math.min(dt, 0.05))
    if (Math.abs(angle.current - avant) < 1e-5 && Math.abs(angle.current - cible) < 1e-4) return
    q.setFromEuler(e.set(0, rotationY + angle.current, 0))
    corps.current?.setNextKinematicRotation(q)
  })

  // Repère local : la porte occupe x ∈ [0, sens·largeur], y ∈ [0, hauteur]
  const xDe = (u: number) => sens * largeur * (1 - u) // u = 0 au bord libre
  const panneau = (u0: number, u1: number, y0: number, y1: number, mat: THREE.Material, k: string, saillie = 0.024) => (
    <mesh key={k} position={[(xDe(u0) + xDe(u1)) / 2, (y0 + y1) / 2, 0]} material={mat} castShadow>
      <boxGeometry args={[Math.abs(xDe(u0) - xDe(u1)), y1 - y0, epaisseur + saillie]} />
    </mesh>
  )

  const details: ReactNode[] = []
  if (modele === 'principale') {
    // Disposition relevée sur Commons 3 (porte restaurée) : deux jours vitrés
    // en haut, panneaux à plates-bandes, traverse médiane.
    details.push(
      panneau(0.1, 0.33, 1.62, 2.15, m.vitreEclairee, 'v1', 0.004),
      panneau(0.72, 0.95, 1.62, 2.15, m.vitreEclairee, 'v2', 0.004),
      panneau(0.4, 0.65, 1.22, 2.15, m.chene, 'p1'),
      panneau(0.1, 0.33, 1.02, 1.5, m.chene, 'p2'),
      panneau(0.72, 0.95, 1.02, 1.5, m.chene, 'p3'),
      panneau(0.1, 0.95, 0.76, 0.94, m.chene, 'p4'),
      panneau(0.1, 0.33, 0.12, 0.66, m.chene, 'p5'),
      panneau(0.4, 0.65, 0.12, 0.66, m.chene, 'p6'),
      panneau(0.72, 0.95, 0.12, 0.66, m.chene, 'p7'),
      // Longue poignée en laiton (côté opposé aux gonds) et serrure
      panneau(0.05, 0.09, 0.85, 1.3, m.laiton, 'h1', 0.07),
      panneau(0.05, 0.09, 1.38, 1.42, m.laiton, 'h2', 0.06),
    )
  } else {
    details.push(
      panneau(0.15, 0.85, 1.15, 1.95, m.cheneFonce, 'p1'),
      panneau(0.15, 0.85, 0.15, 0.95, m.cheneFonce, 'p2'),
      panneau(0.05, 0.1, 0.98, 1.04, m.laiton, 'h1', 0.1),
    )
  }

  return (
    <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={charniere} rotation={[0, rotationY + (ouverteInitiale ? angleOuverture : 0), 0]}>
      <mesh position={[(sens * largeur) / 2, hauteur / 2, 0]} material={modele === 'principale' ? m.chene : m.cheneFonce} castShadow receiveShadow>
        <boxGeometry args={[largeur, hauteur, epaisseur]} />
      </mesh>
      {details}
      <CuboidCollider args={[largeur / 2, hauteur / 2, epaisseur / 2 + 0.01]} position={[(sens * largeur) / 2, hauteur / 2, 0]} />
    </RigidBody>
  )
}
