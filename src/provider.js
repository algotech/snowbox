import api from './api';

export default class Provider {
  constructor(particleDefinition) {
    this.particleDefinition = particleDefinition;
  }

  fetch(filter) {
    const particle = this.getParticle(filter);

    if (!filter || typeof filter == 'object') {
      return api.get(`/${particle}`, filter);
    }

    return api.get(`/${particle}/${filter}`);
  }

  upsert(data) {
    const particle = this.getParticle(data);

    return data.id ?
      api.put(`/${particle}/${data.id}`, data) :
      api.post(`/${particle}`, data);
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
}
