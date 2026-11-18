// Intérieurs des 5 magasins (caméra à l'entrée, regard vers le comptoir).
// Usage : node tools/captures/interieurs-magasins.mjs <url> <dossier>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const url = process.argv[2] || 'http://localhost:5197/?outils=1&foule=0'
const dossier = process.argv[3] || 'test-results/interieurs'
fs.mkdirSync(dossier, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => { localStorage.clear(); localStorage.setItem('770-brooklyn-graphismes', 'haute') })
await p.goto(url)
await p.waitForFunction(() => { const b = [...document.querySelectorAll('.accueil button.principal')][0]; return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
const X0 = 40.2, L = 3.88
for (const [i, nom] of ['pizzeria', 'glacier', 'vetements', 'chemises', 'chapeaux'].entries()) {
  const cx = X0 + L * (i + 0.5)
  // Joueur au fond (la lampe du magasin suit le joueur), caméra à l'entrée
  await p.evaluate(([x]) => { const w = window.__770; w.store.getState().set({ pause: false, panneau: null }); w.teleporter(x + 1.3, 1.0, -8.2) }, [cx])
  await p.waitForTimeout(2500)
  const img = await p.evaluate(([cx]) => {
    const w = window.__770
    const cam = w.camera.clone()
    cam.fov = 70; cam.aspect = w.gl.domElement.width / w.gl.domElement.height; cam.updateProjectionMatrix()
    cam.position.set(cx - 0.6, 1.65, -2.2); cam.lookAt(cx + 0.2, 1.2, -11); cam.updateMatrixWorld(true)
    w.gl.setRenderTarget(null); w.gl.render(w.scene, cam)
    return w.gl.domElement.toDataURL('image/jpeg', 0.85)
  }, [cx])
  fs.writeFileSync(`${dossier}/${nom}.jpg`, Buffer.from(img.split(',')[1], 'base64'))
}
await b.close()
