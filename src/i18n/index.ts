import fr from './fr.json'
import he from './he.json'
import { useGame, type Langue } from '../state/store'

const dictionnaires: Record<Langue, Record<string, string>> = { fr, he }

function traduire(langue: Langue, cle: string, params?: Record<string, string>): string {
  let texte = dictionnaires[langue][cle] ?? dictionnaires.fr[cle] ?? cle
  if (params) for (const [k, v] of Object.entries(params)) texte = texte.replaceAll(`{${k}}`, v)
  return texte
}

// Hors composant React
export function t(cle: string, params?: Record<string, string>): string {
  return traduire(useGame.getState().langue, cle, params)
}

// Dans un composant React : se re-rend au changement de langue
export function useT() {
  const langue = useGame((s) => s.langue)
  return (cle: string, params?: Record<string, string>) => traduire(langue, cle, params)
}

export function appliquerLangue(langue: Langue) {
  document.documentElement.lang = langue
  document.documentElement.dir = langue === 'he' ? 'rtl' : 'ltr'
}
