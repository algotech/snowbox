import provider from '../src/provider';
import { contentTypes } from '../src/constants';
import Response from '../src/Response';

describe('provider', () => {
  it('throws an error when the particle is not a nonempty string', () => {
    expect(() => provider(api)()).toThrow();
    expect(() => provider(api)({ particle: '' })).toThrow();
  });

  describe('with default options', () => {
    const api = {
      get: jest.fn(() => ({ data: 'get', total: 2 })),
      post: jest.fn(() => ({ data: 'post' })),
      put: jest.fn(() => ({ data: 'put' })),
      patch: jest.fn(() => ({ data: 'patch' })),
      remove: jest.fn(() => 'remove'),
    };

    describe.each([
      ['find', 'id', 'get', 13, 'get', 1, ['/test/13', {}]],
      ['find', 'params', 'get', { id: 'ok', a: 1 }, 'get', 2, ['/test/ok', { a: 1 }]],
      [
        'fetch',
        'no params',
        'get',
        undefined,
        'get',
        3,
        ['/test', {}],
      ],
      [
        'fetch',
        'params',
        'get',
        { p: 1 },
        'get',
        4,
        ['/test', { p: 1 }],
      ],
      ['upsert', 'no id', 'post', { a: 3 }, 'post', 1, [
        '/test',
        { a: 3 },
        undefined,
        contentTypes.JSON,
      ]],
      ['upsert', 'id', 'put', { id: 7, a: 3 }, 'put', 1, [
        '/test/7',
        { id: 7, a: 3 },
        undefined,
        contentTypes.JSON,
      ]],
      ['remove', 'number', 'remove', 5, 'remove', 1, ['/test/5']],
      ['remove', 'obj', 'remove', { id: 9 }, 'remove', 2, ['/test/9']],
    ])('call %s with %s', (
      method,
      desc,
      apiMethod,
      param,
      expected,
      cnt,
      calls
    ) => {
      it('succeeds', async () => {
        const prov = provider(api)({ particle: 'test' });
        const result = await prov[method](param);

        expect(result instanceof Response).toEqual(true);
        expect(result.data).toEqual(expected);
        expect(api[apiMethod].mock.calls.length).toBe(cnt);
        expect(api[apiMethod].mock.calls[cnt - 1]).toEqual(calls);
      });
    });

    it('does not return meta for fetch when disabled', async () => {
      const prov = provider(api)({ particle: 'test', hasMeta: false });
      const result = await prov.fetch();

      expect(result.meta).toEqual(undefined);
    });
  });

  describe('with customer options', () => {
    const api = {
      get: jest.fn(() => ({ r: { d: 'get', total: 2 } })),
      post: jest.fn(() => ({ r: { d: 'post' } })),
      put: jest.fn(() => ({ r: { d: 'put' } })),
      patch: jest.fn(() => ({ r: { d: 'patch' } })),
      remove: jest.fn(() => 'remove'),
    };
    const options = {
      particle: 'test',
      idField: 'i',
      entityPath: 'r.d',
      entitiesPath: 'r.d',
      entitiesFieldName: 'e',
      metaPath: 'r',
      metaFieldName: 'm',
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
      ['find', 'id', 'get', { i: 13 }, 'get', 1, ['/find', { fi: 'nd' }]],
      ['find', 'params', 'get', { i: 'ok', a: 1 }, 'get', 2, ['/find', {
        fi: 'nd',
      }]],
      ['fetch', 'params', 'get', { p: 1 }, 'get', 3, ['/fetch', { fe: 'tch' }]],
      [
        'fetch', 'no params', 'get', undefined, 'get', 4,
        ['/fetch', { fe: 'tch' }],
      ],
      ['upsert', 'no id', 'put', { id: 3 }, 'put', 1, [
        '/upsert',
        { id: 3 },
        undefined,
        contentTypes.FORM_DATA,
      ]],
      ['upsert', 'id', 'patch', { i: 7, a: 3 }, 'patch', 1, [
        '/upsert',
        { i: 7, a: 3 },
        undefined,
        contentTypes.FORM_DATA,
      ]],
      ['remove', 'number', 'post', 5, 'post', 1, ['/remove']],
      ['remove', 'obj', 'post', { i: 9 }, 'post', 2, ['/remove']],
    ])('call %s with %s', (
      method,
      desc,
      apiMethod,
      param,
      expected,
      cnt,
      calls
    ) => {
      it('succeeds', async () => {
        const prov = provider(api)(options);
        const result = await prov[method](param);

        expect(result instanceof Response).toBe(true);
        expect(result.data).toEqual(expected);
        expect(api[apiMethod].mock.calls.length).toBe(cnt);
        expect(api[apiMethod].mock.calls[cnt - 1]).toEqual(calls);
      });
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
