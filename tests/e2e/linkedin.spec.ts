import { expect, test } from '@playwright/test';

test.describe('Posts LinkedIn et consentement', () => {
  test('aucune iframe avant accord, refus mémorisé, affichage après acceptation', async ({ page }) => {
    const requetesLinkedIn: string[] = [];
    await page.route('https://www.linkedin.com/**', (route) => {
      requetesLinkedIn.push(route.request().url());
      return route.abort();
    });

    await page.goto('/');
    const bandeau = page.getByRole('region', { name: 'Cookies LinkedIn' });
    await expect(bandeau).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
    const liens = page.getByRole('link', { name: /Voir le post sur LinkedIn/ });
    const nombrePosts = await liens.count();
    expect(nombrePosts).toBeGreaterThan(0);
    await expect(liens.first()).toHaveAttribute(
      'href',
      /^https:\/\/www\.linkedin\.com\/(posts|feed\/update)\/[^?]+$/,
    );

    await bandeau.getByRole('button', { name: 'Refuser' }).click();
    await expect(bandeau).toBeHidden();
    await page.reload();
    await expect(bandeau).toBeHidden();
    expect(requetesLinkedIn).toEqual([]);

    await page.getByRole('button', { name: 'Gérer les cookies' }).click();
    await expect(bandeau).toBeVisible();
    await bandeau.getByRole('button', { name: 'Accepter' }).click();
    await expect(page.locator('iframe[title^="Post LinkedIn"]')).toHaveCount(nombrePosts);
  });
});
