import { useProgress } from '@react-three/drei'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { Commandes } from './Commandes'

type Props = {
  sauvegardeExiste: boolean
  onJouer: (nouvelle: boolean) => void
  onLangue: () => void
}

export function Accueil({ sauvegardeExiste, onJouer, onLangue }: Props) {
  const t = useT()
  const { active, progress } = useProgress()
  const pret = !active || progress >= 100
  const ecran = useGame((s) => s.ecran)
  if (ecran !== 'accueil') return null
  return (
    <div className="accueil">
      <div className="accueil-carte">
        <h1>{t('app.titre')}</h1>
        <p className="sous-titre">{t('app.sousTitre')}</p>
        <div className="boutons">
          {sauvegardeExiste ? (
            <>
              <button className="principal" disabled={!pret} onClick={() => onJouer(false)}>
                {pret ? t('accueil.continuer') : t('accueil.chargement')}
              </button>
              <button disabled={!pret} onClick={() => onJouer(true)}>
                {t('accueil.nouvelle')}
              </button>
            </>
          ) : (
            <button className="principal" disabled={!pret} onClick={() => onJouer(true)}>
              {pret ? t('accueil.jouer') : `${t('accueil.chargement')} ${Math.round(progress)} %`}
            </button>
          )}
          <button onClick={onLangue}>{t('accueil.langue')}</button>
        </div>
        <h2>{t('accueil.commandes')}</h2>
        <Commandes />
        <p className="note">{t('accueil.note')}</p>
      </div>
    </div>
  )
}
