import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Ombre ronde et douce sous un PNJ éloigné (ou sous terre), à la place de
// l'ombre portée réelle, coupée au-delà de DIST_OMBRE_REELLE pour alléger la
// carte graphique. Une seule texture, une seule géométrie et un seul matériau
// partagés par tous les PNJ.

export const DIST_OMBRE_REELLE = 8

function texture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const d = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  d.addColorStop(0, 'rgba(0,0,0,0.55)')
  d.addColorStop(0.6, 'rgba(0,0,0,0.25)')
  d.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = d
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

let partage: { geo: THREE.PlaneGeometry; mat: THREE.MeshBasicMaterial } | null = null
function ressources() {
  if (!partage) {
    const geo = new THREE.PlaneGeometry(1, 1)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.MeshBasicMaterial({ map: texture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
    partage = { geo, mat }
  }
  return partage
}

const POS = new THREE.Vector3()

export function OmbreSol({ rayon = 0.45 }: { rayon?: number }) {
  const m = useRef<THREE.Mesh>(null)
  const { geo, mat } = ressources()
  useFrame(({ camera }) => {
    const o = m.current
    if (!o) return
    o.getWorldPosition(POS)
    // Sous terre (Grand Zal), pas d'ombre solaire : l'ombre ronde reste toujours
    o.visible = POS.y < -1 || POS.distanceTo(camera.position) >= DIST_OMBRE_REELLE
  })
  return <mesh ref={m} geometry={geo} material={mat} position={[0, 0.02, 0]} scale={[rayon * 2, 1, rayon * 2]} renderOrder={-1} />
}
