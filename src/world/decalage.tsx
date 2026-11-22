import { createContext, useContext, type ReactNode } from 'react'
import { DX_ZAL } from '../config/grandZal'
import type { V3 } from './primitives'

// Place du grand Zal (22/11/2026, photo Google Maps fournie par Samuel) :
// vu de la rue, le bâtiment de brique rouge au-dessus du grand Zal (784-788)
// est à GAUCHE du 770. Le Zal, son bâtiment, son escalier, ses PNJ et ses
// portes restent décrits dans config/grandZal.ts dans leur repère d'origine
// (« repère Zal ») ; <Deplace> les translate de DX_ZAL en x, SANS miroir :
// l'intérieur garde sa disposition (place du Rebbe à droite de l'Aron).
//
// - Le dessin passe dans un groupe décalé de DX_ZAL.
// - Les collisions, portes, PNJ, places assises et points d'interaction lisent
//   useDecalage() et convertissent eux-mêmes leurs coordonnées en coordonnées
//   monde (corps physiques et logique de jeu travaillent en coordonnées monde).

const Decalage = createContext(0)

export function useDecalage() {
  return useContext(Decalage)
}

export function Deplace({ children }: { children: ReactNode }) {
  return (
    <Decalage.Provider value={DX_ZAL}>
      <group position={[DX_ZAL, 0, 0]}>{children}</group>
    </Decalage.Provider>
  )
}

// Annule le décalage pour ce qui est placé en coordonnées monde (collisions,
// corps physiques) : à utiliser avec des positions déjà converties
export function Annule({ children }: { children: ReactNode }) {
  const d = useDecalage()
  if (d === 0) return <>{children}</>
  return (
    <Decalage.Provider value={0}>
      <group position={[-d, 0, 0]}>{children}</group>
    </Decalage.Provider>
  )
}

// Conversions repère Zal → monde
export const posMonde = (p: V3, d: number): V3 => (d === 0 ? p : [p[0] + d, p[1], p[2]])
export const cheminMonde = (c: [number, number][] | undefined, d: number) => (d === 0 || !c ? c : c.map(([x, z]) => [x + d, z] as [number, number]))
