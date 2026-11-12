import { test, expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __770: any
    __pnjLeger?: Map<string, { modele: string; etat: string; clip: string | null }>
  }
}

async function demarrer(page: Page, recherche = '') {
  await page.addInitScript(() => localStorage.clear())
  await page.goto(`/${recherche}`)
  await page.waitForFunction(() => !!window.__770, null, { timeout: 60_000 })
  const jouer = page.getByRole('button', { name: /^(Jouer|Nouvelle partie)$/ })
  await expect(jouer.first()).toBeEnabled({ timeout: 90_000 })
  await jouer.first().click()
  await page.waitForFunction(() => window.__770.store.getState().ecran === 'jeu')
}

test.describe('PNJ enfants, fille et femme', () => {
  test.skip(({ isMobile }) => isMobile, 'un contrôle PC suffit')

  test('les 15 PNJ légers se chargent et s\'animent (repos et marche)', async ({ page }) => {
    await demarrer(page)
    await page.evaluate(() => {
      window.__770.teleporter(-8, 0.9, 9)
      window.__770.store.getState().set({ pause: false, panneau: null, siege: null })
    })
    await expect.poll(() => page.evaluate(() => window.__pnjLeger?.size ?? 0), { timeout: 60_000 }).toBe(15)
    const modeles = await page.evaluate(() => [...(window.__pnjLeger?.entries() ?? [])].map(([id, p]) => `${id}:${p.modele}`).sort())
    expect(modeles).toEqual([
      'enfant-rue-1:enfant',
      'enfant-rue-2:enfant',
      'enfant-rue-3:enfant',
      'enfant-rue-4:enfant',
      'enfant-rue-5:enfant',
      'enfant-zal-1:enfant',
      'enfant-zal-2:enfant',
      'femme-rue-1:femme',
      'femme-rue-2:femme',
      'femme-rue-3:femme',
      'fille-rue-1:fille',
      'fille-rue-2:fille',
      'fille-rue-3:fille',
      'fille-rue-4:fille',
      'vieux-rue-1:vieux',
    ])
    await expect.poll(() => page.evaluate(() => window.__pnjLeger?.get('enfant-rue-2')?.clip)).toBe('Idle_11')
    await expect
      .poll(() => page.evaluate(() => [...(window.__pnjLeger?.values() ?? [])].some((p) => p.clip === 'Walking')), { timeout: 20_000 })
      .toBe(true)
  })

  test('?enfants=0 retire les PNJ légers', async ({ page }) => {
    await demarrer(page, '?enfants=0')
    await page.waitForTimeout(3000)
    expect(await page.evaluate(() => window.__pnjLeger?.size ?? 0)).toBe(0)
  })
})
