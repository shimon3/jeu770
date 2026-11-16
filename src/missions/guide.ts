import { joueur, useGame, type EtatMission } from '../state/store'
import { ZONES } from '../world/zones'
import { MISSIONS, type Mission } from './missions'
import { COLLECTES, marque } from './collectes'

// Guide de mission (15/11/2026) : où aller maintenant ? Sert à la balise
// lumineuse dans le monde, à la distance du HUD et au plan (M).
// La mission du Mitzvah Tank a déjà sa flèche et ses colonnes : pas de balise.
const SANS_BALISE = new Set(['mitzvah-tank'])

export type Repere = { x: number; y: number; z: number; genre: 'etape' | 'donneur' }

// Mission affichée au HUD et guidée par la balise : la dernière commencée ou
// avancée si elle est encore en cours, sinon la première active du fichier.
// (16/11/2026 : avec deux missions en cours, le HUD restait sur la première
// et le compte des pièces ramassées ne s'affichait pas.)
export function choisirMission(missions: Record<string, EtatMission>, suivie: string | null): Mission | undefined {
  if (suivie && missions[suivie]?.etat === 'active') {
    const m = MISSIONS.find((x) => x.id === suivie)
    if (m) return m
  }
  const actives = MISSIONS.filter((m) => missions[m.id]?.etat === 'active')
  // Après un rechargement : une collecte déjà entamée passe d'abord
  return actives.find((m) => (missions[m.id].compte ?? 0) > 0) ?? actives[0]
}

export function missionSuivie(): Mission | undefined {
  const s = useGame.getState()
  return choisirMission(s.missions, s.missionSuivie)
}

// PNJ qui ont une mission à confier : aucune des leurs en cours, et il en
// reste une jamais commencée
export function donneursDisponibles(): string[] {
  const { missions } = useGame.getState()
  const res: string[] = []
  for (const id of new Set(MISSIONS.map((m) => m.donneur))) {
    const miennes = MISSIONS.filter((m) => m.donneur === id)
    if (miennes.some((m) => missions[m.id]?.etat === 'active')) continue
    if (miennes.some((m) => !missions[m.id])) res.push(id)
  }
  return res
}

const d2 = (x: number, z: number) => (x - joueur.position[0]) ** 2 + (z - joueur.position[2]) ** 2

export function repereMission(): Repere | null {
  const s = useGame.getState()
  const m = missionSuivie()
  if (m) {
    if (SANS_BALISE.has(m.id)) return null
    const etat = s.missions[m.id]
    const etape = m.etapes[etat.etape]
    if (!etape) return null
    if (etape.type === 'zone') {
      // Entrée de zone : le point de la boîte le plus proche du joueur
      let meilleur: Repere | null = null
      let dMin = Infinity
      for (const z of ZONES) {
        if (z.id !== etape.cible) continue
        const x = Math.min(z.max[0] - 0.5, Math.max(z.min[0] + 0.5, joueur.position[0]))
        const zz = Math.min(z.max[2] - 0.5, Math.max(z.min[2] + 0.5, joueur.position[2]))
        const d = d2(x, zz)
        if (d < dMin) {
          dMin = d
          meilleur = { x, y: z.min[1] + 1.2, z: zz, genre: 'etape' }
        }
      }
      return meilleur
    }
    if (etape.type === 'collecte') {
      // L'objet restant le plus proche
      let meilleur: Repere | null = null
      let dMin = Infinity
      for (const pt of COLLECTES[etape.cible] ?? []) {
        if (s.inventaire.includes(marque(pt.id))) continue
        const d = d2(pt.p[0], pt.p[2])
        if (d < dMin) {
          dMin = d
          meilleur = { x: pt.p[0], y: Math.max(pt.p[1], 1.2), z: pt.p[2], genre: 'etape' }
        }
      }
      return meilleur
    }
    const it = s.interactifs.get(etape.cible)
    return it ? { x: it.position[0], y: it.position[1], z: it.position[2], genre: 'etape' } : null
  }
  // Pas de mission en cours : le donneur disponible le plus proche
  let meilleur: Repere | null = null
  let dMin = Infinity
  for (const id of donneursDisponibles()) {
    const it = s.interactifs.get(id)
    if (!it) continue
    const d = d2(it.position[0], it.position[2])
    if (d < dMin) {
      dMin = d
      meilleur = { x: it.position[0], y: it.position[1], z: it.position[2], genre: 'donneur' }
    }
  }
  return meilleur
}

export function distanceRepere(r: Repere): number {
  return Math.round(Math.hypot(r.x - joueur.position[0], r.z - joueur.position[2]))
}

// Rang du joueur selon le nombre de missions terminées (clés i18n rang.N)
export function rang(): { n: number; total: number; cle: string } {
  const { missions } = useGame.getState()
  const n = MISSIONS.filter((m) => missions[m.id]?.etat === 'terminee').length
  const total = MISSIONS.length
  const palier = n >= total ? 3 : n >= 6 ? 2 : n >= 3 ? 1 : 0
  return { n, total, cle: `rang.${palier}` }
}
