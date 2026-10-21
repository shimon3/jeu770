import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

// Hassid immobile, modèle 3D Sculptly fourni par Samuel (octobre 2026).
// Le modèle d'origine portait le visage photographique d'une personne réelle :
// il a été ANONYMISÉ avant publication (tools/anonymiser-glb.py) — visage en
// aplat de peau sans traits, relief lissé, barbe et chapeau en aplat sombre,
// fragments de photo inutilisés effacés. Le fichier d'origine n'est pas
// versionné. Règle du projet : PNJ anonymes, sans visage réaliste.

const URL = '/assets/models/hassid-sculptly.glb'
const HAUTEUR = 1.75 // m, taille du personnage dans le jeu
const H_MODELE = 0.988 // hauteur du modèle source (unités du fichier)
const PIEDS = -0.495 // y des pieds dans le modèle source

type Props = { position: [number, number, number]; rotationY: number }

export function PnjModele({ position, rotationY }: Props) {
  const { scene } = useGLTF(URL)
  const objet = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return c
  }, [scene])
  const e = HAUTEUR / H_MODELE
  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[position[0], position[1] + 0.85, position[2]]}>
        <CapsuleCollider args={[0.55, 0.3]} />
      </RigidBody>
      <group position={position} rotation={[0, rotationY, 0]}>
        <primitive object={objet} scale={e} position={[0, -PIEDS * e, 0]} />
      </group>
    </>
  )
}
