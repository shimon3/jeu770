import { useGame } from '../state/store'
import { sauvegarder } from './missions'
import { zoneParId } from '../world/zones'
import { dateNewYork, tefilaDuMoment } from '../world/zmanim'
import { RECOMPENSE_MISSION } from './boutique'

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

// Une récompense par prière (Cha'harit, Min'ha, Arvit) et par jour à New
// York, et une par jour pour les Tehilim : entrée 'fait:<clé>' dans l'inventaire
function recompenserUneFois(cle: string, texte: string) {
  const s = useGame.getState()
  const marque = `fait:${cle}`
  if (s.inventaire.includes(marque)) return false
  s.set({ dollars: s.dollars + RECOMPENSE_MISSION, inventaire: [...s.inventaire, marque] })
  s.notifier(texte, { n: String(RECOMPENSE_MISSION) })
  return true
}

function jourNY() {
  const { a, m, j } = dateNewYork()
  return `${a}-${m}-${j}`
}

export function prierBimah() {
  if (!possede('siddour')) return false
  const s = useGame.getState()
  if (s.priere) return true
  s.set({ priere: 'priere' })
  ajouter('priere')
  if (!recompenserUneFois(`priere:${jourNY()}:${tefilaDuMoment()}`, 'priere.recompense')) s.notifier('priere.dejaCompte')
  sauvegarder()
  return true
}

export function peutReciterTehilim() {
  const s = useGame.getState()
  return s.inventaire.includes('tehilim') && !!zoneParId(s.zone)?.calme
}

export function reciterTehilim() {
  if (!peutReciterTehilim()) return false
  const s = useGame.getState()
  if (s.priere) return true
  s.set({ priere: 'tehilim' })
  ajouter('tehilim-lu')
  recompenserUneFois(`tehilim:${jourNY()}`, 'tehilim.recompense')
  sauvegarder()
  return true
}

export function terminerPriere() {
  useGame.getState().set({ priere: null })
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
