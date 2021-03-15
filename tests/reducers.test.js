import { snowboxReducer } from '../src/reducers';
import { actions } from '../src/constants';
import { entity } from '../src/entity';
import { success, failure, clearAll } from '../src/actions';

const foo = entity('foo', undefined, undefined, { idAttribute: 'key' });
const bar = entity('bar');
const baz = entity('baz', undefined, undefined, { singleton: true });

const action = (
  type,
  entity,
  data,
  entities,
  result,
  date,
  error,
  statusCode
) => ({
  type, entity, data, entities, result, date, error, statusCode,
});

describe('reducers', () => {
  it('handles FETCH action', () => {
    const state = snowboxReducer(undefined, action(actions.FETCH, foo));

    expect(state).toStrictEqual({
      entities: {},
      meta: { foo: { '#': { progress: 'pending' } } },
      singletons: {},
    });
  });

  it('handles FETCH action with filters', () => {
    const state = snowboxReducer(
      {
        entities: {},
        meta: { foo: { '#': { progress: 'pending' } } },
        singletons: {},
      },
      action(actions.FETCH, foo, { page: 2 })
    );

    expect(state).toStrictEqual({
      entities: {},
      meta: { foo: {
        '#': { progress: 'pending' },
        '#page[2]': { progress: 'pending' },
      } },
      singletons: {},
    });
  });

  it('handles successful FETCH', () => {
    const state = snowboxReducer(
      {
        entities: {},
        meta: { foo: {
          '#': { progress: 'pending' },
          '#page[2]': { progress: 'pending' },
        } },
        singletons: {},
      },
      action(
        success(actions.FETCH),
        foo,
        { page: 2 },
        { foo: { 1: { key: 1 }, 2: { key: 2 } } },
        [1, 2],
        'date'
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          1: { key: 1, __updatedAt: 'date' },
          2: { key: 2, __updatedAt: 'date' },
        },
      },
      meta: { foo: {
        '#': { progress: 'pending' },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
          __updatedAt: 'date',
        },
      } },
      singletons: {},
    });
  });

  it('handles failed FETCH', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            1: { key: 1 },
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': { progress: 'pending' },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
        singletons: {},
      },
      action(
        failure(actions.FETCH),
        foo,
        undefined,
        undefined,
        undefined,
        undefined,
        'Not found',
        404
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          1: { key: 1 },
          2: { key: 2 },
        },
      },
      meta: { foo: {
        '#': {
          progress: 'failed',
          error: 'Not found',
        },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
        },
      } },
      singletons: {},
    });
  });

  it('handles successful REMOVE with number data', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            1: { key: 1 },
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': {
            progress: 'failed',
            error: 'Not found',
          },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
        singletons: {},
      },
      action(
        success(actions.REMOVE),
        foo,
        2
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          1: { key: 1 },
        },
      },
      meta: { foo: {
        '#': {
          progress: 'failed',
          error: 'Not found',
        },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
        },
      } },
      singletons: {},
    });
  });

  it('handles successful REMOVE with object data', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            1: { key: 1 },
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': {
            progress: 'failed',
            error: 'Not found',
          },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
        singletons: {},
      },
      action(
        success(actions.REMOVE),
        foo,
        { key: 1 }
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          2: { key: 2 },
        },
      },
      meta: { foo: {
        '#': {
          progress: 'failed',
          error: 'Not found',
        },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
        },
      } },
      singletons: {},
    });
  });

  it('handles array of entities', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': {
            progress: 'failed',
            error: 'Not found',
          },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
        singletons: {},
      },
      action(
        success(actions.FETCH),
        [bar],
        { page: 1 },
        { bar: { 1: { id: 1, b: 1 }, 4: { id: 4, b: 3 } } },
        [1, 4],
        't'
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          2: { key: 2 },
        },
        bar: {
          1: { id: 1, b: 1, __updatedAt: 't' },
          4: { id: 4, b: 3, __updatedAt: 't' },
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
          '#page[1]': {
            progress: 'succeeded',
            result: [1, 4],
            __updatedAt: 't'
          },
        },
      },
      singletons: {},
    });
  });

  it('adds new pages to the existing meta structure', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': {
            progress: 'failed',
            error: 'Not found',
          },
          '#page[2]': {
            progress: 'succeeded',
            result: [2],
          },
        } },
        singletons: {},
      },
      action(
        success(actions.FETCH),
        [foo],
        { page: 1 },
        {
          foo: {
            1: { key: 1},
            3: { key: 3 },
          }
        },
        [1, 3]
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          1: { key: 1, __updatedAt: undefined },
          2: { key: 2 },
          3: { key: 3, __updatedAt: undefined },
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
            result: [2],
          },
          '#page[1]': {
            progress: 'succeeded',
            result: [1, 3],
            __updatedAt: undefined,
          },
        },
      },
      singletons: {},
    });
  });

  it('does nothing when the action is not handled', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': {
            progress: 'failed',
            error: 'Not found',
          },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
        singletons: {},
      },
      action(
        'RANDOM_ACTION',
        foo,
        { key: 1 }
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          2: { key: 2 },
        },
      },
      meta: { foo: {
        '#': {
          progress: 'failed',
          error: 'Not found',
        },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
        },
      } },
      singletons: {},
    });
  });

  it('resets the state when the clear action is dispatched', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            2: { key: 2 },
          },
        },
        meta: { foo: {
          '#': {
            progress: 'failed',
            error: 'Not found',
          },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
        singletons: {},
      },
      clearAll()
    );

    expect(state).toStrictEqual({
      entities: {},
      meta: {},
      singletons: {},
    });
  });

  describe('singletons', () => {
    it('saves the data when the entity is fetched', () => {
      const state = snowboxReducer(
        {
          entities: { foo: { 2: { key: 2 } } },
          meta: { foo: { '#': { progress: 'failed', error: 'Not found' } } },
          singletons: {},
        },
        action(success(actions.FIND), baz, {}, undefined, { single: 'ton' })
      );

      expect(state).toStrictEqual({
        entities: { foo: { 2: { key: 2 } } },
        meta: { foo: { '#': { progress: 'failed', error: 'Not found' } } },
        singletons: {
          baz: { single: 'ton', __updatedAt: undefined },
        },
      });
    });

    it('saves the data when the entity is upserted', () => {
      const state = snowboxReducer(
        {
          entities: { foo: { 2: { key: 2 } } },
          meta: { foo: { '#': { progress: 'failed', error: 'Not found' } } },
          singletons: {},
        },
        action(
          success(actions.UPSERT), baz, {}, undefined, { single: 'ton' }, 'd'
        )
      );

      expect(state).toStrictEqual({
        entities: { foo: { 2: { key: 2 } } },
        meta: { foo: { '#': { progress: 'failed', error: 'Not found' } } },
        singletons: {
          baz: { single: 'ton', __updatedAt: 'd' },
        },
      });
    });

    it('removes the data when the entity is removed', () => {
      const state = snowboxReducer(
        {
          entities: { foo: { 2: { key: 2 } } },
          meta: { foo: { '#': { progress: 'failed', error: 'Not found' } } },
          singletons: {
            baz: { single: 'ton', __updatedAt: 'd' },
          },
        },
        action(
          success(actions.REMOVE), baz
        )
      );

      expect(state).toStrictEqual({
        entities: { foo: { 2: { key: 2 } } },
        meta: { foo: { '#': { progress: 'failed', error: 'Not found' } } },
        singletons: {},
      });
    });
  });
});
