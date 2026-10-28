import { Suspense, type MutableRefObject } from 'react'
import { Avatar, type Anim } from '../player/Avatar'
import { PnjV6 } from './PnjV6'
import { pnjModeleChoisi } from '../config/avatar'

// Corps affiché d'un PNJ. Les comportements (dialogues, missions, trajets,
// collisions) restent dans PnjZal / PnjImmobile. Pendant le chargement du GLB,
// et avec ?pnj=ancien, c'est l'avatar procédural d'origine qui s'affiche.
const CHOIX = pnjModeleChoisi()

export function CorpsPnj({ anim, peau, barbe }: { anim: MutableRefObject<Anim>; peau?: string; barbe?: string }) {
  const ancien = <Avatar anim={anim} peau={peau} barbe={barbe} />
  if (CHOIX === 'ancien') return ancien
  return (
    <Suspense fallback={ancien}>
      <PnjV6 anim={anim} />
    </Suspense>
  )
}
