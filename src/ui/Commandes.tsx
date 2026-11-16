import { useT } from '../i18n'

// Aide des commandes (16/11/2026) : rangée par usage, une touche par capuchon
// (« ZQSD / WASD / flèches » donne trois capuchons). Les textes viennent de
// fr.json / he.json, comme avant.
const GROUPES: { cle: string; lignes: string[] }[] = [
  { cle: 'bouger', lignes: ['deplacer', 'courir', 'sauter', 'camera', 'zoom'] },
  { cle: 'agir', lignes: ['interagir', 'fermer', 'vue'] },
  { cle: 'volant', lignes: ['klaxon', 'hautParleur'] },
  { cle: 'ecrans', lignes: ['journal', 'plan', 'programme', 'menu'] },
]

export function Commandes() {
  const t = useT()
  return (
    <div className="commandes">
      {GROUPES.map((g) => (
        <section key={g.cle} className="commandes-groupe">
          <h3>{t(`commandes.groupe.${g.cle}`)}</h3>
          <ul>
            {g.lignes.map((l) => (
              <li key={l}>
                <span className="commandes-touches">
                  {t(`commandes.${l}Touches`)
                    .split(' / ')
                    .map((touche) => (
                      <kbd key={touche}>{touche}</kbd>
                    ))}
                </span>
                <span>{t(`commandes.${l}`)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
