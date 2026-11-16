import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useChargement } from '../state/chargement'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { Commandes } from './Commandes'
import { estTactile } from '../player/entrees'

const TACTILE = estTactile()
// Les tests automatiques (Playwright) passent directement au menu
// (sauf avec ?generique=1, pour le capturer)
const AUTOMATE = typeof navigator !== 'undefined' && navigator.webdriver === true && !new URLSearchParams(window.location.search).has('generique')

// Générique d'ouverture (16/11/2026) : image de la façade du 770 rendue par
// le jeu (public/assets/generique.jpg : aucune photo, aucun portrait), lignes
// qui apparaissent l'une après l'autre, puis « Appuyez pour commencer ».
// Il commence par demander la langue, dans les deux langues (seuls textes en
// dur : on ne sait pas encore laquelle afficher). Ensuite un clic, un toucher
// ou une touche passe au menu ; sinon au bout de 16 s.
// Le jeu se charge pendant ce temps.
function Generique({ onFin }: { onFin: () => void }) {
  const t = useT()
  // Étape 1 : choix de la langue (question écrite dans les deux langues).
  // Étape 2 : le générique défile dans la langue choisie.
  const [choisie, setChoisie] = useState(false)
  useEffect(() => {
    if (!choisie) return
    const fin = () => onFin()
    const id = window.setTimeout(fin, 16000)
    window.addEventListener('keydown', fin)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', fin)
    }
  }, [choisie, onFin])
  const choisir = (langue: 'fr' | 'he') => {
    useGame.getState().set({ langue })
    setChoisie(true)
  }
  if (!choisie)
    return (
      <div className="generique">
        <div className="generique-bh">ב״ה</div>
        <div className="generique-texte">
          <h1 className="generique-titre g1" dir="ltr">
            770
          </h1>
          <div className="generique-filet g1" />
          <p className="generique-question g2" lang="fr" dir="ltr">
            Dans quelle langue voulez-vous jouer ?
          </p>
          <p className="generique-question g2" lang="he" dir="rtl">
            באיזו שפה תרצו לשחק?
          </p>
          <div className="generique-langues g3">
            <button lang="fr" dir="ltr" onClick={() => choisir('fr')}>
              Français
            </button>
            <button lang="he" dir="rtl" onClick={() => choisir('he')}>
              עברית
            </button>
          </div>
        </div>
      </div>
    )
  return (
    <div className="generique cliquable" onClick={onFin} role="button" tabIndex={0}>
      <div className="generique-bh">ב״ה</div>
      <div className="generique-texte">
        <p className="generique-ligne g1">{t('generique.lieu')}</p>
        <h1 className="generique-titre g2">{t('app.titre')}</h1>
        <div className="generique-filet g3" />
        <p className="generique-ligne g3">{t('app.sousTitre')}</p>
        <p className="generique-ligne g4">{t('generique.invitation')}</p>
        <p className="generique-ligne petit g5">{t('generique.note')}</p>
      </div>
      <p className="generique-commencer g6">{t(TACTILE ? 'generique.toucher' : 'generique.commencer')}</p>
    </div>
  )
}

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
  // Sécurité : sur un appareil très lent, le bouton s'active au bout de 15 s
  const [delai, setDelai] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setDelai(true), 15000)
    return () => window.clearTimeout(id)
  }, [])
  if (delai) dejaPret.current = true
  const pret = dejaPret.current
  // Pourcentage affiché : il ne redescend jamais (chaque nouvelle vague de
  // téléchargements remettait le compteur de drei à 0) ; téléchargements
  // jusqu'à 80 %, préparation des graphismes (préchauffage) jusqu'à 100 %
  const affiche = useRef(0)
  const brut = prechauffe ? 100 : Math.min(80, progress * 0.8)
  affiche.current = Math.max(affiche.current, brut)
  const ecran = useGame((s) => s.ecran)
  const [generique, setGenerique] = useState(!AUTOMATE)
  if (ecran !== 'accueil') return null
  if (generique)
    return (
      <div className="accueil avec-image">
        <div className="accueil-image zoom" />
        <Generique onFin={() => setGenerique(false)} />
      </div>
    )
  return (
    <div className="accueil avec-image">
      <div className="accueil-image" />
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
        <details className="accueil-commandes" open={!TACTILE}>
          <summary>{t('accueil.commandes')}</summary>
          {TACTILE ? <p className="aide-tactile">{t('tactile.aide')}</p> : <Commandes />}
        </details>
        <p className="note">{t('accueil.note')}</p>
      </div>
    </div>
  )
}
