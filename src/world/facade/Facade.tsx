import { useMemo } from 'react'
import * as THREE from 'three'
import { ABORDS, FACADE, FENETRES, LARGEUR_FACADE, NIVEAUX, ORIEL, PORTE, TRAVEES, type FenetreDef } from '../../config/dimensions'
import { escalier, geoPignon, Invisible, mur, Pieces, type Piece, type Rect, type V3 } from '../primitives'
import { useMateriaux } from '../materiaux'
import { Porte } from '../Porte'
import { textureTexte } from '../texturesProcedurales'

const X0 = -LARGEUR_FACADE / 2
const X1 = LARGEUR_FACADE / 2
const EP = FACADE.epaisseurMur
const RETRAIT_VITRE = 0.18

// ---------------------------------------------------------------------------
// Fenêtre à meneaux de pierre et verre au plomb (Commons 2) : encadrement à
// harpes, appui saillant, meneaux, imposte éventuelle.
// `transparente` : pièce modélisée derrière (verre translucide, pas de fond sombre)
function fenetre(f: FenetreDef, transparente = false): Piece[] {
  const verre = transparente ? 'vitrailClair' : 'vitrail'
  const pc: Piece[] = []
  const { x, y, w, h, cols, transom } = f
  const meneau = 0.1
  const lj = (w - (cols - 1) * meneau) / cols
  const yImposte = transom > 0 ? y + h * (1 - transom) : null
  // Jours vitrés (collision : on ne passe pas par les fenêtres)
  for (let c = 0; c < cols; c++) {
    const cx = x - w / 2 + lj / 2 + c * (lj + meneau)
    if (yImposte) {
      const hb = yImposte - y - 0.05
      const hh = y + h - yImposte - 0.05
      pc.push({ t: [lj, hb, 0.03], p: [cx, y + hb / 2, -RETRAIT_VITRE], m: verre, col: true, ombre: false })
      pc.push({ t: [lj, hh, 0.03], p: [cx, y + h - hh / 2, -RETRAIT_VITRE], m: verre, col: true, ombre: false })
    } else {
      pc.push({ t: [lj, h, 0.03], p: [cx, y + h / 2, -RETRAIT_VITRE], m: verre, col: true, ombre: false })
    }
    if (c > 0) pc.push({ t: [meneau, h, 0.22], p: [cx - lj / 2 - meneau / 2, y + h / 2, -0.09], m: 'pierre' })
  }
  if (yImposte) pc.push({ t: [w, 0.1, 0.22], p: [x, yImposte, -0.09], m: 'pierre' })
  // Encadrement
  pc.push({ t: [0.2, h + 0.22, 0.12], p: [x - w / 2 - 0.1, y + h / 2 + 0.06, 0.03], m: 'pierre' })
  pc.push({ t: [0.2, h + 0.22, 0.12], p: [x + w / 2 + 0.1, y + h / 2 + 0.06, 0.03], m: 'pierre' })
  pc.push({ t: [w + 0.62, 0.24, 0.14], p: [x, y + h + 0.12, 0.04], m: 'pierre' })
  pc.push({ t: [w + 0.5, 0.1, 0.24], p: [x, y - 0.05, 0.07], m: 'pierre' })
  // Harpes : blocs alternés le long des piédroits
  const n = Math.max(2, Math.round(h / 0.32))
  const pas = h / n
  for (let k = 0; k < n; k += 2) {
    for (const s of [-1, 1]) pc.push({ t: [0.14, pas * 0.92, 0.1], p: [x + s * (w / 2 + 0.27), y + pas * (k + 0.5), 0.02], m: 'pierre' })
  }
  // Fond sombre derrière le vitrail (l'intérieur n'est pas modélisé)
  if (!transparente) pc.push({ t: [w, h, 0.02], p: [x, y + h / 2, -EP + 0.02], m: 'noir', ombre: false })
  return pc
}

