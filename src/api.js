import queryString from 'query-string';

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

  post(path, data = {}, params) {
    return this.call('POST', path, params, data);
  }

  put(path, data = {}, params) {
    return this.call('PUT', path, params, data);
  }

  remove(path) {
    return this.call('DELETE', path);
  }

  async call(method, path, params, data) {
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

      xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
      await this.setAuthToken(xhr);

      xhr.send(data ? JSON.stringify(data) : undefined);
    });
  }
}

export default new Api();
