import { immeubleAppartements } from './Immeubles'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CuboidCollider } from '@react-three/rapier'
import { Pieces, type Piece } from '../primitives'
import { useInteractif } from '../interaction'
import { Porte } from '../Porte'
import { OBSTACLES, SALLE, Vitrines } from './Vitrines'
import { grilleFenetres } from './Voisins'
import { PnjZal } from '../../npc/PnjZal'
import { joueur, useGame } from '../../state/store'
import { t } from '../../i18n'
import { MAGASINS, type Magasin } from '../../missions/magasins'

// Rangée de magasins juifs sur Eastern Parkway, à droite du 784-788
// (x 40 → 59,6). CHOIX DE JEU, pas une reconstitution : en réalité ces
// commerces sont sur Kingston Avenue. Façade alignée sur celle du 784 (z -1).
// 16/11/2026 : on entre dans chaque magasin (porte vitrée, salle, comptoir).
export const MAGASINS_X0 = 40.2
export const MAGASINS_X1 = 59.6
const Z_FACADE = -1.0
const LARGEUR = (MAGASINS_X1 - MAGASINS_X0) / MAGASINS.length
const HAUTEUR = 11
const PROFONDEUR = 13.5
const RETRAIT = 0.8
// Mur de façade côté salle, et fond de la salle
const Z_SALLE = Z_FACADE - RETRAIT
const Z_FOND = Z_SALLE - SALLE.fond

export function Magasins() {
  const pieces = useMemo(() => {
    const pc: Piece[] = []
    const x0 = MAGASINS_X0
    const x1 = MAGASINS_X1
    const mx = (x0 + x1) / 2
    // Étages en brique au-dessus des magasins
    pc.push({ t: [x1 - x0, HAUTEUR - 3.9, PROFONDEUR], p: [mx, 3.7 + (HAUTEUR - 3.9) / 2, Z_FACADE - PROFONDEUR / 2], m: 'briqueVoisinClaire' })
    pc.push({ t: [x1 - x0 + 0.3, 0.35, 0.35], p: [mx, 4.1, Z_FACADE + 0.12], m: 'pierre' })
    pc.push({ t: [x1 - x0 + 0.3, 0.5, 0.45], p: [mx, HAUTEUR - 0.2, Z_FACADE + 0.1], m: 'pierre' })
    pc.push(...grilleFenetres(x0 + 0.5, x1 - 0.5, Z_FACADE, [5.0, 8.0], 1.9, MAGASINS.length * 2, 'pierre'))
    // Dalle du rez-de-chaussée (la pièce de la chaise et le Zal sont dessous),
    // massif du fond, murs mitoyens entre les salles
    pc.push({ t: [x1 - x0, 0.4, PROFONDEUR], p: [mx, -0.2, Z_FACADE - PROFONDEUR / 2 - 0.01], m: 'trottoir', col: true })
    pc.push({ t: [x1 - x0, 3.9, Z_FOND - (Z_FACADE - PROFONDEUR)], p: [mx, 1.75, (Z_FOND + Z_FACADE - PROFONDEUR) / 2], m: 'briqueVoisinClaire', col: true })
    const zm = Z_FACADE - RETRAIT / 2
    for (let i = 0; i <= MAGASINS.length; i++) {
      // Murs d'extrémité à cheval sur la limite : leur face intérieure reste
      // derrière l'habillage de la salle
      const x = x0 + LARGEUR * i
      pc.push({ t: [0.2, 3.9, SALLE.fond], p: [x, 1.75, (Z_SALLE + Z_FOND) / 2], m: 'briqueVoisinClaire', col: true })
      // Pilier de brique en façade
      pc.push({ t: [0.3, 3.9, RETRAIT + 0.04], p: [Math.min(Math.max(x, x0 + 0.15), x1 - 0.15), 1.75, zm + 0.02], m: 'briqueVoisinClaire', col: true })
    }
    MAGASINS.forEach((_, i) => {
      const cx = x0 + LARGEUR * (i + 0.5)
      const zf = Z_FACADE + 0.06
      const wx = cx - LARGEUR * 0.18
      const larg = LARGEUR * 0.52
      const xP = cx + LARGEUR * 0.28
      const g = cx - LARGEUR / 2 + 0.15
      const d = cx + LARGEUR / 2 - 0.15
      // Bandeau noir sous l'enseigne, soubassement, jambages de la vitrine
      pc.push({ t: [LARGEUR - 0.3, 1.2, RETRAIT + 0.12], p: [cx, 3.1, zm + 0.06], m: 'chassisNoir' })
      pc.push({ t: [larg + 0.02, 0.8, RETRAIT], p: [wx, 0.2, zm], m: 'chassisNoir' })
      pc.push({ t: [wx - larg / 2 - g, 2.7, RETRAIT + 0.12], p: [(g + wx - larg / 2) / 2, 1.15, zm + 0.06], m: 'chassisNoir' })
      // Entre vitrine et porte, à droite de la porte, linteau : l'entrée est
      // un passage de 1 m en retrait, la porte est au fond du passage
      const dp = SALLE.demiPorte
      pc.push({ t: [xP - dp - (wx + larg / 2), 2.7, RETRAIT + 0.12], p: [(xP - dp + wx + larg / 2) / 2, 1.15, zm + 0.06], m: 'chassisNoir' })
      if (d - (xP + dp) > 0.02) pc.push({ t: [d - (xP + dp), 2.7, RETRAIT + 0.12], p: [(d + xP + dp) / 2, 1.15, zm + 0.06], m: 'chassisNoir', col: true })
      pc.push({ t: [2 * dp, 0.2, RETRAIT + 0.12], p: [xP, 2.4, zm + 0.06], m: 'chassisNoir' })
      // Allège en pierre sous la vitrine
      pc.push({ t: [LARGEUR * 0.56, 0.5, 0.14], p: [wx, 0.3, zf + 0.04], m: 'pierre' })
    })
    // Immeuble d'angle au-delà (décor) pour fermer la vue
    pc.push(...immeubleAppartements({ x0: x1 + 0.2, largeur: 25.2, zF: Z_FACADE, sens: 1, style: 'briqueJaune', etages: 6, graine: 29 }))
    return pc
  }, [])

  return (
    <>
      <Pieces pieces={pieces} />
      <Vitrines x0={MAGASINS_X0} largeur={LARGEUR} zFacade={Z_FACADE} retrait={RETRAIT} />
      {MAGASINS.map((m, i) => (
        <Devanture key={m.id} magasin={m} cx={MAGASINS_X0 + LARGEUR * (i + 0.5)} />
      ))}
      <LumiereMagasin />
      {/* Mur piéton au bout de la rangée */}
      <CuboidCollider args={[0.15, 3, 8]} position={[MAGASINS_X1 + 0.15, 3, 2]} />
    </>
  )
}

