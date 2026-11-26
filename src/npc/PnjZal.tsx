import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { Anim, EtatAnim, Geste } from '../player/Avatar'
import { Bulle, montrerBulle, type EtatBulle, type Icone } from './Bulle'
import { joueur } from '../state/store'
import { CorpsPnj, type ModelePnj } from './CorpsPnj'
import { gabaritPnj } from './PnjEnfant'
import { OmbreSol } from './OmbreSol'
import { useInteractif } from '../world/interaction'
import { useGame } from '../state/store'
import { t } from '../i18n'
import { demarrerMission, evenementMission, MISSIONS } from '../missions/missions'
import { cheminAutorise, pointAutorise } from './routines'
import { Annule, cheminMonde, useDecalage } from '../world/decalage'

// Hassid anonyme et générique (visage lisse, sans traits). Trois usages :
// - immobile (debout, assis ou en balancement d'étude) ;
// - marcheur sur un chemin en boucle (vérifié par routines.ts) ;
// - donneur de missions (missions dont `donneur` = son id, dans l'ordre).

type Props = {
  id: string
  position: [number, number, number]
  rotationY: number
  etat?: EtatAnim
  chemin?: [number, number][]
  parle?: boolean // interaction E
  nomCle?: string
  repliqueCle?: string // réplique quand il n'a pas de mission à donner
  peau?: string
  barbe?: string
  modele?: ModelePnj // corps : adulte (défaut), enfant, fille ou femme
  etude?: boolean // assis : léger balancement d'étude (havrouta)
  poussette?: boolean // femme : pousse une poussette avec un bébé
  vitesse?: number // marche (m/s), 1,1 par défaut ; plus lente pour le vieux hassid
  // Aux arrêts d'un trajet : geste joué (radio du policier, photo…), icône
  // de bulle et durée de l'arrêt (s)
  gestesArret?: Geste[]
  bulleArret?: Icone
  pauseArret?: [number, number]
  // Salue le joueur qui passe près de lui (se tourne, fait signe)
  salueJoueur?: boolean
}

const v = new THREE.Vector3()

// Sous un <Deplace> (grand Zal) : position et chemin donnés dans le repère
// Zal, convertis ici en coordonnées monde
export function PnjZal(props: Props) {
  const d = useDecalage()
  const { position: p, chemin } = props
  const cheminM = useMemo(() => cheminMonde(chemin, d), [chemin, d])
  if (d === 0) return <PnjZalMonde {...props} />
  return (
    <Annule>
      <PnjZalMonde {...props} position={[p[0] + d, p[1], p[2]]} chemin={cheminM} />
    </Annule>
  )
}

