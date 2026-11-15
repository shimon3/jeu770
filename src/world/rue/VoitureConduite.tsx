import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useInteractif } from '../interaction'
import { joueur, useGame } from '../../state/store'
import { t } from '../../i18n'
import { joystick, toucheAction, touche } from '../../player/entrees'
import { conduite, FILTRE_VOITURE } from './conduite'
import { evenementMission } from '../../missions/missions'
import { GABARIT, type CouleurVoiture, type ModeleVoiture } from './voitures'
import { CorpsVoiture } from './modelesRue'
import { arreterHautParleur, hautParleurActif, prechargerNiggoun, reglerHautParleur, reglerMoteur } from '../../audio/vehicule'

const ID_TANK = 'mitzvah-tank'

// Voiture que le joueur peut prendre (E) pour se promener : ZQSD/WASD ou
// joystick, E pour descendre. Physique d'arcade : un contrôleur de personnage
// Rapier sur la caisse gère les collisions (voitures, bancs, abris, kiosque).
// La caisse de collision flotte à 20 cm du sol (chaussée plate) : elle ne
// frotte jamais le sol ni les bordures. Zone : contre-allée nord, terre-plein
// et chaussée centrale.

// Conduite d'arcade facile : vitesse modérée (36 km/h). Fluidité (15/11/2026) :
// volant et accélérateur lissés, braquage moins vif à haute vitesse, glissement
// le long des obstacles sans à-coups, et sur téléphone conduite « par
// direction » (on pousse le joystick là où l'on veut aller).
const VMAX = 10
const VMAX_ARRIERE = 4
const ACCEL = 4.5
const FREIN = 14
const RALENTI = 2.2 // décélération sans accélérer (m/s²)
const LISSAGE_VOLANT = 7 // réactivité du volant (plus haut = plus sec)
const ZONE_MORTE = 0.15 // joystick
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
  const vue = useGame((s) => s.vue)
  const [active, setActive] = useState(false)
  // Volant lissé (-1 … 1) et accélérateur lissé
  const volant = useRef(0)
  const gaz = useRef(0)
  const tank = modele === 'mitzvahTank'

  const ctrlRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.03)
    c.setSlideEnabled(true)
    ctrlRef.current = c
    if (import.meta.env.DEV) {
      const w = window as unknown as Record<string, unknown>
      w.__conduite = conduite
      w.__monde = world
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
        useGame.getState().set({ auVolant: null })
        reglerMoteur(false, 0, false)
      }
      if (id === ID_TANK) arreterHautParleur()
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
    useGame.getState().set({ auVolant: null })
    reglerMoteur(false, 0, modele === 'mitzvahTank')
    // Le niggoun s'arrête quand on descend du tank (demande de Samuel, 15/11/2026)
    if (id === ID_TANK) arreterHautParleur()
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
      useGame.getState().set({ auVolant: id })
      if (id === ID_TANK) prechargerNiggoun()
      useGame.getState().notifier(id === ID_TANK ? 'conduite.aideTank' : 'conduite.aide')
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
    conduite.descendre = sortir
    return () => {
      window.removeEventListener('keydown', surTouche)
      if (conduite.descendre === sortir) conduite.descendre = null
    }
  }, [active])

  useFrame((_, dtBrut) => {
    const st = useGame.getState()
    // Haut-parleur du tank : volume selon la distance au joueur, même garé
    if (id === ID_TANK && hautParleurActif()) {
      const enTank = conduite.active && conduite.vehicule === id
      const tx = enTank ? conduite.x : garee.x
      const tz = enTank ? conduite.z : garee.z
      const [px, , pz] = joueur.position
      reglerHautParleur(enTank ? 0 : Math.hypot(px - tx, pz - tz), !st.son || st.pause)
    }
    const rb = corps.current
    const ctrl = ctrlRef.current
    if (!rb || !ctrl || !conduite.active || conduite.vehicule !== id) return
    const dt = Math.min(dtBrut, 0.05)
    const bloque = st.pause || st.panneau !== null
    let av = 0
    let lat = 0
    let v = conduite.vitesse
    if (!bloque && joystick.actif && Math.hypot(joystick.x, joystick.y) > ZONE_MORTE) {
      // Téléphone : conduite par direction. La caméra est derrière le
      // véhicule : pousser vers le haut = tout droit, vers la gauche = tourner
      // à gauche. L'inclinaison donne la vitesse ; vers le bas = marche arrière.
      const force = Math.min(1, Math.hypot(joystick.x, joystick.y))
      const angle = Math.atan2(joystick.x, joystick.y) // 0 = haut, + = droite
      if (Math.abs(angle) > 2.4) {
        // Marche arrière : l'arrière part du côté où l'on pousse
        av = -force
        lat = THREE.MathUtils.clamp(joystick.x * 1.4, -1, 1)
      } else {
        av = force * Math.max(0.35, Math.cos(angle * 0.7))
        lat = THREE.MathUtils.clamp(angle / 1.2, -1, 1)
      }
    } else if (!bloque) {
      av = (touche('avant') ? 1 : 0) - (touche('arriere') ? 1 : 0)
      lat = (touche('droite') ? 1 : 0) - (touche('gauche') ? 1 : 0)
    }
    // Lissage : le volant revient au centre doucement, l'accélérateur monte
    // progressivement (plus d'à-coups au démarrage ni dans les virages)
    volant.current = THREE.MathUtils.damp(volant.current, lat, LISSAGE_VOLANT, dt)
    gaz.current = THREE.MathUtils.damp(gaz.current, av, 6, dt)
    const g = gaz.current
    if (Math.abs(g) > 0.02) {
      const freine = v !== 0 && Math.sign(g) !== Math.sign(v)
      v += g * (freine ? FREIN : ACCEL * (tank ? 0.8 : 1)) * dt
      // Ne pas dépasser la vitesse demandée par le joystick
      const plafond = Math.abs(g) * (g > 0 ? VMAX : VMAX_ARRIERE)
      if (!freine && Math.abs(v) > plafond) v = THREE.MathUtils.damp(v, Math.sign(v) * plafond, 3, dt)
    } else {
      const r = RALENTI * dt
      v = Math.abs(v) <= r ? 0 : v - Math.sign(v) * r
    }
    v = THREE.MathUtils.clamp(v, -VMAX_ARRIERE, VMAX)
    // Braquage : plein à basse vitesse, adouci à haute vitesse ; un peu de
    // braquage même à l'arrêt pour se dégager d'une place. Inversé en arrière.
    const sensRoule = Math.abs(v) > 0.05 ? Math.sign(v) : Math.sign(g)
    const av_ = Math.abs(v)
    const taux = (tank ? 1.35 : 1.8) * Math.min(1, 0.45 + av_ / 3) * (1 - 0.35 * Math.min(1, av_ / VMAX))
    if (sensRoule !== 0) conduite.cap -= volant.current * dt * taux * sensRoule
    const fx = Math.cos(conduite.cap)
    const fz = -Math.sin(conduite.cap)
    const col = rb.collider(0)
    const voulu = { x: fx * v * dt, y: 0, z: fz * v * dt }
    // Ignorer les objets désactivés : la capsule du conducteur, désactivée
    // pendant la conduite, restait comptée et bloquait le véhicule (le tank
    // ne bougeait pas du tout)
    ctrl.computeColliderMovement(col, voulu, undefined, FILTRE_VOITURE, (c) => c.isEnabled() && !c.isSensor())
    const m = ctrl.computedMovement()
    if (import.meta.env.DEV) {
      const n = ctrl.numComputedCollisions()
      const chocs = []
      for (let i = 0; i < n; i++) {
        const k = ctrl.computedCollision(i)
        const c = k?.collider
        if (c) chocs.push({ x: c.translation().x, y: c.translation().y, z: c.translation().z, forme: c.shape.type, he: (c.shape as unknown as { halfExtents?: unknown }).halfExtents, normale: k?.normal1 })
      }
      ;(window as unknown as Record<string, unknown>).__chocVoiture = { voulu, m: { x: m.x, y: m.y, z: m.z }, chocs }
    }
    // Choc : la vitesse devient celle réellement parcourue (on glisse le long
    // d'un mur sans à-coups ; contre un obstacle de face, on s'arrête)
    const horiz = Math.hypot(voulu.x, voulu.z)
    if (horiz > 0.001) {
      const ratio = Math.hypot(m.x, m.z) / horiz
      if (ratio < 0.98) v *= Math.max(0, ratio)
    }
    conduite.vitesse = v
    reglerMoteur(st.son && !st.pause, v, tank)
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
    // Priorité -1 : la voiture bouge AVANT que la caméra (Joueur.tsx) la suive
    // dans la même image ; sinon la caméra avait une image de retard et la
    // voiture tremblait à l'écran. (Négative : ne prend pas la main sur le rendu.)
  }, -1)

  return (
    <>
      <group ref={groupe} position={[x, y, z]} rotation={[0, cap, 0]}>
        <CorpsVoiture modele={modele} couleur={couleur} interieur={active && vue === '1re'} />
      </group>
      <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={[x, y + DECOLLE + (h - DECOLLE) / 2, z]} rotation={[0, cap, 0]}>
        <CuboidCollider args={[l / 2, (h - DECOLLE) / 2, w / 2]} />
      </RigidBody>
    </>
  )
}
