import { test, expect, type Page } from '@playwright/test'

// Magasins juifs d'Eastern Parkway (15/11/2026)
async function demarrer(page: Page) {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/?tactile=1')
  await page.waitForFunction(() => !!(window as any).__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => (window as any).__770.store.getState().ecran === 'jeu')
}

test('pizzeria et glacier : entrer, acheter, manger', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('portrait-360x780'), 'un seul format suffit')
  test.setTimeout(400_000)
  await demarrer(page)
  const etat = () => page.evaluate(() => { const s = (window as any).__770.store.getState(); return { cible: s.cible, panneau: s.panneau, dollars: s.dollars, inv: s.inventaire } })
  // Devant le comptoir du glacier (2e magasin), à l'intérieur
  await page.evaluate(() => {
    const w = window as any
    w.__770.store.getState().set({ pause: false, panneau: null, siege: null, dollars: 5 })
    w.__770.teleporter(46.02, 0.9, -6.6, 0)
  })
  await expect.poll(async () => (await etat()).cible, { timeout: 60_000 }).toBe('magasin-glacier')
  await page.screenshot({ path: 'test-results/magasins-devanture.png' })
  await page.locator('.tbtn-e').click()
  await expect.poll(async () => (await etat()).panneau).toEqual({ type: 'boutique', id: 'glacier' })
  await expect(page.locator('.panneau')).toContainText('Glacier')
  await page.locator('[data-article="glace"]').click()
  await expect.poll(async () => (await etat()).dollars).toBe(4)
  expect((await etat()).inv).toContain('mange:glace')
  await page.screenshot({ path: 'test-results/magasins-panneau.png' })
})

test('pizzeria : livraison, client, +3 $ ou +4 $ avec pourboire', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('portrait-360x780'), 'un seul format suffit')
  test.setTimeout(400_000)
  await demarrer(page)
  const etat = () => page.evaluate(() => { const s = (window as any).__770.store.getState(); return { cible: s.cible, livraison: s.livraison, dollars: s.dollars } })
  await page.evaluate(() => {
    const w = window as any
    w.__770.store.getState().set({ pause: false, panneau: null, siege: null, dollars: 0 })
    w.__770.teleporter(42.14, 0.9, -6.6, 0)
  })
  await expect.poll(async () => (await etat()).cible, { timeout: 60_000 }).toBe('magasin-pizzeria')
  await page.locator('.tbtn-e').click()
  await page.locator('.livraison-offre button').click()
  await expect.poll(async () => (await etat()).livraison).not.toBeNull()
  await expect(page.locator('.hud-livraison')).toBeVisible()
  // Aller chez le client
  const dest = await page.evaluate(async () => {
    const m = await import('/src/missions/livraisons.ts')
    const w = window as any
    const d = m.DESTINATIONS[w.__770.store.getState().livraison.dest]
    w.__770.teleporter(d.x, 0.9, d.z + 1.4)
    return d
  })
  expect(dest).toBeTruthy()
  await expect.poll(async () => (await etat()).cible, { timeout: 60_000 }).toBe('livraison-client')
  await page.locator('.tbtn-e').click()
  await expect.poll(async () => (await etat()).livraison).toBeNull()
  const d = (await etat()).dollars
  expect([3, 4]).toContain(d)
  await expect(page.locator('.hud-livraison')).toHaveCount(0)
})

test('on entre dans le glacier par sa porte, à pied', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('portrait-360x780'), 'un seul format suffit')
  test.setTimeout(400_000)
  await demarrer(page)
  const etat = () => page.evaluate(() => { const w = window as any; const s = w.__770.store.getState(); return { cible: s.cible, zone: s.zone, z: w.__770.joueur?.position?.[2] ?? null } })
  // Sur le trottoir, face à la porte du glacier
  await page.evaluate(() => {
    const w = window as any
    w.__770.store.getState().set({ pause: false, panneau: null, siege: null })
    w.__770.teleporter(47.1, 0.9, 0.4, 0)
  })
  await expect.poll(async () => (await etat()).cible, { timeout: 60_000 }).toBe('porte-magasin-glacier')
  await page.locator('.tbtn-e').click()
  await page.waitForTimeout(1500)
  await page.keyboard.down('KeyW')
  await expect.poll(async () => (await etat()).zone, { timeout: 60_000 }).toBe('magasins')
  await page.keyboard.up('KeyW')
  await page.screenshot({ path: 'test-results/magasins-interieur.png' })
})
