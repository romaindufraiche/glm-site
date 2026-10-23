import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// security.txt (RFC 9116) indique où signaler une faille. Il porte une date d’expiration :
// ce test échoue un mois avant, pour rappeler de la repousser.
const contenu = readFileSync('public/.well-known/security.txt', 'utf8');
const champ = (nom: string): string | undefined =>
  contenu
    .split('\n')
    .find((ligne) => ligne.startsWith(`${nom}:`))
    ?.slice(nom.length + 1)
    .trim();

describe('security.txt', () => {
  it('donne un contact et l’adresse canonique du site', () => {
    expect(champ('Contact')).toBe('mailto:contact@glmprime.com');
    expect(champ('Canonical')).toBe('https://www.glmprime.com/.well-known/security.txt');
  });

  it('n’expire pas dans le mois qui vient', () => {
    const expiration = Date.parse(champ('Expires') ?? '');
    expect(Number.isNaN(expiration)).toBe(false);
    const dansUnMois = Date.now() + 30 * 24 * 3600 * 1000;
    expect(expiration).toBeGreaterThan(dansUnMois);
  });
});
