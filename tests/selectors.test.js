import { selectOne, selectCollection, selectMeta } from '../src/selectors';
import { entity } from '../src/entity';

const foo = entity('foo');
const bar = entity('bar', undefined, { foo });
const baz = entity('baz', undefined,{ bar: [bar] });
const faz = entity('faz');
const sin = entity('sin', undefined, undefined, { singleton: true });

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
    collections: {
      foo: {
        '#': {
          progress: 'failed',
          error: 'Not found',
        },
        '#page[2]': {
          progress: 'succeeded',
          meta: { count: 12 },
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
          meta: undefined,
          result: [4],
        },
      },
      baz: {
        '#': {
          progress: 'succeeded',
          meta: undefined,
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
      expect(selectOne(foo)(state, { id: 2 })).toStrictEqual({ id: 2, f: 'b' });
      expect(selectOne(baz)(state, { id: 7 }))
        .toStrictEqual({ id: 7, z: [], bar: [1, 4] });
    });

    it('selects one entity and hydrates the result', () => {
      expect(selectOne(foo, 1)(state, { id: 1 })).toStrictEqual({ id: 1, f: 'a' });
      expect(selectOne(bar, 1, 'x')(state, { x: 1 })).toStrictEqual(
        { id: 1, b: 1, foo: { id: 1, f: 'a' } }
      );
      expect(selectOne(baz, 1)(state, { id: 7 })).toStrictEqual(
        {
          id: 7,
          z: [],
          bar: [{ id: 1, b: 1, foo: 1 }, { id: 4, b: 3, foo: 3 }],
        }
      );
      expect(selectOne(baz, 2)(state, { id: 7 })).toStrictEqual(
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
      expect(selectOne({ key: 'nope' })(state, { id: 3 })).toBe(null);
    });

    it('selects one singleton', () => {
      expect(selectOne(sin)(state)).toStrictEqual({
        si: 'ng',
        le: 'ton',
      });
    });
  });

  describe('selectCollection', () => {
    it('selects filtered elements', () => {
      expect(selectCollection(foo)(state, { page: 2 })).toStrictEqual([
        { id: 1, f: 'a' },
        { id: 2, f: 'b' },
      ]);
    });

    it('returns an empty array when the entity in not in state', () => {
      expect(selectCollection({ key: 'no' })(state)).toStrictEqual([]);
    });

    it('selects and hydrates the result', () => {
      expect(selectCollection(baz, 1)(state)).toStrictEqual([
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

  describe('selectMeta', () => {
    it('selects nothing when the filter is not in state', () => {
      expect(selectMeta(foo)(state, { page: 11 })).toBe(undefined);
    });

    it('selects metadata when the filter is valid', () => {
      expect(selectMeta(foo)(state, { page: 2 })).toStrictEqual({ count: 12 });
      expect(selectMeta(bar)(state, { page: 1 })).toStrictEqual(undefined);
    });
  });
});
