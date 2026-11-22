import { useMemo } from 'react'
import * as THREE from 'three'
import { texturePierreAngulaire } from '../texturesProcedurales'
import { COURETTE, ENTREE, ZAL } from '../../config/grandZal'
import { escalier, Invisible, mur, Pieces, type Piece } from '../primitives'
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

// 22/11/2026 : aspect refait d'après la photo Google Maps fournie par Samuel
// (vue du trottoir) : immeuble de 4 niveaux en brique rouge, toit plat,
// grande corniche sombre à consoles, fenêtres à encadrement de pierre
// blanche (cintrées au dernier niveau), chaîne de pierre blanche au centre
// et aux angles, soubassement de pierre. Nombre de travées, hauteurs et
// cotes ESTIMÉS — à calibrer. (L'ancien pignon venait de la phase 1.)
const F = { x0: 9.6, x1: 40, z: -1.0, h: 14.4, prof: 22 } // façade et volume ESTIMÉS
const NIVEAUX_784 = [1.9, 5.1, 8.3, 11.2] // appuis des fenêtres — ESTIMÉ
const TRAVEES_784 = 10 // ESTIMÉ (5 de chaque côté de la chaîne centrale)

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
        m: 'briqueRouge', // brique rouge (photo du 22/11/2026)
      }),
    )
    // Corps du bâtiment au-dessus du Zal
    const yBas = ZAL.plafond + 0.25
    pc.push({ t: [F.x1 - F.x0, F.h - yBas, F.prof - ep], p: [(F.x0 + F.x1) / 2, (F.h + yBas) / 2, F.z - ep - (F.prof - ep) / 2], m: 'briqueRouge', col: true })
    // Façade d'après la photo du 22/11/2026
    const zF = F.z
    const xm = (F.x0 + F.x1) / 2
    // Soubassement de pierre (sous les premières fenêtres)
    pc.push({ t: [F.x1 - F.x0, 1.4, 0.14], p: [xm, 0.75, zF + 0.07], m: 'pierreFoncee' })
    // Chaînes de pierre blanche : angles et centre
    for (const x of [F.x0 + 0.35, xm, F.x1 - 0.35])
      for (let y = 1.6; y < F.h - 1.4; y += 0.62) pc.push({ t: [x === xm ? 0.9 : 0.7, 0.42, 0.1], p: [x, y, zF + 0.05], m: 'pierre' })
    // Bandeau de pierre sous le dernier niveau
    pc.push({ t: [F.x1 - F.x0, 0.22, 0.12], p: [xm, NIVEAUX_784[3] - 0.25, zF + 0.06], m: 'pierre' })
    // Fenêtres : 5 travées de chaque côté de la chaîne centrale
    const demi = [[F.x0 + 0.9, xm - 0.7], [xm + 0.7, F.x1 - 0.9]] as const
    for (const [xa, xb] of demi) {
      const pas = (xb - xa) / (TRAVEES_784 / 2)
      for (let i = 0; i < TRAVEES_784 / 2; i++) {
        const cx = xa + pas * (i + 0.5)
        NIVEAUX_784.forEach((y, k) => {
          const haut = k === 3
          const w = 1.35
          const hF = haut ? 1.75 : 2.0
          pc.push({ t: [w, hF, 0.05], p: [cx, y + hF / 2, zF + 0.01], m: 'vitre', ombre: false })
          pc.push({ t: [0.05, hF, 0.05], p: [cx, y + hF / 2, zF + 0.04], m: 'blancCamping', ombre: false })
          pc.push({ t: [w, 0.06, 0.05], p: [cx, y + hF * 0.55, zF + 0.04], m: 'blancCamping', ombre: false })
          // Encadrement de pierre blanche
          for (const sg of [-1, 1]) pc.push({ t: [0.18, hF + 0.1, 0.1], p: [cx + sg * (w / 2 + 0.09), y + hF / 2, zF + 0.05], m: 'pierre' })
          pc.push({ t: [w + 0.5, 0.14, 0.16], p: [cx, y - 0.07, zF + 0.08], m: 'pierre' })
          if (haut) {
            // Arc du dernier niveau (approché par trois voussoirs) et clé
            pc.push({ t: [w + 0.36, 0.16, 0.1], p: [cx, y + hF + 0.12, zF + 0.05], m: 'pierre' })
            for (const sg of [-1, 1]) pc.push({ t: [0.5, 0.14, 0.1], p: [cx + sg * 0.55, y + hF + 0.02, zF + 0.05], r: [0, 0, sg * -0.45], m: 'pierre' })
            pc.push({ t: [0.2, 0.32, 0.14], p: [cx, y + hF + 0.24, zF + 0.07], m: 'pierre' })
          } else {
            // Linteau mouluré à agrafe
            pc.push({ t: [w + 0.5, 0.24, 0.14], p: [cx, y + hF + 0.12, zF + 0.07], m: 'pierre' })
            pc.push({ t: [0.24, 0.3, 0.16], p: [cx, y + hF + 0.18, zF + 0.09], m: 'pierre' })
            // Allège ornée sous la fenêtre (photo : panneaux sculptés)
            if (k > 0) pc.push({ t: [w + 0.2, 0.5, 0.06], p: [cx, y - 0.4, zF + 0.03], m: 'pierre' })
          }
        })
      }
    }
    // Grande corniche sombre à consoles, toit plat
    pc.push({ t: [F.x1 - F.x0 + 0.6, 0.35, 0.9], p: [xm, F.h - 0.2, zF + 0.4], m: 'noir' })
    pc.push({ t: [F.x1 - F.x0 + 0.3, 0.6, 0.35], p: [xm, F.h - 0.65, zF + 0.17], m: 'noir' })
    for (let x = F.x0 + 0.5; x < F.x1 - 0.3; x += 1.5) pc.push({ t: [0.2, 0.55, 0.6], p: [x, F.h - 0.65, zF + 0.3], m: 'noir' })
    pc.push({ t: [F.x1 - F.x0, 0.25, 0.14], p: [xm, F.h - 1.15, zF + 0.07], m: 'noir' })

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
        pc.push({ t: [Math.max(0.04, xb - xa - 0.12), hP * 0.55, 0.02], p: [cxp, S + hP * 0.42, zz + sg * 0.04], m: 'cheneFonce' })
        if (xb - xa > 0.2) pc.push({ t: [0.12, 0.1, 0.01], p: [cxp, S + hP * 0.85, zz + sg * 0.035], m: 'laiton' })
      }
    }
    for (const d of E.portes) pc.push({ t: [0.5, 0.05, 0.1], p: [d.x0 + d.largeur / 2, S + hP + 0.42, zFace + 0.1], m: 'vitreEclairee', ombre: false })
    // Palier couvert (photos) : plafond sombre au-dessus des portes
    pc.push({ t: [larg, 0.35, 1.5], p: [xC, S + hP + 0.95, F.z + 0.75], m: 'noir', col: true })
    // Étagères contre le mur gauche du palier (livres, photos de Samuel)
    pc.push({ t: [0.32, 2.1, 1.2], p: [C.xa + 0.16, S + 1.05, F.z + 0.75], m: 'cheneFonce' })
    for (let k = 0; k < 5; k++) pc.push({ t: [0.3, 0.32, 1.12], p: [C.xa + 0.19, S + 0.3 + k * 0.4, F.z + 0.75], m: k % 2 ? 'voiture0' : 'voiture1', ombre: false })
    pc.push({ t: [0.34, 0.2, 0.18], p: [xC, S + hP + 0.6, zFace + 0.1], m: 'noir' })
    pc.push({ t: [0.26, 0.14, 0.04], p: [xC, S + hP + 0.6, zFace + 0.2], m: 'vitreEclairee', ombre: false })
    return { pieces: pc, rampe: e.rampe }
  }, [])

  const C = COURETTE
  const zLong = C.zHaut - ENTREE.z0
  // Pierre angulaire « אבן הפינה / THE CORNERSTONE » (photo de l'entrée,
  // Samuel 12/11/2026) : sur le mur de droite en descendant (est), à mi-escalier
  const pierre = useMemo(() => new THREE.MeshStandardMaterial({ map: texturePierreAngulaire(), roughness: 0.6 }), [])
  const pierreGranit = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4e4542', roughness: 0.6 }), [])
  const zPierre = C.zHaut - 0.45
  const yPierre = 0.95
  const zMil = (ENTREE.z0 + C.zHaut) / 2
  const S = ZAL.sol
  return (
    <>
      <Pieces pieces={pieces} />
      {/* Pilier de granit en haut à droite de l'escalier, pierre angulaire face à la descente */}
      <mesh position={[ENTREE.x1 - 0.25, 0.95, zPierre]} material={pierreGranit} castShadow>
        <boxGeometry args={[0.5, 1.6, 0.7]} />
      </mesh>
      <mesh position={[ENTREE.x1 - 0.506, yPierre, zPierre]} rotation={[0, -Math.PI / 2, 0]} material={pierre}>
        <planeGeometry args={[0.6, 0.6]} />
      </mesh>
      <Invisible taille={rampe.taille} position={rampe.position} rotation={rampe.rotation} />
      {/* Garde-corps : on ne tombe pas dans la courette par les côtés */}
      {[ENTREE.x0 + ENTREE.mur / 2, ENTREE.x1 - ENTREE.mur / 2].map((x) => (
        <Invisible key={x} taille={[ENTREE.mur, 1.0, zLong]} position={[x, 0.65, zMil]} />
      ))}
      {/* Applique : éclaire le palier et les portes */}
      <pointLight position={[(C.xa + C.xb) / 2, S + ENTREE.porteHauteur + 0.4, ENTREE.z0 + 0.6]} intensity={6} distance={7} decay={2} color="#ffd9a0" />
      {/* Les deux portes d'entrée du Zal, au bas de l'escalier ; elles s'ouvrent vers l'intérieur */}
      {/* Trois portes doubles : six battants, ouverture vers l'extérieur (palier) */}
      {ENTREE.portes.flatMap((d) => {
        const lb = d.largeur / 2 - 0.02
        return [
          <Porte key={`${d.id}-g`} id={`${d.id}-g`} charniere={[d.x0 + 0.01, S, F.z + 0.03]} largeur={lb} hauteur={ENTREE.porteHauteur - 0.02} sens={1} angleOuverture={-1.45} modele="zal" />,
          <Porte key={`${d.id}-d`} id={`${d.id}-d`} charniere={[d.x0 + d.largeur - 0.01, S, F.z + 0.03]} largeur={lb} hauteur={ENTREE.porteHauteur - 0.02} sens={-1} angleOuverture={1.45} modele="zal" />,
        ]
      })}
    </>
  )
}
