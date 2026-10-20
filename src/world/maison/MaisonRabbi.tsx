import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NIVEAUX, FENETRES } from '../../config/dimensions'
import { ANTICHAMBRE, APPARTEMENT, BUREAU, COULOIR, MAISON, PETIT_ZAL } from '../../config/maison'
import { PiecesLibres, type PieceLibre } from '../grand-zal/PiecesLibres'
import { useMateriauxZal } from '../grand-zal/materiauxZal'
import { useMateriaux } from '../materiaux'
import { Porte } from '../Porte'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { bibliothequeVitree, chaise, lustre, murLibre, solPlafond } from './outils'

// Pièces du 770 derrière le hall : antichambre « Gan Eden HaTa'hton », bureau
// du Rebbe (porte ouverte, fauteuil VIDE, aucun PNJ, aucune image du Rebbe),
// couloir, petit zal, et à l'étage l'appartement (fermé à clé ; la clé est
// dans une armoire de l'antichambre). Voir config/maison.ts pour ce qui est
// confirmé et ce qui est reconstitué.

const Y0 = NIVEAUX.rdc // 1,0
const Y1 = NIVEAUX.etage1 // 4,8
const P0 = Y1 - NIVEAUX.dalle // plafond du rez-de-chaussée : 4,6
const P1 = NIVEAUX.etage2 - NIVEAUX.dalle // plafond de l'étage : 8,0
const EP = MAISON.ep
const XO = MAISON.xOuest
const XE = MAISON.xEst

function useMateriauxMaison() {
  const m = useMateriaux()
  const z = useMateriauxZal()
  return useMemo(
    () => ({
      ...z,
      platre: m.platre,
      sol: m.sol,
      laiton: m.laiton,
      ampoule: m.vitreEclairee,
      cheneFonce: m.cheneFonce,
      plancher: (() => {
        const c = m.chene.clone()
        c.color.set('#d9a06a')
        return c
      })(),
      cuir: new THREE.MeshStandardMaterial({ color: '#a0522d', roughness: 0.45 }),
      verre: new THREE.MeshStandardMaterial({ color: '#cfe0e6', metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }),
      plateauVerre: new THREE.MeshStandardMaterial({ color: '#9fb6b8', metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }),
      vertMetal: new THREE.MeshStandardMaterial({ color: '#4c5a46', metalness: 0.5, roughness: 0.5 }),
      veloursNoir: new THREE.MeshStandardMaterial({ color: '#111114', roughness: 0.9 }),
      noir: m.noir,
      housse: new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: 0.2, roughness: 0.3 }),
      tissuCanape: new THREE.MeshStandardMaterial({ color: '#6b5a44', roughness: 0.9 }),
      fauxMarbre: new THREE.MeshStandardMaterial({ color: '#6b4630', roughness: 0.35 }),
    }),
    [m, z],
  )
}
type MM = ReturnType<typeof useMateriauxMaison>

