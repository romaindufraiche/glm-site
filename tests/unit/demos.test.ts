import { describe, expect, it } from 'vitest';
import {
  estEtatEspace,
  formaterTaille,
  messageErreur,
  slugDemo,
  slugValide,
  urlDemo,
} from '../../src/lib/demos';

describe('slugDemo', () => {
  it('retire accents, espaces et symboles (même règle que le serveur)', () => {
    expect(slugDemo('Garage Dupré & Fils')).toBe('garage-dupre-fils');
    expect(slugDemo('  Café — L’Étoile  ')).toBe('cafe-l-etoile');
  });

  it('limite à 60 caractères sans tiret final', () => {
    const slug = slugDemo('ab-'.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
    expect(slugValide(slug)).toBe(true);
  });
});

describe('slugValide', () => {
  it('refuse majuscules, points et tirets en bordure', () => {
    expect(slugValide('client-1')).toBe(true);
    expect(slugValide('Client')).toBe(false);
    expect(slugValide('..')).toBe(false);
    expect(slugValide('-client')).toBe(false);
    expect(slugValide('')).toBe(false);
  });
});

describe('urlDemo et formaterTaille', () => {
  it('applique le modèle d’adresse', () => {
    expect(urlDemo('https://demo.glmprime.com/{slug}/', 'abc')).toBe('https://demo.glmprime.com/abc/');
    expect(urlDemo('https://{slug}.demo.glmprime.com/', 'abc')).toBe('https://abc.demo.glmprime.com/');
  });

  it('affiche les tailles en unités françaises', () => {
    expect(formaterTaille(512)).toBe('512 o');
    expect(formaterTaille(2048)).toBe('2 Ko');
    expect(formaterTaille(5.5 * 1024 * 1024)).toBe('5,5 Mo');
  });
});

describe('réponses de l’API', () => {
  it('reconnaît un état valide', () => {
    expect(estEtatEspace({ ok: true, connecte: false, csrf: 'x' })).toBe(true);
    expect(estEtatEspace({ ok: false, message: 'Erreur' })).toBe(false);
    expect(estEtatEspace(null)).toBe(false);
  });

  it('reprend le message du serveur, sinon un message générique', () => {
    expect(messageErreur({ ok: false, message: 'Jeton invalide.' })).toBe('Jeton invalide.');
    expect(messageErreur(null)).toMatch(/Réessayez/);
  });
});
