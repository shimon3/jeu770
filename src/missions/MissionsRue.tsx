import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { joueur, useGame } from '../state/store'
import { PnjZal } from '../npc/PnjZal'
import { useInteractif } from '../world/interaction'
import { useMateriaux } from '../world/materiaux'
import { textureBandeau } from '../world/texturesProcedurales'
import { t } from '../i18n'
import { evenementMission, MISSIONS, sauvegarder } from './missions'
import { COLLECTES, marque, type PointCollecte } from './collectes'
import { donneursDisponibles, repereMission } from './guide'

// Missions de la rue (15/11/2026) : un jeune chalia'h confie trois missions
// (pièces de tsedaka, affiches du farbrenguen, plaques du 770). Ce fichier
// porte aussi la balise lumineuse qui guide vers l'étape en cours et le
// repère doré au-dessus des PNJ qui ont une mission à donner.

const OR = '#ffd23a'

// Flèche de suivi en volume (16/11/2026) : pointe vers le bas, biseautée,
// dorée et légèrement lumineuse. Remplace le losange plat.
const FLECHE = (() => {
  const f = new THREE.Shape()
  f.moveTo(0, -0.5)
  f.lineTo(0.36, -0.04)
  f.lineTo(0.15, -0.04)
  f.lineTo(0.15, 0.5)
  f.lineTo(-0.15, 0.5)
  f.lineTo(-0.15, -0.04)
  f.lineTo(-0.36, -0.04)
  f.closePath()
  const g = new THREE.ExtrudeGeometry(f, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 2 })
  g.translate(0, 0, -0.07)
  return g
})()
const MAT_FLECHE = new THREE.MeshStandardMaterial({ color: OR, emissive: '#c98a00', emissiveIntensity: 0.9, metalness: 0.55, roughness: 0.28 })

// Étape de collecte en cours pour ce groupe d'objets ?
function useCollecteActive(groupe: string) {
  return useGame((s) =>
    MISSIONS.some((m) => {
      const e = s.missions[m.id]
      const etape = e?.etat === 'active' ? m.etapes[e.etape] : undefined
      return etape?.type === 'collecte' && etape.cible === groupe
    }),
  )
}

function ramasser(pt: PointCollecte, groupe: string) {
  const s = useGame.getState()
  if (s.inventaire.includes(marque(pt.id))) return
  s.set({ inventaire: [...s.inventaire, marque(pt.id)] })
  evenementMission('collecte', groupe)
}

// Pièces de tsedaka : tournent sur place, ramassées en passant dessus. La
// dernière donne une pièce à glisser dans le pouchké du hall.
function Pieces() {
  const active = useCollecteActive('piece')
  const inventaire = useGame((s) => s.inventaire)
  const groupe = useRef<THREE.Group>(null)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8b923', metalness: 1, roughness: 0.25, emissive: '#a06a00', emissiveIntensity: 0.9 }), [])
  const restantes = COLLECTES.piece.filter((p) => !inventaire.includes(marque(p.id)))
  useFrame(({ clock }) => {
    if (!active || !groupe.current) return
    const tps = clock.elapsedTime
    for (const o of groupe.current.children) {
      o.rotation.y = tps * 2.4
      o.position.y = o.userData.y + Math.sin(tps * 2 + o.position.x) * 0.08
    }
    for (const pt of restantes) {
      if (Math.hypot(pt.p[0] - joueur.position[0], pt.p[2] - joueur.position[2]) > 1.1) continue
      ramasser(pt, 'piece')
      const s = useGame.getState()
      // Toutes ramassées : une pièce de tsedaka pour le pouchké
      if (COLLECTES.piece.every((p) => s.inventaire.includes(marque(p.id)))) s.set({ inventaire: [...s.inventaire, 'tsedaka'] })
      break
    }
  })
  if (!active) return null
  return (
    <group ref={groupe}>
      {restantes.map((pt) => (
        <mesh key={pt.id} position={pt.p} userData={{ y: pt.p[1] }} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.035, 20]} />
        </mesh>
      ))}
    </group>
  )
}

// Panneau d'affichage sur deux poteaux ; pendant la mission, E y colle
// l'annonce du farbrenguen (texte seul, aucun portrait)
function PanneauAffichage({ pt, matAffiche }: { pt: PointCollecte; matAffiche: THREE.Material }) {
  const m = useMateriaux()
  const active = useCollecteActive('affiche')
  const posee = useGame((s) => s.inventaire.includes(marque(pt.id)))
  const [x, , z] = pt.p
  useInteractif(pt.id, [x, 1.3, z + 0.5], active && !posee ? 1.8 : 0, () => t('action.collerAffiche'), () => ramasser(pt, 'affiche'))
  return (
    <group position={[x, 0, z]}>
      {[-0.62, 0.62].map((dx) => (
        <mesh key={dx} position={[dx, 1.0, 0]} material={m.vertLampadaire} castShadow>
          <boxGeometry args={[0.07, 2.0, 0.07]} />
        </mesh>
      ))}
      <mesh position={[0, 1.45, 0]} material={m.vertLampadaire} castShadow>
        <boxGeometry args={[1.4, 1.0, 0.06]} />
      </mesh>
      <mesh position={[0, 1.45, 0.035]} material={m.liege}>
        <boxGeometry args={[1.26, 0.86, 0.01]} />
      </mesh>
      {posee && (
        <mesh position={[0, 1.45, 0.045]} material={matAffiche}>
          <planeGeometry args={[0.72, 0.72]} />
        </mesh>
      )}
    </group>
  )
}

