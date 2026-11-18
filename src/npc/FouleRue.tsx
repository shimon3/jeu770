import { PnjZal } from './PnjZal'
import type { ModelePnj } from './CorpsPnj'
import { useQualite } from '../config/qualite'
import { estTactile } from '../player/entrees'

// Foule d'Eastern Parkway (18/11/2026) : la rue devant le 770 est très
// fréquentée. Passants en allers-retours sur le trottoir nord (allées z 8,0
// à 10,4, celles des autres passants), sur le terre-plein central et, en
// décor, sur les trottoirs d'en face. Plus quelques personnes à l'arrêt :
// un policier en faction, un touriste qui photographie la façade, des
// bo'hourim qui attendent.
// Téléphone ou qualité « rapide » : une personne sur deux seulement.
// Aucun ne parle (pas de touche E). Trajets vérifiés par cheminAutorise.

type Passant = {
  id: string
  modele?: ModelePnj
  de: [number, number]
  a?: [number, number] // absent : immobile
  vitesse?: number
  rotationY?: number
  peau?: string
  barbe?: string
  leger?: boolean // gardé sur téléphone
}

const PEAUX = ['#c99878', '#d7a888', '#b9825f', '#e0b597', '#8d5a3b', '#a8714f']
const BARBES = ['#2b1d14', '#4a3626', '#6b6b6b', '#3a2a1e', '#1c1410']

// Trottoir nord : x de -66 (fin de la rangée de maisons) à 58 (magasins)
const PASSANTS: Passant[] = [
  { id: 'foule-1', modele: 'bochur', de: [-64, 8.3], a: [-14, 8.3], vitesse: 1.25, leger: true },
  { id: 'foule-2', modele: 'adulte', de: [-20, 9.9], a: [-62, 9.9], vitesse: 1.05, peau: PEAUX[2], barbe: BARBES[0] },
  { id: 'foule-3', modele: 'touriste', de: [-50, 9.2], a: [-8, 9.2], vitesse: 0.95, leger: true },
  { id: 'foule-4', modele: 'femme', de: [-58, 8.8], a: [-24, 8.8], vitesse: 1.0 },
  { id: 'foule-5', modele: 'bochur', de: [20, 8.4], a: [56, 8.4], vitesse: 1.3, leger: true },
  { id: 'foule-6', modele: 'adulte', de: [54, 9.6], a: [14, 9.6], vitesse: 1.15, peau: PEAUX[0], barbe: BARBES[1], leger: true },
  { id: 'foule-7', modele: 'enfant', de: [28, 10.1], a: [50, 10.1], vitesse: 1.2 },
  { id: 'foule-8', modele: 'bochur', de: [44, 9.0], a: [-6, 9.0], vitesse: 1.2 },
  { id: 'foule-9', modele: 'vieux', de: [-50, 10.3], a: [-36, 10.3], vitesse: 0.65 },
  { id: 'foule-10', modele: 'fille', de: [40, 8.6], a: [57, 8.6], vitesse: 1.1 },
  { id: 'foule-11', modele: 'adulte', de: [-1, 8.1], a: [30, 8.1], vitesse: 1.2, peau: PEAUX[3], barbe: BARBES[2], leger: true },
  { id: 'foule-12', modele: 'touriste', de: [56, 10.0], a: [32, 10.0], vitesse: 0.9 },
  // Terre-plein central : deux allées (z 20,7 et 23,5) entre les bancs et
  // la rangée d'arbres (z 22), de part et d'autre de la hanoukia
  { id: 'foule-13', modele: 'adulte', de: [-60, 20.7], a: [-4, 20.7], vitesse: 1.1, peau: PEAUX[4], barbe: BARBES[4], leger: true },
  { id: 'foule-14', modele: 'femme', de: [5, 20.7], a: [55, 20.7], vitesse: 1.0, leger: true },
  { id: 'foule-15', modele: 'bochur', de: [50, 23.5], a: [4, 23.5], vitesse: 1.25 },
  { id: 'foule-16', modele: 'enfant', de: [-5, 23.5], a: [-40, 23.5], vitesse: 1.2 },
  // En face (décor lointain) : terre-plein et trottoir sud
  { id: 'foule-17', modele: 'adulte', de: [-70, 47.8], a: [10, 47.8], vitesse: 1.1, peau: PEAUX[1], barbe: BARBES[3], leger: true },
  { id: 'foule-18', modele: 'touriste', de: [60, 48.4], a: [-20, 48.4], vitesse: 1.0 },
  { id: 'foule-19', modele: 'femme', de: [-40, 60.5], a: [40, 60.5], vitesse: 1.0, leger: true },
  { id: 'foule-20', modele: 'bochur', de: [50, 61.2], a: [-30, 61.2], vitesse: 1.25 },
  { id: 'foule-21', modele: 'vieux', de: [10, 60.0], a: [30, 60.0], vitesse: 0.7 },
  // Personnes à l'arrêt
  // Policier en faction au coin du 766, face à la rue
  { id: 'foule-policier-1', modele: 'policier', de: [-7.6, 10.4], rotationY: 0.2, leger: true },
  // Second policier qui fait les cent pas devant les magasins
  { id: 'foule-policier-2', modele: 'policier', de: [36, 10.6], a: [44, 10.6], vitesse: 0.6 },
  // Touriste qui photographie la façade du 770 (tourné vers elle)
  { id: 'foule-photo', modele: 'touriste', de: [1.2, 10.3], rotationY: Math.PI - 0.15, leger: true },
  // Deux bo'hourim qui attendent devant la descente du Zal
  { id: 'foule-attente-1', modele: 'bochur', de: [24.6, 9.4], rotationY: -1.9 },
  { id: 'foule-attente-2', modele: 'bochur', de: [23.6, 9.0], rotationY: 1.2 },
]

const TACTILE = estTactile()
// ?foule=0 : sans cette foule (mesure des images par seconde)
const ACTIVE = typeof window === 'undefined' || new URLSearchParams(window.location.search).get('foule') !== '0'

export function FouleRue() {
  const rapide = useQualite((s) => s.niveau === 'rapide')
  const reduite = TACTILE || rapide
  if (!ACTIVE) return null
  return (
    <>
      {PASSANTS.filter((p) => !reduite || p.leger).map((p) => {
        const mobile = !!p.a
        const cap = mobile ? Math.atan2(p.a![0] - p.de[0], p.a![1] - p.de[1]) : (p.rotationY ?? 0)
        return (
          <PnjZal
            key={p.id}
            id={p.id}
            modele={p.modele ?? 'adulte'}
            parle={false}
            position={[p.de[0], 0, p.de[1]]}
            rotationY={cap}
            chemin={mobile ? [p.de, p.a!] : undefined}
            vitesse={p.vitesse}
            peau={p.peau}
            barbe={p.barbe}
          />
        )
      })}
    </>
  )
}
