import { describe, expect, it } from 'vitest';
import {
  CLE_CONSENTEMENT,
  DUREE_CONSENTEMENT_MS,
  enregistrerConsentement,
  lireConsentement,
} from '../../src/lib/consentement';

function stockageMemoire() {
  const donnees = new Map<string, string>();
  return {
    donnees,
    getItem: (cle: string) => donnees.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => void donnees.set(cle, valeur),
    removeItem: (cle: string) => void donnees.delete(cle),
  };
}

describe('consentement LinkedIn', () => {
  it('ne suppose aucun consentement par défaut', () => {
    expect(lireConsentement(stockageMemoire())).toBeNull();
  });

  it('mémorise l’acceptation et le refus', () => {
    const stockage = stockageMemoire();
    enregistrerConsentement(stockage, 'accepte', 1000);
    expect(lireConsentement(stockage, 2000)).toBe('accepte');
    enregistrerConsentement(stockage, 'refuse', 3000);
    expect(lireConsentement(stockage, 4000)).toBe('refuse');
  });

  it('redemande le consentement après 6 mois', () => {
    const stockage = stockageMemoire();
    enregistrerConsentement(stockage, 'accepte', 0);
    expect(lireConsentement(stockage, DUREE_CONSENTEMENT_MS + 1)).toBeNull();
    expect(stockage.donnees.has(CLE_CONSENTEMENT)).toBe(false);
  });

  it('ignore une valeur corrompue ou modifiée', () => {
    const stockage = stockageMemoire();
    stockage.setItem(CLE_CONSENTEMENT, '{pas du json');
    expect(lireConsentement(stockage)).toBeNull();
    stockage.setItem(CLE_CONSENTEMENT, JSON.stringify({ choix: 'oui', date: Date.now() }));
    expect(lireConsentement(stockage)).toBeNull();
  });
});
