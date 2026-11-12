import { create } from 'zustand'

// Qualité automatique (App.tsx, PerformanceMonitor) : quand l'ordinateur ou le
// téléphone n'arrive plus à suivre, la résolution baisse par paliers et la
// carte d'ombres passe en 1024. Elle remonte quand les images reviennent.
export const DPR_MAX = 1.25
export const DPR_MIN = 0.75

type Qualite = { dpr: number; ombresBasses: boolean; baisser: () => void; monter: () => void; minimum: () => void }

const initial = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, DPR_MAX)

export const useQualite = create<Qualite>((set) => ({
  dpr: initial,
  ombresBasses: false,
  baisser: () => set((s) => ({ dpr: Math.max(DPR_MIN, +(s.dpr - 0.25).toFixed(2)), ombresBasses: true })),
  monter: () => set((s) => ({ dpr: Math.min(initial, +(s.dpr + 0.25).toFixed(2)), ombresBasses: s.dpr + 0.25 < initial })),
  minimum: () => set({ dpr: DPR_MIN, ombresBasses: true }),
}))
