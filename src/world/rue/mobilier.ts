import type { Piece, V3 } from '../primitives'

// Mobilier urbain modélisé en code : abri de bus à l'américaine et kiosque à
// journaux juifs. Repère local : la chaussée est vers +z, le sol à y = 0.
// Les pièces marquées `col` donnent leurs collisions (via Pieces).

function poser(local: { t: V3; p: V3; m: Piece['m']; col?: boolean; ombre?: boolean }[], x: number, z: number, rotY: number): Piece[] {
  const c = Math.cos(rotY)
  const s = Math.sin(rotY)
  return local.map((pc) => ({
    ...pc,
    p: [x + pc.p[0] * c + pc.p[2] * s, pc.p[1], z - pc.p[0] * s + pc.p[2] * c] as V3,
    r: [0, rotY, 0] as V3,
  }))
}

// Abri de bus (4 × 1,5 × 2,5 m) : poteaux, toit, vitres au fond et sur les
// côtés, banc, panneau lumineux ; poteau « BUS STOP » côté bordure
export function abriBus(x: number, z: number, rotY: number): Piece[] {
  const pc: { t: V3; p: V3; m: Piece['m']; col?: boolean; ombre?: boolean }[] = [
    { t: [4.1, 0.08, 1.6], p: [0, 2.5, 0], m: 'zinc' },
    { t: [3.9, 2.2, 0.03], p: [0, 1.25, -0.72], m: 'verreAbri', col: true, ombre: false },
    { t: [0.03, 2.2, 1.1], p: [-1.95, 1.25, -0.15], m: 'verreAbri', col: true, ombre: false },
    { t: [0.03, 2.2, 1.1], p: [1.95, 1.25, -0.15], m: 'verreAbri', col: true, ombre: false },
    { t: [1.1, 1.7, 0.08], p: [1.35, 1.3, -0.68], m: 'phare', ombre: false },
    { t: [2.2, 0.06, 0.4], p: [-0.4, 0.48, -0.48], m: 'bancBois' },
    { t: [0.08, 3.0, 0.08], p: [2.6, 1.5, 0.75], m: 'fer' },
    { t: [0.6, 0.45, 0.04], p: [2.6, 2.75, 0.75], m: 'panneauArretBus' },
  ]
  for (const px of [-2.0, 2.0]) for (const pz of [-0.75, 0.75]) pc.push({ t: [0.08, 2.5, 0.08], p: [px, 1.25, pz], m: 'fer' })
  return poser(pc, x, z, rotY)
}

// Kiosque à journaux juifs (2,4 × 1,6 × 2,6 m) : guichet ouvert côté +z,
// présentoir de journaux, auvent et enseigne bilingue
export function kiosqueJournaux(x: number, z: number, rotY: number): Piece[] {
  const pc: { t: V3; p: V3; m: Piece['m']; col?: boolean; ombre?: boolean }[] = [
    { t: [2.4, 2.4, 0.1], p: [0, 1.2, -0.75], m: 'vertLampadaire', col: true },
    { t: [0.1, 2.4, 1.6], p: [-1.15, 1.2, 0], m: 'vertLampadaire', col: true },
    { t: [0.1, 2.4, 1.6], p: [1.15, 1.2, 0], m: 'vertLampadaire', col: true },
    { t: [2.4, 0.9, 0.1], p: [0, 0.45, 0.75], m: 'vertLampadaire', col: true },
    { t: [2.6, 0.1, 1.9], p: [0, 2.45, 0.1], m: 'vertLampadaire' },
    { t: [2.4, 0.42, 0.04], p: [0, 2.22, 0.82], m: 'enseigneJournaux', ombre: false },
    // Auvent incliné
    { t: [2.6, 0.04, 0.7], p: [0, 2.15, 1.15], m: 'voiture2' },
    // Présentoir : tablette et piles de journaux
    { t: [2.3, 0.05, 0.5], p: [0, 0.92, 0.95], m: 'bancBois' },
  ]
  for (let i = 0; i < 6; i++)
    pc.push({ t: [0.32, 0.06 + (i % 3) * 0.03, 0.4], p: [-0.9 + i * 0.36, 0.98, 0.95], m: i % 2 ? 'papier' : 'zinc' })
  // Journaux et magazines accrochés au fond (couvertures de couleur)
  const couv: Piece['m'][] = ['papier', 'jauneMashiah', 'policeBleu', 'rougePompier', 'papier', 'voiture2', 'taxi', 'papier', 'voiture0', 'rougeTank']
  for (let r = 0; r < 2; r++)
    for (let i = 0; i < 5; i++) {
      pc.push({ t: [0.34, 0.45, 0.02], p: [-0.8 + i * 0.4, 1.55 + r * 0.5, -0.68], m: couv[r * 5 + i] })
      pc.push({ t: [0.28, 0.06, 0.025], p: [-0.8 + i * 0.4, 1.7 + r * 0.5, -0.665], m: 'noir', ombre: false })
    }
  // Étagère latérale gauche : siddourim et tehilim (dos colorés)
  pc.push({ t: [0.3, 0.03, 1.2], p: [-0.95, 1.2, -0.05], m: 'bancBois' })
  pc.push({ t: [0.3, 0.03, 1.2], p: [-0.95, 1.6, -0.05], m: 'bancBois' })
  const dos: Piece['m'][] = ['policeBleu', 'rougePompier', 'noir', 'vertLampadaire', 'jauneMashiah', 'policeBleu']
  for (let e = 0; e < 2; e++)
    for (let i = 0; i < 6; i++) pc.push({ t: [0.2, 0.26, 0.12], p: [-0.95, 1.35 + e * 0.4, -0.55 + i * 0.19], m: dos[(i + e * 2) % 6], ombre: false })
  // Réfrigérateur à boissons à droite (porte vitrée, bouteilles)
  pc.push({ t: [0.5, 1.7, 0.55], p: [0.82, 0.85, -0.4], m: 'zinc', col: true })
  pc.push({ t: [0.02, 1.4, 0.45], p: [0.56, 0.95, -0.4], m: 'vitre', ombre: false })
  for (let e = 0; e < 3; e++)
    for (let i = 0; i < 3; i++) pc.push({ t: [0.08, 0.24, 0.08], p: [0.65, 0.45 + e * 0.45, -0.55 + i * 0.15], m: (['rougePompier', 'voiture0', 'taxi'] as Piece['m'][])[(i + e) % 3], ombre: false })
  // Bocaux de bonbons sur le comptoir
  for (const bx of [-0.95, 0.95]) pc.push({ t: [0.18, 0.22, 0.18], p: [bx, 1.06, 0.95], m: 'taxi', ombre: false })
  // Caisse enregistreuse
  pc.push({ t: [0.32, 0.18, 0.26], p: [0.55, 1.04, 0.88], m: 'noir' })
  return poser(pc, x, z, rotY)
}

