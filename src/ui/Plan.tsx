import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { joueur } from '../state/store'
import { repereMission } from '../missions/guide'

// Plan du quartier (touche M) : vue de dessus du monde 3D, rendue par
// tools/captures/plan.mjs (aucune photo). Le point bleu suit le joueur, le
// losange doré montre la prochaine étape de mission.
// Cadrage de l'image : centre (CX, CZ) en mètres, hauteur couverte H_M.
const CX = 0
const CZ = 6
const H_M = 80.07
const RATIO = 1280 / 720

function versPlan(x: number, z: number) {
  const l = H_M * RATIO
  return { gauche: `${((x - CX) / l + 0.5) * 100}%`, haut: `${((z - CZ) / H_M + 0.5) * 100}%` }
}

export function Plan() {
  const t = useT()
  const [, setTic] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTic((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [])
  const j = versPlan(joueur.position[0], joueur.position[2])
  const r = repereMission()
  const c = r ? versPlan(r.x, r.z) : null
  return (
    <>
      <div className="plan" dir="ltr">
        <img src="/assets/plan.webp" alt={t('plan.titre')} width={1280} height={720} decoding="async" />
        {c && <span className="plan-cible" style={{ left: c.gauche, top: c.haut }} />}
        <span className="plan-joueur" style={{ left: j.gauche, top: j.haut }}>
          <span style={{ transform: `rotate(${-joueur.yaw}rad)` }} />
        </span>
      </div>
      <p className="plan-legende">
        <span className="plan-pastille joueur" /> {t('plan.vous')} <span className="plan-pastille cible" /> {t('plan.etape')}
      </p>
      <p className="source">{t('plan.note')}</p>
    </>
  )
}
