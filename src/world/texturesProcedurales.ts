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
