import { useMemo } from 'react'
import * as THREE from 'three'
import { ABORDS } from '../../config/dimensions'
import { ENTREE, ZAL } from '../../config/grandZal'
import { Invisible, Pieces, type Piece, type V3 } from '../primitives'
import { useInteractif } from '../interaction'
import { useMateriaux } from '../materiaux'
import { textureTexte } from '../texturesProcedurales'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { evenementMission } from '../../missions/missions'

// Profil d'Eastern Parkway devant le 770 : trottoir, contre-allée, terre-plein
// planté, chaussée centrale. Largeurs ESTIMÉES (voir dimensions.ts).
const A = ABORDS
const Z_TROTTOIR = A.profondeurCour + A.murEpaisseur
const Z_CONTRE = Z_TROTTOIR + A.largeurTrottoir
const Z_TERRE = Z_CONTRE + A.largeurContreAllee
const Z_CHAUSSEE = Z_TERRE + A.largeurTerrePlein
const Z_FIN = Z_CHAUSSEE + A.largeurChaussee
const L = 120

export function arbre(x: number, z: number, h = 7, y = 0): Piece[] {
  const pc: Piece[] = [{ geo: new THREE.CylinderGeometry(0.16, 0.24, h * 0.55, 7), p: [x, y + h * 0.275, z], m: 'tronc' }]
  const blobs: [number, number, number, number][] = [
    [0, 0.72, 0, 0.32],
    [0.25, 0.62, 0.15, 0.24],
    [-0.22, 0.66, -0.12, 0.25],
    [0.05, 0.86, -0.05, 0.22],
  ]
  for (const [dx, hy, dz, r] of blobs)
    pc.push({ geo: new THREE.IcosahedronGeometry(r * h, 1), p: [x + dx * h, y + hy * h, z + dz * h], m: 'feuillage' })
  return pc
}

function lampadaire(x: number, z: number): Piece[] {
  // Lampadaire de style historique, fût vert (photo Clio)
  return [
    { geo: new THREE.CylinderGeometry(0.2, 0.26, 0.6, 10), p: [x, 0.3, z], m: 'vertLampadaire' },
    { geo: new THREE.CylinderGeometry(0.07, 0.1, 4.0, 8), p: [x, 2.6, z], m: 'vertLampadaire' },
    { geo: new THREE.CylinderGeometry(0.22, 0.12, 0.55, 8), p: [x, 4.85, z], m: 'vitreEclairee', ombre: false },
    { geo: new THREE.ConeGeometry(0.28, 0.3, 8), p: [x, 5.27, z], m: 'vertLampadaire' },
  ]
}

function voiture(x: number, z: number, couleur: number): Piece[] {
  const m = (['voiture0', 'voiture1', 'voiture2', 'voiture3'] as const)[couleur % 4]
  return [
    { t: [4.4, 0.75, 1.8], p: [x, -0.15 + 0.6, z], m, col: true },
    { t: [2.4, 0.6, 1.6], p: [x - 0.2, -0.15 + 1.25, z], m: 'vitre' },
    ...[-1.4, 1.4].flatMap((dx) =>
      [-0.85, 0.85].map((dz) => ({ geo: new THREE.CylinderGeometry(0.33, 0.33, 0.22, 12), p: [x + dx, -0.15 + 0.33, z + dz] as V3, r: [Math.PI / 2, 0, 0] as V3, m: 'noir' as const })),
    ),
  ]
}

function banc(x: number, z: number, rotY: number): Piece[] {
  const c = Math.cos(rotY)
  const s = Math.sin(rotY)
  // Repère local du banc : assise le long de x, dossier vers -z
  const loc = (lx: number, ly: number, lz: number): V3 => [x + lx * c + lz * s, ly, z - lx * s + lz * c]
  const pc: Piece[] = [
    { t: [1.9, 0.06, 0.45], p: loc(0, 0.45, 0), r: [0, rotY, 0], m: 'bancBois', col: true },
    { t: [1.9, 0.4, 0.05], p: loc(0, 0.72, -0.24), r: [0, rotY, 0], m: 'bancBois' },
  ]
  for (const lx of [-0.8, 0.8]) pc.push({ t: [0.06, 0.45, 0.4], p: loc(lx, 0.22, 0), r: [0, rotY, 0], m: 'fer' })
  return pc
}

