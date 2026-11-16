import { useMemo } from 'react'
import * as THREE from 'three'
import { CuboidCollider } from '@react-three/rapier'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useMateriaux } from '../materiaux'
import { MAGASINS, type Magasin } from '../../missions/magasins'

// Devantures des magasins (16/11/2026) : vitrines en retrait garnies d'objets
// 3D propres à chaque commerce, portes à cadre, stores rayés, enseignes en
// drapeau, ardoises de prix. CHOIX DE JEU (aucune enseigne réelle) : rien ici
// n'est une reconstitution. Tout est fusionné : 2 maillages colorés par
// sommet + 1 vitre, pour ne pas alourdir la rue.

type V3 = [number, number, number]
type Lot = THREE.BufferGeometry[]

const m4 = new THREE.Matrix4()
const qq = new THREE.Quaternion()
const ee = new THREE.Euler()

function poser(lot: Lot, geo: THREE.BufferGeometry, couleur: string, p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone()
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
  qq.setFromEuler(ee.set(...r))
  g.applyMatrix4(m4.compose(new THREE.Vector3(...p), qq, new THREE.Vector3(...s)))
  const c = new THREE.Color(couleur)
  const n = g.attributes.position.count
  const tab = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) tab.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(tab, 3))
  lot.push(g)
}

const boite = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (rh: number, rb: number, h: number, seg = 16) => new THREE.CylinderGeometry(rh, rb, h, seg)
const boule = (r: number) => new THREE.SphereGeometry(r, 12, 8)
const calotte = (r: number) => new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2)

// Ombrage « cuit » dans les couleurs : la vitrine paraît éclairée de
// l'intérieur à toute heure, sans lumière supplémentaire.
function cuire(geo: THREE.BufferGeometry) {
  const nor = geo.attributes.normal
  const col = geo.attributes.color
  const l = new THREE.Vector3(0.25, 0.8, 0.55).normalize()
  for (let i = 0; i < col.count; i++) {
    const d = Math.max(0, nor.getX(i) * l.x + nor.getY(i) * l.y + nor.getZ(i) * l.z)
    const k = 0.62 + 0.38 * d
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k)
  }
  return geo
}

// --- Contenu des vitrines. `A` pose un objet dans le repère de la vitrine :
// x depuis son centre, y depuis la tablette, z depuis le milieu (+z = rue).
type Poser = (geo: THREE.BufferGeometry, couleur: string, p: V3, r?: V3, s?: V3) => void

function fond(A: Poser, larg: number, mur: string, sol: string) {
  A(boite(larg, 1.9, 0.02), mur, [0, 0.95, -0.39])
  A(boite(larg, 0.02, 0.8), sol, [0, 0.0, 0])
}

function vitrinePizzeria(A: Poser, larg: number) {
  fond(A, larg, '#f4e3bf', '#7a2a22')
  // Frise à damier rouge et blanc
  const n = 12
  for (let i = 0; i < n; i++) A(boite(larg / n, 0.16, 0.022), i % 2 ? '#fff6e6' : '#b3261e', [-larg / 2 + (larg / n) * (i + 0.5), 1.72, -0.385])
  // Four à pizza en brique, avec la braise
  A(boite(0.72, 0.9, 0.3), '#8a4a30', [-0.55, 0.45, -0.22])
  A(boite(0.8, 0.08, 0.34), '#5e2f1e', [-0.55, 0.92, -0.22])
  A(boite(0.2, 0.55, 0.2), '#6e3a26', [-0.55, 1.2, -0.25])
  A(boite(0.42, 0.3, 0.05), '#1c0d08', [-0.55, 0.42, -0.06])
  A(boite(0.32, 0.1, 0.02), '#ff8a1e', [-0.55, 0.33, -0.03])
  A(boite(0.2, 0.06, 0.02), '#ffd24a', [-0.55, 0.31, -0.025])
  // Deux pizzas présentées face à la rue
  const th = 1.15
  for (const [dx, dy] of [[0.2, 0.62], [0.72, 0.45]] as const) {
    const r: V3 = [th, 0, 0]
    A(boite(0.04, dy, 0.04), '#2a2a2a', [dx, dy / 2, -0.12])
    A(cyl(0.27, 0.27, 0.03, 24), '#d9a25a', [dx, dy, 0], r)
    A(cyl(0.235, 0.235, 0.036, 24), '#c8402a', [dx, dy, 0], r)
    A(cyl(0.21, 0.21, 0.042, 24), '#f2cf6a', [dx, dy, 0], r)
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + dx
      const u = Math.cos(a) * 0.12
      const v = Math.sin(a) * 0.12
      A(cyl(0.034, 0.034, 0.052, 10), '#9c2318', [dx + u, dy - v * Math.sin(th), v * Math.cos(th)], r)
    }
  }
  // Pile de cartons à pizza
  for (let k = 0; k < 4; k++) A(boite(0.36, 0.05, 0.36), '#e8d9b8', [-0.55, 0.035 + k * 0.052, 0.19], [0, (k - 1.5) * 0.09, 0])
  A(boite(0.36, 0.004, 0.09), '#b3261e', [-0.55, 0.22, 0.19], [0, 0.135, 0])
}

