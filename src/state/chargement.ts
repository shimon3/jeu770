import { create } from 'zustand'

// Chargement : le bouton Jouer s'active dès que la rue (textures, ciel) et le
// personnage du joueur sont prêts. Les PNJ, le grand Zal et la maison du
// Rabbi finissent de charger pendant la partie.
// prechauffe : shaders compilés et textures envoyées (world/prechauffage.ts) ;
// zal, maison : parties chargées à part (code découpé) montées dans la scène
type Chargement = { monde: boolean; joueur: boolean; zal: boolean; maison: boolean; prechauffe: boolean }

export const useChargement = create<Chargement>(() => ({ monde: false, joueur: false, zal: false, maison: false, prechauffe: false }))
