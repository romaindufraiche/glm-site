import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Audit automatique WCAG 2.1 AA (contrastes, libellés, structure, ARIA) sur chaque page publique.
for (const chemin of ['/', '/mentions-legales/', '/confidentialite/', '/message-envoye/', '/404']) {
  test(`aucune violation WCAG AA détectée sur ${chemin}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(chemin);
    const resultats = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      resultats.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
}
