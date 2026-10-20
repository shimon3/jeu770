import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Avatar, type Anim } from './Avatar'
import { glissementCamera, joystick, touche } from './entrees'
import { joueur, useGame } from '../state/store'
import { zoneEn } from '../world/zones'
import { evenementMission } from '../missions/missions'

// Capsule : demi-hauteur 0,55 + rayon 0,3 → 1,70 m ; centre à 0,85 m des pieds
const DEMI = 0.55
const RAYON = 0.3
const CENTRE = DEMI + RAYON
const MARCHE = 2.2
const COURSE = 4.8
const SAUT = 4.6
const GRAVITE = 14
const OEIL = 1.62

const v = new THREE.Vector3()
const f3 = new THREE.Vector3()
const pivot = new THREE.Vector3()
const cible = new THREE.Vector3()

function amortirAngle(a: number, b: number, k: number) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}

export function Joueur() {
  const corps = useRef<RapierRigidBody>(null)
  const avatar = useRef<THREE.Group>(null)
  const anim = useRef<Anim>({ etat: 'repos', vitesse: 0 })
  const { world, rapier } = useRapier()
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const vue = useGame((s) => s.vue)
  const depart = useGame((s) => s.depart)

  const etat = useRef({
    vy: 0,
    sol: false,
    yaw: depart.yaw,
    pitch: -0.15,
    dist: 4.2,
    distCourante: 4.2,
    cap: Math.PI + depart.yaw,
    zone: '',
    siegeAvant: null as ReturnType<typeof useGame.getState>['siege'],
    tCible: 0,
    tSouris: 0, // dernier mouvement de souris (recentrage automatique)
    avance: false, // le joueur avance (touche avant)
    cadreAssis: false,
  })

  // Créé dans un effet (et non un useMemo) : compatible avec le double
  // montage de StrictMode
  const ctrlRef = useRef<ReturnType<typeof world.createCharacterController> | null>(null)
  useEffect(() => {
    const c = world.createCharacterController(0.02)
    c.enableAutostep(0.32, 0.12, false)
    c.enableSnapToGround(0.35)
    c.setMaxSlopeClimbAngle((50 * Math.PI) / 180)
    c.setMinSlopeSlideAngle((60 * Math.PI) / 180)
    c.setSlideEnabled(true)
    ctrlRef.current = c
    return () => {
      ctrlRef.current = null
      world.removeCharacterController(c)
    }
  }, [world])

  // Souris (sous verrouillage du pointeur) et molette
  useEffect(() => {
    const bouge = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return
      const s = etat.current
      s.tSouris = performance.now()
      s.yaw -= e.movementX * 0.0022
      s.pitch = THREE.MathUtils.clamp(s.pitch - e.movementY * 0.0022, -1.25, 1.0)
    }
    const molette = (e: WheelEvent) => {
      const s = etat.current
      s.dist = THREE.MathUtils.clamp(s.dist + Math.sign(e.deltaY) * 0.5, 1.6, 7)
    }
    window.addEventListener('mousemove', bouge)
    gl.domElement.addEventListener('wheel', molette, { passive: true })
    return () => {
      window.removeEventListener('mousemove', bouge)
      gl.domElement.removeEventListener('wheel', molette)
    }
  }, [gl])

  // Outil de test en développement : téléportation et état
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as Record<string, unknown>).__770 = {
      store: useGame,
      joueur,
      etat: etat.current,
      gl,
      camera,
      scene,
      teleporter: (x: number, y: number, z: number) => corps.current?.setTranslation({ x, y, z }, true),
    }
  }, [gl, scene, camera])

  useFrame((_, dtBrut) => {
    const rb = corps.current
    const ctrl = ctrlRef.current
    if (!rb || !ctrl) return
    const dt = Math.min(dtBrut, 0.05)
    const s = etat.current
    const st = useGame.getState()
    const col = rb.collider(0)
    const p = rb.translation()

    const zone = zoneEn(p.x, p.y - CENTRE + 0.1, p.z)
    if (zone.id !== s.zone) {
      s.zone = zone.id
      st.set({ zone: zone.id })
      evenementMission('zone', zone.id)
    }
    scene.environmentIntensity = THREE.MathUtils.damp(scene.environmentIntensity, zone.interieur ? 0.3 : 1, 3, dt)

    // Avant horizontal de la caméra
    const fx = -Math.sin(s.yaw)
    const fz = -Math.cos(s.yaw)
    const rx = Math.cos(s.yaw)
    const rz = -Math.sin(s.yaw)

    let nouvelle = { x: p.x, y: p.y, z: p.z }

    if (st.siege) {
      // Assis : position imposée par le siège
      const sp = st.siege.position
      nouvelle = { x: sp[0], y: sp[1] + CENTRE, z: sp[2] }
      rb.setNextKinematicTranslation(nouvelle)
      s.cap = st.siege.rotationY
      s.vy = 0
      anim.current = { etat: 'assis', vitesse: 0 }
    } else {
      if (s.siegeAvant) {
        // Se lever : un pas devant le siège
        const r = s.siegeAvant.rotationY
        const sp = s.siegeAvant.position
        const so = s.siegeAvant.sortie
        nouvelle = so
          ? { x: so[0], y: so[1] + CENTRE + 0.05, z: so[2] }
          : { x: sp[0] + Math.sin(r) * 0.75, y: sp[1] + CENTRE + 0.05, z: sp[2] + Math.cos(r) * 0.75 }
        rb.setTranslation(nouvelle, true)
      }
      const bloque = st.ecran !== 'jeu' || st.pause || st.panneau !== null
      let av = 0
      let lat = 0
      if (!bloque) {
        av = (touche('avant') ? 1 : 0) - (touche('arriere') ? 1 : 0)
        lat = (touche('droite') ? 1 : 0) - (touche('gauche') ? 1 : 0)
        // Joystick tactile (prioritaire s'il est utilisé)
        if (joystick.actif && (joystick.x !== 0 || joystick.y !== 0)) {
          av = joystick.y
          lat = joystick.x
        }
      }
      // Course : touche Maj, ou joystick poussé à fond
      const aFond = joystick.actif && Math.hypot(joystick.x, joystick.y) > 0.93
      const court = (touche('courir') || aFond) && !zone.calme
      const vitesse = court ? COURSE : MARCHE
      v.set(fx * av + rx * lat, 0, fz * av + rz * lat)
      const bouge = v.lengthSq() > 0.0004
      s.avance = bouge && av > 0
      // Au clavier : vitesse pleine ; au joystick : proportionnelle à l'inclinaison
      if (bouge) v.normalize().multiplyScalar(joystick.actif ? vitesse * Math.min(1, Math.max(0.35, Math.hypot(av, lat))) : vitesse)

      if (s.sol && !bloque && (touche('sauter') || joystick.saut) && !zone.calme) s.vy = SAUT
      s.vy -= GRAVITE * dt
      if (s.sol && s.vy < 0) s.vy = -2

      ctrl.computeColliderMovement(col, { x: v.x * dt, y: s.vy * dt, z: v.z * dt })
      const m = ctrl.computedMovement()
      s.sol = ctrl.computedGrounded()
      if (s.sol && s.vy < 0) s.vy = 0
      nouvelle = { x: nouvelle.x + m.x, y: nouvelle.y + m.y, z: nouvelle.z + m.z }
      // Filet de sécurité : chute hors du monde
      if (nouvelle.y < -6) nouvelle = { x: depart.position[0], y: depart.position[1], z: depart.position[2] }
      rb.setNextKinematicTranslation(nouvelle)

      if (bouge) s.cap = amortirAngle(s.cap, Math.atan2(v.x, v.z), 1 - Math.exp(-dt * 12))
      const montee = m.y / dt
      anim.current = {
        etat: !s.sol ? 'saut' : bouge ? (montee > 0.35 ? 'escalier' : court ? 'course' : 'marche') : 'repos',
        vitesse: bouge ? vitesse : 0,
      }
    }
    s.siegeAvant = st.siege

    joueur.position = [nouvelle.x, nouvelle.y, nouvelle.z]
    joueur.yaw = s.yaw

    // Avatar
    const a = avatar.current
    if (a) {
      a.position.set(nouvelle.x, nouvelle.y - CENTRE, nouvelle.z)
      a.rotation.y = s.cap
      a.visible = vue === '3e'
    }

    // Glissement du doigt (écran tactile) : comme la souris
    if (glissementCamera.dx !== 0 || glissementCamera.dy !== 0) {
      s.yaw -= glissementCamera.dx * 0.006
      s.pitch = THREE.MathUtils.clamp(s.pitch - glissementCamera.dy * 0.005, -1.25, 1.0)
      glissementCamera.dx = 0
      glissementCamera.dy = 0
      s.tSouris = performance.now()
    }
    // Caméra automatique : si la souris est immobile depuis 1,2 s, la caméra
    // revient derrière le personnage quand il avance et l'inclinaison revient
    // à la normale. À l'intérieur, elle se rapproche pour ne pas buter sur
    // les murs.
    if (vue === '3e' && performance.now() - s.tSouris > 1200 && !st.siege) {
      if (s.avance) s.yaw = amortirAngle(s.yaw, s.cap + Math.PI, 1 - Math.exp(-dt * 1.8))
      s.pitch = THREE.MathUtils.damp(s.pitch, zone.interieur ? -0.08 : -0.15, 1.5, dt)
    }
    // En s'asseyant, la caméra se place derrière le personnage assis
    if (st.siege && !s.cadreAssis) {
      s.yaw = st.siege.rotationY + Math.PI
      s.cadreAssis = true
    } else if (!st.siege) s.cadreAssis = false
    const cfx = -Math.sin(s.yaw)
    const cfz = -Math.cos(s.yaw)
    const crx = Math.cos(s.yaw)
    const crz = -Math.sin(s.yaw)
    const cp = Math.cos(s.pitch)
    f3.set(cfx * cp, Math.sin(s.pitch), cfz * cp)
    if (vue === '1re') {
      camera.position.set(nouvelle.x, nouvelle.y - CENTRE + OEIL, nouvelle.z)
      cible.copy(camera.position).add(f3)
      camera.lookAt(cible)
    } else {
      const epaule = zone.interieur ? 0.3 : 0.45
      pivot.set(nouvelle.x + crx * epaule, nouvelle.y - CENTRE + 1.6, nouvelle.z + crz * epaule)
      let d = zone.interieur ? Math.min(s.dist, 2.6) : s.dist
      const hit = world.castRay(new rapier.Ray(pivot, { x: -f3.x, y: -f3.y, z: -f3.z }), d + 0.3, true, undefined, undefined, col)
      if (hit) d = Math.max(0.35, hit.timeOfImpact - 0.3)
      s.distCourante = d < s.distCourante ? d : THREE.MathUtils.damp(s.distCourante, d, 4, dt)
      camera.position.copy(pivot).addScaledVector(f3, -s.distCourante)
      cible.copy(pivot).add(f3)
      camera.lookAt(cible)
    }

    // Objet interactif le plus proche
    s.tCible += dt
    if (s.tCible > 0.1) {
      s.tCible = 0
      let meilleur: string | null = null
      let dMin = Infinity
      const yTorse = nouvelle.y + 0.3
      for (const it of st.interactifs.values()) {
        const d = Math.hypot(it.position[0] - nouvelle.x, (it.position[1] - yTorse) * 0.6, it.position[2] - nouvelle.z)
        if (d < it.rayon && d < dMin) {
          dMin = d
          meilleur = it.id
        }
      }
      if (st.siege) meilleur = null
      if (meilleur !== st.cible) st.set({ cible: meilleur })
    }
  })

  return (
    <>
      <RigidBody ref={corps} type="kinematicPosition" colliders={false} position={depart.position} enabledRotations={[false, false, false]}>
        <CapsuleCollider args={[DEMI, RAYON]} />
      </RigidBody>
      <group ref={avatar}>
        <Avatar anim={anim} />
      </group>
    </>
  )
}