function PnjZalMonde({ id, position, rotationY, etat = 'repos', chemin, parle = true, nomCle = 'pnj.nom', repliqueCle = 'zal.pnjRepos', peau = '#c99878', barbe = '#4a3626', modele = 'adulte', etude = false, poussette = false, vitesse = 1.1, gestesArret, bulleArret, pauseArret = [1, 3.5], salueJoueur = false }: Props) {
  const g = gabaritPnj(modele)
  const anim = useRef<Anim>({ etat, vitesse: 0 })
  const groupe = useRef<THREE.Group>(null)
  const corps = useRef<RapierRigidBody>(null)
  const route = useMemo(() => (chemin ? cheminAutorise(chemin) : []), [chemin])
  const etatRoute = useRef({ i: 0, x: position[0], z: position[2], cap: rotationY, pause: 0, salut: 0, geste: undefined as Geste | undefined })
  const bulle = useRef<EtatBulle>({ icone: null, reste: 0 })
  const enfant = modele === 'enfant' || modele === 'fille'
  const autorise = pointAutorise(position[0], position[2])
  // Sous terre, l'ombre solaire est inutile ; dehors (PNJ d'entrée), on la garde
  useEffect(() => {
    if (position[1] < -1) groupe.current?.traverse((o) => void (o.castShadow = false))
  }, [position])

  useInteractif(
    id,
    [position[0], position[1] + g.hauteurBulle, position[2]],
    parle ? 1.8 : 0,
    () => t('action.parler'),
    () => {
      if (!parle) return
      // 1. Ce dialogue peut terminer une étape « parler à … »
      const avant = JSON.stringify(useGame.getState().missions)
      evenementMission('interagir', id)
      const apres = useGame.getState().missions
      const avance = JSON.stringify(apres) !== avant
      // 2. Mission en cours confiée par ce PNJ ?
      const miennes = MISSIONS.filter((m) => m.donneur === id)
      const enCours = miennes.find((m) => apres[m.id]?.etat === 'active')
      let cle = repliqueCle
      let nouvelle: string | undefined
      if (enCours) cle = `mission.${enCours.id}.rappel`
      else {
        const suivante = miennes.find((m) => !apres[m.id])
        if (suivante) {
          demarrerMission(suivante.id)
          cle = `mission.${suivante.id}.debut`
          nouvelle = suivante.id
        } else if (miennes.length) cle = avance ? `mission.${miennes[miennes.length - 1].id}.fin` : repliqueCle
      }
      useGame.getState().set({ panneau: { type: 'dialogue', nomCle, cle, mission: nouvelle } })
    },
  )

  useFrame((_, dtBrut) => {
    const dt = Math.min(dtBrut, 0.1)
    const e = etatRoute.current
    // Salut au joueur qui passe à moins de 3,5 m (une fois toutes les 25 s)
    e.salut -= dtBrut
    if (salueJoueur && e.salut <= 0) {
      const p = joueur.position
      const dj = Math.hypot(p[0] - e.x, p[2] - e.z)
      if (dj < 3.5 && Math.abs(p[1] - 0.85 - position[1]) < 1.5) {
        e.salut = 25
        e.pause = Math.max(e.pause, 2.6)
        e.geste = 'salue'
        e.cap = Math.atan2(p[0] - e.x, p[2] - e.z)
        montrerBulle(bulle.current, 'salut', 2.2)
        if (groupe.current) groupe.current.rotation.y = e.cap
      }
    }
    if (!route.length) {
      // Immobile : le salut se joue puis le PNJ reprend sa pose
      if (e.pause > 0) e.pause -= dtBrut
      anim.current = { etat, vitesse: 0, geste: e.pause > 0 ? e.geste : undefined }
      return
    }
    // Les pauses suivent le temps réel, même si SwiftShader ou un téléphone
    // lent tombe à quelques images/s. Le mouvement reste davantage plafonné
    // pour qu'un PNJ ne traverse pas un obstacle après une image très longue.
    if (e.pause > 0) {
      e.pause -= Math.min(dtBrut, 0.5)
      anim.current = { etat: 'repos', vitesse: 0, geste: e.geste }
      return
    }
    e.geste = undefined
    const [tx, tz] = route[e.i]
    v.set(tx - e.x, 0, tz - e.z)
    const d = v.length()
    if (d < 0.1) {
      e.i = (e.i + 1) % route.length
      e.pause = pauseArret[0] + Math.random() * (pauseArret[1] - pauseArret[0])
      if (gestesArret?.length) e.geste = gestesArret[Math.floor(Math.random() * gestesArret.length)]
      if (bulleArret) montrerBulle(bulle.current, bulleArret, Math.min(3, e.pause))
      return
    }
    v.multiplyScalar(Math.min(vitesse * dt, d) / d)
    const nx = e.x + v.x
    const nz = e.z + v.z
    if (!pointAutorise(nx, nz)) return // sécurité supplémentaire
    e.x = nx
    e.z = nz
    let dc = Math.atan2(v.x, v.z) - e.cap
    while (dc > Math.PI) dc -= Math.PI * 2
    while (dc < -Math.PI) dc += Math.PI * 2
    e.cap += dc * Math.min(1, dt * 8)
    anim.current = { etat: 'marche', vitesse }
    groupe.current?.position.set(e.x, position[1], e.z)
    if (groupe.current) groupe.current.rotation.y = e.cap
    corps.current?.setNextKinematicTranslation({ x: e.x, y: position[1] + g.centreY, z: e.z })
  })

  if (!autorise) {
    if (import.meta.env.DEV) console.warn(`[PNJ] ${id} refusé : trop près de la place vide`)
    return null
  }

  return (
    <>
      {etat !== 'assis' && (
        <RigidBody ref={corps} type={route.length ? 'kinematicPosition' : 'fixed'} colliders={false} position={[position[0], position[1] + g.centreY, position[2]]}>
          <CapsuleCollider args={[g.demiHauteur, g.rayon]} />
        </RigidBody>
      )}
      <group ref={groupe} position={position} rotation={[0, rotationY, 0]}>
        <CorpsPnj id={id} anim={anim} peau={peau} barbe={barbe} modele={modele} etude={etude} poussette={poussette} />
        {(salueJoueur || bulleArret) && <Bulle etat={bulle} hauteur={enfant ? 1.45 : 2.15} />}
        <OmbreSol rayon={g.rayon * 1.5} />
      </group>
    </>
  )
}
