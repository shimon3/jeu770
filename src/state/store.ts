import { create } from 'zustand'
import type { Vector3Tuple } from 'three'

export type Langue = 'fr' | 'he'
export type Ecran = 'accueil' | 'jeu'
export type Vue = '3e' | '1re'

// Contenu affiché dans le panneau central (lecture, dialogue, message…)
export type Panneau =
  | { type: 'histoire' }
  | { type: 'tableau' }
  | { type: 'journal' }
  | { type: 'message'; cle: string }
  | { type: 'dialogue'; nomCle: string; cle: string }
  | null

export type Interactif = {
  id: string
  position: Vector3Tuple
  rayon: number
  labelCle: () => string
  action: () => void
}

export type Siege = { position: Vector3Tuple; rotationY: number }

export type EtatMission = { etat: 'active' | 'terminee'; etape: number }

type Notification = { id: number; texte: string; params?: Record<string, string> }

type GameState = {
  ecran: Ecran
  pause: boolean
  langue: Langue
  son: boolean
  vue: Vue
  zone: string
  panneau: Panneau
  interactifs: Map<string, Interactif>
  cible: string | null
  siege: Siege | null
  missions: Record<string, EtatMission>
  notifications: Notification[]
  debugPhysique: boolean
  // Position de départ (nouvelle partie ou sauvegarde)
  depart: { position: Vector3Tuple; yaw: number }

  set: (p: Partial<GameState>) => void
  enregistrer: (i: Interactif) => void
  retirer: (id: string) => void
  notifier: (texte: string, params?: Record<string, string>) => void
}

let notifId = 0

export const DEPART_PAR_DEFAUT = { position: [0, 1.2, 9.5] as Vector3Tuple, yaw: 0 }

export const useGame = create<GameState>((set, get) => ({
  ecran: 'accueil',
  pause: false,
  langue: 'fr',
  son: true,
  vue: '3e',
  zone: 'rue',
  panneau: null,
  interactifs: new Map(),
  cible: null,
  siege: null,
  missions: {},
  notifications: [],
  debugPhysique: false,
  depart: DEPART_PAR_DEFAUT,

  set: (p) => set(p),
  enregistrer: (i) => {
    const m = new Map(get().interactifs)
    m.set(i.id, i)
    set({ interactifs: m })
  },
  retirer: (id) => {
    const m = new Map(get().interactifs)
    m.delete(id)
    set({ interactifs: m, cible: get().cible === id ? null : get().cible })
  },
  notifier: (texte, params) => {
    const id = ++notifId
    set({ notifications: [...get().notifications, { id, texte, params }] })
    setTimeout(() => set({ notifications: get().notifications.filter((n) => n.id !== id) }), 4000)
  },
}))

// Position courante du joueur, partagée hors React (mise à jour à chaque image)
export const joueur = {
  position: [0, 0, 0] as Vector3Tuple,
  yaw: 0,
}
