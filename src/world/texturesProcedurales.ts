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

// Brique de la façade du 770 (references/selection : exterior-quatrefoil-stone,
// exterior-triple-window-mullions, exterior-facade-front-winter) : appareil en
// panneresses, briques de teintes très variées (rouge, rouge sombre, violacé,
// presque noir, quelques orangées), joints gris clair en retrait. Toile 1K
// couvrant 1,05 m, raccord sans couture. Tailles et proportions des teintes
// ESTIMÉES d'après les photos. Renvoie la même texture pour la couleur et le relief.
export function textureBrique770() {
  const T = 1024
  const { c, g } = canvas(T, T)
  let graine = 770
  const alea = () => {
    graine = (graine * 16807) % 2147483647
    return graine / 2147483647
  }
  // [r, g, b, poids]
  const teintes: [number, number, number, number][] = [
    [118, 50, 40, 0.3], // rouge
    [94, 40, 36, 0.26], // rouge sombre
    [80, 44, 50, 0.2], // violacé
    [56, 38, 40, 0.1], // presque noir
    [128, 64, 46, 0.08], // orangé
    [90, 72, 78, 0.06], // gris violacé
  ]
  const tirer = () => {
    let x = alea()
    for (const t of teintes) {
      if ((x -= t[3]) <= 0) return t
    }
    return teintes[0]
  }
  g.fillStyle = '#857c72' // mortier
  g.fillRect(0, 0, T, T)
  const nb = 5 // briques par rang (≈ 21 cm)
  const rangs = 14 // rangs (≈ 7,5 cm)
  const bw = T / nb
  const bh = T / rangs
  const joint = 7
  for (let r = 0; r < rangs; r++) {
    const dec = r % 2 ? bw / 2 : 0
    for (let k = -1; k < nb; k++) {
      const [cr, cg, cb] = tirer()
      const v = 0.9 + alea() * 0.2
      const x = k * bw + dec + joint / 2
      const y = r * bh + joint / 2
      const w = bw - joint
      const h = bh - joint
      g.fillStyle = `rgb(${cr * v},${cg * v},${cb * v})`
      g.fillRect(x, y, w, h)
      if (x < 0) {
        g.fillRect(x + T, y, w, h)
      }
      if (x + w > T) g.fillRect(x - T, y, w, h)
      // Mouchetures et nuances de cuisson
      for (let i = 0; i < 40; i++) {
        const d = alea() < 0.5 ? 0 : 255
        g.fillStyle = `rgba(${d},${d * 0.8},${d * 0.7},${0.04 + alea() * 0.07})`
        const px = x + alea() * w
        const py = y + alea() * h
        const s = 2 + alea() * 6
        g.fillRect(px, py, s, s * 0.6)
        if (px < 0) g.fillRect(px + T, py, s, s * 0.6)
        if (px + s > T) g.fillRect(px - T, py, s, s * 0.6)
      }
    }
  }
  const tex = finaliser(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1 / 1.05, 1 / 1.05)
  return tex
}
