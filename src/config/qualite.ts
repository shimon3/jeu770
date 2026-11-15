import { create } from 'zustand'

// Qualité graphique (App.tsx, PerformanceMonitor).
// Niveau choisi dans le menu (15/11/2026) :
// - auto : effets d'image (occlusion ambiante, halo, vignette) sur ordinateur ;
//   si l'appareil peine, les effets sont coupés d'abord, puis la résolution
//   baisse par paliers et la carte d'ombres passe en 1024 ;
// - haute : effets toujours actifs, résolution jusqu'à 1,5 ;
// - equilibree : sans effets ;
// - rapide : sans effets, résolution 1 au plus, ombres légères.
export const DPR_MAX = 1.25
export const DPR_MIN = 0.75
const CLE = '770-brooklyn-graphismes'

export type Niveau = 'auto' | 'haute' | 'equilibree' | 'rapide'
export const NIVEAUX: Niveau[] = ['auto', 'haute', 'equilibree', 'rapide']

const ecran = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
// Appareil tactile : jamais d'effets en automatique (même test que player/entrees.ts,
// recopié ici pour ne pas créer de dépendance circulaire)
const tactile = (() => {
  try {
    if (new URLSearchParams(window.location.search).get('tactile') === '1') return true
    return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches
  } catch {
    return false
  }
})()

function lireNiveau(): Niveau {
  try {
    const v = localStorage.getItem(CLE) as Niveau | null
    return v && NIVEAUX.includes(v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function dprDe(n: Niveau) {
  return Math.min(ecran, n === 'haute' ? 1.5 : n === 'rapide' ? 1 : DPR_MAX)
}

type Qualite = {
  niveau: Niveau
  dpr: number
  ombresBasses: boolean
  // Effets d'image actifs (world/Effets.tsx, chargé à part)
  effets: boolean
  choisir: (n: Niveau) => void
  baisser: () => void
  monter: () => void
  minimum: () => void
}

const depart = lireNiveau()

export const useQualite = create<Qualite>((set) => ({
  niveau: depart,
  dpr: dprDe(depart),
  ombresBasses: depart === 'rapide',
  effets: depart === 'haute' || (depart === 'auto' && !tactile),
  choisir: (n) => {
    try {
      localStorage.setItem(CLE, n)
    } catch {
      // stockage indisponible : le choix vaut pour cette visite
    }
    set({ niveau: n, dpr: dprDe(n), ombresBasses: n === 'rapide', effets: n === 'haute' || (n === 'auto' && !tactile) })
  },
  baisser: () =>
    set((s) => {
      // En automatique, on coupe d'abord les effets : c'est le plus gros gain
      if (s.niveau === 'auto' && s.effets) return { effets: false }
      return { dpr: Math.max(DPR_MIN, +(s.dpr - 0.25).toFixed(2)), ombresBasses: true }
    }),
  monter: () =>
    set((s) => {
      const max = dprDe(s.niveau)
      return { dpr: Math.min(max, +(s.dpr + 0.25).toFixed(2)), ombresBasses: s.niveau === 'rapide' || s.dpr + 0.25 < max }
    }),
  minimum: () => set((s) => ({ dpr: DPR_MIN, ombresBasses: true, effets: s.niveau === 'haute' })),
}))
