import { useGame } from '../state/store'
import { sauvegarder } from './missions'
import { recompenserMission } from './boutique'

// Livraisons de pizza (demande de Samuel, 15/11/2026 : « plus d'argent ») :
// activité répétable lancée à la pizzeria. On apporte la pizza au client
// (à pied ou en voiture) : +3 $, et +1 $ de pourboire si c'est en moins de 60 s.
export const GAIN_LIVRAISON = 3
export const POURBOIRE = 1
export const DELAI_POURBOIRE = 60 // secondes

// Points de livraison sur le trottoir nord (allée des passants)
export const DESTINATIONS: { cle: string; x: number; z: number }[] = [
  { cle: 'livraison.lieu.770', x: 0.5, z: 8.7 },
  { cle: 'livraison.lieu.kiosque', x: -13, z: 9.2 },
  { cle: 'livraison.lieu.bibliotheque', x: 22, z: 8.6 },
  { cle: 'livraison.lieu.bus', x: -28.2, z: 9.2 },
  { cle: 'livraison.lieu.bout', x: -37, z: 8.7 },
  { cle: 'livraison.lieu.784', x: -32, z: 8.7 },
]

let derniere = -1

export function commencerLivraison() {
  const s = useGame.getState()
  if (s.livraison) return
  let i = Math.floor(Math.random() * DESTINATIONS.length)
  if (i === derniere) i = (i + 1) % DESTINATIONS.length
  derniere = i
  s.set({ livraison: { dest: i, debut: Date.now() }, panneau: null })
  s.notifier('livraison.depart')
}

export function livrer() {
  const s = useGame.getState()
  const l = s.livraison
  if (!l) return
  const rapide = (Date.now() - l.debut) / 1000 < DELAI_POURBOIRE
  s.set({ livraison: null, inventaire: [...s.inventaire, 'livraison'] })
  recompenserMission(GAIN_LIVRAISON + (rapide ? POURBOIRE : 0), rapide ? 'livraison.payeePourboire' : 'livraison.payee')
  sauvegarder()
}

export function abandonnerLivraison() {
  useGame.getState().set({ livraison: null })
}
