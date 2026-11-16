// Gros plan sur le garçon qui marche (jambes, pieds) : rendu avec une caméra
// à part, placée devant puis derrière lui, sans toucher à la caméra du jeu.
// Usage : node tools/captures/enfant.mjs <url> <dossier>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1'
const dossier = process.argv[3] || 'test-results/enfant'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => localStorage.clear())
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 120000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
// Le joueur se tient à l'écart, assez près pour que l'enfant soit animé à pleine cadence
await p.evaluate(() => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(-6, 0.9, 12.5) })
await p.waitForTimeout(4000)
for (let i = 0; i < 12; i++) {
  const img = await p.evaluate((i) => {
    const w = window.__770
    // Bassin de l'enfant-rue-1 : il fait les cent pas le long de z = 9,8
    let bassin = null
    w.scene.traverse((o) => {
      if (!o.isBone || !/Hips/.test(o.name)) return
      const v = o.getWorldPosition(new w.camera.position.constructor())
      if (v.y < 0.75 && Math.abs(v.z - 9.8) < 0.35 && v.x > -12.5 && v.x < -0.5) bassin = v
    })
    if (!bassin) return null
    const cam = w.camera.clone()
    cam.fov = 30
    cam.aspect = w.gl.domElement.width / w.gl.domElement.height
    cam.updateProjectionMatrix()
    // Vues alternées : de face ou de dos (axe de marche x), puis de trois quarts
    const cote = i % 2 ? 1 : -1
    cam.position.set(bassin.x + cote * 2.6, 0.55, bassin.z + (i % 4 < 2 ? 0 : 0.9))
    cam.lookAt(bassin.x, 0.42, bassin.z)
    cam.updateMatrixWorld(true)
    w.gl.setRenderTarget(null)
    w.gl.render(w.scene, cam)
    return w.gl.domElement.toDataURL('image/png')
  }, i)
  if (img) fs.writeFileSync(`${dossier}/${String(i).padStart(2, '0')}.png`, Buffer.from(img.split(',')[1], 'base64'))
  await p.waitForTimeout(330)
}
console.log('fait')
await b.close()
