/**
 * Projets : deux colonnes qui défilent en sens opposés, pilotées par le défilement de la page (desktop).
 *
 * La section est épinglée (position: sticky) dans une « piste » dont la hauteur vaut l’écran plus la
 * longueur du trajet : chaque pixel de défilement fait avancer les colonnes d’un pixel. La colonne de
 * gauche monte (de bas en haut), celle de droite descend (de haut en bas). Une légère inertie
 * (interpolation vers la cible à chaque image) rend le mouvement fluide.
 *
 * Désactivé (grille simple) sur mobile/tablette et avec prefers-reduced-motion.
 */
const INERTIE = 0.12;
/** Décalage de départ des colonnes, en part de la hauteur du cadre : les deux colonnes démarrent décalées. */
const AMPLITUDE = 0.18;
/** Pixels de défilement de la page par pixel de mouvement des colonnes : plus grand = plus lent. */
const RALENTI = 1.8;
const CONDITION = '(min-width: 60.0625rem) and (prefers-reduced-motion: no-preference)';

export function initDefilementProjets(): void {
  const section = document.querySelector<HTMLElement>('[data-projets]');
  const piste = section?.querySelector<HTMLElement>('[data-projets-piste]');
  const fenetre = section?.querySelector<HTMLElement>('[data-projets-fenetre]');
  const liste = section?.querySelector<HTMLElement>('[data-projets-liste]');
  const barre = section?.querySelector<HTMLElement>('[data-projets-barre]');
  if (!section || !piste || !fenetre || !liste || !barre) return;

  const items = Array.from(liste.querySelectorAll<HTMLElement>('[data-projets-item]'));
  const media = window.matchMedia(CONDITION);

  let trajet = 0; // débordement des colonnes par rapport au cadre, en pixels
  let marge = 0; // décalage de départ et d’arrivée des colonnes
  let distance = 0; // défilement nécessaire pour tout parcourir
  let debut = 0; // position verticale (document) où la section s’épingle
  let cible = 0;
  let progression = 0;
  let image = 0;
  let actif = false;

  const hauteurNav = (): number =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 72;

  const calculerCible = (): number =>
    distance > 0 ? Math.min(1, Math.max(0, (window.scrollY - debut) / (distance * RALENTI))) : 0;

  const mesurer = (): void => {
    const hauteurCadre = fenetre.clientHeight;
    trajet = Math.max(0, liste.offsetHeight - hauteurCadre);
    marge = Math.round(hauteurCadre * AMPLITUDE);
    distance = trajet + 2 * marge;
    const scene = piste.firstElementChild as HTMLElement | null;
    piste.style.height = `${(scene?.offsetHeight ?? window.innerHeight) + distance * RALENTI}px`;
    debut = piste.getBoundingClientRect().top + window.scrollY - hauteurNav();
    cible = calculerCible();
    progression = cible;
    appliquer();
  };

  const appliquer = (): void => {
    const parcours = progression * distance;
    // Colonne de gauche : de +marge à -(trajet + marge). Colonne de droite : le mouvement inverse.
    const montee = marge - parcours;
    const descente = -(trajet + marge) + parcours;
    const cadre = fenetre.getBoundingClientRect();

    items.forEach((item, index) => {
      const decalage = index % 2 === 0 ? montee : descente;
      item.style.transform = `translate3d(0, ${decalage}px, 0)`;
      // Carte dont moins de 60 % est dans le cadre : atténuée.
      const rect = item.getBoundingClientRect();
      const visible = Math.min(rect.bottom, cadre.bottom) - Math.max(rect.top, cadre.top);
      item.classList.toggle('is-hors-champ', visible < rect.height * 0.6);
    });
    barre.style.clipPath = `inset(0 ${(1 - progression) * 100}% 0 0)`;
  };

  const boucle = (): void => {
    const ecart = cible - progression;
    progression = Math.abs(ecart * distance) < 0.5 ? cible : progression + ecart * INERTIE;
    appliquer();
    image = progression === cible ? 0 : requestAnimationFrame(boucle);
  };

  const surDefilement = (): void => {
    if (!actif) return;
    cible = calculerCible();
    if (!image) image = requestAnimationFrame(boucle);
  };

  // Clavier : si un élément d’une carte reçoit le focus hors du cadre, on défile jusqu’à la rendre visible.
  const surFocus = (event: FocusEvent): void => {
    if (!actif || !(event.target instanceof HTMLElement)) return;
    const item = event.target.closest<HTMLElement>('[data-projets-item]');
    if (!item || distance === 0) return;
    const index = items.indexOf(item);
    const hauteurCadre = fenetre.clientHeight;
    const cadre = fenetre.getBoundingClientRect();
    const rect = item.getBoundingClientRect();
    if (rect.top >= cadre.top && rect.bottom <= cadre.bottom) return;
    for (let pas = 0; pas <= 40; pas += 1) {
      const p = pas / 40;
      const decalage = index % 2 === 0 ? marge - p * distance : -(trajet + marge) + p * distance;
      const haut = item.offsetTop + decalage;
      if (haut >= 0 && haut + item.offsetHeight <= hauteurCadre) {
        window.scrollTo({ top: debut + p * distance * RALENTI, behavior: 'auto' });
        return;
      }
    }
  };

  const activer = (): void => {
    actif = true;
    section.classList.add('is-epingle');
    mesurer();
  };

  const desactiver = (): void => {
    actif = false;
    cancelAnimationFrame(image);
    image = 0;
    section.classList.remove('is-epingle');
    piste.style.height = '';
    items.forEach((item) => {
      item.style.transform = '';
      item.classList.remove('is-hors-champ');
    });
  };

  const appliquerCondition = (): void => (media.matches ? activer() : desactiver());

  window.addEventListener('scroll', surDefilement, { passive: true });
  window.addEventListener('resize', () => actif && mesurer());
  liste.addEventListener('focusin', surFocus);
  media.addEventListener('change', appliquerCondition);
  void document.fonts.ready.then(() => actif && mesurer());

  appliquerCondition();
}
