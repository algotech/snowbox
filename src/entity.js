import { schema } from 'normalizr';

export const entity = (key, provider, relations = {}, options = {}) => {
  // Needed by normalizr.
  options.idAttribute = options.idField || provider?.options?.idField || 'id';

  const newEntity = new schema.Entity(key, relations, options);

  if (provider) {
    if (typeof provider !== 'object') {
      throw new Error('[Snowbox] Invalid provider');
    }

    newEntity.provider = provider;
  }

  newEntity.idField = options.idAttribute;

  if (typeof options.staleTimeout === 'number') {
    newEntity.staleTimeout = options.staleTimeout;
  }

  if (options.singleton === true) {
    newEntity.singleton = true;
  }

  return newEntity;
};