// Petite fenêtre grillagée près de la porte (Commons 3)
function petiteFenetre(x: number, y: number): Piece[] {
  const w = PORTE.petiteFenetreLargeur
  const h = PORTE.petiteFenetreHauteur
  const pc: Piece[] = [
    { t: [w, h, 0.03], p: [x, y + h / 2, -0.12], m: 'vitrail', col: true, ombre: false },
    { t: [w + 0.3, 0.12, 0.2], p: [x, y - 0.06, 0.06], m: 'pierre' },
    { t: [w + 0.24, 0.14, 0.12], p: [x, y + h + 0.07, 0.03], m: 'pierre' },
  ]
  // Grille : barreaux verticaux à pointes de lance et traverses
  for (let i = 0; i < 4; i++) {
    const bx = x - w / 2 + 0.05 + (i * (w - 0.1)) / 3
    pc.push({ t: [0.02, h + 0.25, 0.02], p: [bx, y + h / 2 + 0.1, 0.05], m: 'fer', ombre: false })
    if (i === 0 || i === 3)
      pc.push({ geo: new THREE.ConeGeometry(0.03, 0.12, 4), p: [bx, y + h + 0.29, 0.05], m: 'fer', ombre: false })
  }
  for (const hy of [0.15, 0.6, 1.05]) pc.push({ t: [w + 0.04, 0.02, 0.02], p: [x, y + hy, 0.05], m: 'fer', ombre: false })
  return pc
}

// Tronc de pyramide entre deux polygones horizontaux (oriel, console, toit)
function geoTronc(bas: [number, number][], haut: [number, number][], yBas: number, yHaut: number) {
  const pos: number[] = []
  const n = bas.length
  const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c)
  for (let i = 0; i < n - 1; i++) {
    const a = [bas[i][0], yBas, bas[i][1]]
    const b = [bas[i + 1][0], yBas, bas[i + 1][1]]
    const c = [haut[i + 1][0], yHaut, haut[i + 1][1]]
    const d = [haut[i][0], yHaut, haut[i][1]]
    // Ordre anti-horaire vu de l'extérieur : normales sortantes
    tri(a, b, c)
    tri(a, c, d)
  }
  // Faces haute et basse (éventail)
  for (let i = 1; i < n - 1; i++) {
    tri([haut[0][0], yHaut, haut[0][1]], [haut[i][0], yHaut, haut[i][1]], [haut[i + 1][0], yHaut, haut[i + 1][1]])
    tri([bas[0][0], yBas, bas[0][1]], [bas[i + 1][0], yBas, bas[i + 1][1]], [bas[i][0], yBas, bas[i][1]])
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  const uv: number[] = []
  for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] + pos[i + 2], pos[i + 1])
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

// Plan de l'oriel (x, z) : trois pans, de mur à mur
function planOriel(echelle = 1, marge = 0): [number, number][] {
  const L = ORIEL.largeur / 2 + marge
  const S = ORIEL.saillie * echelle + marge
  const F = (ORIEL.largeur / 2 - 0.55) * echelle + marge
  return [
    [TRAVEES.centre - L, 0],
    [TRAVEES.centre - F, S],
    [TRAVEES.centre + F, S],
    [TRAVEES.centre + L, 0],
  ]
}

function oriel(): Piece[] {
  const pc: Piece[] = []
  const { bas, haut, toit } = ORIEL
  // Corps vitré, bandeaux et poteaux noirs
  pc.push({ geo: geoTronc(planOriel(1, -0.04), planOriel(1, -0.04), bas + 0.25, haut - 0.2), m: 'vitrail', ombre: false })
  pc.push({ geo: geoTronc(planOriel(), planOriel(), bas, bas + 0.25), m: 'chassisNoir' })
  pc.push({ geo: geoTronc(planOriel(), planOriel(), haut - 0.2, haut), m: 'chassisNoir' })
  pc.push({ geo: geoTronc(planOriel(1, 0.01), planOriel(1, 0.01), bas + 1.5, bas + 1.58), m: 'chassisNoir' })
  for (const [px, pz] of planOriel(1, 0.01).slice(1, 3)) pc.push({ t: [0.1, haut - bas, 0.1], p: [px, (bas + haut) / 2, pz], m: 'chassisNoir' })
  // Toit d'ardoise en croupe
  const debord = planOriel(1, 0.1)
  const sommet: [number, number][] = [
    [TRAVEES.centre - 0.5, 0],
    [TRAVEES.centre - 0.25, 0.12],
    [TRAVEES.centre + 0.25, 0.12],
    [TRAVEES.centre + 0.5, 0],
  ]
  pc.push({ geo: geoTronc(debord, sommet, haut, haut + toit), m: 'ardoise' })
  // Console en pierre : bandeau (inscription) puis encorbellement
  const yB = bas - 0.62
  pc.push({ geo: geoTronc(planOriel(1, 0.06), planOriel(1, 0.06), yB, bas), m: 'pierre' })
  const pointe: [number, number][] = [
    [TRAVEES.centre - 0.55, 0],
    [TRAVEES.centre - 0.3, 0.22],
    [TRAVEES.centre + 0.3, 0.22],
    [TRAVEES.centre + 0.55, 0],
  ]
  pc.push({ geo: geoTronc(pointe, planOriel(1, 0.02), yB - 0.55, yB), m: 'pierre' })
  pc.push({ t: [0.5, 0.16, 0.18], p: [TRAVEES.centre, yB - 0.63, 0.09], m: 'pierre' })
  return pc
}

