import * as THREE from 'three'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, g: c.getContext('2d')! }
}

function finaliser(c: HTMLCanvasElement, srgb = true) {
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.anisotropy = 8
  return tex
}

// Verre au plomb en losanges (confirmé sur les fenêtres : Commons 2, 3, 4).
// Les motifs de voiliers des vitraux ne sont PAS reproduits (non relevés).
export function textureLosanges() {
  const { c, g } = canvas(256, 256)
  g.fillStyle = '#7d8f99'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(${200 + Math.random() * 55},${200 + Math.random() * 55},${210 + Math.random() * 45},0.07)`
    g.fillRect(Math.random() * 256, Math.random() * 256, 30, 30)
  }
  g.strokeStyle = '#2a2a2a'
  g.lineWidth = 4
  const pas = 64
  for (let k = -256; k <= 512; k += pas) {
    g.beginPath()
    g.moveTo(k, 0)
    g.lineTo(k + 256, 256)
    g.stroke()
    g.beginPath()
    g.moveTo(k, 256)
    g.lineTo(k + 256, 0)
    g.stroke()
  }
  const tex = finaliser(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2.2, 3.2)
  return tex
}

// Sol moucheté (type granito), vu dans le couloir du rez-de-chaussée
// (anash.org 2021). Teinte ESTIMÉE.
export function textureMouchetee() {
  const { c, g } = canvas(512, 512)
  g.fillStyle = '#6f6660'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 9000; i++) {
    const v = Math.random()
    g.fillStyle = v < 0.5 ? '#8a817a' : v < 0.8 ? '#4f4844' : '#b5ada5'
    const r = Math.random() * 2.2 + 0.4
    g.beginPath()
    g.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2)
    g.fill()
  }
  const tex = finaliser(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(0.5, 0.5)
  return tex
}

// Inscription gravée sous l'oriel. Texte relevé sur les photos Commons 3 et 4.
export function textureInscription() {
  const { c, g } = canvas(1024, 512)
  g.fillStyle = '#d9cdb2'
  g.fillRect(0, 0, 1024, 512)
  g.fillStyle = '#2b2620'
  g.textAlign = 'center'
  g.font = 'bold 54px "Frank Ruhl Libre", "Heebo", serif'
  g.direction = 'rtl'
  g.fillText('בית אגודת חסידי חב"ד', 512, 92)
  g.fillText('אהל יוסף יצחק ליובאוויטש', 512, 160)
  g.direction = 'ltr'
  g.font = 'bold 44px "Inter", sans-serif'
  g.fillText('BEIS AGUDAS CHASIDEI CHABAD', 512, 270)
  g.font = 'bold 36px "Inter", sans-serif'
  g.fillText('OHEL YOSSEF YITZCHOK', 512, 340)
  g.font = 'bold 44px "Inter", sans-serif'
  g.fillText('LUBAVITCH', 512, 420)
  return finaliser(c)
}

// Relief de la frise de l'encadrement de porte (feuillages et grappes sur
// Commons 3). Motif générique ESTIMÉ, pas un relevé.
export function textureFrise() {
  const { c, g } = canvas(512, 128)
  g.fillStyle = '#000'
  g.fillRect(0, 0, 512, 128)
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 512
    const y = 20 + Math.random() * 88
    const r = 6 + Math.random() * 12
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, '#fff')
    grad.addColorStop(1, '#000')
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  return finaliser(c, false)
}

// Texte sur un panneau (lisible en 3D, ex. « 770 » sur la façade)
export function textureTexte(texte: string, w = 256, h = 128, fond = '#d9cdb2', encre = '#2b2620', police = 'bold 72px serif') {
  const { c, g } = canvas(w, h)
  g.fillStyle = fond
  g.fillRect(0, 0, w, h)
  g.fillStyle = encre
  g.font = police
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(texte, w / 2, h / 2)
  return finaliser(c)
}

// Bandeau de texte sur plusieurs lignes (flancs des bus, enseignes). Texte
// seulement : aucune image de personne.
export function textureBandeau(lignes: { texte: string; police: string; encre?: string }[], w = 1024, h = 256, fond = '#f2c200', encre = '#14213d') {
  const { c, g } = canvas(w, h)
  g.fillStyle = fond
  g.fillRect(0, 0, w, h)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  lignes.forEach((l, i) => {
    g.fillStyle = l.encre ?? encre
    g.font = l.police
    g.fillText(l.texte, w / 2, (h * (i + 0.5)) / lignes.length, w * 0.94)
  })
  return finaliser(c)
}

// ---------------------------------------------------------------------------
// Heichal du grand Zal (photo fournie par Samuel, 12/11/2026) : parokhet de
// velours bordeaux « כתר תורה » (couronne, livre ouvert, deux colonnes,
// couronne de laurier), cantonnière « יחי אדוננו… », bois marqueté.
// La dédicace brodée (noms de défunts) n'est PAS reproduite : lignes dorées
// décoratives à la place.

const OR = '#d9b25a'
const OR_CLAIR = '#f0d48a'

function velours(g: CanvasRenderingContext2D, w: number, h: number) {
  const d = g.createLinearGradient(0, 0, w, 0)
  d.addColorStop(0, '#4a0a12')
  d.addColorStop(0.5, '#741624')
  d.addColorStop(1, '#4a0a12')
  g.fillStyle = d
  g.fillRect(0, 0, w, h)
  // Plis verticaux
  for (let x = 0; x < w; x += 22) {
    g.fillStyle = `rgba(0,0,0,${0.06 + 0.06 * Math.sin(x * 0.11)})`
    g.fillRect(x, 0, 9, h)
  }
}

function etoile(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.fillStyle = OR
  g.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8
    const rr = i % 2 ? r * 0.45 : r
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  g.closePath()
  g.fill()
}

export function textureParokhet() {
  const W = 512
  const H = 768
  const { c, g } = canvas(W, H)
  velours(g, W, H)
  // Galons dorés verticaux et bordure
  g.fillStyle = OR
  for (const x of [70, W - 76]) g.fillRect(x, 0, 6, H)
  g.fillRect(0, H - 26, W, 10)
  // Petites rosaces dorées sur les côtés
  for (let y = 70; y < H - 60; y += 95) {
    etoile(g, 36, y, 10)
    etoile(g, W - 36, y, 10)
  }
  for (const [x, y] of [[120, 236], [W - 120, 236], [120, 330], [W - 120, 330], [120, 520], [W - 120, 520]]) etoile(g, x, y, 8)
  // Couronne
  const cx = W / 2
  g.fillStyle = OR_CLAIR
  g.beginPath()
  g.moveTo(cx - 50, 175)
  g.lineTo(cx - 58, 120)
  g.lineTo(cx - 28, 148)
  g.lineTo(cx, 108)
  g.lineTo(cx + 28, 148)
  g.lineTo(cx + 58, 120)
  g.lineTo(cx + 50, 175)
  g.closePath()
  g.fill()
  g.fillStyle = '#b8323c'
  for (const dx of [-30, 0, 30]) {
    g.beginPath()
    g.arc(cx + dx, 160, 6, 0, Math.PI * 2)
    g.fill()
  }
  // « כתר תורה »
  g.fillStyle = OR
  g.textAlign = 'center'
  g.direction = 'rtl'
  g.font = 'bold 54px "Frank Ruhl Libre", "Heebo", serif'
  g.fillText('כתר         תורה', cx, 160)
  // Deux colonnes torsadées
  for (const x of [cx - 120, cx + 120]) {
    g.fillStyle = OR
    g.fillRect(x - 11, 225, 22, 230)
    g.fillStyle = '#9a7a30'
    for (let y = 232; y < 450; y += 20) g.fillRect(x - 11, y, 22, 5)
    g.fillStyle = OR_CLAIR
    g.beginPath()
    g.arc(x, 214, 16, 0, Math.PI * 2)
    g.fill()
  }
  // Livre ouvert (tables de la Torah)
  g.fillStyle = OR_CLAIR
  g.fillRect(cx - 62, 260, 124, 100)
  g.strokeStyle = '#8a6a26'
  g.lineWidth = 3
  g.strokeRect(cx - 62, 260, 124, 100)
  g.beginPath()
  g.moveTo(cx, 260)
  g.lineTo(cx, 360)
  g.stroke()
  g.lineWidth = 2
  for (let y = 275; y < 352; y += 12) {
    g.beginPath()
    g.moveTo(cx - 54, y)
    g.lineTo(cx - 8, y)
    g.moveTo(cx + 8, y)
    g.lineTo(cx + 54, y)
    g.stroke()
  }
  // Volute sous le livre
  g.strokeStyle = OR
  g.lineWidth = 4
  g.beginPath()
  g.moveTo(cx - 60, 385)
  g.bezierCurveTo(cx - 20, 405, cx + 20, 365, cx + 60, 385)
  g.stroke()
  // Dédicace : lignes dorées décoratives (texte non reproduit)
  g.fillStyle = 'rgba(217,178,90,0.75)'
  for (let i = 0; i < 6; i++) {
    const w = 170 - Math.abs(i - 2.5) * 22
    g.fillRect(cx - w / 2, 420 + i * 22, w, 5)
  }
  // Couronne de laurier
  g.strokeStyle = OR
  g.lineWidth = 5
  g.beginPath()
  g.arc(cx, 520, 120, Math.PI * 0.15, Math.PI * 0.85)
  g.stroke()
  g.fillStyle = '#6f8f3a'
  for (let a = 0.2; a < 0.82; a += 0.06) {
    for (const s of [-1, 1]) {
      const ang = Math.PI * (0.5 + s * (a - 0.5))
      const x = cx + Math.cos(ang) * 120
      const y = 520 + Math.sin(ang) * 120
      g.beginPath()
      g.ellipse(x, y, 10, 4, ang + Math.PI / 4, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.fillStyle = '#b8323c'
  g.beginPath()
  g.arc(cx, 642, 9, 0, Math.PI * 2)
  g.fill()
  return finaliser(c)
}

export function textureCantonniere() {
  const W = 1024
  const H = 128
  const { c, g } = canvas(W, H)
  velours(g, W, H)
  g.fillStyle = OR
  g.fillRect(0, 6, W, 5)
  g.fillRect(0, H - 34, W, 4)
  // Festons et frange
  for (let x = 0; x < W; x += 64) {
    g.beginPath()
    g.arc(x + 32, H - 30, 32, 0, Math.PI)
    g.fillStyle = '#5c0d18'
    g.fill()
  }
  g.fillStyle = OR
  for (let x = 0; x < W; x += 6) g.fillRect(x, H - 14, 3, 14)
  g.textAlign = 'center'
  g.direction = 'rtl'
  g.font = 'bold 40px "Frank Ruhl Libre", "Heebo", serif'
  g.fillText('יחי אדוננו מורנו ורבינו מלך המשיח לעולם ועד', W / 2, 64)
  for (const x of [60, W - 60]) etoile(g, x, 52, 12)
  return finaliser(c)
}

// Marqueterie en damier (bas des pilastres et du socle)
export function textureDamier() {
  const { c, g } = canvas(256, 256)
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      g.fillStyle = (x + y) % 2 ? '#a8783e' : '#5a3218'
      g.fillRect(x * 32, y * 32, 32, 32)
    }
  g.strokeStyle = '#3a2010'
  g.lineWidth = 2
  for (let i = 0; i <= 8; i++) {
    g.beginPath()
    g.moveTo(i * 32, 0)
    g.lineTo(i * 32, 256)
    g.moveTo(0, i * 32)
    g.lineTo(256, i * 32)
    g.stroke()
  }
  const tex = finaliser(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// Rayons marquetés du fronton (« soleil » de lattes claires et foncées)
export function textureRayons() {
  const { c, g } = canvas(512, 256)
  g.fillStyle = '#5a3218'
  g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 24; i++) {
    const a0 = Math.PI + (i * Math.PI) / 24
    const a1 = Math.PI + ((i + 1) * Math.PI) / 24
    g.fillStyle = i % 2 ? '#c69a5a' : '#7a4a22'
    g.beginPath()
    g.moveTo(256, 256)
    g.lineTo(256 + Math.cos(a0) * 400, 256 + Math.sin(a0) * 400)
    g.lineTo(256 + Math.cos(a1) * 400, 256 + Math.sin(a1) * 400)
    g.closePath()
    g.fill()
  }
  return finaliser(c)
}

// Pierre angulaire de l'entrée du Zal (photo fournie par Samuel, 12/11/2026)
export function texturePierreAngulaire() {
  const W = 512
  const H = 512
  const { c, g } = canvas(W, H)
  g.fillStyle = '#6d6a66'
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(30,28,26,0.35)' : 'rgba(200,196,190,0.25)'
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2)
  }
  g.fillStyle = '#1c1a18'
  g.textAlign = 'center'
  g.direction = 'rtl'
  g.font = 'bold 64px "Frank Ruhl Libre", "Heebo", serif'
  g.fillText('אבן הפינה', W / 2, 110)
  g.direction = 'ltr'
  g.font = '44px "Inter", serif'
  g.fillText('THE CORNERSTONE', W / 2, 175)
  // Médaillon ovale encastré
  g.strokeStyle = '#1c1a18'
  g.lineWidth = 5
  g.beginPath()
  g.ellipse(W / 2, 340, 150, 105, 0, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#3c3936'
  g.beginPath()
  g.ellipse(W / 2, 345, 132, 88, 0, 0, Math.PI * 2)
  g.fill()
  return finaliser(c)
}

// ---------------------------------------------------------------------------
// Flanc du Mitzvah Tank turquoise (photos de Samuel, 12/11/2026) : rangée
// d'icônes des mitsvot, bandeau « LET'S WELCOME MOSHIACH », vague jaune,
// bas de caisse rouge. RÈGLE ABSOLUE : le portrait du Rebbe présent sur les
// photos n'est PAS reproduit ; un encadré de texte le remplace.
const TURQUOISE = '#58bfcb'
export function textureFlancTank() {
  const w = 2048
  const h = 860
  const { c, g } = canvas(w, h)
  g.fillStyle = TURQUOISE
  g.fillRect(0, 0, w, h)
  // Bas de caisse rouge et vague jaune
  g.fillStyle = '#c7262c'
  g.fillRect(0, h - 120, w, 120)
  g.fillStyle = '#f5cf1f'
  g.beginPath()
  g.moveTo(0, h - 120)
  g.bezierCurveTo(w * 0.3, h - 260, w * 0.55, h - 60, w, h - 220)
  g.lineTo(w, h - 120)
  g.closePath()
  g.fill()
  // Verset en haut
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `bold 40px ${'"Heebo", "Arial Hebrew", sans-serif'}`
  g.fillText('יחי אדוננו מורנו ורבינו מלך המשיח לעולם ועד', w / 2, 34, w * 0.9)
  // Rangée d'icônes des mitsvot (pastilles blanches cerclées de couleur)
  const icones = ['✡', 'א', '🕯', '📜', '₪', '🍷', '🍞', '❤', '📖', '🏠', '💧']
  const couleurs = ['#c7262c', '#2f8f46', '#f2a516', '#2b5fae', '#7a3fa0', '#c7262c', '#2f8f46', '#e2457a', '#2b5fae', '#f2a516', '#1d8fbf']
  icones.forEach((ic, i) => {
    const x = 150 + i * 160
    g.fillStyle = couleurs[i]
    g.beginPath()
    g.arc(x, 130, 62, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(x, 130, 50, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = couleurs[i]
    g.font = 'bold 54px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    g.fillText(ic, x, 134)
  })
  // Bandeau sombre « pinceau » avec le slogan
  g.fillStyle = '#163a5c'
  g.beginPath()
  g.moveTo(160, 230)
  g.lineTo(1500, 220)
  g.lineTo(1530, 460)
  g.lineTo(140, 470)
  g.closePath()
  g.fill()
  g.fillStyle = '#ffffff'
  g.font = `bold 92px ${'"Inter", Arial, sans-serif'}`
  g.fillText("LET'S WELCOME MOSHIACH", 840, 290, 1300)
  g.fillStyle = '#f5cf1f'
  g.font = `bold 76px ${'"Inter", Arial, sans-serif'}`
  g.fillText('WITH ACTS OF GOODNESS AND KINDNESS!', 840, 400, 1300)
  // Grand titre
  g.fillStyle = '#c7262c'
  g.font = `900 120px ${'"Inter", Arial, sans-serif'}`
  g.fillText('MITZVAH TANK', 760, 580, 1200)
  // Liste des mitsvot (petit texte blanc)
  g.fillStyle = '#ffffff'
  g.font = `bold 34px ${'"Inter", Arial, sans-serif'}`
  g.textAlign = 'left'
  ;['• Tefillin', '• Shabbat Candles', '• Mezuzah', '• Tzedakah', '• Torah Study', '• Kashrut'].forEach((l, i) =>
    g.fillText(l, 180 + (i % 3) * 380, 655 + Math.floor(i / 3) * 44),
  )
  // Encadré à la place du portrait : « Kosher food on board / Come on board »
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.fillRect(1600, 230, 380, 400)
  g.fillStyle = '#163a5c'
  g.font = `bold 58px ${'"Inter", Arial, sans-serif'}`
  g.fillText('KOSHER', 1790, 300)
  g.fillText('FOOD', 1790, 365)
  g.fillText('ON BOARD', 1790, 430, 340)
  g.fillStyle = '#c7262c'
  g.font = `bold 50px ${'"Inter", Arial, sans-serif'}`
  g.fillText('COME', 1790, 520)
  g.fillText('ON BOARD!', 1790, 580, 340)
  return finaliser(c)
}