function vitrineGlacier(A: Poser, larg: number) {
  fond(A, larg, '#fdeef3', '#ffffff')
  for (let x = -larg / 2 + 0.15; x < larg / 2; x += 0.3) A(boite(0.12, 1.9, 0.022), '#f7c6d6', [x, 0.95, -0.385])
  const parfums = ['#f29ab8', '#a8e0c0', '#fff1c0', '#6b3f26', '#b9d68a', '#9fd0f0']
  // Comptoir et bacs de glace inclinés
  A(boite(1.5, 0.42, 0.34), '#f29ab8', [-0.18, 0.21, -0.18])
  A(boite(1.56, 0.03, 0.4), '#ffffff', [-0.18, 0.435, -0.18])
  parfums.forEach((c, i) => {
    A(cyl(0.1, 0.1, 0.05, 16), '#e9edf0', [-0.78 + i * 0.24, 0.5, -0.18], [0.9, 0, 0])
    A(cyl(0.085, 0.085, 0.06, 16), c, [-0.78 + i * 0.24, 0.5, -0.18], [0.9, 0, 0])
  })
  // Rangée de cornets au premier plan
  A(boite(1.2, 0.2, 0.16), '#e7a4b8', [-0.25, 0.1, 0.22])
  for (let i = 0; i < 5; i++) {
    const x = -0.73 + i * 0.24
    A(new THREE.ConeGeometry(0.065, 0.24, 12), '#d9a25a', [x, 0.32, 0.22], [Math.PI, 0, 0])
    A(boule(0.08), parfums[i], [x, 0.47, 0.22])
    if (i % 2 === 0) A(boule(0.07), parfums[(i + 2) % 6], [x, 0.58, 0.22])
  }
  // Grand cornet décoratif
  A(new THREE.ConeGeometry(0.17, 0.62, 14), '#d9a25a', [0.72, 0.42, -0.05], [Math.PI, 0, 0])
  A(boite(0.3, 0.1, 0.3), '#ffffff', [0.72, 0.05, -0.05])
  A(boule(0.2), '#f29ab8', [0.72, 0.84, -0.05])
  A(boule(0.16), '#fff1c0', [0.72, 1.08, -0.05])
  A(boule(0.05), '#c8182a', [0.72, 1.26, -0.05])
}

// Buste de présentation (sans tête) : en sirtouk, ou en chemise et talit katan
function buste(A: Poser, x: number, y: number, z: number, manteau: boolean) {
  A(cyl(0.16, 0.16, 0.03, 16), '#c9a24a', [x, y + 0.015, z])
  A(cyl(0.02, 0.02, 0.6, 8), '#c9a24a', [x, y + 0.3, z])
  A(cyl(0.05, 0.05, 0.1, 10), '#cdbb9c', [x, y + 1.47, z])
  A(boule(0.055), '#cdbb9c', [x, y + 1.53, z])
  if (manteau) {
    A(cyl(0.2, 0.28, 0.98, 14), '#151517', [x, y + 0.92, z], [0, 0, 0], [1, 1, 0.6])
    A(boite(0.54, 0.12, 0.25), '#151517', [x, y + 1.37, z])
    for (const c of [-1, 1]) A(cyl(0.075, 0.06, 0.72, 10), '#19191c', [x + c * 0.29, y + 1.03, z], [0, 0, c * 0.07])
    A(boite(0.1, 0.34, 0.02), '#f4f4f0', [x, y + 1.25, z + 0.13])
    for (let k = 0; k < 3; k++) A(boule(0.014), '#c9a24a', [x + 0.03, y + 1.02 - k * 0.14, z + 0.16])
  } else {
    // Chemise blanche et talit katan aux tsitsit
    A(cyl(0.19, 0.2, 0.68, 14), '#f1f1ec', [x, y + 1.07, z], [0, 0, 0], [1, 1, 0.6])
    A(boite(0.5, 0.11, 0.24), '#f1f1ec', [x, y + 1.37, z])
    A(boite(0.34, 0.56, 0.02), '#fbfbf6', [x, y + 1.02, z + 0.13])
    for (const yy of [0.82, 0.87]) A(boite(0.34, 0.018, 0.024), '#1a1a22', [x, y + yy, z + 0.13])
    for (const c of [-1, 1]) for (let k = 0; k < 3; k++) A(boite(0.008, 0.2, 0.008), '#ffffff', [x + c * (0.13 + k * 0.012), y + 0.64, z + 0.135])
  }
}

// Chapeau noir à bord large, incliné vers la rue
function chapeau(A: Poser, x: number, y: number, z: number, incl = 0, seg = 24) {
  const r: V3 = [incl, 0, 0]
  A(cyl(0.215, 0.215, 0.016, seg), '#111113', [x, y, z], r)
  A(cyl(0.115, 0.125, 0.14, seg), '#111113', [x, y + 0.075 * Math.cos(incl), z + 0.075 * Math.sin(incl)], r)
  A(cyl(0.128, 0.128, 0.035, seg), '#3c3c46', [x, y + 0.03 * Math.cos(incl), z + 0.03 * Math.sin(incl)], r)
}

function vitrineVetements(A: Poser, larg: number) {
  fond(A, larg, '#e6dcc6', '#3b2a1c')
  // Tringle et manteaux suspendus à l'arrière
  A(cyl(0.012, 0.012, larg - 0.3, 8), '#c9a24a', [0, 1.72, -0.3], [0, 0, Math.PI / 2])
  ;['#141416', '#1c1c22', '#22201e', '#17171b'].forEach((c, i) => A(boite(0.24, 0.85, 0.06), c, [0.05 + i * 0.3, 1.27, -0.3], [0, 0.5, 0]))
  buste(A, -0.6, 0, 0, true)
  buste(A, 0.02, 0, 0, false)
  // Pile de vêtements pliés et gartels roulés
  ;['#1c1c22', '#2a2f3c', '#141416', '#3a3a40'].forEach((c, k) => A(boite(0.32, 0.05, 0.34), c, [0.72, 0.035 + k * 0.052, 0.12], [0, k * 0.05, 0]))
  for (let k = 0; k < 3; k++) A(cyl(0.045, 0.045, 0.06, 12), '#0f0f12', [0.6 + k * 0.11, 0.28, 0.12], [Math.PI / 2, 0, 0])
}

