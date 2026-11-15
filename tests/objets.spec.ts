import { test, expect, type Page } from '@playwright/test'

// Objets du kiosque (15/11/2026) : prier à la bimah avec le siddour
async function demarrer(page: Page) {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/?tactile=1')
  await page.waitForFunction(() => !!(window as any).__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => (window as any).__770.store.getState().ecran === 'jeu')
}
const etat = (page: Page) => page.evaluate(() => { const s = (window as any).__770.store.getState(); return { priere: s.priere, dollars: s.dollars } })

test('siddour : prier à la bimah, balancement, +1 $ une fois, se déplacer arrête', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('portrait-360x780'), 'un seul format suffit')
  test.setTimeout(400_000)
  await demarrer(page)
  await page.evaluate(() => {
    const w = window as any
    w.__770.store.getState().set({ pause: false, panneau: null, siege: null, inventaire: ['siddour'], dollars: 0 })
    w.__770.teleporter(21.4, -3.0, -16)
  })
  await expect.poll(() => page.evaluate(() => (window as any).__770.store.getState().cible), { timeout: 60_000 }).toBe('bimah')
  await page.locator('.tbtn-e').click()
  await expect.poll(() => etat(page)).toEqual({ priere: 'priere', dollars: 1 })
  await expect(page.locator('.hud-priere')).toBeVisible()
  await expect(page.locator('.panneau')).toHaveCount(0)
  // Terminer puis prier encore : pas de second dollar pour la même prière
  await page.locator('.hud-priere button').click()
  await expect.poll(() => etat(page)).toEqual({ priere: null, dollars: 1 })
  await page.locator('.tbtn-e').click()
  await expect.poll(() => etat(page)).toEqual({ priere: 'priere', dollars: 1 })
  // Se déplacer met fin à la prière
  await page.evaluate(async () => {
    const m = await import('/src/player/entrees.ts')
    Object.assign(m.joystick, { actif: true, x: 0, y: 1 })
  })
  await expect.poll(() => etat(page), { timeout: 30_000 }).toEqual({ priere: null, dollars: 1 })
})
