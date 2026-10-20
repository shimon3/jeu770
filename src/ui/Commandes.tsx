import { useT } from '../i18n'

const LIGNES = ['deplacer', 'camera', 'zoom', 'courir', 'sauter', 'interagir', 'fermer', 'vue', 'journal', 'plan', 'programme', 'menu']

export function Commandes() {
  const t = useT()
  return (
    <table className="commandes">
      <tbody>
        {LIGNES.map((l) => (
          <tr key={l}>
            <td>
              <kbd>{t(`commandes.${l}Touches`)}</kbd>
            </td>
            <td>{t(`commandes.${l}`)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
