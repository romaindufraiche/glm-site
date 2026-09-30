import {
  EVENEMENT_CONSENTEMENT,
  enregistrerConsentement,
  lireConsentement,
  stockageNavigateur,
  type ChoixConsentement,
} from '../lib/consentement';

export function initBandeauConsentement(): void {
  const bandeau = document.querySelector<HTMLElement>('[data-consentement]');
  if (!bandeau) return;

  const ouvrir = (): void => {
    bandeau.hidden = false;
  };
  const fermer = (): void => {
    bandeau.hidden = true;
  };

  bandeau.querySelectorAll<HTMLButtonElement>('[data-consentement-choix]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      const choix = bouton.dataset['consentementChoix'] === 'accepte' ? 'accepte' : 'refuse';
      enregistrerConsentement(stockageNavigateur(), choix);
      document.dispatchEvent(new CustomEvent<ChoixConsentement>(EVENEMENT_CONSENTEMENT, { detail: choix }));
      fermer();
    });
  });

  // Un choix fait ailleurs (bouton d'une carte LinkedIn) ferme aussi le bandeau.
  document.addEventListener(EVENEMENT_CONSENTEMENT, fermer);

  document.querySelectorAll<HTMLElement>('[data-gerer-cookies]').forEach((lien) => {
    lien.hidden = false;
    lien.addEventListener('click', () => {
      ouvrir();
      bandeau.querySelector<HTMLButtonElement>('[data-consentement-choix]')?.focus();
    });
  });

  if (lireConsentement(stockageNavigateur()) === null) ouvrir();
}
