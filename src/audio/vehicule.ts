import { contexteAudio } from './ambiance'

// Sons des véhicules, tous procéduraux (aucun fichier audio) :
// - moteur : dent de scie filtrée dont la hauteur suit la vitesse ;
// - klaxon : deux notes carrées brèves ;
// - haut-parleur du Mitzvah Tank : « Haneshama Yoredet », enregistrement de
//   Shmouel Bentouza (Samuel, auteur du jeu, 15/11/2026), passé dans un filtre
//   « mégaphone ». Si le fichier ne se charge pas, la mélodie de secours
//   (composée pour le jeu, mode freygish sur ré) est jouée à la place.

const URL_NIGGOUN = '/audio/haneshama-yoredet.mp3'
let tamponNiggoun: AudioBuffer | null = null
let chargement: Promise<AudioBuffer | null> | null = null

function chargerNiggoun(ctx: AudioContext) {
  chargement ??= fetch(URL_NIGGOUN)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((b) => ctx.decodeAudioData(b))
    .then((t) => (tamponNiggoun = t))
    .catch(() => {
      chargement = null // on réessaiera au prochain allumage
      return null
    })
  return chargement
}

// --- Moteur ---
let moteur: { osc: OscillatorNode; osc2: OscillatorNode; filtre: BiquadFilterNode; gain: GainNode } | null = null

function creerMoteur(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  const osc2 = ctx.createOscillator()
  osc2.type = 'square'
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 400
  const gain = ctx.createGain()
  gain.gain.value = 0
  const g2 = ctx.createGain()
  g2.gain.value = 0.35
  osc.connect(filtre)
  osc2.connect(g2).connect(filtre)
  filtre.connect(gain).connect(ctx.destination)
  osc.start()
  osc2.start()
  return { osc, osc2, filtre, gain }
}

// tank : moteur plus grave. vitesse en m/s ; actif = false coupe le son.
export function reglerMoteur(actif: boolean, vitesse: number, tank: boolean) {
  const ctx = contexteAudio()
  if (!ctx) return
  if (!moteur) {
    if (!actif) return
    moteur = creerMoteur(ctx)
  }
  const now = ctx.currentTime
  const v = Math.abs(vitesse)
  const base = tank ? 32 : 46
  const f = base + v * (tank ? 6 : 9)
  moteur.osc.frequency.setTargetAtTime(f, now, 0.08)
  moteur.osc2.frequency.setTargetAtTime(f * 0.5, now, 0.08)
  moteur.filtre.frequency.setTargetAtTime(300 + v * 120, now, 0.1)
  moteur.gain.gain.setTargetAtTime(actif ? 0.05 + Math.min(v / 10, 1) * 0.07 : 0, now, 0.15)
}

// --- Klaxon ---
let dernierKlaxon = 0
export function klaxonner(tank: boolean) {
  const ctx = contexteAudio()
  if (!ctx) return
  const now = ctx.currentTime
  if (now - dernierKlaxon < 0.35) return
  dernierKlaxon = now
  const gain = ctx.createGain()
  const filtre = ctx.createBiquadFilter()
  filtre.type = 'lowpass'
  filtre.frequency.value = 2200
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
  gain.gain.setValueAtTime(0.12, now + 0.38)
  gain.gain.linearRampToValueAtTime(0, now + 0.45)
  filtre.connect(gain).connect(ctx.destination)
  for (const f of tank ? [330, 415] : [440, 554]) {
    const o = ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = f
    o.connect(filtre)
    o.start(now)
    o.stop(now + 0.5)
  }
}

// --- Haut-parleur du Mitzvah Tank ---
// Mélodie originale : [note MIDI ou 0 = silence, durée en temps]
// Ré freygish : ré mi♭ fa♯ sol la si♭ do
const D = 62, Eb = 63, Fd = 66, G = 67, A = 69, Bb = 70, C = 72, D5 = 74
const MELODIE: [number, number][] = [
  [A, 1], [Bb, 0.5], [A, 0.5], [G, 0.5], [Fd, 0.5], [G, 1], [A, 2],
  [D5, 1], [C, 0.5], [Bb, 0.5], [A, 1], [G, 1], [Fd, 0.5], [G, 0.5], [A, 2],
  [Fd, 1], [Eb, 0.5], [D, 0.5], [Fd, 1], [G, 1], [A, 0.5], [Bb, 0.5], [A, 0.5], [G, 0.5], [Fd, 2],
  [G, 0.5], [Fd, 0.5], [Eb, 1], [D, 2], [0, 1],
]
const TEMPO = 132 // temps par minute
const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

let hp: { sortie: GainNode; entree: AudioNode; minuterie: number; prochain: number; index: number; temps: number; source: AudioBufferSourceNode | null } | null = null