function vitrineChemises(A: Poser, larg: number) {
  fond(A, larg, '#dde6ee', '#f4f0e6')
  const tons = ['#ffffff', '#eaf1fb', '#cfe0f5', '#f7f3e8', '#bcd3ee']
  // Rayonnages garnis de chemises pliées
  ;[0.62, 1.08, 1.54].forEach((y, e) => {
    A(boite(larg - 0.2, 0.03, 0.3), '#b08a5a', [0, y, -0.23])
    for (let i = 0; i < 5; i++) for (let k = 0; k < 3 + ((i + e) % 2); k++) A(boite(0.27, 0.045, 0.26), tons[(i + k + e) % 5], [-0.72 + i * 0.36, y + 0.04 + k * 0.048, -0.23])
  })
  // Trois chemises présentées avec leur cravate
  const th = 1.0
  const s = Math.sin(th)
  const c = Math.cos(th)
  ;(['#1f3a5f', '#6e1423', '#1f4a36'] as const).forEach((cravate, i) => {
    const x = -0.62 + i * 0.62
    const y = 0.24
    const z = 0.16
    const r: V3 = [th, 0, 0]
    A(boite(0.36, 0.3, 0.04), '#b08a5a', [x, 0.15, z - 0.14], [-0.5, 0, 0])
    A(boite(0.32, 0.04, 0.4), tons[i], [x, y, z], r)
    // Col en haut (z local négatif), cravate au centre, un cran au-dessus
    A(boite(0.16, 0.05, 0.06), '#ffffff', [x, y + 0.17 * s + 0.008 * c, z - 0.17 * c + 0.008 * s], r)
    A(boite(0.05, 0.05, 0.27), cravate, [x, y + 0.02 * s + 0.006 * c, z - 0.02 * c + 0.006 * s], r)
  })
  // Porte-cravates
  A(cyl(0.01, 0.01, 0.6, 8), '#c9a24a', [0.62, 1.38, 0.05], [0, 0, Math.PI / 2])
}

function vitrineChapeaux(A: Poser, larg: number) {
  fond(A, larg, '#d9ccb4', '#2a211a')
  A(boite(larg, 0.05, 0.022), '#c9a24a', [0, 1.6, -0.385])
  // Socles en bois de hauteurs différentes
  ;[[-0.72, 0.3], [-0.24, 0.62], [0.24, 0.95], [0.72, 0.45]].forEach(([x, h]) => {
    A(cyl(0.11, 0.13, h, 16), '#6e3d1a', [x, h / 2, -0.12])
    A(cyl(0.09, 0.09, 0.1, 14), '#cdbb9c', [x, h + 0.05, -0.12])
    chapeau(A, x, h + 0.11, -0.12, 0.25)
  })
  // Boîtes à chapeau et rangée de kippot
  A(cyl(0.2, 0.2, 0.16, 20), '#c9a24a', [0, 0.09, -0.24])
  A(cyl(0.21, 0.21, 0.03, 20), '#1b1b1d', [0, 0.185, -0.24])
  ;['#16161a', '#1b2440', '#5a1622', '#3c3c44', '#e8e0d0', '#16161a'].forEach((c, i) => A(calotte(0.075), c, [-0.55 + i * 0.22, 0.01, 0.24]))
}

// ---------------------------------------------------------------------------
// Intérieurs (16/11/2026) : on entre dans chaque magasin. Repère `A` de la
// salle : x depuis l'axe du magasin, y depuis le sol, z = -t où t est la
// distance au mur de façade (la salle va de t = 0 à SALLE.fond).
// 16/11/2026 (2) : salles approfondies (7,6 → 10,5 m), porte de 1,4 m, milieu
// dégagé : les meubles sont plaqués aux murs et alternés gauche / droite.
export const SALLE = { demiLargeur: 1.84, fond: 10.5, plafond: 3.2, comptoir: 8.8, demiPorte: 0.7 }
const PARFUMS = ['#f29ab8', '#a8e0c0', '#fff1c0', '#6b3f26', '#b9d68a', '#9fd0f0']
const TONS = ['#ffffff', '#eaf1fb', '#cfe0f5', '#f7f3e8', '#bcd3ee']

// Meubles contre lesquels on bute : [x, t, demi-largeur x, demi-profondeur t]
export const OBSTACLES: Record<string, [number, number, number, number][]> = {
  pizzeria: [[-1.38, 2.2, 0.42, 0.42], [-1.38, 4.8, 0.42, 0.42], [1.52, 6.9, 0.3, 0.4]],
  glacier: [[-1.4, 2.2, 0.4, 0.4], [-1.4, 4.8, 0.4, 0.4], [1.45, 7.3, 0.3, 0.3]],
  vetements: [[-1.6, 3.1, 0.24, 2.0], [1.6, 6.7, 0.24, 1.4]],
  chemises: [[-1.62, 3.0, 0.22, 2.0], [1.62, 6.8, 0.22, 1.3], [1.46, 2.6, 0.38, 0.62]],
  chapeaux: [[-1.62, 3.0, 0.22, 2.0], [1.62, 6.8, 0.22, 1.3], [1.46, 2.6, 0.36, 0.36]],
}

