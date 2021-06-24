import queryString from 'query-string';

import { contentTypes } from './constants';

const buildUrl = (baseUrl, path, params) => {
  const sep = path.indexOf('?') > -1 ? '&' : '?';
  const qs = typeof params === 'object' ?
    sep + queryString.stringify(params) :
    '';

  return `${baseUrl}${path}${qs}`;
};

const setContentTypeHeader = (xhr, contentType) => {
  switch (contentType) {
    case contentTypes.JSON:
      return xhr.setRequestHeader(
        'Content-type',
        'application/json; charset=utf-8'
      );
    case contentTypes.FORM_DATA:
      return xhr.setRequestHeader('Content-type', 'multipart/form-data');
    default:
      throw new Error(`[Snowbox API] Invalid content type "${contentType}"`)
  }
};

const setAuthHeader = (xhr, tokenHeader, getAuthToken) => {
  if (tokenHeader && getAuthToken) {
    xhr.setRequestHeader(tokenHeader, getAuthToken());
  }
};

const buildBody = (data, contentType) => {
  if (!data) {
    return undefined;
  }

  switch (contentType) {
    case contentTypes.JSON:
      if (data) {
        return JSON.stringify(data);
      }

      return null;
    case contentTypes.FORM_DATA:
      if (typeof data !== 'object') {
        throw new Error('[Snowbox API] data must be object');
      }

      const body = new FormData();
      Object.keys(data).forEach(field => body.append(field, data[field]));

      return body;
    default:
      throw new Error('[Snowbox API] Invalid conte type');
  }
};

const validateBaseUrl = (providedOptions) => {
  if (typeof providedOptions.baseUrl !== 'string' ||
    providedOptions.baseUrl === ''
  ) {
    throw new Error('[Snowbox API] Base API url must be defined');
  }
};

const validateAuthOptions = (providedOptions) => {
  const isTokenHeaderValid = typeof providedOptions.tokenHeader === 'string' &&
    providedOptions.tokenHeader.length > 0;
  const isGetAuthTokenValid = typeof providedOptions.getAuthToken === 'function';
  if (isTokenHeaderValid !== isGetAuthTokenValid) {
    throw new Error(
      '[Snowbox API] Both tokenHeader and getAuthToken must be provided'
    );
  }
};

const setupOptions = (providedOptions) => ({
  baseUrl: null,
  tokenHeader: null,
  getAuthToken: null,
  ...providedOptions,
});

const api = (providedOptions = {}) => {
  validateBaseUrl(providedOptions);
  validateAuthOptions(providedOptions);

  const options = setupOptions(providedOptions);

  const get = (path, params) => request('GET', path, params);

  const post = (path, data = {}, params, contentType) => request(
    'POST', path, params, data, contentType
  );

  const put = (path, data = {}, params, contentType) => request(
    'PUT', path, params, data, contentType
  );

  const patch = (path, data = {}, params, contentType) => request(
    'PATCH', path, params, data, contentType
  );

  const remove = (path) => request('DELETE', path);

  const request = (
    method,
    path,
    params,
    data,
    contentType = contentTypes.JSON
  ) => new Promise(async (resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, buildUrl(options.baseUrl, path, params), true);

    xhr.onload = () => {
      if (xhr.readyState !== 4) {
        return false;
      }

      let response;
      try {
        response = JSON.parse(xhr.responseText);
      } catch (err) {
        response = xhr.responseText;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response);
      } else {
        reject({
          status: xhr.status,
          message: response.message || response
        });
      }
    };

    let body;

    try {
      setContentTypeHeader(xhr, contentType);
      setAuthHeader(xhr, options.tokenHeader, options.getAuthToken);
      body = buildBody(data, contentType);
    } catch (error) {
      return reject(error);
    }

    xhr.send(body);
  });

  return {
    get,
    post,
    put,
    patch,
    remove,
    request,
  };
};

export default api;
