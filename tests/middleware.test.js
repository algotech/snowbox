import { normalize } from 'normalizr';

import { actions } from '../src/constants';
import * as mw from '../src/middleware';
import Response from '../src/Response';

jest.mock('normalizr');

const FROZEN_TIME = 123;

const options = {
  entityPath: 'e',
  entitiesFieldName: 'e',
  entitiesPath: 'e',
  metaPath: 'm',
  hasMeta: true,
};

const err = new Error('Bad request');
err.status = 400;

const request = (success, isFetch) => async d => {
  if (success) {
    return new Response({ e: { ...d }, m: 'meta' }, options, isFetch);
  }

  throw err;
};

const mockRequest = (success, isFetch) => jest.fn(request(success, isFetch));

const providerCreator = (success) => ({
  upsert: mockRequest(success),
  remove: mockRequest(success),
  fetch: mockRequest(success, true),
  find: mockRequest(success),
  options,
});

const getEntity = (success, staleTimeout) => ({
  provider: providerCreator(success),
  idField: 'id',
  staleTimeout,
  key: 'e',
});

const actionCreator = (type, success, staleTimeout, refresh) => ({
  type: `snowbox/${type}`,
  entity: type == 'FETCH' ?
    [getEntity(success, staleTimeout)] :
    getEntity(success, staleTimeout),
  payload: { id: 3 },
  options: { refresh },
  success: (payload, entities, result, meta, date) => (
    { payload, entities, result, meta, date }
  ),
  failure: (payload, error, statusCode) => ({ payload, error, statusCode }),
});

describe('middleware', () => {
  let next;

  beforeAll(() => {
    next = jest.fn(a => a);
    normalize.mockImplementation(
      (payload, entity) => ({ entities: 1, result: 2 })
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

  describe.each([
    ['upsert', { id: 3 }],
    ['remove', { e: { id: 3 }, m: 'meta' }],
    ['find', { id: 3 }],
    ['fetch', { id: 3 }],
  ])('handles %s action', (method, response) => {
    const store = { getState: () => {} };

    test('when succeeds', async () => {
      const action = actionCreator(method.toUpperCase(), true);
      const provider = method == 'fetch' ?
        action.entity[0].provider :
        action.entity.provider;
      const result = await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(provider[method].mock.calls[0][0]).toBe(action.payload);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        payload: { id: 3 },
        entities: method == 'remove' ? undefined : 1,
        result: method == 'remove' ? { e: { id: 3 }, m: 'meta' } : 2,
        meta: method == 'fetch' ? 'meta' : undefined,
        date: method == 'remove' ? undefined : FROZEN_TIME,
      });
      expect(normalize.mock.calls.length).toBe(method == 'remove' ? 0 : 1);

      if (method == 'fetch') {
        expect(normalize.mock.calls[0][0]).toStrictEqual({ id: 3 });
      }

      if (method != 'remove') {
        expect(normalize.mock.calls[0][0]).toStrictEqual(response);
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
      expect(provider[method].mock.calls[0][0]).toBe(action.payload);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        payload: { id: 3 },
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
        provider: providerCreator(true),
      };
      const action = {
        type: 'snowbox/FETCH',
        entity,
        payload: { d: 'd' },
        success: (payload, entities, result, meta, date) => (
          { payload, entities, result, meta, date }
        ),
        failure: (payload, error, statusCode) => ({ payload, error, statusCode }),
      };
      const provider = action.entity.provider;
      const result = await mw.snowboxMiddleware(store)(next)(action);

      expect(provider.fetch.mock.calls.length).toBe(1);
      expect(provider.fetch.mock.calls[0][0]).toBe(action.payload);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        payload: { d: 'd' },
        entities: undefined,
        result: { d: 'd' },
        meta: undefined,
        date: FROZEN_TIME,
      });
      expect(normalize.mock.calls.length).toBe(0);
    });
  });

  describe('sateTimeout option', () => {
    const store = {
      getState: () => ({ snowbox: {
        collections: { e: { '#id[3]': { __updatedAt: 100 } } },
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

    it(
      'does nothing when the action explicitly asks fresh payload',
      async () => {
        const method = 'find';
        const action = actionCreator(method.toUpperCase(), true, 11, true);
        const provider = action.entity.provider;
        await mw.snowboxMiddleware(store)(next)(action);

        expect(provider[method].mock.calls.length).toBe(1);
        expect(next.mock.calls.length).toBe(2);
      }
    );

    it('does not fetch new payload when the entity is fresh', async () => {
      const method = 'find';
      const action = actionCreator(method.toUpperCase(), true, 100);
      const provider = action.entity.provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(0);
      expect(next.mock.calls.length).toBe(1);
    });

    it('does not fetch new payload when the page is fresh', async () => {
      const method = 'fetch';
      const action = actionCreator(method.toUpperCase(), true, 100);
      const provider = action.entity[0].provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(0);
      expect(next.mock.calls.length).toBe(1);
    });

    it('fetches new payload when the entity is stale', async () => {
      const method = 'find';
      const action = actionCreator(method.toUpperCase(), true, 10);
      const provider = action.entity.provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(next.mock.calls.length).toBe(2);

    });

    it('fetches new payload when the page is stale', async () => {
      const method = 'fetch';
      const action = actionCreator(method.toUpperCase(), true, 10);
      const provider = action.entity[0].provider;
      await mw.snowboxMiddleware(store)(next)(action);

      expect(provider[method].mock.calls.length).toBe(1);
      expect(next.mock.calls.length).toBe(2);
    });
  });

  describe('dataAlreadyExists', () => {
    const entity = {
      key: 'baz',
      singleton: true,
      staleTimeout: 10,
    };

    it('returns false when the singleton is stale', () => {
      const result = mw.dataAlreadyExists(
        {
          getState: () => ({
            snowbox: { singletons: { baz: { a: 'b', __updatedAt: 100 } } },
          }),
        },
        { type: actions.FIND, entity, payload: {} }
      );

      expect(result).toBe(false);
    });

    it('returns true when the singleton is fresh', () => {
      const result = mw.dataAlreadyExists(
        {
          getState: () => ({
            snowbox: { singletons: { baz: { a: 'b', __updatedAt: 120 } } },
          }),
        },
        { type: actions.FIND, entity, payload: {} }
      );

      expect(result).toBe(true);
    });

    it('returns false when the state payload does not have update date', () => {
      const result = mw.dataAlreadyExists(
        {
          getState: () => ({
            snowbox: { singletons: { baz: { a: 'b' } } },
          }),
        },
        { type: actions.FIND, entity, payload: {} }
      );

      expect(result).toBe(false);
    });
  });
});
