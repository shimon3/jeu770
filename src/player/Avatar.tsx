import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Hassid générique, low-poly, SANS visage réaliste : tête lisse, barbe en
// volume simple. Sirtouk (long manteau noir), chapeau noir, tsitsit visibles.
// Origine du modèle : entre les pieds. Avant du modèle : +z.

export type EtatAnim = 'repos' | 'marche' | 'course' | 'escalier' | 'assis' | 'saut' | 'balancement'
export type Anim = { etat: EtatAnim; vitesse: number }

type Props = {
  anim: MutableRefObject<Anim>
  peau?: string
  barbe?: string
  visible?: boolean
}

const NOIR = new THREE.MeshStandardMaterial({ color: '#0e0e10', roughness: 0.55, metalness: 0.05 })
const NOIR_MAT = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 })
const BLANC = new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.8 })

// Profil du sirtouk (rayon, hauteur) pour LatheGeometry
const PROFIL_MANTEAU: [number, number][] = [
  [0.0, 0.36],
  [0.27, 0.36],
  [0.245, 0.6],
  [0.205, 0.95],
  [0.215, 1.2],
  [0.21, 1.34],
  [0.17, 1.44],
  [0.075, 1.48],
  [0.0, 1.48],
]

export function Avatar({ anim, peau = '#d9ad8c', barbe = '#2a1d15', visible = true }: Props) {
  const racine = useRef<THREE.Group>(null)
  const buste = useRef<THREE.Group>(null)
  const hanches = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)]
  const genoux = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)]
  const epaules = [useRef<THREE.Group>(null), useRef<THREE.Group>(null)]
  const phase = useRef(0)
  const t = useRef(0)

  const mats = useMemo(
    () => ({
      peau: new THREE.MeshStandardMaterial({ color: peau, roughness: 0.8 }),
      barbe: new THREE.MeshStandardMaterial({ color: barbe, roughness: 1 }),
    }),
    [peau, barbe],
  )
  const manteau = useMemo(() => new THREE.LatheGeometry(PROFIL_MANTEAU.map(([r, y]) => new THREE.Vector2(r, y)), 14), [])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.05)
    const { etat, vitesse } = anim.current
    t.current += dt
    const cadence = etat === 'course' ? 9 : etat === 'escalier' ? 6 : 6.5
    if (etat === 'marche' || etat === 'course' || etat === 'escalier') phase.current += dt * cadence * Math.max(0.6, vitesse / 2.2)
    const s = Math.sin(phase.current)
    const amp = etat === 'course' ? 0.85 : etat === 'marche' ? 0.5 : etat === 'escalier' ? 0.45 : 0

    let hanche = [s * amp, -s * amp]
    let genou = [Math.max(0, -s) * amp * 1.1, Math.max(0, s) * amp * 1.1]
    let bras = [-s * amp * 0.8, s * amp * 0.8]
    let basY = Math.abs(Math.cos(phase.current)) * (etat === 'course' ? 0.05 : 0.025) * (amp > 0 ? 1 : 0)
    let penche = etat === 'course' ? 0.14 : etat === 'escalier' ? 0.1 : 0

    if (etat === 'escalier') {
      // Genou levé plus haut pour franchir les marches
      // (rotation négative = jambe vers l'avant)
      const a = Math.max(0, s)
      const b = Math.max(0, -s)
      hanche = [-a * 0.95 + b * 0.25, -b * 0.95 + a * 0.25]
      genou = [0.15 + a * 1.2, 0.15 + b * 1.2]
    }
    if (etat === 'repos') {
      bras = [0.05, 0.05]
      basY = Math.sin(t.current * 1.6) * 0.004
    }
    if (etat === 'balancement') {
      // Balancement d'étude ou de prière
      penche = 0.12 + Math.sin(t.current * 2.4) * 0.12
      bras = [0.15, 0.15]
    }
    if (etat === 'saut') {
      hanche = [-0.5, 0.2]
      genou = [0.9, 0.4]
      bras = [-0.6, -0.6]
    }
    if (etat === 'assis') {
      hanche = [-1.5, -1.5]
      genou = [1.5, 1.5]
      bras = [-0.5, -0.5]
      basY = -0.38
      penche = 0.05
    }

    const k = 1 - Math.exp(-dt * 14)
    for (let i = 0; i < 2; i++) {
      const h = hanches[i].current
      const g = genoux[i].current
      const e = epaules[i].current
      if (h) h.rotation.x += (hanche[i] - h.rotation.x) * k
      if (g) g.rotation.x += (genou[i] - g.rotation.x) * k
      if (e) e.rotation.x += (bras[i] - e.rotation.x) * k
    }
    if (racine.current) racine.current.position.y += (basY - racine.current.position.y) * k
    if (buste.current) buste.current.rotation.x += (penche - buste.current.rotation.x) * k
  })

  return (
    <group visible={visible}>
      <group ref={racine}>
        {/* Jambes : cuisse + tibia articulés */}
        {[-1, 1].map((cote, i) => (
          <group key={cote} ref={hanches[i]} position={[cote * 0.09, 0.86, 0]}>
            <mesh position={[0, -0.21, 0]} material={NOIR_MAT} castShadow>
              <cylinderGeometry args={[0.07, 0.065, 0.42, 8]} />
            </mesh>
            <group ref={genoux[i]} position={[0, -0.42, 0]}>
              <mesh position={[0, -0.2, 0]} material={NOIR_MAT} castShadow>
                <cylinderGeometry args={[0.06, 0.055, 0.4, 8]} />
              </mesh>
              <mesh position={[0, -0.41, 0.05]} material={NOIR} castShadow>
                <boxGeometry args={[0.1, 0.07, 0.25]} />
              </mesh>
            </group>
          </group>
        ))}

        <group ref={buste} position={[0, 0.9, 0]}>
          <group position={[0, -0.9, 0]}>
            {/* Sirtouk */}
            <mesh geometry={manteau} material={NOIR} castShadow />
            {/* Col de chemise blanche */}
            <mesh position={[0, 1.47, 0.02]} material={BLANC}>
              <cylinderGeometry args={[0.07, 0.08, 0.05, 10]} />
            </mesh>
            {/* Tsitsit : quatre groupes de fils blancs aux hanches */}
            {[
              [-0.235, 0.06],
              [-0.23, -0.07],
              [0.235, 0.06],
              [0.23, -0.07],
            ].map(([x, z], i) => (
              <group key={i} position={[x, 0.93, z]}>
                {[-0.012, 0, 0.012].map((d, j) => (
                  <mesh key={j} position={[0, -0.22, d]} material={BLANC}>
                    <cylinderGeometry args={[0.005, 0.005, 0.44, 4]} />
                  </mesh>
                ))}
              </group>
            ))}
            {/* Bras */}
            {[-1, 1].map((cote, i) => (
              <group key={cote} ref={epaules[i]} position={[cote * 0.235, 1.38, 0]}>
                <mesh position={[0, -0.28, 0]} rotation={[0, 0, cote * 0.06]} material={NOIR} castShadow>
                  <cylinderGeometry args={[0.06, 0.07, 0.56, 8]} />
                </mesh>
                <mesh position={[cote * 0.018, -0.6, 0]} material={mats.peau}>
                  <sphereGeometry args={[0.05, 8, 6]} />
                </mesh>
              </group>
            ))}
            {/* Tête lisse, sans traits du visage */}
            <mesh position={[0, 1.6, 0]} material={mats.peau} castShadow>
              <sphereGeometry args={[0.105, 14, 10]} />
            </mesh>
            {/* Barbe : volume simple */}
            <mesh position={[0, 1.52, 0.055]} scale={[0.095, 0.12, 0.07]} material={mats.barbe} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            {/* Chapeau noir : bord + calotte */}
            <mesh position={[0, 1.685, 0]} material={NOIR} castShadow>
              <cylinderGeometry args={[0.175, 0.175, 0.015, 18]} />
            </mesh>
            <mesh position={[0, 1.765, 0]} material={NOIR} castShadow>
              <cylinderGeometry args={[0.1, 0.112, 0.15, 14]} />
            </mesh>
            <mesh position={[0, 1.705, 0]} material={NOIR_MAT}>
              <cylinderGeometry args={[0.114, 0.114, 0.03, 14]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
