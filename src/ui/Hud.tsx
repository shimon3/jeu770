import { useT } from '../i18n'
import { useGame } from '../state/store'
import { zoneParId } from '../world/zones'
import { MISSIONS } from '../missions/missions'
import { useEffect, useState } from 'react'
import { fermerPorteProche, porteOuverteProche } from '../world/Porte'
import { estTactile } from '../player/entrees'
import { reciterTehilim } from '../missions/objets'
import { conduite } from '../world/rue/conduite'

// Compteur de vitesse, relu 10 fois par seconde (la vitesse vit hors React)
function Compteur({ tank }: { tank: boolean }) {
  const [kmh, setKmh] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setKmh(Math.round(Math.abs(conduite.vitesse) * 3.6)), 100)
    return () => clearInterval(id)
  }, [])
  return (
    <div className={`hud-compteur${tank ? ' tank' : ''}`} aria-label="km/h">
      <span className="hud-compteur-valeur">{kmh}</span>
      <span className="hud-compteur-unite">km/h</span>
    </div>
  )
}

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
  const dollars = useGame((s) => s.dollars)
  const aTehilim = useGame((s) => s.inventaire.includes('tehilim'))
  const auVolant = useGame((s) => s.auVolant)
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
      {/* Colonne de gauche : zone, dollars, compteur (empilés, sans chevauchement) */}
      <div className="hud-gauche">
        <div className="hud-zone">
          <span>{t(`zone.${zone}`)}</span>
          {z?.artistique && <span className="badge">{t(TACTILE ? 'hud.artistiqueCourt' : 'hud.artistique')}</span>}
          {z?.calme && <span className="badge calme">{t(TACTILE ? 'hud.calmeCourt' : 'hud.calme')}</span>}
        </div>
        <button
          className="hud-dollars"
          aria-label={t('boutique.titre')}
          onClick={() => useGame.getState().set({ panneau: { type: 'magasin' } })}
        >
          💵 {dollars} $
        </button>
        {auVolant && !pause && <Compteur tank={auVolant === 'mitzvah-tank'} />}
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
      {/* Tehilim acheté + lieu de calme : bouton pour réciter les chapitres du jour */}
      {aTehilim && z?.calme && !panneau && !pause && (
        <button className="hud-tehilim" onClick={() => reciterTehilim()}>
          📗 {t('action.reciterTehilim')}
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