const STYLE: Record<string, { mur: string; bas: string; sol: [string, string]; comptoir: string }> = {
  pizzeria: { mur: '#f6e7c6', bas: '#b3261e', sol: ['#f3ead8', '#a8322a'], comptoir: '#8a4a30' },
  glacier: { mur: '#fdeef3', bas: '#f7c6d6', sol: ['#ffffff', '#f4b6cb'], comptoir: '#f29ab8' },
  vetements: { mur: '#e9e0cc', bas: '#1f3a5f', sol: ['#6b4a2e', '#5c3f27'], comptoir: '#3b2a1c' },
  chemises: { mur: '#e6edf3', bas: '#c9d6e2', sol: ['#f1ece0', '#ded7c6'], comptoir: '#b08a5a' },
  chapeaux: { mur: '#ddd0b6', bas: '#2a211a', sol: ['#3a2c22', '#2f241c'], comptoir: '#2a211a' },
}

function salle(A: Poser, id: string) {
  const { demiLargeur: w, fond: f, plafond: h, comptoir: tc } = SALLE
  const st = STYLE[id]
  // Sol en damier, murs, soubassement, plafond et rampes lumineuses
  const nx = 4
  const nt = 11
  for (let i = 0; i < nx; i++) for (let k = 0; k < nt; k++) A(boite((2 * w) / nx, 0.012, f / nt), st.sol[(i + k) % 2], [-w + ((2 * w) / nx) * (i + 0.5), 0.006, -(f / nt) * (k + 0.5)])
  for (const c of [-1, 1]) {
    A(boite(0.02, h, f), st.mur, [c * (w - 0.01), h / 2, -f / 2])
    A(boite(0.03, 0.95, f), st.bas, [c * (w - 0.02), 0.475, -f / 2])
  }
  A(boite(2 * w, h, 0.02), st.mur, [0, h / 2, -f + 0.01])
  A(boite(2 * w, 0.03, f), '#f4f1ea', [0, h, -f / 2])
  for (const t of [1.5, 4.5, 7.5]) A(boite(1.0, 0.05, 0.28), '#fffbe8', [0, h - 0.04, -t])
  // Comptoir sur toute la largeur, caisse
  A(boite(2 * w, 1.0, 0.6), st.comptoir, [0, 0.5, -tc])
  A(boite(2 * w, 0.05, 0.72), '#efe7d8', [0, 1.025, -tc])
  A(boite(0.36, 0.24, 0.3), '#2a2a2e', [1.1, 1.17, -tc])
  A(boite(0.26, 0.2, 0.02), '#9fd0f0', [1.1, 1.36, -tc + 0.05], [-0.3, 0, 0])
  // Rayonnage du fond, derrière le comptoir
  for (const y of [1.1, 1.65, 2.2]) A(boite(2 * w - 0.3, 0.04, 0.34), '#b08a5a', [0, y, -f + 0.2])
}

function table(A: Poser, x: number, t: number, plateau: string, rond = false) {
  A(cyl(0.05, 0.05, 0.72, 10), '#55555a', [x, 0.36, -t])
  A(cyl(0.22, 0.22, 0.03, 16), '#55555a', [x, 0.015, -t])
  A(rond ? cyl(0.4, 0.4, 0.04, 20) : boite(0.8, 0.04, 0.8), plateau, [x, 0.74, -t])
  for (const dt of [-0.62, 0.62]) {
    A(cyl(0.16, 0.16, 0.05, 14), plateau, [x, 0.46, -t - dt])
    A(cyl(0.025, 0.025, 0.44, 8), '#55555a', [x, 0.22, -t - dt])
  }
}

function pizza(A: Poser, x: number, y: number, z: number, th: number) {
  const r: V3 = [th, 0, 0]
  A(cyl(0.27, 0.27, 0.03, 20), '#d9a25a', [x, y, z], r)
  A(cyl(0.235, 0.235, 0.036, 20), '#c8402a', [x, y, z], r)
  A(cyl(0.21, 0.21, 0.042, 20), '#f2cf6a', [x, y, z], r)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + x
    const u = Math.cos(a) * 0.12
    const v = Math.sin(a) * 0.12
    A(cyl(0.034, 0.034, 0.052, 8), '#9c2318', [x + u, y - v * Math.sin(th), z + v * Math.cos(th)], r)
  }
}