// ---------------------------------------------------------------------------
// Structure : sols, plafonds, cloisons, doublages
function structure(m: MM): PieceLibre[] {
  const pc: PieceLibre[] = []
  const B = BUREAU
  const A = ANTICHAMBRE
  const C = COULOIR
  const Z = PETIT_ZAL
  // Rez-de-chaussée
  pc.push(...solPlafond(B.x0, B.x1 + EP / 2, B.z0, B.z1, Y0, P0, m.plancher, m.platre))
  pc.push(...solPlafond(A.bandeX0 + EP / 2, A.x1, B.z0, B.z1, Y0, P0, m.sol, m.platre))
  pc.push(...solPlafond(XO, A.x1, A.zArriere, B.z0, Y0, P0, m.sol, m.platre))
  pc.push(...solPlafond(C.x0, C.x1, C.z0, C.z1, Y0, P0, m.sol, m.platre))
  pc.push(...solPlafond(Z.x0, Z.x1, Z.z0, Z.z1, Y0, P0, m.plancher, m.platre))
  // Étage (le plancher de l'étage est le dessus de la dalle du rez-de-chaussée)
  pc.push(...solPlafond(XO, A.x1, A.zArriere, APPARTEMENT.z1, Y1, P1, m.plancher, m.platre, 0.03))
  pc.push(...solPlafond(C.x0, C.x1, C.z0, C.z1, Y1, P1, m.sol, m.platre, 0.03))
  pc.push(...solPlafond(Z.x0, Z.x1, Z.z0, Z.z1, Y1, P1, m.plancher, m.platre, 0.03))

  for (const [bas, haut] of [
    [Y0 - 0.2, P0 + 0.2],
    [Y1 - 0.2, P1 + 0.2],
  ]) {
    const rdc = bas < Y1 - 1
    // Cloison bureau / antichambre (porte) et bureau / arrière de l'antichambre
    if (rdc) {
      pc.push(...murLibre('z', B.x1, EP, B.z0, B.z1, bas, haut, [{ x0: B.porteZ0, x1: B.porteZ1, y0: Y0, y1: Y0 + 2.25 }], m.lambris))
      pc.push(...murLibre('x', B.z0, EP, B.x0, B.x1 + EP / 2, bas, haut, [], m.lambris))
    } else {
      // Étage : cloison salon / cabinet avec un passage
      pc.push(...murLibre('x', APPARTEMENT.cloisonZ, EP, XO, A.x1, bas, haut, [{ x0: -5.6, x1: -4.5, y0: Y1, y1: Y1 + 2.3 }], m.platre))
    }
    // Mur nord de l'aile ouest (prolonge le mur du fond du hall)
    pc.push(...murLibre('x', A.zArriere - EP / 2, EP, XO, A.x1, bas, haut, [], m.platre))
    // Couloir
    pc.push(...murLibre('z', C.x0 - EP / 2, EP, C.z0, C.z1 + 0.05, bas, haut, [], m.platre))
    pc.push(...murLibre('z', C.x1 + EP / 2, EP, C.z0, C.z1 + 0.05, bas, haut, [], m.platre))
    // Mur sud du petit zal / de la salle de l'étage, avec l'entrée depuis le couloir
    const y = rdc ? Y0 : Y1
    pc.push(...murLibre('x', Z.z1 + EP / 2, EP, XO, XE, bas, haut, [{ x0: C.x0 + 0.4, x1: C.x1 - 0.4, y0: y, y1: y + 2.6 }], m.platre))
    // Doublages des murs extérieurs (la brique reste à l'extérieur)
    pc.push({ t: [0.03, haut - bas, B.z1 - Z.z0], p: [XO + 0.015, (bas + haut) / 2, (B.z1 + Z.z0) / 2], mat: m.platre, col: false, ombre: false })
    pc.push({ t: [0.03, haut - bas, Z.z1 - Z.z0], p: [XE - 0.015, (bas + haut) / 2, (Z.z0 + Z.z1) / 2], mat: m.platre, col: false, ombre: false })
    pc.push({ t: [XE - XO, haut - bas, 0.03], p: [0, (bas + haut) / 2, Z.z0 + 0.015], mat: m.platre, col: false, ombre: false })
  }
  // Doublage intérieur de la façade, percé pour les fenêtres 0 (rez-de-chaussée) et 1 (étage)
  const [f0, f1] = FENETRES
  pc.push(...murLibre('x', BUREAU.z1 - 0.02, 0.03, XO, B.x1, Y0, P0, [{ x0: f0.x - f0.w / 2, x1: f0.x + f0.w / 2, y0: f0.y, y1: f0.y + f0.h }], m.lambris, false))
  pc.push(...murLibre('x', BUREAU.z1 - 0.02, 0.03, B.x1, A.x1, Y0, P0, [], m.platre, false))
  pc.push(...murLibre('x', APPARTEMENT.z1 - 0.02, 0.03, XO, A.x1, Y1, P1, [{ x0: f1.x - f1.w / 2, x1: f1.x + f1.w / 2, y0: f1.y, y1: f1.y + f1.h }], m.platre, false))
  return pc
}

