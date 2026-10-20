import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { textureLosanges, textureMouchetee, textureInscription, textureFrise } from './texturesProcedurales'

// Textures CC0 de Poly Haven (voir CREDITS.md). Les UV des géométries sont
// en mètres : `repeat = 1 / taille du motif`.
const T = '/assets/textures/'
const FICHIERS = {
  brique770: ['red_brick_03_diff_2k.jpg', 'red_brick_03_nor_2k.jpg', 'red_brick_03_rough_2k.jpg'],
  briqueVoisin: ['brick_wall_02_diff_1k.jpg', 'brick_wall_02_nor_1k.jpg', 'brick_wall_02_rough_1k.jpg'],
  ardoise: ['roof_slates_02_diff_1k.jpg', 'roof_slates_02_nor_1k.jpg', 'roof_slates_02_rough_1k.jpg'],
  chevrons: ['herringbone_brick_diff_1k.jpg', 'herringbone_brick_nor_1k.jpg', 'herringbone_brick_rough_1k.jpg'],
  chene: ['oak_veneer_01_diff_1k.jpg', 'oak_veneer_01_nor_1k.jpg', 'oak_veneer_01_rough_1k.jpg'],
  asphalte: ['asphalt_02_diff_1k.jpg', 'asphalt_02_nor_1k.jpg', 'asphalt_02_rough_1k.jpg'],
  dalles: ['concrete_pavement_diff_1k.jpg', 'concrete_pavement_nor_1k.jpg', 'concrete_pavement_rough_1k.jpg'],
  platre: ['plastered_wall_04_diff_1k.jpg', 'plastered_wall_04_nor_1k.jpg', 'plastered_wall_04_rough_1k.jpg'],
} as const

type CleTex = keyof typeof FICHIERS

export type Materiaux = ReturnType<typeof creerMateriaux>

function preparer(jeu: THREE.Texture[], motif: number) {
  return jeu.map((tex, i) => {
    const c = tex.clone()
    c.wrapS = c.wrapT = THREE.RepeatWrapping
    c.repeat.set(1 / motif, 1 / motif)
    c.anisotropy = 8
    c.colorSpace = i === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace
    c.needsUpdate = true
    return c
  })
}

function standard(jeu: THREE.Texture[], motif: number, params: THREE.MeshStandardMaterialParameters = {}) {
  const [map, normalMap, roughnessMap] = preparer(jeu, motif)
  return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, ...params })
}

