import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, NIVEAUX, PORTE, TRAVEES } from '../../config/dimensions'
import { escalier, Invisible, mur, Pieces, type Piece, type Rect } from '../primitives'
import { Porte } from '../Porte'
import { useInteractif } from '../interaction'
import { textureTexte } from '../texturesProcedurales'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { evenementMission } from '../../missions/missions'

// RECONSTITUTION ARTISTIQUE : la disposition du hall (position de l'escalier,
// des portes) n'est documentée par aucun plan trouvé. Les matériaux suivent
// les photos du couloir (anash.org, 2021) : plâtre crème, colombages de chêne
// foncé, escalier de chêne à balustres tournés et poteaux à pommeau, lustre
// en laiton, sol moucheté.

const { xMin, xMax, zMin, zMax } = HALL
const Y0 = NIVEAUX.rdc
const Y1 = NIVEAUX.etage1
const Y2 = NIVEAUX.etage2 - NIVEAUX.dalle
const EPI = 0.15
const X_ESC0 = xMax - HALL.escalierLargeur // bord libre de l'escalier
const N_MARCHES = Math.round((Y1 - Y0) / HALL.contremarche)
const CM = (Y1 - Y0) / N_MARCHES
const Z_ESC1 = HALL.escalierDebutZ - N_MARCHES * HALL.giron // haut de l'escalier
const LP = 0.95 // largeur des portes intérieures
const LO = 1.05 // largeur des baies

// Portes intérieures (fermées dans cette phase)
const BAIES = {
  antichambre: { z0: -3.3, z1: -3.3 + LO }, // mur ouest, rez-de-chaussée
  ouestEtage: { z0: -5.6, z1: -5.6 + LO }, // mur ouest, étage
  fondRdc: { x0: -1.3, x1: -1.3 + LO }, // mur du fond, rez-de-chaussée
  fondEtage: { x0: -0.9, x1: -0.9 + LO }, // mur du fond, étage
}
const HP = 2.2 // hauteur des portes intérieures

// Colombages : poteaux verticaux, lisses et bandeau haut sur une face de mur
function colombages(axe: 'x' | 'z', plan: number, de: number, a: number, bas: number, haut: number, trous: Rect[], pas = 1.05): Piece[] {
  const pc: Piece[] = []
  const place = (u: number, y: number, lu: number, h: number): Piece =>
    axe === 'x' ? { t: [lu, h, 0.05], p: [u, y, plan], m: 'cheneFonce' } : { t: [0.05, h, lu], p: [plan, y, u], m: 'cheneFonce' }
  const libre = (u: number, y0: number, y1: number) => !trous.some((o) => u > o.x0 - 0.12 && u < o.x1 + 0.12 && y1 > o.y0 && y0 < o.y1)
  for (let u = de + 0.1; u <= a - 0.05; u += pas) {
    if (libre(u, bas, haut)) pc.push(place(u, (bas + haut) / 2, 0.14, haut - bas))
  }
  pc.push(place(a - 0.07, (bas + haut) / 2, 0.14, haut - bas))
  // Lisse médiane et bandeau sous plafond, interrompus aux baies
  for (const [y, h] of [
    [bas + 1.5, 0.1],
    [haut - 0.1, 0.2],
  ] as const) {
    const segs = trous.filter((o) => y > o.y0 && y < o.y1).sort((p, q) => p.x0 - q.x0)
    let u0 = de
    for (const o of [...segs, { x0: a, x1: a, y0: 0, y1: 0 }]) {
      if (o.x0 - u0 > 0.05) pc.push(place((u0 + o.x0) / 2, y, o.x0 - u0, h))
      u0 = o.x1
    }
  }
  // Plinthe
  const segsB = trous.filter((o) => bas + 0.05 > o.y0 && bas + 0.05 < o.y1).sort((p, q) => p.x0 - q.x0)
  let u0 = de
  for (const o of [...segsB, { x0: a, x1: a, y0: 0, y1: 0 }]) {
    if (o.x0 - u0 > 0.05) pc.push(place((u0 + o.x0) / 2, bas + 0.08, o.x0 - u0, 0.16))
    u0 = o.x1
  }
  return pc
}

