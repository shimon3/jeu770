import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

// Effets d'image (15/11/2026), chargés à part et seulement quand la qualité
// le permet (config/qualite.ts) :
// - occlusion ambiante : ombres douces dans les angles, sous les bancs, au
//   pied des murs (les objets ne « flottent » plus) ;
// - halo léger sur ce qui brille (lampes, pièces, balise de mission) ;
// - courbe de tons ACES (la même que sans effets) et vignette discrète.
export default function Effets() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO halfRes aoRadius={1.1} distanceFalloff={1} intensity={2.4} quality="medium" />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.42} />
    </EffectComposer>
  )
}
