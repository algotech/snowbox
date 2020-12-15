import api from './api';
import { contentTypes } from './constants';

export default class Provider {
  constructor(particleDefinition) {
    this.particleDefinition = particleDefinition;
  }

  fetch(filter) {
    const path = this.getFetchPath(filter);
    const params = this.getFetchParams(filter);

    return api.get(path, params);
  }

  upsert(data, params) {
    const path = this.getUpsertPath(data);
    const method = this.getUpsertMethod(data);

    return api[method](path, data, params, this.getUpsertContentType());
  }

  remove(data) {
    const particle = this.getParticle(data);
    const id = typeof data == 'number' ? data : data.id;

    return api.remove(`/${particle}/${id}`);
  }

  getParticle(data) {
    return typeof this.particleDefinition == 'function' ?
      this.particleDefinition(data) :
      this.particleDefinition;
  }

  getFetchPath(filter) {
    const particle = this.getParticle(filter);

    return !filter || typeof filter == 'object' ?
      `/${particle}` :
      `/${particle}/${filter}`;
  }

  getFetchParams(filter) {
    return typeof filter == 'object' ? filter : null;
  }

  getUpsertPath(data) {
    const particle = this.getParticle(data);

    return data.id ? `/${particle}/${data.id}` : `/${particle}`;
  }

  getUpsertMethod(data) {
    return data.id ? 'put' : 'post';
  }

  getUpsertContentType() {
     return contentTypes.JSON;
  }
}
