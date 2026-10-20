import { useGame } from '../state/store'
import { fermerPorteProche } from '../world/Porte'

// Actions de jeu partagées par le clavier (App.tsx) et les boutons tactiles
// (ControlesTactiles.tsx).
export type Action = 'e' | 'v' | 'j' | 'm' | 'p' | 'f'

export function actionJeu(a: Action) {
  const st = useGame.getState()
  if (st.ecran !== 'jeu' || st.pause) return
  if (a === 'e') {
    if (st.panneau) st.set({ panneau: null })
    else if (st.siege) st.set({ siege: null })
    else if (st.cible) st.interactifs.get(st.cible)?.action()
  } else if (a === 'v') {
    st.set({ vue: st.vue === '3e' ? '1re' : '3e' })
  } else if (a === 'j') {
    st.set({ panneau: st.panneau?.type === 'journal' ? null : { type: 'journal' } })
  } else if (a === 'm') {
    st.set({ panneau: { type: 'message', cle: 'bientot.plan' } })
  } else if (a === 'p') {
    st.set({ panneau: { type: 'message', cle: 'bientot.programme' } })
  } else if (a === 'f') {
    fermerPorteProche()
  }
}
