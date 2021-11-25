import axios from 'axios';

import api from '../src/api';
import { contentTypes } from '../src/constants';

jest.mock('axios');

describe('api', () => {
  describe('function', () => {
    const throws = (options) => {
      expect(() => api(options)).toThrow();
    };

    it('throws when base url is not a nonempty string', () => {
      throws({});
      throws({ baseUrl: null });
      throws({ baseUrl: true });
      throws({ baseUrl: 11 });
      throws({ baseUrl: {} });
      throws({ baseUrl: [] });
      throws({ baseUrl: () => {} });
      throws({ baseUrl: '' });
    });

    it('throws when not both the token name and the getter are defined', () => {
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: undefined });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: null });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: true });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: 11 });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: {} });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: [] });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: () => {} });
      throws({ baseUrl: 'b', getAuthToken: () => {}, tokenHeader: '' });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: undefined });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: null });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: true });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: 11 });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: {} });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: [] });
      throws({ baseUrl: 'b', tokenHeader: 'th', getAuthToken: '' });
    });

    it('validates when all the options are present', () => {
      expect(typeof api({
        baseUrl: 'base',
        tokenHeader: 'header',
        getAuthToken: () => {},
      })).toBe('object');
    });

    it('validates when both token options are missing', () => {
      expect(typeof api({
        baseUrl: 'base',
      })).toBe('object');
    });

    it('returns an object', () => {
      const apiInst = api({ baseUrl: 'base' });

      expect(typeof apiInst).toBe('object');
      expect(typeof apiInst.get).toBe('function');
      expect(typeof apiInst.post).toBe('function');
      expect(typeof apiInst.put).toBe('function');
      expect(typeof apiInst.patch).toBe('function');
      expect(typeof apiInst.remove).toBe('function');
      expect(typeof apiInst.request).toBe('function');
    });
  });

  describe('methods', () => {
    let testApi;

    beforeAll(() => {
      axios.create.mockReturnThis();

      testApi = api({
        baseUrl: 'http://localhost:3000',
        tokenHeader: 'auth',
        getAuthToken: () => 'token',
      });
    });

    it('makes GET requests', async () => {
      const response = { ok: true };
      axios.get.mockResolvedValue(response);

      const result = await testApi.get('/path1');

      expect(result).toStrictEqual(response);
      expect(axios.get).toHaveBeenLastCalledWith('/path1');
    });

    it('throws then the api responds with an error', async () => {
      axios.get.mockImplementation(() => Promise.reject('bad'));

      expect(testApi.get('/path')).rejects.toMatch('bad');
    });

    it('makes POST requests', async () => {
      const response = { ok: 1 };
      axios.post.mockResolvedValue(response);

      const result = await testApi.post('/path2', { a: 'b' });

      expect(result).toStrictEqual(response);
      expect(axios.post).toHaveBeenLastCalledWith('/path2');
    });

    it('makes JSON POST requests without data', async () => {
      const response = { ok: 1 };
      axios.post.mockResolvedValue(response);

      const result = await testApi.post('/path3');

      expect(result).toStrictEqual(response);
      expect(axios.post).toHaveBeenLastCalledWith('/path3');
    });

    it('makes PUT requests', async () => {
      const response = { ok: 3 };
      axios.put.mockResolvedValue(response);

      const result = await testApi.put('/path4', { a: 'c' });

      expect(result).toStrictEqual(response);
      expect(axios.put).toHaveBeenLastCalledWith('/path4');
    });

    it('makes PATCH requests', async () => {
      const response = { ok: 4 };
      axios.patch.mockResolvedValue(response);

      const result = await testApi.patch('/path5', { b: 'c' });

      expect(result).toStrictEqual(response);
      expect(axios.patch).toHaveBeenLastCalledWith('/path5');
    });

    it('makes DELETE requests', async () => {
      const response = { ok: 5 };
      axios.delete.mockResolvedValue(response);

      const result = await testApi.remove('/path6');

      expect(result).toStrictEqual(response);
      expect(axios.delete).toHaveBeenLastCalledWith('/path6');
    });

    it('makes form data requests', async () => {
      const response = { ok: 5 };
      axios.post.mockResolvedValue(response);

      const result = await testApi
        .post('/path7', { f: 'd' }, undefined, contentTypes.FORM_DATA);

      const lastCall = axios.create.mock.calls[axios.create.mock.calls.length - 1];

      expect(result).toStrictEqual(response);
      expect(typeof lastCall[0].transformRequest[0]).toBe('function');
      expect(lastCall[0].headers).toStrictEqual(
        {
          'Content-type': 'multipart/form-data',
          'auth': 'token',
        },
      );

      const formData = lastCall[0].transformRequest[0]({ f: 'd' });
      expect(formData instanceof FormData).toBe(true);
      expect(formData.get('f')).toBe('d');

      expect(() => {
        lastCall[0].transformRequest[0](null)
      }).toThrow();
      expect(() => {
        lastCall[0].transformRequest[0](123)
      }).toThrow();
    });

    it('throws an error when the content type is invalid', async () => {
      try {
        await testApi.post('/path', null, null, null);
      } catch (error) {
        expect(error.message).toBe('[Snowbox API] Invalid content type "null"');
      }
    });

    it('makes requests when the auth token is not defined', async () => {
      const response = { ok: true };

      axios.get.mockResolvedValue(response);

      const result = await api({ baseUrl: 'http://localhost:3000' }).get('/ok');

      expect(result).toStrictEqual(response);
      expect(axios.get).toHaveBeenLastCalledWith('/ok');
    });
  });
});
