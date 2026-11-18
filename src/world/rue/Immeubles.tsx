import { useMemo } from 'react'
import * as THREE from 'three'
import { Pieces, type Piece, type V3 } from '../primitives'

// Immeubles de Crown Heights autour du 770 (18/11/2026) : maisons en rangée
// (« brownstones » à perron) et immeubles d'appartements d'avant-guerre avec
// escaliers de secours, typiques du quartier. CHOIX DE JEU : ce ne sont PAS
// les adresses réelles voisines du 770 (non relevées) ; volumes, hauteurs et
// couleurs sont génériques et variés. Consigné dans docs/REGISTRE.md.
//
// Tout est fait de boîtes fusionnées par matériau (Pieces) : une rangée
// entière coûte une dizaine d'appels de dessin.

type Mat = Piece['m']
export type Style = 'brownstone' | 'brownstoneClair' | 'briqueRouge' | 'briqueJaune' | 'calcaire'

const MUR: Record<Style, Mat> = {
  brownstone: 'brownstone',
  brownstoneClair: 'brownstoneClair',
  briqueRouge: 'briqueRouge',
  briqueJaune: 'briqueJaune',
  calcaire: 'calcaire',
}
// Pierre des encadrements, linteaux, bandeaux et perron
const DECOR: Record<Style, Mat> = {
  brownstone: 'brownstoneClair',
  brownstoneClair: 'brownstone',
  briqueRouge: 'calcaire',
  briqueJaune: 'brownstoneClair',
  calcaire: 'pierreFoncee',
}
const PERRON: Record<Style, Mat> = {
  brownstone: 'brownstone',
  brownstoneClair: 'brownstoneClair',
  briqueRouge: 'brownstone',
  briqueJaune: 'brownstone',
  calcaire: 'calcaire',
}