function interieurPizzeria(A: Poser) {
  const { fond: f, comptoir: tc } = SALLE
  // Grand four en brique derrière le comptoir
  A(boite(1.5, 1.7, 0.5), '#8a4a30', [-0.7, 0.85, -f + 0.5])
  A(boite(1.6, 0.1, 0.56), '#5e2f1e', [-0.7, 1.75, -f + 0.5])
  A(boite(0.4, 1.3, 0.4), '#6e3a26', [-0.7, 2.5, -f + 0.45])
  A(boite(0.8, 0.5, 0.05), '#1c0d08', [-0.7, 1.15, -f + 0.76])
  A(boite(0.62, 0.16, 0.02), '#ff8a1e', [-0.7, 1.0, -f + 0.79])
  A(boite(0.4, 0.09, 0.02), '#ffd24a', [-0.7, 0.97, -f + 0.8])
  // Pizzas sur le comptoir, cartons sur le rayonnage
  for (const x of [-1.2, -0.5, 0.2]) pizza(A, x, 1.07, -tc, 0.12)
  for (let k = 0; k < 5; k++) A(boite(0.38, 0.05, 0.3), '#e8d9b8', [0.9, 1.15 + k * 0.052, -f + 0.2])
  for (let k = 0; k < 4; k++) A(boite(0.38, 0.05, 0.3), '#e8d9b8', [1.35, 1.7 + k * 0.052, -f + 0.2])
  // Deux tables et leurs tabourets, armoire à boissons
  table(A, -1.38, 2.2, '#b3261e')
  table(A, -1.38, 4.8, '#b3261e')
  A(boite(0.56, 1.9, 0.76), '#f1f1ee', [1.52, 0.95, -6.9])
  A(boite(0.02, 1.6, 0.66), '#9fc4d6', [1.23, 1.0, -6.9])
  ;['#c8182a', '#f2c200', '#2f9e44', '#1d3f8f'].forEach((c, e) => {
    for (let i = 0; i < 5; i++) A(cyl(0.04, 0.04, 0.13, 8), c, [1.26, 0.42 + e * 0.38, -6.64 - i * 0.13])
  })
}

function interieurGlacier(A: Poser) {
  const { fond: f, comptoir: tc } = SALLE
  // Bacs de glace sur le comptoir, derrière une vitre
  for (let i = 0; i < 10; i++) {
    A(cyl(0.12, 0.12, 0.05, 14), '#e9edf0', [-1.5 + i * 0.26, 1.08, -tc + 0.02], [0.5, 0, 0])
    A(cyl(0.1, 0.1, 0.06, 14), PARFUMS[i % 6], [-1.5 + i * 0.26, 1.085, -tc + 0.02], [0.5, 0, 0])
  }
  A(boite(2.8, 0.3, 0.02), '#cfe6f0', [-0.25, 1.2, -tc + 0.34])
  // Cornets et pots sur le rayonnage
  for (let i = 0; i < 9; i++) {
    A(new THREE.ConeGeometry(0.06, 0.2, 10), '#d9a25a', [-1.3 + i * 0.32, 1.22, -f + 0.2], [Math.PI, 0, 0])
    A(boule(0.07), PARFUMS[i % 6], [-1.3 + i * 0.32, 1.35, -f + 0.2])
    A(cyl(0.07, 0.06, 0.14, 12), PARFUMS[(i + 3) % 6], [-1.3 + i * 0.32, 1.74, -f + 0.2])
  }
  // Tables rondes et grand cornet décoratif
  table(A, -1.4, 2.2, '#f29ab8', true)
  table(A, -1.4, 4.8, '#a8e0c0', true)
  A(boite(0.5, 0.12, 0.5), '#ffffff', [1.45, 0.06, -7.3])
  A(new THREE.ConeGeometry(0.26, 1.0, 14), '#d9a25a', [1.45, 0.62, -7.3], [Math.PI, 0, 0])
  A(boule(0.3), '#f29ab8', [1.45, 1.3, -7.3])
  A(boule(0.24), '#fff1c0', [1.45, 1.66, -7.3])
  A(boule(0.07), '#c8182a', [1.45, 1.93, -7.3])
}

function interieurVetements(A: Poser) {
  const { demiLargeur: w, fond: f } = SALLE
  // Portant de manteaux le long du mur gauche
  A(cyl(0.015, 0.015, 4.0, 8), '#c9a24a', [-w + 0.3, 1.75, -3.1], [Math.PI / 2, 0, 0])
  for (let i = 0; i < 13; i++) A(boite(0.44, 1.05, 0.07), ['#141416', '#1c1c22', '#22201e', '#17171b'][i % 4], [-w + 0.3, 1.2, -1.2 - i * 0.3])
  // Chemises blanches et miroir à droite
  A(cyl(0.015, 0.015, 2.8, 8), '#c9a24a', [w - 0.3, 1.75, -6.7], [Math.PI / 2, 0, 0])
  for (let i = 0; i < 9; i++) A(boite(0.4, 0.75, 0.06), TONS[i % 5], [w - 0.3, 1.35, -5.5 - i * 0.3])
  A(boite(0.03, 1.7, 0.8), '#bcd6e0', [w - 0.03, 1.15, -1.3])
  A(boite(0.05, 1.8, 0.9), '#c9a24a', [w - 0.02, 1.15, -1.3])
  // Derrière le comptoir : piles pliées, deux bustes
  for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) A(boite(0.32, 0.05, 0.28), ['#1c1c22', '#2a2f3c', '#141416', '#3a3a40'][(i + k) % 4], [-1.4 + i * 0.4, 1.15 + k * 0.052, -f + 0.2])
  for (let i = 0; i < 8; i++) for (let k = 0; k < 2; k++) A(boite(0.32, 0.05, 0.28), TONS[(i + k) % 5], [-1.4 + i * 0.4, 1.7 + k * 0.052, -f + 0.2])
  buste(A, -1.0, 0, -f + 0.75, true)
  buste(A, 1.1, 0, -f + 0.75, false)
}

