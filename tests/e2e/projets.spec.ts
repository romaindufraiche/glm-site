import { expect, test, type Page } from '@playwright/test';

/** Décalage vertical actuel d’une carte projet (valeur de translateY, en pixels). */
const decalage = (page: Page, index: number) =>
  page
    .locator('[data-projets-item]')
    .nth(index)
    .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);

test.describe('Défilement des projets', () => {
  test('desktop : section épinglée, la colonne de projets monte', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Défilement épinglé réservé au desktop');
    await page.goto('/');
    await expect(page.locator('[data-projets]')).toHaveClass(/is-epingle/);

    const { debut, distance } = await page.evaluate(() => {
      const piste = document.querySelector<HTMLElement>('[data-projets-piste]');
      const scene = piste?.firstElementChild as HTMLElement | null;
      if (!piste || !scene) throw new Error('Section Projets introuvable');
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16;
      return {
        debut: piste.getBoundingClientRect().top + window.scrollY - nav,
        distance: piste.offsetHeight - scene.offsetHeight,
      };
    });
    expect(distance).toBeGreaterThan(0);

    await page.evaluate((y) => window.scrollTo(0, y), debut);
    await expect.poll(() => decalage(page, 0)).toBeGreaterThan(0);
    const depart = await decalage(page, 0);

    // À la fin du trajet : toute la colonne est montée d’un seul bloc.
    await page.evaluate((y) => window.scrollTo(0, y), debut + distance);
    await expect.poll(() => decalage(page, 0)).toBeLessThan(depart - 100);
    await page.waitForTimeout(800);
    const premier = await decalage(page, 0);
    expect(await decalage(page, 3)).toBeCloseTo(premier, 0);
    await expect(page.locator('#projets-titre')).toBeInViewport();

    // Au-delà, la page reprend son défilement normal.
    await page.evaluate((y) => window.scrollTo(0, y), debut + distance + 600);
    await expect(page.locator('#methode')).toBeInViewport();
  });

  test('mobile et mouvement réduit : grille simple, aucune animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#projets');
    await expect(page.locator('[data-projets]')).not.toHaveClass(/is-epingle/);
    expect(await decalage(page, 0)).toBe(0);
    await expect(page.locator('[data-projets-item]').first()).toBeVisible();
  });
});