// ---------------------------------------------------------------------------
// Bureau du Rebbe (photos anash.org 2025)
function bureau(m: MM): PieceLibre[] {
  const pc: PieceLibre[] = []
  const B = BUREAU
  // Lambris de chêne foncé sur les murs ouest (doublage) et bibliothèques vitrées
  pc.push({ t: [0.03, P0 - Y0, B.z1 - B.z0], p: [B.x0 + 0.03, (Y0 + P0) / 2, (B.z0 + B.z1) / 2], mat: m.lambris, col: false })
  pc.push(...bibliothequeVitree('x', B.x0 + 0.3, B.x1 - 0.4, B.z0 + 0.08, 1, Y0, m.boisFonce, m.livres, m.verre))
  pc.push(...bibliothequeVitree('z', B.z0 + 0.6, B.z1 - 1.3, B.x0 + 0.04, 1, Y0, m.boisFonce, m.livres, m.verre))
  // Corniche moulurée
  pc.push({ t: [B.x1 - B.x0, 0.14, 0.1], p: [(B.x0 + B.x1) / 2, P0 - 0.07, B.z0 + 0.1], mat: m.boisFonce })
  pc.push({ t: [0.1, 0.14, B.z1 - B.z0], p: [B.x0 + 0.08, P0 - 0.07, (B.z0 + B.z1) / 2], mat: m.boisFonce })
  // Grand bureau à plateau de verre, tiroirs
  const bx = -5.7
  const bz = -2.75
  pc.push({ t: [1.9, 0.05, 0.95], p: [bx, Y0 + 0.76, bz], mat: m.boisFonce, col: true })
  pc.push({ t: [1.92, 0.012, 0.97], p: [bx, Y0 + 0.79, bz], mat: m.plateauVerre, ombre: false })
  for (const s of [-1, 1]) {
    pc.push({ t: [0.5, 0.72, 0.9], p: [bx + s * 0.68, Y0 + 0.37, bz], mat: m.boisFonce, col: true })
    for (let k = 0; k < 3; k++) pc.push({ t: [0.1, 0.03, 0.02], p: [bx + s * 0.68, Y0 + 0.2 + k * 0.22, bz - 0.46], mat: m.laiton, ombre: false })
  }
  pc.push({ t: [0.7, 0.01, 0.5], p: [bx + 0.1, Y0 + 0.8, bz], mat: m.bordeaux, ombre: false })
  // Livres sur le bureau
  for (let k = 0; k < 4; k++) pc.push({ t: [0.24, 0.035, 0.32], p: [bx - 0.4, Y0 + 0.82 + k * 0.036, bz + 0.1], mat: k % 2 ? m.bordeaux : m.livres, ombre: false })
  // Téléphone ancien (années 1950)
  pc.push({ t: [0.2, 0.09, 0.22], p: [bx + 0.7, Y0 + 0.84, bz + 0.15], mat: m.noir, ombre: false })
  pc.push({ geo: new THREE.CapsuleGeometry(0.03, 0.16, 3, 8), p: [bx + 0.7, Y0 + 0.92, bz + 0.15], r: [0, 0, Math.PI / 2], mat: m.noir, ombre: false })
  // Fauteuil de cuir fauve, VIDE, derrière le bureau
  const fz = bz - 0.85
  pc.push({ t: [0.6, 0.12, 0.55], p: [bx, Y0 + 0.47, fz], mat: m.cuir })
  pc.push({ t: [0.58, 0.75, 0.1], p: [bx, Y0 + 0.9, fz - 0.27], r: [-0.1, 0, 0], mat: m.cuir })
  for (const s of [-1, 1]) {
    pc.push({ t: [0.09, 0.07, 0.55], p: [bx + s * 0.32, Y0 + 0.72, fz], mat: m.cuir })
    pc.push({ t: [0.05, 0.25, 0.05], p: [bx + s * 0.32, Y0 + 0.6, fz + 0.2], mat: m.boisFonce })
    for (const dz of [-0.22, 0.22]) pc.push({ t: [0.05, 0.42, 0.05], p: [bx + s * 0.25, Y0 + 0.21, fz + dz], mat: m.boisFonce })
  }
  // Petite table ronde sculptée (Rebbe Maharash), sous sa housse
  const tx = -4.45
  const tz = -4.25
  pc.push({ geo: new THREE.CylinderGeometry(0.46, 0.46, 0.06, 24), p: [tx, Y0 + 0.74, tz], mat: m.housse })
  pc.push({ geo: new THREE.CylinderGeometry(0.47, 0.47, 0.16, 24, 1, true), p: [tx, Y0 + 0.66, tz], mat: m.housse, ombre: false })
  pc.push({ geo: new THREE.CylinderGeometry(0.07, 0.11, 0.55, 10), p: [tx, Y0 + 0.36, tz], mat: m.boisFonce })
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    pc.push({ t: [0.38, 0.06, 0.07], p: [tx + Math.cos(a) * 0.17, Y0 + 0.08, tz + Math.sin(a) * 0.17], r: [0, -a, 0.25], mat: m.boisFonce })
  }
  pc.push({ t: [0.2, 0.18, 0.28], p: [tx + 0.05, Y0 + 0.86, tz], mat: m.livres, ombre: false })
  // Deux pupitres sous housse de velours noir frangée d'or
  for (const [px, pz] of [
    [-7.0, -3.3],
    [-7.0, -2.3],
  ]) {
    pc.push({ t: [0.55, 1.0, 0.5], p: [px, Y0 + 0.5, pz], mat: m.veloursNoir, col: true })
    pc.push({ t: [0.6, 0.08, 0.55], p: [px, Y0 + 0.9, pz], mat: m.or, ombre: false })
  }
  // Classeur métallique vert
  pc.push({ t: [0.5, 1.3, 0.6], p: [B.x1 - 0.35, Y0 + 0.65, B.z1 - 0.5], mat: m.vertMetal, col: true })
  // Stores vénitiens de bois, à demi baissés, devant la fenêtre
  const f = FENETRES[0]
  for (let y = f.y + f.h - 0.06; y > f.y + f.h * 0.55; y -= 0.06)
    pc.push({ t: [f.w, 0.012, 0.05], p: [f.x, y, B.z1 - 0.12], r: [0.5, 0, 0], mat: m.plancher, ombre: false })
  // Lustre et horloge murale
  pc.push(...lustre((B.x0 + B.x1) / 2, (B.z0 + B.z1) / 2, P0, m.laiton, m.ampoule))
  pc.push({ geo: new THREE.CylinderGeometry(0.17, 0.17, 0.05, 20), p: [B.x1 - 0.12, Y0 + 2.6, -1.6], r: [0, 0, Math.PI / 2], mat: m.horloge, ombre: false })
  // Tapis devant la porte (photo 02)
  pc.push({ t: [0.9, 0.01, 1.2], p: [B.x1 - 0.6, Y0 + 0.005, (B.porteZ0 + B.porteZ1) / 2], mat: m.peintureBlanche, ombre: false })
  return pc
}

