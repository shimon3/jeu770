import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { FournisseurMateriaux } from './materiaux'
import { Facade } from './facade/Facade'
import { Hall } from './hall/Hall'
import { Rue } from './rue/Rue'
import { Voisins } from './rue/Voisins'
import { Joueur } from '../player/Joueur'
import { PnjImmobile } from '../npc/PnjImmobile'
import { useGame } from '../state/store'

function Soleil() {
  // Soleil d'après-midi venant du sud-ouest (la façade regarde vers le sud)
  return (
    <directionalLight
      position={[-18, 30, 26]}
      intensity={2.6}
      color="#fff3e0"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-32}
      shadow-camera-right={32}
      shadow-camera-top={32}
      shadow-camera-bottom={-32}
      shadow-camera-near={1}
      shadow-camera-far={90}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
    />
  )
}

export function Monde({ cle }: { cle: number }) {
  const debug = useGame((s) => s.debugPhysique)
  return (
    <>
      <Environment files="/assets/hdri/kloofendal_1k.hdr" background backgroundBlurriness={0.02} environmentIntensity={1} />
      <Soleil />
      <hemisphereLight args={['#dfe8f5', '#5a4a3a', 0.25]} />
      <fog attach="fog" args={['#cfd8e2', 60, 160]} />
      <Suspense fallback={null}>
        <FournisseurMateriaux>
          <Physics gravity={[0, -9.81, 0]} debug={debug} timeStep={1 / 60}>
            <Rue />
            <Voisins />
            <Facade />
            <Hall />
            <PnjImmobile id="pnj-trottoir" position={[-3.4, 0, 8.6]} rotationY={1.3} />
            <Joueur key={cle} />
          </Physics>
        </FournisseurMateriaux>
      </Suspense>
    </>
  )
}
