import donnees from '../config/missions.json'
import { joueur, useGame } from '../state/store'
import { t } from '../i18n'
import { ecrireSauvegarde } from './sauvegarde'

export type Etape = { type: 'interagir' | 'zone'; cible: string; texte: string }
export type Mission = {
  id: string
  titre: string
  description: string
  donneur: string
  etapes: Etape[]
}

export const MISSIONS = donnees.missions as Mission[]

export function mission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id)
}

export function sauvegarder(): boolean {
  const s = useGame.getState()
  return ecrireSauvegarde({
    missions: s.missions,
    inventaire: s.inventaire,
    langue: s.langue,
    son: s.son,
    position: [...joueur.position],
    yaw: joueur.yaw,
  })
}

export function demarrerMission(id: string) {
  const s = useGame.getState()
  const m = mission(id)
  if (!m || s.missions[id]) return
  s.set({ missions: { ...s.missions, [id]: { etat: 'active', etape: 0 } } })
  s.notifier('mission.nouvelle', { titre: t(m.titre) })
  sauvegarder()
}

// Signale un événement de jeu ; fait avancer toute mission dont l'étape
// courante correspond.
export function evenementMission(type: Etape['type'], cible: string) {
  const s = useGame.getState()
  let change = false
  const suivant = { ...s.missions }
  for (const [id, etat] of Object.entries(s.missions)) {
    if (etat.etat !== 'active') continue
    const m = mission(id)
    const etape = m?.etapes[etat.etape]
    if (!m || !etape || etape.type !== type || etape.cible !== cible) continue
    change = true
    if (etat.etape + 1 >= m.etapes.length) {
      suivant[id] = { etat: 'terminee', etape: m.etapes.length }
      s.notifier('mission.terminee', { titre: t(m.titre) })
    } else {
      suivant[id] = { etat: 'active', etape: etat.etape + 1 }
      s.notifier('mission.etape')
    }
  }
  if (change) {
    s.set({ missions: suivant })
    sauvegarder()
  }
}
