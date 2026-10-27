// Choix de l'avatar du joueur.
// 'v6'     : personnage hassidique Hasidic_Man_v6 (GLB, 4 animations)
// 'ancien' : avatar procédural d'origine (src/player/Avatar.tsx)
// Retour immédiat à l'ancien avatar : passer AVATAR_JOUEUR à 'ancien',
// ou ouvrir le jeu avec ?avatar=ancien dans l'adresse.
export type ChoixAvatar = 'v6' | 'ancien'

export const AVATAR_JOUEUR: ChoixAvatar = 'v6'

export const URL_AVATAR_V6 = '/models/hasidic_man_v6.glb'

// Vitesse au sol des pieds de chaque animation à vitesse de lecture 1, en m/s.
// Mesurée dans Blender sur Hasidic_Man_v6 (pied au contact du sol).
// Sert à caler la vitesse de lecture sur la vitesse de déplacement pour
// limiter le glissement des pieds.
export const VITESSE_NATURELLE = {
  Walking: 1.42,
  Quick_Walk: 1.39,
  Running: 4.32,
} as const

export function avatarChoisi(): ChoixAvatar {
  try {
    const p = new URLSearchParams(window.location.search).get('avatar')
    if (p === 'ancien' || p === 'v6') return p
  } catch {
    // adresse illisible : réglage par défaut
  }
  return AVATAR_JOUEUR
}
