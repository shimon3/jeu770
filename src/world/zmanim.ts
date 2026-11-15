// Zmanim du jour à Crown Heights, calculés dans le navigateur (aucun réseau).
// Lever et coucher du soleil : algorithme de l'Almanac for Computers (NOAA),
// précision de l'ordre de la minute. Sof zman Chema : méthode du GRA
// (3 heures proportionnelles après le lever). Calcul indicatif : le panneau
// le signale et renvoie à un calendrier de référence.

export const BROOKLYN = { lat: 40.6689, lng: -73.9422, fuseau: 'America/New_York' }

const RAD = Math.PI / 180

// Date civile (année, mois, jour) à New York pour un instant donné
export function dateNewYork(instant = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: BROOKLYN.fuseau, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {})
  return { a: Number(p.year), m: Number(p.month), j: Number(p.day) }
}

// Instant UTC du lever (lever = true) ou du coucher du soleil, pour le jour
// civil (a, m, j) au lieu donné. null si le soleil ne se lève/couche pas.
function soleil(a: number, m: number, j: number, lever: boolean): Date | null {
  const N = Math.round((Date.UTC(a, m - 1, j) - Date.UTC(a, 0, 0)) / 86400000)
  const lngH = BROOKLYN.lng / 15
  const t = N + ((lever ? 6 : 18) - lngH) / 24
  const M = 0.9856 * t - 3.289
  let L = M + 1.916 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 282.634
  L = ((L % 360) + 360) % 360
  let RA = Math.atan(0.91764 * Math.tan(L * RAD)) / RAD
  RA = ((RA % 360) + 360) % 360
  RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15
  const sinDec = 0.39782 * Math.sin(L * RAD)
  const cosDec = Math.cos(Math.asin(sinDec))
  const zenith = 90.833
  const cosH = (Math.cos(zenith * RAD) - sinDec * Math.sin(BROOKLYN.lat * RAD)) / (cosDec * Math.cos(BROOKLYN.lat * RAD))
  if (cosH > 1 || cosH < -1) return null
  const H = (lever ? 360 - Math.acos(cosH) / RAD : Math.acos(cosH) / RAD) / 15
  const T = H + RA - 0.06571 * t - 6.622
  let UT = (((T - lngH) % 24) + 24) % 24
  // À New York le coucher tombe après minuit UTC en été : jour suivant
  if (!lever && UT < 12) UT += 24
  return new Date(Date.UTC(a, m - 1, j) + UT * 3600000)
}

export type Zmanim = { netz: Date; sofChema: Date; hatsot: Date; chkia: Date }

export function zmanimDuJour(instant = new Date()): Zmanim | null {
  const { a, m, j } = dateNewYork(instant)
  const netz = soleil(a, m, j, true)
  const chkia = soleil(a, m, j, false)
  if (!netz || !chkia) return null
  const heure = (chkia.getTime() - netz.getTime()) / 12
  return {
    netz,
    sofChema: new Date(netz.getTime() + 3 * heure),
    hatsot: new Date(netz.getTime() + 6 * heure),
    chkia,
  }
}

// Heure locale de New York, « 16:42 »
export function heureNY(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: BROOKLYN.fuseau, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

// Prière du moment à Brooklyn : Cha'harit jusqu'à 'hatsot, Min'ha jusqu'à la
// chkia, Arvit ensuite (et avant le lever).
export function tefilaDuMoment(instant = new Date()): 'chacharit' | 'minha' | 'arvit' {
  const z = zmanimDuJour(instant)
  if (!z) return 'chacharit'
  const x = instant.getTime()
  if (x < z.netz.getTime() - 72 * 60000) return 'arvit'
  if (x < z.hatsot.getTime()) return 'chacharit'
  if (x < z.chkia.getTime()) return 'minha'
  return 'arvit'
}

// Jour du mois hébraïque à New York (1–30)
function jourHebreu(instant: Date) {
  const s = new Intl.DateTimeFormat('en-u-ca-hebrew', { timeZone: BROOKLYN.fuseau, day: 'numeric' }).format(instant)
  return parseInt(s, 10)
}

// Cycle mensuel des Tehilim (division traditionnelle en 30 jours). Le jour 25
// et le jour 26 se partagent le psaume 119.
const CYCLE: [number, number, string?][] = [
  [1, 9], [10, 17], [18, 22], [23, 28], [29, 34], [35, 38], [39, 43], [44, 48], [49, 54], [55, 59],
  [60, 65], [66, 68], [69, 71], [72, 76], [77, 78], [79, 82], [83, 87], [88, 89], [90, 96], [97, 103],
  [104, 105], [106, 107], [108, 112], [113, 118], [119, 119, '1–96'], [119, 119, '97–176'], [120, 134], [135, 139], [140, 144], [145, 150],
]

// Chapitres du jour. Dans un mois de 29 jours, le 29 on lit 140 à 150.
export function tehilimDuJour(instant = new Date()) {
  const j = jourHebreu(instant)
  const demain = jourHebreu(new Date(instant.getTime() + 86400000))
  const [de, a, versets] = CYCLE[Math.min(Math.max(j, 1), 30) - 1]
  const fin = j === 29 && demain === 1 ? 150 : a
  const texte = de === fin ? `${de}${versets ? ` (${versets})` : ''}` : `${de}–${fin}`
  return { jour: j, chapitres: texte }
}