// Encadrement de porte en pierre, arc Tudor et frise (Commons 3, 4)
function encadrementPorte(): Piece[] {
  const pc: Piece[] = []
  const y0 = NIVEAUX.rdc
  const lo = PORTE.largeur + 0.1
  const hp = PORTE.hauteur + 0.05
  const L = PORTE.encadrementLargeur
  const H = PORTE.encadrementHauteur
  const jamb = (L - lo) / 2
  for (const s of [-1, 1]) {
    pc.push({ t: [jamb, hp, 0.16], p: [TRAVEES.centre + s * (lo / 2 + jamb / 2), y0 + hp / 2, 0.05], m: 'pierre' })
    // Moulures verticales
    pc.push({ t: [0.05, hp, 0.05], p: [TRAVEES.centre + s * (lo / 2 + 0.06), y0 + hp / 2, 0.15], m: 'pierreFoncee' })
    pc.push({ t: [0.05, H, 0.04], p: [TRAVEES.centre + s * (L / 2 - 0.04), y0 + H / 2, 0.15], m: 'pierreFoncee' })
  }
  const hL = H - hp
  pc.push({ t: [L, hL, 0.16], p: [TRAVEES.centre, y0 + hp + hL / 2, 0.05], m: 'pierre' })
  pc.push({ t: [L, 0.06, 0.06], p: [TRAVEES.centre, y0 + H - 0.03, 0.15], m: 'pierreFoncee' })
  // Linteau mouluré au-dessus de la porte
  pc.push({ t: [lo + 0.25, 0.12, 0.08], p: [TRAVEES.centre, y0 + hp + 0.06, 0.15], m: 'pierreFoncee' })
  // Arc Tudor surbaissé (deux rampants) et frise sculptée au-dessus
  const demi = 0.75
  const fleche = 0.28
  const ang = Math.atan2(fleche, demi)
  const lg = Math.hypot(demi, fleche)
  for (const s of [-1, 1])
    pc.push({ t: [lg, 0.07, 0.06], p: [TRAVEES.centre + (s * demi) / 2, y0 + hp + 0.2 + fleche / 2, 0.16], r: [0, 0, -s * ang], m: 'pierreFoncee' })
  pc.push({ t: [L - 0.2, 0.32, 0.03], p: [TRAVEES.centre, y0 + H - 0.24, 0.14], m: 'frise', ombre: false })
  // Lanterne au-dessus de la porte
  pc.push({ t: [0.26, 0.16, 0.2], p: [TRAVEES.centre, y0 + hp + 0.35, 0.3], m: 'noir' })
  // Huisserie
  for (const s of [-1, 1]) pc.push({ t: [0.05, hp, EP], p: [TRAVEES.centre + s * (lo / 2 - 0.025), y0 + hp / 2, -EP / 2], m: 'cheneFonce' })
  pc.push({ t: [lo, 0.05, EP], p: [TRAVEES.centre, y0 + hp - 0.025, -EP / 2], m: 'cheneFonce' })
  return pc
}

