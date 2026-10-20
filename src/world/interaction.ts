import { useEffect, useRef } from 'react'
import type { Vector3Tuple } from 'three'
import { useGame } from '../state/store'

// Déclare un objet interactif (touche E). `label` et `action` sont relus à
// chaque appel via une ref : pas besoin de ré-enregistrer à chaque rendu.
export function useInteractif(
  id: string,
  position: Vector3Tuple,
  rayon: number,
  label: () => string,
  action: () => void,
) {
  const ref = useRef({ label, action })
  ref.current = { label, action }
  const [x, y, z] = position
  useEffect(() => {
    const { enregistrer, retirer } = useGame.getState()
    enregistrer({
      id,
      position: [x, y, z],
      rayon,
      labelCle: () => ref.current.label(),
      action: () => ref.current.action(),
    })
    return () => retirer(id)
  }, [id, x, y, z, rayon])
}
