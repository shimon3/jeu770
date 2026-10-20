import { useMemo } from 'react'
import * as THREE from 'three'
import { ENTREE, ZAL } from '../../config/grandZal'
import { escalier, geoPignon, Invisible, mur, Pieces, type Piece } from '../primitives'
import { grilleFenetres } from '../rue/Voisins'
import { Porte } from '../Porte'

// 784-788 Eastern Parkway, à DROITE du 770 vu de la rue (OpenStreetMap ;
// photo COLlive 11/2025). Aspect extérieur repris de la phase 1 (photo Clio :
// pignon de brique, portail de pierre, parapet à balustres). VOLUME
// APPROXIMATIF. Sous ce bâtiment se trouve le grand Zal (GrandZal.tsx) : le
// corps du bâtiment commence donc au-dessus du plafond du Zal.
//
// Accès au Zal : courette en contrebas derrière le parapet à balustres, avec
// un escalier de 18 marches et une porte au niveau du Zal. RECONSTITUTION
// ARTISTIQUE : l'escalier réel n'a été vu sur aucune photo.

const F = { x0: 9.6, x1: 40, z: -1.0, h: 11.5, prof: 22 } // façade et volume ESTIMÉS

export function Complexe784() {
  const { pieces, rampe } = useMemo(() => {
    const pc: Piece[] = []
    const ep = 0.3
    const E = ENTREE
    // Mur de façade : du niveau du Zal jusqu'à la corniche, porte au niveau du Zal
    pc.push(
      ...mur({
        axe: 'x',
        plan: F.z - ep / 2,
        epaisseur: ep,
        de: F.x0,
        a: F.x1,
        bas: ZAL.sol - 0.3,
        haut: F.h,
        ouvertures: [{ x0: E.porteX0, x1: E.porteX0 + E.porteLargeur, y0: ZAL.sol, y1: ZAL.sol + E.porteHauteur }],
        m: 'briqueVoisin',
      }),
    )
    // Corps du bâtiment au-dessus du Zal
    const yBas = ZAL.plafond + 0.25
    pc.push({ t: [F.x1 - F.x0, F.h - yBas, F.prof - ep], p: [(F.x0 + F.x1) / 2, (F.h + yBas) / 2, F.z - ep - (F.prof - ep) / 2], m: 'briqueVoisin', col: true })
    // Pignon, chaperons, fenêtres (comme en phase 1)
    pc.push({ geo: geoPignon(15.5, 22.5, F.h - 0.2, F.h + 3.2, 3), p: [0, 0, F.z], m: 'briqueVoisin' })
    const ang = Math.atan2(3.4, 3.5)
    for (const s of [-1, 1])
      pc.push({ t: [Math.hypot(3.5, 3.4) + 0.2, 0.14, 0.5], p: [19 + s * 1.75, F.h - 0.2 + 1.7 + 0.08, F.z - 0.2], r: [0, 0, -s * ang], m: 'pierre' })
    pc.push(...grilleFenetres(F.x0 + 0.5, F.x1 - 0.5, F.z, [1.9, 5.3, 8.6], 1.9, 9, 'pierre'))
    // Portail de pierre (photo Clio)
    pc.push({ t: [2.0, 3.2, 0.3], p: [12.6, 1.6, F.z + 0.15], m: 'pierre' })
    pc.push({ t: [1.1, 2.4, 0.1], p: [12.6, 1.4, F.z + 0.31], m: 'noir' })

    // Courette en contrebas : murs de soutènement et parapet à balustres
    const yPar = 1.0
    const zSud = E.z1
    pc.push({ t: [E.x1 - E.hautMarches + 0.2, yPar - ZAL.sol + 0.2, 0.2], p: [(E.hautMarches + E.x1) / 2, (yPar + ZAL.sol - 0.2) / 2, zSud - 0.1], m: 'briqueVoisin', col: true })
    pc.push({ t: [0.2, yPar - ZAL.sol + 0.2, E.z1 - E.z0], p: [E.x1 - 0.1, (yPar + ZAL.sol - 0.2) / 2, (E.z0 + E.z1) / 2], m: 'briqueVoisin', col: true })
    // Chaperon et balustres sur le parapet sud
    pc.push({ t: [E.x1 - E.hautMarches + 0.3, 0.1, 0.32], p: [(E.hautMarches + E.x1) / 2, yPar + 0.05, zSud - 0.1], m: 'pierre' })
    pc.push({ t: [E.x1 - E.hautMarches + 0.3, 0.1, 0.3], p: [(E.hautMarches + E.x1) / 2, yPar + 0.95, zSud - 0.1], m: 'pierre', col: true })
    for (let x = E.hautMarches + 0.25; x < E.x1 - 0.1; x += 0.35)
      pc.push({ geo: new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6), p: [x, yPar + 0.5, zSud - 0.1], m: 'pierre', ombre: false })
    pc.push({ t: [0.32, 1.0, E.z1 - E.z0], p: [E.x1 - 0.1, yPar + 0.5, (E.z0 + E.z1) / 2], m: 'pierre', col: true })
    // Palier bas et marches
    const nb = E.nombre
    const xBas = E.hautMarches + nb * E.giron
    const zC = (E.z0 + zSud - 0.2) / 2
    const larg = zSud - 0.2 - E.z0
    pc.push({ t: [E.x1 - 0.2 - xBas, 0.4, larg], p: [(xBas + E.x1 - 0.2) / 2, ZAL.sol - 0.2, zC], m: 'trottoir', col: true })
    const e = escalier({ x: zC, largeur: larg, depart: xBas, sens: -1, yDepart: ZAL.sol, contremarche: E.contremarche, giron: E.giron, nombre: nb, m: 'trottoir', mNez: 'pierre', axe: 'x' })
    pc.push(...e.pieces)
    // Main courante en fer le long du mur sud
    const angM = Math.atan2(nb * E.contremarche, nb * E.giron)
    pc.push({ t: [Math.hypot(nb * E.giron, nb * E.contremarche), 0.05, 0.05], p: [(E.hautMarches + xBas) / 2, (ZAL.sol + 0) / 2 + 0.95, zSud - 0.32], r: [0, 0, -angM], m: 'fer', ombre: false })
    return { pieces: pc, rampe: e.rampe }
  }, [])

  return (
    <>
      <Pieces pieces={pieces} />
      <Invisible taille={rampe.taille} position={rampe.position} rotation={rampe.rotation} />
      {/* Porte d'entrée du Zal, au bas de l'escalier ; elle s'ouvre vers l'intérieur */}
      <Porte
        id="porte-zal"
        charniere={[ENTREE.porteX0 + ENTREE.porteLargeur - 0.03, ZAL.sol, F.z - 0.15]}
        largeur={ENTREE.porteLargeur - 0.06}
        hauteur={ENTREE.porteHauteur - 0.02}
        sens={-1}
        angleOuverture={-1.55}
      />
    </>
  )
}
