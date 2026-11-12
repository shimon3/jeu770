import { useGame } from '../state/store'
import { sauvegarder } from './missions'
import { t } from '../i18n'

// Dollars et magasin (demande de Samuel, 12/11/2026) : chaque mission
// terminée rapporte un dollar ; on dépense ses dollars au kiosque (ou depuis
// le compteur en haut à droite).
export const DOLLARS_DEPART = 5
export const RECOMPENSE_MISSION = 1

export const ARTICLES = [
  { id: 'siddour', prix: 5, icone: '📖' },
  { id: 'tehilim', prix: 3, icone: '📗' },
  { id: 'tsedaka', prix: 1, icone: '🪙' },
] as const

export function recompenserMission() {
  const s = useGame.getState()
  s.set({ dollars: s.dollars + RECOMPENSE_MISSION, inventaire: [...s.inventaire, 'dollar'] })
  s.notifier('boutique.recompense', { n: String(RECOMPENSE_MISSION) })
}

export function acheter(id: string) {
  const s = useGame.getState()
  const a = ARTICLES.find((x) => x.id === id)
  if (!a) return false
  if (s.dollars < a.prix) {
    s.notifier('boutique.pasAssez')
    return false
  }
  s.set({ dollars: s.dollars - a.prix, inventaire: [...s.inventaire, a.id] })
  s.notifier('boutique.achete', { objet: t(`boutique.${a.id}`) })
  sauvegarder()
  return true
}
