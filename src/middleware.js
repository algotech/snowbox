import { normalize } from 'normalizr';

import { actions } from './constants';
import { noFetch } from './actions';
import { buildKey } from './utils';

const methods = {
  [actions.UPSERT]: 'upsert',
  [actions.REMOVE]: 'remove',
  [actions.FIND]: 'find',
  [actions.FETCH]: 'fetch',
};

export const shouldFetchData = (state, entity, action) => {
  if (!entity.staleTimeout) {
    return true;
  }

  if (action?.options?.refresh) {
    return true;
  }

  let stateData;

  if (Array.isArray(action.entity)) {
    const key = buildKey(action.data);
    stateData = state?.snowbox?.meta?.[entity.key]?.[key];
  } else if (entity.singleton) {
    stateData = state?.snowbox?.singletons?.[entity.key];
  } else {
    const id = action.data[entity.idAttribute];
    stateData = state?.snowbox?.entities?.[entity.key]?.[id];
  }

  if (!stateData?.__updatedAt) {
    return true;
  }

  return Date.now() - stateData.__updatedAt > entity.staleTimeout;
};

export const getEntitiesData = (method, entity, response) => {
  if (method == 'fetch' && entity.fetchEntitiesPath) {
    return response[entity.fetchEntitiesPath];
  }

  if (entity.entitiesPath) {
    return response[entity.entitiesPath];
  }

  return response;
};

export const getMetaData = (method, entity, response) => {
  if (method != 'fetch') {
    return;
  }

  if (!entity.fetchEntitiesPath && !entity.entitiesPath) {
    return;
  }

  const meta = { ...response };

  if (entity.fetchEntitiesPath) {
    delete meta[entity.fetchEntitiesPath];
  } else if (entity.entitiesPath) {
    delete meta[entity.entitiesPath];
  }

  return meta;
};

export const snowboxMiddleware = store => next => async action => {
  if (![
      actions.UPSERT,
      actions.REMOVE,
      actions.FIND,
      actions.FETCH,
    ].includes(action.type)
  ) {
    return next(action);
  }

  const method = methods[action.type];
  const entity = Array.isArray(action.entity) ?
    action.entity[0] :
    action.entity;

  const isGettingData = ['find', 'fetch'].includes(method);

  if (isGettingData && !shouldFetchData(store.getState(), entity, action)) {
    return next(noFetch());
  }

  next(action);

  try {
    const response = await entity.provider[method](action.data);

    if (method == 'remove') {
      return next(action.success(action.data));
    }

    if (entity.singleton) {
      return next(
        action.success(action.data, undefined, response, undefined, Date.now())
      );
    }

    const entitiesData = getEntitiesData(method, entity, response);
    const responseMeta = getMetaData(method, entity, response);
    const { entities, result } = normalize(entitiesData, action.entity);

    return next(
      action.success(action.data, entities, result, responseMeta, Date.now())
    );
  } catch (error) {
    return next(action.failure(action.data, error, error.status));
  }
};
