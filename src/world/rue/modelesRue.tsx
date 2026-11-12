import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import { geometriesParMateriau, type CouleurVoiture, type ModeleVoiture } from './voitures'

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

function CorpsProcedural({ modele, couleur, ombre }: { modele: ModeleVoiture; couleur: CouleurVoiture; ombre: boolean }) {
  const mats = useMateriaux()
  const geos = useMemo(() => geometriesParMateriau(modele, couleur), [modele, couleur])
  return (
    <>
      {geos.map(([m, g]) => (
        <mesh key={m} geometry={g} material={mats[m]} castShadow={ombre} receiveShadow />
      ))}
    </>
  )
}

function CorpsGlb({ url, ombre }: { url: string; ombre: boolean }) {
  const { scene } = useGLTF(url, DRACO)
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
  return <primitive object={objet} />
}

// Corps d'une voiture : modèle Meshy s'il existe, sinon voiture dessinée en code
export function CorpsVoiture({ modele, couleur, ombre = true }: { modele: ModeleVoiture; couleur: CouleurVoiture; ombre?: boolean }) {
  const url = VOITURES_GLB[modele]
  const repli = <CorpsProcedural modele={modele} couleur={couleur} ombre={ombre} />
  if (!url) return repli
  return (
    <Suspense fallback={repli}>
      <CorpsGlb url={url} ombre={ombre} />
    </Suspense>
  )
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
  return <instancedMesh ref={ref} args={[mesh.geometry, mesh.material as THREE.Material, arbres.length]} castShadow receiveShadow />
}

export function ArbresRue({ platanes, feviers }: { platanes: Arbre[]; feviers: Arbre[] }) {
  return (
    <Suspense fallback={null}>
      <InstancesArbre espece="platane" arbres={platanes} />
      <InstancesArbre espece="fevier" arbres={feviers} />
    </Suspense>
  )
}
