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
import { estTactile } from '../player/entrees'

// Téléphone et tablette : carte d'ombres plus légère
const TACTILE = estTactile()
import { Complexe784 } from './complexe/Complexe784'
import { PanneauxDirection } from './rue/PanneauxDirection'
import { GrandZal } from './grand-zal/GrandZal'
import { MaisonRabbi } from './maison/MaisonRabbi'
import { PnjZal } from '../npc/PnjZal'
import { pnjLegersActifs } from '../npc/PnjEnfant'
import * as THREE from 'three'

const PNJ_LEGERS = pnjLegersActifs()

// Trottoir d'Eastern Parkway (z 6,4 à 12) : enfants, fille et femme.
// Trajets filtrés par cheminAutorise (dans PnjZal). Ils ne parlent pas.
function FamillesRue() {
  return (
    <>
      <PnjZal id="enfant-rue-1" modele="enfant" parle={false} position={[-12, 0, 9.8]} rotationY={Math.PI / 2} chemin={[[-12, 9.8], [-1, 9.8]]} />
      <PnjZal id="enfant-rue-2" modele="enfant" parle={false} position={[2.2, 0, 8.4]} rotationY={0.3} />
      <PnjZal id="femme-rue-1" modele="femme" parle={false} position={[-30, 0, 9.2]} rotationY={Math.PI / 2} chemin={[[-30, 9.2], [-19, 9.2]]} />
      <PnjZal id="fille-rue-1" modele="fille" parle={false} position={[-30, 0, 10.0]} rotationY={Math.PI / 2} chemin={[[-30, 10.0], [-19, 10.0]]} />
      <PnjZal id="fille-rue-2" modele="fille" parle={false} position={[3.0, 0, 7.6]} rotationY={-0.4} />
      {/* Rue animée : passants (allées z 8 et 10,4) et petits groupes arrêtés */}
      <PnjZal id="adulte-rue-1" parle={false} position={[-36, 0, 10.4]} rotationY={Math.PI / 2} chemin={[[-36, 10.4], [-20, 10.4]]} />
      <PnjZal id="adulte-rue-2" parle={false} position={[36, 0, 10.4]} rotationY={-Math.PI / 2} chemin={[[36, 10.4], [20, 10.4]]} peau="#d2a07f" barbe="#2b1d14" />
      <PnjZal id="adulte-rue-3" parle={false} position={[-8.5, 0, 7.4]} rotationY={0.84} peau="#c58f6c" barbe="#6b6b6b" />
      <PnjZal id="adulte-rue-4" parle={false} position={[-7.6, 0, 8.2]} rotationY={0.84 + Math.PI} barbe="#3a2a1e" />
      <PnjZal id="femme-rue-2" modele="femme" parle={false} position={[36, 0, 8.2]} rotationY={-Math.PI / 2} chemin={[[36, 8.2], [22, 8.2]]} />
      <PnjZal id="fille-rue-3" modele="fille" parle={false} position={[36, 0, 8.9]} rotationY={-Math.PI / 2} chemin={[[36, 8.9], [22, 8.9]]} />
      <PnjZal id="enfant-rue-3" modele="enfant" parle={false} position={[-36, 0, 8.0]} rotationY={Math.PI / 2} chemin={[[-36, 8.0], [-24, 8.0]]} />
      <PnjZal id="femme-rue-3" modele="femme" parle={false} position={[14.5, 0, 9.0]} rotationY={0.3} />
      <PnjZal id="fille-rue-4" modele="fille" parle={false} position={[15.2, 0, 9.4]} rotationY={-0.2} />
      <PnjZal id="enfant-rue-4" modele="enfant" parle={false} position={[-18, 0, 8.0]} rotationY={0.93} />
      <PnjZal id="enfant-rue-5" modele="enfant" parle={false} position={[-17.2, 0, 8.6]} rotationY={0.93 + Math.PI} />
    </>
  )
}

// Le soleil vise le centre du complexe (770 + grand Zal) et son ombre couvre
// tout le grand Zal souterrain, sinon le sol du Zal serait éclairé à travers
// son plafond.
const CIBLE_SOLEIL = new THREE.Object3D()
CIBLE_SOLEIL.position.set(10, 0, -8)

function Soleil() {
  // Soleil d'après-midi venant du sud-ouest (la façade regarde vers le sud)
  return (
    <directionalLight
      position={[10 - 18, 30, -8 + 26]}
      target={CIBLE_SOLEIL}
      intensity={2.6}
      color="#fff3e0"
      castShadow
      shadow-mapSize={TACTILE ? [1024, 1024] : [2048, 2048]}
      shadow-camera-left={-46}
      shadow-camera-right={46}
      shadow-camera-top={46}
      shadow-camera-bottom={-46}
      shadow-camera-near={1}
      shadow-camera-far={120}
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
      <primitive object={CIBLE_SOLEIL} />
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
            <MaisonRabbi />
            <Complexe784 />
            <PanneauxDirection />
            <GrandZal />
            <PnjZal id="pnj-entree-zal" position={[18.4, 0, 6.1]} rotationY={1.2} peau="#cf9d7c" barbe="#5a4030" />
            <PnjImmobile id="pnj-trottoir" position={[-3.4, 0, 8.6]} rotationY={1.3} />
            {PNJ_LEGERS && <FamillesRue />}
            <Joueur key={cle} />
          </Physics>
        </FournisseurMateriaux>
      </Suspense>
    </>
  )
}
