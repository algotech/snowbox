import api from '../src/api';

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
  describe('setApiBaseUrl', () => {
    it('throws when the url is not a string', () => {
      expect(() => api.setBaseUrl()).toThrow();
      expect(() => api.setBaseUrl(null)).toThrow();
      expect(() => api.setBaseUrl(true)).toThrow();
      expect(() => api.setBaseUrl(11)).toThrow();
      expect(() => api.setBaseUrl({})).toThrow();
      expect(() => api.setBaseUrl([])).toThrow();
      expect(() => api.setBaseUrl(() => {})).toThrow();
    });

    it('sets the base url', () => {
      api.setBaseUrl('base-url');

      expect(api.baseUrl).toBe('base-url');
    });
  });

  describe('setTokenHeaderName', () => {
    it('throws when the name is not string', () => {
      expect(() => api.setTokenHeaderName()).toThrow();
      expect(() => api.setTokenHeaderName(null)).toThrow();
      expect(() => api.setTokenHeaderName(true)).toThrow();
      expect(() => api.setTokenHeaderName(11)).toThrow();
      expect(() => api.setTokenHeaderName({})).toThrow();
      expect(() => api.setTokenHeaderName([])).toThrow();
      expect(() => api.setTokenHeaderName(() => {})).toThrow();
    });

    it('sets the auth token header name', () => {
      api.setTokenHeaderName('auth-token');

      expect(api.tokenHeader).toBe('auth-token');
    });
  });

  describe('setTokenGetter', () => {
    it('throws when the getter is not a function', () => {
      expect(() => api.setTokenGetter()).toThrow();
      expect(() => api.setTokenGetter(null)).toThrow();
      expect(() => api.setTokenGetter(true)).toThrow();
      expect(() => api.setTokenGetter(11)).toThrow();
      expect(() => api.setTokenGetter('a')).toThrow();
      expect(() => api.setTokenGetter({})).toThrow();
      expect(() => api.setTokenGetter([])).toThrow();
    });

    it('sets the auth token getter', () => {
      api.setTokenGetter(() => 'token');

      expect(api.tokenGetter()).toBe('token');
    });
  });

  describe('setAuthToken', () => {
    let xhr;

    beforeAll(() => {
      xhr = { setRequestHeader: jest.fn() };
    });

    beforeEach(() => {
      xhr.setRequestHeader.mockClear();
    });

    it('does nothing when the getter is not defined', async () => {
      api.tokenGetter = undefined;
      api.setTokenHeaderName('a');
      await api.setAuthToken(xhr);

      expect(xhr.setRequestHeader.mock.calls.length).toBe(0);
    });

    it('does nothing when the header name is not defined', async () => {
      api.tokenHeader = undefined;
      api.setTokenGetter(() => {});
      await api.setAuthToken(xhr);

      expect(xhr.setRequestHeader.mock.calls.length).toBe(0);
    });

    it('does nothing when the token is not defined', async () => {
      api.setTokenHeaderName('auth');
      api.setTokenGetter(() => null);
      await api.setAuthToken(xhr);

      expect(xhr.setRequestHeader.mock.calls.length).toBe(0);
    });

    it('sets the auth header when the token is defined', async () => {
      api.setTokenHeaderName('auth');
      api.setTokenGetter(() => 'foobar');
      await api.setAuthToken(xhr);

      expect(xhr.setRequestHeader.mock.calls.length).toBe(1);
      expect(xhr.setRequestHeader.mock.calls[0]).toEqual(['auth', 'foobar']);
    });
  });

  it('throws when the api is called without base api url', async () => {
    api.baseUrl = null;

    expect(api.call('GET', '/g')).rejects
      .toStrictEqual(new Error('[Snowbox] Base API url must be defined'));
  });

  describe('methods', () => {
    beforeAll(() => {
      api.setBaseUrl('base');
      api.setTokenHeaderName('auth');
      api.setTokenGetter(() => 'token');
    });

    it('makes GET requests', async () => {
      const xhr = mockXhr(true, true, true, false);

      const result = await api.get('/path');

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('GET');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(undefined);
      expect(result).toStrictEqual({ body: 'here' });
    });

    it ('throws then the api responds with an error', async () => {
      const xhr = mockXhr(false, true, false, true);
      let result, error;

      try {
        result = await api.get('/path', { a: 1 });
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

      const result = await api.post('/path?ok=da', { d: 1 }, { p: 3 });

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('POST');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path?ok=da&p=3');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(JSON.stringify({ d: 1 }));
      expect(result).toStrictEqual({ response: 'obj' });
    });

    it('makes PUT requests', async () => {
      const xhr = mockXhr(false, false, false, false);
      let result, error;

      try {
        result = await api.put('/path?ok=da', { d: 1 }, { p: 3 });
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

    it('makes DELETE requests', async () => {
      const xhr = mockXhr(true, false, false, false);

      const result = await api.remove('/path');

      expect(xhr.open.mock.calls.length).toBe(1);
      expect(xhr.open.mock.calls[0][0]).toBe('DELETE');
      expect(xhr.open.mock.calls[0][1]).toBe('base/path');
      expect(xhr.open.mock.calls[0][2]).toBe(true);
      expect(xhr.setRequestHeader.mock.calls.length).toBe(2);
      expect(xhr.send.mock.calls.length).toBe(1);
      expect(xhr.send.mock.calls[0][0]).toBe(undefined);
      expect(result).toStrictEqual({ response: 'obj' });
    });
  });
});
