import { useMemo } from 'react'
import * as THREE from 'three'
import { CuboidCollider } from '@react-three/rapier'
import { Invisible, Pieces, type Piece, type V3 } from '../primitives'
import { useInteractif } from '../interaction'
import { textureBandeau } from '../texturesProcedurales'
import { grilleFenetres } from './Voisins'
import { PnjZal } from '../../npc/PnjZal'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { MAGASINS, type Magasin } from '../../missions/magasins'

// Rangée de magasins juifs sur Eastern Parkway, à droite du 784-788
// (x 40 → 59,6). CHOIX DE JEU, pas une reconstitution : en réalité ces
// commerces sont sur Kingston Avenue. Façade alignée sur celle du 784 (z -1).
//
// Devantures (refaites le 15/11/2026, « inspire-toi d'Internet ») dans le
// vocabulaire des rues commerçantes de Brooklyn : petits immeubles de brique
// de 3 ou 4 étages, chacun avec sa corniche ; rez-de-chaussée vitré en
// châssis d'aluminium (allège, imposte, porte vitrée), boîte-enseigne
// lumineuse, store en toile avec le nom sur le lambrequin, enseigne drapeau
// perpendiculaire, autocollants « פתוח » et « כשר » en vitrine, intérieur
// visible (comptoir, présentoirs), échelle de secours sur une façade.
// Tout est inventé (aucune enseigne réelle).
export const MAGASINS_X0 = 40.2
export const MAGASINS_X1 = 59.6
const Z_FACADE = -1.0
const LARGEUR = (MAGASINS_X1 - MAGASINS_X0) / MAGASINS.length
const PROFONDEUR = 10
const H_RDC = 3.7 // hauteur du rez-de-chaussée commercial
const RECUL = 1.7 // profondeur visible de la boutique derrière la vitrine
const ETAGES = [3, 4, 3, 4, 3] // étages au-dessus du rez-de-chaussée, par immeuble
const H_ETAGE = 3.1

function Boite({ t: taille, p, m, r }: { t: V3; p: V3; m: THREE.Material; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
      <boxGeometry args={taille} />
    </mesh>
  )
}

