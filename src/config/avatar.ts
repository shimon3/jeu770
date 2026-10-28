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

// Choix du clip selon la vitesse horizontale réelle (m/s) :
// marche normale → Walking ; course demandée mais vitesse encore basse
// (obstacle, escalier, glissement contre un mur) → Quick_Walk ; course → Running.
// Deux seuils (hystérésis) pour éviter les allers-retours entre les clips.
export const SEUIL_VERS_COURSE = 2.8
export const SEUIL_VERS_MARCHE_RAPIDE = 2.4

// Plafond du niveau de mipmap de la texture de couleur de l'avatar v6, contre
// les traits clairs du sirtouk (Integration_v6/diagnostic_2) : à partir du
// niveau 3, le noir du tissu se mélange aux zones claires voisines dans
// l'atlas (chemise, peau, fond). 2 = traits −82 % en mouvement, sans coût mesuré.
// Retour immédiat au rendu d'origine : passer à null, ou ouvrir le jeu avec
// ?mipmaps=origine dans l'adresse.
export const PLAFOND_MIPMAP_COULEUR_V6: number | null = 2

export function plafondMipmapChoisi(): number | null {
  try {
    if (new URLSearchParams(window.location.search).get('mipmaps') === 'origine') return null
  } catch {
    // adresse illisible : réglage par défaut
  }
  return PLAFOND_MIPMAP_COULEUR_V6
}

export function avatarChoisi(): ChoixAvatar {
  try {
    const p = new URLSearchParams(window.location.search).get('avatar')
    if (p === 'ancien' || p === 'v6') return p
  } catch {
    // adresse illisible : réglage par défaut
  }
  return AVATAR_JOUEUR
}