export function Rue() {
  const pieces = useMemo(() => {
    const pc: Piece[] = []
    // Sols
    pc.push({ t: [L, 0.4, A.largeurTrottoir + 0.01], p: [0, -0.2, (Z_TROTTOIR + Z_CONTRE) / 2], m: 'trottoir', col: true })
    pc.push({ t: [L, 0.4, A.largeurContreAllee], p: [0, -0.2 - A.bordure, (Z_CONTRE + Z_TERRE) / 2], m: 'asphalte', col: true })
    pc.push({ t: [L, 0.4, A.largeurTerrePlein], p: [0, -0.2, (Z_TERRE + Z_CHAUSSEE) / 2], m: 'trottoir', col: true })
    pc.push({ t: [L, 0.4, A.largeurChaussee], p: [0, -0.2 - A.bordure, (Z_CHAUSSEE + Z_FIN) / 2], m: 'asphalte', col: true })
    // Sol devant les parcelles voisines. À droite (784-788), il est percé
    // pour la courette de l'escalier du grand Zal et s'arrête à la façade
    // (le Zal est dessous).
    pc.push({ t: [L / 2 - 9.4, 0.4, 12], p: [-(9.4 + (L / 2 - 9.4) / 2), -0.2, Z_TROTTOIR - 6], m: 'trottoir', col: true })
    const solDroit = (x0: number, x1: number, z0: number, z1: number) =>
      pc.push({ t: [x1 - x0, 0.4, z1 - z0], p: [(x0 + x1) / 2, -0.2, (z0 + z1) / 2], m: 'trottoir', col: true })
    solDroit(9.4, L / 2, ENTREE.z1, Z_TROTTOIR)
    solDroit(9.4, ENTREE.hautMarches, ENTREE.z0, ENTREE.z1)
    solDroit(ENTREE.x1, L / 2, ENTREE.z0, ENTREE.z1)
    solDroit(ZAL.x1 + 0.3, L / 2, Z_TROTTOIR - 12, ENTREE.z0)
    // Bordures de granit
    for (const z of [Z_CONTRE, Z_TERRE, Z_CHAUSSEE]) pc.push({ t: [L, 0.3, 0.18], p: [0, -0.12, z], m: 'pierre' })
    // Au-delà : terre-plein, contre-allée et immeubles du côté sud (décor)
    pc.push({ t: [L, 0.4, 6], p: [0, -0.2, Z_FIN + 3], m: 'trottoir' })
    pc.push({ t: [L, 0.4, 7], p: [0, -0.35, Z_FIN + 9.5], m: 'asphalte' })
    pc.push({ t: [L, 0.4, 6], p: [0, -0.2, Z_FIN + 16], m: 'trottoir' })
    for (let i = -5; i <= 5; i++) {
      const h = 9 + ((i * 7919) % 5) * 2
      pc.push({ t: [11, h, 12], p: [i * 11.5, h / 2, Z_FIN + 25], m: i % 2 ? 'briqueVoisin' : 'briqueVoisinClaire' })
    }
    // Arbres d'alignement : bord du trottoir et terre-plein
    for (const x of [-26, -16, 12, 22]) pc.push(...arbre(x, Z_CONTRE - 0.9, 8))
    for (let x = -48; x <= 48; x += 9) pc.push(...arbre(x + 2, (Z_TERRE + Z_CHAUSSEE) / 2, 9))
    for (let x = -48; x <= 48; x += 11) pc.push(...arbre(x, Z_FIN + 3, 8))
    // Lampadaires
    for (const x of [-14, -4.5, 6.5, 17]) pc.push(...lampadaire(x, Z_CONTRE - 0.45))
    for (const x of [-20, 0, 20]) pc.push(...lampadaire(x, Z_TERRE + 0.8))
    // Voitures garées le long de la contre-allée (aucune derrière le point de départ)
    ;[-21, -15, 21, 27, 33].forEach((x, i) => pc.push(...voiture(x, Z_CONTRE + 1.2, i)))
    // Bancs du terre-plein (décor)
    for (const x of [-12, -3, 8]) pc.push(...banc(x, Z_TERRE + 1.0, 0))
    return pc
  }, [])

  return (
    <>
      <Pieces pieces={pieces} />
      <SolLointain />
      {/* Limites de la zone jouable */}
      <Invisible taille={[L, 6, 0.3]} position={[0, 3, Z_CHAUSSEE - 0.2]} />
      <Invisible taille={[0.3, 6, Z_CHAUSSEE + 4]} position={[-40, 3, Z_CHAUSSEE / 2 - 2]} />
      <Invisible taille={[0.3, 6, Z_CHAUSSEE + 4]} position={[40, 3, Z_CHAUSSEE / 2 - 2]} />
      <PanneauHistoire />
      <BancInteractif id="banc-gauche" x={-5.2} z={Z_TROTTOIR + 0.45} />
      <BancInteractif id="banc-droite" x={4.8} z={Z_TROTTOIR + 0.45} />
    </>
  )
}