// Pseudo-hasard stable (même ville à chaque partie)
function hasard(n: number) {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

// Repère d'une façade : x le long de la rue, dz > 0 vers la rue.
// sens = +1 : façade tournée vers +z (côté nord, celui du 770) ;
// sens = -1 : façade tournée vers -z (côté sud, en face).
function repere(zF: number, sens: 1 | -1) {
  return (x: number, y: number, dz: number): V3 => [x, y, zF + sens * dz]
}

type Fenetre = { cx: number; y: number; l: number; h: number }

function fenetre(pc: Piece[], P: ReturnType<typeof repere>, f: Fenetre, decor: Mat, graine: number, ombre: boolean) {
  const { cx, y, l, h } = f
  // Vitre (ou rideau tiré, une fenêtre sur quatre)
  pc.push({ t: [l, h, 0.04], p: P(cx, y + h / 2, 0.02), m: hasard(graine) < 0.25 ? 'rideau' : 'vitre', ombre: false })
  // Croisillons blancs : montant central et traverse (fenêtre à guillotine)
  pc.push({ t: [0.06, h, 0.05], p: P(cx, y + h / 2, 0.05), m: 'blancCamping', ombre: false })
  pc.push({ t: [l, 0.07, 0.05], p: P(cx, y + h * 0.52, 0.05), m: 'blancCamping', ombre: false })
  // Chambranles, linteau à crossette et appui saillant
  pc.push({ t: [0.12, h, 0.1], p: P(cx - l / 2 - 0.06, y + h / 2, 0.05), m: decor, ombre })
  pc.push({ t: [0.12, h, 0.1], p: P(cx + l / 2 + 0.06, y + h / 2, 0.05), m: decor, ombre })
  pc.push({ t: [l + 0.44, 0.3, 0.18], p: P(cx, y + h + 0.15, 0.09), m: decor, ombre })
  pc.push({ t: [l + 0.3, 0.08, 0.22], p: P(cx, y - 0.04, 0.11), m: decor, ombre })
}

export type Maison = {
  x0: number
  largeur: number
  zF: number
  sens: 1 | -1
  style: Style
  etages: number // étages au-dessus du rez-de-jardin (2 à 4)
  baie?: boolean // bow-window sur deux étages
  porte?: Mat
  cote?: 'g' | 'd' // côté du perron
  jardin?: number // profondeur de la courette devant (grille), 0 = aucune
  ombre?: boolean
  col?: boolean
  graine?: number
}

// Maison en rangée à perron (« brownstone ») de 3 travées
export function maisonRangee(m: Maison): Piece[] {
  const { x0, largeur: w, zF, sens, style, etages, baie = false, porte = 'porteVerte', cote = 'g', jardin = 0, ombre = true, col = true, graine = x0 } = m
  const P = repere(zF, sens)
  const mur = MUR[style]
  const decor = DECOR[style]
  const pierre = PERRON[style]
  const pc: Piece[] = []
  const HE = 3.2 // hauteur d'étage
  const Y1 = 1.6 // plancher de l'étage noble (en haut du perron)
  const h = Y1 + etages * HE + 0.4
  const prof = 13
  const xm = x0 + w / 2
  // Corps
  pc.push({ t: [w, h + 0.2, prof], p: P(xm, h / 2 - 0.1, -prof / 2), m: mur, col, ombre })
  // Soubassement en pierre (rez-de-jardin), légèrement saillant
  pc.push({ t: [w, Y1, 0.1], p: P(xm, Y1 / 2 - 0.05, 0.05), m: pierre, ombre })
  // Bandeaux entre les étages
  for (let k = 1; k < etages; k++) pc.push({ t: [w, 0.12, 0.08], p: P(xm, Y1 + k * HE - 0.1, 0.04), m: decor, ombre })
  // Trois travées : porte d'un côté, deux fenêtres de l'autre
  const tr = [x0 + w / 6, x0 + w / 2, x0 + (5 * w) / 6]
  const xPorte = cote === 'g' ? tr[0] : tr[2]
  const autres = cote === 'g' ? [tr[1], tr[2]] : [tr[0], tr[1]]
  const lf = Math.min(1.05, w / 3 - 0.6)
  // Bow-window : avancée sur l'étage noble et le suivant, devant les 2 travées
  const prBaie = 0.85
  if (baie) {
    const bx = (autres[0] + autres[1]) / 2
    const bl = Math.abs(autres[1] - autres[0]) + lf + 0.7
    pc.push({ t: [bl, 2 * HE, prBaie], p: P(bx, Y1 + HE, prBaie / 2), m: mur, ombre })
    pc.push({ t: [bl + 0.2, 0.3, prBaie + 0.15], p: P(bx, Y1 + 2 * HE + 0.1, (prBaie + 0.15) / 2), m: decor, ombre })
    pc.push({ t: [bl + 0.1, 0.25, prBaie + 0.1], p: P(bx, Y1 - 0.05, (prBaie + 0.1) / 2), m: decor, ombre })
  }
  // Fenêtres des étages
  for (let k = 0; k < etages; k++) {
    const y = Y1 + k * HE + 0.55
    const hf = k === 0 ? 2.25 : 1.85
    const avance = baie && k < 2 ? prBaie : 0
    for (const cx of autres) {
      const Pf = repere(zF + sens * avance, sens)
      fenetre(pc, Pf, { cx, y, l: lf, h: hf }, decor, graine * 7 + k * 3 + cx, ombre)
    }
    // Au-dessus de la porte : une fenêtre aux étages supérieurs
    if (k > 0) fenetre(pc, P, { cx: xPorte, y, l: lf * 0.9, h: hf }, decor, graine * 5 + k + xPorte, ombre)
  }
  // Fenêtres basses du rez-de-jardin (sous le perron, côté fenêtres)
  for (const cx of autres) fenetre(pc, P, { cx, y: 0.35, l: lf * 0.9, h: 0.9 }, decor, graine + cx, ombre)
  // Porte d'entrée en haut du perron, imposte vitrée, encadrement et fronton
  pc.push({ t: [1.15, 2.45, 0.08], p: P(xPorte, Y1 + 1.22, 0.04), m: porte, ombre: false })
  pc.push({ t: [1.15, 0.45, 0.05], p: P(xPorte, Y1 + 2.75, 0.03), m: 'vitre', ombre: false })
  pc.push({ t: [0.07, 0.05, 0.12], p: P(xPorte + 0.4, Y1 + 1.15, 0.12), m: 'laiton', ombre: false })
  for (const s of [-1, 1]) pc.push({ t: [0.24, 3.0, 0.22], p: P(xPorte + s * 0.72, Y1 + 1.5, 0.11), m: decor, ombre })
  pc.push({ t: [1.9, 0.32, 0.4], p: P(xPorte, Y1 + 3.15, 0.2), m: decor, ombre })
  pc.push({ t: [2.1, 0.12, 0.5], p: P(xPorte, Y1 + 3.37, 0.25), m: decor, ombre })
  // Perron : palier puis 8 marches de 20 cm vers la rue
  const NB = 8
  const giron = 0.32
  const lp = 1.7
  const palier = 1.0
  pc.push({ t: [lp, Y1, palier], p: P(xPorte, Y1 / 2, palier / 2), m: pierre, col, ombre })
  for (let i = 0; i < NB - 1; i++) {
    const haut = (i + 1) * (Y1 / NB)
    const avant = palier + (NB - 1 - i) * giron
    pc.push({ t: [lp, haut, giron], p: P(xPorte, haut / 2, avant - giron / 2), m: pierre, col, ombre })
  }
  // Limons pleins en pierre de chaque côté, en pente, et piliers au pied
  const course = (NB - 1) * giron
  const pente = Math.atan2(Y1, course)
  const long = Math.hypot(Y1, course)
  for (const s of [-1, 1]) {
    const xl = xPorte + s * (lp / 2 + 0.12)
    pc.push({ t: [0.24, 0.9, long + 0.3], p: P(xl, Y1 / 2 + 0.45, palier + course / 2), r: [sens * pente, 0, 0], m: pierre, ombre })
    pc.push({ t: [0.24, 1.6, palier], p: P(xl, Y1 + 0.3 - 0.5, palier / 2), m: pierre, ombre })
    pc.push({ t: [0.42, 1.15, 0.42], p: P(xl, 0.57, palier + course + 0.15), m: pierre, col, ombre })
    pc.push({ t: [0.5, 0.1, 0.5], p: P(xl, 1.18, palier + course + 0.15), m: decor, ombre })
  }
  // Corniche à consoles en haut de façade
  pc.push({ t: [w, 0.55, 0.12], p: P(xm, h - 0.75, 0.06), m: 'corniche', ombre })
  pc.push({ t: [w + 0.05, 0.35, 0.7], p: P(xm, h - 0.25, 0.35), m: 'corniche', ombre })
  for (let x = x0 + 0.35; x < x0 + w - 0.2; x += 0.95) pc.push({ t: [0.16, 0.45, 0.55], p: P(x, h - 0.65, 0.3), m: 'corniche', ombre })
  // Cheminées en brique sur le toit (une ou deux par maison)
  for (const f of hasard(graine + 11) < 0.5 ? [0.2] : [0.2, 0.8]) {
    pc.push({ t: [0.7, 1.3, 0.5], p: P(x0 + w * f, h + 0.55, -prof + 1.2), m: 'briqueRouge', ombre })
    pc.push({ t: [0.8, 0.1, 0.6], p: P(x0 + w * f, h + 1.22, -prof + 1.2), m: 'corniche', ombre: false })
  }
  // Courette devant : grille basse en fer forgé, ouverte au pied du perron
  if (jardin > 0) {
    const dz = jardin
    const xa = xPorte - lp / 2 - 0.4
    const xb = xPorte + lp / 2 + 0.4
    const troncons: [number, number][] = [
      [x0 + 0.05, xa],
      [xb, x0 + w - 0.05],
    ].filter(([a, b]) => b - a > 0.3) as [number, number][]
    for (const [a, b] of troncons) {
      pc.push({ t: [b - a, 0.05, 0.05], p: P((a + b) / 2, 0.95, dz), m: 'fer', col, ombre: false })
      pc.push({ t: [b - a, 0.04, 0.04], p: P((a + b) / 2, 0.12, dz), m: 'fer', ombre: false })
      for (let x = a; x <= b + 1e-3; x += 0.14) pc.push({ t: [0.025, 0.9, 0.025], p: P(x, 0.55, dz), m: 'fer', ombre: false })
    }
    // Poubelles (ville réelle : alignées dans la courette)
    if (hasard(graine + 3) < 0.6) {
      const xc = cote === 'g' ? x0 + w - 1.0 : x0 + 1.0
      for (const d of [0, 0.7]) pc.push({ geo: new THREE.CylinderGeometry(0.28, 0.25, 0.95, 10), p: P(xc - d, 0.47, dz - 0.6), m: hasard(graine + d) < 0.5 ? 'chassisNoir' : 'vertLampadaire', ombre: false })
    }
  }
  return pc
}

export type Appartements = {
  x0: number
  largeur: number
  zF: number
  sens: 1 | -1
  style: Style
  etages: number // 5 à 7
  secours?: boolean // escaliers de secours en façade
  ombre?: boolean
  col?: boolean
  graine?: number
}

// Immeuble d'appartements d'avant-guerre (rez-de-chaussée en pierre, entrée
// centrale à marquise, corniche, escaliers de secours en fer)
export function immeubleAppartements(a: Appartements): Piece[] {
  const { x0, largeur: w, zF, sens, style, etages, secours = true, ombre = true, col = true, graine = x0 } = a
  const P = repere(zF, sens)
  const mur = MUR[style]
  const decor = DECOR[style]
  const pc: Piece[] = []
  const HE = 3.0
  const Y1 = 4.0
  const h = Y1 + (etages - 1) * HE + 0.6
  const prof = 18
  const xm = x0 + w / 2
  pc.push({ t: [w, h + 0.2, prof], p: P(xm, h / 2 - 0.1, -prof / 2), m: mur, col, ombre })
  // Rez-de-chaussée en pierre à bossages
  pc.push({ t: [w, Y1, 0.14], p: P(xm, Y1 / 2 - 0.05, 0.07), m: 'calcaire', ombre })
  for (let y = 0.5; y < Y1; y += 0.5) pc.push({ t: [w, 0.04, 0.16], p: P(xm, y, 0.08), m: 'pierreFoncee', ombre: false })
  pc.push({ t: [w + 0.1, 0.35, 0.3], p: P(xm, Y1 + 0.1, 0.15), m: decor, ombre })
  // Entrée centrale : double porte vitrée, marquise
  pc.push({ t: [2.2, 2.7, 0.06], p: P(xm, 1.35, 0.15), m: 'vitre', ombre: false })
  pc.push({ t: [0.08, 2.7, 0.08], p: P(xm, 1.35, 0.19), m: 'laiton', ombre: false })
  pc.push({ t: [3.2, 0.25, 1.6], p: P(xm, 3.0, 0.8), m: 'corniche', ombre })
  for (const s of [-1, 1]) pc.push({ geo: new THREE.CylinderGeometry(0.05, 0.05, 2.9, 6), p: P(xm + s * 1.45, 1.45, 1.5), m: 'laiton', ombre: false })
  // Fenêtres du rez-de-chaussée de part et d'autre de l'entrée
  const nb = Math.max(4, Math.round(w / 2.3))
  const pas = w / nb
  for (let i = 0; i < nb; i++) {
    const cx = x0 + pas * (i + 0.5)
    // (devant le parement de pierre, qui avance de 14 cm)
    if (Math.abs(cx - xm) > 2.1) fenetre(pc, repere(zF + sens * 0.14, sens), { cx, y: 1.2, l: pas * 0.5, h: 1.9 }, 'pierreFoncee', graine + i, ombre)
  }
  // Étages
  for (let k = 0; k < etages - 1; k++) {
    const y = Y1 + 0.6 + k * HE
    for (let i = 0; i < nb; i++) fenetre(pc, P, { cx: x0 + pas * (i + 0.5), y, l: pas * 0.5, h: 1.75 }, decor, graine * 3 + k * 11 + i, ombre)
  }
  // Corniche et parapet
  pc.push({ t: [w, 0.6, 0.15], p: P(xm, h - 0.85, 0.07), m: decor, ombre })
  pc.push({ t: [w + 0.1, 0.4, 0.85], p: P(xm, h - 0.35, 0.42), m: 'corniche', ombre })
  for (let x = x0 + 0.4; x < x0 + w - 0.2; x += 1.1) pc.push({ t: [0.18, 0.5, 0.7], p: P(x, h - 0.75, 0.36), m: 'corniche', ombre })
  // Citerne d'eau en bois sur pilotis (silhouette typique des toits de
  // New York), un immeuble sur deux environ
  if (hasard(graine + 5) < 0.6) {
    const cx = x0 + w * (0.3 + hasard(graine + 6) * 0.4)
    const cz = -prof * 0.55
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) pc.push({ t: [0.14, 2.2, 0.14], p: P(cx + dx * 1.0, h + 1.1, cz + dz * 1.0), m: 'fer', ombre })
    pc.push({ t: [2.6, 0.12, 2.6], p: P(cx, h + 2.2, cz), m: 'boisCiterne', ombre })
    pc.push({ geo: new THREE.CylinderGeometry(1.35, 1.45, 3.0, 16), p: P(cx, h + 3.75, cz), m: 'boisCiterne', ombre })
    for (const y of [2.8, 3.8, 4.8]) pc.push({ geo: new THREE.CylinderGeometry(1.47, 1.47, 0.06, 16), p: P(cx, h + y, cz), m: 'fer', ombre: false })
    pc.push({ geo: new THREE.ConeGeometry(1.5, 1.1, 16), p: P(cx, h + 5.8, cz), m: 'toitGoudron', ombre })
  }
  // Édicule d'escalier sur le toit
  pc.push({ t: [3, 2.4, 3], p: P(x0 + w * 0.75, h + 1.2, -prof * 0.4), m: mur, ombre })
  // Escaliers de secours : paliers et échelles en zigzag sur deux travées
  if (secours) {
    const travees = [Math.floor(nb / 2) - 1, Math.floor(nb / 2)].filter((i) => i >= 0 && i < nb)
    const xa = x0 + pas * travees[0]
    const lg = pas * travees.length
    const xc = xa + lg / 2
    for (let k = 0; k < etages - 1; k++) {
      const y = Y1 + 0.5 + k * HE
      pc.push({ t: [lg, 0.06, 1.1], p: P(xc, y, 0.6), m: 'fer', ombre })
      pc.push({ t: [lg, 0.04, 0.04], p: P(xc, y + 0.95, 1.13), m: 'fer', ombre: false })
      pc.push({ t: [lg, 0.04, 0.04], p: P(xc, y + 0.45, 1.13), m: 'fer', ombre: false })
      for (const s of [-1, 1]) pc.push({ t: [0.04, 1.0, 1.1], p: P(xc + (s * lg) / 2, y + 0.5, 0.6), m: 'fer', ombre: false })
      // Échelle inclinée vers le palier du dessous
      if (k > 0) {
        const montee = HE
        const course = lg * 0.55
        const ang = Math.atan2(montee, course) * (k % 2 ? 1 : -1)
        pc.push({ t: [Math.hypot(montee, course), 0.05, 0.5], p: P(xc, y - HE / 2, 0.4), r: [0, 0, ang], m: 'fer', ombre: false })
      }
    }
  }
  return pc
}

