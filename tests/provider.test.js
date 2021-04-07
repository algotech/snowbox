import api from '../src/api';
import Provider from '../src/provider';
import { contentTypes } from '../src/constants';

jest.mock('../src/api', () => ({
  get: jest.fn((path, params) => 'get'),
  post: jest.fn((path, data) => 'post'),
  put: jest.fn((path, data) => 'put'),
  remove: jest.fn(path => 'remove'),
}));

describe('provider', () => {
  beforeEach(() => {
    api.get.mockClear();
    api.post.mockClear();
    api.put.mockClear();
    api.remove.mockClear();
  });

  it('accepts string particles', () => {
    const provider = new Provider('test');

    expect(provider.getParticle()).toBe('test');
  });

  it('accepts function particles', () => {
    const provider = new Provider(data => data);

    expect(provider.getParticle('yes')).toBe('yes');
  });

  describe.each([
    ['fetch', 'no params', undefined, 'get', 1, ['/test', null]],
    ['fetch', 'id', 13, 'get', 2, ['/test/13', null]],
    ['fetch', 'params', { path: 'ok' }, 'get', 3, ['/test/ok', { path: 'ok' }]],
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
    ['remove', 'id', { id: 5 }, 'remove', 1, ['/test/5', { id: 5 }, undefined]],
    ['remove', 'no id', { a: 9 }, 'remove', 2, ['/test', { a: 9 }, undefined]],
  ])('call %s with %s', (method, desc, param, expected, cnt, calls) => {
    const provider = new Provider(data => {
      return data && data.path ? `test/${data.path}` : 'test';
    });
    const result = provider[method](param);

    expect(result).toBe(expected);
    expect(api[expected].mock.calls.length).toBe(cnt);
    expect(api[expected].mock.calls[cnt - 1]).toEqual(calls);
  });
});
