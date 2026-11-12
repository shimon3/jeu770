import { useMemo } from 'react'
import * as THREE from 'three'
import { texturePierreAngulaire } from '../texturesProcedurales'
import { COURETTE, ENTREE, ZAL } from '../../config/grandZal'
import { escalier, geoPignon, Invisible, mur, Pieces, type Piece } from '../primitives'
import { grilleFenetres } from '../rue/Voisins'
import { Porte } from '../Porte'

// 784-788 Eastern Parkway, à DROITE du 770 vu de la rue (OpenStreetMap ;
// photo COLlive 11/2025). Aspect extérieur repris de la phase 1 (photo Clio :
// pignon de brique, portail de pierre, parapet à balustres). VOLUME
// APPROXIMATIF. Sous ce bâtiment se trouve le grand Zal (GrandZal.tsx) : le
// corps du bâtiment commence donc au-dessus du plafond du Zal.
//
// Accès au Zal (photo de nuit n° 4 fournie par Samuel, 2026) : l'accès se
// fait par la FAÇADE AVANT. Depuis le trottoir, un escalier droit descend
// perpendiculairement à la façade dans une courette anglaise ; en bas, un
// palier et deux portes dans la façade donnent sur le grand Zal.
// Disposition confirmée par la photo ; cotes (largeur, nombre de marches,
// position en x, palier, portes) = RECONSTITUTION ARTISTIQUE.
// L'ancienne descente latérale (escalier parallèle à la façade partant de la
// gauche, puis porte de côté) est supprimée.

const F = { x0: 9.6, x1: 40, z: -1.0, h: 11.5, prof: 22 } // façade et volume ESTIMÉS