// Chambranle de chêne autour d'une baie
function chambranle(axe: 'x' | 'z', plan: number, u0: number, u1: number, y0: number, h: number): Piece[] {
  const b = (u: number, y: number, lu: number, hh: number): Piece =>
    axe === 'x' ? { t: [lu, hh, 0.07], p: [u, y, plan], m: 'cheneFonce' } : { t: [0.07, hh, lu], p: [plan, y, u], m: 'cheneFonce' }
  return [b(u0 - 0.06, y0 + h / 2, 0.12, h + 0.12), b(u1 + 0.06, y0 + h / 2, 0.12, h + 0.12), b((u0 + u1) / 2, y0 + h + 0.08, u1 - u0 + 0.36, 0.16)]
}

function balustre(x: number, z: number, y0: number, h: number): Piece {
  return { geo: new THREE.CylinderGeometry(0.022, 0.03, h, 6), p: [x, y0 + h / 2, z], m: 'cheneFonce', ombre: false }
}

function poteauPommeau(x: number, z: number, y0: number): Piece[] {
  return [
    { t: [0.16, 1.2, 0.16], p: [x, y0 + 0.6, z], m: 'cheneFonce', col: true },
    { geo: new THREE.SphereGeometry(0.1, 10, 8), p: [x, y0 + 1.3, z], m: 'cheneFonce' },
    { geo: new THREE.ConeGeometry(0.05, 0.16, 8), p: [x, y0 + 1.45, z], m: 'cheneFonce' },
  ]
}

function lustre(x: number, z: number, yPlafond: number): Piece[] {
  const yC = yPlafond - 0.95
  const pc: Piece[] = [
    { geo: new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), p: [x, yPlafond - 0.4, z], m: 'laiton', ombre: false },
    { geo: new THREE.SphereGeometry(0.11, 12, 8), p: [x, yC, z], m: 'laiton', ombre: false },
    { geo: new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), p: [x, yPlafond - 0.015, z], m: 'laiton', ombre: false },
  ]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const bx = x + Math.cos(a) * 0.36
    const bz = z + Math.sin(a) * 0.36
    pc.push({ t: [0.36, 0.02, 0.02], p: [x + Math.cos(a) * 0.18, yC, z + Math.sin(a) * 0.18], r: [0, -a, 0], m: 'laiton', ombre: false })
    pc.push({ geo: new THREE.CylinderGeometry(0.05, 0.03, 0.05, 8), p: [bx, yC + 0.03, bz], m: 'laiton', ombre: false })
    pc.push({ geo: new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), p: [bx, yC + 0.11, bz], m: 'papier', ombre: false })
    pc.push({ geo: new THREE.SphereGeometry(0.03, 6, 5), p: [bx, yC + 0.19, bz], m: 'vitreEclairee', ombre: false })
  }
  return pc
}

function applique(axe: 'x' | 'z', plan: number, u: number, y: number, sens: 1 | -1): Piece[] {
  const p = (du: number, dy: number, dn: number) =>
    (axe === 'x' ? [u + du, y + dy, plan + sens * dn] : [plan + sens * dn, y + dy, u + du]) as [number, number, number]
  return [
    { t: [0.1, 0.16, 0.1], p: p(0, 0, 0.04), m: 'laiton', ombre: false },
    { geo: new THREE.CylinderGeometry(0.07, 0.05, 0.14, 8), p: p(0, 0.13, 0.12), m: 'vitreEclairee', ombre: false },
  ]
}