// Pignons, rampants, toitures et cheminées
function toitures(): Piece[] {
  const pc: Piece[] = []
  const P = FACADE.profondeurAilesPignons
  const pignons = [
    { xa: X0, xb: X0 + FACADE.largeurTraveeGauche, base: FACADE.egout, sommet: FACADE.faitePignonLateral },
    { xa: X0 + FACADE.largeurTraveeGauche, xb: X1 - FACADE.largeurTraveeDroite, base: FACADE.egoutCentre, sommet: FACADE.faitePignonCentre },
    { xa: X1 - FACADE.largeurTraveeDroite, xb: X1, base: FACADE.egout, sommet: FACADE.faitePignonLateral },
  ]
  for (const g of pignons) {
    const cx = (g.xa + g.xb) / 2
    const demi = (g.xb - g.xa) / 2
    const ht = g.sommet - g.base
    const ang = Math.atan2(ht, demi)
    const rampant = Math.hypot(demi, ht)
    pc.push({ geo: geoPignon(g.xa, g.xb, g.base, g.sommet, P), m: 'brique770' })
    for (const s of [-1, 1]) {
      const mx = cx + (s * demi) / 2
      const my = g.base + ht / 2
      // Chaperon de pierre sur le rampant
      pc.push({ t: [rampant + 0.15, 0.16, 0.55], p: [mx - s * 0.04, my + 0.09, -0.2], r: [0, 0, -s * ang], m: 'pierre' })
      // Pan d'ardoise de l'aile
      pc.push({ t: [rampant + 0.1, 0.1, P - 0.3], p: [mx + s * 0.02, my + 0.13, -0.3 - (P - 0.3) / 2], r: [0, 0, -s * ang], m: 'ardoise' })
    }
    // Fleuron au sommet
    pc.push({ t: [0.22, 0.4, 0.22], p: [cx, g.sommet + 0.25, -0.15], m: 'pierre' })
    pc.push({ geo: new THREE.ConeGeometry(0.13, 0.35, 4), p: [cx, g.sommet + 0.62, -0.15], r: [0, Math.PI / 4, 0], m: 'pierre' })
  }
  // Plaques de pierre dans les pignons (Commons 2) : losange à quadrilobe
  // sur les pignons latéraux, plaque carrée au centre
  for (const x of [TRAVEES.gauche, TRAVEES.droite])
    pc.push({ t: [0.5, 0.5, 0.06], p: [x, FACADE.egout + 1.95, 0.03], r: [0, 0, Math.PI / 4], m: 'pierre' })
  pc.push({ t: [0.42, 0.42, 0.06], p: [TRAVEES.centre, FACADE.egoutCentre + 1.0, 0.03], m: 'pierre' })
  // Corniche d'égout
  pc.push({ t: [LARGEUR_FACADE + 0.1, 0.12, 0.2], p: [0, FACADE.egoutCentre + 0.05, 0.06], m: 'pierre' })

  // Pan de toiture principal entre les pignons, puis toit plat
  const H = FACADE.hauteurToitPrincipal
  const prof = FACADE.profondeurPanAvant
  const montee = H - FACADE.egoutCentre
  const ang = Math.atan2(montee, prof)
  const lg = Math.hypot(prof, montee)
  pc.push({ t: [LARGEUR_FACADE, 0.12, lg], p: [0, FACADE.egoutCentre + montee / 2 + 0.06, -prof / 2], r: [ang, 0, 0], m: 'ardoise' })
  pc.push({ t: [LARGEUR_FACADE, 0.2, FACADE.profondeur - prof], p: [0, H, -prof - (FACADE.profondeur - prof) / 2], m: 'pierreFoncee', ombre: true })

  // Cheminées aux extrémités, avec mitrons (Commons 2)
  for (const s of [-1, 1]) {
    const cx = s * (LARGEUR_FACADE / 2 - 0.5)
    pc.push({ t: [0.75, FACADE.hauteurCheminee - FACADE.egout + 0.6, 0.9], p: [cx, (FACADE.hauteurCheminee + FACADE.egout - 0.6) / 2, -1.6], m: 'brique770' })
    pc.push({ t: [0.9, 0.12, 1.05], p: [cx, FACADE.hauteurCheminee + 0.06, -1.6], m: 'pierre' })
    for (const dz of [-0.2, 0.2])
      pc.push({ geo: new THREE.CylinderGeometry(0.1, 0.12, 0.55, 8), p: [cx, FACADE.hauteurCheminee + 0.4, -1.6 + dz], m: 'pierreFoncee' })
  }
  return pc
}

