// Vue de dessus de la rue + liste des objets interactifs (aide au placement)
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const [cx = 0, cz = 9, h = 70, nom = 'plan'] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.goto('http://localhost:5198/?outils=1')
await p.waitForFunction(() => { const b = document.querySelector('.accueil button.principal'); return b && !b.disabled }, null, { timeout: 180000 })
await p.locator('.accueil button.principal').click()
await p.waitForFunction(() => window.__770?.store.getState().ecran === 'jeu')
await p.waitForTimeout(6000)
const r = await p.evaluate(([cx, cz, h]) => {
  const w = window.__770
  const cam = w.camera.clone()
  cam.fov = 40; cam.far = 500; cam.position.set(cx, h, cz + 0.01); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz); cam.updateProjectionMatrix(); cam.updateMatrixWorld()
  const fog = w.scene.fog; w.scene.fog = null
  w.gl.render(w.scene, cam)
  const img = w.gl.domElement.toDataURL('image/png')
  w.scene.fog = fog
  const it = [...w.store.getState().interactifs.values()].map((i) => [i.id, ...i.position.map((v) => +v.toFixed(2)), i.rayon])
  return { img, it }
}, [+cx, +cz, +h])
fs.mkdirSync('test-results/captures', { recursive: true })
fs.writeFileSync(`test-results/captures/${nom}.png`, Buffer.from(r.img.split(',')[1], 'base64'))
console.log(r.it.map((x) => x.join(' ')).join('\n'))
await b.close()
