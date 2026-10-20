// Ambiance sonore procédurale (aucun fichier audio) : rumeur de la ville,
// atténuée à l'intérieur et dans les lieux de calme.
let ctx: AudioContext | null = null
let gain: GainNode | null = null

export function demarrerAmbiance() {
  if (ctx) {
    void ctx.resume()
    return
  }
  try {
    ctx = new AudioContext()
    const duree = 4
    const tampon = ctx.createBuffer(1, ctx.sampleRate * duree, ctx.sampleRate)
    const d = tampon.getChannelData(0)
    // Bruit brun : rumeur grave de circulation
    let dernier = 0
    for (let i = 0; i < d.length; i++) {
      const blanc = Math.random() * 2 - 1
      dernier = (dernier + 0.02 * blanc) / 1.02
      d[i] = dernier * 3.5
    }
    const source = ctx.createBufferSource()
    source.buffer = tampon
    source.loop = true
    const filtre = ctx.createBiquadFilter()
    filtre.type = 'lowpass'
    filtre.frequency.value = 600
    gain = ctx.createGain()
    gain.gain.value = 0
    source.connect(filtre).connect(gain).connect(ctx.destination)
    source.start()
  } catch {
    ctx = null
  }
}

export function reglerAmbiance(actif: boolean, interieur: boolean, calme: boolean) {
  if (!ctx || !gain) return
  const cible = !actif ? 0 : calme ? 0.03 : interieur ? 0.06 : 0.22
  gain.gain.setTargetAtTime(cible, ctx.currentTime, 0.4)
}
