import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { joystick, toucheAction, touche } from '../../player/entrees'
import { conduite, FILTRE_VOITURE } from './conduite'
import { evenementMission } from '../../missions/missions'
import { GABARIT, type CouleurVoiture, type ModeleVoiture } from './voitures'
import { CorpsVoiture } from './modelesRue'

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

type Props = { id?: string; modele: ModeleVoiture; couleur: CouleurVoiture; x: number; z: number; y: number; cap: number }

export function VoitureConduite({ id = 'voiture-conduite', modele, couleur, x, z, y, cap }: Props) {
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
    if (import.meta.env.DEV) {
      const w = window as unknown as Record<string, unknown>
      w.__conduite = conduite
      // Outil de test : déplacer ce véhicule (et sa caisse de collision)
      const v = ((w.__vehicules as Record<string, (x: number, z: number) => void>) ??= {})
      v[id] = (nx: number, nz: number) => {
        corps.current?.setTranslation({ x: nx, y: corps.current.translation().y, z: nz }, true)
        if (conduite.vehicule === id) {
          conduite.x = nx
          conduite.z = nz
        }
        if (groupe.current) groupe.current.position.set(nx, groupe.current.position.y, nz)
      }
    }
    return () => {
      ctrlRef.current = null
      world.removeCharacterController(c)
      if (conduite.vehicule === id) {
        conduite.active = false
        conduite.vehicule = null
      }
    }
  }, [world, id])

  const sortir = () => {
    const c = conduite.cap
    // Côté conducteur (gauche), ramené dans la zone où l'on marche
    const sx = THREE.MathUtils.clamp(conduite.x - Math.sin(c) * 1.7, -39, 39)
    const sz = THREE.MathUtils.clamp(conduite.z - Math.cos(c) * 1.7, 12.6, 24.4)
    conduite.sortie = [sx, 0.2, sz]
    conduite.active = false
    conduite.vehicule = null
    conduite.vitesse = 0
    setGaree({ x: conduite.x, z: conduite.z, y: conduite.y, cap: conduite.cap })
    setActive(false)
  }

  useInteractif(
    id,
    [garee.x, garee.y + 1, garee.z],
    active ? 0 : 3.2,
    () => t('action.conduire'),
    () => {
      if (conduite.active) return
      conduite.active = true
      conduite.vehicule = id
      conduite.x = garee.x
      conduite.y = garee.y
      conduite.z = garee.z
      conduite.cap = garee.cap
      conduite.vitesse = 0
      setActive(true)
      useGame.getState().notifier('conduite.aide')
      // Monter dans ce véhicule peut faire avancer une mission (Mitzvah Tank)
      evenementMission('interagir', id)
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
    if (!rb || !ctrl || !conduite.active || conduite.vehicule !== id) return
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
    // Fluidité : la position de la voiture est intégrée ici, image par image,
    // et non relue dans le moteur physique (pas fixe de 1/60 s) : relire
    // rb.translation() ajoutait deux fois le même déplacement quand l'écran
    // n'a pas le même rythme que la physique (saccades, aller-retour)
    const p = rb.translation()
    conduite.x = THREE.MathUtils.clamp(conduite.x + m.x, -LIMITES.x, LIMITES.x)
    conduite.z = THREE.MathUtils.clamp(conduite.z + m.z, LIMITES.z0, LIMITES.z1)
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
        <CorpsVoiture modele={modele} couleur={couleur} />
      </group>
      <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={[x, y + DECOLLE + (h - DECOLLE) / 2, z]} rotation={[0, cap, 0]}>
        <CuboidCollider args={[l / 2, (h - DECOLLE) / 2, w / 2]} />
      </RigidBody>
    </>
  )
}
