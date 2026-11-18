import { useMemo } from 'react'
import { useT } from '../i18n'

// « Mon appareil » (menu Échap, 18/11/2026) : de quoi savoir pourquoi le jeu
// est lent sur un appareil donné, et le dire à Samuel en une capture d'écran.
// Carte graphique (nom donné par le navigateur), cœurs du processeur,
// mémoire, écran, et images par seconde des 5 dernières secondes de jeu.
// Alerte si le navigateur dessine sans carte graphique (accélération
// matérielle coupée : SwiftShader, « Basic Render Driver », llvmpipe).

// Compteur d'images par seconde, lancé dès le chargement du module (coût nul)
const images: number[] = []
if (typeof window !== 'undefined') {
  const boucle = (t: number) => {
    images.push(t)
    while (images.length && t - images[0] > 5000) images.shift()
    requestAnimationFrame(boucle)
  }
  requestAnimationFrame(boucle)
}
// Mémorisé au moment où le menu s'ouvre (le jeu est alors en pause)
function ipsRecentes() {
  if (images.length < 2) return null
  return Math.round(((images.length - 1) * 1000) / (images[images.length - 1] - images[0]))
}

function carteGraphique(): string {
  try {
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return '—'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const nom = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return String(nom)
      .replace(/^ANGLE \((.*)\)$/, '$1')
      .replace(/ Direct3D.*$/, '')
      .replace(/\(0x[0-9A-Fa-f]+\)/g, '')
      .trim()
  } catch {
    return '—'
  }
}

export function InfosAppareil() {
  const t = useT()
  const infos = useMemo(() => {
    const gpu = carteGraphique()
    const nav = navigator as Navigator & { deviceMemory?: number }
    return {
      gpu,
      logiciel: /swiftshader|basic render|llvmpipe|software/i.test(gpu),
      coeurs: nav.hardwareConcurrency || null,
      memoire: nav.deviceMemory || null,
      ecran: `${Math.round(screen.width * devicePixelRatio)} × ${Math.round(screen.height * devicePixelRatio)}`,
      ips: ipsRecentes(),
    }
  }, [])
  return (
    <details className="infos-appareil">
      <summary>{t('appareil.titre')}</summary>
      {infos.logiciel && <p className="alerte">{t('appareil.sansCarte')}</p>}
      <dl>
        <dt>{t('appareil.carte')}</dt>
        <dd>{infos.gpu}</dd>
        <dt>{t('appareil.coeurs')}</dt>
        <dd>{infos.coeurs ?? '—'}</dd>
        <dt>{t('appareil.memoire')}</dt>
        <dd>{infos.memoire ? `${infos.memoire} Go${infos.memoire >= 8 ? '+' : ''}` : '—'}</dd>
        <dt>{t('appareil.ecran')}</dt>
        <dd dir="ltr">{infos.ecran}</dd>
        <dt>{t('appareil.ips')}</dt>
        <dd>{infos.ips ?? '—'}</dd>
      </dl>
      <p className="source">{t('appareil.conseil')}</p>
    </details>
  )
}
