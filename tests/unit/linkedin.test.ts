import { describe, expect, it } from 'vitest';
import { analyserPostLinkedIn } from '../../src/lib/linkedin';

describe('analyserPostLinkedIn', () => {
  it('déduit le lien public d’une URL d’intégration officielle', () => {
    expect(
      analyserPostLinkedIn(
        'https://www.linkedin.com/embed/feed/update/urn:li:share:7123456789012345678?compact=1',
      ),
    ).toEqual({
      embed: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7123456789012345678',
      lien: 'https://www.linkedin.com/feed/update/urn:li:share:7123456789012345678/',
    });
  });

  it('accepte les posts de type ugcPost', () => {
    expect(analyserPostLinkedIn(' https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:1 ').lien).toBe(
      'https://www.linkedin.com/feed/update/urn:li:ugcPost:1/',
    );
  });

  it.each([
    'https://www.linkedin.com/posts/glm_activity-123',
    'https://evil.example/embed/feed/update/urn:li:share:1',
    'https://www.linkedin.com/embed/feed/update/urn:li:share:abc',
    'javascript:alert(1)',
  ])('refuse l’URL « %s »', (url) => {
    expect(() => analyserPostLinkedIn(url)).toThrow();
  });
});