// ---------------------------------------------------------------------------
// Antichambre « Gan Eden HaTa'hton » : lambris bas, bancs d'attente, armoire
function antichambre(m: MM): PieceLibre[] {
  const pc: PieceLibre[] = []
  const A = ANTICHAMBRE
  // Lambris bas (faux marbre, comme dans le couloir photographié en 2021)
  pc.push({ t: [A.x1 - XO, 1.1, 0.02], p: [(XO + A.x1) / 2, Y0 + 0.55, A.zArriere + 0.02], mat: m.fauxMarbre, col: false })
  pc.push({ t: [0.02, 1.1, A.zArriere - BUREAU.z0], p: [XO + 0.05, Y0 + 0.55, (A.zArriere + BUREAU.z0) / 2], mat: m.fauxMarbre, col: false })
  // Bancs d'attente le long du mur du fond
  for (const x of [-6.6, -4.4]) {
    pc.push({ t: [1.8, 0.05, 0.42], p: [x, Y0 + 0.45, A.zArriere + 0.3], mat: m.bancs, col: true })
    pc.push({ t: [1.8, 0.45, 0.05], p: [x, Y0 + 0.72, A.zArriere + 0.1], mat: m.bancs })
    for (const dx of [-0.8, 0.8]) pc.push({ t: [0.05, 0.43, 0.38], p: [x + dx, Y0 + 0.21, A.zArriere + 0.3], mat: m.boisFonce })
  }
  // Armoire de bois (la clé de l'étage y est rangée)
  pc.push({ t: [1.2, 2.1, 0.55], p: [XO + 0.32, Y0 + 1.05, -6.3], mat: m.boisFonce, col: true })
  pc.push({ t: [0.02, 1.9, 0.5], p: [XO + 0.6, Y0 + 1.05, -6.3], mat: m.cheneFonce, ombre: false })
  pc.push({ t: [0.03, 0.12, 0.02], p: [XO + 0.62, Y0 + 1.1, -6.25], mat: m.laiton, ombre: false })
  pc.push(...lustre((XO + A.x1) / 2, (A.zArriere + BUREAU.z0) / 2, P0, m.laiton, m.ampoule))
  pc.push(...lustre((A.bandeX0 + A.x1) / 2, -2.6, P0, m.laiton, m.ampoule, 4))
  return pc
}

