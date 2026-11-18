import { BROOKLYN, dateNewYork, zmanimDuJour } from './zmanim'

// 'Hanouka à New York, calculé dans le navigateur (calendrier hébraïque
// d'Intl). La n-ième bougie s'allume le soir, après la chkia : le soir du
// 24 Kislev est le 1er soir. Après la chkia, on compte donc le jour hébraïque
// suivant. ?hanouka=1..8 force un soir (essais, captures).

function jourHebreu(civil: { a: number; m: number; j: number }) {
  // Midi UTC du jour civil : même date hébraïque toute la journée à New York
  const d = new Date(Date.UTC(civil.a, civil.m - 1, civil.j, 17))
  const p = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: BROOKLYN.fuseau, day: 'numeric', month: 'long' })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {})
  return { jour: parseInt(p.day, 10), mois: p.month }
}

function plusJours(c: { a: number; m: number; j: number }, n: number) {
  const d = new Date(Date.UTC(c.a, c.m - 1, c.j + n))
  return { a: d.getUTCFullYear(), m: d.getUTCMonth() + 1, j: d.getUTCDate() }
}

// Jour civil « hébraïque » en cours (le lendemain après la chkia)
function jourEffectif(instant: Date) {
  const civil = dateNewYork(instant)
  const z = zmanimDuJour(instant)
  return z && instant.getTime() >= z.chkia.getTime() ? plusJours(civil, 1) : civil
}

function forcage(): number | null {
  if (typeof window === 'undefined') return null
  const v = new URLSearchParams(window.location.search).get('hanouka')
  const n = v === null ? NaN : parseInt(v, 10)
  return n >= 1 && n <= 8 ? n : null
}

// Nombre de lumières du soir en cours (1 à 8), ou 0 hors de 'Hanouka
export function soirHanouka(instant = new Date()): number {
  const f = forcage()
  if (f) return f
  const jour = jourEffectif(instant)
  for (let k = 0; k < 8; k++) {
    const h = jourHebreu(plusJours(jour, -k))
    if (h.mois === 'Kislev' && h.jour === 25) return k + 1
  }
  return 0
}

// Jours restants avant l'allumage du 1er soir (0 : ce soir), -1 pendant la fête
export function joursAvantHanouka(instant = new Date()): number {
  if (soirHanouka(instant)) return -1
  const jour = jourEffectif(instant)
  for (let k = 1; k < 400; k++) {
    const h = jourHebreu(plusJours(jour, k))
    if (h.mois === 'Kislev' && h.jour === 25) return k - 1
  }
  return -1
}
