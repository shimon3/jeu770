import { useRef } from 'react'
import { useProgress } from '@react-three/drei'
import { useChargement } from '../state/chargement'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { Commandes } from './Commandes'
import { estTactile } from '../player/entrees'

const TACTILE = estTactile()

type Props = {
  sauvegardeExiste: boolean
  onJouer: (nouvelle: boolean) => void
  onLangue: () => void
}

export function Accueil({ sauvegardeExiste, onJouer, onLangue }: Props) {
  const t = useT()
  const { active, progress } = useProgress()
  // Prêt dès que la rue et le joueur sont affichés ; sinon, fin de tous les
  // chargements. Le bouton ne s'active pas avant le début du chargement (sinon
  // il s'activait puis se grisait aussitôt, et un clic à ce moment-là était
  // perdu) et ne se grise plus une fois actif (les chargements différés du
  // Zal et des PNJ relancent le compteur).
  const essentiel = useChargement((c) => c.monde && c.joueur && c.prechauffe)
  const commence = useRef(false)
  const dejaPret = useRef(false)
  if (active) commence.current = true
  // Toujours après le préchauffage (sinon le premier clic tombe sur une image
  // bloquée par la compilation des shaders)
  const prechauffe = useChargement((c) => c.prechauffe)
  if (essentiel || (prechauffe && commence.current && !active && progress >= 100)) dejaPret.current = true
  const pret = dejaPret.current
  // Pourcentage affiché : il ne redescend jamais (chaque nouvelle vague de
  // téléchargements remettait le compteur de drei à 0) ; téléchargements
  // jusqu'à 80 %, préparation des graphismes (préchauffage) jusqu'à 100 %
  const affiche = useRef(0)
  const brut = prechauffe ? 100 : Math.min(80, progress * 0.8)
  affiche.current = Math.max(affiche.current, brut)
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
              {pret ? t('accueil.jouer') : `${t('accueil.chargement')} ${Math.round(affiche.current)} %`}
            </button>
          )}
          <button onClick={onLangue}>{t('accueil.langue')}</button>
        </div>
        <h2>{t('accueil.commandes')}</h2>
        {TACTILE ? <p className="aide-tactile">{t('tactile.aide')}</p> : <Commandes />}
        <p className="note">{t('accueil.note')}</p>
      </div>
    </div>
  )
}
