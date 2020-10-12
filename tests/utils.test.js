import { buildKey } from '../src/utils';

describe('utils', () => {
  describe('buildKey', () => {
    it('returns the default key when the filters are not defined', () => {
      expect(buildKey()).toBe('#');
      expect(buildKey(null)).toBe('#');
      expect(buildKey('abc')).toBe('#');
      expect(buildKey(123)).toBe('#');
      expect(buildKey(true)).toBe('#');
      expect(buildKey([])).toBe('#');
      expect(buildKey([1, 2, 4])).toBe('#');
    });

    it('calculates the key when the filters are defined', () => {
      expect(buildKey({ m: 'zd', mx: 5 })).toBe('#m[zd]mx[5]');
    });
  });
});
