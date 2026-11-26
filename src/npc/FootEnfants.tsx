import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Anim } from '../player/Avatar'
import { CorpsPnj } from './CorpsPnj'
import { gabaritPnj } from './PnjEnfant'
import { OmbreSol } from './OmbreSol'
import { Bulle, montrerBulle, type EtatBulle } from './Bulle'
import { joueur } from '../state/store'

// Trois garçons qui jouent au foot sur le trottoir (26/11/2026, demandé par
// Samuel : « les enfants ne font rien »). Le ballon roule vraiment : un
// garçon court le chercher, l'arrête, se tourne vers un copain et tire
// (clip Meshy « Kick a Soccer Ball »). Les autres se replacent, rient, se
// parlent (bulles). Le joueur peut taper dans le ballon en passant dessus :
// les garçons courent le récupérer.

type Props = { centre: [number, number]; demiX?: number; demiZ?: number }

type Gamin = { x: number; z: number; cap: number; base: [number, number]; anim: MutableRefObject<Anim>; bulle: MutableRefObject<EtatBulle>; joie: number }

const RAYON_BALLON = 0.11
const COURSE = 3.0
const MARCHE = 1.1
const DUREE_TIR = 1.63 // durée du clip « Tir »
const IMPACT = 0.62 // instant du contact pied-ballon dans le clip — ESTIMÉ