// Rangée de maisons de x0 à x1 (largeurs et styles variés)
export function rangee(x0: number, x1: number, zF: number, sens: 1 | -1, opts: { jardin?: number; ombre?: boolean; col?: boolean; graine?: number } = {}): Piece[] {
  const styles: Style[] = ['brownstone', 'brownstoneClair', 'briqueRouge', 'brownstone', 'calcaire', 'briqueJaune']
  const portes: Mat[] = ['porteVerte', 'porteRouge', 'cheneFonce', 'noir']
  const pc: Piece[] = []
  let x = x0
  let i = opts.graine ?? 0
  while (x1 - x > 5.4) {
    const r = hasard(i * 3.1 + 1)
    let w = 5.8 + r * 1.2
    if (x1 - x - w < 5.4) w = x1 - x
    pc.push(
      ...maisonRangee({
        x0: x,
        largeur: w,
        zF,
        sens,
        style: styles[i % styles.length],
        etages: 2 + Math.floor(hasard(i + 0.5) * 2.2),
        baie: hasard(i + 7) < 0.45,
        porte: portes[i % portes.length],
        cote: i % 2 ? 'd' : 'g',
        jardin: opts.jardin ?? 0,
        ombre: opts.ombre,
        col: opts.col,
        graine: i + 1,
      }),
    )
    x += w
    i++
  }
  return pc
}

