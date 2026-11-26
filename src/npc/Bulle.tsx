import { useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Bulle de pensée ou de parole au-dessus d'un PNJ, comme dans les Sims :
// une icône dans un rond blanc, qui apparaît en grossissant, flotte un peu et
// disparaît. Aucun texte : les icônes se lisent dans les deux langues.
// Une texture par icône, partagée par tous les PNJ ; un sprite par PNJ.

export type Icone = 'livre' | 'rire' | 'ballon' | 'question' | 'idee' | 'coeur' | 'parole' | 'priere' | 'radio' | 'salut'

const SYMBOLES: Record<Icone, string> = {
  livre: '📖',
  rire: '😂',
  ballon: '⚽',
  question: '❓',
  idee: '💡',
  coeur: '❤️',
  parole: '💬',
  priere: '🙏',
  radio: '📻',
  salut: '👋',
}

const textures = new Map<Icone, THREE.CanvasTexture>()

function texture(icone: Icone) {
  let t = textures.get(icone)
  if (t) return t
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  // Rond blanc bordé, petite pointe vers le bas
  g.fillStyle = 'rgba(255,255,255,0.95)'
  g.strokeStyle = 'rgba(40,40,40,0.55)'
  g.lineWidth = 4
  g.beginPath()
  g.arc(64, 56, 46, 0, Math.PI * 2)
  g.fill()
  g.stroke()
  g.beginPath()
  g.moveTo(52, 98)
  g.lineTo(64, 122)
  g.lineTo(76, 98)
  g.closePath()
  g.fill()
  g.font = '56px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(SYMBOLES[icone], 64, 60)
  t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  textures.set(icone, t)
  return t
}

export type EtatBulle = { icone: Icone | null; reste: number }

// À appeler depuis la logique du PNJ : montre `icone` pendant `duree` s
export function montrerBulle(b: EtatBulle, icone: Icone, duree = 2.5) {
  b.icone = icone
  b.reste = duree
}

const DIST_MAX = 22

export function Bulle({ etat, hauteur }: { etat: MutableRefObject<EtatBulle>; hauteur: number }) {
  const sprite = useRef<THREE.Sprite>(null)
  const courante = useRef<Icone | null>(null)
  const echelle = useRef(0)
  const t = useRef(Math.random() * 10)
  const mat = useRef<THREE.SpriteMaterial>(null)

  useFrame(({ camera }, dt) => {
    const s = sprite.current
    if (!s || !mat.current) return
    const b = etat.current
    b.reste -= dt
    const voulue = b.reste > 0 ? b.icone : null
    if (voulue && voulue !== courante.current) {
      mat.current.map = texture(voulue)
      mat.current.needsUpdate = true
      courante.current = voulue
      echelle.current = 0
    }
    t.current += dt
    // Apparition « pop », disparition en rétrécissant
    const cible = voulue ? 1 : 0
    echelle.current = THREE.MathUtils.damp(echelle.current, cible, voulue ? 9 : 6, dt)
    const loin = s.getWorldPosition(_P).distanceTo(camera.position) > DIST_MAX
    s.visible = echelle.current > 0.02 && !loin
    if (!voulue && echelle.current < 0.02) courante.current = null
    const k = 0.42 * echelle.current * (1 + 0.06 * Math.sin(t.current * 5))
    s.scale.set(k, k, k)
    s.position.y = hauteur + 0.05 * Math.sin(t.current * 2)
  })

  return (
    <sprite ref={sprite} position={[0, hauteur, 0]} visible={false} renderOrder={10}>
      <spriteMaterial ref={mat} transparent depthWrite={false} />
    </sprite>
  )
}

const _P = new THREE.Vector3()
