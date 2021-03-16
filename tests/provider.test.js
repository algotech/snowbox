import api from '../src/api';
import provider from '../src/provider';
import { contentTypes } from '../src/constants';

jest.mock('../src/api', () => ({
  get: jest.fn(() => 'get'),
  post: jest.fn(() => 'post'),
  put: jest.fn(() => 'put'),
  patch: jest.fn(() => 'patch'),
  remove: jest.fn(() => 'remove'),
}));

describe('provider', () => {
  it('throws an error when the particle is not a string', () => {
    expect(() => provider()).toThrow();
    expect(() => provider({ particle: '' })).toThrow();
  });

  describe('with default options', () => {
    describe.each([
      ['find', 'id', 13, 'get', 1, ['/test/13', undefined]],
      ['find', 'params', { id: 'ok', a: 1 }, 'get', 2, ['/test/ok', { a: 1 }]],
      ['fetch', 'no params', undefined, 'get', 3, ['/test', undefined]],
      ['fetch', 'params', { p: 1 }, 'get', 4, ['/test', { p: 1 }]],
      ['upsert', 'no id', { a: 3 }, 'post', 1, [
        '/test',
        { a: 3 },
        undefined,
        contentTypes.JSON,
      ]],
      ['upsert', 'id', { id: 7, a: 3 }, 'put', 1, [
        '/test/7',
        { id: 7, a: 3 },
        undefined,
        contentTypes.JSON,
      ]],
      ['remove', 'number', 5, 'remove', 1, ['/test/5']],
      ['remove', 'obj', { id: 9 }, 'remove', 2, ['/test/9']],
    ])('call %s with %s', (method, desc, param, expected, cnt, calls) => {
      const prov = provider({ particle: 'test' });
      const result = prov[method](param);

      expect(result).toBe(expected);
      expect(api[expected].mock.calls.length).toBe(cnt);
      expect(api[expected].mock.calls[cnt - 1]).toEqual(calls);
    });
  });

  describe('with customer options', () => {
    const options = {
      particle: 'test',
      idField: 'i',
      findPath: jest.fn(() => '/find'),
      findParams: jest.fn(() => ({ fi: 'nd' })),
      fetchPath: jest.fn(() => '/fetch'),
      fetchParams: jest.fn(() => ({ fe: 'tch' })),
      createMethod: 'put',
      updateMethod: 'patch',
      upsertPath: jest.fn(() => '/upsert'),
      upsertContentType: contentTypes.FORM_DATA,
      removeMethod: 'post',
      removePath: jest.fn(() => '/remove'),
    };

    describe.each([
      ['find', 'id', { i: 13 }, 'get', 5, ['/find', { fi: 'nd' }]],
      ['find', 'params', { i: 'ok', a: 1 }, 'get', 6, ['/find', { fi: 'nd' }]],
      ['fetch', 'params', { p: 1 }, 'get', 7, ['/fetch', { fe: 'tch' }]],
      ['fetch', 'no params', undefined, 'get', 8, ['/fetch', { fe: 'tch' }]],
      ['upsert', 'no id', { id: 3 }, 'put', 2, [
        '/upsert',
        { id: 3 },
        undefined,
        contentTypes.FORM_DATA,
      ]],
      ['upsert', 'id', { i: 7, a: 3 }, 'patch', 1, [
        '/upsert',
        { i: 7, a: 3 },
        undefined,
        contentTypes.FORM_DATA,
      ]],
      ['remove', 'number', 5, 'post', 2, ['/remove']],
      ['remove', 'obj', { i: 9 }, 'post', 3, ['/remove']],
    ])('call %s with %s', (method, desc, param, expected, cnt, calls) => {
      const prov = provider(options);
      const result = prov[method](param);

      expect(result).toBe(expected);
      expect(api[expected].mock.calls.length).toBe(cnt);
      expect(api[expected].mock.calls[cnt - 1]).toEqual(calls);
    });

    it('calls each option function with filter or data and options', () => {
      expect(options.findPath.mock.calls[0][0]).toStrictEqual({ i: 13 });
      expect(options.findPath.mock.calls[0][1].particle).toEqual('test');
      expect(options.findParams.mock.calls[0][0]).toStrictEqual({ i: 13 });
      expect(options.findParams.mock.calls[0][1].particle).toEqual('test');
      expect(options.fetchPath.mock.calls[0][0]).toStrictEqual({ p: 1 });
      expect(options.fetchPath.mock.calls[0][1].particle).toEqual('test');
      expect(options.fetchParams.mock.calls[0][0]).toStrictEqual({ p: 1 });
      expect(options.fetchParams.mock.calls[0][1].particle).toEqual('test');
      expect(options.upsertPath.mock.calls[0][0]).toStrictEqual({ id: 3 });
      expect(options.upsertPath.mock.calls[0][1].particle).toEqual('test');
      expect(options.removePath.mock.calls[0][0]).toStrictEqual(5);
      expect(options.removePath.mock.calls[0][1].particle).toEqual('test');
    });
  });
});
