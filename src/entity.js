import { schema } from 'normalizr';

export const entity = (key, provider, relations = {}, options = {}) => {
  const newEntity = new schema.Entity(key, relations, options);

  if (provider) {
    if (typeof provider != 'object' &&
      provider.constructor.name != 'Provider'
    ) {
      throw new Error('[Snowbox] Invalid provider');
    }

    newEntity.provider = provider;
  }

  return newEntity;
};
