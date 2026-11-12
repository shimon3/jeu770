import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { create } from 'zustand'
import { useGame } from '../state/store'
import { conduite } from '../world/rue/conduite'
import { evenementMission, sauvegarder } from './missions'
import { PnjZal } from '../npc/PnjZal'
import { useT } from '../i18n'

// Mission « Mitzvah Tank » (première mission à la GTA) :
// 0. parler au responsable des mivtsaïm, devant le 770 ;
// 1. monter dans le Mitzvah Tank : le chrono de 5 minutes démarre ;
// 2-4. trois arrêts marqués par une colonne lumineuse : s'y immobiliser
//      1,2 s avec le tank ; un passant met les tefilines ;
// 5. ramener le tank devant le 770.
// Chrono écoulé : la mission est remise à zéro (on peut la reprendre).

export const ID_MISSION_TANK = 'mitzvah-tank'
const DUREE_MS = 5 * 60 * 1000
const RAYON = 4.5
const ARRET_S = 1.2

// Arrêts (x, z) : contre-allée nord puis grande avenue ; le passant attend sur
// le trottoir ou le terre-plein voisin, tourné vers la chaussée
const ARRETS: { x: number; z: number; passant: [number, number]; regard: number }[] = [
  { x: -20, z: 13.4, passant: [-20, 11.4], regard: 0 },
  { x: 26, z: 25.8, passant: [26, 23.4], regard: 0 },
  { x: -40, z: 25.8, passant: [-40, 23.4], regard: 0 },
]
const RETOUR = { x: 5, z: 13.2 }

export const useChronoMission = create<{ fin: number | null; distance: number | null; angle: number | null }>(() => ({ fin: null, distance: null, angle: null }))

function etatMission() {
  return useGame.getState().missions[ID_MISSION_TANK]
}

// Colonne lumineuse jaune (repère de GTA) : cylindre translucide et anneau au sol
function Colonne({ x, z, petite = false }: { x: number; z: number; petite?: boolean }) {
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
    [],
  )
  const anneau = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffd23a', transparent: true, opacity: 0.8, depthWrite: false }), [])
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) mat.opacity = 0.4 + Math.sin(clock.elapsedTime * 3) * 0.1
  })
  return (
    <group ref={ref} position={[x, 0, z]} scale={petite ? [0.25, 1, 0.25] : 1}>
      <mesh position={[0, 4, 0]} material={mat} renderOrder={2}>
        <cylinderGeometry args={[RAYON * 0.55, RAYON * 0.55, 8, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} material={anneau} renderOrder={2}>
        <ringGeometry args={[RAYON * 0.5, RAYON * 0.58, 32]} />
      </mesh>
    </group>
  )
}

