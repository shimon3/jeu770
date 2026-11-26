// Liste les maillages visibles les plus lourds (triangles) depuis un point de
// la rue. Usage : node tools/captures/triangles.mjs <url>
import { chromium } from '@playwright/test'
const url = process.argv[2] || 'http://localhost:5198/?outils=1'
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.evaluate(() => window.__770.teleporter(7, 1, 10.5))
await p.waitForTimeout(3000)
const res = await p.evaluate(() => {
  const { scene } = window.__770
  const lignes = []
  scene.traverseVisible((o) => {
    if (!o.isMesh || !o.geometry) return
    const g = o.geometry
    const n = (g.index ? g.index.count : g.attributes.position.count) / 3
    const inst = o.isInstancedMesh ? o.count : 1
    let chemin = []
    for (let x = o; x && chemin.length < 5; x = x.parent) if (x.name) chemin.push(x.name)
    const mat = Array.isArray(o.material) ? o.material[0] : o.material
    lignes.push({ t: Math.round(n * inst), nom: (o.name || '(sans nom)') + ' [' + (mat?.name || mat?.color?.getHexString?.() || '') + ' ' + g.type + ' ' + Math.round(n) + ']', chemin: chemin.join(' < '), inst })
  })
  lignes.sort((a, b) => b.t - a.t)
  const total = lignes.reduce((s, l) => s + l.t, 0)
  return { total, n: lignes.length, top: lignes.slice(0, 25) }
})
console.log('total', res.total, 'maillages', res.n)
for (const l of res.top) console.log(String(l.t).padStart(8), l.inst > 1 ? `x${l.inst}` : '', l.nom, '|', l.chemin)
await b.close()
