import type { Vector3Tuple } from 'three'
import type { EtatMission, Langue } from '../state/store'

const CLE = '770-brooklyn-sauvegarde-v1'

export type Sauvegarde = {
  missions: Record<string, EtatMission>
  langue: Langue
  son: boolean
  position?: Vector3Tuple
  yaw?: number
}

// Chaque accès à localStorage est protégé : navigation privée, stockage
// bloqué ou quota plein ne doivent jamais casser le jeu.
export function lireSauvegarde(): Sauvegarde | null {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return null
    const data = JSON.parse(brut) as Sauvegarde
    if (typeof data !== 'object' || data === null || typeof data.missions !== 'object') return null
    return data
  } catch {
    return null
  }
}

export function ecrireSauvegarde(data: Sauvegarde): boolean {
  try {
    localStorage.setItem(CLE, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function effacerSauvegarde(): void {
  try {
    localStorage.removeItem(CLE)
  } catch {
    // stockage indisponible : rien à effacer
  }
}
