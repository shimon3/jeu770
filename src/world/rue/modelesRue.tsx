import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePrechauffe } from '../prechauffage'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import { GABARIT, geometriesParMateriau, type CouleurVoiture, type ModeleVoiture } from './voitures'
import { ressources as ombreSol } from '../../npc/OmbreSol'

// Modèles Meshy de la rue (12/11/2026, demande de Samuel) : quatre voitures
// et deux arbres, allégés dans Blender (Draco, textures 1K, ~0,2 Mo chacun).
// Repère des voitures : avant vers +x, centrées, roues au sol (y = 0), comme
// les voitures dessinées en code (voitures.ts), qui restent pour les autres
// véhicules (pompiers, bus, Mitzvah Tank) et pendant le chargement.

const DRACO = '/draco/'
const VOITURES_GLB: Partial<Record<ModeleVoiture, string>> = {
  berline: '/models/rue/berline.glb',
  taxi: '/models/rue/taxi.glb',
  monospace: '/models/rue/monospace.glb',
  police: '/models/rue/police.glb',
}
export const ARBRES_GLB = { platane: '/models/rue/arbre_platane.glb', fevier: '/models/rue/arbre_fevier.glb' } as const
// Hauteur des modèles d'arbres exportés (m)
const HAUTEUR_ARBRE = { platane: 8.5, fevier: 7.0 } as const

export function aUnModele(modele: ModeleVoiture) {
  return !!VOITURES_GLB[modele]
}

function CorpsProcedural({ modele, couleur, ombre, interieur = false }: { modele: ModeleVoiture; couleur: CouleurVoiture; ombre: boolean; interieur?: boolean }) {
  const mats = useMateriaux()
  const geos = useMemo(() => geometriesParMateriau(modele, couleur), [modele, couleur])
  return (
    <>
      {geos.map(([m, g]) => (
        <mesh key={m} geometry={g} material={interieur && m === 'vitre' ? mats.vitreVehicule : mats[m]} castShadow={ombre} receiveShadow />
      ))}
    </>
  )
}

// Peinture vernie (18/11/2026) : les modèles Meshy n'ont qu'un matériau mat ;
// on le remplace une fois par modèle par un matériau à vernis transparent
// qui reflète le ciel (carte d'environnement). Pneus et vitres partagent ce
// matériau : rugosité moyenne pour rester crédible sur les deux.
function vernir(scene: THREE.Object3D) {
  if (scene.userData.verni) return
  scene.userData.verni = true
  scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const ancien = m.material as THREE.MeshStandardMaterial
    m.material = new THREE.MeshPhysicalMaterial({
      map: ancien.map,
      roughness: 0.38,
      metalness: 0.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.2,
    })
    ancien.dispose()
  })
}

function CorpsGlb({ url, ombre }: { url: string; ombre: boolean }) {
  const { scene } = useGLTF(url, DRACO)
  vernir(scene)
  // Clone léger : géométrie et matériaux partagés entre toutes les copies
  const objet = useMemo(() => {
    const o = scene.clone()
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) {
        m.castShadow = ombre
        m.receiveShadow = true
      }
    })
    return o
  }, [scene, ombre])
  const visible = usePrechauffe(objet)
  return <primitive object={objet} visible={visible} />
}

// Corps d'une voiture : modèle Meshy s'il existe, sinon voiture dessinée en code
// `interieur` : vue du conducteur (V) ; le modèle Meshy a des vitres opaques,
// on montre alors la voiture dessinée en code, vitres transparentes
export function CorpsVoiture({ modele, couleur, ombre = true, interieur = false }: { modele: ModeleVoiture; couleur: CouleurVoiture; ombre?: boolean; interieur?: boolean }) {
  if (interieur) return <CorpsProcedural modele={modele} couleur={couleur} ombre={ombre} interieur />
  const url = VOITURES_GLB[modele]
  const repli = <CorpsProcedural modele={modele} couleur={couleur} ombre={ombre} />
  return (
    <>
      <OmbreVehicule modele={modele} />
      {url ? (
        <Suspense fallback={repli}>
          <CorpsGlb url={url} ombre={ombre} />
        </Suspense>
      ) : (
        repli
      )}
    </>
  )
}

// Ombre de contact douce sous le véhicule (19/11/2026) : sans elle, les
// véhicules qui roulent (sans ombre portée, par économie) semblent flotter
function OmbreVehicule({ modele }: { modele: ModeleVoiture }) {
  const { geo, mat } = ombreSol()
  const [l, , w] = GABARIT[modele]
  return <mesh geometry={geo} material={mat} position={[0, 0.02, 0]} scale={[l * 1.12, 1, w * 1.35]} renderOrder={-1} />
}

// Arbres en instances : un seul appel de rendu par espèce
type Arbre = { x: number; z: number; h: number; y?: number; rot?: number }

function InstancesArbre({ espece, arbres }: { espece: keyof typeof ARBRES_GLB; arbres: Arbre[] }) {
  const { scene } = useGLTF(ARBRES_GLB[espece], DRACO)
  const mesh = useMemo(() => {
    let m: THREE.Mesh | undefined
    scene.traverse((o) => {
      if (!m && (o as THREE.Mesh).isMesh) m = o as THREE.Mesh
    })
    return m!
  }, [scene])
  const ref = useRef<THREE.InstancedMesh>(null)
  const [im, setIm] = useState<THREE.InstancedMesh | null>(null)
  const visible = usePrechauffe(im)
  useLayoutEffect(() => {
    const im = ref.current
    if (!im) return
    const o = new THREE.Object3D()
    arbres.forEach((a, i) => {
      const s = a.h / HAUTEUR_ARBRE[espece]
      o.position.set(a.x, a.y ?? 0, a.z)
      o.rotation.set(0, a.rot ?? (i * 2.399) % (Math.PI * 2), 0)
      o.scale.setScalar(s)
      o.updateMatrix()
      im.setMatrixAt(i, o.matrix)
    })
    im.instanceMatrix.needsUpdate = true
    im.computeBoundingSphere()
  }, [arbres, espece])
  return (
    <instancedMesh
      ref={(o: THREE.InstancedMesh | null) => {
        ref.current = o
        if (o !== im) setIm(o)
      }}
      args={[mesh.geometry, mesh.material as THREE.Material, arbres.length]}
      visible={visible}
      castShadow
      receiveShadow
    />
  )
}

export function ArbresRue({ platanes, feviers }: { platanes: Arbre[]; feviers: Arbre[] }) {
  return (
    <Suspense fallback={null}>
      <InstancesArbre espece="platane" arbres={platanes} />
      <InstancesArbre espece="fevier" arbres={feviers} />
    </Suspense>
  )
}
