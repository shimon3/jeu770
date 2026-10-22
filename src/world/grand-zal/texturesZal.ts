import * as THREE from 'three'

function toile(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, g: c.getContext('2d')! }
}

function texture(c: HTMLCanvasElement, metres: number, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / metres, 1 / metres)
  t.anisotropy = 8
  return t
}

// Carrelage du Zal (COLlive 2025, photos 021, 026, 037) : carreaux crème
// d'environ 30 cm, losanges saumon espacés. Module de 2,4 m. Teintes et
// espacement ESTIMÉS.
export function textureCarrelage() {
  const { c, g } = toile(512, 512)
  const n = 8
  const p = 512 / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = 236 + ((i * 7 + j * 13) % 5) * 2
      g.fillStyle = `rgb(${v},${v - 14},${v - 34})`
      g.fillRect(i * p, j * p, p, p)
    }
  // Losange saumon au centre du module
  g.fillStyle = '#d99a7c'
  g.save()
  g.translate(256, 256)
  g.rotate(Math.PI / 4)
  g.fillRect(-p * 0.72, -p * 0.72, p * 1.44, p * 1.44)
  g.restore()
  // Carreau saumon plein aux angles du module
  g.fillStyle = '#e3ad8d'
  for (const [x, y] of [
    [0, 0],
    [7, 0],
    [0, 7],
    [7, 7],
  ])
    g.fillRect(x * p, y * p, p, p)
  // Joints
  g.strokeStyle = 'rgba(120,100,80,0.35)'
  g.lineWidth = 1.5
  for (let k = 0; k <= n; k++) {
    g.beginPath()
    g.moveTo(k * p, 0)
    g.lineTo(k * p, 512)
    g.moveTo(0, k * p)
    g.lineTo(512, k * p)
    g.stroke()
  }
  return texture(c, 2.4)
}

// Faux plafond à dalles de 60 cm (photos 2025)
export function texturePlafond() {
  const { c, g } = toile(256, 256)
  g.fillStyle = '#eeeae2'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 1500; i++) {
    g.fillStyle = `rgba(150,140,130,${Math.random() * 0.12})`
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }
  g.strokeStyle = '#c9c4ba'
  g.lineWidth = 5
  g.strokeRect(0, 0, 256, 256)
  return texture(c, 0.6)
}

// Lambris de bois foncé à rainures verticales (photos 2025, Commons 10)
export function textureLambris() {
  const { c, g } = toile(256, 256)
  for (let x = 0; x < 256; x++) {
    const v = 90 + Math.sin(x * 0.21) * 14 + Math.sin(x * 0.047) * 18 + Math.random() * 6
    g.fillStyle = `rgb(${v + 22},${v - 18},${v - 52})`
    g.fillRect(x, 0, 1, 256)
  }
  g.fillStyle = 'rgba(25,12,5,0.6)'
  for (const x of [0, 64, 128, 192]) g.fillRect(x, 0, 3, 256)
  return texture(c, 1.2)
}

// Lambris mural en planches verticales (references/selection :
// zal-wide-long-view, zal-wood-wall-gallery-windows, zal-wide-columns-ceiling) :
// planches de bois brun foncé brillant, largeurs et teintes variées, veinage
// marqué, joints sombres. Toile 1K couvrant 2,4 m, raccord sans couture.
// Largeur des planches et teintes ESTIMÉES d'après les photos.
export function textureLambrisPlanches() {
  const T = 1024
  const { c, g } = toile(T, T)
  let graine = 7
  const alea = () => {
    graine = (graine * 16807) % 2147483647
    return graine / 2147483647
  }
  // Largeurs de 12 à 22 cm, la dernière ajustée pour boucler sur 1024 px
  const pxM = T / 2.4
  const largeurs: number[] = []
  let total = 0
  while (total < T - 0.22 * pxM) {
    const w = Math.round((0.12 + alea() * 0.1) * pxM)
    largeurs.push(w)
    total += w
  }
  largeurs[largeurs.length - 1] += T - total
  let x0 = 0
  for (const w of largeurs) {
    // Teinte de base de la planche : brun-orangé verni (photos de la sélection)
    const r0 = 150 + alea() * 40
    const g0 = r0 * (0.52 + alea() * 0.07)
    const b0 = r0 * (0.26 + alea() * 0.06)
    const ph1 = alea() * 6.28
    const ph2 = alea() * 6.28
    for (let x = 0; x < w; x++) {
      // Veinage : bandes verticales ondulées (périodes multiples de la toile)
      const u = x / w
      const v = Math.sin(u * 18 + ph1) * 0.5 + Math.sin(u * 47 + ph2) * 0.25
      g.fillStyle = `rgb(${r0 + v * 16},${g0 + v * 10},${b0 + v * 6})`
      g.fillRect(x0 + x, 0, 1, T)
    }
    // Fils du bois plus sombres, légèrement ondulés, raccord vertical (période T)
    for (let k = 0; k < 9; k++) {
      const bx = x0 + alea() * w
      const amp = 1 + alea() * 4
      const per = [1, 2, 4][Math.floor(alea() * 3)]
      g.strokeStyle = `rgba(30,14,6,${0.12 + alea() * 0.2})`
      g.lineWidth = 0.6 + alea() * 1.4
      g.beginPath()
      for (let y = 0; y <= T; y += 8) {
        const xx = bx + Math.sin((y / T) * Math.PI * 2 * per + k) * amp
        if (y === 0) g.moveTo(xx, y)
        else g.lineTo(xx, y)
      }
      g.stroke()
    }
    // Joint sombre et léger reflet sur l'arête
    g.fillStyle = 'rgba(18,8,3,0.85)'
    g.fillRect(x0, 0, 3, T)
    g.fillStyle = 'rgba(255,220,180,0.08)'
    g.fillRect(x0 + 3, 0, 2, T)
    x0 += w
  }
  return texture(c, 2.4)
}