export function Hall() {
  const { pieces, rampe } = useMemo(() => {
    const pc: Piece[] = []
    const L = xMax - xMin
    const P = zMax - zMin
    const cx = (xMin + xMax) / 2
    const cz = (zMin + zMax) / 2

    // Sol du rez-de-chaussée et plafond de l'étage
    pc.push({ t: [L, 0.3, P], p: [cx, Y0 - 0.15, cz], m: 'sol', col: true })
    pc.push({ t: [L + 0.3, 0.2, P + 0.3], p: [cx, Y2 + 0.1, cz], m: 'platre', col: true })
    // Plancher de l'étage, percé de la trémie d'escalier
    const dalle = (x0: number, x1: number, z0: number, z1: number) => {
      pc.push({ t: [x1 - x0, 0.17, z1 - z0], p: [(x0 + x1) / 2, Y1 - 0.2 + 0.085, (z0 + z1) / 2], m: 'platre', col: true })
      pc.push({ t: [x1 - x0, 0.03, z1 - z0], p: [(x0 + x1) / 2, Y1 - 0.015, (z0 + z1) / 2], m: 'sol', col: true })
    }
    dalle(xMin, X_ESC0, zMin, zMax)
    dalle(X_ESC0, xMax, HALL.escalierDebutZ, zMax)
    dalle(X_ESC0, xMax, zMin, Z_ESC1)

    // Murs (plâtre) avec baies
    const ouest: Rect[] = [
      { x0: BAIES.antichambre.z0, x1: BAIES.antichambre.z1, y0: Y0, y1: Y0 + HP + 0.05 },
      { x0: BAIES.ouestEtage.z0, x1: BAIES.ouestEtage.z1, y0: Y1, y1: Y1 + HP + 0.05 },
    ]
    const fond: Rect[] = [
      { x0: BAIES.fondRdc.x0, x1: BAIES.fondRdc.x1, y0: Y0, y1: Y0 + HP + 0.05 },
      { x0: BAIES.fondEtage.x0, x1: BAIES.fondEtage.x1, y0: Y1, y1: Y1 + HP + 0.05 },
    ]
    pc.push(...mur({ axe: 'z', plan: xMin - EPI / 2, epaisseur: EPI, de: zMin - EPI, a: zMax, bas: Y0 - 0.2, haut: Y2 + 0.2, ouvertures: ouest, m: 'platre' }))
    pc.push(...mur({ axe: 'z', plan: xMax + EPI / 2, epaisseur: EPI, de: zMin - EPI, a: zMax, bas: Y0 - 0.2, haut: Y2 + 0.2, m: 'platre' }))
    pc.push(...mur({ axe: 'x', plan: zMin - EPI / 2, epaisseur: EPI, de: xMin - EPI, a: xMax + EPI, bas: Y0 - 0.2, haut: Y2 + 0.2, ouvertures: fond, m: 'platre' }))
    // Doublage intérieur de la façade
    const lo = PORTE.largeur + 0.1
    const facade: Rect[] = [
      { x0: TRAVEES.centre - lo / 2, x1: TRAVEES.centre + lo / 2, y0: Y0, y1: Y0 + PORTE.hauteur + 0.05 },
      ...[-1, 1].map((s) => {
        const c = TRAVEES.centre + s * PORTE.petiteFenetreEcart
        return { x0: c - PORTE.petiteFenetreLargeur / 2, x1: c + PORTE.petiteFenetreLargeur / 2, y0: Y0 + 1.0, y1: Y0 + 1.0 + PORTE.petiteFenetreHauteur }
      }),
    ]
    pc.push(...mur({ axe: 'x', plan: zMax - 0.01, epaisseur: 0.02, de: xMin, a: xMax, bas: Y0, haut: Y2, ouvertures: facade, m: 'platre', col: false }))

    // Colombages de chêne (rez-de-chaussée et étage)
    for (const [bas, haut] of [
      [Y0, Y1 - 0.2],
      [Y1, Y2],
    ]) {
      pc.push(...colombages('z', xMin + 0.025, zMin, zMax, bas, haut, ouest))
      pc.push(...colombages('x', zMin + 0.025, xMin, xMax, bas, haut, fond))
      pc.push(...colombages('x', zMax - 0.045, xMin, xMax, bas, haut, facade))
      pc.push(...colombages('z', xMax - 0.025, zMin, zMax, bas, haut, [], 1.35))
    }
    // Écharpes obliques le long de l'escalier, parallèles à la volée
    const angEsc = Math.atan2(CM, HALL.giron)
    for (const zc of [-3.6, -5.4, -7.0]) {
      const y = Y0 + 0.9 + (HALL.escalierDebutZ - zc) * Math.tan(angEsc) + 0.9
      pc.push({ t: [0.05, 0.12, 1.5], p: [xMax - 0.03, y, zc], r: [angEsc, 0, 0], m: 'cheneFonce' })
    }

    // Chambranles
    pc.push(...chambranle('z', xMin + 0.04, BAIES.antichambre.z0, BAIES.antichambre.z1, Y0, HP))
    pc.push(...chambranle('z', xMin + 0.04, BAIES.ouestEtage.z0, BAIES.ouestEtage.z1, Y1, HP))
    pc.push(...chambranle('x', zMin + 0.04, BAIES.fondRdc.x0, BAIES.fondRdc.x1, Y0, HP))
    pc.push(...chambranle('x', zMin + 0.04, BAIES.fondEtage.x0, BAIES.fondEtage.x1, Y1, HP))

    // Escalier de chêne
    const e = escalier({
      x: (X_ESC0 + xMax) / 2,
      largeur: HALL.escalierLargeur,
      depart: HALL.escalierDebutZ,
      sens: -1,
      yDepart: Y0,
      contremarche: CM,
      giron: HALL.giron,
      nombre: N_MARCHES,
      m: 'chene',
      mNez: 'cheneFonce',
    })
    pc.push(...e.pieces)
    // Écoinçon de plâtre fermant le dessous de la volée (forme en x = -z monde)
    const sous = new THREE.Shape()
    sous.moveTo(-HALL.escalierDebutZ, Y0)
    sous.lineTo(-Z_ESC1, Y0)
    sous.lineTo(-Z_ESC1, Y1 - 0.05)
    sous.closePath()
    const geoSous = new THREE.ExtrudeGeometry(sous, { depth: 0.04, bevelEnabled: false })
    geoSous.rotateY(Math.PI / 2)
    pc.push({ geo: geoSous, p: [X_ESC0 - 0.05, 0, 0], m: 'platre' })
    // Limon côté libre
    const longueurVolee = Math.hypot(N_MARCHES * HALL.giron, Y1 - Y0)
    pc.push({ t: [0.06, 0.3, longueurVolee], p: [X_ESC0 - 0.01, (Y0 + Y1) / 2 + 0.05, (HALL.escalierDebutZ + Z_ESC1) / 2], r: [angEsc, 0, 0], m: 'cheneFonce' })
    // Main courante, balustres tournés, poteaux à pommeau
    const xR = X_ESC0 + 0.04
    pc.push({ t: [0.08, 0.07, longueurVolee], p: [xR, (Y0 + Y1) / 2 + 0.9 + CM / 2, (HALL.escalierDebutZ + Z_ESC1) / 2], r: [angEsc, 0, 0], m: 'cheneFonce' })
    for (let i = 0; i < N_MARCHES; i++) {
      const yT = Y0 + CM * (i + 1)
      for (const k of [0.25, 0.75]) {
        const z = HALL.escalierDebutZ - HALL.giron * (i + k)
        const yRail = Y0 + 0.9 + CM / 2 + (HALL.escalierDebutZ - z) * Math.tan(angEsc)
        pc.push(balustre(xR, z, yT, yRail - yT))
      }
    }
    pc.push(...poteauPommeau(xR, HALL.escalierDebutZ + 0.05, Y0))
    // Garde-corps de la trémie à l'étage
    pc.push({ t: [0.08, 0.07, HALL.escalierDebutZ - Z_ESC1], p: [xR, Y1 + 0.95, (HALL.escalierDebutZ + Z_ESC1) / 2], m: 'cheneFonce' })
    for (let z = HALL.escalierDebutZ - 0.1; z > Z_ESC1 + 0.05; z -= 0.14) pc.push(balustre(xR, z, Y1, 0.92))
    pc.push({ t: [xMax - X_ESC0, 0.07, 0.08], p: [(X_ESC0 + xMax) / 2, Y1 + 0.95, HALL.escalierDebutZ + 0.03], m: 'cheneFonce' })
    for (let x = X_ESC0 + 0.12; x < xMax - 0.05; x += 0.14) pc.push(balustre(x, HALL.escalierDebutZ + 0.03, Y1, 0.92))
    pc.push(...poteauPommeau(xR, HALL.escalierDebutZ + 0.03, Y1))

    // Lustres et appliques en laiton
    pc.push(...lustre(0.3, -4.2, Y1 - 0.2))
    pc.push(...lustre(0.0, -4.5, Y2))
    pc.push(...applique('x', zMax - 0.05, -1.0, Y0 + 1.9, -1))
    pc.push(...applique('x', zMax - 0.05, 1.0, Y0 + 1.9, -1))
    pc.push(...applique('z', xMin + 0.05, -6.8, Y0 + 1.9, 1))
    pc.push(...applique('z', xMin + 0.05, -2.0, Y1 + 1.9, 1))

    // Tableau d'annonces (liège) sur le mur ouest
    pc.push({ t: [0.04, 0.95, 1.4], p: [xMin + 0.04, Y0 + 1.55, -5.1], m: 'liege' })
    pc.push({ t: [0.06, 1.05, 1.5], p: [xMin + 0.02, Y0 + 1.55, -5.1], m: 'cheneFonce' })
    const feuilles: [number, number, number, number][] = [
      [-5.5, 1.75, 0.3, 0.42],
      [-5.0, 1.8, 0.3, 0.3],
      [-4.62, 1.62, 0.25, 0.35],
      [-5.35, 1.3, 0.35, 0.25],
      [-4.85, 1.32, 0.3, 0.4],
    ]
    for (const [z, y, w, h] of feuilles) pc.push({ t: [0.01, h, w], p: [xMin + 0.065, Y0 + y, z], m: 'papier', ombre: false })

    return { pieces: pc, rampe: e.rampe }
  }, [])

  const matTitre = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textureTexte('לוח מודעות', 512, 96, '#6e3d1a', '#f2e9d0', 'bold 56px Heebo, sans-serif'), roughness: 0.7 }),
    [],
  )

  useInteractif('tableau-annonces', [xMin + 0.5, Y0 + 1.5, -5.1], 1.6, () => t('action.lireTableau'), () => {
    useGame.getState().set({ panneau: { type: 'tableau' } })
    evenementMission('interagir', 'tableau-annonces')
  })

  return (
    <>
      <Pieces pieces={pieces} />
      <Invisible taille={rampe.taille} position={rampe.position} rotation={rampe.rotation} />
      {/* Garde-corps : côté libre de la volée et bord de la trémie */}
      <Invisible taille={[0.08, Y1 + 1.1 - Y0, HALL.escalierDebutZ - Z_ESC1]} position={[X_ESC0 - 0.02, (Y0 + Y1 + 1.1) / 2, (HALL.escalierDebutZ + Z_ESC1) / 2]} />
      <Invisible taille={[xMax - X_ESC0, 1.1, 0.1]} position={[(X_ESC0 + xMax) / 2, Y1 + 0.55, HALL.escalierDebutZ + 0.03]} />
      <mesh position={[xMin + 0.07, Y0 + 2.18, -5.1]} rotation={[0, Math.PI / 2, 0]} material={matTitre}>
        <planeGeometry args={[1.2, 0.22]} />
      </mesh>
      <pointLight position={[0.3, Y1 - 1.3, -4.2]} intensity={14} distance={14} decay={1.6} color="#ffd9a0" />
      <pointLight position={[0.0, Y2 - 1.1, -4.5]} intensity={10} distance={12} decay={1.6} color="#ffd9a0" />

      {/* Portes intérieures, fermées dans cette phase */}
      <Porte id="porte-antichambre" charniere={[xMin - EPI / 2, Y0, BAIES.antichambre.z1 - 0.05]} largeur={LP} hauteur={HP} sens={1} rotationY={Math.PI / 2} angleOuverture={0} verrouillee="message.porteAntichambre" />
      <Porte id="porte-ouest-etage" charniere={[xMin - EPI / 2, Y1, BAIES.ouestEtage.z1 - 0.05]} largeur={LP} hauteur={HP} sens={1} rotationY={Math.PI / 2} angleOuverture={0} verrouillee="message.porteFermee" />
      <Porte id="porte-fond-rdc" charniere={[BAIES.fondRdc.x1 - 0.05, Y0, zMin - EPI / 2]} largeur={LP} hauteur={HP} sens={-1} angleOuverture={0} verrouillee="message.porteFermee" />
      <Porte id="porte-fond-etage" charniere={[BAIES.fondEtage.x1 - 0.05, Y1, zMin - EPI / 2]} largeur={LP} hauteur={HP} sens={-1} angleOuverture={0} verrouillee="message.porteFermee" />
    </>
  )
}
