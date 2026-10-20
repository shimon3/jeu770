import { useT } from '../i18n'
import { useGame } from '../state/store'
import { zoneParId } from '../world/zones'
import { MISSIONS } from '../missions/missions'
import { useEffect, useState } from 'react'
import { fermerPorteProche, porteOuverteProche } from '../world/Porte'
import { estTactile } from '../player/entrees'

const TACTILE = estTactile()

export function Hud({ verrouille }: { verrouille: boolean }) {
  const t = useT()
  const ecran = useGame((s) => s.ecran)
  const pause = useGame((s) => s.pause)
  const zone = useGame((s) => s.zone)
  const cible = useGame((s) => s.cible)
  const interactifs = useGame((s) => s.interactifs)
  const missions = useGame((s) => s.missions)
  const vue = useGame((s) => s.vue)
  const panneau = useGame((s) => s.panneau)
  const notifications = useGame((s) => s.notifications)
  // Bouton « Fermer la porte » quand une porte ouverte est à moins de 3 m
  const [porteProche, setPorteProche] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setPorteProche(porteOuverteProche()), 200)
    return () => clearInterval(id)
  }, [])
  if (ecran !== 'jeu') return null

  const z = zoneParId(zone)
  const it = cible ? interactifs.get(cible) : undefined
  const active = MISSIONS.find((m) => missions[m.id]?.etat === 'active')
  const etape = active ? active.etapes[missions[active.id].etape] : undefined

  return (
    <div className="hud">
      <div className="hud-zone">
        <span>{t(`zone.${zone}`)}</span>
        {z?.artistique && <span className="badge">{t('hud.artistique')}</span>}
        {z?.calme && <span className="badge calme">{t('hud.calme')}</span>}
      </div>
      <div className="hud-mission">
        <div className="hud-mission-titre">{t('hud.mission')}</div>
        {active && etape ? (
          <>
            <div className="hud-mission-nom">{t(active.titre)}</div>
            <div>{t(etape.texte)}</div>
          </>
        ) : (
          <div>{Object.keys(missions).length === 0 ? t('hud.aucuneMission') : '—'}</div>
        )}
      </div>
      <div className="hud-notifs">
        {notifications.map((n) => (
          <div key={n.id} className="notif">
            {t(n.texte, n.params)}
          </div>
        ))}
      </div>
      {it && !panneau && !pause && (
        <div className="hud-action">
          <kbd>E</kbd> {it.labelCle()}
        </div>
      )}
      {porteProche && !panneau && !pause && (
        <button className="hud-fermer" onClick={() => fermerPorteProche()}>
          {t('hud.fermerPorte')} <kbd>F</kbd>
        </button>
      )}
      {vue === '1re' && <div className="viseur" />}
      {!TACTILE && (
        <div className="hud-aide">
          {t(vue === '1re' ? 'hud.vue1' : 'hud.vue3')} · {t('hud.aide')}
        </div>
      )}
      {!TACTILE && !verrouille && !pause && !panneau && <div className="hud-clic">{t('accueil.cliquer')}</div>}
    </div>
  )
}