function textureBallon() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#f4f4f0'
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = '#1a1a1a'
  for (let i = 0; i < 12; i++) {
    const x = (i % 6) * 44 + (i < 6 ? 10 : 32)
    const y = i < 6 ? 34 : 94
    g.beginPath()
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2
      g.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13)
    }
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const angle = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export function FootEnfants({ centre, demiX = 4.2, demiZ = 1.05 }: Props) {
  const [cx, cz] = centre
  const gb = gabaritPnj('enfant')
  const gamins = useRef<Gamin[]>([])
  if (!gamins.current.length) {
    const bases: [number, number][] = [
      [cx - demiX * 0.7, cz - 0.3],
      [cx + demiX * 0.7, cz + 0.2],
      [cx, cz + demiZ * 0.6],
    ]
    gamins.current = bases.map((b) => ({ x: b[0], z: b[1], cap: 0, base: b, anim: { current: { etat: 'repos', vitesse: 0 } }, bulle: { current: { icone: null, reste: 0 } }, joie: 0 }))
  }
  // Ballon : position, vitesse (au sol, avec un petit rebond vertical)
  const ballon = useRef({ x: cx - demiX * 0.7 + 0.4, y: RAYON_BALLON, z: cz - 0.3, vx: 0, vy: 0, vz: 0 })
  const jeu = useRef({
    porteur: -1 as number, // garçon qui a le ballon dans les pieds
    attente: 1.2, // avant le tir
    tir: -1, // temps écoulé depuis le début du tir (-1 : pas de tir)
    cible: 1,
    dernierTireur: -1,
    passes: 0,
    bavardage: 4,
  })
  const objets = useRef<(THREE.Group | null)[]>([])
  const corps = useRef<(RapierRigidBody | null)[]>([])
  const mBallon = useRef<THREE.Mesh>(null)
  const materiau = useMemo(() => new THREE.MeshStandardMaterial({ map: textureBallon(), roughness: 0.55 }), [])

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.05)
    const b = ballon.current
    const j = jeu.current
    const G = gamins.current

    // Le joueur tape dans le ballon en passant dessus
    const p = joueur.position
    const dxj = b.x - p[0]
    const dzj = b.z - p[2]
    const dj = Math.hypot(dxj, dzj)
    if (dj < 0.5 && Math.abs(p[1] - 0.85) < 1) {
      b.vx = (dxj / Math.max(dj, 0.01)) * 4.5
      b.vz = (dzj / Math.max(dj, 0.01)) * 4.5
      b.vy = 1.5
      j.porteur = -1
      j.tir = -1
      j.dernierTireur = -1
    }

    // Physique simple du ballon : roule, freine, rebondit sur les bords du
    // terrain (murs invisibles : il ne part ni sur la chaussée ni dans les
    // jambes des passants trop loin)
    b.x += b.vx * dt
    b.z += b.vz * dt
    b.vy -= 9.8 * dt
    b.y += b.vy * dt
    if (b.y < RAYON_BALLON) {
      b.y = RAYON_BALLON
      b.vy = Math.abs(b.vy) > 1 ? -b.vy * 0.45 : 0
    }
    const frein = Math.exp(-1.1 * dt)
    b.vx *= frein
    b.vz *= frein
    if (Math.abs(b.x - cx) > demiX + 0.8) {
      b.x = cx + Math.sign(b.x - cx) * (demiX + 0.8)
      b.vx = -b.vx * 0.5
    }
    if (Math.abs(b.z - cz) > demiZ + 0.5) {
      b.z = cz + Math.sign(b.z - cz) * (demiZ + 0.5)
      b.vz = -b.vz * 0.5
    }
    const vb = Math.hypot(b.vx, b.vz)

    // Qui va chercher le ballon ? Le plus proche (sauf celui qui vient de tirer)
    if (j.porteur < 0) {
      let chasseur = -1
      let dMin = Infinity
      G.forEach((g, i) => {
        if (i === j.dernierTireur && vb > 0.8) return
        const d = Math.hypot(g.x - b.x, g.z - b.z)
        if (d < dMin) {
          dMin = d
          chasseur = i
        }
      })
      if (chasseur >= 0 && dMin < 0.42 && vb < 3.5) {
        // Contrôle du ballon
        j.porteur = chasseur
        j.attente = 0.5 + Math.random() * 1.0
        b.vx *= 0.1
        b.vz *= 0.1
        let c = Math.floor(Math.random() * 2)
        if (c >= chasseur) c++
        j.cible = c % 3
        j.passes++
        // Belle passe : les autres sont contents
        if (j.passes % 4 === 0) {
          G.forEach((g, i) => {
            if (i === chasseur) return
            g.joie = 1.6
            montrerBulle(g.bulle.current, 'rire', 1.8)
          })
        }
      }
      G.forEach((g, i) => {
        let tx = g.base[0]
        let tz = g.base[1]
        let vitesse = MARCHE
        if (i === chasseur) {
          // Court vers l'endroit où le ballon va être
          tx = b.x + b.vx * 0.3
          tz = b.z + b.vz * 0.3
          vitesse = COURSE
        }
        avancer(g, tx, tz, vitesse, dt, b)
      })
    } else {
      const g = G[j.porteur]
      const c = G[j.cible]
      // Le ballon suit le pied du porteur
      const ax = g.x + Math.sin(g.cap) * 0.32
      const az = g.z + Math.cos(g.cap) * 0.32
      if (j.tir < 0) {
        b.x += (ax - b.x) * Math.min(1, dt * 8)
        b.z += (az - b.z) * Math.min(1, dt * 8)
        // Se tourne vers le copain
        g.cap += angle(Math.atan2(c.x - g.x, c.z - g.z) - g.cap) * Math.min(1, dt * 6)
        g.anim.current = { etat: 'repos', vitesse: 0 }
        j.attente -= dt
        if (j.attente <= 0) j.tir = 0
      } else {
        const avant = j.tir
        j.tir += dt
        g.anim.current = { etat: 'repos', vitesse: 0, geste: 'tir' }
        if (avant < IMPACT && j.tir >= IMPACT) {
          const dx = c.x - b.x
          const dz = c.z - b.z
          const d = Math.max(0.5, Math.hypot(dx, dz))
          const v = 1.6 + d * 0.9 + Math.random() * 0.6
          // Un peu d'imprécision : parfois le copain doit courir
          const err = (Math.random() - 0.5) * 0.5
          b.vx = (dx / d) * v + (-dz / d) * v * err * 0.3
          b.vz = (dz / d) * v + (dx / d) * v * err * 0.3
          b.vy = Math.random() < 0.3 ? 2.2 : 0.6
          j.dernierTireur = j.porteur
        }
        if (j.tir >= DUREE_TIR) {
          j.porteur = -1
          j.tir = -1
        }
      }
      G.forEach((o, i) => {
        if (i === j.porteur) return
        // Le receveur se prépare face au tireur, les autres se replacent
        avancer(o, o.base[0], o.base[1], MARCHE, dt, b)
      })
    }

    // Bavardage : de temps en temps, une bulle (ballon, rire, question)
    j.bavardage -= dt
    if (j.bavardage <= 0) {
      j.bavardage = 3 + Math.random() * 5
      const k = Math.floor(Math.random() * 3)
      montrerBulle(G[k].bulle.current, (['ballon', 'rire', 'parole', 'question'] as const)[Math.floor(Math.random() * 4)], 2)
    }

    // Les bases bougent un peu après chaque passe : ils ne restent pas plantés
    if (Math.random() < dt * 0.15) {
      const k = Math.floor(Math.random() * 3)
      const g = G[k]
      g.base = [THREE.MathUtils.clamp(g.base[0] + (Math.random() - 0.5) * 2, cx - demiX, cx + demiX), THREE.MathUtils.clamp(g.base[1] + (Math.random() - 0.5) * 0.8, cz - demiZ, cz + demiZ)]
    }

    G.forEach((g, i) => {
      g.joie -= dt
      if (g.joie > 0 && g.anim.current.etat === 'repos' && !g.anim.current.geste) g.anim.current = { etat: 'repos', vitesse: 0, geste: 'joie' }
      const o = objets.current[i]
      if (o) {
        o.position.set(g.x, 0, g.z)
        o.rotation.y = g.cap
      }
      corps.current[i]?.setNextKinematicTranslation({ x: g.x, y: gb.centreY, z: g.z })
    })
    const m = mBallon.current
    if (m) {
      m.position.set(b.x, b.y, b.z)
      // Rotation du ballon qui roule
      if (vb > 0.01) m.rotateOnWorldAxis(_AXE.set(b.vz, 0, -b.vx).normalize(), (vb * dt) / RAYON_BALLON)
    }
  })

  return (
    <>
      {gamins.current.map((g, i) => (
        <group key={i}>
          <RigidBody ref={(r) => void (corps.current[i] = r)} type="kinematicPosition" colliders={false} position={[g.x, gb.centreY, g.z]}>
            <CapsuleCollider args={[gb.demiHauteur, gb.rayon]} />
          </RigidBody>
          <group ref={(o) => void (objets.current[i] = o)} position={[g.x, 0, g.z]}>
            <CorpsPnj id={`foot-enfant-${i + 1}`} anim={g.anim} modele="enfant" />
            <OmbreSol rayon={gb.rayon * 1.5} />
            <Bulle etat={g.bulle} hauteur={1.45} />
          </group>
        </group>
      ))}
      <mesh ref={mBallon} material={materiau} castShadow position={[ballon.current.x, ballon.current.y, ballon.current.z]}>
        <sphereGeometry args={[RAYON_BALLON, 16, 12]} />
      </mesh>
      <OmbreBallon ballon={ballon} />
    </>
  )
}

const _AXE = new THREE.Vector3()

function OmbreBallon({ ballon }: { ballon: MutableRefObject<{ x: number; z: number }> }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => g.current?.position.set(ballon.current.x, 0.01, ballon.current.z))
  return (
    <group ref={g}>
      <OmbreSol rayon={0.16} />
    </group>
  )
}

function avancer(g: Gamin, tx: number, tz: number, vitesse: number, dt: number, b: { x: number; z: number }) {
  const vx = tx - g.x
  const vz = tz - g.z
  const d = Math.hypot(vx, vz)
  if (d < 0.12) {
    // Arrivé : regarde le ballon
    g.cap += angle(Math.atan2(b.x - g.x, b.z - g.z) - g.cap) * Math.min(1, dt * 5)
    if (!g.anim.current.geste || g.joie <= 0) g.anim.current = { etat: 'repos', vitesse: 0 }
    return
  }
  const pas = Math.min(vitesse * dt, d) / d
  g.x += vx * pas
  g.z += vz * pas
  g.cap += angle(Math.atan2(vx, vz) - g.cap) * Math.min(1, dt * 9)
  g.anim.current = { etat: vitesse > 2 ? 'course' : 'marche', vitesse }
}
