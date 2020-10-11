import { normalize } from 'normalizr';

import { snowboxMiddleware } from '../src/middleware';

jest.mock('normalizr');

const err = new Error('Bad request');
err.status = 400;

const request = success => async d => {
  if (success) {
    return d;
  }

  throw err;
};
const mockRequest = success => jest.fn(request(success));
const getEntity = success => ({
  provider: {
    upsert: mockRequest(success),
    remove: mockRequest(success),
    find: mockRequest(success),
    fetch: mockRequest(success),
  },
});
const actionCreator = (type, success) => ({
  type: `snowbox/${type}`,
  entity: type == 'FETCH' ? [getEntity(success)] : getEntity(success),
  data: 'D',
  success: (data, entities, result) => ({ data, entities, result }),
  failure: (data, error, statusCode) => ({ data, error, statusCode }),
});

describe('middleware', () => {
  let next;

  beforeAll(() => {
    next = jest.fn(a => a);
    normalize.mockImplementation(
      (data, entity) => ({ entities: 1, result: 2 })
    );
  });

  beforeEach(() => {
    next.mockClear();
    normalize.mockClear();
  });

  it('ignores non snowbox actions', async () => {
    const action = { type: 'IRRELEVANT', some: 'field' };

    const result = await snowboxMiddleware({})(next)(action);

    expect(result).toStrictEqual(action);
    expect(next.mock.calls.length).toBe(1);
    expect(next.mock.calls[0][0]).toStrictEqual(action);
  });

  describe.each(
    ['upsert', 'remove', 'find', 'fetch']
  )('handles %s action', type => {
    test('when succeeds', async () => {
      const action = actionCreator(type.toUpperCase(), true);
      const result = await snowboxMiddleware({})(next)(action);
      const provider = type == 'fetch' ?
        action.entity[0].provider :
        action.entity.provider;

      expect(provider[type].mock.calls.length).toBe(1);
      expect(provider[type].mock.calls[0][0]).toBe(action.data);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        data: 'D',
        entities: type == 'remove' ? undefined : 1,
        result: type == 'remove' ? undefined : 2,
      });
      expect(normalize.mock.calls.length).toBe(type == 'remove' ? 0 : 1);

      if (type != 'remove') {
        expect(normalize.mock.calls[0][0]).toBe(action.data);
        expect(normalize.mock.calls[0][1]).toStrictEqual(action.entity);
      }
    });

    test('when fails', async () => {
      const action = actionCreator(type.toUpperCase(), false);
      const result = await snowboxMiddleware({})(next)(action);
      const provider = type == 'fetch' ?
        action.entity[0].provider :
        action.entity.provider;

      expect(provider[type].mock.calls.length).toBe(1);
      expect(provider[type].mock.calls[0][0]).toBe(action.data);
      expect(next.mock.calls.length).toBe(2);
      expect(next.mock.calls[0][0]).toStrictEqual(action);
      expect(next.mock.calls[1][0]).toStrictEqual(result);
      expect(result).toStrictEqual({
        data: 'D',
        error: err,
        statusCode: 400,
      });
      expect(normalize.mock.calls.length).toBe(0);
    });
  });
});
