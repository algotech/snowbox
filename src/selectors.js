import { createSelector } from 'reselect';

import { buildKey } from './utils';

const selectSnowbox = state => state.snowbox;

const selectMeta = createSelector(
  selectSnowbox,
  state => state.meta
);

const selectEntities = createSelector(
  selectSnowbox,
  state => state.entities
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
  const hydrate = applyHydration(entity, hydrationLevels);

  return createSelector(
    selectEntities,
    entities => entities[entity.key] ?
      hydrate(entities)(entities[entity.key][id]) :
      null
  );
}

const emptyArray = [];

export const selectMany = (entity, hydrationLevels = 0) => filters => {
  const hydrate = applyHydration(entity, hydrationLevels);

  return createSelector(
    selectEntities,
    selectMeta,
    (allEntities, allMeta) => {
      if (!allEntities[entity.key]) {
        return emptyArray;
      }

      const key = buildKey(filters);
      const meta = allMeta[entity.key] ? allMeta[entity.key][key] : null;

      if (!meta || !meta.result) {
        return hydrate(allEntities)(Object.values(allEntities[entity.key]));
      }

      const selectedEntities = meta.result
        .map(id => allEntities[entity.key][id]);

      return hydrate(allEntities)(selectedEntities);
    }
  );
}
