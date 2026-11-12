import { interactionGroups } from '@react-three/rapier'

// État de la voiture que le joueur conduit, partagé hors React (lu à chaque
// image par Joueur.tsx et par la circulation).
export const conduite = {
  active: false,
  x: 0,
  y: 0,
  z: 0,
  cap: 0, // 0 : avant vers +x
  vitesse: 0,
  // Véhicule conduit (id de VoitureConduite) : berline ou Mitzvah Tank
  vehicule: null as string | null,
  // Où poser le joueur en descendant (lu une fois par Joueur.tsx)
  sortie: null as [number, number, number] | null,
}

// Murs qui retiennent le piéton hors de la chaussée centrale : la voiture les
// ignore (groupe 2), le piéton les respecte (requêtes sans filtre de groupe).
export const GROUPE_MUR_PIETON = interactionGroups(2, [0])
export const FILTRE_VOITURE = interactionGroups(0, [0, 1])