function rayonsMur(A: Poser, cote: 1 | -1, t0: number, long: number, garnir: (x: number, y: number, t: number, i: number, e: number) => void) {
  const { demiLargeur: w } = SALLE
  const x = cote * (w - 0.22)
  ;[0.5, 1.1, 1.7].forEach((y, e) => {
    A(boite(0.4, 0.035, long), '#b08a5a', [x, y, -(t0 + long / 2)])
    const n = Math.floor(long / 0.42)
    for (let i = 0; i < n; i++) garnir(x, y + 0.02, t0 + 0.24 + i * 0.42, i, e)
  })
  A(boite(0.04, 2.0, long), '#8f6c44', [cote * (w - 0.04), 1.0, -(t0 + long / 2)])
}

function interieurChemises(A: Poser) {
  const { fond: f } = SALLE
  const pile = (x: number, y: number, t: number, i: number, e: number) => {
    for (let k = 0; k < 3 + ((i + e) % 2); k++) A(boite(0.3, 0.045, 0.3), TONS[(i + k + e) % 5], [x, y + 0.025 + k * 0.048, -t])
  }
  rayonsMur(A, -1, 1.0, 4.0, pile)
  rayonsMur(A, 1, 5.5, 2.6, pile)
  // Table contre le mur de droite : chemises et cravates
  A(boite(0.7, 0.72, 1.2), '#b08a5a', [1.46, 0.36, -2.6])
  A(boite(0.76, 0.04, 1.26), '#efe7d8', [1.46, 0.74, -2.6])
  ;['#1f3a5f', '#6e1423', '#1f4a36', '#3a2c5a'].forEach((c, i) => {
    A(boite(0.3, 0.04, 0.24), TONS[i], [1.46, 0.78, -2.15 - i * 0.3])
    A(boite(0.22, 0.045, 0.045), c, [1.42, 0.785, -2.15 - i * 0.3])
  })
  // Fond : piles et cravates suspendues
  for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) A(boite(0.3, 0.045, 0.28), TONS[(i + k) % 5], [-1.4 + i * 0.4, 1.145 + k * 0.048, -f + 0.2])
  ;['#1f3a5f', '#6e1423', '#1f4a36', '#3a2c5a', '#8a6a1c', '#1b1b1d', '#5a1622', '#23405f', '#1f3a5f', '#6e1423'].forEach((c, i) => A(boite(0.07, 0.42, 0.015), c, [-1.3 + i * 0.29, 1.93, -f + 0.1]))
}

function interieurChapeaux(A: Poser) {
  const { demiLargeur: w, fond: f } = SALLE
  const pose = (x: number, y: number, t: number) => chapeau(A, x, y + 0.01, -t, 0, 14)
  rayonsMur(A, -1, 1.0, 4.0, pose)
  rayonsMur(A, 1, 5.5, 2.6, pose)
  // Présentoir contre le mur de droite, et miroir
  A(cyl(0.3, 0.34, 0.9, 16), '#6e3d1a', [1.46, 0.45, -2.6])
  A(cyl(0.09, 0.09, 0.14, 12), '#cdbb9c', [1.46, 0.97, -2.6])
  chapeau(A, 1.46, 1.05, -2.6, 0.2, 20)
  A(boite(0.03, 1.5, 0.7), '#bcd6e0', [w - 0.03, 1.25, -1.1])
  A(boite(0.05, 1.6, 0.8), '#c9a24a', [w - 0.02, 1.25, -1.1])
  // Fond : chapeaux, boîtes rondes, kippot
  for (let i = 0; i < 6; i++) chapeau(A, -1.3 + i * 0.52, 1.13, -f + 0.2, 0.3, 14)
  for (let i = 0; i < 5; i++) {
    A(cyl(0.2, 0.2, 0.16, 14), i % 2 ? '#c9a24a' : '#3a2c22', [-1.2 + i * 0.6, 1.75, -f + 0.2])
    A(cyl(0.21, 0.21, 0.03, 14), '#1b1b1d', [-1.2 + i * 0.6, 1.845, -f + 0.2])
  }
  ;['#16161a', '#1b2440', '#5a1622', '#3c3c44', '#e8e0d0', '#16161a', '#1b2440'].forEach((c, i) => A(calotte(0.075), c, [-1.2 + i * 0.4, 2.22, -f + 0.2]))
}

const MEUBLER: Record<string, (A: Poser) => void> = {
  pizzeria: interieurPizzeria,
  glacier: interieurGlacier,
  vetements: interieurVetements,
  chemises: interieurChemises,
  chapeaux: interieurChapeaux,
}

const GARNIR: Record<string, (A: Poser, larg: number) => void> = {
  pizzeria: vitrinePizzeria,
  glacier: vitrineGlacier,
  vetements: vitrineVetements,
  chemises: vitrineChemises,
  chapeaux: vitrineChapeaux,
}
const ICONE: Record<string, string> = { pizzeria: '🍕', glacier: '🍦', vetements: '🧥', chemises: '👔', chapeaux: '🎩' }
// Icône d'enseigne : emoji, sauf le chapeau (l'emoji est un haut-de-forme
// violet) dessiné ici en feutre noir à bord large.
function icone(g: CanvasRenderingContext2D, m: Magasin, x: number, y: number, taille: number) {
  if (m.id !== 'chapeaux') {
    g.font = `${taille}px ${EMOJI}`
    g.fillText(ICONE[m.id] ?? '', x, y)
    return
  }
  const u = taille / 100
  g.save()
  g.fillStyle = '#0c0c0e'
  g.strokeStyle = m.encre
  g.lineWidth = 3 * u
  g.beginPath()
  g.ellipse(x, y + 22 * u, 50 * u, 11 * u, 0, 0, Math.PI * 2)
  g.fill()
  g.stroke()
  g.beginPath()
  g.moveTo(x - 27 * u, y + 20 * u)
  g.lineTo(x - 24 * u, y - 26 * u)
  g.quadraticCurveTo(x, y - 40 * u, x + 24 * u, y - 26 * u)
  g.lineTo(x + 27 * u, y + 20 * u)
  g.closePath()
  g.fill()
  g.stroke()
  g.fillStyle = m.encre
  g.fillRect(x - 27 * u, y + 6 * u, 54 * u, 8 * u)
  g.restore()
}

