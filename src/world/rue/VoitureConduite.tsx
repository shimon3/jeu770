import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { joystick, toucheAction, touche } from '../../player/entrees'
import { conduite, FILTRE_VOITURE } from './conduite'
import { GABARIT, geometriesParMateriau, type CouleurVoiture, type ModeleVoiture } from './voitures'

// Voiture que le joueur peut prendre (E) pour se promener : ZQSD/WASD ou
// joystick, E pour descendre. Physique d'arcade : un contrôleur de personnage
// Rapier sur la caisse gère les collisions (voitures, bancs, abris, kiosque).
// La caisse de collision flotte à 20 cm du sol (chaussée plate) : elle ne
// frotte jamais le sol ni les bordures. Zone : contre-allée nord, terre-plein
// et chaussée centrale.

const VMAX = 13
const VMAX_ARRIERE = 5
const ACCEL = 6
const FREIN = 12
const DECOLLE = 0.2 // hauteur du bas de la caisse de collision au-dessus du sol
const LIMITES = { x: 56, z0: 12.4, z1: 44.6 }
const q = new THREE.Quaternion()
const axeY = new THREE.Vector3(0, 1, 0)

type Props = { modele: ModeleVoiture; couleur: CouleurVoiture; x: number; z: number; y: number; cap: number }

export function VoitureConduite({ modele, couleur, x, z, y, cap }: Props) {
  const mats = useMateriaux()
  const geos = useMemo(() => geometriesParMateriau(modele, couleur), [modele, couleur])
  const [l, h, w] = GABARIT[modele]
  const { world } = useRapier()
  const corps = useRef<RapierRigidBody>(null)
  const groupe = useRef<THREE.Group>(null)
  const [garee, setGaree] = useState({ x, z, y, cap })
  const [active, setActive] = useState(false)

  const ctrlRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.03)
    c.setSlideEnabled(true)
    ctrlRef.current = c
    conduite.x = x
    conduite.y = y
    conduite.z = z
    conduite.cap = cap
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__conduite = conduite
    return () => {
      ctrlRef.current = null
      world.removeCharacterController(c)
      conduite.active = false
    }
  }, [world, x, y, z, cap])

  const sortir = () => {
    const c = conduite.cap
    // Côté conducteur (gauche), ramené dans la zone où l'on marche
    const sx = THREE.MathUtils.clamp(conduite.x - Math.sin(c) * 1.7, -39, 39)
    const sz = THREE.MathUtils.clamp(conduite.z - Math.cos(c) * 1.7, 12.6, 24.4)
    conduite.sortie = [sx, 0.2, sz]
    conduite.active = false
    conduite.vitesse = 0
    setGaree({ x: conduite.x, z: conduite.z, y: conduite.y, cap: conduite.cap })
    setActive(false)
  }

  useInteractif(
    'voiture-conduite',
    [garee.x, garee.y + 1, garee.z],
    active ? 0 : 3.2,
    () => t('action.conduire'),
    () => {
      if (conduite.active) return
      conduite.active = true
      conduite.vitesse = 0
      setActive(true)
      useGame.getState().notifier('conduite.aide')
    },
  )

  // E pour descendre (la cible E est désactivée pendant la conduite)
  useEffect(() => {
    if (!active) return
    const surTouche = (e: KeyboardEvent) => {
      if (toucheAction(e) === 'e') sortir()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [active])

  useFrame((_, dtBrut) => {
    const rb = corps.current
    const ctrl = ctrlRef.current
    if (!rb || !ctrl || !conduite.active) return
    const dt = Math.min(dtBrut, 0.05)
    const st = useGame.getState()
    const bloque = st.pause || st.panneau !== null
    let av = 0
    let lat = 0
    if (!bloque) {
      av = (touche('avant') ? 1 : 0) - (touche('arriere') ? 1 : 0)
      lat = (touche('droite') ? 1 : 0) - (touche('gauche') ? 1 : 0)
      if (joystick.actif && (joystick.x !== 0 || joystick.y !== 0)) {
        av = joystick.y
        lat = joystick.x
      }
    }
    let v = conduite.vitesse
    if (av !== 0) v += av * (Math.sign(av) !== Math.sign(v) && v !== 0 ? FREIN : ACCEL) * dt
    else v = THREE.MathUtils.damp(v, 0, 1.2, dt)
    v = THREE.MathUtils.clamp(v, -VMAX_ARRIERE, VMAX)
    // Braquage proportionnel à la vitesse (inversé en marche arrière)
    // (braquage minimal à basse vitesse, pour se dégager d'une place)
    const sensRoule = v !== 0 ? Math.sign(v) : Math.sign(av)
    const braquage = sensRoule * Math.max(0.45, Math.min(1, Math.abs(v) / 5))
    if (sensRoule !== 0) conduite.cap -= lat * dt * 1.5 * braquage
    const fx = Math.cos(conduite.cap)
    const fz = -Math.sin(conduite.cap)
    const col = rb.collider(0)
    const voulu = { x: fx * v * dt, y: 0, z: fz * v * dt }
    ctrl.computeColliderMovement(col, voulu, undefined, FILTRE_VOITURE)
    const m = ctrl.computedMovement()
    // Choc : la voiture rebondit légèrement
    const horiz = Math.hypot(voulu.x, voulu.z)
    if (horiz > 0.01 && Math.hypot(m.x, m.z) < horiz * 0.4) v *= 0.5
    conduite.vitesse = v
    const p = rb.translation()
    conduite.x = THREE.MathUtils.clamp(p.x + m.x, -LIMITES.x, LIMITES.x)
    conduite.z = THREE.MathUtils.clamp(p.z + m.z, LIMITES.z0, LIMITES.z1)
    rb.setNextKinematicTranslation({ x: conduite.x, y: p.y, z: conduite.z })
    rb.setNextKinematicRotation(q.setFromAxisAngle(axeY, conduite.cap))
    if (groupe.current) {
      groupe.current.position.set(conduite.x, conduite.y, conduite.z)
      groupe.current.rotation.y = conduite.cap
    }
  })

  return (
    <>
      <group ref={groupe} position={[x, y, z]} rotation={[0, cap, 0]}>
        {geos.map(([m, g]) => (
          <mesh key={m} geometry={g} material={mats[m]} castShadow receiveShadow />
        ))}
      </group>
      <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={[x, y + DECOLLE + (h - DECOLLE) / 2, z]} rotation={[0, cap, 0]}>
        <CuboidCollider args={[l / 2, (h - DECOLLE) / 2, w / 2]} />
      </RigidBody>
    </>
  )
}
