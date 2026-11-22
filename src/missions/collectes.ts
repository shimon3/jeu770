// Objets à ramasser ou à poser pour les étapes de type 'collecte'
// (src/config/missions.json). Positions en mètres, sur le trottoir nord
// d'Eastern Parkway, relevées sur une vue de dessus (15/11/2026).
// ESTIMÉ — emplacements de jeu, sans valeur de reconstitution.

export type PointCollecte = { id: string; p: [number, number, number]; rotationY?: number }

export const COLLECTES: Record<string, PointCollecte[]> = {
  // Pièces de tsedaka égarées sur le trottoir (ramassées en passant dessus)
  piece: [
    { id: 'piece-1', p: [-39, 0.9, 5.2] }, // hors de la courette du Zal (22/11/2026)
    { id: 'piece-2', p: [-26, 0.9, 7.4] },
    { id: 'piece-3', p: [-18, 0.9, 4.8] },
    { id: 'piece-4', p: [-12, 0.9, 7.0] },
    { id: 'piece-5', p: [11, 0.9, 8.9] },
    { id: 'piece-6', p: [15.5, 0.9, 4.6] },
    { id: 'piece-7', p: [28, 0.9, 6.8] },
    { id: 'piece-8', p: [35, 0.9, 5.0] },
  ],
  // Panneaux d'affichage où coller l'annonce du farbrenguen (touche E)
  affiche: [
    { id: 'affiche-1', p: [-15, 0, 3.4] },
    { id: 'affiche-2', p: [-40, 0, 3.4] }, // hors de la courette du Zal (22/11/2026)
    { id: 'affiche-3', p: [31, 0, 3.4] },
  ],
}

// Marque d'inventaire d'un objet déjà ramassé (sauvegardée avec la partie)
export const marque = (id: string) => `ramasse:${id}`
