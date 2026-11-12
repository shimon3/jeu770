import { lazy, Suspense, useEffect, useRef } from 'react'
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
import { PnjZal } from '../npc/PnjZal'
import { pnjLegersActifs } from '../npc/PnjEnfant'
import { useQualite } from '../config/qualite'
import { useChargement } from '../state/chargement'
import { compilationParallele, prechauffer } from './prechauffage'
import { useThree } from '@react-three/fiber'

// Rendu une fois les matériaux de la rue et le ciel chargés (Suspense levé)
function SignalMondePret() {
  useEffect(() => useChargement.setState({ monde: true }), [])
  return null
}

// Préchauffage de toute la scène une fois la rue, le Zal et la maison montés
// (filet de sécurité : 8 s au plus, le jeu démarre alors quand même)
function PrechauffeScene() {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!compilationParallele(gl)) {
      useChargement.setState({ prechauffe: true })
      return
    }
    let vivant = true
    let lance = false
    const lancer = () => {
      if (lance) return
      lance = true
      prechauffer(gl, scene, camera, scene, () => vivant)
        .catch(() => undefined)
        .then(() => vivant && useChargement.setState({ prechauffe: true }))
    }
    const verifier = (c: ReturnType<typeof useChargement.getState>) => {
      if (c.monde && c.zal && c.maison) lancer()
    }
    verifier(useChargement.getState())
    const desabo = useChargement.subscribe(verifier)
    const secours = window.setTimeout(() => useChargement.setState({ prechauffe: true }), 8000)
    return () => {
      vivant = false
      desabo()
      window.clearTimeout(secours)
    }
  }, [gl, scene, camera])
  return null
}
import { GroupeDiscussion } from '../npc/GroupeDiscussion'
import { MissionTank } from '../missions/MissionTank'
import * as THREE from 'three'

const PNJ_LEGERS = pnjLegersActifs()
// Allègement : grand Zal et maison du Rabbi dans des fichiers à part, chargés
// juste après le menu (le départ se fait dans la rue)
const GrandZal = lazy(() => import('./grand-zal/GrandZal').then((m) => ({ default: m.GrandZal })))
const MaisonRabbi = lazy(() => import('./maison/MaisonRabbi').then((m) => ({ default: m.MaisonRabbi })))

// Trottoir d'Eastern Parkway (z 6,4 à 12) : enfants, fille et femme.
// Bordure z ≥ 10,4 réservée aux abris de bus et au kiosque (branche voitures).
// Trajets filtrés par cheminAutorise (dans PnjZal). Ils ne parlent pas.
function FamillesRue() {
  return (
    <>
      <PnjZal id="enfant-rue-1" modele="enfant" parle={false} position={[-12, 0, 9.8]} rotationY={Math.PI / 2} chemin={[[-12, 9.8], [-1, 9.8]]} />
      <PnjZal id="femme-rue-1" modele="femme" poussette parle={false} position={[-30, 0, 9.2]} rotationY={Math.PI / 2} chemin={[[-30, 9.2], [-19, 9.2]]} />
      <PnjZal id="fille-rue-1" modele="fille" parle={false} position={[-30, 0, 9.6]} rotationY={Math.PI / 2} chemin={[[-30, 9.6], [-19, 9.6]]} />
      {/* Rue animée : passants (allées z 8 et 10,4) et groupes qui discutent
          puis repartent (jamais plus de 3 min 20 arrêtés) */}
      <PnjZal id="adulte-rue-1" parle={false} position={[-36, 0, 10.0]} rotationY={Math.PI / 2} chemin={[[-36, 10.0], [-20, 10.0]]} />
      <PnjZal id="adulte-rue-2" parle={false} position={[36, 0, 10.4]} rotationY={-Math.PI / 2} chemin={[[36, 10.4], [20, 10.4]]} peau="#d2a07f" barbe="#2b1d14" />
      <GroupeDiscussion
        id="groupe-hommes"
        y={0}
        lieux={LIEUX_HOMMES}
        membres={[
          { id: 'adulte-rue-3', peau: '#c58f6c', barbe: '#6b6b6b' },
          { id: 'adulte-rue-4', barbe: '#3a2a1e' },
        ]}
      />
      <GroupeDiscussion
        id="groupe-mere-filles"
        y={0}
        lieux={LIEUX_MERE_FILLES}
        membres={[
          { id: 'femme-rue-3', modele: 'femme' },
          { id: 'fille-rue-4', modele: 'fille' },
          { id: 'fille-rue-2', modele: 'fille' },
        ]}
      />
      <GroupeDiscussion
        id="groupe-garcons"
        y={0}
        lieux={LIEUX_GARCONS}
        membres={[
          { id: 'enfant-rue-2', modele: 'enfant' },
          { id: 'enfant-rue-4', modele: 'enfant' },
          { id: 'enfant-rue-5', modele: 'enfant' },
        ]}
      />
      <PnjZal id="femme-rue-2" modele="femme" parle={false} position={[36, 0, 8.2]} rotationY={-Math.PI / 2} chemin={[[36, 8.2], [22, 8.2]]} />
      <PnjZal id="fille-rue-3" modele="fille" parle={false} position={[36, 0, 8.9]} rotationY={-Math.PI / 2} chemin={[[36, 8.9], [22, 8.9]]} />
      {/* Vieux hassid : marche lente */}
      <PnjZal id="vieux-rue-1" modele="vieux" parle={false} vitesse={0.7} position={[24, 0, 9.8]} rotationY={Math.PI / 2} chemin={[[24, 9.8], [34, 9.8]]} />
      <PnjZal id="enfant-rue-3" modele="enfant" parle={false} position={[-36, 0, 8.0]} rotationY={Math.PI / 2} chemin={[[-36, 8.0], [-24, 8.0]]} />
    </>
  )
}

