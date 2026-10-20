import { useRef, useState, type PointerEvent as PE } from 'react'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { estTactile, glissementCamera, joystick } from '../player/entrees'
import { actionJeu, type Action } from './actions'

// Commandes pour écran tactile : joystick à gauche (il apparaît sous le
// pouce), glissement à droite pour la caméra, boutons d'action et menu.
// Affichées seulement sur un appareil tactile, pendant la partie.

const RAYON = 56 // px : course maximale du joystick

const TACTILE = estTactile()

// La capture garde le geste même si le doigt sort de la zone ; un échec ne
// doit pas interrompre le geste
function capturer(e: PE<HTMLDivElement>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    // pointeur déjà relâché ou inconnu
  }
}

export function ControlesTactiles() {
  const t = useT()
  const ecran = useGame((s) => s.ecran)
  const pause = useGame((s) => s.pause)
  const [base, setBase] = useState<{ x: number; y: number } | null>(null)
  const [bouton, setBouton] = useState({ x: 0, y: 0 })
  const doigtJoystick = useRef<number | null>(null)
  // Base lue immédiatement (l'état React n'est pas encore à jour au premier mouvement)
  const baseRef = useRef<{ x: number; y: number } | null>(null)
  const doigtCamera = useRef<{ id: number; x: number; y: number } | null>(null)

  if (!TACTILE || ecran !== 'jeu' || pause) return null

  // --- Joystick ---
  const debutJoystick = (e: PE<HTMLDivElement>) => {
    if (doigtJoystick.current !== null) return
    capturer(e)
    doigtJoystick.current = e.pointerId
    baseRef.current = { x: e.clientX, y: e.clientY }
    setBase(baseRef.current)
    setBouton({ x: 0, y: 0 })
    joystick.actif = true
    joystick.x = 0
    joystick.y = 0
    // Se lever d'un siège en se déplaçant
    const st = useGame.getState()
    if (st.siege) st.set({ siege: null })
  }
  const bougeJoystick = (e: PE<HTMLDivElement>) => {
    const b = baseRef.current
    if (doigtJoystick.current !== e.pointerId || !b) return
    let dx = e.clientX - b.x
    let dy = e.clientY - b.y
    const d = Math.hypot(dx, dy)
    if (d > RAYON) {
      dx = (dx / d) * RAYON
      dy = (dy / d) * RAYON
    }
    setBouton({ x: dx, y: dy })
    joystick.x = dx / RAYON
    joystick.y = -dy / RAYON
  }
  const finJoystick = (e: PE<HTMLDivElement>) => {
    if (doigtJoystick.current !== e.pointerId) return
    doigtJoystick.current = null
    baseRef.current = null
    setBase(null)
    joystick.actif = false
    joystick.x = 0
    joystick.y = 0
  }

  // --- Caméra ---
  const debutCamera = (e: PE<HTMLDivElement>) => {
    if (doigtCamera.current) return
    capturer(e)
    doigtCamera.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const bougeCamera = (e: PE<HTMLDivElement>) => {
    const d = doigtCamera.current
    if (!d || d.id !== e.pointerId) return
    glissementCamera.dx += e.clientX - d.x
    glissementCamera.dy += e.clientY - d.y
    d.x = e.clientX
    d.y = e.clientY
  }
  const finCamera = (e: PE<HTMLDivElement>) => {
    if (doigtCamera.current?.id === e.pointerId) doigtCamera.current = null
  }

  const appui = (a: Action) => (e: PE<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    actionJeu(a)
  }

  return (
    <div className="tactile">
      <div className="tactile-joystick" onPointerDown={debutJoystick} onPointerMove={bougeJoystick} onPointerUp={finJoystick} onPointerCancel={finJoystick}>
        {base ? (
          <div className="joystick-base" style={{ left: base.x - RAYON, top: base.y - RAYON }}>
            <div className="joystick-bouton" style={{ transform: `translate(${bouton.x}px, ${bouton.y}px)` }} />
          </div>
        ) : (
          <div className="joystick-indice">{t('tactile.joystick')}</div>
        )}
      </div>
      <div className="tactile-camera" onPointerDown={debutCamera} onPointerMove={bougeCamera} onPointerUp={finCamera} onPointerCancel={finCamera} />
      <div className="tactile-boutons">
        <button aria-label={t('commandes.interagir')} className="tactile-e" onPointerDown={appui('e')}>
          E
        </button>
        <button aria-label={t('commandes.fermer')} onPointerDown={appui('f')}>
          F
        </button>
        <button aria-label={t('commandes.vue')} onPointerDown={appui('v')}>
          V
        </button>
        <button aria-label={t('commandes.journal')} onPointerDown={appui('j')}>
          J
        </button>
      </div>
      <button
        className="tactile-menu"
        aria-label={t('commandes.menu')}
        onPointerDown={(e) => {
          e.preventDefault()
          doigtJoystick.current = null
          doigtCamera.current = null
          joystick.actif = false
          joystick.x = 0
          joystick.y = 0
          setBase(null)
          useGame.getState().set({ pause: true, panneau: null })
        }}
      >
        ☰
      </button>
    </div>
  )
}