const EMOJI = '"Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif'

function toile(w: number, h: number, dessiner: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  dessiner(g)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

// Enseigne : fond dégradé, filet, icône de chaque côté, deux langues
export function textureEnseigne(m: Magasin) {
  return toile(1024, 288, (g) => {
    g.fillStyle = m.couleur
    g.fillRect(0, 0, 1024, 288)
    const d = g.createLinearGradient(0, 0, 0, 288)
    d.addColorStop(0, 'rgba(255,255,255,0.12)')
    d.addColorStop(1, 'rgba(0,0,0,0.22)')
    g.fillStyle = d
    g.fillRect(0, 0, 1024, 288)
    g.strokeStyle = m.encre
    g.lineWidth = 6
    g.strokeRect(16, 16, 992, 256)
    icone(g, m, 120, 150, 130)
    icone(g, m, 904, 150, 130)
    g.fillStyle = m.encre
    g.font = 'bold 104px Inter, sans-serif'
    g.fillText(m.enseigne[0], 512, 100, 600)
    g.font = 'bold 88px "Frank Ruhl Libre", serif'
    g.fillText(m.enseigne[1], 512, 204, 600)
  })
}

function textureDrapeau(m: Magasin) {
  return toile(256, 256, (g) => {
    g.fillStyle = m.couleur
    g.fillRect(0, 0, 256, 256)
    icone(g, m, 128, 138, 150)
  })
}

function textureOuvert() {
  return toile(256, 96, (g) => {
    g.fillStyle = '#1d5a34'
    g.fillRect(0, 0, 256, 96)
    g.strokeStyle = '#f4f0e0'
    g.lineWidth = 4
    g.strokeRect(6, 6, 244, 84)
    g.fillStyle = '#f4f0e0'
    g.font = 'bold 38px Inter, sans-serif'
    g.fillText('OPEN', 78, 50)
    g.font = 'bold 40px "Frank Ruhl Libre", serif'
    g.fillText('פתוח', 186, 50)
  })
}

// Ardoise de trottoir : les prix viennent des données du magasin
function textureArdoise(m: Magasin) {
  return toile(256, 384, (g) => {
    g.fillStyle = '#22302a'
    g.fillRect(0, 0, 256, 384)
    g.strokeStyle = '#b08a5a'
    g.lineWidth = 14
    g.strokeRect(7, 7, 242, 370)
    g.fillStyle = '#f4f0e0'
    m.articles.slice(0, 3).forEach((a, i, tous) => {
      const y = (384 * (i + 0.5)) / tous.length
      g.font = `84px ${EMOJI}`
      g.fillText(a.icone, 78, y)
      g.font = 'bold 60px Inter, sans-serif'
      g.fillText(`${a.prix} $`, 178, y)
    })
  })
}

type Props = { x0: number; largeur: number; zFacade: number; retrait: number }

export function Vitrines({ x0, largeur: L, zFacade: Z, retrait: R }: Props) {
  const mats = useMateriaux()
  const { interieur, exterieur, verre, ouvert, parMagasin, matInterieur, matExterieur, matOuvert } = useMemo(() => {
    const dedans: Lot = []
    const dehors: Lot = []
    const vitres: THREE.BufferGeometry[] = []
    const plaques: THREE.BufferGeometry[] = []
    const zf = Z + 0.06
    MAGASINS.forEach((m, i) => {
      const cx = x0 + L * (i + 0.5)
      const wx = cx - L * 0.18
      const larg = L * 0.52
      const xP = cx + L * 0.28
      const zm = Z - R / 2
      GARNIR[m.id]?.((geo, couleur, p, r, s) => poser(dedans, geo, couleur, [wx + p[0], 0.6 + p[1], zm + p[2]], r, s), larg)
      vitres.push(new THREE.PlaneGeometry(larg, 1.9).translate(wx, 1.55, Z + 0.1))
      const I: Poser = (geo, couleur, p, r, s) => poser(dedans, geo, couleur, [cx + p[0], p[1], Z - R + p[2]], r, s)
      salle(I, m.id)
      MEUBLER[m.id]?.(I)

      const E = (geo: THREE.BufferGeometry, couleur: string, p: V3, r?: V3) => poser(dehors, geo, couleur, p, r)
      // Cadre de vitrine dans la couleur du magasin
      E(boite(larg + 0.1, 0.07, 0.06), m.couleur, [wx, 2.52, Z + 0.14])
      E(boite(larg + 0.1, 0.07, 0.06), m.couleur, [wx, 0.58, Z + 0.14])
      for (const c of [-1, 1]) E(boite(0.07, 2.0, 0.06), m.couleur, [wx + (c * (larg + 0.03)) / 2, 1.55, Z + 0.14])
      // Entrée en retrait : encadrement, paillasson, plaque « OPEN » au linteau
      for (const c of [-1, 1]) E(boite(0.07, 2.34, 0.06), m.couleur, [xP + c * (SALLE.demiPorte + 0.035), 1.15, zf + 0.1])
      E(boite(2 * SALLE.demiPorte + 0.14, 0.1, 0.06), m.couleur, [xP, 2.36, zf + 0.1])
      E(boite(2 * SALLE.demiPorte - 0.1, 0.02, 0.55), '#3a3a36', [xP, 0.012, zf + 0.5])
      plaques.push(new THREE.PlaneGeometry(0.5, 0.19).translate(xP, 2.6, zf + 0.115))
      // Corniche au-dessus de l'enseigne
      E(boite(L - 0.24, 0.1, 0.3), m.encre, [cx, 3.77, Z + 0.2])
      E(boite(L - 0.34, 0.05, 0.22), m.couleur, [cx, 3.7, Z + 0.17])
      // Store : rayé pour les commerces de bouche, uni et court pour les autres
      const rayures = m.id === 'pizzeria' || m.id === 'glacier'
      const prof = rayures ? 0.9 : 0.5
      const th = 0.38
      const lw = L - 0.5
      const nb = rayures ? 11 : 1
      const yc = 2.66
      const zc = zf + 0.08 + (prof / 2) * Math.cos(th)
      const yav = yc - (prof / 2) * Math.sin(th)
      const zav = zc + (prof / 2) * Math.cos(th)
      for (let k = 0; k < nb; k++) {
        const couleur = k % 2 ? '#fff6e6' : m.couleur
        const x = cx - lw / 2 + (lw / nb) * (k + 0.5)
        E(boite(lw / nb, 0.04, prof), couleur, [x, yc, zc], [th, 0, 0])
        E(boite(lw / nb, 0.2, 0.025), couleur, [x, yav - 0.1, zav])
      }
      // Enseigne en drapeau sur le pilier de droite : potence et cerclage
      const xr = Math.min(cx + L / 2, x0 + L * MAGASINS.length - 0.12)
      E(boite(0.04, 0.04, 0.8), '#161616', [xr, 3.5, zf + 0.42])
      for (const dz of [0.3, 0.7]) E(boite(0.015, 0.08, 0.015), '#161616', [xr, 3.45, zf + dz])
      E(new THREE.TorusGeometry(0.3, 0.028, 8, 28), m.encre === '#fff4e0' || m.encre === '#f2e9d0' ? '#c9a24a' : m.encre, [xr, 3.1, zf + 0.5], [0, Math.PI / 2, 0])
      // Ardoise de trottoir (commerces de bouche)
      if (rayures) {
        const xa = cx - L / 2 + 0.5
        for (const c of [-1, 1]) E(boite(0.5, 0.82, 0.03), '#b08a5a', [xa, 0.4, zf + 0.75 + c * 0.11], [-c * 0.26, 0, 0])
      }
    })
    const parMagasin = MAGASINS.map((m, i) => {
      const cx = x0 + L * (i + 0.5)
      return {
        id: m.id,
        cx,
        xr: Math.min(cx + L / 2, x0 + L * MAGASINS.length - 0.12),
        xa: cx - L / 2 + 0.5,
        dehors: m.id === 'pizzeria' || m.id === 'glacier',
        ardoise: new THREE.MeshBasicMaterial({ map: textureArdoise(m) }),
        enseigne: new THREE.MeshStandardMaterial({ map: textureEnseigne(m), roughness: 0.55 }),
        drapeau: new THREE.MeshStandardMaterial({ map: textureDrapeau(m), roughness: 0.6, side: THREE.DoubleSide }),
      }
    })
    return {
      interieur: cuire(mergeGeometries(dedans)),
      exterieur: mergeGeometries(dehors),
      verre: mergeGeometries(vitres),
      ouvert: mergeGeometries(plaques),
      parMagasin,
      matInterieur: new THREE.MeshBasicMaterial({ vertexColors: true }),
      matExterieur: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }),
      matOuvert: new THREE.MeshStandardMaterial({ map: textureOuvert(), roughness: 0.6 }),
    }
  }, [x0, L, Z, R])

  const zf = Z + 0.06
  return (
    <>
      <mesh geometry={interieur} material={matInterieur} />
      <mesh geometry={exterieur} material={matExterieur} castShadow receiveShadow />
      <mesh geometry={verre} material={mats.verreAbri} />
      <mesh geometry={ouvert} material={matOuvert} />
      {parMagasin.map((p) => (
        <group key={p.id}>
          <mesh position={[p.cx, 3.22, zf + 0.13]} material={p.enseigne}>
            <planeGeometry args={[L - 0.4, 0.9]} />
          </mesh>
          <mesh position={[p.xr, 3.1, zf + 0.5]} rotation={[0, Math.PI / 2, 0]} material={p.drapeau}>
            <circleGeometry args={[0.29, 28]} />
          </mesh>
          {/* Tableau des prix au mur du fond, au-dessus du rayonnage */}
          <mesh position={[p.cx - 1.25, 2.72, Z - R - SALLE.fond + 0.03]} material={p.ardoise}>
            <planeGeometry args={[0.56, 0.84]} />
          </mesh>
          {p.dehors && (
            <>
              <mesh position={[p.xa, 0.41, zf + 0.88]} rotation={[-0.26, 0, 0]} material={p.ardoise}>
                <planeGeometry args={[0.42, 0.66]} />
              </mesh>
              <CuboidCollider args={[0.25, 0.4, 0.2]} position={[p.xa, 0.4, zf + 0.75]} />
            </>
          )}
        </group>
      ))}
    </>
  )
}