// ---------------------------------------------------------------------------
// Couloir (faux marbre, appliques : photos anash.org 2021) et petit zal
function couloirEtPetitZal(m: MM): PieceLibre[] {
  const pc: PieceLibre[] = []
  const C = COULOIR
  const Z = PETIT_ZAL
  for (const x of [C.x0 + 0.02, C.x1 - 0.02]) pc.push({ t: [0.02, 1.2, C.z1 - C.z0], p: [x, Y0 + 0.6, (C.z0 + C.z1) / 2], mat: m.fauxMarbre, col: false })
  pc.push(...lustre((C.x0 + C.x1) / 2, -10.4, P0, m.laiton, m.ampoule, 4))
  // Petit zal : Aron contre le mur est, bimah au centre, bancs face à l'est,
  // bibliothèques au fond. RECONSTITUTION ARTISTIQUE.
  const zc = (Z.z0 + Z.z1) / 2
  pc.push({ t: [1.4, 0.3, 3.2], p: [XE - 0.7, Y0 + 0.15, zc], mat: m.bancs, col: true })
  pc.push({ t: [0.6, 2.6, 2.0], p: [XE - 0.32, Y0 + 0.3 + 1.3, zc], mat: m.boisDore, col: true })
  pc.push({ t: [0.03, 2.1, 1.5], p: [XE - 0.64, Y0 + 0.3 + 1.2, zc], mat: m.bordeaux })
  pc.push({ t: [0.06, 0.25, 1.65], p: [XE - 0.66, Y0 + 0.3 + 2.25, zc], mat: m.or, ombre: false })
  pc.push({ t: [0.4, 0.15, 1.0], p: [XE - 1.6, Y0 + 0.075, zc], mat: m.bancs, col: true })
  // Bimah
  pc.push({ t: [2.0, 0.25, 1.6], p: [0.8, Y0 + 0.125, zc], mat: m.bancs, col: true })
  pc.push({ t: [1.0, 0.9, 1.2], p: [1.0, Y0 + 0.25 + 0.45, zc], mat: m.boisFonce, col: true })
  pc.push({ t: [1.06, 0.03, 1.26], p: [1.0, Y0 + 0.25 + 0.92, zc], mat: m.bordeaux, ombre: false })
  for (const s of [-1, 1]) pc.push({ t: [2.0, 0.9, 0.06], p: [0.8, Y0 + 0.25 + 0.45, zc + s * 0.8], mat: m.boisFonce, col: true })
  // Bancs (face à l'est), en deux blocs
  for (const x of [-6.6, -5.4, -4.2, -3.0, 3.0, 4.2]) {
    for (const [za, zb] of [
      [Z.z1 - 0.6, zc + 0.9],
      [zc - 0.9, Z.z0 + 0.8],
    ]) {
      const L = za - zb
      const zm = (za + zb) / 2
      pc.push({ t: [0.42, 0.05, L], p: [x, Y0 + 0.45, zm], mat: m.bancs, col: true })
      pc.push({ t: [0.05, 0.5, L], p: [x - 0.23, Y0 + 0.75, zm], mat: m.bancs, col: true })
      for (const z of [za - 0.03, zb + 0.03]) pc.push({ t: [0.5, 0.9, 0.06], p: [x - 0.04, Y0 + 0.45, z], mat: m.boisFonce, col: true })
    }
  }
  // Bibliothèques le long du mur du fond (nord)
  pc.push(...bibliothequeVitree('x', XO + 0.3, XE - 1.6, Z.z0 + 0.03, 1, Y0, m.boisFonce, m.livres, m.verre, 2.3))
  for (const x of [-4.5, 0.5, 4.5]) pc.push(...lustre(x, zc, P0, m.laiton, m.ampoule))
  return pc
}

