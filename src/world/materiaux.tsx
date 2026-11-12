import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { textureLosanges, textureMouchetee, textureInscription, textureFrise, textureBandeau, textureFlancTank } from './texturesProcedurales'

// Flancs des bus et enseignes de la rue : texte seulement (RÈGLE ABSOLUE :
// aucun portrait ni image du Rebbe)
const HEB = '"Heebo", "Arial Hebrew", sans-serif'
const LAT = '"Inter", Arial, sans-serif'
function texturesRue() {
  return {
    mashiah: textureBandeau([
      { texte: 'יחי אדוננו מורנו ורבינו מלך המשיח לעולם ועד', police: `bold 70px ${HEB}` },
      { texte: 'MOSHIACH IS COMING — BE READY!', police: `bold 64px ${LAT}`, encre: '#b0101a' },
    ]),
    mivtsaim: textureBandeau(
      [
        { texte: 'MITZVAH TANK', police: `bold 84px ${LAT}` },
        { texte: 'מבצע תפילין · Tefillin · Shabbat Candles', police: `bold 56px ${HEB}`, encre: '#1d3f8f' },
      ],
      1024,
      256,
      '#f4f2ea',
      '#1d3f8f',
    ),
    flancTank: textureFlancTank(),
    journaux: textureBandeau(
      [
        { texte: 'עיתונים · NEWSPAPERS', police: `bold 60px ${HEB}`, encre: '#f6f1e4' },
        { texte: 'ייִדיש · עברית · English', police: `bold 46px ${HEB}`, encre: '#f2c200' },
      ],
      512,
      160,
      '#23405f',
    ),
    arretBus: textureBandeau([{ texte: 'BUS STOP', police: `bold 120px ${LAT}`, encre: '#ffffff' }], 512, 192, '#1d4fa0'),
  }
}

// Textures CC0 de Poly Haven (voir CREDITS.md). Les UV des géométries sont
// en mètres : `repeat = 1 / taille du motif`.
const T = '/assets/textures/'
const FICHIERS = {
  brique770: ['red_brick_03_diff_1k.jpg', 'red_brick_03_nor_1k.jpg', 'red_brick_03_rough_1k.jpg'],
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
  const rue = texturesRue()
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
    // Feux des voitures garées (éteints, légèrement lumineux)
    phare: new THREE.MeshStandardMaterial({ color: '#f4f1e6', emissive: '#fff6dc', emissiveIntensity: 0.15, roughness: 0.2 }),
    feuArriere: new THREE.MeshStandardMaterial({ color: '#8e1414', emissive: '#5a0808', emissiveIntensity: 0.3, roughness: 0.3 }),
    taxi: new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.5, roughness: 0.35 }),
    policeBleu: new THREE.MeshStandardMaterial({ color: '#1d3f8f', roughness: 0.4 }),
    gyroRouge: new THREE.MeshStandardMaterial({ color: '#d01818', emissive: '#ff2020', emissiveIntensity: 0.8, roughness: 0.3 }),
    gyroBleu: new THREE.MeshStandardMaterial({ color: '#1838d0', emissive: '#2050ff', emissiveIntensity: 0.8, roughness: 0.3 }),
    rougePompier: new THREE.MeshStandardMaterial({ color: '#b3121b', metalness: 0.4, roughness: 0.4 }),
    feuillageFonce: new THREE.MeshStandardMaterial({ color: '#3b5a2a', roughness: 1 }),
    jauneMashiah: new THREE.MeshStandardMaterial({ color: '#f2c200', metalness: 0.3, roughness: 0.45 }),
    blancCamping: new THREE.MeshStandardMaterial({ color: '#f4f2ea', metalness: 0.2, roughness: 0.5 }),
    bandeauMashiah: new THREE.MeshStandardMaterial({ map: rue.mashiah, roughness: 0.5 }),
    turquoiseTank: new THREE.MeshStandardMaterial({ color: '#58bfcb', metalness: 0.25, roughness: 0.45 }),
    rougeTank: new THREE.MeshStandardMaterial({ color: '#c7262c', metalness: 0.25, roughness: 0.45 }),
    flancTank: new THREE.MeshStandardMaterial({ map: rue.flancTank, metalness: 0.15, roughness: 0.45 }),
    bandeauMivtsaim: new THREE.MeshStandardMaterial({ map: rue.mivtsaim, roughness: 0.5 }),
    enseigneJournaux: new THREE.MeshStandardMaterial({ map: rue.journaux, roughness: 0.6 }),
    panneauArretBus: new THREE.MeshStandardMaterial({ map: rue.arretBus, roughness: 0.5 }),
    verreAbri: new THREE.MeshStandardMaterial({ color: '#cfdde3', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
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
