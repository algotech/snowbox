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
      return next(action.success(action.data, undefined, response, Date.now()));
    }

    const { entities, result } = normalize(response, action.entity);

    return next(action.success(action.data, entities, result, Date.now()));
  } catch (error) {
    return next(action.failure(action.data, error, error.status));
  }
};