export function Complexe784() {
  const { pieces, rampe } = useMemo(() => {
    const pc: Piece[] = []
    const ep = 0.3
    const E = ENTREE
    const C = COURETTE
    const S = ZAL.sol
    const hP = E.porteHauteur
    // Mur de façade : du niveau du Zal jusqu'à la corniche, deux portes au niveau du Zal
    pc.push(
      ...mur({
        axe: 'x',
        plan: F.z - ep / 2,
        epaisseur: ep,
        de: F.x0,
        a: F.x1,
        bas: S - 0.3,
        haut: F.h,
        ouvertures: E.portes.map((d) => ({ x0: d.x0, x1: d.x0 + d.largeur, y0: S, y1: S + hP })),
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

    // --- Courette anglaise frontale ---
    // Murs de soutènement est et ouest, du fond de la courette au trottoir,
    // surmontés d'un chaperon de pierre (hauteur ESTIMÉE).
    const zLong = C.zHaut - E.z0
    const zMil = (E.z0 + C.zHaut) / 2
    for (const x of [E.x0 + E.mur / 2, E.x1 - E.mur / 2]) {
      pc.push({ t: [E.mur, 0.15 - (S - 0.4), zLong], p: [x, (0.15 + S - 0.4) / 2, zMil], m: 'briqueVoisin', col: true })
      pc.push({ t: [E.mur + 0.08, 0.08, zLong + 0.04], p: [x, 0.19, zMil], m: 'pierre' })
    }
    // Garde-corps en fer le long des deux bords, côté trottoir (non
    // collisionnel : la collision est faite par un collider invisible).
    for (const x of [E.x0 + E.mur / 2, E.x1 - E.mur / 2]) {
      for (const y of [0.3, 1.1]) pc.push({ t: [0.045, 0.045, zLong], p: [x, y, zMil], m: 'fer', ombre: false })
      for (let z = E.z0 + 0.15; z <= C.zHaut + 0.01; z += 0.14) pc.push({ t: [0.025, 0.85, 0.025], p: [x, 0.7, z], m: 'fer', ombre: false })
      pc.push({ t: [0.1, 1.15, 0.1], p: [x, 0.6, C.zHaut - 0.05], m: 'fer' })
    }
    // Palier bas devant les deux portes
    const larg = C.xb - C.xa
    const xC = (C.xa + C.xb) / 2
    pc.push({ t: [larg, 0.4, E.palier], p: [xC, S - 0.2, E.z0 + E.palier / 2], m: 'trottoir', col: true })
    // Seuils dans l'épaisseur du mur
    for (const d of E.portes) pc.push({ t: [d.largeur, 0.3, ep + 0.02], p: [d.x0 + d.largeur / 2, S - 0.15, F.z - ep / 2], m: 'pierre', col: true })
    // Escalier droit, perpendiculaire à la façade : il monte vers la rue (+z)
    const e = escalier({ x: xC, largeur: larg, depart: C.zBas, sens: 1, yDepart: S, contremarche: E.contremarche, giron: E.giron, nombre: E.nombre, m: 'trottoir', mNez: 'pierre', axe: 'z' })
    pc.push(...e.pieces)
    // Mains courantes en fer de part et d'autre de l'escalier
    const angM = Math.atan2(E.nombre * E.contremarche, E.nombre * E.giron)
    const lgM = Math.hypot(E.nombre * E.giron, E.nombre * E.contremarche)
    for (const x of [C.xa + 0.06, C.xb - 0.06])
      pc.push({ t: [0.05, 0.05, lgM], p: [x, (S + 0) / 2 + 0.92, (C.zBas + C.zHaut) / 2], r: [-angM, 0, 0], m: 'fer', ombre: false })

    // Les deux portes du bas : encadrements de bois, linteau de pierre,
    // applique éclairée au-dessus (la photo 4 est prise de nuit, entrée
    // éclairée). Dessins des menuiseries ESTIMÉS.
    const zFace = F.z + 0.02
    for (const d of E.portes) {
      const cx = d.x0 + d.largeur / 2
      for (const x of [d.x0 - 0.06, d.x0 + d.largeur + 0.06]) pc.push({ t: [0.12, hP + 0.12, 0.1], p: [x, S + (hP + 0.12) / 2, zFace], m: 'cheneFonce' })
      pc.push({ t: [d.largeur + 0.24, 0.12, 0.1], p: [cx, S + hP + 0.06, zFace], m: 'cheneFonce' })
    }
    pc.push({ t: [larg, 0.18, 0.18], p: [xC, S + hP + 0.24, zFace + 0.03], m: 'pierre' })
    // Photos de l'entrée (Samuel, 12/11/2026) : rangée de vantaux de noyer.
    // Entre et de part et d'autre des deux portes, pilastres de bois à
    // panneaux avec petite plaque de laiton, côté courette et côté Zal ;
    // un luminaire au-dessus de chaque porte.
    const bords = [C.xa, ...E.portes.flatMap((d) => [d.x0, d.x0 + d.largeur]), C.xb].sort((a, b) => a - b)
    for (let i = 0; i < bords.length; i += 2) {
      const xa = bords[i] + (i === 0 ? 0 : 0.06)
      const xb = bords[i + 1] - (i + 1 === bords.length - 1 ? 0 : 0.06)
      if (xb - xa < 0.08) continue
      const cxp = (xa + xb) / 2
      for (const [zz, sg] of [[F.z + 0.04, 1], [F.z - ep - 0.04, -1]] as const) {
        pc.push({ t: [xb - xa, hP, 0.06], p: [cxp, S + hP / 2, zz], m: 'cheneFonce' })
        pc.push({ t: [Math.max(0.04, xb - xa - 0.12), hP * 0.55, 0.02], p: [cxp, S + hP * 0.42, zz + sg * 0.04], m: 'chene' })
        if (xb - xa > 0.2) pc.push({ t: [0.12, 0.1, 0.01], p: [cxp, S + hP * 0.85, zz + sg * 0.035], m: 'laiton' })
      }
    }
    for (const d of E.portes) pc.push({ t: [0.5, 0.05, 0.1], p: [d.x0 + d.largeur / 2, S + hP + 0.42, zFace + 0.1], m: 'vitreEclairee', ombre: false })
    pc.push({ t: [0.34, 0.2, 0.18], p: [xC, S + hP + 0.6, zFace + 0.1], m: 'noir' })
    pc.push({ t: [0.26, 0.14, 0.04], p: [xC, S + hP + 0.6, zFace + 0.2], m: 'vitreEclairee', ombre: false })
    return { pieces: pc, rampe: e.rampe }
  }, [])

  const C = COURETTE
  const zLong = C.zHaut - ENTREE.z0
  // Pierre angulaire « אבן הפינה / THE CORNERSTONE » (photo de l'entrée,
  // Samuel 12/11/2026) : sur le mur de droite en descendant (est), à mi-escalier
  const pierre = useMemo(() => new THREE.MeshStandardMaterial({ map: texturePierreAngulaire(), roughness: 0.6 }), [])
  const zPierre = (C.zBas + C.zHaut) / 2 + 0.6
  const yPierre = Math.min(-0.45, ZAL.sol + ((zPierre - C.zBas) / ENTREE.giron) * ENTREE.contremarche + 1.35)
  const zMil = (ENTREE.z0 + C.zHaut) / 2
  const S = ZAL.sol
  return (
    <>
      <Pieces pieces={pieces} />
      <mesh position={[C.xb - 0.012, yPierre, zPierre]} rotation={[0, -Math.PI / 2, 0]} material={pierre}>
        <planeGeometry args={[0.75, 0.75]} />
      </mesh>
      <Invisible taille={rampe.taille} position={rampe.position} rotation={rampe.rotation} />
      {/* Garde-corps : on ne tombe pas dans la courette par les côtés */}
      {[ENTREE.x0 + ENTREE.mur / 2, ENTREE.x1 - ENTREE.mur / 2].map((x) => (
        <Invisible key={x} taille={[ENTREE.mur, 1.0, zLong]} position={[x, 0.65, zMil]} />
      ))}
      {/* Applique : éclaire le palier et les portes */}
      <pointLight position={[(C.xa + C.xb) / 2, S + ENTREE.porteHauteur + 0.4, ENTREE.z0 + 0.6]} intensity={6} distance={7} decay={2} color="#ffd9a0" />
      {/* Les deux portes d'entrée du Zal, au bas de l'escalier ; elles s'ouvrent vers l'intérieur */}
      <Porte
        id={ENTREE.portes[0].id}
        charniere={[ENTREE.portes[0].x0 + 0.03, S, F.z - 0.15]}
        largeur={ENTREE.portes[0].largeur - 0.06}
        hauteur={ENTREE.porteHauteur - 0.02}
        sens={1}
        angleOuverture={1.55}
        modele="zal"
      />
      <Porte
        id={ENTREE.portes[1].id}
        charniere={[ENTREE.portes[1].x0 + ENTREE.portes[1].largeur - 0.03, S, F.z - 0.15]}
        largeur={ENTREE.portes[1].largeur - 0.06}
        hauteur={ENTREE.porteHauteur - 0.02}
        sens={-1}
        angleOuverture={-1.55}
        modele="zal"
      />
    </>
  )
}
