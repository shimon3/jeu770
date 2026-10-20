import type { ReactNode } from 'react'
import { useT } from '../i18n'
import { useGame } from '../state/store'
import { MISSIONS } from '../missions/missions'
import tefilot from '../config/tefilot.json'

export function Panneaux() {
  const t = useT()
  const panneau = useGame((s) => s.panneau)
  const missions = useGame((s) => s.missions)
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
