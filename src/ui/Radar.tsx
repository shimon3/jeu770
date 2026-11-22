import { useEffect, useRef } from 'react'
import { joueur, useGame } from '../state/store'
import { repereMission, donneursDisponibles } from '../missions/guide'

// Radar rond en bas à gauche (16/11/2026), à la manière des jeux en monde
// ouvert : le haut du radar est la direction du regard. On y voit les
// immeubles du jeu (770, complexe du grand Zal, magasins), la chaussée, la
// prochaine étape (losange doré, collé au bord quand elle est loin) et les
// personnes qui ont une mission à confier (points dorés).
// Emprises ESTIMÉES d'après les cotes du jeu : repère de jeu, pas un plan officiel.
const TAILLE = 148
const PORTEE = 34 // mètres du centre au bord
const BATIMENTS: { x0: number; x1: number; z0: number; z1: number; c: string }[] = [
  { x0: -8, x1: 8, z0: -22, z1: -0.3, c: '#8a4a3a' }, // 770
  { x0: -44, x1: -13.6, z0: -31, z1: -1, c: '#6e5a4e' }, // 784-788, grand Zal dessous (à gauche depuis le 22/11/2026)
  { x0: 40.2, x1: 59.6, z0: -14.5, z1: -1, c: '#3f6a8a' }, // magasins
  { x0: 9.4, x1: 40, z0: -18, z1: -1, c: '#5c5148' }, // bibliothèque 766, à droite
  { x0: -85, x1: -44.4, z0: -12, z1: 1, c: '#6a4a3c' }, // maisons en rangée (18/11/2026)
  { x0: -85, x1: 85, z0: 67, z1: 85, c: '#6a4a3c' }, // côté sud
]
const CHAUSSEES: [number, number][] = [
  [12, 19], // contre-allée
  [25, 45], // chaussée centrale
]

export function Radar() {
  const toile = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = toile.current
    if (!c) return
    const g = c.getContext('2d')
    if (!g) return
    const ech = Math.min(2, window.devicePixelRatio || 1)
    c.width = TAILLE * ech
    c.height = TAILLE * ech
    const R = TAILLE / 2
    const k = R / PORTEE
    const dessiner = () => {
      const s = useGame.getState()
      if (s.ecran !== 'jeu') return
      const [px, , pz] = joueur.position
      const sin = Math.sin(joueur.yaw)
      const cos = Math.cos(joueur.yaw)
      // Monde → radar : devant = (-sin, -cos) en haut, droite = (cos, -sin)
      const vers = (x: number, z: number): [number, number] => {
        const dx = x - px
        const dz = z - pz
        return [R + (dx * cos - dz * sin) * k, R + (dx * sin + dz * cos) * k]
      }
      g.setTransform(ech, 0, 0, ech, 0, 0)
      g.clearRect(0, 0, TAILLE, TAILLE)
      g.save()
      g.beginPath()
      g.arc(R, R, R - 2, 0, Math.PI * 2)
      g.clip()
      g.fillStyle = 'rgba(24, 28, 26, 0.86)'
      g.fillRect(0, 0, TAILLE, TAILLE)
      const rect = (x0: number, x1: number, z0: number, z1: number, couleur: string) => {
        const pts = [vers(x0, z0), vers(x1, z0), vers(x1, z1), vers(x0, z1)]
        g.beginPath()
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
        g.closePath()
        g.fillStyle = couleur
        g.fill()
      }
      for (const [z0, z1] of CHAUSSEES) rect(-60, 60, z0, z1, '#3a3d42')
      for (const b of BATIMENTS) rect(b.x0, b.x1, b.z0, b.z1, b.c)
      // Personnes qui ont une mission à confier
      g.fillStyle = '#ffd23a'
      for (const id of donneursDisponibles()) {
        const it = s.interactifs.get(id)
        if (!it) continue
        const [x, y] = vers(it.position[0], it.position[2])
        g.beginPath()
        g.arc(x, y, 3, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()
      // Prochaine étape : losange, ramené sur le bord s'il est hors de portée
      const r = repereMission()
      if (r) {
        let [x, y] = vers(r.x, r.z)
        const d = Math.hypot(x - R, y - R)
        const max = R - 9
        if (d > max) {
          x = R + ((x - R) * max) / d
          y = R + ((y - R) * max) / d
        }
        g.save()
        g.translate(x, y)
        g.rotate(Math.PI / 4)
        g.fillStyle = '#ffd23a'
        g.strokeStyle = '#3a2a00'
        g.lineWidth = 1.5
        g.fillRect(-4.5, -4.5, 9, 9)
        g.strokeRect(-4.5, -4.5, 9, 9)
        g.restore()
      }
      // Le joueur : flèche blanche au centre, tournée vers le haut
      g.beginPath()
      g.moveTo(R, R - 8)
      g.lineTo(R + 6, R + 7)
      g.lineTo(R, R + 3.5)
      g.lineTo(R - 6, R + 7)
      g.closePath()
      g.fillStyle = '#ffffff'
      g.strokeStyle = '#11100e'
      g.lineWidth = 1.5
      g.fill()
      g.stroke()
      // Cerclage
      g.beginPath()
      g.arc(R, R, R - 2, 0, Math.PI * 2)
      g.strokeStyle = 'rgba(217, 165, 74, 0.9)'
      g.lineWidth = 3
      g.stroke()
    }
    dessiner()
    const id = window.setInterval(dessiner, 80)
    return () => window.clearInterval(id)
  }, [])
  return <canvas ref={toile} className="hud-radar" style={{ width: TAILLE, height: TAILLE }} aria-hidden="true" />
}
