// Mesure du démarrage : ressources, tâches longues, délai avant « Jouer »
import { chromium } from '@playwright/test'
const url = process.argv[2] || 'http://localhost:5197/'
const b = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1300,820', '--mute-audio'] })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.addInitScript(() => {
  window.__lt = []
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]) }).observe({ entryTypes: ['longtask'] })
})
const t0 = Date.now()
await p.goto(url)
await p.waitForFunction(() => { const b = document.querySelector('.accueil button.principal'); return b && !b.disabled }, null, { timeout: 120000 })
const pret = Date.now() - t0
const r = await p.evaluate(() => ({
  lt: window.__lt.filter((x) => x[1] > 120),
  totalLong: window.__lt.reduce((a, x) => a + x[1], 0),
  res: performance.getEntriesByType('resource').map((e) => [e.name.split('/').slice(-1)[0].slice(0, 40), Math.round(e.startTime), Math.round(e.responseEnd), Math.round((e.transferSize || 0) / 1024)]).sort((a, b) => b[3] - a[3]).slice(0, 22),
  nb: performance.getEntriesByType('resource').length,
  ko: Math.round(performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0) / 1024),
  fin: Math.round(Math.max(...performance.getEntriesByType('resource').map((e) => e.responseEnd))),
}))
console.log('pret ms', pret, '| ressources', r.nb, r.ko + ' ko, derniere a', r.fin, '| taches longues total', r.totalLong)
console.log('longues:', JSON.stringify(r.lt))
for (const x of r.res) console.log(x.join('\t'))
await b.close()
