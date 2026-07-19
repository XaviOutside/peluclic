import { describe, it, expect } from 'vitest';
import { sanitizeFtsQuery } from './sanitizeFtsQuery';

describe('sanitizeFtsQuery', () => {
  describe('stopword removal', () => {
    it('removes Spanish articles and prepositions', () => {
      const result = sanitizeFtsQuery('Calle de la Paz');
      expect(result.query).toBe('calle paz');
      expect(result.isEmpty).toBe(false);
    });

    it('removes English articles and prepositions', () => {
      const result = sanitizeFtsQuery('The Dog of the Park');
      expect(result.query).toBe('dog park');
      expect(result.isEmpty).toBe(false);
    });

    it('returns isEmpty=true for all-stopword query', () => {
      const result = sanitizeFtsQuery('de la');
      expect(result.isEmpty).toBe(true);
      expect(result.query).toBe('');
    });

    it('returns isEmpty=true for single stopword', () => {
      const result = sanitizeFtsQuery('el');
      expect(result.isEmpty).toBe(true);
    });

    it('returns isEmpty=true for "the"', () => {
      const result = sanitizeFtsQuery('the');
      expect(result.isEmpty).toBe(true);
    });

    it('returns isEmpty=true for mixed stopwords', () => {
      const result = sanitizeFtsQuery('de the la');
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('whitespace normalization', () => {
    it('trims leading and trailing whitespace', () => {
      const result = sanitizeFtsQuery('  golden retriever  ');
      expect(result.query).toBe('golden retriever');
    });

    it('collapses multiple internal spaces', () => {
      const result = sanitizeFtsQuery('golden   retriever');
      expect(result.query).toBe('golden retriever');
    });

    it('handles whitespace-only input', () => {
      const result = sanitizeFtsQuery('   ');
      expect(result.isEmpty).toBe(true);
      expect(result.query).toBe('');
    });
  });

  describe('lowercasing', () => {
    it('lowercases mixed-case input', () => {
      const result = sanitizeFtsQuery('Labrador');
      expect(result.query).toBe('labrador');
    });

    it('lowercases and strips stopwords', () => {
      const result = sanitizeFtsQuery('De La Cruz');
      expect(result.query).toBe('cruz');
    });
  });

  describe('edge cases', () => {
    it('returns empty for empty string', () => {
      const result = sanitizeFtsQuery('');
      expect(result.isEmpty).toBe(true);
      expect(result.query).toBe('');
    });

    it('preserves a normal term without modification', () => {
      const result = sanitizeFtsQuery('labrador');
      expect(result.query).toBe('labrador');
      expect(result.isEmpty).toBe(false);
    });

    it('handles accented stopwords', () => {
      const result = sanitizeFtsQuery('según la paz');
      expect(result.query).toBe('paz');
      expect(result.isEmpty).toBe(false);
    });
  });
});
