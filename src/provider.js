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

  remove(data, params) {
    const path = this.getRemovePath(data);

    return api.remove(path, data, params);
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

  getRemovePath(data) {
    const particle = this.getParticle(data);

    return data.id ? `/${particle}/${data.id}` : `/${particle}`
  }

  getUpsertContentType() {
     return contentTypes.JSON;
  }
}