function SolLointain() {
  const m = useMateriaux()
  // Plan de fond percé au-dessus du grand Zal et de la courette d'accès
  // (forme dans le plan x / -z, couchée par la rotation)
  const geo = useMemo(() => {
    const f = new THREE.Shape()
    f.moveTo(-200, -200)
    f.lineTo(200, -200)
    f.lineTo(200, 200)
    f.lineTo(-200, 200)
    f.closePath()
    const trou = new THREE.Path()
    const pts: [number, number][] = [
      [ZAL.shalashX0 - 0.5, ZAL.z1 + 0.1],
      [ENTREE.hautMarches, ZAL.z1 + 0.1],
      [ENTREE.hautMarches, ENTREE.z1],
      [ENTREE.x1, ENTREE.z1],
      [ENTREE.x1, ZAL.z1 + 0.1],
      [ZAL.x1 + 0.5, ZAL.z1 + 0.1],
      [ZAL.x1 + 0.5, ZAL.z0 - 0.5],
      [ZAL.shalashX0 - 0.5, ZAL.z0 - 0.5],
    ]
    pts.forEach(([x, z], i) => (i ? trou.lineTo(x, -z) : trou.moveTo(x, -z)))
    trou.closePath()
    f.holes.push(trou)
    return new THREE.ShapeGeometry(f)
  }, [])
  return <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} material={m.herbe} receiveShadow />
}

// Banc devant le muret (photo Clio) : on peut s'y asseoir
function BancInteractif({ id, x, z }: { id: string; x: number; z: number }) {
  const pieces = useMemo(() => banc(x, z, 0), [x, z])
  useInteractif(id, [x, 0.6, z + 0.3], 1.4, () => t('action.asseoir'), () => {
    useGame.getState().set({ siege: { position: [x, 0, z + 0.02], rotationY: 0 } })
    useGame.getState().notifier('message.leverDebout')
  })
  return <Pieces pieces={pieces} />
}

// Panneau d'information sur l'histoire du 770
function PanneauHistoire() {
  const x = 2.6
  const z = Z_TROTTOIR + 0.9
  const pieces = useMemo<Piece[]>(
    () => [
      { t: [0.08, 1.2, 0.08], p: [x - 0.5, 0.6, z], m: 'fer', col: true },
      { t: [0.08, 1.2, 0.08], p: [x + 0.5, 0.6, z], m: 'fer', col: true },
      { t: [1.2, 0.8, 0.05], p: [x, 1.55, z], r: [-0.12, 0, 0], m: 'panneauBleu' },
    ],
    [],
  )
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textureTexte('770 — 1920', 512, 320, '#23405f', '#f2e9d0', 'bold 70px Inter, sans-serif'), roughness: 0.6 }),
    [],
  )
  useInteractif('panneau-histoire', [x, 1.3, z + 0.3], 1.8, () => t('action.lirePanneau'), () => {
    useGame.getState().set({ panneau: { type: 'histoire' } })
    evenementMission('interagir', 'panneau-histoire')
  })
  return (
    <>
      <Pieces pieces={pieces} />
      <mesh position={[x, 1.555, z + 0.03]} rotation={[-0.12, 0, 0]} material={mat}>
        <planeGeometry args={[1.1, 0.7]} />
      </mesh>
    </>
  )
}
