import { useMemo } from 'react'
import * as THREE from 'three'
import { ARON, ZAL } from '../../config/grandZal'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { textureCantonniere, textureDamier, textureParokhet, textureRayons } from '../texturesProcedurales'

// Heichal (Aron Kodesh) du grand Zal, d'après la photo fournie par Samuel le
// 12/11/2026 : meuble de bois marqueté (pilastres à chevrons, damiers en bas),
// fronton brisé à corniches dorées sur un « soleil » de lattes, deux tours
// d'angle coiffées d'or et de boules dorées. Posé directement sur le
// carrelage, contre le mur de brique blanche. Parokhet de velours bordeaux
// « כתר תורה » (couronne, livre ouvert, colonnes, laurier) sous une
// cantonnière « יחי אדוננו מורנו ורבינו מלך המשיח לעולם ועד ».
// La dédicace brodée n'est pas reproduite. Cotes ESTIMÉES.
//
// TOUJOURS FERMÉ : le parokhet couvre les portes en permanence. Il n'existe
// AUCUN état ouvert, aucune animation ni interaction d'ouverture : la seule
// interaction est la lecture de la plaque. Ne pas en ajouter.

export function AronKodesh({ m }: { m: MateriauxZal }) {
  const S = ZAL.sol
  const { x: xMur, z, largeur: L, hauteur: H, profondeur: P } = ARON
  const pieces = useMemo(() => {
    const parokhet = new THREE.MeshStandardMaterial({ map: textureParokhet(), roughness: 0.85 })
    const cantonniere = new THREE.MeshStandardMaterial({ map: textureCantonniere(), roughness: 0.85 })
    const damier = new THREE.MeshStandardMaterial({ map: textureDamier(), roughness: 0.5 })
    const rayons = new THREE.MeshStandardMaterial({ map: textureRayons(), roughness: 0.5 })
    const pc: PieceLibre[] = []
    const y0 = S
    const xA = xMur - P / 2 // centre du corps
    const xF = xMur - P // face avant (regarde vers -x)
    const face: [number, number, number] = [0, -Math.PI / 2, 0]
    const plan = (w: number, h: number) => new THREE.PlaneGeometry(w, h)
    // Socle noir
    pc.push({ t: [P + 0.1, 0.16, L + 0.1], p: [xMur - (P + 0.1) / 2, y0 + 0.08, z], mat: m.metal, col: true })
    // Corps de bois
    pc.push({ t: [P, H, L], p: [xA, y0 + 0.16 + H / 2, z], mat: m.boisFonce, col: true })
    const lp = 0.62 // largeur d'un pilastre
    const zp = L / 2 - lp / 2
    for (const s of [-1, 1]) {
      const zz = z + s * zp
      // Pilastre : chevrons en haut, damier en bas, moulures
      pc.push({ geo: plan(lp - 0.12, H * 0.62), p: [xF - 0.012, y0 + 0.16 + H * 0.36 + H * 0.31, zz], r: face, mat: m.chevrons, ombre: false })
      pc.push({ geo: plan(lp - 0.12, H * 0.26), p: [xF - 0.012, y0 + 0.16 + H * 0.14, zz], r: face, mat: damier, ombre: false })
      pc.push({ t: [0.06, 0.06, lp], p: [xF - 0.03, y0 + 0.16 + H * 0.29, zz], mat: m.boisDore, ombre: false })
      for (const dz of [-1, 1]) pc.push({ t: [0.05, H, 0.05], p: [xF - 0.025, y0 + 0.16 + H / 2, zz + dz * (lp / 2 - 0.03)], mat: m.boisDore, ombre: false })
      // Tour d'angle : socle, corps, corniche dorée, boule dorée
      const yT = y0 + 0.16 + H
      pc.push({ t: [P * 0.8, 0.55, lp - 0.02], p: [xA, yT + 0.275, zz], mat: m.boisFonce })
      pc.push({ geo: plan(lp - 0.14, 0.4), p: [xF + 0.1 - 0.012, yT + 0.28, zz], r: face, mat: m.chevrons, ombre: false })
      pc.push({ t: [P * 0.8 + 0.14, 0.09, lp + 0.12], p: [xA, yT + 0.6, zz], mat: m.or })
      pc.push({ t: [P * 0.6, 0.14, lp - 0.12], p: [xA, yT + 0.71, zz], mat: m.boisFonce })
      pc.push({ geo: new THREE.SphereGeometry(0.1, 12, 8), p: [xA, yT + 0.86, zz], mat: m.or, ombre: false })
    }
    // Frise haute à chevrons au-dessus du parokhet
    const lc = L - 2 * lp
    pc.push({ geo: plan(lc, 0.42), p: [xF - 0.012, y0 + 0.16 + H - 0.24, z], r: face, mat: m.chevrons, ombre: false })
    pc.push({ t: [0.08, 0.07, L + 0.04], p: [xF - 0.04, y0 + 0.16 + H - 0.02, z], mat: m.or, ombre: false })
    // Fronton brisé : soleil de lattes, deux corniches dorées inclinées
    const yF = y0 + 0.16 + H
    const hf = 0.62
    pc.push({ t: [0.12, hf, lc], p: [xF + 0.15, yF + hf / 2, z], mat: m.boisFonce })
    pc.push({ geo: plan(lc - 0.1, hf - 0.08), p: [xF + 0.08, yF + hf / 2, z], r: face, mat: rayons, ombre: false })
    const pente = Math.atan2(hf * 0.75, lc / 2)
    const lg = Math.hypot(lc / 2, hf * 0.75) - 0.12
    for (const s of [-1, 1]) {
      pc.push({
        t: [0.32, 0.12, lg],
        p: [xF + 0.12, yF + hf * 0.42, z + s * (lc / 4 + 0.08)],
        r: [s * pente, 0, 0],
        mat: m.or,
      })
    }
    // Losange central doré
    pc.push({ t: [0.1, 0.22, 0.22], p: [xF + 0.08, yF + hf * 0.62, z], r: [Math.PI / 4, 0, 0], mat: m.or, ombre: false })
    // Parokhet bordeaux FERMÉ, tringle dorée et cantonnière « יחי »
    const hp = H - 0.75
    const yP = y0 + 0.16 + 0.12
    pc.push({ geo: plan(lc - 0.12, hp), p: [xF - 0.05, yP + hp / 2, z], r: face, mat: parokhet })
    for (let i = 1; i < 10; i++) {
      const zz = z - (lc - 0.12) / 2 + ((lc - 0.12) * i) / 10
      pc.push({ geo: new THREE.CylinderGeometry(0.018, 0.02, hp - 0.4, 6), p: [xF - 0.058, yP + hp / 2 - 0.1, zz], mat: m.bordeaux, ombre: false })
    }
    pc.push({ t: [0.04, 0.05, lc - 0.08], p: [xF - 0.06, yP + 0.02, z], mat: m.or, ombre: false })
    pc.push({ geo: plan(lc + 0.1, 0.42), p: [xF - 0.1, yP + hp - 0.08, z], r: face, mat: cantonniere })
    pc.push({ geo: new THREE.CylinderGeometry(0.022, 0.022, lc + 0.3, 8), p: [xF - 0.1, yP + hp + 0.14, z], r: [Math.PI / 2, 0, 0], mat: m.or, ombre: false })
    return pc
  }, [m, xMur, z, L, H, P, S])

  useInteractif('aron-plaque', [xMur - P - 1.2, S + 1.2, z + 1.4], 1.6, () => t('action.lirePlaque'), () => {
    useGame.getState().set({ panneau: { type: 'message', cle: 'zal.aronTexte' } })
  })

  return <PiecesLibres pieces={pieces} ombres={false} />
}
