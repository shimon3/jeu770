import { useEffect, useRef, useState, type MouseEvent as ME, type PointerEvent as PE } from 'react'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { estTactile, glissementCamera, joystick } from '../player/entrees'
import { zoneParId } from '../world/zones'
import { actionJeu, type Action } from './actions'

// Commandes pour écran tactile (téléphone, tablette), pendant la partie :
// - joystick fixe, toujours visible en bas à gauche ; on peut le saisir
//   n'importe où dans la moitié gauche, la direction est mesurée depuis son
//   centre ;
// - glissement du doigt sur la moitié droite : caméra (deux doigts possibles) ;
// - boutons E, F, V, J, Saut (seulement là où sauter est permis) et menu.
// Positions dans styles.css (safe-area, unités dvh).

const TACTILE = estTactile()

function capturer(e: PE<HTMLElement>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId)
  } catch {
    // pointeur déjà relâché ou inconnu : le geste continue sans capture
  }
}

function remiseAZero() {
  joystick.actif = false
  joystick.x = 0
  joystick.y = 0
  joystick.saut = false
}

export function ControlesTactiles() {
  const t = useT()
  const ecran = useGame((s) => s.ecran)
  const pause = useGame((s) => s.pause)
  const zone = useGame((s) => s.zone)
  const baseRef = useRef<HTMLDivElement>(null)
  const doigtJoystick = useRef<number | null>(null)
  const doigtCamera = useRef<{ id: number; x: number; y: number } | null>(null)
  const [bouton, setBouton] = useState({ x: 0, y: 0 })
  const actif = TACTILE && ecran === 'jeu' && !pause

  // Sécurité : tout relâcher quand les commandes disparaissent ou que
  // l'application passe en arrière-plan
  useEffect(() => {
    const relacher = () => {
      doigtJoystick.current = null
      doigtCamera.current = null
      remiseAZero()
      setBouton({ x: 0, y: 0 })
    }
    if (!actif) relacher()
    window.addEventListener('blur', relacher)
    document.addEventListener('visibilitychange', relacher)
    return () => {
      window.removeEventListener('blur', relacher)
      document.removeEventListener('visibilitychange', relacher)
    }
  }, [actif])

  if (!actif) return null
  const sautPermis = !zoneParId(zone)?.calme

  // --- Joystick ---
  const appliquer = (clientX: number, clientY: number) => {
    const b = baseRef.current?.getBoundingClientRect()
    if (!b) return
    const rayon = b.width / 2
    let dx = clientX - (b.left + rayon)
    let dy = clientY - (b.top + rayon)
    const d = Math.hypot(dx, dy)
    if (d > rayon) {
      dx = (dx / d) * rayon
      dy = (dy / d) * rayon
    }
    setBouton({ x: dx, y: dy })
    joystick.x = dx / rayon
    joystick.y = -dy / rayon
  }
  const debutJoystick = (e: PE<HTMLDivElement>) => {
    if (doigtJoystick.current !== null) return
    e.preventDefault()
    capturer(e)
    doigtJoystick.current = e.pointerId
    joystick.actif = true
    appliquer(e.clientX, e.clientY)
    const st = useGame.getState()
    if (st.siege) st.set({ siege: null }) // se lever en se déplaçant
  }
  const bougeJoystick = (e: PE<HTMLDivElement>) => {
    if (doigtJoystick.current === e.pointerId) appliquer(e.clientX, e.clientY)
  }
  const finJoystick = (e: PE<HTMLDivElement>) => {
    if (doigtJoystick.current !== e.pointerId) return
    doigtJoystick.current = null
    joystick.actif = false
    joystick.x = 0
    joystick.y = 0
    setBouton({ x: 0, y: 0 })
  }

  // --- Caméra ---
  const debutCamera = (e: PE<HTMLDivElement>) => {
    if (doigtCamera.current) return
    e.preventDefault()
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

  // Les boutons agissent au clic (doigt relevé) et non au contact : sinon le
  // clic qui suit le relâchement tombe sur le panneau qui vient de s'ouvrir
  // sous le doigt (« clic fantôme » : le menu se refermait aussitôt)
  const appui = (a: Action) => (e: ME<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    actionJeu(a)
  }

  const bouton2 = (a: Action, lettre: string, label: string, classe = '') => (
    <button key={a} className={`tbtn ${classe}`} aria-label={label} data-action={a} onClick={appui(a)} onContextMenu={(e) => e.preventDefault()}>
      <span className="tbtn-lettre">{lettre}</span>
      <span className="tbtn-label">{label}</span>
    </button>
  )

  return (
    <div className="tactile" onContextMenu={(e) => e.preventDefault()}>
      <div
        className="tactile-joystick"
        onPointerDown={debutJoystick}
        onPointerMove={bougeJoystick}
        onPointerUp={finJoystick}
        onPointerCancel={finJoystick}
        onLostPointerCapture={finJoystick}
      >
        <div ref={baseRef} className="joystick-base" aria-hidden="true">
          <div className="joystick-bouton" style={{ transform: `translate(${bouton.x}px, ${bouton.y}px)` }} />
        </div>
      </div>
      <div
        className="tactile-camera"
        onPointerDown={debutCamera}
        onPointerMove={bougeCamera}
        onPointerUp={finCamera}
        onPointerCancel={finCamera}
        onLostPointerCapture={finCamera}
      />
      <div className="tactile-boutons">
        {sautPermis && (
          <button
            className="tbtn tbtn-saut"
            aria-label={t('tactile.saut')}
            data-action="saut"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              joystick.saut = true
            }}
            onPointerUp={() => (joystick.saut = false)}
            onPointerCancel={() => (joystick.saut = false)}
            onPointerLeave={() => (joystick.saut = false)}
          >
            <span className="tbtn-lettre">⤒</span>
            <span className="tbtn-label">{t('tactile.saut')}</span>
          </button>
        )}
        {bouton2('j', 'J', t('tactile.j'))}
        {bouton2('v', 'V', t('tactile.v'))}
        {bouton2('f', 'F', t('tactile.f'))}
        {bouton2('e', 'E', t('tactile.e'), 'tbtn-e')}
      </div>
      <button
        className="tactile-menu"
        aria-label={t('commandes.menu')}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault()
          useGame.getState().set({ pause: true, panneau: null })
        }}
      >
        ☰
      </button>
    </div>
  )
}
