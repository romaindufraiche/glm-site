import { expect, test, type Page } from '@playwright/test';

/** Décalage horizontal actuel de la liste des projets (valeur de translateX, en pixels). */
const decalage = (page: Page) =>
  page.locator('[data-projets-liste]').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

test.describe('Défilement des projets', () => {
  test('desktop : la section reste épinglée et la molette fait défiler les projets', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Défilement horizontal réservé au desktop');
    await page.goto('/');
    const section = page.locator('[data-projets]');
    await expect(section).toHaveClass(/is-horizontal/);

    const { debut, trajet } = await page.evaluate(() => {
      const piste = document.querySelector<HTMLElement>('[data-projets-piste]');
      const liste = document.querySelector<HTMLElement>('[data-projets-liste]');
      const fenetre = liste?.parentElement;
      if (!piste || !liste || !fenetre) throw new Error('Section Projets introuvable');
      const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16;
      return {
        debut: piste.getBoundingClientRect().top + window.scrollY - nav,
        trajet: liste.scrollWidth - fenetre.clientWidth,
      };
    });
    expect(trajet).toBeGreaterThan(0);

    // À mi-parcours : les projets ont glissé d’environ la moitié du trajet, le titre reste à l’écran.
    await page.evaluate((y) => window.scrollTo(0, y), debut + trajet / 2);
    await expect.poll(() => decalage(page)).toBeCloseTo(-trajet / 2, 0);
    await expect(page.locator('#projets-titre')).toBeInViewport();

    // Fin du trajet : tous les projets ont défilé, puis la page reprend son défilement normal.
    await page.evaluate((y) => window.scrollTo(0, y), debut + trajet + 400);
    await expect.poll(() => decalage(page)).toBeCloseTo(-trajet, 0);
    await expect(page.locator('#methode')).toBeInViewport();
  });

  test('mobile et mouvement réduit : grille simple, aucune animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#projets');
    await expect(page.locator('[data-projets]')).not.toHaveClass(/is-horizontal/);
    expect(await decalage(page)).toBe(0);
    await expect(page.locator('[data-projets-item]').first()).toBeVisible();
  });
});
