import { useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Monde } from './world/Monde'
import { Accueil } from './ui/Accueil'
import { Hud } from './ui/Hud'
import { Menu } from './ui/Menu'
import { Panneaux } from './ui/Panneaux'
import { appliquerLangue } from './i18n'
import { DEPART_PAR_DEFAUT, useGame } from './state/store'
import { lireSauvegarde } from './missions/sauvegarde'
import { sauvegarder } from './missions/missions'
import { estTactile, installerEntrees, toucheAction, viderEntrees } from './player/entrees'
import { demarrerAmbiance, reglerAmbiance } from './audio/ambiance'
import { zoneParId } from './world/zones'
import { actionJeu, type Action } from './ui/actions'
import { ControlesTactiles } from './ui/ControlesTactiles'

function canvas(): HTMLCanvasElement | null {
  return document.querySelector('#scene canvas')
}

// Appareil tactile : jamais de verrouillage du pointeur (sur Android, il
// affiche un message sur le curseur et n'a aucune utilité)
const TACTILE = estTactile()

function verrouiller() {
  if (TACTILE) return
  const c = canvas()
  if (!c || document.pointerLockElement === c) return
  try {
    const r = c.requestPointerLock() as unknown as Promise<void> | undefined
    r?.catch?.(() => undefined)
  } catch {
    // verrouillage refusé (pas de geste utilisateur) : le jeu reste jouable au clavier
  }
}

export default function App() {
  const [cle, setCle] = useState(0)
  const [verrouille, setVerrouille] = useState(false)
  const [sauvegarde, setSauvegarde] = useState(() => lireSauvegarde())
  const langue = useGame((s) => s.langue)
  const ecran = useGame((s) => s.ecran)
  const pause = useGame((s) => s.pause)
  const son = useGame((s) => s.son)
  const zone = useGame((s) => s.zone)

  useEffect(() => {
    installerEntrees()
    const s = lireSauvegarde()
    if (s) useGame.getState().set({ langue: s.langue === 'he' ? 'he' : 'fr', son: s.son !== false })
  }, [])

  useEffect(() => appliquerLangue(langue), [langue])

  // Mode tactile : bloque défilement et zoom du navigateur pendant le jeu (styles.css)
  useEffect(() => {
    document.documentElement.classList.toggle('mode-tactile', TACTILE)
  }, [])

  useEffect(() => {
    const z = zoneParId(zone)
    reglerAmbiance(son && ecran === 'jeu' && !pause, !!z?.interieur, !!z?.calme)
  }, [son, ecran, pause, zone])

  const changerLangue = useCallback(() => {
    const st = useGame.getState()
    st.set({ langue: st.langue === 'fr' ? 'he' : 'fr' })
  }, [])

  const jouer = useCallback((nouvelle: boolean) => {
    const st = useGame.getState()
    const s = lireSauvegarde()
    // On commence toujours sur le trottoir ; « Continuer » reprend les missions
    st.set({
      missions: !nouvelle && s ? s.missions : {},
      inventaire: !nouvelle && s && Array.isArray(s.inventaire) ? s.inventaire : [],
      depart: DEPART_PAR_DEFAUT,
    })
    st.set({ ecran: 'jeu', pause: false, panneau: null, siege: null, vue: '3e' })
    setCle((c) => c + 1)
    demarrerAmbiance()
    verrouiller()
  }, [])

  const reprendre = useCallback(() => {
    useGame.getState().set({ pause: false })
    verrouiller()
  }, [])

  const accueil = useCallback(() => {
    sauvegarder()
    setSauvegarde(lireSauvegarde())
    useGame.getState().set({ ecran: 'accueil', pause: false, panneau: null, siege: null })
    if (document.pointerLockElement) document.exitPointerLock()
  }, [])

  // Verrouillage du pointeur : sa perte (Échap) ouvre le menu
  useEffect(() => {
    if (TACTILE) return
    const changement = () => {
      const v = document.pointerLockElement === canvas()
      setVerrouille(v)
      const st = useGame.getState()
      if (!v && st.ecran === 'jeu' && !st.pause) {
        viderEntrees()
        st.set({ pause: true, panneau: null })
      }
    }
    document.addEventListener('pointerlockchange', changement)
    return () => document.removeEventListener('pointerlockchange', changement)
  }, [])

  // Touches d'action
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const st = useGame.getState()
      if (st.ecran !== 'jeu' || e.repeat) return
      if (e.code === 'Escape') {
        // Sans verrouillage du pointeur, Échap arrive jusqu'ici
        if (st.panneau) st.set({ panneau: null })
        else if (st.pause) reprendre()
        else {
          st.set({ pause: true })
          // Si le pointeur est encore verrouillé, les clics iraient au canvas
          // et non aux boutons du menu
          if (document.pointerLockElement) document.exitPointerLock()
        }
        return
      }
      if (e.code === 'F3') {
        e.preventDefault()
        st.set({ debugPhysique: !st.debugPhysique })
        return
      }
      if (st.pause) return
      const a = toucheAction(e)
      if (!a) {
        // Se lever en se déplaçant
        if (st.siege && ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) st.set({ siege: null })
        return
      }
      actionJeu(a as Action)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [reprendre])

  return (
    <>
      <div
        id="scene"
        onClick={() => {
          const st = useGame.getState()
          if (st.ecran === 'jeu' && !st.pause && !st.panneau) verrouiller()
        }}
      >
        <Canvas
          shadows
          dpr={[1, 1.25]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 62, near: 0.05, far: 400, position: [0, 3, 16] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.0
          }}
        >
          <Monde cle={cle} />
        </Canvas>
      </div>
      <Hud verrouille={verrouille} />
      <ControlesTactiles />
      <Panneaux />
      <Menu onReprendre={reprendre} onLangue={changerLangue} onAccueil={accueil} />
      <Accueil sauvegardeExiste={!!sauvegarde} onJouer={jouer} onLangue={changerLangue} />
    </>
  )
}