// ---------------------------------------------------------------------------
// Étage : appartement (RECONSTITUTION ARTISTIQUE sobre, sans aucun portrait)
function appartement(m: MM): PieceLibre[] {
  const pc: PieceLibre[] = []
  const Ap = APPARTEMENT
  const Z = PETIT_ZAL
  // Salon (avant, fenêtre sur la rue)
  const sz = (Ap.cloisonZ + Ap.z1) / 2
  pc.push({ t: [3.2, 0.01, 2.2], p: [-5.0, Y1 + 0.005, sz], mat: m.tapis, ombre: false })
  pc.push({ t: [2.0, 0.42, 0.8], p: [-5.0, Y1 + 0.21, Ap.cloisonZ + 0.55], mat: m.tissuCanape, col: true })
  pc.push({ t: [2.0, 0.55, 0.18], p: [-5.0, Y1 + 0.6, Ap.cloisonZ + 0.2], mat: m.tissuCanape })
  for (const s of [-1, 1]) {
    pc.push({ t: [0.2, 0.6, 0.8], p: [-5.0 + s * 1.05, Y1 + 0.3, Ap.cloisonZ + 0.55], mat: m.tissuCanape })
    pc.push(...chaise(-5.0 + s * 1.6, sz + 0.3, s > 0 ? -2.2 : 2.2, Y1, m.boisFonce, m.tissuCanape))
  }
  pc.push({ geo: new THREE.CylinderGeometry(0.45, 0.45, 0.04, 20), p: [-5.0, Y1 + 0.5, sz + 0.2], mat: m.boisFonce, col: false })
  pc.push({ geo: new THREE.CylinderGeometry(0.06, 0.06, 0.48, 8), p: [-5.0, Y1 + 0.25, sz + 0.2], mat: m.boisFonce })
  pc.push(...bibliothequeVitree('z', Ap.cloisonZ + 0.3, Ap.z1 - 0.5, XO + 0.04, 1, Y1, m.boisFonce, m.livres, m.verre, 2.3))
  pc.push(...lustre(-5.0, sz, P1, m.laiton, m.ampoule))
  // Cabinet (arrière) : bureau, chaise vide, bibliothèques
  const cz = (Ap.zArriere + Ap.cloisonZ) / 2
  pc.push({ t: [1.5, 0.05, 0.8], p: [-6.0, Y1 + 0.76, cz], mat: m.boisFonce, col: true })
  for (const s of [-1, 1]) pc.push({ t: [0.4, 0.72, 0.75], p: [-6.0 + s * 0.52, Y1 + 0.37, cz], mat: m.boisFonce, col: true })
  pc.push(...chaise(-6.0, cz - 0.75, 0, Y1, m.boisFonce, m.cuir))
  pc.push(...bibliothequeVitree('x', XO + 0.3, Ap.x1 - 0.3, Ap.zArriere + 0.03, 1, Y1, m.boisFonce, m.livres, m.verre, 2.3))
  pc.push(...lustre(-5.0, cz, P1, m.laiton, m.ampoule))
  // Couloir de l'étage et salle à manger (au-dessus du petit zal)
  pc.push(...lustre((COULOIR.x0 + COULOIR.x1) / 2, -10.4, P1, m.laiton, m.ampoule, 4))
  const zc = (Z.z0 + Z.z1) / 2
  pc.push({ t: [5.0, 0.01, 2.6], p: [0, Y1 + 0.005, zc], mat: m.tapis, ombre: false })
  pc.push({ t: [4.0, 0.06, 1.2], p: [0, Y1 + 0.76, zc], mat: m.boisFonce, col: true })
  for (const dx of [-1.85, 1.85]) for (const dz of [-0.5, 0.5]) pc.push({ t: [0.07, 0.74, 0.07], p: [dx, Y1 + 0.37, zc + dz], mat: m.boisFonce })
  for (let i = 0; i < 4; i++) {
    const x = -1.5 + i
    pc.push(...chaise(x, zc - 0.95, 0, Y1, m.boisFonce, m.bordeaux))
    pc.push(...chaise(x, zc + 0.95, Math.PI, Y1, m.boisFonce, m.bordeaux))
  }
  pc.push({ t: [2.4, 0.95, 0.5], p: [5.5, Y1 + 0.475, Z.z0 + 0.3], mat: m.boisFonce, col: true })
  pc.push(...bibliothequeVitree('x', XO + 0.3, -1.0, Z.z0 + 0.03, 1, Y1, m.boisFonce, m.livres, m.verre, 2.3))
  for (const x of [-4.0, 0, 4.0]) pc.push(...lustre(x, zc, P1, m.laiton, m.ampoule))
  return pc
}

