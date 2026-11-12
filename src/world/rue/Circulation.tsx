import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import { joueur } from '../../state/store'
import { GABARIT, geometriesParMateriau, type CouleurVoiture, type ModeleVoiture } from './voitures'

// Circulation d'Eastern Parkway, à droite comme à New York : sens -x côté 770,
// sens +x côté sud, sur les deux contre-allées et la chaussée centrale.
// Chaque véhicule roule à sa vitesse, freine derrière le véhicule qui le
// précède et s'arrête devant le joueur (à pied ou en voiture), puis
// réapparaît à l'autre bout de la rue. Collisions cinématiques là où le
// joueur peut aller ; pas d'ombres portées (économie de calcul).

const BORNE = 62 // demi-longueur parcourue (la rue fait 120 m)
const MARGE = 5 // distance d'arrêt derrière un obstacle (m)

type Vehicule = { modele: ModeleVoiture; couleur: CouleurVoiture; z: number; vitesse: number; x0: number; collision?: boolean }

// Positions partagées pour que chacun freine derrière le précédent
export type Etat = { x: number; z: number; v: number; demi: number }
export const flotte: Etat[] = []

export function devant(e: Etat, sens: number) {
  let libre = Infinity
  for (const o of flotte) {
    if (o === e || Math.abs(o.z - e.z) > 1.2) continue
    const d = (o.x - e.x) * sens - o.demi - e.demi
    if (d > -0.5 && d < libre) libre = d
  }
  const [px, , pz] = joueur.position
  if (Math.abs(pz - e.z) < 2.0) {
    const d = (px - e.x) * sens - e.demi - 1.2
    if (d > -1.5 && d < libre) libre = Math.max(0, d)
  }
  return libre
}

function VehiculeRoulant({ modele, couleur, z, vitesse, x0, y, collision }: Vehicule & { y: number }) {
  const mats = useMateriaux()
  const geos = useMemo(() => geometriesParMateriau(modele, couleur), [modele, couleur])
  const [l, h, w] = GABARIT[modele]
  const groupe = useRef<THREE.Group>(null)
  const corps = useRef<RapierRigidBody>(null)
  const etat = useMemo<Etat>(() => ({ x: x0, z, v: Math.abs(vitesse), demi: l / 2 }), [x0, z, vitesse, l])
  useEffect(() => {
    flotte.push(etat)
    return () => void flotte.splice(flotte.indexOf(etat), 1)
  }, [etat])
  const sens = Math.sign(vitesse)
  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.1)
    const libre = devant(etat, sens)
    const cible = libre < MARGE ? 0 : libre < MARGE * 3 ? Math.abs(vitesse) * ((libre - MARGE) / (MARGE * 2)) : Math.abs(vitesse)
    etat.v = THREE.MathUtils.damp(etat.v, cible, cible < etat.v ? 4 : 1.2, dt)
    etat.x += sens * etat.v * dt
    if (etat.x > BORNE) etat.x -= 2 * BORNE
    if (etat.x < -BORNE) etat.x += 2 * BORNE
    if (groupe.current) groupe.current.position.x = etat.x
    corps.current?.setNextKinematicTranslation({ x: etat.x, y: y + h / 2, z })
  })
  return (
    <>
      <group ref={groupe} position={[x0, y, z]} rotation={[0, sens > 0 ? 0 : Math.PI, 0]}>
        {geos.map(([m, g]) => (
          <mesh key={m} geometry={g} material={mats[m]} receiveShadow />
        ))}
      </group>
      {collision && (
        <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={[x0, y + h / 2, z]}>
          <CuboidCollider args={[l / 2, h / 2, w / 2]} />
        </RigidBody>
      )}
    </>
  )
}

type Props = { zContreNord: number; zChaussee: number; largeur: number; zContreSud: number; y: number }

export function Circulation({ zContreNord, zChaussee, largeur, zContreSud, y }: Props) {
  const vehicules = useMemo<Vehicule[]>(() => {
    const voie = (k: number) => zChaussee + largeur * k
    return [
      // Contre-allée nord (côté 770, sens unique -x), accessible au joueur
      { modele: 'monospace', couleur: 'voiture1', z: zContreNord, vitesse: -6, x0: 45, collision: true },
      { modele: 'taxi', couleur: 'taxi', z: zContreNord, vitesse: -6, x0: -5, collision: true },
      // Chaussée centrale, sens -x (moitié nord)
      { modele: 'berline', couleur: 'voiture1', z: voie(0.2), vitesse: -9, x0: -50, collision: true },
      { modele: 'busMashiah', couleur: 'voiture3', z: voie(0.38), vitesse: -8, x0: 20, collision: true },
      { modele: 'monospace', couleur: 'voiture0', z: voie(0.2), vitesse: -9, x0: 25, collision: true },
      { modele: 'taxi', couleur: 'taxi', z: voie(0.38), vitesse: -10, x0: -25, collision: true },
      // Chaussée centrale, sens +x (moitié sud)
      { modele: 'pompiers', couleur: 'voiture3', z: voie(0.62), vitesse: 7, x0: 30, collision: true },
      { modele: 'berline', couleur: 'voiture2', z: voie(0.62), vitesse: 10, x0: -40, collision: true },
      { modele: 'police', couleur: 'voiture3', z: voie(0.8), vitesse: 8, x0: 0, collision: true },
      { modele: 'taxi', couleur: 'taxi', z: voie(0.8), vitesse: 10, x0: -35, collision: true },
      // Contre-allée sud (sens unique +x), décor hors de portée
      { modele: 'berline', couleur: 'voiture0', z: zContreSud, vitesse: 6, x0: -20 },
      { modele: 'monospace', couleur: 'voiture2', z: zContreSud, vitesse: 6, x0: 30 },
    ]
  }, [zContreNord, zChaussee, largeur, zContreSud])
  return (
    <>
      {vehicules.map((v, i) => (
        <VehiculeRoulant key={i} {...v} y={y} />
      ))}
    </>
  )
}
