import { API_URL, API_TOKEN } from 'app/core/constants';
import { default as storage } from 'app/core/services/persistentStorage';

class Api {
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

  async call(method, path, params = {}, data) {
    try {
      const apiToken = await storage.get(API_TOKEN);

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, `${API_URL}${path}`, true);

        xhr.onload = () => {
          if (xhr.readyState != 4) {
            return;
          }

          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (err) {
            respone = xhr.responseText;
          }

          if (xhr.status == 401) {
            reject({ status: 401, message: response });
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
        xhr.setRequestHeader(API_TOKEN, apiToken);

        xhr.send(data ? JSON.stringify(data) : undefined);
      });

      return response;
    } catch (error) {
      console.log('[API] ERROR', error);

      throw appError;
    }
  }
}

export default new Api();
