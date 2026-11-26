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

// Carrelage du Zal, refait d'après les photos anash.org fournies par Samuel
// (26/11/2026) : grand champ de carreaux crème, larges bandes saumon-orangé
// bordées de filets blancs qui dessinent de grands cadres, et carrés
// terracotta foncés posés dans le champ crème. Module de 4,8 m ; teintes
// relevées sur les photos, cotes ESTIMÉES. Aucune photo n'est plaquée.
export function textureCarrelage() {
  const { c, g } = toile(1024, 1024)
  const M = 4.8 // module en mètres
  const px = (m: number) => (m / M) * c.width
  // Champ crème, carreaux de 30 cm légèrement nuancés
  const n = 16
  const p = c.width / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = ((i * 7 + j * 13) % 5) * 2
      g.fillStyle = `rgb(${240 - v},${224 - v},${200 - v})`
      g.fillRect(i * p, j * p, p, p)
    }
  // Bandes saumon de 60 cm sur les bords du module (cadre), filets blancs
  const bande = px(0.6)
  const filet = px(0.08)
  g.fillStyle = '#f7f3ea'
  g.fillRect(0, 0, c.width, bande + 2 * filet)
  g.fillRect(0, 0, bande + 2 * filet, c.height)
  g.fillStyle = '#dc9a68'
  g.fillRect(0, filet, c.width, bande)
  g.fillRect(filet, 0, bande, c.height)
  // Carrés terracotta foncés : un au croisement des bandes, deux dans le
  // champ crème, sur l'axe du module (photos 2026)
  g.fillStyle = '#b4613f'
  g.fillRect(filet, filet, bande, bande)
  const k = px(0.9)
  for (const [cx, cy] of [
    [2.7, 1.7],
    [2.7, 3.7],
  ])
    g.fillRect(px(cx) - k / 2, px(cy) - k / 2, k, k)
  // Joints fins
  g.strokeStyle = 'rgba(150,120,95,0.28)'
  g.lineWidth = 1.2
  for (let q = 0; q <= n; q++) {
    g.beginPath()
    g.moveTo(q * p, 0)
    g.lineTo(q * p, c.height)
    g.moveTo(0, q * p)
    g.lineTo(c.width, q * p)
    g.stroke()
  }
  return texture(c, M)
}

// Marqueterie en losanges de l'amud (photo anash.org de l'Aron, 2026)
export function textureDamierAmud() {
  const { c, g } = toile(128, 128)
  g.fillStyle = '#a8743a'
  g.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = i * 32 + 16
      const y = j * 32 + 16
      g.fillStyle = (i + j) % 2 ? '#d9ad6a' : '#7a4a1e'
      g.beginPath()
      g.moveTo(x, y - 14)
      g.lineTo(x + 14, y)
      g.lineTo(x, y + 14)
      g.lineTo(x - 14, y)
      g.closePath()
      g.fill()
    }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
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

// Lambris à lattes verticales, bois doré à veinage marqué (photos
// anash.org 2026 : mur latéral et gradins habillés de lattes de 10 cm).
export function textureLambris() {
  const { c, g } = toile(256, 256)
  const latte = 21 // ≈ 10 cm pour 1,2 m
  for (let x = 0; x < 256; x++) {
    const k = Math.floor(x / latte)
    const base = 120 + ((k * 37) % 5) * 9
    const v = base + Math.sin(x * 0.9 + k) * 6 + Math.sin(x * 0.13) * 8 + Math.random() * 5
    g.fillStyle = `rgb(${v + 38},${v - 2},${v - 48})`
    g.fillRect(x, 0, 1, 256)
  }
  // Veinage horizontal léger
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(70,35,10,${Math.random() * 0.12})`
    g.fillRect(Math.random() * 256, Math.random() * 256, 6 + Math.random() * 14, 1)
  }
  g.fillStyle = 'rgba(40,18,6,0.7)'
  for (let x = 0; x < 256; x += latte) g.fillRect(x, 0, 2, 256)
  return texture(c, 1.2)
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
