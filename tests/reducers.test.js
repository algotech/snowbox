import { snowboxReducer } from '../src/reducers';
import { actions } from '../src/constants';
import { success, failure } from '../src/actions';

const foo = { key: 'foo' };
const bar = { key: 'bar' };

const action = (type, entity, data, entities, result, error, statusCode) => ({
  type, entity, data, entities, result, error, statusCode,
});

describe.only('reducers', () => {
  it('handles FETCH action', () => {
    const state = snowboxReducer(undefined, action(actions.FETCH, foo));

    expect(state).toStrictEqual({
      entities: {},
      meta: { foo: { '#': { progress: 'pending' } } },
    });
  });

  it('handles FETCH action with filters', () => {
    const state = snowboxReducer(
      {
        entities: {},
        meta: { foo: { '#': { progress: 'pending' } } },
      },
      action(actions.FETCH, foo, { page: 2 })
    );

    expect(state).toStrictEqual({
      entities: {},
      meta: { foo: {
        '#': { progress: 'pending' },
        '#page[2]': { progress: 'pending' },
      } },
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
      },
      action(
        success(actions.FETCH),
        foo,
        { page: 2 },
        { foo: { 1: { id: 1 }, 2: { id: 2 } } },
        [1, 2]
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          1: { id: 1 },
          2: { id: 2 },
        },
      },
      meta: { foo: {
        '#': { progress: 'pending' },
        '#page[2]': {
          progress: 'succeeded',
          result: [1, 2],
        },
      } },
    });
  });

  it('handles failed FETCH', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            1: { id: 1 },
            2: { id: 2 },
          },
        },
        meta: { foo: {
          '#': { progress: 'pending' },
          '#page[2]': {
            progress: 'succeeded',
            result: [1, 2],
          },
        } },
      },
      action(
        failure(actions.FETCH),
        foo,
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
          1: { id: 1 },
          2: { id: 2 },
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
    });
  });

  it('handles successful REMOVE with number data', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            1: { id: 1 },
            2: { id: 2 },
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
          1: { id: 1 },
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
    });
  });

  it('handles successful REMOVE with object data', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            1: { id: 1 },
            2: { id: 2 },
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
      },
      action(
        success(actions.REMOVE),
        foo,
        { id: 1 }
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          2: { id: 2 },
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
    });
  });

  it('handles array of entities', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            2: { id: 2 },
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
      },
      action(
        success(actions.FETCH),
        [bar],
        { page: 1 },
        { bar: { 1: { id: 1, b: 1 }, 4: { id: 4, b: 3 } } },
        [1, 4]
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          2: { id: 2 },
        },
        bar: {
          1: { id: 1, b: 1 },
          4: { id: 4, b: 3 },
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
          },
        },
      },
    });
  });

  it('does nothing when the action is not handled', () => {
    const state = snowboxReducer(
      {
        entities: {
          foo: {
            2: { id: 2 },
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
      },
      action(
        'RANDOM_ACTION',
        foo,
        { id: 1 }
      )
    );

    expect(state).toStrictEqual({
      entities: {
        foo: {
          2: { id: 2 },
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
    });
  });
});
