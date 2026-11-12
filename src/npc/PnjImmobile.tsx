import { useRef } from 'react'
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import type { Anim } from '../player/Avatar'
import { CorpsPnj, type ModelePnj } from './CorpsPnj'
import { gabaritPnj } from './PnjEnfant'
import { useInteractif } from '../world/interaction'
import { useGame } from '../state/store'
import { t } from '../i18n'
import { demarrerMission, MISSIONS } from '../missions/missions'

// Hassid anonyme et générique qui confie une mission. Visage lisse, sans
// traits : aucune ressemblance avec une personne réelle.
type Props = { id: string; position: [number, number, number]; rotationY: number; peau?: string; barbe?: string; modele?: ModelePnj }

export function PnjImmobile({ id, position, rotationY, peau = '#c99878', barbe = '#4a3626', modele = 'adulte' }: Props) {
  const g = gabaritPnj(modele)
  const anim = useRef<Anim>({ etat: 'repos', vitesse: 0 })
  const missionDonnee = MISSIONS.find((m) => m.donneur === id)

  useInteractif(id, [position[0], position[1] + g.hauteurBulle, position[2]], 1.8, () => t('action.parler'), () => {
    const st = useGame.getState()
    let cle = 'pnj.debut'
    if (missionDonnee) {
      const etat = st.missions[missionDonnee.id]
      if (!etat) demarrerMission(missionDonnee.id)
      else cle = etat.etat === 'terminee' ? 'pnj.fin' : 'pnj.enCours'
    }
    useGame.getState().set({ panneau: { type: 'dialogue', nomCle: 'pnj.nom', cle } })
  })

  return (
    <>
      <RigidBody type="fixed" colliders={false} position={[position[0], position[1] + g.centreY, position[2]]}>
        <CapsuleCollider args={[g.demiHauteur, g.rayon]} />
      </RigidBody>
      <group position={position} rotation={[0, rotationY, 0]}>
        <CorpsPnj id={id} anim={anim} peau={peau} barbe={barbe} modele={modele} />
      </group>
    </>
  )
}
