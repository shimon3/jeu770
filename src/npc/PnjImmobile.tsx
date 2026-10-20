import { useRef } from 'react'
import { CapsuleCollider, RigidBody } from '@react-three/rapier'
import { Avatar, type Anim } from '../player/Avatar'
import { useInteractif } from '../world/interaction'
import { useGame } from '../state/store'
import { t } from '../i18n'
import { demarrerMission, MISSIONS } from '../missions/missions'

// Hassid anonyme et générique qui confie une mission. Visage lisse, sans
// traits : aucune ressemblance avec une personne réelle.
type Props = { id: string; position: [number, number, number]; rotationY: number; peau?: string; barbe?: string }

export function PnjImmobile({ id, position, rotationY, peau = '#c99878', barbe = '#4a3626' }: Props) {
  const anim = useRef<Anim>({ etat: 'repos', vitesse: 0 })
  const missionDonnee = MISSIONS.find((m) => m.donneur === id)

  useInteractif(id, [position[0], position[1] + 1.2, position[2]], 1.8, () => t('action.parler'), () => {
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
      <RigidBody type="fixed" colliders={false} position={[position[0], position[1] + 0.85, position[2]]}>
        <CapsuleCollider args={[0.55, 0.3]} />
      </RigidBody>
      <group position={position} rotation={[0, rotationY, 0]}>
        <Avatar anim={anim} peau={peau} barbe={barbe} />
      </group>
    </>
  )
}
