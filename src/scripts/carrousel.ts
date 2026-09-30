/**
 * Défilement continu des projets, sans librairie.
 *
 * - Le contenu reste une simple liste défilable : sans JavaScript, on fait défiler à la main.
 * - Pause au survol, au focus clavier, au toucher, quand la section est hors écran,
 *   et via un bouton Pause/Reprendre (WCAG 2.2.2).
 * - prefers-reduced-motion : aucun défilement automatique, défilement manuel uniquement.
 * - La boucle infinie est obtenue en clonant la liste ; les clones sont masqués aux
 *   technologies d'assistance et exclus de la navigation clavier (inert).
 */
const VITESSE_PX_PAR_SECONDE = 32;
const REPRISE_APRES_TOUCHER_MS = 3000;

export function initCarrousel(): void {
  const piste = document.querySelector<HTMLElement>('[data-carrousel]');
  const liste = document.querySelector<HTMLElement>('[data-carrousel-liste]');
  const bouton = document.querySelector<HTMLButtonElement>('[data-carrousel-pause]');
  const libelle = document.querySelector<HTMLElement>('[data-carrousel-pause-libelle]');
  if (!piste || !liste || !bouton) return;

  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mouvementReduit.matches || liste.children.length < 2) return;

  const originaux = Array.from(liste.children) as HTMLElement[];
  let largeurSerie = 0;

  /** Ajoute autant de copies que nécessaire pour couvrir l'écran pendant la boucle. */
  const preparerClones = (): void => {
    liste.querySelectorAll('[data-clone]').forEach((clone) => clone.remove());
    const premier = originaux[0];
    const dernier = originaux[originaux.length - 1];
    if (!premier || !dernier) return;
    const ecart = parseFloat(getComputedStyle(liste).columnGap) || 0;
    largeurSerie = dernier.offsetLeft + dernier.offsetWidth - premier.offsetLeft + ecart;
    const copies = Math.max(1, Math.ceil(piste.clientWidth / largeurSerie));
    for (let i = 0; i < copies; i += 1) {
      originaux.forEach((item) => {
        const clone = item.cloneNode(true) as HTMLElement;
        clone.dataset['clone'] = '';
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        liste.append(clone);
      });
    }
  };

  const raisons = new Set<string>();
  let position = piste.scrollLeft;
  let precedent: number | null = null;
  let frame = 0;
  let minuterieToucher = 0;

  const boucle = (maintenant: number): void => {
    if (precedent !== null) {
      position += ((maintenant - precedent) / 1000) * VITESSE_PX_PAR_SECONDE;
      if (position >= largeurSerie) position -= largeurSerie;
      piste.scrollLeft = position;
    }
    precedent = maintenant;
    frame = requestAnimationFrame(boucle);
  };

  const mettreAJour = (): void => {
    const actif = raisons.size === 0;
    piste.classList.toggle('is-auto', actif);
    cancelAnimationFrame(frame);
    precedent = null;
    if (actif) {
      position = piste.scrollLeft;
      frame = requestAnimationFrame(boucle);
    }
  };

  const pause = (raison: string): void => {
    raisons.add(raison);
    mettreAJour();
  };
  const reprise = (raison: string): void => {
    raisons.delete(raison);
    mettreAJour();
  };

  // Défilement manuel : on repart de la position choisie et on reste dans la boucle.
  piste.addEventListener(
    'scroll',
    () => {
      if (Math.abs(piste.scrollLeft - position) > 2) {
        position = piste.scrollLeft;
        if (largeurSerie > 0 && position >= largeurSerie) {
          position -= largeurSerie;
          piste.scrollLeft = position;
        }
      }
    },
    { passive: true },
  );

  piste.addEventListener('mouseenter', () => pause('survol'));
  piste.addEventListener('mouseleave', () => reprise('survol'));
  piste.addEventListener('focusin', () => pause('focus'));
  piste.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node && piste.contains(event.relatedTarget))) reprise('focus');
  });
  piste.addEventListener(
    'touchstart',
    () => {
      window.clearTimeout(minuterieToucher);
      pause('toucher');
    },
    { passive: true },
  );
  piste.addEventListener(
    'touchend',
    () => {
      minuterieToucher = window.setTimeout(() => reprise('toucher'), REPRISE_APRES_TOUCHER_MS);
    },
    { passive: true },
  );

  bouton.hidden = false;
  bouton.addEventListener('click', () => {
    const enPause = !bouton.hasAttribute('data-en-pause');
    bouton.toggleAttribute('data-en-pause', enPause);
    if (libelle) libelle.textContent = enPause ? 'Reprendre le défilement' : 'Mettre en pause';
    if (enPause) pause('bouton');
    else reprise('bouton');
  });

  new IntersectionObserver(([entree]) => {
    if (entree?.isIntersecting) reprise('hors-ecran');
    else pause('hors-ecran');
  }).observe(piste);

  mouvementReduit.addEventListener('change', (event) => {
    if (event.matches) pause('mouvement-reduit');
    else reprise('mouvement-reduit');
  });

  let largeurFenetre = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === largeurFenetre) return;
    largeurFenetre = window.innerWidth;
    preparerClones();
  });

  preparerClones();
  pause('hors-ecran');
}
