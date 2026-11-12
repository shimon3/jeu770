import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Préchauffage du rendu (mission performance, 12/11/2026).
// Le profil du démarrage montrait des tâches de 3 à 6 s dans
// WebGLRenderer.render : WebGLProgram.getUniforms → onFirstUse (attente
// synchrone de la compilation des shaders, ~10 s cumulées) et
// texSubImage2D (envoi des textures, ~2,3 s), au premier affichage de
// chaque objet.
// Ici : compilation ASYNCHRONE des shaders (renderer.compileAsync, qui
// s'appuie sur KHR_parallel_shader_compile) et envoi des textures par
// tranches de quelques millisecondes, avant d'afficher l'objet.

const BUDGET_MS = 6

function texturesDe(objet: THREE.Object3D) {
  const res = new Set<THREE.Texture>()
  objet.traverse((o) => {
    const m = (o as THREE.Mesh).material
    if (!m) return
    for (const mat of Array.isArray(m) ? m : [m])
      for (const v of Object.values(mat as unknown as Record<string, unknown>)) if (v instanceof THREE.Texture) res.add(v)
  })
  return [...res]
}

const image = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

// Envoie les textures par petites tranches (une image écran au plus par tranche)
export async function envoyerTextures(gl: THREE.WebGLRenderer, textures: THREE.Texture[], vivant = () => true) {
  let t0 = performance.now()
  for (const tex of textures) {
    if (!vivant()) return
    if ((gl.properties.get(tex) as { __webglTexture?: unknown }).__webglTexture) continue
    gl.initTexture(tex)
    if (performance.now() - t0 > BUDGET_MS) {
      await image()
      t0 = performance.now()
    }
  }
}

export async function prechauffer(gl: THREE.WebGLRenderer, objet: THREE.Object3D, camera: THREE.Camera, scene: THREE.Scene, vivant = () => true) {
  await gl.compileAsync(objet, camera, objet === scene ? null : scene)
  if (!vivant()) return
  await envoyerTextures(gl, texturesDe(objet), vivant)
  if (vivant() && objet === scene) await premiersDessins(gl, scene, camera, vivant)
}

// Premiers dessins répartis : sous ANGLE/Direct3D (Windows), une partie du
// travail des shaders n'a lieu qu'au premier dessin réel. On dessine la
// scène derrière le menu en PASSES tranches (un objet sur PASSES par image, via
// les calques), pendant le menu, au lieu d'un seul bloc de plusieurs
// secondes au premier affichage du jeu.
const PASSES = 8
async function premiersDessins(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, vivant: () => boolean) {
  const objets: THREE.Object3D[] = []
  const lumieres: THREE.Light[] = []
  scene.traverse((o) => {
    if ((o as THREE.Light).isLight) lumieres.push(o as THREE.Light)
    else if ((o as THREE.Mesh).isMesh) objets.push(o)
  })
  const cam = (camera as THREE.PerspectiveCamera).clone()
  const avant = gl.getRenderTarget()
  objets.forEach((o, i) => o.layers.enable(1 + (i % PASSES)))
  for (const l of lumieres) for (let k = 1; k <= PASSES; k++) l.layers.enable(k)
  try {
    for (let k = 1; k <= PASSES && vivant(); k++) {
      cam.layers.set(k)
      // À l'écran, derrière le menu : mêmes variantes de shaders que le jeu
      gl.setRenderTarget(null)
      gl.render(scene, cam)
      await image()
    }
  } finally {
    gl.setRenderTarget(avant)
    objets.forEach((o, i) => o.layers.disable(1 + (i % PASSES)))
    for (const l of lumieres) for (let k = 1; k <= PASSES; k++) l.layers.disable(k)
  }
}

// Objet chargé en cours de partie (PNJ, voitures, arbres) : invisible tant
// que ses shaders et ses textures ne sont pas prêts, pour ne jamais bloquer
// une image de jeu.
export function usePrechauffe(objet: THREE.Object3D | null) {
  const { gl, camera, scene } = useThree()
  const [pret, setPret] = useState(false)
  useEffect(() => {
    if (!objet) return
    let vivant = true
    setPret(false)
    prechauffer(gl, objet, camera, scene, () => vivant)
      .catch(() => undefined)
      .then(() => vivant && setPret(true))
    return () => {
      vivant = false
    }
  }, [objet, gl, camera, scene])
  return pret
}
