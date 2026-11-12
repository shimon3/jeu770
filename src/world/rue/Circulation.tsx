import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import { geometriesParMateriau, type CouleurVoiture, type ModeleVoiture } from './voitures'

// Circulation sur la chaussée centrale d'Eastern Parkway (zone que le joueur
// ne peut pas atteindre : mur invisible avant la chaussée). Chaque véhicule
// roule à vitesse constante sur sa voie et réapparaît à l'autre bout de la rue.
// Pas d'ombres portées pour les véhicules en mouvement (économie de calcul).

const BORNE = 62 // demi-longueur parcourue (la rue fait 120 m)

type Vehicule = { modele: ModeleVoiture; couleur: CouleurVoiture; z: number; vitesse: number; x0: number }

function VehiculeRoulant({ modele, couleur, z, vitesse, x0, y }: Vehicule & { y: number }) {
  const mats = useMateriaux()
  const geos = useMemo(() => geometriesParMateriau(modele, couleur), [modele, couleur])
  const groupe = useRef<THREE.Group>(null)
  const x = useRef(x0)
  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.1)
    x.current += vitesse * dt
    if (x.current > BORNE) x.current -= 2 * BORNE
    if (x.current < -BORNE) x.current += 2 * BORNE
    if (groupe.current) groupe.current.position.x = x.current
  })
  return (
    <group ref={groupe} position={[x0, y, z]} rotation={[0, vitesse > 0 ? 0 : Math.PI, 0]}>
      {geos.map(([m, g]) => (
        <mesh key={m} geometry={g} material={mats[m]} receiveShadow />
      ))}
    </group>
  )
}

export function Circulation({ zChaussee, largeur, y }: { zChaussee: number; largeur: number; y: number }) {
  // Deux voies dans chaque sens ; sens vers +x côté 770, vers -x côté sud
  const v1 = zChaussee + largeur * 0.2
  const v2 = zChaussee + largeur * 0.38
  const v3 = zChaussee + largeur * 0.62
  const v4 = zChaussee + largeur * 0.8
  const vehicules: Vehicule[] = [
    { modele: 'berline', couleur: 'voiture1', z: v1, vitesse: 9, x0: -50 },
    { modele: 'taxi', couleur: 'taxi', z: v2, vitesse: 11, x0: -10 },
    { modele: 'monospace', couleur: 'voiture0', z: v1, vitesse: 9, x0: 25 },
    { modele: 'pompiers', couleur: 'voiture3', z: v2, vitesse: 7, x0: 30 },
    { modele: 'berline', couleur: 'voiture2', z: v3, vitesse: -10, x0: 40 },
    { modele: 'police', couleur: 'voiture3', z: v4, vitesse: -8, x0: 0 },
    { modele: 'taxi', couleur: 'taxi', z: v3, vitesse: -10, x0: -35 },
  ]
  return (
    <>
      {vehicules.map((v, i) => (
        <VehiculeRoulant key={i} {...v} y={y} />
      ))}
    </>
  )
}
