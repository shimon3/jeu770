import { useState } from 'react'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { sauvegarder } from '../missions/missions'
import { Commandes } from './Commandes'

type Props = { onReprendre: () => void; onLangue: () => void; onAccueil: () => void }

export function Menu({ onReprendre, onLangue, onAccueil }: Props) {
  const t = useT()
  const pause = useGame((s) => s.pause)
  const son = useGame((s) => s.son)
  const [message, setMessage] = useState<string | null>(null)
  if (!pause) return null
  return (
    <div className="panneau-fond">
      <div className="panneau menu">
        <h2>{t('menu.titre')}</h2>
        <div className="boutons">
          <button className="principal" onClick={onReprendre}>
            {t('menu.reprendre')}
          </button>
          <button onClick={onLangue}>{t('menu.langue')}</button>
          <button onClick={() => useGame.getState().set({ son: !son })}>{t(son ? 'menu.sonOn' : 'menu.sonOff')}</button>
          <button onClick={() => setMessage(sauvegarder() ? 'menu.sauvegardeOk' : 'menu.sauvegardeEchec')}>{t('menu.sauvegarder')}</button>
          <button onClick={onAccueil}>{t('menu.accueil')}</button>
        </div>
        {message && <p className="source">{t(message)}</p>}
        <Commandes />
      </div>
    </div>
  )
}