// Lieux de discussion sur le trottoir (z 8,2 à 9,4) : loin des bancs, des
// arbres, des lampadaires et des panneaux
const LIEUX_HOMMES: [number, number][] = [[-8.0, 8.6], [-23.5, 9.0], [-33.0, 8.8], [-12.0, 9.2]]
const LIEUX_MERE_FILLES: [number, number][] = [[14.8, 9.2], [24.0, 9.0], [32.0, 9.4], [19.0, 8.8]]
const LIEUX_GARCONS: [number, number][] = [[-17.6, 8.4], [-29.0, 8.6], [-11.0, 8.2], [-2.0, 9.0]]

// Le soleil vise le centre du complexe (770 + grand Zal) et son ombre couvre
// tout le grand Zal souterrain, sinon le sol du Zal serait éclairé à travers
// son plafond.
const CIBLE_SOLEIL = new THREE.Object3D()
CIBLE_SOLEIL.position.set(10, 0, -8)

function Soleil() {
  // Soleil d'après-midi venant du sud-ouest (la façade regarde vers le sud)
  // Qualité automatique : carte d'ombres en 1024 quand l'appareil peine
  const basses = useQualite((s) => s.ombresBasses)
  const taille = TACTILE || basses ? 1024 : 2048
  const lumiere = useRef<THREE.DirectionalLight>(null)
  useEffect(() => {
    const l = lumiere.current
    if (!l) return
    l.shadow.mapSize.set(taille, taille)
    l.shadow.map?.dispose()
    ;(l.shadow as unknown as { map: THREE.WebGLRenderTarget | null }).map = null
  }, [taille])
  return (
    <directionalLight
      ref={lumiere}
      position={[10 - 18, 30, -8 + 26]}
      target={CIBLE_SOLEIL}
      intensity={2.6}
      color="#fff3e0"
      castShadow
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
      <Environment files="/assets/hdri/kloofendal_512.hdr" background backgroundBlurriness={0.02} environmentIntensity={1} />
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
            <Suspense fallback={null}>
              <MaisonRabbi />
            </Suspense>
            <Complexe784 />
            <PanneauxDirection />
            <Suspense fallback={null}>
              <GrandZal />
            </Suspense>
            <PnjZal id="pnj-entree-zal" position={[18.4, 0, 6.1]} rotationY={1.2} peau="#cf9d7c" barbe="#5a4030" />
            <PnjImmobile id="pnj-trottoir" position={[-3.4, 0, 8.6]} rotationY={1.3} />
            {PNJ_LEGERS && <FamillesRue />}
            <MissionTank />
            <Joueur key={cle} />
            <SignalMondePret />
            <PrechauffeScene />
          </Physics>
        </FournisseurMateriaux>
      </Suspense>
    </>
  )
}
