import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { CuboidCollider } from '@react-three/rapier'
import { Pieces, type Piece, type V3 } from '../primitives'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { joursAvantHanouka, soirHanouka } from '../hanouka'

// Grande hanoukia publique (18/11/2026), sur le terre-plein face au 770.
// CHOIX DE JEU (demandé par Samuel), consigné dans docs/REGISTRE.md : forme
// à branches droites en diagonale, comme les hanoukiot publiques de Habad,
// 8 lumières alignées à la même hauteur et chamach surélevé au centre.
// Pendant 'Hanouka, le nombre de lumières allumées suit le soir réel à New
// York (src/world/hanouka.ts) ; hors fête, elle est éteinte et E indique
// dans combien de jours a lieu le premier allumage.

const H_LUMIERES = 6.2 // hauteur des godets (m)
const PAS = 0.62 // écart entre deux branches
const ECHELLE = 1

// Ordre d'allumage : on ajoute les lumières de droite à gauche pour celui
// qui regarde la hanoukia ; ici on la regarde depuis le trottoir du 770
// (vers +z), sa droite est donc du côté -x.
function positionsLumieres(x: number, z: number): V3[] {
  const res: V3[] = []
  for (let i = 4; i >= 1; i--) res.push([x - i * PAS * ECHELLE, H_LUMIERES, z])
  for (let i = 1; i <= 4; i++) res.push([x + i * PAS * ECHELLE, H_LUMIERES, z])
  return res
}

function structure(x: number, z: number): Piece[] {
  const pc: Piece[] = []
  // Socle en pierre et pied à gradins
  pc.push({ t: [2.4, 0.5, 1.6], p: [x, 0.25, z], m: 'calcaire', col: true })
  pc.push({ t: [1.5, 0.45, 1.0], p: [x, 0.72, z], m: 'calcaire' })
  pc.push({ geo: new THREE.CylinderGeometry(0.35, 0.55, 0.7, 16), p: [x, 1.3, z], m: 'laiton' })
  // Fût central jusqu'au chamach
  pc.push({ geo: new THREE.CylinderGeometry(0.11, 0.15, H_LUMIERES - 1.6 + 0.6, 12), p: [x, 1.6 + (H_LUMIERES - 1.6 + 0.6) / 2, z], m: 'laiton' })
  // Boules décoratives le long du fût
  for (const y of [2.4, 3.4, 4.4]) pc.push({ geo: new THREE.SphereGeometry(0.2, 14, 10), p: [x, y, z], m: 'laiton' })
  // Branches droites à 45° : de chaque côté, la branche i part du fût à
  // H_LUMIERES - d et monte jusqu'à la lumière (d = écart horizontal)
  for (let i = 1; i <= 4; i++) {
    const d = i * PAS * ECHELLE
    const long = d * Math.SQRT2
    for (const s of [-1, 1]) {
      pc.push({ t: [long, 0.13, 0.13], p: [x + (s * d) / 2, H_LUMIERES - d / 2, z], r: [0, 0, (s * Math.PI) / 4], m: 'laiton' })
      // Montant vertical court sous le godet
      pc.push({ t: [0.11, 0.3, 0.11], p: [x + s * d, H_LUMIERES - 0.12, z], m: 'laiton' })
    }
  }
  // Barre de soutien horizontale sous les godets
  pc.push({ t: [8 * PAS * ECHELLE + 0.3, 0.08, 0.08], p: [x, H_LUMIERES - 0.3, z], m: 'laiton' })
  // Godets des 8 lumières et du chamach
  for (const [lx, ly, lz] of positionsLumieres(x, z)) pc.push({ geo: new THREE.CylinderGeometry(0.17, 0.11, 0.22, 12), p: [lx, ly + 0.1, lz], m: 'laiton' })
  pc.push({ geo: new THREE.CylinderGeometry(0.19, 0.12, 0.24, 12), p: [x, H_LUMIERES + 0.55, z], m: 'laiton' })
  return pc
}

// Flamme électrique (ampoule en forme de flamme) : lumineuse ou éteinte
const geoFlamme = (() => {
  const g = new THREE.SphereGeometry(0.13, 12, 10)
  g.scale(1, 1.9, 1)
  return g
})()
const geoVerre = new THREE.CylinderGeometry(0.16, 0.16, 0.42, 12, 1, true)

// Dégradé radial (halo), dessiné une fois
function textureHalo() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const d = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  d.addColorStop(0, 'rgba(255,255,255,0.9)')
  d.addColorStop(0.25, 'rgba(255,220,150,0.45)')
  d.addColorStop(1, 'rgba(255,200,120,0)')
  g.fillStyle = d
  g.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function Hanoukia({ x, z }: { x: number; z: number }) {
  const pieces = useMemo(() => structure(x, z), [x, z])
  // Soir en cours, revu chaque minute (le soir change à la chkia)
  const [soir, setSoir] = useState(() => soirHanouka())
  useEffect(() => {
    const id = window.setInterval(() => setSoir(soirHanouka()), 60000)
    return () => window.clearInterval(id)
  }, [])
  const mats = useMemo(
    () => ({
      allumee: new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb340', emissiveIntensity: 3.2, roughness: 0.3, toneMapped: false }),
      eteinte: new THREE.MeshStandardMaterial({ color: '#77736a', roughness: 0.35, metalness: 0.2 }),
      // Halo autour des lumières allumées : visible même en plein jour
      halo: new THREE.SpriteMaterial({ map: textureHalo(), color: '#ffc861', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      verre: new THREE.MeshStandardMaterial({ color: '#f4efe2', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }),
    }),
    [],
  )
  const lumieres = useMemo(() => positionsLumieres(x, z), [x, z])

  useInteractif('hanoukia', [x, 1.2, z - 1.0], 2.6, () => t('action.hanoukia'), () => {
    const n = soirHanouka()
    const g = useGame.getState()
    if (n) g.notifier('hanoukia.soir', { n: String(n) })
    else {
      const j = joursAvantHanouka()
      g.notifier(j === 0 ? 'hanoukia.ceSoir' : 'hanoukia.bientot', { n: String(j) })
    }
  })

  return (
    <>
      <Pieces pieces={pieces} />
      <CuboidCollider args={[0.2, 3.2, 0.2]} position={[x, 3.2, z]} />
      {lumieres.map((p, i) => (
        <group key={i} position={[p[0], p[1] + 0.42, p[2]]}>
          <mesh geometry={geoFlamme} material={i < soir ? mats.allumee : mats.eteinte} />
          <mesh geometry={geoVerre} material={mats.verre} />
          {i < soir && <sprite material={mats.halo} scale={[0.95, 0.95, 1]} />}
        </group>
      ))}
      {/* Chamach : allumé tous les soirs de 'Hanouka */}
      <group position={[x, H_LUMIERES + 0.55 + 0.42, z]}>
        <mesh geometry={geoFlamme} material={soir ? mats.allumee : mats.eteinte} />
        <mesh geometry={geoVerre} material={mats.verre} />
        {soir > 0 && <sprite material={mats.halo} scale={[1.05, 1.05, 1]} />}
      </group>
      {/* Un seul éclairage ponctuel (pas un par lumière) pendant la fête */}
      {soir > 0 && <pointLight position={[x, H_LUMIERES + 0.6, z - 0.6]} color="#ffbe5c" intensity={6 + soir * 2} distance={10} decay={2} />}
    </>
  )
}