function creerMateriaux(tex: Record<CleTex, THREE.Texture[]>) {
  const vitrail = textureLosanges()
  return {
    brique770: standard(tex.brique770, 1.0, { normalScale: new THREE.Vector2(0.8, 0.8) }),
    briqueVoisin: standard(tex.briqueVoisin, 1.4, { color: '#c9a08a' }),
    briqueVoisinClaire: standard(tex.briqueVoisin, 1.4, { color: '#e6b39a' }),
    briqueMuret: standard(tex.brique770, 1.0, { color: '#e0b0a0' }),
    ardoise: standard(tex.ardoise, 2.0, { color: '#8796a6' }),
    allee: standard(tex.chevrons, 1.0, { color: '#ff9a7a' }),
    asphalte: standard(tex.asphalte, 5.0, { color: '#9a9a9a' }),
    trottoir: standard(tex.dalles, 2.2, { color: '#d8d2c8' }),
    platre: standard(tex.platre, 2.0, { color: '#f3e6c8' }),
    chene: standard(tex.chene, 1.2, { color: '#d98a45', roughness: 0.55 }),
    cheneFonce: standard(tex.chene, 1.2, { color: '#6e3d1a', roughness: 0.5 }),
    pierre: standard(tex.platre, 1.5, { color: '#d9cdb2', roughness: 0.9 }),
    pierreFoncee: standard(tex.platre, 1.5, { color: '#b9ad94', roughness: 0.9 }),
    sol: new THREE.MeshStandardMaterial({ map: textureMouchetee(), roughness: 0.45 }),
    herbe: new THREE.MeshStandardMaterial({ color: '#4f7a3c', roughness: 1 }),
    haie: new THREE.MeshStandardMaterial({ color: '#2f5a2a', roughness: 1 }),
    fer: new THREE.MeshStandardMaterial({ color: '#161616', metalness: 0.6, roughness: 0.45 }),
    chassisNoir: new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.6 }),
    zinc: new THREE.MeshStandardMaterial({ color: '#9aa3a6', metalness: 0.7, roughness: 0.4 }),
    laiton: new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.9, roughness: 0.3 }),
    vertLampadaire: new THREE.MeshStandardMaterial({ color: '#2c4a3a', metalness: 0.5, roughness: 0.5 }),
    vitrail: new THREE.MeshStandardMaterial({ map: vitrail, color: '#9fb4c0', metalness: 0.4, roughness: 0.15 }),
    // Même verre au plomb, translucide : fenêtres des pièces modélisées (on voit dehors)
    vitrailClair: new THREE.MeshStandardMaterial({ map: vitrail, color: '#c9d6dc', metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.38, depthWrite: false }),
    vitre: new THREE.MeshStandardMaterial({ color: '#33424c', metalness: 0.6, roughness: 0.1 }),
    vitreEclairee: new THREE.MeshStandardMaterial({ color: '#e8d6a8', emissive: '#f0d090', emissiveIntensity: 0.5 }),
    tronc: new THREE.MeshStandardMaterial({ color: '#4a3b2e', roughness: 1 }),
    feuillage: new THREE.MeshStandardMaterial({ color: '#4d6e34', roughness: 1 }),
    bancBois: new THREE.MeshStandardMaterial({ color: '#a8743f', roughness: 0.7 }),
    liege: new THREE.MeshStandardMaterial({ color: '#b98c5a', roughness: 1 }),
    papier: new THREE.MeshStandardMaterial({ color: '#f6f1e4', roughness: 1 }),
    panneauBleu: new THREE.MeshStandardMaterial({ color: '#23405f', roughness: 0.6 }),
    inscription: new THREE.MeshStandardMaterial({ map: textureInscription(), roughness: 0.9 }),
    frise: new THREE.MeshStandardMaterial({ color: '#d9cdb2', bumpMap: textureFrise(), bumpScale: 3, roughness: 0.9 }),
    noir: new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.85 }),
    voiture0: new THREE.MeshStandardMaterial({ color: '#2b2f36', metalness: 0.6, roughness: 0.35 }),
    voiture1: new THREE.MeshStandardMaterial({ color: '#8e9296', metalness: 0.6, roughness: 0.35 }),
    voiture2: new THREE.MeshStandardMaterial({ color: '#5a1e1e', metalness: 0.6, roughness: 0.35 }),
    voiture3: new THREE.MeshStandardMaterial({ color: '#d8d8d4', metalness: 0.6, roughness: 0.35 }),
  }
}

const Ctx = createContext<Materiaux | null>(null)

export function FournisseurMateriaux({ children }: { children: ReactNode }) {
  const cles = Object.keys(FICHIERS) as CleTex[]
  const urls = cles.flatMap((c) => FICHIERS[c].map((f) => T + f))
  const textures = useTexture(urls) as THREE.Texture[]
  const mats = useMemo(() => {
    const parCle = {} as Record<CleTex, THREE.Texture[]>
    cles.forEach((c, i) => (parCle[c] = textures.slice(i * 3, i * 3 + 3)))
    return creerMateriaux(parCle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textures])
  return <Ctx.Provider value={mats}>{children}</Ctx.Provider>
}

export function useMateriaux(): Materiaux {
  const m = useContext(Ctx)
  if (!m) throw new Error('useMateriaux hors de FournisseurMateriaux')
  return m
}