export function Facade() {
  const m = useMateriaux()
  const pieces = useMemo(() => {
    const pc: Piece[] = []
    const y0 = NIVEAUX.rdc
    const xPorte = TRAVEES.centre
    const lo = PORTE.largeur + 0.1
    const ouvertures: Rect[] = [
      ...FENETRES.map((f) => ({ x0: f.x - f.w / 2, x1: f.x + f.w / 2, y0: f.y, y1: f.y + f.h })),
      { x0: xPorte - lo / 2, x1: xPorte + lo / 2, y0: y0, y1: y0 + PORTE.hauteur + 0.05 },
      ...[-1, 1].map((s) => {
        const cx = xPorte + s * PORTE.petiteFenetreEcart
        return { x0: cx - PORTE.petiteFenetreLargeur / 2, x1: cx + PORTE.petiteFenetreLargeur / 2, y0: y0 + 1.0, y1: y0 + 1.0 + PORTE.petiteFenetreHauteur }
      }),
    ]
    // Mur de façade (jusqu'à l'égout central), puis rehausse des travées latérales
    pc.push(...mur({ axe: 'x', plan: -EP / 2, epaisseur: EP, de: X0, a: X1, bas: -0.3, haut: FACADE.egoutCentre, ouvertures, m: 'brique770' }))
    pc.push({ t: [FACADE.largeurTraveeGauche, FACADE.egout - FACADE.egoutCentre, EP], p: [TRAVEES.gauche, (FACADE.egout + FACADE.egoutCentre) / 2, -EP / 2], m: 'brique770' })
    pc.push({ t: [FACADE.largeurTraveeDroite, FACADE.egout - FACADE.egoutCentre, EP], p: [TRAVEES.droite, (FACADE.egout + FACADE.egoutCentre) / 2, -EP / 2], m: 'brique770' })
    // Murs latéraux et arrière (enveloppe, non visitable)
    const D = FACADE.profondeur
    const Hm = FACADE.hauteurToitPrincipal
    pc.push({ t: [EP, Hm + 0.3, D], p: [X0 + EP / 2, Hm / 2 - 0.15, -D / 2], m: 'brique770', col: true })
    pc.push({ t: [EP, Hm + 0.3, D], p: [X1 - EP / 2, Hm / 2 - 0.15, -D / 2], m: 'brique770', col: true })
    pc.push({ t: [LARGEUR_FACADE, Hm + 0.3, EP], p: [0, Hm / 2 - 0.15, -D + EP / 2], m: 'brique770', col: true })
    // Bandeau de pierre sous les fenêtres du 2e étage (Commons 2)
    for (const tr of [TRAVEES.gauche, TRAVEES.droite]) {
      const w = tr === TRAVEES.gauche ? FACADE.largeurTraveeGauche : FACADE.largeurTraveeDroite
      pc.push({ t: [w, 0.12, 0.08], p: [tr, 8.82, 0.04], m: 'pierre' })
    }
    // Panneaux de pierre sculptés sous les grandes baies du rez-de-chaussée
    for (const f of FENETRES.filter((f) => f.y < 3))
      pc.push({ t: [f.w, f.y - y0 - 0.05, 0.05], p: [f.x, y0 + (f.y - y0) / 2, 0.025], m: 'frise', ombre: false })
    // Soubassement de pierre
    pc.push({ t: [LARGEUR_FACADE + 0.04, 0.12, 0.08], p: [0, y0 - 0.06, 0.04], m: 'pierre' })
    // Descentes d'eau pluviale en zinc de part et d'autre de la travée centrale
    for (const s of [-1, 1]) {
      const x = s * (FACADE.largeurTraveeCentre / 2 + 0.05)
      pc.push({ geo: new THREE.CylinderGeometry(0.055, 0.055, FACADE.egoutCentre - 0.3, 8), p: [x, (FACADE.egoutCentre + 0.3) / 2, 0.1], m: 'zinc' })
      pc.push({ t: [0.24, 0.3, 0.24], p: [x, FACADE.egoutCentre - 0.1, 0.1], m: 'zinc' })
    }
    // Fenêtres 0 et 1 : bureau du Rebbe (rez-de-chaussée) et salon de l'étage, modélisés
    FENETRES.forEach((f, i) => pc.push(...fenetre(f, i <= 1)))
    for (const s of [-1, 1]) pc.push(...petiteFenetre(xPorte + s * PORTE.petiteFenetreEcart, y0 + 1.0))
    pc.push(...oriel())
    pc.push(...encadrementPorte())
    pc.push(...toitures())
    // Seuil de la porte dans l'épaisseur du mur
    pc.push({ t: [lo, 0.2, EP], p: [xPorte, y0 - 0.1, -EP / 2], m: 'pierre', col: true })
    return pc
  }, [])

  // Inscription (texte relevé sur Commons 3 et 4) et numéro « 770 »
  const plan = useMemo(() => {
    const yB = ORIEL.bas - 0.62
    return { y: (yB + ORIEL.bas) / 2, h: 0.62, w: ORIEL.largeur - 1.1 + 0.1, z: ORIEL.saillie + 0.065 }
  }, [])
  const mat770 = useMemo(() => new THREE.MeshStandardMaterial({ map: textureTexte('770', 256, 128, '#d9cdb2', '#3a3128', 'italic bold 80px serif'), roughness: 0.9 }), [])

  return (
    <>
      <Pieces pieces={pieces} />
      <mesh position={[TRAVEES.centre, plan.y, plan.z]} material={m.inscription}>
        <planeGeometry args={[plan.w, plan.h]} />
      </mesh>
      <mesh position={[TRAVEES.centre + 0.82, NIVEAUX.rdc + 0.62, 0.14]} material={mat770}>
        <planeGeometry args={[0.26, 0.13]} />
      </mesh>
      {/* Porte principale : gonds à droite (vue de la rue), ouverture vers l'intérieur */}
      <Porte
        id="porte-principale"
        charniere={[TRAVEES.centre + PORTE.largeur / 2, NIVEAUX.rdc, -0.17]}
        largeur={PORTE.largeur}
        hauteur={PORTE.hauteur}
        sens={-1}
        angleOuverture={-1.6}
        modele="principale"
      />
      <Abords />
    </>
  )
}

