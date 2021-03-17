import { normalize } from 'normalizr';

import * as mw from '../src/middleware';

jest.mock('normalizr');

const FROZEN_TIME = 123;

const err = new Error('Bad request');
err.status = 400;

const request = success => async d => {
  if (success) {
    return { e: { ...d } };
  }

  throw err;
};

const mockRequest = success => jest.fn(request(success));

const getEntity = (success, staleTimeout) => ({
  provider: {
    upsert: mockRequest(success),
    remove: mockRequest(success),
    fetch: mockRequest(success),
    find: mockRequest(success),
  },
  staleTimeout,
  key: 'e',
  idAttribute: 'id',
  entitiesPath: 'e',
});

const actionCreator = (type, success, staleTimeout, refresh) => ({
  type: `snowbox/${type}`,
  entity: type == 'FETCH' ?
    [getEntity(success, staleTimeout)] :
    getEntity(success, staleTimeout),
  data: { id: 3 },
  options: { refresh },
  success: (data, entities, result, meta, date) => (
    { data, entities, result, meta, date }
  ),
  failure: (data, error, statusCode) => ({ data, error, statusCode }),
});

describe('middleware', () => {
  let next;

  beforeAll(() => {
    next = jest.fn(a => a);
    normalize.mockImplementation(
      (data, entity) => ({ entities: 1, result: 2 })
    );
    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => FROZEN_TIME);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    next.mockClear();
    normalize.mockClear();
  });

  it('ignores non snowbox actions', async () => {
    const action = { type: 'IRRELEVANT', some: 'field' };

    const result = await mw.snowboxMiddleware({})(next)(action);

    expect(result).toStrictEqual(action);
    expect(next.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0]).toStrictEqual(action);
  });

  describe.each(
    ['upsert', 'remove', 'find', 'fetch']
  )('handles %s action', method => {
    const store = { getState: () => {} };

    test('when succeeds', async () => {
      const action = actionCreator(method.toUpperCase(), true);
      const provider = method == 'fetch' ?
        action.entity[0].provider :
        action.entity.provider;
      const result = await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(provider[method].mock.calls[0][0]).toBe(action.data);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        data: { id: 3 },
        entities: method == 'remove' ? undefined : 1,
        result: method == 'remove' ? undefined : 2,
        meta: method === 'fetch' ? {} : undefined,
        date: method == 'remove' ? undefined : FROZEN_TIME,
      });
      expect(normalize.mock.calls.length).toBe(method == 'remove' ? 0 : 1);

      if (method == 'fetch') {
        expect(normalize.mock.calls[0][0]).toStrictEqual({ id: 3 });
      }

      if (method != 'remove') {
        expect(normalize.mock.calls[0][0]).toStrictEqual(action.data);
        expect(normalize.mock.calls[0][1]).toStrictEqual(action.entity);
      }
    });

    test('when fails', async () => {
      const action = actionCreator(method.toUpperCase(), false);
      const provider = method == 'fetch' ?
        action.entity[0].provider :
        action.entity.provider;
      const result = await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(provider[method].mock.calls[0][0]).toBe(action.data);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        data: { id: 3 },
        error: err,
        statusCode: 400,
      });
      expect(normalize.mock.calls.length).toBe(0);
    });
  });

  describe('singletons', () => {
    const store = { getState: () => {} };

    it('handles singletons correctly', async () => {
      const entity = {
        key: 's',
        singleton: true,
        provider: { fetch: jest.fn(async () => 'r') },
      };
      const action = {
        type: 'snowbox/FETCH',
        entity,
        data: { d: 'd' },
        success: (data, entities, result, meta, date) => (
          { data, entities, result, meta, date }
        ),
        failure: (data, error, statusCode) => ({ data, error, statusCode }),
      };
      const provider = action.entity.provider;
      const result = await mw.snowboxMiddleware(store)(next)(action);

      expect(provider.fetch.mock.calls.length).toBe(1);
      expect(provider.fetch.mock.calls[0][0]).toBe(action.data);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        data: { d: 'd' },
        entities: undefined,
        result: 'r',
        meta: undefined,
        date: FROZEN_TIME,
      });
      expect(normalize.mock.calls.length).toBe(0);
    });
  });

  describe('sateTimeout option', () => {
    const store = {
      getState: () => ({ snowbox: {
        meta: { e: { '#id[3]': { __updatedAt: 100 } } },
        entities: { e: { 3: { id: 3, __updatedAt: 100 } } },
      }}),
    };

    describe.each(
      ['upsert', 'remove']
    )('for %s actions', method => {
      test('doesn nothing', async () => {
        const action = actionCreator(method.toUpperCase(), true);
        const provider = action.entity.provider;
        await mw.snowboxMiddleware(store)(next)(action);

        expect(provider[method].mock.calls.length).toBe(1);
        expect(next.mock.calls.length).toBe(2);
      });
    });

    it('does nothing when the entity does not have staleTimeout', async () => {
      const method = 'fetch';
      const action = actionCreator(method.toUpperCase(), true);
      const provider = action.entity[0].provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(next.mock.calls.length).toBe(2);
    });

    it('does nothing when the action explicitly ask fresh data', async () => {
      const method = 'find';
      const action = actionCreator(method.toUpperCase(), true, 11, true);
      const provider = action.entity.provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(next.mock.calls.length).toBe(2);
    });

    it('does not fetch new data when the entity is fresh', async () => {
      const method = 'find';
      const action = actionCreator(method.toUpperCase(), true, 100);
      const provider = action.entity.provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(0);
      expect(next.mock.calls.length).toBe(1);
    });

    it('does not fetch new data when the page is fresh', async () => {
      const method = 'fetch';
      const action = actionCreator(method.toUpperCase(), true, 100);
      const provider = action.entity[0].provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(0);
      expect(next.mock.calls.length).toBe(1);
    });

    it('fetches new data when the entity is stale', async () => {
      const method = 'find';
      const action = actionCreator(method.toUpperCase(), true, 10);
      const provider = action.entity.provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(next.mock.calls.length).toBe(2);

    });

    it('fetches new data when the page is stale', async () => {
      const method = 'fetch';
      const action = actionCreator(method.toUpperCase(), true, 10);
      const provider = action.entity[0].provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(next.mock.calls.length).toBe(2);
    });
  });

  describe('shouldFetchData', () => {
    const entity = {
      key: 'baz',
      singleton: true,
      staleTimeout: 10,
    };

    it('returns true when the singleton is stale', () => {
      const result = mw.shouldFetchData(
        {
          snowbox: { singletons: { baz: { a: 'b', __updatedAt: 100 } } },
        },
        entity,
        { data: {} }
      );

      expect(result).toBe(true);
    });

    it('returns false when the singleton is fresh', () => {
      const result = mw.shouldFetchData(
        {
          snowbox: { singletons: { baz: { a: 'b', __updatedAt: 120 } } },
        },
        entity,
        { data: {} }
      );

      expect(result).toBe(false);
    });

    it('returns true when the state data does not have update date', () => {
      const result = mw.shouldFetchData(
        {
          snowbox: { singletons: { baz: { a: 'b' } } },
        },
        entity,
        { data: {} }
      );

      expect(result).toBe(true);
    });
  });

  describe('getEntitiesData', () => {
    const response = { e: 'e', f: 'f', m: 'm' };

    describe('method is not fetch', () => {
      describe('neither entitiesPath not fetchEntitiesPath is defined', () => {
        it('returns the response', () => {
          expect(mw.getEntitiesData('find', {}, response))
            .toStrictEqual(response);
          expect(mw.getEntitiesData('upsert', {}, response))
            .toStrictEqual(response);
          expect(mw.getEntitiesData('remove', {}, response))
            .toStrictEqual(response);
        });
      });

      describe('both entitiesPath and fetchEntitiesPath are defined', () => {
        it('returns the data at entitiesPath', () => {
          const entity = { entitiesPath: 'e', fetchEntitiesPath: 'f' };

          expect(mw.getEntitiesData('find', entity, response))
            .toStrictEqual(response.e);
          expect(mw.getEntitiesData('upsert', entity, response))
            .toStrictEqual(response.e);
          expect(mw.getEntitiesData('remove', entity, response))
            .toStrictEqual(response.e);
        });
      });
    });

    describe('method is fetch', () => {
      describe('both entitiesPath and fetchEntitiesPath are defined', () => {
        it('returns the data at entitiesPath', () => {
          const entity = { entitiesPath: 'e', fetchEntitiesPath: 'f' };

          expect(mw.getEntitiesData('fetch', entity, response))
            .toStrictEqual(response.f);
        });
      });

      describe('only entitiesPath is defined', () => {
        it('returns the response', () => {
          expect(mw.getEntitiesData('fetch', { entitiesPath: 'e' }, response))
            .toStrictEqual(response.e);
        });
      });

      describe('neither entitiesPath not fetchEntitiesPath is defined', () => {
        it('returns the response', () => {
          expect(mw.getEntitiesData('fetch', {}, response))
            .toStrictEqual(response);
        });
      });
    })
  });

  describe('getMetaData', () => {
    const response = { e: 'e', f: 'f', m: 'm' };

    describe('method is not fetch', () => {
      it('returns undefined', () => {
        const entity = { entitiesPath: 'e', fetchEntitiesPath: 'f' };

        expect(mw.getMetaData('upsert', entity, response)).toBe(undefined);
        expect(mw.getMetaData('remove', entity, response)).toBe(undefined);
        expect(mw.getMetaData('find', entity, response)).toBe(undefined);
      });
    });

    describe('method is fetch', () => {
      describe('both entitiesPath and fetchEntitiesPath are defined', () => {
        it('returns the response without fetchEntitiesPath', () => {
          const entity = { entitiesPath: 'e', fetchEntitiesPath: 'f' };

          expect(mw.getMetaData('fetch', entity, response)).toStrictEqual(
            { e: 'e', m: 'm' }
          );
        });
      });

      describe('only entitiesPath is defined', () => {
        it('returns the response without fetchEntitiesPath', () => {
          const entity = { entitiesPath: 'e' };

          expect(mw.getMetaData('fetch', entity, response)).toStrictEqual(
            { f: 'f', m: 'm' }
          );
        });
      });

      describe('only fetchEntitiesPath is defined', () => {
        it('returns the response without fetchEntitiesPath', () => {
          const entity = { fetchEntitiesPath: 'f' };

          expect(mw.getMetaData('fetch', entity, response)).toStrictEqual(
            { e: 'e', m: 'm' }
          );
        });
      });

      describe('neither entitiesPath not fetchEntitiesPath are defined', () => {
        it('returns undefined', () => {
          expect(mw.getMetaData('fetch', {}, response)).toStrictEqual(
            undefined
          );
        });
      });
    });
  });
});
