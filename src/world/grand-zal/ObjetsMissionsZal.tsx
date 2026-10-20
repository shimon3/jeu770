import { useMemo } from 'react'
import { ZAL } from '../../config/grandZal'
import { PiecesLibres, type PieceLibre } from './PiecesLibres'
import type { MateriauxZal } from './materiauxZal'
import { TABLES_SHALASH } from './MobilierZal'
import { useInteractif } from '../interaction'
import { useGame } from '../../state/store'
import { t } from '../../i18n'
import { evenementMission } from '../../missions/missions'

// Objets des missions du Zal. Leur présence dépend de l'avancement des
// missions (lu dans le store), donc de la sauvegarde.

const S = ZAL.sol

function useEtape(missionId: string) {
  return useGame((s) => s.missions[missionId])
}

// Siddour oublié sur un banc du bloc est
function Siddour({ m }: { m: MateriauxZal }) {
  const etat = useEtape('siddour-zal')
  const visible = etat?.etat === 'active' && etat.etape === 0
  const pos: [number, number, number] = [30.8, S + 0.49, -17.25]
  useInteractif('siddour-perdu', [pos[0], pos[1] + 0.3, pos[2]], visible ? 1.9 : 0, () => t('action.prendreSiddour'), () => {
    if (!visible) return
    evenementMission('interagir', 'siddour-perdu')
  })
  const pieces = useMemo<PieceLibre[]>(
    () => [
      { t: [0.15, 0.04, 0.22], p: pos, mat: m.bordeaux },
      { t: [0.14, 0.03, 0.2], p: [pos[0], pos[1] + 0.005, pos[2] + 0.005], mat: m.nappeBlanche, ombre: false },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [m],
  )
  return visible ? <PiecesLibres pieces={pieces} ombres={false} /> : null
}

// Livre dépassant d'une bibliothèque, au fond du Zal (côté nord)
function Livre({ m }: { m: MateriauxZal }) {
  const etat = useEtape('retrouver-livre')
  const visible = etat?.etat === 'active' && etat.etape === 0
  const pos: [number, number, number] = [18.5, S + 1.35, ZAL.z0 + 0.5]
  useInteractif('livre-perdu', [pos[0], pos[1], pos[2] + 0.4], visible ? 1.5 : 0, () => t('action.prendreLivre'), () => {
    if (!visible) return
    evenementMission('interagir', 'livre-perdu')
  })
  const pieces = useMemo<PieceLibre[]>(() => [{ t: [0.06, 0.3, 0.22], p: pos, mat: m.veloursRouge }], // eslint-disable-next-line react-hooks/exhaustive-deps
  [m])
  return visible ? <PiecesLibres pieces={pieces} ombres={false} /> : null
}

// Tables à préparer pour le farbrenguen : nappe blanche posée une à une
function TableFarbrenguen({ m, index }: { m: MateriauxZal; index: number }) {
  const tb = TABLES_SHALASH[index]
  const etat = useEtape('preparer-farbrenguen')
  const couverte = !!etat && (etat.etat === 'terminee' || etat.etape > index)
  const aFaire = etat?.etat === 'active' && etat.etape === index
  useInteractif(tb.id, [tb.x, S + 1.0, tb.z], aFaire ? 1.9 : 0, () => t('action.poserNappe'), () => {
    if (!aFaire) return
    evenementMission('interagir', tb.id)
  })
  const pieces = useMemo<PieceLibre[]>(
    () => [
      { t: [3.1, 0.01, 1.0], p: [tb.x, S + 0.79, tb.z], mat: m.nappeBlanche, ombre: false },
      { t: [3.1, 0.25, 0.01], p: [tb.x, S + 0.67, tb.z + 0.5], mat: m.nappeBlanche, ombre: false },
      { t: [3.1, 0.25, 0.01], p: [tb.x, S + 0.67, tb.z - 0.5], mat: m.nappeBlanche, ombre: false },
    ],
    [m, tb],
  )
  return couverte ? <PiecesLibres pieces={pieces} ombres={false} /> : null
}

export function ObjetsMissionsZal({ m }: { m: MateriauxZal }) {
  return (
    <>
      <Siddour m={m} />
      <Livre m={m} />
      {TABLES_SHALASH.map((_, i) => (
        <TableFarbrenguen key={i} m={m} index={i} />
      ))}
    </>
  )
}