// ---------------------------------------------------------------------------
export function MaisonRabbi() {
  const m = useMateriauxMaison()
  const pieces = useMemo(() => [...structure(m), ...bureau(m), ...antichambre(m), ...couloirEtPetitZal(m), ...appartement(m)], [m])
  return (
    <>
      <PiecesLibres pieces={pieces} />
      {/* Porte du bureau : laissée ouverte (brief), sans interaction */}
      <Porte id="porte-bureau-rebbe" charniere={[BUREAU.x1, Y0, BUREAU.porteZ1 - 0.04]} largeur={0.97} hauteur={2.2} sens={1} rotationY={Math.PI / 2} angleOuverture={1.45} ouverteInitiale fixe />
      <Interactions />
      <EclairageMaison />
    </>
  )
}

function Interactions() {
  useInteractif('plaque-bureau', [BUREAU.x1 - 0.3, Y0 + 1.5, BUREAU.porteZ1 + 0.6], 1.5, () => t('action.lirePlaque'), () =>
    useGame.getState().set({ panneau: { type: 'message', cle: 'maison.bureauPlaque' } }),
  )
  useInteractif('bibliotheque-bureau', [-5.4, Y0 + 1.4, BUREAU.z0 + 0.6], 1.6, () => t('action.lireBibliotheque'), () =>
    useGame.getState().set({ panneau: { type: 'bibliotheque' } }),
  )
  useInteractif('plaque-appartement', [-3.0, Y1 + 1.4, -5.1], 1.6, () => t('action.lirePlaque'), () =>
    useGame.getState().set({ panneau: { type: 'message', cle: 'maison.appartementPlaque' } }),
  )
  // Armoire de l'antichambre : prendre ou remettre la clé de l'étage
  const aLaCle = useGame((s) => s.inventaire.includes('cle-etage'))
  useInteractif('armoire-cle', [XO + 0.9, Y0 + 1.2, -6.3], 1.5, () => t(aLaCle ? 'action.remettreCle' : 'action.prendreCle'), () => {
    const st = useGame.getState()
    const inv = st.inventaire.includes('cle-etage') ? st.inventaire.filter((i) => i !== 'cle-etage') : [...st.inventaire, 'cle-etage']
    st.set({ inventaire: inv })
    st.notifier(inv.includes('cle-etage') ? 'message.clePrise' : 'message.cleRemise')
  })
  return null
}

// Lumière d'intérieur des pièces : une lumière hémisphérique qui monte quand
// le joueur y entre (pas de lumière ponctuelle supplémentaire).
const ZONES_MAISON = ['bureau-rebbe', 'antichambre', 'couloir', 'petit-zal', 'appartement']
function EclairageMaison() {
  const hemi = useRef<THREE.HemisphereLight>(null)
  const zone = useGame((s) => s.zone)
  const cible = useRef(0)
  useEffect(() => {
    cible.current = ZONES_MAISON.includes(zone) ? 2.4 : 0
  }, [zone])
  useFrame((_, dt) => {
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.damp(hemi.current.intensity, cible.current, 3, dt)
  })
  return <hemisphereLight ref={hemi} args={['#fff4e0', '#8a6a4a', 0]} />
}
