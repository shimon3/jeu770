import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Pieces, type Piece } from '../primitives'
import { useGame } from '../../state/store'
import { useT } from '../../i18n'

// Poteau indicateur sur le trottoir, entre le 770 et 784-788 : une flèche
// vers la porte du 770 (à gauche), une vers l'escalier du grand Zal (à
// droite). Élément de jeu, pas une reconstitution : il n'existe pas dans la
// réalité. Le texte suit la langue choisie ; la flèche est dessinée à part
// pour ne pas dépendre du sens d'écriture.

const X = 8.6
const Z = 8.0

function texturePanneau(texte: string, versDroite: boolean, rtl: boolean) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 192
  const g = c.getContext('2d')!
  g.fillStyle = '#1f4d3a'
  g.fillRect(0, 0, 1024, 192)
  g.strokeStyle = '#f2e9d0'
  g.lineWidth = 8
  g.strokeRect(10, 10, 1004, 172)
  // Flèche
  g.fillStyle = '#f2e9d0'
  g.beginPath()
  if (versDroite) {
    g.moveTo(990, 96)
    g.lineTo(900, 36)
    g.lineTo(900, 156)
  } else {
    g.moveTo(34, 96)
    g.lineTo(124, 36)
    g.lineTo(124, 156)
  }
  g.closePath()
  g.fill()
  // Texte centré dans la partie libre
  g.font = `bold 72px ${rtl ? 'Heebo' : 'Inter'}, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.direction = rtl ? 'rtl' : 'ltr'
  g.fillText(texte, versDroite ? 450 : 574, 100, 740)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export function PanneauxDirection() {
  const t = useT()
  const langue = useGame((s) => s.langue)
  const pieces = useMemo<Piece[]>(
    () => [
      { t: [0.1, 2.9, 0.1], p: [X, 1.45, Z], m: 'vertLampadaire', col: true },
      { t: [1.9, 0.38, 0.06], p: [X - 0.9, 2.55, Z], m: 'vertLampadaire' },
      { t: [1.9, 0.38, 0.06], p: [X + 0.9, 2.05, Z], m: 'vertLampadaire' },
    ],
    [],
  )
  const mats = useMemo(() => {
    const rtl = langue === 'he'
    const mat = (cle: string, droite: boolean) => new THREE.MeshStandardMaterial({ map: texturePanneau(t(cle), droite, rtl), roughness: 0.6 })
    // Vue de dos, la gauche et la droite s'inversent : même texte, flèche opposée
    return {
      maisonFace: mat('panneau.versMaison', false),
      maisonDos: mat('panneau.versMaison', true),
      zalFace: mat('panneau.versZal', true),
      zalDos: mat('panneau.versZal', false),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langue])
  useEffect(
    () => () => {
      for (const m of Object.values(mats)) {
        m.map?.dispose()
        m.dispose()
      }
    },
    [mats],
  )
  return (
    <>
      <Pieces pieces={pieces} />
      {/* Faces lisibles depuis le trottoir et depuis la cour */}
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh position={[X - 0.9, 2.55, Z + s * 0.035]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={s > 0 ? mats.maisonFace : mats.maisonDos}>
            <planeGeometry args={[1.86, 0.35]} />
          </mesh>
          <mesh position={[X + 0.9, 2.05, Z + s * 0.035]} rotation={[0, s > 0 ? 0 : Math.PI, 0]} material={s > 0 ? mats.zalFace : mats.zalDos}>
            <planeGeometry args={[1.86, 0.35]} />
          </mesh>
        </group>
      ))}
    </>
  )
}