function Affiches() {
  const matAffiche = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: textureBandeau(
          [
            { texte: 'פארברענגען', police: 'bold 96px "Heebo", "Arial Hebrew", sans-serif', encre: '#8a1c1c' },
            { texte: 'הערב ב־770', police: 'bold 64px "Heebo", "Arial Hebrew", sans-serif' },
            { texte: 'FARBRENGEN TONIGHT', police: 'bold 40px "Inter", Arial, sans-serif' },
          ],
          512,
          512,
          '#f6f1e4',
          '#14213d',
        ),
        roughness: 0.9,
      }),
    [],
  )
  return (
    <>
      {COLLECTES.affiche.map((pt) => (
        <PanneauAffichage key={pt.id} pt={pt} matAffiche={matAffiche} />
      ))}
    </>
  )
}

// Balise : colonne dorée et losange flottant au-dessus de la prochaine étape
function Balise() {
  const groupe = useRef<THREE.Group>(null)
  const losange = useRef<THREE.Mesh>(null)
  const colonne = useMemo(() => new THREE.MeshBasicMaterial({ color: OR, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }), [])
  const horloge = useRef(0)
  useFrame(({ clock }, dt) => {
    const g = groupe.current
    if (!g) return
    horloge.current -= dt
    if (horloge.current <= 0) {
      horloge.current = 0.2
      const s = useGame.getState()
      const r = s.ecran === 'jeu' ? repereMission() : null
      // Tout près, la balise s'efface : l'invite « E » prend le relais
      const proche = r ? Math.hypot(r.x - joueur.position[0], r.z - joueur.position[2]) < 2.2 && Math.abs(r.y - joueur.position[1]) < 2.5 : false
      g.visible = !!r && !proche
      if (r) g.position.set(r.x, r.y, r.z)
    }
    if (!g.visible) return
    const tps = clock.elapsedTime
    colonne.opacity = 0.22 + Math.sin(tps * 3) * 0.08
    if (losange.current) {
      losange.current.rotation.y = tps * 1.6
      losange.current.position.y = 1.35 + Math.sin(tps * 2.2) * 0.14
    }
  })
  return (
    <group ref={groupe} visible={false}>
      <mesh position={[0, 1.2, 0]} material={colonne} renderOrder={3}>
        <cylinderGeometry args={[0.32, 0.32, 4.8, 20, 1, true]} />
      </mesh>
      <mesh ref={losange} position={[0, 1.15, 0]} material={MAT_FLECHE} geometry={FLECHE} scale={0.95} />
    </group>
  )
}

// Repère doré au-dessus des PNJ qui ont une mission à confier
function ReperesDonneurs() {
  const missions = useGame((s) => s.missions)
  const interactifs = useGame((s) => s.interactifs)
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => setIds(donneursDisponibles()), [missions])
  const groupe = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!groupe.current) return
    const tps = clock.elapsedTime
    for (const o of groupe.current.children) {
      o.rotation.y = tps * 2
      o.position.y = o.userData.y + Math.sin(tps * 2.5) * 0.06
    }
  })
  return (
    <group ref={groupe}>
      {ids.map((id) => {
        const it = interactifs.get(id)
        if (!it) return null
        const y = it.position[1] + 0.95
        return (
          <mesh key={id} position={[it.position[0], y + 0.1, it.position[2]]} userData={{ y: y + 0.1 }} material={MAT_FLECHE} geometry={FLECHE} scale={0.42} />
        )
      })}
    </group>
  )
}

export function MissionsRue() {
  // La collecte se sauvegarde au fil de l'eau (inventaire)
  const inventaire = useGame((s) => s.inventaire)
  const premier = useRef(true)
  useEffect(() => {
    if (premier.current) premier.current = false
    else if (useGame.getState().ecran === 'jeu') sauvegarder()
  }, [inventaire])
  return (
    <>
      <PnjZal id="pnj-chaliah" position={[-13, 0, 5.6]} rotationY={0} nomCle="chaliah.nom" repliqueCle="chaliah.repos" peau="#d6a586" barbe="#3a2a1e" />
      <Pieces />
      <Affiches />
      <Balise />
      <ReperesDonneurs />
    </>
  )
}
