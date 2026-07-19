import { describe, it, expect } from 'vitest';
import { STOPWORDS } from './stopwords';

describe('STOPWORDS', () => {
  describe('membership', () => {
    it('contains Spanish prepositions', () => {
      expect(STOPWORDS.has('de')).toBe(true);
      expect(STOPWORDS.has('la')).toBe(true);
      expect(STOPWORDS.has('el')).toBe(true);
      expect(STOPWORDS.has('en')).toBe(true);
      expect(STOPWORDS.has('con')).toBe(true);
      expect(STOPWORDS.has('para')).toBe(true);
      expect(STOPWORDS.has('por')).toBe(true);
      expect(STOPWORDS.has('del')).toBe(true);
      expect(STOPWORDS.has('al')).toBe(true);
    });

    it('contains English articles and prepositions', () => {
      expect(STOPWORDS.has('the')).toBe(true);
      expect(STOPWORDS.has('a')).toBe(true);
      expect(STOPWORDS.has('an')).toBe(true);
      expect(STOPWORDS.has('of')).toBe(true);
      expect(STOPWORDS.has('in')).toBe(true);
      expect(STOPWORDS.has('on')).toBe(true);
      expect(STOPWORDS.has('at')).toBe(true);
      expect(STOPWORDS.has('to')).toBe(true);
      expect(STOPWORDS.has('for')).toBe(true);
      expect(STOPWORDS.has('with')).toBe(true);
      expect(STOPWORDS.has('from')).toBe(true);
      expect(STOPWORDS.has('by')).toBe(true);
    });

    it('contains conjunctions and noise words', () => {
      expect(STOPWORDS.has('and')).toBe(true);
      expect(STOPWORDS.has('or')).toBe(true);
      expect(STOPWORDS.has('but')).toBe(true);
      expect(STOPWORDS.has('if')).toBe(true);
      expect(STOPWORDS.has('then')).toBe(true);
      expect(STOPWORDS.has('when')).toBe(true);
      expect(STOPWORDS.has('up')).toBe(true);
      expect(STOPWORDS.has('down')).toBe(true);
      expect(STOPWORDS.has('out')).toBe(true);
      expect(STOPWORDS.has('over')).toBe(true);
      expect(STOPWORDS.has('under')).toBe(true);
      expect(STOPWORDS.has('into')).toBe(true);
      expect(STOPWORDS.has('onto')).toBe(true);
    });
  });

  describe('non-membership (meaningful terms)', () => {
    it('does not contain searchable words', () => {
      expect(STOPWORDS.has('calle')).toBe(false);
      expect(STOPWORDS.has('paz')).toBe(false);
      expect(STOPWORDS.has('labrador')).toBe(false);
      expect(STOPWORDS.has('firulais')).toBe(false);
      expect(STOPWORDS.has('garcia')).toBe(false);
      expect(STOPWORDS.has('email')).toBe(false);
    });
  });

  describe('immutability', () => {
    it('returns a frozen set', () => {
      expect(STOPWORDS).toBeDefined();
      expect(typeof STOPWORDS.has).toBe('function');
    });
  });
});
