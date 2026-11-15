import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGame } from '../../state/store'
import { useInteractif } from '../interaction'
import { PnjZal } from '../../npc/PnjZal'
import { t } from '../../i18n'
import { DESTINATIONS, livrer } from '../../missions/livraisons'

// Client qui attend sa pizza : affiché seulement pendant une livraison,
// avec une colonne lumineuse dorée visible de loin
export function Livraison() {
  const l = useGame((s) => s.livraison)
  if (!l) return null
  // key : nouveau client à chaque livraison
  return <Client key={`${l.dest}-${l.debut}`} dest={l.dest} />
}

function Client({ dest }: { dest: number }) {
  const d = DESTINATIONS[dest]
  const colonne = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#f2c14e', transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
    [],
  )
  useFrame((st) => {
    if (colonne.current) colonne.current.rotation.y = st.clock.elapsedTime * 0.8
    mat.opacity = 0.2 + Math.sin(st.clock.elapsedTime * 3) * 0.08
  })
  useInteractif('livraison-client', [d.x, 1.1, d.z + 0.6], 2.2, () => t('livraison.donner'), () => livrer())
  return (
    <>
      <mesh ref={colonne} position={[d.x, 4, d.z]} material={mat}>
        <cylinderGeometry args={[0.7, 0.7, 8, 16, 1, true]} />
      </mesh>
      <PnjZal id="pnj-client-livraison" position={[d.x, 0, d.z]} rotationY={0} parle={false} peau="#d9ae8c" barbe="#5a4030" />
    </>
  )
}
