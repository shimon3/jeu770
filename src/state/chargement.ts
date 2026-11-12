import { create } from 'zustand'

// Chargement : le bouton Jouer s'active dès que la rue (textures, ciel) et le
// personnage du joueur sont prêts. Les PNJ, le grand Zal et la maison du
// Rabbi finissent de charger pendant la partie.
type Chargement = { monde: boolean; joueur: boolean }

export const useChargement = create<Chargement>(() => ({ monde: false, joueur: false }))