export function Magasins() {
  const pieces = useMemo(() => {
    const pc: Piece[] = []
    MAGASINS.forEach((_, i) => {
      const x0 = MAGASINS_X0 + LARGEUR * i
      const x1 = x0 + LARGEUR
      const cx = (x0 + x1) / 2
      const hHaut = ETAGES[i] * H_ETAGE
      const yHaut = H_RDC + hHaut
      const brique = i % 2 ? 'briqueVoisin' : 'briqueVoisinClaire'
      // Étages : volume plein jusqu'à la façade
      pc.push({ t: [LARGEUR, hHaut, PROFONDEUR], p: [cx, H_RDC + hHaut / 2, Z_FACADE - PROFONDEUR / 2], m: brique, col: true })
      // Rez-de-chaussée : volume en retrait, la boutique se voit derrière la vitrine
      pc.push({ t: [LARGEUR, H_RDC + 0.2, PROFONDEUR - RECUL], p: [cx, H_RDC / 2 - 0.1, Z_FACADE - RECUL - (PROFONDEUR - RECUL) / 2], m: brique, col: true })
      // Trumeaux de pierre entre les boutiques (murs latéraux de la boutique)
      for (const xp of [x0 + 0.14, x1 - 0.14]) pc.push({ t: [0.28, H_RDC, RECUL + 0.14], p: [xp, H_RDC / 2, Z_FACADE - RECUL / 2 + 0.07], m: 'pierre', col: true })
      // Bandeau de pierre au-dessus du rez-de-chaussée, corniche et consoles
      pc.push({ t: [LARGEUR, 0.3, 0.3], p: [cx, H_RDC + 0.05, Z_FACADE + 0.1], m: 'pierre' })
      pc.push({ t: [LARGEUR + 0.05, 0.45, 0.6], p: [cx, yHaut - 0.1, Z_FACADE + 0.25], m: 'pierreFoncee' })
      for (let k = 0; k < 4; k++) pc.push({ t: [0.14, 0.4, 0.4], p: [x0 + 0.35 + ((LARGEUR - 0.7) * k) / 3, yHaut - 0.5, Z_FACADE + 0.17], m: 'pierreFoncee', ombre: false })
      // Fenêtres des étages : deux par étage
      const etages = Array.from({ length: ETAGES[i] }, (_, e) => H_RDC + 0.9 + e * H_ETAGE)
      pc.push(...grilleFenetres(x0 + 0.35, x1 - 0.35, Z_FACADE, etages, 1.8, 2, i % 2 ? 'pierre' : 'pierreFoncee'))
    })
    // Échelle de secours en fer noir sur l'immeuble du milieu (typique de Brooklyn)
    const ie = 2
    const ex0 = MAGASINS_X0 + LARGEUR * ie + 0.4
    const ex1 = ex0 + LARGEUR - 0.8
    for (let e = 0; e < ETAGES[ie]; e++) {
      const y = H_RDC + 0.75 + e * H_ETAGE
      pc.push({ t: [ex1 - ex0, 0.05, 0.85], p: [(ex0 + ex1) / 2, y, Z_FACADE + 0.45], m: 'chassisNoir' })
      pc.push({ t: [ex1 - ex0, 0.04, 0.04], p: [(ex0 + ex1) / 2, y + 0.95, Z_FACADE + 0.86], m: 'chassisNoir', ombre: false })
      pc.push({ t: [ex1 - ex0, 0.03, 0.03], p: [(ex0 + ex1) / 2, y + 0.5, Z_FACADE + 0.86], m: 'chassisNoir', ombre: false })
      for (const x of [ex0, ex1]) pc.push({ t: [0.04, 0.95, 0.04], p: [x, y + 0.48, Z_FACADE + 0.86], m: 'chassisNoir', ombre: false })
      if (e < ETAGES[ie] - 1) {
        // Escalier incliné vers la plate-forme du dessus
        const L = Math.hypot(ex1 - ex0 - 0.6, H_ETAGE)
        pc.push({ t: [L, 0.05, 0.4], p: [(ex0 + ex1) / 2, y + H_ETAGE / 2, Z_FACADE + 0.62], r: [0, 0, Math.atan2(H_ETAGE, ex1 - ex0 - 0.6)], m: 'chassisNoir', ombre: false })
      }
    }
    // Immeuble d'angle au-delà (décor) pour fermer la vue
    pc.push({ t: [16, 15, 14], p: [MAGASINS_X1 + 8.2, 7.3, Z_FACADE - 7], m: 'briqueVoisin' })
    return pc
  }, [])

  return (
    <>
      <Pieces pieces={pieces} />
      {MAGASINS.map((m, i) => (
        <Devanture key={m.id} magasin={m} index={i} cx={MAGASINS_X0 + LARGEUR * (i + 0.5)} />
      ))}
      {/* Mur piéton au bout de la rangée */}
      <CuboidCollider args={[0.15, 3, 8]} position={[MAGASINS_X1 + 0.15, 3, 2]} />
    </>
  )
}