// Dos de livres (sefarim) pour les bibliothèques : couleurs génériques
export function textureLivres() {
  const { c, g } = toile(512, 256)
  g.fillStyle = '#2a1a10'
  g.fillRect(0, 0, 512, 256)
  const couleurs = ['#5a1717', '#1d2d4a', '#1c3b24', '#3a2a18', '#6b5420', '#222', '#4a1f3a']
  for (const [y0, h] of [
    [8, 112],
    [136, 112],
  ]) {
    let x = 0
    while (x < 512) {
      const w = 6 + Math.random() * 12
      const hh = h * (0.78 + Math.random() * 0.22)
      g.fillStyle = couleurs[(Math.random() * couleurs.length) | 0]
      g.fillRect(x, y0 + h - hh, w - 1, hh)
      g.fillStyle = 'rgba(220,190,110,0.7)'
      g.fillRect(x + 1, y0 + h - hh + 10, w - 3, 2)
      x += w
    }
  }
  const t = texture(c, 1)
  t.repeat.set(1, 1)
  return t
}

// Tapis de la place vide (Commons 10 : motifs persans rouge et bleu). Motif générique.
export function textureTapis() {
  const { c, g } = toile(256, 256)
  g.fillStyle = '#7a1e1e'
  g.fillRect(0, 0, 256, 256)
  g.strokeStyle = '#1f2b4a'
  g.lineWidth = 14
  g.strokeRect(12, 12, 232, 232)
  g.strokeStyle = '#d8c79a'
  g.lineWidth = 3
  g.strokeRect(26, 26, 204, 204)
  g.fillStyle = '#1f2b4a'
  g.beginPath()
  g.moveTo(128, 50)
  g.lineTo(206, 128)
  g.lineTo(128, 206)
  g.lineTo(50, 128)
  g.closePath()
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Marqueterie en chevrons des pilastres de l'Aron (COLlive 2025, photos 005, 016)
export function textureChevrons() {
  const { c, g } = toile(128, 256)
  g.fillStyle = '#b07a32'
  g.fillRect(0, 0, 128, 256)
  g.strokeStyle = '#7a4a18'
  g.lineWidth = 6
  for (let y = -64; y < 320; y += 22) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(64, y + 32)
    g.lineTo(128, y)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Inscription VÉRIFIÉE : relevée sur la banderole du Zal (COLlive, 13/10/2025,
// photo 036) et, à l'identique, sur le parokhet photographié en 2020
// (Commons 11). Aucun autre texte des banderoles n'est reproduit.
export const INSCRIPTION_BANDEROLE = 'יחי אדוננו מורנו ורבינו מלך המשיח לעולם ועד'

export function textureBanderole(texte: string) {
  const { c, g } = toile(2048, 192)
  g.fillStyle = '#f7f6f2'
  g.fillRect(0, 0, 2048, 192)
  g.fillStyle = '#111'
  g.font = 'bold 120px "Frank Ruhl Libre", "Heebo", serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.direction = 'rtl'
  g.fillText(texte, 1024, 100, 1960)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Panneau « EXIT » (Commons 9)
export function textureExit() {
  const { c, g } = toile(128, 48)
  g.fillStyle = '#1a1a1a'
  g.fillRect(0, 0, 128, 48)
  g.fillStyle = '#ff3b2f'
  g.font = 'bold 34px Inter, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('EXIT', 64, 26)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Cadran d'horloge sans chiffres lisibles inventés : graduations seules
export function textureHorloge() {
  const { c, g } = toile(128, 128)
  g.fillStyle = '#f5f2ea'
  g.beginPath()
  g.arc(64, 64, 62, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#222'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    g.lineWidth = i % 3 === 0 ? 5 : 2
    g.beginPath()
    g.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50)
    g.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58)
    g.stroke()
  }
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(64, 64)
  g.lineTo(64, 26)
  g.moveTo(64, 64)
  g.lineTo(92, 70)
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
