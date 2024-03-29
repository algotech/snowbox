import {
  success,
  failure,
  createAction,
  succeeded,
  failed,
  createSuccess,
  createFailure,
  request,
  upsert,
  remove,
  find,
  fetch,
  clearAll,
} from '../src/actions';

describe('actions', () => {
  describe('success', () => {
    it('creates a success action type', () => {
      expect(success('ACTION')).toBe('ACTION_SUCCESS');
    });
  });

  describe('failure', () => {
    it('creates a failure action type', () => {
      expect(failure('ACTION')).toBe('ACTION_FAILURE');
    });
  });

  describe('createAction', () => {
    it('creates an action with the given type', () => {
      expect(createAction('TYPE')()).toStrictEqual({ type: 'TYPE'});
    });

    it('creates an action with the given type and spread payload', () => {
      expect(createAction('TYPE')({ ok: true })).toStrictEqual({
        type: 'TYPE',
        ok: true,
      });
    });
  });

  describe('succeeded', () => {
    it('creates a success action creator', () => {
      const successCreator = succeeded('TYPE');

      expect(typeof successCreator).toBe('function');
      expect(successCreator({ ok: true })).toStrictEqual({
        type: 'TYPE_SUCCESS',
        ok: true,
      });
    });
  });

  describe('failed', () => {
    it('creates a failed action creator', () => {
      const failureCreator = failed('TYPE');

      expect(typeof failureCreator).toBe('function');
      expect(failureCreator({ ok: false })).toStrictEqual({
        type: 'TYPE_FAILURE',
        ok: false,
      });
    });
  });

  describe('createSuccess', () => {
    it('creates a success action for normalized payload', () => {
      expect(createSuccess('TYPE')('e')('a', 'b', 'c', 'm', 'd'))
        .toStrictEqual({
          type: 'TYPE_SUCCESS',
          entity: 'e',
          payload: 'a',
          entities: 'b',
          result: 'c',
          meta: 'm',
          date: 'd',
        });
    });
  });

  describe('createFailure', () => {
    it('create a failure action for normalized payload', () => {
      expect(createFailure('TYPE')('e')('d', 'err', 's')).toStrictEqual({
        type: 'TYPE_FAILURE',
        entity: 'e',
        payload: 'd',
        error: 'err',
        statusCode: 's',
      });
    });
  });

  describe('request', () => {
    it('creates an action with success and failure action creators', () => {
      const action = request('TYPE')('e')('d');

      expect(action).toEqual(expect.objectContaining({
        type: 'TYPE',
        entity: 'e',
        payload: 'd',
      }));
      expect(action.success('a', 'b', 'c')).toStrictEqual({
        type: 'TYPE_SUCCESS',
        entity: 'e',
        payload: 'a',
        entities: 'b',
        result: 'c',
        meta: undefined,
        date: undefined,
      });
      expect(action.failure('a', 'b', 's')).toStrictEqual({
        type: 'TYPE_FAILURE',
        entity: 'e',
        payload: 'a',
        error: 'b',
        statusCode: 's',
      });
    });
  });

  describe('upsert', () => {
    it('creates an action creator of type UPSERT', () => {
      const action = upsert('e')('d');

      expect(action).toEqual(expect.objectContaining({
        type: 'snowbox/UPSERT',
        entity: 'e',
        payload: 'd',
      }));
      expect(typeof action.success).toBe('function');
      expect(typeof action.failure).toBe('function');
    });
  });

  describe('remove', () => {
    it('creates an action creator of type REMOVE', () => {
      const action = remove('e')('d');

      expect(action).toEqual(expect.objectContaining({
        type: 'snowbox/REMOVE',
        entity: 'e',
        payload: 'd',
      }));
      expect(typeof action.success).toBe('function');
      expect(typeof action.failure).toBe('function');
    });
  });

  describe('find', () => {
    it('creates an action creator of type FIND', () => {
      const action = find('e')('d');

      expect(action).toEqual(expect.objectContaining({
        type: 'snowbox/FIND',
        entity: 'e',
        payload: 'd',
      }));
      expect(typeof action.success).toBe('function');
      expect(typeof action.failure).toBe('function');
    });
  });

  describe('fetch', () => {
    it('creates an action creator of type FETCH', () => {
      const action = fetch('e')('d');

      expect(action).toEqual(expect.objectContaining({
        type: 'snowbox/FETCH',
        entity: 'e',
        payload: 'd',
      }));
      expect(typeof action.success).toBe('function');
      expect(typeof action.failure).toBe('function');
    });
  });

  describe('clearAll', () => {
    it('creates an action of type CLEAR', () => {
      const action = clearAll();

      expect(action).toEqual(expect.objectContaining({
        type: 'snowbox/CLEAR',
      }));
    });
  });
});
