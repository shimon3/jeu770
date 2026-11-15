import { useGame } from '../state/store'
import { sauvegarder } from './missions'
import { zoneParId } from '../world/zones'

// Usage des objets achetés au kiosque (demande de Samuel, 15/11/2026) :
// - siddour : prier à la bimah du grand Zal (BimahZal.tsx) ;
// - Tehilim : réciter les chapitres du jour dans un lieu de calme (bouton du HUD) ;
// - pièce de tsedaka : la glisser dans la pouchké du hall d'entrée (Hall.tsx).
// Les compteurs (prières, Tehilim, dons) sont gardés dans l'inventaire sous
// forme d'entrées 'priere', 'tehilim-lu' et 'don', déjà sauvegardées.

export const possede = (id: string) => useGame.getState().inventaire.includes(id)
export const compter = (inv: string[], id: string) => inv.filter((i) => i === id).length

function ajouter(id: string) {
  const s = useGame.getState()
  s.set({ inventaire: [...s.inventaire, id] })
  sauvegarder()
}

export function prierBimah() {
  if (!possede('siddour')) return false
  ajouter('priere')
  useGame.getState().set({ panneau: { type: 'priere' } })
  return true
}

export function peutReciterTehilim() {
  const s = useGame.getState()
  return s.inventaire.includes('tehilim') && !!zoneParId(s.zone)?.calme
}

export function reciterTehilim() {
  if (!peutReciterTehilim()) return false
  ajouter('tehilim-lu')
  useGame.getState().set({ panneau: { type: 'tehilim' } })
  return true
}

export function donnerTsedaka() {
  const s = useGame.getState()
  const i = s.inventaire.indexOf('tsedaka')
  if (i < 0) {
    s.set({ panneau: { type: 'message', cle: 'pouchke.sansPiece' } })
    return false
  }
  const inv = [...s.inventaire]
  inv.splice(i, 1, 'don')
  s.set({ inventaire: inv })
  sauvegarder()
  s.notifier('pouchke.merci', { n: String(compter(inv, 'don')) })
  return true
}
