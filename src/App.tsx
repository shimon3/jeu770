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
import { installerEntrees, toucheAction, viderEntrees } from './player/entrees'
import { demarrerAmbiance, reglerAmbiance } from './audio/ambiance'
import { zoneParId } from './world/zones'

function canvas(): HTMLCanvasElement | null {
  return document.querySelector('#scene canvas')
}

function verrouiller() {
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
    if (!nouvelle && s) {
      st.set({
        missions: s.missions,
        depart: s.position ? { position: s.position, yaw: s.yaw ?? 0 } : DEPART_PAR_DEFAUT,
      })
    } else {
      st.set({ missions: {}, depart: DEPART_PAR_DEFAUT })
    }
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
        else st.set({ pause: true })
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
      if (a === 'e') {
        if (st.panneau) st.set({ panneau: null })
        else if (st.siege) st.set({ siege: null })
        else if (st.cible) st.interactifs.get(st.cible)?.action()
      } else if (a === 'v') {
        st.set({ vue: st.vue === '3e' ? '1re' : '3e' })
      } else if (a === 'j') {
        st.set({ panneau: st.panneau?.type === 'journal' ? null : { type: 'journal' } })
      } else if (a === 'm') {
        st.set({ panneau: { type: 'message', cle: 'bientot.plan' } })
      } else if (a === 'p') {
        st.set({ panneau: { type: 'message', cle: 'bientot.programme' } })
      }
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
      <Panneaux />
      <Menu onReprendre={reprendre} onLangue={changerLangue} onAccueil={accueil} />
      <Accueil sauvegardeExiste={!!sauvegarde} onJouer={jouer} onLangue={changerLangue} />
    </>
  )
}
