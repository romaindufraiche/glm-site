import { expect, test } from '@playwright/test';

test.describe('Défilement des projets', () => {
  test('défile seul, se met en pause au bouton et garde les copies hors d’atteinte', async ({ page }) => {
    await page.goto('/#projets');
    const piste = page.locator('[data-carrousel]');
    const bouton = page.getByRole('button', { name: 'Mettre en pause' });
    await expect(bouton).toBeVisible();

    // Les copies nécessaires à la boucle sont masquées aux lecteurs d'écran et au clavier.
    const clones = page.locator('[data-carrousel-liste] > [data-clone]');
    expect(await clones.count()).toBeGreaterThan(0);
    await expect(clones.first()).toHaveAttribute('aria-hidden', 'true');
    expect(await clones.first().evaluate((el) => (el as HTMLElement).inert)).toBe(true);

    // Le défilement avance (la souris est placée hors de la piste pour ne pas la mettre en pause).
    await page.mouse.move(0, 0);
    const depart = await piste.evaluate((el) => el.scrollLeft);
    await expect.poll(() => piste.evaluate((el) => el.scrollLeft), { timeout: 4000 }).toBeGreaterThan(depart);

    await bouton.click();
    await expect(page.getByRole('button', { name: 'Reprendre le défilement' })).toBeVisible();
    const arret = await piste.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(600);
    expect(await piste.evaluate((el) => el.scrollLeft)).toBe(arret);
  });

  test('avec mouvement réduit : aucun défilement automatique', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#projets');
    await expect(page.locator('[data-carrousel-pause]')).toBeHidden();
    await expect(page.locator('[data-clone]')).toHaveCount(0);
    const piste = page.locator('[data-carrousel]');
    const depart = await piste.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(800);
    expect(await piste.evaluate((el) => el.scrollLeft)).toBe(depart);
  });
});