// Matériaux d'une devanture
function useMateriauxDevanture(m: Magasin) {
  return useMemo(() => {
    const enseigne = textureBandeau(
      [
        { texte: m.enseigne[0], police: 'bold 104px Inter, sans-serif' },
        { texte: m.enseigne[1], police: 'bold 90px "Frank Ruhl Libre", serif' },
      ],
      1024,
      300,
      m.couleur,
      m.encre,
    )
    const lambrequin = textureBandeau([{ texte: `${m.enseigne[0]} · ${m.enseigne[1]}`, police: 'bold 64px Inter, sans-serif' }], 1024, 96, m.couleur, m.encre)
    const drapeau = textureBandeau(
      [
        { texte: m.enseigne[0], police: 'bold 120px Inter, sans-serif' },
        { texte: m.enseigne[1], police: 'bold 110px "Frank Ruhl Libre", serif' },
      ],
      512,
      512,
      m.couleur,
      m.encre,
    )
    const ouvert = textureBandeau(
      [
        { texte: 'OPEN', police: 'bold 120px Inter, sans-serif', encre: '#ff3b3b' },
        { texte: 'פתוח', police: 'bold 110px "Frank Ruhl Libre", serif', encre: '#5ad1ff' },
      ],
      512,
      320,
      '#120a0a',
    )
    const cacher = textureBandeau([{ texte: 'כשר', police: 'bold 150px "Frank Ruhl Libre", serif' }], 256, 256, '#f2f2f2', '#1f3a8a')
    return {
      enseigne: new THREE.MeshStandardMaterial({ map: enseigne, emissive: '#ffffff', emissiveMap: enseigne, emissiveIntensity: 0.35, roughness: 0.5 }),
      lambrequin: new THREE.MeshStandardMaterial({ map: lambrequin, roughness: 0.9, side: THREE.DoubleSide }),
      drapeau: new THREE.MeshStandardMaterial({ map: drapeau, emissive: '#ffffff', emissiveMap: drapeau, emissiveIntensity: 0.3, roughness: 0.5 }),
      ouvert: new THREE.MeshBasicMaterial({ map: ouvert, toneMapped: false }),
      cacher: new THREE.MeshStandardMaterial({ map: cacher, roughness: 0.6 }),
      toile: new THREE.MeshStandardMaterial({ color: m.couleur, roughness: 0.95, side: THREE.DoubleSide }),
      verre: new THREE.MeshStandardMaterial({ color: '#cfe3ee', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.1, depthWrite: false }),
      alu: new THREE.MeshStandardMaterial({ color: '#3a3a3c', metalness: 0.6, roughness: 0.35 }),
      granit: new THREE.MeshStandardMaterial({ color: '#2b2a2e', roughness: 0.35, metalness: 0.1 }),
      interieur: new THREE.MeshStandardMaterial({ color: '#e6d9bf', emissive: '#e9d3a4', emissiveIntensity: 0.18, roughness: 0.9 }),
      solInterieur: new THREE.MeshStandardMaterial({ color: '#c9c0b0', roughness: 0.5 }),
      plafond: new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#fff1c8', emissiveIntensity: 0.8 }),
    }
  }, [m])
}