// Rangées qui ferment la vue au bout de la rue, de part et d'autre (rue
// transversale, décor) : façades tournées vers le 770, sans collisions ni ombres
export function FondsDeRue({ xOuest, xEst, z0, z1 }: { xOuest: number; xEst: number; z0: number; z1: number }) {
  const pieces = useMemo(() => {
    const L = z1 - z0
    const pc: Piece[] = []
    pc.push(...immeubleAppartements({ x0: -L / 2, largeur: 24, zF: 0, sens: 1, style: 'briqueRouge', etages: 7, ombre: false, col: false, graine: 51 }))
    pc.push(...rangee(-L / 2 + 24, L / 2 - 22, 0, 1, { ombre: false, col: false, graine: 61 }))
    pc.push(...immeubleAppartements({ x0: L / 2 - 22, largeur: 22, zF: 0, sens: 1, style: 'calcaire', etages: 6, ombre: false, col: false, graine: 71 }))
    return pc
  }, [z0, z1])
  const zm = (z0 + z1) / 2
  // Rotation d'un quart de tour : x local → z monde, façade (+z local) → vers la rue
  return (
    <>
      <group position={[xOuest, 0, zm]} rotation={[0, Math.PI / 2, 0]}>
        <Pieces pieces={pieces} />
      </group>
      <group position={[xEst, 0, zm]} rotation={[0, -Math.PI / 2, 0]}>
        <Pieces pieces={pieces} />
      </group>
    </>
  )
}
