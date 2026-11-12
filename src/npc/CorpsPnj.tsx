import { Suspense, type MutableRefObject } from 'react'
import { Avatar, AvatarProcedural, type Anim } from '../player/Avatar'
import { PnjV6 } from './PnjV6'
import { PnjEnfant, type ModeleLeger } from './PnjEnfant'
import { pnjModeleChoisi } from '../config/avatar'

// Corps affiché d'un PNJ. Les comportements (dialogues, missions, trajets,
// collisions) restent dans PnjZal / PnjImmobile. Pendant le chargement du GLB,
// et avec ?pnj=ancien, c'est l'avatar procédural d'origine qui s'affiche.
// modele « enfant », « fille » ou « femme » : corps léger (PnjEnfant), rien
// n'est affiché pendant son chargement (l'avatar adulte ne convient pas).
const CHOIX = pnjModeleChoisi()

export type ModelePnj = 'adulte' | ModeleLeger

type Props = { id: string; anim: MutableRefObject<Anim>; peau?: string; barbe?: string; modele?: ModelePnj; etude?: boolean; poussette?: boolean }

export function CorpsPnj({ id, anim, peau, barbe, modele = 'adulte', etude = false, poussette = false }: Props) {
  if (modele !== 'adulte')
    return (
      <Suspense fallback={null}>
        <PnjEnfant id={id} anim={anim} modele={modele} poussette={poussette} />
      </Suspense>
    )
  if (CHOIX === 'ancien') return <Avatar anim={anim} peau={peau} barbe={barbe} />
  // Pendant le chargement : avatar dessiné en code (aucun téléchargement)
  return (
    <Suspense fallback={<AvatarProcedural anim={anim} peau={peau} barbe={barbe} />}>
      <PnjV6 id={id} anim={anim} etude={etude} />
    </Suspense>
  )
}
