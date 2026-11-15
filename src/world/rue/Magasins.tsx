import { useMemo } from 'react'
import * as THREE from 'three'
import { CuboidCollider } from '@react-three/rapier'
import { Pieces, type Piece } from '../primitives'
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
export const MAGASINS_X0 = 40.2
export const MAGASINS_X1 = 59.6
const Z_FACADE = -1.0
const LARGEUR = (MAGASINS_X1 - MAGASINS_X0) / MAGASINS.length
const HAUTEUR = 11
const PROFONDEUR = 10

export function Magasins() {
  const pieces = useMemo(() => {
    const pc: Piece[] = []
    const x0 = MAGASINS_X0
    const x1 = MAGASINS_X1
    // Immeuble : briques, avec les vitrines plaquées devant au rez-de-chaussée
    pc.push({ t: [x1 - x0, HAUTEUR, PROFONDEUR], p: [(x0 + x1) / 2, HAUTEUR / 2 - 0.2, Z_FACADE - PROFONDEUR / 2], m: 'briqueVoisinClaire', col: true })
    pc.push({ t: [x1 - x0 + 0.3, 0.35, 0.35], p: [(x0 + x1) / 2, 4.1, Z_FACADE + 0.12], m: 'pierre' })
    pc.push({ t: [x1 - x0 + 0.3, 0.5, 0.45], p: [(x0 + x1) / 2, HAUTEUR - 0.2, Z_FACADE + 0.1], m: 'pierre' })
    pc.push(...grilleFenetres(x0 + 0.5, x1 - 0.5, Z_FACADE, [5.0, 8.0], 1.9, MAGASINS.length * 2, 'pierre'))
    MAGASINS.forEach((_, i) => {
      const cx = x0 + LARGEUR * (i + 0.5)
      const zf = Z_FACADE + 0.06
      // Encadrement noir, vitrine éclairée, porte vitrée
      pc.push({ t: [LARGEUR - 0.15, 3.1, 0.12], p: [cx, 1.45, zf], m: 'chassisNoir' })
      pc.push({ t: [LARGEUR * 0.52, 1.9, 0.06], p: [cx - LARGEUR * 0.18, 1.55, zf + 0.07], m: 'vitreEclairee', ombre: false })
      pc.push({ t: [1.0, 2.3, 0.06], p: [cx + LARGEUR * 0.28, 1.15, zf + 0.07], m: 'vitre', ombre: false })
      pc.push({ t: [0.04, 0.5, 0.04], p: [cx + LARGEUR * 0.28 - 0.38, 1.1, zf + 0.12], m: 'laiton', ombre: false })
      // Allège sous la vitrine
      pc.push({ t: [LARGEUR * 0.56, 0.5, 0.14], p: [cx - LARGEUR * 0.18, 0.3, zf + 0.04], m: 'pierre' })
    })
    // Immeuble d'angle au-delà (décor) pour fermer la vue
    pc.push({ t: [16, 15, 14], p: [x1 + 8.2, 7.3, Z_FACADE - 7], m: 'briqueVoisin' })
    return pc
  }, [])

  return (
    <>
      <Pieces pieces={pieces} />
      {MAGASINS.map((m, i) => (
        <Devanture key={m.id} magasin={m} cx={MAGASINS_X0 + LARGEUR * (i + 0.5)} />
      ))}
      {/* Mur piéton au bout de la rangée */}
      <CuboidCollider args={[0.15, 3, 8]} position={[MAGASINS_X1 + 0.15, 3, 2]} />
    </>
  )
}

function Devanture({ magasin, cx }: { magasin: Magasin; cx: number }) {
  const zf = Z_FACADE + 0.06
  const { enseigne, store } = useMemo(() => {
    const tex = textureBandeau(
      [
        { texte: magasin.enseigne[0], police: 'bold 96px Inter, sans-serif' },
        { texte: magasin.enseigne[1], police: 'bold 84px "Frank Ruhl Libre", serif' },
      ],
      1024,
      320,
      magasin.couleur,
      magasin.encre,
    )
    return {
      enseigne: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }),
      store: new THREE.MeshStandardMaterial({ color: magasin.couleur, roughness: 0.85, side: THREE.DoubleSide }),
    }
  }, [magasin])
  // Porte d'entrée : on « entre » au magasin depuis le trottoir
  const xPorte = cx + LARGEUR * 0.28
  useInteractif(`magasin-${magasin.id}`, [xPorte - 0.6, 1.1, zf + 1.3], 1.9, () => t('action.entrerMagasin', { nom: t(`magasins.nom.${magasin.id}`) }), () => {
    useGame.getState().set({ panneau: { type: 'boutique', id: magasin.id } })
  })
  return (
    <>
      {/* Enseigne bilingue au-dessus de la vitrine */}
      <mesh position={[cx, 3.45, zf + 0.12]} material={enseigne}>
        <planeGeometry args={[LARGEUR - 0.35, 0.95]} />
      </mesh>
      {/* Store (auvent) incliné, couleur du magasin */}
      <mesh position={[cx, 2.95, zf + 0.55]} rotation={[0.42, 0, 0]} material={store} castShadow>
        <boxGeometry args={[LARGEUR - 0.2, 0.04, 1.1]} />
      </mesh>
      {/* Le vendeur, devant sa porte */}
      <PnjZal
        id={`pnj-magasin-${magasin.id}`}
        position={[xPorte - 1.1, 0, zf + 0.45]}
        rotationY={0}
        parle={false}
        peau={['#d7a888', '#c99878', '#e0b896', '#b98a66', '#d1a07c'][MAGASINS.indexOf(magasin)]}
        barbe={['#6b4a2e', '#2c2018', '#8a8580', '#3d2b1f', '#a07850'][MAGASINS.indexOf(magasin)]}
      />
    </>
  )
}