function distorsion(ctx: AudioContext) {
  const w = ctx.createWaveShaper()
  const n = 256
  const courbe = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    courbe[i] = Math.tanh(x * 2.5)
  }
  w.curve = courbe
  return w
}

function jouerNote(ctx: AudioContext, entree: AudioNode, f: number, t0: number, duree: number, volume: number, type: OscillatorType) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.value = f
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(volume, t0 + 0.02)
  g.gain.setTargetAtTime(volume * 0.6, t0 + 0.05, 0.1)
  g.gain.setTargetAtTime(0, t0 + duree * 0.9, 0.04)
  o.connect(g).connect(entree)
  o.start(t0)
  o.stop(t0 + duree + 0.2)
}

export function hautParleurActif() {
  return hp !== null
}

export function basculerHautParleur(): boolean {
  const ctx = contexteAudio()
  if (!ctx) return false
  if (hp) {
    arreterHautParleur()
    return false
  }
  // Chaîne « mégaphone » : coupe les graves et les aigus, légère saturation
  const passe = ctx.createBiquadFilter()
  passe.type = 'highpass'
  passe.frequency.value = 280
  const passeHaut = ctx.createBiquadFilter()
  passeHaut.type = 'lowpass'
  passeHaut.frequency.value = 4200
  const bosse = ctx.createBiquadFilter()
  bosse.type = 'peaking'
  bosse.frequency.value = 1600
  bosse.gain.value = 5
  const sat = distorsion(ctx)
  const sortie = ctx.createGain()
  sortie.gain.value = 0
  passe.connect(passeHaut).connect(bosse).connect(sat).connect(sortie).connect(ctx.destination)
  const etat = { sortie, entree: passe as AudioNode, minuterie: 0, prochain: ctx.currentTime + 0.1, index: 0, temps: 0, source: null as AudioBufferSourceNode | null }
  hp = etat
  // L'enregistrement de Samuel, en boucle, dès qu'il est chargé
  const jouerEnregistrement = (t: AudioBuffer) => {
    if (hp !== etat) return
    const src = ctx.createBufferSource()
    src.buffer = t
    src.loop = true
    const g = ctx.createGain()
    g.gain.value = 0.9
    src.connect(g).connect(passe)
    src.start()
    etat.source = src
  }
  if (tamponNiggoun) {
    jouerEnregistrement(tamponNiggoun)
    return true
  }
  // Pas encore chargé : on attend ; en cas d'échec, mélodie de secours
  void chargerNiggoun(ctx).then((t) => {
    if (hp !== etat) return
    if (t) jouerEnregistrement(t)
    else melodieSecours(ctx, etat)
  })
  return true
}

function melodieSecours(ctx: AudioContext, etat: NonNullable<typeof hp>) {
  const passe = etat.entree
  etat.prochain = ctx.currentTime + 0.1
  const tempsS = 60 / TEMPO
  // Planification avec un peu d'avance, comme un séquenceur
  etat.minuterie = window.setInterval(() => {
    while (etat.prochain < ctx.currentTime + 0.3) {
      const [m, d] = MELODIE[etat.index]
      const duree = d * tempsS
      if (m) jouerNote(ctx, passe, freq(m), etat.prochain, duree, 0.22, 'triangle')
      // Basse sur chaque temps : ré / la alternés
      const finTemps = etat.temps + d
      for (let b = Math.ceil(etat.temps - 1e-6); b < finTemps - 1e-6; b++) {
        const tb = etat.prochain + (b - etat.temps) * tempsS
        jouerNote(ctx, passe, freq(b % 2 === 0 ? 50 : 45), tb, tempsS * 0.5, 0.16, 'sawtooth')
      }
      etat.temps = finTemps
      etat.prochain += duree
      etat.index = (etat.index + 1) % MELODIE.length
    }
  }, 80)
}

// Précharger l'enregistrement en montant dans le tank : il démarre aussitôt
export function prechargerNiggoun() {
  const ctx = contexteAudio()
  if (ctx && !tamponNiggoun) void chargerNiggoun(ctx)
}

export function arreterHautParleur() {
  const ctx = contexteAudio()
  if (!hp) return
  window.clearInterval(hp.minuterie)
  const src = hp.source
  const s = hp.sortie
  if (ctx) {
    s.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
    window.setTimeout(() => {
      try {
        src?.stop()
      } catch {
        // déjà arrêtée
      }
      s.disconnect()
    }, 400)
  }
  hp = null
}

// Volume selon la distance entre le joueur et le tank (m) ; muet = son coupé
export function reglerHautParleur(distance: number, muet: boolean) {
  const ctx = contexteAudio()
  if (!ctx || !hp) return
  const v = muet ? 0 : 0.5 / (1 + Math.max(0, distance - 3) * 0.12)
  hp.sortie.gain.setTargetAtTime(v, ctx.currentTime, 0.15)
}
