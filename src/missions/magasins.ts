import { useGame } from '../state/store'
import { sauvegarder } from './missions'
import { t } from '../i18n'

// Magasins juifs d'Eastern Parkway (demande de Samuel, 15/11/2026). Choix de
// jeu : en réalité ces commerces sont sur Kingston Avenue, juste au coin ;
// ici ils sont alignés sur Eastern Parkway, après le 784-788. Noms
// génériques (aucune enseigne réelle). Prix en dollars du jeu (1 $ par mission).
// 'manger' : consommé tout de suite, avec la berakha ; 'objet' : va dans l'inventaire.
export type Article = { id: string; prix: number; icone: string; type: 'manger' | 'objet'; berakha?: string }
export type Magasin = { id: string; enseigne: [string, string]; couleur: string; encre: string; articles: Article[] }

export const MAGASINS: Magasin[] = [
  {
    id: 'pizzeria',
    enseigne: ['PIZZA', 'פיצה כשרה'],
    couleur: '#9e2a2b',
    encre: '#fff4e0',
    articles: [
      { id: 'pizza', prix: 2, icone: '🍕', type: 'manger', berakha: 'berakha.pizza' },
      { id: 'knish', prix: 1, icone: '🥟', type: 'manger', berakha: 'berakha.mezonot' },
    ],
  },
  {
    id: 'glacier',
    enseigne: ['ICE CREAM', 'גלידה'],
    couleur: '#e7a4b8',
    encre: '#4a1830',
    articles: [
      { id: 'glace', prix: 1, icone: '🍦', type: 'manger', berakha: 'berakha.chehakol' },
      { id: 'milkshake', prix: 2, icone: '🥤', type: 'manger', berakha: 'berakha.chehakol' },
    ],
  },
  {
    id: 'vetements',
    enseigne: ['CLOTHING', 'ביגוד'],
    couleur: '#1f3a5f',
    encre: '#f2e9d0',
    articles: [
      { id: 'gartel', prix: 2, icone: '🎗️', type: 'objet' },
      { id: 'tsitsit', prix: 2, icone: '🧶', type: 'objet' },
      { id: 'sirtouk', prix: 6, icone: '🧥', type: 'objet' },
    ],
  },
  {
    id: 'chemises',
    enseigne: ['SHIRTS', 'חולצות'],
    couleur: '#e9e4d8',
    encre: '#1f3a5f',
    articles: [
      { id: 'chemise', prix: 3, icone: '👔', type: 'objet' },
      { id: 'cravate', prix: 1, icone: '🪢', type: 'objet' },
    ],
  },
  {
    id: 'chapeaux',
    enseigne: ['HATS', 'כובעים'],
    couleur: '#1b1b1d',
    encre: '#d9b45a',
    articles: [
      { id: 'chapeau', prix: 4, icone: '🎩', type: 'objet' },
      { id: 'kippa', prix: 1, icone: '🧢', type: 'objet' },
    ],
  },
]

export function magasin(id: string) {
  return MAGASINS.find((m) => m.id === id)
}

export function acheterDans(idMagasin: string, idArticle: string) {
  const s = useGame.getState()
  const a = magasin(idMagasin)?.articles.find((x) => x.id === idArticle)
  if (!a) return false
  if (s.dollars < a.prix) {
    s.notifier('boutique.pasAssez')
    return false
  }
  // Les achats sont gardés dans l'inventaire (nourriture : entrée 'mange:<id>')
  const entree = a.type === 'manger' ? `mange:${a.id}` : a.id
  s.set({ dollars: s.dollars - a.prix, inventaire: [...s.inventaire, entree] })
  if (a.type === 'manger') s.notifier('magasins.miam', { objet: t(`magasins.article.${a.id}`), berakha: t(a.berakha ?? 'berakha.chehakol') })
  else s.notifier('boutique.achete', { objet: t(`magasins.article.${a.id}`) })
  sauvegarder()
  return true
}
