import { useMemo } from 'react'
import * as THREE from 'three'
import { useMateriaux } from '../materiaux'
import {
  textureBanderole,
  textureCarrelage,
  textureChevrons,
  textureDamierAmud,
  textureExit,
  textureHorloge,
  textureLambris,
  textureLivres,
  texturePlafond,
  textureTapis,
  INSCRIPTION_BANDEROLE,
} from './texturesZal'

// Matériaux propres au grand Zal. Les textures CC0 existantes (brique,
// chêne, plâtre) sont réutilisées par clonage des matériaux de la phase 1.
export function useMateriauxZal() {
  const m = useMateriaux()
  return useMemo(() => {
    const teinte = (base: THREE.MeshStandardMaterial, couleur: string, extra: THREE.MeshStandardMaterialParameters = {}) => {
      const c = base.clone()
      c.color.set(couleur)
      c.setValues(extra)
      return c
    }
    return {
      // Carrelage vinyle ciré, très brillant (photos anash.org fournies par
      // Samuel, 26/11/2026) : reflets nets des plafonniers sur le sol.
      carrelage: new THREE.MeshStandardMaterial({ map: textureCarrelage(), roughness: 0.22, envMapIntensity: 0.35 }),
      plafond: new THREE.MeshStandardMaterial({ map: texturePlafond(), roughness: 0.95 }),
      lambris: new THREE.MeshStandardMaterial({ map: textureLambris(), roughness: 0.4 }),
      // Brique peinte en blanc : relief de la brique, couleur de peinture
      briqueBlanche: new THREE.MeshStandardMaterial({ color: '#eceae4', normalMap: m.briqueVoisin.normalMap, roughness: 0.9 }),
      peintureBlanche: new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.8 }),
      // Photos anash.org (26/11/2026) : bancs et tables d'un bois brun-roux
      // moyen, verni ; bimah et estrade à roulettes en chêne miel clair.
      bancs: teinte(m.chene, '#bd8152', { roughness: 0.42 }),
      boisMeuble: teinte(m.chene, '#8f5a37', { roughness: 0.45 }),
      boisMiel: teinte(m.chene, '#d19a5a', { roughness: 0.4 }),
      boisMielFonce: teinte(m.chene, '#b07a40', { roughness: 0.42 }),
      // Socle sombre des colonnes (bande noire/brune au pied, photos 2026)
      socleColonne: new THREE.MeshStandardMaterial({ color: '#2a201a', roughness: 0.5 }),
      // Cadre blanc des dalles lumineuses (pas de cadre sombre sur les photos)
      cadreDalle: new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.6 }),
      grille: new THREE.MeshStandardMaterial({ color: '#8d8a84', roughness: 0.7 }),
      plaqueArgent: new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 0.7, roughness: 0.3 }),
      damierAmud: new THREE.MeshStandardMaterial({ map: textureDamierAmud(), roughness: 0.45 }),
      boisFonce: teinte(m.chene, '#734222', { roughness: 0.45 }),
      boisDore: teinte(m.chene, '#e2a24e', { roughness: 0.45 }),
      chevrons: new THREE.MeshStandardMaterial({ map: textureChevrons(), roughness: 0.5 }),
      parokhet: new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: 0.85 }),
      or: new THREE.MeshStandardMaterial({ color: '#d4a640', metalness: 0.8, roughness: 0.35 }),
      bordeaux: new THREE.MeshStandardMaterial({ color: '#6e1c24', roughness: 0.8 }),
      nappeBlanche: new THREE.MeshStandardMaterial({ color: '#f6f4ee', roughness: 0.9 }),
      veloursRouge: new THREE.MeshStandardMaterial({ color: '#a3151c', roughness: 0.7 }),
      tapis: new THREE.MeshStandardMaterial({ map: textureTapis(), roughness: 1 }),
      livres: new THREE.MeshStandardMaterial({ map: textureLivres(), roughness: 0.8 }),
      vitreSombre: new THREE.MeshStandardMaterial({ color: '#141a20', metalness: 0.5, roughness: 0.15 }),
      neon: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fffaf0', emissiveIntensity: 1.6 }),
      cristal: new THREE.MeshStandardMaterial({ color: '#fff6e0', emissive: '#ffe8b0', emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.1 }),
      ventilateur: new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.6 }),
      metal: new THREE.MeshStandardMaterial({ color: '#555', metalness: 0.7, roughness: 0.4 }),
      banderole: new THREE.MeshStandardMaterial({ map: textureBanderole(INSCRIPTION_BANDEROLE), roughness: 0.9, side: THREE.DoubleSide }),
      // Banderole suspendue : une face par côté (texte à l'endroit des deux côtés)
      banderoleFace: new THREE.MeshStandardMaterial({ map: textureBanderole(INSCRIPTION_BANDEROLE), roughness: 0.9 }),
      suspente: new THREE.MeshStandardMaterial({ color: '#9a9a9a', metalness: 0.6, roughness: 0.4 }),
      exit: new THREE.MeshStandardMaterial({ map: textureExit(), emissive: '#ff2a1a', emissiveIntensity: 0.25, emissiveMap: textureExit() }),
      horloge: new THREE.MeshStandardMaterial({ map: textureHorloge(), roughness: 0.6 }),
      beton: teinte(m.trottoir, '#bdb7ad'),
    }
  }, [m])
}

export type MateriauxZal = ReturnType<typeof useMateriauxZal>
