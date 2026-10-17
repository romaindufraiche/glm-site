import {
  EVENEMENT_CONSENTEMENT,
  enregistrerConsentement,
  lireConsentement,
  stockageNavigateur,
  type ChoixConsentement,
} from '../lib/consentement';

/**
 * Charge les iframes LinkedIn uniquement après consentement.
 * Sans consentement, chaque post reste une carte de remplacement avec un lien vers LinkedIn.
 */
export function initPostsLinkedIn(): void {
  const posts = document.querySelectorAll<HTMLElement>('[data-post-linkedin]');
  if (posts.length === 0) return;

  const afficher = (): void => {
    posts.forEach((post) => {
      const modele = post.querySelector<HTMLTemplateElement>('template[data-post-iframe]');
      if (!modele) return;
      post.querySelector('[data-post-remplacement]')?.remove();
      post.append(modele.content.cloneNode(true));
      modele.remove();
    });
  };

  document.querySelectorAll<HTMLButtonElement>('[data-consentement-accepter]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      enregistrerConsentement(stockageNavigateur(), 'accepte');
      document.dispatchEvent(
        new CustomEvent<ChoixConsentement>(EVENEMENT_CONSENTEMENT, { detail: 'accepte' }),
      );
    });
  });

  document.addEventListener(EVENEMENT_CONSENTEMENT, (event) => {
    const choix = (event as CustomEvent<ChoixConsentement>).detail;
    if (choix === 'accepte') afficher();
    // Retrait du consentement : on recharge pour retirer les iframes déjà affichées.
    else if (document.querySelector('[data-post-linkedin] iframe')) window.location.reload();
  });

  if (lireConsentement(stockageNavigateur()) === 'accepte') afficher();
}
