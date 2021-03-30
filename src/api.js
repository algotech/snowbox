import queryString from 'query-string';

import { contentTypes } from './constants';

class Api {
  setBaseUrl(baseUrl) {
    if (typeof baseUrl != 'string') {
      throw new Error('[Snowbox] Api base url must be string');
    }

    this.baseUrl = baseUrl;
  }

  setTokenHeaderName(tokenHeader) {
    if (typeof tokenHeader != 'string') {
      throw new Error('[Snowbox] Token Header Name must be string');
    }

    this.tokenHeader = tokenHeader;
  }
  setHeaderRequest(name, value) {
    if (typeof name != 'string') {
      throw new Error('[Snowbox] Request header name must be a string');
    }

    if (typeof value != 'string') {
      throw new Error('[Snowbox] Request header value must be a string');
    }

    this.requestHeaders[name] = value;
  }

  setTokenGetter(tokenGetter) {
    if (typeof tokenGetter != 'function') {
      throw new Error('[Snowbox] Token Getter must be function');
    }

    this.tokenGetter = tokenGetter;
  }

  async setAuthToken(xhr) {
    if (!this.tokenGetter || !this.tokenHeader) {
      return;
    }

    const token = await this.tokenGetter();

    if (!token) {
      return;
    }

    xhr.setRequestHeader(this.tokenHeader, token);
  }

  get(path, params) {
    return this.call('GET', path, params);
  }

  post(path, data = {}, params, contentType) {
    return this.call('POST', path, params, data, contentType);
  }

  put(path, data = {}, params, contentType) {
    return this.call('PUT', path, params, data, contentType);
  }

  patch(path, data = {}, params, contentType) {
    return this.call('PATCH', path, params, data, contentType);
  }

  remove(path) {
    return this.call('DELETE', path);
  }

  async call(method, path, params, data, contentType = contentTypes.JSON) {
    if (!this.baseUrl) {
      throw new Error('[Snowbox] Base API url must be defined');
    }

    return new Promise(async (resolve, reject) => {
      const xhr = new XMLHttpRequest();

      const sep = path.indexOf('?') > -1 ? '&' : '?';
      const qs = typeof params == 'object' ?
        sep + queryString.stringify(params) :
        '';
      xhr.open(method, `${this.baseUrl}${path}${qs}`, true);

      xhr.onload = () => {
        if (xhr.readyState != 4) {
          return false;
        }

        let response;
        try {
          response = JSON.parse(xhr.responseText);
        } catch (err) {
          response = xhr.responseText;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response.data ? response.data : response);
        } else {
          reject({
            status: xhr.status,
            message: response.message || response
          });
        }
      };

      let body;

      switch (contentType) {
        case contentTypes.JSON:
          xhr.setRequestHeader(
            'Content-type',
            'application/json; charset=utf-8'
          );
          if (data) {
            body = JSON.stringify(data);
          }
          break;
        case contentTypes.FORM_DATA:
          xhr.setRequestHeader('Content-type', 'multipart/form-data');
          if (typeof data == 'object') {
            body = new FormData();
            Object.keys(data).forEach(field => body.append(field, data[field]));
          }
          break;
        default:
          return reject(
            new Error(`[Snowbox] Invalid content type "${contentType}"`)
          );
      }

      if (Object.keys(this.requestHeaders).length === 0) {
        Object.keys(this.requestHeaders).forEach(requestHeader => {
          xhr.setRequestHeader(requestHeader, this.requestHeaders[requestHeader]);
        });
      }

      await this.setAuthToken(xhr);

      xhr.send(data ? body : undefined);
    });
  }
}

export default new Api();