// ---------------------------------------------------------------------------
// Cour, allée en brique, marches, muret et grilles
function Abords() {
  const { pieces, rampes } = useMemo(() => {
    const pc: Piece[] = []
    const yC = NIVEAUX.cour
    const yR = NIVEAUX.rdc
    const A = ABORDS
    const la = A.alleeLargeur
    const zMur = A.profondeurCour
    const nPorte = A.marchesPorte
    const hPorte = (yR - yC) / nPorte
    const zMarches = A.palierProfondeur + nPorte * A.giron
    const zMarchesRue = zMur + A.murEpaisseur
    const xL = 9.4

    // Palier devant la porte et marches (brique, nez en pierre : crownheights.info 2022)
    pc.push({ t: [3.0, yR - yC + 0.3, A.palierProfondeur], p: [0, yC + (yR - yC - 0.3) / 2, A.palierProfondeur / 2], m: 'allee', col: true })
    const e1 = escalier({ x: 0, largeur: 3.0, depart: zMarches, sens: -1, yDepart: yC, contremarche: hPorte, giron: A.giron, nombre: nPorte, m: 'allee', mNez: 'pierre' })
    pc.push(...e1.pieces)
    // Joues des marches et garde-corps en fer
    for (const s of [-1, 1]) {
      pc.push({ t: [0.3, yR - yC + 0.25, zMarches], p: [s * 1.65, yC + (yR - yC + 0.25) / 2, zMarches / 2], m: 'briqueMuret', col: true })
      pc.push({ t: [0.34, 0.06, zMarches + 0.04], p: [s * 1.65, yR + 0.28, zMarches / 2], m: 'pierre' })
      for (let i = 0; i <= 6; i++) {
        const z = 0.1 + (i * (zMarches - 0.2)) / 6
        pc.push({ t: [0.025, 0.85, 0.025], p: [s * 1.65, yR + 0.3 + 0.42, z], m: 'fer', ombre: false })
      }
      pc.push({ t: [0.05, 0.05, zMarches], p: [s * 1.65, yR + 1.15, zMarches / 2], m: 'fer', ombre: false })
    }

    // Sol de la cour : pelouse de part et d'autre, allée au centre
    pc.push({ t: [xL - la / 2, 0.8, zMur], p: [-(la / 2 + (xL - la / 2) / 2), yC - 0.4, zMur / 2], m: 'herbe', col: true })
    pc.push({ t: [xL - la / 2, 0.8, zMur], p: [la / 2 + (xL - la / 2) / 2, yC - 0.4, zMur / 2], m: 'herbe', col: true })
    const zFinAllee = zMarchesRue - A.marches * A.giron
    pc.push({ t: [la, 0.8, zFinAllee - zMarches], p: [0, yC - 0.4, (zMarches + zFinAllee) / 2], m: 'allee', col: true })

    // Marches du trottoir à la cour, dans l'ouverture du muret (photo Clio)
    const e2 = escalier({ x: 0, largeur: la, depart: zMarchesRue, sens: -1, yDepart: NIVEAUX.trottoir, contremarche: (yC - NIVEAUX.trottoir) / A.marches, giron: A.giron, nombre: A.marches, m: 'allee', mNez: 'pierre' })
    pc.push(...e2.pieces)

    // Muret de brique à chaperon de pierre, grille en fer au-dessus
    const zm = zMur + A.murEpaisseur / 2
    for (const s of [-1, 1]) {
      const de = la / 2 + 0.55
      const lg = xL - de
      const cx = s * (de + lg / 2)
      pc.push({ t: [lg, A.murHauteur + 0.3, A.murEpaisseur], p: [cx, (A.murHauteur - 0.3) / 2, zm], m: 'briqueMuret', col: true })
      pc.push({ t: [lg, 0.08, A.murEpaisseur + 0.1], p: [cx, A.murHauteur + 0.04, zm], m: 'pierre' })
      // Grille : barreaux tous les 15 cm
      const n = Math.floor(lg / 0.15)
      for (let i = 0; i <= n; i++) pc.push({ t: [0.02, 0.75, 0.02], p: [s * (de + i * 0.15), A.murHauteur + 0.45, zMur + 0.05], m: 'fer', ombre: false })
      pc.push({ t: [lg, 0.04, 0.04], p: [cx, A.murHauteur + 0.82, zMur + 0.05], m: 'fer', ombre: false })
      pc.push({ t: [lg, 0.03, 0.03], p: [cx, A.murHauteur + 0.2, zMur + 0.05], m: 'fer', ombre: false })
      // Piliers de l'entrée, chapeaux pyramidaux en pierre
      const px = s * (la / 2 + 0.28)
      pc.push({ t: [0.55, A.murHauteur + 0.65, 0.55], p: [px, (A.murHauteur + 0.65) / 2 - 0.15, zm], m: 'briqueMuret', col: true })
      pc.push({ t: [0.65, 0.1, 0.65], p: [px, A.murHauteur + 0.55, zm], m: 'pierre' })
      pc.push({ geo: new THREE.ConeGeometry(0.42, 0.35, 4), p: [px, A.murHauteur + 0.77, zm], r: [0, Math.PI / 4, 0], m: 'pierre' })
      // Thuyas de part et d'autre de l'entrée (Commons 2, 3)
      pc.push({ geo: new THREE.ConeGeometry(0.45, 2.2, 8), p: [s * 2.55, yC + 1.1, 0.7], m: 'haie' })
      // Haies basses le long du muret, côté cour
      pc.push({ t: [lg - 1.2, 0.7, 0.7], p: [s * (de + 0.6 + (lg - 1.2) / 2), yC + 0.35, zMur - 0.45], m: 'haie' })
    }
    return { pieces: pc, rampes: [e1.rampe, e2.rampe] }
  }, [])

  return (
    <>
      <Pieces pieces={pieces} />
      {rampes.map((r, i) => (
        <Invisible key={i} taille={r.taille} position={r.position} rotation={r.rotation} />
      ))}
      {/* Limites invisibles entre la cour et les parcelles voisines */}
      <Invisible taille={[0.2, 4, ABORDS.profondeurCour]} position={[-9.4, 2, ABORDS.profondeurCour / 2]} />
      <Invisible taille={[0.2, 4, ABORDS.profondeurCour]} position={[9.4, 2, ABORDS.profondeurCour / 2]} />
      <Invisible taille={[1.2, 14, 0.2]} position={[-8.85, 7, -0.1] as V3} />
      <Invisible taille={[1.2, 14, 0.2]} position={[8.85, 7, -0.1] as V3} />
    </>
  )
}
