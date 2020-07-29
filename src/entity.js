import { schema } from 'normalizr';

export const entity = (key, provider, relations, misc = {}) => {
  const newEntity = new schema.Entity(key, relations);
  newEntity.provider = provider;

  Object.assign(newEntity, misc);

  return newEntity;
};