export function MissionTank() {
  const etat = useGame((s) => s.missions[ID_MISSION_TANK])
  const immobile = useRef(0)

  useFrame(({ camera }, dt) => {
    const e = etatMission()
    const chrono = useChronoMission.getState()
    if (!e || e.etat !== 'active') {
      if (chrono.fin !== null || chrono.angle !== null) useChronoMission.setState({ fin: null, distance: null, angle: null })
      return
    }
    // Étape 0 : pas encore de chrono, mais la flèche guide vers le tank
    if (e.etape === 0) {
      const vx = RETOUR.x - camera.position.x
      const vz = RETOUR.z - camera.position.z
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      useChronoMission.setState({ distance: Math.round(Math.hypot(vx, vz)), angle: Math.atan2(vx, vz) - Math.atan2(dir.x, dir.z) })
      return
    }
    // Chrono : démarre en montant dans le tank (étape 1)
    if (e.etape >= 1 && chrono.fin === null) useChronoMission.setState({ fin: performance.now() + DUREE_MS })
    const fin = useChronoMission.getState().fin
    if (fin !== null && performance.now() > fin) {
      const s = useGame.getState()
      const missions = { ...s.missions }
      delete missions[ID_MISSION_TANK]
      s.set({ missions })
      s.notifier('mivtsaim.echec')
      useChronoMission.setState({ fin: null, distance: null })
      sauvegarder()
      return
    }
    if (e.etape < 1) return
    const cible = e.etape <= ARRETS.length ? ARRETS[e.etape - 1] : RETOUR
    const dans = conduite.active && conduite.vehicule === ID_MISSION_TANK
    const px = dans ? conduite.x : cible.x
    const pz = dans ? conduite.z : cible.z
    const d = Math.hypot(px - cible.x, pz - cible.z)
    // Flèche à l'écran : direction de la cible par rapport à la caméra
    const vx = cible.x - camera.position.x
    const vz = cible.z - camera.position.z
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const angle = Math.atan2(vx, vz) - Math.atan2(dir.x, dir.z)
    useChronoMission.setState({ distance: Math.round(Math.hypot(vx, vz)), angle })
    void d
    if (dans && d < RAYON && Math.abs(conduite.vitesse) < 1) immobile.current += dt
    else immobile.current = 0
    if (immobile.current >= ARRET_S) {
      immobile.current = 0
      if (e.etape <= ARRETS.length) {
        useGame.getState().notifier('mivtsaim.tefilines')
        evenementMission('interagir', `mivtsa-${e.etape}`)
      } else {
        evenementMission('interagir', 'retour-770')
      }
    }
  })

  const actif = etat?.etat === 'active'
  const etape = etat?.etape ?? 0
  const arret = actif && etape >= 1 && etape <= ARRETS.length ? ARRETS[etape - 1] : null
  return (
    <>
      {/* Responsable des mivtsaïm, sur le trottoir devant le tank : il confie la mission */}
      <PnjZal id="pnj-mivtsaim" position={[2.6, 0, 11.0]} rotationY={Math.PI} nomCle="mivtsaim.nom" repliqueCle="mivtsaim.repos" peau="#d2a07f" barbe="#2b1d14" />
      {arret && (
        <>
          <Colonne x={arret.x} z={arret.z} />
          <PnjZal
            key={`passant-${etape}`}
            id={`passant-mivtsa-${etape}`}
            position={[arret.passant[0], 0, arret.passant[1]]}
            rotationY={arret.regard}
            parle={false}
            peau="#c58f6c"
            barbe="#555"
          />
        </>
      )}
      {actif && etape > ARRETS.length && <Colonne x={RETOUR.x} z={RETOUR.z} />}
      {/* Où commencer : colonne sur le responsable, puis sur le tank */}
      {!etat && <Colonne x={2.6} z={11.0} petite />}
      {actif && etape === 0 && <Colonne x={RETOUR.x} z={RETOUR.z} />}
    </>
  )
}

// Chrono et distance affichés en haut de l'écran pendant la mission
export function ChronoMission() {
  const t = useT()
  const { fin, distance, angle } = useChronoMission()
  const ecran = useGame((s) => s.ecran)
  if ((fin === null && angle === null) || ecran !== 'jeu') return null
  return <ChronoAffiche t={t} fin={fin} distance={distance} angle={angle} />
}

function ChronoAffiche({ t, fin, distance, angle }: { t: ReturnType<typeof useT>; fin: number | null; distance: number | null; angle: number | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  // Mise à jour du texte sans re-rendu React à chaque image
  useEffect(() => {
    if (fin === null) return
    const id = window.setInterval(() => {
      const ms = Math.max(0, fin - performance.now())
      const mn = Math.floor(ms / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      if (ref.current) ref.current.textContent = `${mn}:${String(s).padStart(2, '0')}`
    }, 250)
    return () => window.clearInterval(id)
  }, [fin])
  return (
    <div className="chrono-mission" role="timer" aria-live="off">
      {fin !== null && <div className="chrono-titre">{t('mivtsaim.chrono')}</div>}
      {fin !== null && <span ref={ref} className="chrono-temps">5:00</span>}
      {angle !== null && (
        <div className="chrono-fleche" style={{ transform: `rotate(${-angle}rad)` }} aria-hidden="true">
          ▲
        </div>
      )}
      {distance !== null && <div className="chrono-distance">{t('mivtsaim.distance', { m: String(distance) })}</div>}
    </div>
  )
}
