import type { ReactNode } from 'react'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { MISSIONS } from '../missions/missions'
import tefilot from '../config/tefilot.json'
import bibliotheque from '../config/bibliotheque.json'
import { ARTICLES, acheter } from '../missions/boutique'
import zones from '../config/zones.json'
import { compter } from '../missions/objets'
import { heureNY, tefilaDuMoment, tehilimDuJour, zmanimDuJour } from '../world/zmanim'

const HITAT_URL = zones.contenus.hitatUrl

// Lien vers le 'Hitat du jour (site Yom Beyomo de Samuel), ouvert dans un nouvel onglet
function LienHitat({ t }: { t: (c: string) => string }) {
  if (!HITAT_URL) return null
  return (
    <p>
      <a className="lien-hitat" href={HITAT_URL} target="_blank" rel="noopener noreferrer">
        📜 {t('hitat.lien')}
      </a>
    </p>
  )
}

export function Panneaux() {
  const t = useT()
  const panneau = useGame((s) => s.panneau)
  const missions = useGame((s) => s.missions)
  const langue = useGame((s) => s.langue)
  const dollars = useGame((s) => s.dollars)
  const inventaire = useGame((s) => s.inventaire)
  if (!panneau) return null
  const fermer = () => useGame.getState().set({ panneau: null })

  let titre = ''
  let corps: ReactNode = null
  switch (panneau.type) {
    case 'histoire':
      titre = t('histoire.titre')
      corps = (
        <>
          {t('histoire.corps')
            .split('\n\n')
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          <p className="source">{t('histoire.source')}</p>
        </>
      )
      break
    case 'tableau':
      titre = t('tableau.titre')
      corps = (
        <>
          <table className="horaires">
            <tbody>
              {tefilot.horaires.map((h) => (
                <tr key={h.cle}>
                  <td>{t(`tefila.${h.cle}`)}</td>
                  <td className="heure">{h.heure}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tefilot.exemple && <p className="source">{t('tableau.exemple')}</p>}
          {(() => {
            const z = zmanimDuJour()
            if (!z) return null
            return (
              <>
                <h3>{t('zmanim.titre')}</h3>
                <table className="horaires">
                  <tbody>
                    {(
                      [
                        ['netz', z.netz],
                        ['sofChema', z.sofChema],
                        ['hatsot', z.hatsot],
                        ['chkia', z.chkia],
                      ] as const
                    ).map(([cle, d]) => (
                      <tr key={cle}>
                        <td>{t(`zmanim.${cle}`)}</td>
                        <td className="heure">{heureNY(d)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="source">{t('zmanim.source')}</p>
              </>
            )
          })()}
          <LienHitat t={t} />
        </>
      )
      break
    case 'journal': {
      titre = t('journal.titre')
      const connues = MISSIONS.filter((m) => missions[m.id])
      corps =
        connues.length === 0 ? (
          <p>{t('journal.vide')}</p>
        ) : (
          connues.map((m) => {
            const e = missions[m.id]
            return (
              <div key={m.id} className="journal-mission">
                <h3>
                  {t(m.titre)} <span className="badge">{t(e.etat === 'terminee' ? 'journal.terminee' : 'journal.enCours')}</span>
                </h3>
                <p>{t(m.description)}</p>
                <ul>
                  {m.etapes.map((et, i) => (
                    <li key={i} className={i < e.etape ? 'fait' : i === e.etape ? 'courant' : ''}>
                      {t(et.texte)}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })
        )
      break
    }
    case 'bibliotheque':
      titre = t('bibliotheque.titre')
      corps = (
        <>
          <ul>
            {bibliotheque.titres.map((l, i) => (
              <li key={i}>{langue === 'he' ? l.he : l.fr}</li>
            ))}
          </ul>
          {bibliotheque.exemple && <p className="source">{t('bibliotheque.exemple')}</p>}
          <LienHitat t={t} />
        </>
      )
      break
    case 'magasin': {
      titre = t('boutique.titre')
      const compte = (id: string) => compter(inventaire, id)
      corps = (
        <>
          <p className="magasin-solde">{t('boutique.solde', { n: String(dollars) })}</p>
          <ul className="magasin-liste">
            {ARTICLES.map((a) => (
              <li key={a.id}>
                <span>
                  {a.icone} {t(`boutique.${a.id}`)} — {a.prix} $
                </span>
                <button data-article={a.id} disabled={dollars < a.prix} onClick={() => acheter(a.id)}>
                  {t('boutique.acheter')}
                </button>
              </li>
            ))}
          </ul>
          <h3>{t('boutique.inventaire')}</h3>
          <p className="magasin-inventaire">
            {['dollar', ...ARTICLES.map((a) => a.id)]
              .filter((id) => compte(id) > 0)
              .map((id) => `${t(`boutique.${id}`)} × ${compte(id)}`)
              .join(' · ') || '—'}
          </p>
          <ul className="magasin-usages">
            {ARTICLES.map((a) => (
              <li key={a.id}>
                {a.icone} {t(`usage.${a.id}`)}
              </li>
            ))}
          </ul>
          <p className="source">
            {t('usage.compteurs', { prieres: String(compte('priere')), tehilim: String(compte('tehilim-lu')), dons: String(compte('don')) })}
          </p>
        </>
      )
      break
    }
    case 'priere':
      titre = t('priere.titre')
      corps = (
        <>
          <p>{t('priere.corps', { tefila: t(`tefila.${tefilaDuMoment()}`) })}</p>
          <p className="dialogue" dir="rtl" lang="he">
            {t('priere.chema')}
          </p>
          <p className="source">{t('priere.note')}</p>
        </>
      )
      break
    case 'tehilim': {
      const d = tehilimDuJour()
      titre = t('tehilim.titre')
      corps = (
        <>
          <p>{t('tehilim.corps', { jour: String(d.jour), chapitres: d.chapitres })}</p>
          <p className="source">{t('tehilim.note')}</p>
        </>
      )
      break
    }
    case 'message':
      corps = <p>{t(panneau.cle)}</p>
      break
    case 'dialogue':
      titre = t(panneau.nomCle)
      corps = <p className="dialogue">« {t(panneau.cle)} »</p>
      break
  }

  return (
    <div className="panneau-fond">
      <div className="panneau">
        {titre && <h2>{titre}</h2>}
        <div className="panneau-corps">{corps}</div>
        <button onClick={fermer}>{t('panneau.fermer')}</button>
      </div>
    </div>
  )
}
