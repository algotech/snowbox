import { schema } from 'normalizr';

export const entity = (key, provider, relations = {}, misc = {}) => {
  const newEntity = new schema.Entity(key, relations);

  if (provider) {
    if (typeof provider != 'object' &&
      provider.constructor.name != 'Provider'
    ) {
      throw new Error('[Snowbox] Invalid provider');
    }

    newEntity.provider = provider;
  }

  Object.assign(newEntity, misc);

  return newEntity;
};
