import { createSelector } from 'reselect';

import { buildKey } from './utils';

const selectSnowbox = state => state.snowbox;

const selectEntityCollection = entity => (state, filters) => {
  const collections = state?.snowbox?.collections?.[entity.key];

  return collections[buildKey(filters)];
};

const selectEntities = createSelector(
  selectSnowbox,
  state => state.entities
);

const selectSingletons = createSelector(
  selectSnowbox,
  state => state.singletons
);

const applyHydration = (entity, levels = 0) => entities => data => {
  if (!data || !levels) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => applyHydration(entity, levels)(entities)(item));
  }

  const newData = { ...data };

  for (const key in entity.schema) {
    const childEntity = Array.isArray(entity.schema[key]) ?
      entity.schema[key][0] :
      entity.schema[key];

    newData[key] = applyHydration(childEntity, levels - 1)(entities)(
      Array.isArray(data[key]) ?
        data[key].map(id => entities[childEntity.key][id]) :
        entities[childEntity.key][data[key]]
    );
  }

  return newData;
};

export const selectOne = (entity, hydrationLevels = 0) => id => {
  if (entity.singleton) {
    return createSelector(
      selectSingletons,
      singletons => singletons[entity.key]
    );
  }

  const hydrate = applyHydration(entity, hydrationLevels);

  return createSelector(
    selectEntities,
    entities => entities[entity.key] ?
      hydrate(entities)(entities[entity.key][id]) :
      null
  );
};

const emptyArray = [];

export const selectCollection = (entity, hydrationLevels = 0) => {
  const hydrate = applyHydration(entity, hydrationLevels);

  return createSelector(
    selectEntities,
    selectEntityCollection(entity),
    (allEntities, collection) => {
      if (!allEntities[entity.key] || !collection) {
        return emptyArray;
      }

      const selectedEntities = collection.result
        .map(id => allEntities[entity.key][id]);

      return hydrate(allEntities)(selectedEntities);
    }
  );
};

export const selectAll = (entity, hydrationLevels = 0) =>{
  const hydrate = applyHydration(entity, hydrationLevels);

  return createSelector(
    selectEntities,
    (allEntities) => (
      hydrate(allEntities)(Object.values(allEntities[entity.key] || {}))
    )
  );
};

export const selectMeta = entity => createSelector(
  selectEntityCollection,
  collection => collection?.meta
);
