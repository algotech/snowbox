import { selectOne, selectMany } from '../src/selectors';

const foo = { key: 'foo' };
const bar = { key: 'bar', schema: { foo } };
const baz = { key: 'baz', schema: { bar: [bar] } };
const faz = { key: 'faz' };
const sin = { key: 'sin', singleton: true };

const state = {
  snowbox: {
    entities: {
      foo: {
        1: { id: 1, f: 'a' },
        2: { id: 2, f: 'b' },
        3: { id: 3, f: 'c' },
      },
      bar: {
        1: { id: 1, b: 1, foo: 1 },
        4: { id: 4, b: 3, foo: 3 },
      },
      baz: {
        7: { id: 7, z: [], bar: [1, 4] },
        9: { id: 9, z: [0], bar: [] },
      },
      faz: {
        5: { id: 5, w: false },
        6: { id: 6, w: true },
      },
    },
    meta: {
      foo: {
        '#': {
          progress: 'failed',
          error: 'Not found',
        },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
        },
      },
      bar: {
        '#': {
          progress: 'succeeded',
          result: [1],
        },
        '#page[1]': {
          progress: 'succeeded',
          result: [4],
        },
      },
      baz: {
        '#': {
          progress: 'succeeded',
          result: [7, 9],
        },
      },
    },
    singletons: {
      sin: {
        si: 'ng',
        le: 'ton',
      },
    },
  },
};

describe('selectors', () => {
  describe('selectOne', () => {
    it('selects one entity without hydration', () => {
      expect(selectOne(foo)(2)(state)).toStrictEqual({ id: 2, f: 'b' });
      expect(selectOne(baz)(7)(state))
        .toStrictEqual({ id: 7, z: [], bar: [1, 4] });
    });

    it('selects one entity and hydrates the result', () => {
      expect(selectOne(foo, 1)(1)(state)).toStrictEqual({ id: 1, f: 'a' });
      expect(selectOne(bar, 1)(1)(state)).toStrictEqual(
        { id: 1, b: 1, foo: { id: 1, f: 'a' } }
      );
      expect(selectOne(baz, 1)(7)(state)).toStrictEqual(
        {
          id: 7,
          z: [],
          bar: [{ id: 1, b: 1, foo: 1 }, { id: 4, b: 3, foo: 3 }],
        }
      );
      expect(selectOne(baz, 2)(7)(state)).toStrictEqual(
        {
          id: 7,
          z: [],
          bar: [
            { id: 1, b: 1, foo: { id: 1, f: 'a' } },
            { id: 4, b: 3, foo: { id: 3, f: 'c' } },
          ],
        },
      );
    });

    it('selects null when the entity is not present', () => {
      expect(selectOne({ key: 'nope' })(3)(state)).toBe(null);
    });

    it('selects one singleton', () => {
      expect(selectOne(sin)()(state)).toStrictEqual({
        si: 'ng',
        le: 'ton',
      });
    });
  });

  describe('selectMany', () => {
    it('selects all the elements when no filter is defined', () => {
      expect(selectMany(foo)()(state)).toStrictEqual([
        { id: 1, f: 'a' },
        { id: 2, f: 'b' },
        { id: 3, f: 'c' },
      ]);
      expect(selectMany(baz)()(state)).toStrictEqual([
        { id: 7, z: [], bar: [1, 4] },
        { id: 9, z: [0], bar: [] },
      ]);
      expect(selectMany(bar)()(state)).toStrictEqual([
        { id: 1, b: 1, foo: 1 },
      ]);
      expect(selectMany(faz)()(state)).toStrictEqual([
        { id: 5, w: false },
        { id: 6, w: true },
      ]);
    });

    it('selects filtered elements', () => {
      expect(selectMany(foo)({ page: 2 })(state)).toStrictEqual([
        { id: 1, f: 'a' },
        { id: 2, f: 'b' },
      ]);
    });

    it('returns an empty array when the entity in not in state', () => {
      expect(selectMany({ key: 'no' })()(state)).toStrictEqual([]);
    });

    it('selects and hydrates the result', () => {
      expect(selectMany(baz, 1)()(state)).toStrictEqual([
        {
          id: 7,
          z: [],
          bar: [{ id: 1, b: 1, foo: 1 }, { id: 4, b: 3, foo: 3 }],
        },
        {
          id: 9,
          z: [0],
          bar: [],
        },
      ]);
    });
  });
});
