import { conduite } from '../world/rue/conduite'
import { useGame } from '../state/store'
import { evenementMission } from '../missions/missions'
import { fermerPorteProche } from '../world/Porte'
import { basculerHautParleur, klaxonner } from '../audio/vehicule'

export const ID_TANK = 'mitzvah-tank'

// Actions de jeu partagées par le clavier (App.tsx) et les boutons tactiles
// (ControlesTactiles.tsx).
export type Action = 'e' | 'v' | 'j' | 'm' | 'p' | 'f' | 'h' | 'n'

export function actionJeu(a: Action) {
  const st = useGame.getState()
  if (st.ecran !== 'jeu' || st.pause) return
  if (a === 'e') {
    if (st.panneau) st.set({ panneau: null })
    else if (st.siege) st.set({ siege: null })
    else if (conduite.active && conduite.descendre) conduite.descendre()
    else if (st.cible) {
      const id = st.cible
      st.interactifs.get(id)?.action()
      // Toute interaction peut valider une étape « interagir » (sans effet si
      // l'objet l'a déjà signalée lui-même)
      evenementMission('interagir', id)
    }
  } else if (a === 'v') {
    st.set({ vue: st.vue === '3e' ? '1re' : '3e' })
  } else if (a === 'j') {
    st.set({ panneau: st.panneau?.type === 'journal' ? null : { type: 'journal' } })
  } else if (a === 'm') {
    st.set({ panneau: st.panneau?.type === 'plan' ? null : { type: 'plan' } })
  } else if (a === 'p') {
    st.set({ panneau: { type: 'message', cle: 'bientot.programme' } })
  } else if (a === 'f') {
    fermerPorteProche()
  } else if (a === 'h') {
    // Klaxon, seulement au volant
    if (conduite.active && st.son) klaxonner(conduite.vehicule === ID_TANK)
  } else if (a === 'n') {
    // Haut-parleur du Mitzvah Tank : se commande depuis le tank
    if (conduite.active && conduite.vehicule === ID_TANK) {
      const allume = basculerHautParleur()
      st.notifier(allume ? 'tank.hpOn' : 'tank.hpOff')
    }
  }
}
