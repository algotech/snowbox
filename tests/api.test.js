import api from '../src/api';
import { contentTypes } from '../src/constants';

const buildResponse = (success, hasData, hasMessage) => {
  const response = { response: 'obj' };
  if (hasData) {
    response.data = { body: 'here' };
  }
  if (hasMessage) {
    if (hasData) {
      response.data.message = success ? 'good' : 'bad';
    } else {
      response.message = success ? 'good' : 'bad';
    }
  } else {
    response
  }

  return response;
};

const mockXhr = (success, isJson, hasData, hasMessage) => {
  const xhrMockObj = {
    open: jest.fn(),
    send: jest.fn(),
    setRequestHeader: jest.fn(),
    readyState: 1,
    status,
  };

  const xhrMockClass = () => xhrMockObj;

  global.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

  setTimeout(() => {
    xhrMockObj.onload();
  }, 0);

  setTimeout(() => {
    xhrMockObj.readyState = 4;
    xhrMockObj.status = success ? 200 : 400;
    const response = buildResponse(success, hasData, hasMessage);
    xhrMockObj.responseText = isJson ? JSON.stringify(response) : response;
    xhrMockObj.onload();
  }, 1);

  return xhrMockObj;
}

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
      testApi = api({
        baseUrl: 'base',
        tokenHeader: 'auth',
        getAuthToken: () => 'token',
      });
    });

    it('makes GET requests', async () => {
      const xhr = mockXhr(true, true, true, false);

      const result = await testApi.get('/path');

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('GET');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.setRequestHeader.mock.calls[0][0]).toBe('Content-type');
      expect(xhr.setRequestHeader.mock.calls[0][1])
        .toBe('application/json; charset=utf-8');
      expect(xhr.setRequestHeader.mock.calls[1][0]).toBe('auth');
      expect(xhr.setRequestHeader.mock.calls[1][1]).toBe('token');
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(undefined);
      expect(result).toStrictEqual({ response: 'obj', data: { body: 'here' } });
    });

    it ('throws then the api responds with an error', async () => {
      const xhr = mockXhr(false, true, false, true);
      let result, error;

      try {
        result = await testApi.get('/path', { a: 1 });
      } catch (err) {
        error = err;
      }

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('GET');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?a=1');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(undefined);
      expect(result).toStrictEqual(undefined);
      expect(error.status).toBe(400);
      expect(error.message).toBe('bad');
    });

    it('makes POST requests', async () => {
      const xhr = mockXhr(true, true, false, false);

      const result = await testApi.post('/path?ok=da', { d: 1 }, { p: 3 });

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('POST');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?ok=da&p=3');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(JSON.stringify({ d: 1 }));
      expect(result).toStrictEqual({ response: 'obj' });
    });

    it('makes JSON POST requests without data', async () => {
      const xhr = mockXhr(true, true, false, false);

      const result = await testApi.post('/path?ok=da', null, { p: 3 });

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('POST');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?ok=da&p=3');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe();
      expect(result).toStrictEqual({ response: 'obj' });
    });

    it('makes PUT requests', async () => {
      const xhr = mockXhr(false, false, false, false);
      let result, error;

      try {
        result = await testApi.put('/path?ok=da', { d: 1 }, { p: 3 });
      } catch (err) {
        error = err;
      }

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('PUT');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?ok=da&p=3');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(JSON.stringify({ d: 1 }));
      expect(result).toBe(undefined);
      expect(error.message).toEqual({ response: 'obj' });
    });

    it('makes PATCH requests', async () => {
      const xhr = mockXhr(false, false, false, false);
      let result, error;

      try {
        result = await testApi.patch('/path?ok=da', { d: 1 }, { p: 3 });
      } catch (err) {
        error = err;
      }

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('PATCH');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?ok=da&p=3');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(JSON.stringify({ d: 1 }));
      expect(result).toBe(undefined);
      expect(error.message).toEqual({ response: 'obj' });
    });

    it('makes DELETE requests', async () => {
      const xhr = mockXhr(true, false, false, false);

      const result = await testApi.remove('/path');

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('DELETE');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(undefined);
      expect(result).toStrictEqual({ response: 'obj' });
    });

    it('makes form data requests', async () => {
      const xhr = mockXhr(true, true, false, false);

      const result = await testApi.post(
        '/path?ok=da',
        { d: 1 },
        { p: 3 },
        contentTypes.FORM_DATA
      );

      const formDataBody = new FormData();
      formDataBody.append('d', 1);

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('POST');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?ok=da&p=3');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toStrictEqual(formDataBody);
      expect(result).toStrictEqual({ response: 'obj' });
    });

    it('throws when form data request body is not an object', async () => {
      const xhr = mockXhr(true, true, false, false);

      await expect(testApi.post(
        '/path?ok=da',
        'invalid',
        { p: 3 },
        contentTypes.FORM_DATA
      )).rejects
        .toThrow('[Snowbox API] data must be object');

      expect(xhr.send.mock.calls.length).toBe(0);
    });

    it('throws an error when the content type is invalid', async () => {
      const xhr = mockXhr(true, true, false, false);

      await expect(testApi.post(
        '/path?ok=no',
        { d: 1 },
        { p: 3 },
        'invalid content type'
      )).rejects
        .toThrow(`[Snowbox API] Invalid content type "invalid content type"`);

      expect(xhr.send.mock.calls.length).toBe(0);
    });

    it('makes requests when the auth token is not defined', async () => {
      const testApiNoAuth = api({ baseUrl: 'base' });
      const xhr = mockXhr(true, true, true, false);

      const result = await testApiNoAuth.get('/path');

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('GET');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(1);
      expect(xhr.setRequestHeader.mock.calls[0][0]).toBe('Content-type');
      expect(xhr.setRequestHeader.mock.calls[0][1])
        .toBe('application/json; charset=utf-8');
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(undefined);
      expect(result).toStrictEqual({ response: 'obj', data: { body: 'here' } });
    });
  });
});