function Devanture({ magasin, index, cx }: { magasin: Magasin; index: number; cx: number }) {
  const M = useMateriauxDevanture(magasin)
  const W = LARGEUR - 0.56 // ouverture entre les trumeaux
  const zv = Z_FACADE // plan de la vitrine
  const xg = cx - W / 2
  const xPorte = cx + W / 2 - 0.6 // porte côté droit
  const xVitrine = (xg + (xPorte - 0.55)) / 2
  const lVitrine = xPorte - 0.55 - xg
  const yImposte = 2.55
  const alimentaire = magasin.id === 'pizzeria' || magasin.id === 'glacier'

  useInteractif(`magasin-${magasin.id}`, [xPorte - 0.6, 1.1, zv + 1.36], 1.9, () => t('action.entrerMagasin', { nom: t(`magasins.nom.${magasin.id}`) }), () => {
    useGame.getState().set({ panneau: { type: 'boutique', id: magasin.id } })
  })

  return (
    <>
      {/* Intérieur visible : fond éclairé, sol, plafond lumineux */}
      <Boite t={[W, H_RDC - 0.3, 0.05]} p={[cx, (H_RDC - 0.3) / 2, zv - RECUL + 0.03]} m={M.interieur} />
      {/* Murs latéraux éclairés : sans eux, vus de biais, ils paraissent noirs (dans l'ombre) */}
      {[-1, 1].map((s) => (
        <Boite key={s} t={[0.02, H_RDC - 0.3, RECUL]} p={[cx + s * (W / 2 - 0.01), (H_RDC - 0.3) / 2, zv - RECUL / 2]} m={M.interieur} />
      ))}
      <Boite t={[W, 0.02, RECUL]} p={[cx, 0.01, zv - RECUL / 2]} m={M.solInterieur} />
      <Boite t={[W, 0.04, RECUL]} p={[cx, H_RDC - 0.25, zv - RECUL / 2]} m={M.plafond} />
      <Interieur magasin={magasin} cx={cx} W={W} M={M} />
      {/* Vendeur derrière son comptoir, visible à travers la vitrine */}
      <PnjZal
        id={`pnj-magasin-${magasin.id}`}
        position={[cx + W / 2 - 1.5, 0, zv - RECUL + 0.45]}
        rotationY={0}
        parle={false}
        peau={['#d7a888', '#c99878', '#e0b896', '#b98a66', '#d1a07c'][index]}
        barbe={['#6b4a2e', '#2c2018', '#8a8580', '#3d2b1f', '#a07850'][index]}
      />

      {/* Allège en granit sombre, châssis d'aluminium, vitrine, imposte */}
      <Boite t={[lVitrine, 0.5, 0.16]} p={[xVitrine, 0.25, zv]} m={M.granit} />
      <Boite t={[lVitrine, 2.05, 0.02]} p={[xVitrine, 0.5 + 1.025, zv]} m={M.verre} />
      <Boite t={[W, yImposte < H_RDC ? H_RDC - 0.25 - yImposte : 0.1, 0.02]} p={[cx, (yImposte + H_RDC - 0.25) / 2, zv]} m={M.verre} />
      {/* Montants et traverses */}
      <Boite t={[W, 0.07, 0.1]} p={[cx, yImposte, zv]} m={M.alu} />
      <Boite t={[W, 0.08, 0.1]} p={[cx, H_RDC - 0.25, zv]} m={M.alu} />
      <Boite t={[lVitrine, 0.06, 0.1]} p={[xVitrine, 0.53, zv]} m={M.alu} />
      {[xg + 0.03, xVitrine, xPorte - 0.55, xPorte + 0.55, cx + W / 2 - 0.03].map((x, k) => (
        <Boite key={k} t={[0.07, H_RDC - 0.25, 0.1]} p={[x, (H_RDC - 0.25) / 2, zv]} m={M.alu} />
      ))}
      {/* Porte vitrée à cadre d'aluminium, poignée */}
      <Boite t={[1.0, 2.45, 0.02]} p={[xPorte, 1.25, zv]} m={M.verre} />
      <Boite t={[1.04, 0.12, 0.06]} p={[xPorte, 0.06, zv]} m={M.alu} />
      <Boite t={[0.04, 0.6, 0.04]} p={[xPorte - 0.38, 1.1, zv + 0.06]} m={M.alu} />
      {/* Collision de la devanture (verre compris) : on ne traverse pas la vitrine */}
      <Invisible taille={[W, H_RDC, 0.12]} position={[cx, H_RDC / 2, zv]} />

      {/* Autocollants en vitrine : « OPEN / פתוח » lumineux, « כשר » pour la nourriture */}
      <mesh position={[xVitrine + lVitrine / 2 - 0.45, 1.95, zv + 0.02]} material={M.ouvert}>
        <planeGeometry args={[0.62, 0.39]} />
      </mesh>
      {alimentaire && (
        <mesh position={[xPorte + 0.25, 1.75, zv + 0.02]} material={M.cacher}>
          <circleGeometry args={[0.13, 24]} />
        </mesh>
      )}

      {/* Boîte-enseigne lumineuse au-dessus du rez-de-chaussée */}
      <Boite t={[W + 0.2, 0.92, 0.22]} p={[cx, H_RDC + 0.62, zv + 0.2]} m={M.alu} />
      <mesh position={[cx, H_RDC + 0.62, zv + 0.315]} material={M.enseigne}>
        <planeGeometry args={[W + 0.05, 0.8]} />
      </mesh>

      {/* Store en toile incliné, joues latérales et lambrequin avec le nom */}
      <mesh position={[cx, 2.92, zv + 0.62]} rotation={[0.55, 0, 0]} material={M.toile} castShadow>
        <boxGeometry args={[W + 0.1, 0.03, 1.38]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[cx + s * ((W + 0.1) / 2), 2.82, zv + 0.62]} rotation={[0, Math.PI / 2, 0]} material={M.toile}>
          <shapeGeometry args={[jouesStore()]} />
        </mesh>
      ))}
      <mesh position={[cx, 2.38, zv + 1.21]} material={M.lambrequin}>
        <planeGeometry args={[W + 0.1, 0.24]} />
      </mesh>

      {/* Enseigne drapeau perpendiculaire, lisible quand on marche sur le trottoir */}
      <Boite t={[0.05, 0.05, 0.75]} p={[cx - W / 2 + 0.05, H_RDC + 1.62, zv + 0.38]} m={M.alu} />
      {/* Deux faces dos à dos : le texte se lit dans les deux sens de marche */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[cx - W / 2 + 0.05 + s * 0.012, H_RDC + 1.25, zv + 0.45]} rotation={[0, (s * Math.PI) / 2, 0]} material={M.drapeau}>
          <planeGeometry args={[0.66, 0.66]} />
        </mesh>
      ))}
    </>
  )
}

