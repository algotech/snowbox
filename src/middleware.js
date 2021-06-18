import { normalize } from 'normalizr';

import { noFetch } from './actions';
import { actions } from './constants';
import {
  selectCollections,
  selectEntities,
  selectSingletons,
} from './selectors';
import { buildKey } from './utils';

const methods = {
  [actions.UPSERT]: 'upsert',
  [actions.REMOVE]: 'remove',
  [actions.FIND]: 'find',
  [actions.FETCH]: 'fetch',
};

const getEntityFromAction = action => Array.isArray(action.entity) ?
  action.entity[0] :
  action.entity;

const getRequestMethodFromAction = action => methods[action.type];

export const selectExistingData = (store, action) => {
  const entity = getEntityFromAction(action);

  if (Array.isArray(action.entity)) {
    const key = buildKey(action.payload);
    const state = action?.meta?.isListHook ?
      store.getState() :
      selectCollections(store.getState())?.[entity.key];

    return state?.[key];
  }

  if (entity.singleton) {
    const state = selectSingletons(store.getState());

    return state?.[entity.key];
  }

  const state = selectEntities(store.getState());
  const id = action.payload[entity.idField];

  return state?.[entity.key]?.[id];
};

export const dataAlreadyExists = (store, action) => {
  const method = getRequestMethodFromAction(action);
  const entity = getEntityFromAction(action);

  if (!['find', 'fetch'].includes(method)) {
    return false;
  }

  if (!entity.staleTimeout) {
    return false;
  }

  if (action?.meta?.refresh) {
    return false;
  }

  let state = selectExistingData(store, action);

  if (!state?.__updatedAt) {
    return false;
  }

  return Date.now() - state.__updatedAt < entity.staleTimeout;
};

const isHandledAction = action => [
  actions.UPSERT,
  actions.REMOVE,
  actions.FIND,
  actions.FETCH,
].includes(action.type);

const requestData = action => {
  const method = getRequestMethodFromAction(action);
  const entity = getEntityFromAction(action);

  return entity.provider[method](action.payload);
};

const getSuccessActionParams = (action, response) => {
  const method = getRequestMethodFromAction(action);

  if (method === 'remove') {
    return [action.payload, undefined, response.original];
  }

  const entity = getEntityFromAction(action);

  if (entity.singleton) {
    return [
      action.payload, undefined, response.data, undefined, Date.now(),
    ];
  }

  if (action?.meta?.isListHook) {
    return [
      action.payload,
      undefined,
      response.data,
      response.meta,
      Date.now(),
    ];
  }

  const { entities, result } = normalize(response.data, action.entity);

  return [action.payload, entities, result, response.meta, Date.now()];
};

export const snowboxMiddleware = store => next => async action => {
  if (!isHandledAction(action)) {
    return next(action);
  }

  if (dataAlreadyExists(store, action)) {
    return next(noFetch());
  }

  if (!action?.meta?.isListHook) {
    next(action);
  }

  try {
    const response = await requestData(action);

    const actionParams = getSuccessActionParams(action, response);

    return next(action.success(...actionParams));
  } catch (error) {
    return next(action.failure(action.payload, error, error.status));
  }
};
