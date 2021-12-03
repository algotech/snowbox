import axios from 'axios';

import { contentTypes } from './constants';

const getContentTypeHeader = (contentType) => {
  switch (contentType) {
    case contentTypes.JSON:
      return { 'Content-type': 'application/json; charset=utf-8' };
    case contentTypes.FORM_DATA:
      return { 'Content-type': 'multipart/form-data' };
    default:
      throw new Error(`[Snowbox API] Invalid content type "${contentType}"`)
  }
};

const getAuthHeader = async (tokenHeader, getAuthToken) => {
  if (tokenHeader && getAuthToken) {
    return { [tokenHeader]: await getAuthToken() };
  }

  return {};
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
  
  const axiosInstance = axios.create({ baseURL: options.baseUrl });

  const get = (path, params) => request('get', path, params);

  const post = (path, data = {}, params, contentType) => request(
    'post', path, params, data, contentType
  );

  const put = (path, data = {}, params, contentType) => request(
    'put', path, params, data, contentType
  );

  const patch = (path, data = {}, params, contentType) => request(
    'patch', path, params, data, contentType
  );

  const remove = (path) => request('delete', path);

  const request = async (
    method,
    path,
    params,
    data,
    contentType = contentTypes.JSON
  ) => {
    const authHeader = await getAuthHeader(
      options.tokenHeader,
      options.getAuthToken
    );
    const requestConfig = {
      params,
      data,
      headers: {
        ...getContentTypeHeader(contentType),
        ...authHeader,
      },
    };

    if (contentType === contentTypes.FORM_DATA) {
      requestConfig.transformRequest = [(data) => {
        if (!data || typeof data !== 'object') {
          throw new Error('[Snowbox API] data must be object');
        }

        const body = new FormData();
        Object.keys(data).forEach(field => body.append(field, data[field]));

        return body;
      }];
    }

    if (method === 'get' || method === 'delete') {
      return axiosInstance[method](path, requestConfig);
    }

    return axiosInstance[method](path, data, requestConfig);
  };

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
