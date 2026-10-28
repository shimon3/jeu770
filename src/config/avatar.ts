// Choix de l'avatar du joueur.
// 'v6'     : personnage hassidique Hasidic_Man_v6 (GLB, 4 animations)
// 'v6sym'  : candidat, même personnage avec le bras gauche reconstruit en
//            miroir du bras droit (os, poids et animations du bras gauche ;
//            Essai_bras_symetrique). Le reste du GLB est identique à la v6.
// 'ancien' : avatar procédural d'origine (src/player/Avatar.tsx)
// Retour immédiat : passer AVATAR_JOUEUR à 'v6' ou 'ancien', ou ouvrir le jeu
// avec ?avatar=v6, ?avatar=v6sym ou ?avatar=ancien dans l'adresse.
export type ChoixAvatar = 'v6' | 'v6sym' | 'ancien'
export type ChoixGlb = Exclude<ChoixAvatar, 'ancien'>

export const AVATAR_JOUEUR: ChoixAvatar = 'v6sym'

export const URL_AVATAR: Record<ChoixGlb, string> = {
  v6: '/models/hasidic_man_v6.glb',
  v6sym: '/models/hasidic_man_v6_brasSym.glb',
}

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

// Fermeture des bras de l'avatar v6, en degrés, ajoutée après l'animation :
// les clips Meshy gardent les bras trop écartés du corps. Le squelette n'a ni
// épaule ni coude ; chaque bras pivote autour d'une épaule virtuelle
// symétrique. Le bras droit reste moins fermé : au-delà, la manche traverse le
// sirtouk (mesuré). Le bras gauche pivote à mi-bras dans le squelette Meshy :
// au-delà de 9°, il paraît cassé à mi-hauteur. Sur 'v6sym', le bras gauche est
// le miroir du droit : aucune fermeture, tel que validé en prévisualisation
// (essayer { gauche: 4, droite: 4 } pour serrer un peu). Retour immédiat aux clips
// d'origine : passer à null, ou ouvrir le jeu avec ?bras=origine dans l'adresse.
export const FERMETURE_BRAS: Record<ChoixGlb, { gauche: number; droite: number } | null> = {
  v6: { gauche: 9, droite: 4 },
  v6sym: null,
}

export function fermetureBrasChoisie(choix: ChoixGlb): { gauche: number; droite: number } | null {
  try {
    if (new URLSearchParams(window.location.search).get('bras') === 'origine') return null
  } catch {
    // adresse illisible : réglage par défaut
  }
  return FERMETURE_BRAS[choix]
}

export function avatarChoisi(): ChoixAvatar {
  try {
    const p = new URLSearchParams(window.location.search).get('avatar')
    if (p === 'ancien' || p === 'v6' || p === 'v6sym') return p
  } catch {
    // adresse illisible : réglage par défaut
  }
  return AVATAR_JOUEUR
}
