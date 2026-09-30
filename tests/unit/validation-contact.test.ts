import { describe, expect, it } from 'vitest';
import { LIMITES, validerChamp, validerContact, type DonneesContact } from '../../src/lib/validation-contact';

const valide: DonneesContact = {
  nom: 'Camille Martin',
  email: 'camille@entreprise.fr',
  entreprise: '',
  sujet: 'Web & communication',
  message: 'Bonjour, nous aimerions refaire notre site.',
};

describe('validerContact', () => {
  it('accepte un message complet, entreprise facultative', () => {
    expect(validerContact(valide)).toEqual({});
  });

  it('signale chaque champ obligatoire vide avec un message précis', () => {
    const erreurs = validerContact({ nom: '', email: '', entreprise: '', sujet: '', message: '' });
    expect(erreurs).toEqual({
      nom: 'Indiquez votre nom.',
      email: 'Indiquez votre adresse e-mail.',
      sujet: 'Choisissez un sujet.',
      message: 'Écrivez votre message.',
    });
  });

  it('ignore les espaces autour des valeurs', () => {
    expect(validerChamp('nom', '   ')).toBe('Indiquez votre nom.');
    expect(validerChamp('nom', '  Al  ')).toBeUndefined();
  });
});

describe('validerChamp', () => {
  it.each(['camille', 'camille@', '@entreprise.fr', 'camille@entreprise', 'ca mille@entreprise.fr'])(
    'refuse l’adresse e-mail « %s »',
    (email) => {
      expect(validerChamp('email', email)).toMatch(/adresse e-mail valide/);
    },
  );

  it('refuse un sujet hors de la liste', () => {
    expect(validerChamp('sujet', 'Autre chose')).toBe('Choisissez un sujet.');
    expect(validerChamp('sujet', 'Automatisation & IA')).toBeUndefined();
  });

  it('applique les longueurs minimales et maximales', () => {
    expect(validerChamp('nom', 'A')).toMatch(/au moins 2/);
    expect(validerChamp('nom', 'A'.repeat(LIMITES.nom.max + 1))).toMatch(/dépasser 100/);
    expect(validerChamp('message', 'Trop court')).toBeUndefined();
    expect(validerChamp('message', 'Court')).toMatch(/au moins 10/);
    expect(validerChamp('message', 'x'.repeat(LIMITES.message.max + 1))).toMatch(/dépasser 5000/);
    expect(validerChamp('entreprise', 'x'.repeat(LIMITES.entreprise.max + 1))).toMatch(/dépasser 120/);
  });
});
