// Déplacements lus par `event.code` (position physique de la touche) : ZQSD
// sur AZERTY et WASD sur QWERTY occupent les mêmes positions.
const enfoncees = new Set<string>()

export const CODES = {
  avant: ['KeyW', 'ArrowUp'],
  arriere: ['KeyS', 'ArrowDown'],
  gauche: ['KeyA', 'ArrowLeft'],
  droite: ['KeyD', 'ArrowRight'],
  courir: ['ShiftLeft', 'ShiftRight'],
  sauter: ['Space'],
}

export function touche(action: keyof typeof CODES): boolean {
  return CODES[action].some((c) => enfoncees.has(c))
}

export function deplacementDemande(): boolean {
  return touche('avant') || touche('arriere') || touche('gauche') || touche('droite')
}

let installe = false
export function installerEntrees() {
  if (installe) return
  installe = true
  window.addEventListener('keydown', (e) => {
    enfoncees.add(e.code)
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
  })
  window.addEventListener('keyup', (e) => enfoncees.delete(e.code))
  window.addEventListener('blur', () => enfoncees.clear())
}

export function viderEntrees() {
  enfoncees.clear()
}

// Touches d'action : lues par `event.key` (lettre affichée) avec repli sur la
// position physique, car M n'est pas au même endroit en AZERTY et en QWERTY.
export function toucheAction(e: KeyboardEvent): string | null {
  const k = e.key.toLowerCase()
  if (['e', 'v', 'm', 'p', 'j', 'f'].includes(k)) return k
  // Repli par position seulement pour un clavier non latin (ex. hébreu)
  if (k.length !== 1 || /[\x20-\x7e]/.test(k)) return null
  const parCode: Record<string, string> = { KeyE: 'e', KeyV: 'v', KeyM: 'm', KeyP: 'p', KeyJ: 'j', KeyF: 'f' }
  return parCode[e.code] ?? null
}