// Une seule lampe pour toute la rangée : elle suit le magasin où est le
// joueur (les meubles sont déjà éclairés par leurs couleurs ; la lampe sert
// au personnage et au vendeur).
function LumiereMagasin() {
  const zone = useGame((s) => s.zone)
  const lampe = useRef<THREE.PointLight>(null)
  useFrame(() => {
    if (!lampe.current) return
    const i = Math.min(MAGASINS.length - 1, Math.max(0, Math.floor((joueur.position[0] - MAGASINS_X0) / LARGEUR)))
    lampe.current.position.set(MAGASINS_X0 + LARGEUR * (i + 0.5), SALLE.plafond - 0.5, Math.min(Z_SALLE - 1.5, Math.max(Z_FOND + 1.5, joueur.position[2])))
  })
  if (zone !== 'magasins') return null
  return <pointLight ref={lampe} intensity={9} distance={11} decay={1.5} color="#fff1d6" />
}

function Devanture({ magasin, cx }: { magasin: Magasin; cx: number }) {
  const i = MAGASINS.indexOf(magasin)
  const xPorte = cx + LARGEUR * 0.28
  const zComptoir = Z_SALLE - SALLE.comptoir
  // On achète au comptoir, à l'intérieur
  useInteractif(`magasin-${magasin.id}`, [cx, 1.1, zComptoir + 0.75], 1.7, () => t('action.comptoir', { nom: t(`magasins.nom.${magasin.id}`) }), () => {
    useGame.getState().set({ panneau: { type: 'boutique', id: magasin.id } })
  })
  // Vitrine et soubassement : un seul bloc, on ne marche pas dans l'étalage
  const xg = cx - LARGEUR / 2
  const xd = xPorte - SALLE.demiPorte
  return (
    <>
      <Porte id={`porte-magasin-${magasin.id}`} charniere={[xPorte + SALLE.demiPorte, 0, Z_SALLE + 0.03]} largeur={2 * SALLE.demiPorte} hauteur={2.3} sens={-1} angleOuverture={-1.45} modele="vitree" couleur={magasin.couleur} rayon={2.6} />
      <CuboidCollider args={[(xd - xg) / 2, 1.4, (RETRAIT + 0.12) / 2]} position={[(xg + xd) / 2, 1.2, Z_FACADE - RETRAIT / 2 + 0.06]} />
      <CuboidCollider args={[SALLE.demiLargeur, 0.55, 0.34]} position={[cx, 0.55, zComptoir]} />
      {(OBSTACLES[magasin.id] ?? []).map(([x, tt, dx, dt], k) => (
        <CuboidCollider key={k} args={[dx, 0.6, dt]} position={[cx + x, 0.6, Z_SALLE - tt]} />
      ))}
      {/* Le vendeur, derrière son comptoir. À la pizzeria, la règle des PNJ
          (routines.ts : distance à la place vide et à la pièce de la chaise,
          situées au sous-sol juste dessous) le refuse : comptoir sans vendeur. */}
      <PnjZal
        id={`pnj-magasin-${magasin.id}`}
        position={[cx - 0.3, 0, Z_SALLE - SALLE.comptoir - 0.95]}
        rotationY={0}
        parle={false}
        peau={['#d7a888', '#c99878', '#e0b896', '#b98a66', '#d1a07c'][i]}
        barbe={['#6b4a2e', '#2c2018', '#8a8580', '#3d2b1f', '#a07850'][i]}
      />
    </>
  )
}
