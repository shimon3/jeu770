import { useT } from '../i18n'
import { joueur, useGame } from '../state/store'
import { zoneParId } from '../world/zones'
import { MISSIONS } from '../missions/missions'
import { useEffect, useState } from 'react'
import { fermerPorteProche, porteOuverteProche } from '../world/Porte'
import { estTactile } from '../player/entrees'
import { reciterTehilim, terminerPriere } from '../missions/objets'
import { tefilaDuMoment, tehilimDuJour } from '../world/zmanim'
import { conduite } from '../world/rue/conduite'
import { abandonnerLivraison, DESTINATIONS } from '../missions/livraisons'
import { distanceRepere, repereMission } from '../missions/guide'

// Livraison en cours : lieu et distance restante, mis à jour 4 fois par seconde
function SuiviLivraison({ dest }: { dest: number }) {
  const t = useT()
  const [m, setM] = useState(0)
  const d = DESTINATIONS[dest]
  useEffect(() => {
    const id = setInterval(() => setM(Math.round(Math.hypot(joueur.position[0] - d.x, joueur.position[2] - d.z))), 250)
    return () => clearInterval(id)
  }, [d])
  return (
    <div className="hud-livraison">
      🍕 {t('livraison.suivi', { lieu: t(d.cle), m: String(m) })}
      <button onClick={() => abandonnerLivraison()} aria-label={t('livraison.abandonner')}>
        ✕
      </button>
    </div>
  )
}

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

// Distance jusqu'à la prochaine étape (ou jusqu'au PNJ qui a une mission), 4 fois par seconde
function useRepere() {
  const [r, setR] = useState<{ m: number; genre: 'etape' | 'donneur' } | null>(null)
  useEffect(() => {
    const id = setInterval(() => {
      const p = repereMission()
      const suivant = p ? { m: distanceRepere(p), genre: p.genre } : null
      setR((avant) => (avant?.m === suivant?.m && avant?.genre === suivant?.genre ? avant : suivant))
    }, 250)
    return () => clearInterval(id)
  }, [])
  return r
}

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
  const priere = useGame((s) => s.priere)
  const livraison = useGame((s) => s.livraison)
  // Bouton « Fermer la porte » quand une porte ouverte est à moins de 3 m
  const repere = useRepere()
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
        {livraison && !pause && <SuiviLivraison dest={livraison.dest} />}
        {auVolant && !pause && <Compteur tank={auVolant === 'mitzvah-tank'} />}
      </div>
      <div className="hud-mission">
        <div className="hud-mission-titre">{t('hud.mission')}</div>
        {active && etape ? (
          <>
            <div className="hud-mission-nom">
              {t(active.titre)}{' '}
              <span className="hud-mission-pas">
                {missions[active.id].etape + 1}/{active.etapes.length}
              </span>
            </div>
            <div>
              {t(etape.texte)}
              {etape.type === 'collecte' && ` (${missions[active.id].compte ?? 0}/${etape.nombre ?? 1})`}
            </div>
            {repere?.genre === 'etape' && <div className="hud-mission-distance">◆ {t('hud.distance', { m: String(repere.m) })}</div>}
          </>
        ) : repere?.genre === 'donneur' ? (
          <>
            <div>{t(Object.keys(missions).length === 0 ? 'hud.aucuneMission' : 'hud.missionDispo')}</div>
            <div className="hud-mission-distance">◆ {t('hud.distance', { m: String(repere.m) })}</div>
          </>
        ) : (
          <div>{Object.keys(missions).length === 0 ? t('hud.aucuneMission') : MISSIONS.every((m) => missions[m.id]?.etat === 'terminee') ? t('hud.toutesTerminees') : t('hud.missionDispo')}</div>
        )}
      </div>
      <div className="hud-notifs">
        {notifications.map((n) => (
          <div key={n.id} className="notif">
            {t(n.texte, n.params)}
          </div>
        ))}
      </div>
      {it && !panneau && !pause && !priere && (
        <div className="hud-action">
          <kbd>E</kbd> {it.labelCle()}
        </div>
      )}
      {porteProche && !panneau && !pause && (
        <button className="hud-fermer" onClick={() => fermerPorteProche()}>
          {t('hud.fermerPorte')} <kbd>F</kbd>
        </button>
      )}
      {/* En prière : bandeau en bas (le personnage se balance), Terminer ou se déplacer pour finir */}
      {priere && !panneau && !pause && (
        <div className="hud-priere">
          <div className="hud-priere-titre">{t(priere === 'priere' ? 'priere.titre' : 'tehilim.titre')}</div>
          {priere === 'priere' ? (
            <>
              <div>{t('priere.corps', { tefila: t(`tefila.${tefilaDuMoment()}`) })}</div>
              <div className="hud-priere-texte" dir="rtl" lang="he">
                {t('priere.chema')}
              </div>
            </>
          ) : (
            <div>{t('tehilim.corps', { jour: String(tehilimDuJour().jour), chapitres: tehilimDuJour().chapitres })}</div>
          )}
          <button onClick={() => terminerPriere()}>{t('priere.terminer')}</button>
        </div>
      )}
      {/* Tehilim acheté + lieu de calme : bouton pour réciter les chapitres du jour */}
      {aTehilim && z?.calme && !priere && !panneau && !pause && (
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