// Joue triangulaire du store (dans le plan z / y, origine en haut contre le mur)
let joues: THREE.Shape | null = null
function jouesStore() {
  if (joues) return joues
  const s = new THREE.Shape()
  // Points en (z local, y local) : z vers l'extérieur
  s.moveTo(0.62, 0.48)
  s.lineTo(-0.62, -0.28)
  s.lineTo(-0.62, -0.5)
  s.lineTo(0.62, 0.32)
  s.closePath()
  joues = s
  return s
}

type Mats = ReturnType<typeof useMateriauxDevanture>

// Ce qu'on voit à travers la vitrine, selon le commerce
function Interieur({ magasin, cx, W, M }: { magasin: Magasin; cx: number; W: number; M: Mats }) {
  const props = useMemo(() => {
    const zf = Z_FACADE - RECUL
    const bois = new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.7 })
    const noir = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.55 })
    const blanc = new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.7 })
    const comptoirVitre = new THREE.MeshStandardMaterial({ color: '#d8ecf2', transparent: true, opacity: 0.35 })
    const out: { t?: V3; geo?: THREE.BufferGeometry; p: V3; r?: V3; m: THREE.Material }[] = []
    const comptoir = (x: number, l: number) => {
      out.push({ t: [l, 0.95, 0.6], p: [x, 0.475, zf + 1.05], m: bois })
      out.push({ t: [l, 0.04, 0.62], p: [x, 0.97, zf + 1.05], m: M.granit })
    }
    // Tableau-menu sur le mur du fond
    const menu = (lignes: string[]) => {
      const tex = textureBandeau(
        lignes.map((texte, i) => ({ texte, police: i === 0 ? 'bold 64px Inter, sans-serif' : '48px Inter, sans-serif' })),
        512,
        320,
        '#1d1d1f',
        '#f6e7b0',
      )
      out.push({ t: [1.3, 0.8, 0.02], p: [cx - W / 2 + 1.0, 2.6, zf + 0.08], m: new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) })
    }
    switch (magasin.id) {
      case 'pizzeria': {
        comptoir(cx - 0.3, 2.2)
        out.push({ t: [2.2, 0.35, 0.5], p: [cx - 0.3, 1.17, zf + 1.05], m: comptoirVitre })
        // Pizzas entières sur le comptoir
        const fromage = new THREE.MeshStandardMaterial({ color: '#f0c26a', roughness: 0.8 })
        for (const dx of [-0.9, -0.3, 0.3]) out.push({ geo: new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20), p: [cx + dx, 1.0, zf + 1.05], m: fromage })
        // Four à pizza en inox au fond
        out.push({ t: [1.2, 0.9, 0.7], p: [cx - 0.75, 1.35, zf + 0.4], m: new THREE.MeshStandardMaterial({ color: '#a7adb0', metalness: 0.8, roughness: 0.3 }) })
        menu(['PIZZA · פיצה', 'Slice  2 $', 'Knish  1 $'])
        break
      }
      case 'glacier': {
        comptoir(cx - 0.3, 2.2)
        // Vitrine réfrigérée et bacs de glace colorés
        out.push({ t: [2.2, 0.32, 0.5], p: [cx - 0.3, 1.15, zf + 1.05], m: comptoirVitre })
        const parfums = ['#f6d1dc', '#7b4a2e', '#fff3c4', '#b8e0d2', '#e8a0a0', '#d9c2f0']
        parfums.forEach((c, k) =>
          out.push({ t: [0.3, 0.06, 0.3], p: [cx - 1.2 + k * 0.34, 1.0, zf + 1.05], m: new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }) }),
        )
        menu(['ICE CREAM · גלידה', 'Cone  1 $', 'Shake  2 $'])
        break
      }
      case 'vetements': {
        // Deux mannequins en sirtouk et une tringle de manteaux noirs
        for (const dx of [-1.0, -0.2]) {
          out.push({ geo: new THREE.CylinderGeometry(0.2, 0.28, 1.25, 12), p: [cx + dx, 0.95, zf + 1.1], m: noir })
          out.push({ geo: new THREE.SphereGeometry(0.11, 12, 10), p: [cx + dx, 1.72, zf + 1.1], m: blanc })
          out.push({ geo: new THREE.CylinderGeometry(0.15, 0.15, 0.13, 14), p: [cx + dx, 1.86, zf + 1.1], m: noir })
          out.push({ geo: new THREE.CylinderGeometry(0.27, 0.27, 0.015, 18), p: [cx + dx, 1.8, zf + 1.1], m: noir })
        }
        out.push({ t: [1.1, 0.03, 0.03], p: [cx + 1.05, 1.9, zf + 0.35], m: M.alu })
        for (let k = 0; k < 5; k++) out.push({ t: [0.08, 1.1, 0.45], p: [cx + 0.62 + k * 0.2, 1.32, zf + 0.35], m: noir })
        break
      }
      case 'chemises': {
        // Étagères de chemises blanches pliées et un buste en chemise-cravate
        for (const y of [0.9, 1.45, 2.0]) {
          out.push({ t: [1.8, 0.04, 0.4], p: [cx + 0.3, y, zf + 0.25], m: bois })
          for (let k = 0; k < 5; k++) out.push({ t: [0.3, 0.12, 0.3], p: [cx - 0.45 + k * 0.36, y + 0.08, zf + 0.25], m: k % 2 ? blanc : new THREE.MeshStandardMaterial({ color: '#dfe7f2', roughness: 0.7 }) })
        }
        out.push({ geo: new THREE.CylinderGeometry(0.2, 0.22, 0.75, 12), p: [cx - 1.0, 1.35, zf + 1.15], m: blanc })
        out.push({ t: [0.06, 0.45, 0.02], p: [cx - 1.0, 1.42, zf + 1.36], m: noir })
        out.push({ geo: new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), p: [cx - 1.0, 0.5, zf + 1.15], m: M.alu })
        comptoir(cx + 0.3, 1.4)
        break
      }
      case 'chapeaux': {
        // Étagères murales de chapeaux noirs (calotte + bord)
        for (const y of [1.0, 1.6, 2.2]) {
          out.push({ t: [2.4, 0.04, 0.4], p: [cx, y, zf + 0.25], m: bois })
          for (let k = 0; k < 5; k++) {
            const x = cx - 0.96 + k * 0.48
            out.push({ geo: new THREE.CylinderGeometry(0.19, 0.19, 0.015, 18), p: [x, y + 0.03, zf + 0.25], m: noir })
            out.push({ geo: new THREE.CylinderGeometry(0.11, 0.12, 0.15, 14), p: [x, y + 0.11, zf + 0.25], m: noir })
          }
        }
        // Boîtes à chapeaux rondes près de la vitrine
        for (const [dx, h] of [[-1.0, 0.35], [-0.6, 0.25]] as const)
          out.push({ geo: new THREE.CylinderGeometry(0.2, 0.2, h, 16), p: [cx + dx, 0.3 + h / 2, zf + 1.3], m: new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: 0.6 }) })
        comptoir(cx + 0.6, 1.2)
        break
      }
    }
    return out
  }, [magasin, cx, W, M])
  return (
    <>
      {props.map((o, k) =>
        o.geo ? (
          <mesh key={k} geometry={o.geo} position={o.p} rotation={o.r} material={o.m} />
        ) : (
          <mesh key={k} position={o.p} rotation={o.r} material={o.m}>
            <boxGeometry args={o.t} />
          </mesh>
        ),
      )}
    </>
  )
}
