import { describe, it, expect } from 'vitest';
import { saneValidateFtsOutput, saneValidateQuery } from './sane';

describe('saneValidateFtsOutput', () => {
  describe('valid output passes', () => {
    it('accepts an array of {id: number}', () => {
      const result = [{ id: 1 }, { id: 5 }, { id: 42 }];
      expect(() => saneValidateFtsOutput(result)).not.toThrow();
    });

    it('accepts an empty array', () => {
      const result: Array<{ id: number }> = [];
      expect(() => saneValidateFtsOutput(result)).not.toThrow();
    });

    it('accepts a single-element array', () => {
      const result = [{ id: 99 }];
      expect(() => saneValidateFtsOutput(result)).not.toThrow();
    });
  });

  describe('invalid shape caught', () => {
    it('throws on non-array input', () => {
      expect(() => saneValidateFtsOutput({ rows: [{ id: 1 }] })).toThrow('SANE_ERROR');
    });

    it('throws on null input', () => {
      expect(() => saneValidateFtsOutput(null)).toThrow('SANE_ERROR');
    });

    it('throws on row with wrong key {client_id}', () => {
      const result = [{ client_id: 1 }];
      expect(() => saneValidateFtsOutput(result)).toThrow("missing 'id' key");
    });

    it('throws on row with completely wrong shape', () => {
      const result = [{ name: 'Juan' }];
      expect(() => saneValidateFtsOutput(result)).toThrow("missing 'id' key");
    });

    it('throws on row with null value', () => {
      const result = [null];
      expect(() => saneValidateFtsOutput(result)).toThrow('SANE_ERROR');
    });

    it('throws on row with string value', () => {
      const result = ['bad'];
      expect(() => saneValidateFtsOutput(result)).toThrow('SANE_ERROR');
    });
  });

  describe('invalid id values caught', () => {
    it('throws on negative id', () => {
      const result = [{ id: -1 }];
      expect(() => saneValidateFtsOutput(result)).toThrow('SANE_ERROR');
    });

    it('throws on zero id', () => {
      const result = [{ id: 0 }];
      expect(() => saneValidateFtsOutput(result)).toThrow('SANE_ERROR');
    });

    it('throws on non-integer id', () => {
      const result = [{ id: 1.5 }];
      expect(() => saneValidateFtsOutput(result)).toThrow('SANE_ERROR');
    });

    it('throws on string id', () => {
      const result = [{ id: '1' }];
      expect(() => saneValidateFtsOutput(result)).toThrow('SANE_ERROR');
    });
  });

  describe('max rows limit', () => {
    it('throws when result exceeds 10000 rows', () => {
      const result = Array.from({ length: 10_001 }, (_, i) => ({ id: i + 1 }));
      expect(() => saneValidateFtsOutput(result)).toThrow('exceeds max rows');
    });

    it('accepts exactly 10000 rows', () => {
      const result = Array.from({ length: 10_000 }, (_, i) => ({ id: i + 1 }));
      expect(() => saneValidateFtsOutput(result)).not.toThrow();
    });
  });
});

describe('saneValidateQuery', () => {
  describe('valid queries pass', () => {
    it('accepts a normal query', () => {
      expect(() => saneValidateQuery('calle paz')).not.toThrow();
    });

    it('accepts a 3-char query', () => {
      expect(() => saneValidateQuery('bra')).not.toThrow();
    });

    it('accepts a long query', () => {
      expect(() => saneValidateQuery('labrador golden retriever')).not.toThrow();
    });

    it('accepts empty string (allowed no-op)', () => {
      expect(() => saneValidateQuery('')).not.toThrow();
    });
  });

  describe('forbidden operators caught', () => {
    it('throws on double-quote in query', () => {
      expect(() => saneValidateQuery('calle "paz"')).toThrow('SANE_ERROR');
    });

    it('throws on plus sign in query', () => {
      expect(() => saneValidateQuery('+paz')).toThrow('SANE_ERROR');
    });

    it('throws on minus sign in query', () => {
      expect(() => saneValidateQuery('calle -paz')).toThrow('SANE_ERROR');
    });

    it('throws on asterisk in query', () => {
      expect(() => saneValidateQuery('paz*')).toThrow('SANE_ERROR');
    });

    it('throws on parentheses in query', () => {
      expect(() => saneValidateQuery('(calle)')).toThrow('SANE_ERROR');
    });
  });

  describe('minimum length gate', () => {
    it('throws on 1-char query', () => {
      expect(() => saneValidateQuery('a')).toThrow('at least 3 characters');
    });

    it('throws on 2-char query', () => {
      expect(() => saneValidateQuery('ab')).toThrow('at least 3 characters');
    });

    it('does not throw on empty query', () => {
      expect(() => saneValidateQuery('')).not.toThrow();
    });
  });
});
