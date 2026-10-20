import { PLACE_VIDE } from '../config/grandZal'

// RÈGLE ABSOLUE : aucun PNJ ne s'assoit à la place du Rebbe ni ne s'en
// approche. Tout point de trajet ou de station est vérifié ici ; un point
// trop proche est refusé (et signalé en développement).

const CENTRE: [number, number] = [(PLACE_VIDE.x0 + PLACE_VIDE.x1) / 2, (PLACE_VIDE.z0 + PLACE_VIDE.z1) / 2]

export function distancePlaceVide(x: number, z: number) {
  // Distance au rectangle de l'estrade (0 à l'intérieur)
  const dx = Math.max(PLACE_VIDE.x0 - x, 0, x - PLACE_VIDE.x1)
  const dz = Math.max(PLACE_VIDE.z0 - z, 0, z - PLACE_VIDE.z1)
  return Math.hypot(dx, dz)
}

export function pointAutorise(x: number, z: number) {
  return distancePlaceVide(x, z) >= PLACE_VIDE.rayonExclusionPnj
}

// Retourne le chemin sans les points interdits, et vérifie aussi chaque
// segment (échantillonné) pour qu'un trajet ne frôle pas l'estrade.
export function cheminAutorise(points: [number, number][]): [number, number][] {
  const ok = points.filter(([x, z]) => pointAutorise(x, z))
  for (let i = 0; i < ok.length; i++) {
    const [ax, az] = ok[i]
    const [bx, bz] = ok[(i + 1) % ok.length]
    for (let k = 0; k <= 20; k++) {
      const x = ax + ((bx - ax) * k) / 20
      const z = az + ((bz - az) * k) / 20
      if (!pointAutorise(x, z)) {
        if (import.meta.env.DEV) console.warn('[PNJ] segment trop proche de la place vide, chemin refusé', ok[i], ok[(i + 1) % ok.length])
        return []
      }
    }
  }
  if (ok.length !== points.length && import.meta.env.DEV) console.warn('[PNJ] points refusés près de la place vide')
  return ok
}

export const CENTRE_PLACE_VIDE = CENTRE
