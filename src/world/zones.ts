import donnees from '../config/zones.json'

export type Zone = {
  id: string
  min: [number, number, number]
  max: [number, number, number]
  interieur: boolean
  calme: boolean
  artistique: boolean
}

export const ZONES = donnees.zones as Zone[]
export const CONTENUS = donnees.contenus

// Première zone (dans l'ordre du fichier) contenant le point
export function zoneEn(x: number, y: number, z: number): Zone {
  for (const zn of ZONES) {
    if (x >= zn.min[0] && x <= zn.max[0] && y >= zn.min[1] && y <= zn.max[1] && z >= zn.min[2] && z <= zn.max[2]) return zn
  }
  return ZONES[ZONES.length - 1]
}

export function zoneParId(id: string): Zone | undefined {
  return ZONES.find((z) => z.id === id)
}
