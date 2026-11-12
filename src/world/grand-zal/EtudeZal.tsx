import { ZAL } from '../../config/grandZal'
import { PnjZal } from '../../npc/PnjZal'

// Hommes qui étudient ensemble (havrouta) : groupes de 4 autour des tables
// de l'aile ouest et binômes assis sur les bancs, tournés l'un vers l'autre,
// avec un léger balancement d'étude. Positions vérifiées par pointAutorise
// (PnjZal) : aucun ne s'approche de la place vide.
// Les places assises du joueur aux tables (x - 0,6) et aux bouts des bancs
// de l'allée centrale (z ≈ -16) restent libres.

const S = ZAL.sol
const TOURNE = 0.5 // rotation vers le partenaire, sur les bancs

type Etudiant = { id: string; x: number; z: number; r: number; peau?: string; barbe?: string }

const PEAUX = ['#c99878', '#d2a07f', '#c58f6c', '#b98466', '#d9b08f', '#cf9d7c']
const BARBES = ['#4a3626', '#2b1d14', '#6b6b6b', '#1f1712', '#8a6a4a', '#3a2a1e', '#555']

function construire(): Etudiant[] {
  const res: Omit<Etudiant, 'id' | 'peau' | 'barbe'>[] = []
  // Tables (z = -25,6) : banc sud z - 0,8 (regard +z), banc nord z + 0,8 (regard -z)
  for (const x of [-1.0, 7.0])
    for (const dx of [0.2, 1.0]) {
      res.push({ x: x + dx, z: -26.4, r: 0 })
      res.push({ x: x + dx, z: -24.8, r: Math.PI })
    }
  // Partenaire de l'étudiant déjà assis à la table du milieu (3,6 ; -26,4)
  res.push({ x: 3.6, z: -24.8, r: Math.PI })
  // Binômes sur les bancs (regard +x), tournés l'un vers l'autre
  for (const [x, z] of [
    [12.6, -6.4],
    [15.0, -12.2],
    [16.2, -19.0],
    [18.6, -24.4],
    [30.8, -12.6],
    [33.2, -19.4],
  ] as const) {
    res.push({ x, z, r: Math.PI / 2 + TOURNE })
    res.push({ x, z: z - 0.7, r: Math.PI / 2 - TOURNE })
  }
  return res.map((e, i) => ({ ...e, id: `etude-${i + 1}`, peau: PEAUX[i % PEAUX.length], barbe: BARBES[(i * 3) % BARBES.length] }))
}

export const ETUDIANTS_ZAL = construire()

export function EtudeZal() {
  return (
    <>
      {ETUDIANTS_ZAL.map((e) => (
        <PnjZal key={e.id} id={e.id} position={[e.x, S, e.z]} rotationY={e.r} etat="assis" etude parle={false} peau={e.peau} barbe={e.barbe} />
      ))}
    </>
  )
}
